import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth/jwt";

/**
 * GET /api/chat/messages?roomId=...
 * Mengambil seluruh riwayat pesan untuk bilik obrolan tertentu.
 */
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const isValidUuid = (str) => typeof str === "string" && UUID_REGEX.test(str.trim());

    if (!roomId || !isValidUuid(roomId)) {
      return NextResponse.json({ success: true, data: [] });
    }

    const messages = await prisma.chatMessage.findMany({
      where: { orderRoomId: roomId },
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
    });

    const formatted = messages.map((m) => ({
      id: m.id,
      senderId: m.senderId,
      senderName: m.sender?.fullName || "Pengguna",
      senderAvatar: m.sender?.avatarUrl && !m.sender.avatarUrl.includes("images.unsplash.com") ? m.sender.avatarUrl : null,
      message: m.message,
      attachmentUrls: m.attachmentUrls || [],
      isRead: m.isRead,
      timestamp: new Date(m.createdAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
      createdAt: m.createdAt,
    }));

    return NextResponse.json({ success: true, data: formatted });
  } catch (error) {
    console.error("GET /api/chat/messages Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/chat/messages
 * Mengirim dan menyimpan pesan baru ke tabel chat_messages di PostgreSQL.
 */
export async function POST(req) {
  try {
    const authHeader = req.headers.get("authorization");
    let token = null;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7).trim();
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

    const body = await req.json();
    const { orderRoomId, message, senderId, attachmentUrls = [] } = body;

    const actualSenderId = userId || senderId;

    if (!orderRoomId || !message || !actualSenderId) {
      return NextResponse.json(
        { success: false, error: "orderRoomId, message, dan senderId diperlukan." },
        { status: 400 }
      );
    }

    const newMsg = await prisma.chatMessage.create({
      data: {
        orderRoomId,
        senderId: actualSenderId,
        message,
        attachmentUrls,
      },
      include: {
        sender: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
          },
        },
      },
    });

    // Update timestamp order_rooms
    await prisma.orderRoom.update({
      where: { id: orderRoomId },
      data: { updatedAt: new Date() },
    }).catch(() => null);

    return NextResponse.json({
      success: true,
      data: {
        id: newMsg.id,
        senderId: newMsg.senderId,
        senderName: newMsg.sender?.fullName || "Pengguna",
        senderAvatar: newMsg.sender?.avatarUrl && !newMsg.sender.avatarUrl.includes("images.unsplash.com") ? newMsg.sender.avatarUrl : null,
        message: newMsg.message,
        attachmentUrls: newMsg.attachmentUrls,
        timestamp: new Date(newMsg.createdAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
        createdAt: newMsg.createdAt,
      },
    });
  } catch (error) {
    console.error("POST /api/chat/messages Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
