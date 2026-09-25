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
import QrisCodeCard from "@/components/ui/QrisCodeCard";
import VoucherPicker from "@/components/ui/VoucherPicker";
import { 
  ArrowLeft, 
  ShieldCheck, 
  CheckCircle2, 
  Copy, 
  Lock,
  Loader2,
  Clock,
  Calendar,
  MapPin,
  IdCard,
  Info,
  Building2,
  AlertCircle
} from "lucide-react";

function RentalPembayaranContent() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomIdParam = searchParams.get("roomId");
  const startParam = searchParams.get("start");
  const endParam = searchParams.get("end");

  const { 
    rentals = [], 
    orderRooms = [],
    walletBalance, 
    createRentalOrder,
    payRentalEscrow,
    addToast 
  } = useApp();

  // Selected payment channel
  const [selectedMethod, setSelectedMethod] = useState("qris"); // 'qris', 'bca_va', 'mandiri_va', 'bri_va', 'bni_va', 'wallet'
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isCopiedVA, setIsCopiedVA] = useState(false);
  const [isCopiedNominal, setIsCopiedNominal] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15 * 60);
  const [appliedVoucher, setAppliedVoucher] = useState(null);
  const [discountAmount, setDiscountAmount] = useState(0);

  // Dates state with automatic calculation
  const todayStr = new Date().toISOString().split("T")[0];
  const tomorrowStr = new Date(Date.now() + 86400000 * 2).toISOString().split("T")[0];

  const [startDate, setStartDate] = useState(startParam || todayStr);
  const [endDate, setEndDate] = useState(endParam || tomorrowStr);
  const [totalDays, setTotalDays] = useState(2);

  // Find rental item or room
  const existingRoom = roomIdParam ? orderRooms.find((r) => r.id === roomIdParam) : null;
  const rental = rentals.find((r) => r.id === id) || rentals[0] || {
    id: "rental-101",
    title: "Kamera Sony A7 III Body Only",
    category: "Fotografi",
    dailyPrice: 185000,
    depositAmount: 500000,
    location: "Sleman, Yogyakarta",
    photoUrl: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80",
    owner: {
      name: "Focus Lens Studio (Mitra Rental)",
      avatar: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=400&q=80",
      phone: "081234567890",
    }
  };

  // Synchronize dates from existing room if present
  useEffect(() => {
    if (existingRoom?.rentalDetails) {
      if (existingRoom.rentalDetails.startDate) setStartDate(existingRoom.rentalDetails.startDate);
      if (existingRoom.rentalDetails.endDate) setEndDate(existingRoom.rentalDetails.endDate);
      if (existingRoom.rentalDetails.durationDays) setTotalDays(existingRoom.rentalDetails.durationDays);
    }
  }, [existingRoom]);

  // Recalculate duration whenever startDate or endDate changes
  useEffect(() => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffMs = end.getTime() - start.getTime();
      const calculatedDays = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)));
      setTotalDays(calculatedDays);
    }
  }, [startDate, endDate]);

  // 15-minute countdown timer
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

  // Accurate Calculation Breakdown (Gross Amount = rentalFee + depositFee)
  // gateway_fee dicatat di ledger sistem, bukan ditambahkan ke tagihan customer
  const dailyPrice = Number(rental.dailyPrice) || 185000;
  const rentalFee = dailyPrice * totalDays; // Subtotal Biaya Sewa
  const depositFee = Number(rental.depositAmount) || 500000; // Uang Jaminan Unit (100% refundable)
  
  // Total tagihan murni yang dibayar penyewa ke payment gateway (Gross Amount)
  const totalAmount = rentalFee + depositFee;

  // Voucher discount applies ONLY to rentalFee, NOT deposit
  const finalRentalFee = Math.max(0, rentalFee - discountAmount);
  const finalAmount = finalRentalFee + depositFee;

  const handleVoucherApply = (discount, voucher) => {
    setDiscountAmount(discount);
    setAppliedVoucher(voucher);
  };

  // Platform Fee (Potongan Platform Bantuin 8% dari Biaya Sewa, TIDAK MEMOTONG DEPOSIT)
  const platformFee = Math.round(rentalFee * 0.08);
  const storeNetPayout = rentalFee - platformFee;

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
        let targetRoomId = roomIdParam;

        if (roomIdParam && payRentalEscrow) {
          payRentalEscrow(roomIdParam, selectedMethod);
        } else if (createRentalOrder) {
          const newRoom = createRentalOrder({
            rentalId: rental.id,
            rentalTitle: rental.title,
            photoUrl: rental.photoUrl,
            storeId: rental.owner?.id || "mitra-kamera",
            storeName: rental.owner?.name || "Focus Lens Studio (Mitra Rental)",
            storeAvatar: rental.owner?.avatar || rental.photoUrl,
            storePhone: rental.owner?.phone || "081234567890",
            startDate,
            endDate,
            totalDays,
            dailyPrice,
            rentalFee,
            depositFee,
            totalAmount: finalAmount,
            discountAmount,
            appliedVoucher: appliedVoucher?.code || null,
            conditionNotes: "Body mulus, sensor bersih, kabel & charger lengkap.",
            pickupLocation: rental.address || rental.location || "Alamat Toko Mitra",
            paymentMethod: selectedMethod,
            isPaid: true
          });
          targetRoomId = newRoom?.id || "order-room-rental-kamera";
        }

        router.push(`/chat?room=${targetRoomId || "order-room-rental-kamera"}`);
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
      feeText: "Bebas Biaya Admin",
      logo: <QrisLogo />
    },
    {
      id: "bca_va",
      name: "BCA Virtual Account",
      badge: "Otomatis",
      badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
      description: "m-BCA, myBCA, KlikBCA, ATM BCA",
      feeText: "Bebas Biaya Admin",
      logo: <BcaLogo />
    },
    {
      id: "mandiri_va",
      name: "Mandiri Virtual Account",
      badge: "Otomatis",
      badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
      description: "Livin' by Mandiri, ATM Mandiri, Kopra",
      feeText: "Bebas Biaya Admin",
      logo: <MandiriLogo />
    },
    {
      id: "bri_va",
      name: "BRI Virtual Account (BRIVA)",
      badge: "Otomatis",
      badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
      description: "BRImo, ATM BRI, AgenBRILink",
      feeText: "Bebas Biaya Admin",
      logo: <BriLogo />
    },
    {
      id: "bni_va",
      name: "BNI Virtual Account",
      badge: "Otomatis",
      badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
      description: "BNI Mobile Banking, Internet Banking, ATM BNI",
      feeText: "Bebas Biaya Admin",
      logo: <BniLogo />
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F7FB] text-slate-800 font-sans">
      <Navbar />

      {/* Breadcrumb / Top Bar */}
      <div className="bg-white border-b border-slate-200/80 shadow-2xs">
        <div className="max-w-[1400px] mx-auto px-3.5 sm:px-8 py-2.5 sm:py-3 flex flex-wrap items-center justify-between gap-2.5">
          <Link
            href={roomIdParam ? `/chat?room=${roomIdParam}` : `/sewa/${rental.id}`}
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-600 hover:text-[#1683FF] transition cursor-pointer shrink-0"
          >
            <ArrowLeft className="w-4 h-4 shrink-0" />
            <span>{roomIdParam ? "Kembali ke Chat Toko" : "Kembali ke Detail Barang"}</span>
          </Link>

          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            <span className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold text-[#1683FF] bg-blue-50 px-2.5 sm:px-3 py-1 rounded-full border border-blue-100 whitespace-normal text-left">
              <Lock className="w-3.5 h-3.5 text-[#1683FF] shrink-0" />
              <span>Sistem Pembayaran Terverifikasi</span>
            </span>
            <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-blue-50/70 border border-blue-100 text-slate-700 text-[11px] sm:text-xs font-semibold shrink-0">
              <Clock className="w-3.5 h-3.5 text-[#1683FF] shrink-0" />
              <span>Batas Waktu:</span>
              <span className="font-mono font-black text-[#1683FF]">{formatTimer(timeLeft)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Container - Expansive, clean, and fills space naturally */}
      <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-8 py-4 sm:py-7">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 lg:gap-8 items-start">
          
          {/* Left Column: Metode Pembayaran (7 Cols) */}
          <div className="lg:col-span-7 bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 p-4 sm:p-7 shadow-xs flex flex-col justify-between space-y-4 sm:space-y-5 min-w-0">
            <div>
              {/* Header Title */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div className="min-w-0">
                  <h1 className="text-base sm:text-xl font-black text-slate-900 tracking-tight">
                    Pilih Metode Pembayaran
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                    Pilih kanal bayar resmi berlisensi Bank Indonesia
                  </p>
                </div>
                <span className="text-[11px] sm:text-xs text-[#1683FF] font-bold flex items-center gap-1.5 bg-blue-50 px-2.5 sm:px-3 py-1 rounded-full border border-blue-100 shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#1683FF] shrink-0" />
                  Verifikasi Otomatis
                </span>
              </div>

                {/* Payment Channel Selector List - Consistent Visual Structure */}
                <div className="flex flex-col gap-2 mt-3 sm:mt-4">
                  {paymentChannels.map((channel) => {
                    const isSelected = selectedMethod === channel.id;
                    return (
                      <button
                        key={channel.id}
                        type="button"
                        onClick={() => setSelectedMethod(channel.id)}
                        className={`w-full p-3 sm:p-3.5 rounded-2xl border text-left transition flex items-center gap-3 cursor-pointer relative ${
                          isSelected
                            ? "border-[#1683FF] bg-blue-50/40 shadow-xs ring-1.5 ring-[#1683FF]"
                            : "border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/80"
                        }`}
                      >
                        {/* [Logo] */}
                        <div className="w-14 sm:w-16 h-10 px-2 rounded-xl border border-slate-200/80 bg-white flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
                          {channel.logo}
                        </div>

                        {/* Nama Metode & Informasi/Subtext */}
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                              {channel.name}
                            </span>
                            {channel.badge && (
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border hidden xs:inline ${channel.badgeColor}`}>
                                {channel.badge}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] sm:text-xs text-slate-500 leading-snug break-words mt-0.5">
                            {channel.description ? `${channel.description} • ${channel.feeText}` : channel.feeText}
                          </div>
                        </div>

                        {/* [Radio/Check] */}
                        <div className="shrink-0 pl-1">
                          {isSelected ? (
                            <div className="w-5 h-5 rounded-full bg-[#1683FF] text-white flex items-center justify-center shadow-2xs">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </div>
                          ) : (
                            <div className="w-4 h-4 rounded-full border-2 border-slate-300" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

              {/* Active Channel Action Area */}
              <div className="mt-3.5 sm:mt-4 pt-3.5 sm:pt-4 border-t border-slate-100">
                {selectedMethod === "qris" && (
                  <QrisCodeCard
                    totalAmount={finalAmount}
                    formatIDR={formatIDR}
                    handleCopy={handleCopy}
                    isCopiedNominal={isCopiedNominal}
                  />
                )}

                {selectedMethod.endsWith("_va") && (
                  <div className="p-3.5 sm:p-5 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-3 sm:space-y-3.5">
                    <div className="flex flex-wrap items-center justify-between gap-1.5 text-xs sm:text-sm">
                      <span className="text-slate-700 font-semibold">
                        Nomor Virtual Account {selectedMethod.split("_")[0].toUpperCase()}:
                      </span>
                      <span className="text-[10px] sm:text-xs font-bold text-[#1683FF] bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100 shrink-0">
                        Otomatis Terverifikasi
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 p-3 sm:p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
                      <span className="font-mono text-base sm:text-2xl font-black text-slate-900 tracking-wider select-all break-all text-center sm:text-left">
                        {vaNumbers[selectedMethod]}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(vaNumbers[selectedMethod], "va")}
                        className="w-full sm:w-auto px-4 py-2 bg-[#1683FF] hover:bg-[#0F6FE5] text-white text-xs sm:text-sm font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shrink-0 shadow-xs"
                      >
                        <Copy className="w-4 h-4 shrink-0" />
                        <span>{isCopiedVA ? "Tersalin" : "Salin No VA"}</span>
                      </button>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs text-slate-500 pt-1">
                      <span className="break-words">Total Tagihan: <strong className="text-slate-900 font-bold">{formatIDR(finalAmount)}</strong></span>
                      <button
                        type="button"
                        onClick={() => handleCopy(finalAmount, "nominal")}
                        className="self-start sm:self-auto px-2.5 sm:px-3 py-1 bg-blue-50 hover:bg-blue-100 text-[#1683FF] border border-blue-100 text-xs font-bold rounded-md transition flex items-center gap-1 cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5 shrink-0" />
                        <span>{isCopiedNominal ? "Tersalin" : "Salin Nominal"}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Security Notice */}
            <div className="pt-3 border-t border-slate-100 flex items-center gap-2 text-[11px] sm:text-xs text-slate-500">
              <ShieldCheck className="w-4 h-4 text-[#1683FF] shrink-0" />
              <span className="min-w-0 break-words">Transaksi dilindungi Sistem Pembayaran Resmi &amp; Terverifikasi Bantuin.</span>
            </div>
          </div>

          {/* Right Column: Rincian Tagihan & Tombol Bayar (5 Cols) */}
          <div className="lg:col-span-5 bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 p-4 sm:p-7 shadow-xs flex flex-col justify-between space-y-4 sm:space-y-5 min-w-0">
            <div className="space-y-3.5 sm:space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between gap-2 pb-2.5 sm:pb-3 border-b border-slate-100">
                <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
                  Rincian Tagihan
                </h2>
                <span className="text-[11px] sm:text-xs font-bold text-[#1683FF] bg-blue-50 px-2.5 py-0.5 sm:py-1 rounded-full border border-blue-100 shrink-0">
                  100% Terverifikasi
                </span>
              </div>

              {/* Compact Item Card */}
              <div className="p-3 sm:p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200/80 flex items-start sm:items-center gap-3">
                <img
                  src={rental.photoUrl}
                  alt={rental.title}
                  className="w-13 h-13 sm:w-16 sm:h-16 rounded-xl object-cover shrink-0 border border-slate-200"
                />
                <div className="min-w-0 flex-1">
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug break-words line-clamp-2">
                    {rental.title}
                  </h3>
                  <div className="text-xs text-slate-500 truncate mt-0.5">
                    Toko: <strong className="text-slate-700">{rental.owner?.name || "Toko Mitra"}</strong>
                  </div>
                  <div className="text-[11px] sm:text-xs text-slate-400 mt-1 truncate flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-[#1683FF] shrink-0" />
                    <span>{startDate} s/d {endDate} ({totalDays} Hari)</span>
                  </div>
                </div>
              </div>

              {/* Clean Harmonious Price Breakdown */}
              <div className="space-y-2 pt-1 text-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-slate-600">
                  <span className="min-w-0 break-words">Biaya Sewa ({totalDays} hari × {formatIDR(dailyPrice)})</span>
                  <span className="font-semibold text-slate-900 shrink-0 text-left sm:text-right">{formatIDR(rentalFee)}</span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-slate-600">
                  <span className="inline-flex items-center gap-1.5 min-w-0 flex-wrap">
                    <span>Uang Jaminan (Deposit)</span>
                    <span className="text-[10px] font-bold text-[#1683FF] bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                      100% Balik
                    </span>
                  </span>
                  <span className="font-semibold text-slate-900 shrink-0 text-left sm:text-right">{formatIDR(depositFee)}</span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-slate-500 text-[11px]">
                  <span className="min-w-0 break-words">Potongan Platform Bantuin (8%)</span>
                  <span className="font-medium text-slate-700 shrink-0 text-left sm:text-right">-{formatIDR(platformFee)} (dari omset toko)</span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-slate-500 text-[11px]">
                  <span className="min-w-0 break-words">Biaya Pemrosesan Gateway</span>
                  <span className="font-semibold text-emerald-600 shrink-0 text-left sm:text-right">Gratis (Ditanggung Platform)</span>
                </div>

                {discountAmount > 0 && (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs font-semibold text-emerald-600">
                    <span className="min-w-0 break-words">Diskon Voucher ({appliedVoucher?.code})</span>
                    <span className="shrink-0 text-left sm:text-right">-{formatIDR(discountAmount)}</span>
                  </div>
                )}

                {/* Total Row - Sleek high contrast summary */}
                <div className="pt-3 border-t border-slate-200/90 flex flex-col sm:flex-row sm:items-baseline justify-between gap-1.5 sm:gap-2 mt-1">
                  <div className="min-w-0">
                    <span className="font-black text-xs sm:text-sm text-slate-900 block">Total Pembayaran</span>
                    <span className="text-[10px] text-slate-500 block leading-tight">Diproses via Payment Gateway Resmi</span>
                  </div>
                  <div className="text-left sm:text-right shrink-0">
                    {discountAmount > 0 && (
                      <span className="text-[10px] text-slate-400 line-through block">{formatIDR(totalAmount)}</span>
                    )}
                    <span className="font-black text-xl sm:text-2xl text-[#1683FF] tracking-tight break-all block">{formatIDR(finalAmount)}</span>
                  </div>
                </div>
              </div>

              {/* Voucher & Diskon Shopee-style */}
              <VoucherPicker
                category="sewa"
                orderAmount={rentalFee}
                orderLocation={rental.location || rental.address || "Sleman, Yogyakarta"}
                onApply={handleVoucherApply}
                appliedVoucher={appliedVoucher}
              />

              {/* Trust Highlight - Sleek inline bar */}
              <div className="pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-[11px] sm:text-xs text-slate-600 font-semibold text-center">
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#1683FF] shrink-0" /> Pembayaran Terverifikasi
                </span>
                <span className="text-slate-300 hidden sm:inline">•</span>
                <span className="inline-flex items-center gap-1.5">
                  <IdCard className="w-3.5 h-3.5 text-[#1683FF] shrink-0" /> Titip KTP di Toko
                </span>
                <span className="text-slate-300 hidden sm:inline">•</span>
                <span className="inline-flex items-center gap-1.5 text-slate-700">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#1683FF] shrink-0" /> Deposit Balik Utuh
                </span>
              </div>
            </div>

            {/* Action Button */}
            <div className="space-y-2.5 pt-2">
              {isSuccess && (
                <div className="p-3 bg-blue-50 border border-blue-200 text-blue-900 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 animate-in fade-in duration-200">
                  <CheckCircle2 className="w-4 h-4 text-[#1683FF] shrink-0" />
                  <span>Pembayaran Berhasil! Mengalihkan ke Ruang Chat...</span>
                </div>
              )}

              <button
                type="button"
                onClick={handleConfirmPayment}
                disabled={isProcessing || isSuccess}
                className="w-full py-3.5 sm:py-4 bg-[#1683FF] hover:bg-[#0F6FE5] text-white font-bold text-xs sm:text-sm md:text-base rounded-xl sm:rounded-2xl shadow-sm hover:shadow-md transition active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin shrink-0" />
                    <span>Memverifikasi Pembayaran...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-5 h-5 shrink-0" />
                    <span>Bayar Sekarang ({formatIDR(finalAmount)})</span>
                  </>
                )}
              </button>
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function RentalPembayaranPage() {
  return (
    <Suspense fallback={null}>
      <RentalPembayaranContent />
    </Suspense>
  );
}
