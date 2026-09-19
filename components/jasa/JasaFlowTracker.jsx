"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { formatIDR } from "@/lib/utils";
import { useApp } from "@/lib/context/AppContext";
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  Star,
  RefreshCw,
  AlertCircle,
  HelpCircle,
  MapPin,
  Calendar,
  Sparkles,
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
  Paperclip
} from "lucide-react";
import {
  QrisLogo,
  BcaLogo,
  MandiriLogo,
  BriLogo,
  BniLogo,
  BantuinPayLogo
} from "@/components/ui/PaymentBankLogos";

export default function JasaFlowTracker({ room, activeRole = "requester" }) {
  const {
    updateOrderStatus,
    submitProof,
    confirmOrderCompletion,
    sendChatMessage,
    currentUser,
    addToast
  } = useApp();

  const [isExpanded, setIsExpanded] = useState(true);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isDeliverablesModalOpen, setIsDeliverablesModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isRevisionModalOpen, setIsRevisionModalOpen] = useState(false);

  // Deliverables form state
  const [submissionUrl, setSubmissionUrl] = useState(room?.submissionUrl || "");
  const [deliverableNotes, setDeliverableNotes] = useState("");
  const [digitalFiles, setDigitalFiles] = useState(room?.digitalFiles || []);
  const [isSubmittingWork, setIsSubmittingWork] = useState(false);
  const fileInputRef = useRef(null);

  // Review modal state
  const [selectedRating, setSelectedRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [hoverRating, setHoverRating] = useState(0);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Revision modal state
  const [revisionNotes, setRevisionNotes] = useState("");

  // Payment modal state
  const [selectedMethod, setSelectedMethod] = useState("qris");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isCopiedVA, setIsCopiedVA] = useState(false);
  const [isCopiedNominal, setIsCopiedNominal] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15 * 60);

  useEffect(() => {
    if (!isPaymentModalOpen) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [isPaymentModalOpen]);

  const formatTimer = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const isInquiry = Boolean(
    room?.stage === "inquiry" ||
    room?.orderStatus === "inquiry" ||
    room?.id?.startsWith("inquiry-")
  );
  const isNotSelected = room?.orderStatus === "not_selected";
  const isCompleted = room?.orderStatus === "completed";
  const isProofSubmitted = room?.orderStatus === "proof_submitted";
  const isInProgress = room?.orderStatus === "in_progress";
  const isPaidEscrow = room?.orderStatus === "paid_escrow" || room?.orderStatus === "room_created";

  // 5 Milestones (Format persis seperti Sewa)
  const steps = [
    {
      id: "inquiry",
      number: 1,
      title: "Tanya Mitra",
      isComplete: !isInquiry && !isNotSelected,
      isActive: isInquiry,
    },
    {
      id: "paid_escrow",
      number: 2,
      title: "Bayar Escrow",
      isComplete: ["in_progress", "proof_submitted", "completed"].includes(room.orderStatus),
      isActive: isPaidEscrow,
    },
    {
      id: "in_progress",
      number: 3,
      title: "Pengerjaan",
      isComplete: ["proof_submitted", "completed"].includes(room.orderStatus),
      isActive: isInProgress,
    },
    {
      id: "proof_submitted",
      number: 4,
      title: "Serah Hasil",
      isComplete: isCompleted,
      isActive: isProofSubmitted,
    },
    {
      id: "completed",
      number: 5,
      title: "Selesai & Rating",
      isComplete: isCompleted,
      isActive: isCompleted,
    },
  ];

  // Helper title & package description
  const serviceTitle = room?.serviceDetails?.serviceTitle || room?.requestTitle || "Layanan Jasa";
  const packageName = room?.serviceDetails?.packageName || room?.packageId || (room?.category ? `${room.category}` : "Paket Standar");
  const lockedPrice = room?.lockedAmount || room?.serviceDetails?.totalAmount || 150000;

  // Copy helper
  const handleCopy = (text, type = "va") => {
    navigator.clipboard?.writeText(text);
    if (type === "va") {
      setIsCopiedVA(true);
      addToast?.("Nomor VA Disalin", "Nomor Virtual Account telah disalin ke clipboard.");
      setTimeout(() => setIsCopiedVA(false), 2000);
    } else {
      setIsCopiedNominal(true);
      addToast?.("Nominal Disalin", `Nominal ${formatIDR(text)} telah disalin.`);
      setTimeout(() => setIsCopiedNominal(false), 2000);
    }
  };

  // 1. Mitra mulai pengerjaan
  const handleStartWorking = () => {
    updateOrderStatus(room.id, "in_progress");
    sendChatMessage(
      room.id,
      "Halo! Pembayaran Escrow telah terkonfirmasi aman. Saya telah memulai proses pengerjaan pesanan ini sesuai kesepakatan brief.",
      { isSystemAnnouncement: true }
    );
    addToast?.("Pengerjaan Dimulai", "Status pesanan telah diperbarui menjadi Sedang Dikerjakan.");
  };

  // 2. Upload file pendukung hasil kerja
  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const newFiles = files.map((f) => ({
      id: `file-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: f.name,
      size: f.size > 1024 * 1024 ? `${(f.size / (1024 * 1024)).toFixed(2)} MB` : `${(f.size / 1024).toFixed(1)} KB`,
      type: f.type,
      uploadedAt: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
    }));
    setDigitalFiles((prev) => [...prev, ...newFiles]);
  };

  const handleUseSampleDeliverables = () => {
    setSubmissionUrl("https://drive.google.com/drive/folders/1Bantuin-Project-Final-Assets?usp=sharing");
    setDigitalFiles([
      {
        id: "file-sample-1",
        name: "Final_Design_Assets_HighRes.png",
        size: "3.4 MB",
        type: "image/png",
        uploadedAt: "Baru saja",
      },
      {
        id: "file-sample-2",
        name: "Master_Vector_Source.zip",
        size: "16.8 MB",
        type: "application/zip",
        uploadedAt: "Baru saja",
      }
    ]);
    if (!deliverableNotes) {
      setDeliverableNotes("Seluruh file desain master resolusi tinggi (PNG transparan, JPG, dan berkas vector ZIP) telah siap diunduh pada tautan Google Drive di atas.");
    }
  };

  // 3. Submit Deliverables
  const handleSubmitWork = (e) => {
    e.preventDefault();
    setIsSubmittingWork(true);

    const filesToSubmit = digitalFiles.length > 0 ? digitalFiles : [
      {
        id: `df-${Date.now()}`,
        name: "Hasil_Pekerjaan_Final.zip",
        size: "4.2 MB",
        type: "application/zip",
        uploadedAt: "Baru saja"
      }
    ];

    const finalNotes = deliverableNotes || "Pekerjaan telah selesai dikerjakan sesuai brief pesanan. Silakan diperiksa berkas dan tautan di atas.";

    setTimeout(() => {
      submitProof(room.id, {
        digitalFiles: filesToSubmit,
        submissionUrl: submissionUrl || "https://drive.google.com/drive/folders/sample",
        notes: finalNotes
      }, finalNotes);

      // Kirim pesan bot resmi dengan format Deliverables Card yang cantik
      sendChatMessage(
        room.id,
        "Penyedia jasa telah menyerahkan hasil pekerjaan & berkas digital. Klien dapat memeriksa berkas lalu menekan 'Setujui & Selesaikan' jika sudah sesuai, atau 'Minta Revisi' jika ada perubahan.",
        {
          isJasaDeliverablesProof: true,
          proofData: {
            serviceTitle: serviceTitle,
            packageName: packageName,
            submissionUrl: submissionUrl || "https://drive.google.com/drive/folders/sample",
            files: filesToSubmit,
            notes: finalNotes,
            submittedAt: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
          }
        }
      );

      setIsSubmittingWork(false);
      setIsDeliverablesModalOpen(false);
      addToast?.("Hasil Kerja Diserahkan", "Klien telah menerima notifikasi untuk memeriksa hasil pekerjaan.");
    }, 800);
  };

  // 4. Konfirmasi Selesai & Rating
  const handleConfirmCompletion = (e) => {
    e.preventDefault();
    setIsSubmittingReview(true);

    setTimeout(() => {
      confirmOrderCompletion(room.id, {
        rating: selectedRating,
        feedback: reviewComment || "Pelayanan sangat memuaskan, hasil kerja rapi dan tepat waktu!"
      });

      // Kirim pengumuman penyelesaian transaksi
      sendChatMessage(
        room.id,
        `Pesanan telah disetujui & dikonfirmasi selesai oleh pemesan! Dana imbalan sebesar ${formatIDR(room.helperPayoutAmount || lockedPrice)} telah otomatis dicairkan ke saldo mitra. Rating diberikan: ⭐ ${selectedRating}/5. Terima kasih telah menggunakan Bantuin.id!`,
        {
          isJasaCompletion: true,
          completionData: {
            serviceTitle: serviceTitle,
            rating: selectedRating,
            feedback: reviewComment || "Pelayanan sangat memuaskan, hasil kerja rapi dan tepat waktu!",
            payoutAmount: room.helperPayoutAmount || lockedPrice,
            completedAt: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
          }
        }
      );

      setIsSubmittingReview(false);
      setIsReviewModalOpen(false);
      addToast?.("Pesanan Selesai", "Dana berhasil diteruskan ke saldo mitra. Terima kasih atas ulasan Anda!");
    }, 800);
  };

  // 5. Minta Revisi
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
    setIsRevisionModalOpen(false);
    addToast?.("Revisi Diajukan", "Catatan revisi telah dikirimkan ke ruang obrolan mitra.");
  };

  // 6. Eksekusi Pembayaran Escrow dari Chat (untuk inquiry)
  const handleExecutePayment = (e) => {
    e.preventDefault();
    setIsProcessingPayment(true);

    setTimeout(() => {
      setIsProcessingPayment(false);
      setIsPaymentModalOpen(false);
      updateOrderStatus(room.id, "paid_escrow");
      sendChatMessage(
        room.id,
        `Dana sebesar ${formatIDR(lockedPrice)} telah berhasil dikunci di Rekening Bersama (Escrow) Bantuin melalui metode ${selectedMethod.toUpperCase()}. Mitra dapat segera memulai pengerjaan tugas!`,
        { isSystemAnnouncement: true }
      );
      addToast?.("Escrow Terkunci!", "Pembayaran berhasil diamankan di Rekber Bantuin.");
    }, 1200);
  };

  const vaNumbers = {
    bca_va: "8802918291028371",
    mandiri_va: "8920199201928374",
    bri_va: "8801728192038172",
    bni_va: "8271019283819201"
  };

  return (
    <div className="bg-white border-b border-slate-200/90 shadow-2xs shrink-0">
      
      {/* 1. COMPACT TOOLBAR (Always Visible, Height ~46px) */}
      <div className="px-3 sm:px-4 py-2 bg-slate-50 flex items-center justify-between gap-2 border-b border-slate-200">
        
        {/* Left: Step Badge + Service & Package Title */}
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold shrink-0 flex items-center gap-1.5 ${
            isCompleted 
              ? "bg-slate-100 text-slate-700 border border-slate-200" 
              : "bg-blue-50 text-[#1683FF] border border-blue-200"
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
              isCompleted ? "bg-slate-400" : "bg-[#1683FF] animate-pulse"
            }`} />
            <span>
              {isInquiry ? "Tahap 1: Konsultasi" :
               isPaidEscrow ? "Tahap 2: Siap Dikerjakan" :
               isInProgress ? "Tahap 3: Sedang Dikerjakan" :
               isProofSubmitted ? "Tahap 4: Review Klien" : "Tahap 5: Selesai"}
            </span>
          </span>

          <div className="flex items-center gap-1.5 min-w-0 text-xs">
            <span className="font-extrabold text-slate-900 truncate max-w-[130px] sm:max-w-[220px] md:max-w-[300px]">
              {serviceTitle}
            </span>
            <span className="text-[11px] text-slate-400 hidden sm:inline">•</span>
            <span className="text-[11px] text-slate-500 hidden sm:inline truncate">
              {packageName}
            </span>
          </div>
        </div>

        {/* Right: Escrow Amount + Primary Action Button + Toggle Expand */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 shadow-2xs">
            <ShieldCheck className="w-3.5 h-3.5 text-[#1683FF]" />
            <span>Escrow: <strong>{formatIDR(lockedPrice)}</strong></span>
            <span className="text-[10px] text-[#1683FF] font-bold bg-blue-50 px-1.5 py-0.5 rounded">Aman di Rekber</span>
          </div>

          {/* Primary Action Buttons based on stage & role */}
          {isInquiry && (
            activeRole === "requester" ? (
              <button
                type="button"
                onClick={() => setIsPaymentModalOpen(true)}
                className="px-3 py-1.5 rounded-lg bg-[#1683FF] hover:bg-[#0F6FE5] text-white text-xs font-bold shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <Lock className="w-3 h-3" />
                <span>Bayar Escrow</span>
              </button>
            ) : (
              <span className="px-2.5 py-1 bg-blue-50 text-[#1683FF] border border-blue-200 rounded-lg text-[11px] font-bold">
                Menunggu Pembayaran Klien
              </span>
            )
          )}

          {isPaidEscrow && (
            activeRole === "helper" ? (
              <button
                type="button"
                onClick={handleStartWorking}
                className="px-3 py-1.5 rounded-lg bg-[#1683FF] hover:bg-[#0F6FE5] text-white text-xs font-bold shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-3 h-3" />
                <span>Mulai Pengerjaan</span>
              </button>
            ) : (
              <span className="px-2.5 py-1 bg-blue-50 text-[#1683FF] border border-blue-200 rounded-lg text-[11px] font-bold flex items-center gap-1">
                <Clock className="w-3 h-3 animate-spin" />
                <span>Dana Terkunci di Escrow</span>
              </span>
            )
          )}

          {isInProgress && (
            activeRole === "helper" ? (
              <button
                type="button"
                onClick={() => setIsDeliverablesModalOpen(true)}
                className="px-3 py-1.5 rounded-lg bg-[#1683FF] hover:bg-[#0F6FE5] text-white text-xs font-bold shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <Upload className="w-3 h-3" />
                <span>Kirim Hasil Kerja</span>
              </button>
            ) : (
              <span className="px-2.5 py-1 bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-[11px] font-semibold flex items-center gap-1">
                <Clock className="w-3 h-3 text-[#1683FF]" />
                <span>Mitra Sedang Mengerjakan</span>
              </span>
            )
          )}

          {isProofSubmitted && (
            activeRole === "requester" ? (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsRevisionModalOpen(true)}
                  className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition cursor-pointer"
                >
                  Minta Revisi
                </button>
                <button
                  type="button"
                  onClick={() => setIsReviewModalOpen(true)}
                  className="px-3 py-1.5 rounded-lg bg-[#1683FF] hover:bg-[#0F6FE5] text-white text-xs font-bold shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Setujui & Selesaikan</span>
                </button>
              </div>
            ) : (
              <span className="px-2.5 py-1 bg-blue-50 text-[#1683FF] border border-blue-200 rounded-lg text-[11px] font-bold flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>Menunggu Review Klien</span>
              </span>
            )
          )}

          {isCompleted && (
            <div className="flex items-center gap-1.5">
              <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 border border-slate-200 text-xs font-bold flex items-center gap-1">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                <span>Pesanan Selesai</span>
              </span>
            </div>
          )}

          {/* Expand/Collapse Roadmap */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-2 py-1 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 text-[11px] font-semibold flex items-center gap-1 transition cursor-pointer"
            title={isExpanded ? "Sembunyikan Peta Alur" : "Buka Peta Alur Jasa"}
          >
            <span className="hidden xs:inline">{isExpanded ? "Tutup" : "Alur"}</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

      </div>

      {/* 2. EXPANDABLE SECTION (Stepper roadmap matching Sewa) */}
      {isExpanded && (
        <div className="bg-slate-50/90 border-b border-slate-200 p-4 space-y-3 animate-in slide-in-from-top-2 duration-150">
          
          {/* Stepper Roadmap */}
          <div className="flex items-center justify-between max-w-3xl mx-auto relative pt-1 pb-2">
            <div className="absolute top-4 left-6 right-6 h-0.5 bg-slate-200 -z-0" />
            <div 
              className="absolute top-4 left-6 h-0.5 bg-[#1683FF] transition-all duration-500 -z-0"
              style={{
                width: isInquiry ? "10%" :
                       isPaidEscrow ? "35%" :
                       isInProgress ? "65%" :
                       isProofSubmitted ? "85%" : "100%"
              }}
            />

            {steps.map((step) => (
              <div key={step.id} className="flex flex-col items-center text-center relative z-10">
                <div 
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-xs ${
                    step.isComplete
                      ? "bg-slate-900 text-white"
                      : step.isActive
                      ? "bg-[#1683FF] text-white shadow-blue-500/30 ring-2 ring-blue-100 animate-pulse"
                      : "bg-white text-slate-400 border-2 border-slate-200"
                  }`}
                >
                  {step.isComplete ? <CheckCircle2 className="w-4 h-4" /> : <span>{step.number}</span>}
                </div>
                <div className="mt-1">
                  <div className={`text-[10px] font-bold tracking-tight ${
                    step.isActive ? "text-[#1683FF]" : step.isComplete ? "text-slate-800" : "text-slate-400"
                  }`}>
                    {step.title}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Guidelines Box */}
          <div className="max-w-3xl mx-auto p-2.5 bg-white rounded-xl border border-slate-200 text-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-slate-600 truncate min-w-0">
              <MapPin className="w-3.5 h-3.5 text-[#1683FF] shrink-0" />
              <span className="text-[11px] truncate">
                {room?.mode === "online" ? "Workroom Digital: " : "Titik Lokasi: "}
                <strong className="text-slate-800">{room?.serviceDetails?.alamat || room?.pickupPoint || "Online Workroom (Berkas Digital)"}</strong>
                {" • Mitra: "}
                <strong className="text-slate-800">{room.helper?.name}</strong>
              </span>
            </div>
            <div className="text-[11px] text-slate-500 shrink-0">
              Jaminan: <strong className="text-slate-800">Rekber Escrow 100% Aman</strong>
            </div>
          </div>

        </div>
      )}

      {/* ================================================================ */}
      {/* MODAL 1: SERAHKAN HASIL KERJA (DELIVERABLES MODAL)                */}
      {/* ================================================================ */}
      {isDeliverablesModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#1683FF] flex items-center justify-center">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">Kirim Hasil Pekerjaan</h3>
                  <p className="text-xs text-slate-500">Serahkan draft/final file untuk diperiksa pemesan</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDeliverablesModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitWork} className="space-y-3.5 text-xs">
              
              {/* Tautan File Online / Google Drive / Figma */}
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Tautan File / Cloud Drive (Google Drive, Figma, Dropbox, dll):
                </label>
                <input
                  type="url"
                  value={submissionUrl}
                  onChange={(e) => setSubmissionUrl(e.target.value)}
                  placeholder="https://drive.google.com/drive/folders/..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#1683FF] bg-slate-50/50"
                />
              </div>

              {/* Lampirkan Berkas Langsung */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-800">Lampiran Berkas Digital:</label>
                  <button
                    type="button"
                    onClick={handleUseSampleDeliverables}
                    className="text-[11px] font-bold text-[#1683FF] hover:underline cursor-pointer"
                  >
                    + Contoh Berkas Demo
                  </button>
                </div>

                <input
                  type="file"
                  multiple
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                />

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="p-4 rounded-xl border-2 border-dashed border-slate-200 hover:border-[#1683FF] bg-slate-50/60 hover:bg-blue-50/30 text-center cursor-pointer transition"
                >
                  <Upload className="w-5 h-5 text-slate-400 mx-auto mb-1" />
                  <span className="font-bold text-slate-700 block">Klik untuk pilih file dari perangkat</span>
                  <span className="text-[10px] text-slate-400">Mendukung format ZIP, PDF, PNG, JPG, DOCX (Maks 50MB)</span>
                </div>

                {digitalFiles.length > 0 && (
                  <div className="mt-2 space-y-1.5 max-h-32 overflow-y-auto">
                    {digitalFiles.map((f, i) => (
                      <div key={i} className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className="w-3.5 h-3.5 text-[#1683FF] shrink-0" />
                          <span className="font-semibold text-slate-800 truncate text-[11px]">{f.name}</span>
                          <span className="text-[10px] text-slate-400 shrink-0">({f.size})</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setDigitalFiles((prev) => prev.filter((_, idx) => idx !== i))}
                          className="text-slate-400 hover:text-rose-500 p-0.5"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Catatan / Pesan untuk Klien */}
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Catatan Pengerjaan untuk Pemesan:
                </label>
                <textarea
                  rows={3}
                  value={deliverableNotes}
                  onChange={(e) => setDeliverableNotes(e.target.value)}
                  placeholder="Jelaskan apa saja yang telah diselesaikan, instruksi pembukaan berkas, atau revisi yang telah diimplementasikan..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-[#1683FF]"
                />
              </div>

              {/* Escrow note */}
              <div className="p-3 rounded-xl bg-blue-50 border border-blue-100 flex items-start gap-2 text-[11px] text-blue-900">
                <ShieldCheck className="w-4 h-4 text-[#1683FF] shrink-0 mt-0.5" />
                <span>
                  Setelah Anda mengirimkan berkas, pemesan akan diberi waktu untuk meninjau. Dana imbalan sebesar <strong>{formatIDR(room.helperPayoutAmount || lockedPrice)}</strong> akan otomatis dicairkan ke saldo Anda begitu disetujui.
                </span>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsDeliverablesModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 font-bold text-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingWork}
                  className="px-5 py-2.5 rounded-xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white font-bold flex items-center gap-1.5 shadow-xs"
                >
                  {isSubmittingWork ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Mengirimkan...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Kirim Hasil Kerja Sekarang</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* MODAL 2: KONFIRMASI SELESAI & NILAI MITRA                         */}
      {/* ================================================================ */}
      {isReviewModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#1683FF] flex items-center justify-center">
                  <Star className="w-5 h-5 fill-[#1683FF]" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">Selesaikan &amp; Beri Ulasan</h3>
                  <p className="text-xs text-slate-500">Konfirmasi kepuasan dan cairkan dana ke mitra</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsReviewModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmCompletion} className="space-y-4 text-xs">
              
              {/* Star selector */}
              <div className="text-center py-2 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[11px] font-bold text-slate-500 uppercase block mb-1">
                  Beri Bintang Penilaian
                </span>
                <div className="flex items-center justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setSelectedRating(star)}
                      className="p-1 transition transform hover:scale-110 cursor-pointer"
                    >
                      <Star
                        className={`w-7 h-7 ${
                          (hoverRating || selectedRating) >= star
                            ? "fill-amber-400 text-amber-400"
                            : "text-slate-300"
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <span className="text-xs font-bold text-slate-700 block mt-1">
                  {selectedRating === 5 && "Sangat Memuaskan & Sempurna!"}
                  {selectedRating === 4 && "Bagus & Sesuai Ekspektasi"}
                  {selectedRating === 3 && "Cukup Baik"}
                  {selectedRating === 2 && "Kurang Memuaskan"}
                  {selectedRating === 1 && "Tidak Sesuai"}
                </span>
              </div>

              {/* Feedback text */}
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Ulasan / Testimoni Anda:
                </label>
                <textarea
                  rows={3}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Tuliskan pengalaman positif Anda bekerja sama dengan mitra ini..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-[#1683FF]"
                />
              </div>

              {/* Escrow release notice */}
              <div className="p-3.5 rounded-xl bg-blue-50/80 border border-blue-200 space-y-1 text-slate-800">
                <div className="flex items-center justify-between font-bold">
                  <span>Dana Escrow yang Dicairkan:</span>
                  <span className="text-[#1683FF] text-sm">{formatIDR(room.helperPayoutAmount || lockedPrice)}</span>
                </div>
                <p className="text-[10px] text-slate-600 leading-snug">
                  Dengan mengklik konfirmasi, hak pembayaran mitra sebesar nominal di atas akan langsung tersedia (AVAILABLE) untuk ditarik ke rekening mitra.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsReviewModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 font-bold text-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReview}
                  className="px-5 py-2.5 rounded-xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white font-bold flex items-center gap-1.5 shadow-xs"
                >
                  {isSubmittingReview ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Memproses...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Setujui &amp; Selesaikan</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* MODAL 3: MINTA REVISI                                             */}
      {/* ================================================================ */}
      {isRevisionModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <RefreshCw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">Ajukan Permintaan Revisi</h3>
                  <p className="text-xs text-slate-500">Berikan catatan perbaikan yang jelas kepada mitra</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsRevisionModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRequestRevision} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Catatan Bagian yang Perlu Direvisi:
                </label>
                <textarea
                  rows={4}
                  required
                  value={revisionNotes}
                  onChange={(e) => setRevisionNotes(e.target.value)}
                  placeholder="Contoh: Tolong sesuaikan warna latar belakang menjadi biru tua dan ganti font judul sesuai file lampiran awal..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#1683FF]"
                />
              </div>

              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px]">
                Status pesanan akan kembali ke <strong>Sedang Dikerjakan</strong> dan dana Escrow tetap terkunci aman di Rekening Bersama.
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRevisionModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 font-bold text-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={!revisionNotes.trim()}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white font-bold flex items-center gap-1.5 shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Kirim Catatan Revisi</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* MODAL 4: PEMBAYARAN ESCROW DARI CHAT (UNTUK INQUIRY)              */}
      {/* ================================================================ */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#1683FF] flex items-center justify-center">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">Kunci Dana di Escrow</h3>
                  <p className="text-xs text-slate-500">Bayar resmi via Rekening Bersama Bantuin</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPaymentModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleExecutePayment} className="space-y-4 text-xs">
              
              {/* Total Summary */}
              <div className="p-3.5 rounded-2xl bg-blue-50/80 border border-blue-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-600 block">Total Tagihan Escrow:</span>
                  <div className="text-lg font-black text-[#1683FF]">{formatIDR(lockedPrice)}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-slate-500">Batas Waktu:</div>
                  <div className="font-mono font-bold text-rose-600">{formatTimer(timeLeft)}</div>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="space-y-2">
                <label className="font-bold text-slate-800 block">Pilih Kanal Bayar:</label>
                
                {/* QRIS */}
                <div
                  onClick={() => setSelectedMethod("qris")}
                  className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                    selectedMethod === "qris" ? "border-[#1683FF] bg-blue-50/40 ring-1 ring-[#1683FF]" : "border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-6 flex items-center justify-center">
                      <QrisLogo />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">QRIS Instan (Bebas Biaya)</div>
                      <div className="text-[10px] text-slate-500">GoPay, OVO, Dana, ShopeePay, BCA, Mandiri</div>
                    </div>
                  </div>
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${selectedMethod === "qris" ? "border-[#1683FF] bg-[#1683FF]" : "border-slate-300"}`}>
                    {selectedMethod === "qris" && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                </div>

                {/* BCA VA */}
                <div
                  onClick={() => setSelectedMethod("bca_va")}
                  className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                    selectedMethod === "bca_va" ? "border-[#1683FF] bg-blue-50/40 ring-1 ring-[#1683FF]" : "border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-6 flex items-center justify-center">
                      <BcaLogo />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">BCA Virtual Account</div>
                      <div className="text-[10px] text-slate-500">Verifikasi Otomatis 24 Jam</div>
                    </div>
                  </div>
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${selectedMethod === "bca_va" ? "border-[#1683FF] bg-[#1683FF]" : "border-slate-300"}`}>
                    {selectedMethod === "bca_va" && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                </div>

                {/* Mandiri VA */}
                <div
                  onClick={() => setSelectedMethod("mandiri_va")}
                  className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                    selectedMethod === "mandiri_va" ? "border-[#1683FF] bg-blue-50/40 ring-1 ring-[#1683FF]" : "border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-6 flex items-center justify-center">
                      <MandiriLogo />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">Mandiri Virtual Account</div>
                      <div className="text-[10px] text-slate-500">Livin' by Mandiri, ATM Mandiri</div>
                    </div>
                  </div>
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${selectedMethod === "mandiri_va" ? "border-[#1683FF] bg-[#1683FF]" : "border-slate-300"}`}>
                    {selectedMethod === "mandiri_va" && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                </div>

              </div>

              {/* VA Detail Box */}
              {selectedMethod !== "qris" && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] text-slate-600">
                    <span>Nomor Virtual Account:</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(vaNumbers[selectedMethod] || "8802918291028371", "va")}
                      className="text-[#1683FF] font-bold flex items-center gap-1 hover:underline cursor-pointer"
                    >
                      <Copy className="w-3 h-3" />
                      <span>{isCopiedVA ? "Tersalin!" : "Salin"}</span>
                    </button>
                  </div>
                  <div className="font-mono font-black text-sm text-slate-900 tracking-wider">
                    {vaNumbers[selectedMethod] || "8802918291028371"}
                  </div>
                </div>
              )}

              {/* Escrow Guarantee Note */}
              <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-100 flex items-start gap-2 text-[10px] text-slate-700">
                <ShieldCheck className="w-4 h-4 text-[#1683FF] shrink-0 mt-0.5" />
                <span>
                  Dana aman 100% di Rekber Bantuin. Mitra tidak dapat menarik dana sebelum Anda menyetujui hasil kerja.
                </span>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 font-bold text-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isProcessingPayment}
                  className="px-5 py-2.5 rounded-xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white font-bold flex items-center gap-1.5 shadow-xs"
                >
                  {isProcessingPayment ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Mengunci Escrow...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5" />
                      <span>Kunci Dana di Escrow ({formatIDR(lockedPrice)})</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
