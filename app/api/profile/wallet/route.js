import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth/session";

/**
 * GET /api/profile/wallet
 * Mengambil data finansial, saldo riil, deposit, dan riwayat penarikan milik akun yang sedang login
 */
export async function GET(req) {
  try {
    const authCheck = await requireAuth(req);
    if (!authCheck.authorized) {
      return authCheck.response;
    }
    const userProfile = authCheck.profile;

    // 1. Ambil transaksi tugas bantuan & jasa yang diselesaikan dan lunas sebagai helper (kecualikan companion room sewa agar tidak terhitung ganda)
    const completedOrders = await prisma.orderRoom.findMany({
      where: {
        helperId: userProfile.id,
        orderStatus: "completed",
        paymentStatus: "PAID",
        request: {
          category: { not: "Sewa Alat & Kendaraan" },
          NOT: [
            { description: { contains: "[BOOKING_ID:" } },
            { description: { contains: "[RENTAL_ID:" } },
          ],
        },
      },
      select: { helperPayoutAmount: true, lockedAmount: true },
    }).catch(() => []);

    // 2. Ambil transaksi sewa alat yang selesai & lunas sebagai pemilik rental
    const completedBookings = await prisma.rentalBooking.findMany({
      where: {
        ownerId: userProfile.id,
        bookingStatus: "verified_settled",
        paymentStatus: "PAID",
      },
      select: { rentalFee: true },
    }).catch(() => []);

    // 3. Ambil total penarikan dana yang pernah diajukan
    const userWithdrawals = await prisma.withdrawal.findMany({
      where: { ownerId: userProfile.id },
      orderBy: { requestedAt: "desc" },
    }).catch(() => []);

    // 4. Ambil tugas bantuan & jasa yang sedang berlangsung (dana tertahan / escrow, kecualikan sewa)
    const pendingRequests = await prisma.request.findMany({
      where: {
        selectedHelperId: userProfile.id,
        status: { in: ["in_progress", "awaiting_confirmation"] },
        category: { not: "Sewa Alat & Kendaraan" },
        NOT: [
          { description: { contains: "[BOOKING_ID:" } },
          { description: { contains: "[RENTAL_ID:" } },
        ],
      },
      select: { rewardAmount: true },
    }).catch(() => []);

    // 5. Ambil sewa alat yang sedang berjalan (dana tertahan / escrow)
    const pendingBookings = await prisma.rentalBooking.findMany({
      where: {
        ownerId: userProfile.id,
        bookingStatus: { in: ["payment_held", "handed_over", "in_use", "returned"] },
      },
      select: { rentalFee: true },
    }).catch(() => []);

    // 6. Ambil deposit jaminan perlindungan sewa aktif milik user (baik sebagai penyewa maupun pemilik)
    const rawDeposits = await prisma.rentalBooking.findMany({
      where: {
        OR: [{ renterId: userProfile.id }, { ownerId: userProfile.id }],
        depositFee: { gt: 0 },
      },
      include: {
        rental: {
          select: { title: true, photoUrls: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }).catch(() => []);

    const url = new URL(req.url);
    const roleParam = (url.searchParams.get("role") || url.searchParams.get("type") || "").toLowerCase();

    // Perhitungan Saldo Riil (Tepat 1x per transaksi)
    const helperEarnings = completedOrders.reduce(
      (acc, curr) => acc + Number(curr.helperPayoutAmount || curr.lockedAmount || 0),
      0
    );
    const rentalEarnings = completedBookings.reduce((acc, curr) => acc + Number(curr.rentalFee || 0), 0);
    const pendingRequestsSum = pendingRequests.reduce((acc, curr) => acc + Number(curr.rewardAmount || 0), 0);
    const pendingBookingsSum = pendingBookings.reduce((acc, curr) => acc + Number(curr.rentalFee || 0), 0);

    let displayWithdrawals = userWithdrawals;
    let totalEarned = helperEarnings + rentalEarnings;
    let pendingBalance = pendingRequestsSum + pendingBookingsSum;

    if (roleParam === "partner" || roleParam === "rental" || roleParam === "sewa") {
      totalEarned = rentalEarnings;
      pendingBalance = pendingBookingsSum;
      displayWithdrawals = userWithdrawals.filter((w) => w.ownerType === "partner");
    } else if (roleParam === "provider" || roleParam === "service" || roleParam === "jasa") {
      totalEarned = helperEarnings;
      pendingBalance = pendingRequestsSum;
      displayWithdrawals = userWithdrawals.filter((w) => w.ownerType === "provider" || !w.ownerType);
    }

    const totalWithdrawn = displayWithdrawals
      .filter((w) => ["pending", "approved", "processing", "completed"].includes(w.status))
      .reduce((acc, curr) => acc + Number(curr.amount || 0), 0);

    const availableBalance = Math.max(0, totalEarned - totalWithdrawn);

    // Formatting deposits list
    const deposits = rawDeposits.map((dep) => ({
      id: dep.id,
      itemTitle: dep.rental?.title || "Barang Sewa Bantuin",
      depositCode: `DEP-${dep.id.slice(0, 8).toUpperCase()}`,
      depositAmount: Number(dep.depositFee || 0),
      status: dep.bookingStatus === "verified_settled" ? "Selesai / Direfund" : "Sedang Disewa",
      isRenter: dep.renterId === userProfile.id,
      paymentMethod: "Escrow Bantuin.id",
      destinationAccount: `${userProfile.payoutBank || "BCA"} (${userProfile.payoutAccountNumber || "-"})`,
      createdAt: dep.createdAt,
    }));

    // Formatting withdrawals list
    const withdrawals = displayWithdrawals.map((w) => ({
      id: w.id,
      amount: Number(w.amount),
      status: w.status,
      destinationType: w.destinationType,
      destinationAccount: w.destinationAccount,
      destinationHolder: w.destinationHolder,
      bankName: w.destinationType,
      accountNumber: w.destinationAccount,
      accountHolder: w.destinationHolder,
      transferReference: w.transferReference || null,
      requestedAt: w.requestedAt,
      processedAt: w.processedAt,
      rejectionReason: w.rejectionReason,
      ownerType: w.ownerType,
    }));

    return NextResponse.json({
      success: true,
      data: {
        availableBalance,
        pendingBalance,
        pendingEscrowBalance: pendingBalance,
        totalEarned,
        deposits,
        withdrawals,
        rentalStats: {
          earned: rentalEarnings,
          pending: pendingBookingsSum,
        },
        jasaStats: {
          earned: helperEarnings,
          pending: pendingRequestsSum,
        },
      },
    });
  } catch (error) {
    console.error("GET /api/profile/wallet Error:", error);
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan saat memuat dompet & transaksi." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/profile/wallet
 * Mengajukan permohonan penarikan saldo (Withdrawal) ke database Prisma
 */
export async function POST(req) {
  try {
    const authCheck = await requireAuth(req);
    if (!authCheck.authorized) {
      return authCheck.response;
    }
    const userProfile = authCheck.profile;

    if (userProfile.verificationStatus !== "verified") {
      return NextResponse.json(
        {
          success: false,
          error: "Penarikan saldo diblokir. Akun Anda harus berstatus KYC Terverifikasi oleh Admin terlebih dahulu sebelum dapat mencairkan dana. Silakan lengkapi verifikasi identitas di menu Profil Anda.",
          kycRequired: true,
          verificationStatus: userProfile.verificationStatus,
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { amount, bankName, accountNumber, accountHolder } = body;

    // Bersihkan titik ribuan atau format mata uang pada string
    const cleanAmount = typeof amount === "string" ? amount.replace(/[^0-9]/g, "") : amount;
    const numericAmount = Number(cleanAmount);
    if (!numericAmount || numericAmount < 10000) {
      return NextResponse.json(
        { success: false, error: "Minimal penarikan saldo adalah Rp10.000." },
        { status: 400 }
      );
    }

    const targetBank = bankName || userProfile.payoutBank || "BCA";
    const targetAccount = accountNumber || userProfile.payoutAccountNumber;
    const targetHolder = accountHolder || userProfile.payoutAccountHolder || userProfile.fullName;

    if (!targetAccount || !targetHolder) {
      return NextResponse.json(
        { success: false, error: "Nomor rekening dan nama pemilik rekening wajib diisi." },
        { status: 400 }
      );
    }

    // Cegah double submission / duplikasi penarikan dalam 10 detik terakhir
    const tenSecondsAgo = new Date(Date.now() - 10000);
    const recentDuplicate = await prisma.withdrawal.findFirst({
      where: {
        ownerId: userProfile.id,
        amount: numericAmount,
        requestedAt: { gte: tenSecondsAgo },
      },
    }).catch(() => null);

    if (recentDuplicate) {
      return NextResponse.json({
        success: true,
        message: "Permohonan penarikan saldo telah berhasil diajukan sebelumnya.",
        data: recentDuplicate,
      });
    }

    const resolvedOwnerType = body.ownerType || (userProfile.accountRole === "partner" || userProfile.isPartner ? "partner" : "provider");

    // SEC-04: Validasi saldo tersedia & pencadangan penarikan secara atomik di dalam transaksi database dengan Row-Level Lock
    const newWithdrawal = await prisma.$transaction(async (tx) => {
      // Acquire per-user row-level mutex lock on profiles to prevent concurrent double-withdrawal
      await tx.$queryRaw`SELECT id FROM profiles WHERE id = ${userProfile.id}::uuid FOR UPDATE`;

      const activePending = await tx.withdrawal.findFirst({
        where: {
          ownerId: userProfile.id,
          status: { in: ["pending", "processing"] },
        },
      });

      if (activePending) {
        throw new Error(
          "PENDING_EXISTS: Anda masih memiliki permohonan penarikan saldo yang sedang diproses. Harap tunggu hingga selesai."
        );
      }

      let totalEarned = 0;
      if (resolvedOwnerType === "partner") {
        const settledRentals = await tx.rentalBooking.findMany({
          where: {
            ownerId: userProfile.id,
            bookingStatus: "verified_settled",
            paymentStatus: "PAID",
          },
          select: { rentalFee: true },
        });
        for (const r of settledRentals) {
          totalEarned += Number(r.rentalFee || 0);
        }
      } else {
        const settledOrders = await tx.orderRoom.findMany({
          where: {
            helperId: userProfile.id,
            orderStatus: "completed",
            paymentStatus: "PAID",
            request: {
              category: { not: "Sewa Alat & Kendaraan" },
              NOT: [
                { description: { contains: "[BOOKING_ID:" } },
                { description: { contains: "[RENTAL_ID:" } },
              ],
            },
          },
          select: { helperPayoutAmount: true, lockedAmount: true },
        });
        for (const o of settledOrders) {
          totalEarned += Number(o.helperPayoutAmount || o.lockedAmount || 0);
        }
      }

      const existingWithdrawals = await tx.withdrawal.findMany({
        where: {
          ownerId: userProfile.id,
          ownerType: resolvedOwnerType === "partner" ? "partner" : "provider",
          status: { in: ["pending", "approved", "processing", "completed"] },
        },
        select: { amount: true },
      });

      const totalWithdrawn = existingWithdrawals.reduce((acc, w) => acc + Number(w.amount || 0), 0);
      const availableBalance = Math.max(0, totalEarned - totalWithdrawn);

      if (numericAmount > availableBalance) {
        throw new Error(
          `INSUFFICIENT_BALANCE: Saldo tidak mencukupi. Saldo tersedia Anda saat ini adalah Rp ${availableBalance.toLocaleString("id-ID")}.`
        );
      }

      return await tx.withdrawal.create({
        data: {
          ownerId: userProfile.id,
          ownerName: userProfile.fullName || "Pengguna Bantuin",
          ownerType: resolvedOwnerType,
          amount: numericAmount,
          destinationType: targetBank,
          destinationAccount: targetAccount,
          destinationHolder: targetHolder,
          status: "pending",
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: "Permohonan penarikan saldo berhasil diajukan ke database.",
      data: newWithdrawal,
    });
  } catch (error) {
    console.error("POST /api/profile/wallet Error:", error);
    const msg = error?.message || "";
    if (msg.startsWith("PENDING_EXISTS:") || msg.startsWith("INSUFFICIENT_BALANCE:")) {
      return NextResponse.json(
        { success: false, error: msg.replace(/^[A-Z_]+:\s*/, "") },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan saat memproses penarikan saldo." },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/profile/wallet
 * SEC-04 & BUG-04: Catatan penarikan yang sudah disetujui/selesai (approved/completed) maupun sedang berjalan (pending/processing)
 * adalah ledger finansial yang TIDAK BOLEH DIHAPUS karena digunakan untuk mengurangi saldo tersedia.
 * Hanya riwayat yang batal/gagal ('cancelled', 'failed') yang dapat dibersihkan.
 */
export async function DELETE(req) {
  try {
    const authCheck = await requireAuth(req);
    if (!authCheck.authorized) {
      return authCheck.response;
    }
    const userProfile = authCheck.profile;

    const { searchParams } = new URL(req.url);
    const body = await req.json().catch(() => ({}));
    const id = searchParams.get("id") || body.id;
    const allCompleted = searchParams.get("allCompleted") === "true" || body.allCompleted === true;

    // Hanya bersihkan penarikan yang berstatus failed atau cancelled (tidak memengaruhi perhitungan ledger saldo)
    if (allCompleted) {
      await prisma.withdrawal.deleteMany({
        where: {
          ownerId: userProfile.id,
          status: { in: ["cancelled", "failed"] },
        },
      });

      return NextResponse.json({
        success: true,
        message: "Riwayat penarikan yang dibatalkan/gagal berhasil dibersihkan. Catatan pencairan yang telah berhasil tetap disimpan sebagai bukti mutasi saldo.",
      });
    }

    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID riwayat penarikan diperlukan." },
        { status: 400 }
      );
    }

    const withdrawal = await prisma.withdrawal.findFirst({
      where: {
        id,
        ownerId: userProfile.id,
      },
    });

    if (!withdrawal) {
      return NextResponse.json(
        { success: false, error: "Riwayat penarikan tidak ditemukan." },
        { status: 404 }
      );
    }

    if (["pending", "processing", "approved", "completed"].includes(withdrawal.status)) {
      return NextResponse.json(
        {
          success: false,
          error: "Catatan penarikan dana yang sedang diproses atau telah selesai tidak dapat dihapus demi menjaga integritas saldo dan audit finansial.",
        },
        { status: 403 }
      );
    }

    await prisma.withdrawal.delete({ where: { id: withdrawal.id } });

    return NextResponse.json({
      success: true,
      message: "Riwayat penarikan berhasil dihapus dari database.",
    });
  } catch (error) {
    console.error("DELETE /api/profile/wallet Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Gagal menghapus riwayat penarikan." },
      { status: 500 }
    );
  }
}
