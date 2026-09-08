"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useApp } from "@/lib/context/AppContext";
import { formatIDR } from "@/lib/utils";
import { 
  QrisLogo, 
  BcaLogo, 
  MandiriLogo, 
  BriLogo, 
  BniLogo, 
  BantuinPayLogo 
} from "@/components/ui/PaymentBankLogos";
import { 
  ArrowLeft, 
  ShieldCheck, 
  CheckCircle2, 
  Copy, 
  MapPin,
  Lock,
  Loader2,
  AlertCircle,
  Clock,
  Sparkles,
  ChevronRight,
  Info
} from "lucide-react";

function PembayaranContent() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const offerId = searchParams.get("offerId");
  const roomId = searchParams.get("roomId");

  const { 
    requests, 
    selectHelper, 
    walletBalance, 
    currentUser,
    addToast 
  } = useApp();

  const [selectedMethod, setSelectedMethod] = useState("qris"); // 'qris', 'bca_va', 'mandiri_va', 'bri_va', 'bni_va', 'wallet'
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isCopiedVA, setIsCopiedVA] = useState(false);
  const [isCopiedNominal, setIsCopiedNominal] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15 * 60);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const request = requests.find((r) => r.id === id) || requests[0];

  // Find targeted offer or fallback
  const targetOffer = 
    (request?.offers || []).find((o) => o.id === offerId || o.helperId === offerId) ||
    request?.offers?.[0] ||
    {
      id: "off-301",
      helperId: "user-hlp-4",
      helperName: "Clarissa Putri, S.Ds",
      helperAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80",
      proposedPrice: 150000
    };

  const helperProposedPrice = Number(targetOffer.proposedPrice) || Number(request.rewardAmount) || 35000;
  const platformFeeRate = 0.14; // Potongan 14% untuk Bantuin
  const platformFee = Math.round(helperProposedPrice * platformFeeRate);
  const helperNetPayout = helperProposedPrice - platformFee;
  const escrowFee = 2000;
  const totalAmount = helperProposedPrice + escrowFee;

  // Virtual Account Numbers mapping
  const vaNumbers = {
    bca_va: "8802918291028371",
    mandiri_va: "8920199201928374",
    bri_va: "8801728192038172",
    bni_va: "8271019283819201"
  };

  const handleCopy = (text, type = "va") => {
    navigator.clipboard?.writeText(text);
    if (type === "va") {
      setIsCopiedVA(true);
      addToast("Nomor VA Disalin", "Nomor Virtual Account telah disalin ke clipboard.");
      setTimeout(() => setIsCopiedVA(false), 2000);
    } else {
      setIsCopiedNominal(true);
      addToast("Nominal Disalin", `Nominal ${formatIDR(text)} telah disalin.`);
      setTimeout(() => setIsCopiedNominal(false), 2000);
    }
  };

  const handleConfirmPayment = () => {
    setIsProcessing(true);

    setTimeout(() => {
      setIsProcessing(false);
      setIsSuccess(true);

      setTimeout(() => {
        const newRoomId = selectHelper(request.id, targetOffer, roomId);
        if (newRoomId) {
          router.push(`/order/${newRoomId}`);
        } else if (roomId) {
          router.push(`/order/${roomId}`);
        } else {
          router.push(`/order/order-room-101`);
        }
      }, 1200);
    }, 1500);
  };

  const paymentChannels = [
    {
      id: "qris",
      name: "QRIS Instan",
      badge: "Paling Cepat",
      badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
      description: "BCA, Mandiri, BRI, BNI, GoPay, OVO, DANA, ShopeePay",
      feeText: "Bebas Biaya",
      logo: <QrisLogo />
    },
    {
      id: "bca_va",
      name: "BCA Virtual Account",
      badge: "Otomatis",
      badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
      description: "m-BCA, myBCA, KlikBCA, ATM BCA",
      feeText: "Otomatis 24 Jam",
      logo: <BcaLogo />
    },
    {
      id: "mandiri_va",
      name: "Mandiri Virtual Account",
      badge: "Otomatis",
      badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
      description: "Livin' by Mandiri, ATM Mandiri, Kopra",
      feeText: "Otomatis 24 Jam",
      logo: <MandiriLogo />
    },
    {
      id: "bri_va",
      name: "BRI Virtual Account (BRIVA)",
      badge: "Otomatis",
      badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
      description: "BRImo, ATM BRI, AgenBRILink",
      feeText: "Otomatis 24 Jam",
      logo: <BriLogo />
    },
    {
      id: "bni_va",
      name: "BNI Virtual Account",
      badge: "Otomatis",
      badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
      description: "BNI Mobile Banking, Internet Banking, ATM BNI",
      feeText: "Otomatis 24 Jam",
      logo: <BniLogo />
    },
    {
      id: "wallet",
      name: "Saldo Akun Bantuin",
      badge: "Instan 1-Klik",
      badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
      description: `Sisa Saldo: ${formatIDR(walletBalance)}`,
      feeText: "Tanpa Biaya Admin",
      logo: <BantuinPayLogo />
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-800">
      <Navbar />

      {/* Top Header / Breadcrumb Bar */}
      <div className="bg-white border-b border-slate-200/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <Link
            href={roomId ? `/order/${roomId}` : `/bantuan/${request.id}/pelamar`}
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-[#1683FF] transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{roomId ? "Kembali ke Ruang Diskusi" : "Kembali ke Pelamar"}</span>
          </Link>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200/70">
              <Lock className="w-3 h-3 text-[#1683FF]" />
              <span>Enkripsi SSL 256-Bit</span>
            </span>
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500">
              ID Transaksi: <span className="font-mono text-slate-700">BTN-{(id || "").substring(0, 8).toUpperCase()}</span>
            </span>
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        
        {/* Main 2-Column Gateway Container */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: Unified Payment Gateway Box (8 Cols) */}
          <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden divide-y divide-slate-100">
            
            {/* Header: Consistent Bantuin Blue / White Clean Theme */}
            <div className="p-5 sm:p-6 bg-linear-to-r from-[#1683FF] to-[#0F6FE5] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 text-white px-2.5 py-0.5 rounded-full backdrop-blur-xs border border-white/20">
                    Sistem Rekening Bersama
                  </span>
                  <span className="text-[11px] text-blue-100 font-medium">• 100% Proteksi Escrow</span>
                </div>
                <h1 className="text-lg sm:text-xl font-black text-white tracking-tight">
                  Kunci Dana &amp; Selesaikan Pembayaran
                </h1>
                <p className="text-xs text-blue-100 mt-0.5">
                  Dana Anda disimpan aman di rekening bersama resmi hingga tugas selesai Anda konfirmasi.
                </p>
              </div>

              {/* Countdown Timer with consistent styling */}
              <div className="bg-white/15 backdrop-blur-xs px-4 py-2 rounded-xl border border-white/25 shrink-0 flex sm:flex-col items-center sm:items-end justify-between sm:justify-center">
                <span className="text-[10px] font-medium text-blue-100 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-amber-200" />
                  <span>Batas Pembayaran</span>
                </span>
                <span className="font-mono text-base sm:text-lg font-black text-amber-200 tracking-wider">
                  {formatTimer(timeLeft)}
                </span>
              </div>
            </div>

            {/* Section 1: Helper & Task Preview Strip (Compact, Equalized) */}
            <div className="p-4 sm:p-5 bg-slate-50/70">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={targetOffer.helperAvatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80"}
                    alt={targetOffer.helperName}
                    className="w-11 h-11 rounded-full object-cover border-2 border-white shadow-2xs shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-slate-500 font-medium">Helper:</span>
                      <span className="font-bold text-slate-900 truncate">{targetOffer.helperName}</span>
                    </div>
                    <div className="text-xs font-semibold text-slate-700 truncate mt-0.5">
                      {request.title}
                    </div>
                  </div>
                </div>

                <div className="text-left sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200/80 shrink-0">
                  <div className="text-[11px] text-slate-500">Total Nominal Ditahan</div>
                  <div className="text-base font-black text-[#1683FF]">
                    {formatIDR(totalAmount)}
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Payment Methods - Unified, Balanced & Equal Rows */}
            <div className="p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Pilih Metode Pembayaran
                </h2>
                <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Verifikasi Otomatis
                </span>
              </div>

              {/* Grouped List of Payment Channels */}
              <div className="space-y-2.5">
                {paymentChannels.map((channel) => {
                  const isSelected = selectedMethod === channel.id;

                  return (
                    <div
                      key={channel.id}
                      className={`rounded-xl border transition-all overflow-hidden ${
                        isSelected 
                          ? "border-[#1683FF] bg-blue-50/25 ring-2 ring-[#1683FF]/20 shadow-xs" 
                          : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 bg-white"
                      }`}
                    >
                      {/* Equalized Main Row - Responsive for Mobile & Desktop */}
                      <button
                        type="button"
                        onClick={() => setSelectedMethod(channel.id)}
                        className="w-full p-3 sm:p-4 flex items-center justify-between text-left cursor-pointer transition gap-2.5 sm:gap-3.5"
                      >
                        <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 flex-1">
                          {/* Radio Button */}
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition shrink-0 ${
                            isSelected 
                              ? "border-[#1683FF] bg-[#1683FF]" 
                              : "border-slate-300 bg-white"
                          }`}>
                            {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                          </div>

                          {/* Standardized Logo Box (Compact & Clean on Mobile, Spacious on Desktop) */}
                          <div className={`w-16 sm:w-24 md:w-28 h-9 sm:h-11 px-1.5 sm:px-2 rounded-xl border flex items-center justify-center shrink-0 shadow-2xs transition-colors ${
                            channel.id === "bca_va"
                              ? "bg-[#175CA9] border-[#134F91]"
                              : "bg-white border-slate-200/90"
                          }`}>
                            {channel.logo}
                          </div>

                          {/* Channel Titles */}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">{channel.name}</span>
                              {channel.badge && (
                                <span className={`text-[9px] sm:text-[10px] font-bold px-1.5 py-0.2 rounded-full border shrink-0 ${channel.badgeColor}`}>
                                  {channel.badge}
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5 truncate">
                              {channel.description}
                            </div>
                          </div>
                        </div>

                        {/* Right Fee / Status Tag (Hidden on small mobile to avoid text crowding) */}
                        <div className="hidden sm:block text-right shrink-0 ml-2">
                          <span className="text-[11px] font-semibold text-slate-500">
                            {channel.feeText}
                          </span>
                        </div>
                      </button>

                      {/* Expandable Drawer: QRIS - Clean, Direct & Large without redundant nested cards */}
                      {isSelected && channel.id === "qris" && (
                        <div className="px-4 py-5 border-t border-blue-100/80 bg-slate-50/50 flex flex-col items-center text-center space-y-3.5 animate-in fade-in duration-150">
                          <div className="text-xs font-bold text-slate-800">
                            Scan QRIS dengan Aplikasi Pembayaran Apapun
                          </div>

                          {/* Direct Single QRIS Box */}
                          <div className="w-full max-w-[280px] bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col items-center space-y-3">
                            {/* QRIS Header Banner */}
                            <div className="w-full pb-2 border-b border-slate-100 flex items-center justify-between">
                              <QrisLogo className="h-5.5 w-auto object-contain" />
                              <span className="text-[9px] font-black text-slate-400 tracking-wider">BANTUIN ESCROW</span>
                            </div>

                            {/* Large QR Matrix */}
                            <div className="w-48 h-48 sm:w-52 sm:h-52 bg-white p-1.5 rounded-xl border border-slate-100 flex flex-col justify-between items-center relative">
                              <div className="w-full flex justify-between">
                                {/* Top Left Finder Pattern */}
                                <div className="w-10 h-10 border-[3.5px] border-slate-900 rounded-md p-0.5 flex items-center justify-center">
                                  <div className="w-4.5 h-4.5 bg-slate-900 rounded-xs" />
                                </div>
                                {/* Top Right Finder Pattern */}
                                <div className="w-10 h-10 border-[3.5px] border-slate-900 rounded-md p-0.5 flex items-center justify-center">
                                  <div className="w-4.5 h-4.5 bg-slate-900 rounded-xs" />
                                </div>
                              </div>

                              {/* Center Bantuin Mark */}
                              <div className="h-6 px-1.5 bg-white border border-slate-200 rounded-md shadow-2xs flex items-center justify-center">
                                <BantuinPayLogo className="h-3.5 w-auto object-contain" />
                              </div>

                              <div className="w-full flex justify-between items-end">
                                {/* Bottom Left Finder Pattern */}
                                <div className="w-10 h-10 border-[3.5px] border-slate-900 rounded-md p-0.5 flex items-center justify-center">
                                  <div className="w-4.5 h-4.5 bg-slate-900 rounded-xs" />
                                </div>
                                {/* Alignment Pattern */}
                                <div className="w-7 h-7 border-2 border-slate-900 rounded-xs p-0.5 flex items-center justify-center">
                                  <div className="w-2.5 h-2.5 bg-slate-900 rounded-xs" />
                                </div>
                              </div>
                            </div>

                            {/* Footer NMID */}
                            <div className="w-full pt-2 border-t border-slate-100 flex items-center justify-between text-[9px] font-semibold text-slate-500">
                              <span>NMID: ID1020039281729</span>
                              <span className="text-[#1683FF] font-bold">GPN</span>
                            </div>
                          </div>

                          {/* Copy Nominal */}
                          <div className="w-full max-w-[280px] flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200 text-xs">
                            <span className="text-slate-500 font-medium">Nominal Pas:</span>
                            <div className="flex items-center gap-2">
                              <span className="font-bold font-mono text-slate-900">{formatIDR(totalAmount)}</span>
                              <button
                                type="button"
                                onClick={() => handleCopy(totalAmount, "nominal")}
                                className="text-xs text-[#1683FF] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                              >
                                <Copy className="w-3 h-3" />
                                <span>{isCopiedNominal ? "Tersalin" : "Salin"}</span>
                              </button>
                            </div>
                          </div>

                          <p className="text-[10px] text-slate-400 max-w-[280px] leading-snug">
                            Dukungan m-Banking (BCA, Mandiri, BRI, BNI) &amp; E-Wallet (GoPay, OVO, DANA, ShopeePay).
                          </p>
                        </div>
                      )}

                      {/* Expandable Drawer: Virtual Accounts */}
                      {isSelected && channel.id.endsWith("_va") && (
                        <div className="px-4 pb-4 pt-2 border-t border-blue-100/80 bg-white space-y-2.5 animate-in fade-in duration-150">
                          <div className="p-3.5 bg-slate-50/90 rounded-xl border border-slate-200 space-y-2">
                            <div className="flex items-center justify-between text-xs text-slate-500">
                              <span>Nomor Virtual Account {channel.name}:</span>
                              <span className="text-[10px] sm:text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                Verifikasi Otomatis
                              </span>
                            </div>

                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 sm:p-3 bg-white rounded-lg border border-slate-300">
                              <span className="font-mono text-base sm:text-lg font-black text-slate-900 tracking-wider select-all">
                                {vaNumbers[channel.id]}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCopy(vaNumbers[channel.id], "va")}
                                className="self-end sm:self-center text-xs text-[#1683FF] bg-blue-50 sm:bg-transparent px-2.5 py-1 sm:p-0 rounded-lg sm:rounded-none font-sans font-bold flex items-center gap-1.5 hover:underline cursor-pointer"
                              >
                                <Copy className="w-3.5 h-3.5" />
                                <span>{isCopiedVA ? "Tersalin" : "Salin No VA"}</span>
                              </button>
                            </div>

                            <div className="text-[10px] sm:text-[11px] text-slate-500 leading-relaxed">
                              Transfer dapat dilakukan dari Mobile Banking, Internet Banking, atau ATM terdekat.
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Expandable Drawer: Saldo Bantuin */}
                      {isSelected && channel.id === "wallet" && (
                        <div className="px-4 pb-4 pt-2 border-t border-blue-100/80 bg-white space-y-2.5 animate-in fade-in duration-150">
                          <div className="p-3.5 bg-emerald-50/70 rounded-xl border border-emerald-200 text-xs text-emerald-900 space-y-1.5">
                            <div className="font-bold flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Pembayaran Instan dari Saldo Akun:</span>
                            </div>
                            <p className="text-[11px] text-emerald-800 leading-relaxed">
                              Sisa saldo aktif Anda sebesar <strong>{formatIDR(walletBalance)}</strong> akan dipotong langsung sejumlah <strong>{formatIDR(totalAmount)}</strong> untuk mengunci dana di Escrow tanpa biaya tambahan.
                            </p>
                          </div>
                        </div>
                      )}

                    </div>
                  );
                })}
              </div>

            </div>

            {/* Section 3: Consistent Trust & Escrow Guarantee Footer */}
            <div className="p-4 sm:p-5 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-[11px] text-slate-600 leading-snug">
                  <span className="font-bold text-slate-900">Garansi Escrow 100%: </span>
                  Dana disimpan aman dan baru disalurkan ke helper setelah tugas disetujui.
                </div>
              </div>

              <div className="flex items-center gap-2 text-[10px] font-semibold text-slate-400 shrink-0">
                <span>Diawasi &amp; Berizin</span>
                <span className="font-bold text-slate-600">Bank Indonesia</span>
              </div>
            </div>

          </div>

          {/* Right Column: Sticky Invoice Summary & Pay Button (4 Cols) */}
          <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-20">
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Rincian Tagihan
                </span>
                <span className="text-[10px] text-slate-400 font-medium">
                  Faktur Resmi
                </span>
              </div>

              {/* Task Title */}
              <div className="space-y-1">
                <div className="text-xs text-slate-400 font-medium">Tugas yang Dibayar</div>
                <div className="text-xs font-bold text-slate-900 line-clamp-2 leading-snug">
                  {request.title}
                </div>
                {request.locationName && (
                  <div className="flex items-center gap-1 text-[11px] text-slate-500 pt-1">
                    <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="line-clamp-1">{request.locationName}</span>
                  </div>
                )}
              </div>

              {/* Cost Itemization */}
              <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-600">
                  <span>Imbalan Pokok Helper ({targetOffer.helperName})</span>
                  <span className="font-semibold text-slate-900">{formatIDR(helperProposedPrice)}</span>
                </div>

                {/* Potongan Layanan Bantuin (14%) */}
                <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-100/90 space-y-1.5">
                  <div className="flex items-center justify-between text-slate-800 font-bold text-xs">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#1683FF]" />
                      <span>Potongan Layanan Bantuin (14%)</span>
                    </span>
                    <span className="text-[#1683FF] font-black">{formatIDR(platformFee)}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-600 pt-1 border-t border-blue-200/50">
                    <span>Estimasi Bersih Diterima Helper</span>
                    <span className="font-extrabold text-emerald-600">{formatIDR(helperNetPayout)}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-tight pt-0.5">
                    *Potongan 14% mencakup operasional sistem, garansi uang kembali 100%, serta keamanan escrow.
                  </p>
                </div>

                <div className="flex items-center justify-between text-slate-600">
                  <span>Biaya Pemeliharaan Rekening Bersama</span>
                  <span className="font-semibold text-slate-900">{formatIDR(escrowFee)}</span>
                </div>

                <div className="pt-3 border-t border-dashed border-slate-200 flex items-center justify-between text-sm">
                  <span className="font-black text-slate-900">Total Pembayaran</span>
                  <span className="font-black text-lg text-[#1683FF]">{formatIDR(totalAmount)}</span>
                </div>
              </div>

              {/* Success Notification */}
              {isSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in duration-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Pembayaran Berhasil! Mengalihkan...</span>
                </div>
              )}

              {/* Action Button */}
              <button
                type="button"
                onClick={handleConfirmPayment}
                disabled={isProcessing || isSuccess}
                className="w-full py-3.5 bg-[#1683FF] hover:bg-[#0F6FE5] text-white font-black text-xs sm:text-sm rounded-xl shadow-md transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Memverifikasi Pembayaran...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Konfirmasi Pembayaran ({formatIDR(totalAmount)})</span>
                  </>
                )}
              </button>

              <div className="p-3 bg-slate-50 rounded-xl text-[10px] text-slate-500 leading-relaxed space-y-1">
                <div className="font-bold text-slate-700">Jaminan Keamanan Escrow:</div>
                <p>
                  Uang tidak dapat ditarik oleh helper sebelum Anda menyatakan tugas selesai. Jika helper membatalkan atau tidak menyelesaikan tugas, dana akan dikembalikan penuh ke saldo Anda.
                </p>
              </div>

            </div>
          </div>

        </div>

      </main>

      <Footer />
    </div>
  );
}

export default function PembayaranPage() {
  return (
    <Suspense fallback={null}>
      <PembayaranContent />
    </Suspense>
  );
}
