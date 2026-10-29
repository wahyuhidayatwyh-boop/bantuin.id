import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth/jwt";

/**
 * GET /api/admin/dashboard/stats
 * Task 89: Metrik statistik overview dashboard superadmin (GMV, Escrow, Order, User)
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

    const adminProfile = await prisma.profile.findFirst({
      where: {
        OR: [
          ...(decoded.id ? [{ id: decoded.id }] : []),
          ...(decoded.email ? [{ email: decoded.email.toLowerCase() }] : []),
        ],
      },
    });

    if (!adminProfile || !adminProfile.isAdmin) {
      return NextResponse.json(
        { success: false, error: "Akses ditolak. Hanya Administrator yang dapat melihat metrik dashboard." },
        { status: 403 }
      );
    }

    const [
      totalUsers,
      totalPartners,
      totalRequests,
      totalOrderRooms,
      paidOrders,
      paidRentals,
      pendingWithdrawals,
      pendingKyc,
      activeDisputes,
    ] = await Promise.all([
      prisma.profile.count(),
      prisma.profile.count({ where: { isPartner: true } }),
      prisma.request.count(),
      prisma.orderRoom.count(),
      prisma.orderRoom.findMany({
        where: { paymentStatus: "PAID" },
        select: { lockedAmount: true, orderStatus: true },
      }),
      prisma.rentalBooking.findMany({
        where: { paymentStatus: "PAID" },
        select: { totalAmount: true },
      }),
      prisma.withdrawal.count({ where: { status: "pending" } }),
      prisma.profile.count({ where: { verificationStatus: "pending_review" } }),
      Promise.all([
        prisma.orderRoom.count({ where: { orderStatus: "disputed" } }),
        prisma.report.count({ where: { status: "pending" } }),
        prisma.rentalBooking.count({ where: { bookingStatus: "disputed" } }),
      ]).then(([ord, rep, rnt]) => ord + rep + rnt),
    ]);

    let totalGMV = 0;
    let activeEscrow = 0;

    for (const ord of paidOrders) {
      const amount = Number(ord.lockedAmount || 0);
      totalGMV += amount;
      if (ord.orderStatus !== "completed" && ord.orderStatus !== "cancelled") {
        activeEscrow += amount;
      }
    }

    for (const rnt of paidRentals) {
      totalGMV += Number(rnt.totalAmount || 0);
    }

    return NextResponse.json({
      success: true,
      data: {
        totalUsers,
        totalPartners,
        totalRequests,
        totalOrderRooms,
        totalGMV,
        activeEscrow,
        pendingWithdrawals,
        pendingKyc,
        activeDisputes,
      },
    });
  } catch (err) {
    console.error("[GET /api/admin/dashboard/stats error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Gagal mengambil statistik dashboard." },
      { status: 500 }
    );
  }
}
