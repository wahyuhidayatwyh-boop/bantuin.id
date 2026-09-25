"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import RoleGuard from "@/components/auth/RoleGuard";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useApp } from "@/lib/context/AppContext";
import { getProviderById } from "@/lib/mock/providersData";
import { promotionService, PROMOTION_PACKAGES } from "@/lib/services/promotionService";
import { paymentService } from "@/lib/services/paymentService";
import { formatIDR } from "@/lib/utils";
import { 
  QrisLogo, 
  BcaLogo, 
  MandiriLogo, 
  BriLogo, 
  BniLogo 
} from "@/components/ui/PaymentBankLogos";
import QrisCodeCard from "@/components/ui/QrisCodeCard";
import { 
  ArrowLeft, 
  Rocket, 
  CheckCircle2, 
  Clock, 
  Lock,
  Building2,
  ShieldCheck, 
  Loader2, 
  ExternalLink,
  Copy,
  Check,
  Star
} from "lucide-react";

function BuatPromosiJasaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialServiceId = searchParams.get("serviceId") || "";
  const initialPkgId = searchParams.get("pkg") || "pkg-7d";
  const { addToast } = useApp() || {};

  const [provider, setProvider] = useState(() => {
    return getProviderById("fajar-ramadhan-desain") || {};
  });

  const [isSuccess, setIsSuccess] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState(initialServiceId);
  const [selectedPackageId, setSelectedPackageId] = useState(initialPkgId);
  const [selectedMethod, setSelectedMethod] = useState("qris"); // "qris", "bca_va", "mandiri_va", "bri_va", "bni_va"
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCopiedVA, setIsCopiedVA] = useState(false);
  const [isCopiedNominal, setIsCopiedNominal] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15 * 60);

  const packages = PROMOTION_PACKAGES;
  const catalog = React.useMemo(() => provider?.catalog || [], [provider?.catalog]);

  useEffect(() => {
    if (!selectedServiceId && catalog.length > 0) {
      setSelectedServiceId(catalog[0].id);
    }
  }, [catalog, selectedServiceId]);

  // Countdown timer 15 menit
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

  const selectedService = catalog.find((s) => s.id === selectedServiceId) || catalog[0] || {
    id: "srv-001",
    title: "Desain Logo & Identitas Brand",
    price: 75000,
    image: "https://images.unsplash.com/photo-1626785774573-4b799315345d?auto=format&fit=crop&w=600&q=80",
    category: "Desain Grafis"
  };

  const selectedPkg = packages.find((p) => p.id === selectedPackageId) || packages[1];
  const totalAmount = selectedPkg.price;

  // Nomor Virtual Account sesuai standar sistem pembayaran Bantuin
  const vaNumbers = {
    bca_va: "8802918291028371",
    mandiri_va: "8920199201928374",
    bri_va: "8801728192038172",
    bni_va: "8271019283819201"
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

  // Konfirmasi Pembayaran Selesai & Tampilkan Screen Sukses
  const handleConfirmPayment = async () => {
    if (!selectedService) {
      addToast?.("Layanan Belum Dipilih", "Silakan pilih layanan yang ingin dipromosikan.", "error");
      return;
    }

    setIsProcessing(true);
    try {
      const payment = await paymentService.createPromotionPayment({
        ownerId: provider.id || "fajar-ramadhan-desain",
        ownerName: provider.name || "Fajar Ramadhan",
        ownerType: "provider",
        targetType: "service",
        targetId: selectedService.id,
        targetTitle: selectedService.title,
        packageId: selectedPkg.id,
        durationDays: selectedPkg.durationDays,
        amount: selectedPkg.price,
        channel: selectedMethod,
      });

      const promo = await promotionService.createPromotion({
        ownerId: provider.id || "fajar-ramadhan-desain",
        ownerName: provider.name || "Fajar Ramadhan",
        ownerType: "provider",
        targetType: "service",
        targetId: selectedService.id,
        targetTitle: selectedService.title,
        packageId: selectedPkg.id,
        durationDays: selectedPkg.durationDays,
        amount: selectedPkg.price,
        paymentId: payment.id,
      });

      // Simulasikan verifikasi Tripay sukses
      await paymentService.simulateDevPaymentSuccess(payment.id);
      await promotionService.activatePromotion(promo.id, payment.id);

      setIsProcessing(false);
      setIsSuccess(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
      if (addToast) {
        addToast("Pembayaran Berhasil!", "Promosi layanan jasa Anda kini telah aktif tayang.");
      }
    } catch (err) {
      setIsProcessing(false);
      if (addToast) {
        addToast("Kendala Pembayaran", "Terjadi kesalahan saat memverifikasi pembayaran.", "error");
      }
    }
  };

  return (
    <RoleGuard allowedRoles={["provider", "penyedia", "super_admin", "admin"]}>
      <div className="min-h-screen flex flex-col bg-[#F4F7FB] text-slate-800 font-sans">
        <Navbar />

        {/* Breadcrumb / Top Bar */}
        <div className="bg-white border-b border-slate-200/80 shadow-2xs">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-8 py-3 flex items-center justify-between">
            <Link
              href="/jasa/dashboard"
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-600 hover:text-[#1683FF] transition cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Dashboard Jasa</span>
            </Link>

            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1683FF] bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                <Lock className="w-3.5 h-3.5 text-[#1683FF]" />
                <span>Sistem Pembayaran Terverifikasi</span>
              </span>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50/70 border border-blue-100 text-slate-700 text-xs font-semibold">
                <Clock className="w-3.5 h-3.5 text-[#1683FF]" />
                <span>Batas Waktu:</span>
                <span className="font-mono font-black text-[#1683FF]">{formatTimer(timeLeft)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Container - Expansive, clean, and unified design */}
        <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-8 py-5 sm:py-7">
          
          {/* ============================================================ */}
          {/* STATE 1: TAMPILAN SUKSES & TERVERIFIKASI SETELAH BAYAR      */}
          {/* ============================================================ */}
          {isSuccess ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-10 shadow-xs max-w-xl mx-auto text-center space-y-5 animate-in fade-in duration-300">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto border border-emerald-200 shadow-xs">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <span className="text-xs font-extrabold uppercase px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 inline-block mb-2">
                  Pembayaran Berhasil Terverifikasi
                </span>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                  Promosi Layanan Berhasil Diaktifkan!
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-1.5 leading-relaxed">
                  Pembayaran promosi sebesar <strong>{formatIDR(totalAmount)}</strong> telah berhasil diverifikasi oleh sistem pembayaran Bantuin.
                </p>
              </div>

              {/* Detail Singkat Pesanan */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-left space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Layanan Jasa:</span>
                  <span className="font-bold text-slate-900">{selectedService.title}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Paket Promosi:</span>
                  <span className="font-bold text-slate-900">{selectedPkg.name} ({selectedPkg.durationDays} Hari)</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Target Penempatan:</span>
                  <span className="font-bold text-[#1683FF]">Jasa Unggulan Beranda</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Status Promosi:</span>
                  <span className="font-bold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Aktif &amp; Tayang di Beranda
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-blue-50/60 border border-blue-100 flex items-start gap-2.5 text-[11px] text-blue-900 text-left">
                <ShieldCheck className="w-4 h-4 text-[#1683FF] shrink-0 mt-0.5" />
                <span>
                  Lencana &ldquo;Unggulan&rdquo; telah aktif pada layanan Anda dan kini mendapatkan prioritas rekomendasi di halaman utama.
                </span>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                <Link
                  href="/jasa/dashboard"
                  className="w-full py-3 rounded-xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white font-bold text-xs sm:text-sm transition shadow-xs text-center"
                >
                  Kembali ke Dashboard Jasa
                </Link>
                <Link
                  href="/jasa"
                  target="_blank"
                  className="w-full py-3 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs transition text-center flex items-center justify-center gap-1.5"
                >
                  <span>Lihat di Beranda Jasa</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ) : (
            /* ============================================================ */
            /* STATE 2: TAMPILAN PAYMENT GATEWAY (PERSIS JASA/SEWA/BANTUAN) */
            /* ============================================================ */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
              
              {/* Left Column: Pemilihan & Metode Pembayaran (7 Cols) */}
              <div className="lg:col-span-7 space-y-6">
                
                {/* 1. Pilih Layanan dari Katalog */}
                <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-xs space-y-4">
                  <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                    <div>
                      <h2 className="text-base sm:text-lg font-black text-slate-900">1. Pilih Layanan dari Katalog</h2>
                      <p className="text-xs text-slate-500">Pilih satu layanan aktif yang ingin dipromosikan.</p>
                    </div>
                    <span className="px-2.5 py-1 bg-blue-50 text-[#1683FF] text-[11px] font-bold rounded-lg border border-blue-100">
                      {catalog.length} Layanan
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {catalog.map((srv) => {
                      const isSelected = selectedServiceId === srv.id;
                      return (
                        <div
                          key={srv.id}
                          onClick={() => setSelectedServiceId(srv.id)}
                          className={`p-3.5 rounded-2xl border-2 flex items-center gap-3 cursor-pointer transition ${
                            isSelected
                              ? "border-[#1683FF] bg-blue-50/40 ring-1.5 ring-[#1683FF] shadow-xs"
                              : "border-slate-200 hover:border-slate-300 bg-white"
                          }`}
                        >
                          <img
                            src={srv.image}
                            alt={srv.title}
                            className="w-14 h-12 rounded-xl object-cover shrink-0 border border-slate-100 shadow-2xs"
                          />
                          <div className="min-w-0 flex-1">
                            <span className="text-[10px] font-extrabold uppercase text-slate-400 block">
                              {srv.category}
                            </span>
                            <span className="text-xs sm:text-sm font-bold text-slate-900 block truncate">
                              {srv.title}
                            </span>
                            <span className="text-xs text-[#1683FF] font-black block mt-0.5">
                              {formatIDR(srv.price)} {srv.unit || ""}
                            </span>
                          </div>
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                            isSelected ? "border-[#1683FF] bg-[#1683FF] text-white" : "border-slate-300"
                          }`}>
                            {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Pilih Durasi Paket Promosi */}
                <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-xs space-y-4">
                  <div className="border-b border-slate-100 pb-3">
                    <h2 className="text-base sm:text-lg font-black text-slate-900">2. Pilih Durasi Paket Promosi</h2>
                    <p className="text-xs text-slate-500">Pilih durasi penempatan etalase unggulan di Beranda Bantuin.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
                    {packages.map((pkg) => {
                      const isSelected = selectedPackageId === pkg.id;
                      return (
                        <div
                          key={pkg.id}
                          onClick={() => setSelectedPackageId(pkg.id)}
                          className={`rounded-2xl p-4 border-2 cursor-pointer transition flex flex-col justify-between relative ${
                            isSelected
                              ? "border-[#1683FF] bg-blue-50/50 ring-1.5 ring-[#1683FF] shadow-xs"
                              : "border-slate-200 hover:border-slate-300 bg-white"
                          }`}
                        >
                          {pkg.isPopular && (
                            <div className="absolute -top-2.5 right-3 bg-[#1683FF] text-white text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full shadow-xs flex items-center gap-1">
                              <Star className="w-2.5 h-2.5 fill-white" />
                              <span>Populer</span>
                            </div>
                          )}

                          <div>
                            <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 mb-0.5">{pkg.name}</h4>
                            <div className="text-[11px] text-slate-500 flex items-center gap-1 mb-2">
                              <Clock className="w-3 h-3 text-slate-400" />
                              <span><strong>{pkg.durationDays} Hari</strong> Tayang</span>
                            </div>

                            <div className="p-2 bg-slate-50 rounded-xl mb-2 border border-slate-100">
                              <div className="text-base sm:text-lg font-black text-[#1683FF]">{formatIDR(pkg.price)}</div>
                              <div className="text-[9px] text-slate-400">Bebas biaya admin</div>
                            </div>
                          </div>

                          <button
                            type="button"
                            className={`w-full py-1.5 rounded-lg text-[11px] font-bold transition ${
                              isSelected
                                ? "bg-[#1683FF] text-white"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {isSelected ? "Terpilih" : "Pilih"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Kanal Pembayaran Resmi (DENGAN QRIS & NO VA LANGSUNG MUNCUL) */}
                <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 shadow-xs flex flex-col justify-between space-y-5">
                  <div>
                    {/* Header Title */}
                    <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
                      <div>
                        <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                          3. Kanal Pembayaran Resmi
                        </h2>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Pilih metode pembayaran yang akan digunakan.
                        </p>
                      </div>
                      <span className="text-xs text-[#1683FF] font-bold flex items-center gap-1.5 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#1683FF]" />
                        Verifikasi Otomatis
                      </span>
                    </div>

                    {/* Payment Channel Selector Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-4">
                      {paymentChannels.map((channel) => {
                        const isSelected = selectedMethod === channel.id;
                        return (
                          <button
                            key={channel.id}
                            type="button"
                            onClick={() => setSelectedMethod(channel.id)}
                            className={`p-3.5 rounded-2xl border text-left transition flex items-center gap-3.5 cursor-pointer relative ${
                              isSelected
                                ? "border-[#1683FF] bg-blue-50/40 shadow-xs ring-1.5 ring-[#1683FF]"
                                : "border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/80"
                            }`}
                          >
                            <div className="w-16 h-10 px-2 rounded-xl border border-slate-200/80 bg-white flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
                              {channel.logo}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-xs sm:text-sm font-bold text-slate-900 truncate leading-snug">
                                {channel.name}
                              </div>
                              <div className="text-[11px] sm:text-xs text-slate-500 truncate mt-0.5">
                                {channel.feeText}
                              </div>
                            </div>
                            {isSelected ? (
                              <div className="w-5 h-5 rounded-full bg-[#1683FF] text-white flex items-center justify-center shrink-0 shadow-2xs">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              </div>
                            ) : (
                              <div className="w-4 h-4 rounded-full border-2 border-slate-300 shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Active Channel Action Area (QRIS / VA LANGSUNG AKTIF MUNCUL) */}
                    <div className="mt-5 pt-5 border-t border-slate-100">
                      {selectedMethod === "qris" && (
                        <QrisCodeCard
                          totalAmount={totalAmount}
                          formatIDR={formatIDR}
                          handleCopy={handleCopy}
                          isCopiedNominal={isCopiedNominal}
                        />
                      )}

                      {selectedMethod.endsWith("_va") && (
                        <div className="p-5 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-3.5">
                          <div className="flex items-center justify-between text-xs sm:text-sm">
                            <span className="text-slate-700 font-semibold">
                              Nomor Virtual Account {selectedMethod.split("_")[0].toUpperCase()}:
                            </span>
                            <span className="text-xs font-bold text-[#1683FF] bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
                              Otomatis Terverifikasi
                            </span>
                          </div>

                          <div className="flex items-center justify-between gap-3 p-3.5 sm:p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
                            <span className="font-mono text-lg sm:text-2xl font-black text-slate-900 tracking-wider select-all">
                              {vaNumbers[selectedMethod] || "8802918291028371"}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopy(vaNumbers[selectedMethod] || "8802918291028371", "va")}
                              className="px-4 py-2 bg-[#1683FF] hover:bg-[#0F6FE5] text-white text-xs sm:text-sm font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer shrink-0 shadow-xs"
                            >
                              <Copy className="w-4 h-4" />
                              <span>{isCopiedVA ? "Tersalin" : "Salin No VA"}</span>
                            </button>
                          </div>

                          <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                            <span>Total Tagihan: <strong className="text-slate-900 font-bold">{formatIDR(totalAmount)}</strong></span>
                            <button
                              type="button"
                              onClick={() => handleCopy(totalAmount, "nominal")}
                              className="px-3 py-1 bg-blue-50 hover:bg-blue-100 text-[#1683FF] border border-blue-100 text-xs font-bold rounded-md transition flex items-center gap-1 cursor-pointer"
                            >
                              <Copy className="w-3.5 h-3.5" />
                              <span>{isCopiedNominal ? "Tersalin" : "Salin Nominal"}</span>
                            </button>
                          </div>

                          <div className="text-xs text-slate-500 space-y-1 pt-1">
                            <p>&bull; Masukkan nomor Virtual Account di atas pada menu Transfer VA ATM / M-Banking.</p>
                            <p>&bull; Nominal tagihan tertera otomatis <strong>{formatIDR(totalAmount)}</strong> tanpa potongan fee admin.</p>
                            <p>&bull; Transaksi langsung terverifikasi otomatis dalam waktu 1-5 detik.</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bottom Security Notice */}
                  <div className="pt-3 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-500">
                    <ShieldCheck className="w-4 h-4 text-[#1683FF] shrink-0" />
                    <span>Transaksi dilindungi Sistem Pembayaran Resmi &amp; Terverifikasi Bantuin.</span>
                  </div>
                </div>

              </div>

              {/* Right Column: Rincian Tagihan & Tombol Konfirmasi (5 Cols - Sticky) */}
              <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 shadow-xs flex flex-col justify-between space-y-5 lg:sticky lg:top-6">
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
                      Rincian Tagihan Promosi
                    </h2>
                    <span className="text-xs font-bold text-[#1683FF] bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
                      100% Terverifikasi
                    </span>
                  </div>

                  {/* Compact Item Card */}
                  <div className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200/80 flex items-center gap-3.5">
                    <img
                      src={selectedService.image}
                      alt={selectedService.title}
                      className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl object-cover shrink-0 border border-slate-200"
                    />
                    <div className="min-w-0 flex-1">
                      <h3 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                        {selectedService.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[11px] font-bold text-[#1683FF] bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                          {selectedPkg.name} ({selectedPkg.durationDays} Hari)
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-slate-200/60">
                        <img
                          src={provider.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80"}
                          alt={provider.name}
                          className="w-5 h-5 rounded-full object-cover border border-slate-200"
                        />
                        <span className="text-[11px] text-slate-600 truncate">
                          Penyedia: <strong className="text-slate-900 font-bold">{provider.name}</strong>
                        </span>
                        <ShieldCheck className="w-3.5 h-3.5 text-[#1683FF] shrink-0" />
                      </div>
                    </div>
                  </div>

                  {/* Badge Tipe Promosi */}
                  <div className="mb-2.5">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200/80">
                      <Rocket className="w-3 h-3 text-blue-600" />
                      <span>Penempatan Unggulan Beranda Utama</span>
                    </span>
                  </div>

                  {/* Info Promosi */}
                  <div className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Target Penempatan:</span>
                      <span className="font-bold text-[#1683FF]">
                        Jasa Unggulan Beranda
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#1683FF]" />
                        <span>Durasi Tayang:</span>
                      </span>
                      <span className="font-bold text-slate-900">
                        {selectedPkg.durationDays} Hari Penuh
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-[#1683FF]" />
                        <span>Penyedia Jasa:</span>
                      </span>
                      <span className="font-bold text-slate-900">
                        {provider.name}
                      </span>
                    </div>
                  </div>

                  {/* Price Breakdown Calculation */}
                  <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Biaya Paket Promosi ({selectedPkg.name})</span>
                      <span className="font-semibold text-slate-900">{formatIDR(totalAmount)}</span>
                    </div>

                    <div className="flex items-center justify-between text-slate-500 text-[11px]">
                      <span>Biaya Sistem Terverifikasi</span>
                      <span className="text-emerald-600 font-bold">Gratis (Rp 0)</span>
                    </div>

                    <div className="flex items-center justify-between text-slate-500 text-[11px]">
                      <span>Biaya Pemrosesan Gateway</span>
                      <span className="text-emerald-600 font-bold">Gratis (Ditanggung Platform)</span>
                    </div>

                    {/* Total Tagihan */}
                    <div className="pt-3 border-t border-slate-200/90 flex items-baseline justify-between mt-1">
                      <div>
                        <span className="font-black text-xs sm:text-sm text-slate-900 block">Total Tagihan</span>
                        <span className="text-[10px] text-slate-400 font-normal">Diproses via Payment Gateway Resmi</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[#1683FF] text-xl sm:text-2xl font-black tracking-tight">
                          {formatIDR(totalAmount)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Security Banner */}
                  <div className="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-100 flex items-start gap-2.5 text-[11px] text-emerald-800 leading-snug">
                    <Lock className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>
                      <strong>Pembayaran Aman Bantuin:</strong> Promosi layanan otomatis aktif tayang di Beranda Bantuin setelah verifikasi selesai.
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
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Memverifikasi Pembayaran...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>Saya Sudah Membayar (Konfirmasi Pembayaran)</span>
                      </>
                    )}
                  </button>

                  <Link
                    href="/jasa/dashboard"
                    className="w-full py-2.5 rounded-xl border border-slate-200 hover:border-[#1683FF] text-slate-700 hover:text-[#1683FF] font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer text-center"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Batal &amp; Kembali ke Dashboard</span>
                  </Link>
                </div>
              </div>
            </div>
          )}

        </main>

        <Footer />
      </div>
    </RoleGuard>
  );
}

export default function BuatPromosiJasaPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F4F7FB] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#1683FF] animate-spin" />
      </div>
    }>
      <BuatPromosiJasaContent />
    </Suspense>
  );
}
