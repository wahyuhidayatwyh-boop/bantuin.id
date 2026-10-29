import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/rentals/[id]/reviews
 * Task 62: Ambil rating & ulasan spesifik untuk unit barang rental tertentu
 */
export async function GET(req, { params }) {
  try {
    const { id } = await params;

    // 1. Verify Rental
    const rental = await prisma.rental.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        ratingAvg: true,
        ratingCount: true,
        ownerId: true,
      },
    });

    if (!rental) {
      return NextResponse.json(
        { success: false, error: "Barang sewa tidak ditemukan." },
        { status: 404 }
      );
    }

    // 2. Fetch Bookings for this Rental
    const bookingIds = (
      await prisma.rentalBooking.findMany({
        where: { rentalId: id },
        select: { id: true },
      })
    ).map((b) => b.id);

    // 3. Fetch Reviews linked to these bookings or owner
    const reviews = await prisma.review.findMany({
      where: {
        OR: [
          { transactionId: { in: bookingIds } },
          { revieweeId: rental.ownerId, transactionType: "rental" },
        ],
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
        : Number(rental.ratingAvg || 5);

    return NextResponse.json({
      success: true,
      data: {
        rentalId: id,
        rentalTitle: rental.title,
        averageRating: parseFloat(avgRating.toFixed(2)),
        totalReviews,
        reviews,
      },
    });
  } catch (err) {
    console.error("[GET /api/rentals/[id]/reviews error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Gagal mengambil ulasan barang sewa." },
      { status: 500 }
    );
  }
}
