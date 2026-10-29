import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth/session";

/**
 * POST /api/reviews
 * Task 34: Mengirim rating bintang & testimoni ulasan selesai order
 *
 * Rules:
 * 1. Strict JWT Authentication & suspended check via requireAuth(req).
 * 2. Self-review guard: Cannot review yourself.
 * 3. Transaction verification (BUG-05): transactionId must be an actual completed OrderRoom or settled RentalBooking where the caller is a participant and revieweeId is the counterparty.
 * 4. Duplicate review guard (BUG-05): Reviewer cannot review the same transactionId twice.
 * 5. Rating score: integer 1 to 5.
 * 6. Atomically creates review and recalculates ratingAvg & ratingCount on Profile.
 */
export async function POST(req) {
  try {
    const auth = await requireAuth(req);
    if (auth.errorResponse) return auth.errorResponse;
    const userProfile = auth.profile;

    // 2. Parse Body
    const body = await req.json().catch(() => ({}));
    const {
      transactionId,
      transactionType = "request", // 'request', 'rental', 'service'
      revieweeId,
      rating,
      tags = [],
      comment,
    } = body;

    if (!transactionId || !revieweeId || rating === undefined) {
      return NextResponse.json(
        { success: false, error: "Field 'transactionId', 'revieweeId', dan 'rating' wajib diisi." },
        { status: 400 }
      );
    }

    const ratingVal = parseInt(rating, 10);
    if (isNaN(ratingVal) || ratingVal < 1 || ratingVal > 5) {
      return NextResponse.json(
        { success: false, error: "Rating harus berupa angka antara 1 dan 5 bintang." },
        { status: 400 }
      );
    }

    if (revieweeId === userProfile.id) {
      return NextResponse.json(
        { success: false, error: "Anda tidak dapat memberikan ulasan untuk diri Anda sendiri." },
        { status: 400 }
      );
    }

    // 3. Verifikasi kepemilikan & status penyelesaian transaksi (BUG-05 hardening)
    const cleanTxId = String(transactionId).trim();
    let verifiedCounterpartyId = null;
    let verifiedTxType = transactionType;

    const orderRoom = await prisma.orderRoom
      .findUnique({ where: { id: cleanTxId } })
      .catch(() => null);

    if (orderRoom) {
      if (orderRoom.requesterId !== userProfile.id && orderRoom.helperId !== userProfile.id) {
        return NextResponse.json(
          { success: false, error: "Akses ditolak. Anda bukan partisipan dari transaksi ini." },
          { status: 403 }
        );
      }
      if (orderRoom.orderStatus !== "completed") {
        return NextResponse.json(
          { success: false, error: "Ulasan hanya dapat diberikan setelah pesanan berstatus selesai (completed)." },
          { status: 400 }
        );
      }
      verifiedCounterpartyId =
        orderRoom.requesterId === userProfile.id ? orderRoom.helperId : orderRoom.requesterId;
      verifiedTxType = orderRoom.serviceId ? "service" : "request";
    } else {
      const rentalBooking = await prisma.rentalBooking
        .findUnique({ where: { id: cleanTxId } })
        .catch(() => null);

      if (rentalBooking) {
        if (rentalBooking.renterId !== userProfile.id && rentalBooking.ownerId !== userProfile.id) {
          return NextResponse.json(
            { success: false, error: "Akses ditolak. Anda bukan partisipan dari transaksi sewa ini." },
            { status: 403 }
          );
        }
        if (!["returned", "verified_settled"].includes(rentalBooking.bookingStatus)) {
          return NextResponse.json(
            { success: false, error: "Ulasan sewa hanya dapat diberikan setelah barang dikembalikan / selesai." },
            { status: 400 }
          );
        }
        verifiedCounterpartyId =
          rentalBooking.renterId === userProfile.id ? rentalBooking.ownerId : rentalBooking.renterId;
        verifiedTxType = "rental";
      } else {
        return NextResponse.json(
          { success: false, error: "Transaksi tidak ditemukan atau belum diselesaikan." },
          { status: 404 }
        );
      }
    }

    if (verifiedCounterpartyId && revieweeId !== verifiedCounterpartyId) {
      return NextResponse.json(
        { success: false, error: "Penerima ulasan (revieweeId) tidak sesuai dengan mitra transaksi ini." },
        { status: 400 }
      );
    }

    // 4. Cek duplikasi ulasan oleh reviewer yang sama pada transaksi yang sama (BUG-05)
    const existingReview = await prisma.review.findFirst({
      where: {
        transactionId: cleanTxId,
        reviewerId: userProfile.id,
      },
    });

    if (existingReview) {
      return NextResponse.json(
        { success: false, error: "Anda sudah memberikan ulasan untuk transaksi ini." },
        { status: 409 }
      );
    }

    // 5. Create Review & Recalculate Rating in Transaction (with row-level lock to prevent concurrent duplicate reviews)
    const newReview = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM profiles WHERE id = ${userProfile.id}::uuid FOR UPDATE`;

      const duplicateInTx = await tx.review.findFirst({
        where: {
          transactionId: cleanTxId,
          reviewerId: userProfile.id,
        },
      });

      if (duplicateInTx) {
        throw new Error("DUPLICATE_REVIEW");
      }

      const review = await tx.review.create({
        data: {
          transactionId: cleanTxId,
          transactionType: verifiedTxType,
          reviewerId: userProfile.id,
          revieweeId,
          rating: ratingVal,
          tags: Array.isArray(tags) ? tags : [],
          comment: comment ? comment.trim() : null,
        },
      });

      // Recalculate Profile Rating
      const allReviews = await tx.review.findMany({
        where: { revieweeId },
        select: { rating: true },
      });

      const totalCount = allReviews.length;
      const sumRatings = allReviews.reduce((sum, r) => sum + r.rating, 0);
      const newAvg = parseFloat((sumRatings / totalCount).toFixed(2));

      await tx.profile.update({
        where: { id: revieweeId },
        data: {
          ratingAvg: newAvg,
          ratingCount: totalCount,
        },
      });

      // Notify Reviewee
      await tx.notification.create({
        data: {
          userId: revieweeId,
          title: `Ulasan Baru Diterima (${ratingVal} ★)`,
          message: `${userProfile.fullName} memberikan ulasan ${ratingVal} bintang: "${comment ? (comment.length > 60 ? comment.slice(0, 57) + "..." : comment) : "Terima kasih atas kerjasamanya!"}".`,
          type: "order",
          link: `/profile`,
        },
      });

      return review;
    });

    return NextResponse.json(
      {
        success: true,
        message: "Ulasan dan rating berhasil dikirimkan.",
        data: newReview,
      },
      { status: 201 }
    );
  } catch (err) {
    if (err?.message === "DUPLICATE_REVIEW") {
      return NextResponse.json(
        { success: false, error: "Anda sudah memberikan ulasan untuk transaksi ini." },
        { status: 409 }
      );
    }
    console.error("[POST /api/reviews error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Gagal mengirimkan ulasan." },
      { status: 500 }
    );
  }
}
