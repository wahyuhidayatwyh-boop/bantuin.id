import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth/jwt";

/**
 * GET /api/refunds
 * Task 54: Riwayat pengajuan refund pesanan / deposit pengguna
 * 
 * Rules:
 * 1. Strict JWT Authentication.
 * 2. Aggregates deposit returns from RentalBookings and refunds from cancelled paid orders.
 * 3. Returns formatted list sorted by date.
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

    // 2. Fetch Deposit Refunds from RentalBookings
    const rentalDepositRefunds = await prisma.rentalBooking.findMany({
      where: {
        renterId: userId,
        depositRefundAmount: { not: null, gt: 0 },
      },
      include: {
        rental: {
          select: { title: true, category: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    // 3. Fetch Cancelled / Refunded Order Rooms
    const orderRefunds = await prisma.orderRoom.findMany({
      where: {
        requesterId: userId,
        OR: [
          { paymentStatus: "REFUNDED" },
          { paymentStatus: "CANCELLED", paidAt: { not: null } },
        ],
      },
      include: {
        request: {
          select: { title: true, category: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    // 4. Combine into unified refund records
    const refundList = [];

    for (const r of rentalDepositRefunds) {
      refundList.push({
        id: `REF-DEP-${r.id}`,
        type: "deposit_refund",
        title: `Pengembalian Deposit: ${r.rental?.title || "Sewa Barang"}`,
        amount: Number(r.depositRefundAmount),
        initialDeposit: Number(r.depositFee),
        deductionReason: r.depositDeductionReason || null,
        status: "completed",
        date: r.updatedAt.toISOString(),
        referenceId: r.id,
      });
    }

    for (const o of orderRefunds) {
      refundList.push({
        id: `REF-ORD-${o.id}`,
        type: "order_refund",
        title: `Refund Pesanan: ${o.request?.title || "Bantuan"}`,
        amount: Number(o.lockedAmount),
        status: o.paymentStatus === "REFUNDED" ? "completed" : "processing",
        date: o.updatedAt.toISOString(),
        referenceId: o.id,
      });
    }

    // Sort descending
    refundList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json({
      success: true,
      data: refundList,
    });
  } catch (err) {
    console.error("[GET /api/refunds error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Gagal mengambil riwayat refund." },
      { status: 500 }
    );
  }
}
