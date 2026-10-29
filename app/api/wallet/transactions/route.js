import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth/jwt";

/**
 * GET /api/wallet/transactions
 * Task 49: Riwayat mutasi debit/kredit saldo dompet & kalkulasi saldo riil
 * 
 * Rules:
 * 1. Strict JWT authentication.
 * 2. Computes available balance from verified PostgreSQL transactions:
 *    - Inflow (Credit): Completed helper tasks (OrderRoom) & returned rental bookings (RentalBooking)
 *    - Outflow (Debit): Approved/pending withdrawal payouts (Withdrawal)
 * 3. Returns aggregated balance metrics and a unified ledger list sorted by date.
 */
export async function GET(req) {
  try {
    // 1. Auth check
    const authHeader = req.headers.get("authorization");
    let token = null;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7).trim();
    }

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Akses ditolak. Silakan login terlebih dahulu." },
        { status: 401 }
      );
    }

    const decoded = verifyAccessToken(token);
    if (!decoded || (!decoded.id && !decoded.email)) {
      return NextResponse.json(
        { success: false, error: "Sesi otentikasi tidak valid atau telah berakhir." },
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
        { success: false, error: "Profil akun tidak ditemukan." },
        { status: 404 }
      );
    }

    const userId = userProfile.id;

    // 2. Fetch Earnings from Completed Helper Orders (exclude rental companion OrderRooms to prevent 2x double counting)
    const completedOrders = await prisma.orderRoom.findMany({
      where: {
        helperId: userId,
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
      include: {
        request: {
          select: {
            title: true,
            category: true,
          },
        },
      },
      orderBy: { completedAt: "desc" },
    });

    // 3. Fetch Earnings from Settled Rental Bookings
    const settledRentals = await prisma.rentalBooking.findMany({
      where: {
        ownerId: userId,
        bookingStatus: "verified_settled",
        paymentStatus: "PAID",
      },
      include: {
        rental: {
          select: {
            title: true,
            category: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    // 4. Fetch All Withdrawals
    const withdrawals = await prisma.withdrawal.findMany({
      where: {
        ownerId: userId,
      },
      orderBy: { requestedAt: "desc" },
    });

    // 5. Calculate Ledger & Balances
    let totalEarned = 0;
    const ledger = [];

    // Helper task credits
    for (const ord of completedOrders) {
      const amount = Number(ord.helperPayoutAmount || ord.lockedAmount || 0);
      totalEarned += amount;
      ledger.push({
        id: `TX-ORD-${ord.id}`,
        type: "credit",
        category: "order_payout",
        title: `Pengerjaan Tugas: ${ord.request?.title || "Bantuan"}`,
        subtitle: ord.request?.category || "Bantuan & Errands",
        amount: amount,
        status: "settled",
        date: (ord.completedAt || ord.createdAt).toISOString(),
        referenceId: ord.id,
      });
    }

    // Rental earnings credits
    for (const rnt of settledRentals) {
      const amount = Number(rnt.rentalFee || 0);
      totalEarned += amount;
      ledger.push({
        id: `TX-RNT-${rnt.id}`,
        type: "credit",
        category: "rental_payout",
        title: `Sewa Barang: ${rnt.rental?.title || "Unit Rental"}`,
        subtitle: rnt.rental?.category || "Sewa & Rental",
        amount: amount,
        status: "settled",
        date: (rnt.updatedAt || rnt.createdAt).toISOString(),
        referenceId: rnt.id,
      });
    }

    // Withdrawal debits
    let totalWithdrawn = 0;
    let pendingWithdrawal = 0;

    for (const w of withdrawals) {
      const amount = Number(w.amount || 0);
      if (w.status === "completed") {
        totalWithdrawn += amount;
      } else if (w.status === "pending" || w.status === "approved" || w.status === "processing") {
        pendingWithdrawal += amount;
      }

      ledger.push({
        id: `TX-WTH-${w.id}`,
        type: "debit",
        category: "withdrawal",
        title: `Pencairan Saldo ke ${w.destinationType} (${w.destinationAccount})`,
        subtitle: `Ref: ${w.transferReference || "Menunggu proses admin"}`,
        amount: amount,
        status: w.status,
        date: (w.requestedAt || new Date()).toISOString(),
        referenceId: w.id,
      });
    }

    // Available balance = totalEarned - totalWithdrawn - pendingWithdrawal
    const availableBalance = Math.max(0, totalEarned - totalWithdrawn - pendingWithdrawal);

    // Sort unified ledger descending by date
    ledger.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          availableBalance,
          totalEarned,
          totalWithdrawn,
          pendingWithdrawal,
          payoutAccount: {
            bank: userProfile.payoutBank || null,
            accountNumber: userProfile.payoutAccountNumber || null,
            accountHolder: userProfile.payoutAccountHolder || null,
          },
        },
        transactions: ledger,
      },
    });
  } catch (err) {
    console.error("[GET /api/wallet/transactions error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Gagal mengambil data saldo dompet." },
      { status: 500 }
    );
  }
}
