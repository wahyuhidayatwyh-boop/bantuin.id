import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth/jwt";

/**
 * GET /api/promotions/my-promotions
 * Task 82: Ambil performa & status promosi aktif milik user (views, clicks, status)
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

    const now = new Date();

    // Auto-expire items past their expiresAt date
    await prisma.promotion.updateMany({
      where: {
        ownerId: userProfile.id,
        status: "active",
        expiresAt: { lt: now },
      },
      data: {
        status: "expired",
      },
    });

    const promotions = await prisma.promotion.findMany({
      where: { ownerId: userProfile.id },
      include: {
        package: true,
        service: { select: { id: true, title: true, category: true, startingPrice: true } },
        rental: { select: { id: true, title: true, category: true, dailyPrice: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: promotions.map((p) => ({
        ...p,
        amount: Number(p.amount),
        packageName: p.package?.name || "Promosi Unggulan",
        targetTitle: p.service?.title || p.rental?.title || (p.targetType === "rental" ? "Unit Rental" : "Layanan Jasa"),
        targetId: p.targetId || p.serviceId || p.rentalId,
        startDate: p.startsAt,
        endDate: p.expiresAt,
        paymentId: p.midtransOrderId || `PAY-${p.id.slice(0, 8)}`,
      })),
    });
  } catch (err) {
    console.error("[GET /api/promotions/my-promotions error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Gagal mengambil daftar promosi saya." },
      { status: 500 }
    );
  }
}
