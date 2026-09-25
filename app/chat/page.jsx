"use client";

import React, { useState, useRef, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useApp } from "@/lib/context/AppContext";
import { formatIDR } from "@/lib/utils";
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
  CheckCircle2,
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
  Flag
} from "lucide-react";
import ChatFlowTracker from "@/components/chat/ChatFlowTracker";
import InAppVoiceCallModal from "@/components/chat/InAppVoiceCallModal";
import ReportModal from "@/components/modals/ReportModal";
import { detectDisintermediation, detectProhibitedContent } from "@/lib/security";

// Helper Kategori Global: Menjamin pilar Jasa, Bantuan, dan Sewa 100% konsisten
export function getCategoryMeta(room) {
  const catType = (room?.categoryType || "").toLowerCase();
  const orderType = (room?.orderType || "").toLowerCase();
  const rawCat = (room?.category || "").toLowerCase();
  const rawTitle = (room?.requestTitle || "").toLowerCase();
  const roomId = (room?.id || "").toLowerCase();

  // 1. JASA (Jika catType = jasa/service atau orderType = service)
  if (catType === "jasa" || catType === "service" || orderType === "service") {
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

  // 2. BANTUAN (Jika catType = bantuan/task atau orderType = task)
  if (catType === "bantuan" || catType === "task" || orderType === "task") {
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

  // 3. SEWA (Jika catType = sewa/rental atau orderType = rental)
  if (catType === "sewa" || catType === "rental" || orderType === "rental") {
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

  // 4. Fallback jika properti eksplisit belum terdefinisi
  if (
    rawCat.includes("sewa") ||
    rawCat.includes("rental") ||
    rawCat.includes("kamera") ||
    rawCat.includes("audio") ||
    rawCat.includes("sound") ||
    rawCat.includes("proyektor") ||
    rawCat.includes("lensa") ||
    rawCat.includes("motor") ||
    rawCat.includes("mobil") ||
    rawTitle.includes("sewa") ||
    rawTitle.includes("rental") ||
    rawTitle.includes("vario") ||
    rawTitle.includes("avanza") ||
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

  if (
    rawCat.includes("bantuan") ||
    rawCat.includes("kurir") ||
    rawCat.includes("errand") ||
    rawCat.includes("titip") ||
    rawCat.includes("pindahan") ||
    rawTitle.includes("bantuan") ||
    rawTitle.includes("akta") ||
    rawTitle.includes("titip") ||
    rawTitle.includes("pindahan") ||
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

function ChatWorkspaceContent() {
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

  // Selected Room State (cek room param dulu, lalu cek apakah cocok dengan partnerId/serviceId)
  const [selectedRoomId, setSelectedRoomId] = useState(() => {
    if (roomParam) return roomParam;
    if (partnerIdParam || serviceIdParam) {
      const match = orderRooms?.find(
        (r) =>
          r.helper?.id === partnerIdParam ||
          r.requestId === serviceIdParam ||
          (r.id && partnerIdParam && r.id.includes(partnerIdParam))
      );
      if (match) return match.id;
    }
    return orderRooms?.[0]?.id || "order-room-101";
  });

  const selectedRoom = (orderRooms && orderRooms.length > 0)
    ? (orderRooms.find((r) => r.id === selectedRoomId) || orderRooms[0])
    : null;

  useEffect(() => {
    if (roomParam) {
      setSelectedRoomId(roomParam);
    } else if (partnerIdParam || serviceIdParam) {
      const existing = orderRooms.find(
        (r) =>
          r.helper?.id === partnerIdParam ||
          r.requestId === serviceIdParam ||
          (r.id && partnerIdParam && r.id.includes(partnerIdParam))
      );
      if (existing) {
        setSelectedRoomId(existing.id);
      } else if (startJasaInquiry) {
        const catalogItem = serviceIdParam ? getCatalogServiceById(serviceIdParam) : null;
        const providerItem =
          catalogItem?.provider ||
          (partnerIdParam ? PROVIDERS_DATA?.find((p) => p.id === partnerIdParam) : null);

        if (providerItem) {
          const newRoom = startJasaInquiry({
            serviceId: serviceIdParam || catalogItem?.id,
            serviceTitle: catalogItem?.title,
            serviceImage: catalogItem?.image || providerItem?.avatar,
            servicePrice: catalogItem?.price,
            providerId: providerItem?.id,
            providerName: providerItem?.name,
            providerAvatar: providerItem?.avatar,
            providerPhone: providerItem?.phone,
            providerRating: providerItem?.rating,
            providerAddress: providerItem?.address || providerItem?.location,
            category: catalogItem?.category || providerItem?.category,
          });
          if (newRoom?.id) {
            setSelectedRoomId(newRoom.id);
          }
        }
      }
    }
  }, [roomParam, partnerIdParam, serviceIdParam, orderRooms, startJasaInquiry]);

  // If selected room was deleted, fallback to another room
  useEffect(() => {
    if (orderRooms && !orderRooms.some((r) => r.id === selectedRoomId) && orderRooms.length > 0) {
      setSelectedRoomId(orderRooms[0].id);
    }
  }, [orderRooms, selectedRoomId]);

  // Responsive UI States
  const [mobileView, setMobileView] = useState("chat"); // 'list' | 'chat'
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // Toggle daftar obrolan (kiri)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false); // Toggle rincian (kanan) - default tertutup agar chat luas
  const [showRightDrawerMobile, setShowRightDrawerMobile] = useState(false);

  // UI State
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all"); // 'all' | 'jasa' | 'sewa' | 'rental'
  const [statusFilter, setStatusFilter] = useState("all"); // 'all' | 'inquiry' | 'active'
  
  // Deteksi role otomatis tanpa toggle manual (bisa override via ?role=helper atau ?role=requester)
  const roleParam = searchParams?.get("role");
  const activeRole = React.useMemo(() => {
    if (roleParam === "helper" || roleParam === "mitra") return "helper";
    if (roleParam === "requester" || roleParam === "client" || roleParam === "pemesan") return "requester";
    if (currentUser?.id && selectedRoom?.helper?.id === currentUser.id) return "helper";
    if (currentUser?.isPartner || currentUser?.role === "partner" || currentUser?.role === "helper") {
      if (selectedRoom?.requester?.id && selectedRoom?.requester?.id !== currentUser?.id) {
        return "helper";
      }
    }
    return "requester";
  }, [roleParam, currentUser, selectedRoom]);

  const [chatInput, setChatInput] = useState("");
  const [lightboxImage, setLightboxImage] = useState(null); // Preview full size image proof
  const [isVoiceCallOpen, setIsVoiceCallOpen] = useState(false); // Modal Telepon In-App
  const [isReportModalOpen, setIsReportModalOpen] = useState(false); // Modal Pelaporan & Pengaduan (Notice & Takedown)

  // Edit Message State
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editingText, setEditingText] = useState("");

  // Deliverables Modal
  const [isProofModalOpen, setIsProofModalOpen] = useState(false);
  const [digitalFiles, setDigitalFiles] = useState([]);
  const [submissionUrl, setSubmissionUrl] = useState(selectedRoom?.submissionUrl || "");
  const [proofNotes, setProofNotes] = useState("");

  // Rating & Review Modal
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [ratingValue, setRatingValue] = useState(5);
  const [reviewFeedback, setReviewFeedback] = useState("");
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);

  const chatFileInputRef = useRef(null);
  const digitalDocInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedRoom?.messages]);

  // Mode: Online vs Offline
  const isOnline = Boolean(
    selectedRoom?.mode === "online" ||
    selectedRoom?.category?.toLowerCase?.()?.includes("desain") ||
    selectedRoom?.category?.toLowerCase?.()?.includes("tugas")
  );
  const isInquiry = Boolean(
    selectedRoom?.stage === "inquiry" ||
    selectedRoom?.orderStatus === "inquiry" ||
    selectedRoom?.id?.startsWith("inquiry-")
  );
  const isNotSelected = selectedRoom?.orderStatus === "not_selected";

  // Workflow Stepper definition (for active orders)
  const steps = isOnline
    ? [
        { key: "room_created", label: "Room Terbuka" },
        { key: "in_progress", label: "Pengerjaan Digital" },
        { key: "completed", label: "Serah Berkas & Selesai" },
      ]
    : [
        { key: "room_created", label: "Room Terbuka" },
        { key: "on_the_way", label: "Menuju Lokasi" },
        { key: "item_picked_up", label: "Ambil Tugas" },
        { key: "completed", label: "Serah Terima & Selesai" },
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

  // Handle Chat Submit dengan proteksi anti-disintermediasi & anti-konten terlarang
  const handleSend = (e) => {
    e?.preventDefault();
    if (!chatInput.trim() || !selectedRoom) return;

    const text = chatInput.trim();

    // 1. Cek Pelanggaran Konten Terlarang (Narkotika / Joki Skripsi / dll)
    const contentCheck = detectProhibitedContent(text);
    if (contentCheck.flagged) {
      addToast?.(
        `Pelanggaran: ${contentCheck.category}`,
        contentCheck.reason,
        "error"
      );
      return;
    }

    // 2. Cek Disintermediasi & Kontak Pribadi
    const disCheck = detectDisintermediation(text);
    if (disCheck.flagged) {
      addToast?.(
        "Peringatan Keamanan Pembayaran",
        disCheck.reason,
        "warning"
      );
    }

    const senderData = activeRole === "helper"
      ? {
          senderId: selectedRoom?.helper?.id || "user-hlp-1",
          senderName: selectedRoom?.helper?.name || "Mitra",
          senderAvatar: selectedRoom?.helper?.avatar
        }
      : {
          senderId: selectedRoom?.requester?.id || currentUser?.id || "user-current-01",
          senderName: selectedRoom?.requester?.name || currentUser?.fullName || "Pemesan",
          senderAvatar: selectedRoom?.requester?.avatar || currentUser?.avatarUrl
        };

    sendChatMessage(selectedRoom.id, text, senderData);
    setChatInput("");
  };

  // Start Edit Message
  const handleStartEdit = (msg) => {
    setEditingMessageId(msg.id);
    setEditingText(msg.message);
  };

  // Save Edit Message
  const handleSaveEdit = (msgId) => {
    if (!editingText.trim() || !selectedRoom) return;
    editChatMessage(selectedRoom.id, msgId, editingText.trim());
    setEditingMessageId(null);
    setEditingText("");
  };

  // Cancel Edit Message
  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditingText("");
  };

  // Handle Delete Chat Room
  const handleDeleteRoom = (roomId, e) => {
    e?.stopPropagation();
    const isConfirm = window.confirm("Apakah Anda yakin ingin menghapus seluruh percakapan ini?");
    if (!isConfirm) return;
    deleteChatRoom(roomId);
    if (selectedRoomId === roomId) {
      const remaining = orderRooms.filter((r) => r.id !== roomId);
      if (remaining.length > 0) {
        setSelectedRoomId(remaining[0].id);
      }
    }
  };

  // Chat Attachment File (Photos & Documents)
  const handleChatFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file && selectedRoom) {
      const isImg = file.type.startsWith("image/");
      const fileSizeStr = file.size > 1024 * 1024 ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` : `${(file.size / 1024).toFixed(1)} KB`;

      const senderData = activeRole === "helper"
        ? {
            senderId: selectedRoom?.helper?.id || "user-hlp-1",
            senderName: selectedRoom?.helper?.name || "Mitra",
            senderAvatar: selectedRoom?.helper?.avatar
          }
        : {
            senderId: selectedRoom?.requester?.id || currentUser?.id || "user-current-01",
            senderName: selectedRoom?.requester?.name || currentUser?.fullName || "Pemesan",
            senderAvatar: selectedRoom?.requester?.avatar || currentUser?.avatarUrl
          };

      if (isImg) {
        const reader = new FileReader();
        reader.onload = (event) => {
          sendChatMessage(selectedRoom.id, `Foto terlampir: ${file.name}`, {
            ...senderData,
            photos: [event.target.result],
            attachment: { name: file.name, size: fileSizeStr, dataUrl: event.target.result, isImage: true }
          });
          addToast?.("Foto Terkirim", `Foto "${file.name}" berhasil dikirim ke obrolan.`);
        };
        reader.readAsDataURL(file);
      } else {
        sendChatMessage(selectedRoom.id, `[Lampiran Berkas]: ${file.name} (${fileSizeStr})`, {
          ...senderData,
          attachment: { name: file.name, size: fileSizeStr, isImage: false }
        });
        addToast?.("Berkas Terkirim", `File "${file.name}" berhasil dikirim.`);
      }
      e.target.value = "";
    }
  };

  // Real File Downloader
  const handleDownloadFile = (file) => {
    try {
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



  // Submit Proof / Completion
  const handleUploadProofSubmit = (e) => {
    e.preventDefault();
    if (!selectedRoom) return;
    submitProof(selectedRoom.id, {
      photoUrl: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=600&q=80",
      digitalFiles: digitalFiles.length > 0 ? digitalFiles : selectedRoom.digitalFiles,
      submissionUrl: submissionUrl || selectedRoom.submissionUrl,
      notes: proofNotes || "Pekerjaan telah selesai dikerjakan.",
    });
    updateOrderStatus(selectedRoom.id, "proof_submitted");
    setIsProofModalOpen(false);
    addToast?.("Bukti Pekerjaan Terkirim", "Klien telah menerima notifikasi untuk memeriksa hasil dan menyelesaikan transaksi.");
  };

  // Helper for Selected Room Category
  const selectedRoomMeta = selectedRoom ? getCategoryMeta(selectedRoom) : null;

  // Realtime Category Counts for Tabs (Semua, Jasa, Bantuan, Sewa)
  const categoryCounts = {
    all: orderRooms.length,
    jasa: orderRooms.filter((r) => getCategoryMeta(r).type === "jasa").length,
    bantuan: orderRooms.filter((r) => getCategoryMeta(r).type === "bantuan").length,
    sewa: orderRooms.filter((r) => getCategoryMeta(r).type === "sewa").length,
  };

  // Filtered Rooms with Category & Status Filters
  const filteredRooms = orderRooms.filter((room) => {
    const meta = getCategoryMeta(room);
    if (categoryFilter !== "all" && meta.type !== categoryFilter) {
      return false;
    }

    const query = searchQuery.toLowerCase().trim();
    const partnerName = (room.helper?.name || "").toLowerCase();
    const title = (room.requestTitle || "").toLowerCase();
    const catName = (room.category || "").toLowerCase();
    const matchQuery = !query || partnerName.includes(query) || title.includes(query) || catName.includes(query);

    if (!matchQuery) return false;

    const roomIsInquiry = room.stage === "inquiry" || room.orderStatus === "inquiry" || (room.id && room.id.startsWith("inquiry-")) || room.orderStatus === "not_selected";
    
    if (statusFilter === "inquiry") return roomIsInquiry;
    if (statusFilter === "active") return !roomIsInquiry;
    return true;
  });

  return (
    <div className="h-screen w-screen flex flex-col bg-[#F8FAFC] overflow-hidden select-none font-sans text-slate-800">
      
      {/* ========================================================================= */}
      {/* 1. TOP HEADER (RESPONSIVE FOR MOBILE, TABLET, DESKTOP) */}
      {/* ========================================================================= */}
      <header className="h-14 bg-white border-b border-slate-200 px-3 sm:px-5 flex items-center justify-between z-30 shrink-0">
        
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

        {/* Right: Rincian Toggle Button */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              if (typeof window !== "undefined" && window.innerWidth < 1024) {
                setShowRightDrawerMobile(!showRightDrawerMobile);
              } else {
                setIsDetailsOpen(!isDetailsOpen);
              }
            }}
            className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer text-xs font-bold ${
              isDetailsOpen
                ? "bg-blue-50 text-[#1683FF] border border-blue-200"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200/60"
            }`}
            title={isDetailsOpen ? "Tutup Panel Rincian" : "Buka Panel Rincian"}
          >
            <Info className="w-3.5 h-3.5 text-[#1683FF]" />
            <span>{isDetailsOpen ? "Tutup Rincian" : "Rincian"}</span>
          </button>
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
            {filteredRooms.length > 0 ? (
              filteredRooms.map((room) => {
                const meta = getCategoryMeta(room);
                const isSelected = room.id === selectedRoom?.id;
                const lastMsg = room.messages?.[room.messages.length - 1]?.message || "Belum ada pesan";
                const partner = room.helper || { name: "Helper", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80" };
                const isRoomInquiry = room.stage === "inquiry" || room.orderStatus === "inquiry" || (room.id && room.id.startsWith("inquiry-"));
                const isRoomClosed = room.orderStatus === "not_selected";

                return (
                  <div
                    key={room.id}
                    onClick={() => {
                      setSelectedRoomId(room.id);
                      setMobileView("chat");
                    }}
                    className={`group w-full p-3 flex items-start gap-2.5 text-left cursor-pointer transition relative ${
                      isSelected
                        ? "bg-slate-100/90 border-l-3 border-l-[#1683FF]"
                        : "hover:bg-slate-50"
                    }`}
                  >
                    <img
                      src={partner.avatar}
                      alt={partner.name}
                      className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0 mt-0.5"
                    />
                    <div className="flex-1 min-w-0 pr-4">
                      <div className="flex items-center justify-between mb-0.5">
                        <h4 className={`text-xs truncate ${isSelected ? "font-bold text-[#1683FF]" : "font-semibold text-slate-800"}`}>
                          {partner.name}
                        </h4>
                        <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded shrink-0 ${
                          isRoomClosed
                            ? "bg-slate-100 text-slate-500"
                            : isRoomInquiry
                            ? "bg-slate-100 text-slate-700"
                            : "bg-blue-50 text-[#1683FF] border border-blue-100"
                        }`}>
                          {isRoomClosed ? "Selesai" : isRoomInquiry ? "Diskusi" : "Aktif"}
                        </span>
                      </div>

                      {/* Clean Consistent Category Badge Bar */}
                      <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                        <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-md flex items-center gap-1 border shrink-0 ${meta.badgeClass}`}>
                          <meta.icon className="w-2.5 h-2.5 shrink-0" />
                          <span>{meta.label}</span>
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium truncate max-w-[110px]">
                          {room.category || meta.subLabel}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-400 truncate">
                        {lastMsg}
                      </p>
                    </div>

                    {/* Delete entire room button on item hover */}
                    <button
                      type="button"
                      onClick={(e) => handleDeleteRoom(room.id, e)}
                      className="opacity-0 group-hover:opacity-100 absolute right-2 top-3 p-1 rounded-md hover:bg-rose-50 text-slate-300 hover:text-rose-500 transition"
                      title="Hapus Obrolan"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
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
          
          {/* ============================================================= */}
          {/* 2. IDENTITAS TOKO / MITRA (~48-52px) */}
          {/* ============================================================= */}
          {selectedRoom && (
            <div className="h-12 border-b border-slate-100 px-3 sm:px-4 flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 inline-block" />
                <span className="font-bold text-slate-900 text-xs sm:text-sm truncate">
                  {activeRole === "requester" ? selectedRoom.helper?.name : selectedRoom.requester?.name}
                </span>
                <span className="text-[11px] text-slate-500 font-medium shrink-0">
                  ({activeRole === "requester"
                    ? (selectedRoom.orderType === "rental" ? "Mitra Sewa" : selectedRoom.orderType === "bantuan" ? "Helper Bantuan" : "Mitra Jasa")
                    : (selectedRoom.orderType === "rental" ? "Penyewa" : "Pemesan")})
                </span>
              </div>

              <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                {/* Telepon Action */}
                <button
                  type="button"
                  onClick={handleStartCall}
                  className="p-1.5 sm:px-2.5 sm:py-1 rounded-lg text-slate-600 hover:text-[#1683FF] hover:bg-blue-50 transition cursor-pointer text-xs font-semibold flex items-center gap-1"
                  title="Panggilan Suara In-App"
                >
                  <Phone className="w-3.5 h-3.5 text-[#1683FF]" />
                  <span className="hidden sm:inline">Telepon</span>
                </button>

                {/* Laporkan Action */}
                <button
                  type="button"
                  onClick={() => setIsReportModalOpen(true)}
                  className="p-1.5 sm:px-2.5 sm:py-1 text-slate-500 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition cursor-pointer text-xs font-semibold flex items-center gap-1"
                  title="Laporkan Kendala"
                >
                  <Flag className="w-3.5 h-3.5 text-rose-500" />
                  <span className="hidden sm:inline">Laporkan</span>
                </button>

                {/* Hapus Obrolan Action */}
                <button
                  type="button"
                  onClick={(e) => handleDeleteRoom(selectedRoom.id, e)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                  title="Hapus Obrolan"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* ============================================================= */}
          {/* 3. STATUS TRANSAKSI + AKSI */}
          {/* ============================================================= */}
          {selectedRoom && (
            <ChatFlowTracker room={selectedRoom} activeRole={activeRole} />
          )}

          {/* ============================================================= */}
          {/* 4. INFORMASI TRANSAKSI / PEMBAYARAN (COMPACT, 1 ROW) */}
          {/* ============================================================= */}
          <div className="px-3 sm:px-4 py-1.5 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between text-[11px] text-slate-500 shrink-0">
            <div className="flex items-center gap-1.5 min-w-0">
              <ShieldCheck className="w-3.5 h-3.5 text-[#1683FF] shrink-0" />
              <span className="truncate">Pembayaran aman</span>
              <span className="text-slate-300">•</span>
              <Link
                href="/syarat-ketentuan"
                target="_blank"
                className="text-slate-500 hover:text-[#1683FF] hover:underline flex items-center gap-0.5 shrink-0 font-medium"
              >
                <span>Pelajari S&amp;K</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </Link>
            </div>
            {selectedRoom?.lockedAmount && (
              <span className="text-[10px] text-slate-400 font-medium hidden xs:inline">
                Terverifikasi Resmi Bantuin.id
              </span>
            )}
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-3 bg-[#F8FAFC]">
            {selectedRoom?.messages?.map((msg, index) => {
              const isMe = activeRole === "helper"
                ? (msg.senderId === selectedRoom?.helper?.id || msg.senderName === selectedRoom?.helper?.name)
                : (msg.senderId === selectedRoom?.requester?.id || msg.senderName === selectedRoom?.requester?.name || msg.senderId === currentUser?.id || msg.senderName === currentUser?.fullName || msg.senderName === "Saya");
              const isBot = msg.senderName === "Bantuin System" || msg.senderName === "Bantuin Escrow Bot" || msg.senderName === "Bantuin Bot" || msg.senderId === "bot-system" || msg.isSystem;
              const isEditingThisMsg = editingMessageId === msg.id;

              if (isBot) {
                if (msg.isHandoverProof && msg.proofData) {
                  const proof = msg.proofData;
                  return (
                    <div key={msg.id || index} className="w-full max-w-xl mx-auto my-3 bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden text-xs">
                      {/* Card Header */}
                      <div className="bg-slate-900 text-white p-3 sm:p-3.5 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                            <ShieldCheck className="w-4 h-4 text-[#1683FF]" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-extrabold text-xs sm:text-sm tracking-tight truncate">
                              Bukti Baseline Serah Terima Fisik
                            </h4>
                            <p className="text-[10px] text-slate-300 truncate">
                              Dokumentasi tersimpan resmi di sistem transaksi Bantuin
                            </p>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-white/10 text-white font-extrabold text-[10px] shrink-0 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#1683FF]" />
                          Masa Sewa Aktif
                        </span>
                      </div>

                      {/* Card Body */}
                      <div className="p-3.5 sm:p-4 space-y-3 bg-white">
                        {/* Summary Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 text-[11px]">
                          <div>
                            <span className="text-slate-400 block text-[10px] uppercase font-bold">Unit Alat</span>
                            <span className="font-bold text-slate-800">{proof.unitName}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px] uppercase font-bold">Waktu Serah Terima</span>
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
                            <span className="font-bold text-slate-900">{formatIDR(proof.depositHeld)} (100% Refundable)</span>
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
                              Foto Bukti Fisik Alat ({proof.photos?.length || 0} Foto):
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
                        <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-2 text-[10px] text-slate-500 leading-relaxed">
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
                    <div key={msg.id || index} className="w-full max-w-xl mx-auto my-3 bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden text-xs">
                      <div className="bg-slate-900 text-white p-3 sm:p-3.5 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                            <CheckCircle2 className="w-4 h-4 text-[#1683FF]" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-extrabold text-xs sm:text-sm tracking-tight truncate">
                              Bukti Pengembalian &amp; Pencairan Deposit
                            </h4>
                            <p className="text-[10px] text-slate-300 truncate">
                              Unit sewa dikembalikan &amp; deposit dicairkan
                            </p>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-blue-50 text-[#1683FF] border border-blue-100 font-extrabold text-[10px] shrink-0">
                          Selesai
                        </span>
                      </div>

                      <div className="p-3.5 sm:p-4 space-y-3 bg-white">
                        <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-100 text-center">
                          <span className="text-[10px] text-slate-700 font-bold uppercase block">
                            Uang Jaminan Deposit Dikembalikan Utuh ke Saldo
                          </span>
                          <span className="text-xl font-black text-[#1683FF] block my-0.5">
                            {formatIDR(proof.refundAmount)}
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

                if (msg.isJasaDeliverablesProof && msg.proofData) {
                  const proof = msg.proofData;
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
                            <span className="font-bold text-slate-800">{proof.serviceTitle}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px] uppercase font-bold">Waktu Penyerahan</span>
                            <span className="font-semibold text-slate-700">{proof.submittedAt}</span>
                          </div>
                        </div>

                        {proof.submissionUrl && (
                          <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-100 flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <span className="text-[10px] font-bold text-blue-800 uppercase block">Tautan Unduhan Cloud / Preview:</span>
                              <a
                                href={proof.submissionUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs font-bold text-[#1683FF] hover:underline truncate block"
                              >
                                {proof.submissionUrl}
                              </a>
                            </div>
                            <a
                              href={proof.submissionUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="px-3 py-1.5 rounded-lg bg-[#1683FF] text-white text-[11px] font-bold hover:bg-[#0F6FE5] shrink-0 flex items-center gap-1 cursor-pointer"
                            >
                              <ExternalLink className="w-3 h-3" />
                              <span>Buka</span>
                            </a>
                          </div>
                        )}

                        {proof.files && proof.files.length > 0 && (
                          <div className="space-y-1.5">
                            <span className="font-bold text-slate-800 text-[11px] block">
                              Berkas Lampiran Langsung ({proof.files.length} File):
                            </span>
                            <div className="space-y-1">
                              {proof.files.map((file, fIdx) => (
                                <div key={fIdx} className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <FileText className="w-3.5 h-3.5 text-[#1683FF] shrink-0" />
                                    <span className="font-semibold text-slate-800 truncate">{file.name}</span>
                                    <span className="text-[10px] text-slate-400">({file.size})</span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleDownloadFile(file)}
                                    className="p-1 text-slate-600 hover:text-[#1683FF] hover:bg-slate-200 rounded"
                                    title="Unduh berkas"
                                  >
                                    <Download className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {proof.notes && (
                          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px]">
                            <span className="font-bold text-slate-900 block mb-0.5">Catatan dari Mitra:</span>
                            <p className="italic text-slate-700">&ldquo;{proof.notes}&rdquo;</p>
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
                  <div key={msg.id || index} className="flex justify-center my-2 sm:my-2.5 px-3">
                    <div className="max-w-lg w-full py-2 px-3 sm:px-3.5 rounded-xl bg-slate-100/90 border border-slate-200/80 text-[13px] text-slate-700 shadow-2xs">
                      <div className="flex items-start gap-2.5">
                        <ShieldCheck className="w-4 h-4 text-[#1683FF] shrink-0 mt-0.5" />
                        <p className="leading-relaxed font-normal flex-1">
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
                  {!isMe && (
                    <img
                      src={selectedRoom?.helper?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80"}
                      alt={msg.senderName}
                      className="w-7 h-7 rounded-full object-cover border border-slate-200 shrink-0 mb-0.5"
                    />
                  )}

                  <div className={`flex flex-col ${isMe ? "items-end" : "items-start"} max-w-[85%] sm:max-w-[80%]`}>
                    
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
                      <div className="flex items-center gap-1">
                        {/* Action buttons (Left of bubble for my messages) */}
                        {isMe && (
                          <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition">
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
                              onClick={() => deleteChatMessage(selectedRoom.id, msg.id)}
                              className="p-1 text-slate-300 hover:text-rose-500 hover:bg-slate-100 rounded-md transition"
                              title="Hapus pesan"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}

                        <div
                          className={`px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-2xl text-xs sm:text-[13px] leading-relaxed ${
                            isMe
                              ? "bg-[#1683FF] text-white rounded-br-xs"
                              : "bg-white border border-slate-200 text-slate-800 rounded-bl-xs shadow-2xs"
                          }`}
                        >
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
                            <p className="whitespace-pre-line">{msg.message}</p>
                          )}

                          {/* Photos attached to regular message */}
                          {msg.photos && msg.photos.length > 0 && (
                            <div className="grid grid-cols-2 gap-1.5 mt-2">
                              {msg.photos.map((photo, pIdx) => (
                                <div
                                  key={pIdx}
                                  onClick={() => setLightboxImage(photo)}
                                  className="relative group rounded-lg overflow-hidden aspect-video border border-white/20 bg-slate-900/20 cursor-pointer"
                                >
                                  <img
                                    src={photo}
                                    alt={`Lampiran ${pIdx + 1}`}
                                    className="w-full h-full object-cover group-hover:scale-105 transition"
                                  />
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-[10px] font-bold gap-1">
                                    <Search className="w-3 h-3" />
                                    <span>Perbesar</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Action buttons (Right of bubble for partner messages in preview) */}
                        {!isMe && (
                          <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition">
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
                              onClick={() => deleteChatMessage(selectedRoom.id, msg.id)}
                              className="p-1 text-slate-300 hover:text-rose-500 hover:bg-slate-100 rounded-md transition"
                              title="Hapus pesan"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    <span className="text-[9px] text-slate-400 mt-0.5 px-1 flex items-center gap-1">
                      <span>{msg.timestamp?.slice(11, 16) || "10:35"}</span>
                      {msg.isEdited && <span className="italic text-slate-400">(diedit)</span>}
                      {isMe && <Check className="w-3 h-3 text-[#1683FF]" />}
                    </span>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Reply Bar (~40px compact horizontal scroll) */}
          <div className="h-10 px-3 bg-white border-t border-slate-100 flex items-center gap-2 overflow-x-auto scrollbar-none shrink-0">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">Cepat:</span>
            <div className="flex items-center gap-1.5 flex-nowrap shrink-0">
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
                            "STNK dan kunci unit sudah serah terima",
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
                            "Serah terima berjalan lancar",
                            "Siap, terima kasih!"
                          ]
                      )
                  )
                : selectedRoomMeta?.type === "bantuan"
                ? (isInquiry
                    ? [
                        "Halo, apakah tugas bantuan ini masih open?",
                        "Bisa dibantu mulai jam berapa hari ini?",
                        "Titik penjemputan & antar sudah sesuai lokasi?",
                        "Ada instruksi atau barang khusus yang perlu dibawa?",
                        "Siap bantu, saya ajukan penawaran tugas!"
                      ]
                    : [
                        activeRole === "helper" ? "Saya sedang otw menuju ke lokasi tugas ya kak" : "Halo helper, bagaimana posisi dan estimasi tiba?",
                        activeRole === "helper" ? "Sudah tiba di lokasi dan sedang mengerjakan tugas" : "Tolong kabari jika tugas sudah beres ya",
                        "Foto serah terima / bukti tugas sudah diunggah",
                        "Tugas telah selesai dengan baik, terima kasih!"
                      ]
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
                  onClick={() => setChatInput(template)}
                  className="h-7 px-2.5 rounded-lg bg-slate-50 hover:bg-blue-50 border border-slate-200/80 hover:border-blue-300 text-[11px] font-medium text-slate-600 hover:text-[#1683FF] whitespace-nowrap transition cursor-pointer shrink-0"
                >
                  {template}
                </button>
              ))}
            </div>
          </div>

          {/* Privacy Notice Bar (~36-40px) */}
          <div className="h-9 px-3 sm:px-4 bg-slate-50/70 border-t border-slate-100 flex items-center gap-1.5 text-slate-500 shrink-0">
            <ShieldCheck className="w-3.5 h-3.5 text-[#1683FF] shrink-0" />
            <span className="truncate text-[11px] sm:text-xs font-normal">
              Privasi Terjaga: Dilarang bertukar kontak pribadi di luar sistem Bantuin.
            </span>
          </div>

          {/* Chat Input Bar (~56px) */}
          <form
            onSubmit={handleSend}
            className="h-14 px-3 sm:px-4 border-t border-slate-200 bg-white flex items-center gap-2 shrink-0"
          >
            <input
              type="file"
              ref={chatFileInputRef}
              onChange={handleChatFileUpload}
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
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Tulis pesan..."
              className="flex-1 h-9 text-xs sm:text-sm px-3 rounded-xl border border-slate-200 bg-slate-50/60 focus:bg-white focus:outline-none focus:border-[#1683FF] transition"
            />

            <button
              type="submit"
              disabled={!chatInput.trim()}
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition shrink-0 ${
                chatInput.trim()
                  ? "bg-[#1683FF] text-white hover:bg-[#0F6FE5] shadow-2xs active:scale-95 cursor-pointer"
                  : "bg-slate-100 text-slate-400 cursor-not-allowed"
              }`}
              title="Kirim pesan"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* COLUMN 3: RIGHT PANEL - RINCIAN RENCANA ATAU PESANAN */}
        {/* (RESPONSIVE: SLIDE-OVER ON TABLET/MOBILE, FIXED ON DESKTOP) */}
        {/* ------------------------------------------------------------- */}
        <aside className={`
          ${showRightDrawerMobile ? "fixed inset-y-14 right-0 z-40 w-80 shadow-2xl flex" : "hidden"}
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
          <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200/80 rounded-2xl gap-2">
            <div className="flex items-center gap-3 min-w-0">
              <img
                src={
                  activeRole === "requester"
                    ? (selectedRoom?.helper?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80")
                    : (selectedRoom?.requester?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80")
                }
                alt="Partner"
                className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
              />
              <div className="min-w-0">
                <h3 className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                  {activeRole === "requester" ? selectedRoom?.helper?.name : selectedRoom?.requester?.name}
                </h3>
                <p className="text-[11px] text-slate-400 truncate">
                  {isInquiry ? "Kandidat Diskusi" : isNotSelected ? "Kandidat Tidak Terpilih" : "Mitra Terverifikasi"}
                </p>
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
                <div className="p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-2xl space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Biaya Sewa ({selectedRoom.rentalDetails?.durationDays || 2} hari):</span>
                    <span className="font-bold text-slate-900">{formatIDR(selectedRoom.rentalFeeAmount || 180000)}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Deposit Jaminan (Refundable):</span>
                    <span className="font-bold text-slate-900">{formatIDR(selectedRoom.depositAmount || 100000)}</span>
                  </div>
                  <div className="pt-2 border-t border-blue-200 flex items-center justify-between font-extrabold text-slate-900">
                    <span>Total Pembayaran Diamankan:</span>
                    <span className="text-[#1683FF] text-sm">{formatIDR(selectedRoom.lockedAmount || 280000)}</span>
                  </div>
                </div>

                {/* Pool & Pickup Info */}
                <div className="p-3 bg-white border border-slate-200 rounded-2xl space-y-2 text-xs">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#1683FF]" />
                    <span>{selectedRoom.rentalDetails?.plateNumber ? "Titik Pool / Pengambilan Armada" : "Lokasi Toko Pengambilan Alat"}</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    {selectedRoom.rentalDetails?.pickupLocation || selectedRoom.helper?.address || "Safe Point Mitra Bantuin"}
                  </p>
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
                    Deposit <strong>{formatIDR(selectedRoom.depositAmount || 100000)}</strong> akan langsung dikembalikan 100% otomatis saat unit kembali dengan aman.
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
                    Dana aman di sistem Bantuin sampai tugas selesai dan Anda mengonfirmasi serah terima.
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
                        "https://images.unsplash.com/photo-1542744094-3a31f272c490?auto=format&fit=crop&w=600&q=80"
                      }
                      alt={selectedRoom?.serviceDetails?.serviceTitle || selectedRoom?.requestTitle || "Layanan Jasa"}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-black/60 text-white font-bold text-[10px] backdrop-blur-xs">
                      {isOnline ? "Online Workroom" : "Di Lokasi"}
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

                  {selectedRoom?.submissionUrl ? (
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Tautan Cloud / Drive:</span>
                      <a
                        href={selectedRoom.submissionUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-bold text-[#1683FF] hover:underline flex items-center gap-1 truncate"
                      >
                        <ExternalLink className="w-3 h-3 shrink-0" />
                        <span className="truncate">{selectedRoom.submissionUrl}</span>
                      </a>
                    </div>
                  ) : null}

                  {selectedRoom?.digitalFiles && selectedRoom.digitalFiles.length > 0 ? (
                    <div className="space-y-1">
                      {selectedRoom.digitalFiles.map((file, fIdx) => (
                        <div
                          key={fIdx}
                          className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-[11px]"
                        >
                          <span className="font-medium text-slate-800 truncate">{file.name}</span>
                          <button
                            type="button"
                            onClick={() => handleDownloadFile(file)}
                            className="p-1 text-slate-500 hover:text-[#1683FF] hover:bg-slate-200 rounded shrink-0"
                            title="Unduh file"
                          >
                            <Download className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  {!selectedRoom?.submissionUrl && (!selectedRoom?.digitalFiles || selectedRoom.digitalFiles.length === 0) ? (
                    <p className="text-[11px] text-slate-400 italic">
                      {isInquiry
                        ? "Diskusikan rincian brief sebelum pengerjaan dimulai."
                        : selectedRoom?.orderStatus === "completed"
                        ? "Seluruh berkas telah diserahterimakan."
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

      </div>



      {/* MODAL PENYERAHAN TUGAS */}
      {isProofModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-2xs flex items-center justify-center p-4 animate-in fade-in duration-100">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-3">
              <h3 className="font-bold text-sm text-slate-900">
                {isOnline ? "Serahkan Berkas Digital" : "Unggah Foto Bukti Selesai"}
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
                    Pilih Foto Serah Terima di Lokasi:
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
                  className="px-4 py-1.5 bg-[#1683FF] hover:bg-[#0F6FE5] text-white font-bold rounded-lg shadow-xs"
                >
                  Kirim & Selesaikan
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
              <img
                src={selectedRoom?.helper?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80"}
                alt={selectedRoom?.helper?.name}
                className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-xs shrink-0"
              />
              <div className="min-w-0 flex-1">
                <div className="font-bold text-sm text-slate-900 truncate">{selectedRoom?.helper?.name}</div>
                <div className="text-xs text-slate-500 truncate">{selectedRoom?.requestTitle}</div>
                <div className="text-[11px] font-bold text-[#1683FF] mt-0.5">
                  Imbalan Cair: {formatIDR(selectedRoom?.helperPayoutAmount || selectedRoom?.lockedAmount)}
                </div>
              </div>
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
                  setIsSubmittingRating(true);
                  setTimeout(() => {
                    confirmOrderCompletion(selectedRoom.id, {
                      rating: ratingValue,
                      feedback: reviewFeedback || "Tugas diselesaikan dengan sangat baik & tepat waktu.",
                    });
                    setIsSubmittingRating(false);
                    setIsRatingModalOpen(false);
                  }, 700);
                }}
                className="flex-2 py-2.5 bg-[#1683FF] hover:bg-[#0F6FE5] text-white font-bold text-xs rounded-xl shadow-md transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
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

      {/* FULL-SCREEN PHOTO LIGHTBOX MODAL */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setLightboxImage(null)}
        >
          <div
            className="relative max-w-4xl w-full max-h-[90vh] bg-slate-900 rounded-3xl overflow-hidden border border-white/20 shadow-2xl p-3 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10 px-2 text-white">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-bold tracking-tight">
                  Bukti Baseline Serah Terima Fisik
                </span>
              </div>
              <button
                type="button"
                onClick={() => setLightboxImage(null)}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
                title="Tutup Preview"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-hidden flex items-center justify-center p-1">
              <img
                src={lightboxImage}
                alt="Bukti Serah Terima Resolusi Penuh"
                className="max-w-full max-h-[75vh] object-contain rounded-xl border border-white/10"
              />
            </div>

            <div className="pt-2 px-2 text-center text-[11px] text-white/70 flex items-center justify-between">
              <span className="flex items-center gap-1.5"><Lock className="w-3 h-3 text-white/70" /> Tersimpan permanen di server aman Bantuin</span>
              <a
                href={lightboxImage}
                target="_blank"
                rel="noreferrer"
                className="text-blue-400 hover:underline font-semibold flex items-center gap-1"
              >
                Buka Tab Baru
              </a>
            </div>
          </div>
        </div>
      )}

      {/* IN-APP ENCRYPTED VOICE CALL MODAL */}
      <InAppVoiceCallModal
        isOpen={isVoiceCallOpen}
        onClose={() => setIsVoiceCallOpen(false)}
        partner={activeRole === "requester" ? selectedRoom?.helper : selectedRoom?.requester}
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

