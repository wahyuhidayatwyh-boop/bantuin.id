import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth/jwt";
import { getCoreApiClient, mapMidtransStatus, getMidtransConfig } from "@/lib/midtrans/client";

/**
 * GET /api/payments/status?orderId=...&entityId=...&entityType=...
 * Official Midtrans Payment Status Checker for Bantuin.id
 *
 * Security & Design Rules:
 * 1. Strict JWT Authentication & IDOR Authorization:
 *    - Only participants of the transaction (requester, helper, renter, owner) can inspect status.
 * 2. Server-side Verification:
 *    - Status is checked against the database.
 *    - If DB is still PENDING, queries Midtrans CoreApi from server with proper timeout/error handling.
 * 3. Atomic State Synchronization:
 *    - If Midtrans CoreApi confirms settlement, updates DB atomically and records audit log.
 * 4. Zero Secrets Leaked:
 *    - Returns only client-safe fields. Never leaks Server Key or private metadata.
 */

export async function GET(request) {
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
        },
        { status: 404 }
      );
    }

    // 4. Parse Query Parameters
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get("orderId");
    const entityId = searchParams.get("entityId");
    const entityType = searchParams.get("entityType") || "order";

    if (!orderId && !entityId) {
      return NextResponse.json(
        {
          success: false,
          error: "Parameter 'orderId' atau 'entityId' wajib disertakan.",
        },
        { status: 400 }
      );
    }

    // 5. Query Database Record
    let targetType = entityType;
    let targetRecord = null;

    if (targetType === "order" || targetType === "order_room") {
      targetRecord = await prisma.orderRoom.findFirst({
        where: {
          OR: [
            ...(orderId ? [{ midtransOrderId: orderId }] : []),
            ...(entityId ? [{ id: entityId }, { requestId: entityId }] : []),
          ],
        },
      });

      if (targetRecord) {
        // IDOR Check: User must be requester or helper
        const isParticipant =
          targetRecord.requesterId === userProfile.id ||
          targetRecord.helperId === userProfile.id ||
          userProfile.isAdmin;

        if (!isParticipant) {
          return NextResponse.json(
            { success: false, error: "Akses ditolak. Anda tidak memiliki akses ke pesanan ini." },
            { status: 403 }
          );
        }
      }
    } else if (targetType === "rental" || targetType === "rental_booking") {
      targetRecord = await prisma.rentalBooking.findFirst({
        where: {
          OR: [
            ...(orderId ? [{ midtransOrderId: orderId }] : []),
            ...(entityId ? [{ id: entityId }] : []),
          ],
        },
      });

      if (targetRecord) {
        // IDOR Check: User must be renter or owner
        const isParticipant =
          targetRecord.renterId === userProfile.id ||
          targetRecord.ownerId === userProfile.id ||
          userProfile.isAdmin;

        if (!isParticipant) {
          return NextResponse.json(
            { success: false, error: "Akses ditolak. Anda tidak memiliki akses ke sewa ini." },
            { status: 403 }
          );
        }
      }
    } else if (targetType === "promotion") {
      targetRecord = await prisma.promotion.findFirst({
        where: {
          OR: [
            ...(orderId ? [{ midtransOrderId: orderId }] : []),
            ...(entityId ? [{ id: entityId }] : []),
          ],
        },
      });

      if (targetRecord) {
        // IDOR Check: User must be owner
        const isParticipant =
          targetRecord.ownerId === userProfile.id || userProfile.isAdmin;

        if (!isParticipant) {
          return NextResponse.json(
            { success: false, error: "Akses ditolak. Anda bukan pemilik promosi ini." },
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
        },
        { status: 404 }
      );
    }

    const currentStatus = targetRecord.paymentStatus || "UNPAID";
    const activeMidtransOrderId = targetRecord.midtransOrderId || orderId;

    let expectedNominal = 0;
    if (targetType === "order" || targetType === "order_room") {
      expectedNominal = Math.round(Number(targetRecord.lockedAmount || 0));
    } else if (targetType === "rental" || targetType === "rental_booking") {
      expectedNominal = Math.round(Number(targetRecord.totalAmount || 0));
    } else if (targetType === "promotion") {
      expectedNominal = Math.round(Number(targetRecord.amount || 0));
    }

    // 6. Jika di database belum PAID tapi memiliki midtransOrderId, tanyakan server Midtrans
    let latestStatus = currentStatus;
    let paymentMethod = targetRecord.paymentMethodType || null;
    let isSettled = currentStatus === "PAID";

    if (latestStatus !== "PAID" && activeMidtransOrderId) {
      const config = getMidtransConfig();
      if (config.isConfigured) {
        try {
          const core = getCoreApiClient();
          const midtransStatus = await core.transaction.status(activeMidtransOrderId);

          if (midtransStatus) {
            // Validasi order_id untuk memastikan respons berasal dari transaksi yang benar
            if (midtransStatus.order_id && midtransStatus.order_id !== activeMidtransOrderId) {
              console.warn(
                `[Midtrans Status Warning]: Order ID mismatch: got ${midtransStatus.order_id}, expected ${activeMidtransOrderId}`
              );
            } else {
              const midtransGross = Math.round(Number(midtransStatus.gross_amount || 0));
              const isNominalMatch = expectedNominal > 0 && midtransGross === expectedNominal;

              const mapped = mapMidtransStatus(
                midtransStatus.transaction_status,
                midtransStatus.fraud_status
              );

              // INVARIAN TERMINAL STATE: Jangan turunkan status yang sudah PAID di database
              if (currentStatus === "PAID") {
                latestStatus = "PAID";
                isSettled = true;
              } else {
                latestStatus = mapped.paymentStatus;
                isSettled = mapped.isSettled;
              }

              paymentMethod = midtransStatus.payment_type || paymentMethod;

              // Jika Midtrans mengonfirmasi PAID, sinkronkan ke DB secara atomik hanya jika nominal valid
              if (isSettled && currentStatus !== "PAID") {
                if (!isNominalMatch) {
                  console.error(
                    `[Midtrans Status Security Error]: Nominal mismatch for ${activeMidtransOrderId}. Expected ${expectedNominal}, got ${midtransGross}`
                  );
                  latestStatus = "PENDING";
                  isSettled = false;
                } else {
                  const now = new Date();
                  if (targetType === "order" || targetType === "order_room") {
                    await prisma.orderRoom.updateMany({
                      where: { id: targetRecord.id, paymentStatus: { not: "PAID" } },
                      data: {
                        paymentStatus: "PAID",
                        paymentMethodType: paymentMethod,
                        midtransTransactionId: midtransStatus.transaction_id || targetRecord.midtransTransactionId,
                        paidAt: now,
                      },
                    });
                  } else if (targetType === "rental" || targetType === "rental_booking") {
                    await prisma.rentalBooking.updateMany({
                      where: { id: targetRecord.id, paymentStatus: { not: "PAID" } },
                      data: {
                        paymentStatus: "PAID",
                        paymentMethodType: paymentMethod,
                        midtransTransactionId: midtransStatus.transaction_id || targetRecord.midtransTransactionId,
                        bookingStatus: "payment_held",
                        paidAt: now,
                      },
                    });
                  } else if (targetType === "promotion") {
                    await prisma.promotion.updateMany({
                      where: { id: targetRecord.id, paymentStatus: { not: "PAID" } },
                      data: {
                        paymentStatus: "PAID",
                        status: "active",
                        midtransTransactionId: midtransStatus.transaction_id || targetRecord.midtransTransactionId,
                        startsAt: now,
                        paidAt: now,
                      },
                    });
                  }

                  // Catat log sinkronisasi status
                  await prisma.auditLog.create({
                    data: {
                      actorId: userProfile.id,
                      actorEmail: userProfile.email,
                      action: "payment.midtrans_status_synced",
                      targetEntity: targetType,
                      targetId: targetRecord.id,
                      payload: {
                        orderId: activeMidtransOrderId,
                        midtransStatus: midtransStatus.transaction_status,
                        grossAmount: midtransGross,
                        expectedAmount: expectedNominal,
                        mappedStatus: latestStatus,
                      },
                    },
                  }).catch(() => {});
                }
              }
            }
          }
        } catch (apiError) {
          // Midtrans returns 404 if transaction is not yet initialized on Midtrans side
          // This is normal and expected before customer opens snap popup
          console.log("[Midtrans Status Check]: Status query skipped/unreachable:", apiError?.message || apiError);
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        orderId: activeMidtransOrderId,
        entityType: targetType,
        entityId: targetRecord.id,
        paymentStatus: latestStatus,
        isSettled,
        paymentMethod,
        paidAt: targetRecord.paidAt || (isSettled ? new Date().toISOString() : null),
      },
    });
  } catch (error) {
    console.error("[Midtrans Status Route Error]:", error?.message || error);
    return NextResponse.json(
      {
        success: false,
        error: "Terjadi kesalahan internal server saat memeriksa status pembayaran.",
      },
      { status: 500 }
    );
  }
}
