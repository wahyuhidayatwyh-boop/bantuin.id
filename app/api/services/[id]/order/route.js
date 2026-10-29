import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth/jwt";
import { getSnapClient } from "@/lib/midtrans/client";

/**
 * POST /api/services/[id]/order
 * Task 25: Pemesanan order jasa langsung ke penyedia (Direct Order)
 * 
 * Rules:
 * 1. Strict JWT Authentication.
 * 2. Client cannot order their own service.
 * 3. Creates Request and OrderRoom atomically.
 * 4. Generates Midtrans Snap token for instant escrow payment.
 * 5. Sends chat message and notification to the provider.
 */
export async function POST(req, { params }) {
  try {
    const { id: serviceId } = await params;

    // 1. Auth check
    const authHeader = req.headers.get("authorization");
    let token = null;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7).trim();
    }
    if (!token) {
      const cookieHeader = req.headers.get("cookie") || "";
      const match =
        cookieHeader.match(/bantuin_auth_token=([^;]+)/) ||
        cookieHeader.match(/bantuin_token=([^;]+)/);
      if (match) token = match[1];
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

    if (userProfile.verificationStatus === "suspended") {
      return NextResponse.json(
        { success: false, error: "Akun Anda sedang ditangguhkan oleh Administrator Bantuin. Tidak dapat melakukan pemesanan jasa." },
        { status: 403 }
      );
    }

    // 2. Query Service
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      include: {
        provider: {
          select: { id: true, fullName: true, email: true, verificationStatus: true },
        },
      },
    });

    if (!service) {
      return NextResponse.json(
        { success: false, error: "Layanan jasa tidak ditemukan." },
        { status: 404 }
      );
    }

    if (service.provider?.verificationStatus === "suspended") {
      return NextResponse.json(
        { success: false, error: "Penyedia jasa ini sedang ditangguhkan sementara oleh Admin Bantuin." },
        { status: 403 }
      );
    }

    // Prevent ordering own service
    if (service.providerId === userProfile.id) {
      return NextResponse.json(
        { success: false, error: "Anda tidak dapat memesan layanan jasa milik Anda sendiri." },
        { status: 400 }
      );
    }

    // 3. Parse Body & Calculate Price
    const body = await req.json().catch(() => ({}));
    const { 
      notes, 
      deadline, 
      customPrice, 
      isPaid, 
      paymentStatus,
      locationType,
      mode,
      alamat,
      latitude,
      longitude,
      scheduledTime,
      brief
    } = body;

    // SEC-03: Never allow client request body to mark a new order as PAID before gateway settlement
    const initialPaymentStatus = "UNPAID";
    const initialOrderStatus = "room_created";

    const basePrice = Number(service.startingPrice);
    const requestedCustomPrice = customPrice !== undefined && customPrice !== null ? Number(customPrice) : basePrice;
    const price = !isNaN(requestedCustomPrice) && requestedCustomPrice >= basePrice ? requestedCustomPrice : basePrice;
    if (isNaN(price) || price <= 0) {
      return NextResponse.json(
        { success: false, error: "Nominal harga pesanan tidak valid." },
        { status: 400 }
      );
    }

    const targetDeadline = deadline ? new Date(deadline) : new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

    // Tentukan metode pelaksanaan yang presisi: onsite, customer_location, atau online
    const serviceLoc = String(service.locationType || "onsite").toLowerCase();
    const effectiveLocationType = locationType 
      || (mode === "online" ? "online" : (serviceLoc === "customer_location" ? "customer_location" : (serviceLoc === "online" ? "online" : "onsite")));
    const requestMode = effectiveLocationType === "online" ? "online" : "offline";

    let finalLocationName = "Online / Pengerjaan Jarak Jauh";
    let finalLat = null;
    let finalLng = null;

    if (effectiveLocationType === "onsite") {
      finalLocationName = service.address || service.provider?.partnerAddress || service.provider?.address || "Lokasi Mitra Terdaftar";
      finalLat = service.latitude ? Number(service.latitude) : null;
      finalLng = service.longitude ? Number(service.longitude) : null;
    } else if (effectiveLocationType === "customer_location") {
      finalLocationName = alamat || userProfile.partnerAddress || "Lokasi Pemesan (Panggilan)";
      finalLat = latitude ? parseFloat(latitude) : null;
      finalLng = longitude ? parseFloat(longitude) : null;
    }

    const clientNotes = (notes || brief || "").trim();
    const cleanNotes = clientNotes || `Pemesanan langsung untuk paket jasa ${service.title}`;
    const serializedDesc = `[METODE:${effectiveLocationType}][SERVICE_ID:${service.id}] ${cleanNotes}`;

    // 4. Atomic Prisma Transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create backing Request
      const request = await tx.request.create({
        data: {
          requesterId: userProfile.id,
          category: service.category || "Layanan Jasa",
          title: `Pemesanan Jasa: ${service.title.slice(0, 70)}`,
          description: serializedDesc,
          mode: requestMode,
          locationName: finalLocationName,
          latitude: finalLat,
          longitude: finalLng,
          deadline: targetDeadline,
          rewardAmount: price,
          status: initialPaymentStatus === "PAID" ? "in_progress" : "helper_selected",
          selectedHelperId: service.providerId,
        },
      });

      // Generate Midtrans Snap
      const generatedOrderId = `ORDER-JASA-${request.id.slice(0, 8)}-${Date.now().toString().slice(-6)}`;
      let snapToken = null;
      let redirectUrl = null;

      try {
        const snap = getSnapClient();
        const snapRes = await snap.createTransaction({
          transaction_details: {
            order_id: generatedOrderId,
            gross_amount: Math.round(price),
          },
          customer_details: {
            first_name: userProfile.fullName,
            email: userProfile.email,
            phone: userProfile.phoneNumber || "081234567890",
          },
          item_details: [
            {
              id: `JASA-${service.id.slice(0, 30)}`,
              price: Math.round(price),
              quantity: 1,
              name: service.title.slice(0, 50),
            },
          ],
        });
        snapToken = snapRes.token;
        redirectUrl = snapRes.redirect_url;
      } catch (snapErr) {
        console.warn("[service order] Midtrans Snap warning:", snapErr.message);
      }

      // Create OrderRoom
      const orderRoom = await tx.orderRoom.create({
        data: {
          requestId: request.id,
          requesterId: userProfile.id,
          helperId: service.providerId,
          lockedAmount: price,
          platformFee: 0,
          helperPayoutAmount: price,
          orderStatus: initialOrderStatus,
          paymentStatus: initialPaymentStatus,
          paidAt: null,
          midtransOrderId: generatedOrderId,
          midtransSnapToken: snapToken,
          deletedFor: [],
        },
      });

      // Initial Chat Message disesuaikan dengan metode pelaksanaan
      let initialMsgText = `Halo! Saya telah memesan jasa '${service.title}'.`;
      if (effectiveLocationType === "onsite") {
        initialMsgText += `\nMetode: Klien Datang ke Lokasi Mitra.${scheduledTime ? ` Waktu kedatangan: ${scheduledTime} WIB.` : ""} Alamat Tempat Mitra: ${finalLocationName}.${cleanNotes ? ` Rincian kebutuhan: ${cleanNotes}` : ""}`;
      } else if (effectiveLocationType === "customer_location") {
        initialMsgText += `\nMetode: Mitra Datang ke Lokasi Klien (Layanan Panggilan).${scheduledTime ? ` Waktu kunjungan: ${scheduledTime} WIB.` : ""} Alamat Klien: ${finalLocationName}.${cleanNotes ? ` Rincian kebutuhan: ${cleanNotes}` : ""}`;
      } else {
        initialMsgText += `\nMetode: 100% Online / Digital.${cleanNotes ? ` Brief kebutuhan: ${cleanNotes}` : ""}`;
      }

      await tx.chatMessage.create({
        data: {
          orderRoomId: orderRoom.id,
          senderId: userProfile.id,
          message: initialMsgText,
          hasWarningFlag: false,
        },
      });

      // Notification to Provider
      await tx.notification.create({
        data: {
          userId: service.providerId,
          title: "Pesanan Jasa Masuk: " + service.title,
          message: `${userProfile.fullName} memesan jasa '${service.title}' seharga Rp ${price.toLocaleString("id-ID")}. ${initialPaymentStatus === "PAID" ? "Pembayaran telah aman terverifikasi di Rekening Bersama." : "Menunggu pelunasan pembayaran escrow."}`,
          type: "order",
          link: `/chat?room=${orderRoom.id}`,
        },
      });

      // Notification to Buyer
      await tx.notification.create({
        data: {
          userId: userProfile.id,
          title: "Pesanan Jasa Berhasil",
          message: `Pesanan Anda untuk jasa '${service.title}' berhasil dibuat. Dana diamankan di Rekening Bersama Bantuin.`,
          type: "order",
          link: `/chat?room=${orderRoom.id}`,
        },
      });

      return { orderRoom, request, snapToken, redirectUrl };
    });

    return NextResponse.json(
      {
        success: true,
        message: "Pesanan jasa berhasil dibuat. Silakan selesaikan pembayaran escrow.",
        data: result,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[POST /api/services/[id]/order error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Gagal membuat pesanan jasa." },
      { status: 500 }
    );
  }
}
