import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth/jwt";
import { extractBearerToken } from "@/lib/auth/session";

/**
 * PATCH /api/rentals/bookings/[id]/status
 * Task 61: Update alur sewa (Konfirmasi -> Serah Terima -> Pengembalian -> Selesai)
 * 
 * Rules:
 * 1. Strict JWT Auth & Role-based transitions:
 *    - 'confirmed_by_owner': Owner confirms availability.
 *    - 'handed_over': Owner hands unit over to renter.
 *    - 'in_use': Renter acknowledges receiving the item.
 *    - 'returned': Unit returned to owner.
 *    - 'verified_settled': Owner verifies return condition & completes transaction.
 * 2. Emits real-time notification to the other party.
 */
export async function PATCH(req, { params }) {
  try {
    const { id } = await params;

    // 1. Auth check
    const token = extractBearerToken(req);

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

    // 2. Query Booking
    const booking = await prisma.rentalBooking.findUnique({
      where: { id },
      include: {
        rental: true,
      },
    });

    if (!booking) {
      return NextResponse.json(
        { success: false, error: "Data booking sewa tidak ditemukan." },
        { status: 404 }
      );
    }

    const isRenter = booking.renterId === userProfile.id;
    const isOwner = booking.ownerId === userProfile.id;
    const isAdmin = userProfile.isAdmin;

    if (!isRenter && !isOwner && !isAdmin) {
      return NextResponse.json(
        { success: false, error: "Akses ditolak. Anda bukan pihak yang bertransaksi dalam sewa ini." },
        { status: 403 }
      );
    }

    // 3. Parse Body
    const body = await req.json().catch(() => ({}));
    const { status: targetStatus, reason } = body;

    const validStatuses = [
      "temp_locked",
      "confirmed_by_owner",
      "payment_held",
      "handed_over",
      "in_use",
      "returned",
      "verified_settled",
      "cancelled",
      "disputed",
    ];

    if (!targetStatus || !validStatuses.includes(targetStatus)) {
      return NextResponse.json(
        {
          success: false,
          error: `Status '${targetStatus}' tidak valid. Pilihan: ${validStatuses.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // 4. Role Authorization & Payment/Handover Prerequisite Guards per Transition
    if (targetStatus === "payment_held" && booking.paymentStatus !== "PAID" && !isAdmin) {
      return NextResponse.json(
        { success: false, error: "Status 'payment_held' hanya dapat ditetapkan setelah pembayaran terverifikasi lunas." },
        { status: 403 }
      );
    }

    if (["handed_over", "in_use", "returned", "verified_settled"].includes(targetStatus)) {
      if (booking.paymentStatus !== "PAID" && !isAdmin) {
        return NextResponse.json(
          { success: false, error: "Tahapan serah terima dan penyelesaian sewa mewajibkan pembayaran telah lunas (PAID)." },
          { status: 400 }
        );
      }
    }

    if (targetStatus === "verified_settled" && !isAdmin) {
      const hasHandedOver = ["handed_over", "in_use", "returned", "verified_settled"].includes(booking.bookingStatus);
      if (!hasHandedOver) {
        return NextResponse.json(
          {
            success: false,
            error: "Pesanan sewa belum dapat diselesaikan sebelum tahapan serah terima barang terpenuhi.",
          },
          { status: 400 }
        );
      }
    }

    if (targetStatus === "cancelled" && !isAdmin) {
      if (booking.paymentStatus === "PAID" || ["handed_over", "in_use", "returned", "verified_settled"].includes(booking.bookingStatus)) {
        return NextResponse.json(
          {
            success: false,
            error: "Transaksi sewa yang sudah dibayar lunas (PAID) atau sedang berjalan tidak dapat dibatalkan secara sepihak.",
            code: "ALREADY_PAID",
          },
          { status: 400 }
        );
      }
    }

    if (["confirmed_by_owner", "handed_over", "verified_settled"].includes(targetStatus)) {
      if (!isOwner && !isAdmin) {
        return NextResponse.json(
          { success: false, error: `Hanya pemilik barang sewa yang dapat menetapkan status '${targetStatus}'.` },
          { status: 403 }
        );
      }
    }

    if (["in_use"].includes(targetStatus)) {
      if (!isRenter && !isAdmin) {
        return NextResponse.json(
          { success: false, error: `Hanya penyewa yang dapat mengonfirmasi penerimaan unit '${targetStatus}'.` },
          { status: 403 }
        );
      }
    }

    // 5. Update Status in DB
    const updated = await prisma.$transaction(async (tx) => {
      const updateData = { bookingStatus: targetStatus };
      if (targetStatus === "cancelled" && booking.paymentStatus !== "PAID") {
        updateData.paymentStatus = "CANCELLED";
      }
      const res = await tx.rentalBooking.update({
        where: { id: booking.id },
        data: updateData,
      });

      // Notification
      const recipientId = isRenter ? booking.ownerId : booking.renterId;
      const statusLabels = {
        confirmed_by_owner: "Disetujui Pemilik",
        handed_over: "Barang Diserahterimakan",
        in_use: "Sedang Digunakan",
        returned: "Barang Telah Dikembalikan",
        verified_settled: "Selesai & Terverifikasi",
        cancelled: "Dibatalkan",
      };

      await tx.notification.create({
        data: {
          userId: recipientId,
          title: `Status Sewa: ${statusLabels[targetStatus] || targetStatus}`,
          message: `Transaksi sewa '${booking.rental.title}' telah diperbarui menjadi '${statusLabels[targetStatus] || targetStatus}'.`,
          type: "order",
          link: `/activity`,
        },
      });

      return res;
    });

    return NextResponse.json({
      success: true,
      message: `Status sewa berhasil diperbarui menjadi '${updated.bookingStatus}'.`,
      data: updated,
    });
  } catch (err) {
    console.error("[PATCH /api/rentals/bookings/[id]/status error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Gagal memperbarui status sewa." },
      { status: 500 }
    );
  }
}
