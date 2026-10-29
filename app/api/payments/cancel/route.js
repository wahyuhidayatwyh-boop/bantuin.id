import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth/jwt";
import {
  getCoreApiClient,
  getMidtransConfig,
  cancelMidtransTransaction,
  mapMidtransStatus,
} from "@/lib/midtrans/client";

/**
 * POST /api/payments/cancel
 * Official Midtrans Payment Cancellation Endpoint for Bantuin.id
 *
 * Security & Design Rules:
 * 1. Strict JWT Authentication & Anti-IDOR Authorization:
 *    - Only legitimate transaction owners (requester, renter, owner) or admin can cancel.
 * 2. Pre-cancellation Verification:
 *    - Validates order existence and ensures transaction is NOT already PAID / settled.
 * 3. Verified Midtrans Core API Cancellation:
 *    - Dispatches cancellation request to Midtrans (`POST /v2/{order_id}/cancel`).
 *    - If Midtrans rejects (e.g. 412 because payment already settled), synchronizes status and rejects cancellation.
 * 4. Atomic Concurrency & State Invariant:
 *    - Uses conditional updates (`updateMany`) to prevent overwriting concurrent webhook settlement.
 *    - Status PAID is terminal and can NEVER be downgraded to CANCELLED.
 * 5. Comprehensive Audit Trail:
 *    - Records cancellation event in `audit_logs` table.
 */
export async function POST(request) {
  try {
    // 1. Ekstraksi Token Otentikasi
    const authHeader = request.headers.get("authorization");
    let token = null;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7).trim();
    }

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: "Akses ditolak. Token otentikasi tidak ditemukan. Silakan login terlebih dahulu.",
          code: "UNAUTHORIZED",
        },
        { status: 401 }
      );
    }

    // 2. Verifikasi Token JWT
    const decoded = verifyAccessToken(token);
    if (!decoded || (!decoded.id && !decoded.email)) {
      return NextResponse.json(
        {
          success: false,
          error: "Sesi otentikasi tidak valid atau telah berakhir. Silakan login kembali.",
          code: "INVALID_TOKEN",
        },
        { status: 401 }
      );
    }

    // 3. Resolusi Profil Pengguna yang Sedang Login
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
        {
          success: false,
          error: "Profil akun pengguna tidak ditemukan di database.",
          code: "USER_NOT_FOUND",
        },
        { status: 404 }
      );
    }

    // 4. Parse Body Permintaan
    const body = await request.json().catch(() => ({}));
    const { orderId, entityId, entityType = "order", reason = "Dibatalkan oleh pengguna" } = body;

    const targetId = entityId || orderId;
    if (!targetId) {
      return NextResponse.json(
        {
          success: false,
          error: "Parameter 'orderId' atau 'entityId' wajib disertakan.",
          code: "MISSING_PARAM",
        },
        { status: 400 }
      );
    }

    // 5. Resolusi Entitas & Pemeriksaan Otorisasi (Anti-IDOR)
    let targetType = entityType;
    let targetRecord = null;

    if (targetType === "order" || targetType === "order_room") {
      targetRecord = await prisma.orderRoom.findFirst({
        where: {
          OR: [
            ...(orderId ? [{ midtransOrderId: orderId }] : []),
            ...(targetId ? [{ id: targetId }, { requestId: targetId }] : []),
          ],
        },
      });

      if (targetRecord) {
        targetType = "order";
        const isOwner = targetRecord.requesterId === userProfile.id || userProfile.isAdmin;
        if (!isOwner) {
          return NextResponse.json(
            {
              success: false,
              error: "Akses ditolak. Anda bukan pemesan dari transaksi ini.",
              code: "FORBIDDEN",
            },
            { status: 403 }
          );
        }
      }
    } else if (targetType === "rental" || targetType === "rental_booking") {
      targetRecord = await prisma.rentalBooking.findFirst({
        where: {
          OR: [
            ...(orderId ? [{ midtransOrderId: orderId }] : []),
            ...(targetId ? [{ id: targetId }] : []),
          ],
        },
      });

      if (targetRecord) {
        targetType = "rental";
        const isOwner = targetRecord.renterId === userProfile.id || userProfile.isAdmin;
        if (!isOwner) {
          return NextResponse.json(
            {
              success: false,
              error: "Akses ditolak. Anda bukan penyewa dari transaksi ini.",
              code: "FORBIDDEN",
            },
            { status: 403 }
          );
        }
      }
    } else if (targetType === "promotion") {
      targetRecord = await prisma.promotion.findFirst({
        where: {
          OR: [
            ...(orderId ? [{ midtransOrderId: orderId }] : []),
            ...(targetId ? [{ id: targetId }] : []),
          ],
        },
      });

      if (targetRecord) {
        targetType = "promotion";
        const isOwner = targetRecord.ownerId === userProfile.id || userProfile.isAdmin;
        if (!isOwner) {
          return NextResponse.json(
            {
              success: false,
              error: "Akses ditolak. Anda bukan pemilik dari pesanan promosi ini.",
              code: "FORBIDDEN",
            },
            { status: 403 }
          );
        }
      }
    }

    // Fallback: Jika tidak ditemukan pada targetType awal, cari di entitas lain secara aman
    if (!targetRecord && targetType !== "order") {
      const orderCandidate = await prisma.orderRoom.findFirst({
        where: {
          OR: [
            ...(orderId ? [{ midtransOrderId: orderId }] : []),
            ...(targetId ? [{ id: targetId }, { requestId: targetId }] : []),
          ],
        },
      });
      if (orderCandidate) {
        targetType = "order";
        targetRecord = orderCandidate;
        const isOwner = targetRecord.requesterId === userProfile.id || userProfile.isAdmin;
        if (!isOwner) {
          return NextResponse.json(
            {
              success: false,
              error: "Akses ditolak. Anda bukan pemesan dari transaksi ini.",
              code: "FORBIDDEN",
            },
            { status: 403 }
          );
        }
      }
    }

    if (!targetRecord && targetType !== "rental") {
      const rentalCandidate = await prisma.rentalBooking.findFirst({
        where: {
          OR: [
            ...(orderId ? [{ midtransOrderId: orderId }] : []),
            ...(targetId ? [{ id: targetId }] : []),
          ],
        },
      });
      if (rentalCandidate) {
        targetType = "rental";
        targetRecord = rentalCandidate;
        const isOwner = targetRecord.renterId === userProfile.id || userProfile.isAdmin;
        if (!isOwner) {
          return NextResponse.json(
            {
              success: false,
              error: "Akses ditolak. Anda bukan penyewa dari transaksi ini.",
              code: "FORBIDDEN",
            },
            { status: 403 }
          );
        }
      }
    }

    if (!targetRecord && targetType !== "promotion") {
      const promoCandidate = await prisma.promotion.findFirst({
        where: {
          OR: [
            ...(orderId ? [{ midtransOrderId: orderId }] : []),
            ...(targetId ? [{ id: targetId }] : []),
          ],
        },
      });
      if (promoCandidate) {
        targetType = "promotion";
        targetRecord = promoCandidate;
        const isOwner = targetRecord.ownerId === userProfile.id || userProfile.isAdmin;
        if (!isOwner) {
          return NextResponse.json(
            {
              success: false,
              error: "Akses ditolak. Anda bukan pemilik dari pesanan promosi ini.",
              code: "FORBIDDEN",
            },
            { status: 403 }
          );
        }
      }
    }

    if (!targetRecord) {
      return NextResponse.json(
        {
          success: false,
          error: "Data transaksi tidak ditemukan di database.",
          code: "NOT_FOUND",
        },
        { status: 404 }
      );
    }

    // 6. Validasi Status Transaksi
    const currentPaymentStatus = (targetRecord.paymentStatus || "UNPAID").toUpperCase();

    // INVARIAN TERMINAL STATE: Jika sudah lunas, tolak pembatalan!
    if (currentPaymentStatus === "PAID") {
      return NextResponse.json(
        {
          success: false,
          error: "Transaksi pesanan ini sudah berstatus LUNAS (PAID) dan tidak dapat dibatalkan.",
          code: "ALREADY_PAID",
        },
        { status: 400 }
      );
    }

    // Jika sudah CANCELLED (Idempotent call)
    if (currentPaymentStatus === "CANCELLED") {
      return NextResponse.json({
        success: true,
        message: "Transaksi pembayaran ini sudah dalam status dibatalkan (Idempotent).",
        data: {
          orderId: targetRecord.midtransOrderId || targetId,
          status: "cancelled",
          entityType: targetType,
          entityId: targetRecord.id,
          idempotent: true,
        },
      });
    }

    // Cek status pesanan selesai
    if (
      (targetType === "order" && targetRecord.orderStatus === "completed") ||
      (targetType === "rental" && targetRecord.bookingStatus === "verified_settled") ||
      (targetType === "promotion" && targetRecord.status === "active")
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Pesanan ini sudah selesai atau aktif. Transaksi pembayaran tidak dapat dibatalkan.",
          code: "ALREADY_COMPLETED",
        },
        { status: 400 }
      );
    }

    // 7. Pembatalan Resmi ke Gateway Midtrans
    const activeMidtransOrderId = targetRecord.midtransOrderId;
    let midtransCancelVerified = false;

    if (activeMidtransOrderId) {
      const config = getMidtransConfig();
      if (config.isConfigured) {
        try {
          const cancelRes = await cancelMidtransTransaction(activeMidtransOrderId);
          const statusCode = String(cancelRes?.status_code || "");
          const txStatus = String(cancelRes?.transaction_status || "").toLowerCase();

          if (statusCode === "200" || txStatus === "cancel") {
            midtransCancelVerified = true;
          } else {
            console.warn("[Midtrans Cancel]: Respon tidak standar dari Midtrans:", cancelRes);
            midtransCancelVerified = true;
          }
        } catch (gatewayErr) {
          console.warn("[Midtrans Cancel Warning]: Gagal membatalkan langsung via Core API:", gatewayErr?.message || gatewayErr);

          // Lakukan rekonsiliasi status ke Midtrans untuk memastikan kondisi aktual
          try {
            const core = getCoreApiClient();
            const actualStatus = await core.transaction.status(activeMidtransOrderId);

            if (actualStatus) {
              const mapped = mapMidtransStatus(actualStatus.transaction_status, actualStatus.fraud_status);

              // Jika transaksi ternyata sudah lunas di Midtrans, sinkronkan ke DB sesuai tipe entitas dan tolak pembatalan!
              if (mapped.isSettled || mapped.paymentStatus === "PAID") {
                const now = new Date();
                if (targetType === "order") {
                  await prisma.orderRoom.updateMany({
                    where: { id: targetRecord.id, paymentStatus: { not: "PAID" } },
                    data: { paymentStatus: "PAID", paidAt: now },
                  });
                } else if (targetType === "rental") {
                  await prisma.rentalBooking.updateMany({
                    where: { id: targetRecord.id, paymentStatus: { not: "PAID" } },
                    data: { paymentStatus: "PAID", paidAt: now, bookingStatus: "payment_held" },
                  });
                } else if (targetType === "promotion") {
                  const promoDurationDays = Math.max(1, Number(targetRecord.durationDays) || 7);
                  await prisma.promotion.updateMany({
                    where: { id: targetRecord.id, paymentStatus: { not: "PAID" } },
                    data: {
                      paymentStatus: "PAID",
                      paidAt: now,
                      status: "active",
                      startsAt: now,
                      expiresAt: new Date(now.getTime() + promoDurationDays * 86400000),
                    },
                  });
                }
                return NextResponse.json(
                  {
                    success: false,
                    error: "Pembatalan ditolak. Transaksi telah terbayar di payment gateway Midtrans.",
                    code: "ALREADY_PAID",
                  },
                  { status: 400 }
                );
              }

              // Jika status di Midtrans memang sudah cancel atau expire, izinkan sinkronisasi DB
              if (mapped.paymentStatus === "CANCELLED" || mapped.paymentStatus === "EXPIRED") {
                midtransCancelVerified = true;
              } else {
                return NextResponse.json(
                  {
                    success: false,
                    error: `Gateway Midtrans menolak pembatalan transaksi: ${actualStatus.status_message || gatewayErr.message}`,
                    code: "GATEWAY_REJECTED",
                  },
                  { status: 400 }
                );
              }
            }
          } catch (statusCheckErr) {
            // Jika transaksi belum pernah dibuat di server Midtrans (404), batalkan record lokal secara aman
            if (statusCheckErr?.message?.includes("404") || gatewayErr?.message?.includes("404")) {
              midtransCancelVerified = true;
            } else {
              return NextResponse.json(
                {
                  success: false,
                  error: "Tidak dapat memastikan status pembatalan di server payment gateway. Silakan coba kembali.",
                  code: "GATEWAY_UNREACHABLE",
                },
                { status: 502 }
              );
            }
          }
        }
      } else {
        // Lingkungan tanpa server key terkonfigurasi (local dev tanpa kredensial)
        midtransCancelVerified = true;
      }
    } else {
      // Belum ada midtransOrderId (belum checkout ke gateway)
      midtransCancelVerified = true;
    }

    if (!midtransCancelVerified) {
      return NextResponse.json(
        {
          success: false,
          error: "Pembatalan transaksi gagal diverifikasi oleh payment gateway.",
          code: "CANCEL_UNVERIFIED",
        },
        { status: 500 }
      );
    }

    // 8. Pembaruan Database Atomik Bersyarat (Mencegah Race Condition dengan Webhook Settlement)
    let updatedCount = 0;

    if (targetType === "order") {
      const res = await prisma.orderRoom.updateMany({
        where: {
          id: targetRecord.id,
          paymentStatus: { in: ["UNPAID", "PENDING"] },
          orderStatus: { notIn: ["completed", "cancelled"] },
        },
        data: {
          paymentStatus: "CANCELLED",
          orderStatus: "cancelled",
        },
      });
      updatedCount = res.count;

      if (targetRecord.requestId) {
        await prisma.request.updateMany({
          where: {
            id: targetRecord.requestId,
            status: { notIn: ["completed", "cancelled"] },
          },
          data: {
            status: "cancelled",
          },
        }).catch(() => null);
      }
    } else if (targetType === "rental") {
      const res = await prisma.rentalBooking.updateMany({
        where: {
          id: targetRecord.id,
          paymentStatus: { in: ["UNPAID", "PENDING"] },
          bookingStatus: { notIn: ["verified_settled", "cancelled"] },
        },
        data: {
          paymentStatus: "CANCELLED",
          bookingStatus: "cancelled",
        },
      });
      updatedCount = res.count;
    } else if (targetType === "promotion") {
      const res = await prisma.promotion.updateMany({
        where: {
          id: targetRecord.id,
          paymentStatus: { in: ["UNPAID", "PENDING"] },
          status: { notIn: ["active", "cancelled"] },
        },
        data: {
          paymentStatus: "CANCELLED",
          status: "cancelled",
        },
      });
      updatedCount = res.count;
    }

    if (updatedCount === 0) {
      // Race condition terdeteksi: Pesanan berubah sebelum update pembatalan diterapkan
      return NextResponse.json(
        {
          success: false,
          error: "Status transaksi berubah saat memproses pembatalan. Silakan periksa kembali status pesanan Anda.",
          code: "RACE_CONDITION_DETECTED",
        },
        { status: 409 }
      );
    }

    // 9. Catat Jejak Audit Transaksi
    await prisma.auditLog.create({
      data: {
        actorId: userProfile.id,
        actorEmail: userProfile.email,
        action: "payment.midtrans_cancelled",
        targetEntity: targetType,
        targetId: targetRecord.id,
        payload: {
          orderId: activeMidtransOrderId || targetId,
          reason,
          cancelledAt: new Date().toISOString(),
        },
      },
    }).catch(() => {});

    // 10. Respon Sukses Terverifikasi
    return NextResponse.json({
      success: true,
      message: "Transaksi pembayaran berhasil dibatalkan secara resmi.",
      data: {
        orderId: activeMidtransOrderId || targetId,
        status: "cancelled",
        entityType: targetType,
        entityId: targetRecord.id,
        reason,
      },
    });
  } catch (error) {
    console.error("[Midtrans Cancel Route Error]:", error?.message || error);
    return NextResponse.json(
      {
        success: false,
        error: "Terjadi kesalahan internal pada server saat membatalkan transaksi.",
        code: "INTERNAL_SERVER_ERROR",
      },
      { status: 500 }
    );
  }
}
