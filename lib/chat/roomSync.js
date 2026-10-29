/**
 * lib/chat/roomSync.js
 *
 * Logika utilitas sinkronisasi bilik chat untuk mempertahankan pesan optimistik,
 * berkas lampiran, dan status pengerjaan selama sinkronisasi background/realtime,
 * serta registri tombstone pesan yang telah dihapus agar tidak pernah bangkit kembali.
 */

// Global tombstone registry for deleted messages (with 10-minute TTL)
const globalDeletedTombstones = new Map();

export function markMessageAsDeleted(msgId, clientMessageId = null) {
  const now = Date.now();
  if (msgId) globalDeletedTombstones.set(String(msgId), now);
  if (clientMessageId) globalDeletedTombstones.set(String(clientMessageId), now);
}

export function isMessageDeleted(msgId, clientMessageId = null) {
  const now = Date.now();
  const TEN_MINUTES = 10 * 60 * 1000;

  const check = (id) => {
    if (!id) return false;
    const strId = String(id);
    const ts = globalDeletedTombstones.get(strId);
    if (!ts) return false;
    if (now - ts > TEN_MINUTES) {
      globalDeletedTombstones.delete(strId);
      return false;
    }
    return true;
  };

  return check(msgId) || check(clientMessageId);
}

/**
 * Menggabungkan room yang baru diterima dari server (GET /api/chat/rooms)
 * dengan room sebelumnya di state lokal, dengan menjamin bahwa pesan optimistik
 * (yang masih in-flight/belum masuk DB) serta berkas hasil kerja TIDAK PERNAH hilang,
 * dan pesan yang dihapus TIDAK PERNAH muncul kembali secara sesaat.
 *
 * @param {Array} incomingRooms       - Daftar room terbaru dari server
 * @param {Array} previousRooms       - Daftar room yang ada di state lokal sebelum update
 * @param {Set|null} localTombstones  - Set opsional pesan yang baru saja dihapus di komponen
 * @returns {Array}                   - Daftar room hasil rekonsiliasi yang aman
 */
export function mergeRoomsPreservingOptimistic(incomingRooms, previousRooms, localTombstones = null) {
  if (!Array.isArray(incomingRooms)) {
    return Array.isArray(previousRooms) ? previousRooms : [];
  }

  const cleanMessages = (msgs) => {
    if (!Array.isArray(msgs)) return [];
    return msgs.filter((m) => {
      if (!m) return false;
      const mId = String(m.id || "");
      const cId = String(m.clientMessageId || "");
      if (isMessageDeleted(mId, cId)) return false;
      if (localTombstones && (localTombstones.has(mId) || localTombstones.has(cId))) return false;
      return true;
    });
  };

  if (!Array.isArray(previousRooms) || previousRooms.length === 0) {
    return incomingRooms.map((r) => ({
      ...r,
      messages: cleanMessages(r.messages),
    }));
  }

  // Petakan previousRooms berdasarkan id, orderRoomId, dan requestId untuk pencarian cepat
  const prevMap = new Map();
  for (const pr of previousRooms) {
    if (!pr) continue;
    if (pr.id) prevMap.set(String(pr.id), pr);
    if (pr.orderRoomId && !prevMap.has(String(pr.orderRoomId))) prevMap.set(String(pr.orderRoomId), pr);
    if (pr.requestId && !prevMap.has(String(pr.requestId))) prevMap.set(String(pr.requestId), pr);
  }

  const now = Date.now();

  const merged = incomingRooms.map((serverRoom) => {
    if (!serverRoom) return serverRoom;

    // Temukan room sebelumnya yang cocok
    const prevRoom =
      prevMap.get(String(serverRoom.id)) ||
      (serverRoom.orderRoomId && prevMap.get(String(serverRoom.orderRoomId))) ||
      (serverRoom.requestId && prevMap.get(String(serverRoom.requestId)));

    if (!prevRoom) {
      return {
        ...serverRoom,
        messages: cleanMessages(serverRoom.messages),
      };
    }

    const serverMsgs = cleanMessages(serverRoom.messages);
    const prevMsgs = cleanMessages(prevRoom.messages);

    // 1. Ekstrak himpunan ID & clientMessageId pesan yang sudah resmi di server
    const serverIds = new Set(serverMsgs.map((m) => String(m.id || "")));
    const serverClientIds = new Set(
      serverMsgs.map((m) => String(m.clientMessageId || "")).filter(Boolean)
    );

    // 2. Kumpulkan pesan optimistik / in-flight dari prevRoom yang belum ada di server
    const pendingOptimistic = prevMsgs.filter((m) => {
      if (!m) return false;
      const isOpt =
        m.isOptimistic === true ||
        (typeof m.id === "string" && (m.id.startsWith("cmsg_") || m.id.startsWith("msg-")));
      if (!isOpt) return false;

      // Buang jika sudah kadaluarsa (>120 detik) untuk mencegah kebocoran memori
      const mTime = m.createdAt ? new Date(m.createdAt).getTime() : 0;
      if (mTime && now - mTime > 120000) return false;

      // Lewati jika ID permanen sudah ada di server
      if (m.id && serverIds.has(String(m.id))) return false;

      // Lewati jika clientMessageId sudah ada di server
      if (m.clientMessageId && serverClientIds.has(String(m.clientMessageId))) return false;

      // Fuzzy check: pencocokan pengirim & teks jika dalam rentang 30 detik
      const mText = (m.message || "").trim();
      const mSender = String(m.senderId || "");
      const isAlreadyOnServer = serverMsgs.some((sMsg) => {
        if (!sMsg) return false;
        const sText = (sMsg.message || "").trim();
        const sSender = String(sMsg.senderId || "");
        if (sText !== mText || sSender !== mSender) return false;
        const sTime = sMsg.createdAt ? new Date(sMsg.createdAt).getTime() : 0;
        if (mTime && sTime && Math.abs(sTime - mTime) <= 30000) return true;
        return false;
      });

      return !isAlreadyOnServer;
    });

    // 3. Pertahankan berkas digital, tautan penyerahan, dan bukti foto jika server room belum sempat terupdate oleh PATCH
    const digitalFiles =
      Array.isArray(serverRoom.digitalFiles) && serverRoom.digitalFiles.length > 0
        ? serverRoom.digitalFiles
        : Array.isArray(prevRoom.digitalFiles) && prevRoom.digitalFiles.length > 0
        ? prevRoom.digitalFiles
        : [];

    const submissionUrl =
      serverRoom.submissionUrl && serverRoom.submissionUrl !== "-"
        ? serverRoom.submissionUrl
        : prevRoom.submissionUrl && prevRoom.submissionUrl !== "-"
        ? prevRoom.submissionUrl
        : serverRoom.submissionUrl || "";

    const proofPhotos =
      Array.isArray(serverRoom.proofPhotos) && serverRoom.proofPhotos.length > 0
        ? serverRoom.proofPhotos
        : Array.isArray(prevRoom.proofPhotos) && prevRoom.proofPhotos.length > 0
        ? prevRoom.proofPhotos
        : [];

    const proofNotes = serverRoom.proofNotes || prevRoom.proofNotes || "";

    // 4. Resolusi orderStatus jika client baru saja submitProof
    const STATUS_PRIORITY = {
      cancelled: 100,
      refunded: 100,
      completed: 90,
      completed_confirmed: 90,
      proof_submitted: 70,
      delivered: 70,
      in_progress: 50,
      item_picked_up: 50,
      heading_to_location: 40,
      driver_assigned: 30,
      accepted: 30,
      paid: 20,
      confirmed: 20,
      unpaid: 10,
    };
    const sPriority = STATUS_PRIORITY[serverRoom.orderStatus] || 0;
    const pPriority = STATUS_PRIORITY[prevRoom.orderStatus] || 0;
    const resolvedOrderStatus = pPriority > sPriority && pPriority === 70 // jika client baru saja submitProof
      ? prevRoom.orderStatus
      : serverRoom.orderStatus;

    const mergedMessages = pendingOptimistic.length > 0
      ? [...serverMsgs, ...pendingOptimistic]
      : serverMsgs;

    return {
      ...serverRoom,
      orderStatus: resolvedOrderStatus,
      digitalFiles,
      submissionUrl,
      proofPhotos,
      proofNotes,
      messages: mergedMessages,
      rentalFeeAmount: serverRoom.rentalFeeAmount || prevRoom.rentalFeeAmount || 0,
      depositAmount: serverRoom.depositAmount !== undefined ? serverRoom.depositAmount : (prevRoom.depositAmount || 0),
      totalAmount: serverRoom.totalAmount || prevRoom.totalAmount || 0,
      rentalDetails: serverRoom.rentalDetails || prevRoom.rentalDetails || null,
    };
  });

  return merged;
}
