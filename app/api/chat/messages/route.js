import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth/jwt";
import { detectDisintermediation, detectProhibitedContent } from "@/lib/security";

const UUID_REGEX = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;

/**
 * Resolves an OrderRoom from the database, or auto-creates one if
 * the room was initiated as an inquiry or using a Request ID.
 * Strictly isolates rooms by (requestId, helperId) so different helpers
 * get their own dedicated rooms with the requester.
 */
async function resolveOrCreateOrderRoom(orderRoomId, senderId = null) {
  if (!orderRoomId || typeof orderRoomId !== "string") return null;

  const cleanId = orderRoomId.trim();

  // 1. Direct match by OrderRoom.id (if valid UUID)
  const isDirectUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanId);
  if (isDirectUuid) {
    let directRoom = await prisma.orderRoom.findFirst({
      where: {
        OR: [
          { id: cleanId },
          { requestId: cleanId },
        ],
      },
      include: { request: true },
    }).catch(() => null);
    if (directRoom) return directRoom;

    // Check if cleanId is a rentalBooking ID
    const booking = await prisma.rentalBooking.findUnique({
      where: { id: cleanId },
      select: { id: true, midtransOrderId: true },
    }).catch(() => null);
    if (booking) {
      directRoom = await prisma.orderRoom.findFirst({
        where: {
          OR: [
            ...(booking.midtransOrderId ? [{ midtransOrderId: booking.midtransOrderId }] : []),
            { request: { description: { contains: `[BOOKING_ID:${booking.id}]` } } },
          ],
        },
        include: { request: true },
      }).catch(() => null);
      if (directRoom) return directRoom;
    }
  }

  // 2. Extract UUIDs if formatted like "inquiry-[requestId]-[helperId]" or "inquiry-[requestId]-[requesterId]-[helperId]"
  const uuids = cleanId.match(UUID_REGEX) || [];
  if (uuids.length === 0) return null;

  // Temukan UUID mana yang merupakan requestId
  let targetRequest = null;
  let targetRequestId = null;
  for (const uid of uuids) {
    const r = await prisma.request.findUnique({
      where: { id: uid },
      include: { offers: true },
    }).catch(() => null);
    if (r) {
      targetRequest = r;
      targetRequestId = r.id;
      break;
    }
  }

  if (targetRequest) {
    // Tentukan helperId spesifik untuk room ini:
    // Jika senderId bukan requester, maka senderId adalah helper
    let targetHelperId = null;
    if (senderId && senderId !== targetRequest.requesterId) {
      targetHelperId = senderId;
    }
    // Jika senderId adalah requester, cari UUID lain di room string yang bukan requestId & bukan requesterId
    if (!targetHelperId) {
      for (const uid of uuids) {
        if (uid !== targetRequestId && uid !== targetRequest.requesterId) {
          targetHelperId = uid;
          break;
        }
      }
    }
    // Jika masih belum dapat dan ada selectedHelperId:
    if (!targetHelperId && targetRequest.selectedHelperId) {
      targetHelperId = targetRequest.selectedHelperId;
    }

    if (targetHelperId) {
      // Cari OrderRoom khusus untuk pasangan (requestId, helperId) ini
      let room = await prisma.orderRoom.findFirst({
        where: {
          requestId: targetRequestId,
          helperId: targetHelperId,
        },
        include: { request: true },
      }).catch(() => null);

      if (room) return room;

      // Buat OrderRoom baru khusus helper ini jika belum ada di database
      const reward = Number(targetRequest.rewardAmount) || 25000;
      const platformFee = Math.round(reward * 0.08);
      const helperPayout = reward - platformFee;

      room = await prisma.orderRoom.create({
        data: {
          requestId: targetRequestId,
          requesterId: targetRequest.requesterId,
          helperId: targetHelperId,
          lockedAmount: reward,
          platformFee: platformFee,
          helperPayoutAmount: helperPayout,
          orderStatus: "room_created",
        },
        include: { request: true },
      }).catch((err) => {
        console.warn("Auto create OrderRoom error in chat:", err);
        return null;
      });

      if (room) return room;
    }
  }

  // 3. Fallback jika salah satu UUID adalah serviceId dari tabel services
  for (const uid of uuids) {
    const s = await prisma.service.findUnique({
      where: { id: uid },
      include: { provider: true },
    }).catch(() => null);

    if (s) {
      const targetHelperId = s.providerId;
      let targetRequesterId = senderId && senderId !== targetHelperId ? senderId : null;
      if (!targetRequesterId) {
        for (const u of uuids) {
          if (u !== s.id && u !== targetHelperId) {
            targetRequesterId = u;
            break;
          }
        }
      }

      if (targetRequesterId) {
        let existingRoom = await prisma.orderRoom.findFirst({
          where: {
            helperId: targetHelperId,
            requesterId: targetRequesterId,
            request: {
              title: { contains: s.title.slice(0, 30) },
            },
          },
          include: { request: true },
        }).catch(() => null);

        if (existingRoom) return existingRoom;

        const newReq = await prisma.request.create({
          data: {
            requesterId: targetRequesterId,
            category: s.category || "Desain Grafis",
            title: `Pemesanan Jasa: ${s.title.slice(0, 70)}`,
            description: `Diskusi & pemesanan jasa ${s.title}`,
            mode: "online",
            locationName: "Online / Kampus",
            deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
            rewardAmount: s.startingPrice,
            status: "helper_selected",
            selectedHelperId: targetHelperId,
          },
        }).catch(() => null);

        if (newReq) {
          const newRoom = await prisma.orderRoom.create({
            data: {
              requestId: newReq.id,
              requesterId: targetRequesterId,
              helperId: targetHelperId,
              lockedAmount: s.startingPrice,
              platformFee: 0,
              helperPayoutAmount: s.startingPrice,
              orderStatus: "room_created",
              paymentStatus: "UNPAID",
            },
            include: { request: true },
          }).catch(() => null);

          if (newRoom) return newRoom;
        }
      }
    }
  }

  // 4. Fallback jika salah satu UUID adalah rentalId dari tabel rentals
  for (const uid of uuids) {
    const rent = await prisma.rental.findUnique({
      where: { id: uid },
      include: { owner: true },
    }).catch(() => null);

    if (rent) {
      const targetHelperId = rent.ownerId;
      let targetRequesterId = senderId && senderId !== targetHelperId ? senderId : null;
      if (!targetRequesterId) {
        for (const u of uuids) {
          if (u !== rent.id && u !== targetHelperId) {
            targetRequesterId = u;
            break;
          }
        }
      }

      if (targetRequesterId) {
        let existingRoom = await prisma.orderRoom.findFirst({
          where: {
            helperId: targetHelperId,
            requesterId: targetRequesterId,
            request: {
              title: { contains: rent.title.slice(0, 30) },
            },
          },
          include: { request: true },
        }).catch(() => null);

        if (existingRoom) return existingRoom;

        const newReq = await prisma.request.create({
          data: {
            requesterId: targetRequesterId,
            category: "Sewa Alat & Kendaraan",
            title: `Sewa: ${rent.title.slice(0, 60)}`,
            description: `Diskusi & penyewaan alat ${rent.title}`,
            mode: "offline",
            locationName: rent.address || "Toko Mitra Sewa",
            deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            rewardAmount: rent.dailyPrice,
            status: "helper_selected",
            selectedHelperId: targetHelperId,
          },
        }).catch(() => null);

        if (newReq) {
          const daily = Number(rent.dailyPrice) || 0;
          const newRoom = await prisma.orderRoom.create({
            data: {
              requestId: newReq.id,
              requesterId: targetRequesterId,
              helperId: targetHelperId,
              lockedAmount: daily,
              platformFee: Math.round(daily * 0.08),
              helperPayoutAmount: Math.round(daily * 0.92),
              orderStatus: "room_created",
              paymentStatus: "UNPAID",
            },
            include: { request: true },
          }).catch(() => null);

          if (newRoom) return newRoom;
        }
      }
    }
  }

  // 4b. Fallback jika salah satu UUID adalah bookingId dari tabel rental_bookings
  for (const uid of uuids) {
    const booking = await prisma.rentalBooking.findUnique({
      where: { id: uid },
      include: { rental: true, renter: true, owner: true },
    }).catch(() => null);

    if (booking) {
      const targetHelperId = booking.ownerId;
      const targetRequesterId = booking.renterId;

      // Cari OrderRoom yang sudah mengaitkan booking ini atau midtransOrderId yang sama
      let existingRoom = await prisma.orderRoom.findFirst({
        where: {
          OR: [
            ...(booking.midtransOrderId ? [{ midtransOrderId: booking.midtransOrderId }] : []),
            {
              helperId: targetHelperId,
              requesterId: targetRequesterId,
              request: {
                description: { contains: `[BOOKING_ID:${booking.id}]` },
              },
            },
            {
              helperId: targetHelperId,
              requesterId: targetRequesterId,
              request: {
                category: { contains: "Sewa" },
                title: { contains: (booking.rental?.title || "").slice(0, 30) },
              },
            },
          ],
        },
        include: { request: true },
      }).catch(() => null);

      if (existingRoom) {
        if (booking.bookingStatus === "payment_held" && existingRoom.paymentStatus !== "PAID") {
          await prisma.orderRoom.update({
            where: { id: existingRoom.id },
            data: { paymentStatus: "PAID" },
          }).catch(() => null);
        }
        return existingRoom;
      }

      // Buat request dan OrderRoom baru khusus transaksi sewa ini
      const rentalTitle = booking.rental?.title || "Unit Sewa";
      const totalDays = booking.totalDays || 1;
      const rentalFee = Number(booking.rentalFee || 0);

      const newReq = await prisma.request.create({
        data: {
          requesterId: targetRequesterId,
          category: "Sewa Alat & Kendaraan",
          title: `Sewa: ${rentalTitle.slice(0, 60)} (${totalDays} Hari)`,
          description: `[RENTAL_ID:${booking.rentalId}] [BOOKING_ID:${booking.id}] Transaksi sewa unit ${rentalTitle}`,
          mode: "offline",
          locationName: booking.rental?.pickupLocation || "Toko Mitra Sewa",
          deadline: booking.endDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          rewardAmount: rentalFee,
          status: "helper_selected",
          selectedHelperId: targetHelperId,
        },
      }).catch(() => null);

      if (newReq) {
        const isPaid = booking.bookingStatus !== "temp_locked" && booking.paymentStatus === "PAID";
        const newRoom = await prisma.orderRoom.create({
          data: {
            requestId: newReq.id,
            requesterId: targetRequesterId,
            helperId: targetHelperId,
            lockedAmount: rentalFee,
            platformFee: 0,
            helperPayoutAmount: rentalFee,
            midtransOrderId: null,
            orderStatus: "room_created",
            paymentStatus: isPaid ? "PAID" : "UNPAID",
            paidAt: booking.paidAt || (isPaid ? new Date() : null),
          },
          include: { request: true },
        }).catch(() => null);

        if (newRoom) return newRoom;
      }
    }
  }

  // 5. Fallback jika salah satu UUID adalah partnerId / profileId mitra
  if (senderId) {
    for (const uid of uuids) {
      if (uid !== senderId) {
        const partnerProfile = await prisma.profile.findUnique({
          where: { id: uid },
        }).catch(() => null);

        if (partnerProfile) {
          const targetHelperId = partnerProfile.id;
          const targetRequesterId = senderId;

          let existingRoom = await prisma.orderRoom.findFirst({
            where: {
              OR: [
                { helperId: targetHelperId, requesterId: targetRequesterId },
                { helperId: targetRequesterId, requesterId: targetHelperId },
              ],
            },
            include: { request: true },
          }).catch(() => null);

          if (existingRoom) return existingRoom;

          const partnerName = partnerProfile.partnerBusinessName || partnerProfile.fullName || "Mitra";
          const newReq = await prisma.request.create({
            data: {
              requesterId: targetRequesterId,
              category: partnerProfile.isPartner ? "Sewa Alat & Kendaraan" : "Diskusi Pengguna",
              title: `Konsultasi: ${partnerName}`,
              description: `Ruang obrolan langsung dengan ${partnerName}`,
              mode: "offline",
              locationName: partnerProfile.partnerAddress || "Lokasi Mitra",
              deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
              rewardAmount: 0,
              status: "helper_selected",
              selectedHelperId: targetHelperId,
            },
          }).catch(() => null);

          if (newReq) {
            const newRoom = await prisma.orderRoom.create({
              data: {
                requestId: newReq.id,
                requesterId: targetRequesterId,
                helperId: targetHelperId,
                lockedAmount: 0,
                platformFee: 0,
                helperPayoutAmount: 0,
                orderStatus: "room_created",
                paymentStatus: "UNPAID",
              },
              include: { request: true },
            }).catch(() => null);

            if (newRoom) return newRoom;
          }
        }
      }
    }
  }

  // 6. Fallback: cek jika ada UUID yang langsung cocok dengan OrderRoom.id
  for (const uid of uuids) {
    const r = await prisma.orderRoom.findFirst({
      where: { id: uid },
      include: { request: true },
    }).catch(() => null);
    if (r) return r;
  }

  return null;
}

function resolveSenderName(party, isRoleHelper = true, isRentalOrder = false) {
  if (!party) return isRoleHelper ? (isRentalOrder ? "Mitra Sewa" : "Helper Bantuin") : "Pemohon";
  const bName = (party.partnerBusinessName || "").trim();
  const fName = (party.fullName || "").trim();
  const ePrefix = (party.email || "").split("@")[0].trim().toLowerCase();

  if (isRentalOrder && isRoleHelper && bName) return bName;
  if ((party.isPartner || party.accountRole === "partner") && bName) return bName;
  if (bName && (!fName || fName.toLowerCase() === ePrefix)) return bName;
  if (fName && fName.toLowerCase() !== ePrefix) return fName;
  return bName || fName || (isRoleHelper ? (isRentalOrder ? "Mitra Sewa" : "Helper Bantuin") : "Pemohon");
}

/**
 * GET /api/chat/messages?roomId=...
 * Mengambil seluruh riwayat pesan untuk bilik obrolan tertentu dari PostgreSQL.
 * Wajib memverifikasi bahwa akun yang meminta adalah partisipan room tersebut.
 */
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const roomId = searchParams.get("roomId");

    if (!roomId) {
      return NextResponse.json({ success: true, data: [] });
    }

    // Ekstraksi Token Otentikasi
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
    let isAdminUser = false;
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
        if (profile) {
          userId = profile.id;
          isAdminUser = Boolean(profile.isAdmin);
        }
      }
    }

    // SEC-05: Wajib autentikasi untuk membaca pesan percakapan privat
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Akses ditolak. Silakan login terlebih dahulu.", data: [] },
        { status: 401 }
      );
    }

    if (!globalThis.__bantuin_presence_map) {
      globalThis.__bantuin_presence_map = new Map();
    }
    globalThis.__bantuin_presence_map.set(userId, Date.now());

    const orderRoom = await resolveOrCreateOrderRoom(roomId, userId);
    if (!orderRoom) {
      return NextResponse.json({ success: true, data: [] });
    }

    // SEC-05: Pastikan user yang login adalah partisipan room ini (requester, helper, atau admin)
    if (orderRoom.requesterId !== userId && orderRoom.helperId !== userId && !isAdminUser) {
      return NextResponse.json(
        { success: false, error: "Anda bukan partisipan dalam ruang obrolan ini.", data: [] },
        { status: 403 }
      );
    }

    // HANYA tandai seluruh pesan pihak lawan sebagai telah dibaca jika parameter markRead dikirim secara eksplisit
    const markReadExplicit = searchParams.get("markRead") === "true" || searchParams.get("markRead") === "1";
    if (userId && markReadExplicit) {
      await prisma.chatMessage.updateMany({
        where: {
          orderRoomId: orderRoom.id,
          senderId: { not: userId },
          isRead: false,
        },
        data: {
          isRead: true,
        },
      }).catch((e) => console.warn("Mark as read in GET messages error:", e.message));
    }

    const isRentalOrder = Boolean(
      (orderRoom.request?.description && (orderRoom.request.description.includes("[RENTAL_ID:") || orderRoom.request.description.includes("[BOOKING_ID:") || orderRoom.request.description.toLowerCase().includes("sewa"))) ||
      (orderRoom.request?.title && orderRoom.request.title.toLowerCase().includes("sewa"))
    );

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

    const formatted = messages
      .filter((m) => {
        let clean = m.message || "";
        if (clean.includes("||META||")) clean = clean.split("||META||")[0];
        if (detectDisintermediation(clean).flagged) return false;
        if (detectProhibitedContent(clean).flagged) return false;
        return true;
      })
      .map((m) => {
      let clean = m.message || "";
      let meta = {};
      const metaSep = "||META||";
      if (clean.includes(metaSep)) {
        const parts = clean.split(metaSep);
        clean = parts[0];
        try { meta = JSON.parse(parts[1]); } catch (_) {}
      }
      const photos = (m.attachmentUrls && m.attachmentUrls.length > 0)
        ? m.attachmentUrls
        : (meta.photos || (meta.attachment?.url ? [meta.attachment.url] : (meta.proofPhotos || [])));

      const isDeliverableNotice = clean.includes("Penyedia jasa telah menyerahkan hasil pekerjaan");
      const isJasaDeliverablesProof = Boolean(meta.isJasaDeliverablesProof || isDeliverableNotice);
      let proofData = meta.proofData || null;
      if (isDeliverableNotice && !proofData) {
        proofData = {
          serviceTitle: "Layanan Jasa",
          submissionUrl: "-",
          files: [],
          notes: meta.notes || "",
          submittedAt: new Date(m.createdAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
        };
      }

      const isRevisionNotice = clean.includes("[PERMINTAAN REVISI]:");
      const isRevisionRequest = Boolean(meta.isRevisionRequest || isRevisionNotice);

      return {
        id: m.id,
        clientMessageId: meta.clientMessageId || null,
        senderId: m.senderId,
        senderName: resolveSenderName(m.sender, m.senderId === orderRoom.helperId, isRentalOrder),
        senderAvatar:
          m.sender?.avatarUrl && !m.sender.avatarUrl.includes("images.unsplash.com")
            ? m.sender.avatarUrl
            : null,
        message: clean,
        attachmentUrls: m.attachmentUrls || [],
        photos,
        attachment: meta.attachment || (photos.length > 0 ? { name: "Lampiran Foto", url: photos[0], isImage: true } : null),
        proofPhotos: m.attachmentUrls?.length ? m.attachmentUrls : (meta.proofPhotos || []),
        isTaskProof: meta.isTaskProof || false,
        isHandoverProof: meta.isHandoverProof || false,
        isJasaDeliverablesProof,
        proofData,
        isRevisionRequest,
        isJasaCompletion: meta.isJasaCompletion || false,
        completionData: meta.completionData || null,
        isSystemAnnouncement: meta.isSystemAnnouncement || false,
        digitalFiles: meta.digitalFiles || meta.proofData?.files || [],
        submissionUrl: meta.submissionUrl || meta.proofData?.submissionUrl || null,
        isOnline: meta.isOnline !== undefined ? meta.isOnline : Boolean((meta.digitalFiles && meta.digitalFiles.length > 0) || meta.submissionUrl),
        notes: meta.notes || "",
        isEdited: meta.isEdited || false,
        isRead: Boolean(m.isRead),
        isDelivered: Boolean(m.isRead) || (() => {
          const opponentId = m.senderId === orderRoom.requesterId ? orderRoom.helperId : orderRoom.requesterId;
          const opponentMem = globalThis.__bantuin_presence_map?.get(opponentId) || 0;
          return (Date.now() - opponentMem) <= 90000;
        })(),
        isSent: true,
        status: m.isRead ? "read" : ((() => {
          const opponentId = m.senderId === orderRoom.requesterId ? orderRoom.helperId : orderRoom.requesterId;
          const opponentMem = globalThis.__bantuin_presence_map?.get(opponentId) || 0;
          return (Date.now() - opponentMem) <= 90000;
        })() ? "delivered" : "sent"),
        timestamp: new Date(m.createdAt).toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
          timeZone: "Asia/Jakarta",
        }).replace(".", ":"),
        createdAt: m.createdAt,
      };
    });

    return NextResponse.json({ success: true, data: formatted });
  } catch (error) {
    console.error("GET /api/chat/messages Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// Global idempotency cache & in-flight promises untuk mencegah balapan (race condition)
const idempotencyCache = globalThis.__bantuin_msg_idempotency || new Map();
globalThis.__bantuin_msg_idempotency = idempotencyCache;

const inFlightMessages = globalThis.__bantuin_msg_inflight || new Map();
globalThis.__bantuin_msg_inflight = inFlightMessages;

/**
 * POST /api/chat/messages
 * Mengirim dan menyimpan pesan baru ke tabel chat_messages di PostgreSQL.
 * Dilengkapi idempotensi berbasis clientMessageId untuk mencegah pesan ganda saat network retry atau double submit.
 */
export async function POST(req) {
  try {
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
    let isAdminUser = false;
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
        if (profile) {
          userId = profile.id;
          isAdminUser = Boolean(profile.isAdmin);
        }
      }
    }

    // SEC-05: Wajib autentikasi dan gunakan identitas dari JWT, jangan pernah percaya senderId dari body
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Akses ditolak. Silakan login terlebih dahulu." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { orderRoomId, message, attachmentUrls = [] } = body;
    const clientMessageId = body.clientMessageId || body.client_message_id || null;

    const actualSenderId = userId;

    if (!orderRoomId || !message || !actualSenderId) {
      return NextResponse.json(
        { success: false, error: "orderRoomId dan message diperlukan." },
        { status: 400 }
      );
    }

    // Proteksi Keamanan: Blokir langsung pengiriman kontak pribadi / nomor HP / WA / transaksi luar
    let checkMsg = message.trim();
    if (checkMsg.includes("||META||")) {
      checkMsg = checkMsg.split("||META||")[0];
    }
    const disCheck = detectDisintermediation(checkMsg);
    if (disCheck.flagged) {
      return NextResponse.json(
        {
          success: false,
          error: "Pesan diblokir: Terdeteksi nomor kontak / transaksi luar.",
          reason: disCheck.reason,
        },
        { status: 400 }
      );
    }
    const prohibitedCheck = detectProhibitedContent(checkMsg);
    if (prohibitedCheck.flagged) {
      return NextResponse.json(
        {
          success: false,
          error: `Pesan diblokir: Pelanggaran ${prohibitedCheck.category}`,
          reason: prohibitedCheck.reason,
        },
        { status: 400 }
      );
    }

    // 1. Idempotency Fast Path: Cek in-flight promise (jika request identik sedang diproses bersamaan)
    if (clientMessageId && inFlightMessages.has(clientMessageId)) {
      const existingPromise = inFlightMessages.get(clientMessageId);
      const res = await existingPromise;
      return NextResponse.json(res);
    }

    // 2. Idempotency Fast Path: Cek memory cache (jika baru saja diproses dalam 60 detik)
    if (clientMessageId && idempotencyCache.has(clientMessageId)) {
      const cached = idempotencyCache.get(clientMessageId);
      return NextResponse.json({
        success: true,
        data: cached,
        isDuplicateSuppressed: true,
      });
    }

    // Resolusi atau buat bilik OrderRoom resmi di PostgreSQL
    const orderRoom = await resolveOrCreateOrderRoom(orderRoomId, actualSenderId);
    if (!orderRoom) {
      return NextResponse.json(
        { success: false, error: "Ruang obrolan / bilik transaksi tidak ditemukan di database." },
        { status: 404 }
      );
    }

    // Pastikan sender adalah requester, helper, atau admin dari orderRoom ini
    if (orderRoom.requesterId !== actualSenderId && orderRoom.helperId !== actualSenderId && !isAdminUser) {
      return NextResponse.json(
        { success: false, error: "Anda bukan partisipan dalam ruang obrolan ini." },
        { status: 403 }
      );
    }

    const validSenderId = actualSenderId;

    const isRentalOrder = Boolean(
      (orderRoom.request?.description && (orderRoom.request.description.includes("[RENTAL_ID:") || orderRoom.request.description.includes("[BOOKING_ID:") || orderRoom.request.description.toLowerCase().includes("sewa"))) ||
      (orderRoom.request?.title && orderRoom.request.title.toLowerCase().includes("sewa"))
    );

    // 3. Cek Database untuk clientMessageId yang sudah tersimpan sebelumnya
    if (clientMessageId) {
      const existingByClient = await prisma.chatMessage.findFirst({
        where: {
          orderRoomId: orderRoom.id,
          message: { contains: clientMessageId },
        },
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
      }).catch(() => null);

      if (existingByClient) {
        let cleanMsg = existingByClient.message;
        if (cleanMsg.includes("||META||")) {
          cleanMsg = cleanMsg.split("||META||")[0];
        }
        const dataPayload = {
          id: existingByClient.id,
          clientMessageId,
          orderRoomId: existingByClient.orderRoomId,
          senderId: existingByClient.senderId,
          senderName: resolveSenderName(existingByClient.sender, existingByClient.senderId === orderRoom.helperId, isRentalOrder),
          senderAvatar: existingByClient.sender?.avatarUrl,
          message: cleanMsg,
          attachmentUrls: existingByClient.attachmentUrls,
          timestamp: new Date(existingByClient.createdAt).toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
            timeZone: "Asia/Jakarta",
          }).replace(".", ":"),
          createdAt: existingByClient.createdAt,
        };
        idempotencyCache.set(clientMessageId, dataPayload);
        return NextResponse.json({
          success: true,
          data: dataPayload,
          isDuplicateSuppressed: true,
        });
      }
    }

    // 4. Fallback Micro-Debounce (HANYA jika clientMessageId tidak dikirimkan, proteksi double-click 600ms)
    let cleanMsg = message.trim();
    let meta = {};
    const metaSep = "||META||";
    if (cleanMsg.includes(metaSep)) {
      const parts = cleanMsg.split(metaSep);
      cleanMsg = parts[0];
      try { meta = JSON.parse(parts[1]); } catch (_) { meta = {}; }
    }
    if (clientMessageId) {
      meta.clientMessageId = clientMessageId;
    }

    if (!clientMessageId) {
      const sixHundredMsAgo = new Date(Date.now() - 600);
      const duplicateMessage = await prisma.chatMessage.findFirst({
        where: {
          orderRoomId: orderRoom.id,
          senderId: validSenderId,
          message: { startsWith: cleanMsg },
          createdAt: { gte: sixHundredMsAgo },
        },
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
        orderBy: { createdAt: "desc" },
      }).catch(() => null);

      if (duplicateMessage) {
        return NextResponse.json({
          success: true,
          data: {
            id: duplicateMessage.id,
            orderRoomId: duplicateMessage.orderRoomId,
            senderId: duplicateMessage.senderId,
            senderName: resolveSenderName(duplicateMessage.sender, duplicateMessage.senderId === orderRoom.helperId, isRentalOrder),
            senderAvatar: duplicateMessage.sender?.avatarUrl,
            message: cleanMsg,
            attachmentUrls: duplicateMessage.attachmentUrls,
            createdAt: duplicateMessage.createdAt,
            isDuplicateSuppressed: true,
          },
        });
      }
    }

    // 5. Simpan pesan secara resmi ke tabel chat_messages
    const messageToStore = Object.keys(meta).length > 0
      ? `${cleanMsg}||META||${JSON.stringify(meta)}`
      : cleanMsg;

    // Mutex promise untuk inFlightMessages
    const executionPromise = (async () => {
      const newMsg = await prisma.chatMessage.create({
        data: {
          orderRoomId: orderRoom.id,
          senderId: validSenderId,
          message: messageToStore,
          attachmentUrls,
        },
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
      });

      // Update timestamp order_rooms
      await prisma.orderRoom
        .update({
          where: { id: orderRoom.id },
          data: { updatedAt: new Date() },
        })
        .catch(() => null);

      const photos = (newMsg.attachmentUrls && newMsg.attachmentUrls.length > 0)
        ? newMsg.attachmentUrls
        : (meta.photos || (meta.attachment?.url ? [meta.attachment.url] : (meta.proofPhotos || [])));

      const responsePayload = {
        id: newMsg.id,
        clientMessageId: clientMessageId || null,
        orderRoomId: orderRoom.id,
        senderId: newMsg.senderId,
        senderName: resolveSenderName(newMsg.sender, newMsg.senderId === orderRoom.helperId, isRentalOrder),
        senderAvatar:
          newMsg.sender?.avatarUrl && !newMsg.sender.avatarUrl.includes("images.unsplash.com")
            ? newMsg.sender.avatarUrl
            : null,
        message: cleanMsg,
        attachmentUrls: newMsg.attachmentUrls,
        photos,
        attachment: meta.attachment || (photos.length > 0 ? { name: "Lampiran Foto", url: photos[0], isImage: true } : null),
        proofPhotos: newMsg.attachmentUrls?.length ? newMsg.attachmentUrls : (meta.proofPhotos || []),
        isTaskProof: meta.isTaskProof || false,
        isHandoverProof: meta.isHandoverProof || false,
        isJasaDeliverablesProof: meta.isJasaDeliverablesProof || false,
        proofData: meta.proofData || null,
        isRevisionRequest: meta.isRevisionRequest || false,
        isJasaCompletion: meta.isJasaCompletion || false,
        completionData: meta.completionData || null,
        isSystemAnnouncement: meta.isSystemAnnouncement || false,
        digitalFiles: meta.digitalFiles || meta.proofData?.files || [],
        submissionUrl: meta.submissionUrl || meta.proofData?.submissionUrl || null,
        isOnline: meta.isOnline !== undefined ? meta.isOnline : Boolean((meta.digitalFiles && meta.digitalFiles.length > 0) || meta.submissionUrl),
        notes: meta.notes || "",
        isRead: false,
        isDelivered: (() => {
          const rId = (orderRoom.requesterId === newMsg.senderId) ? orderRoom.helperId : orderRoom.requesterId;
          const rMem = globalThis.__bantuin_presence_map?.get(rId) || 0;
          return (Date.now() - rMem) <= 90000;
        })(),
        isSent: true,
        status: (() => {
          const rId = (orderRoom.requesterId === newMsg.senderId) ? orderRoom.helperId : orderRoom.requesterId;
          const rMem = globalThis.__bantuin_presence_map?.get(rId) || 0;
          return (Date.now() - rMem) <= 90000;
        })() ? "delivered" : "sent",
        timestamp: new Date(newMsg.createdAt).toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
          timeZone: "Asia/Jakarta",
        }).replace(".", ":"),
        createdAt: newMsg.createdAt,
      };

      // Buat notifikasi in-app otomatis ke lawan bicara (penerima pesan)
      try {
        const recipientId = (orderRoom.requesterId === newMsg.senderId)
          ? orderRoom.helperId
          : orderRoom.requesterId;

        if (recipientId && recipientId !== newMsg.senderId) {
          const senderName = resolveSenderName(newMsg.sender, newMsg.senderId === orderRoom.helperId, isRentalOrder);
          const snippet = cleanMsg.length > 70 ? cleanMsg.slice(0, 67) + "..." : cleanMsg;

          // Cek cegah duplikasi notifikasi dalam 1 menit terakhir untuk bilik yang sama
          const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
          const recentNotif = await prisma.notification.findFirst({
            where: {
              userId: recipientId,
              link: `/chat?room=${orderRoom.id}`,
              createdAt: { gte: oneMinuteAgo },
            },
          });

          if (!recentNotif) {
            await prisma.notification.create({
              data: {
                userId: recipientId,
                title: `Pesan Baru dari ${senderName}`,
                message: snippet,
                link: `/chat?room=${orderRoom.id}`,
                type: "order",
                isRead: false,
              },
            });
          }
        }
      } catch (notifErr) {
        console.warn("Failed to create chat notification:", notifErr.message);
      }

      if (clientMessageId) {
        idempotencyCache.set(clientMessageId, responsePayload);
        // Hapus dari memory cache setelah 60 detik agar memory tetap hemat
        setTimeout(() => idempotencyCache.delete(clientMessageId), 60000);
      }

      return { success: true, data: responsePayload };
    })();

    if (clientMessageId) {
      inFlightMessages.set(clientMessageId, executionPromise);
    }

    const result = await executionPromise;
    if (clientMessageId) {
      inFlightMessages.delete(clientMessageId);
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("POST /api/chat/messages Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * PATCH /api/chat/messages
 * Mengedit isi pesan chat di database PostgreSQL (Wajib autentikasi & kepemilikan pesan).
 */
export async function PATCH(req) {
  try {
    const authHeader = req.headers.get("authorization");
    let token = null;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7).trim();
    }
    if (!token) {
      const cookieHeader = req.headers.get("cookie") || "";
      const match = cookieHeader.match(/bantuin_auth_token=([^;]+)/) || cookieHeader.match(/bantuin_token=([^;]+)/);
      if (match) token = decodeURIComponent(match[1]).trim();
    }

    let userId = null;
    let isAdminUser = false;
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
        if (profile) {
          userId = profile.id;
          isAdminUser = Boolean(profile.isAdmin);
        }
      }
    }

    // SEC-05: Wajib autentikasi untuk semua operasi PATCH pesan chat
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Akses ditolak. Silakan login terlebih dahulu." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { messageId, message, action, roomId } = body;

    // Handle aksi tandai telah dibaca (mark_read)
    if (action === "mark_read" || (!messageId && roomId)) {
      const targetRoom = roomId ? String(roomId).trim() : null;
      if (targetRoom) {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetRoom);
        if (isUuid) {
          const roomRecord = await prisma.orderRoom.findUnique({
            where: { id: targetRoom },
            select: { requesterId: true, helperId: true },
          });
          if (!roomRecord || (roomRecord.requesterId !== userId && roomRecord.helperId !== userId && !isAdminUser)) {
            return NextResponse.json(
              { success: false, error: "Anda bukan partisipan dalam ruang obrolan ini." },
              { status: 403 }
            );
          }
          await prisma.chatMessage.updateMany({
            where: {
              orderRoomId: targetRoom,
              senderId: { not: userId },
              isRead: false,
            },
            data: { isRead: true },
          }).catch((e) => console.warn("Mark read PATCH error:", e.message));
        }
      }

      return NextResponse.json({ success: true, message: "Semua pesan berhasil ditandai telah dibaca." });
    }

    if (!messageId || !message || !message.trim()) {
      return NextResponse.json(
        { success: false, error: "messageId dan message baru diperlukan." },
        { status: 400 }
      );
    }

    const editDisCheck = detectDisintermediation(message.trim());
    if (editDisCheck.flagged) {
      return NextResponse.json(
        { success: false, error: "Edit ditolak: Terdeteksi nomor kontak / transaksi luar.", reason: editDisCheck.reason },
        { status: 400 }
      );
    }
    const editProhibitedCheck = detectProhibitedContent(message.trim());
    if (editProhibitedCheck.flagged) {
      return NextResponse.json(
        { success: false, error: `Edit ditolak: Pelanggaran ${editProhibitedCheck.category}`, reason: editProhibitedCheck.reason },
        { status: 400 }
      );
    }

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(messageId).trim());

    if (!isUuid) {
      return NextResponse.json({ success: true, message: "Mock message updated locally." });
    }

    const existingMsg = await prisma.chatMessage.findUnique({
      where: { id: messageId.trim() },
    });

    if (!existingMsg) {
      return NextResponse.json(
        { success: false, error: "Pesan tidak ditemukan." },
        { status: 404 }
      );
    }

    // SEC-05: Hanya pengirim asli yang dapat mengedit pesannya sendiri
    if (existingMsg.senderId !== userId && !isAdminUser) {
      return NextResponse.json(
        { success: false, error: "Akses ditolak. Anda hanya dapat mengedit pesan milik Anda sendiri." },
        { status: 403 }
      );
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
 * Menghapus pesan chat dari database PostgreSQL (Wajib autentikasi & kepemilikan pesan).
 */
export async function DELETE(req) {
  try {
    const authHeader = req.headers.get("authorization");
    let token = null;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7).trim();
    }
    if (!token) {
      const cookieHeader = req.headers.get("cookie") || "";
      const match = cookieHeader.match(/bantuin_auth_token=([^;]+)/) || cookieHeader.match(/bantuin_token=([^;]+)/);
      if (match) token = decodeURIComponent(match[1]).trim();
    }

    let userId = null;
    let isAdminUser = false;
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
        if (profile) {
          userId = profile.id;
          isAdminUser = Boolean(profile.isAdmin);
        }
      }
    }

    // SEC-05: Wajib autentikasi untuk menghapus pesan chat
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Akses ditolak. Silakan login terlebih dahulu." },
        { status: 401 }
      );
    }

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
      const existingMsg = await prisma.chatMessage.findUnique({
        where: { id: messageId.trim() },
      });

      if (!existingMsg) {
        return NextResponse.json(
          { success: false, error: "Pesan tidak ditemukan." },
          { status: 404 }
        );
      }

      // SEC-05: Hanya pengirim asli atau admin yang dapat menghapus pesan
      if (existingMsg.senderId !== userId && !isAdminUser) {
        return NextResponse.json(
          { success: false, error: "Akses ditolak. Anda hanya dapat menghapus pesan milik Anda sendiri." },
          { status: 403 }
        );
      }

      await prisma.chatMessage.delete({
        where: { id: messageId.trim() },
      });
    }

    return NextResponse.json({ success: true, message: "Pesan berhasil dihapus." });
  } catch (error) {
    console.error("DELETE /api/chat/messages Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

