import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth/jwt";

/**
 * GET /api/services/[id]
 * Task 24: Detail spesifikasi jasa & portofolio penyedia
 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(req, { params }) {
  try {
    const { id } = await params;

    if (!id || !UUID_REGEX.test(id)) {
      return NextResponse.json(
        { success: false, error: "Layanan jasa tidak ditemukan." },
        { status: 404 }
      );
    }

    const service = await prisma.service.findUnique({
      where: { id },
      include: {
        provider: {
          select: {
            id: true,
            fullName: true,
            phoneNumber: true,
            avatarUrl: true,
            bannerUrl: true,
            bio: true,
            campusName: true,
            ratingAvg: true,
            ratingCount: true,
            completedHelpsCount: true,
            verificationStatus: true,
            partnerBusinessName: true,
            packages: true,
            portfolioPhotos: true,
          },
        },
      },
    });

    if (!service) {
      return NextResponse.json(
        { success: false, error: "Layanan jasa tidak ditemukan." },
        { status: 404 }
      );
    }

    // Fetch reviews for this provider / service
    const rawReviews = await prisma.review.findMany({
      where: { revieweeId: service.providerId },
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
      take: 20,
    });

    const transactionIds = rawReviews.map((r) => r.transactionId).filter(Boolean);
    const orderRooms = await prisma.orderRoom.findMany({
      where: { id: { in: transactionIds } },
      include: { request: { select: { title: true } } },
    });
    const orderMap = new Map(orderRooms.map((o) => [o.id, o.request?.title || o.orderTitle || "Layanan Jasa"]));

    const mappedReviews = rawReviews.map((r) => {
      const orderTitle = orderMap.get(r.transactionId) || service.title || "Layanan Jasa";
      const cleanPkgName = orderTitle.replace(/^Pemesanan Jasa:\s*/i, "").trim() || service.title || "Layanan Jasa";
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
        comment: r.comment || "Layanan sangat memuaskan!",
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

    // Count real completed orders
    const completedOrdersCount = await prisma.orderRoom.count({
      where: { helperId: service.providerId, orderStatus: "completed" },
    });
    const effectiveCompletedJobs = Math.max(
      completedOrdersCount,
      service.completedOrders || 0,
      service.provider?.completedHelpsCount || 0
    );

    const effectiveRatingAvg = Number(service.ratingAvg || service.provider?.ratingAvg || (mappedReviews.length > 0 ? (mappedReviews.reduce((sum, r) => sum + r.rating, 0) / mappedReviews.length) : 0));
    const effectiveRatingCount = Math.max(Number(service.ratingCount || 0), mappedReviews.length, Number(service.provider?.ratingCount || 0));

    let parsedPackages = [];
    if (service.packages) {
      try {
        if (Array.isArray(service.packages)) parsedPackages = service.packages;
        else if (typeof service.packages === "string" && service.packages.trim().startsWith("[")) parsedPackages = JSON.parse(service.packages);
      } catch (_) {}
    }
    const firstPkg = parsedPackages[0] || {};
    const unit = firstPkg.unit || "/ proyek";
    const deliveryDuration = firstPkg.duration || "1-2 Hari Kerja";

    return NextResponse.json({
      success: true,
      data: {
        ...service,
        unit,
        deliveryDuration,
        locationType: service.locationType || "hybrid",
        startingPrice: Number(service.startingPrice),
        ratingAvg: effectiveRatingAvg,
        ratingCount: effectiveRatingCount,
        completedOrders: effectiveCompletedJobs,
        provider: {
          ...service.provider,
          ratingAvg: effectiveRatingAvg,
          ratingCount: effectiveRatingCount,
          completedHelpsCount: effectiveCompletedJobs,
          completedJobs: effectiveCompletedJobs,
        },
        reviews: mappedReviews,
      },
    });
  } catch (err) {
    console.error("[GET /api/services/[id] error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Gagal mengambil detail jasa." },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/services/[id]
 * Task 63: Update / edit listing penawaran jasa
 * 
 * Rules:
 * 1. Strict JWT Authentication & Anti-IDOR:
 *    - Only the service provider or platform admin can edit the service listing.
 */
export async function PATCH(req, { params }) {
  try {
    const { id } = await params;

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

    // 2. Query Service
    if (!id || !UUID_REGEX.test(id)) {
      return NextResponse.json(
        { success: false, error: "Layanan jasa tidak ditemukan." },
        { status: 404 }
      );
    }

    const service = await prisma.service.findUnique({
      where: { id },
    });

    if (!service) {
      return NextResponse.json(
        { success: false, error: "Layanan jasa tidak ditemukan." },
        { status: 404 }
      );
    }

    if (service.providerId !== userProfile.id && !userProfile.isAdmin) {
      return NextResponse.json(
        { success: false, error: "Akses ditolak. Anda bukan pemilik dari listing jasa ini." },
        { status: 403 }
      );
    }

    // 3. Parse Body
    const body = await req.json().catch(() => ({}));
    const updateData = {};

    if (body.title !== undefined) updateData.title = body.title.trim();
    if (body.category !== undefined) updateData.category = body.category.trim();
    if (body.description !== undefined) updateData.description = body.description.trim();
    if (body.startingPrice !== undefined) updateData.startingPrice = Number(body.startingPrice);
    if (body.packages !== undefined) {
      const pkgList = Array.isArray(body.packages) ? body.packages : [];
      const enrichedPackages = pkgList.map((p) => ({
        ...p,
        unit: p.unit || body.unit || "/ proyek",
        duration: p.duration || body.deliveryDuration || "1-2 Hari Kerja",
      }));
      updateData.packages = enrichedPackages;
      if (enrichedPackages.length > 0 && body.startingPrice === undefined) {
        const validPrices = enrichedPackages.map((p) => Number(p.price)).filter((p) => !isNaN(p) && p > 0);
        if (validPrices.length > 0) {
          updateData.startingPrice = Math.min(...validPrices);
        }
      }
    } else if (body.unit !== undefined || body.deliveryDuration !== undefined) {
      let currentPackages = [];
      if (service.packages) {
        try {
          if (Array.isArray(service.packages)) currentPackages = service.packages;
          else if (typeof service.packages === "string") currentPackages = JSON.parse(service.packages);
        } catch (_) {}
      }
      if (currentPackages.length > 0) {
        updateData.packages = currentPackages.map((p) => ({
          ...p,
          ...(body.unit ? { unit: body.unit } : {}),
          ...(body.deliveryDuration ? { duration: body.deliveryDuration } : {}),
        }));
      }
    }
    if (body.portfolioUrls !== undefined) {
      updateData.portfolioUrls = Array.isArray(body.portfolioUrls) ? body.portfolioUrls : [body.portfolioUrls];
    }
    if (body.tags !== undefined) {
      updateData.tags = Array.isArray(body.tags) ? body.tags : [];
    }
    if (body.locationType !== undefined) {
      updateData.locationType = String(body.locationType).trim();
    }
    if (body.latitude !== undefined) {
      updateData.latitude = body.latitude !== null && !isNaN(Number(body.latitude)) ? Number(body.latitude) : null;
    }
    if (body.longitude !== undefined) {
      updateData.longitude = body.longitude !== null && !isNaN(Number(body.longitude)) ? Number(body.longitude) : null;
    }
    if (body.address !== undefined) {
      updateData.address = body.address ? String(body.address).trim() : null;
    }

    const updated = await prisma.service.update({
      where: { id },
      data: updateData,
    });

    let returnedPackages = [];
    if (updated.packages) {
      try {
        if (Array.isArray(updated.packages)) returnedPackages = updated.packages;
        else if (typeof updated.packages === "string") returnedPackages = JSON.parse(updated.packages);
      } catch (_) {}
    }
    const firstPkg = returnedPackages[0] || {};

    return NextResponse.json({
      success: true,
      message: "Listing penawaran jasa berhasil diperbarui.",
      data: {
        ...updated,
        unit: firstPkg.unit || body.unit || "/ proyek",
        deliveryDuration: firstPkg.duration || body.deliveryDuration || "1-2 Hari Kerja",
      },
    });
  } catch (err) {
    console.error("[PATCH /api/services/[id] error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Gagal memperbarui listing jasa." },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/services/[id]
 * Task 64: Menghapus listing penawaran jasa
 * 
 * Rules:
 * 1. Strict JWT Authentication & Anti-IDOR:
 *    - Only the service provider or platform admin can delete the service listing.
 */
export async function DELETE(req, { params }) {
  try {
    const { id } = await params;

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

    // 2. Query Service
    if (!id || !UUID_REGEX.test(id)) {
      return NextResponse.json(
        { success: false, error: "Layanan jasa tidak ditemukan." },
        { status: 404 }
      );
    }

    const service = await prisma.service.findUnique({
      where: { id },
    });

    if (!service) {
      return NextResponse.json(
        { success: false, error: "Layanan jasa tidak ditemukan." },
        { status: 404 }
      );
    }

    if (service.providerId !== userProfile.id && !userProfile.isAdmin) {
      return NextResponse.json(
        { success: false, error: "Akses ditolak. Anda bukan pemilik dari listing jasa ini." },
        { status: 403 }
      );
    }

    // 3. Delete Service
    await prisma.service.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Listing penawaran jasa berhasil dihapus.",
    });
  } catch (err) {
    console.error("[DELETE /api/services/[id] error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Gagal menghapus listing jasa." },
      { status: 500 }
    );
  }
}
