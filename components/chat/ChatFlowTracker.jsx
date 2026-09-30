"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { formatIDR } from "@/lib/utils";
import { useApp } from "@/lib/context/AppContext";
import { getChatFlowConfig } from "@/lib/chat/flowConfig";
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  Camera,
  Star,
  RefreshCw,
  AlertCircle,
  HelpCircle,
  MapPin,
  Calendar,
  X,
  FileCheck2,
  Wallet,
  Lock,
  Copy,
  CreditCard,
  Building2,
  QrCode,
  Loader2,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Image as ImageIcon,
  ExternalLink,
  Download,
  FileText,
  Upload,
  Send,
  MessageSquare,
  Check,
  Eye,
  Layers,
  Paperclip,
  CheckCircle
} from "lucide-react";

export default function ChatFlowTracker({ room, activeRole = "requester" }) {
  const {
    // Rental methods
    confirmRentalHandover,
    confirmRentalReturn,
    submitRentalReview,
    payRentalEscrow,
    // Service / General methods
    updateOrderStatus,
    submitProof,
    confirmOrderCompletion,
    sendChatMessage,
    currentUser,
    addToast
  } = useApp();

  const [isExpanded, setIsExpanded] = useState(false);

  // Common & Category-specific Modals
  const [activeModal, setActiveModal] = useState(null); // 'handover' | 'return' | 'review' | 'deliverables' | 'revision' | 'task_proof' | 'task_completion'

  // Deliverables / Proof states (Jasa & Bantuan)
  const [submissionUrl, setSubmissionUrl] = useState(room?.submissionUrl || "");
  const [deliverableNotes, setDeliverableNotes] = useState("");
  const [digitalFiles, setDigitalFiles] = useState(room?.digitalFiles || []);
  const [taskProofPhotos, setTaskProofPhotos] = useState(room?.proofPhotos || []);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Review states (All categories)
  const [selectedRating, setSelectedRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [hoverRating, setHoverRating] = useState(0);

  // Revision state (Jasa)
  const [revisionNotes, setRevisionNotes] = useState("");

  // Rental Handover state
  const [serialNumber, setSerialNumber] = useState(room?.serialNumber || "");
  const [handoverPhotos, setHandoverPhotos] = useState(room?.handoverPhotos || []);
  const [handoverNotes, setHandoverNotes] = useState("");
  const [checklistIdConfirmed, setChecklistIdConfirmed] = useState(true);
  const [checklistConditionConfirmed, setChecklistConditionConfirmed] = useState(true);

  // Drag & drop states
  const [isDraggingTaskProof, setIsDraggingTaskProof] = useState(false);
  const [isDraggingHandover, setIsDraggingHandover] = useState(false);

  // File input refs
  const taskProofFileRef = useRef(null);
  const handoverFileRef = useRef(null);
  const deliverablesFileRef = useRef(null);

  // Helper untuk proses file gambar dengan batasan format gambar & maksimal 3 foto
  const processImageFiles = (rawFiles, currentPhotos, setPhotosFunc, labelName = "Foto") => {
    if (!rawFiles || rawFiles.length === 0) return;
    const files = Array.from(rawFiles);
    
    // Filter file gambar saja
    const imageFiles = files.filter((f) => f.type && f.type.startsWith("image/"));
    const nonImageFiles = files.filter((f) => !f.type || !f.type.startsWith("image/"));

    if (nonImageFiles.length > 0) {
      addToast?.("Format Tidak Didukung", "Hanya berkas gambar (JPG, PNG, WebP, GIF) yang dapat diunggah.", "warning");
    }

    if (imageFiles.length === 0) return;

    const maxAllowed = 3;
    const currentCount = currentPhotos.length;
    const availableSlots = maxAllowed - currentCount;

    if (availableSlots <= 0) {
      addToast?.("Batas Maksimal", `Maksimal hanya ${maxAllowed} ${labelName.toLowerCase()} yang diperbolehkan.`, "warning");
      return;
    }

    if (imageFiles.length > availableSlots) {
      addToast?.("Batas Jumlah Foto", `Hanya ${availableSlots} foto yang ditambahkan karena batas maksimal adalah 3 foto.`, "info");
    }

    const filesToRead = imageFiles.slice(0, availableSlots);
    filesToRead.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setPhotosFunc((prev) => {
            if (prev.length >= maxAllowed) return prev;
            return [...prev, ev.target.result];
          });
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleTaskProofFilesSelected = (e) => {
    processImageFiles(e.target.files, taskProofPhotos, setTaskProofPhotos, "Foto Bukti");
    e.target.value = "";
  };

  const handleHandoverFilesSelected = (e) => {
    processImageFiles(e.target.files, handoverPhotos, setHandoverPhotos, "Foto Baseline");
    e.target.value = "";
  };

  const handleDeliverablesFilesSelected = (e) => {
    const files = Array.from(e.target.files || []);
    const newItems = files.map((f) => ({
      id: `df-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      name: f.name,
      size: `${(f.size / (1024 * 1024)).toFixed(1)} MB`,
      type: f.type || "application/octet-stream",
      uploadedAt: "Baru saja",
    }));
    setDigitalFiles((prev) => [...prev, ...newItems]);
    e.target.value = "";
  };

  if (!room) return null;

  // Configuration single source of truth based on orderStatus and transactionType
  const config = getChatFlowConfig(room, activeRole);
  const {
    transactionType,
    steps,
    completedSteps,
    activeStep,
    progressPercent,
    badge,
    itemTitle,
    locationInfo,
    partnerLabel,
    primaryAction
  } = config;

  // ===========================================================================
  // ACTION HANDLERS
  // ===========================================================================

  // 1. JASA: Start Working
  const handleStartWorking = () => {
    updateOrderStatus(room.id, "in_progress");
    sendChatMessage(
      room.id,
      "Halo! Pembayaran telah terkonfirmasi aman melalui Payment Gateway Bantuin. Saya telah memulai proses pengerjaan pesanan ini sesuai kesepakatan brief.",
      { isSystemAnnouncement: true }
    );
    addToast?.("Pengerjaan Dimulai", "Status pesanan telah diperbarui menjadi Sedang Dikerjakan.");
  };

  // 2. BANTUAN: Helper En Route ("Menuju Lokasi")
  const handleHelperOnTheWay = () => {
    updateOrderStatus(room.id, "on_the_way");
    sendChatMessage(
      room.id,
      "Halo! Saya sudah mulai bergerak dalam perjalanan menuju titik lokasi tugas. Mohon tunggu, saya akan kabari saat tiba.",
      { isSystemAnnouncement: true }
    );
    addToast?.("Helper Bergerak", "Status tugas diperbarui: Helper Menuju Lokasi.");
  };

  // 3. BANTUAN: Helper Arrived / Item Picked Up ("Tiba / Ambil Barang")
  const handleHelperPickedUp = () => {
    updateOrderStatus(room.id, "item_picked_up");
    sendChatMessage(
      room.id,
      "Saya telah tiba di lokasi dan barang/tugas telah diambil/sedang diproses. Tugas sedang dikerjakan secara langsung.",
      { isSystemAnnouncement: true }
    );
    addToast?.("Tiba di Lokasi", "Status tugas diperbarui: Proses Bantuan berlangsung.");
  };

  // 4. JASA: Submit Deliverables
  const handleSubmitDeliverables = (e) => {
    e.preventDefault();
    if (digitalFiles.length === 0 && !submissionUrl.trim()) {
      addToast?.("Berkas / Tautan Diperlukan", "Mohon sertakan minimal satu berkas pekerjaan atau cantumkan tautan cloud/drive.", "warning");
      return;
    }
    if (!deliverableNotes.trim()) {
      addToast?.("Catatan Diperlukan", "Mohon isi catatan serah terima hasil pekerjaan.", "warning");
      return;
    }

    setIsSubmitting(true);
    const filesToSubmit = digitalFiles;
    const finalNotes = deliverableNotes.trim();

    setTimeout(() => {
      submitProof(room.id, {
        digitalFiles: filesToSubmit,
        submissionUrl: submissionUrl.trim() || "-",
        notes: finalNotes
      }, finalNotes);

      sendChatMessage(
        room.id,
        "Penyedia jasa telah menyerahkan hasil pekerjaan & berkas digital. Klien dapat memeriksa berkas lalu menekan 'Setujui & Selesaikan' jika sudah sesuai, atau 'Minta Revisi' jika ada catatan.",
        {
          isJasaDeliverablesProof: true,
          proofData: {
            serviceTitle: itemTitle,
            submissionUrl: submissionUrl.trim() || "-",
            files: filesToSubmit,
            notes: finalNotes,
            submittedAt: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
          }
        }
      );

      setIsSubmitting(false);
      setActiveModal(null);
    }, 700);
  };

  // 5. JASA: Request Revision
  const handleRequestRevision = (e) => {
    e.preventDefault();
    if (!revisionNotes.trim()) return;

    updateOrderStatus(room.id, "in_progress");
    sendChatMessage(
      room.id,
      `[PERMINTAAN REVISI]:\n${revisionNotes.trim()}\n\nMohon mitra dapat melakukan perbaikan sesuai catatan di atas. Terima kasih!`,
      { isRevisionRequest: true }
    );

    setRevisionNotes("");
    setActiveModal(null);
    addToast?.("Revisi Diajukan", "Catatan revisi telah dikirimkan ke ruang obrolan mitra.");
  };

  // 6. JASA: Approve & Complete
  const handleConfirmJasaCompletion = (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    setTimeout(() => {
      confirmOrderCompletion(room.id, {
        rating: selectedRating,
        feedback: reviewComment || "Pelayanan sangat memuaskan, hasil kerja rapi dan tepat waktu!"
      });

      sendChatMessage(
        room.id,
        `Pesanan telah disetujui & dikonfirmasi selesai oleh pemesan! Dana imbalan sebesar ${formatIDR(room.helperPayoutAmount || room.lockedAmount || 150000)} telah otomatis dicairkan ke saldo mitra. Rating diberikan: ${selectedRating}/5. Terima kasih telah menggunakan Bantuin.id!`,
        {
          isJasaCompletion: true,
          completionData: {
            serviceTitle: itemTitle,
            rating: selectedRating,
            feedback: reviewComment || "Pelayanan sangat memuaskan, hasil kerja rapi dan tepat waktu!",
            payoutAmount: room.helperPayoutAmount || room.lockedAmount || 150000,
            completedAt: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
          }
        }
      );

      setIsSubmitting(false);
      setActiveModal(null);
      addToast?.("Pesanan Selesai", "Dana berhasil diteruskan ke saldo mitra. Terima kasih atas ulasan Anda!");
    }, 700);
  };

  // 7. BANTUAN: Submit Task Proof
  const handleSubmitTaskProof = async (e) => {
    e.preventDefault();
    if (!taskProofPhotos || taskProofPhotos.length === 0) {
      addToast?.("Foto Bukti Diperlukan", "Mohon unggah minimal 1 foto bukti penyelesaian tugas.", "warning");
      return;
    }
    if (!deliverableNotes || !deliverableNotes.trim()) {
      addToast?.("Catatan Diperlukan", "Mohon isi catatan ringkas mengenai penyelesaian tugas.", "warning");
      return;
    }

    setIsSubmitting(true);
    const finalNotes = deliverableNotes.trim();

    try {
      // Upload setiap foto ke bantuin-proofs bucket
      const uploadedUrls = [];
      for (const dataUrl of taskProofPhotos) {
        // Konversi base64 data URL ke Blob
        const res = await fetch(dataUrl);
        const blob = await res.blob();
        const ext = blob.type.split("/")[1] || "jpg";
        const form = new FormData();
        form.append("file", blob, `proof-${Date.now()}.${ext}`);
        form.append("bucket", "bantuin-proofs");
        form.append("folder", `tasks/${room.id}`);

        const uploadRes = await fetch("/api/upload", { method: "POST", body: form });
        const uploadData = await uploadRes.json();
        const url = uploadData?.url || uploadData?.urls?.[0];
        if (!uploadRes.ok || !url) throw new Error(uploadData?.error || "Upload bukti gagal");
        uploadedUrls.push(url);
      }

      submitProof(room.id, {
        photoUrl: uploadedUrls[0],
        photoUrls: uploadedUrls,
        notes: finalNotes,
      }, finalNotes);

      sendChatMessage(
        room.id,
        "Helper telah menyelesaikan tugas dan mengunggah bukti penyelesaian. Pemesan dapat memeriksa lalu menekan 'Konfirmasi Tugas Selesai'.",
        {
          isTaskProof: true,
          proofPhotos: uploadedUrls,
          notes: finalNotes,
        }
      );

      addToast?.("Bukti Terkirim", "Foto bukti berhasil diunggah ke server.");
    } catch (err) {
      console.error("Task proof upload error:", err);
      addToast?.("Gagal Mengunggah", err.message || "Terjadi kesalahan saat mengunggah foto bukti.", "error");
    } finally {
      setIsSubmitting(false);
      setActiveModal(null);
    }
  };

  // 8. BANTUAN: Confirm Task Completion & Rating
  const handleConfirmTaskCompletion = (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    setTimeout(() => {
      confirmOrderCompletion(room.id, {
        rating: selectedRating,
        feedback: reviewComment || "Helper sangat cekatan, ramah, dan tugas selesai dengan rapi!"
      });

      sendChatMessage(
        room.id,
        `Tugas bantuan telah dikonfirmasi selesai oleh pemesan! Dana imbalan sebesar ${formatIDR(room.helperPayoutAmount || room.lockedAmount || 35000)} telah otomatis dicairkan ke saldo helper. Rating: ${selectedRating}/5. Terima kasih!`,
        {
          isTaskCompletion: true,
          rating: selectedRating,
          feedback: reviewComment || "Tugas diselesaikan dengan sangat baik & tepat waktu.",
        }
      );

      setIsSubmitting(false);
      setActiveModal(null);
      addToast?.("Bantuan Selesai", "Tugas selesai & imbalan telah dicairkan ke helper.");
    }, 700);
  };

  // 9. SEWA: Handover Submit
  const handleRentalHandoverSubmit = (e) => {
    e.preventDefault();
    if (handoverPhotos.length === 0) {
      addToast?.("Foto Baseline Diperlukan", "Mohon unggah minimal 1 foto fisik unit saat serah terima.", "warning");
      return;
    }
    if (!handoverNotes.trim()) {
      addToast?.("Catatan Fisik Diperlukan", "Mohon cantumkan catatan kondisi fisik unit.", "warning");
      return;
    }

    const photosToSubmit = handoverPhotos;

    confirmRentalHandover(room.id, {
      photos: photosToSubmit,
      serialNumber: serialNumber || "-",
      eAgreementConfirmed: true,
      notes: handoverNotes.trim(),
    });

    setActiveModal(null);
    addToast?.("Serah Terima Berhasil", "Status sewa aktif. Unit siap digunakan.");
  };

  // 10. SEWA: Return Submit
  const handleRentalReturnSubmit = (e) => {
    e.preventDefault();
    confirmRentalReturn(room.id);
    setActiveModal(null);
    addToast?.("Pengembalian Berhasil", "Unit telah kembali dan deposit jaminan sedang diproses.");
  };

  // 11. SEWA: Review Submit
  const handleRentalReviewSubmit = (e) => {
    e.preventDefault();
    if (!reviewComment.trim()) {
      addToast?.("Ulasan Diperlukan", "Mohon berikan ulasan singkat mengenai pengalaman sewa Anda.", "warning");
      return;
    }
    submitRentalReview(
      room.id,
      selectedRating,
      reviewComment.trim()
    );
    setActiveModal(null);
    addToast?.("Ulasan Disimpan", "Terima kasih telah memberikan ulasan untuk toko rental.");
  };

  const handleUseSampleHandoverPhotos = () => {
    setHandoverPhotos([
      room?.rentalDetails?.photoUrl || "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&w=800&q=80"
    ]);
    if (!handoverNotes) {
      setHandoverNotes("Kondisi bodi 98% mulus, sensor bersih tanpa jamur/debu, kelengkapan 2 baterai original, charger & tas unit.");
    }
  };

  // Trigger primary action based on config
  const triggerAction = (action) => {
    if (!action) return;
    if (action.type === "modal") {
      setActiveModal(action.modalKey);
    } else if (action.type === "action") {
      if (action.actionKey === "start_working") handleStartWorking();
      if (action.actionKey === "helper_on_the_way") handleHelperOnTheWay();
      if (action.actionKey === "helper_picked_up") handleHelperPickedUp();
    }
  };

  // Cek apakah ada aksi interaktif yang butuh tombol klik user
  const hasInteractiveAction = Boolean(
    primaryAction && (
      primaryAction.type === "modal" ||
      primaryAction.type === "action" ||
      primaryAction.type === "link" ||
      primaryAction.type === "dual"
    )
  );

  const getActionIcon = (iconName) => {
    switch (iconName) {
      case "Camera": return <Camera className="w-3.5 h-3.5 shrink-0" />;
      case "RefreshCw": return <RefreshCw className="w-3.5 h-3.5 shrink-0" />;
      case "Star": return <Star className="w-3.5 h-3.5 fill-white shrink-0" />;
      case "CheckCircle2": return <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />;
      case "Upload": return <Upload className="w-3.5 h-3.5 shrink-0" />;
      case "MapPin": return <MapPin className="w-3.5 h-3.5 shrink-0" />;
      case "Lock": return <Lock className="w-3.5 h-3.5 shrink-0" />;
      default: return null;
    }
  };

  const renderInteractiveAction = (isMobileRow = false) => {
    if (!hasInteractiveAction) return null;

    if (primaryAction.type === "link") {
      return (
        <Link
          href={primaryAction.href}
          className={`${
            isMobileRow ? "w-full py-2 px-3 text-xs justify-center" : "px-3 py-1.5 text-[11px]"
          } rounded-xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer active:scale-95`}
        >
          <Lock className="w-3.5 h-3.5 shrink-0" />
          <span>{primaryAction.label}</span>
        </Link>
      );
    }

    if (primaryAction.type === "modal" || primaryAction.type === "action") {
      return (
        <button
          type="button"
          onClick={() => triggerAction(primaryAction)}
          className={`${
            isMobileRow ? "w-full py-2 px-3 text-xs justify-center" : "px-3 py-1.5 text-[11px]"
          } rounded-xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white font-bold shadow-xs transition active:scale-95 flex items-center gap-1.5 cursor-pointer`}
        >
          {getActionIcon(primaryAction.icon)}
          <span>{primaryAction.label}</span>
        </button>
      );
    }

    if (primaryAction.type === "dual") {
      return (
        <div className={`flex items-center gap-2 ${isMobileRow ? "w-full" : ""}`}>
          {primaryAction.secondary && (
            <button
              type="button"
              onClick={() => triggerAction(primaryAction.secondary)}
              className={`${
                isMobileRow ? "flex-1 py-2 px-3 text-xs justify-center" : "px-2.5 py-1.5 text-[11px]"
              } rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold transition cursor-pointer flex items-center justify-center gap-1`}
            >
              <span>{primaryAction.secondary.label}</span>
            </button>
          )}
          {primaryAction.primary && (
            <button
              type="button"
              onClick={() => triggerAction(primaryAction.primary)}
              className={`${
                isMobileRow ? "flex-1 py-2 px-3 text-xs justify-center" : "px-3 py-1.5 text-[11px]"
              } rounded-xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white font-bold shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>{primaryAction.primary.label}</span>
            </button>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <div className="bg-white border-b border-slate-200/90 shadow-2xs shrink-0 select-none">
      
      {/* ===================================================================== */}
      {/* 1. COMPACT STATUS & ACTION BAR (~44-48px)                             */}
      {/* ===================================================================== */}
      <div className="px-3 sm:px-4 py-2 bg-slate-50/90 flex items-center justify-between gap-2.5 border-b border-slate-200/70 min-w-0">
        
        {/* Left: Status Information Badge */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold shrink-0 flex items-center gap-1.5 shadow-2xs ${
            badge.isComplete 
              ? "bg-slate-100 text-slate-700 border border-slate-200" 
              : "bg-blue-50 text-[#1683FF] border border-blue-200"
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
              badge.isComplete ? "bg-slate-400" : "bg-[#1683FF] animate-pulse"
            }`} />
            <span className="font-bold">{badge.title}</span>
          </span>

          <span className="text-[11px] text-slate-500 font-medium truncate hidden md:inline max-w-[200px]" title={itemTitle}>
            {itemTitle}
          </span>
        </div>

        {/* Right Area: Interactive Action (Desktop only) + Stepper Toggle */}
        <div className="flex items-center gap-2 shrink-0">
          
          {/* Action button on desktop/tablet */}
          <div className="hidden sm:flex items-center gap-1.5">
            {renderInteractiveAction(false)}
            
            {/* Completed badge if already finished */}
            {primaryAction?.type === "badge_completed" && (
              <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 border border-slate-200 text-[11px] font-bold flex items-center gap-1">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400 shrink-0" />
                <span>{primaryAction.label}</span>
              </span>
            )}

            {/* Passive badge on desktop */}
            {primaryAction?.type === "badge" && (
              <span className="px-2.5 py-1 bg-blue-50 text-[#1683FF] border border-blue-200 rounded-lg text-[11px] font-bold flex items-center gap-1">
                <Clock className="w-3 h-3 shrink-0" />
                <span className="truncate max-w-[160px]">{primaryAction.label}</span>
              </span>
            )}
          </div>

          {/* Stepper Roadmap Toggle Button */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-2 py-1 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 transition flex items-center gap-1 text-[11px] font-semibold shrink-0 cursor-pointer"
            title={isExpanded ? "Tutup Alur Transaksi" : "Lihat Alur Transaksi"}
            aria-label="Toggle Alur Transaksi"
          >
            <span className="hidden xs:inline">{isExpanded ? "Tutup" : "Alur"}</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? "rotate-180 text-[#1683FF]" : ""}`} />
          </button>
        </div>
      </div>

      {/* Row 2: Action Bar khusus mobile jika ada tindakan interaktif (Kirim Hasil, Bukti, Bayar, dll) */}
      {hasInteractiveAction && (
        <div className="sm:hidden px-3 py-2 bg-white border-b border-slate-100 flex items-center">
          {renderInteractiveAction(true)}
        </div>
      )}

      {/* ===================================================================== */}
      {/* 2. REUSABLE EXPANDABLE STEPPER ROADMAP                                */}
      {/* ===================================================================== */}
      {isExpanded && (
        <div className="bg-slate-50/90 border-b border-slate-200 p-3 sm:p-4 space-y-3 animate-in slide-in-from-top-2 duration-150 overflow-hidden">
          
          {/* Stepper Container with Horizontal Scroll Protection for Mobile */}
          <div className="overflow-x-auto no-scrollbar pb-1">
            <div className="min-w-[420px] sm:min-w-0 max-w-3xl mx-auto relative pt-1 pb-2 px-3">
              
              {/* Background Connecting Line */}
              <div className="absolute top-4.5 left-7 right-7 h-0.5 bg-slate-200 -z-0" />
              
              {/* Active Animated Progress Line */}
              <div 
                className="absolute top-4.5 left-7 h-0.5 bg-[#1683FF] transition-all duration-500 -z-0"
                style={{ width: `${progressPercent}%` }}
              />

              {/* Steps Nodes */}
              <div className="flex items-center justify-between relative z-10">
                {steps.map((step) => {
                  const isComplete = completedSteps.includes(step.number);
                  const isActive = activeStep === step.number;
                  const isPending = !isComplete && !isActive;

                  return (
                    <div key={step.id} className="flex flex-col items-center text-center px-1">
                      {/* Circle indicator */}
                      <div 
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-xs ${
                          isComplete
                            ? "bg-slate-900 text-white"
                            : isActive
                            ? "bg-[#1683FF] text-white shadow-blue-500/30 ring-2 ring-blue-100 animate-pulse"
                            : "bg-white text-slate-400 border-2 border-slate-200"
                        }`}
                      >
                        {isComplete ? (
                          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        ) : isActive ? (
                          <span>{step.number}</span>
                        ) : (
                          <span>{step.number}</span>
                        )}
                      </div>

                      {/* Step Labels */}
                      <div className="mt-1.5">
                        <div className={`text-[10px] sm:text-[11px] font-bold tracking-tight whitespace-nowrap ${
                          isActive 
                            ? "text-[#1683FF]" 
                            : isComplete 
                            ? "text-slate-800" 
                            : "text-slate-400"
                        }`}>
                          {step.title}
                        </div>
                        <div className="text-[9px] text-slate-400 font-normal hidden sm:block">
                          {step.desc}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          </div>

          {/* Guidelines Box */}
          <div className="max-w-3xl mx-auto p-2 sm:p-2.5 bg-white rounded-xl border border-slate-200 text-xs flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 shadow-2xs">
            <div className="flex items-center gap-1.5 text-slate-600 truncate min-w-0">
              <MapPin className="w-3.5 h-3.5 text-[#1683FF] shrink-0" />
              <span className="text-[11px] truncate">
                {partnerLabel} • <strong className="text-slate-800 font-semibold">{locationInfo}</strong>
              </span>
            </div>
            <div className="text-[11px] text-slate-500 shrink-0 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[#1683FF]" />
              <span>Jaminan: <strong className="text-slate-800">Rekber Resmi Bantuin.id</strong></span>
            </div>
          </div>

        </div>
      )}

      {/* ===================================================================== */}
      {/* 3. MODALS                                                             */}
      {/* ===================================================================== */}

      {/* MODAL: SEWA SERAH TERIMA UNIT */}
      {activeModal === "handover" && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#1683FF] flex items-center justify-center">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">Serah Terima &amp; Cek Fisik Unit</h3>
                  <p className="text-[11px] text-slate-500">Dokumentasikan kondisi fisik alat sebelum masa sewa berjalan</p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setActiveModal(null)} 
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRentalHandoverSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Nomor Seri / Serial Number (Opsional)</label>
                <input
                  type="text"
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                  placeholder="Contoh: SN-82910482-BANTUIN"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-[#1683FF] outline-none"
                />
              </div>

              <div>
                <input
                  type="file"
                  ref={handoverFileRef}
                  onChange={handleHandoverFilesSelected}
                  accept="image/png, image/jpeg, image/jpg, image/webp, image/gif"
                  className="hidden"
                  multiple
                />
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    Foto Kondisi Fisik Baseline <span className="text-rose-500 font-bold ml-0.5">*</span>
                  </label>
                  <span className="text-[11px] font-semibold text-slate-400">
                    {handoverPhotos.length}/3 Foto
                  </span>
                </div>

                {handoverPhotos.length === 0 ? (
                  <div
                    onClick={() => handoverFileRef.current?.click()}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsDraggingHandover(true);
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsDraggingHandover(false);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsDraggingHandover(false);
                      processImageFiles(e.dataTransfer.files, handoverPhotos, setHandoverPhotos, "Foto Baseline");
                    }}
                    className={`border-2 border-dashed rounded-2xl p-4 text-center transition cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
                      isDraggingHandover
                        ? "border-[#1683FF] bg-blue-50/90 scale-[1.01]"
                        : "border-slate-200 bg-slate-50/60 hover:bg-blue-50/50 hover:border-[#1683FF]"
                    }`}
                  >
                    <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#1683FF] flex items-center justify-center">
                      <Camera className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-700">
                        {isDraggingHandover ? "Lepaskan foto di sini" : "Tarik & lepas foto ke sini, atau klik untuk memilih"}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Hanya format gambar (PNG, JPG, WebP) • Maksimal 3 foto
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                      {handoverPhotos.map((url, idx) => (
                        <div key={idx} className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-200 shadow-2xs group">
                          <img src={url} alt={`Handover ${idx}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setHandoverPhotos((p) => p.filter((_, i) => i !== idx))}
                            className="absolute top-1 right-1 p-1 bg-black/60 text-white rounded-md hover:bg-rose-600 transition cursor-pointer"
                            title="Hapus foto"
                          >
                            <X className="w-3 h-3" />
                          </button>
                          <span className="absolute bottom-1 left-1 px-1.5 py-0.2 rounded bg-black/60 text-[9px] text-white font-bold">
                            Foto {idx + 1}
                          </span>
                        </div>
                      ))}

                      {handoverPhotos.length < 3 && (
                        <div
                          onClick={() => handoverFileRef.current?.click()}
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setIsDraggingHandover(true);
                          }}
                          onDragLeave={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setIsDraggingHandover(false);
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setIsDraggingHandover(false);
                            processImageFiles(e.dataTransfer.files, handoverPhotos, setHandoverPhotos, "Foto Baseline");
                          }}
                          className={`w-20 h-20 rounded-xl border-2 border-dashed flex flex-col items-center justify-center text-slate-400 hover:border-[#1683FF] hover:text-[#1683FF] transition cursor-pointer ${
                            isDraggingHandover ? "border-[#1683FF] bg-blue-50/90 text-[#1683FF]" : "border-slate-200 bg-slate-50"
                          }`}
                        >
                          <Plus className="w-5 h-5 mb-0.5" />
                          <span className="text-[9px] font-bold">Tambah</span>
                        </div>
                      )}
                    </div>
                    {handoverPhotos.length >= 3 && (
                      <p className="text-[10px] text-slate-400 italic">
                        Batas maksimal 3 foto telah tercapai.
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Catatan Kondisi Fisik <span className="text-rose-500 font-bold ml-0.5">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  value={handoverNotes}
                  onChange={(e) => setHandoverNotes(e.target.value)}
                  placeholder="Kondisi unit, aksesoris lengkap, fungsi normal..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-[#1683FF] outline-none"
                />
              </div>

              <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl space-y-2 text-xs text-slate-700">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checklistIdConfirmed}
                    onChange={(e) => setChecklistIdConfirmed(e.target.checked)}
                    className="rounded text-[#1683FF]"
                  />
                  <span>Identitas penyewa (KTP/SIM) telah diperiksa &amp; dicatat</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checklistConditionConfirmed}
                    onChange={(e) => setChecklistConditionConfirmed(e.target.checked)}
                    className="rounded text-[#1683FF]"
                  />
                  <span>Kondisi fisik &amp; fungsi telah diuji bersama sebelum diserahkan</span>
                </label>
              </div>

              <div className="flex gap-2 justify-end pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={!checklistIdConfirmed || !checklistConditionConfirmed}
                  className="px-5 py-2 bg-[#1683FF] hover:bg-[#0F6FE5] text-white rounded-xl text-xs font-bold shadow-xs disabled:opacity-50"
                >
                  Konfirmasi Serah Terima
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: SEWA PENGEMBALIAN UNIT */}
      {activeModal === "return" && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#1683FF] flex items-center justify-center">
                  <RefreshCw className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">Verifikasi Pengembalian Unit</h3>
                  <p className="text-[11px] text-slate-500">Konfirmasi pengembalian unit &amp; penyelesaian masa sewa</p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setActiveModal(null)} 
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRentalReturnSubmit} className="space-y-4">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Unit Sewa:</span>
                  <span className="font-semibold text-slate-800">{itemTitle}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Deposit Jaminan:</span>
                  <span className="font-bold text-[#1683FF]">
                    {formatIDR(room?.depositAmount || room?.rentalDetails?.depositFee || 500000)}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-200">
                  Setelah diverifikasi, deposit jaminan akan diproses kembali ke rekening penyewa dan hak sewa diteruskan ke saldo mitra.
                </p>
              </div>

              <div className="flex gap-2 justify-end pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#1683FF] hover:bg-[#0F6FE5] text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                >
                  Konfirmasi Pengembalian
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: SEWA REVIEW & RATING TOKO */}
      {activeModal === "review" && transactionType === "sewa" && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center">
                  <Star className="w-4 h-4 fill-amber-400" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">Beri Rating Toko Mitra</h3>
                  <p className="text-[11px] text-slate-500">Ulasan Anda membantu kualitas mitra penyedia sewa</p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setActiveModal(null)} 
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRentalReviewSubmit} className="space-y-4">
              <div className="flex flex-col items-center py-2 space-y-1">
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Rating Toko Mitra <span className="text-rose-500 font-bold ml-0.5">*</span>
                </label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setSelectedRating(star)}
                      className="p-1 transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-7 h-7 ${
                          (hoverRating || selectedRating) >= star
                            ? "fill-amber-400 text-amber-400"
                            : "text-slate-200"
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <span className="text-xs font-bold text-slate-700">
                  {selectedRating === 5 ? "Sempurna (5/5)" :
                   selectedRating === 4 ? "Sangat Baik (4/5)" :
                   selectedRating === 3 ? "Cukup Baik (3/5)" : "Kurang Puas"}
                </span>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Komentar &amp; Ulasan <span className="text-rose-500 font-bold ml-0.5">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Kondisi alat sangat bagus, toko ramah dan responsif..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-[#1683FF] outline-none"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#1683FF] hover:bg-[#0F6FE5] text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                >
                  Kirim Ulasan &amp; Selesaikan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: JASA SERAHKAN HASIL KERJA (DELIVERABLES) */}
      {activeModal === "deliverables" && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#1683FF] flex items-center justify-center">
                  <Upload className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">Serahkan Hasil Pekerjaan Jasa</h3>
                  <p className="text-[11px] text-slate-500">Unggah berkas digital atau cantumkan tautan Google Drive / Cloud</p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setActiveModal(null)} 
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitDeliverables} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Tautan Cloud / Drive (Opsional)</label>
                <input
                  type="url"
                  value={submissionUrl}
                  onChange={(e) => setSubmissionUrl(e.target.value)}
                  placeholder="https://drive.google.com/drive/folders/..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-[#1683FF] outline-none"
                />
              </div>

              <div>
                <input
                  type="file"
                  ref={deliverablesFileRef}
                  onChange={handleDeliverablesFilesSelected}
                  className="hidden"
                  multiple
                />
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Daftar Berkas Digital <span className="text-rose-500 font-bold ml-0.5">*</span>
                </label>
                <div className="space-y-1.5 mb-2">
                  {digitalFiles.map((file) => (
                    <div key={file.id} className="p-2 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 truncate">
                        <FileText className="w-4 h-4 text-[#1683FF] shrink-0" />
                        <span className="font-semibold text-slate-700 truncate">{file.name}</span>
                        <span className="text-[10px] text-slate-400 shrink-0">({file.size})</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setDigitalFiles((prev) => prev.filter((f) => f.id !== file.id))}
                        className="text-slate-400 hover:text-rose-500 p-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => deliverablesFileRef.current?.click()}
                  className="w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-xs text-slate-500 hover:border-[#1683FF] hover:text-[#1683FF] transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambahkan Berkas Pekerjaan</span>
                </button>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Catatan Serah Terima <span className="text-rose-500 font-bold ml-0.5">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={deliverableNotes}
                  onChange={(e) => setDeliverableNotes(e.target.value)}
                  placeholder="Deskripsikan hasil pekerjaan yang telah diselesaikan..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-[#1683FF] outline-none"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-[#1683FF] hover:bg-[#0F6FE5] text-white rounded-xl text-xs font-bold shadow-xs disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  <span>Kirim Hasil Kerja</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: JASA PERMINTAAN REVISI */}
      {activeModal === "revision" && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <RefreshCw className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">Ajukan Catatan Revisi</h3>
                  <p className="text-[11px] text-slate-500">Berikan instruksi perbaikan yang jelas untuk mitra</p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setActiveModal(null)} 
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRequestRevision} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Catatan Revisi <span className="text-rose-500 font-bold ml-0.5">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={revisionNotes}
                  onChange={(e) => setRevisionNotes(e.target.value)}
                  placeholder="Contoh: Tolong revisi bagian warna latar belakang menjadi lebih terang dan sesuaikan teks judul..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-[#1683FF] outline-none"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                >
                  Kirim Catatan Revisi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: JASA APPROVE & REVIEW */}
      {activeModal === "review" && transactionType === "jasa" && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#1683FF] flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">Setujui Hasil &amp; Beri Ulasan</h3>
                  <p className="text-[11px] text-slate-500">Dana escrow akan diteruskan ke saldo mitra penyedia</p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setActiveModal(null)} 
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmJasaCompletion} className="space-y-4">
              <div className="flex flex-col items-center py-2 space-y-1">
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Rating Pekerjaan <span className="text-rose-500 font-bold ml-0.5">*</span>
                </label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setSelectedRating(star)}
                      className="p-1 transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-7 h-7 ${
                          (hoverRating || selectedRating) >= star
                            ? "fill-amber-400 text-amber-400"
                            : "text-slate-200"
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <span className="text-xs font-bold text-slate-700">
                  {selectedRating === 5 ? "Sangat Memuaskan (5/5)" :
                   selectedRating === 4 ? "Bagus (4/5)" :
                   selectedRating === 3 ? "Cukup (3/5)" : "Perlu Peningkatan"}
                </span>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Ulasan Pekerjaan <span className="text-rose-500 font-bold ml-0.5">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Hasil kerja sangat rapi, komunikasi responsif, terima kasih..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-[#1683FF] outline-none"
                />
              </div>

              <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-2xl text-xs space-y-1">
                <div className="flex justify-between text-slate-600">
                  <span>Pencairan Dana Escrow:</span>
                  <span className="font-bold text-[#1683FF]">
                    {formatIDR(room?.helperPayoutAmount || room?.lockedAmount || 150000)}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Dana diteruskan otomatis ke rekening/dompet mitra tanpa potongan biaya tambahan.
                </p>
              </div>

              <div className="flex gap-2 justify-end pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-[#1683FF] hover:bg-[#0F6FE5] text-white rounded-xl text-xs font-bold shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? "Memproses..." : "Setujui & Selesaikan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: BANTUAN KIRIM BUKTI TUGAS */}
      {activeModal === "task_proof" && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#1683FF] flex items-center justify-center">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">Kirim Bukti Tugas Selesai</h3>
                  <p className="text-[11px] text-slate-500">Unggah foto bukti tugas telah dituntaskan di lokasi</p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setActiveModal(null)} 
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitTaskProof} className="space-y-4">
              <div>
                <input
                  type="file"
                  ref={taskProofFileRef}
                  onChange={handleTaskProofFilesSelected}
                  accept="image/png, image/jpeg, image/jpg, image/webp, image/gif"
                  className="hidden"
                  multiple
                />
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    Foto Bukti Tugas <span className="text-rose-500 font-bold ml-0.5">*</span>
                  </label>
                  <span className="text-[11px] font-semibold text-slate-400">
                    {taskProofPhotos.length}/3 Foto
                  </span>
                </div>

                {taskProofPhotos.length === 0 ? (
                  <div
                    onClick={() => taskProofFileRef.current?.click()}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsDraggingTaskProof(true);
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsDraggingTaskProof(false);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsDraggingTaskProof(false);
                      processImageFiles(e.dataTransfer.files, taskProofPhotos, setTaskProofPhotos, "Foto Bukti");
                    }}
                    className={`border-2 border-dashed rounded-2xl p-4 text-center transition cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
                      isDraggingTaskProof
                        ? "border-[#1683FF] bg-blue-50/90 scale-[1.01]"
                        : "border-slate-200 bg-slate-50/60 hover:bg-blue-50/50 hover:border-[#1683FF]"
                    }`}
                  >
                    <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#1683FF] flex items-center justify-center">
                      <Camera className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-700">
                        {isDraggingTaskProof ? "Lepaskan foto bukti di sini" : "Tarik & lepas foto bukti ke sini, atau klik untuk memilih"}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Hanya format gambar (PNG, JPG, WebP) • Maksimal 3 foto
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                      {taskProofPhotos.map((url, idx) => (
                        <div key={idx} className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-200 shadow-2xs group">
                          <img src={url} alt={`Bukti ${idx}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setTaskProofPhotos((p) => p.filter((_, i) => i !== idx))}
                            className="absolute top-1 right-1 p-1 bg-black/60 text-white rounded-md hover:bg-rose-600 transition cursor-pointer"
                            title="Hapus foto"
                          >
                            <X className="w-3 h-3" />
                          </button>
                          <span className="absolute bottom-1 left-1 px-1.5 py-0.2 rounded bg-black/60 text-[9px] text-white font-bold">
                            Foto {idx + 1}
                          </span>
                        </div>
                      ))}

                      {taskProofPhotos.length < 3 && (
                        <div
                          onClick={() => taskProofFileRef.current?.click()}
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setIsDraggingTaskProof(true);
                          }}
                          onDragLeave={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setIsDraggingTaskProof(false);
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setIsDraggingTaskProof(false);
                            processImageFiles(e.dataTransfer.files, taskProofPhotos, setTaskProofPhotos, "Foto Bukti");
                          }}
                          className={`w-20 h-20 rounded-xl border-2 border-dashed flex flex-col items-center justify-center text-slate-400 hover:border-[#1683FF] hover:text-[#1683FF] transition cursor-pointer ${
                            isDraggingTaskProof ? "border-[#1683FF] bg-blue-50/90 text-[#1683FF]" : "border-slate-200 bg-slate-50"
                          }`}
                        >
                          <Plus className="w-5 h-5 mb-0.5" />
                          <span className="text-[9px] font-bold">Tambah</span>
                        </div>
                      )}
                    </div>
                    {taskProofPhotos.length >= 3 && (
                      <p className="text-[10px] text-slate-400 italic">
                        Batas maksimal 3 foto telah tercapai.
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Catatan Penyelesaian <span className="text-rose-500 font-bold ml-0.5">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={deliverableNotes}
                  onChange={(e) => setDeliverableNotes(e.target.value)}
                  placeholder="Tugas telah selesai dilaksanakan sesuai instruksi pemesan..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-[#1683FF] outline-none"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-[#1683FF] hover:bg-[#0F6FE5] text-white rounded-xl text-xs font-bold shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? "Mengirim..." : "Kirim Bukti Tugas"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: BANTUAN KONFIRMASI SELESAI & RATING */}
      {activeModal === "task_completion" && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-start justify-center overflow-y-auto px-4 pt-20 pb-6">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 flex flex-col">
            {/* Header — fixed */}
            <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#1683FF] flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">Konfirmasi Tugas Selesai</h3>
                  <p className="text-[11px] text-slate-500">Imbalan akan diteruskan ke saldo dompet helper</p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setActiveModal(null)} 
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmTaskCompletion} className="px-5 pb-4 space-y-4">
              <div className="pt-4 space-y-4">

              {/* BUKTI PENYELESAIAN TUGAS — foto & catatan dari helper */}
              {(() => {
                const proofPhotos = (() => {
                  const all = [];
                  if (room?.proofPhotos?.length) all.push(...room.proofPhotos);
                  if (room?.messages?.length) {
                    room.messages.forEach((m) => {
                      if (m.proofPhotos?.length) all.push(...m.proofPhotos);
                      if (m.photos?.length && (m.isTaskProof || m.isHandoverProof)) all.push(...m.photos);
                    });
                  }
                  return Array.from(new Set(all.filter(Boolean)));
                })();
                const proofNotes = room?.proofNotes || (() => {
                  const msg = room?.messages?.find((m) => (m.isTaskProof || m.isHandoverProof) && m.notes);
                  return msg?.notes || "";
                })();

                return (
                  <div className="p-3.5 bg-blue-50/70 rounded-2xl border border-blue-200/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-[#1683FF]">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>Bukti Penyelesaian Tugas</span>
                      </div>
                      {proofPhotos.length > 0 && (
                        <span className="text-[10px] font-semibold text-slate-600 bg-white px-2 py-0.5 rounded-full border border-blue-100">
                          {proofPhotos.length} Foto Bukti
                        </span>
                      )}
                    </div>

                    {proofPhotos.length > 0 ? (
                      <div className="grid grid-cols-3 gap-2 pt-1">
                        {proofPhotos.map((imgUrl, pIdx) => (
                          <a
                            key={pIdx}
                            href={imgUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="relative group aspect-video rounded-xl overflow-hidden border border-blue-200 bg-slate-900/10 cursor-pointer shadow-xs block"
                          >
                            <img
                              src={imgUrl}
                              alt={`Bukti Tugas ${pIdx + 1}`}
                              className="w-full h-full object-cover group-hover:scale-105 transition"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-[10px] font-bold gap-1">
                              <Eye className="w-3 h-3" />
                              <span>Lihat</span>
                            </div>
                          </a>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-500 italic bg-white/80 p-2.5 rounded-xl border border-blue-100">
                        Helper telah menyatakan tugas selesai. Tinjau percakapan untuk detail.
                      </p>
                    )}

                    {proofNotes && (
                      <div className="text-xs bg-white p-2.5 rounded-xl border border-blue-100 leading-relaxed">
                        <span className="font-bold text-slate-800 text-[11px] block mb-0.5">Catatan Helper:</span>
                        <p className="italic text-slate-600 text-[11px]">&ldquo;{proofNotes}&rdquo;</p>
                      </div>
                    )}
                  </div>
                );
              })()}

              <div className="flex flex-col items-center py-2 space-y-1">
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Rating untuk Helper <span className="text-rose-500 font-bold ml-0.5">*</span>
                </label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setSelectedRating(star)}
                      className="p-1 transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-7 h-7 ${
                          (hoverRating || selectedRating) >= star
                            ? "fill-amber-400 text-amber-400"
                            : "text-slate-200"
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <span className="text-xs font-bold text-slate-700">
                  {selectedRating === 5 ? "Sangat Membantu (5/5)" :
                   selectedRating === 4 ? "Baik & Cepat (4/5)" :
                   selectedRating === 3 ? "Cukup Baik (3/5)" : "Kurang Memuaskan"}
                </span>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Ulasan untuk Helper <span className="text-rose-500 font-bold ml-0.5">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Helper sangat cekatan, ramah, dan tepat waktu..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-[#1683FF] outline-none"
                />
              </div>

              <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-2xl text-xs space-y-1">
                <div className="flex justify-between text-slate-600">
                  <span>Pencairan Imbalan:</span>
                  <span className="font-bold text-[#1683FF]">
                    {formatIDR(room?.helperPayoutAmount || room?.lockedAmount || 35000)}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Dana akan diteruskan 100% ke saldo helper Bantuin.id.
                </p>
              </div>

              </div>{/* end body */}

              {/* Footer */}
              <div className="flex gap-2 justify-end px-5 py-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-[#1683FF] hover:bg-[#0F6FE5] text-white rounded-xl text-xs font-bold shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? "Memproses..." : "Konfirmasi Selesai & Bayar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
