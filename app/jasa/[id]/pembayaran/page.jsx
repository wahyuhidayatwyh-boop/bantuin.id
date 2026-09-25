"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useApp } from "@/lib/context/AppContext";
import { formatIDR } from "@/lib/utils";
import { getCatalogServiceById } from "@/lib/mock/providersData";
import { 
  QrisLogo, 
  BcaLogo, 
  MandiriLogo, 
  BriLogo, 
  BniLogo, 
  BantuinPayLogo 
} from "@/components/ui/PaymentBankLogos";
import QrisCodeCard from "@/components/ui/QrisCodeCard";
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
  Info,
  Building2,
  ChevronRight,
  AlertCircle,
  MessageSquare,
  Globe,
  FileText,
  ExternalLink
} from "lucide-react";
import VoucherPicker from "@/components/ui/VoucherPicker";

function JasaPembayaranContent() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const pkgParam = searchParams.get("pkg");
  const dateParam = searchParams.get("date");
  const timeParam = searchParams.get("time");
  const notesParam = searchParams.get("notes");
  const modeParam = searchParams.get("mode");       // 'digital' | 'lokasi' (support juga 'online' | 'offline')
  const alamatParam = searchParams.get("alamat");   // untuk jasa datang ke lokasi
  const briefParam = searchParams.get("brief");     // untuk jasa digital
  const latParam = searchParams.get("lat");
  const lngParam = searchParams.get("lng");

  const isDigitalMode = modeParam === "digital" || modeParam === "online";
  const roomIdParam = searchParams.get("roomId");
  const amountParam = searchParams.get("amount");

  const { 
    walletBalance = 250000, 
    addToast,
    createJasaOrder,
    updateOrderStatus,
    sendChatMessage
  } = useApp() || {};

  const service = getCatalogServiceById(id);

  // Selected payment method
  const [selectedMethod, setSelectedMethod] = useState("qris");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [createdRoomId, setCreatedRoomId] = useState(null);
  const [isCopiedVA, setIsCopiedVA] = useState(false);
  const [isCopiedNominal, setIsCopiedNominal] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15 * 60);
  const [appliedVoucher, setAppliedVoucher] = useState(null);
  const [discountAmount, setDiscountAmount] = useState(0);

  // Timer countdown 15 menit
  useEffect(() => {
    if (isSuccess) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [isSuccess]);

  const formatTimer = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  if (!service) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F4F7FB]">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <h2 className="text-xl font-bold text-slate-900">Layanan Jasa Tidak Ditemukan</h2>
          <p className="text-xs text-slate-500 mt-1">Layanan yang Anda tuju mungkin sudah tidak tersedia atau link salah.</p>
          <Link href="/jasa" className="mt-4 px-4 py-2 bg-[#1683FF] text-white rounded-xl text-xs font-semibold">
            Kembali ke Katalog Jasa
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  // Resolve selected package
  const selectedPackage = service.packages?.find((p) => p.id === pkgParam || p.name === pkgParam) || {
    id: "pkg-custom",
    name: pkgParam || "Layanan Disepakati (Konsultasi)",
    tier: "Pilihan Konsultasi",
    price: amountParam ? Number(amountParam) : service.price,
    duration: "1 - 2 Hari Kerja"
  };

  const servicePrice = amountParam ? Number(amountParam) : selectedPackage.price;
  
  // Tagihan customer murni harga jasa (Gross Amount)
  const totalAmount = servicePrice;
  const finalAmount = Math.max(0, totalAmount - discountAmount);

  const handleVoucherApply = (discount, voucher) => {
    setDiscountAmount(discount);
    setAppliedVoucher(voucher);
  };

  // Rincian Potongan Platform Bantuin (8% dari biaya jasa, ditanggung mitra)
  const platformFee = Math.round(servicePrice * 0.08);
  const netProviderPayout = servicePrice - platformFee;

  // Nomor Virtual Account
  const vaNumbers = {
    bca_va: "8802918291028371",
    mandiri_va: "8920199201928374",
    bri_va: "8801728192038172",
    bni_va: "8271019283819201"
  };

  const handleCopy = (text, type = "va") => {
    if (typeof window !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(String(text));
    }
    if (type === "va") {
      setIsCopiedVA(true);
      if (addToast) addToast("Nomor VA Disalin", "Nomor Virtual Account telah disalin ke clipboard.");
      setTimeout(() => setIsCopiedVA(false), 2000);
    } else {
      setIsCopiedNominal(true);
      if (addToast) addToast("Nominal Disalin", `Nominal ${formatIDR(text)} telah disalin.`);
      setTimeout(() => setIsCopiedNominal(false), 2000);
    }
  };

  const handleConfirmPayment = () => {
    setIsProcessing(true);
    setTimeout(() => {
      let targetRoomId = null;
      if (roomIdParam && updateOrderStatus) {
        updateOrderStatus(roomIdParam, "paid_escrow");
        if (sendChatMessage) {
          sendChatMessage(
            roomIdParam,
            `Dana sebesar ${formatIDR(totalAmount)} telah berhasil dibayar melalui metode ${selectedMethod.toUpperCase()} (Payment Gateway Resmi). Mitra dapat segera memulai pengerjaan tugas!`,
            { isSystemAnnouncement: true }
          );
        }
        targetRoomId = roomIdParam;
        setCreatedRoomId(roomIdParam);
      } else if (createJasaOrder && service) {
        const newOrder = createJasaOrder({
          serviceId: service.id,
          serviceTitle: service.title,
          serviceImage: service.image,
          packageId: selectedPackage.id,
          packageName: selectedPackage.name,
          servicePrice: servicePrice,
          totalAmount: totalAmount,
          targetDate: dateParam || new Date(Date.now() + 86400000).toISOString().split("T")[0],
          targetTime: timeParam || "09:00",
          alamat: alamatParam || "",
          notes: notesParam || "",
          brief: briefParam || "",
          isDigital: isDigitalMode,
          coords: (latParam && lngParam) ? { latitude: Number(latParam), longitude: Number(lngParam) } : null,
          providerId: service.provider?.id,
          providerName: service.provider?.name,
          providerAvatar: service.provider?.avatar,
          providerPhone: service.provider?.phone,
          providerRating: service.provider?.rating,
          providerAddress: service.provider?.address || service.provider?.location,
          category: service.category,
          paymentMethod: selectedMethod
        });
        targetRoomId = newOrder?.id;
        setCreatedRoomId(newOrder?.id);
      }
      setIsProcessing(false);
      setIsSuccess(true);

      if (roomIdParam) {
        setTimeout(() => {
          router.push(`/chat?room=${roomIdParam}`);
        }, 1500);
      }
    }, 1200);
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
            href={roomIdParam ? `/chat?room=${roomIdParam}` : `/jasa/${service.id}`}
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-600 hover:text-[#1683FF] transition cursor-pointer shrink-0"
          >
            <ArrowLeft className="w-4 h-4 shrink-0" />
            <span>{roomIdParam ? "Kembali ke Obrolan" : "Kembali ke Detail Layanan"}</span>
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

      {/* Main Container - Expansive, clean, and unified design */}
        <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-8 py-4 sm:py-7">
        
        {/* State: Berhasil Dibayar */}
        {isSuccess ? (
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 p-5 sm:p-10 shadow-xs max-w-xl mx-auto text-center space-y-4 sm:space-y-5 animate-in fade-in duration-300">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-emerald-50 text-emerald-600 rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto border border-emerald-200 shadow-xs">
              <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10" />
            </div>

            <div>
              <span className="text-[10px] sm:text-xs font-extrabold uppercase px-2.5 sm:px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 inline-block mb-2">
                Pembayaran Berhasil Terverifikasi
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Pembayaran Berhasil Dikonfirmasi!
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1.5 leading-relaxed break-words">
                Pembayaran Anda sebesar <strong>{formatIDR(totalAmount)}</strong> telah berhasil diverifikasi melalui sistem pembayaran resmi Bantuin.
              </p>
            </div>

            {/* Detail Singkat Pesanan */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 border border-slate-100 text-left space-y-2 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between py-1 border-b border-slate-200/60 gap-0.5">
                <span className="text-slate-500">Layanan Jasa:</span>
                <span className="font-bold text-slate-900 break-words">{service.title}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between py-1 border-b border-slate-200/60 gap-0.5">
                <span className="text-slate-500">Paket Terpilih:</span>
                <span className="font-bold text-slate-900 break-words">{selectedPackage.name}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between py-1 border-b border-slate-200/60 gap-0.5">
                <span className="text-slate-500">Jadwal Pelaksanaan:</span>
                <span className="font-bold text-[#1683FF] break-words">{dateParam || "Sesuai Jadwal"} • Pukul {timeParam || "09:00"} WIB</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between py-1 gap-0.5">
                <span className="text-slate-500">Mitra Penyedia:</span>
                <span className="font-bold text-slate-900 break-words">{service.provider.name}</span>
              </div>
            </div>

            <div className="p-3 sm:p-3.5 rounded-2xl bg-blue-50/60 border border-blue-100 flex items-start gap-2.5 text-[11px] text-blue-900 text-left">
              <ShieldCheck className="w-4 h-4 text-[#1683FF] shrink-0 mt-0.5" />
              <span className="min-w-0 break-words">
                Mitra telah menerima notifikasi pembayaran dan akan melaksanakan pekerjaan sesuai jadwal. Dana baru diteruskan ke mitra setelah pekerjaan selesai dan Anda setujui.
              </span>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center gap-2.5 sm:gap-3">
              <Link
                href="/activity?tab=jasa"
                className="w-full py-3 rounded-xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white font-bold text-xs sm:text-sm transition shadow-xs text-center"
              >
                Pantau Status di Aktivitas
              </Link>
              <Link
                href={roomIdParam ? `/chat?room=${roomIdParam}` : createdRoomId ? `/chat?room=${createdRoomId}` : `/chat?partnerId=${service.provider.id}&serviceId=${service.id}`}
                className="w-full py-3 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs transition text-center"
              >
                Buka Ruang Kerja &amp; Chat
              </Link>
            </div>
          </div>
        ) : (
          /* Tampilan Pembayaran Gateway (Bayar Dulu) */
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
                      Pilih kanal bayar resmi terverifikasi Bantuin
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
                      totalAmount={totalAmount}
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
                        <span className="break-words">Total Tagihan: <strong className="text-slate-900 font-bold">{formatIDR(totalAmount)}</strong></span>
                        <button
                          type="button"
                          onClick={() => handleCopy(totalAmount, "nominal")}
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
                    src={service.image}
                    alt={service.title}
                    className="w-13 h-13 sm:w-16 sm:h-16 rounded-xl object-cover shrink-0 border border-slate-200"
                  />
                  <div className="min-w-0 flex-1">
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug break-words line-clamp-2">
                      {service.title}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      <span className="text-[10px] sm:text-[11px] font-bold text-[#1683FF] bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                        {selectedPackage.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1.5 pt-1.5 border-t border-slate-200/60 min-w-0">
                      <img
                        src={service.provider.avatar}
                        alt={service.provider.name}
                        className="w-4 h-4 sm:w-5 sm:h-5 rounded-full object-cover border border-slate-200 shrink-0"
                      />
                      <span className="text-[10px] sm:text-[11px] text-slate-600 truncate min-w-0">
                        Penyedia: <strong className="text-slate-900 font-bold">{service.provider.name}</strong>
                      </span>
                      <ShieldCheck className="w-3.5 h-3.5 text-[#1683FF] shrink-0" />
                    </div>
                  </div>
                </div>

                {/* Badge Tipe Jasa */}
                <div className="mb-1.5">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                    isDigitalMode 
                      ? "bg-blue-50 text-blue-700 border border-blue-200/80"
                      : "bg-amber-50 text-amber-800 border border-amber-200/80"
                  }`}>
                    {isDigitalMode ? (
                      <>
                        <Globe className="w-3 h-3 text-blue-600 shrink-0" />
                        <span>Jasa Digital — Pengerjaan Jarak Jauh</span>
                      </>
                    ) : (
                      <>
                        <MapPin className="w-3 h-3 text-amber-600 shrink-0" />
                        <span>Layanan Datang ke Lokasi</span>
                      </>
                    )}
                  </span>
                </div>

                {/* Jadwal / Info Pesanan */}
                <div className="p-3 sm:p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-2 text-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <span className="text-slate-500 flex items-center gap-1.5 shrink-0">
                      <Calendar className="w-3.5 h-3.5 text-[#1683FF] shrink-0" />
                      <span>{isDigitalMode ? "Target Selesai:" : "Tanggal Pelaksanaan:"}</span>
                    </span>
                    <span className="font-bold text-slate-900 text-left sm:text-right break-words">
                      {dateParam || "Sesuai Jadwal"}
                    </span>
                  </div>

                  {/* Datang ke Lokasi: tampilkan jam + titik koordinat GPS + alamat */}
                  {!isDigitalMode && (
                    <>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <span className="text-slate-500 flex items-center gap-1.5 shrink-0">
                          <Clock className="w-3.5 h-3.5 text-[#1683FF] shrink-0" />
                          <span>Jam Mulai:</span>
                        </span>
                        <span className="font-bold text-slate-900 text-left sm:text-right">
                          {timeParam || "09:00"} WIB
                        </span>
                      </div>

                      {alamatParam && (
                        <div className="pt-2 border-t border-slate-200/60">
                          <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider mb-1 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-[#1683FF] shrink-0" /> Lokasi &amp; Titik Peta:
                          </span>
                          <p className="text-[11px] text-slate-800 font-semibold leading-relaxed break-words">
                            {decodeURIComponent(alamatParam)}
                          </p>

                          {latParam && lngParam && (
                            <div className="mt-1.5 flex flex-wrap items-center justify-between gap-1.5 text-[10px] bg-white p-2 rounded-lg border border-slate-200/70">
                              <span className="text-emerald-700 font-medium flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                                Pin GPS: {parseFloat(latParam).toFixed(4)}, {parseFloat(lngParam).toFixed(4)}
                              </span>
                              <a
                                href={`https://www.google.com/maps/search/?api=1&query=${latParam},${lngParam}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[#1683FF] hover:underline font-bold inline-flex items-center gap-0.5 shrink-0"
                              >
                                <span>Buka Peta</span>
                                <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                              </a>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}

                  {/* Digital: brief */}
                  {isDigitalMode && briefParam && (
                    <div className="pt-2 border-t border-slate-200/60">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider mb-1 flex items-center gap-1">
                        <FileText className="w-3 h-3 text-[#1683FF] shrink-0" /> Brief Kebutuhan Digital:
                      </span>
                      <p className="italic text-[11px] text-slate-700 whitespace-pre-line bg-white p-2.5 rounded-lg border border-slate-200/60 leading-relaxed break-words">
                        &ldquo;{decodeURIComponent(briefParam)}&rdquo;
                      </p>
                    </div>
                  )}

                  {notesParam && (
                    <div className="pt-2 border-t border-slate-200/60 text-slate-600">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider mb-0.5">
                        Catatan Tambahan:
                      </span>
                      <p className="italic text-[11px] line-clamp-2 break-words">
                        &ldquo;{decodeURIComponent(notesParam)}&rdquo;
                      </p>
                    </div>
                  )}
                </div>

                {/* Price Breakdown Calculation */}
                <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-slate-600">
                    <span className="min-w-0 break-words">Tarif Layanan ({selectedPackage.name})</span>
                    <span className="font-semibold text-slate-900 shrink-0 text-left sm:text-right">{formatIDR(servicePrice)}</span>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-slate-500 text-[11px]">
                    <span className="min-w-0 break-words">Potongan Platform Bantuin (8%)</span>
                    <span className="text-slate-700 font-medium shrink-0 text-left sm:text-right">-{formatIDR(platformFee)} (ditanggung mitra)</span>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-slate-500 text-[11px]">
                    <span className="min-w-0 break-words">Biaya Sistem Terverifikasi</span>
                    <span className="text-emerald-600 font-bold shrink-0 text-left sm:text-right">Gratis (Rp 0)</span>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-slate-500 text-[11px]">
                    <span className="min-w-0 break-words">Biaya Pemrosesan Gateway</span>
                    <span className="text-emerald-600 font-bold shrink-0 text-left sm:text-right">Gratis (Ditanggung Platform)</span>
                  </div>

                  {/* Baris diskon voucher */}
                  {discountAmount > 0 && (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] font-semibold text-emerald-600">
                      <span className="min-w-0 break-words">Diskon Voucher ({appliedVoucher?.code})</span>
                      <span className="shrink-0 text-left sm:text-right">-{formatIDR(discountAmount)}</span>
                    </div>
                  )}

                  {/* Total Tagihan */}
                  <div className="pt-3 border-t border-slate-200/90 flex flex-col sm:flex-row sm:items-baseline justify-between gap-1.5 sm:gap-2 mt-1">
                    <div className="min-w-0">
                      <span className="font-black text-xs sm:text-sm text-slate-900 block">Total Tagihan</span>
                      <span className="text-[10px] text-slate-400 font-normal block leading-tight">Diproses via Payment Gateway Resmi</span>
                    </div>
                    <div className="text-left sm:text-right shrink-0">
                      {discountAmount > 0 && (
                        <span className="text-[10px] text-slate-400 line-through block">{formatIDR(totalAmount)}</span>
                      )}
                      <span className="text-[#1683FF] text-xl sm:text-2xl font-black tracking-tight break-all block">
                        {formatIDR(finalAmount)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* VoucherPicker */}
                <VoucherPicker
                  category="jasa"
                  orderAmount={totalAmount}
                  orderLocation={alamatParam || service?.city || service?.location || null}
                  onApply={handleVoucherApply}
                  appliedVoucher={appliedVoucher}
                />

                {/* Security Banner */}
                <div className="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-100 flex items-start gap-2.5 text-[11px] text-emerald-800 leading-snug">
                  <Lock className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="min-w-0 break-words">
                    <strong>Pembayaran Aman Bantuin:</strong> Hak pembayaran mitra baru dapat dicairkan setelah pekerjaan selesai dan Anda konfirmasi puas.
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={handleConfirmPayment}
                  disabled={isProcessing}
                  className="w-full py-3.5 rounded-xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white font-bold text-xs sm:text-sm transition shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                      <span>Memverifikasi Pembayaran...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4 shrink-0" />
                      <span>Saya Sudah Bayar (Konfirmasi Pembayaran)</span>
                    </>
                  )}
                </button>

                <Link
                  href={`/chat?partnerId=${service.provider.id}&serviceId=${service.id}`}
                  className="w-full py-2.5 rounded-xl border border-slate-200 hover:border-[#1683FF] text-slate-700 hover:text-[#1683FF] font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer text-center"
                >
                  <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                  <span>Tanya / Konsultasi via Chat</span>
                </Link>
              </div>
            </div>

          </div>
        )}

      </main>

      <Footer />
    </div>
  );
}

export default function JasaPembayaranPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F4F7FB] flex items-center justify-center text-sm font-semibold text-slate-500">Memuat pembayaran jasa...</div>}>
      <JasaPembayaranContent />
    </Suspense>
  );
}
