"use client";

import React, { useState, useRef, useEffect, Suspense, useCallback, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useApp } from "@/lib/context/AppContext";
import { authService } from "@/lib/services/authService";
import { useChatRealtime } from "@/lib/hooks/useChatRealtime";
import { mergeRoomsPreservingOptimistic, markMessageAsDeleted, isMessageDeleted } from "@/lib/chat/roomSync";
import { formatIDR, getGoogleMapsUrl } from "@/lib/utils";
import { PROVIDERS_DATA, getCatalogServiceById } from "@/lib/mock/providersData";
import {
  ArrowLeft,
  Search,
  Paperclip,
  Send,
  Download,
  ShieldCheck,
  Lock,
  Check,
  CheckCheck,
  CheckCircle2,
  RefreshCw,
  FileText,
  Clock,
  MapPin,
  Globe,
  Camera,
  Star,
  Upload,
  CreditCard,
  Building2,
  QrCode,
  Wallet,
  Loader2,
  X,
  MessageSquare,
  AlertCircle,
  Trash2,
  Pencil,
  Info,
  Menu,
  ChevronLeft,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  ExternalLink,
  Car,
  Package,
  Wrench,
  Layers,
  Tag,
  Phone,
  PhoneCall,
  PhoneOff,
  HeartHandshake,
  Flag,
  CheckCircle,
  MessageCircle,
  MoreVertical,
  FileCheck2,
  Briefcase
} from "lucide-react";
import ChatFlowTracker from "@/components/chat/ChatFlowTracker";
import InAppVoiceCallModal from "@/components/chat/InAppVoiceCallModal";
import ReportModal from "@/components/modals/ReportModal";
import { detectDisintermediation, detectProhibitedContent } from "@/lib/security";

// Helper Identitas Profil / Toko: Menjamin nama profil/toko tersimpan tampil konsisten (bukan username/email prefix Google)
export function getPartyDisplayName(party, isRental = false, isHelper = false) {
  if (!party) return isHelper ? (isRental ? "Mitra Sewa" : "Helper Bantuin") : "Pemohon";

  const businessName = (party.partnerBusinessName || party.storeName || party.brandTitle || party.businessName || "").trim();
  const rawName = (party.name || party.fullName || "").trim();
  const emailPrefix = (party.email || "").split("@")[0].trim().toLowerCase();

  // 1. Jika rental dan pihak adalah helper / pemilik toko sewa, prioritaskan nama toko
  if (isRental && isHelper && businessName) return businessName;

  // 2. Jika mitra / partner resmi dan memiliki nama usaha
  if ((party.isPartner || party.accountRole === "partner") && businessName) return businessName;

  // 3. Jika rawName kosong atau sama persis dengan email prefix Google (seperti 'wahyump222') dan ada nama usaha tersimpan
  if (businessName && (!rawName || (emailPrefix && rawName.toLowerCase() === emailPrefix))) {
    return businessName;
  }

  // 4. Jika rawName adalah nama asli tersimpan yang bukan sekadar username Google (email prefix)
  if (rawName && (!emailPrefix || rawName.toLowerCase() !== emailPrefix)) {
    return rawName;
  }

  return businessName || rawName || (isHelper ? (isRental ? "Mitra Sewa" : "Helper Bantuin") : "Pemohon");
}

// Helper Kategori Global: Menjamin pilar Jasa, Bantuan, dan Sewa 100% konsisten
export function getCategoryMeta(room) {
  const catType = (room?.categoryType || "").toLowerCase();
  const orderType = (room?.orderType || "").toLowerCase();
  const rawCat = (room?.category || "").toLowerCase();
  const rawTitle = (room?.requestTitle || room?.title || "").toLowerCase();
  const roomId = (room?.id || "").toLowerCase();

  // 1. SEWA (Jika catType = sewa/rental atau orderType = rental)
  if (
    room?.isRental === true ||
    Boolean(room?.rentalId) ||
    Boolean(room?.bookingId) ||
    catType === "sewa" ||
    catType === "rental" ||
    orderType === "rental" ||
    rawCat.includes("sewa") ||
    rawCat.includes("rental") ||
    rawTitle.includes("sewa") ||
    rawTitle.includes("rental") ||
    roomId.includes("sewa") ||
    roomId.includes("rental")
  ) {
    return {
      type: "sewa",
      label: "Sewa",
      subLabel: room?.category || "Sewa Alat & Kendaraan",
      badgeClass: "bg-blue-50 text-[#1683FF] border border-blue-200/90",
      activeTabClass: "bg-[#1683FF] text-white shadow-xs font-bold",
      tabIndicatorClass: "bg-[#1683FF] text-white",
      dotClass: "bg-[#1683FF]",
      accentText: "text-[#1683FF]",
      accentBg: "bg-blue-50",
      accentBorder: "border-blue-200",
      pillClass: "bg-blue-50 text-[#1683FF]",
      icon: Package,
    };
  }

  // 2. BANTUAN (Prioritaskan jika kategori mengandung bantuan, errand, atau tipe tugas bantuan)
  if (
    catType === "bantuan" ||
    catType === "task" ||
    orderType === "task" ||
    rawCat.includes("bantuan") ||
    rawCat.includes("errand") ||
    rawCat.includes("kurir") ||
    rawCat.includes("titip") ||
    rawCat.includes("pindahan") ||
    rawCat.includes("belanja") ||
    rawCat.includes("bersih") ||
    rawCat.includes("rakit") ||
    rawCat.includes("bongkar") ||
    rawTitle.startsWith("bantuan:") ||
    rawTitle.startsWith("titip ") ||
    rawTitle.startsWith("ambil ") ||
    rawTitle.startsWith("antar ") ||
    roomId.includes("bantuan") ||
    roomId.includes("room-101") ||
    roomId.includes("task")
  ) {
    return {
      type: "bantuan",
      label: "Bantuan",
      subLabel: room?.category || "Bantuan & Errand",
      badgeClass: "bg-blue-50 text-[#1683FF] border border-blue-200/90",
      activeTabClass: "bg-[#1683FF] text-white shadow-xs font-bold",
      tabIndicatorClass: "bg-[#1683FF] text-white",
      dotClass: "bg-[#1683FF]",
      accentText: "text-[#1683FF]",
      accentBg: "bg-blue-50",
      accentBorder: "border-blue-200",
      pillClass: "bg-blue-50 text-[#1683FF]",
      icon: HeartHandshake,
    };
  }

  // 3. JASA (Jika pemesanan jasa profesional eksplisit)
  if (
    catType === "jasa" ||
    catType === "service" ||
    orderType === "service" ||
    rawCat.startsWith("jasa") ||
    rawTitle.includes("pemesanan jasa") ||
    rawTitle.startsWith("jasa:")
  ) {
    return {
      type: "jasa",
      label: "Jasa",
      subLabel: room?.category || "Layanan Jasa",
      badgeClass: "bg-blue-50 text-[#1683FF] border border-blue-200/90",
      activeTabClass: "bg-[#1683FF] text-white shadow-xs font-bold",
      tabIndicatorClass: "bg-[#1683FF] text-white",
      dotClass: "bg-[#1683FF]",
      accentText: "text-[#1683FF]",
      accentBg: "bg-blue-50",
      accentBorder: "border-blue-200",
      pillClass: "bg-blue-50 text-[#1683FF]",
      icon: Wrench,
    };
  }

  // Fallback default Bantuin adalah Bantuan
  return {
    type: "bantuan",
    label: "Bantuan",
    subLabel: room?.category || "Bantuan & Errand",
    badgeClass: "bg-blue-50 text-[#1683FF] border border-blue-200/90",
    activeTabClass: "bg-[#1683FF] text-white shadow-xs font-bold",
    tabIndicatorClass: "bg-[#1683FF] text-white",
    dotClass: "bg-[#1683FF]",
    accentText: "text-[#1683FF]",
    accentBg: "bg-blue-50",
    accentBorder: "border-blue-200",
    pillClass: "bg-blue-50 text-[#1683FF]",
    icon: HeartHandshake,
  };
}

/**
 * Format timestamp pesan chat agar akurat dan tersinkronisasi
 */
function formatMessageTime(msg) {
  if (!msg) return "";
  const raw = msg.createdAt || msg.timestamp;
  if (!raw) return "";

  // Prioritaskan konversi waktu nyata dari createdAt atau timestamp ISO
  try {
    const d = new Date(msg.createdAt || raw);
    if (!isNaN(d.getTime())) {
      return d.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: "Asia/Jakarta",
      }).replace(".", ":");
    }
  } catch {
    // fallback
  }

  if (typeof raw === "string" && /^\d{1,2}[:.]\d{2}$/.test(raw.trim())) {
    return raw.trim().replace(".", ":");
  }

  if (typeof msg.timestamp === "string" && msg.timestamp) {
    return msg.timestamp;
  }
  return "Baru saja";
}

function formatLastSeen(lastActiveAt) {
  if (!lastActiveAt) return "Offline";
  const now = Date.now();
  const time = new Date(lastActiveAt).getTime();
  if (isNaN(time) || time <= 0) return "Offline";
  const diffSec = Math.floor((now - time) / 1000);
  if (diffSec < 60) return "Baru saja aktif";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `Terakhir aktif ${diffMin} mnt lalu`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `Terakhir aktif ${diffHours} jam lalu`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays <= 7) return `Terakhir aktif ${diffDays} hari lalu`;
  return "Offline";
}

function calculateResponseTime(messages, helperId, requesterId) {
  if (!Array.isArray(messages) || messages.length < 2) {
    return "Belum tersedia";
  }

  const validDiffs = [];
  const sorted = [...messages].sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));

  for (let i = 0; i < sorted.length - 1; i++) {
    const current = sorted[i];
    if (current.isSystem || current.senderId === "system" || current.senderId === "bot-system") continue;

    if (current.senderId === requesterId) {
      for (let j = i + 1; j < sorted.length; j++) {
        const next = sorted[j];
        if (next.isSystem || next.senderId === "system" || next.senderId === "bot-system") continue;
        if (next.senderId === helperId) {
          const t1 = new Date(current.createdAt).getTime();
          const t2 = new Date(next.createdAt).getTime();
          const diffMinutes = (t2 - t1) / 60000;
          if (diffMinutes >= 0 && diffMinutes <= 1440) {
            validDiffs.push(diffMinutes);
          }
          break;
        } else if (next.senderId === requesterId) {
          break;
        }
      }
    }
  }

  if (validDiffs.length === 0) {
    return "Belum tersedia";
  }

  const avgMinutes = validDiffs.reduce((sum, d) => sum + d, 0) / validDiffs.length;
  if (avgMinutes < 3) return "Kilat (± 1-3 mnt)";
  if (avgMinutes <= 10) return "± 5-10 menit";
  if (avgMinutes < 60) return `± ${Math.round(avgMinutes)} menit`;
  const hours = Math.round(avgMinutes / 60);
  return `± ${hours} jam`;
}

function ChatWorkspaceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomParam = searchParams?.get("room");
  const partnerIdParam = searchParams?.get("partnerId");
  const serviceIdParam = searchParams?.get("serviceId");

  const {
    orderRooms = [],
    requests = [],
    currentUser,
    walletBalance,
    sendChatMessage,
    deleteChatMessage,
    editChatMessage,
    deleteChatRoom,
    updateOrderStatus,
    submitProof,
    confirmOrderCompletion,
    addToast,
    startJasaInquiry,
  } = useApp() || {};

  // Status obrolan riil dengan Admin CS
  const [adminCsSnippet, setAdminCsSnippet] = useState(null);
  useEffect(() => {
    let isMounted = true;
    const fetchAdminSnippet = async () => {
      try {
        const token = await authService.getValidAccessToken();
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await fetch("/api/chat/admin", { credentials: "include", headers });
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data) && json.data.length > 0) {
            const latestTicket = json.data[0];
            const msgs = latestTicket.messages || [];
            const lastMsg = msgs.length > 0 ? msgs[msgs.length - 1] : null;
            if (isMounted) {
              setAdminCsSnippet({
                lastMessage: lastMsg?.text || latestTicket.adminNotes || latestTicket.description || "Pusat Bantuan & Pengaduan",
                time: lastMsg?.time || latestTicket.resolvedAt || latestTicket.createdAt,
                hasUnread: latestTicket.adminNotes && latestTicket.status === "resolved",
              });
            }
          }
        }
      } catch (e) {}
    };
    fetchAdminSnippet();
    const interval = setInterval(fetchAdminSnippet, 5000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Real Database Chat Rooms — diisi oleh Supabase Realtime hook (tanpa polling)
  const [realDbRooms, setRealDbRooms] = useState([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(true);
  const [selectedRoomId, setSelectedRoomId] = useState(() => {
    if (roomParam) return roomParam;
    return "";
  });
  const selectedRoomIdRef = useRef(selectedRoomId);
  useEffect(() => {
    selectedRoomIdRef.current = selectedRoomId;
  }, [selectedRoomId]);

  // Callback stabil agar hook tidak re-subscribe setiap render
  const handleRoomsUpdate = useCallback((rooms, isInitial) => {
    setRealDbRooms((prev) => mergeRoomsPreservingOptimistic(rooms, prev));
    setIsLoadingRooms(false); // Selalu nonaktifkan loading saat data tiba
    if (isInitial) {
      if (roomParam) {
        const found = rooms.find((r) => r.id === roomParam || r.orderRoomId === roomParam || r.requestId === roomParam);
        if (found) {
          setSelectedRoomId(found.id);
          selectedRoomIdRef.current = found.id;
        } else {
          setSelectedRoomId(roomParam);
          selectedRoomIdRef.current = roomParam;
        }
      } else if (!selectedRoomIdRef.current && rooms.length > 0) {
        setSelectedRoomId(rooms[0].id);
        selectedRoomIdRef.current = rooms[0].id;
      }
    }
  }, [roomParam]);

  // Safety timer: Menjamin loading spinner tidak pernah macet lebih dari 1.5 detik
  useEffect(() => {
    const safetyTimer = setTimeout(() => {
      setIsLoadingRooms(false);
    }, 1500);
    return () => clearTimeout(safetyTimer);
  }, []);

  const { notifyChatUpdate, notifyChatRead } = useChatRealtime({
    currentUserId: currentUser?.id || null,
    roomParam: selectedRoomId || roomParam || null,
    onRoomsUpdate: handleRoomsUpdate,
    enabled: true,
  });

  // Combined rooms prioritizing real database rooms (No Mockups) & clean deduplication
  const allAvailableRooms = React.useMemo(() => {
    const list = [];
    const myId = currentUser?.id;

    // Helper: Periksa apakah user yang sedang login adalah partisipan resmi dari room ini
    const isParticipant = (room) => {
      if (!myId) return true;
      // Jangan tampilkan obrolan yang telah dihapus oleh pengguna yang sedang aktif
      if (Array.isArray(room.deletedFor) && room.deletedFor.includes(myId)) {
        return false;
      }
      const rId = room.requester?.id || room.requesterId;
      const hId = room.helper?.id || room.helperId;
      if (rId && rId === myId) return true;
      if (hId && hId === myId) return true;
      if (room.id && typeof room.id === "string" && room.id.includes(myId)) return true;
      return false;
    };

    // Helper: Periksa apakah 2 room merujuk ke bilik yang PERSIS SAMA (Bilik yang sama HANYA jika pasangan akunnya identik)
    const isSameRoom = (a, b) => {
      if (!a || !b) return false;
      const idA = typeof a.id === "string" ? a.id.trim() : "";
      const idB = typeof b.id === "string" ? b.id.trim() : "";

      if (idA && idB && idA === idB) return true;
      if (a.orderRoomId && b.orderRoomId && a.orderRoomId === b.orderRoomId) return true;

      // Ambil ID helper & requester kedua room
      const hA = a.helper?.id || a.helperId;
      const hB = b.helper?.id || b.helperId;
      const rA = a.requester?.id || a.requesterId;
      const rB = b.requester?.id || b.requesterId;

      // ATURAN ISOLASI AKUN KETAT:
      // Jika helper berbeda, DILARANG KERAS menggabungkan room!
      if (hA && hB && hA !== hB) return false;
      // Jika peminta berbeda, DILARANG KERAS menggabungkan room!
      if (rA && rB && rA !== rB) return false;

      // Jika merujuk ke request yang sama, HANYA boleh sama jika KEDUA partisipan (helper & peminta) identik
      const reqA = typeof a.requestId === "string" ? a.requestId.trim() : "";
      const reqB = typeof b.requestId === "string" ? b.requestId.trim() : "";
      if (reqA && reqB && reqA === reqB && reqA.length > 3) {
        if (hA && hB && hA === hB) return true;
        return false;
      }

      // Check if an inquiry formatted ID "inquiry-[requestId]-[helperId]" references the db room
      if (idA && idA.startsWith("inquiry-") && reqB && hB && reqB.length > 5 && hB.length > 5) {
        if (idA.includes(reqB) && idA.includes(hB)) return true;
      }
      if (idB && idB.startsWith("inquiry-") && reqA && hA && reqA.length > 5 && hA.length > 5) {
        if (idB.includes(reqA) && idB.includes(hA)) return true;
      }

      return false;
    };

    // Helper: Gabungkan pesan secara kronologis tanpa duplikat
    const mergeMessages = (msgsA = [], msgsB = []) => {
      const seenIds = new Set();
      const seenClientIds = new Set();
      const combined = [];

      const getClientMsgId = (m) => m?.clientMessageId || null;

      // 1. Masukkan pesan dari realDbRooms (DB) terlebih dahulu sebagai sumber otoritatif
      for (const m of (msgsA || [])) {
        if (!m) continue;
        if (m.id) seenIds.add(String(m.id));
        const cid = getClientMsgId(m);
        if (cid) seenClientIds.add(String(cid));
        combined.push(m);
      }

      // 2. Gabungkan pesan dari overlay AppContext / optimistic
      for (const m of (msgsB || [])) {
        if (!m) continue;

        // A. Cek ID permanen
        if (m.id && seenIds.has(String(m.id))) {
          continue;
        }

        // B. Cek clientMessageId
        const cid = getClientMsgId(m);
        if (cid && seenClientIds.has(String(cid))) {
          continue;
        }

        // Helper untuk mendapatkan timestamp numerik absolut yang aman & stabil
        const getMsgTime = (msg) => {
          if (!msg) return 0;
          if (msg.createdAt) {
            const t = new Date(msg.createdAt).getTime();
            if (!isNaN(t) && t > 0) return t;
          }
          if (msg.sentAt) {
            const t = new Date(msg.sentAt).getTime();
            if (!isNaN(t) && t > 0) return t;
          }
          if (typeof msg.timestamp === "number" && msg.timestamp > 0) return msg.timestamp;
          if (typeof msg.id === "string") {
            const match = msg.id.match(/\d{10,13}/);
            if (match) {
              const parsed = parseInt(match[0], 10);
              if (parsed > 1600000000) return parsed.toString().length === 10 ? parsed * 1000 : parsed;
            }
          }
          // Untuk pesan optimistik / baru tanpa tanggal backend, gunakan waktu lokal terkini agar selalu di bawah
          return msg._localTimestamp || Date.now();
        };

        // C. Cek apakah ini pesan sementara/optimistik yang sudah tersimpan di database
        const isTemp = m.isOptimistic || (typeof m.id === "string" && (m.id.startsWith("msg-") || m.id.startsWith("cmsg_")));
        if (isTemp) {
          const mText = (m.message || "").trim();
          const mSender = String(m.senderId || m.senderName || "");
          const mTime = getMsgTime(m);

          const alreadyInDb = (msgsA || []).some((dbM) => {
            if (!dbM) return false;
            const dbCid = getClientMsgId(dbM);
            if (cid && dbCid && cid === dbCid) return true;
            if (m.id && (dbM.id === m.id || dbM.clientMessageId === m.id)) return true;

            const dbText = (dbM.message || "").trim();
            const dbSender = String(dbM.senderId || dbM.senderName || "");
            if (dbText !== mText || dbSender !== mSender) return false;

            if (cid && dbCid && cid !== dbCid) return false;

            const dbTime = getMsgTime(dbM);
            if (mTime && dbTime) {
              return Math.abs(dbTime - mTime) <= 60000;
            }
            return true;
          });

          if (alreadyInDb) {
            continue;
          }
        }

        // Jika benar-benar unik, tambahkan ke list
        if (m.id) seenIds.add(String(m.id));
        if (cid) seenClientIds.add(String(cid));
        combined.push(m);
      }

      // Stable sort pesan chat: timestamp ascending dengan tie-breaker ID
      return combined.sort((x, y) => {
        const getSafeTime = (msg) => {
          if (!msg) return 0;
          if (msg.createdAt) {
            const t = new Date(msg.createdAt).getTime();
            if (!isNaN(t) && t > 0) return t;
          }
          if (msg.sentAt) {
            const t = new Date(msg.sentAt).getTime();
            if (!isNaN(t) && t > 0) return t;
          }
          if (typeof msg.timestamp === "number" && msg.timestamp > 0) return msg.timestamp;
          if (typeof msg.id === "string") {
            const match = msg.id.match(/\d{10,13}/);
            if (match) {
              const parsed = parseInt(match[0], 10);
              if (parsed > 1600000000) return parsed.toString().length === 10 ? parsed * 1000 : parsed;
            }
          }
          return msg._localTimestamp || Date.now();
        };

        const timeX = getSafeTime(x);
        const timeY = getSafeTime(y);
        if (timeX !== timeY) return timeX - timeY;
        if (x.isOptimistic && !y.isOptimistic) return 1;
        if (!x.isOptimistic && y.isOptimistic) return -1;
        return String(x.id || "").localeCompare(String(y.id || ""));
      });
    };

    // 1. Masukkan room DB asli terlebih dahulu (hanya yang user berhak mengakses)
    realDbRooms.filter(isParticipant).forEach((dbRoom) => {
      list.push({
        ...dbRoom,
        aliases: [dbRoom.id, dbRoom.orderRoomId].filter(Boolean),
      });
    });

    // 2. Gabungkan overlay orderRooms dari AppContext (hanya yang user berhak mengakses)
    (orderRooms || []).filter(isParticipant).forEach((ctxRoom) => {
      if (!ctxRoom || !ctxRoom.id) return;
      const existingIdx = list.findIndex((r) => isSameRoom(r, ctxRoom));
      if (existingIdx !== -1) {
        const existing = list[existingIdx];
        const mergedMessages = mergeMessages(existing.messages, ctxRoom.messages);

        const STATUS_PRIORITY = {
          cancelled: 100,
          refunded: 100,
          completed: 90,
          completed_confirmed: 90,
          verified_settled: 90,
          returned: 80,
          proof_submitted: 70,
          delivered: 70,
          task_delivered: 70,
          item_handed_over: 60,
          handed_over: 60,
          in_use: 60,
          in_progress: 50,
          item_picked_up: 50,
          heading_to_location: 40,
          driver_assigned: 30,
          accepted: 30,
          paid: 20,
          paid_escrow: 20,
          confirmed: 20,
          unpaid: 10,
        };
        const p1 = STATUS_PRIORITY[existing.orderStatus] || 0;
        const p2 = STATUS_PRIORITY[ctxRoom.orderStatus] || 0;
        const resolvedOrderStatus = p2 >= p1 ? (ctxRoom.orderStatus || existing.orderStatus) : (existing.orderStatus || ctxRoom.orderStatus);

        list[existingIdx] = {
          ...existing,
          ...ctxRoom,
          id: existing.id, // Pertahankan ID UUID resmi dari database
          requestId: existing.requestId || ctxRoom.requestId,
          aliases: Array.from(new Set([...(existing.aliases || []), ctxRoom.id, ctxRoom.orderRoomId].filter(Boolean))),
          orderStatus: resolvedOrderStatus,
          paymentStatus: existing.paymentStatus || ctxRoom.paymentStatus,
          stage: existing.stage || ctxRoom.stage,
          digitalFiles: (Array.isArray(ctxRoom.digitalFiles) && ctxRoom.digitalFiles.length > 0) ? ctxRoom.digitalFiles : (existing.digitalFiles || []),
          submissionUrl: (ctxRoom.submissionUrl && ctxRoom.submissionUrl !== "-") ? ctxRoom.submissionUrl : (existing.submissionUrl || ""),
          proofNotes: ctxRoom.proofNotes || existing.proofNotes || "",
          proofPhotos: (Array.isArray(ctxRoom.proofPhotos) && ctxRoom.proofPhotos.length > 0) ? ctxRoom.proofPhotos : (existing.proofPhotos || []),
          messages: mergedMessages,
        };
      } else {
        list.push({
          ...ctxRoom,
          aliases: [ctxRoom.id, ctxRoom.orderRoomId].filter(Boolean),
        });
      }
    });

    // DEDUKLIKASI KETAT BERDASARKAN ID BILIK UNIK: Menjamin 100% tidak ada room ganda di memori
    const seenUniqueRoomIds = new Set();
    const deduplicatedList = [];
    for (const r of list) {
      if (!r || !r.id) continue;
      const rid = String(r.id).trim();
      if (!seenUniqueRoomIds.has(rid)) {
        seenUniqueRoomIds.add(rid);
        deduplicatedList.push(r);
      }
    }

    // 3. Status Enforcement: Selama peminta belum bayar, STATUS TETAP DISKUSI (Tahap 1)
    const processedRooms = deduplicatedList.map((r) => {
      const relatedReq = (requests || []).find((req) => req.id === r.requestId);
      const isBantuan = r.orderType === "bantuan" || Boolean(r.requestId && !r.serviceId && !r.rentalId);
      const roomHelperId = r.helperId || r.helper?.id;

      // Khusus Bantuan: periksa apakah helper pada room ini adalah helper yang dipilih pemesan
      const isSelectedHelper = isBantuan && relatedReq?.selectedHelperId
        ? String(relatedReq.selectedHelperId) === String(roomHelperId)
        : true;
      const isUnselectedHelper = Boolean(isBantuan && relatedReq?.selectedHelperId && !isSelectedHelper);
      const isRoomCancelled = r.orderStatus === "cancelled" || r.orderStatus === "not_selected";

      // Jika ini pelamar bantuan yang tidak terpilih, atau room ditutup/dibatalkan: JANGAN pernah anggap lunas / aktif!
      if (isUnselectedHelper || (isBantuan && isRoomCancelled)) {
        return {
          ...r,
          stage: "inquiry",
          orderStatus: "not_selected",
          status: "not_selected",
          paymentStatus: "UNPAID",
        };
      }

      // Khusus Bantuan & Sewa: periksa status pembayaran entitas terkait
      const isRental = r.orderType === "rental" || r.categoryType === "sewa" || Boolean(r.rentalId || r.rentalDetails);
      const isRentalPaid = isRental && Boolean(
        r.paymentStatus === "PAID" ||
        r.rentalDetails?.paymentStatus === "PAID" ||
        r.booking?.paymentStatus === "PAID"
      );

      // Verifikasi apakah transaksi benar-benar sudah lunas / dana terkunci di rekber
      const isPaid = Boolean(
        r.paymentStatus === "PAID" ||
        isRentalPaid ||
        r.orderStatus === "paid_escrow" ||
        r.orderStatus === "item_handed_over" ||
        r.orderStatus === "handed_over" ||
        r.orderStatus === "in_use" ||
        r.orderStatus === "returned" ||
        r.orderStatus === "in_progress" ||
        r.orderStatus === "on_the_way" ||
        r.orderStatus === "item_picked_up" ||
        r.orderStatus === "task_delivered" ||
        r.orderStatus === "proof_submitted" ||
        r.orderStatus === "completed" ||
        r.orderStatus === "verified_settled" ||
        (isBantuan ? (relatedReq?.status === "in_progress" && isSelectedHelper) : false)
      );

      // JIKA BELUM BAYAR: Wajib berstatus Diskusi (Tahap 1 / inquiry)
      if (!isPaid) {
        // Hilangkan pesan fake "dana telah terverifikasi di rekber" jika belum bayar
        const cleanMessages = (r.messages || []).filter(
          (m) => !(m.isSystem && m.message && m.message.includes("Dana sebesar") && m.message.includes("aman terverifikasi"))
        );

        return {
          ...r,
          stage: "inquiry",
          orderStatus: r.orderStatus === "not_selected" ? "not_selected" : "inquiry",
          status: r.orderStatus === "not_selected" ? "not_selected" : "inquiry",
          paymentStatus: r.paymentStatus || "UNPAID",
          messages: cleanMessages,
        };
      }

      // JIKA SUDAH BAYAR: Berstatus Aktif (Tahap 2 / pesanan berjalan)
      return {
        ...r,
        stage: "active",
        orderStatus: r.orderStatus === "inquiry" ? "paid_escrow" : (r.orderStatus || "paid_escrow"),
        paymentStatus: "PAID",
      };
    });

    // 4. SORTING KRONOLOGIS UTAMA: Bilik obrolan dengan pesan / aktivitas terbaru SELALU berada di urutan paling atas
    return processedRooms.sort((a, b) => {
      const getRoomLatestTimestamp = (room) => {
        if (Array.isArray(room.messages) && room.messages.length > 0) {
          const lastMsg = room.messages[room.messages.length - 1];
          if (lastMsg?.createdAt) {
            const t = new Date(lastMsg.createdAt).getTime();
            if (!isNaN(t) && t > 0) return t;
          }
          if (lastMsg?.timestamp && typeof lastMsg.timestamp === "string") {
            const parts = lastMsg.timestamp.split(":");
            if (parts.length >= 2) {
              const h = parseInt(parts[0], 10);
              const m = parseInt(parts[1], 10);
              if (!isNaN(h) && !isNaN(m)) {
                const d = new Date();
                d.setHours(h, m, 0, 0);
                return d.getTime();
              }
            }
          }
        }
        if (room.updatedAt) {
          const t = new Date(room.updatedAt).getTime();
          if (!isNaN(t) && t > 0) return t;
        }
        if (room.createdAt) {
          const t = new Date(room.createdAt).getTime();
          if (!isNaN(t) && t > 0) return t;
        }
        return 0;
      };

      const timeA = getRoomLatestTimestamp(a);
      const timeB = getRoomLatestTimestamp(b);
      return timeB - timeA;
    });
  }, [realDbRooms, orderRooms, requests, currentUser?.id]);

  const selectedRoom = React.useMemo(() => {
    if (!allAvailableRooms || allAvailableRooms.length === 0) return null;
    const targetId = typeof selectedRoomId === "string" ? selectedRoomId.trim() : "";
    if (targetId && targetId !== "undefined" && targetId !== "null") {
      // 1. Strict exact match by unique room.id
      const match = allAvailableRooms.find((r) => String(r.id) === targetId);
      if (match) return match;

      // 2. Strict match by orderRoomId
      const matchOrder = allAvailableRooms.find((r) => r.orderRoomId && String(r.orderRoomId) === targetId);
      if (matchOrder) return matchOrder;

      // 3. Strict match in aliases
      const matchAlias = allAvailableRooms.find((r) => Array.isArray(r.aliases) && r.aliases.map(String).includes(targetId));
      if (matchAlias) return matchAlias;

      // 4. Link format inquiry-[requestId]-[helperId] (dari halaman Bantuan)
      const matchInquiry = allAvailableRooms.find((r) => {
        const reqId = r.requestId ? String(r.requestId) : "";
        const hId = String(r.helper?.id || r.helperId || "");
        return reqId.length > 5 && hId.length > 5 && targetId.includes(reqId) && targetId.includes(hId);
      });
      if (matchInquiry) return matchInquiry;

      // 5. Link berupa requestId saja
      const matchRequest = allAvailableRooms.find((r) => r.requestId && String(r.requestId) === targetId);
      if (matchRequest) return matchRequest;
    }
    return allAvailableRooms[0] || null;
  }, [allAvailableRooms, selectedRoomId]);

  // Deteksi role otomatis tanpa toggle manual (bisa override via ?role=helper atau ?role=requester)
  const roleParam = searchParams?.get("role");
  const activeRole = React.useMemo(() => {
    if (roleParam === "helper" || roleParam === "mitra") return "helper";
    if (roleParam === "requester" || roleParam === "client" || roleParam === "pemesan") return "requester";
    if (selectedRoom?.userRole) return selectedRoom.userRole;
    if (currentUser?.id) {
      if (selectedRoom?.helperId === currentUser.id || selectedRoom?.helper?.id === currentUser.id) return "helper";
      if (selectedRoom?.requesterId === currentUser.id || selectedRoom?.requester?.id === currentUser.id) return "requester";
    }
    if (currentUser?.email) {
      if (selectedRoom?.helper?.email?.toLowerCase() === currentUser.email.toLowerCase()) return "helper";
      if (selectedRoom?.requester?.email?.toLowerCase() === currentUser.email.toLowerCase()) return "requester";
    }
    if (currentUser?.isPartner || currentUser?.role === "partner" || currentUser?.role === "helper") {
      if (selectedRoom?.requester?.id && selectedRoom?.requester?.id !== currentUser?.id) {
        return "helper";
      }
    }
    return "requester";
  }, [roleParam, currentUser, selectedRoom]);

  const activeRoomIdRef = useRef(selectedRoomId);

  // Sinkronisasi status pembayaran otomatis di latar belakang saat bilik obrolan yang belum lunas aktif dibuka
  const syncedRoomPaymentsRef = useRef(new Set());
  const [isCheckingPayment, setIsCheckingPayment] = useState(false);

  useEffect(() => {
    if (!selectedRoom?.id) return;
    if (selectedRoom.paymentStatus === "PAID" || selectedRoom.orderStatus === "paid_escrow") return;
    if (selectedRoom.orderStatus === "not_selected" || selectedRoom.orderStatus === "cancelled") return;

    const roomId = selectedRoom.id;
    if (syncedRoomPaymentsRef.current.has(roomId)) return;
    syncedRoomPaymentsRef.current.add(roomId);

    let isSubscribed = true;
    (async () => {
      try {
        const token = await authService.getValidAccessToken();
        if (!token || !isSubscribed) return;
        const res = await fetch(`/api/payments/status?entityId=${encodeURIComponent(roomId)}&entityType=order`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok || !isSubscribed) return;
        const json = await res.json().catch(() => ({}));
        if (isSubscribed && json.success && (json.data?.paymentStatus === "PAID" || json.data?.isPaid)) {
          setRealDbRooms((prev) =>
            prev.map((r) =>
              r.id === roomId || r.orderRoomId === roomId
                ? { ...r, paymentStatus: "PAID", orderStatus: "paid_escrow", stage: "active" }
                : r
            )
          );
          if (typeof window !== "undefined") {
            window.dispatchEvent(new Event("bantuin_chat_update"));
          }
        }
      } catch (_) {}
    })();

    return () => {
      isSubscribed = false;
    };
  }, [selectedRoom?.id, selectedRoom?.paymentStatus, selectedRoom?.orderStatus]);

  // Pemeriksaan manual status pembayaran terkini dengan Midtrans gateway
  const handleCheckPaymentStatus = async () => {
    if (!selectedRoom?.id || isCheckingPayment) return;
    setIsCheckingPayment(true);
    try {
      const token = await authService.getValidAccessToken();
      const res = await fetch(`/api/payments/status?entityId=${encodeURIComponent(selectedRoom.id)}&entityType=order`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const json = await res.json().catch(() => ({}));
      if (json.success && (json.data?.paymentStatus === "PAID" || json.data?.isPaid)) {
        setRealDbRooms((prev) =>
          prev.map((r) =>
            r.id === selectedRoom.id || r.orderRoomId === selectedRoom.id
              ? { ...r, paymentStatus: "PAID", orderStatus: "paid_escrow", stage: "active" }
              : r
          )
        );
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("bantuin_chat_update"));
        }
        addToast?.("Pembayaran Terverifikasi!", "Status pembayaran telah lunas dan pengerjaan tugas dapat segera dimulai.", "success");
      } else {
        addToast?.("Menunggu Pembayaran", "Pembayaran belum terdeteksi lunas oleh gateway. Jika baru saja transfer, mohon tunggu beberapa detik.", "info");
      }
    } catch (err) {
      addToast?.("Kendala Pemeriksaan", "Gagal menghubungi server status pembayaran.", "error");
    } finally {
      setIsCheckingPayment(false);
    }
  };

  // Sinkronisasi tanda pesan dibaca (Read Receipt) secara aktual saat bilik obrolan sedang aktif dibuka
  useEffect(() => {
    if (!selectedRoom?.id || !currentUser?.id) return;
    if (typeof document !== "undefined" && document.visibilityState === "hidden") return;

    const currentRoomId = selectedRoom.id;
    const hasUnread = (selectedRoom.messages || []).some(
      (m) => m.senderId !== currentUser.id && m.isRead === false
    );

    if (hasUnread) {
      fetch("/api/chat/messages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark_read", roomId: currentRoomId }),
      }).catch(() => null);

      setRealDbRooms((prev) =>
        prev.map((r) => {
          if (r.id === currentRoomId || r.orderRoomId === currentRoomId) {
            const updatedMessages = (r.messages || []).map((m) =>
              m.senderId !== currentUser.id ? { ...m, isRead: true } : m
            );
            return { ...r, unreadCount: 0, messages: updatedMessages };
          }
          return r;
        })
      );

      const partnerId = (activeRole === "helper")
        ? (selectedRoom?.requester?.id || selectedRoom?.requesterId)
        : (selectedRoom?.helper?.id || selectedRoom?.helperId);
      notifyChatRead?.({ roomId: currentRoomId, partnerId });
    }
  }, [selectedRoom?.id, selectedRoom?.messages, currentUser?.id, activeRole, notifyChatRead]);

  // Ref untuk menjamin inisialisasi roomParam / URL hanya berjalan SATU KALI pada saat pertama kali dimuat
  const isInitialRoomSetRef = useRef(false);

  useEffect(() => {
    // Jika sudah pernah memilih atau inisialisasi awal sudah selesai, jangan pernah override pilihan user!
    if (isInitialRoomSetRef.current) return;
    if (!allAvailableRooms || allAvailableRooms.length === 0) return;

    if (roomParam) {
      const match = allAvailableRooms.find(
        (r) =>
          r.id === roomParam ||
          (Array.isArray(r.aliases) && r.aliases.includes(roomParam)) ||
          r.requestId === roomParam
      );
      if (match) {
        setSelectedRoomId(match.id);
        activeRoomIdRef.current = match.id;
        isInitialRoomSetRef.current = true;
        return;
      }
    }

    if (partnerIdParam || serviceIdParam) {
      const existing = allAvailableRooms.find(
        (r) =>
          r.helper?.id === partnerIdParam ||
          r.requestId === serviceIdParam ||
          (r.aliases && (r.aliases.includes(serviceIdParam) || r.aliases.includes(partnerIdParam))) ||
          (r.id && partnerIdParam && r.id.includes(partnerIdParam))
      );
      if (existing) {
        setSelectedRoomId(existing.id);
        activeRoomIdRef.current = existing.id;
        isInitialRoomSetRef.current = true;
        return;
      }
    }

    if (!selectedRoomId && allAvailableRooms.length > 0) {
      setSelectedRoomId(allAvailableRooms[0].id);
      activeRoomIdRef.current = allAvailableRooms[0].id;
      isInitialRoomSetRef.current = true;
    }
  }, [roomParam, partnerIdParam, serviceIdParam, allAvailableRooms, selectedRoomId]);

  // Sinkronisasi spesifik jika roomParam berasal dari URL dan belum masuk di daftar obrolan lokal (Dijamin hanya dipanggil 1 kali per roomParam)
  const attemptedRoomFetchesRef = useRef(new Set());
  useEffect(() => {
    if (!roomParam) return;
    if (["admin", "cs", "bantuan_cs", "support", "help"].includes(roomParam)) {
      router.push("/chat/admin");
      return;
    }
    if (attemptedRoomFetchesRef.current.has(roomParam)) return;

    const isAlreadyPresent = realDbRooms.some(
      (r) => r.id === roomParam || r.orderRoomId === roomParam || r.requestId === roomParam
    );
    if (!isAlreadyPresent) {
      attemptedRoomFetchesRef.current.add(roomParam);
      (async () => {
        try {
          const token = await authService.getValidAccessToken();
          const headers = token ? { Authorization: `Bearer ${token}` } : {};
          const res = await fetch(`/api/chat/rooms?roomId=${encodeURIComponent(roomParam)}`, { headers });
          if (res.ok) {
            const json = await res.json();
            if (json.success && Array.isArray(json.data) && json.data.length > 0) {
              const fetched = json.data[0];
              setRealDbRooms((prev) => mergeRoomsPreservingOptimistic([fetched], prev));
              setSelectedRoomId(fetched.id);
              selectedRoomIdRef.current = fetched.id;
            }
          }
        } catch (_) {}
      })();
    }
  }, [roomParam]);

  // Jika membuka obrolan langsung dari profil toko mitra (/mitra/[id]) (Dijamin hanya dipanggil 1 kali per partnerIdParam)
  const attemptedPartnerFetchesRef = useRef(new Set());
  useEffect(() => {
    if (!partnerIdParam || roomParam) return;
    if (attemptedPartnerFetchesRef.current.has(partnerIdParam)) return;

    const exists = allAvailableRooms.some(
      (r) => r.helper?.id === partnerIdParam || r.helperId === partnerIdParam
    );
    if (!exists && currentUser?.id && currentUser.id !== partnerIdParam) {
      attemptedPartnerFetchesRef.current.add(partnerIdParam);
      (async () => {
        try {
          const token = await authService.getValidAccessToken();
          const headers = { "Content-Type": "application/json" };
          if (token) headers.Authorization = `Bearer ${token}`;
          const res = await fetch("/api/chat/rooms", {
            method: "POST",
            headers,
            body: JSON.stringify({ partnerId: partnerIdParam }),
          });
          if (res.ok) {
            const json = await res.json();
            if (json.success && json.data?.id) {
              const fetchRoomRes = await fetch(`/api/chat/rooms?roomId=${encodeURIComponent(json.data.id)}`, { headers });
              if (fetchRoomRes.ok) {
                const roomJson = await fetchRoomRes.json();
                if (roomJson.success && Array.isArray(roomJson.data) && roomJson.data.length > 0) {
                  setRealDbRooms((prev) => mergeRoomsPreservingOptimistic(roomJson.data, prev));
                }
              }
              setSelectedRoomId(json.data.id);
              selectedRoomIdRef.current = json.data.id;
            }
          }
        } catch (_) {}
      })();
    }
  }, [partnerIdParam, roomParam, currentUser?.id]);

  // Fallback HANYA jika room yang dipilih benar-benar dihapus secara permanen
  useEffect(() => {
    if (!selectedRoomId || !allAvailableRooms || allAvailableRooms.length === 0) return;
    if (isLoadingRooms) return;
    if (roomParam && selectedRoomId === roomParam) return;

    const exists = allAvailableRooms.some((r) => {
      if (r.id === selectedRoomId) return true;
      if (r.orderRoomId === selectedRoomId) return true;
      if (Array.isArray(r.aliases) && r.aliases.includes(selectedRoomId)) return true;
      const hId = r.helper?.id || r.helperId;
      const reqId = r.requestId;
      if (hId && reqId && selectedRoomId.includes(reqId) && selectedRoomId.includes(hId)) return true;
      return false;
    });

    if (!exists) {
      setSelectedRoomId(allAvailableRooms[0].id);
      selectedRoomIdRef.current = allAvailableRooms[0].id;
      activeRoomIdRef.current = allAvailableRooms[0].id;
    }
  }, [allAvailableRooms, selectedRoomId, isLoadingRooms, roomParam]);

  // Responsive UI States
  const [mobileView, setMobileView] = useState("chat"); // 'list' | 'chat'
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // Toggle daftar obrolan (kiri)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false); // Toggle rincian (kanan) - default tertutup agar chat luas
  const [showRightDrawerMobile, setShowRightDrawerMobile] = useState(false);

  // UI State
  const [searchQuery, setSearchQuery] = useState("");
  const categoryParam = searchParams?.get("category");
  const [categoryFilter, setCategoryFilter] = useState(() => {
    if (categoryParam && ["jasa", "bantuan", "sewa"].includes(categoryParam.toLowerCase())) {
      return categoryParam.toLowerCase();
    }
    return "all";
  });
  const [statusFilter, setStatusFilter] = useState("all"); // 'all' | 'inquiry' | 'active'

  useEffect(() => {
    if (categoryParam && ["jasa", "bantuan", "sewa"].includes(categoryParam.toLowerCase())) {
      setCategoryFilter(categoryParam.toLowerCase());
    }
  }, [categoryParam]);
  
  const [chatInput, setChatInput] = useState("");
  const [roomDrafts, setRoomDrafts] = useState({});
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const isSendingRef = useRef(false);
  const [chatUploadStatus, setChatUploadStatus] = useState({
    state: "idle", // "idle" | "uploading" | "sending" | "success" | "error"
    fileName: "",
    error: null,
  });

  // Isolasi draft per percakapan (Draft isolation per room)
  useEffect(() => {
    const oldRoomId = activeRoomIdRef.current;
    if (oldRoomId && oldRoomId !== selectedRoomId) {
      // Simpan draft untuk room sebelumnya
      setRoomDrafts((prev) => {
        const updated = { ...prev, [oldRoomId]: chatInput };
        try {
          if (typeof window !== "undefined" && currentUser?.id) {
            sessionStorage.setItem(`bantuin_draft_${currentUser.id}_${oldRoomId}`, chatInput);
          }
        } catch {}
        return updated;
      });
    }

    // Pulihkan draft khusus untuk room yang baru dibuka (jika ada)
    let restoredDraft = "";
    if (selectedRoomId) {
      if (roomDrafts[selectedRoomId] !== undefined) {
        restoredDraft = roomDrafts[selectedRoomId];
      } else {
        try {
          if (typeof window !== "undefined" && currentUser?.id) {
            restoredDraft = sessionStorage.getItem(`bantuin_draft_${currentUser.id}_${selectedRoomId}`) || "";
          }
        } catch {}
      }
    }
    setChatInput(restoredDraft);
    activeRoomIdRef.current = selectedRoomId;
  }, [selectedRoomId]);

  // Bersihkan draft jika pengguna berganti akun
  useEffect(() => {
    setRoomDrafts({});
    setChatInput("");
  }, [currentUser?.id]);

  const handleChatInputChange = (e) => {
    const val = e.target.value;
    setChatInput(val);
    if (selectedRoomId) {
      setRoomDrafts((prev) => ({ ...prev, [selectedRoomId]: val }));
      try {
        if (typeof window !== "undefined" && currentUser?.id) {
          sessionStorage.setItem(`bantuin_draft_${currentUser.id}_${selectedRoomId}`, val);
        }
      } catch {}
    }
  };

  // Handler pemilihan room yang stabil dan menjaga URL tetap sinkron
  const handleSelectRoom = useCallback((room) => {
    if (!room || !room.id) return;
    const targetRoomId = room.id;
    setSelectedRoomId(targetRoomId);
    activeRoomIdRef.current = targetRoomId;
    isInitialRoomSetRef.current = true;
    setMobileView("chat");

    if (typeof window !== "undefined") {
      try {
        const url = new URL(window.location.href);
        url.searchParams.set("room", targetRoomId);
        url.searchParams.delete("partnerId");
        url.searchParams.delete("serviceId");
        window.history.replaceState(null, "", url.toString());
      } catch (_) {}
    }
  }, []);

  // Otomatis tandai seluruh pesan masuk yang belum dibaca sebagai telah dibaca (isRead = true)
  useEffect(() => {
    if (!selectedRoom || !selectedRoom.id) return;
    const myId = currentUser?.id;
    const targetRoomId = selectedRoom.id;
    const hasUnread = (selectedRoom.messages || []).some(
      (m) => m && m.senderId && m.senderId !== myId && !m.isRead && !m.isSystem
    );

    if (hasUnread) {
      // 1. Update optimistik lokal agar status unread badge seketika hilang
      setRealDbRooms((prev) =>
        prev.map((r) => {
          if (r.id === targetRoomId || r.orderRoomId === targetRoomId) {
            const updated = (r.messages || []).map((m) =>
              m.senderId !== myId && !m.isRead ? { ...m, isRead: true } : m
            );
            return { ...r, messages: updated, unreadCount: 0 };
          }
          return r;
        })
      );

      // 2. Kirim update ke server PostgreSQL
      (async () => {
        try {
          const token = await authService.getValidAccessToken();
          const headers = { "Content-Type": "application/json" };
          if (token) headers.Authorization = `Bearer ${token}`;

          await fetch("/api/chat/messages", {
            method: "PATCH",
            headers,
            body: JSON.stringify({
              action: "mark_read",
              roomId: targetRoomId,
            }),
          });

          // 3. Broadcast notifikasi realtime ke lawan bicara agar centang berubah menjadi biru ganda
          const partnerId = (activeRole === "helper")
            ? (selectedRoom?.requester?.id || selectedRoom?.requesterId)
            : (selectedRoom?.helper?.id || selectedRoom?.helperId);
          notifyChatUpdate?.({ roomId: targetRoomId, partnerId });
        } catch (err) {
          console.warn("Auto mark-as-read warning:", err);
        }
      })();
    }
  }, [selectedRoom?.id, selectedRoom?.messages, currentUser?.id, activeRole, notifyChatUpdate]);

  const [lightboxImage, setLightboxImage] = useState(null); // Preview full size image proof
  const [isVoiceCallOpen, setIsVoiceCallOpen] = useState(false); // Modal Telepon In-App
  const [isReportModalOpen, setIsReportModalOpen] = useState(false); // Modal Pelaporan & Pengaduan (Notice & Takedown)
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false); // Menu Popover Titik 3 Aksi
  const moreMenuRef = useRef(null);

  // Close more popover on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target)) {
        setIsMoreMenuOpen(false);
      }
    };
    if (isMoreMenuOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isMoreMenuOpen]);

  // Edit & Delete Message State
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editingText, setEditingText] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null); // { type: 'message' | 'room', roomId, msgId }
  const [isDeletingTarget, setIsDeletingTarget] = useState(false);

  // Deliverables Modal
  const [isProofModalOpen, setIsProofModalOpen] = useState(false);
  const [digitalFiles, setDigitalFiles] = useState([]);
  const [submissionUrl, setSubmissionUrl] = useState(selectedRoom?.submissionUrl || "");
  const [proofNotes, setProofNotes] = useState("");
  const [isSubmittingProof, setIsSubmittingProof] = useState(false);
  const isSubmittingProofRef = useRef(false);

  // Rating & Review Modal
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [ratingValue, setRatingValue] = useState(5);
  const [reviewFeedback, setReviewFeedback] = useState("");
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  const isSubmittingRatingRef = useRef(false);

  const chatFileInputRef = useRef(null);
  const digitalDocInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const isNearBottomRef = useRef(true);
  const lastRoomIdRef = useRef(null);
  const lastMessagesLengthRef = useRef(0);
  const lastMessageIdRef = useRef(null);
  const userJustSentMessageRef = useRef(false);

  const handleMessagesScroll = useCallback(() => {
    const el = messagesContainerRef.current;
    if (!el) return;
    const distanceToBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    isNearBottomRef.current = distanceToBottom <= 150;
  }, []);

  // Memoize filtered messages so security regex scans don't run on every single keypress
  const filteredMessages = useMemo(() => {
    if (!selectedRoom?.messages) return [];
    return selectedRoom.messages.filter((msg) => {
      if (msg.isSystem || msg.callRecord) return true;
      if (msg.hasWarningFlag || msg.hasWarning) return false;
      if (detectDisintermediation(msg.message).flagged) return false;
      if (detectProhibitedContent(msg.message).flagged) return false;
      return true;
    });
  }, [selectedRoom?.messages]);

  useEffect(() => {
    if (!selectedRoom?.id) return;
    const currentRoomId = selectedRoom.id;
    const currentMsgs = selectedRoom.messages || [];
    const currentLength = currentMsgs.length;
    const currentLastMsg = currentMsgs[currentLength - 1];
    const currentLastMsgId = currentLastMsg?.id || currentLastMsg?.clientMessageId || null;

    const isRoomChanged = lastRoomIdRef.current !== currentRoomId;
    const isNewMessage =
      currentLength > lastMessagesLengthRef.current ||
      (currentLastMsgId && currentLastMsgId !== lastMessageIdRef.current);
    const userJustSent = userJustSentMessageRef.current;
    const myId = currentUser?.id;
    const isMyNewMessage =
      isNewMessage &&
      currentLastMsg &&
      (currentLastMsg.senderId === myId || currentLastMsg.isOptimistic);

    lastRoomIdRef.current = currentRoomId;
    lastMessagesLengthRef.current = currentLength;
    lastMessageIdRef.current = currentLastMsgId;

    if (isRoomChanged) {
      // Ganti room: langsung scroll ke bawah secara instan tanpa animasi mengganggu
      isNearBottomRef.current = true;
      requestAnimationFrame(() => {
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        } else {
          messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
        }
      });
      return;
    }

    if (userJustSent || isMyNewMessage) {
      // Pengguna baru saja mengirim pesan / berkas: scroll halus ke paling bawah
      userJustSentMessageRef.current = false;
      isNearBottomRef.current = true;
      requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      });
      return;
    }

    if (isNewMessage && isNearBottomRef.current) {
      // Ada pesan baru masuk DAN pengguna memang sedang berada di posisi paling bawah
      requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      });
    }
    // Jika pengguna sedang scroll ke atas membaca riwayat sebelumnya: DILARANG SCROLL OTOMATIS!
  }, [selectedRoom?.id, selectedRoom?.messages, currentUser?.id]);

  // Mode: Online vs Offline & Physical Location Detection
  const isOnline = Boolean(
    selectedRoom?.mode === "online" ||
    selectedRoom?.category?.toLowerCase?.()?.includes("desain") ||
    selectedRoom?.category?.toLowerCase?.()?.includes("tugas")
  );

  const selectedRoomMeta = getCategoryMeta(selectedRoom);
  const isPhysicalRoom = Boolean(
    selectedRoomMeta?.type === "sewa" ||
    (selectedRoomMeta?.type === "bantuan" && selectedRoom?.mode !== "online") ||
    (selectedRoomMeta?.type === "jasa" && !isOnline)
  );

  const roomLocationText =
    selectedRoom?.locationName ||
    selectedRoom?.rentalDetails?.pickupLocation ||
    selectedRoom?.pickupLocation ||
    selectedRoom?.pickupPoint ||
    selectedRoom?.serviceDetails?.address ||
    selectedRoom?.address ||
    selectedRoom?.helper?.partnerAddress ||
    "";

  const roomMapsUrl = isPhysicalRoom
    ? (selectedRoom?.googleMapsUrl || getGoogleMapsUrl(
        (selectedRoom?.latitude && selectedRoom?.longitude)
          ? { latitude: selectedRoom.latitude, longitude: selectedRoom.longitude }
          : (selectedRoom?.request?.latitude && selectedRoom?.request?.longitude)
          ? { latitude: selectedRoom.request.latitude, longitude: selectedRoom.request.longitude }
          : roomLocationText
      ))
    : null;

  const isOrderActive = Boolean(
    selectedRoom &&
    (selectedRoom.orderStatus === "room_created" ||
     selectedRoom.orderStatus === "paid_escrow" ||
     selectedRoom.orderStatus === "on_the_way" ||
     selectedRoom.orderStatus === "item_picked_up" ||
     selectedRoom.orderStatus === "in_progress" ||
     selectedRoom.orderStatus === "task_delivered" ||
     selectedRoom.orderStatus === "proof_submitted" ||
     selectedRoom.orderStatus === "completed" ||
     selectedRoom.stage === "active")
  );

  const isInquiry = Boolean(
    selectedRoom &&
    !isOrderActive &&
    (selectedRoom.stage === "inquiry" || selectedRoom.orderStatus === "inquiry" || selectedRoom.orderStatus === "not_selected")
  );
  const isNotSelected = selectedRoom?.orderStatus === "not_selected";

  // Collect all completion proof photos & notes from selectedRoom or messages
  const currentProofPhotos = React.useMemo(() => {
    if (!selectedRoom) return [];
    const seen = new Set();
    const unique = [];
    const addUrl = (url) => {
      if (!url || typeof url !== "string") return;
      const normalized = url.trim().replace(/^https?:\/\/[^/]+/i, "").split("?")[0];
      if (!seen.has(normalized)) {
        seen.add(normalized);
        unique.push(url);
      }
    };
    if (selectedRoom.proofPhotos && Array.isArray(selectedRoom.proofPhotos)) {
      selectedRoom.proofPhotos.forEach(addUrl);
    }
    if (selectedRoom.messages && Array.isArray(selectedRoom.messages)) {
      selectedRoom.messages.forEach((m) => {
        if (m.proofPhotos && Array.isArray(m.proofPhotos)) {
          m.proofPhotos.forEach(addUrl);
        }
        if (m.photos && Array.isArray(m.photos) && (m.isTaskProof || m.isHandoverProof)) {
          m.photos.forEach(addUrl);
        }
        if (m.isJasaDeliverablesProof && m.proofData?.photos) {
          m.proofData.photos.forEach(addUrl);
        }
      });
    }
    return unique;
  }, [selectedRoom]);

  const currentProofNotes = React.useMemo(() => {
    if (!selectedRoom) return "";
    if (selectedRoom.proofNotes) return selectedRoom.proofNotes;
    if (selectedRoom.messages && Array.isArray(selectedRoom.messages)) {
      const proofMsg = selectedRoom.messages.find((m) => (m.isTaskProof || m.isHandoverProof || m.isJasaDeliverablesProof) && (m.notes || m.proofData?.notes));
      if (proofMsg) return proofMsg.notes || proofMsg.proofData?.notes || "";
    }
    return "";
  }, [selectedRoom]);

  // Comprehensive Deliverables Data for Sidebar and Modals
  const deliverableData = React.useMemo(() => {
    if (!selectedRoom) return { submissionUrl: null, files: [], notes: "" };

    let submissionUrl = selectedRoom.submissionUrl || null;
    let files = Array.isArray(selectedRoom.digitalFiles) ? [...selectedRoom.digitalFiles] : [];
    let notes = selectedRoom.proofNotes || "";

    // Scan messages (reverse to get newest deliverable details first)
    if (selectedRoom.messages && Array.isArray(selectedRoom.messages)) {
      const reversedMsgs = [...selectedRoom.messages].reverse();

      // Check deliverables / task proof messages (Jasa & Bantuan)
      for (const m of reversedMsgs) {
        const isProof = Boolean(
          m.isJasaDeliverablesProof ||
          m.isTaskProof ||
          m.isDeliverable ||
          (m.message && (
            m.message.includes("Helper telah menyelesaikan tugas") ||
            m.message.includes("Penyedia jasa telah menyerahkan") ||
            m.message.includes("mengunggah hasil pengerjaan")
          ))
        );

        if (isProof) {
          const mSubUrl = (m.submissionUrl && m.submissionUrl !== "-")
            ? m.submissionUrl
            : (m.proofData?.submissionUrl && m.proofData.submissionUrl !== "-" ? m.proofData.submissionUrl : null);
          if (!submissionUrl && mSubUrl) {
            submissionUrl = mSubUrl;
          }

          const mFiles = (Array.isArray(m.digitalFiles) && m.digitalFiles.length > 0)
            ? m.digitalFiles
            : (Array.isArray(m.proofData?.files) && m.proofData.files.length > 0
                ? m.proofData.files
                : (Array.isArray(m.proofData?.digitalFiles) ? m.proofData.digitalFiles : []));
          if (mFiles && mFiles.length > 0) {
            mFiles.forEach((f) => {
              if (!files.some((existing) => existing.name === f.name || (existing.url && existing.url === f.url))) {
                files.push(f);
              }
            });
          }

          const mNotes = m.notes || m.proofData?.notes || m.proofNotes;
          if (!notes && mNotes) {
            notes = mNotes;
          }
        }
      }

      // Check attachments and photos in chat
      reversedMsgs.forEach((m) => {
        if (m.attachment && m.attachment.url) {
          if (!files.some((existing) => (existing.url && existing.url === m.attachment.url) || existing.name === m.attachment.name)) {
            files.push({
              id: m.id || `att-${Date.now()}`,
              name: m.attachment.name || "Berkas Lampiran",
              size: m.attachment.size || "File Lampiran",
              url: m.attachment.url,
              type: m.attachment.isImage ? "image" : "file",
              senderName: m.senderName,
              timestamp: m.timestamp,
            });
          }
        } else if (m.attachmentUrls && Array.isArray(m.attachmentUrls) && m.attachmentUrls.length > 0) {
          m.attachmentUrls.forEach((url, uIdx) => {
            if (!files.some((existing) => existing.url === url)) {
              const urlParts = url.split("/");
              const rawName = decodeURIComponent(urlParts[urlParts.length - 1] || "Lampiran").replace(/^\d+-[a-z0-9]+-/, "");
              files.push({
                id: `${m.id || "att"}-${uIdx}`,
                name: rawName || `Berkas Lampiran ${uIdx + 1}`,
                size: "Lampiran Chat",
                url: url,
                type: "image",
                senderName: m.senderName,
                timestamp: m.timestamp,
              });
            }
          });
        }
      });
    }

    // Check proofPhotos on selectedRoom
    if (selectedRoom.proofPhotos && Array.isArray(selectedRoom.proofPhotos)) {
      selectedRoom.proofPhotos.forEach((photoUrl, pIdx) => {
        if (!files.some((existing) => existing.url === photoUrl)) {
          const urlParts = photoUrl.split("/");
          const rawName = decodeURIComponent(urlParts[urlParts.length - 1] || `Foto Bukti ${pIdx + 1}`).replace(/^\d+-[a-z0-9]+-/, "");
          files.push({
            id: `proof-photo-${pIdx}`,
            name: rawName || `Foto Bukti ${pIdx + 1}`,
            size: "Foto Bukti Hasil",
            url: photoUrl,
            type: "image",
          });
        }
      });
    }

    // Extract URL from notes if not yet present
    if (notes && !submissionUrl) {
      const match = notes.match(/https?:\/\/[^\s]+/i);
      if (match) {
        submissionUrl = match[0];
      }
    }

    // Clean notes from URL prefix if present for cleaner display
    let displayNotes = notes;
    if (submissionUrl && displayNotes.includes(submissionUrl)) {
      displayNotes = displayNotes.replace(submissionUrl, "").trim();
    }

    return {
      submissionUrl: submissionUrl && submissionUrl !== "-" ? submissionUrl : null,
      files,
      notes: displayNotes,
    };
  }, [selectedRoom]);

  // Workflow Stepper definition (for active orders)
  const steps = isOnline
    ? [
        { key: "room_created", label: "Room Terbuka" },
        { key: "in_progress", label: "Pengerjaan Digital" },
        { key: "completed", label: "Berkas Selesai" },
      ]
    : [
        { key: "room_created", label: "Room Terbuka" },
        { key: "on_the_way", label: "Menuju Lokasi" },
        { key: "item_picked_up", label: "Ambil Tugas" },
        { key: "completed", label: "Konfirmasi & Selesai" },
      ];

  const getStepIndex = (status) => {
    if (status === "completed") return steps.length - 1;
    if (isOnline) {
      if (status === "in_progress") return 1;
      return 0;
    }
    if (status === "item_picked_up") return 2;
    if (status === "on_the_way") return 1;
    return 0;
  };

  const currentStepIdx = getStepIndex(selectedRoom?.orderStatus);

  // Panggilan Suara In-App (Privasi Terjaga)
  const handleStartCall = () => {
    if (!selectedRoom) return;
    setIsVoiceCallOpen(true);
  };

  const handleCallEnded = (durationSec) => {
    if (!selectedRoom) return;
    const mins = Math.floor(durationSec / 60);
    const secs = durationSec % 60;
    const timeStr = `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;

    const messageText = durationSec > 0
      ? `Panggilan Suara In-App Selesai (${timeStr})`
      : `Panggilan Suara Tak Terjawab`;

    userJustSentMessageRef.current = true;
    sendChatMessage(selectedRoom.id, messageText, {
      callRecord: {
        duration: durationSec,
        timeFormatted: timeStr,
        timestamp: new Date().toISOString(),
      }
    });

    addToast?.(
      "Panggilan Suara Selesai",
      `Panggilan dengan ${selectedRoom.helper?.name || "Mitra"} selesai (${timeStr}). Nomor HP tetap terjaga rahasia.`,
      "info"
    );
  };

  // Handle Chat Submit dengan proteksi anti-disintermediasi, anti-konten terlarang, & anti-spam debounce
  const handleSend = async (e) => {
    e?.preventDefault();
    if (isSendingRef.current || isSendingMessage || !chatInput.trim() || !selectedRoom) return;

    const text = chatInput.trim();
    isSendingRef.current = true;
    setIsSendingMessage(true);

    // 1. Cek Pelanggaran Konten Terlarang (Narkotika / Joki Skripsi / dll)
    const contentCheck = detectProhibitedContent(text);
    if (contentCheck.flagged) {
      isSendingRef.current = false;
      setIsSendingMessage(false);
      addToast?.(
        `Pelanggaran: ${contentCheck.category}`,
        contentCheck.reason,
        "error"
      );
      setChatInput("");
      setRoomDrafts((prev) => {
        const next = { ...prev };
        delete next[selectedRoom.id];
        return next;
      });
      try {
        if (typeof window !== "undefined" && currentUser?.id) {
          sessionStorage.removeItem(`bantuin_draft_${currentUser.id}_${selectedRoom.id}`);
        }
      } catch {}
      return;
    }

    // 2. Cek Disintermediasi & Kontak Pribadi (Nomor HP, WhatsApp, ajakan transaksi di luar sistem)
    const disCheck = detectDisintermediation(text);
    if (disCheck.flagged) {
      isSendingRef.current = false;
      setIsSendingMessage(false);
      addToast?.(
        "Pesan Diblokir: Terdeteksi Kontak Pribadi",
        disCheck.reason,
        "error"
      );
      // Langsung hilangkan pesan chat dari input dan draft
      setChatInput("");
      setRoomDrafts((prev) => {
        const next = { ...prev };
        delete next[selectedRoom.id];
        return next;
      });
      try {
        if (typeof window !== "undefined" && currentUser?.id) {
          sessionStorage.removeItem(`bantuin_draft_${currentUser.id}_${selectedRoom.id}`);
        }
      } catch {}
      return; // SEGERA STOP: Pesan diblokir total, tidak dikirim, dan tidak masuk ke obrolan
    }

    const isCurrentUserRequester = selectedRoom?.requesterId === currentUser?.id;
    const cleanUserAvatar = (currentUser?.avatarUrl && !currentUser.avatarUrl.includes("images.unsplash.com") && !currentUser.avatarUrl.includes("dicebear.com"))
      ? currentUser.avatarUrl
      : null;
    const senderData = {
      senderId: currentUser?.id || (activeRole === "helper" ? selectedRoom?.helper?.id : selectedRoom?.requester?.id) || "user-current",
      senderName: getPartyDisplayName(currentUser, selectedRoomMeta?.type === "sewa", activeRole === "helper") || (activeRole === "helper" ? selectedRoom?.helper?.name : selectedRoom?.requester?.name) || "Saya",
      senderAvatar: cleanUserAvatar || (activeRole === "helper" ? (selectedRoom?.helper?.avatar && !selectedRoom.helper.avatar.includes("images.unsplash.com") ? selectedRoom.helper.avatar : null) : (selectedRoom?.requester?.avatar && !selectedRoom.requester.avatar.includes("images.unsplash.com") ? selectedRoom.requester.avatar : null)),
    };

    const currentRoomId = selectedRoom.id;

    // Bersihkan draft untuk room ini seketika
    setChatInput("");
    setRoomDrafts((prev) => {
      const next = { ...prev };
      delete next[currentRoomId];
      return next;
    });
    try {
      if (typeof window !== "undefined" && currentUser?.id) {
        sessionStorage.removeItem(`bantuin_draft_${currentUser.id}_${currentRoomId}`);
      }
    } catch {}

    const nowIso = new Date().toISOString();
    const clientMessageId = `cmsg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const optMsg = {
      id: clientMessageId,
      clientMessageId,
      senderId: senderData.senderId,
      senderName: senderData.senderName,
      senderAvatar: senderData.senderAvatar,
      message: text,
      timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }).replace(".", ":"),
      createdAt: nowIso,
      isOptimistic: true,
      status: "pending",
      isRead: false,
      isDelivered: false,
    };

    userJustSentMessageRef.current = true;

    // UPDATE OPTIMISTIK realDbRooms SEKETIKA agar room ini langsung naik ke urutan paling atas tanpa jeda
    setRealDbRooms((prev) =>
      prev.map((r) => {
        if (
          r.id === currentRoomId ||
          r.orderRoomId === currentRoomId ||
          (Array.isArray(r.aliases) && r.aliases.includes(currentRoomId))
        ) {
          return {
            ...r,
            updatedAt: nowIso,
            messages: [...(r.messages || []), optMsg],
          };
        }
        return r;
      })
    );

    try {
      const serverMsg = await sendChatMessage(currentRoomId, text, { ...senderData, clientMessageId });
      if (serverMsg) {
        setRealDbRooms((prev) =>
          prev.map((r) => {
            if (
              r.id === currentRoomId ||
              r.orderRoomId === currentRoomId ||
              (Array.isArray(r.aliases) && r.aliases.includes(currentRoomId))
            ) {
              const updated = (r.messages || []).map((m) =>
                m.clientMessageId === clientMessageId || m.id === clientMessageId
                  ? { ...m, ...serverMsg, isOptimistic: false, isFailed: false }
                  : m
              );
              return { ...r, messages: updated };
            }
            return r;
          })
        );
      }
      const partnerId = (activeRole === "helper")
        ? (selectedRoom?.requester?.id || selectedRoom?.requesterId)
        : (selectedRoom?.helper?.id || selectedRoom?.helperId);
      notifyChatUpdate?.({ roomId: currentRoomId, partnerId });
    } catch (err) {
      console.warn("sendChatMessage error:", err);
      // Tandai pesan optimistik sebagai gagal kirim
      setRealDbRooms((prev) =>
        prev.map((r) => {
          if (
            r.id === currentRoomId ||
            r.orderRoomId === currentRoomId ||
            (Array.isArray(r.aliases) && r.aliases.includes(currentRoomId))
          ) {
            const updated = (r.messages || []).map((m) =>
              m.clientMessageId === clientMessageId || m.id === clientMessageId
                ? { ...m, isOptimistic: false, isFailed: true, status: "failed" }
                : m
            );
            return { ...r, messages: updated };
          }
          return r;
        })
      );
    } finally {
      // Pertahankan bilik obrolan tetap di room saat ini, dilarang melompat ke room lain
      setSelectedRoomId(currentRoomId);
      selectedRoomIdRef.current = currentRoomId;
      activeRoomIdRef.current = currentRoomId;
      isInitialRoomSetRef.current = true;
      isSendingRef.current = false;
      setIsSendingMessage(false);
      if (typeof window !== "undefined") {
        try {
          const url = new URL(window.location.href);
          url.searchParams.set("room", currentRoomId);
          window.history.replaceState(null, "", url.toString());
        } catch (_) {}
      }
    }
  };

  // Kirim ulang pesan yang gagal
  const handleRetryMessage = async (failedMsg) => {
    if (!failedMsg || !selectedRoom) return;
    const currentRoomId = selectedRoom.id;
    // Set status kembali ke pending
    setRealDbRooms((prev) =>
      prev.map((r) => {
        if (r.id === currentRoomId || r.orderRoomId === currentRoomId) {
          const updated = (r.messages || []).map((m) =>
            m.id === failedMsg.id
              ? { ...m, isOptimistic: true, isFailed: false, status: "pending" }
              : m
          );
          return { ...r, messages: updated };
        }
        return r;
      })
    );
    try {
      const serverMsg = await sendChatMessage(currentRoomId, failedMsg.message, {
        senderId: failedMsg.senderId,
        senderName: failedMsg.senderName,
        senderAvatar: failedMsg.senderAvatar,
        clientMessageId: failedMsg.clientMessageId || failedMsg.id,
      });
      if (serverMsg) {
        setRealDbRooms((prev) =>
          prev.map((r) => {
            if (r.id === currentRoomId || r.orderRoomId === currentRoomId) {
              const updated = (r.messages || []).map((m) =>
                m.id === failedMsg.id || m.clientMessageId === failedMsg.clientMessageId
                  ? { ...m, ...serverMsg, isOptimistic: false, isFailed: false }
                  : m
              );
              return { ...r, messages: updated };
            }
            return r;
          })
        );
      }
      const partnerId = (activeRole === "helper")
        ? (selectedRoom?.requester?.id || selectedRoom?.requesterId)
        : (selectedRoom?.helper?.id || selectedRoom?.helperId);
      notifyChatUpdate?.({ roomId: currentRoomId, partnerId });
    } catch (err) {
      console.warn("handleRetryMessage error:", err);
      setRealDbRooms((prev) =>
        prev.map((r) => {
          if (r.id === currentRoomId || r.orderRoomId === currentRoomId) {
            const updated = (r.messages || []).map((m) =>
              m.id === failedMsg.id
                ? { ...m, isOptimistic: false, isFailed: true, status: "failed" }
                : m
            );
            return { ...r, messages: updated };
          }
          return r;
        })
      );
    }
  };

  // Start Edit Message
  const handleStartEdit = (msg) => {
    setEditingMessageId(msg.id);
    setEditingText(msg.message);
  };

  // Save Edit Message
  const handleSaveEdit = (msgId) => {
    if (!editingText.trim() || !selectedRoom) return;
    const newText = editingText.trim();

    const contentCheck = detectProhibitedContent(newText);
    if (contentCheck.flagged) {
      addToast?.(
        `Edit Ditolak: ${contentCheck.category}`,
        contentCheck.reason,
        "error"
      );
      setEditingMessageId(null);
      setEditingText("");
      return;
    }

    const disCheck = detectDisintermediation(newText);
    if (disCheck.flagged) {
      addToast?.(
        "Edit Ditolak: Terdeteksi Kontak Pribadi",
        disCheck.reason,
        "error"
      );
      setEditingMessageId(null);
      setEditingText("");
      return;
    }

    editChatMessage(selectedRoom.id, msgId, newText);
    setRealDbRooms((prev) =>
      prev.map((r) => {
        if (r.id === selectedRoom.id) {
          return {
            ...r,
            messages: (r.messages || []).map((m) =>
              m.id === msgId ? { ...m, message: newText, isEdited: true } : m
            ),
          };
        }
        return r;
      })
    );
    notifyChatUpdate?.();
    setEditingMessageId(null);
    setEditingText("");
  };

  // Cancel Edit Message
  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditingText("");
  };

  // Trigger Delete Confirmation Modal for Message
  const promptDeleteMessage = (roomId, msgId) => {
    setDeleteTarget({ type: "message", roomId, msgId });
  };

  // Trigger Delete Confirmation Modal for Room
  const promptDeleteRoom = (roomId, e) => {
    e?.stopPropagation();
    const room = (realDbRooms || []).find((r) => r.id === roomId || r.orderRoomId === roomId) ||
                 (orderRooms || []).find((r) => r.id === roomId || r.orderRoomId === roomId);

    const isOrderRunning = room && (
      (room.paymentStatus === "PAID" ||
        ["on_the_way", "item_picked_up", "task_delivered", "proof_submitted", "in_progress", "paid_escrow"].includes(room.orderStatus)) &&
      room.orderStatus !== "completed" &&
      room.orderStatus !== "cancelled"
    );

    if (isOrderRunning) {
      addToast?.(
        "Pesanan Sedang Berjalan",
        "Obrolan pesanan aktif tidak dapat dihapus sebelum transaksi selesai atau dibatalkan demi keamanan transaksi Rekening Bersama.",
        "warning"
      );
      return;
    }

    if (room?.orderStatus === "disputed") {
      addToast?.(
        "Tidak Dapat Dihapus",
        "Obrolan dalam sengketa aktif tidak dapat dihapus selama proses mediasi.",
        "warning"
      );
      return;
    }

    setDeleteTarget({ type: "room", roomId, roomTitle: room?.requestTitle || room?.category });
  };

  // Execute Confirmed Delete (Message or Room)
  const handleConfirmDelete = async () => {
    if (!deleteTarget || isDeletingTarget) return;

    if (deleteTarget.type === "message") {
      const { roomId, msgId } = deleteTarget;
      setIsDeletingTarget(true);
      // Immediately register tombstone to prevent any concurrent or background refetch from resurrecting it
      markMessageAsDeleted(msgId);
      setRealDbRooms((prev) =>
        prev.map((r) => {
          if (r.id === roomId || r.orderRoomId === roomId) {
            return {
              ...r,
              messages: (r.messages || []).filter((m) => m.id !== msgId && m.clientMessageId !== msgId),
            };
          }
          return r;
        })
      );

      try {
        if (typeof deleteChatMessage === "function") {
          await deleteChatMessage(roomId, msgId);
        }
        notifyChatUpdate?.();
      } finally {
        setIsDeletingTarget(false);
        setDeleteTarget(null);
      }
    } else if (deleteTarget.type === "room") {
      const { roomId } = deleteTarget;
      setIsDeletingTarget(true);
      try {
        let deleteResult = { success: true };
        if (typeof deleteChatRoom === "function") {
          deleteResult = await deleteChatRoom(roomId);
        }

        if (deleteResult?.success) {
          setRealDbRooms((prev) => prev.filter((r) => r.id !== roomId && r.orderRoomId !== roomId));
          setRoomDrafts((prev) => {
            const next = { ...prev };
            delete next[roomId];
            return next;
          });
          try {
            if (typeof window !== "undefined" && currentUser?.id) {
              sessionStorage.removeItem(`bantuin_draft_${currentUser.id}_${roomId}`);
            }
          } catch {}

          if (selectedRoomId === roomId) {
            const remaining = realDbRooms.filter((r) => r.id !== roomId && r.orderRoomId !== roomId);
            setSelectedRoomId(remaining.length > 0 ? remaining[0].id : "");
            setChatInput("");
          }

          // Sinkronkan realtime HANYA SETELAH database server berhasil diperbarui
          notifyChatUpdate?.();
        }
      } finally {
        setIsDeletingTarget(false);
        setDeleteTarget(null);
      }
    }
  };

  // Client-side image compressor agar upload cepat dan ukuran file chat tidak membengkak
  const compressImageForChat = async (file, maxWidth = 1200, quality = 0.8) => {
    if (typeof window === "undefined" || !file || !file.type.startsWith("image/")) return file;
    // Jika ukuran sudah di bawah 150KB, tidak perlu dikompres lagi
    if (file.size < 150 * 1024) return file;
    return new Promise((resolve) => {
      try {
        const img = new Image();
        const reader = new FileReader();
        reader.onload = (e) => {
          img.src = e.target.result;
          img.onload = () => {
            let { width, height } = img;
            if (width > maxWidth || height > maxWidth) {
              if (width > height) {
                height = Math.round((height * maxWidth) / width);
                width = maxWidth;
              } else {
                width = Math.round((width * maxWidth) / height);
                height = maxWidth;
              }
            }
            const canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0, width, height);
            canvas.toBlob(
              (blob) => {
                if (blob) {
                  const compressedFile = new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), {
                    type: "image/jpeg",
                    lastModified: Date.now(),
                  });
                  resolve(compressedFile);
                } else {
                  resolve(file);
                }
              },
              "image/jpeg",
              quality
            );
          };
          img.onerror = () => resolve(file);
        };
        reader.onerror = () => resolve(file);
        reader.readAsDataURL(file);
      } catch {
        resolve(file);
      }
    });
  };

  // Chat Attachment File (Photos & Documents)
  const handleChatFileUpload = async (e) => {
    const rawFile = e.target.files?.[0];
    e.target.value = "";
    if (!rawFile || !selectedRoom) return;

    if (!rawFile.type.startsWith("image/")) {
      addToast?.("Format Tidak Didukung", "Hanya file gambar (JPG, PNG, WebP) yang dapat dilampirkan.", "warning");
      return;
    }

    setChatUploadStatus({
      state: "uploading",
      fileName: rawFile.name,
      error: null,
    });

    try {
      // Kompresi foto sebelum upload
      const file = await compressImageForChat(rawFile);

      const fileSizeStr = file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(2)} MB`
        : `${(file.size / 1024).toFixed(1)} KB`;

      const cleanUserAvatar = (currentUser?.avatarUrl && !currentUser.avatarUrl.includes("images.unsplash.com") && !currentUser.avatarUrl.includes("dicebear.com"))
        ? currentUser.avatarUrl
        : null;
      const senderData = {
        senderId: currentUser?.id || (activeRole === "helper" ? selectedRoom?.helper?.id : selectedRoom?.requester?.id) || "user-current",
        senderName: getPartyDisplayName(currentUser, selectedRoomMeta?.type === "sewa", activeRole === "helper") || (activeRole === "helper" ? selectedRoom?.helper?.name : selectedRoom?.requester?.name) || "Saya",
        senderAvatar: cleanUserAvatar || (activeRole === "helper" ? (selectedRoom?.helper?.avatar && !selectedRoom.helper.avatar.includes("images.unsplash.com") ? selectedRoom.helper.avatar : null) : (selectedRoom?.requester?.avatar && !selectedRoom.requester.avatar.includes("images.unsplash.com") ? selectedRoom.requester.avatar : null)),
      };

      let imageUrl = null;
      try {
        const form = new FormData();
        form.append("file", file);
        form.append("bucket", "bantuin-assets");
        form.append("folder", `chat/${selectedRoom.id}`);

        const res = await fetch("/api/upload", { method: "POST", body: form });
        const data = await res.json();
        imageUrl = data?.url || data?.urls?.[0] || null;
      } catch (uploadNetErr) {
        console.warn("Upload API network error, fallback to FileReader:", uploadNetErr);
      }

      // Fallback dataURL jika Supabase storage offline atau belum disetel
      if (!imageUrl) {
        imageUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = () => resolve(null);
          reader.readAsDataURL(file);
        });
      }

      if (!imageUrl) {
        throw new Error("Gagal membaca atau memproses file gambar.");
      }

      setChatUploadStatus({
        state: "sending",
        fileName: file.name,
        error: null,
      });

      userJustSentMessageRef.current = true;
      await sendChatMessage(selectedRoom.id, "📷 Foto Terlampir", {
        ...senderData,
        photos: [imageUrl],
        attachmentUrls: [imageUrl],
        attachment: { name: file.name, size: fileSizeStr, url: imageUrl, isImage: true }
      });

      const roomHelperIdForNotify = selectedRoom?.helper?.id || selectedRoom?.helperId;
      const amIHelperInRoom = Boolean(currentUser?.id && roomHelperIdForNotify === currentUser.id);
      const partnerId = amIHelperInRoom
        ? (selectedRoom?.requester?.id || selectedRoom?.requesterId)
        : roomHelperIdForNotify;
      notifyChatUpdate?.({ roomId: selectedRoom.id, partnerId });

      setChatUploadStatus({
        state: "success",
        fileName: file.name,
        error: null,
      });
      setTimeout(() => {
        setChatUploadStatus((prev) => (prev.state === "success" ? { state: "idle", fileName: "", error: null } : prev));
      }, 250);
      addToast?.("Foto Terkirim", `Foto "${file.name}" berhasil dikirim ke obrolan.`);
    } catch (err) {
      console.error("Chat file upload error:", err);
      setChatUploadStatus({
        state: "error",
        fileName: rawFile.name,
        error: err.message || "Terjadi kesalahan saat mengunggah foto.",
      });
      addToast?.("Gagal Mengunggah", err.message || "Terjadi kesalahan saat mengunggah foto.", "error");
    }
  };

  // Real File Downloader
  const handleDownloadFile = (file) => {
    try {
      const targetUrl = file.url || file.dataUrl;
      if (targetUrl) {
        const a = document.createElement("a");
        a.href = targetUrl;
        a.download = file.name || "berkas";
        a.target = "_blank";
        a.rel = "noreferrer";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        addToast?.("Membuka Berkas", `Berkas "${file.name}" sedang dibuka.`);
        return;
      }

      if (file.dataUrl && file.dataUrl.startsWith("data:")) {
        const a = document.createElement("a");
        a.href = file.dataUrl;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        const content = `BANTUIN WORKSPACE FILE\n=====================\nNama File  : ${file.name}\nPengirim   : ${selectedRoom?.helper?.name || "Helper"}\nTanggal    : ${new Date().toLocaleString("id-ID")}`;
        const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = file.name.includes(".") ? file.name : `${file.name}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
      addToast?.("File Berhasil Diunduh", `File "${file.name}" telah disimpan.`);
    } catch (err) {
      console.error(err);
      alert(`Mengunduh file: ${file.name}`);
    }
  };



  // Submit Proof / Completion (Instan & Snappy)
  const handleUploadProofSubmit = (e) => {
    e.preventDefault();
    if (!selectedRoom || isSubmittingProofRef.current) return;

    const filesToSubmit = digitalFiles.length > 0 ? [...digitalFiles] : (selectedRoom.digitalFiles || []);
    const subUrl = submissionUrl || selectedRoom.submissionUrl;
    const notes = proofNotes || "Pekerjaan telah selesai dikerjakan.";
    const targetRoomId = selectedRoom.id;

    // Tutup modal secara instan
    setIsProofModalOpen(false);
    setIsSubmittingProof(false);
    isSubmittingProofRef.current = false;
    setProofNotes("");

    addToast?.("Bukti Terkirim", "Hasil kerja berhasil diserahkan ke klien.");

    (async () => {
      try {
        await submitProof(targetRoomId, {
          photoUrl: null,
          digitalFiles: filesToSubmit,
          submissionUrl: subUrl,
          notes: notes,
        });
      } catch (err) {
        console.error("Proof submission background error:", err);
      }
    })();
  };

  // Realtime Category Counts for Tabs (Semua, Jasa, Bantuan, Sewa)
  const categoryCounts = {
    all: allAvailableRooms.length,
    jasa: allAvailableRooms.filter((r) => getCategoryMeta(r).type === "jasa").length,
    bantuan: allAvailableRooms.filter((r) => getCategoryMeta(r).type === "bantuan").length,
    sewa: allAvailableRooms.filter((r) => getCategoryMeta(r).type === "sewa").length,
  };

  // Filtered Rooms with Category & Status Filters
  const filteredRooms = allAvailableRooms.filter((room) => {
    const meta = getCategoryMeta(room);
    if (categoryFilter !== "all" && meta.type !== categoryFilter) {
      // Jangan pernah sembunyikan room yang saat ini sedang aktif dipilih
      if (room.id === selectedRoomId || (Array.isArray(room.aliases) && room.aliases.includes(selectedRoomId))) {
        return true;
      }
      return false;
    }

    const query = searchQuery.toLowerCase().trim();
    const partnerName = (room.helper?.name || "").toLowerCase();
    const title = (room.requestTitle || "").toLowerCase();
    const catName = (room.category || "").toLowerCase();
    const matchQuery = !query || partnerName.includes(query) || title.includes(query) || catName.includes(query);

    if (!matchQuery) return false;

    const isActivelyWorking =
      (room.paymentStatus === "PAID" ||
        room.orderStatus === "paid_escrow" ||
        room.orderStatus === "on_the_way" ||
        room.orderStatus === "item_picked_up" ||
        room.orderStatus === "in_progress" ||
        room.orderStatus === "task_delivered" ||
        room.orderStatus === "proof_submitted" ||
        room.orderStatus === "completed") &&
      room.orderStatus !== "inquiry" &&
      room.stage !== "inquiry";

    const roomIsInquiry = !isActivelyWorking;
    
    if (statusFilter === "inquiry") return roomIsInquiry;
    if (statusFilter === "active") return isActivelyWorking;
    return true;
  });

  return (
    <div className="h-screen w-screen flex flex-col bg-[#F8FAFC] overflow-hidden select-none font-sans text-slate-800">
      
      {/* ========================================================================= */}
      {/* 1. TOP HEADER (RESPONSIVE FOR MOBILE, TABLET, DESKTOP) */}
      {/* ========================================================================= */}
      <header className={`${mobileView === "chat" ? "hidden md:flex" : "flex"} h-14 bg-white border-b border-slate-200 px-3 sm:px-5 items-center justify-between z-30 shrink-0`}>
        
        {/* Left: Back Link & Context Title */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          
          {/* Mobile toggle back to Room List */}
          <div className="flex items-center md:hidden">
            {mobileView === "chat" ? (
              <button
                type="button"
                onClick={() => setMobileView("list")}
                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 mr-1 transition"
                title="Daftar Obrolan"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            ) : (
              <Link
                href="/bantuan"
                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 mr-1 transition"
                title="Kembali ke Daftar Bantuan"
              >
                <ArrowLeft className="w-4 h-4" />
              </Link>
            )}
          </div>

          <Link
            href="/bantuan"
            className="hidden md:flex w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 items-center justify-center text-slate-600 transition shrink-0"
            title="Kembali ke Daftar Bantuan"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          {/* Toggle Buka/Tutup Daftar Obrolan (Desktop & Mobile) */}
          <button
            type="button"
            onClick={() => {
              if (typeof window !== "undefined" && window.innerWidth < 768) {
                setMobileView(mobileView === "list" ? "chat" : "list");
              } else {
                setIsSidebarOpen(!isSidebarOpen);
              }
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition shrink-0 text-xs font-semibold cursor-pointer"
            title={isSidebarOpen ? "Tutup Daftar Obrolan (Perluas Ruang Chat)" : "Buka Daftar Obrolan"}
          >
            {isSidebarOpen ? (
              <>
                <PanelLeftClose className="w-4 h-4 text-slate-600" />
                <span className="hidden sm:inline text-slate-700">Tutup Daftar</span>
              </>
            ) : (
              <>
                <PanelLeftOpen className="w-4 h-4 text-[#1683FF]" />
                <span className="hidden sm:inline text-[#1683FF]">Buka Daftar</span>
              </>
            )}
          </button>

          <span className="font-bold text-sm sm:text-base text-slate-800 ml-1 truncate">
            Obrolan
          </span>
        </div>

      </header>

      {/* ========================================================================= */}
      {/* 2. MAIN 3-COLUMN UNIFIED WORKSPACE WITH RESPONSIVE LAYOUT */}
      {/* ========================================================================= */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* ------------------------------------------------------------- */}
        {/* COLUMN 1: TRANSACTIONS LIST WITH STAGE SWITCHER & DELETE */}
        {/* ------------------------------------------------------------- */}
        <div className={`
          ${mobileView === "list" ? "flex" : "hidden"}
          ${isSidebarOpen ? "md:flex" : "md:hidden"}
          w-full md:w-68 lg:w-76 bg-white border-r border-slate-200 flex-col shrink-0 z-20 transition-all duration-200
        `}>
          
          {/* Header Panel Obrolan */}
          <div className="px-3 pt-2.5 pb-1 flex items-center justify-between border-b border-slate-100">
            <div className="flex items-center gap-1.5 font-bold text-xs text-slate-800">
              <MessageSquare className="w-3.5 h-3.5 text-[#1683FF]" />
              <span>Daftar Obrolan</span>
              <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-1.5 py-0.5 rounded-full">
                {filteredRooms.length}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsSidebarOpen(false)}
              className="hidden md:flex p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              title="Tutup Panel Obrolan (Perluas Chat)"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          </div>
          
          {/* Filter Kategori Utama (Semua, Jasa, Bantuan, Sewa) */}
          <div className="p-2.5 border-b border-slate-100 space-y-2">
            <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100/80 rounded-xl text-xs">
              {/* Tab Semua */}
              <button
                type="button"
                onClick={() => setCategoryFilter("all")}
                className={`py-1.5 px-1 rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                  categoryFilter === "all"
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                }`}
                title="Semua Kategori"
              >
                <span>Semua</span>
                <span className={`text-[9px] px-1 py-0.2 rounded-full font-extrabold ${
                  categoryFilter === "all" ? "bg-white/20 text-white" : "bg-slate-200/80 text-slate-600"
                }`}>
                  {categoryCounts.all}
                </span>
              </button>

              {/* Tab Jasa */}
              <button
                type="button"
                onClick={() => setCategoryFilter("jasa")}
                className={`py-1.5 px-1 rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                  categoryFilter === "jasa"
                    ? "bg-[#1683FF] text-white shadow-xs"
                    : "text-slate-600 hover:text-[#1683FF] hover:bg-white/60"
                }`}
                title="Layanan Jasa Profesional & Servis"
              >
                <span>Jasa</span>
                <span className={`text-[9px] px-1 py-0.2 rounded-full font-extrabold ${
                  categoryFilter === "jasa" ? "bg-white/25 text-white" : "bg-blue-100 text-[#1683FF]"
                }`}>
                  {categoryCounts.jasa}
                </span>
              </button>

              {/* Tab Bantuan */}
              <button
                type="button"
                onClick={() => setCategoryFilter("bantuan")}
                className={`py-1.5 px-1 rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                  categoryFilter === "bantuan"
                    ? "bg-[#1683FF] text-white shadow-xs"
                    : "text-slate-600 hover:text-[#1683FF] hover:bg-white/60"
                }`}
                title="Tugas Komunitas, Errand & Bantuan Cepat"
              >
                <span>Bantuan</span>
                <span className={`text-[9px] px-1 py-0.2 rounded-full font-extrabold ${
                  categoryFilter === "bantuan" ? "bg-white/25 text-white" : "bg-blue-100 text-[#1683FF]"
                }`}>
                  {categoryCounts.bantuan}
                </span>
              </button>

              {/* Tab Sewa */}
              <button
                type="button"
                onClick={() => setCategoryFilter("sewa")}
                className={`py-1.5 px-1 rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                  categoryFilter === "sewa"
                    ? "bg-[#1683FF] text-white shadow-xs"
                    : "text-slate-600 hover:text-[#1683FF] hover:bg-white/60"
                }`}
                title="Penyewaan Alat Multimedia & Kendaraan"
              >
                <span>Sewa</span>
                <span className={`text-[9px] px-1 py-0.2 rounded-full font-extrabold ${
                  categoryFilter === "sewa" ? "bg-white/25 text-white" : "bg-blue-100 text-[#1683FF]"
                }`}>
                  {categoryCounts.sewa}
                </span>
              </button>
            </div>

            {/* Input Pencarian */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={
                  categoryFilter === "jasa" ? "Cari jasa desain, cetak, ketik..." :
                  categoryFilter === "bantuan" ? "Cari bantuan kurir, errand..." :
                  categoryFilter === "sewa" ? "Cari sewa kamera, motor, audio..." :
                  "Cari obrolan..."
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-7 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:border-[#1683FF] transition"
              />
            </div>

            {/* Sub-filter Status Transaksi */}
            <div className="flex items-center gap-1 text-[10px]">
              <button
                type="button"
                onClick={() => setStatusFilter("all")}
                className={`px-2 py-0.5 rounded-md font-semibold transition cursor-pointer ${
                  statusFilter === "all" ? "bg-slate-200 text-slate-800" : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                }`}
              >
                Semua Status
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("inquiry")}
                className={`px-2 py-0.5 rounded-md font-semibold transition cursor-pointer ${
                  statusFilter === "inquiry" ? "bg-slate-200 text-slate-800" : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                }`}
              >
                Diskusi
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("active")}
                className={`px-2 py-0.5 rounded-md font-semibold transition cursor-pointer ${
                  statusFilter === "active" ? "bg-blue-100 text-blue-800" : "text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                }`}
              >
                Pesanan Aktif
              </button>
            </div>
          </div>

          {/* Rooms List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {/* Pinned Official CS / Admin Room */}
            <Link
              href="/chat/admin"
              className="group w-full px-3 py-3 flex items-start gap-2.5 text-left cursor-pointer transition relative bg-gradient-to-r from-blue-50/70 to-indigo-50/40 hover:bg-blue-50/90 border-b border-blue-100/70"
              title="Buka Chat Resmi Tim Admin Bantuin & Pusat Bantuan"
            >
              <div className="relative shrink-0 mt-0.5">
                <div className="w-9 h-9 rounded-full bg-linear-to-br from-[#1683FF] to-[#0D62C9] text-white flex items-center justify-center font-black text-sm shadow-xs">
                  B
                </div>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white absolute bottom-0 right-0 shadow-xs" title="Online" />
              </div>

              <div className="flex-1 min-w-0 pr-1">
                <div className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="font-bold text-xs text-slate-900 truncate">Tim Admin Bantuin</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded-full font-bold bg-[#EAF4FF] text-[#1683FF] border border-blue-200 shrink-0">
                      Admin CS
                    </span>
                  </div>
                  {adminCsSnippet?.time && (
                    <span className="text-[10px] text-slate-400 shrink-0">
                      {formatMessageTime({ createdAt: adminCsSnippet.time })}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between gap-2 mt-0.5">
                  <p className="text-[11px] text-slate-600 truncate font-medium flex-1">
                    {adminCsSnippet?.lastMessage ? (
                      <span className="text-[#1683FF] font-semibold">{adminCsSnippet.lastMessage}</span>
                    ) : (
                      "Bantuan resmi, pengaduan & kendala platform"
                    )}
                  </p>
                  <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-100 font-semibold shrink-0">
                    Online
                  </span>
                </div>
              </div>
            </Link>

            {isLoadingRooms ? (
              <div className="p-3 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-2.5 p-2 animate-pulse">
                    <div className="w-9 h-9 rounded-full bg-slate-200 shrink-0" />
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="h-3.5 w-28 bg-slate-200 rounded" />
                      <div className="h-2.5 w-36 bg-slate-200 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredRooms.length > 0 ? (
              filteredRooms.map((room) => {
                const meta = getCategoryMeta(room);
                const isSelected = room.id === selectedRoom?.id;
                const rawLastMsg = room.messages?.[room.messages.length - 1];
                let lastMsg = rawLastMsg?.message || "Belum ada pesan";
                if (
                  rawLastMsg?.photos?.length ||
                  rawLastMsg?.attachmentUrls?.length ||
                  rawLastMsg?.proofPhotos?.length ||
                  rawLastMsg?.attachment?.isImage ||
                  (typeof lastMsg === "string" && (
                    lastMsg.toLowerCase().startsWith("foto terlampir") ||
                    lastMsg.toLowerCase().startsWith("📷 foto terlampir")
                  ))
                ) {
                  lastMsg = "📷 Foto Terlampir";
                }
                
                // Tentukan partner lawan bicara yang sebenarnya
                const isUserRequesterInRoom = room.requesterId ? room.requesterId === currentUser?.id : (activeRole === "requester");
                const partner = isUserRequesterInRoom
                  ? (room.helper || { name: "Helper Bantuin", avatar: null })
                  : (room.requester || room.helper || { name: "Pemesan", avatar: null });
                const partnerDisplayName = getPartyDisplayName(
                  partner,
                  meta.type === "sewa",
                  isUserRequesterInRoom
                );

                const isRoomClosed = room.orderStatus === "not_selected" || room.orderStatus === "cancelled";
                const isRoomPaidActive =
                  (room.paymentStatus === "PAID" ||
                    room.orderStatus === "paid_escrow" ||
                    room.orderStatus === "on_the_way" ||
                    room.orderStatus === "item_picked_up" ||
                    room.orderStatus === "in_progress" ||
                    room.orderStatus === "task_delivered" ||
                    room.orderStatus === "proof_submitted" ||
                    room.orderStatus === "completed") &&
                  room.orderStatus !== "inquiry" &&
                  room.stage !== "inquiry";
                const isRoomInquiry = !isRoomPaidActive && !isRoomClosed;
                const isRoomRunningOrder = (room.paymentStatus === "PAID" ||
                  ["on_the_way", "item_picked_up", "task_delivered", "proof_submitted", "in_progress", "paid_escrow"].includes(room.orderStatus)) &&
                  room.orderStatus !== "completed" &&
                  room.orderStatus !== "cancelled";

                return (
                  <div
                    key={room.id}
                    onClick={() => handleSelectRoom(room)}
                    className={`group w-full px-3 py-3 flex items-start gap-2.5 text-left cursor-pointer transition relative ${
                      isSelected
                        ? "bg-blue-50/60 border-l-[3px] border-l-[#1683FF]"
                        : "hover:bg-slate-50 border-l-[3px] border-l-transparent"
                    }`}
                  >
                    <div className="relative shrink-0 mt-0.5">
                      {partner.avatar && !partner.avatar.includes("images.unsplash.com") ? (
                        <img
                          src={partner.avatar}
                          alt={partnerDisplayName}
                          className="w-9 h-9 rounded-full object-cover border border-slate-200 shadow-2xs"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-linear-to-br from-[#1683FF] to-[#0E5FCC] text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                          {partnerDisplayName ? partnerDisplayName.slice(0, 2).toUpperCase() : "US"}
                        </div>
                      )}
                      {partner?.isOnline ? (
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white absolute bottom-0 right-0 shadow-xs" title="Online" />
                      ) : (
                        <span className="w-2.5 h-2.5 rounded-full bg-slate-300 border-2 border-white absolute bottom-0 right-0 shadow-xs" title="Offline" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0 pr-7">
                      {/* Baris 1: Nama + Waktu + Status Badge */}
                      <div className="flex items-center gap-1.5 mb-0.5 min-w-0">
                        <h4 className={`text-xs truncate flex-1 min-w-0 ${
                          isSelected ? "font-bold text-[#1683FF]" : "font-semibold text-slate-800"
                        }`}>
                          {partnerDisplayName}
                        </h4>
                        {rawLastMsg && (
                          <span className="text-[10px] text-slate-400 font-medium shrink-0">
                            {formatMessageTime(rawLastMsg)}
                          </span>
                        )}
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md shrink-0 ${
                          isRoomClosed
                            ? "bg-slate-100 text-slate-500"
                            : isRoomInquiry
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-blue-50 text-[#1683FF] border border-blue-100"
                        }`}>
                          {isRoomClosed ? (room.orderStatus === "not_selected" ? "Ditutup" : "Selesai") : isRoomInquiry ? "Diskusi" : "Aktif"}
                        </span>
                      </div>

                      {/* Baris 2: Kategori Badge + Sublabel */}
                      <div className="flex items-center gap-1 mb-1 min-w-0 overflow-hidden">
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-0.5 border shrink-0 ${meta.badgeClass}`}>
                          <meta.icon className="w-2.5 h-2.5 shrink-0" />
                          <span>{meta.label}</span>
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium truncate min-w-0">
                          {meta.type === "sewa" && (room.requestTitle || room.title)
                            ? (room.requestTitle || room.title).replace(/^Sewa:\s*/i, "")
                            : (room.category || meta.subLabel)}
                        </span>
                      </div>

                      {/* Baris 3: Pesan Terakhir + Unread Badge */}
                      <div className="flex items-center justify-between gap-1.5">
                        <p className={`text-[11px] truncate flex-1 min-w-0 ${
                          room.unreadCount > 0 ? "font-semibold text-slate-900" : "text-slate-400"
                        }`}>
                          {lastMsg}
                        </p>
                        {room.unreadCount > 0 && !isSelected && (
                          <span className="min-w-4.5 h-4.5 px-1.5 rounded-full bg-[#1683FF] text-white text-[10px] font-bold flex items-center justify-center shrink-0 shadow-2xs animate-pulse">
                            {room.unreadCount > 9 ? "9+" : room.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Delete entire room button on item hover */}
                    {isRoomRunningOrder ? (
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          addToast?.(
                            "Pesanan Sedang Berjalan",
                            "Obrolan pesanan aktif tidak dapat dihapus sebelum transaksi selesai atau dibatalkan demi keamanan Rekening Bersama.",
                            "info"
                          );
                        }}
                        className="opacity-0 group-hover:opacity-100 absolute right-2 top-3 p-1.5 rounded-lg text-slate-300 hover:text-amber-500 hover:bg-amber-50 transition cursor-not-allowed"
                        title="Pesanan aktif (Terkunci)"
                      >
                        <Lock className="w-3.5 h-3.5" />
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => promptDeleteRoom(room.id, e)}
                        className="opacity-0 group-hover:opacity-100 absolute right-2 top-3 p-1.5 rounded-lg hover:bg-rose-50 text-slate-300 hover:text-rose-500 transition cursor-pointer"
                        title="Hapus Obrolan"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-slate-400 text-xs">
                Tidak ada obrolan ditemukan.
              </div>
            )}
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* COLUMN 2: MAIN CHAT STREAM (CLEAN & MINIMAL WITH EDIT & DELETE) */}
        {/* ------------------------------------------------------------- */}
        <div className={`
          ${mobileView === "chat" ? "flex" : "hidden"}
          md:flex flex-1 flex-col bg-white overflow-hidden relative z-10
        `}>
          {isLoadingRooms && !selectedRoom ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#F8FAFC]">
              <div className="w-10 h-10 border-4 border-[#1683FF] border-t-transparent rounded-full animate-spin mb-3" />
              <div className="text-xs font-semibold text-slate-500">Memuat obrolan transaksi...</div>
            </div>
          ) : !selectedRoom ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#F8FAFC]">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#1683FF] mb-4 shadow-xs">
                <MessageSquare className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-800 mb-1">Belum Ada Obrolan Aktif</h3>
              <p className="text-xs text-slate-500 max-w-sm mb-6 leading-relaxed">
                Ruang obrolan transaksi akan otomatis muncul setelah Anda mengajukan bantuan, memesan layanan jasa, atau menyewa peralatan.
              </p>
              <div className="flex items-center gap-3">
                <Link
                  href="/bantuan"
                  className="px-4 py-2 bg-[#1683FF] hover:bg-[#0F6FE5] text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer"
                >
                  Jelajahi Bantuan
                </Link>
                <Link
                  href="/jasa"
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Cari Layanan Jasa
                </Link>
              </div>
            </div>
          ) : (
            <>
              {/* ============================================================= */}
              {/* 2. IDENTITAS TOKO / MITRA (~52-56px) */}
              {/* ============================================================= */}
              {(() => {
                const isSelectedRoomRequester = selectedRoom.requesterId ? selectedRoom.requesterId === currentUser?.id : (activeRole === "requester");
                const activePartner = isSelectedRoomRequester
                  ? (selectedRoom.helper || { name: "Helper Bantuin", avatar: null })
                  : (selectedRoom.requester || selectedRoom.helper || { name: "Pemesan", avatar: null });
                const activePartnerDisplayName = getPartyDisplayName(
                  activePartner,
                  selectedRoomMeta?.type === "sewa",
                  isSelectedRoomRequester
                );
                const partnerId = isSelectedRoomRequester
                  ? (selectedRoom.helperId || selectedRoom.helper?.id || activePartner.id || activePartnerDisplayName)
                  : (selectedRoom.requesterId || selectedRoom.requester?.id || activePartner.id || activePartnerDisplayName);
                const partnerIsOnline = Boolean(activePartner.isOnline || (selectedRoom.partner?.id === activePartner.id && selectedRoom.partner?.isOnline));
                const partnerLastActiveAt = activePartner.lastActiveAt || (selectedRoom.partner?.id === activePartner.id ? selectedRoom.partner?.lastActiveAt : null);

                return (
                  <div className="h-14 border-b border-slate-100 px-2 sm:px-4 flex items-center justify-between gap-1.5 sm:gap-2 bg-white shrink-0">
                    
                    {/* Tombol Kembali ke Daftar Obrolan (Khusus Mobile saat chat terbuka) */}
                    <button
                      type="button"
                      onClick={() => setMobileView("list")}
                      className="md:hidden p-1.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition shrink-0 cursor-pointer"
                      title="Kembali ke Daftar Obrolan"
                    >
                      <ChevronLeft className="w-5 h-5 text-slate-700" />
                    </button>

                    {/* Profil Mitra / Pemesan (Leluasa di paling atas tanpa terhimpit) */}
                    <Link
                      href={selectedRoomMeta?.type === "sewa" && isSelectedRoomRequester ? `/mitra/${encodeURIComponent(partnerId || "store")}` : `/profile/${encodeURIComponent(partnerId || "user")}`}
                      className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1 group/partner hover:opacity-90 transition cursor-pointer"
                      title={`Lihat profil lengkap ${activePartnerDisplayName}`}
                    >
                      <div className="relative shrink-0">
                        {activePartner.avatar && !activePartner.avatar.includes("images.unsplash.com") ? (
                          <img
                            src={activePartner.avatar}
                            alt={activePartnerDisplayName}
                            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover border border-slate-200 group-hover/partner:border-[#1683FF] shadow-2xs transition"
                          />
                        ) : (
                          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-linear-to-br from-[#1683FF] to-[#0E5FCC] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs group-hover/partner:ring-2 group-hover/partner:ring-[#1683FF]/30 transition">
                            {activePartnerDisplayName ? activePartnerDisplayName.slice(0, 2).toUpperCase() : "US"}
                          </div>
                        )}
                        {partnerIsOnline ? (
                          <span className="relative flex h-2.5 w-2.5 absolute -bottom-0.5 -right-0.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 border-2 border-white shadow-xs"></span>
                          </span>
                        ) : (
                          <span className="w-2.5 h-2.5 rounded-full bg-slate-300 border-2 border-white absolute -bottom-0.5 -right-0.5 shadow-xs" title="Offline" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 min-w-0 flex-wrap sm:flex-nowrap">
                          <span className="font-bold text-slate-900 group-hover/partner:text-[#1683FF] text-xs sm:text-sm truncate min-w-0 transition">
                            {activePartnerDisplayName}
                          </span>
                          <span className="text-[10px] sm:text-[11px] text-slate-500 font-medium shrink-0 whitespace-nowrap">
                            ({isSelectedRoomRequester
                              ? (selectedRoomMeta?.type === "sewa" ? "Mitra Sewa" : selectedRoomMeta?.type === "bantuan" ? "Helper" : "Mitra Jasa")
                              : (selectedRoomMeta?.type === "sewa" ? "Penyewa" : "Pemesan")})
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] leading-normal py-0.5 min-w-0 mt-0.5">
                          {partnerIsOnline ? (
                            <>
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                              <span className="text-emerald-600 font-semibold truncate">Aktif sekarang</span>
                            </>
                          ) : (
                            <>
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0" />
                              <span className="text-slate-500 font-medium truncate">{formatLastSeen(partnerLastActiveAt)}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </Link>

                    {/* Tombol Aksi di Header: Rincian, Telepon Cepat + Menu Titik 3 */}
                    <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">

                      {/* Toggle Panel Rincian Transaksi on Desktop */}
                      <button
                        type="button"
                        onClick={() => {
                          setIsDetailsOpen((prev) => !prev);
                        }}
                        className={`hidden md:flex p-1.5 rounded-lg transition cursor-pointer items-center gap-1 text-xs font-bold shrink-0 border ${
                          isDetailsOpen
                            ? "bg-blue-50 text-[#1683FF] border-blue-200"
                            : "text-slate-600 hover:text-[#1683FF] hover:bg-slate-100 border-transparent"
                        }`}
                        title="Buka / Tutup Rincian Transaksi & Lokasi"
                      >
                        <Info className="w-3.5 h-3.5 text-[#1683FF]" />
                        <span className="hidden lg:inline">Rincian</span>
                      </button>

                      {/* Telepon Panggilan Suara In-App Bantuin (Bebas Pulsa & Privasi Terjaga) */}
                      <button
                        type="button"
                        onClick={handleStartCall}
                        className="p-1.5 sm:p-2 rounded-xl text-slate-600 hover:text-[#1683FF] hover:bg-blue-50/70 border border-transparent transition cursor-pointer flex items-center gap-1 active:scale-95"
                        title="Panggilan Suara In-App Bantuin (Privasi Terjaga • Bebas Pulsa)"
                      >
                        <Phone className="w-3.5 h-3.5 text-[#1683FF]" />
                        <span className="hidden sm:inline text-xs font-bold text-slate-700">Telepon</span>
                      </button>

                      {/* 4. Menu Titik Tiga (MoreVertical) dengan Rincian Tiap Aksi */}
                      <div className="relative" ref={moreMenuRef}>
                        <button
                          type="button"
                          onClick={() => {
                            setIsMoreMenuOpen((prev) => !prev);
                          }}
                          className={`p-1.5 sm:p-2 rounded-xl transition cursor-pointer flex items-center justify-center border ${
                            isMoreMenuOpen
                              ? "bg-blue-50 text-[#1683FF] border-blue-200 shadow-2xs"
                              : "text-slate-600 hover:text-[#1683FF] hover:bg-slate-100 border-transparent"
                          }`}
                          title="Menu & Rincian Aksi"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {isMoreMenuOpen && (
                          <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-white rounded-2xl shadow-2xl border border-slate-200/90 p-2 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-1">
                            {/* Header Popover */}
                            <div className="flex items-center justify-between px-2.5 py-1.5 pb-2 border-b border-slate-100">
                              <div>
                                <span className="font-extrabold text-xs text-slate-900 block">Menu &amp; Rincian Aksi</span>
                                <span className="text-[10px] text-slate-400 block truncate max-w-[200px]">
                                  Dengan {activePartnerDisplayName}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => setIsMoreMenuOpen(false)}
                                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {/* Opsi 1: Rincian Transaksi & Lokasi */}
                            <button
                              type="button"
                              onClick={() => {
                                setIsMoreMenuOpen(false);
                                if (typeof window !== "undefined" && window.innerWidth < 1024) {
                                  setShowRightDrawerMobile(true);
                                } else {
                                  setIsDetailsOpen(true);
                                }
                              }}
                              className="w-full flex items-start gap-2.5 p-2 rounded-xl hover:bg-blue-50/80 text-slate-700 hover:text-[#1683FF] border border-transparent hover:border-blue-100 transition text-left cursor-pointer group"
                            >
                              <div className="w-7 h-7 rounded-lg bg-blue-100 text-[#1683FF] flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition">
                                <Info className="w-3.5 h-3.5" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <span className="text-xs font-bold text-slate-800 group-hover:text-[#1683FF] block">
                                  Rincian Transaksi &amp; Lokasi
                                </span>
                                <span className="text-[10px] text-slate-500 block truncate">
                                  Ringkasan pesanan, timeline &amp; berkas
                                </span>
                              </div>
                            </button>

                            {/* Opsi 2: Titik Lokasi Google Maps (jika order fisik) */}
                            {isPhysicalRoom && roomMapsUrl && (
                              <a
                                href={roomMapsUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={() => setIsMoreMenuOpen(false)}
                                className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-emerald-50/80 text-slate-700 hover:text-emerald-700 border border-transparent hover:border-emerald-100 transition group"
                              >
                                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition">
                                  <MapPin className="w-3.5 h-3.5" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center justify-between gap-1">
                                    <span className="text-xs font-bold text-slate-800 group-hover:text-emerald-700">
                                      Titik Lokasi di Maps
                                    </span>
                                    <ExternalLink className="w-3 h-3 text-emerald-600 shrink-0" />
                                  </div>
                                  <span className="text-[10px] text-slate-500 block truncate">
                                    {roomLocationText || "Buka rute navigasi Google Maps"}
                                  </span>
                                </div>
                              </a>
                            )}

                            {/* Opsi 3: Panggilan Suara In-App */}
                            <button
                              type="button"
                              onClick={() => {
                                setIsMoreMenuOpen(false);
                                handleStartCall();
                              }}
                              className="w-full flex items-start gap-2.5 p-2 rounded-xl hover:bg-indigo-50/80 text-slate-700 hover:text-indigo-600 border border-transparent hover:border-indigo-100 transition text-left cursor-pointer group"
                            >
                              <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition">
                                <PhoneCall className="w-3.5 h-3.5" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <span className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 block">
                                  Panggilan Suara In-App
                                </span>
                                <span className="text-[10px] text-slate-500 block truncate">
                                  Bebas pulsa • Privasi nomor terlindungi
                                </span>
                              </div>
                            </button>


                            {/* Opsi 6: Laporkan Pengguna */}
                            <button
                              type="button"
                              onClick={() => {
                                setIsMoreMenuOpen(false);
                                setIsReportModalOpen(true);
                              }}
                              className="w-full flex items-start gap-2.5 p-2 rounded-xl hover:bg-amber-50/80 text-slate-700 hover:text-amber-700 border border-transparent hover:border-amber-100 transition text-left cursor-pointer group"
                            >
                              <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition">
                                <Flag className="w-3.5 h-3.5" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <span className="text-xs font-bold text-slate-800 group-hover:text-amber-700 block">
                                  Laporkan Pengguna
                                </span>
                                <span className="text-[10px] text-slate-500 block truncate">
                                  Sampaikan kendala keamanan atau transaksi
                                </span>
                              </div>
                            </button>

                            {/* Opsi 7: Hapus Obrolan */}
                            <div className="pt-1 border-t border-slate-100">
                              {((selectedRoom?.paymentStatus === "PAID" ||
                                ["on_the_way", "item_picked_up", "task_delivered", "proof_submitted", "in_progress", "paid_escrow"].includes(selectedRoom?.orderStatus)) &&
                                selectedRoom?.orderStatus !== "completed" &&
                                selectedRoom?.orderStatus !== "cancelled") ? (
                                <div
                                  onClick={() => {
                                    setIsMoreMenuOpen(false);
                                    addToast?.(
                                      "Pesanan Sedang Berjalan",
                                      "Obrolan pesanan aktif tidak dapat dihapus sebelum pesanan selesai atau dibatalkan demi keamanan transaksi Rekening Bersama.",
                                      "info"
                                    );
                                  }}
                                  className="w-full flex items-start gap-2.5 p-2 rounded-xl bg-slate-50 text-slate-400 border border-slate-100 transition text-left cursor-not-allowed"
                                  title="Obrolan pesanan aktif tidak dapat dihapus"
                                >
                                  <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-400 flex items-center justify-center shrink-0 mt-0.5">
                                    <Lock className="w-3.5 h-3.5" />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <span className="text-xs font-bold text-slate-500 block">
                                      Hapus Obrolan (Terkunci)
                                    </span>
                                    <span className="text-[10px] text-slate-400 block truncate">
                                      Tersedia setelah pesanan selesai/batal
                                    </span>
                                  </div>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    setIsMoreMenuOpen(false);
                                    promptDeleteRoom(selectedRoom?.id, e);
                                  }}
                                  className="w-full flex items-start gap-2.5 p-2 rounded-xl hover:bg-rose-50 text-slate-700 hover:text-rose-600 border border-transparent hover:border-rose-100 transition text-left cursor-pointer group"
                                >
                                  <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition">
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <span className="text-xs font-bold text-rose-600 block">
                                      Hapus Obrolan
                                    </span>
                                    <span className="text-[10px] text-rose-400 block truncate">
                                      Hapus riwayat obrolan dari daftar Anda
                                    </span>
                                  </div>
                                </button>
                              )}
                            </div>

                          </div>
                        )}
                      </div>

                    </div>
                  </div>
                );
              })()}

            {/* ============================================================= */}
            {/* 3. STATUS TRANSAKSI + AKSI */}
            {/* ============================================================= */}
            <ChatFlowTracker room={selectedRoom} activeRole={activeRole} />

          {/* Payment safety bar */}
          <div className="px-3 sm:px-4 py-2 bg-white border-b border-slate-100 flex items-center justify-between text-[11px] text-slate-500 shrink-0">
            <div className="flex items-center gap-1.5 min-w-0">
              <ShieldCheck className="w-3.5 h-3.5 text-[#1683FF] shrink-0" />
              <span className="font-medium truncate">Pembayaran aman</span>
              <span className="text-slate-300 shrink-0">•</span>
              <Link
                href="/syarat-ketentuan"
                target="_blank"
                className="text-slate-500 hover:text-[#1683FF] hover:underline flex items-center gap-0.5 shrink-0 font-semibold"
              >
                <span>Pelajari S&amp;K</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </Link>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {selectedRoom?.paymentStatus !== "PAID" && selectedRoom?.orderStatus !== "cancelled" && selectedRoom?.orderStatus !== "not_selected" && (
                <button
                  type="button"
                  onClick={handleCheckPaymentStatus}
                  disabled={isCheckingPayment}
                  className="px-2 py-0.5 rounded-full bg-blue-50 hover:bg-blue-100 text-[#1683FF] border border-blue-200/80 font-semibold text-[10px] flex items-center gap-1 transition"
                  title="Cek konfirmasi pembayaran gateway terkini"
                >
                  <RefreshCw className={`w-2.5 h-2.5 ${isCheckingPayment ? "animate-spin" : ""}`} />
                  <span>{isCheckingPayment ? "Memeriksa..." : "Cek Status Pembayaran"}</span>
                </button>
              )}
              {selectedRoom?.lockedAmount && (
                <span className="text-[10px] text-[#1683FF] font-semibold hidden sm:inline shrink-0 ml-1">
                  Dilindungi Rekber Bantuin
                </span>
              )}
            </div>
          </div>

          {/* Messages Area */}
          <div
            ref={messagesContainerRef}
            onScroll={handleMessagesScroll}
            className="flex-1 overflow-y-auto px-3 sm:px-4 py-4 space-y-3 bg-[#F8FAFC]"
          >
            {filteredMessages.map((msg, index) => {
              const myId = currentUser?.id;
              const isMe = myId 
                ? (msg.senderId === myId || msg.senderId === "user-current-01" && myId === selectedRoom?.requester?.id)
                : (activeRole === "helper"
                    ? (msg.senderId === selectedRoom?.helper?.id)
                    : (msg.senderId === selectedRoom?.requester?.id));
              const isBot = msg.senderName === "Bantuin System" || msg.senderName === "Bantuin Escrow Bot" || msg.senderName === "Bantuin Bot" || msg.senderId === "bot-system" || msg.isSystem;
              const isEditingThisMsg = editingMessageId === msg.id;

              if (isBot) {
                if (msg.isHandoverProof && msg.proofData) {
                  const proof = msg.proofData;
                  return (
                    <div key={msg.id || index} className="w-full max-w-xl mx-auto my-3 bg-white rounded-2xl border border-blue-200/90 shadow-2xs overflow-hidden text-xs">
                      {/* Card Header: sewarna dengan tema Bantuin */}
                      <div className="bg-gradient-to-r from-[#1683FF] to-[#0F6FE5] text-white p-3 sm:p-3.5 flex items-center justify-between gap-2 border-b border-blue-400/20">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                            <ShieldCheck className="w-4 h-4 text-white" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-extrabold text-xs sm:text-sm tracking-tight truncate text-white">
                              Dokumentasi Serah Terima Fisik Unit
                            </h4>
                            <p className="text-[10px] text-blue-100 truncate">
                              Dokumentasi resmi tersimpan di sistem transaksi Bantuin
                            </p>
                          </div>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white font-extrabold text-[10px] shrink-0 flex items-center gap-1 border border-white/30 backdrop-blur-xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          Masa Sewa Aktif
                        </span>
                      </div>

                      {/* Card Body */}
                      <div className="p-3.5 sm:p-4 space-y-3 bg-white">
                        {/* Summary Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-blue-50/50 p-2.5 rounded-xl border border-blue-100/80 text-[11px]">
                          <div>
                            <span className="text-slate-400 block text-[10px] uppercase font-bold">Unit Alat</span>
                            <span className="font-bold text-slate-800">{proof.unitName}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px] uppercase font-bold">Waktu Dokumentasi</span>
                            <span className="font-semibold text-slate-700">{proof.confirmedAt}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px] uppercase font-bold">Jaminan Identitas</span>
                            <span className="font-semibold text-slate-800 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-[#1683FF] shrink-0" />
                              {proof.idHeld}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px] uppercase font-bold">Deposit Jaminan Sewa</span>
                            <span className="font-bold text-slate-900">
                              {formatIDR((proof.depositHeld && proof.depositHeld !== 500000) ? proof.depositHeld : (selectedRoom?.depositAmount || selectedRoom?.rentalDetails?.depositFee || proof.depositHeld || 0))} (100% Refundable)
                            </span>
                          </div>
                        </div>

                        {/* Catatan Kondisi */}
                        {proof.notes && (
                          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-700">
                            <span className="font-bold text-slate-900 block mb-0.5">Catatan Pemeriksaan Fisik:</span>
                            <p className="italic text-slate-600">&ldquo;{proof.notes}&rdquo;</p>
                          </div>
                        )}

                        {/* Photo Gallery - Click to zoom! */}
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="font-bold text-slate-800 text-[11px] flex items-center gap-1">
                              <Camera className="w-3.5 h-3.5 text-[#1683FF]" />
                              Foto Dokumentasi Fisik Unit ({proof.photos?.length || 0} Foto):
                            </span>
                            <span className="text-[10px] text-slate-400">Klik foto untuk perbesar</span>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {proof.photos?.map((photo, pIdx) => (
                              <div
                                key={pIdx}
                                onClick={() => setLightboxImage(photo)}
                                className="relative group rounded-xl overflow-hidden aspect-video border border-slate-200 bg-slate-100 cursor-pointer shadow-2xs hover:shadow-md transition"
                              >
                                <img
                                  src={photo}
                                  alt={`Foto Bukti ${pIdx + 1}`}
                                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-[10px] font-bold gap-1">
                                  <Search className="w-3.5 h-3.5" />
                                  <span>Perbesar</span>
                                </div>
                                <span className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/60 text-white text-[9px] font-bold rounded">
                                  Foto {pIdx + 1}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Card Security Notice */}
                        <div className="p-2.5 bg-blue-50/40 rounded-xl border border-blue-100/80 flex items-start gap-2 text-[10px] text-slate-500 leading-relaxed">
                          <ShieldCheck className="w-4 h-4 text-[#1683FF] shrink-0 mt-0.5" />
                          <span>
                            Dokumentasi foto ini tersimpan permanen di riwayat transaksi Bantuin. Kondisi fisik alat saat pengembalian akan dicocokkan dengan foto ini sebelum deposit jaminan dikembalikan utuh.
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                }

                if (msg.isReturnProof && msg.proofData) {
                  const proof = msg.proofData;
                  return (
                    <div key={msg.id || index} className="w-full max-w-xl mx-auto my-3 bg-white rounded-2xl border border-blue-200/90 shadow-2xs overflow-hidden text-xs">
                      {/* Card Header: sewarna dengan tema Bantuin */}
                      <div className="bg-gradient-to-r from-[#1683FF] to-[#0F6FE5] text-white p-3 sm:p-3.5 flex items-center justify-between gap-2 border-b border-blue-400/20">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                            <CheckCircle2 className="w-4 h-4 text-white" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-extrabold text-xs sm:text-sm tracking-tight truncate text-white">
                              Bukti Pengembalian &amp; Pencairan Deposit
                            </h4>
                            <p className="text-[10px] text-blue-100 truncate">
                              Unit sewa dikembalikan &amp; deposit dicairkan utuh
                            </p>
                          </div>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white font-extrabold text-[10px] shrink-0 border border-white/30">
                          Selesai ✓
                        </span>
                      </div>

                      <div className="p-3.5 sm:p-4 space-y-3 bg-white">
                        <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-100 text-center">
                          <span className="text-[10px] text-slate-700 font-bold uppercase block">
                            Uang Jaminan Deposit Dikembalikan Utuh ke Saldo
                          </span>
                          <span className="text-xl font-black text-[#1683FF] block my-0.5">
                            {formatIDR(
                              (proof.refundAmount && proof.refundAmount > 0)
                                ? proof.refundAmount
                                : (selectedRoom?.depositAmount || selectedRoom?.rentalDetails?.depositFee || (proof.depositHeld && proof.depositHeld !== 500000 ? proof.depositHeld : 0) || 0)
                            )}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            100% tanpa potongan telah masuk kembali ke Saldo Dompet Penyewa.
                          </span>
                        </div>

                        <div className="space-y-1.5 text-[11px] text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                          <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#1683FF] shrink-0" />
                            <span>{proof.idReturned}</span>
                          </div>
                          {proof.notes && (
                            <p className="text-slate-600 italic pl-5">&ldquo;{proof.notes}&rdquo;</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                }

                if (msg.isJasaDeliverablesProof || (msg.message && msg.message.includes("Penyedia jasa telah menyerahkan hasil pekerjaan"))) {
                  const proof = msg.proofData || {
                    serviceTitle: selectedRoom?.requestTitle || "Layanan Jasa",
                    submissionUrl: deliverableData.submissionUrl || "-",
                    files: deliverableData.files || [],
                    notes: msg.notes || deliverableData.notes || "",
                    submittedAt: msg.timestamp || "Baru saja",
                  };
                  const activeSubmissionUrl = (proof.submissionUrl && proof.submissionUrl !== "-") ? proof.submissionUrl : deliverableData.submissionUrl;
                  const activeFiles = (proof.files && proof.files.length > 0) ? proof.files : deliverableData.files;
                  const activeNotes = proof.notes || deliverableData.notes;

                  return (
                    <div key={msg.id || index} className="w-full max-w-xl mx-auto my-3 bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden text-xs">
                      <div className="bg-slate-900 text-white p-3 sm:p-3.5 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-blue-600/30 text-[#1683FF] flex items-center justify-center shrink-0">
                            <Upload className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-extrabold text-xs sm:text-sm tracking-tight truncate">
                              Penyerahan Hasil Pekerjaan &amp; Berkas
                            </h4>
                            <p className="text-[10px] text-slate-300 truncate">
                              Mitra telah menyerahkan berkas untuk ditinjau pemesan
                            </p>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-extrabold text-[10px] shrink-0 flex items-center gap-1 border border-blue-400/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#1683FF] animate-pulse" />
                          Tahap Review
                        </span>
                      </div>

                      <div className="p-3.5 sm:p-4 space-y-3 bg-white">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 text-[11px]">
                          <div>
                            <span className="text-slate-400 block text-[10px] uppercase font-bold">Layanan Jasa</span>
                            <span className="font-bold text-slate-800">{proof.serviceTitle || selectedRoom?.requestTitle || "Layanan Jasa"}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px] uppercase font-bold">Waktu Penyerahan</span>
                            <span className="font-semibold text-slate-700">{proof.submittedAt || msg.timestamp}</span>
                          </div>
                        </div>

                        {activeSubmissionUrl && activeSubmissionUrl !== "-" && (
                          <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-100 flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <span className="text-[10px] font-bold text-blue-800 uppercase block">Tautan Unduhan Cloud / Preview:</span>
                              <a
                                href={activeSubmissionUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs font-bold text-[#1683FF] hover:underline truncate block"
                              >
                                {activeSubmissionUrl}
                              </a>
                            </div>
                            <a
                              href={activeSubmissionUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="px-3 py-1.5 rounded-lg bg-[#1683FF] text-white text-[11px] font-bold hover:bg-[#0F6FE5] shrink-0 flex items-center gap-1 cursor-pointer"
                            >
                              <ExternalLink className="w-3 h-3" />
                              <span>Buka</span>
                            </a>
                          </div>
                        )}

                        {activeFiles && activeFiles.length > 0 && (
                          <div className="space-y-1.5">
                            <span className="font-bold text-slate-800 text-[11px] block">
                              Berkas Lampiran Langsung ({activeFiles.length} File):
                            </span>
                            <div className="space-y-1">
                              {activeFiles.map((file, fIdx) => (
                                <div key={file.id || fIdx} className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-xs gap-2">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <FileText className="w-3.5 h-3.5 text-[#1683FF] shrink-0" />
                                    <span className="font-semibold text-slate-800 truncate">{file.name}</span>
                                    {file.size && <span className="text-[10px] text-slate-400 shrink-0">({file.size})</span>}
                                  </div>
                                  <div className="flex items-center gap-1 shrink-0">
                                    {file.url ? (
                                      <a
                                        href={file.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        download={file.name || "berkas"}
                                        className="p-1 text-slate-600 hover:text-[#1683FF] hover:bg-slate-200 rounded"
                                        title="Buka / Unduh berkas"
                                      >
                                        <Download className="w-3.5 h-3.5" />
                                      </a>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => handleDownloadFile(file)}
                                        className="p-1 text-slate-600 hover:text-[#1683FF] hover:bg-slate-200 rounded"
                                        title="Unduh berkas"
                                      >
                                        <Download className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {activeNotes && (
                          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px]">
                            <span className="font-bold text-slate-900 block mb-0.5">Catatan dari Mitra:</span>
                            <p className="italic text-slate-700">&ldquo;{activeNotes}&rdquo;</p>
                          </div>
                        )}

                        <div className="p-2.5 bg-blue-50/40 rounded-xl border border-blue-100 flex items-start gap-2 text-[10px] text-slate-600 leading-relaxed">
                          <ShieldCheck className="w-4 h-4 text-[#1683FF] shrink-0 mt-0.5" />
                          <span>
                            Dana imbalan Anda tetap aman terverifikasi di sistem Bantuin hingga Anda memeriksa dan menyetujui hasil pekerjaan di atas.
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                }

                if (msg.isJasaCompletion && msg.completionData) {
                  const comp = msg.completionData;
                  return (
                    <div key={msg.id || index} className="w-full max-w-xl mx-auto my-3 bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden text-xs">
                      <div className="bg-slate-900 text-white p-3 sm:p-3.5 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-blue-500/30 text-blue-300 flex items-center justify-center shrink-0">
                            <CheckCircle2 className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-extrabold text-xs sm:text-sm tracking-tight truncate">
                              Pesanan Selesai &amp; Dana Berhasil Dicairkan
                            </h4>
                            <p className="text-[10px] text-slate-300 truncate">
                              Pemesan telah menyetujui hasil kerja dan memberikan ulasan
                            </p>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-blue-500/25 text-blue-200 font-extrabold text-[10px] shrink-0 border border-blue-400/30">
                          Selesai
                        </span>
                      </div>

                      <div className="p-3.5 sm:p-4 space-y-3 bg-white">
                        <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-100 text-center">
                          <span className="text-[10px] text-slate-600 font-bold uppercase block">
                            Hak Pembayaran Mitra Tersedia (AVAILABLE)
                          </span>
                          <span className="text-xl font-black text-[#1683FF] block my-0.5">
                            {formatIDR(comp.payoutAmount)}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            Dana telah masuk ke saldo mitra dan dapat dicairkan ke rekening/e-wallet kapan saja.
                          </span>
                        </div>

                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1 text-center">
                          <div className="flex items-center justify-center gap-1">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                className={`w-4 h-4 ${s <= comp.rating ? "fill-amber-400 text-amber-400" : "text-slate-300"}`}
                              />
                            ))}
                            <span className="font-extrabold text-slate-900 ml-1.5">{comp.rating}.0 / 5.0</span>
                          </div>
                          {comp.feedback && (
                            <p className="italic text-slate-600 text-[11px] mt-1">&ldquo;{comp.feedback}&rdquo;</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={msg.id || index} className="flex justify-center my-2 px-2">
                    <div className="max-w-sm w-full py-2 px-3 rounded-xl bg-white border border-slate-200 text-[12px] text-slate-600 shadow-sm">
                      <div className="flex items-start gap-2">
                        <ShieldCheck className="w-3.5 h-3.5 text-[#1683FF] shrink-0 mt-0.5" />
                        <p className="leading-relaxed flex-1 chat-bubble-text">
                          {msg.message}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={msg.id || index}
                  className={`group flex items-end gap-2 ${isMe ? "justify-end" : "justify-start"}`}
                >
                  {!isMe && (() => {
                    // Tentukan lawan bicara di bilik obrolan ini secara ketat (opponent)
                    const isCurrentUserRequester = selectedRoom?.requesterId === currentUser?.id || (currentUser?.id && selectedRoom?.requester?.id === currentUser?.id);
                    const roomOpponent = isCurrentUserRequester ? selectedRoom?.helper : selectedRoom?.requester;
                    const resolvedOpponent = getPartyDisplayName(
                      { name: msg.senderName, ...roomOpponent },
                      selectedRoomMeta?.type === "sewa",
                      isCurrentUserRequester
                    );
                    const opponentName = (resolvedOpponent && resolvedOpponent !== "Saya") 
                      ? resolvedOpponent 
                      : (roomOpponent?.name || "Pengguna");

                    // DILARANG KERAS menggunakan avatar milik currentUser ataupun role yang salah!
                    let opponentAvatar = null;
                    if (
                      msg.senderAvatar &&
                      msg.senderAvatar !== currentUser?.avatarUrl &&
                      !msg.senderAvatar.includes("images.unsplash.com") &&
                      !msg.senderAvatar.includes("dicebear.com")
                    ) {
                      opponentAvatar = msg.senderAvatar;
                    } else if (
                      roomOpponent?.avatar &&
                      roomOpponent.avatar !== currentUser?.avatarUrl &&
                      !roomOpponent.avatar.includes("images.unsplash.com") &&
                      !roomOpponent.avatar.includes("dicebear.com")
                    ) {
                      opponentAvatar = roomOpponent.avatar;
                    }

                    const initialChar = (opponentName || "U").trim()[0]?.toUpperCase() || "U";

                    return opponentAvatar ? (
                      <img
                        src={opponentAvatar}
                        alt={opponentName}
                        className="w-7 h-7 rounded-full object-cover border border-slate-200 shrink-0 mb-0.5 shadow-2xs"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-linear-to-br from-[#1683FF] to-[#0E5FCC] text-white font-bold text-[10px] flex items-center justify-center shrink-0 mb-0.5 shadow-2xs">
                        {initialChar}
                      </div>
                    );
                  })()}

                  <div className={`flex flex-col ${
                    isMe ? "items-end" : "items-start"
                  } min-w-0 max-w-[85%] sm:max-w-[420px] md:max-w-[460px]`}>
                    
                    {/* If in edit mode for this message */}
                    {isEditingThisMsg ? (
                      <div className="p-2 bg-white rounded-xl border border-[#1683FF] shadow-xs space-y-2 w-full min-w-[200px] sm:min-w-[240px]">
                        <textarea
                          rows={2}
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          className="w-full text-xs p-2 rounded-lg border border-slate-200 focus:outline-none focus:border-[#1683FF]"
                          autoFocus
                        />
                        <div className="flex items-center justify-end gap-1.5 text-[11px]">
                          <button
                            type="button"
                            onClick={handleCancelEdit}
                            className="px-2 py-1 rounded-md text-slate-500 hover:bg-slate-100 font-semibold"
                          >
                            Batal
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveEdit(msg.id)}
                            className="px-3 py-1 bg-[#1683FF] hover:bg-[#0F6FE5] text-white rounded-md font-bold shadow-2xs"
                          >
                            Simpan
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className={`flex items-center gap-1 min-w-0 max-w-full ${isMe ? "justify-end" : "justify-start"}`}>
                        {/* Action buttons (Left of bubble for my messages) */}
                        {isMe && (
                          <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition shrink-0">
                            <button
                              type="button"
                              onClick={() => handleStartEdit(msg)}
                              className="p-1 text-slate-300 hover:text-[#1683FF] hover:bg-slate-100 rounded-md transition"
                              title="Edit pesan"
                            >
                              <Pencil className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => promptDeleteMessage(selectedRoom.id, msg.id)}
                              className="p-1 text-slate-300 hover:text-rose-500 hover:bg-slate-100 rounded-md transition"
                              title="Hapus pesan"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}

                        {(() => {
                          const isDeliverableMsg = Boolean(
                            msg.isTaskProof ||
                            msg.isJasaDeliverablesProof ||
                            msg.isDeliverable ||
                            (msg.message && (
                              msg.message.includes("Helper telah menyelesaikan tugas") ||
                              msg.message.includes("Penyedia jasa telah menyerahkan") ||
                              msg.message.includes("mengunggah hasil pengerjaan") ||
                              msg.message.includes("mengunggah bukti penyelesaian")
                            ))
                          );

                          // Tentukan 4 Skenario Serah Terima:
                          // 1. Bantuan Digital  2. Bantuan Fisik  3. Jasa Digital  4. Jasa Fisik
                          let deliverableScenario = null;
                          if (isDeliverableMsg) {
                            const isJasa = Boolean(
                              msg.isJasaDeliverablesProof ||
                              (msg.message && msg.message.toLowerCase().includes("penyedia jasa")) ||
                              selectedRoomMeta?.type === "jasa"
                            );

                            const isOnline = Boolean(
                              msg.isOnline === true ||
                              msg.proofData?.isOnline === true ||
                              selectedRoom?.isOnline === true ||
                              selectedRoom?.isRemote === true ||
                              selectedRoom?.taskLocationType === "online" ||
                              (msg.message && (msg.message.toLowerCase().includes("digital") || msg.message.toLowerCase().includes("berkas digital"))) ||
                              (Array.isArray(msg.digitalFiles) && msg.digitalFiles.length > 0) ||
                              Boolean(msg.submissionUrl && msg.submissionUrl !== "-")
                            );

                            if (!isJasa && isOnline) {
                              deliverableScenario = {
                                type: "bantuan_digital",
                                label: "Bantuan Digital • Serah Terima Berkas",
                                icon: FileCheck2,
                                badgeClass: isMe
                                  ? "bg-white/20 text-white border border-white/30"
                                  : "bg-blue-50 text-blue-700 border border-blue-200",
                              };
                            } else if (!isJasa && !isOnline) {
                              deliverableScenario = {
                                type: "bantuan_fisik",
                                label: "Bantuan Fisik • Bukti Selesai di Lokasi",
                                icon: MapPin,
                                badgeClass: isMe
                                  ? "bg-white/20 text-white border border-white/30"
                                  : "bg-emerald-50 text-emerald-700 border border-emerald-200",
                              };
                            } else if (isJasa && isOnline) {
                              deliverableScenario = {
                                type: "jasa_digital",
                                label: "Jasa Digital • Hasil Kerja & Berkas",
                                icon: Briefcase,
                                badgeClass: isMe
                                  ? "bg-white/20 text-white border border-white/30"
                                  : "bg-purple-50 text-purple-700 border border-purple-200",
                              };
                            } else {
                              deliverableScenario = {
                                type: "jasa_fisik",
                                label: "Jasa Fisik • Dokumentasi & Hasil Fisik",
                                icon: Wrench,
                                badgeClass: isMe
                                  ? "bg-white/20 text-white border border-white/30"
                                  : "bg-amber-50 text-amber-700 border border-amber-200",
                              };
                            }
                          }

                          // 1. Kumpulkan seluruh berkas / attachment dari semua field potensial
                          const candidateItems = [
                            ...(Array.isArray(msg.proofData?.files) ? msg.proofData.files : []),
                            ...(Array.isArray(msg.proofData?.digitalFiles) ? msg.proofData.digitalFiles : []),
                            ...(Array.isArray(msg.digitalFiles) ? msg.digitalFiles : []),
                            ...(Array.isArray(msg.photos) ? msg.photos : (msg.photos ? [msg.photos] : [])),
                            ...(Array.isArray(msg.attachmentUrls) ? msg.attachmentUrls : []),
                            ...(Array.isArray(msg.proofPhotos) ? msg.proofPhotos : []),
                            ...(Array.isArray(msg.proofData?.photos) ? msg.proofData.photos : []),
                            ...(msg.attachment?.url ? [msg.attachment] : []),
                            ...(msg.photoUrl ? [msg.photoUrl] : []),
                          ];

                          // Fallback ke deliverableData atau room jika berkas digital di pesan kosong
                          if (isDeliverableMsg) {
                            if (candidateItems.length === 0 && deliverableData?.files?.length > 0) {
                              candidateItems.push(...deliverableData.files);
                            }
                            if (candidateItems.length === 0 && Array.isArray(selectedRoom?.digitalFiles) && selectedRoom.digitalFiles.length > 0) {
                              candidateItems.push(...selectedRoom.digitalFiles);
                            }
                          }

                          // 2. Kumpulkan link cloud / Drive
                          const cloudLinks = [];
                          const candidateLink =
                            (msg.proofData?.submissionUrl && msg.proofData.submissionUrl !== "-")
                              ? msg.proofData.submissionUrl
                              : (msg.submissionUrl && msg.submissionUrl !== "-"
                                  ? msg.submissionUrl
                                  : (isDeliverableMsg
                                      ? (deliverableData?.submissionUrl || (selectedRoom?.submissionUrl && selectedRoom.submissionUrl !== "-" ? selectedRoom.submissionUrl : null))
                                      : null));
                          if (candidateLink && typeof candidateLink === "string" && candidateLink.trim().length > 3) {
                            const trimmed = candidateLink.trim();
                            if (!cloudLinks.includes(trimmed)) cloudLinks.push(trimmed);
                          }

                          // 3. Catatan / deskripsi pengerjaan
                          let notesText = msg.proofData?.notes || msg.notes || msg.proofNotes || "";
                          if (!notesText && isDeliverableMsg) {
                            notesText = selectedRoom?.proofNotes || deliverableData?.notes || "";
                          }
                          if (notesText && typeof notesText === "string") {
                            const urlRegex = /(https?:\/\/[^\s]+)/gi;
                            const matches = notesText.match(urlRegex) || [];
                            matches.forEach((u) => {
                              if (!cloudLinks.includes(u)) cloudLinks.push(u);
                            });
                            cloudLinks.forEach((cl) => {
                              if (notesText.includes(cl)) {
                                notesText = notesText.replace(cl, "").trim();
                              }
                            });
                          }

                          let bubbleText = msg.message || "";
                          if (
                            typeof bubbleText === "string" &&
                            (bubbleText.toLowerCase().startsWith("foto terlampir") ||
                             bubbleText.toLowerCase().startsWith("📷 foto terlampir"))
                          ) {
                            const trimmed = bubbleText.replace(/^(📷\s*)?foto terlampir:\s*/i, "").trim();
                            if (trimmed.startsWith("http") || trimmed.startsWith("data:image/") || trimmed.startsWith("/")) {
                              candidateItems.push(trimmed);
                              bubbleText = "";
                            } else {
                              bubbleText = "";
                            }
                          }

                          // 4. Pisahkan Foto (Images) vs Dokumen (PDF, Docs, ZIP, dsb)
                          const displayPhotos = [];
                          const displayDocuments = [];

                          candidateItems.forEach((item) => {
                            if (!item) return;
                            const url = typeof item === "string" ? item : (item.url || item.dataUrl || "");
                            const name = typeof item === "object" ? (item.name || "") : (typeof url === "string" ? url.split("/").pop().split("?")[0] : "");
                            const cleanName = (name || url).toLowerCase();
                            const type = typeof item === "object" ? (item.type || "") : "";

                            // Deteksi pasti apakah item ini adalah foto/gambar
                            const isImageFile = Boolean(
                              (typeof item === "object" && (item.isImage || item.type === "image" || (item.type && item.type.startsWith("image/")))) ||
                              url.startsWith("data:image/") ||
                              /\.(jpg|jpeg|png|webp|gif|svg|avif|bmp)$/i.test(cleanName) ||
                              url.includes("/avatar/")
                            );

                            if (isImageFile) {
                              const normalized = (url || "").trim().replace(/^https?:\/\/[^/]+/i, "").split("?")[0];
                              const isDuplicate = displayPhotos.some((existingUrl) => {
                                const existNorm = (existingUrl || "").trim().replace(/^https?:\/\/[^/]+/i, "").split("?")[0];
                                return existNorm === normalized;
                              });
                              if (url && !isDuplicate) {
                                displayPhotos.push(url);
                              }
                            } else {
                              // Dokumen / berkas
                              const isDoc = Boolean(
                                cleanName.endsWith(".pdf") ||
                                type.includes("pdf") ||
                                cleanName.endsWith(".zip") ||
                                cleanName.endsWith(".rar") ||
                                cleanName.endsWith(".7z") ||
                                cleanName.endsWith(".doc") ||
                                cleanName.endsWith(".docx") ||
                                cleanName.endsWith(".xls") ||
                                cleanName.endsWith(".xlsx") ||
                                cleanName.endsWith(".ai") ||
                                cleanName.endsWith(".psd") ||
                                cleanName.endsWith(".txt") ||
                                (typeof item === "object" && item.size)
                              );

                              if (isDoc) {
                                const exists = displayDocuments.some((d) => {
                                  const dUrl = typeof d === "string" ? d : (d.url || d.dataUrl);
                                  const dName = typeof d === "object" ? d.name : "";
                                  return (dUrl && dUrl === url) || (dName && dName === name);
                                });
                                if (!exists) displayDocuments.push(item);
                              } else if (url && url.startsWith("http")) {
                                const exists = displayDocuments.some((d) => (typeof d === "string" ? d : (d.url || d.dataUrl)) === url);
                                if (!exists) displayDocuments.push(item);
                              }
                            }
                          });

                          // Jika pesan serah terima digital tapi berkas masih kosong, periksa selectedRoom.digitalFiles
                          if (isDeliverableMsg && displayDocuments.length === 0 && Array.isArray(selectedRoom?.digitalFiles)) {
                            selectedRoom.digitalFiles.forEach((file) => {
                              if (file && !displayDocuments.some((d) => (d.name && d.name === file.name) || (d.url && d.url === file.url))) {
                                displayDocuments.push(file);
                              }
                            });
                          }

                          const hasOnlyPhotos = displayPhotos.length > 0 && !bubbleText && displayDocuments.length === 0 && cloudLinks.length === 0 && !notesText && !deliverableScenario;

                          return (
                            <div
                              className={`${hasOnlyPhotos ? "p-1.5" : "px-3 py-2.5"} rounded-2xl text-xs sm:text-[13px] leading-relaxed min-w-0 max-w-full break-words [overflow-wrap:anywhere] [word-break:break-all] ${
                                isMe
                                  ? "bg-[#1683FF] text-white rounded-br-sm"
                                  : "bg-white border border-slate-200 text-slate-800 rounded-bl-sm shadow-sm"
                              }`}
                              style={{ wordBreak: "break-all", overflowWrap: "anywhere" }}
                            >
                              {/* ── Skenario Serah Terima Header Badge (Bantuan / Jasa x Digital / Fisik) ── */}
                              {deliverableScenario && (
                                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold mb-2 shadow-2xs ${deliverableScenario.badgeClass}`}>
                                  <deliverableScenario.icon className="w-3.5 h-3.5 shrink-0" />
                                  <span>{deliverableScenario.label}</span>
                                </div>
                              )}

                              {msg.callRecord || msg.message?.includes?.("Panggilan Suara") ? (
                                <div className="flex items-center gap-2.5 py-0.5">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                                    isMe ? "bg-white/20 text-white" : "bg-blue-50 text-[#1683FF] border border-blue-200"
                                  }`}>
                                    <PhoneCall className="w-4 h-4" />
                                  </div>
                                  <div>
                                    <div className="font-bold text-xs">{msg.message}</div>
                                    <div className={`text-[10px] mt-0.5 flex items-center gap-1 ${isMe ? "text-blue-100" : "text-slate-500"}`}>
                                      <Lock className="w-2.5 h-2.5" />
                                      <span>Panggilan Suara In-App • Nomor Terproteksi</span>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                bubbleText ? (
                                  <p className="whitespace-pre-line chat-bubble-text break-words [overflow-wrap:anywhere] [word-break:break-all]">
                                    {bubbleText}
                                  </p>
                                ) : null
                              )}

                              {/* ── Catatan / Deskripsi Pengerjaan ── */}
                              {notesText ? (
                                <div className={`mt-2 p-2 sm:p-2.5 rounded-xl border text-xs leading-relaxed ${
                                  isMe
                                    ? "bg-white/15 border-white/25 text-white"
                                    : "bg-slate-50 border-slate-200 text-slate-700"
                                }`}>
                                  <div className={`text-[10px] font-bold uppercase tracking-wider mb-0.5 flex items-center gap-1 ${
                                    isMe ? "text-blue-100" : "text-slate-500"
                                  }`}>
                                    <FileText className="w-3 h-3 shrink-0" />
                                    <span>Catatan / Deskripsi:</span>
                                  </div>
                                  <p className="italic">&ldquo;{notesText}&rdquo;</p>
                                </div>
                              ) : null}

                              {/* ── Tautan Berkas Cloud / Drive ── */}
                              {cloudLinks.length > 0 && (
                                <div className="space-y-1.5 mt-2.5">
                                  {cloudLinks.map((link, lIdx) => (
                                    <div
                                      key={lIdx}
                                      className={`p-2 sm:p-2.5 rounded-xl border flex items-center justify-between gap-2 transition ${
                                        isMe
                                          ? "bg-white/15 border-white/25 text-white"
                                          : "bg-blue-50/70 border-blue-200 text-slate-800"
                                      }`}
                                    >
                                      <div className="flex items-center gap-2 min-w-0">
                                        <div
                                          className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                            isMe ? "bg-white/20 text-white" : "bg-blue-100 text-[#1683FF]"
                                          }`}
                                        >
                                          <ExternalLink className="w-3.5 h-3.5" />
                                        </div>
                                        <div className="min-w-0">
                                          <span className={`text-[9px] font-extrabold uppercase tracking-wider block ${isMe ? "text-blue-200" : "text-blue-600"}`}>
                                            Tautan Berkas Cloud / Drive
                                          </span>
                                          <span className="font-semibold text-xs truncate block max-w-[160px] sm:max-w-[200px]">{link}</span>
                                        </div>
                                      </div>
                                      <a
                                        href={link}
                                        target="_blank"
                                        rel="noreferrer"
                                        className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 shrink-0 transition cursor-pointer shadow-2xs ${
                                          isMe
                                            ? "bg-white text-[#1683FF] hover:bg-blue-50"
                                            : "bg-[#1683FF] text-white hover:bg-[#0F6FE5]"
                                        }`}
                                      >
                                        <span>Buka</span>
                                        <ExternalLink className="w-3 h-3" />
                                      </a>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* ── Berkas Lampiran Digital Langsung ── */}
                              {displayDocuments.length > 0 && (
                                <div className="space-y-1.5 mt-2.5">
                                  <div className={`text-[10px] font-bold uppercase tracking-wider px-0.5 flex items-center gap-1 ${
                                    isMe ? "text-blue-100" : "text-slate-500"
                                  }`}>
                                    <Paperclip className="w-3 h-3" />
                                    <span>Berkas Digital ({displayDocuments.length}):</span>
                                  </div>
                                  {displayDocuments.map((doc, dIdx) => {
                                    const docUrl = typeof doc === "string" ? doc : (doc.url || doc.dataUrl);
                                    const rawName = typeof doc === "object" ? (doc.name || "") : (typeof docUrl === "string" ? docUrl.split("/").pop().split("?")[0] : "");
                                    const docName = rawName || `Berkas_Hasil_${dIdx + 1}.pdf`;
                                    const isPdf = docName.toLowerCase().endsWith(".pdf") || (typeof doc === "object" && doc.type?.includes("pdf"));
                                    const docSize = (typeof doc === "object" && doc.size) ? doc.size : (isPdf ? "Dokumen PDF" : "Berkas Digital");

                                    return (
                                      <div
                                        key={dIdx}
                                        className={`p-2 rounded-xl border flex items-center justify-between gap-2 transition shadow-2xs ${
                                          isMe
                                            ? "bg-white/15 border-white/25 text-white"
                                            : "bg-slate-50 border-slate-200 text-slate-800"
                                        }`}
                                      >
                                        <div className="flex items-center gap-2 min-w-0 flex-1">
                                          <div
                                            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shrink-0 font-extrabold text-[10px] ${
                                              isPdf
                                                ? (isMe ? "bg-rose-500/30 text-rose-200 border border-rose-400/40" : "bg-rose-50 text-rose-600 border border-rose-200")
                                                : (isMe ? "bg-white/20 text-white" : "bg-blue-50 text-[#1683FF] border border-blue-200")
                                            }`}
                                          >
                                            {isPdf ? "PDF" : <FileText className="w-3.5 h-3.5" />}
                                          </div>
                                          <div className="min-w-0 flex-1">
                                            <span className="font-bold text-xs truncate block leading-tight">{docName}</span>
                                            <span className={`text-[10px] block mt-0.5 ${isMe ? "text-blue-100" : "text-slate-400"}`}>
                                              {docSize}
                                            </span>
                                          </div>
                                        </div>

                                        <div className="shrink-0">
                                          {docUrl ? (
                                            <a
                                              href={docUrl}
                                              target="_blank"
                                              rel="noreferrer"
                                              download={docName}
                                              className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer shadow-2xs ${
                                                isMe
                                                  ? "bg-white text-[#1683FF] hover:bg-blue-50"
                                                  : "bg-[#1683FF] text-white hover:bg-[#0F6FE5]"
                                              }`}
                                              title="Buka / Unduh Berkas"
                                            >
                                              <Download className="w-3 h-3" />
                                              <span>Unduh</span>
                                            </a>
                                          ) : (
                                            <button
                                              type="button"
                                              onClick={() => handleDownloadFile(doc)}
                                              className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer shadow-2xs ${
                                                isMe
                                                  ? "bg-white text-[#1683FF] hover:bg-blue-50"
                                                  : "bg-[#1683FF] text-white hover:bg-[#0F6FE5]"
                                              }`}
                                              title="Unduh Berkas"
                                            >
                                              <Download className="w-3 h-3" />
                                              <span>Unduh</span>
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}

                              {/* ── Dokumentasi Foto Lampiran (Images) - Kompak & Proporsional ── */}
                              {displayPhotos.length > 0 && (
                                <div className="mt-2.5">
                                  {isDeliverableMsg && (
                                    <div className={`text-[10px] font-bold uppercase tracking-wider mb-1 px-0.5 flex items-center gap-1 ${
                                      isMe ? "text-blue-100" : "text-slate-500"
                                    }`}>
                                      <Camera className="w-3 h-3" />
                                      <span>Dokumentasi Foto ({displayPhotos.length}):</span>
                                    </div>
                                  )}
                                  <div
                                    className={`${
                                      displayPhotos.length === 1
                                        ? "w-full max-w-[170px]"
                                        : "w-full max-w-[220px] grid grid-cols-2 gap-1.5"
                                    }`}
                                  >
                                    {displayPhotos.map((photo, pIdx) => (
                                      <div
                                        key={pIdx}
                                        onClick={() => setLightboxImage(photo)}
                                        className="relative group rounded-xl overflow-hidden border border-black/10 bg-slate-900/10 cursor-pointer shadow-2xs hover:shadow-md transition active:scale-[0.98]"
                                      >
                                        <img
                                          src={photo}
                                          alt={`Lampiran foto ${pIdx + 1}`}
                                          className={`w-full ${
                                            displayPhotos.length === 1
                                              ? "max-h-[140px] object-cover"
                                              : "aspect-square object-cover"
                                          } group-hover:scale-105 transition duration-200`}
                                          loading="lazy"
                                        />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-[10px] font-bold gap-1 backdrop-blur-2xs">
                                          <Search className="w-3 h-3" />
                                          <span>Perbesar</span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    )}

                    <span className="text-[10px] text-slate-400 mt-0.5 px-0.5 flex items-center gap-1 select-none">
                      <span>{formatMessageTime(msg)}</span>
                      {msg.isEdited && <span className="italic opacity-70">(diedit)</span>}
                      {isMe && (() => {
                        if (msg.isFailed || msg.status === "failed") {
                          return (
                            <span className="inline-flex items-center gap-1 text-rose-500 font-semibold" title="Gagal terkirim">
                              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRetryMessage(msg);
                                }}
                                className="underline hover:text-rose-700 cursor-pointer text-[10px]"
                              >
                                Kirim ulang
                              </button>
                            </span>
                          );
                        }
                        if (msg.isOptimistic || msg.status === "pending") {
                          return (
                            <Clock
                              className="w-3 h-3 text-slate-400 animate-pulse shrink-0"
                              title="Sedang mengirim..."
                            />
                          );
                        }
                        if (msg.isRead) {
                          return (
                            <CheckCheck
                              className="w-3.5 h-3.5 text-[#1683FF] shrink-0"
                              title="Telah dibaca"
                            />
                          );
                        }
                        if (msg.isDelivered || selectedRoom?.partner?.isOnline || selectedRoom?.helper?.isOnline) {
                          return (
                            <CheckCheck
                              className="w-3.5 h-3.5 text-slate-400 shrink-0"
                              title="Terkirim & diterima"
                            />
                          );
                        }
                        return (
                          <Check
                            className="w-3.5 h-3.5 text-slate-400 shrink-0"
                            title="Tersimpan di server"
                          />
                        );
                      })()}
                    </span>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {selectedRoom?.orderStatus === "completed" ? (
            /* ── COMPLETED: Chat Arsip Banner ── */
            <div className="border-t border-slate-200 bg-gradient-to-r from-slate-50 to-blue-50/40 px-4 py-3 shrink-0">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-blue-100 text-[#1683FF] flex items-center justify-center shrink-0">
                    <CheckCircle className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-700 truncate">Transaksi Selesai & Diarsipkan</p>
                    <p className="text-[11px] text-slate-500 truncate">Chat ini tidak bisa dibalas. Buka bantuan baru untuk berinteraksi lagi.</p>
                  </div>
                </div>
                <a
                  href={`/bantuan/buat${selectedRoom?.helper?.id ? `?helperId=${selectedRoom.helper.id}` : ""}`}
                  className="shrink-0 px-3 py-1.5 bg-[#1683FF] hover:bg-[#0F6FE5] text-white text-[11px] font-bold rounded-xl transition whitespace-nowrap shadow-sm"
                >
                  + Buka Bantuan Baru
                </a>
              </div>
            </div>
          ) : (
            <>
          {/* Quick Reply Bar */}
          <div className="h-11 px-3 bg-white border-t border-slate-100 flex items-center gap-2 overflow-x-auto scrollbar-none shrink-0">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">Cepat:</span>
            <div className="flex items-center gap-1.5 flex-nowrap">
              {(selectedRoomMeta?.type === "sewa"
                ? (selectedRoom?.rentalDetails?.plateNumber || selectedRoom?.category?.toLowerCase()?.includes("motor") || selectedRoom?.category?.toLowerCase()?.includes("mobil")
                    ? (isInquiry
                        ? [
                            "Apakah armada ready tanggal ini?",
                            "Bisa sistem lepas kunci atau dengan driver?",
                            "Kondisi mesin, bensin & ban aman?",
                            "Bisa antar ke stasiun/lokasi saya?",
                            "Persyaratan SIM & e-KTP sudah siap!"
                          ]
                        : [
                            activeRole === "helper" ? "Unit armada sudah bersih dan bensin full siap pakai ya kak" : "Halo, saya otw ambil unit kendaraannya ya",
                            "Foto fisik bodi & speedometer sudah saya cek",
                            "STNK dan kunci unit sudah diperiksa & diterima",
                            "Siap, terima kasih banyak!"
                          ]
                      )
                    : (isInquiry
                        ? [
                            "Apakah alat ready tanggal ini?",
                            "Kondisi fisik & fungsi normal 100%?",
                            "Sudah include baterai & tas unit?",
                            "Bisa ambil di toko jam berapa hari ini?",
                            "Siap, saya proses pembayaran sekarang!"
                          ]
                        : [
                            activeRole === "helper" ? "Unit alat sudah siap diambil di toko ya kak" : "Halo, saya otw ambil unit ke toko ya",
                            "Kondisi alat sudah dicek bersama",
                            "Pengecekan unit berjalan lancar",
                            "Siap, terima kasih!"
                          ]
                      )
                  )
                : selectedRoomMeta?.type === "bantuan"
                ? (isInquiry
                    ? (isOnline
                        ? [
                            "Halo, apakah tugas bantuan online ini masih open?",
                            "Bisa dibantu mulai jam berapa hari ini?",
                            "Brief instruksi & berkas digital sudah sesuai?",
                            "Ada format file khusus atau deadline tugas?",
                            "Siap bantu, saya ajukan penawaran tugas!"
                          ]
                        : [
                            "Halo, apakah tugas bantuan ini masih open?",
                            "Bisa dibantu mulai jam berapa hari ini?",
                            "Titik penjemputan & antar sudah sesuai lokasi?",
                            "Ada instruksi atau barang khusus yang perlu dibawa?",
                            "Siap bantu, saya ajukan penawaran tugas!"
                          ]
                      )
                    : (isOnline
                        ? [
                            activeRole === "helper" ? "Tugas online sedang saya proses sesuai instruksi ya kak" : "Halo helper, bagaimana progres pengerjaan tugasnya?",
                            activeRole === "helper" ? "Pengerjaan digital selesai, tautan hasil siap dicek" : "Tolong kabari jika berkas tugas sudah siap dicek ya",
                            "Tautan berkas digital / bukti pengerjaan sudah diunggah",
                            "Tugas online telah selesai dengan baik, terima kasih!"
                          ]
                        : [
                            activeRole === "helper" ? "Saya sedang otw menuju ke lokasi tugas ya kak" : "Halo helper, bagaimana posisi dan estimasi tiba?",
                            activeRole === "helper" ? "Sudah tiba di lokasi dan sedang mengerjakan tugas" : "Tolong kabari jika tugas sudah beres ya",
                            "Foto dokumentasi / hasil tugas sudah diunggah",
                            "Tugas telah selesai dengan baik, terima kasih!"
                          ]
                      )
                  )
                : isInquiry
                ? [
                    "Kapan estimasi pengerjaan bisa dimulai?",
                    "Apakah siap sesuai spesifikasi brief?",
                    "Bisa request revisi minor jika diperlukan?",
                    "Saya setuju dengan penawaran layanan ini.",
                    "Siap, saya proses pembayaran sekarang!"
                  ]
                : isOnline
                ? [
                    activeRole === "helper" ? "Berkas digital sedang saya proses sesuai brief" : "Bagaimana progres pengerjaan desain/berkas?",
                    activeRole === "helper" ? "Tautan preview file hasil sudah saya kirimkan" : "Tolong kirimkan preview file hasilnya ya",
                    "Silakan diperiksa terlebih dahulu hasilnya",
                    "Hasil pekerjaan sudah sesuai dan saya setujui!"
                  ]
                : [
                    activeRole === "helper" ? "Pengerjaan fisik/cetak sedang diproses rapi" : "Apakah hasil cetak/servis sudah siap diambil?",
                    activeRole === "helper" ? "Pesanan siap diambil di workshop kami" : "Saya otw ke lokasi untuk ambil ya",
                    "Hasil pekerjaan sangat rapi dan memuaskan",
                    "Terima kasih banyak atas pelayanannya!"
                  ]
              ).map((template, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setChatInput(template);
                    if (selectedRoomId) {
                      setRoomDrafts((prev) => ({ ...prev, [selectedRoomId]: template }));
                      try {
                        if (typeof window !== "undefined" && currentUser?.id) {
                          sessionStorage.setItem(`bantuin_draft_${currentUser.id}_${selectedRoomId}`, template);
                        }
                      } catch {}
                    }
                  }}
                  className="h-7 px-2.5 rounded-lg bg-slate-50 hover:bg-blue-50 border border-slate-200/80 hover:border-blue-300 text-[11px] font-medium text-slate-600 hover:text-[#1683FF] whitespace-nowrap transition cursor-pointer shrink-0"
                >
                  {template}
                </button>
              ))}
            </div>
          </div>

          {/* Privacy Notice Bar */}
          <div className="h-9 px-3 sm:px-4 bg-slate-50 border-t border-slate-100 flex items-center gap-1.5 text-slate-500 shrink-0">
            <ShieldCheck className="w-3.5 h-3.5 text-[#1683FF] shrink-0" />
            <span className="truncate text-[11px] font-medium">
              Privasi Terjaga: Dilarang bertukar kontak pribadi di luar sistem Bantuin.
            </span>
          </div>

          {/* Realtime Upload Status Indicator (Sinkron dengan status upload dan database) */}
          {chatUploadStatus.state !== "idle" && (
            <div className="px-3.5 py-2 bg-blue-50/90 border-t border-blue-200 flex items-center justify-between gap-3 text-xs animate-in slide-in-from-bottom-2 duration-150 shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                {chatUploadStatus.state === "uploading" && (
                  <>
                    <Loader2 className="w-3.5 h-3.5 text-[#1683FF] animate-spin shrink-0" />
                    <span className="text-slate-700 font-medium truncate text-[11px]">
                      Mengunggah berkas <strong className="text-slate-900">{chatUploadStatus.fileName}</strong> ke server...
                    </span>
                  </>
                )}
                {chatUploadStatus.state === "sending" && (
                  <>
                    <Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin shrink-0" />
                    <span className="text-blue-700 font-medium truncate text-[11px]">
                      Menyimpan berkas <strong className="text-slate-900">{chatUploadStatus.fileName}</strong> ke obrolan...
                    </span>
                  </>
                )}
                {chatUploadStatus.state === "success" && (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="text-emerald-700 font-medium truncate text-[11px]">
                      Berkas <strong className="text-slate-900">{chatUploadStatus.fileName}</strong> berhasil terkirim!
                    </span>
                  </>
                )}
                {chatUploadStatus.state === "error" && (
                  <>
                    <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    <span className="text-rose-700 font-medium truncate text-[11px]">
                      Gagal: {chatUploadStatus.error || "Gagal mengunggah berkas."}
                    </span>
                  </>
                )}
              </div>

              {chatUploadStatus.state === "error" && (
                <button
                  type="button"
                  onClick={() => setChatUploadStatus({ state: "idle", fileName: "", error: null })}
                  className="px-2 py-0.5 rounded-md bg-rose-100 hover:bg-rose-200 text-rose-800 text-[10px] font-bold transition shrink-0 cursor-pointer"
                >
                  Tutup
                </button>
              )}
            </div>
          )}

          {/* Chat Input Bar (~56px) */}
          <form
            onSubmit={handleSend}
            className="h-14 px-3 sm:px-4 border-t border-slate-200 bg-white flex items-center gap-2 shrink-0"
          >
            <input
              type="file"
              ref={chatFileInputRef}
              onChange={handleChatFileUpload}
              accept="image/*"
              className="hidden"
            />

            <button
              type="button"
              onClick={() => chatFileInputRef.current?.click()}
              className="w-9 h-9 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition shrink-0"
              title="Lampirkan Dokumen / Foto"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            <input
              type="text"
              value={chatInput}
              onChange={handleChatInputChange}
              placeholder="Tulis pesan..."
              disabled={isSendingMessage}
              className="flex-1 h-9 text-xs sm:text-sm px-3 rounded-xl border border-slate-200 bg-slate-50/60 focus:bg-white focus:outline-none focus:border-[#1683FF] transition disabled:opacity-60"
            />

            <button
              type="submit"
              disabled={isSendingMessage || !chatInput.trim()}
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition shrink-0 ${
                chatInput.trim() && !isSendingMessage
                  ? "bg-[#1683FF] text-white hover:bg-[#0F6FE5] shadow-2xs active:scale-95 cursor-pointer"
                  : "bg-slate-100 text-slate-400 cursor-not-allowed pointer-events-none"
              }`}
              title="Kirim pesan"
            >
              {isSendingMessage ? (
                <Loader2 className="w-4 h-4 animate-spin text-[#1683FF]" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </form>
            </>
          )}
          </>
        )}
        </div>

        {/* Mobile slide-over drawer backdrop overlay */}
        {showRightDrawerMobile && (
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden animate-in fade-in duration-200"
            onClick={() => setShowRightDrawerMobile(false)}
          />
        )}

        {selectedRoom && (
        <aside className={`
          ${showRightDrawerMobile ? "fixed inset-y-0 right-0 z-50 w-80 max-w-[85vw] shadow-2xl flex" : "hidden"}
          ${isDetailsOpen ? "lg:flex" : "lg:hidden"}
          lg:static w-72 xl:w-80 bg-white border-l border-slate-200 flex-col shrink-0 overflow-y-auto p-4 space-y-4
        `}>
          
          {/* Close button on drawer */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
              {selectedRoomMeta && <selectedRoomMeta.icon className={`w-3.5 h-3.5 ${selectedRoomMeta.accentText}`} />}
              <span>
                {selectedRoomMeta?.type === "bantuan"
                  ? "Rincian Permintaan Bantuan"
                  : selectedRoomMeta?.type === "sewa"
                  ? "Rincian Sewa Alat & Kendaraan"
                  : "Rincian Layanan Jasa"}
              </span>
            </span>
            <button
              type="button"
              onClick={() => {
                setShowRightDrawerMobile(false);
                setIsDetailsOpen(false);
              }}
              className="p-1 rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer"
              title="Tutup Panel Rincian"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Partner Simple Card with Direct Call Action */}
          {(() => {
            const isSelectedRoomRequester = selectedRoom.requesterId ? selectedRoom.requesterId === currentUser?.id : (activeRole === "requester");
            const activePartner = isSelectedRoomRequester
              ? (selectedRoom.helper || { name: "Helper Bantuin", avatar: null })
              : (selectedRoom.requester || selectedRoom.helper || { name: "Pemesan", avatar: null });
            const activePartnerDisplayName = getPartyDisplayName(
              activePartner,
              selectedRoomMeta?.type === "sewa",
              isSelectedRoomRequester
            );

            const computedResponseTime = calculateResponseTime(
              selectedRoom.messages,
              selectedRoom.helper?.id || selectedRoom.helperId,
              selectedRoom.requester?.id || selectedRoom.requesterId
            );

            return (
              <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200/80 rounded-2xl gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  {activePartner.avatar && !activePartner.avatar.includes("images.unsplash.com") ? (
                    <img
                      src={activePartner.avatar}
                      alt={activePartnerDisplayName}
                      className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0 shadow-2xs"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-linear-to-br from-[#1683FF] to-[#0E5FCC] text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs">
                      {activePartnerDisplayName ? activePartnerDisplayName.slice(0, 2).toUpperCase() : "US"}
                    </div>
                  )}
                  <div className="min-w-0">
                    <h3 className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                      {activePartnerDisplayName}
                    </h3>
                    <div className="text-[11px] text-slate-500 mt-0.5 space-y-0.5">
                      <p className="truncate">
                        {isInquiry ? "Kandidat Diskusi" : isNotSelected ? "Kandidat Tidak Terpilih" : "Mitra Terverifikasi"}
                      </p>
                      <p className="text-[10px] text-slate-600 font-medium flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[#1683FF] shrink-0" />
                        <span>Waktu Balas: <strong className="text-slate-800">{computedResponseTime}</strong></span>
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleStartCall}
                  className="px-2.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#1683FF] border border-blue-200 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-2xs shrink-0"
                  title="Telepon Panggilan Suara In-App"
                >
                  <Phone className="w-3.5 h-3.5 text-[#1683FF]" />
                  <span>Telepon</span>
                </button>
              </div>
            );
          })()}

          {/* JIKA PESANAN SEWA (ALAT MULTIMEDIA / KENDARAAN) */}
          {selectedRoomMeta?.type === "sewa" ? (
            <div className="space-y-4 flex-1 flex flex-col justify-between">
              <div className="space-y-3">
                
                {/* Unit / Vehicle card */}
                <div className="p-3 bg-slate-50 border border-blue-200/60 rounded-2xl space-y-2">
                  <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-200">
                    <img
                      src={selectedRoom.rentalDetails?.photoUrl || selectedRoom.helper?.avatar}
                      alt={selectedRoom.rentalDetails?.unitName || selectedRoom.requestTitle}
                      className="w-full h-full object-cover"
                    />
                    {selectedRoom.rentalDetails?.plateNumber ? (
                      <span className="absolute bottom-2 left-2 bg-slate-900/90 text-white font-mono text-[10px] font-bold px-2 py-0.5 rounded shadow-sm backdrop-blur-xs">
                        {selectedRoom.rentalDetails.plateNumber}
                      </span>
                    ) : (
                      <span className="absolute bottom-2 left-2 bg-slate-900/90 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm backdrop-blur-xs">
                        Sewa Unit Terverifikasi
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="font-extrabold text-xs text-slate-900">
                      {selectedRoom.rentalDetails?.unitName || selectedRoom.requestTitle}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Durasi: {selectedRoom.rentalDetails?.durationDays || 2} Hari ({selectedRoom.rentalDetails?.startDate} s/d {selectedRoom.rentalDetails?.endDate})
                    </div>
                  </div>
                </div>

                {/* Escrow breakdown */}
                {(() => {
                  const effDeposit = Number(selectedRoom.depositAmount ?? selectedRoom.rentalDetails?.depositFee ?? 0);
                  const effRental = Number(selectedRoom.rentalFeeAmount || selectedRoom.rentalDetails?.rentalFee || 0) || (
                    selectedRoom.lockedAmount && effDeposit > 0 && selectedRoom.lockedAmount > effDeposit
                      ? selectedRoom.lockedAmount - effDeposit
                      : Number(selectedRoom.lockedAmount || 0)
                  );
                  const effTotal = Number(selectedRoom.totalAmount || selectedRoom.rentalDetails?.totalAmount) || (
                    effRental + effDeposit
                  ) || Number(selectedRoom.lockedAmount || 0);
                  const effDays = selectedRoom.rentalDetails?.durationDays || (() => {
                    const dMatch = (selectedRoom.rentalDetails?.unitName || selectedRoom.requestTitle || "").match(/\((\d+)\s*Hari\)/i);
                    return dMatch ? parseInt(dMatch[1], 10) : 2;
                  })();

                  return (
                    <div className="p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-2xl space-y-2 text-xs">
                      <div className="flex items-center justify-between text-slate-600">
                        <span>Biaya Sewa ({effDays} hari):</span>
                        <span className="font-bold text-slate-900">{formatIDR(effRental)}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-600">
                        <span>Deposit Jaminan (Refundable):</span>
                        <span className="font-bold text-slate-900">{formatIDR(effDeposit)}</span>
                      </div>
                      <div className="pt-2 border-t border-blue-200 flex items-center justify-between font-extrabold text-slate-900">
                        <span>Total Pembayaran Diamankan:</span>
                        <span className="text-[#1683FF] text-sm">{formatIDR(effTotal)}</span>
                      </div>
                    </div>
                  );
                })()}

                {/* Pool & Pickup Info */}
                <div className="p-3 bg-white border border-slate-200 rounded-2xl space-y-2 text-xs">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#1683FF]" />
                    <span>{selectedRoom.rentalDetails?.plateNumber ? "Titik Pool / Pengambilan Armada" : "Lokasi Toko Pengambilan Alat"}</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    {selectedRoom.rentalDetails?.pickupLocation || selectedRoom.helper?.address || "Safe Point Mitra Bantuin"}
                  </p>

                  {/* Google Maps Button for Sewa */}
                  {roomMapsUrl && (
                    <a
                      href={roomMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-2xs cursor-pointer active:scale-95 mt-1"
                    >
                      <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Petunjuk Arah Google Maps</span>
                      <ExternalLink className="w-3 h-3 text-emerald-600" />
                    </a>
                  )}

                  <div className="p-2.5 rounded-xl bg-blue-50/80 border border-blue-100 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <span className="text-[10px] text-slate-500 block">Koordinasi Langsung Mitra</span>
                      <span className="font-bold text-slate-800 text-[11px] flex items-center gap-1">
                        <Lock className="w-3 h-3 text-[#1683FF]" />
                        <span>Chat &amp; Panggilan Terproteksi</span>
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded-md bg-white text-[#1683FF] text-[10px] font-bold border border-blue-200">
                      Aktif
                    </span>
                  </div>
                </div>

                {/* Vehicle or Equipment Condition Checklist */}
                {selectedRoom.rentalDetails?.conditionChecklist && (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-1">
                    <div className="font-bold text-slate-800 text-[11px]">Fasilitas &amp; Kondisi Unit:</div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      {selectedRoom.rentalDetails.conditionChecklist}
                    </p>
                  </div>
                )}

                {/* Escrow Guarantee Note */}
                <div className="p-3 rounded-2xl bg-blue-50/70 border border-blue-100 text-xs flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#1683FF] shrink-0 mt-0.5" />
                  <span className="text-[11px] text-slate-800 leading-snug">
                    Deposit <strong>{formatIDR(selectedRoom.depositAmount ?? selectedRoom.rentalDetails?.depositFee ?? 0)}</strong> akan langsung dikembalikan 100% otomatis saat unit kembali dengan aman.
                  </span>
                </div>

              </div>

              {/* Trust Footer */}
              <div className="pt-3 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-500">
                <ShieldCheck className="w-4 h-4 text-[#1683FF] shrink-0" />
                <span className="text-[11px] leading-snug">
                  Sewa alat &amp; kendaraan terlindungi sistem pembayaran Bantuin.
                </span>
              </div>
            </div>
          ) : selectedRoomMeta?.type === "bantuan" ? (
            /* JIKA TUGAS BANTUAN KOMUNITAS & ERRAND */
            <div className="space-y-4 flex-1 flex flex-col justify-between">
              <div className="space-y-3">
                
                {/* Task card */}
                <div className="p-3 bg-slate-50 border border-blue-200/60 rounded-2xl space-y-2">
                  <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-200">
                    <img
                      src={selectedRoom.serviceDetails?.serviceImage || selectedRoom.helper?.avatar || "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=600&q=80"}
                      alt={selectedRoom.requestTitle}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-black/60 text-white font-bold text-[10px] backdrop-blur-xs">
                      Tugas Bantuan Lapangan
                    </span>
                  </div>
                  <div>
                    <div className="font-extrabold text-xs text-slate-900">
                      {selectedRoom.requestTitle}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Kategori: <strong className="text-slate-700">{selectedRoom.category || "Bantuan & Errand"}</strong>
                    </div>
                  </div>
                </div>

                {/* Pickup & Destination Info */}
                {(selectedRoom.pickupPoint || selectedRoom.destination) && (
                  <div className="p-3 bg-white border border-slate-200 rounded-2xl space-y-2 text-xs">
                    {selectedRoom.pickupPoint && (
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Titik Penjemputan / Ambil:</span>
                        <p className="text-slate-700 font-semibold text-[11px]">{selectedRoom.pickupPoint}</p>
                      </div>
                    )}
                    {selectedRoom.destination && (
                      <div className="pt-2 border-t border-slate-100">
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Titik Tujuan / Antar:</span>
                        <p className="text-slate-700 font-semibold text-[11px]">{selectedRoom.destination}</p>
                      </div>
                    )}

                    {/* Google Maps Button for Bantuan */}
                    {roomMapsUrl && (
                      <a
                        href={roomMapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-2xs cursor-pointer active:scale-95 mt-2"
                      >
                        <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Buka Titik di Google Maps</span>
                        <ExternalLink className="w-3 h-3 text-emerald-600" />
                      </a>
                    )}
                  </div>
                )}

                {/* Escrow breakdown */}
                <div className="p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-2xl space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Imbalan Jasa Helper:</span>
                    <span className="font-bold text-slate-900">{formatIDR(selectedRoom.helperPayoutAmount || selectedRoom.lockedAmount || 35000)}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600 text-[11px]">
                    <span>Biaya Layanan Platform:</span>
                    <span className="font-bold text-slate-900">{formatIDR(selectedRoom.platformFee || 2000)}</span>
                  </div>
                  <div className="pt-2 border-t border-blue-200 flex items-center justify-between font-extrabold text-slate-900">
                    <span>Total Pembayaran Terverifikasi:</span>
                    <span className="text-[#1683FF] text-sm">{formatIDR(selectedRoom.lockedAmount || 35000)}</span>
                  </div>
                </div>

                {/* Contact & In-App Call for Bantuan */}
                <div className="p-3 bg-white border border-slate-200 rounded-2xl space-y-2 text-xs">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#1683FF]" />
                    <span>Koordinasi Tugas Langsung</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Hubungi helper via telepon in-app jika helper belum membaca chat saat bertugas di lokasi.
                  </p>
                  <div className="p-2.5 rounded-xl bg-blue-50/80 border border-blue-100 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <span className="text-[10px] text-slate-500 block">Panggilan Langsung</span>
                      <span className="font-bold text-slate-800 text-[11px] flex items-center gap-1">
                        <Lock className="w-3 h-3 text-[#1683FF]" />
                        <span>Nomor HP Terproteksi</span>
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleStartCall}
                      className="px-2.5 py-1.5 rounded-lg bg-[#1683FF] hover:bg-[#0F6FE5] text-white text-[11px] font-bold flex items-center gap-1 transition shadow-2xs cursor-pointer shrink-0"
                      title="Panggil helper tugas via telepon suara in-app"
                    >
                      <Phone className="w-3 h-3" />
                      <span>Telepon Helper</span>
                    </button>
                  </div>
                </div>

                {/* Payment Guarantee Note */}
                <div className="p-3 rounded-2xl bg-blue-50/70 border border-blue-100 text-xs flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#1683FF] shrink-0 mt-0.5" />
                  <span className="text-[11px] text-slate-800 leading-snug">
                    Dana aman di sistem Bantuin sampai tugas selesai dan Anda mengonfirmasi penyelesaian.
                  </span>
                </div>

              </div>

              {/* Trust Footer */}
              <div className="pt-3 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-500">
                <ShieldCheck className="w-4 h-4 text-[#1683FF] shrink-0" />
                <span className="text-[11px] leading-snug">
                  Tugas komunitas terlindungi sistem pembayaran Bantuin.
                </span>
              </div>
            </div>
          ) : (
            /* JIKA PESANAN JASA / BANTUAN (INQUIRY ATAU AKTIF) */
            <div className="space-y-4 flex-1 flex flex-col justify-between">
              <div className="space-y-3.5">
                
                {/* 1. Service Card with Photo & Package */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
                  <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-200 border border-slate-200/80">
                    <img
                      src={
                        selectedRoom?.serviceDetails?.serviceImage ||
                        selectedRoom?.helper?.avatar ||
                        "/logotab.png"
                      }
                      alt={selectedRoom?.serviceDetails?.serviceTitle || selectedRoom?.requestTitle || "Layanan Jasa"}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-black/60 text-white font-bold text-[10px] backdrop-blur-xs">
                      {selectedRoom?.locationType === "onsite"
                        ? "Klien Datang"
                        : selectedRoom?.locationType === "customer_location"
                        ? "Mitra Datang"
                        : isOnline
                        ? "100% Online"
                        : "Di Lokasi"}
                    </span>
                  </div>
                  <div>
                    <div className="font-extrabold text-xs text-slate-900 leading-snug">
                      {selectedRoom?.serviceDetails?.serviceTitle || selectedRoom?.requestTitle}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1.5 flex-wrap">
                      <span className="px-2 py-0.5 rounded-md bg-blue-50 text-[#1683FF] font-bold text-[10px]">
                        {selectedRoom?.serviceDetails?.packageName || selectedRoom?.packageId || (selectedRoom?.category ? selectedRoom.category : "Paket Standar")}
                      </span>
                      <span>&middot;</span>
                      <span>1 - 2 Hari Kerja</span>
                    </div>
                  </div>
                </div>

                {/* Lokasi Layanan Fisik jika bukan online */}
                {!isOnline && roomLocationText && (
                  <div className="p-3 bg-white border border-slate-200 rounded-2xl space-y-2 text-xs">
                    <div className="font-bold text-slate-900 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        {selectedRoom?.locationType === "onsite" ? (
                          <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <MapPin className="w-3.5 h-3.5 text-[#1683FF]" />
                        )}
                        <span>
                          {selectedRoom?.locationType === "onsite"
                            ? "Lokasi Tempat Mitra"
                            : "Alamat Tujuan Mitra (Panggilan)"}
                        </span>
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-700 leading-relaxed font-semibold">
                      {roomLocationText}
                    </p>
                    {roomMapsUrl && (
                      <a
                        href={roomMapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-2xs cursor-pointer active:scale-95"
                      >
                        <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{selectedRoom?.locationType === "onsite" ? "Petunjuk Arah ke Lokasi Mitra" : "Buka Lokasi di Google Maps"}</span>
                        <ExternalLink className="w-3 h-3 text-emerald-600" />
                      </a>
                    )}
                  </div>
                )}

                {/* 2. Escrow Breakdown */}
                <div className="p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-2xl space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Biaya Layanan Jasa:</span>
                    <span className="font-bold text-slate-900">
                      {formatIDR(selectedRoom?.lockedAmount || selectedRoom?.serviceDetails?.totalAmount || 150000)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600 text-[11px]">
                    <span>Komisi Platform (8%):</span>
                    <span className="text-slate-500 font-semibold">Ditanggung Mitra</span>
                  </div>
                  <div className="pt-2 border-t border-blue-200 flex items-center justify-between font-extrabold text-slate-900">
                    <span>Total Tagihan Terverifikasi:</span>
                    <span className="text-[#1683FF] text-sm">
                      {formatIDR(selectedRoom?.lockedAmount || selectedRoom?.serviceDetails?.totalAmount || 150000)}
                    </span>
                  </div>
                  <div className="pt-1 flex items-center justify-between text-[10px]">
                    <span className="text-slate-500">Status Pembayaran:</span>
                    <span className="font-bold text-[#1683FF] flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#1683FF]" />
                      {isInquiry ? "Menunggu Pembayaran" : selectedRoom?.orderStatus === "completed" ? "Dana Dicairkan" : "Terverifikasi Aman"}
                    </span>
                  </div>
                </div>

                {/* 3. Hasil Kerja & Berkas (Deliverables Section) */}
                <div className="p-3 bg-white border border-slate-200 rounded-2xl space-y-2 text-xs">
                  <div className="font-bold text-slate-900 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-[#1683FF]" />
                      <span>Berkas Hasil Pekerjaan</span>
                    </span>
                    {selectedRoom?.orderStatus === "proof_submitted" && (
                      <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                        Perlu Review
                      </span>
                    )}
                  </div>

                  {deliverableData.submissionUrl ? (
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Tautan Cloud / Drive:</span>
                      <a
                        href={deliverableData.submissionUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-bold text-[#1683FF] hover:underline flex items-center gap-1 truncate"
                      >
                        <ExternalLink className="w-3 h-3 shrink-0" />
                        <span className="truncate">{deliverableData.submissionUrl}</span>
                      </a>
                    </div>
                  ) : null}

                  {deliverableData.files && deliverableData.files.length > 0 ? (
                    <div className="space-y-1.5">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        Berkas &amp; Lampiran ({deliverableData.files.length}):
                      </span>
                      {deliverableData.files.map((file, fIdx) => (
                        <div
                          key={file.id || fIdx}
                          className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-[11px] gap-2"
                        >
                          <div className="flex items-center gap-2 truncate min-w-0">
                            <FileText className="w-3.5 h-3.5 text-[#1683FF] shrink-0" />
                            <div className="truncate">
                              <span className="font-medium text-slate-800 truncate block">{file.name}</span>
                              {file.size && <span className="text-[9px] text-slate-400 block">{file.size}</span>}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            {file.url ? (
                              <a
                                href={file.url}
                                target="_blank"
                                rel="noreferrer"
                                download={file.name || "berkas"}
                                className="p-1 text-slate-500 hover:text-[#1683FF] hover:bg-slate-200 rounded shrink-0 transition"
                                title="Buka / Unduh berkas"
                              >
                                <Download className="w-3 h-3" />
                              </a>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleDownloadFile(file)}
                                className="p-1 text-slate-500 hover:text-[#1683FF] hover:bg-slate-200 rounded shrink-0 transition"
                                title="Unduh berkas"
                              >
                                <Download className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  {deliverableData.notes ? (
                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/70 text-[11px] text-slate-600">
                      <span className="text-[9px] uppercase font-bold text-slate-400 block mb-0.5">Catatan Mitra:</span>
                      <p className="italic leading-relaxed">&ldquo;{deliverableData.notes}&rdquo;</p>
                    </div>
                  ) : null}

                  {!deliverableData.submissionUrl && (!deliverableData.files || deliverableData.files.length === 0) ? (
                    <p className="text-[11px] text-slate-400 italic">
                      {isInquiry
                        ? "Diskusikan rincian brief sebelum pengerjaan dimulai."
                        : selectedRoom?.orderStatus === "proof_submitted"
                        ? "Penyedia jasa telah menyerahkan pekerjaan. Silakan tinjau berkas pada ruang obrolan."
                        : selectedRoom?.orderStatus === "completed"
                        ? "Seluruh berkas dan hasil telah diselesaikan."
                        : "Mitra sedang menyiapkan berkas hasil pekerjaan."}
                    </p>
                  ) : null}
                </div>

                {/* 4. Wilayah Operasional & Komunikasi */}
                <div className="p-3 bg-white border border-slate-200 rounded-2xl space-y-2 text-xs">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#1683FF]" />
                    <span>Wilayah Operasional Layanan</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    {selectedRoom?.helper?.address || selectedRoom?.helper?.location || "Purwokerto, Jawa Tengah"}
                  </p>
                  <div className="p-2.5 rounded-xl bg-blue-50/80 border border-blue-100 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <span className="text-[10px] text-slate-500 block">Koordinasi Jasa Langsung</span>
                      <span className="font-bold text-slate-800 text-[11px] flex items-center gap-1">
                        <Lock className="w-3 h-3 text-[#1683FF]" />
                        <span>Chat &amp; Panggilan Terproteksi</span>
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded-md bg-white text-[#1683FF] text-[10px] font-bold border border-blue-200">
                      Aktif
                    </span>
                  </div>
                </div>

                {/* 5. Payment Guarantee Note */}
                <div className="p-3 rounded-2xl bg-blue-50/70 border border-blue-100 text-xs flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#1683FF] shrink-0 mt-0.5" />
                  <span className="text-[11px] text-slate-800 leading-snug">
                    Dana <strong>{formatIDR(selectedRoom?.lockedAmount || 150000)}</strong> aman 100% di sistem Bantuin. Hak bayar mitra baru dapat dicairkan setelah Anda menyetujui hasil kerja.
                  </span>
                </div>

              </div>

              {/* Trust Footer */}
              <div className="pt-3 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-500">
                <ShieldCheck className="w-4 h-4 text-[#1683FF] shrink-0" />
                <span className="text-[11px] leading-snug">
                  Transaksi dilindungi Sistem Pembayaran Resmi Bantuin.
                </span>
              </div>
            </div>
          )}

        </aside>
        )}

      </div>



      {/* MODAL PENYERAHAN TUGAS */}
      {isProofModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-2xs flex items-center justify-center p-4 animate-in fade-in duration-100">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-3">
              <h3 className="font-bold text-sm text-slate-900">
                {isOnline ? "Kirim Berkas Digital" : "Unggah Foto Bukti Selesai"}
              </h3>
              <button
                onClick={() => setIsProofModalOpen(false)}
                className="w-6 h-6 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <form onSubmit={handleUploadProofSubmit} className="space-y-3 text-xs">
              {isOnline ? (
                <>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Pilih File (Dokumen / Desain / ZIP):
                    </label>
                    <input
                      type="file"
                      ref={digitalDocInputRef}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setDigitalFiles((prev) => [{ name: file.name, size: "1.5 MB" }, ...prev]);
                        }
                      }}
                      className="w-full p-2 rounded-lg border border-slate-200"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Atau Link Cloud (Google Drive / Figma):
                    </label>
                    <input
                      type="url"
                      value={submissionUrl}
                      onChange={(e) => setSubmissionUrl(e.target.value)}
                      placeholder="https://drive.google.com/..."
                      className="w-full p-2 rounded-lg border border-slate-200"
                    />
                  </div>
                </>
              ) : (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Pilih Foto Dokumentasi di Lokasi:
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    className="w-full p-2 rounded-lg border border-slate-200"
                  />
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Catatan Tambahan:</label>
                <textarea
                  rows={2}
                  value={proofNotes}
                  onChange={(e) => setProofNotes(e.target.value)}
                  placeholder="Tuliskan catatan singkat..."
                  className="w-full p-2 rounded-lg border border-slate-200"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsProofModalOpen(false)}
                  className="px-3 py-1.5 font-semibold text-slate-600 rounded-lg hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingProof}
                  className="px-4 py-1.5 bg-[#1683FF] hover:bg-[#0F6FE5] text-white font-bold rounded-lg shadow-xs disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none cursor-pointer"
                >
                  {isSubmittingProof ? "Mengirim..." : "Kirim & Selesaikan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL RATING & REVIEW KELENGKAPAN TUGAS */}
      {isRatingModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-2xs flex items-center justify-center p-4 animate-in fade-in duration-100">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold text-[#1683FF] bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
                  Selesai &amp; Beri Rating
                </span>
                <h3 className="font-black text-base text-slate-900 mt-1">Konfirmasi &amp; Nilai Helper</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsRatingModalOpen(false)}
                className="w-7 h-7 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Helper preview */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center gap-3">
              {selectedRoom?.helper?.avatar && !selectedRoom.helper.avatar.includes("images.unsplash.com") ? (
                <img
                  src={selectedRoom.helper.avatar}
                  alt={selectedRoom?.helper?.name}
                  className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-xs shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-linear-to-br from-[#1683FF] to-[#0E5FCC] text-white flex items-center justify-center font-bold text-base shadow-xs shrink-0">
                  {(selectedRoom?.helper?.name || "H")[0].toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="font-bold text-sm text-slate-900 truncate">{selectedRoom?.helper?.name}</div>
                <div className="text-xs text-slate-500 truncate">{selectedRoom?.requestTitle}</div>
                <div className="text-[11px] font-bold text-[#1683FF] mt-0.5">
                  Imbalan Cair: {formatIDR(selectedRoom?.helperPayoutAmount || selectedRoom?.lockedAmount)}
                </div>
              </div>
            </div>

            {/* BUKTI PENYELESAIAN TUGAS (FOTO BUKTI & CATATAN HELPER) */}
            <div className="p-3.5 bg-blue-50/70 rounded-2xl border border-blue-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#1683FF]">
                  <CheckCircle2 className="w-4 h-4 text-[#1683FF] shrink-0" />
                  <span>Bukti Penyelesaian Tugas</span>
                </div>
                <span className="text-[10px] font-semibold text-slate-600 bg-white px-2 py-0.5 rounded-full border border-blue-100">
                  {currentProofPhotos.length > 0 ? `${currentProofPhotos.length} Foto Bukti` : "Diunggah Helper"}
                </span>
              </div>

              {/* Grid Foto & Dokumen Bukti */}
              {currentProofPhotos.length > 0 ? (
                <div className="grid grid-cols-3 gap-2 pt-1">
                  {currentProofPhotos.map((imgUrl, pIdx) => {
                    const isPdf = typeof imgUrl === "string" && (
                      imgUrl.toLowerCase().split("?")[0].endsWith(".pdf") ||
                      imgUrl.toLowerCase().includes("application/pdf") ||
                      imgUrl.toLowerCase().includes("/pdf") ||
                      imgUrl.toLowerCase().includes("dokumentugas")
                    );

                    if (isPdf) {
                      return (
                        <a
                          key={pIdx}
                          href={imgUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="relative group aspect-video rounded-xl overflow-hidden border border-rose-200 bg-rose-50/90 p-2 flex flex-col items-center justify-center text-center cursor-pointer shadow-xs hover:bg-rose-100 transition"
                        >
                          <div className="w-7 h-7 rounded-lg bg-rose-500 text-white flex items-center justify-center mb-1 shadow-2xs group-hover:scale-110 transition">
                            <FileText className="w-4 h-4" />
                          </div>
                          <span className="text-[10px] font-bold text-rose-800 truncate max-w-full px-1">
                            Dokumen PDF
                          </span>
                          <span className="text-[9px] text-rose-600 font-semibold flex items-center gap-0.5">
                            Buka Berkas <ExternalLink className="w-2.5 h-2.5" />
                          </span>
                        </a>
                      );
                    }

                    return (
                      <div
                        key={pIdx}
                        onClick={() => setLightboxImage(imgUrl)}
                        className="relative group aspect-video rounded-xl overflow-hidden border border-blue-200 bg-slate-900/10 cursor-pointer shadow-2xs"
                      >
                        <img
                          src={imgUrl}
                          alt={`Bukti Tugas ${pIdx + 1}`}
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                            const parent = e.currentTarget.parentElement;
                            if (parent) {
                              parent.className = "relative group aspect-video rounded-xl overflow-hidden border border-rose-200 bg-rose-50/90 p-2 flex flex-col items-center justify-center text-center cursor-pointer shadow-xs";
                              parent.innerHTML = '<div class="w-7 h-7 rounded-lg bg-rose-500 text-white flex items-center justify-center mb-1 shadow-2xs"><svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg></div><span class="text-[10px] font-bold text-rose-800 truncate max-w-full px-1">Dokumen PDF</span><span class="text-[9px] text-rose-600 font-semibold">Buka Berkas ↗</span>';
                            }
                          }}
                          className="w-full h-full object-cover group-hover:scale-105 transition"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-[10px] font-bold gap-1">
                          <Search className="w-3 h-3" />
                          <span>Perbesar</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-[11px] text-slate-500 italic bg-white/80 p-2.5 rounded-xl border border-blue-100">
                  Foto bukti penyelesaian diunggah langsung oleh Helper untuk verifikasi tugas ini.
                </div>
              )}

              {/* Catatan / Keterangan Pengerjaan */}
              {currentProofNotes && (
                <div className="text-xs text-slate-700 bg-white p-2.5 rounded-xl border border-blue-100 leading-relaxed">
                  <span className="font-bold text-slate-800 text-[11px] block mb-0.5">Catatan Helper:</span>
                  <p className="italic text-slate-600 text-[11px]">&ldquo;{currentProofNotes}&rdquo;</p>
                </div>
              )}
            </div>

            {/* Interactive 5 Stars */}
            <div className="text-center py-2 space-y-2">
              <div className="text-xs font-bold text-slate-700">Bagaimana kualitas bantuan yang diberikan?</div>
              <div className="flex items-center justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRatingValue(star)}
                    className="p-1 cursor-pointer transition transform hover:scale-110 active:scale-95"
                  >
                    <Star
                      className={`w-8 h-8 ${
                        star <= ratingValue
                          ? "text-amber-400 fill-amber-400 drop-shadow-xs"
                          : "text-slate-200 fill-slate-100"
                      }`}
                    />
                  </button>
                ))}
              </div>
              <div className="text-xs font-black text-amber-600">
                {ratingValue === 5 && "5.0 - Sangat Memuaskan & Sempurna!"}
                {ratingValue === 4 && "4.0 - Bagus & Sesuai Ekspektasi"}
                {ratingValue === 3 && "3.0 - Cukup Baik"}
                {ratingValue === 2 && "2.0 - Kurang Maksimal"}
                {ratingValue === 1 && "1.0 - Tidak Memuaskan"}
              </div>
            </div>

            {/* Quick feedback chips */}
            <div className="flex flex-wrap gap-1.5">
              {[
                "Pengerjaan Sangat Cepat",
                "Hasil Rapi & Teliti",
                "Komunikatif & Sopan",
                "Sangat Direkomendasikan",
              ].map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => {
                    setReviewFeedback((prev) => (prev ? `${prev}, ${chip}` : chip));
                  }}
                  className="text-[10px] font-semibold bg-slate-100 hover:bg-blue-50 hover:text-[#1683FF] hover:border-blue-200 text-slate-600 px-2.5 py-1 rounded-full border border-slate-200/70 transition cursor-pointer"
                >
                  + {chip}
                </button>
              ))}
            </div>

            {/* Textarea review */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Ulasan / Catatan Penilaian (Opsional):</label>
              <textarea
                rows={2}
                value={reviewFeedback}
                onChange={(e) => setReviewFeedback(e.target.value)}
                placeholder="Tulis ulasan tentang hasil kerja helper untuk ditampilkan di profilnya..."
                className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-hidden focus:border-[#1683FF] focus:ring-1 focus:ring-[#1683FF] resize-none"
              />
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsRatingModalOpen(false)}
                className="flex-1 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isSubmittingRating}
                onClick={() => {
                  if (isSubmittingRatingRef.current) return;

                  const targetRating = ratingValue;
                  const targetFeedback = reviewFeedback || "Tugas diselesaikan dengan sangat baik & tepat waktu.";
                  const targetRoomId = selectedRoom?.id;

                  // Tutup modal secara instan (<5ms)
                  setIsRatingModalOpen(false);
                  setIsSubmittingRating(false);
                  isSubmittingRatingRef.current = false;
                  setReviewFeedback("");

                  addToast?.("Penilaian Disimpan", "Terima kasih telah memberikan ulasan & rating.");

                  if (targetRoomId) {
                    confirmOrderCompletion(targetRoomId, {
                      rating: targetRating,
                      feedback: targetFeedback,
                    }).catch((err) => console.error("Rating completion background error:", err));
                  }
                }}
                className="flex-2 py-2.5 bg-[#1683FF] hover:bg-[#0F6FE5] text-white font-bold text-xs rounded-xl shadow-md transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed disabled:pointer-events-none"
              >
                {isSubmittingRating ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Memproses Penilaian...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Selesaikan &amp; Update Profil</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FULL-SCREEN PHOTO LIGHTBOX MODAL (WHITE CARD) */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-150"
          onClick={() => setLightboxImage(null)}
        >
          <div
            className="relative max-w-3xl w-full max-h-[92vh] bg-white rounded-2xl sm:rounded-3xl overflow-hidden border border-slate-200/90 shadow-2xl p-3 sm:p-4 flex flex-col animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Pop Up Putih */}
            <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-slate-100 px-1">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#1683FF] flex items-center justify-center shrink-0">
                  <Camera className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs sm:text-sm font-extrabold text-slate-900 block truncate">
                    Pratinjau Foto Lampiran
                  </span>
                  <span className="text-[10px] text-slate-400 block truncate">
                    Tampilan resolusi penuh • Terverifikasi aman
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setLightboxImage(null)}
                className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition cursor-pointer shrink-0"
                title="Tutup Preview"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Container Foto */}
            <div className="flex-1 overflow-hidden flex items-center justify-center p-1 sm:p-2 bg-slate-50/80 rounded-xl sm:rounded-2xl border border-slate-100 my-1">
              <img
                src={lightboxImage}
                alt="Foto Lampiran Resolusi Penuh"
                className="max-w-full max-h-[64vh] sm:max-h-[72vh] object-contain rounded-lg sm:rounded-xl shadow-xs select-auto"
              />
            </div>

            {/* Footer Pop Up */}
            <div className="pt-2.5 px-1 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 border-t border-slate-100 text-slate-500">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Foto tersimpan aman di server Bantuin</span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <a
                  href={lightboxImage}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-[#1683FF] hover:bg-blue-50 rounded-lg transition flex items-center gap-1 cursor-pointer"
                >
                  <span>Buka Tab Baru</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
                <a
                  href={lightboxImage}
                  download="foto-lampiran.jpg"
                  className="px-3 py-1.5 rounded-xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white text-xs font-bold flex items-center gap-1.5 transition shadow-2xs active:scale-95 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh Foto</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* IN-APP ENCRYPTED VOICE CALL MODAL */}
      <InAppVoiceCallModal
        isOpen={isVoiceCallOpen}
        onClose={() => setIsVoiceCallOpen(false)}
        partner={(() => {
          const rawPartner = activeRole === "requester" ? selectedRoom?.helper : selectedRoom?.requester;
          if (!rawPartner) return { name: "Mitra Bantuin" };
          return {
            ...rawPartner,
            name: getPartyDisplayName(rawPartner, selectedRoomMeta?.type === "sewa", activeRole === "requester"),
          };
        })()}
        roomTitle={selectedRoom?.requestTitle}
        onCallEnded={handleCallEnded}
      />

      {/* NOTICE & TAKEDOWN REPORT MODAL */}
      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        targetRoom={selectedRoom}
        targetUser={activeRole === "requester" ? selectedRoom?.helper : selectedRoom?.requester}
      />

      {/* MODAL KONFIRMASI HAPUS PESAN / OBROLAN */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto mb-4 border border-rose-100">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 text-center mb-1">
              {deleteTarget.type === "message" ? "Hapus Pesan Ini?" : "Hapus Obrolan Ini?"}
            </h3>
            <p className="text-xs text-slate-500 text-center mb-6 leading-relaxed">
              {deleteTarget.type === "message"
                ? "Pesan ini akan dihapus secara permanen untuk semua pihak. Tindakan ini tidak dapat dibatalkan."
                : "Percakapan ini akan dihapus dari daftar obrolan Anda. Pihak lawan bicara tetap dapat melihat obrolan ini secara mandiri."}
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={isDeletingTarget}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition cursor-pointer disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeletingTarget}
                className="flex-1 px-4 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 disabled:bg-rose-400 text-white text-xs font-semibold shadow-sm transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                {isDeletingTarget ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Menghapus...</span>
                  </>
                ) : (
                  <span>Ya, Hapus</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ChatWorkspacePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center p-8 bg-[#F4F7FB] text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-[#1683FF]" />
            <span>Memuat ruang chat...</span>
          </div>
        </div>
      }
    >
      <ChatWorkspaceContent />
    </Suspense>
  );
}

