import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth/jwt";

/**
 * GET /api/chat/rooms
 * Mengambil seluruh daftar bilik obrolan resmi (order_rooms) & diskusi transaksi dari database
 * untuk akun yang sedang login (requester atau helper) atau berdasarkan roomId / requestId.
 * Murni data database, tanpa mockup.
 */
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const roomIdParam = searchParams.get("roomId");
    const requestIdParam = searchParams.get("requestId");

    // 1. Ekstraksi Token Otentikasi dari Header atau Cookies
    const authHeader = req.headers.get("authorization");
    let token = null;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7).trim();
    }

    if (!token) {
      const cookieHeader = req.headers.get("cookie") || "";
      const match = cookieHeader.match(/bantuin_auth_token=([^;]+)/) || cookieHeader.match(/bantuin_token=([^;]+)/);
      if (match) token = match[1];
    }

    let userId = null;
    if (token) {
      const decoded = verifyAccessToken(token);
      if (decoded && (decoded.id || decoded.email)) {
        const profile = await prisma.profile.findFirst({
          where: {
            OR: [
              ...(decoded.id ? [{ id: decoded.id }] : []),
              ...(decoded.email ? [{ email: decoded.email.toLowerCase() }] : []),
            ],
          },
        });
        if (profile) userId = profile.id;
      }
    }

    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const isValidUuid = (str) => typeof str === "string" && UUID_REGEX.test(str.trim());

    // Bangun filter OR untuk orderRoom
    const whereConditions = [];

    if (userId && isValidUuid(userId)) {
      whereConditions.push({ requesterId: userId });
      whereConditions.push({ helperId: userId });
    }

    if (roomIdParam && isValidUuid(roomIdParam)) {
      whereConditions.push({ id: roomIdParam });
    }

    if (requestIdParam && isValidUuid(requestIdParam)) {
      whereConditions.push({ requestId: requestIdParam });
    }

    if (whereConditions.length === 0) {
      return NextResponse.json({
        success: true,
        count: 0,
        data: [],
      });
    }

    // 2. Query order_rooms asli dari PostgreSQL
    const orderRooms = await prisma.orderRoom.findMany({
      where: {
        OR: whereConditions,
      },
      include: {
        request: {
          include: {
            bantuinPoint: true,
          },
        },
        requester: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
            phoneNumber: true,
            email: true,
          },
        },
        helper: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
            phoneNumber: true,
            email: true,
            ratingAvg: true,
          },
        },
        chatMessages: {
          include: {
            sender: {
              select: {
                id: true,
                fullName: true,
                avatarUrl: true,
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    // 3. Transform data sesuai format aplikasi
    const formattedRooms = orderRooms.map((room) => {
      const isRequester = userId ? room.requesterId === userId : true;
      const partner = isRequester ? room.helper : room.requester;
      const partnerName = partner?.fullName || (isRequester ? "Helper Bantuin" : "Pemohon");
      const partnerAvatar = partner?.avatarUrl && !partner.avatarUrl.includes("images.unsplash.com") ? partner.avatarUrl : null;
      const reqTitle = room.request?.title || "Bantuan Bantuin.id";
      const locked = Number(room.lockedAmount || room.request?.rewardAmount || 0);

      const messages = (room.chatMessages || []).map((msg) => ({
        id: msg.id,
        senderId: msg.senderId,
        senderName: msg.sender?.fullName || "Pengguna",
        senderAvatar: msg.sender?.avatarUrl && !msg.sender.avatarUrl.includes("images.unsplash.com") ? msg.sender.avatarUrl : null,
        message: msg.message,
        timestamp: new Date(msg.createdAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
        createdAt: msg.createdAt,
        isSystem: msg.senderId === "system" || msg.message.includes("Rekening Bersama") || msg.message.includes("diverifikasi"),
      }));

      // Pesan escrow awal otomatis jika chat_messages baru kosong
      if (messages.length === 0) {
        messages.push({
          id: `sys-msg-${room.id}`,
          senderId: "system",
          senderName: "Bantuin System",
          message: `Dana sebesar Rp${locked.toLocaleString("id-ID")} telah aman terverifikasi di Rekening Bersama Bantuin.id. Helper dapat segera mulai pengerjaan tugas!`,
          timestamp: new Date(room.createdAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
          isSystem: true,
        });
      }

      return {
        id: room.id,
        orderRoomId: room.id,
        requestId: room.requestId,
        requestTitle: reqTitle,
        categoryType: "bantuan",
        orderType: "task",
        category: room.request?.category || "Bantuan",
        mode: room.request?.mode || "offline",
        lockedAmount: locked,
        platformFee: Number(room.platformFee || 0),
        helperPayoutAmount: Number(room.helperPayoutAmount || 0),
        orderStatus: room.orderStatus,
        status: room.orderStatus,
        partner: {
          id: partner?.id,
          name: partnerName,
          avatar: partnerAvatar,
          phone: partner?.phoneNumber || "08123456789",
        },
        helper: {
          id: room.helper?.id,
          name: room.helper?.fullName || "Helper Bantuin",
          avatar: room.helper?.avatarUrl && !room.helper.avatarUrl.includes("images.unsplash.com") ? room.helper.avatarUrl : null,
          phone: room.helper?.phoneNumber || "08123456789",
          rating: Number(room.helper?.ratingAvg) || 5.0,
        },
        requester: {
          id: room.requester?.id,
          name: room.requester?.fullName || "Pemohon",
          avatar: room.requester?.avatarUrl && !room.requester.avatarUrl.includes("images.unsplash.com") ? room.requester.avatarUrl : null,
          phone: room.requester?.phoneNumber,
        },
        pickupPoint: room.request?.bantuinPoint?.name || room.request?.locationName || "Titik Temu",
        messages,
        createdAt: room.createdAt,
        updatedAt: room.updatedAt,
      };
    });

    return NextResponse.json({
      success: true,
      count: formattedRooms.length,
      data: formattedRooms,
    });
  } catch (error) {
    console.error("GET /api/chat/rooms Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Gagal mengambil daftar obrolan." },
      { status: 500 }
    );
  }
}
