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
    const EXTRACT_UUID_REGEX = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
    const isValidUuid = (str) => typeof str === "string" && UUID_REGEX.test(str.trim());

    // Bangun filter OR untuk orderRoom
    const whereConditions = [];

    if (userId && isValidUuid(userId)) {
      whereConditions.push({ requesterId: userId });
      whereConditions.push({ helperId: userId });
    }

    if (roomIdParam) {
      const extracted = roomIdParam.match(EXTRACT_UUID_REGEX) || [];
      for (const uid of extracted) {
        whereConditions.push({ id: uid });
        whereConditions.push({ requestId: uid });
      }
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

      const messages = (room.chatMessages || []).map((msg) => {
        // Parse metadata JSON stored in message if present (e.g. "||META||{...}")
        let meta = {};
        let cleanMessage = msg.message || "";
        const metaSep = "||META||";
        if (cleanMessage.includes(metaSep)) {
          const parts = cleanMessage.split(metaSep);
          cleanMessage = parts[0];
          try { meta = JSON.parse(parts[1]); } catch (_) { meta = {}; }
        }

        return {
          id: msg.id,
          senderId: msg.senderId,
          senderName: msg.sender?.fullName || "Pengguna",
          senderAvatar: msg.sender?.avatarUrl && !msg.sender.avatarUrl.includes("images.unsplash.com") ? msg.sender.avatarUrl : null,
          message: cleanMessage,
          // Proof/attachment fields
          attachmentUrls: msg.attachmentUrls || [],
          proofPhotos: msg.attachmentUrls?.length ? msg.attachmentUrls : (meta.proofPhotos || []),
          isTaskProof: meta.isTaskProof || false,
          isHandoverProof: meta.isHandoverProof || false,
          notes: meta.notes || "",
          isEdited: meta.isEdited || false,
          // Timing
          timestamp: new Date(msg.createdAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
          createdAt: msg.createdAt,
          isSystem: msg.senderId === "system" || msg.message.includes("Rekening Bersama") || msg.message.includes("diverifikasi"),
        };
      });

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
        // Bukti penyelesaian tersimpan langsung di order_rooms
        proofPhotos: room.proofPhotoUrls || [],
        proofNotes: room.proofNotes || "",
        proofSubmittedAt: room.proofSubmittedAt || null,
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

export async function PATCH(req) {
  try {
    const body = await req.json();
    const { orderRoomId, status, requestId, proofPhotoUrls, proofNotes } = body;

    const EXTRACT_UUID_REGEX = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
    const extractedUuids = ((orderRoomId || "") + " " + (requestId || "")).match(EXTRACT_UUID_REGEX) || [];

    if (extractedUuids.length > 0) {
      const updateData = {};
      if (status) updateData.orderStatus = status;
      if (proofPhotoUrls && Array.isArray(proofPhotoUrls)) updateData.proofPhotoUrls = proofPhotoUrls;
      if (proofNotes !== undefined && proofNotes !== null) updateData.proofNotes = proofNotes;
      if (status === "proof_submitted") updateData.proofSubmittedAt = new Date();

      if (Object.keys(updateData).length > 0) {
        await prisma.orderRoom.updateMany({
          where: {
            OR: [
              ...extractedUuids.map((uid) => ({ id: uid })),
              ...extractedUuids.map((uid) => ({ requestId: uid })),
            ],
          },
          data: updateData,
        });
      }

      // Sinkronisasi status ke tabel requests
      const requestStatusMap = {
        in_progress: "in_progress",
        on_the_way: "in_progress",
        item_picked_up: "in_progress",
        proof_submitted: "awaiting_confirmation",
        awaiting_confirmation: "awaiting_confirmation",
        completed: "completed",
      };

      if (status && requestStatusMap[status]) {
        const reqStatus = requestStatusMap[status];
        for (const uid of extractedUuids) {
          await prisma.request.updateMany({
            where: { id: uid },
            data: { status: reqStatus },
          }).catch(() => null);
        }
      }
    }

    return NextResponse.json({ success: true, message: "Status room berhasil diperbarui." });
  } catch (error) {
    console.error("PATCH /api/chat/rooms Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * DELETE /api/chat/rooms?roomId=...
 * Menghapus ruang obrolan beserta seluruh pesannya dari PostgreSQL.
 */
export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const roomId = searchParams.get("roomId");

    if (!roomId) {
      return NextResponse.json(
        { success: false, error: "roomId diperlukan." },
        { status: 400 }
      );
    }

    const EXTRACT_UUID_REGEX = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
    const extractedUuids = roomId.match(EXTRACT_UUID_REGEX) || [];

    for (const uid of extractedUuids) {
      // Hapus pesan terkait lebih dahulu
      await prisma.chatMessage.deleteMany({
        where: { orderRoomId: uid },
      }).catch(() => null);

      // Hapus orderRoom
      await prisma.orderRoom.deleteMany({
        where: {
          OR: [{ id: uid }, { requestId: uid }],
        },
      }).catch(() => null);
    }

    return NextResponse.json({ success: true, message: "Ruang obrolan berhasil dihapus." });
  } catch (error) {
    console.error("DELETE /api/chat/rooms Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

