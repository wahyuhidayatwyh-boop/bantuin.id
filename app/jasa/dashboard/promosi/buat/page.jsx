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
  Star,
  Tag,
  Layers
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
  const [selectedServiceIds, setSelectedServiceIds] = useState(() => {
    return initialServiceId ? [initialServiceId] : [];
  });
  const [selectedPackageId, setSelectedPackageId] = useState(initialPkgId);
  const [selectedMethod, setSelectedMethod] = useState("qris"); // "qris", "bca_va", "mandiri_va", "bri_va", "bni_va"
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCopiedVA, setIsCopiedVA] = useState(false);
  const [isCopiedNominal, setIsCopiedNominal] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15 * 60);

  const packages = PROMOTION_PACKAGES;
  const catalog = React.useMemo(() => provider?.catalog || [], [provider?.catalog]);

  useEffect(() => {
    if (selectedServiceIds.length === 0 && catalog.length > 0) {
      setSelectedServiceIds([initialServiceId || catalog[0].id]);
    }
  }, [catalog, initialServiceId, selectedServiceIds.length]);

  const toggleServiceSelection = (id) => {
    setSelectedServiceIds((prev) => {
      if (prev.includes(id)) {
        if (prev.length === 1) return prev; // Minimal 1 layanan harus terpilih
        return prev.filter((item) => item !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const selectAllServices = () => {
    if (selectedServiceIds.length === catalog.length) {
      setSelectedServiceIds([catalog[0]?.id || "srv-001"]);
    } else {
      setSelectedServiceIds(catalog.map((s) => s.id));
    }
  };

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

  const selectedServices = catalog.filter((s) => selectedServiceIds.includes(s.id));
  const fallbackService = catalog[0] || {
    id: "srv-001",
    title: "Desain Logo & Identitas Brand",
    price: 75000,
    image: "https://images.unsplash.com/photo-1626785774573-4b799315345d?auto=format&fit=crop&w=600&q=80",
    category: "Desain Grafis"
  };
  const effectiveSelectedServices = selectedServices.length > 0 ? selectedServices : [fallbackService];

  const selectedPkg = packages.find((p) => p.id === selectedPackageId) || packages[1];
  const serviceCount = effectiveSelectedServices.length;
  const basePricePerItem = selectedPkg.price;
  const subtotalAmount = basePricePerItem * serviceCount;

  // Aturan Diskon Paket Bundling Jasa (bisa pilih lebih dari 1 & dimurahkan):
  // 1 layanan: 0% diskon
  // 2 layanan: 20% diskon (hemat 20%)
  // 3 layanan: 30% diskon (hemat 30%)
  // 4+ layanan: 35% diskon (hemat 35%)
  const discountRate = serviceCount >= 4 ? 0.35 : serviceCount === 3 ? 0.30 : serviceCount === 2 ? 0.20 : 0;
  const discountAmount = Math.round(subtotalAmount * discountRate);
  const totalAmount = subtotalAmount - discountAmount;

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
    if (effectiveSelectedServices.length === 0) {
      addToast?.("Layanan Belum Dipilih", "Silakan pilih minimal satu layanan yang ingin dipromosikan.", "error");
      return;
    }

    setIsProcessing(true);
    try {
      const targetIds = effectiveSelectedServices.map((s) => s.id).join(",");
      const targetTitles = effectiveSelectedServices.map((s) => s.title).join(", ");

      const payment = await paymentService.createPromotionPayment({
        ownerId: provider.id || "fajar-ramadhan-desain",
        ownerName: provider.name || "Fajar Ramadhan",
        ownerType: "provider",
        targetType: "service",
        targetId: targetIds,
        targetTitle: effectiveSelectedServices.length === 1 
          ? effectiveSelectedServices[0].title 
          : `Paket Promosi ${effectiveSelectedServices.length} Jasa: ${targetTitles}`,
        packageId: selectedPkg.id,
        durationDays: selectedPkg.durationDays,
        amount: totalAmount,
        channel: selectedMethod,
      });

      // Konfirmasi pembayaran menjadi status 'paid'
      if (payment?.id) {
        await paymentService.confirmPayment(payment.id);
      }

      // Aktifkan promosi untuk seluruh layanan jasa yang dipilih di promotionService
      for (const srv of effectiveSelectedServices) {
        try {
          const promoItem = await promotionService.createPromotionOrder({
            ownerId: provider.id || "fajar-ramadhan-desain",
            ownerName: provider.name || "Fajar Ramadhan",
            ownerType: "provider",
            targetType: "service",
            targetId: srv.id,
            targetTitle: srv.title,
            packageId: selectedPkg.id,
            paymentId: payment?.id || `PAY-${Date.now()}`,
            amount: Math.round(totalAmount / effectiveSelectedServices.length),
            paymentMethod: selectedMethod,
          });
          if (promoItem?.id) {
            await promotionService.activatePromotion(promoItem.id, payment?.id);
          }
        } catch (innerErr) {
          console.warn("[promosi] Gagal aktivasi sub-item promosi:", innerErr);
        }
      }

      setIsProcessing(false);
      setIsSuccess(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
      if (addToast) {
        addToast(
          "Pembayaran Berhasil!", 
          `Promosi untuk ${effectiveSelectedServices.length} layanan jasa kini telah aktif tayang.`
        );
      }
    } catch (err) {
      console.warn("[promosi] Fallback aktivasi:", err);
      setIsProcessing(false);
      setIsSuccess(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
      if (addToast) {
        addToast(
          "Pembayaran Berhasil!", 
          `Promosi untuk ${effectiveSelectedServices.length} layanan jasa kini telah aktif tayang.`
        );
      }
    }
  };

  return (
    <RoleGuard allowedRoles={["provider", "penyedia", "super_admin", "admin"]}>
      <div className="min-h-screen flex flex-col bg-[#F4F7FB] text-slate-800 font-sans">
        <Navbar />

        {/* Breadcrumb / Top Bar */}
        <div className="bg-white border-b border-slate-200/80 shadow-2xs">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-8 py-2.5 sm:py-3 flex flex-wrap items-center justify-between gap-2.5">
            <Link
              href="/jasa/dashboard"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-600 hover:text-[#1683FF] transition cursor-pointer shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Dashboard Jasa</span>
            </Link>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <span className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold text-[#1683FF] bg-blue-50 px-2.5 sm:px-3 py-1 rounded-full border border-blue-100">
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
                  <span className="text-slate-500">Layanan Dipromosikan:</span>
                  <span className="font-bold text-slate-900">{effectiveSelectedServices.length} Layanan Jasa</span>
                </div>
                <div className="space-y-1 py-1 border-b border-slate-200/60">
                  {effectiveSelectedServices.map((srv) => (
                    <div key={srv.id} className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-700 font-medium truncate">• {srv.title}</span>
                      <span className="text-emerald-600 font-bold shrink-0">Aktif</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Paket Promosi:</span>
                  <span className="font-bold text-slate-900">{selectedPkg.name} ({selectedPkg.durationDays} Hari)</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between py-1 border-b border-slate-200/60 text-emerald-700 font-bold">
                    <span>Diskon Paket Bundling:</span>
                    <span>Hemat {formatIDR(discountAmount)} ({discountRate * 100}%)</span>
                  </div>
                )}
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
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 lg:gap-8 items-start">
              
              {/* Left Column: Pemilihan & Metode Pembayaran (7 Cols) */}
              <div className="lg:col-span-7 space-y-4 sm:space-y-6 min-w-0">
                
                {/* 1. Pilih Layanan dari Katalog (BISA MULTI-PILIH DENGAN DISKON BUNDLING) */}
                <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-7 border border-slate-200/90 shadow-xs space-y-3.5 sm:space-y-4">
                  <div className="border-b border-slate-100 pb-3 flex flex-wrap items-center justify-between gap-2">
                    <div className="min-w-0">
                      <h2 className="text-base sm:text-lg font-black text-slate-900">1. Pilih Layanan dari Katalog</h2>
                      <p className="text-xs text-slate-500">Pilih satu atau lebih layanan jasa sekaligus untuk mendapatkan potongan harga paket bundling!</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                      <button
                        type="button"
                        onClick={selectAllServices}
                        className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-[#1683FF] text-[11px] font-bold rounded-lg border border-blue-100 transition cursor-pointer"
                      >
                        {selectedServiceIds.length === catalog.length ? "Batal Pilih Semua" : "Pilih Semua Layanan"}
                      </button>
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-700 text-[11px] font-bold rounded-lg">
                        {selectedServiceIds.length} Terpilih
                      </span>
                    </div>
                  </div>

                  {/* Bundling Highlight Banner */}
                  {serviceCount >= 2 ? (
                    <div className="p-3 sm:p-3.5 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-emerald-900">
                      <div className="flex items-start sm:items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-2xs">
                          <Check className="w-4 h-4 stroke-[3]" />
                        </div>
                        <div>
                          <div className="font-extrabold flex items-center gap-1.5">
                            <span>Paket Bundling {serviceCount} Layanan Aktif!</span>
                            <span className="text-[10px] bg-emerald-200/70 text-emerald-800 px-1.5 py-0.5 rounded font-black">
                              Hemat {discountRate * 100}%
                            </span>
                          </div>
                          <div className="text-[11px] text-emerald-700 mt-0.5">
                            Harga paket didiskon {discountRate * 100}%, Anda menghemat <strong>{formatIDR(discountAmount)}</strong>!
                          </div>
                        </div>
                      </div>
                      <span className="text-sm font-black text-emerald-700 bg-white px-2.5 py-1 rounded-xl border border-emerald-200 shadow-2xs shrink-0">
                        -{formatIDR(discountAmount)}
                      </span>
                    </div>
                  ) : (
                    <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-blue-900">
                      <div className="flex items-start sm:items-center gap-2 min-w-0">
                        <Tag className="w-4 h-4 text-[#1683FF] shrink-0" />
                        <span>Pilih 2 layanan atau lebih untuk mendapatkan diskon paket bundling hemat hingga <strong>35%</strong>!</span>
                      </div>
                      <span className="text-[10px] font-bold text-[#1683FF] bg-white px-2 py-0.5 rounded-lg border border-blue-200 shrink-0">
                        Bisa Multi-Pilih
                      </span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {catalog.map((srv) => {
                      const isSelected = selectedServiceIds.includes(srv.id);
                      return (
                        <div
                          key={srv.id}
                          onClick={() => toggleServiceSelection(srv.id)}
                          className={`p-3.5 rounded-2xl border-2 flex items-center gap-3 cursor-pointer transition select-none ${
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
                          <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center shrink-0 transition ${
                            isSelected ? "border-[#1683FF] bg-[#1683FF] text-white shadow-2xs" : "border-slate-300 bg-slate-50"
                          }`}>
                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Pilih Durasi Paket Promosi */}
                <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-7 border border-slate-200/90 shadow-xs space-y-3.5 sm:space-y-4">
                  <div className="border-b border-slate-100 pb-3">
                    <h2 className="text-base sm:text-lg font-black text-slate-900">2. Pilih Durasi Paket Promosi</h2>
                    <p className="text-xs text-slate-500">Pilih durasi penempatan etalase unggulan di Beranda Bantuin.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    {packages.map((pkg) => {
                      const isSelected = selectedPackageId === pkg.id;
                      return (
                        <div
                          key={pkg.id}
                          onClick={() => setSelectedPackageId(pkg.id)}
                          className={`rounded-2xl p-3.5 sm:p-4 border-2 cursor-pointer transition flex flex-col justify-between relative ${
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
                <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 p-4 sm:p-7 shadow-xs flex flex-col justify-between space-y-4 sm:space-y-5">
                  <div>
                    {/* Header Title */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
                      <div className="min-w-0">
                        <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                          3. Kanal Pembayaran Resmi
                        </h2>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Pilih metode pembayaran yang akan digunakan.
                        </p>
                      </div>
                      <span className="text-[11px] sm:text-xs text-[#1683FF] font-bold flex items-center gap-1.5 bg-blue-50 px-2.5 sm:px-3 py-1 rounded-full border border-blue-100 shrink-0">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#1683FF] shrink-0" />
                        Verifikasi Otomatis
                      </span>
                    </div>

                    {/* Payment Channel Selector Grid */}
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
                            <div className="w-14 sm:w-16 h-10 px-2 rounded-xl border border-slate-200/80 bg-white flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
                              {channel.logo}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-xs sm:text-sm font-bold text-slate-900 leading-snug break-words">
                                {channel.name}
                              </div>
                              <div className="text-[11px] sm:text-xs text-slate-500 leading-snug break-words mt-0.5">
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
                    <div className="mt-3.5 sm:mt-5 pt-3.5 sm:pt-5 border-t border-slate-100">
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
                            <span className="text-slate-700 font-semibold min-w-0">
                              Nomor Virtual Account {selectedMethod.split("_")[0].toUpperCase()}:
                            </span>
                            <span className="text-[10px] sm:text-xs font-bold text-[#1683FF] bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100 shrink-0">
                              Otomatis Terverifikasi
                            </span>
                          </div>

                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 p-3 sm:p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
                            <span className="font-mono text-base sm:text-2xl font-black text-slate-900 tracking-wider select-all break-all text-center sm:text-left">
                              {vaNumbers[selectedMethod] || "8802918291028371"}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopy(vaNumbers[selectedMethod] || "8802918291028371", "va")}
                              className="w-full sm:w-auto px-4 py-2 bg-[#1683FF] hover:bg-[#0F6FE5] text-white text-xs sm:text-sm font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shrink-0 shadow-xs"
                            >
                              <Copy className="w-4 h-4" />
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
                  <div className="pt-3 border-t border-slate-100 flex items-center gap-2 text-[11px] sm:text-xs text-slate-500">
                    <ShieldCheck className="w-4 h-4 text-[#1683FF] shrink-0" />
                    <span className="min-w-0 break-words">Transaksi dilindungi Sistem Pembayaran Resmi &amp; Terverifikasi Bantuin.</span>
                  </div>
                </div>

              </div>

              {/* Right Column: Rincian Tagihan & Tombol Konfirmasi (5 Cols - Sticky) */}
              <div className="lg:col-span-5 bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 p-4 sm:p-7 shadow-xs flex flex-col justify-between space-y-4 sm:space-y-5 lg:sticky lg:top-6 min-w-0">
                <div className="space-y-3.5 sm:space-y-4">
                  {/* Header */}
                  <div className="flex items-center justify-between gap-2 pb-2.5 sm:pb-3 border-b border-slate-100">
                    <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
                      Rincian Tagihan Promosi
                    </h2>
                    <span className="text-[11px] sm:text-xs font-bold text-[#1683FF] bg-blue-50 px-2.5 py-0.5 sm:py-1 rounded-full border border-blue-100 shrink-0">
                      100% Terverifikasi
                    </span>
                  </div>

                  {/* Compact Multi-item Selection Card */}
                  <div className="p-3 sm:p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-1.5">
                      <span className="text-xs font-bold text-slate-700">Layanan Terpilih ({serviceCount}):</span>
                      {discountAmount > 0 && (
                        <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
                          Diskon Bundling {discountRate * 100}%
                        </span>
                      )}
                    </div>

                    <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                      {effectiveSelectedServices.map((srv) => (
                        <div key={srv.id} className="p-2 bg-white rounded-xl border border-slate-200/70 flex items-center gap-2.5 shadow-2xs min-w-0">
                          <img src={srv.image} alt={srv.title} className="w-10 h-10 rounded-lg object-cover shrink-0 border border-slate-100" />
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-bold text-slate-900 truncate">{srv.title}</div>
                            <div className="text-[10px] text-slate-400">{srv.category} &middot; {formatIDR(srv.price)}</div>
                          </div>
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded shrink-0">
                            Dipromosikan
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center gap-1.5 pt-2 border-t border-slate-200/60 min-w-0">
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

                  {/* Badge Tipe Promosi */}
                  <div className="mb-2.5">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200/80">
                      <Rocket className="w-3 h-3 text-blue-600" />
                      <span>Penempatan Unggulan Beranda Utama</span>
                    </span>
                  </div>

                  {/* Info Promosi */}
                  <div className="p-3 sm:p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-2 text-xs">
                    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                      <span className="text-slate-500 min-w-0 break-words">Target Penempatan:</span>
                      <span className="font-bold text-[#1683FF] text-right max-w-[150px] sm:max-w-none">
                        Jasa Unggulan Beranda
                      </span>
                    </div>
                    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                      <span className="text-slate-500 flex items-center gap-1.5 min-w-0">
                        <Clock className="w-3.5 h-3.5 text-[#1683FF]" />
                        <span>Durasi Tayang:</span>
                      </span>
                      <span className="font-bold text-slate-900 text-right">
                        {selectedPkg.durationDays} Hari Penuh
                      </span>
                    </div>
                    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                      <span className="text-slate-500 flex items-center gap-1.5 min-w-0">
                        <Building2 className="w-3.5 h-3.5 text-[#1683FF]" />
                        <span>Penyedia Jasa:</span>
                      </span>
                      <span className="font-bold text-slate-900 text-right max-w-[150px] sm:max-w-none break-words">
                        {provider.name}
                      </span>
                    </div>
                  </div>

                  {/* Price Breakdown Calculation */}
                  <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 text-slate-600">
                      <span className="min-w-0 break-words">Harga Paket ({selectedPkg.name})</span>
                      <span className="font-semibold text-slate-900 text-right max-w-[150px] sm:max-w-none">{formatIDR(selectedPkg.price)} / layanan</span>
                    </div>

                    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 text-slate-600">
                      <span className="min-w-0 break-words">Subtotal ({serviceCount} Layanan Jasa)</span>
                      <span className="font-semibold text-slate-900 text-right whitespace-nowrap">{formatIDR(subtotalAmount)}</span>
                    </div>

                    {discountAmount > 0 && (
                      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 text-emerald-700 bg-emerald-50/70 p-2 rounded-xl border border-emerald-100 font-bold">
                        <span className="flex items-start gap-1 min-w-0">
                          <Tag className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Diskon Paket Bundling ({discountRate * 100}%)</span>
                        </span>
                        <span className="text-right whitespace-nowrap">- {formatIDR(discountAmount)}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 text-slate-500 text-[11px]">
                      <span className="min-w-0 break-words">Biaya Sistem &amp; Admin</span>
                      <span className="text-emerald-600 font-bold text-right">Gratis (Rp 0)</span>
                    </div>

                    {/* Total Tagihan */}
                    <div className="pt-3 border-t border-slate-200/90 flex items-start justify-between gap-3 mt-1">
                      <div className="min-w-0">
                        <span className="font-black text-xs sm:text-sm text-slate-900 block">Total Tagihan</span>
                        <span className="text-[10px] text-slate-400 font-normal">
                          {discountAmount > 0 ? `Hemat ${formatIDR(discountAmount)} dengan paket bundling` : "Diproses via Gateway Resmi"}
                        </span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[#1683FF] text-xl sm:text-2xl font-black tracking-tight whitespace-nowrap">
                          {formatIDR(totalAmount)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Security Banner */}
                  <div className="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-100 flex items-start gap-2.5 text-[11px] text-emerald-800 leading-snug min-w-0">
                    <Lock className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="min-w-0 break-words">
                      <strong>Pembayaran Aman Bantuin:</strong> Promosi layanan otomatis aktif tayang di Beranda Bantuin setelah verifikasi selesai.
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2 pt-1 sm:pt-2">
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
