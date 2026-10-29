import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth/jwt";
import {
  getSnapClient,
  getCoreApiClient,
  getMidtransConfig,
  mapMidtransStatus,
} from "@/lib/midtrans/client";

/**
 * Memeriksa status transaksi yang sudah ada di server Midtrans
 * @param {string} orderId
 */
async function inspectExistingMidtransTransaction(orderId) {
  if (!orderId) return null;
  const config = getMidtransConfig();
  if (!config.isConfigured) return null;

  try {
    const core = getCoreApiClient();
    const statusRes = await core.transaction.status(orderId);
    if (!statusRes) return null;

    const mapped = mapMidtransStatus(statusRes.transaction_status, statusRes.fraud_status);
    return {
      exists: true,
      transactionStatus: statusRes.transaction_status,
      mappedStatus: mapped.paymentStatus,
      isSettled: mapped.isSettled,
      grossAmount: Math.round(Number(statusRes.gross_amount)),
    };
  } catch {
    // Midtrans mengembalikan 404 jika token belum pernah dibuka/disubmit di gateway
    return { exists: false };
  }
}

/**
 * POST /api/payments/create-invoice
 * Official Midtrans Snap Transaction Creator for Bantuin.id
 *
 * Security & Design Rules:
 * 1. Strict JWT Authentication & Authorization:
 *    - Validates Bearer token.
 *    - Only the rightful owner (requester for errands/orders, renter for rentals, owner for promotions)
 *      can initiate payment for the record.
 * 2. Trusted Source of Truth:
 *    - The transaction amount is NEVER trusted from client input. It is fetched directly from the database.
 * 3. Idempotency & Duplicate Prevention:
 *    - If an active PENDING transaction exists on Midtrans, reuses the existing Snap token without creating duplicate order_ids.
 *    - Prevents creating transactions for orders that are already paid, settled, or cancelled.
 * 4. Midtrans SDK:
 *    - Uses official `midtrans-client` Snap instance.
 *    - Rejects with server error if credentials are missing (no fake/mock fallback).
 * 5. Database Consistency:
 *    - Atomic conditional update ensures concurrent checkouts cannot overwrite a paid or cancelled order.
 *    - Records audit log in `audit_logs`.
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

    // 4. Parse Request Body
    const body = await request.json().catch(() => ({}));
    const {
      entityType = "order", // 'order' | 'rental' | 'promotion'
      entityId,
      orderRoomId,
      rentalBookingId,
      promotionId,
    } = body;

    const targetId = entityId || orderRoomId || rentalBookingId || promotionId;

    if (!targetId) {
      return NextResponse.json(
        {
          success: false,
          error: "ID transaksi (entityId / orderRoomId / rentalBookingId / promotionId) wajib disertakan.",
        },
        { status: 400 }
      );
    }

    // 5. Validasi & Ambil Data dari Database Sesuai Tipe Entitas
    let resolvedNominal = 0;
    let midtransOrderId = "";
    let itemName = "";
    let executeAtomicUpdate = null;
    const config = getMidtransConfig();
    const snapBaseUrl = config.isProduction
      ? "https://app.midtrans.com/snap/v2/vtweb"
      : "https://app.sandbox.midtrans.com/snap/v2/vtweb";

    if (entityType === "order" || entityType === "order_room") {
      const orderRoom = await prisma.orderRoom.findFirst({
        where: {
          OR: [{ id: targetId }, { requestId: targetId }],
        },
        include: {
          request: true,
        },
      });

      if (!orderRoom) {
        return NextResponse.json(
          {
            success: false,
            error: "Data transaksi bilik pesanan (OrderRoom) tidak ditemukan.",
          },
          { status: 404 }
        );
      }

      // Otorisasi: Hanya requester yang berhak membayar pesanan
      if (orderRoom.requesterId !== userProfile.id) {
        return NextResponse.json(
          {
            success: false,
            error: "Akses ditolak. Anda bukan pemesan/pemilik dari pesanan ini.",
          },
          { status: 403 }
        );
      }

      // Validasi Status: Jangan izinkan pembayaran jika sudah lunas atau dibatalkan
      if (orderRoom.paymentStatus === "PAID" || orderRoom.orderStatus === "completed") {
        return NextResponse.json(
          {
            success: false,
            error: "Transaksi pesanan ini sudah berstatus LUNAS (PAID). Tidak dapat melakukan pembayaran ulang.",
          },
          { status: 400 }
        );
      }

      if (orderRoom.orderStatus === "cancelled") {
        return NextResponse.json(
          {
            success: false,
            error: "Pesanan ini telah dibatalkan. Pembayaran tidak dapat diproses.",
          },
          { status: 400 }
        );
      }

      // Ambil nominal terpercaya dari database
      resolvedNominal = Math.round(Number(orderRoom.lockedAmount));
      if (resolvedNominal <= 0) {
        return NextResponse.json(
          {
            success: false,
            error: "Nominal transaksi pesanan tidak valid atau bernilai nol.",
          },
          { status: 400 }
        );
      }

      // IDEMPOTENSI: Cek apakah sudah ada transaksi PENDING aktif untuk pesanan ini
      if (orderRoom.midtransOrderId && orderRoom.midtransSnapToken && orderRoom.paymentStatus === "PENDING") {
        const existingTx = await inspectExistingMidtransTransaction(orderRoom.midtransOrderId);

        if (existingTx?.isSettled) {
          // Transaksi ternyata sudah lunas di Midtrans, sinkronkan ke DB
          await prisma.orderRoom.update({
            where: { id: orderRoom.id },
            data: { paymentStatus: "PAID", paidAt: new Date() },
          });
          return NextResponse.json(
            { success: false, error: "Transaksi pesanan ini sudah berstatus LUNAS (PAID)." },
            { status: 400 }
          );
        }

        // Jika transaksi masih pending di Midtrans (atau belum kedaluwarsa), gunakan kembali token aktif!
        if (!existingTx || existingTx.mappedStatus === "PENDING") {
          return NextResponse.json({
            success: true,
            data: {
              orderId: orderRoom.midtransOrderId,
              token: orderRoom.midtransSnapToken,
              redirectUrl: `${snapBaseUrl}/${orderRoom.midtransSnapToken}`,
              amount: resolvedNominal,
              entityType: "order",
              entityId: orderRoom.id,
              reused: true,
            },
          });
        }
      }

      const shortId = orderRoom.id.replace(/-/g, "").slice(0, 8);
      midtransOrderId = `BTN-ORD-${shortId}-${Date.now().toString().slice(-6)}`;
      itemName = orderRoom.request?.title
        ? `Bantuin: ${orderRoom.request.title.slice(0, 38)}`
        : `Bantuin Pesanan #${shortId}`;

      executeAtomicUpdate = async (snapToken) => {
        const updateResult = await prisma.orderRoom.updateMany({
          where: {
            id: orderRoom.id,
            paymentStatus: { in: ["UNPAID", "PENDING"] },
            orderStatus: { notIn: ["completed", "cancelled"] },
          },
          data: {
            midtransOrderId,
            midtransSnapToken: snapToken,
            paymentStatus: "PENDING",
          },
        });

        if (updateResult.count === 0) {
          throw new Error("Kondisi transaksi pesanan berubah saat menyiapkan pembayaran. Silakan coba kembali.");
        }
      };
    } else if (entityType === "rental" || entityType === "rental_booking") {
      const rentalBooking = await prisma.rentalBooking.findUnique({
        where: { id: targetId },
        include: {
          rental: true,
        },
      });

      if (!rentalBooking) {
        return NextResponse.json(
          {
            success: false,
            error: "Data pesanan sewa (RentalBooking) tidak ditemukan.",
          },
          { status: 404 }
        );
      }

      // Otorisasi: Hanya penyewa (renter) yang berhak membayar
      if (rentalBooking.renterId !== userProfile.id) {
        return NextResponse.json(
          {
            success: false,
            error: "Akses ditolak. Anda bukan penyewa dari barang ini.",
          },
          { status: 403 }
        );
      }

      if (rentalBooking.paymentStatus === "PAID" || rentalBooking.bookingStatus === "verified_settled") {
        return NextResponse.json(
          {
            success: false,
            error: "Transaksi sewa ini sudah berstatus LUNAS (PAID).",
          },
          { status: 400 }
        );
      }

      if (rentalBooking.bookingStatus === "cancelled") {
        return NextResponse.json(
          {
            success: false,
            error: "Booking sewa ini telah dibatalkan.",
          },
          { status: 400 }
        );
      }

      resolvedNominal = Math.round(Number(rentalBooking.totalAmount));
      if (resolvedNominal <= 0) {
        return NextResponse.json(
          {
            success: false,
            error: "Total biaya sewa tidak valid.",
          },
          { status: 400 }
        );
      }

      // IDEMPOTENSI: Cek apakah sudah ada transaksi PENDING aktif untuk sewa ini
      if (rentalBooking.midtransOrderId && rentalBooking.midtransSnapToken && rentalBooking.paymentStatus === "PENDING") {
        const existingTx = await inspectExistingMidtransTransaction(rentalBooking.midtransOrderId);

        if (existingTx?.isSettled) {
          await prisma.rentalBooking.update({
            where: { id: rentalBooking.id },
            data: { paymentStatus: "PAID", paidAt: new Date(), bookingStatus: "payment_held" },
          });
          return NextResponse.json(
            { success: false, error: "Transaksi sewa ini sudah berstatus LUNAS (PAID)." },
            { status: 400 }
          );
        }

        if (!existingTx || existingTx.mappedStatus === "PENDING") {
          return NextResponse.json({
            success: true,
            data: {
              orderId: rentalBooking.midtransOrderId,
              token: rentalBooking.midtransSnapToken,
              redirectUrl: `${snapBaseUrl}/${rentalBooking.midtransSnapToken}`,
              amount: resolvedNominal,
              entityType: "rental",
              entityId: rentalBooking.id,
              reused: true,
            },
          });
        }
      }

      const shortId = rentalBooking.id.replace(/-/g, "").slice(0, 8);
      midtransOrderId = `BTN-RNT-${shortId}-${Date.now().toString().slice(-6)}`;
      itemName = rentalBooking.rental?.title
        ? `Sewa: ${rentalBooking.rental.title.slice(0, 40)}`
        : `Sewa Alat #${shortId}`;

      executeAtomicUpdate = async (snapToken) => {
        const updateResult = await prisma.rentalBooking.updateMany({
          where: {
            id: rentalBooking.id,
            paymentStatus: { in: ["UNPAID", "PENDING"] },
            bookingStatus: { notIn: ["verified_settled", "cancelled"] },
          },
          data: {
            midtransOrderId,
            midtransSnapToken: snapToken,
            paymentStatus: "PENDING",
          },
        });

        if (updateResult.count === 0) {
          throw new Error("Kondisi transaksi sewa berubah saat menyiapkan pembayaran. Silakan coba kembali.");
        }
      };
    } else if (entityType === "promotion") {
      const promo = await prisma.promotion.findUnique({
        where: { id: targetId },
      });

      if (!promo) {
        return NextResponse.json(
          {
            success: false,
            error: "Data pesanan promosi tidak ditemukan.",
          },
          { status: 404 }
        );
      }

      // Otorisasi: Hanya pemilik promosi yang berhak membayar
      if (promo.ownerId !== userProfile.id) {
        return NextResponse.json(
          {
            success: false,
            error: "Akses ditolak. Anda bukan pemilik promosi ini.",
          },
          { status: 403 }
        );
      }

      if (promo.paymentStatus === "PAID" || promo.status === "active") {
        return NextResponse.json(
          {
            success: false,
            error: "Pembelian promosi ini sudah berstatus LUNAS (PAID).",
          },
          { status: 400 }
        );
      }

      if (promo.status === "cancelled") {
        return NextResponse.json(
          {
            success: false,
            error: "Pesanan promosi ini telah dibatalkan.",
          },
          { status: 400 }
        );
      }

      resolvedNominal = Math.round(Number(promo.amount));
      if (resolvedNominal <= 0) {
        return NextResponse.json(
          {
            success: false,
            error: "Nominal promosi tidak valid.",
          },
          { status: 400 }
        );
      }

      // IDEMPOTENSI: Cek apakah sudah ada transaksi PENDING aktif untuk promosi ini
      if (promo.midtransOrderId && promo.midtransSnapToken && promo.paymentStatus === "PENDING") {
        const existingTx = await inspectExistingMidtransTransaction(promo.midtransOrderId);

        if (existingTx?.isSettled) {
          const now = new Date();
          const promoDurationDays = Math.max(1, Number(promo.durationDays) || 7);
          await prisma.promotion.update({
            where: { id: promo.id },
            data: {
              paymentStatus: "PAID",
              paidAt: now,
              status: "active",
              startsAt: now,
              expiresAt: new Date(now.getTime() + promoDurationDays * 86400000),
            },
          });
          return NextResponse.json(
            { success: false, error: "Pembelian promosi ini sudah berstatus LUNAS (PAID)." },
            { status: 400 }
          );
        }

        if (!existingTx || existingTx.mappedStatus === "PENDING") {
          return NextResponse.json({
            success: true,
            data: {
              orderId: promo.midtransOrderId,
              token: promo.midtransSnapToken,
              redirectUrl: `${snapBaseUrl}/${promo.midtransSnapToken}`,
              amount: resolvedNominal,
              entityType: "promotion",
              entityId: promo.id,
              reused: true,
            },
          });
        }
      }

      const shortId = promo.id.replace(/-/g, "").slice(0, 8);
      midtransOrderId = `BTN-PRM-${shortId}-${Date.now().toString().slice(-6)}`;
      itemName = `Promosi Bantuin #${shortId}`;

      executeAtomicUpdate = async (snapToken) => {
        const updateResult = await prisma.promotion.updateMany({
          where: {
            id: promo.id,
            paymentStatus: { in: ["UNPAID", "PENDING"] },
            status: { notIn: ["active", "cancelled"] },
          },
          data: {
            midtransOrderId,
            midtransSnapToken: snapToken,
            paymentStatus: "PENDING",
          },
        });

        if (updateResult.count === 0) {
          throw new Error("Kondisi transaksi promosi berubah saat menyiapkan pembayaran. Silakan coba kembali.");
        }
      };
    } else {
      return NextResponse.json(
        {
          success: false,
          error: `Tipe entitas transaksi '${entityType}' tidak didukung. Pilihan valid: 'order', 'rental', 'promotion'.`,
        },
        { status: 400 }
      );
    }

    // 6. Buat Transaksi Melalui Midtrans Snap Client Resmi
    const snap = getSnapClient();

    const transactionParams = {
      transaction_details: {
        order_id: midtransOrderId,
        gross_amount: resolvedNominal,
      },
      customer_details: {
        first_name: userProfile.fullName || "Pengguna Bantuin",
        email: userProfile.email,
        phone: userProfile.phoneNumber || undefined,
      },
      item_details: [
        {
          id: `ITEM-${targetId.replace(/-/g, "").slice(0, 10)}`,
          price: resolvedNominal,
          quantity: 1,
          name: itemName.slice(0, 50),
        },
      ],
      credit_card: {
        secure: true,
      },
    };

    const snapResponse = await snap.createTransaction(transactionParams);

    if (!snapResponse || !snapResponse.token) {
      throw new Error("Gagal memperoleh Snap Token dari Midtrans.");
    }

    // 7. Simpan Snap Token & Order ID ke Database dalam Operasi Atomik
    if (executeAtomicUpdate) {
      await executeAtomicUpdate(snapResponse.token);
    }

    // 8. Catat Jejak Audit Transaksi
    await prisma.auditLog.create({
      data: {
        actorId: userProfile.id,
        actorEmail: userProfile.email,
        action: "payment.midtrans_snap_created",
        targetEntity: entityType,
        targetId: targetId,
        payload: {
          midtransOrderId,
          grossAmount: resolvedNominal,
          hasToken: Boolean(snapResponse.token),
        },
      },
    }).catch((err) => {
      console.warn("[AuditLog Warning]: Gagal mencatat log invoice:", err.message);
    });

    // 9. Kembalikan Respon Aman Hanya Berisi Data yang Dibutuhkan Frontend
    return NextResponse.json({
      success: true,
      data: {
        orderId: midtransOrderId,
        token: snapResponse.token,
        redirectUrl: snapResponse.redirect_url,
        amount: resolvedNominal,
        entityType,
        entityId: targetId,
      },
    });
  } catch (error) {
    console.error("[Midtrans Create Invoice Error]:", error?.message || error);

    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Terjadi kesalahan internal pada server saat menyiapkan transaksi pembayaran.",
      },
      { status: 500 }
    );
  }
}
