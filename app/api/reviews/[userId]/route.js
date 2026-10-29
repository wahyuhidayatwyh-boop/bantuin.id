import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/reviews/[userId]
 * Task 35: Mengambil daftar ulasan pada profil pengguna/penyedia
 */
export async function GET(req, { params }) {
  try {
    const { userId } = await params;

    const profile = await prisma.profile.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        ratingAvg: true,
        ratingCount: true,
      },
    });

    if (!profile) {
      return NextResponse.json(
        { success: false, error: "Pengguna tidak ditemukan." },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type"); // 'rental' | 'sewa' | 'service' | 'jasa'
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const skip = (page - 1) * limit;

    const where = { revieweeId: userId };
    if (type === "rental" || type === "sewa") {
      where.transactionType = "rental";
    } else if (type === "service" || type === "jasa") {
      where.transactionType = { in: ["service", "request"] };
    }

    const [total, reviews] = await Promise.all([
      prisma.review.count({ where }),
      prisma.review.findMany({
        where,
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
        skip,
        take: limit,
      }),
    ]);

    const transactionIds = reviews.map((r) => r.transactionId).filter(Boolean);
    const [orderRooms, rentalBookings] = await Promise.all([
      prisma.orderRoom.findMany({
        where: { id: { in: transactionIds } },
        include: { request: { select: { title: true } } },
      }).catch(() => []),
      prisma.rentalBooking.findMany({
        where: { id: { in: transactionIds } },
        include: { rental: { select: { title: true } } },
      }).catch(() => []),
    ]);

    const titleMap = new Map();
    orderRooms.forEach((o) => titleMap.set(o.id, o.request?.title || o.orderTitle || "Layanan Jasa"));
    rentalBookings.forEach((b) => titleMap.set(b.id, b.rental?.title || "Unit Sewa"));

    const mappedReviews = reviews.map((r) => {
      const resolvedTitle = titleMap.get(r.transactionId) || (r.transactionType === "rental" ? "Unit Sewa" : "Layanan Jasa");
      const cleanPkgName = resolvedTitle.replace(/^Pemesanan Jasa:\s*/i, "").trim() || resolvedTitle;
      const reviewerName = r.reviewer?.fullName || "Pelanggan Terverifikasi";
      const reviewerAvatar = r.reviewer?.avatarUrl && !r.reviewer.avatarUrl.includes("images.unsplash.com") ? r.reviewer.avatarUrl : "/logotab.png";
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
        avatar: reviewerAvatar,
        item: cleanPkgName,
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

    return NextResponse.json({
      success: true,
      data: {
        userId,
        fullName: profile.fullName,
        averageRating: Number(profile.ratingAvg),
        totalReviews: total,
        reviews: mappedReviews,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (err) {
    console.error("[GET /api/reviews/[userId] error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Gagal mengambil daftar ulasan." },
      { status: 500 }
    );
  }
}
