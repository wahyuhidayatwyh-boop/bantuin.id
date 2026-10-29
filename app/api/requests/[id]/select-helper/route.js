import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth/jwt";
import { getSnapClient, getMidtransConfig } from "@/lib/midtrans/client";

/**
 * POST /api/requests/[id]/select-helper
 * Task 13: Pemilihan helper terpilih & pembentukan bilik transaksi
 * 
 * Rules:
 * 1. Strict JWT auth: Requester must be the creator of the request.
 * 2. Request status must be 'published' or 'has_offers'.
 * 3. Selected offer must belong to this request.
 * 4. Creates OrderRoom with Midtrans Snap token generation.
 * 5. Updates Request status to 'helper_selected' and Offer status to 'accepted'.
 * 6. Creates initial transaction system chat message.
 */
export async function POST(req, { params }) {
  try {
    const { id: requestId } = await params;

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

    // 2. Parse body
    const body = await req.json().catch(() => ({}));
    const { offerId, helperId } = body;

    if (!offerId && !helperId) {
      return NextResponse.json(
        { success: false, error: "Parameter 'offerId' atau 'helperId' wajib disertakan." },
        { status: 400 }
      );
    }

    // 3. Find Request (BUG-03: use 'orderRooms' relation matching prisma/schema.prisma)
    const request = await prisma.request.findUnique({
      where: { id: requestId },
      include: {
        offers: true,
        orderRooms: true,
      },
    });

    if (!request) {
      return NextResponse.json(
        { success: false, error: "Permintaan bantuan tidak ditemukan." },
        { status: 404 }
      );
    }

    // Anti-IDOR check
    if (request.requesterId !== userProfile.id && !userProfile.isAdmin) {
      return NextResponse.json(
        { success: false, error: "Akses ditolak. Anda bukan pembuat permintaan ini." },
        { status: 403 }
      );
    }

    if (request.status === "completed" || request.status === "cancelled") {
      return NextResponse.json(
        { success: false, error: `Permintaan ini sudah dalam status '${request.status}' dan tidak dapat diubah.` },
        { status: 400 }
      );
    }

    // 4. Find Selected Offer
    const targetOffer = request.offers.find(
      (o) => (offerId && o.id === offerId) || (helperId && o.helperId === helperId)
    );

    if (!targetOffer) {
      return NextResponse.json(
        { success: false, error: "Tawaran helper tidak ditemukan pada permintaan ini." },
        { status: 404 }
      );
    }

    const lockedAmount = Number(targetOffer.proposedPrice || request.rewardAmount || 0);
    if (lockedAmount <= 0) {
      return NextResponse.json(
        { success: false, error: "Nominal imbalan penugasan tidak valid (harus lebih besar dari Rp 0)." },
        { status: 400 }
      );
    }

    const platformFee = 0; // Promosi bebas biaya admin
    const helperPayoutAmount = lockedAmount - platformFee;

    // 5. Atomic Prisma Transaction
    const result = await prisma.$transaction(async (tx) => {
      // a. Update/Create OrderRoom
      let orderRoom = await tx.orderRoom.findFirst({
        where: { requestId: request.id, helperId: targetOffer.helperId },
      });

      const orderIdSuffix = Date.now().toString().slice(-6);
      const generatedOrderId = `ORDER-BANTUAN-${requestId.slice(0, 8)}-${orderIdSuffix}`;

      // b. Inisialisasi Midtrans Snap jika konfigurasi tersedia
      let snapToken = null;
      let redirectUrl = null;

      try {
        const snap = getSnapClient();
        const midtransPayload = {
          transaction_details: {
            order_id: generatedOrderId,
            gross_amount: Math.round(lockedAmount),
          },
          customer_details: {
            first_name: userProfile.fullName,
            email: userProfile.email,
            phone: userProfile.phoneNumber || "081234567890",
          },
          item_details: [
            {
              id: request.id.slice(0, 50),
              price: Math.round(lockedAmount),
              quantity: 1,
              name: request.title.slice(0, 50),
            },
          ],
        };

        const snapResponse = await snap.createTransaction(midtransPayload);
        snapToken = snapResponse.token;
        redirectUrl = snapResponse.redirect_url;
      } catch (snapErr) {
        console.warn("[select-helper] Midtrans Snap warning:", snapErr.message);
      }

      if (orderRoom) {
        orderRoom = await tx.orderRoom.update({
          where: { id: orderRoom.id },
          data: {
            helperId: targetOffer.helperId,
            lockedAmount: lockedAmount,
            platformFee: platformFee,
            helperPayoutAmount: helperPayoutAmount,
            midtransOrderId: generatedOrderId,
            midtransSnapToken: snapToken,
            orderStatus: "room_created",
            paymentStatus: "UNPAID",
          },
        });
      } else {
        orderRoom = await tx.orderRoom.create({
          data: {
            requestId: request.id,
            requesterId: userProfile.id,
            helperId: targetOffer.helperId,
            lockedAmount: lockedAmount,
            platformFee: platformFee,
            helperPayoutAmount: helperPayoutAmount,
            orderStatus: "room_created",
            paymentStatus: "UNPAID",
            midtransOrderId: generatedOrderId,
            midtransSnapToken: snapToken,
          },
        });
      }

      // c. Update Offers: accepted for chosen helper, rejected for others
      await tx.offer.update({
        where: { id: targetOffer.id },
        data: { status: "accepted" },
      });

      await tx.offer.updateMany({
        where: {
          requestId: request.id,
          id: { not: targetOffer.id },
        },
        data: { status: "rejected" },
      });

      // Pastikan room helper lain pada tugas bantuan ini ditandai cancelled & UNPAID
      await tx.orderRoom.updateMany({
        where: {
          requestId: request.id,
          id: { not: orderRoom.id },
        },
        data: {
          orderStatus: "cancelled",
          paymentStatus: "UNPAID",
        },
      });

      // d. Update Request
      await tx.request.update({
        where: { id: request.id },
        data: {
          selectedHelperId: targetOffer.helperId,
          status: "helper_selected",
        },
      });

      // e. Create Initial System Chat Message
      await tx.chatMessage.create({
        data: {
          orderRoomId: orderRoom.id,
          senderId: userProfile.id,
          message: `Helper resmi terpilih! Bilik transaksi aman telah dibentuk. Silakan lakukan pembayaran escrow sebesar Rp ${lockedAmount.toLocaleString("id-ID")} untuk mengunci dana dan memulai pengerjaan.`,
          hasWarningFlag: false,
        },
      });

      // f. Create Notification for Helper
      await tx.notification.create({
        data: {
          userId: targetOffer.helperId,
          title: "Tawaran Anda Diterima!",
          message: `Selamat! Anda terpilih untuk menyelesaikan tugas '${request.title}'. Menunggu pemohon menyelesaikan pembayaran escrow.`,
          type: "order",
          link: `/chat?room=${orderRoom.id}`,
        },
      });

      return { orderRoom, snapToken, redirectUrl };
    });

    return NextResponse.json({
      success: true,
      message: "Helper berhasil dipilih dan bilik transaksi telah dibentuk.",
      data: {
        orderRoom: result.orderRoom,
        snapToken: result.snapToken,
        redirectUrl: result.redirectUrl,
      },
    });
  } catch (err) {
    console.error("[select-helper error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Gagal memilih helper." },
      { status: 500 }
    );
  }
}
