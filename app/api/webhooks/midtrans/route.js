import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  verifyMidtransWebhookSignature,
  mapMidtransStatus,
} from "@/lib/midtrans/client";

/**
 * POST /api/webhooks/midtrans
 * Official Midtrans Webhook Notification Handler for Bantuin.id
 *
 * Security & Idempotency Rules:
 * 1. SHA-512 Signature Verification:
 *    - Validates order_id + status_code + gross_amount + MIDTRANS_SERVER_KEY.
 *    - Rejects invalid requests immediately with HTTP 403.
 * 2. Database Order Recognition & Amount Verification:
 *    - Verifies order_id exists in OrderRoom, RentalBooking, or Promotion.
 *    - Validates gross_amount against the trusted database record.
 * 3. Idempotent State Transitions:
 *    - If a transaction is already marked PAID, subsequent webhooks return HTTP 200 without duplicate mutations.
 * 4. Atomic Concurrency:
 *    - All updates and status transitions execute within an atomic Prisma transaction.
 * 5. Immutable Audit Trail:
 *    - Logs status change into `audit_logs` without storing sensitive credentials.
 */

export async function POST(request) {
  try {
    const rawPayload = await request.json().catch(() => null);

    if (!rawPayload) {
      return NextResponse.json(
        { success: false, message: "Payload webhook tidak valid atau kosong." },
        { status: 400 }
      );
    }

    const {
      order_id,
      status_code,
      gross_amount,
      signature_key,
      transaction_status,
      fraud_status,
      payment_type,
      transaction_id,
      transaction_time,
    } = rawPayload;

    if (!order_id || !status_code || !gross_amount || !signature_key) {
      return NextResponse.json(
        {
          success: false,
          message: "Parameter wajib notifikasi Midtrans (order_id, status_code, gross_amount, signature_key) tidak lengkap.",
        },
        { status: 400 }
      );
    }

    // 1. Verifikasi Signature SHA-512
    const isValidSignature = verifyMidtransWebhookSignature({
      orderId: order_id,
      statusCode: status_code,
      grossAmount: gross_amount,
      receivedSignature: signature_key,
    });

    if (!isValidSignature) {
      console.warn(`[Midtrans Webhook]: Signature tidak valid untuk order_id: ${order_id}`);
      return NextResponse.json(
        { success: false, message: "Signature callback Midtrans tidak valid." },
        { status: 403 }
      );
    }

    // 2. Identifikasi Entitas Transaksi di Database
    // BUG-02: Check RentalBooking first so rental orders (even historical ones with shared midtransOrderId)
    // always route to RentalBooking and update bookingStatus -> payment_held properly.
    let targetType = null;
    let targetEntity = null;

    // A. Cek RentalBooking terlebih dahulu
    const rentalBooking = await prisma.rentalBooking.findFirst({
      where: { midtransOrderId: order_id },
      include: { renter: true },
    });

    if (rentalBooking) {
      targetType = "rental";
      targetEntity = rentalBooking;
    } else {
      // B. Cek OrderRoom
      const orderRoom = await prisma.orderRoom.findFirst({
        where: { midtransOrderId: order_id },
        include: { requester: true },
      });

      if (orderRoom) {
        targetType = "order";
        targetEntity = orderRoom;
      } else {
        // C. Cek Promotion
        const promotion = await prisma.promotion.findFirst({
          where: { midtransOrderId: order_id },
          include: { owner: true },
        });

        if (promotion) {
          targetType = "promotion";
          targetEntity = promotion;
        }
      }
    }

    if (!targetType || !targetEntity) {
      console.warn(`[Midtrans Webhook]: order_id tidak dikenali di database: ${order_id}`);
      return NextResponse.json(
        {
          success: false,
          message: `Transaksi dengan order_id '${order_id}' tidak ditemukan di database.`,
        },
        { status: 404 }
      );
    }

    // 3. Verifikasi Nominal Transaksi (Gross Amount Integrity Check)
    let expectedNominal = 0;
    if (targetType === "order") {
      expectedNominal = Math.round(Number(targetEntity.lockedAmount));
    } else if (targetType === "rental") {
      expectedNominal = Math.round(Number(targetEntity.totalAmount));
    } else if (targetType === "promotion") {
      expectedNominal = Math.round(Number(targetEntity.amount));
    }

    const incomingNominal = Math.round(Number(gross_amount));
    if (incomingNominal !== expectedNominal) {
      console.error(
        `[Midtrans Webhook Tampering]: Nominal tidak cocok untuk order_id: ${order_id}. DB: ${expectedNominal}, Webhook: ${incomingNominal}`
      );
      return NextResponse.json(
        {
          success: false,
          message: "Nominal pembayaran tidak sesuai dengan catatan transaksi di sistem.",
        },
        { status: 400 }
      );
    }

    // 4. Petakan Status Midtrans ke Status Aplikasi
    const { paymentStatus, isSettled } = mapMidtransStatus(
      transaction_status,
      fraud_status
    );

    // Helper untuk memvalidasi aturan transisi status (Terminal State Invariant)
    function validateStateTransition(currentStatus, nextStatus) {
      const current = (currentStatus || "UNPAID").toUpperCase();
      const next = (nextStatus || "UNKNOWN").toUpperCase();

      // Transisi ke status yang sama adalah operasi idempoten
      if (current === next) {
        return { allowed: false, isIdempotent: true, reason: `Status sudah ${current}.` };
      }

      // Status PAID adalah terminal (hanya bisa berubah jika terjadi refund)
      if (current === "PAID") {
        if (next === "REFUNDED") {
          return { allowed: true, isIdempotent: false };
        }
        // Abaikan notifikasi tertunda (pending, expire, cancel, deny) yang tiba setelah settlement
        return {
          allowed: false,
          isIdempotent: true,
          reason: `Transaksi sudah berstatus PAID. Mengabaikan notifikasi tertunda '${next}'.`,
        };
      }

      // Status CANCELLED / EXPIRED / REFUNDED tidak boleh diturunkan kembali ke PENDING atau CHALLENGE
      if (current === "CANCELLED" || current === "EXPIRED" || current === "REFUNDED") {
        if (next === "PENDING" || next === "CHALLENGE") {
          return {
            allowed: false,
            isIdempotent: true,
            reason: `Transaksi sudah berstatus terminal ${current}. Mengabaikan status '${next}'.`,
          };
        }
        // Jika pelanggan membayar di detik terakhir dan gateway mengirim settlement yang sah
        if (next === "PAID") {
          return { allowed: true, isIdempotent: false };
        }
        return { allowed: false, isIdempotent: true, reason: `Status terminal ${current}.` };
      }

      // Transisi dari UNPAID atau PENDING ke status apa pun diizinkan
      return { allowed: true, isIdempotent: false };
    }

    // 5. Cek Awal Idempotensi di luar transaksi
    const preCheck = validateStateTransition(targetEntity.paymentStatus, paymentStatus);
    if (!preCheck.allowed && preCheck.isIdempotent) {
      return NextResponse.json({
        success: true,
        message: preCheck.reason || "Notifikasi telah diproses sebelumnya (Idempotent).",
        orderId: order_id,
        status: targetEntity.paymentStatus,
      });
    }

    // 6. Jalankan Transisi Status dalam Transaksi Database Atomik dengan Re-check di dalam tx
    let finalProcessedStatus = paymentStatus;
    let transitionSkippedReason = null;

    await prisma.$transaction(async (tx) => {
      const now = new Date();

      if (targetType === "order") {
        // Lock baris order_rooms untuk serialisasi webhook paralel (Promise.all race protection)
        await tx.$queryRaw`SELECT id FROM order_rooms WHERE id = ${targetEntity.id}::uuid FOR UPDATE`;

        // Re-query record terbaru di dalam transaksi untuk menangani konkurensi tepat bersamaan
        const freshOrder = await tx.orderRoom.findUnique({
          where: { id: targetEntity.id },
        });

        if (!freshOrder) return;

        const freshTransition = validateStateTransition(freshOrder.paymentStatus, paymentStatus);
        if (!freshTransition.allowed) {
          finalProcessedStatus = freshOrder.paymentStatus;
          transitionSkippedReason = freshTransition.reason;
          return;
        }

        await tx.orderRoom.update({
          where: { id: freshOrder.id },
          data: {
            // BUG-01: Keep valid OrderStatus enum (e.g. room_created); GET /api/chat/rooms maps room_created + PAID to paid_escrow
            orderStatus: freshOrder.orderStatus,
            paymentStatus,
            paymentMethodType: payment_type || freshOrder.paymentMethodType,
            midtransTransactionId: transaction_id || freshOrder.midtransTransactionId,
            ...(isSettled && !freshOrder.paidAt ? { paidAt: now } : {}),
          },
        });

        if (isSettled && freshOrder.requestId) {
          await tx.request.update({
            where: { id: freshOrder.requestId },
            data: { status: "in_progress" },
          }).catch(() => null);
        }

        // Buat Notifikasi User HANYA jika status baru lunas (PAID) dan belum pernah lunas sebelumnya
        if (isSettled && freshOrder.paymentStatus !== "PAID") {
          if (freshOrder.requesterId) {
            await tx.notification.create({
              data: {
                userId: freshOrder.requesterId,
                title: "Pembayaran Berhasil Dikonfirmasi",
                message: `Pembayaran pesanan #${order_id} sebesar Rp ${incomingNominal.toLocaleString(
                  "id-ID"
                )} telah diverifikasi oleh sistem. Helper dapat segera menjalankan tugas.`,
                type: "payment",
                link: `/chat?room=${freshOrder.id}`,
              },
            });
          }

          if (freshOrder.helperId) {
            await tx.notification.create({
              data: {
                userId: freshOrder.helperId,
                title: "Pembayaran Dikonfirmasi! Siap Bertugas",
                message: `Pemohon telah mengunci dana imbalan sebesar Rp ${incomingNominal.toLocaleString(
                  "id-ID"
                )}. Silakan mulai pengerjaan tugas sekarang.`,
                type: "order",
                link: `/chat?room=${freshOrder.id}`,
              },
            });
          }
        }
      } else if (targetType === "rental") {
        await tx.$queryRaw`SELECT id FROM rental_bookings WHERE id = ${targetEntity.id}::uuid FOR UPDATE`;

        const freshRental = await tx.rentalBooking.findUnique({
          where: { id: targetEntity.id },
        });

        if (!freshRental) return;

        const freshTransition = validateStateTransition(freshRental.paymentStatus, paymentStatus);
        if (!freshTransition.allowed) {
          finalProcessedStatus = freshRental.paymentStatus;
          transitionSkippedReason = freshTransition.reason;
          return;
        }

        await tx.rentalBooking.update({
          where: { id: freshRental.id },
          data: {
            paymentStatus,
            paymentMethodType: payment_type || freshRental.paymentMethodType,
            midtransTransactionId: transaction_id || freshRental.midtransTransactionId,
            ...(isSettled ? { bookingStatus: "payment_held" } : {}),
            ...(paymentStatus === "EXPIRED" || paymentStatus === "CANCELLED"
              ? { bookingStatus: "cancelled" }
              : {}),
            ...(isSettled && !freshRental.paidAt ? { paidAt: now } : {}),
          },
        });

        // Sync companion chat OrderRoom paymentStatus so chat UI reflects paid status
        const companionRoom = await tx.orderRoom.findFirst({
          where: {
            OR: [
              { midtransOrderId: order_id },
              {
                request: {
                  description: { contains: `[BOOKING_ID:${freshRental.id}]` },
                },
              },
            ],
          },
        });
        if (companionRoom) {
          await tx.orderRoom.update({
            where: { id: companionRoom.id },
            data: {
              paymentStatus,
              paymentMethodType: payment_type || companionRoom.paymentMethodType,
              midtransTransactionId: transaction_id || companionRoom.midtransTransactionId,
              ...(isSettled && !companionRoom.paidAt ? { paidAt: now } : {}),
            },
          });
          if (isSettled && companionRoom.requestId) {
            await tx.request.update({
              where: { id: companionRoom.requestId },
              data: { status: "in_progress" },
            }).catch(() => null);
          }
        }

        if (isSettled && freshRental.paymentStatus !== "PAID" && freshRental.renterId) {
          await tx.notification.create({
            data: {
              userId: freshRental.renterId,
              title: "Pembayaran Sewa Diterima",
              message: `Pembayaran sewa alat #${order_id} sebesar Rp ${incomingNominal.toLocaleString(
                "id-ID"
              )} berhasil diamankan di escrow platform.`,
              type: "payment",
              link: `/rentals/bookings/${freshRental.id}`,
            },
          });
        }
      } else if (targetType === "promotion") {
        await tx.$queryRaw`SELECT id FROM promotions WHERE id = ${targetEntity.id}::uuid FOR UPDATE`;

        const freshPromo = await tx.promotion.findUnique({
          where: { id: targetEntity.id },
        });

        if (!freshPromo) return;

        const freshTransition = validateStateTransition(freshPromo.paymentStatus, paymentStatus);
        if (!freshTransition.allowed) {
          finalProcessedStatus = freshPromo.paymentStatus;
          transitionSkippedReason = freshTransition.reason;
          return;
        }

        const promoDurationDays = Math.max(1, Number(freshPromo.durationDays) || 7);
        const promoExpiresAt = new Date(now.getTime() + promoDurationDays * 86400000);

        await tx.promotion.update({
          where: { id: freshPromo.id },
          data: {
            paymentStatus,
            midtransTransactionId: transaction_id || freshPromo.midtransTransactionId,
            ...(isSettled ? { status: "active", startsAt: now, expiresAt: promoExpiresAt } : {}),
            ...(paymentStatus === "EXPIRED" || paymentStatus === "CANCELLED"
              ? { status: "cancelled" }
              : {}),
            ...(isSettled && !freshPromo.paidAt ? { paidAt: now } : {}),
          },
        });

        if (isSettled && freshPromo.paymentStatus !== "PAID" && freshPromo.ownerId) {
          await tx.notification.create({
            data: {
              userId: freshPromo.ownerId,
              title: "Paket Promosi Aktif",
              message: `Pembayaran promosi sebesar Rp ${incomingNominal.toLocaleString(
                "id-ID"
              )} berhasil. Iklan layanan Anda kini aktif.`,
              type: "promotion",
              link: `/promotions/${freshPromo.id}`,
            },
          });
        }
      }

      // Catat Log Audit Transaksi hanya jika transisi status benar-benar terjadi
      await tx.auditLog.create({
        data: {
          actorEmail: "midtrans-webhook-daemon",
          action: `payment.midtrans_${paymentStatus.toLowerCase()}`,
          targetEntity: targetType,
          targetId: targetEntity.id,
          payload: {
            orderId: order_id,
            transactionId: transaction_id,
            transactionStatus: transaction_status,
            fraudStatus: fraud_status,
            mappedPaymentStatus: paymentStatus,
            grossAmount: incomingNominal,
            paymentType: payment_type,
            processedAt: now.toISOString(),
          },
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: transitionSkippedReason || `Webhook Midtrans berhasil diproses. Status: ${finalProcessedStatus}`,
      orderId: order_id,
      paymentStatus: finalProcessedStatus,
    });
  } catch (error) {
    console.error("[Midtrans Webhook Processing Error]:", error?.message || error);
    return NextResponse.json(
      {
        success: false,
        message: "Gagal memproses webhook Midtrans karena kendala internal server.",
      },
      { status: 500 }
    );
  }
}
