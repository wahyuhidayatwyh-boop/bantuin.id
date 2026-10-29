import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/services/provider/[id]
 * Task 65: Profil publik penyedia jasa beserta portofolio & ulasan (/jasa/penyedia/[id])
 */
export async function GET(req, { params }) {
  try {
    const { id } = await params;

    // 1. Query Provider Profile
    const profile = await prisma.profile.findUnique({
      where: { id },
      select: {
        id: true,
        fullName: true,
        avatarUrl: true,
        bio: true,
        campusName: true,
        partnerBusinessName: true,
        partnerAddress: true,
        bannerUrl: true,
        portfolioPhotos: true,
        packages: true,
        skills: true,
        accountRole: true,
        ratingAvg: true,
        ratingCount: true,
        completedHelpsCount: true,
        reliabilityScore: true,
        responseTimeMinutes: true,
        verificationStatus: true,
        createdAt: true,
      },
    });

    if (!profile) {
      return NextResponse.json(
        { success: false, error: "Penyedia jasa tidak ditemukan." },
        { status: 404 }
      );
    }

    // 2. Fetch Provider's Services
    const services = await prisma.service.findMany({
      where: { providerId: id },
      orderBy: { createdAt: "desc" },
    });

    // 3. Fetch Reviews Received by Provider
    const rawReviews = await prisma.review.findMany({
      where: { revieweeId: id },
      include: {
        reviewer: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
            campusName: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    // Look up transaction names for reviews
    const transactionIds = rawReviews.map((r) => r.transactionId).filter(Boolean);
    const orderRooms = await prisma.orderRoom.findMany({
      where: { id: { in: transactionIds } },
      include: { request: { select: { title: true } } },
    });
    const orderMap = new Map(orderRooms.map((o) => [o.id, o.request?.title || o.orderTitle || "Layanan Jasa"]));

    const mappedReviews = rawReviews.map((r) => {
      const orderTitle = orderMap.get(r.transactionId) || "Layanan Jasa";
      const cleanPkgName = orderTitle.replace(/^Pemesanan Jasa:\s*/i, "").trim() || "Layanan Jasa";
      const reviewerName = r.reviewer?.fullName || "Pelanggan Terverifikasi";
      const reviewerAvatar = r.reviewer?.avatarUrl || null;
      const dateFormatted = r.createdAt
        ? new Date(r.createdAt).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })
        : "Baru saja";

      return {
        id: r.id,
        rating: Number(r.rating || 5),
        comment: r.comment || "Layanan memuaskan!",
        createdAt: r.createdAt,
        date: dateFormatted,
        reviewerId: r.reviewerId,
        userName: reviewerName,
        userAvatar: reviewerAvatar,
        packageName: cleanPkgName,
        serviceTitle: cleanPkgName,
        reviewer: {
          id: r.reviewer?.id,
          fullName: reviewerName,
          avatarUrl: reviewerAvatar,
          campusName: r.reviewer?.campusName,
        },
      };
    });

    // Count real completed orders across orderRooms, profile, and services
    const completedOrderRoomsCount = await prisma.orderRoom.count({
      where: { helperId: id, orderStatus: "completed" },
    });
    const totalOrdersCompleted = Math.max(
      completedOrderRoomsCount,
      profile.completedHelpsCount || 0,
      services.reduce((sum, s) => sum + (s.completedOrders || 0), 0)
    );

    return NextResponse.json({
      success: true,
      data: {
        provider: {
          ...profile,
          coverBanner: profile.bannerUrl || null,
          bannerUrl: profile.bannerUrl || null,
          brandTitle: profile.partnerBusinessName || "",
          portfolioPhotos: Array.isArray(profile.portfolioPhotos) ? profile.portfolioPhotos : [],
          skills: Array.isArray(profile.skills) ? profile.skills : [],
          ratingAvg: Number(profile.ratingAvg),
          ratingCount: Math.max(Number(profile.ratingCount || 0), mappedReviews.length),
          completedHelpsCount: totalOrdersCompleted,
          completedJobs: totalOrdersCompleted,
        },
        services: services.map((s) => {
          let parsedPackages = [];
          if (s.packages) {
            try {
              if (Array.isArray(s.packages)) parsedPackages = s.packages;
              else if (typeof s.packages === "string" && s.packages.trim().startsWith("[")) parsedPackages = JSON.parse(s.packages);
            } catch (_) {}
          }
          const firstPkg = parsedPackages[0] || {};
          const unit = firstPkg.unit || "/ proyek";
          const deliveryDuration = firstPkg.duration || "1-2 Hari Kerja";

          return {
            ...s,
            packages: parsedPackages,
            unit,
            deliveryDuration,
            duration: deliveryDuration,
            locationType: s.locationType || "hybrid",
            startingPrice: Number(s.startingPrice),
            ratingAvg: Number(s.ratingAvg),
          };
        }),
        reviews: mappedReviews,
        stats: {
          totalServices: services.length,
          totalReviews: mappedReviews.length,
          completedOrders: totalOrdersCompleted,
        },
      },
    });
  } catch (err) {
    console.error("[GET /api/services/provider/[id] error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Gagal mengambil profil penyedia jasa." },
      { status: 500 }
    );
  }
}
