import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth/jwt";

const UUID_REGEX = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;

/**
 * Resolves an OrderRoom from the database, or auto-creates one if
 * the room was initiated as an inquiry or using a Request ID.
 */
async function resolveOrCreateOrderRoom(orderRoomId, senderId = null) {
  if (!orderRoomId || typeof orderRoomId !== "string") return null;

  // 1. Direct match by OrderRoom.id (if valid UUID)
  const isDirectUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderRoomId.trim());
  if (isDirectUuid) {
    const directRoom = await prisma.orderRoom.findFirst({
      where: { id: orderRoomId.trim() },
      include: { request: true },
    }).catch(() => null);
    if (directRoom) return directRoom;
  }

  // 2. Extract UUIDs if formatted like "inquiry-[requestId]-[helperId]" or "task-[requestId]"
  const uuids = orderRoomId.match(UUID_REGEX) || [];

  // 3. Search by requestId or OrderRoom.id for any extracted UUID
  for (const uid of uuids) {
    const roomByReq = await prisma.orderRoom.findFirst({
      where: {
        OR: [
          { id: uid },
          { requestId: uid },
        ],
      },
      include: { request: true },
    }).catch(() => null);
    if (roomByReq) return roomByReq;
  }

  // 4. If no OrderRoom exists in database yet, but we have a valid Request ID, auto-create it
  if (uuids.length > 0) {
    const targetRequestId = uuids[0];
    const targetRequest = await prisma.request.findUnique({
      where: { id: targetRequestId },
      include: {
        offers: {
          include: { helper: true },
        },
      },
    }).catch(() => null);

    if (targetRequest) {
      // Determine helperId
      let helperId = targetRequest.selectedHelperId;
      if (!helperId && uuids.length > 1) {
        helperId = uuids[1];
      }
      if (!helperId && targetRequest.offers && targetRequest.offers.length > 0) {
        const acceptedOffer = targetRequest.offers.find((o) => o.status === "accepted");
        helperId = acceptedOffer ? acceptedOffer.helperId : targetRequest.offers[0].helperId;
      }
      if (!helperId && senderId && senderId !== targetRequest.requesterId) {
        helperId = senderId;
      }

      // If we still have no helperId, get any non-requester profile
      if (!helperId) {
        const anyOther = await prisma.profile.findFirst({
          where: { NOT: { id: targetRequest.requesterId } },
        }).catch(() => null);
        helperId = anyOther?.id;
      }

      if (helperId) {
        const reward = Number(targetRequest.rewardAmount) || 25000;
        const platformFee = Math.round(reward * 0.08);
        const helperPayout = reward - platformFee;

        // Create or get existing OrderRoom
        const newRoom = await prisma.orderRoom.upsert({
          where: { requestId: targetRequest.id },
          create: {
            requestId: targetRequest.id,
            requesterId: targetRequest.requesterId,
            helperId: helperId,
            lockedAmount: reward,
            platformFee: platformFee,
            helperPayoutAmount: helperPayout,
            orderStatus: "room_created",
          },
          update: {
            helperId: helperId,
          },
          include: { request: true },
        }).catch((err) => {
          console.warn("Auto create OrderRoom error in chat:", err);
          return null;
        });

        if (newRoom) return newRoom;
      }
    }
  }

  return null;
}

/**
 * GET /api/chat/messages?roomId=...
 * Mengambil seluruh riwayat pesan untuk bilik obrolan tertentu dari PostgreSQL.
 */
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const roomId = searchParams.get("roomId");

    if (!roomId) {
      return NextResponse.json({ success: true, data: [] });
    }

    const orderRoom = await resolveOrCreateOrderRoom(roomId);
    if (!orderRoom) {
      return NextResponse.json({ success: true, data: [] });
    }

    const messages = await prisma.chatMessage.findMany({
      where: { orderRoomId: orderRoom.id },
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
      senderAvatar:
        m.sender?.avatarUrl && !m.sender.avatarUrl.includes("images.unsplash.com")
          ? m.sender.avatarUrl
          : null,
      message: m.message,
      attachmentUrls: m.attachmentUrls || [],
      isRead: m.isRead,
      timestamp: new Date(m.createdAt).toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      }).replace(".", ":"),
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

    // Resolusi atau buat bilik OrderRoom resmi di PostgreSQL
    const orderRoom = await resolveOrCreateOrderRoom(orderRoomId, actualSenderId);
    if (!orderRoom) {
      return NextResponse.json(
        { success: false, error: "Ruang obrolan / bilik transaksi tidak ditemukan di database." },
        { status: 404 }
      );
    }

    // Pastikan senderId valid di database profile
    let validSenderId = actualSenderId;
    const isSenderUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(validSenderId).trim());
    if (!isSenderUuid) {
      // Fallback ke requester atau helper dari orderRoom
      validSenderId = orderRoom.requesterId;
    } else {
      const senderExists = await prisma.profile.findUnique({
        where: { id: validSenderId },
      }).catch(() => null);
      if (!senderExists) {
        validSenderId = orderRoom.requesterId;
      }
    }

    // Simpan pesan secara resmi ke tabel chat_messages
    const newMsg = await prisma.chatMessage.create({
      data: {
        orderRoomId: orderRoom.id,
        senderId: validSenderId,
        message: message.trim(),
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
    await prisma.orderRoom
      .update({
        where: { id: orderRoom.id },
        data: { updatedAt: new Date() },
      })
      .catch(() => null);

    return NextResponse.json({
      success: true,
      data: {
        id: newMsg.id,
        orderRoomId: orderRoom.id,
        senderId: newMsg.senderId,
        senderName: newMsg.sender?.fullName || "Pengguna",
        senderAvatar:
          newMsg.sender?.avatarUrl && !newMsg.sender.avatarUrl.includes("images.unsplash.com")
            ? newMsg.sender.avatarUrl
            : null,
        message: newMsg.message,
        attachmentUrls: newMsg.attachmentUrls,
        timestamp: new Date(newMsg.createdAt).toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
        }).replace(".", ":"),
        createdAt: newMsg.createdAt,
      },
    });
  } catch (error) {
    console.error("POST /api/chat/messages Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * PATCH /api/chat/messages
 * Mengedit isi pesan chat di database PostgreSQL.
 */
export async function PATCH(req) {
  try {
    const body = await req.json();
    const { messageId, message } = body;

    if (!messageId || !message || !message.trim()) {
      return NextResponse.json(
        { success: false, error: "messageId dan message baru diperlukan." },
        { status: 400 }
      );
    }

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(messageId).trim());

    if (!isUuid) {
      return NextResponse.json({ success: true, message: "Mock message updated locally." });
    }

    const updated = await prisma.chatMessage.update({
      where: { id: messageId.trim() },
      data: {
        message: message.trim(),
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("PATCH /api/chat/messages Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * DELETE /api/chat/messages?messageId=...
 * Menghapus pesan chat dari database PostgreSQL.
 */
export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const messageId = searchParams.get("messageId");

    if (!messageId) {
      return NextResponse.json(
        { success: false, error: "messageId diperlukan." },
        { status: 400 }
      );
    }

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(messageId).trim());

    if (isUuid) {
      await prisma.chatMessage.delete({
        where: { id: messageId.trim() },
      }).catch((e) => console.warn("Delete chat message warning:", e.message));
    }

    return NextResponse.json({ success: true, message: "Pesan berhasil dihapus." });
  } catch (error) {
    console.error("DELETE /api/chat/messages Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

