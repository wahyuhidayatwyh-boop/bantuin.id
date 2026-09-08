"use client";

import React, { useState, useRef, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useApp } from "@/lib/context/AppContext";
import { formatIDR } from "@/lib/utils";
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
  ChevronLeft
} from "lucide-react";

function ChatWorkspaceContent() {
  const searchParams = useSearchParams();
  const roomParam = searchParams?.get("room");

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
  } = useApp() || {};

  // Selected Room State
  const [selectedRoomId, setSelectedRoomId] = useState(roomParam || orderRooms?.[0]?.id || "order-room-101");
  const selectedRoom = (orderRooms && orderRooms.length > 0)
    ? (orderRooms.find((r) => r.id === selectedRoomId) || orderRooms[0])
    : null;

  useEffect(() => {
    if (roomParam) {
      setSelectedRoomId(roomParam);
    }
  }, [roomParam]);

  // If selected room was deleted, fallback to another room
  useEffect(() => {
    if (orderRooms && !orderRooms.some((r) => r.id === selectedRoomId) && orderRooms.length > 0) {
      setSelectedRoomId(orderRooms[0].id);
    }
  }, [orderRooms, selectedRoomId]);

  // Responsive UI States
  const [mobileView, setMobileView] = useState("chat"); // 'list' | 'chat'
  const [showRightDrawerMobile, setShowRightDrawerMobile] = useState(false);

  // UI State
  const [searchQuery, setSearchQuery] = useState("");
  const [roomFilter, setRoomFilter] = useState("all"); // 'all' | 'inquiry' | 'active'
  const [activeRole, setActiveRole] = useState("requester"); // 'requester' | 'helper'
  const [chatInput, setChatInput] = useState("");

  // Edit Message State
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editingText, setEditingText] = useState("");

  // Payment Checkout Modal for Inquiries
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("qris");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isPaymentSuccess, setIsPaymentSuccess] = useState(false);

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

  // Handle Chat Submit
  const handleSend = (e) => {
    e?.preventDefault();
    if (!chatInput.trim() || !selectedRoom) return;
    sendChatMessage(selectedRoom.id, chatInput.trim());
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

  // Chat Attachment File
  const handleChatFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file && selectedRoom) {
      const fileSizeStr = file.size > 1024 * 1024 ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` : `${(file.size / 1024).toFixed(1)} KB`;
      sendChatMessage(selectedRoom.id, `[Lampiran Berkas]: ${file.name} (${fileSizeStr})`);
      addToast?.("Berkas Terkirim", `File "${file.name}" berhasil dikirim.`);
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

  // Process Escrow Payment for Pre-Transaction Inquiries
  const handleProcessPayment = () => {
    setIsProcessingPayment(true);
    setTimeout(() => {
      setIsProcessingPayment(false);
      setIsPaymentSuccess(true);
      setTimeout(() => {
        setIsPaymentSuccess(false);
        setIsPaymentModalOpen(false);
        
        // 1. Promote this room to active order
        updateOrderStatus(selectedRoom.id, "room_created");
        selectedRoom.stage = "active";
        
        // 2. Mark other candidate inquiry rooms for the same request as closed/not selected without deleting them
        orderRooms.forEach((r) => {
          if (r.id !== selectedRoom.id && r.requestId === selectedRoom.requestId && (r.stage === "inquiry" || r.orderStatus === "inquiry")) {
            r.orderStatus = "not_selected";
            r.isClosed = true;
          }
        });
        
        addToast?.("Transaksi Resmi Dibuka", "Dana telah dikunci di Rekening Escrow Xendit.");
      }, 1000);
    }, 1200);
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
    confirmOrderCompletion(selectedRoom.id);
    setIsProofModalOpen(false);
    addToast?.("Pesanan Selesai", "Pekerjaan telah diserahkan dan saldo imbalan telah dicairkan.");
  };

  // Filtered Rooms
  const filteredRooms = orderRooms.filter((room) => {
    const query = searchQuery.toLowerCase();
    const partnerName = (room.helper?.name || "").toLowerCase();
    const title = (room.requestTitle || "").toLowerCase();
    const matchQuery = !query || partnerName.includes(query) || title.includes(query);
    const roomIsInquiry = room.stage === "inquiry" || room.orderStatus === "inquiry" || room.id.startsWith("inquiry-") || room.orderStatus === "not_selected";
    
    if (roomFilter === "inquiry") return matchQuery && roomIsInquiry;
    if (roomFilter === "active") return matchQuery && !roomIsInquiry;
    return matchQuery;
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

          <div className="min-w-0 flex items-center gap-1.5 sm:gap-2">
            {isInquiry ? (
              <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-md shrink-0 flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-600 shrink-0" />
                <span className="hidden xs:inline">Rencana</span>
              </span>
            ) : isNotSelected ? (
              <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-600 border border-slate-200 rounded-md shrink-0 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 text-slate-400 shrink-0" />
                <span className="hidden xs:inline">Selesai</span>
              </span>
            ) : (
              <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-50 text-[#1683FF] border border-blue-200 rounded-md shrink-0 flex items-center gap-1">
                <Lock className="w-3 h-3 text-[#1683FF]" />
                <span className="hidden xs:inline">Pesanan Aktif</span>
              </span>
            )}

            <span className="text-slate-300 hidden xs:inline">•</span>
            <h1 className="text-xs sm:text-sm font-bold text-slate-900 truncate max-w-[140px] xs:max-w-[200px] sm:max-w-[320px] md:max-w-md">
              {selectedRoom?.requestTitle || "Ruang Obrolan"}
            </h1>
          </div>
        </div>

        {/* Right: Escrow Status, Role Switcher & Mobile Info Toggle */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 bg-slate-100 rounded-lg text-xs font-semibold text-slate-700">
            {isInquiry ? (
              <>
                <Clock className="w-3 h-3 text-amber-600" />
                <span>Dana Belum Dikunci (Tawaran: <strong>{formatIDR(selectedRoom?.lockedAmount)}</strong>)</span>
              </>
            ) : (
              <>
                <Lock className="w-3 h-3 text-[#1683FF]" />
                <span>Escrow Terkunci: <strong>{formatIDR(selectedRoom?.lockedAmount)}</strong></span>
              </>
            )}
          </div>

          <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg text-xs font-medium">
            <button
              type="button"
              onClick={() => setActiveRole("requester")}
              className={`px-2 sm:px-2.5 py-1 rounded-md text-[11px] sm:text-xs transition ${
                activeRole === "requester"
                  ? "bg-white text-slate-900 font-bold shadow-2xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Pemesan
            </button>
            <button
              type="button"
              onClick={() => setActiveRole("helper")}
              className={`px-2 sm:px-2.5 py-1 rounded-md text-[11px] sm:text-xs transition ${
                activeRole === "helper"
                  ? "bg-white text-[#1683FF] font-bold shadow-2xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Helper
            </button>
          </div>

          {/* Toggle details drawer on Mobile / Tablet */}
          <button
            type="button"
            onClick={() => setShowRightDrawerMobile(!showRightDrawerMobile)}
            className="lg:hidden p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
            title="Rincian Tugas"
          >
            <Info className="w-4 h-4 text-[#1683FF]" />
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
          md:flex w-full md:w-68 lg:w-76 bg-white border-r border-slate-200 flex-col shrink-0 z-20
        `}>
          
          {/* Filter Stage Pills */}
          <div className="p-2.5 border-b border-slate-100 space-y-2">
            <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg text-xs">
              <button
                type="button"
                onClick={() => setRoomFilter("all")}
                className={`flex-1 py-1 rounded-md text-[11px] font-bold transition ${
                  roomFilter === "all" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Semua
              </button>
              <button
                type="button"
                onClick={() => setRoomFilter("inquiry")}
                className={`flex-1 py-1 rounded-md text-[11px] font-bold transition ${
                  roomFilter === "inquiry" ? "bg-white text-amber-800 shadow-2xs" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Rencana
              </button>
              <button
                type="button"
                onClick={() => setRoomFilter("active")}
                className={`flex-1 py-1 rounded-md text-[11px] font-bold transition ${
                  roomFilter === "active" ? "bg-white text-[#1683FF] shadow-2xs" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Pesanan
              </button>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari obrolan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-7 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:border-[#1683FF] transition"
              />
            </div>
          </div>

          {/* Rooms List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {filteredRooms.length > 0 ? (
              filteredRooms.map((room) => {
                const isSelected = room.id === selectedRoom?.id;
                const lastMsg = room.messages?.[room.messages.length - 1]?.message || "Belum ada pesan";
                const partner = room.helper || { name: "Helper", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80" };
                const isRoomInquiry = room.stage === "inquiry" || room.orderStatus === "inquiry" || room.id.startsWith("inquiry-");
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
                        <span className={`text-[9px] font-semibold px-1.5 py-0.2 rounded shrink-0 ${
                          isRoomClosed ? "bg-slate-100 text-slate-500" : isRoomInquiry ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-[#1683FF]"
                        }`}>
                          {isRoomClosed ? "Selesai" : isRoomInquiry ? "Rencana" : "Pesanan"}
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
          
          {/* Chat Partner Sub-header */}
          <div className="h-12 border-b border-slate-100 px-3 sm:px-4 flex items-center justify-between bg-white shrink-0 text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 inline-block" />
              <span className="font-bold text-slate-800 truncate">
                {activeRole === "requester" ? selectedRoom?.helper?.name : selectedRoom?.requester?.name}
              </span>
              <span className="text-slate-400 hidden xs:inline">•</span>
              <span className="text-slate-500 font-medium hidden sm:inline truncate">
                {isInquiry ? "Tahap Diskusi Pra-Transaksi" : isNotSelected ? "Kandidat Tidak Terpilih" : "Helper Terverifikasi"}
              </span>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {isInquiry && activeRole === "requester" && !isNotSelected && (
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(true)}
                  className="px-2.5 sm:px-3 py-1 bg-[#1683FF] hover:bg-[#0F6FE5] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs transition active:scale-95"
                >
                  <Lock className="w-3 h-3" />
                  <span>Pilih & Bayar</span>
                </button>
              )}

              {/* Header Delete Room Action */}
              {selectedRoom && (
                <button
                  type="button"
                  onClick={(e) => handleDeleteRoom(selectedRoom.id, e)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                  title="Hapus Seluruh Obrolan"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-3 bg-[#F8FAFC]">
            
            {/* System Info Banner */}
            <div className="flex justify-center my-1">
              <div className="p-2.5 px-3 bg-white border border-slate-200/90 rounded-lg text-[11px] text-slate-600 text-center max-w-md shadow-2xs">
                {isNotSelected ? (
                  <span>Pemesan telah memilih kandidat lain untuk tugas ini. Riwayat diskusi tetap tersimpan.</span>
                ) : isInquiry ? (
                  <span>Ruang diskusi pra-transaksi. Diskusikan teknis dan jadwal pengerjaan sebelum mengunci dana di Escrow.</span>
                ) : (
                  <span>Dana sebesar <strong>{formatIDR(selectedRoom?.lockedAmount)}</strong> telah terkunci aman di Rekening Escrow Xendit.</span>
                )}
              </div>
            </div>

            {selectedRoom?.messages?.map((msg, index) => {
              const isMe = msg.senderId === currentUser?.id || msg.senderName === currentUser?.fullName || msg.senderName === "Saya" || (activeRole === "requester" && index % 2 === 1);
              const isBot = msg.senderName === "Bantuin Escrow Bot" || msg.senderId === "bot-system";
              const isEditingThisMsg = editingMessageId === msg.id;

              if (isBot) {
                return (
                  <div key={msg.id || index} className="flex justify-center my-2">
                    <div className="max-w-md p-3 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-700 text-center">
                      <p className="leading-relaxed font-medium">{msg.message}</p>
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

                  <div className={`flex flex-col ${isMe ? "items-end" : "items-start"} max-w-[85%] sm:max-w-[75%]`}>
                    
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
                          className={`p-3 rounded-2xl text-xs sm:text-[13px] leading-relaxed ${
                            isMe
                              ? "bg-[#1683FF] text-white rounded-br-xs"
                              : "bg-white border border-slate-200 text-slate-800 rounded-bl-xs shadow-2xs"
                          }`}
                        >
                          <p className="whitespace-pre-line">{msg.message}</p>
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

          {/* Quick Clean Action Chips (No Emojis) */}
          <div className="px-3 py-2 bg-white border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto scrollbar-none shrink-0">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">Cepat:</span>
            {(isInquiry
              ? [
                  "Kapan estimasi pengerjaan bisa dimulai?",
                  "Apakah siap sesuai spesifikasi tugas?",
                  "Saya setuju dengan penawaran Anda.",
                  "Siap, terima kasih!"
                ]
              : isOnline
              ? [
                  activeRole === "helper" ? "Berkas digital sedang saya proses" : "Bagaimana progres pengerjaan berkas?",
                  activeRole === "helper" ? "Tautan preview sudah saya kirim" : "Tolong kirimkan preview file ya",
                  "Silakan diperiksa terlebih dahulu",
                  "Siap, terima kasih!"
                ]
              : [
                  activeRole === "helper" ? "Sudah sampai di lokasi ya" : "Bagaimana progres tugas di lokasi?",
                  activeRole === "helper" ? "Foto serah terima sudah diunggah" : "Mohon kirimkan foto serah terima",
                  "Tolong konfirmasi penyelesaian ya",
                  "Siap, terima kasih!"
                ]
            ).map((template, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setChatInput(template)}
                className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 hover:border-[#1683FF] hover:text-[#1683FF] text-[11px] font-medium text-slate-600 whitespace-nowrap transition"
              >
                {template}
              </button>
            ))}
          </div>

          {/* Chat Input Bar */}
          <form
            onSubmit={handleSend}
            className="p-2.5 sm:p-3 border-t border-slate-200 bg-white flex items-center gap-1.5 sm:gap-2 shrink-0"
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
              className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              title="Lampirkan Dokumen / Foto"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Tulis pesan..."
              className="flex-1 text-xs sm:text-sm px-3 py-2 rounded-lg border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-[#1683FF] transition"
            />

            <button
              type="submit"
              disabled={!chatInput.trim()}
              className={`p-2 rounded-lg transition ${
                chatInput.trim()
                  ? "bg-[#1683FF] text-white hover:bg-[#0F6FE5]"
                  : "bg-slate-100 text-slate-400 cursor-not-allowed"
              }`}
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
          ${showRightDrawerMobile ? "fixed inset-y-14 right-0 z-40 w-80 shadow-2xl" : "hidden"}
          lg:flex lg:static w-72 xl:w-80 bg-white border-l border-slate-200 flex-col shrink-0 overflow-y-auto p-4 space-y-4
        `}>
          
          {/* Close button on mobile drawer */}
          <div className="flex items-center justify-between lg:hidden pb-2 border-b border-slate-100">
            <span className="font-bold text-xs text-slate-700">Rincian Bantuan</span>
            <button
              type="button"
              onClick={() => setShowRightDrawerMobile(false)}
              className="p-1 rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Partner Simple Card */}
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <img
              src={
                activeRole === "requester"
                  ? (selectedRoom?.helper?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80")
                  : (selectedRoom?.requester?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80")
              }
              alt="Partner"
              className="w-10 h-10 rounded-full object-cover border border-slate-200"
            />
            <div>
              <h3 className="font-bold text-xs sm:text-sm text-slate-900">
                {activeRole === "requester" ? selectedRoom?.helper?.name : selectedRoom?.requester?.name}
              </h3>
              <p className="text-[11px] text-slate-400">
                {isInquiry ? "Kandidat Pelamar" : isNotSelected ? "Kandidat Tidak Terpilih" : "Helper Terverifikasi"}
              </p>
            </div>
          </div>

          {/* JIKA PRA-TRANSAKSI (RENCANA) */}
          {isInquiry || isNotSelected ? (
            <div className="space-y-4 flex-1 flex flex-col justify-between">
              <div className="space-y-3">
                
                {/* Status Box Rencana */}
                <div className={`p-3 rounded-xl space-y-1.5 border ${
                  isNotSelected ? "bg-slate-50 border-slate-200" : "bg-amber-50/70 border-amber-200"
                }`}>
                  <div className={`text-[10px] font-bold uppercase tracking-wider ${
                    isNotSelected ? "text-slate-600" : "text-amber-800"
                  }`}>
                    {isNotSelected ? "STATUS: DISKUSI SELESAI" : "STATUS: TAHAP RENCANA"}
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    {isNotSelected
                      ? "Pemesan telah memilih kandidat lain untuk menyelesaikan tugas ini."
                      : "Dana belum dikunci di Escrow. Diskusikan teknis pengerjaan dengan kandidat sebelum menyetujui."}
                  </p>
                </div>

                {/* Offer Price summary */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tawaran Biaya:</div>
                  <div className="text-base font-black text-[#1683FF]">{formatIDR(selectedRoom?.lockedAmount)}</div>
                  <div className="text-[11px] text-slate-500">Estimasi: Sesuai Kesepakatan</div>
                </div>

                {/* CTA Kunci Escrow (hanya jika belum ditutup) */}
                {activeRole === "requester" && !isNotSelected && (
                  <button
                    type="button"
                    onClick={() => {
                      const reqId = selectedRoom?.requestId || "req-3";
                      const hlpId = selectedRoom?.helper?.id || "user-hlp-4";
                      const targetOffer = (requests?.find((r) => r.id === reqId)?.offers || []).find(
                        (o) => o.helperId === hlpId || o.id === hlpId
                      ) || { id: "off-301" };
                      router.push(`/bantuan/${reqId}/pembayaran?offerId=${targetOffer.id}&roomId=${selectedRoom?.id || ""}`);
                    }}
                    className="w-full py-2.5 bg-[#1683FF] hover:bg-[#0F6FE5] text-white rounded-xl font-bold text-xs shadow-xs transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Pilih Helper &amp; Bayar Escrow</span>
                  </button>
                )}

              </div>

              {/* Trust Footer */}
              <div className="pt-3 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-500">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="text-[11px] leading-snug">
                  Pembayaran hanya melalui Rekening Bersama resmi Bantuin.
                </span>
              </div>
            </div>
          ) : (
            /* JIKA PESANAN AKTIF (SUDAH BAYAR) */
            <div className="space-y-4 flex-1 flex flex-col justify-between">
              <div className="space-y-4">
                
                {/* Stepper Progress */}
                <div className="space-y-2">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Alur Transaksi:
                  </div>

                  <div className="space-y-1.5">
                    {steps.map((step, idx) => {
                      const isPassed = idx <= currentStepIdx;
                      const isCurrent = idx === currentStepIdx;
                      return (
                        <div
                          key={step.key}
                          className={`p-2.5 rounded-lg border text-xs flex items-center justify-between transition ${
                            isCurrent
                              ? "bg-blue-50/60 border-blue-200 font-bold text-[#1683FF]"
                              : isPassed
                              ? "bg-slate-50 border-slate-200 text-slate-700"
                              : "bg-white border-slate-100 text-slate-400"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                              isPassed ? "bg-[#1683FF] text-white" : "bg-slate-200 text-slate-500"
                            }`}>
                              {idx + 1}
                            </span>
                            <span>{step.label}</span>
                          </div>
                          {isPassed && <Check className="w-3.5 h-3.5 text-[#1683FF]" />}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Action Trigger based on Role */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Tindakan:
                  </div>

                  {activeRole === "helper" ? (
                    isOnline ? (
                      /* Online Helper Actions */
                      selectedRoom?.orderStatus === "room_created" ? (
                        <button
                          type="button"
                          onClick={() => updateOrderStatus(selectedRoom.id, "in_progress")}
                          className="w-full py-2.5 bg-[#1683FF] hover:bg-[#0F6FE5] text-white rounded-lg font-bold text-xs shadow-xs transition"
                        >
                          Mulai Kerjakan
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setIsProofModalOpen(true)}
                          className="w-full py-2.5 bg-[#1683FF] hover:bg-[#0F6FE5] text-white rounded-lg font-bold text-xs shadow-xs transition flex items-center justify-center gap-1.5"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>Serahkan Berkas & Selesaikan</span>
                        </button>
                      )
                    ) : (
                      /* Offline Helper Actions */
                      selectedRoom?.orderStatus === "room_created" ? (
                        <button
                          type="button"
                          onClick={() => updateOrderStatus(selectedRoom.id, "on_the_way")}
                          className="w-full py-2.5 bg-[#1683FF] hover:bg-[#0F6FE5] text-white rounded-lg font-bold text-xs shadow-xs transition"
                        >
                          Mulai Berangkat ke Lokasi
                        </button>
                      ) : selectedRoom?.orderStatus === "on_the_way" ? (
                        <button
                          type="button"
                          onClick={() => updateOrderStatus(selectedRoom.id, "item_picked_up")}
                          className="w-full py-2.5 bg-[#1683FF] hover:bg-[#0F6FE5] text-white rounded-lg font-bold text-xs shadow-xs transition"
                        >
                          Tiba & Ambil Tugas
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setIsProofModalOpen(true)}
                          className="w-full py-2.5 bg-[#1683FF] hover:bg-[#0F6FE5] text-white rounded-lg font-bold text-xs shadow-xs transition flex items-center justify-center gap-1.5"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          <span>Foto Bukti & Selesaikan</span>
                        </button>
                      )
                    )
                  ) : (
                    /* Requester Action */
                    selectedRoom?.orderStatus !== "completed" ? (
                      <button
                        type="button"
                        onClick={() => setIsRatingModalOpen(true)}
                        className="w-full py-2.5 bg-[#1683FF] hover:bg-[#0F6FE5] text-white rounded-lg font-bold text-xs shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Star className="w-3.5 h-3.5 fill-white text-white" />
                        <span>Konfirmasi Selesai &amp; Nilai</span>
                      </button>
                    ) : (
                      <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-center font-bold text-xs text-slate-700">
                        Pesanan Telah Selesai
                      </div>
                    )
                  )}
                </div>

                {/* Deliverables / Proof files */}
                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {isOnline ? "Berkas Lampiran:" : "Foto Bukti:"}
                  </div>

                  {isOnline ? (
                    selectedRoom?.digitalFiles?.length > 0 || digitalFiles.length > 0 ? (
                      <div className="space-y-1">
                        {(digitalFiles.length > 0 ? digitalFiles : selectedRoom?.digitalFiles || []).map((file, idx) => (
                          <div
                            key={idx}
                            className="p-2 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-xs"
                          >
                            <span className="truncate font-medium text-slate-800">{file.name}</span>
                            <button
                              type="button"
                              onClick={() => handleDownloadFile(file)}
                              className="p-1 hover:bg-slate-200 rounded text-slate-600"
                            >
                              <Download className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-400 italic">Belum ada file diunggah.</p>
                    )
                  ) : (
                    selectedRoom?.proofPhotos?.length > 0 ? (
                      <img
                        src={selectedRoom.proofPhotos[0]}
                        alt="Bukti foto"
                        className="w-full h-32 object-cover rounded-lg border border-slate-200"
                      />
                    ) : (
                      <p className="text-[11px] text-slate-400 italic">Belum ada foto bukti.</p>
                    )
                  )}
                </div>

              </div>

              {/* Trust Footer */}
              <div className="pt-3 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-500">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="text-[11px] leading-snug">
                  Dana aman di Rekening Escrow sampai tugas disetujui.
                </span>
              </div>
            </div>
          )}

        </aside>

      </div>

      {/* MODAL CHECKOUT ESCROW PAYMENT */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-2xs flex items-center justify-center p-4 animate-in fade-in duration-100">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Escrow Payment
                </span>
                <h3 className="font-bold text-sm text-slate-900 mt-1">Pilih Helper & Kunci Dana</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsPaymentModalOpen(false)}
                className="w-6 h-6 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {isProcessingPayment ? (
              <div className="py-8 text-center space-y-2">
                <Loader2 className="w-8 h-8 text-[#1683FF] animate-spin mx-auto" />
                <div className="font-bold text-xs text-slate-800">Mengamankan Saldo di Escrow...</div>
              </div>
            ) : isPaymentSuccess ? (
              <div className="py-6 text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <Check className="w-6 h-6" />
                </div>
                <div className="font-bold text-xs text-slate-800">Pembayaran Berhasil</div>
                <p className="text-[11px] text-slate-500">Order resmi telah dibuka.</p>
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-900">{selectedRoom?.helper?.name}</div>
                    <div className="text-[11px] text-slate-500">Imbalan Jasa Disepakati</div>
                  </div>
                  <div className="font-black text-[#1683FF] text-sm">{formatIDR(selectedRoom?.lockedAmount)}</div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700">Metode Pembayaran:</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("qris")}
                      className={`p-2.5 rounded-lg border text-left font-semibold transition flex items-center gap-2 ${
                        paymentMethod === "qris" ? "bg-blue-50 border-[#1683FF] text-[#1683FF]" : "bg-white border-slate-200 text-slate-700"
                      }`}
                    >
                      <QrCode className="w-4 h-4" />
                      <span>QRIS Instan</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("wallet")}
                      className={`p-2.5 rounded-lg border text-left font-semibold transition flex items-center gap-2 ${
                        paymentMethod === "wallet" ? "bg-blue-50 border-[#1683FF] text-[#1683FF]" : "bg-white border-slate-200 text-slate-700"
                      }`}
                    >
                      <Wallet className="w-4 h-4" />
                      <span>Saldo Akun</span>
                    </button>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsPaymentModalOpen(false)}
                    className="px-3 py-2 font-semibold text-slate-600 rounded-lg hover:bg-slate-100"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleProcessPayment}
                    className="px-4 py-2 bg-[#1683FF] hover:bg-[#0F6FE5] text-white font-bold rounded-lg shadow-xs"
                  >
                    Bayar & Buka Order
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

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
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
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
                <div className="text-[11px] font-semibold text-emerald-600 mt-0.5">
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
                {ratingValue === 5 && "⭐ 5.0 - Sangat Memuaskan & Sempurna!"}
                {ratingValue === 4 && "⭐ 4.0 - Bagus & Sesuai Ekspektasi"}
                {ratingValue === 3 && "⭐ 3.0 - Cukup Baik"}
                {ratingValue === 2 && "⭐ 2.0 - Kurang Maksimal"}
                {ratingValue === 1 && "⭐ 1.0 - Tidak Memuaskan"}
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

