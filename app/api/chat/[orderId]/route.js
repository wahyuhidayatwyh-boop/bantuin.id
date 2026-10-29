import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth/jwt";

/**
 * Anti-Disintermediation Regex Filter:
 * Detects phone numbers, WhatsApp links, direct bank transfer keywords, and external contacts.
 */
function checkAntiDisintermediation(text) {
  if (!text) return { hasFlag: false, reason: null };

  const phonePattern = /(\+?62|08)[0-9\s\-._]{8,14}/i;
  const waPattern = /(wa\.me|whatsapp|hubungi\s*wa|chat\s*wa)/i;
  const transferPattern = /(transfer\s*langsung|rek\s*pribadi|nomor\s*rekening|bca\s*[0-9]{6,}|mandiri\s*[0-9]{6,}|bri\s*[0-9]{6,})/i;
  const socialPattern = /(line\s*id|instagram\s*:@?|ig\s*:@?|tele\s*:@?)/i;

  if (waPattern.test(text)) {
    return { hasFlag: true, reason: "Terdeteksi rujukan WhatsApp di luar platform." };
  }
  if (phonePattern.test(text)) {
    return { hasFlag: true, reason: "Terdeteksi nomor telepon / ponsel di dalam percakapan." };
  }
  if (transferPattern.test(text)) {
    return { hasFlag: true, reason: "Terdeteksi ajakan transfer rekening langsung di luar sistem escrow Bantuin." };
  }
  if (socialPattern.test(text)) {
    return { hasFlag: true, reason: "Terdeteksi pembagian kontak media sosial eksternal." };
  }

  return { hasFlag: false, reason: null };
}

/**
 * GET /api/chat/[orderId]
 * Task 32: Mengambil riwayat pesan di bilik transaksi terkunci
 */
export async function GET(req, { params }) {
  try {
    const { orderId } = await params;

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

    // 2. Query OrderRoom
    const resolveProfileName = (party, isRoleHelper = true, isRentalOrder = false) => {
      if (!party) return isRoleHelper ? (isRentalOrder ? "Mitra Sewa" : "Helper Bantuin") : "Pemohon";
      const bName = (party.partnerBusinessName || "").trim();
      const fName = (party.fullName || "").trim();
      const ePrefix = (party.email || "").split("@")[0].trim().toLowerCase();

      if (isRentalOrder && isRoleHelper && bName) return bName;
      if ((party.isPartner || party.accountRole === "partner") && bName) return bName;
      if (bName && (!fName || fName.toLowerCase() === ePrefix)) return bName;
      if (fName && fName.toLowerCase() !== ePrefix) return fName;
      return bName || fName || (isRoleHelper ? (isRentalOrder ? "Mitra Sewa" : "Helper Bantuin") : "Pemohon");
    };

    const orderRoom = await prisma.orderRoom.findFirst({
      where: {
        OR: [{ id: orderId }, { requestId: orderId }],
      },
      include: {
        request: {
          select: { title: true, category: true, description: true, rewardAmount: true },
        },
        requester: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
            partnerBusinessName: true,
            accountRole: true,
            isPartner: true,
            email: true,
          },
        },
        helper: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
            partnerBusinessName: true,
            accountRole: true,
            isPartner: true,
            email: true,
          },
        },
      },
    });

    if (!orderRoom) {
      return NextResponse.json(
        { success: false, error: "Bilik transaksi tidak ditemukan." },
        { status: 404 }
      );
    }

    const isRequester = orderRoom.requesterId === userProfile.id;
    const isHelper = orderRoom.helperId === userProfile.id;
    const isAdmin = userProfile.isAdmin;

    if (!isRequester && !isHelper && !isAdmin) {
      return NextResponse.json(
        { success: false, error: "Akses ditolak. Anda bukan pihak dalam bilik transaksi ini." },
        { status: 403 }
      );
    }

    const isRentalOrder = Boolean(
      (orderRoom.request?.description && (orderRoom.request.description.includes("[RENTAL_ID:") || orderRoom.request.description.includes("[BOOKING_ID:") || orderRoom.request.description.toLowerCase().includes("sewa"))) ||
      (orderRoom.request?.title && orderRoom.request.title.toLowerCase().includes("sewa"))
    );

    // 3. Mark unread messages sent by the other party as read
    await prisma.chatMessage.updateMany({
      where: {
        orderRoomId: orderRoom.id,
        senderId: { not: userProfile.id },
        isRead: false,
      },
      data: { isRead: true },
    });

    // 4. Fetch all messages
    const messages = await prisma.chatMessage.findMany({
      where: { orderRoomId: orderRoom.id },
      include: {
        sender: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
            partnerBusinessName: true,
            accountRole: true,
            isPartner: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    const formattedMessages = messages.map((m) => ({
      ...m,
      senderName: resolveProfileName(m.sender, m.senderId === orderRoom.helperId, isRentalOrder),
    }));

    return NextResponse.json({
      success: true,
      data: {
        orderRoom: {
          id: orderRoom.id,
          requestId: orderRoom.requestId,
          orderStatus: orderRoom.orderStatus,
          paymentStatus: orderRoom.paymentStatus,
          lockedAmount: Number(orderRoom.lockedAmount),
          request: orderRoom.request,
          requester: {
            ...orderRoom.requester,
            name: resolveProfileName(orderRoom.requester, false, isRentalOrder),
          },
          helper: {
            ...orderRoom.helper,
            name: resolveProfileName(orderRoom.helper, true, isRentalOrder),
          },
        },
        messages: formattedMessages,
      },
    });
  } catch (err) {
    console.error("[GET /api/chat/[orderId] error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Gagal mengambil pesan bilik chat." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/chat/[orderId]
 * Task 33: Mengirim pesan chat dengan sensor anti-disintermediasi
 */
export async function POST(req, { params }) {
  try {
    const { orderId } = await params;

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

    // 2. Query OrderRoom
    const orderRoom = await prisma.orderRoom.findFirst({
      where: {
        OR: [{ id: orderId }, { requestId: orderId }],
      },
      include: {
        request: { select: { title: true } },
      },
    });

    if (!orderRoom) {
      return NextResponse.json(
        { success: false, error: "Bilik transaksi tidak ditemukan." },
        { status: 404 }
      );
    }

    const isRequester = orderRoom.requesterId === userProfile.id;
    const isHelper = orderRoom.helperId === userProfile.id;
    const isAdmin = userProfile.isAdmin;

    if (!isRequester && !isHelper && !isAdmin) {
      return NextResponse.json(
        { success: false, error: "Akses ditolak. Anda bukan pihak dalam bilik transaksi ini." },
        { status: 403 }
      );
    }

    // 3. Parse Body
    const body = await req.json().catch(() => ({}));
    const { message, attachmentUrls = [] } = body;

    if (!message && (!attachmentUrls || attachmentUrls.length === 0)) {
      return NextResponse.json(
        { success: false, error: "Pesan atau lampiran tidak boleh kosong." },
        { status: 400 }
      );
    }

    const attachments = Array.isArray(attachmentUrls) ? attachmentUrls : [attachmentUrls];

    // 4. Sensor Anti-Disintermediasi
    const sensorCheck = checkAntiDisintermediation(message || "");

    // 5. Create ChatMessage in DB
    const newMessage = await prisma.$transaction(async (tx) => {
      const chat = await tx.chatMessage.create({
        data: {
          orderRoomId: orderRoom.id,
          senderId: userProfile.id,
          message: message ? message.trim() : "",
          attachmentUrls: attachments,
          hasWarningFlag: sensorCheck.hasFlag,
          warningReason: sensorCheck.reason,
          isRead: false,
        },
        include: {
          sender: {
            select: { id: true, fullName: true, avatarUrl: true },
          },
        },
      });

      // Notify the other party
      const recipientId = isRequester ? orderRoom.helperId : orderRoom.requesterId;
      await tx.notification.create({
        data: {
          userId: recipientId,
          title: `Pesan baru dari ${userProfile.fullName}`,
          message: message ? (message.length > 80 ? message.slice(0, 77) + "..." : message) : "Mengirim lampiran",
          type: "order",
          link: `/chat?room=${orderRoom.id}`,
        },
      });

      return chat;
    });

    return NextResponse.json(
      {
        success: true,
        data: newMessage,
        warning: sensorCheck.hasFlag
          ? "Peringatan: Pesan Anda ditandai oleh sistem karena terdeteksi mengandung kontak atau instruksi transaksi di luar platform."
          : null,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[POST /api/chat/[orderId] error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Gagal mengirim pesan chat." },
      { status: 500 }
    );
  }
}
