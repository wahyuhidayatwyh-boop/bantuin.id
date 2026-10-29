import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth/jwt";

/**
 * GET /api/admin/promotions
 * Mengambil seluruh promosi dari database riil untuk Moderasi Promosi Landing Page
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
        { success: false, error: "Akses ditolak. Silakan login admin terlebih dahulu." },
        { status: 401 }
      );
    }

    const decoded = verifyAccessToken(token);
    if (!decoded || (!decoded.id && !decoded.email)) {
      return NextResponse.json(
        { success: false, error: "Sesi admin tidak valid atau telah berakhir." },
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
        { success: false, error: "Akses terbatas untuk akun administrator." },
        { status: 403 }
      );
    }

    const now = new Date();

    // Auto-expire items past their expiresAt date
    await prisma.promotion.updateMany({
      where: {
        status: "active",
        expiresAt: { lt: now },
      },
      data: {
        status: "expired",
      },
    });

    const [promotions, packages] = await Promise.all([
      prisma.promotion.findMany({
        include: {
          owner: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phoneNumber: true,
              avatarUrl: true,
              partnerBusinessName: true,
              accountRole: true,
            },
          },
          service: {
            select: {
              id: true,
              title: true,
              category: true,
              startingPrice: true,
              portfolioUrls: true,
            },
          },
          rental: {
            select: {
              id: true,
              title: true,
              category: true,
              dailyPrice: true,
            },
          },
          package: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.promotionPackage.findMany({
        orderBy: { priority: "asc" },
      }),
    ]);

    const formattedPromotions = promotions.map((p) => {
      const isExpired = p.expiresAt && new Date(p.expiresAt) < now;
      const effectiveStatus = (p.status === "active" && isExpired) ? "expired" : p.status;

      return {
        id: p.id,
        ownerId: p.ownerId,
        ownerName: p.owner?.fullName || p.owner?.partnerBusinessName || "Mitra Bantuin",
        ownerType: p.owner?.accountRole || (p.targetType === "rental" ? "partner" : "provider"),
        targetType: p.targetType,
        targetId: p.targetId || p.serviceId || p.rentalId,
        targetTitle: p.service?.title || p.rental?.title || "Item Promosi",
        packageId: p.packageId,
        packageName: p.package?.name || "Promosi Unggulan",
        packageTitle: p.package?.name || "Promosi Unggulan",
        amount: Number(p.amount),
        status: effectiveStatus,
        paymentStatus: p.paymentStatus?.toLowerCase() === "paid" ? "paid" : "pending",
        paymentMethod: "qris",
        startDate: p.startsAt,
        endDate: p.expiresAt,
        createdAt: p.createdAt,
        viewsCount: p.viewsCount || 0,
        clicksCount: p.clicksCount || 0,
        analytics: {
          views: p.viewsCount || 0,
          clicks: p.clicksCount || 0,
          orders: 0,
        },
      };
    });

    const activeList = formattedPromotions.filter(
      (p) => p.status !== "expired" && p.status !== "cancelled" && (!p.endDate || new Date(p.endDate) >= now)
    );
    const historyList = formattedPromotions.filter(
      (p) => p.status === "expired" || p.status === "cancelled" || (p.endDate && new Date(p.endDate) < now)
    );
    const totalRevenue = formattedPromotions
      .filter((p) => p.paymentStatus === "paid" || p.status === "active")
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    const stats = {
      totalPromotions: formattedPromotions.length,
      activePromotions: activeList.length,
      historyPromotions: historyList.length,
      totalRevenue,
      serviceActive: activeList.filter((p) => p.targetType === "service").length,
      rentalActive: activeList.filter((p) => p.targetType === "rental").length,
    };

    return NextResponse.json({
      success: true,
      data: {
        promotions: formattedPromotions,
        packages: packages.map((pkg) => ({
          ...pkg,
          price: Number(pkg.price),
        })),
        stats,
      },
    });
  } catch (err) {
    console.error("[GET /api/admin/promotions error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Gagal memuat data promosi admin." },
      { status: 500 }
    );
  }
}
