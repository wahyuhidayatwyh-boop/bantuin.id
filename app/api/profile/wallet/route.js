import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth/jwt";

/**
 * GET /api/profile/wallet
 * Mengambil data finansial, saldo riil, deposit, dan riwayat penarikan milik akun yang sedang login
 */
export async function GET(req) {
  try {
    const authHeader = req.headers.get("authorization");
    let token = null;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7).trim();
    }

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Akses ditolak. Token otentikasi tidak ditemukan." },
        { status: 401 }
      );
    }

    const decoded = verifyAccessToken(token);
    if (!decoded || (!decoded.id && !decoded.email)) {
      return NextResponse.json(
        { success: false, error: "Sesi tidak valid atau telah kedaluwarsa." },
        { status: 401 }
      );
    }

    const userProfile = await prisma.profile.findFirst({
      where: {
        OR: [
          ...(decoded.id ? [{ id: decoded.id }] : []),
          ...(decoded.email ? [{ email: decoded.email.toLowerCase() }] : []),
        ],
      },
    });

    if (!userProfile) {
      return NextResponse.json(
        { success: false, error: "Profil pengguna tidak ditemukan." },
        { status: 404 }
      );
    }

    // 1. Ambil transaksi tugas bantuan yang diselesaikan sebagai helper
    const completedRequests = await prisma.request.findMany({
      where: {
        selectedHelperId: userProfile.id,
        status: "completed",
      },
      select: { rewardAmount: true },
    }).catch(() => []);

    // 2. Ambil transaksi sewa alat yang selesai & lunas sebagai pemilik rental
    const completedBookings = await prisma.rentalBooking.findMany({
      where: {
        ownerId: userProfile.id,
        bookingStatus: "verified_settled",
      },
      select: { rentalFee: true },
    }).catch(() => []);

    // 3. Ambil total penarikan dana yang pernah diajukan
    const userWithdrawals = await prisma.withdrawal.findMany({
      where: { ownerId: userProfile.id },
      orderBy: { requestedAt: "desc" },
    }).catch(() => []);

    // 4. Ambil tugas bantuan yang sedang berlangsung (dana tertahan / escrow)
    const pendingRequests = await prisma.request.findMany({
      where: {
        selectedHelperId: userProfile.id,
        status: { in: ["in_progress", "awaiting_confirmation"] },
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

    // Perhitungan Saldo Riil
    const helperEarnings = completedRequests.reduce((acc, curr) => acc + Number(curr.rewardAmount || 0), 0);
    const rentalEarnings = completedBookings.reduce((acc, curr) => acc + Number(curr.rentalFee || 0), 0);
    const totalEarned = helperEarnings + rentalEarnings;

    const totalWithdrawn = userWithdrawals
      .filter((w) => ["pending", "approved", "processing", "completed"].includes(w.status))
      .reduce((acc, curr) => acc + Number(curr.amount || 0), 0);

    const availableBalance = Math.max(0, totalEarned - totalWithdrawn);

    const pendingRequestsSum = pendingRequests.reduce((acc, curr) => acc + Number(curr.rewardAmount || 0), 0);
    const pendingBookingsSum = pendingBookings.reduce((acc, curr) => acc + Number(curr.rentalFee || 0), 0);
    const pendingBalance = pendingRequestsSum + pendingBookingsSum;

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
    const withdrawals = userWithdrawals.map((w) => ({
      id: w.id,
      amount: Number(w.amount),
      status: w.status,
      destinationType: w.destinationType,
      destinationAccount: w.destinationAccount,
      destinationHolder: w.destinationHolder,
      requestedAt: w.requestedAt,
      processedAt: w.processedAt,
      rejectionReason: w.rejectionReason,
    }));

    return NextResponse.json({
      success: true,
      data: {
        availableBalance,
        pendingBalance,
        totalEarned,
        deposits,
        withdrawals,
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
    const authHeader = req.headers.get("authorization");
    let token = null;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7).trim();
    }

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Akses ditolak. Token otentikasi tidak ditemukan." },
        { status: 401 }
      );
    }

    const decoded = verifyAccessToken(token);
    if (!decoded || (!decoded.id && !decoded.email)) {
      return NextResponse.json(
        { success: false, error: "Sesi tidak valid atau telah kedaluwarsa." },
        { status: 401 }
      );
    }

    const userProfile = await prisma.profile.findFirst({
      where: {
        OR: [
          ...(decoded.id ? [{ id: decoded.id }] : []),
          ...(decoded.email ? [{ email: decoded.email.toLowerCase() }] : []),
        ],
      },
    });

    if (!userProfile) {
      return NextResponse.json(
        { success: false, error: "Profil pengguna tidak ditemukan." },
        { status: 404 }
      );
    }

    const body = await req.json();
    const { amount, bankName, accountNumber, accountHolder } = body;

    const numericAmount = Number(amount);
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

    const newWithdrawal = await prisma.withdrawal.create({
      data: {
        ownerId: userProfile.id,
        ownerName: userProfile.fullName || "Pengguna Bantuin",
        ownerType: userProfile.accountRole === "partner" ? "partner" : "provider",
        amount: numericAmount,
        destinationType: targetBank,
        destinationAccount: targetAccount,
        destinationHolder: targetHolder,
        status: "pending",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Permohonan penarikan saldo berhasil diajukan ke database.",
      data: newWithdrawal,
    });
  } catch (error) {
    console.error("POST /api/profile/wallet Error:", error);
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan saat memproses penarikan saldo." },
      { status: 500 }
    );
  }
}
