import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth/jwt";
import { detectDisintermediation, detectProhibitedContent } from "@/lib/security";
import { getGoogleMapsUrl } from "@/lib/utils";

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

    if (!userId || !isValidUuid(userId)) {
      return NextResponse.json({
        success: true,
        count: 0,
        data: [],
      });
    }

    // Catat kehadiran aktif pengguna di memori presence server
    if (!globalThis.__bantuin_presence_map) {
      globalThis.__bantuin_presence_map = new Map();
    }
    globalThis.__bantuin_presence_map.set(userId, Date.now());

    // Bangun filter berotorisasi ketat: user HANYA boleh mengakses room miliknya (sebagai requester atau helper)
    const userScope = {
      OR: [
        { requesterId: userId },
        { helperId: userId },
      ],
    };

    // Filter soft delete: jangan tampilkan room yang telah dihapus oleh akun ini
    const notDeletedFilter = {
      NOT: {
        deletedFor: {
          has: userId,
        },
      },
    };

    let whereClause = {
      AND: [
        userScope,
        notDeletedFilter,
      ],
    };

    const markReadExplicit = searchParams.get("markRead") === "true" || searchParams.get("markRead") === "1";

    if (roomIdParam) {
      const extracted = roomIdParam.match(EXTRACT_UUID_REGEX) || [];
      if (extracted.length > 0) {
        let bookingMidtrans = [];
        try {
          const matchedBookings = await prisma.rentalBooking.findMany({
            where: { id: { in: extracted } },
            select: { midtransOrderId: true },
          });
          bookingMidtrans = matchedBookings.map((b) => b.midtransOrderId).filter(Boolean);
        } catch (_) {}

        whereClause = {
          AND: [
            userScope,
            notDeletedFilter,
            {
              OR: [
                ...extracted.map((uid) => ({ id: uid })),
                ...extracted.map((uid) => ({ requestId: uid })),
                ...(bookingMidtrans.length > 0 ? [{ midtransOrderId: { in: bookingMidtrans } }] : []),
              ],
            },
          ],
        };

        // HANYA tandai pesan di bilik ini sebagai telah dibaca jika diminta secara eksplisit saat ruang aktif terbuka
        if (userId && markReadExplicit) {
          prisma.chatMessage.updateMany({
            where: {
              orderRoomId: { in: extracted },
              senderId: { not: userId },
              isRead: false,
            },
            data: { isRead: true },
          }).catch((e) => console.warn("Mark as read in rooms route warning:", e.message));
        }
      }
    } else if (requestIdParam && isValidUuid(requestIdParam)) {
      whereClause = {
        AND: [
          userScope,
          notDeletedFilter,
          { requestId: requestIdParam },
        ],
      };
    }

    // 2. Query order_rooms asli dari PostgreSQL yang berhak dilihat user
    const orderRooms = await prisma.orderRoom.findMany({
      where: whereClause,
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
            campusName: true,
            partnerAddress: true,
            partnerBusinessName: true,
            accountRole: true,
            isPartner: true,
            updatedAt: true,
            responseTimeMinutes: true,
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
            campusName: true,
            partnerAddress: true,
            partnerBusinessName: true,
            accountRole: true,
            isPartner: true,
            updatedAt: true,
            responseTimeMinutes: true,
          },
        },
        chatMessages: {
          include: {
            sender: {
              select: {
                id: true,
                fullName: true,
                avatarUrl: true,
                partnerBusinessName: true,
                email: true,
                accountRole: true,
                isPartner: true,
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    // 2.4. Sinkronisasi aktif Midtrans untuk bilik spesifik yang masih PENDING saat dibuka
    if (roomIdParam && orderRooms.length === 1) {
      const singleRoom = orderRooms[0];
      if (singleRoom.paymentStatus === "PENDING" && singleRoom.midtransOrderId) {
        try {
          const { getMidtransTransactionStatus, mapMidtransStatus } = await import("@/lib/midtrans/client");
          const mtStatus = await Promise.race([
            getMidtransTransactionStatus(singleRoom.midtransOrderId),
            new Promise((_, reject) => setTimeout(() => reject(new Error("status check timeout")), 2000)),
          ]);
          const mapped = mapMidtransStatus(mtStatus?.transaction_status, mtStatus?.fraud_status);
          if (mapped?.isSettled) {
            singleRoom.paymentStatus = "PAID";
            singleRoom.paidAt = new Date();
            prisma.orderRoom.updateMany({
              where: { id: singleRoom.id, paymentStatus: { not: "PAID" } },
              data: { paymentStatus: "PAID", paidAt: new Date() },
            }).catch(() => null);
          }
        } catch (_) {}
      }
    }

    // 2.5. Kumpulkan ID booking, ID rental, dan midtransOrderId untuk semua bilik sewa
    const bookingIds = [];
    const rentalIds = [];
    const midtransIds = [];

    orderRooms.forEach((r) => {
      const desc = r.request?.description || "";
      const bMatch = desc.match(/\[BOOKING_ID:([a-zA-Z0-9_-]+)\]/i);
      if (bMatch && bMatch[1]) bookingIds.push(bMatch[1]);
      const rMatch = desc.match(/\[RENTAL_ID:([a-zA-Z0-9_-]+)\]/i);
      if (rMatch && rMatch[1]) rentalIds.push(rMatch[1]);
      if (r.midtransOrderId) midtransIds.push(r.midtransOrderId);
    });

    const [relatedBookings, relatedRentals] = await Promise.all([
      (bookingIds.length > 0 || midtransIds.length > 0)
        ? prisma.rentalBooking.findMany({
            where: {
              OR: [
                ...(bookingIds.length > 0 ? [{ id: { in: bookingIds } }] : []),
                ...(midtransIds.length > 0 ? [{ midtransOrderId: { in: midtransIds } }] : []),
              ],
            },
            include: {
              rental: true,
            },
          }).catch(() => [])
        : Promise.resolve([]),
      rentalIds.length > 0
        ? prisma.rental.findMany({
            where: { id: { in: rentalIds } },
          }).catch(() => [])
        : Promise.resolve([]),
    ]);

    const bookingMap = new Map();
    (relatedBookings || []).forEach((b) => {
      if (b.id) bookingMap.set(b.id, b);
      if (b.midtransOrderId) bookingMap.set(b.midtransOrderId, b);
    });

    const rentalMap = new Map();
    (relatedRentals || []).forEach((r) => {
      if (r.id) rentalMap.set(r.id, r);
    });

    // 3. Transform data sesuai format aplikasi
    const formattedRooms = orderRooms.map((room) => {
      const reqTitle = room.request?.title || "Bantuan Bantuin.id";
      const isRentalOrder = Boolean(
        (room.request?.description && (room.request.description.includes("[RENTAL_ID:") || room.request.description.includes("[BOOKING_ID:") || room.request.description.toLowerCase().includes("sewa"))) ||
        (reqTitle && reqTitle.toLowerCase().includes("sewa"))
      );

      const resolveProfileName = (party, isRoleHelper = true) => {
        if (!party) return isRoleHelper ? (isRentalOrder ? "Mitra Sewa" : "Helper Bantuin") : "Pemohon";
        const bName = (party.partnerBusinessName || "").trim();
        const fName = (party.fullName || "").trim();
        const ePrefix = (party.email || "").split("@")[0].trim().toLowerCase();

        // Jika sewa dan pihak adalah pemilik rental (helper), prioritaskan nama toko/bisnis tersimpan
        if (isRentalOrder && isRoleHelper && bName) return bName;
        // Jika mitra/partner memiliki nama usaha/toko tersimpan
        if ((party.isPartner || party.accountRole === "partner") && bName) return bName;
        // Jika fullName hanya username email Google (seperti 'wahyump222') dan ada nama toko/usaha tersimpan
        if (bName && (!fName || fName.toLowerCase() === ePrefix)) return bName;
        if (fName && fName.toLowerCase() !== ePrefix) return fName;
        return bName || fName || (isRoleHelper ? (isRentalOrder ? "Mitra Sewa" : "Helper Bantuin") : "Pemohon");
      };

      const isSelf = room.requesterId === room.helperId;
      const isRequester = userId ? room.requesterId === userId : true;
      const partner = isSelf
        ? (room.helper || room.requester)
        : (isRequester ? room.helper : room.requester);
      const partnerName = isSelf
        ? resolveProfileName(room.helper, true)
        : (isRequester ? resolveProfileName(room.helper, true) : resolveProfileName(room.requester, false));
      const partnerAvatar = partner?.avatarUrl && !partner.avatarUrl.includes("images.unsplash.com") ? partner.avatarUrl : null;
      const locked = Number(room.lockedAmount || room.request?.rewardAmount || 0);

      const getPresenceInfo = (profile) => {
        if (!profile?.id) return { isOnline: false, lastActiveAt: null };
        const now = Date.now();
        const memTime = globalThis.__bantuin_presence_map?.get(profile.id) || 0;
        const dbTime = profile.updatedAt ? new Date(profile.updatedAt).getTime() : 0;
        const lastActiveTime = Math.max(memTime, dbTime);
        const isOnline = lastActiveTime > 0 && (now - lastActiveTime) <= 90000;
        return {
          isOnline,
          lastActiveAt: lastActiveTime > 0 ? new Date(lastActiveTime).toISOString() : null,
        };
      };

      const messages = (room.chatMessages || [])
        .map((msg) => {
          let meta = {};
          let cleanMessage = msg.message || "";
          const metaSep = "||META||";
          if (cleanMessage.includes(metaSep)) {
            const parts = cleanMessage.split(metaSep);
            cleanMessage = parts[0];
            try { meta = JSON.parse(parts[1]); } catch (_) { meta = {}; }
          }
          return { msg, meta, cleanMessage };
        })
        .filter(({ cleanMessage, msg }) => {
          if (msg.senderId === "system") return true;
          if (detectDisintermediation(cleanMessage).flagged) return false;
          if (detectProhibitedContent(cleanMessage).flagged) return false;
          return true;
        })
        .map(({ msg, meta, cleanMessage }) => {

        const isDeliverableNotice = cleanMessage.includes("Penyedia jasa telah menyerahkan hasil pekerjaan");
        const isJasaDeliverablesProof = Boolean(meta.isJasaDeliverablesProof || isDeliverableNotice);
        let proofData = meta.proofData || null;
        if (isDeliverableNotice && !proofData) {
          proofData = {
            serviceTitle: reqTitle || "Layanan Jasa",
            submissionUrl: "-",
            files: [],
            notes: meta.notes || "",
            submittedAt: new Date(msg.createdAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
          };
        }

        const isRevisionNotice = cleanMessage.includes("[PERMINTAAN REVISI]:");
        const isRevisionRequest = Boolean(meta.isRevisionRequest || isRevisionNotice);

        const opponentProfile = msg.senderId === room.requesterId ? room.helper : room.requester;
        const opponentPresence = getPresenceInfo(opponentProfile);
        const isMsgRead = Boolean(msg.isRead);
        const isDelivered = isMsgRead || opponentPresence.isOnline || (opponentPresence.lastActiveAt && new Date(opponentPresence.lastActiveAt).getTime() >= new Date(msg.createdAt).getTime());
        const msgStatus = isMsgRead ? "read" : (isDelivered ? "delivered" : "sent");

        return {
          id: msg.id,
          clientMessageId: meta.clientMessageId || null,
          senderId: msg.senderId,
          senderName: resolveProfileName(msg.sender, msg.senderId === room.helperId),
          senderAvatar: msg.sender?.avatarUrl && !msg.sender.avatarUrl.includes("images.unsplash.com") ? msg.sender.avatarUrl : null,
          message: cleanMessage,
          // Proof/attachment fields
          attachmentUrls: msg.attachmentUrls || [],
          photos: (msg.attachmentUrls && msg.attachmentUrls.length > 0)
            ? msg.attachmentUrls
            : (meta.photos || meta.proofPhotos || (meta.attachment?.url ? [meta.attachment.url] : [])),
          attachment: meta.attachment || (msg.attachmentUrls?.[0] ? { url: msg.attachmentUrls[0], name: cleanMessage.replace(/^Foto terlampir:\s*/i, ""), isImage: true } : null),
          proofPhotos: msg.attachmentUrls?.length ? msg.attachmentUrls : (meta.proofPhotos || []),
          isTaskProof: meta.isTaskProof || false,
          isHandoverProof: meta.isHandoverProof || false,
          isReturnProof: meta.isReturnProof || false,
          isJasaDeliverablesProof,
          proofData,
          digitalFiles: meta.digitalFiles || meta.proofData?.files || [],
          submissionUrl: meta.submissionUrl || meta.proofData?.submissionUrl || null,
          isOnline: meta.isOnline !== undefined ? meta.isOnline : Boolean((meta.digitalFiles && meta.digitalFiles.length > 0) || meta.submissionUrl),
          isRevisionRequest,
          isJasaCompletion: meta.isJasaCompletion || false,
          completionData: meta.completionData || null,
          isSystemAnnouncement: meta.isSystemAnnouncement || false,
          notes: meta.notes || "",
          isEdited: meta.isEdited || false,
          // Timing & Delivery Status
          timestamp: new Date(msg.createdAt).toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
            timeZone: "Asia/Jakarta",
          }).replace(".", ":"),
          createdAt: msg.createdAt,
          isRead: isMsgRead,
          isDelivered,
          isSent: true,
          status: msgStatus,
          isSystem: msg.senderId === "system" || msg.message.includes("Rekening Bersama") || msg.message.includes("diverifikasi"),
        };
      });

      // Ekstrak metadata metode, serviceId, rentalId, bookingId jika ada di request.description
      let extractedLocationType = null;
      let extractedServiceId = null;
      let extractedRentalId = null;
      let extractedBookingId = null;
      let cleanRequestDesc = room.request?.description || "";

      if (cleanRequestDesc.includes("[RENTAL_ID:")) {
        const match = cleanRequestDesc.match(/\[RENTAL_ID:([a-zA-Z0-9_-]+)\]/i);
        if (match) extractedRentalId = match[1];
        cleanRequestDesc = cleanRequestDesc.replace(/\[RENTAL_ID:[a-zA-Z0-9_-]+\]/gi, "").trim();
      }

      if (cleanRequestDesc.includes("[BOOKING_ID:")) {
        const match = cleanRequestDesc.match(/\[BOOKING_ID:([a-zA-Z0-9_-]+)\]/i);
        if (match) extractedBookingId = match[1];
        cleanRequestDesc = cleanRequestDesc.replace(/\[BOOKING_ID:[a-zA-Z0-9_-]+\]/gi, "").trim();
      }

      let tagRentalFee = null;
      let tagDepositFee = null;
      let tagTotalAmount = null;
      let tagDays = null;
      let tagStartDate = null;
      let tagEndDate = null;

      const rFeeMatch = cleanRequestDesc.match(/\[RENTAL_FEE:(\d+(?:\.\d+)?)\]/i);
      if (rFeeMatch) {
        tagRentalFee = Number(rFeeMatch[1]);
        cleanRequestDesc = cleanRequestDesc.replace(/\[RENTAL_FEE:[^\]]+\]/gi, "").trim();
      }
      const dFeeMatch = cleanRequestDesc.match(/\[DEPOSIT_FEE:(\d+(?:\.\d+)?)\]/i);
      if (dFeeMatch) {
        tagDepositFee = Number(dFeeMatch[1]);
        cleanRequestDesc = cleanRequestDesc.replace(/\[DEPOSIT_FEE:[^\]]+\]/gi, "").trim();
      }
      const tAmtMatch = cleanRequestDesc.match(/\[TOTAL_AMOUNT:(\d+(?:\.\d+)?)\]/i);
      if (tAmtMatch) {
        tagTotalAmount = Number(tAmtMatch[1]);
        cleanRequestDesc = cleanRequestDesc.replace(/\[TOTAL_AMOUNT:[^\]]+\]/gi, "").trim();
      }
      const daysMatch = cleanRequestDesc.match(/\[DAYS:(\d+)\]/i);
      if (daysMatch) {
        tagDays = parseInt(daysMatch[1], 10);
        cleanRequestDesc = cleanRequestDesc.replace(/\[DAYS:[^\]]+\]/gi, "").trim();
      }
      const sDateMatch = cleanRequestDesc.match(/\[START_DATE:([^\]]+)\]/i);
      if (sDateMatch) {
        tagStartDate = sDateMatch[1];
        cleanRequestDesc = cleanRequestDesc.replace(/\[START_DATE:[^\]]+\]/gi, "").trim();
      }
      const eDateMatch = cleanRequestDesc.match(/\[END_DATE:([^\]]+)\]/i);
      if (eDateMatch) {
        tagEndDate = eDateMatch[1];
        cleanRequestDesc = cleanRequestDesc.replace(/\[END_DATE:[^\]]+\]/gi, "").trim();
      }

      let msgTotalAmount = null;
      let msgRentalFee = null;
      let msgDepositFee = null;

      for (const m of room.chatMessages || []) {
        const txt = m.message || "";
        if (txt.includes("PEMBAYARAN SEWA TERVERIFIKASI") || (txt.includes("Biaya Sewa:") && txt.includes("Deposit Jaminan:"))) {
          const totalMatch = txt.match(/sebesar\s+Rp\s*([0-9.,]+)/i);
          const rentMatch = txt.match(/Biaya Sewa:\s*Rp\s*([0-9.,]+)/i);
          const depMatch = txt.match(/Deposit Jaminan:\s*Rp\s*([0-9.,]+)/i);
          if (totalMatch) msgTotalAmount = parseInt(totalMatch[1].replace(/\./g, "").replace(/,/g, ""), 10);
          if (rentMatch) msgRentalFee = parseInt(rentMatch[1].replace(/\./g, "").replace(/,/g, ""), 10);
          if (depMatch) msgDepositFee = parseInt(depMatch[1].replace(/\./g, "").replace(/,/g, ""), 10);
          break;
        }
      }

      if (cleanRequestDesc.includes("[METODE:")) {
        const match = cleanRequestDesc.match(/\[METODE:([a-zA-Z_]+)\]/i);
        if (match) extractedLocationType = match[1].toLowerCase();
        cleanRequestDesc = cleanRequestDesc.replace(/\[METODE:[a-zA-Z_]+\]/gi, "").trim();
      }

      if (cleanRequestDesc.includes("[SERVICE_ID:")) {
        const match = cleanRequestDesc.match(/\[SERVICE_ID:([a-zA-Z0-9_-]+)\]/i);
        if (match) extractedServiceId = match[1];
        cleanRequestDesc = cleanRequestDesc.replace(/\[SERVICE_ID:[a-zA-Z0-9_-]+\]/gi, "").trim();
      }

      // Resolusi booking sewa terkait
      const booking = (extractedBookingId && bookingMap.get(extractedBookingId)) ||
        (room.midtransOrderId && bookingMap.get(room.midtransOrderId)) || null;

      // Verifikasi status lunas: cek order_rooms, rental_bookings, status bantuan in_progress, atau orderStatus
      const isLinkedRentalPaid = Boolean(booking?.paymentStatus === "PAID");
      const isBantuanPaid = Boolean(
        room.request?.status === "in_progress" &&
        room.request?.selectedHelperId === room.helperId
      );

      const isPaid =
        room.paymentStatus === "PAID" ||
        isLinkedRentalPaid ||
        isBantuanPaid ||
        ["paid_escrow", "in_progress", "on_the_way", "item_picked_up", "item_handed_over", "handed_over", "in_use", "returned", "task_delivered", "proof_submitted", "completed"].includes(room.orderStatus);

      // Self-healing database: jika status terbukti sudah lunas dari linked booking atau helper terpilih, perbarui order_rooms di DB
      if (isPaid && room.paymentStatus !== "PAID") {
        prisma.orderRoom.updateMany({
          where: { id: room.id, paymentStatus: { not: "PAID" } },
          data: {
            paymentStatus: "PAID",
            paidAt: room.paidAt || booking?.paidAt || new Date(),
          },
        }).catch(() => null);
      }

      // Pesan awal otomatis jika chat_messages baru kosong
      if (messages.length === 0) {
        messages.push({
          id: `sys-msg-${room.id}`,
          senderId: "system",
          senderName: "Bantuin System",
          message: isPaid
            ? `Dana sebesar Rp${locked.toLocaleString("id-ID")} telah aman terverifikasi di Rekening Bersama Bantuin.id. Helper dapat segera mulai pengerjaan tugas!`
            : `Ruang diskusi pra-transaksi untuk tugas "${reqTitle}". Diskusikan teknis pelaksanaan dan ketersediaan waktu sebelum melanjutkan pembayaran.`,
          timestamp: new Date(room.createdAt).toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
            timeZone: "Asia/Jakarta",
          }).replace(".", ":"),
          isSystem: true,
        });
      }

      // Status enforcement: jika belum bayar, harus tetap inquiry / diskusi
      const rawOrderStatus = room.orderStatus || "room_created";
      const isClosedStatus = ["cancelled", "refunded", "not_selected"].includes(rawOrderStatus);
      let effectiveOrderStatus = isPaid
        ? (["room_created", "inquiry"].includes(rawOrderStatus) ? "paid_escrow" : rawOrderStatus)
        : (isClosedStatus ? rawOrderStatus : "inquiry");

      if (isRentalOrder) {
        if (effectiveOrderStatus === "item_picked_up") effectiveOrderStatus = "item_handed_over";
        if (effectiveOrderStatus === "task_delivered") effectiveOrderStatus = "returned";
      }
      const effectiveStage = isPaid ? "active" : "inquiry";

      const catLower = (room.request?.category || "").toLowerCase();
      const titleLower = (reqTitle || "").toLowerCase();
      const midtransId = (room.midtransOrderId || "").toUpperCase();

      // 1. Pengecekan Sewa / Rental (Mutlak & Menyeluruh)
      const isRental =
        Boolean(extractedRentalId) ||
        Boolean(extractedBookingId) ||
        catLower.includes("sewa") ||
        catLower.includes("rental") ||
        titleLower.startsWith("sewa") ||
        titleLower.startsWith("rental") ||
        titleLower.includes("sewa ") ||
        titleLower.includes("rental ") ||
        titleLower.includes("sewa:") ||
        titleLower.includes("rental:") ||
        midtransId.startsWith("ORDER-RENTAL-") ||
        midtransId.startsWith("ORDER-SEWA-");

      // 2. Pengecekan Eksplisit Bantuan Komunitas / Errand / Tugas Kampus Online
      const isExplicitBantuan =
        !isRental && (
          catLower.includes("bantuan") ||
          catLower.includes("kebutuhan harian") ||
          catLower.includes("titip") ||
          catLower.includes("jemput") ||
          catLower.includes("antar") ||
          catLower.includes("belanja") ||
          catLower.includes("pindahan") ||
          catLower.includes("bongkar") ||
          catLower.includes("rakit") ||
          catLower.includes("bersih") ||
          titleLower.startsWith("bantuan:") ||
          titleLower.startsWith("titip ") ||
          titleLower.startsWith("ambil ") ||
          titleLower.startsWith("antar ")
        );

      // 3. Pengecekan Eksplisit Jasa Profesional
      const isExplicitService =
        !isRental && (
          titleLower.includes("pemesanan jasa") ||
          titleLower.startsWith("jasa:") ||
          catLower.startsWith("jasa") ||
          catLower === "layanan jasa" ||
          midtransId.startsWith("ORDER-JASA-") ||
          Boolean(extractedServiceId)
        );

      let resolvedCategoryType = "bantuan";
      let resolvedOrderType = "task";

      if (isRental) {
        resolvedCategoryType = "sewa";
        resolvedOrderType = "rental";
      } else if (isExplicitBantuan) {
        resolvedCategoryType = "bantuan";
        resolvedOrderType = "task";
      } else if (isExplicitService) {
        resolvedCategoryType = "jasa";
        resolvedOrderType = "service";
      } else if (
        !isExplicitBantuan &&
        (catLower.includes("desain grafis") ||
         catLower.includes("web & it") ||
         catLower.includes("servis komputer") ||
         catLower.includes("fotografi & liputan") ||
         catLower.includes("video editing & reels"))
      ) {
        resolvedCategoryType = "jasa";
        resolvedOrderType = "service";
      } else {
        resolvedCategoryType = "bantuan";
        resolvedOrderType = "task";
      }

      const isService = resolvedCategoryType === "jasa";

      const resolvedLocationType = extractedLocationType || (room.request?.mode === "online" ? "online" : (isService ? "onsite" : "customer_location"));

      // Resolusi detail sewa secara lengkap & konsisten (menggunakan booking yang telah divalidasi)

      const rental = (extractedRentalId && rentalMap.get(extractedRentalId)) ||
        (booking?.rental) || null;

      const effectiveDepositAmount = booking?.depositFee ? Number(booking.depositFee) : (
        tagDepositFee !== null ? tagDepositFee : (
          msgDepositFee !== null ? msgDepositFee : (
            rental?.depositAmount ? Number(rental.depositAmount) : 100000
          )
        )
      );

      const effectiveDurationDays = booking?.totalDays || tagDays || (() => {
        const dMatch = (reqTitle || "").match(/\((\d+)\s*Hari\)/i);
        return dMatch ? parseInt(dMatch[1], 10) : 2;
      })();

      const rawLocked = Number(room.lockedAmount || room.request?.rewardAmount || 0);

      const effectiveRentalFee = booking?.rentalFee ? Number(booking.rentalFee) : (
        tagRentalFee !== null ? tagRentalFee : (
          msgRentalFee !== null ? msgRentalFee : (
            rental?.dailyPrice ? Number(rental.dailyPrice) * effectiveDurationDays : (
              rawLocked > effectiveDepositAmount ? (rawLocked - effectiveDepositAmount) : rawLocked
            )
          )
        )
      );

      const effectiveTotalAmount = booking?.totalAmount ? Number(booking.totalAmount) : (
        tagTotalAmount !== null ? tagTotalAmount : (
          msgTotalAmount !== null ? msgTotalAmount : (
            effectiveRentalFee + effectiveDepositAmount
          )
        )
      );

      const finalLockedAmount = isRental ? effectiveTotalAmount : rawLocked;

      const rentalDetailsObj = isRental ? {
        unitName: rental?.title || booking?.rental?.title || (reqTitle || "").replace(/^Sewa:\s*/i, "").replace(/\s*\(\d+\s*Hari\)$/i, "").trim(),
        photoUrl: rental?.photoUrls?.[0] || booking?.rental?.photoUrls?.[0] || null,
        startDate: tagStartDate || (booking?.startDate ? new Date(booking.startDate).toLocaleDateString("id-ID") : "26/10/2026"),
        endDate: tagEndDate || (booking?.endDate ? new Date(booking.endDate).toLocaleDateString("id-ID") : "27/10/2026"),
        durationDays: effectiveDurationDays,
        dailyPrice: rental?.dailyPrice ? Number(rental.dailyPrice) : (effectiveRentalFee / effectiveDurationDays),
        rentalFee: effectiveRentalFee,
        depositFee: effectiveDepositAmount,
        totalAmount: effectiveTotalAmount,
        pickupLocation: rental?.pickupLocation || booking?.rental?.pickupLocation || room.request?.locationName || "Lokasi Pengambilan Toko Mitra",
        plateNumber: null,
        conditionChecklist: "Checklist fisik tervalidasi saat serah terima.",
        handoverPhotos: room.proofPhotoUrls || [],
        returnPhotos: [],
      } : null;

      return {
        id: room.id,
        orderRoomId: room.id,
        requestId: room.requestId,
        requestTitle: reqTitle,
        title: reqTitle,
        serviceId: extractedServiceId,
        rentalId: extractedRentalId,
        bookingId: extractedBookingId,
        locationType: resolvedLocationType,
        categoryType: resolvedCategoryType,
        orderType: resolvedOrderType,
        isJasa: isService,
        isService: isService,
        isRental: isRental,
        isBantuan: !isService && !isRental,
        category: room.request?.category || (isService ? "Layanan Jasa" : "Bantuan"),
        mode: room.request?.mode || (resolvedLocationType === "online" ? "online" : "offline"),
        lockedAmount: finalLockedAmount,
        rentalFeeAmount: isRental ? effectiveRentalFee : 0,
        depositAmount: isRental ? effectiveDepositAmount : 0,
        totalAmount: isRental ? effectiveTotalAmount : finalLockedAmount,
        rentalDetails: rentalDetailsObj,
        platformFee: Number(room.platformFee || 0),
        helperPayoutAmount: Number(room.helperPayoutAmount || 0),
        orderStatus: effectiveOrderStatus,
        status: effectiveOrderStatus,
        stage: effectiveStage,
        paymentStatus: isPaid ? "PAID" : (room.paymentStatus || "UNPAID"),
        helperId: room.helperId,
        requesterId: room.requesterId,
        providerId: room.helperId,
        userRole: isSelf ? "helper" : (isRequester ? "requester" : "helper"),
        isRequester: Boolean(isRequester),
        isHelper: Boolean(!isRequester || isSelf),
        partner: {
          id: partner?.id,
          name: partnerName,
          fullName: partner?.fullName || null,
          partnerBusinessName: partner?.partnerBusinessName || null,
          avatar: partnerAvatar,
          phone: partner?.phoneNumber || null,
          accountRole: partner?.accountRole || null,
          isPartner: Boolean(partner?.isPartner),
          ...getPresenceInfo(partner),
          responseTimeMinutes: partner?.responseTimeMinutes || null,
        },
        helper: {
          id: room.helper?.id,
          name: resolveProfileName(room.helper, true),
          fullName: room.helper?.fullName || null,
          partnerBusinessName: room.helper?.partnerBusinessName || null,
          avatar: room.helper?.avatarUrl && !room.helper.avatarUrl.includes("images.unsplash.com") ? room.helper.avatarUrl : null,
          phone: room.helper?.phoneNumber || null,
          rating: Number(room.helper?.ratingAvg) || 5.0,
          accountRole: room.helper?.accountRole || null,
          isPartner: Boolean(room.helper?.isPartner),
          ...getPresenceInfo(room.helper),
          responseTimeMinutes: room.helper?.responseTimeMinutes || null,
        },
        requester: {
          id: room.requester?.id,
          name: resolveProfileName(room.requester, false),
          fullName: room.requester?.fullName || null,
          partnerBusinessName: room.requester?.partnerBusinessName || null,
          avatar: room.requester?.avatarUrl && !room.requester.avatarUrl.includes("images.unsplash.com") ? room.requester.avatarUrl : null,
          phone: room.requester?.phoneNumber || null,
          campusName: room.requester?.campusName || null,
          partnerAddress: room.requester?.partnerAddress || null,
          accountRole: room.requester?.accountRole || null,
          isPartner: Boolean(room.requester?.isPartner),
          ...getPresenceInfo(room.requester),
          responseTimeMinutes: room.requester?.responseTimeMinutes || null,
        },
        latitude: room.request?.latitude ?? room.request?.bantuinPoint?.latitude ?? null,
        longitude: room.request?.longitude ?? room.request?.bantuinPoint?.longitude ?? null,
        locationName: room.request?.locationName || room.request?.bantuinPoint?.name || "Titik Temu",
        address: room.request?.bantuinPoint?.address || room.request?.locationName || null,
        pickupPoint: room.request?.bantuinPoint?.name || room.request?.locationName || "Titik Temu",
        isPublicLocation: room.request?.isPublicLocation ?? true,
        bantuinPoint: room.request?.bantuinPoint || null,
        request: room.request || null,
        googleMapsUrl: getGoogleMapsUrl(
          (room.request?.latitude && room.request?.longitude)
            ? { latitude: room.request.latitude, longitude: room.request.longitude }
            : (room.request?.bantuinPoint?.latitude && room.request?.bantuinPoint?.longitude)
            ? { latitude: room.request.bantuinPoint.latitude, longitude: room.request.bantuinPoint.longitude }
            : (room.request?.bantuinPoint?.address || room.request?.locationName || room.request?.bantuinPoint?.name)
        ),
        messages,
        // Bukti penyelesaian tersimpan langsung di order_rooms
        proofPhotos: room.proofPhotoUrls || [],
        proofNotes: room.proofNotes || "",
        proofSubmittedAt: room.proofSubmittedAt || null,
        submissionUrl: (() => {
          const match = (room.proofNotes || "").match(/https?:\/\/[^\s]+/i);
          if (match) return match[0];
          const proofMsg = [...messages].reverse().find((m) => (m.isJasaDeliverablesProof || m.isTaskProof) && (m.submissionUrl || (m.proofData?.submissionUrl && m.proofData.submissionUrl !== "-")));
          if (proofMsg) return proofMsg.submissionUrl || proofMsg.proofData?.submissionUrl;
          return null;
        })(),
        digitalFiles: (() => {
          const proofMsg = [...messages].reverse().find((m) => (m.isJasaDeliverablesProof || m.isTaskProof) && ((Array.isArray(m.digitalFiles) && m.digitalFiles.length > 0) || (Array.isArray(m.proofData?.files) && m.proofData.files.length > 0)));
          if (proofMsg) return (Array.isArray(proofMsg.digitalFiles) && proofMsg.digitalFiles.length > 0) ? proofMsg.digitalFiles : (proofMsg.proofData?.files || []);
          return [];
        })(),
        deletedFor: room.deletedFor || [],
        unreadCount: messages.filter((m) => m.senderId !== userId && !m.isRead && !m.isSystem).length,
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

/**
 * POST /api/chat/rooms
 * Mencari atau membuat bilik OrderRoom resmi & permanen di PostgreSQL untuk pasangan (requestId, helperId).
 * Menjamin bahwa percakapan antar pelamar yang berbeda terpisah 100% dan tidak tercampur.
 */
export async function POST(req) {
  try {
    // 1. Ekstraksi Token Otentikasi
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

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Harap login terlebih dahulu untuk mengakses percakapan." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { requestId, helperId, partnerId, rentalId, bookingId, serviceId, initialMessage } = body;
    // SEC-03: Jangan pernah mempercayai isPaid / paymentStatus: "PAID" dari body request client
    const initialPaid = false;

    // 1. Skenario Rental Sewa Alat & Kendaraan
    if (rentalId) {
      const rental = await prisma.rental.findUnique({
        where: { id: rentalId },
        include: { owner: true },
      });
      if (!rental) {
        return NextResponse.json(
          { success: false, error: "Unit rental tidak ditemukan." },
          { status: 404 }
        );
      }

      const targetHelperId = rental.ownerId;
      if (targetHelperId === userId) {
        if (process.env.NODE_ENV === "production" && process.env.VERCEL_ENV === "production") {
          return NextResponse.json(
            { success: false, error: "Anda tidak dapat membuka obrolan sewa dengan unit milik Anda sendiri." },
            { status: 400 }
          );
        }
        console.warn("[chat rooms] Mode simulasi: akun pemilik chat dengan unit sendiri.");
      }

      // Cari atau buat request khusus untuk rental ini
      let reqRecord = await prisma.request.findFirst({
        where: {
          requesterId: userId,
          category: "Sewa Alat & Kendaraan",
          title: { contains: rental.title.slice(0, 30) },
        },
      });

      if (!reqRecord) {
        const daily = Number(rental.dailyPrice) || 50000;
        reqRecord = await prisma.request.create({
          data: {
            requesterId: userId,
            category: "Sewa Alat & Kendaraan",
            title: `Sewa: ${rental.title.slice(0, 60)}`,
            description: `[RENTAL_ID:${rental.id}]${bookingId ? ` [BOOKING_ID:${bookingId}]` : ""} Diskusi & penyewaan alat ${rental.title}`,
            mode: "offline",
            locationName: rental.address || "Toko Mitra Sewa",
            deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            rewardAmount: daily,
            status: "helper_selected",
            selectedHelperId: targetHelperId,
          },
        });
      }

      // Cari atau buat OrderRoom
      let room = await prisma.orderRoom.findFirst({
        where: {
          requestId: reqRecord.id,
          helperId: targetHelperId,
        },
        include: { request: true, requester: true, helper: true },
      });

      if (!room) {
        const daily = Number(rental.dailyPrice) || 0;
        room = await prisma.orderRoom.create({
          data: {
            requestId: reqRecord.id,
            requesterId: userId,
            helperId: targetHelperId,
            lockedAmount: daily,
            platformFee: Math.round(daily * 0.08),
            helperPayoutAmount: Math.round(daily * 0.92),
            orderStatus: "room_created",
            paymentStatus: initialPaid ? "PAID" : "UNPAID",
            paidAt: initialPaid ? new Date() : null,
            deletedFor: [],
          },
          include: { request: true, requester: true, helper: true },
        });
      }

      // Jika ada initialMessage, simpan ke chat_messages dan buat notifikasi ke pemilik sewa
      if (initialMessage && initialMessage.trim()) {
        const msgText = initialMessage.trim();
        const existingMsg = await prisma.chatMessage.findFirst({
          where: { orderRoomId: room.id, message: msgText },
        });
        if (!existingMsg) {
          await prisma.chatMessage.create({
            data: {
              orderRoomId: room.id,
              senderId: userId,
              message: msgText,
            },
          });

          // Notifikasi in-app resmi ke pemilik sewa (rental.ownerId)
          const senderProfile = await prisma.profile.findUnique({ where: { id: userId } });
          const senderName = senderProfile?.fullName || "Calon Penyewa";
          await prisma.notification.create({
            data: {
              userId: targetHelperId,
              title: `Pesan Sewa Baru: ${rental.title}`,
              message: `${senderName}: "${msgText.slice(0, 80)}"`,
              link: `/chat?room=${room.id}`,
              type: "order",
              isRead: false,
            },
          }).catch((err) => console.warn("Failed to create rental notification:", err.message));
        }
      }

      return NextResponse.json({
        success: true,
        data: {
          id: room.id,
          orderRoomId: room.id,
          requestId: room.requestId,
          requesterId: room.requesterId,
          helperId: room.helperId,
          orderStatus: room.orderStatus,
          paymentStatus: room.paymentStatus,
        },
      });
    }

    // 2. Skenario Hubungi Mitra Langsung (partnerId tanpa requestId)
    if ((partnerId || helperId) && !requestId) {
      const targetPartnerId = partnerId || helperId;
      if (targetPartnerId === userId) {
        return NextResponse.json(
          { success: false, error: "Anda tidak dapat membuka obrolan dengan diri sendiri." },
          { status: 400 }
        );
      }

      const partnerProfile = await prisma.profile.findUnique({
        where: { id: targetPartnerId },
      });
      if (!partnerProfile) {
        return NextResponse.json(
          { success: false, error: "Profil mitra tidak ditemukan." },
          { status: 404 }
        );
      }

      let room = await prisma.orderRoom.findFirst({
        where: {
          OR: [
            { helperId: targetPartnerId, requesterId: userId },
            { helperId: userId, requesterId: targetPartnerId },
          ],
        },
        include: { request: true, requester: true, helper: true },
      });

      if (!room) {
        const partnerName = partnerProfile.partnerBusinessName || partnerProfile.fullName || "Mitra";
        const reqRecord = await prisma.request.create({
          data: {
            requesterId: userId,
            category: partnerProfile.isPartner ? "Sewa Alat & Kendaraan" : "Diskusi Pengguna",
            title: `Konsultasi: ${partnerName}`,
            description: `Ruang obrolan langsung dengan ${partnerName}`,
            mode: "offline",
            locationName: partnerProfile.partnerAddress || "Lokasi Mitra",
            deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            rewardAmount: 0,
            status: "helper_selected",
            selectedHelperId: targetPartnerId,
          },
        });

        room = await prisma.orderRoom.create({
          data: {
            requestId: reqRecord.id,
            requesterId: userId,
            helperId: targetPartnerId,
            lockedAmount: 0,
            platformFee: 0,
            helperPayoutAmount: 0,
            orderStatus: "room_created",
            paymentStatus: "UNPAID",
            deletedFor: [],
          },
          include: { request: true, requester: true, helper: true },
        });
      }

      if (initialMessage && initialMessage.trim()) {
        const msgText = initialMessage.trim();
        await prisma.chatMessage.create({
          data: {
            orderRoomId: room.id,
            senderId: userId,
            message: msgText,
          },
        });

        const senderProfile = await prisma.profile.findUnique({ where: { id: userId } });
        const senderName = senderProfile?.fullName || "Pengguna";
        await prisma.notification.create({
          data: {
            userId: targetPartnerId,
            title: `Pesan Baru dari ${senderName}`,
            message: `"${msgText.slice(0, 80)}"`,
            link: `/chat?room=${room.id}`,
            type: "order",
            isRead: false,
          },
        }).catch((err) => console.warn("Failed to create partner notification:", err.message));
      }

      return NextResponse.json({
        success: true,
        data: {
          id: room.id,
          orderRoomId: room.id,
          requestId: room.requestId,
          requesterId: room.requesterId,
          helperId: room.helperId,
          orderStatus: room.orderStatus,
          paymentStatus: room.paymentStatus,
        },
      });
    }

    if (!requestId) {
      return NextResponse.json(
        { success: false, error: "requestId, rentalId, atau partnerId diperlukan." },
        { status: 400 }
      );
    }

    const targetRequest = await prisma.request.findUnique({
      where: { id: requestId },
      include: { requester: true },
    });

    if (!targetRequest) {
      return NextResponse.json(
        { success: false, error: "Permintaan bantuan tidak ditemukan." },
        { status: 404 }
      );
    }

    // Tentukan helperId target
    let targetHelperId = helperId || partnerId;
    if (userId === targetRequest.requesterId) {
      // Pembuat tugas menghubungi helper tertentu
      if (!targetHelperId) {
        return NextResponse.json(
          { success: false, error: "helperId diperlukan saat pembuat tugas memulai obrolan." },
          { status: 400 }
        );
      }
    } else {
      // Pelamar/Helper yang menghubungi pembuat tugas
      targetHelperId = userId;
    }

    // Cari OrderRoom permanen untuk pasangan unik (requestId, targetHelperId)
    let room = await prisma.orderRoom.findFirst({
      where: {
        requestId: targetRequest.id,
        helperId: targetHelperId,
      },
      include: {
        request: true,
        requester: true,
        helper: true,
      },
    });

    if (room) {
      const roomUpdates = {};
      const currentDeleted = room.deletedFor || [];
      if (currentDeleted.includes(userId)) {
        roomUpdates.deletedFor = currentDeleted.filter((id) => id !== userId);
      }
      if (initialPaid && room.paymentStatus !== "PAID") {
        roomUpdates.paymentStatus = "PAID";
        roomUpdates.paidAt = new Date();
      }

      if (Object.keys(roomUpdates).length > 0) {
        room = await prisma.orderRoom.update({
          where: { id: room.id },
          data: roomUpdates,
          include: {
            request: true,
            requester: true,
            helper: true,
          },
        });
      }
    } else {
      const reward = Number(targetRequest.rewardAmount) || 25000;
      const platformFee = Math.round(reward * 0.08);
      const helperPayout = reward - platformFee;

      room = await prisma.orderRoom.create({
        data: {
          requestId: targetRequest.id,
          requesterId: targetRequest.requesterId,
          helperId: targetHelperId,
          lockedAmount: reward,
          platformFee: platformFee,
          helperPayoutAmount: helperPayout,
          orderStatus: "room_created",
          paymentStatus: initialPaid ? "PAID" : "UNPAID",
          paidAt: initialPaid ? new Date() : null,
          deletedFor: [],
        },
        include: {
          request: true,
          requester: true,
          helper: true,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: room.id,
        orderRoomId: room.id,
        requestId: room.requestId,
        requesterId: room.requesterId,
        helperId: room.helperId,
        orderStatus: room.orderStatus,
        paymentStatus: room.paymentStatus,
      },
    });
  } catch (error) {
    console.error("POST /api/chat/rooms Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Gagal membuat/mencari bilik obrolan." },
      { status: 500 }
    );
  }
}

export async function PATCH(req) {
  try {
    // SEC-03: Wajib autentikasi JWT sebelum mengubah status bilik transaksi
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

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Akses ditolak. Silakan login terlebih dahulu." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const {
      orderRoomId,
      status,
      paymentStatus,
      requestId,
      proofPhotoUrls,
      proofNotes,
      rating,
      feedback,
      reviewComment,
    } = body;

    const EXTRACT_UUID_REGEX = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
    const extractedUuids = ((orderRoomId || "") + " " + (requestId || "")).match(EXTRACT_UUID_REGEX) || [];

    // Cari room spesifik target jika orderRoomId atau requestId disertakan
    let targetRoom = null;
    if (orderRoomId) {
      const roomUuids = String(orderRoomId).match(EXTRACT_UUID_REGEX) || [];
      if (roomUuids.length > 0) {
        targetRoom = await prisma.orderRoom.findFirst({
          where: {
            OR: [
              { id: { in: roomUuids } },
              { requestId: { in: roomUuids } },
            ],
          },
          include: { request: true },
        });
      }
    }

    if (!targetRoom && requestId) {
      const reqUuids = String(requestId).match(EXTRACT_UUID_REGEX) || [];
      if (reqUuids.length > 0) {
        const reqItem = await prisma.request.findFirst({
          where: { id: { in: reqUuids } },
        });
        if (reqItem?.selectedHelperId) {
          targetRoom = await prisma.orderRoom.findFirst({
            where: {
              requestId: reqItem.id,
              helperId: reqItem.selectedHelperId,
            },
            include: { request: true },
          });
        }
      }
    }

    if (!targetRoom) {
      return NextResponse.json(
        { success: false, error: "Bilik pesanan tidak ditemukan." },
        { status: 404 }
      );
    }

    const isRequester = targetRoom.requesterId === userId;
    const isHelper = targetRoom.helperId === userId;
    if (!isRequester && !isHelper && !isAdminUser) {
      return NextResponse.json(
        { success: false, error: "Akses ditolak. Anda bukan partisipan dalam transaksi ini." },
        { status: 403 }
      );
    }

    if (targetRoom) {
      const updateData = {};

      const VALID_ORDER_STATUSES = new Set([
        "room_created",
        "on_the_way",
        "item_picked_up",
        "task_delivered",
        "proof_submitted",
        "completed",
        "disputed",
        "cancelled",
      ]);

      const wantsPaid = status === "paid_escrow" || (paymentStatus && String(paymentStatus).toUpperCase() === "PAID");
      let isPaidAction = false;

      // SEC-03: Klien tidak boleh menetapkan status PAID sendiri tanpa verifikasi pembayaran resmi Midtrans atau otorisasi Admin
      if (wantsPaid) {
        if (targetRoom.paymentStatus === "PAID" || isAdminUser) {
          isPaidAction = true;
        } else {
          let verifiedSettled = false;
          const candidateMidtransId = targetRoom.midtransOrderId || body.midtransOrderId || body.orderId;
          if (candidateMidtransId) {
            try {
              const { getMidtransTransactionStatus, mapMidtransStatus } = await import("@/lib/midtrans/client");
              const mtStatus = await getMidtransTransactionStatus(candidateMidtransId);
              const mapped = mapMidtransStatus(mtStatus.transaction_status, mtStatus.fraud_status);
              if (mapped.isSettled) {
                verifiedSettled = true;
              }
            } catch {}
          }
          const bMatch = targetRoom.request?.description?.match(/\[BOOKING_ID:([a-zA-Z0-9_-]+)\]/i);
          if (!verifiedSettled && bMatch?.[1]) {
            const linkedBooking = await prisma.rentalBooking.findUnique({ where: { id: bMatch[1] } }).catch(() => null);
            if (linkedBooking?.paymentStatus === "PAID") {
              verifiedSettled = true;
            } else if (linkedBooking?.midtransOrderId) {
              try {
                const { getMidtransTransactionStatus, mapMidtransStatus } = await import("@/lib/midtrans/client");
                const mtStatus = await getMidtransTransactionStatus(linkedBooking.midtransOrderId);
                const mapped = mapMidtransStatus(mtStatus.transaction_status, mtStatus.fraud_status);
                if (mapped.isSettled) {
                  verifiedSettled = true;
                  await prisma.rentalBooking.update({
                    where: { id: linkedBooking.id },
                    data: { paymentStatus: "PAID", bookingStatus: "payment_held", paidAt: new Date() },
                  }).catch(() => null);
                }
              } catch {}
            }
          }
          if (!verifiedSettled && targetRoom.request?.status === "in_progress" && targetRoom.request?.selectedHelperId === targetRoom.helperId) {
            verifiedSettled = true;
          }
          if (!verifiedSettled) {
            return NextResponse.json(
              {
                success: false,
                error: "Pembayaran belum terverifikasi lunas oleh sistem pembayaran resmi. Status PAID tidak dapat ditetapkan secara sepihak.",
              },
              { status: 403 }
            );
          }
          isPaidAction = true;
        }
      }

      // SEC-03 & BUG-05: Validasi penyelesaian pesanan (completed / verified_settled)
      const roomDesc = targetRoom.request?.description || "";
      const bookingMatchForCompletion = roomDesc.match(/\[BOOKING_ID:([0-9a-f-]{36})\]/i);
      const serviceMatchForCompletion = roomDesc.match(/\[SERVICE_ID:([0-9a-f-]{36})\]/i);
      const isRentalRoom =
        Boolean(bookingMatchForCompletion?.[1]) ||
        targetRoom.request?.category === "Sewa Alat & Kendaraan";

      if (status === "cancelled" && !isAdminUser) {
        if (targetRoom.paymentStatus === "PAID" || targetRoom.orderStatus === "completed") {
          return NextResponse.json(
            {
              success: false,
              error: "Transaksi pesanan yang sudah dibayar lunas (PAID) atau selesai tidak dapat dibatalkan secara langsung.",
              code: "ALREADY_PAID",
            },
            { status: 400 }
          );
        }
      }

      if (status === "completed" || status === "verified_settled") {
        if (!isRentalRoom && !isRequester && !isAdminUser) {
          return NextResponse.json(
            { success: false, error: "Hanya pemesan yang berhak mengonfirmasi penyelesaian pesanan." },
            { status: 403 }
          );
        }
        if (targetRoom.paymentStatus !== "PAID" && !isPaidAction && !isAdminUser) {
          return NextResponse.json(
            { success: false, error: "Pesanan yang belum lunas tidak dapat dikonfirmasi selesai." },
            { status: 400 }
          );
        }
        if (isRentalRoom && !isAdminUser) {
          let hasHandedOver = ["item_picked_up", "task_delivered", "proof_submitted", "completed"].includes(
            targetRoom.orderStatus
          );
          if (!hasHandedOver && bookingMatchForCompletion?.[1]) {
            const linkedBooking = await prisma.rentalBooking
              .findUnique({ where: { id: bookingMatchForCompletion[1] } })
              .catch(() => null);
            if (
              linkedBooking &&
              ["handed_over", "in_use", "returned", "verified_settled"].includes(linkedBooking.bookingStatus)
            ) {
              hasHandedOver = true;
            }
          }
          if (!hasHandedOver) {
            return NextResponse.json(
              {
                success: false,
                error: "Pesanan sewa tidak dapat diselesaikan sebelum tahapan serah terima barang terpenuhi.",
              },
              { status: 400 }
            );
          }
        }
      }

      // 1. Tangani status pembayaran & escrow
      if (isPaidAction) {
        updateData.paymentStatus = "PAID";
        updateData.paidAt = targetRoom.paidAt || new Date();
        if (body.midtransOrderId && !targetRoom.midtransOrderId) {
          updateData.midtransOrderId = body.midtransOrderId;
        }
        if (body.transactionId && !targetRoom.midtransTransactionId) {
          updateData.midtransTransactionId = body.transactionId;
        }
        if (["room_created", "inquiry"].includes(targetRoom.orderStatus) && !status) {
          updateData.orderStatus = "paid_escrow";
        }
        if (targetRoom.requestId) {
          prisma.request.updateMany({
            where: { id: targetRoom.requestId, status: { notIn: ["completed", "cancelled"] } },
            data: { status: "in_progress" },
          }).catch(() => null);
        }
      } else if (
        paymentStatus &&
        typeof paymentStatus === "string" &&
        ["UNPAID", "PENDING", "EXPIRED", "FAILED", "CANCELLED"].includes(paymentStatus.toUpperCase()) &&
        targetRoom.paymentStatus !== "PAID"
      ) {
        updateData.paymentStatus = paymentStatus.toUpperCase();
      }

      // 2. Tangani status pengerjaan yang enum-safe untuk PostgreSQL order_status
      if (status === "in_progress" || status === "item_handed_over" || status === "handed_over" || status === "in_use") {
        updateData.orderStatus = "item_picked_up";
        updateData.startedAt = new Date();
      } else if (status === "returned") {
        updateData.orderStatus = "task_delivered";
      } else if (status === "completed" || status === "verified_settled") {
        updateData.orderStatus = "completed";
        updateData.completedAt = new Date();
      } else if (status && VALID_ORDER_STATUSES.has(status)) {
        updateData.orderStatus = status;
      }

      if (proofPhotoUrls && Array.isArray(proofPhotoUrls)) updateData.proofPhotoUrls = proofPhotoUrls;
      if (proofNotes !== undefined && proofNotes !== null) updateData.proofNotes = proofNotes;

      // Integrasi submissionUrl dan digitalFiles ke order_rooms
      if (body.submissionUrl && body.submissionUrl !== "-") {
        const currentNotes = updateData.proofNotes || targetRoom?.proofNotes || "";
        if (!currentNotes.includes(body.submissionUrl)) {
          updateData.proofNotes = `${body.submissionUrl}\n${currentNotes}`.trim();
        }
      }
      if (body.digitalFiles && Array.isArray(body.digitalFiles)) {
        const fileUrls = body.digitalFiles.map((f) => f.url || f.dataUrl).filter((u) => u && typeof u === "string" && !u.startsWith("data:"));
        if (fileUrls.length > 0) {
          const existingPhotos = updateData.proofPhotoUrls || targetRoom?.proofPhotoUrls || [];
          updateData.proofPhotoUrls = Array.from(new Set([...existingPhotos, ...fileUrls]));
        }
      }

      if (status === "proof_submitted") updateData.proofSubmittedAt = new Date();
      if (status === "completed") updateData.completedAt = new Date();

      if (Object.keys(updateData).length > 0) {
        if (targetRoom) {
          // Perbarui HANYA room target spesifik, JANGAN pernah update room pelamar lain!
          let newlyCompleted = false;
          if (updateData.orderStatus === "completed") {
            const compRes = await prisma.orderRoom.updateMany({
              where: { id: targetRoom.id, orderStatus: { not: "completed" } },
              data: updateData,
            });
            newlyCompleted = compRes.count > 0;
          } else {
            await prisma.orderRoom.update({
              where: { id: targetRoom.id },
              data: updateData,
            });
          }

          // BUG-05: Increment service.completedOrders when a service order transitions to completed for the first time
          if (newlyCompleted && serviceMatchForCompletion?.[1]) {
            await prisma.service
              .update({
                where: { id: serviceMatchForCompletion[1] },
                data: { completedOrders: { increment: 1 } },
              })
              .catch(() => null);
          }

          // ISOLASI KHUSUS BANTUAN:
          // Jika ini transaksi bantuan dan pemesan mengunci dana / memilih helper:
          if (targetRoom.requestId) {
            if (isPaidAction) {
              // a. Sinkronisasi request dengan helper terpilih
              await prisma.request.update({
                where: { id: targetRoom.requestId },
                data: {
                  status: "in_progress",
                  selectedHelperId: targetRoom.helperId,
                },
              }).catch(() => null);

              // b. Pastikan room helper lain pada tugas bantuan ini TIDAK menjadi PAID / aktif
              await prisma.orderRoom.updateMany({
                where: {
                  requestId: targetRoom.requestId,
                  id: { not: targetRoom.id },
                },
                data: {
                  paymentStatus: "UNPAID",
                  orderStatus: "cancelled",
                },
              }).catch(() => null);

              // c. Update status penawaran
              await prisma.offer.updateMany({
                where: {
                  requestId: targetRoom.requestId,
                  helperId: targetRoom.helperId,
                },
                data: { status: "accepted" },
              }).catch(() => null);

              await prisma.offer.updateMany({
                where: {
                  requestId: targetRoom.requestId,
                  helperId: { not: targetRoom.helperId },
                },
                data: { status: "rejected" },
              }).catch(() => null);
            } else if (status) {
              const requestStatusMap = {
                paid_escrow: "in_progress",
                in_progress: "in_progress",
                on_the_way: "in_progress",
                item_picked_up: "in_progress",
                item_handed_over: "in_progress",
                handed_over: "in_progress",
                in_use: "in_progress",
                returned: "in_progress",
                proof_submitted: "awaiting_confirmation",
                awaiting_confirmation: "awaiting_confirmation",
                completed: "completed",
                cancelled: "cancelled",
              };
              const resolvedRequestStatus = requestStatusMap[status];
              if (resolvedRequestStatus) {
                await prisma.request.update({
                  where: { id: targetRoom.requestId },
                  data: { status: resolvedRequestStatus },
                }).catch(() => null);
              }
            }
          }
        } else {
          // Fallback HANYA berdasarkan ID unik yang diekstrak (bukan requestId)
          await prisma.orderRoom.updateMany({
            where: {
              id: { in: extractedUuids },
            },
            data: updateData,
          });
        }
      }

      // 4. Sinkronisasi ke tabel rental_bookings jika UUID merujuk ke transaksi sewa
      const VALID_BOOKING_STATUSES = new Set([
        "temp_locked",
        "confirmed_by_owner",
        "payment_held",
        "handed_over",
        "in_use",
        "returned",
        "verified_settled",
        "cancelled",
        "disputed",
      ]);

      let targetBookingStatus = null;
      if (isPaidAction) {
        targetBookingStatus = "payment_held";
      } else if (status === "item_handed_over" || status === "handed_over") {
        targetBookingStatus = "handed_over";
      } else if (status === "returned") {
        targetBookingStatus = "returned";
      } else if (status === "completed" || status === "verified_settled") {
        targetBookingStatus = "verified_settled";
      } else if (status && VALID_BOOKING_STATUSES.has(status)) {
        targetBookingStatus = status;
      }

      if (targetBookingStatus) {
        const bookingUuids = new Set(extractedUuids);

        // Ekstraksi BOOKING_ID dari deskripsi request jika bilik ini berasal dari transaksi sewa
        if (targetRoom?.request?.description) {
          const bMatch = targetRoom.request.description.match(/\[BOOKING_ID:([0-9a-f-]{36})\]/i);
          if (bMatch && bMatch[1]) bookingUuids.add(bMatch[1]);
        }

        const targetMidtransOrderId = targetRoom?.midtransOrderId || body.midtransOrderId;

        for (const uid of Array.from(bookingUuids)) {
          await prisma.rentalBooking.updateMany({
            where: { id: uid },
            data: {
              bookingStatus: targetBookingStatus,
              ...(targetBookingStatus === "payment_held" ? { paymentStatus: "PAID", paidAt: new Date() } : {}),
            },
          }).catch(() => null);
        }

        if (targetMidtransOrderId) {
          await prisma.rentalBooking.updateMany({
            where: { midtransOrderId: targetMidtransOrderId },
            data: {
              bookingStatus: targetBookingStatus,
              ...(targetBookingStatus === "payment_held" ? { paymentStatus: "PAID", paidAt: new Date() } : {}),
            },
          }).catch(() => null);
        }
      }

      // BUG-05: Hapus blok duplikasi Review pertama; seluruh pencatatan Review dilakukan secara tunggal & idempoten di blok bawah.

      // Helper Idempotent Notification Sender
      const sendNotificationIdempotent = async ({ userId, title, message, link, type = "order" }) => {
        if (!userId) return null;
        try {
          const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
          const existing = await prisma.notification.findFirst({
            where: {
              userId,
              link,
              title,
              createdAt: { gte: twoMinutesAgo },
            },
          });
          if (!existing) {
            return await prisma.notification.create({
              data: {
                userId,
                title,
                message,
                link,
                type,
              },
            });
          }
        } catch (err) {
          console.warn("sendNotificationIdempotent error:", err);
        }
        return null;
      };

      // 5. Buat Notifikasi Status Interaktif (Idempoten & Tepat Sasaran)
      try {
        const activeRoom = targetRoom || (extractedUuids.length > 0 ? await prisma.orderRoom.findFirst({
          where: {
            id: { in: extractedUuids },
          },
          include: { request: true },
        }) : null);

        if (activeRoom) {
          const taskName = activeRoom.request?.title || "Bantuan Transaksi";
          const roomLink = `/chat?room=${activeRoom.id}`;

          if (isPaidAction && activeRoom.helperId) {
            await sendNotificationIdempotent({
              userId: activeRoom.helperId,
              title: "Pembayaran Diterima (Rekber Bantuin)",
              message: `Dana imbalan untuk '${taskName}' telah aman diamankan di Rekber Bantuin. Anda dapat mulai menjalankan tugas!`,
              link: roomLink,
            });
          } else if (status === "on_the_way" && activeRoom.requesterId) {
            const isTaskOnline = activeRoom.request?.mode === "online";
            await sendNotificationIdempotent({
              userId: activeRoom.requesterId,
              title: isTaskOnline ? "Helper Mulai Memproses Tugas" : "Helper Menuju Lokasi",
              message: isTaskOnline
                ? `Helper sedang memproses pengerjaan digital untuk '${taskName}'.`
                : `Helper sedang bergerak menuju lokasi untuk tugas '${taskName}'.`,
              link: roomLink,
            });
          } else if ((status === "item_picked_up" || status === "in_progress") && activeRoom.requesterId) {
            const isTaskOnline = activeRoom.request?.mode === "online";
            await sendNotificationIdempotent({
              userId: activeRoom.requesterId,
              title: isTaskOnline ? "Pengerjaan Digital Berlangsung" : "Tugas Sedang Diproses",
              message: isTaskOnline
                ? `Tugas digital/online '${taskName}' sedang dikerjakan oleh helper/mitra.`
                : `Helper/mitra telah tiba di lokasi dan tugas '${taskName}' sedang dikerjakan.`,
              link: roomLink,
            });
          } else if (status === "proof_submitted" && activeRoom.requesterId) {
            await sendNotificationIdempotent({
              userId: activeRoom.requesterId,
              title: "Bukti Pengerjaan Telah Masuk!",
              message: `Bukti penyelesaian untuk '${taskName}' telah diunggah. Mohon periksa dan konfirmasi penyelesaian.`,
              link: roomLink,
            });
          } else if (status === "completed" && activeRoom.helperId) {
            await sendNotificationIdempotent({
              userId: activeRoom.helperId,
              title: "Tugas Selesai & Imbalan Dicairkan!",
              message: `Tugas '${taskName}' telah dikonfirmasi selesai. Dana imbalan telah otomatis dicairkan ke saldo Anda!`,
              link: roomLink,
            });
          }
        }
      } catch (statusNotifErr) {
        console.warn("Could not create status notification:", statusNotifErr);
      }

      // Jika order selesai dan ada rating, catat Review resmi ke PostgreSQL & hitung ratingAvg
      const numericRating = Number(rating);
      if (status === "completed" && numericRating >= 1 && numericRating <= 5) {
        try {
          const room = targetRoom || (extractedUuids.length > 0 ? await prisma.orderRoom.findFirst({
            where: {
              id: { in: extractedUuids },
            },
            include: { request: true },
          }) : null);

          if (room && room.helperId && room.requesterId) {
            const commentText = (feedback || reviewComment || "Tugas diselesaikan dengan sangat baik & tepat waktu.").trim();

            await prisma.$transaction(async (tx) => {
              await tx.$queryRaw`SELECT id FROM profiles WHERE id = ${room.requesterId}::uuid FOR UPDATE`;

              // Cek apakah sudah pernah direview di dalam transaksi ber-lock
              const existingReview = await tx.review.findFirst({
                where: {
                  transactionId: room.id,
                  reviewerId: room.requesterId,
                },
              });

              if (!existingReview) {
                await tx.review.create({
                  data: {
                    transactionId: room.id,
                    transactionType: "request",
                    reviewerId: room.requesterId,
                    revieweeId: room.helperId,
                    rating: Math.round(numericRating),
                    comment: commentText,
                  },
                });

                // Hitung ulang rating rata-rata helper di tabel Profile
                const allHelperReviews = await tx.review.findMany({
                  where: { revieweeId: room.helperId },
                  select: { rating: true },
                });

                if (allHelperReviews.length > 0) {
                  const totalStars = allHelperReviews.reduce((sum, r) => sum + r.rating, 0);
                  const avgRating = Number((totalStars / allHelperReviews.length).toFixed(2));
                  await tx.profile.update({
                    where: { id: room.helperId },
                    data: {
                      ratingAvg: avgRating,
                      ratingCount: allHelperReviews.length,
                      completedHelpsCount: { increment: 1 },
                    },
                  });
                }

                // Kirim notifikasi in-app ke Helper
                await tx.notification.create({
                  data: {
                    userId: room.helperId,
                    title: "Tugas Selesai & Rating Diterima!",
                    message: `Pemesan telah mengonfirmasi selesai tugas '${room.request?.title || "Bantuan"}' dan memberikan rating ${numericRating}/5 bintang. Dana telah dicairkan ke saldo Anda!`,
                    type: "order",
                    link: `/chat?room=${room.id}`,
                  },
                });
              }
            });
          }
        } catch (revErr) {
          console.warn("Could not save review on room completion:", revErr);
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
 * Menghapus ruang obrolan tertentu beserta seluruh pesannya dari PostgreSQL secara aman dan terotorisasi.
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

    // 1. Ekstraksi Token Otentikasi
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

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Harap login untuk menghapus obrolan." },
        { status: 401 }
      );
    }

    const EXTRACT_UUID_REGEX = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
    const extractedUuids = roomId.match(EXTRACT_UUID_REGEX) || [];

    for (const uid of extractedUuids) {
      // Cari room spesifik berdasarkan id atau requestId
      let targetRoom = await prisma.orderRoom.findUnique({
        where: { id: uid },
      }).catch(() => null);

      if (!targetRoom) {
        targetRoom = await prisma.orderRoom.findFirst({
          where: {
            requestId: uid,
            OR: [
              { requesterId: userId },
              { helperId: userId },
            ],
          },
        }).catch(() => null);
      }

      if (targetRoom) {
        // Otorisasi ketat: hanya partisipan (requester / helper) yang berhak menghapus
        if (targetRoom.requesterId !== userId && targetRoom.helperId !== userId) {
          continue; // Lewati jika bukan partisipan
        }

        // 1. Validasi transaksi aktif:
        // Pesanan yang sedang aktif berjalan (berbayar di escrow) atau dalam sengketa TIDAK BISA dihapus
        // sampai pesanan selesai (completed) atau dibatalkan (cancelled).
        const isRunningOrder = (targetRoom.paymentStatus === "PAID" || 
          ["on_the_way", "item_picked_up", "task_delivered", "proof_submitted", "in_progress", "paid_escrow"].includes(targetRoom.orderStatus)) &&
          targetRoom.orderStatus !== "completed" && 
          targetRoom.orderStatus !== "cancelled";

        if (isRunningOrder) {
          return NextResponse.json(
            { 
              success: false, 
              error: "Obrolan pesanan aktif yang sedang berjalan tidak dapat dihapus sebelum pesanan selesai atau dibatalkan demi keamanan transaksi Rekening Bersama." 
            },
            { status: 400 }
          );
        }

        if (targetRoom.orderStatus === "disputed") {
          return NextResponse.json(
            { 
              success: false, 
              error: "Obrolan dalam proses mediasi sengketa tidak dapat dihapus hingga investigasi selesai." 
            },
            { status: 400 }
          );
        }

        // 2. Tambahkan userId ke deleted_for (Soft Delete per-user yang aman dan konsisten)
        const currentDeleted = targetRoom.deletedFor || [];
        if (!currentDeleted.includes(userId)) {
          const updatedDeleted = [...currentDeleted, userId];
          await prisma.orderRoom.update({
            where: { id: targetRoom.id },
            data: {
              deletedFor: updatedDeleted,
            },
          });
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: "Obrolan berhasil dihapus dari daftar Anda." 
    });
  } catch (error) {
    console.error("DELETE /api/chat/rooms Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

