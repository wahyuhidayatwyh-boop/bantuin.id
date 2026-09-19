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
  Camera,
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
  IdCard,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Image as ImageIcon
} from "lucide-react";
import { 
  QrisLogo, 
  BcaLogo, 
  MandiriLogo, 
  BriLogo, 
  BniLogo, 
  BantuinPayLogo 
} from "@/components/ui/PaymentBankLogos";

export default function RentalFlowTracker({ room }) {
  const { 
    confirmRentalHandover, 
    confirmRentalReturn, 
    submitRentalReview, 
    payRentalEscrow, 
    currentUser, 
    walletBalance,
    addToast 
  } = useApp();

  const [isExpanded, setIsExpanded] = useState(true);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isHandoverModalOpen, setIsHandoverModalOpen] = useState(false);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

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

  // Review Form state
  const [selectedRating, setSelectedRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [hoverRating, setHoverRating] = useState(0);

  // Checklist state & Legal E-Agreement
  const [checklistIdConfirmed, setChecklistIdConfirmed] = useState(true);
  const [checklistConditionConfirmed, setChecklistConditionConfirmed] = useState(true);
  const [eAgreementConfirmed, setEAgreementConfirmed] = useState(true);
  const [serialNumber, setSerialNumber] = useState(room?.serialNumber || "");

  // Handover Photo Proof state
  const [handoverPhotos, setHandoverPhotos] = useState([]);
  const [handoverNotes, setHandoverNotes] = useState("");
  const handoverFileInputRef = useRef(null);

  const handleHandoverPhotoUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setHandoverPhotos((prev) => [...prev, event.target.result]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveHandoverPhoto = (indexToRemove) => {
    setHandoverPhotos((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleUseSamplePhotos = () => {
    setHandoverPhotos([
      rental.photoUrl || "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&w=800&q=80"
    ]);
    if (!handoverNotes) {
      setHandoverNotes("Kondisi bodi 98% mulus, sensor bersih tanpa jamur/debu, include 2 baterai original, charger, strap & tas kamera.");
    }
    addToast?.("Foto Contoh Dimuat", "2 Foto baseline & catatan fisik siap disimpan ke obrolan.");
  };

  if (!room || room.orderType !== "rental") return null;

  const rental = room.rentalDetails || {
    unitName: room.requestTitle || "Unit Alat Sewa",
    durationDays: 2,
    startDate: "2026-09-20",
    endDate: "2026-09-22",
    rentalFee: room.rentalFeeAmount || 370000,
    depositFee: room.depositAmount || 500000,
    totalAmount: room.lockedAmount || 870000,
    pickupLocation: room.helper?.address || "Alamat Toko Mitra",
  };

  const isInquiry = room.orderStatus === "inquiry" || room.stage === "inquiry";
  const isVehicle = Boolean(
    room.categoryType === "rental" ||
    room.category?.toLowerCase().includes("motor") ||
    room.category?.toLowerCase().includes("mobil") ||
    room.requestTitle?.toLowerCase().includes("motor") ||
    room.requestTitle?.toLowerCase().includes("mobil") ||
    room.requestTitle?.toLowerCase().includes("vario") ||
    room.requestTitle?.toLowerCase().includes("avanza")
  );
  const unitNoun = isVehicle ? "Kendaraan" : "Alat";

  // 5 Step definitions (adapt based on stage)
  const steps = [
    {
      id: "inquiry",
      number: 1,
      title: isVehicle ? "Tanya Mitra" : "Tanya Toko",
      desc: isVehicle ? "Cek unit & tanggal" : "Cek kondisi & tanggal",
      isComplete: ["paid_escrow", "item_handed_over", "returned", "completed"].includes(room.orderStatus),
      isActive: isInquiry,
    },
    {
      id: "paid_escrow",
      number: 2,
      title: "Bayar Escrow",
      desc: "Uang aman di Rekber",
      isComplete: ["item_handed_over", "returned", "completed"].includes(room.orderStatus),
      isActive: room.orderStatus === "paid_escrow",
    },
    {
      id: "item_handed_over",
      number: 3,
      title: "Serah Terima",
      desc: isVehicle ? "Cek fisik & kunci" : "Titip KTP + Foto fisik",
      isComplete: ["returned", "completed"].includes(room.orderStatus),
      isActive: room.orderStatus === "item_handed_over",
    },
    {
      id: "returned",
      number: 4,
      title: "Pengembalian",
      desc: "KTP & Deposit balik",
      isComplete: room.orderStatus === "returned" || room.orderStatus === "completed",
      isActive: room.orderStatus === "returned",
    },
    {
      id: "completed",
      number: 5,
      title: "Selesai & Rating",
      desc: isVehicle ? "Beri ulasan rental" : "Beri ulasan toko",
      isComplete: room.orderStatus === "completed",
      isActive: room.orderStatus === "completed",
    },
  ];

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

  const handleExecutePayment = (e) => {
    e.preventDefault();
    setIsProcessingPayment(true);
    setTimeout(() => {
      setIsProcessingPayment(false);
      setIsPaymentModalOpen(false);
      payRentalEscrow(room.id, selectedMethod);
    }, 1200);
  };

  const handleHandoverSubmit = (e) => {
    e.preventDefault();
    const photosToSubmit = handoverPhotos.length > 0
      ? handoverPhotos
      : [
          rental.photoUrl || "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80",
          "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&w=800&q=80"
        ];
    confirmRentalHandover(room.id, {
      photos: photosToSubmit,
      serialNumber: serialNumber || "SN-82910482-BANTUIN",
      eAgreementConfirmed: true,
      notes: handoverNotes || "Kondisi fisik bodi, sensor, fungsi tombol & kelengkapan (2 baterai + charger + tas) telah diverifikasi bersama pihak toko dalam kondisi prima.",
    });
    setIsHandoverModalOpen(false);
  };

  const handleReturnSubmit = (e) => {
    e.preventDefault();
    confirmRentalReturn(room.id);
    setIsReturnModalOpen(false);
  };

  const handleReviewSubmit = (e) => {
    e.preventDefault();
    submitRentalReview(room.id, selectedRating, reviewComment || "Pelayanan toko sangat ramah, alat terawat dan berfungsi sangat baik!");
    setIsReviewModalOpen(false);
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
        
        {/* Left: Step Badge + Unit & Toko */}
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold shrink-0 flex items-center gap-1.5 ${
            room.orderStatus === "completed" 
              ? "bg-slate-100 text-slate-700 border border-slate-200" 
              : "bg-blue-50 text-[#1683FF] border border-blue-200"
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
              room.orderStatus === "completed" ? "bg-slate-400" : "bg-[#1683FF] animate-pulse"
            }`} />
            <span>
              {isInquiry ? (isVehicle ? "Tahap 1: Booking & Tanya Mitra" : "Tahap 1: Tanya Toko") :
               room.orderStatus === "paid_escrow" ? `Tahap 2: Siap Ambil ${unitNoun}` :
               room.orderStatus === "item_handed_over" ? (isVehicle ? "Tahap 3: Kendaraan Digunakan" : "Tahap 3: Sedang Disewa") :
               room.orderStatus === "returned" ? `Tahap 4: ${unitNoun} Kembali` : "Tahap 5: Selesai"}
            </span>
          </span>

          <div className="flex items-center gap-1.5 min-w-0 text-xs">
            <span className="font-extrabold text-slate-900 truncate max-w-[130px] sm:max-w-[200px] md:max-w-[260px]">
              {rental.unitName}
            </span>
            <span className="text-[11px] text-slate-400 hidden sm:inline">•</span>
            <span className="text-[11px] text-slate-500 hidden sm:inline truncate">
              {rental.durationDays} Hari ({rental.startDate} s/d {rental.endDate})
            </span>
          </div>
        </div>

        {/* Right: Escrow Amount + Primary Action Button + Toggle Expand */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 shadow-2xs">
            <ShieldCheck className="w-3.5 h-3.5 text-[#1683FF]" />
            <span>Escrow: <strong>{formatIDR(room.lockedAmount)}</strong></span>
            <span className="text-[10px] text-slate-400">(Deposit: {formatIDR(room.depositAmount)})</span>
          </div>

          {/* Primary Action Button (Clean & Single Brand Blue) */}
          {isInquiry && (
            <Link
              href={`/sewa/${room.rentalDetails?.rentalId || room.requestId || 'rental-101'}/pembayaran?roomId=${room.id}&start=${rental.startDate || '2026-09-20'}&end=${rental.endDate || '2026-09-22'}`}
              className="px-3 py-1.5 rounded-lg bg-[#1683FF] hover:bg-[#0F6FE5] text-white text-xs font-bold shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <Lock className="w-3 h-3" />
              <span>Bayar Escrow</span>
            </Link>
          )}

          {room.orderStatus === "paid_escrow" && (
            <button
              onClick={() => setIsHandoverModalOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-[#1683FF] hover:bg-[#0F6FE5] text-white text-xs font-bold shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <Camera className="w-3 h-3" />
              <span>Serah Terima</span>
            </button>
          )}

          {room.orderStatus === "item_handed_over" && (
            <button
              onClick={() => setIsReturnModalOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-[#1683FF] hover:bg-[#0F6FE5] text-white text-xs font-bold shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Kembalikan</span>
            </button>
          )}

          {room.orderStatus === "returned" && (
            <button
              onClick={() => setIsReviewModalOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-[#1683FF] hover:bg-[#0F6FE5] text-white text-xs font-bold shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <Star className="w-3 h-3 fill-white" />
              <span>Beri Rating</span>
            </button>
          )}

          {room.orderStatus === "completed" && (
            <Link
              href={`/sewa/${room.requestId || 'rent-1'}`}
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 text-xs font-bold transition flex items-center gap-1.5 shadow-2xs"
            >
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span>Lihat di Katalog Sewa</span>
            </Link>
          )}

          {/* Expand/Collapse Roadmap */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-2 py-1 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 text-[11px] font-semibold flex items-center gap-1 transition cursor-pointer"
            title={isExpanded ? "Sembunyikan Peta Alur" : "Buka Peta Alur Sewa"}
          >
            <span className="hidden xs:inline">{isExpanded ? "Tutup" : "Alur"}</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

      </div>

      {/* 2. EXPANDABLE SECTION (Only visible when user toggles 'Alur') */}
      {isExpanded && (
        <div className="bg-slate-50/90 border-b border-slate-200 p-4 space-y-3 animate-in slide-in-from-top-2 duration-150">
          
          {/* Stepper Roadmap */}
          <div className="flex items-center justify-between max-w-3xl mx-auto relative pt-1 pb-2">
            <div className="absolute top-4 left-6 right-6 h-0.5 bg-slate-200 -z-0" />
            <div 
              className="absolute top-4 left-6 h-0.5 bg-[#1683FF] transition-all duration-500 -z-0"
              style={{
                width: isInquiry ? "10%" :
                       room.orderStatus === "paid_escrow" ? "35%" :
                       room.orderStatus === "item_handed_over" ? "65%" :
                       room.orderStatus === "returned" ? "85%" : "100%"
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
            <div className="flex items-center gap-2 text-slate-600">
              <MapPin className="w-3.5 h-3.5 text-[#1683FF] shrink-0" />
              <span className="text-[11px]">
                Titik Ambil: <strong>{rental.pickupLocation}</strong> • Toko: <strong className="text-slate-800">{room.helper?.name}</strong>
              </span>
            </div>
            <div className="text-[11px] text-slate-500 shrink-0">
              Jaminan: <strong>Titip 1 KTP/KTM Asli</strong>
            </div>
          </div>

        </div>
      )}

      {/* MODAL CHECKOUT PEMBAYARAN ESCROW (Lengkap dengan QRIS / Bank VA / Wallet) */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center text-[#1683FF]">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">
                    Pembayaran Escrow (Rekber Bantuin)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Sewa {rental.unitName} di {room.helper?.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Countdown notice */}
            <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs mb-4">
              <div className="flex items-center gap-2 text-slate-700 font-semibold">
                <Clock className="w-4 h-4 text-[#1683FF] shrink-0" />
                <span>Batas Waktu Pembayaran:</span>
              </div>
              <span className="font-bold text-slate-900 font-mono text-sm">
                {formatTimer(timeLeft)}
              </span>
            </div>

            {/* Price breakdown */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs mb-4">
              <div className="flex items-center justify-between text-slate-600">
                <span>Biaya Sewa ({rental.durationDays} hari):</span>
                <span className="font-bold text-slate-900">{formatIDR(room.rentalFeeAmount)}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Deposit Jaminan (100% Refundable):</span>
                <span className="font-bold text-slate-900">{formatIDR(room.depositAmount)}</span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex items-center justify-between font-extrabold text-slate-900">
                <span>Total Escrow Diamankan:</span>
                <span className="text-[#1683FF] text-base">{formatIDR(room.lockedAmount)}</span>
              </div>
            </div>

            {/* Syarat Jaminan Singkat */}
            <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-100 text-xs text-slate-800 space-y-1 mb-4">
              <div className="font-bold flex items-center gap-1.5 text-slate-900">
                <ShieldCheck className="w-3.5 h-3.5 text-[#1683FF]" />
                <span>Syarat Jaminan Resmi Sewa:</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-snug">
                1. <strong>Titip 1 Identitas Asli</strong> (KTP/KTM/SIM) saat serah terima barang di toko.
                <br />
                2. <strong>Deposit Jaminan {formatIDR(room.depositAmount)}</strong> otomatis kembali 100% ke saldo Anda saat unit kembali aman.
              </p>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-3 mb-5">
              <label className="block text-xs font-bold text-slate-800">
                Pilih Metode Pembayaran Resmi:
              </label>

              {/* QRIS */}
              <label className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition ${
                selectedMethod === "qris" ? "bg-blue-50/70 border-[#1683FF] ring-2 ring-blue-100" : "bg-white border-slate-200 hover:bg-slate-50"
              }`}>
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="method"
                    checked={selectedMethod === "qris"}
                    onChange={() => setSelectedMethod("qris")}
                    className="text-[#1683FF] focus:ring-[#1683FF]"
                  />
                  <div>
                    <div className="text-xs font-bold text-slate-900">QRIS (GoPay, OVO, Dana, ShopeePay)</div>
                    <div className="text-[10px] text-slate-400">Verifikasi otomatis &amp; bebas biaya admin</div>
                  </div>
                </div>
                <QrisLogo />
              </label>

              {/* Virtual Accounts */}
              <label className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition ${
                selectedMethod === "bca_va" ? "bg-blue-50/70 border-[#1683FF] ring-2 ring-blue-100" : "bg-white border-slate-200 hover:bg-slate-50"
              }`}>
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="method"
                    checked={selectedMethod === "bca_va"}
                    onChange={() => setSelectedMethod("bca_va")}
                    className="text-[#1683FF] focus:ring-[#1683FF]"
                  />
                  <div>
                    <div className="text-xs font-bold text-slate-900">BCA Virtual Account</div>
                    <div className="text-[10px] text-slate-400">VA: {vaNumbers.bca_va}</div>
                  </div>
                </div>
                <BcaLogo />
              </label>

              {/* Saldo BantuinPay */}
              <label className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition ${
                selectedMethod === "wallet" ? "bg-blue-50/70 border-[#1683FF] ring-2 ring-blue-100" : "bg-white border-slate-200 hover:bg-slate-50"
              }`}>
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="method"
                    checked={selectedMethod === "wallet"}
                    onChange={() => setSelectedMethod("wallet")}
                    className="text-[#1683FF] focus:ring-[#1683FF]"
                  />
                  <div>
                    <div className="text-xs font-bold text-slate-900">Saldo Dompet BantuinPay</div>
                    <div className="text-[10px] text-[#1683FF] font-semibold">Tersedia: {formatIDR(walletBalance)}</div>
                  </div>
                </div>
                <BantuinPayLogo />
              </label>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsPaymentModalOpen(false)}
                className="w-1/3 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleExecutePayment}
                disabled={isProcessingPayment}
                className="w-2/3 py-3 rounded-xl bg-gradient-to-r from-[#1683FF] to-[#0F6FE5] hover:from-[#0F6FE5] hover:to-[#0b5ac4] text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isProcessingPayment ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Memverifikasi Escrow...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5" />
                    <span>Konfirmasi &amp; Kunci Escrow</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: SERAH TERIMA ALAT (TITIP KTP & CEK FISIK) */}
      {isHandoverModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center text-[#1683FF]">
                  <FileCheck2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">
                    Konfirmasi Serah Terima Alat
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Pemeriksaan kondisi fisik awal &amp; penitipan identitas
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsHandoverModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleHandoverSubmit} className="space-y-4 text-xs">
              <div className="p-3.5 bg-blue-50/70 rounded-2xl border border-blue-200/80 space-y-1.5">
                <div className="font-bold text-slate-900 flex items-center justify-between">
                  <span>{rental.unitName}</span>
                  <span className="text-[#1683FF]">{formatIDR(room.rentalFeeAmount)}</span>
                </div>
                <div className="text-slate-600 text-[11px] leading-relaxed">
                  <strong>Lokasi Pengambilan:</strong> {rental.pickupLocation}
                </div>
              </div>

              {/* Upload Foto Fisik Serah Terima Interaktif */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-slate-800 text-xs">
                    Foto Baseline Kondisi Fisik Alat (Wajib di Chat):
                  </label>
                  <button
                    type="button"
                    onClick={handleUseSamplePhotos}
                    className="text-[11px] font-bold text-[#1683FF] hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Gunakan Foto Contoh</span>
                  </button>
                </div>

                <input
                  type="file"
                  ref={handoverFileInputRef}
                  onChange={handleHandoverPhotoUpload}
                  accept="image/*"
                  multiple
                  className="hidden"
                />

                {handoverPhotos.length === 0 ? (
                  <div
                    onClick={() => handoverFileInputRef.current?.click()}
                    className="border-2 border-dashed border-blue-200 rounded-2xl p-4 text-center bg-blue-50/40 hover:bg-blue-50/80 transition cursor-pointer group"
                  >
                    <div className="w-10 h-10 rounded-full bg-blue-100 text-[#1683FF] flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition">
                      <Camera className="w-5 h-5" />
                    </div>
                    <div className="font-bold text-slate-800 text-xs">
                      Klik untuk Ambil / Unggah Foto Alat
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      Unggah foto bodi, lensa, dan kelengkapan. Foto otomatis tersimpan di ruang chat sebagai bukti sah Rekber.
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="grid grid-cols-3 gap-2">
                      {handoverPhotos.map((photo, idx) => (
                        <div key={idx} className="relative group rounded-xl overflow-hidden border border-slate-200 aspect-video bg-slate-100">
                          <img
                            src={photo}
                            alt={`Bukti Serah Terima ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveHandoverPhoto(idx)}
                            className="absolute top-1 right-1 p-1 bg-black/60 text-white rounded-md hover:bg-rose-600 transition cursor-pointer"
                            title="Hapus foto"
                          >
                            <X className="w-3 h-3" />
                          </button>
                          <span className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/60 text-white text-[9px] font-semibold rounded">
                            Foto {idx + 1}
                          </span>
                        </div>
                      ))}

                      <button
                        type="button"
                        onClick={() => handoverFileInputRef.current?.click()}
                        className="rounded-xl border-2 border-dashed border-slate-200 hover:border-[#1683FF] flex flex-col items-center justify-center text-slate-400 hover:text-[#1683FF] aspect-video transition cursor-pointer bg-slate-50"
                      >
                        <Plus className="w-4 h-4 mb-0.5" />
                        <span className="text-[10px] font-bold">Tambah</span>
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-[#1683FF] bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
                      <span className="flex items-center gap-1 font-semibold">
                        <CheckCircle2 className="w-3 h-3 text-[#1683FF]" />
                        {handoverPhotos.length} foto siap dikirim &amp; tersimpan di chat
                      </span>
                      <button
                        type="button"
                        onClick={() => setHandoverPhotos([])}
                        className="text-slate-400 hover:text-rose-600 underline font-medium cursor-pointer"
                      >
                        Reset
                      </button>
                    </div>
                  </div>
                )}

                {/* Catatan Fisik Alat */}
                <div className="pt-1">
                  <label className="block font-semibold text-slate-700 text-[11px] mb-1">
                    Catatan Kondisi Fisik Alat (Opsional):
                  </label>
                  <textarea
                    rows={2}
                    value={handoverNotes}
                    onChange={(e) => setHandoverNotes(e.target.value)}
                    placeholder="Contoh: Bodi mulus 98%, sensor bersih, baterai 2 unit terisi full, charger & tas lengkap..."
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-[#1683FF] transition"
                  />
                </div>

                {/* Nomor Seri / Serial Number Unit (Wajib Perlindungan Penggelapan) */}
                <div className="pt-1">
                  <label className="block font-bold text-slate-800 text-[11px] mb-1">
                    Nomor Seri Fisik (Serial Number / No. Rangka):
                  </label>
                  <input
                    type="text"
                    value={serialNumber}
                    onChange={(e) => setSerialNumber(e.target.value)}
                    placeholder="Contoh: SN-82910482 atau No. Rangka Kendaraan"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-[#1683FF] transition font-mono"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Dicatat sebagai bukti identitas fisik unik unit untuk mencegah penukaran perangkat.
                  </p>
                </div>
              </div>

              {/* 3 Agreement Checkboxes */}
              <div className="space-y-2">
                <label className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checklistIdConfirmed}
                    onChange={(e) => setChecklistIdConfirmed(e.target.checked)}
                    className="mt-0.5 rounded border-slate-300 text-[#1683FF] focus:ring-[#1683FF]"
                  />
                  <span className="text-[11px] text-slate-700 leading-snug">
                    <strong>Jaminan Identitas:</strong> Saya telah menitipkan 1 Identitas Asli (KTP / KTM / SIM) kepada pihak toko dan akan dikembalikan utuh saat unit kembali.
                  </span>
                </label>

                <label className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checklistConditionConfirmed}
                    onChange={(e) => setChecklistConditionConfirmed(e.target.checked)}
                    className="mt-0.5 rounded border-slate-300 text-[#1683FF] focus:ring-[#1683FF]"
                  />
                  <span className="text-[11px] text-slate-700 leading-snug">
                    <strong>Pemeriksaan Fisik:</strong> Saya telah memeriksa fungsi dan kelengkapan alat (baterai, charger, kabel) dan menyatakan unit dalam kondisi normal.
                  </span>
                </label>

                <label className="flex items-start gap-2.5 p-3 rounded-xl bg-blue-50/70 border border-blue-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={eAgreementConfirmed}
                    onChange={(e) => setEAgreementConfirmed(e.target.checked)}
                    className="mt-0.5 rounded border-slate-300 text-[#1683FF] focus:ring-[#1683FF]"
                  />
                  <span className="text-[11px] text-slate-700 leading-snug">
                    <strong>Perjanjian Sewa Digital &amp; Kepatuhan:</strong> Saya menyetujui bahwa apabila unit tidak dikembalikan sesuai kesepakatan dan terindikasi memenuhi unsur tindak pidana menurut ketentuan perundang-undangan yang berlaku, pemilik dan platform berhak meneruskan laporan kepada aparat penegak hukum dan institusi kampus terkait.
                  </span>
                </label>
              </div>

              <div className="flex items-center gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsHandoverModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={!checklistIdConfirmed || !checklistConditionConfirmed || !eAgreementConfirmed}
                  className="flex-1 py-2.5 rounded-xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white font-bold disabled:opacity-50 transition cursor-pointer"
                >
                  Mulai Masa Sewa Aktif
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: PENGEMBALIAN ALAT & PENCAIRAN DEPOSIT */}
      {isReturnModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-[#1683FF]">
                  <RefreshCw className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">
                    Konfirmasi Pengembalian Alat
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Pencairan deposit 100% &amp; pengembalian identitas fisik
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsReturnModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleReturnSubmit} className="space-y-4 text-xs">
              <div className="p-4 bg-blue-50/70 rounded-2xl border border-blue-100 text-center">
                <div className="text-[11px] text-slate-700 font-bold uppercase tracking-wider mb-1">
                  Pengembalian Deposit Jaminan ke Saldo
                </div>
                <div className="text-2xl font-black text-[#1683FF]">
                  {formatIDR(room.depositAmount)}
                </div>
                <p className="text-[11px] text-slate-600 mt-1">
                  Uang deposit jaminan langsung otomatis masuk kembali ke Saldo Dompet Anda.
                </p>
              </div>

              <div className="space-y-2 text-[11px] text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="font-bold text-slate-800">Pemeriksaan Akhir:</div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#1683FF]" />
                  <span>Identitas Fisik Asli (KTP/KTM) diserahkan kembali oleh toko</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#1683FF]" />
                  <span>Kondisi fisik alat sesuai dengan foto baseline awal</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#1683FF]" />
                  <span>Seluruh aksesoris (baterai, charger, tas) lengkap</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsReturnModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Tutup
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white font-bold transition cursor-pointer"
                >
                  Selesaikan &amp; Cairkan Deposit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: RATING & ULASAN TOKO */}
      {isReviewModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-[#1683FF]">
                  <Star className="w-4 h-4 fill-[#1683FF]" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">
                    Beri Rating &amp; Ulasan Toko
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Bagikan pengalaman sewa Anda untuk toko {room.helper?.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsReviewModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleReviewSubmit} className="space-y-4 text-xs">
              <div className="text-center py-2">
                <div className="text-xs font-bold text-slate-700 mb-2">
                  Bagaimana kondisi alat &amp; keramahan pelayanan dari {room.helper?.name}?
                </div>
                
                {/* 5-Star interactive selector */}
                <div className="flex items-center justify-center gap-2 my-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setSelectedRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-1 cursor-pointer transition transform hover:scale-125"
                    >
                      <Star
                        className={`w-8 h-8 ${
                          star <= (hoverRating || selectedRating)
                            ? "fill-amber-400 text-amber-400 drop-shadow-xs"
                            : "text-slate-200"
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <div className="text-xs font-bold text-slate-800">
                  {selectedRating === 5 ? "Sangat Memuaskan (5/5)" :
                   selectedRating === 4 ? "Bagus & Puas (4/5)" :
                   selectedRating === 3 ? "Cukup Baik (3/5)" :
                   selectedRating === 2 ? "Kurang Memuaskan (2/5)" : "Kecewa (1/5)"}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Ulasan &amp; Pengalaman Sewa:
                </label>
                <textarea
                  rows={3}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Ceritakan kondisi alat, keramahan toko, dan ketepatan serah terima..."
                  className="w-full text-xs p-3 rounded-2xl border border-slate-200 focus:outline-none focus:border-[#1683FF]"
                />
              </div>

              <div className="flex items-center gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsReviewModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Nanti Saja
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white font-bold shadow-xs transition cursor-pointer"
                >
                  Kirim Ulasan Resmi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
