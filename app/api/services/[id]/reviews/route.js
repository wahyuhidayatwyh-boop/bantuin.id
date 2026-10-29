import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/services/[id]/reviews
 * Task 69: Ambil ulasan & testimoni spesifik untuk listing jasa freelance tertentu
 */
export async function GET(req, { params }) {
  try {
    const { id } = await params;

    const service = await prisma.service.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        providerId: true,
        ratingAvg: true,
        ratingCount: true,
      },
    });

    if (!service) {
      return NextResponse.json(
        { success: false, error: "Layanan jasa tidak ditemukan." },
        { status: 404 }
      );
    }

    // Fetch reviews for this provider's services
    const reviews = await prisma.review.findMany({
      where: {
        revieweeId: service.providerId,
        transactionType: "service",
      },
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
    });

    const totalReviews = reviews.length;
    const avgRating =
      totalReviews > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
        : Number(service.ratingAvg || 5);

    return NextResponse.json({
      success: true,
      data: {
        serviceId: id,
        serviceTitle: service.title,
        averageRating: parseFloat(avgRating.toFixed(2)),
        totalReviews,
        reviews,
      },
    });
  } catch (err) {
    console.error("[GET /api/services/[id]/reviews error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Gagal mengambil ulasan jasa." },
      { status: 500 }
    );
  }
}
