import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth/jwt";

/**
 * POST /api/rentals/bookings/[id]/refund-deposit
 * Task 53: Pengembalian uang jaminan/deposit sewa setelah unit kembali
 * 
 * Rules:
 * 1. Strict JWT Auth: Only the rental owner or platform admin can process deposit refunds.
 * 2. Return State Guard: Unit must be returned (status: 'returned' or 'verified_settled').
 * 3. Calculation Integrity:
 *    - refundAmount cannot exceed initial depositFee.
 *    - If deduction occurs (refundAmount < depositFee), deductionReason is required.
 * 4. Records AuditLog and notifies renter.
 */
export async function POST(req, { params }) {
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

    const isOwner = booking.ownerId === userProfile.id;
    const isAdmin = userProfile.isAdmin;

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { success: false, error: "Akses ditolak. Hanya pemilik unit rental atau admin yang dapat memproses pengembalian deposit." },
        { status: 403 }
      );
    }

    if (!["returned", "verified_settled"].includes(booking.bookingStatus)) {
      return NextResponse.json(
        {
          success: false,
          error: "Uang deposit belum dapat dikembalikan karena unit barang sewa belum dikonfirmasi kembali (status harus 'returned').",
        },
        { status: 400 }
      );
    }

    // 3. Parse Body
    const body = await req.json().catch(() => ({}));
    const totalDeposit = Number(booking.depositFee || 0);

    if (totalDeposit <= 0) {
      return NextResponse.json(
        { success: false, error: "Pesanan ini tidak memiliki uang jaminan deposit (deposit = Rp 0)." },
        { status: 400 }
      );
    }

    let refundAmount = totalDeposit;
    let deductionReason = null;

    if (body.isFullRefund === false || body.refundAmount !== undefined) {
      const parsedAmount = Number(body.refundAmount);
      if (isNaN(parsedAmount) || parsedAmount < 0 || parsedAmount > totalDeposit) {
        return NextResponse.json(
          {
            success: false,
            error: `Nominal refund deposit harus antara Rp 0 dan Rp ${totalDeposit.toLocaleString("id-ID")}.`,
          },
          { status: 400 }
        );
      }
      refundAmount = parsedAmount;
      if (refundAmount < totalDeposit) {
        if (!body.deductionReason) {
          return NextResponse.json(
            { success: false, error: "Alasan pemotongan uang deposit (deductionReason) wajib disertakan jika deposit tidak dikembalikan penuh." },
            { status: 400 }
          );
        }
        deductionReason = body.deductionReason.trim();
      }
    }

    // 4. Update in Transaction
    const updated = await prisma.$transaction(async (tx) => {
      const res = await tx.rentalBooking.update({
        where: { id: booking.id },
        data: {
          depositRefundAmount: refundAmount,
          depositDeductionReason: deductionReason,
          bookingStatus: "verified_settled",
        },
      });

      // Audit Log
      await tx.auditLog.create({
        data: {
          actorId: userProfile.id,
          actorEmail: userProfile.email,
          action: "rental.deposit_refunded",
          targetEntity: "rental_bookings",
          targetId: booking.id,
          payload: {
            renterId: booking.renterId,
            depositFee: totalDeposit,
            refundAmount,
            deductionReason,
          },
        },
      });

      // Notify Renter
      await tx.notification.create({
        data: {
          userId: booking.renterId,
          title: "Uang Jaminan Sewa Dikembalikan!",
          message: deductionReason
            ? `Deposit untuk '${booking.rental.title}' dikembalikan sebesar Rp ${refundAmount.toLocaleString("id-ID")} (Dipotong: ${deductionReason}).`
            : `Uang jaminan sewa sebesar Rp ${refundAmount.toLocaleString("id-ID")} untuk '${booking.rental.title}' telah berhasil dikembalikan penuh.`,
          type: "payment",
          link: `/activity`,
        },
      });

      return res;
    });

    return NextResponse.json({
      success: true,
      message: `Pengembalian deposit sebesar Rp ${refundAmount.toLocaleString("id-ID")} berhasil diproses.`,
      data: updated,
    });
  } catch (err) {
    console.error("[POST /api/rentals/bookings/[id]/refund-deposit error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Gagal memproses pengembalian deposit." },
      { status: 500 }
    );
  }
}
