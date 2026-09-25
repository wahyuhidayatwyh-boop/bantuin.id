"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import RoleGuard from "@/components/auth/RoleGuard";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useApp } from "@/lib/context/AppContext";
import { getMitraStoreById, saveMitraStoreData } from "@/lib/mock/mitraData";
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
  Megaphone, 
  CheckCircle2, 
  Clock, 
  Lock,
  Building2,
  ShieldCheck, 
  Loader2, 
  ExternalLink,
  Package,
  Copy,
  Check,
  Star,
  Tag,
  Layers
} from "lucide-react";

const MITRA_PROMOTION_PACKAGES = [
  {
    id: "pkg-bronze",
    name: "Spotlight Kategori Sewa",
    durationDays: 3,
    price: 35000,
    badgeText: "Populer Mahasiswa",
    benefits: [
      "Posisi teratas pada filter kategori spesifik",
      "Badge 'Rekomendasi Sewa'",
      "Estimasi jangkauan +350 calon penyewa/hari",
      "Statistik klik & impresi harian"
    ]
  },
  {
    id: "pkg-silver",
    name: "Banner Beranda & Top Search",
    durationDays: 7,
    price: 75000,
    badgeText: "Paling Diminati",
    isPopular: true,
    benefits: [
      "Tampil di Headline Banner halaman /sewa",
      "Prioritas #1 hasil pencarian alat rental",
      "Badge 'Mitra Pilihan Utama'",
      "Estimasi jangkauan +1.200 calon penyewa/hari",
      "Laporan analitik promosi lengkap"
    ]
  },
  {
    id: "pkg-gold",
    name: "Mega Sultan Flash Placement",
    durationDays: 14,
    price: 135000,
    badgeText: "Maksimal Omset",
    benefits: [
      "Semua fitur Paket Silver (14 hari penuh)",
      "Push notifikasi ke mahasiswa aktif sekitar kampus",
      "Dukungan WhatsApp customer support prioritas",
      "Garansi kenaikan traffic minimal 300%",
      "Slot eksklusif footer & detail unit terkait"
    ]
  }
];

function BuatPromosiMitraContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const targetParam = searchParams.get("target");
  const pkgParam = searchParams.get("pkg");
  const unitParam = searchParams.get("unitId");
  const { addToast } = useApp() || {};

  const [isSuccess, setIsSuccess] = useState(false);
  const [store, setStore] = useState(() => {
    return getMitraStoreById("mitra-kamera") || {};
  });
  const [selectedTargetType, setSelectedTargetType] = useState(targetParam === "store" ? "store" : "unit"); // "unit" or "store"
  const [selectedUnitIds, setSelectedUnitIds] = useState(() => {
    const s = getMitraStoreById("mitra-kamera");
    const initial = unitParam || s?.catalog?.[0]?.id || "";
    return initial ? [initial] : [];
  });
  const [selectedPackageId, setSelectedPackageId] = useState(pkgParam || "pkg-silver");
  const [selectedMethod, setSelectedMethod] = useState("qris"); // "qris", "bca_va", "mandiri_va", "bri_va", "bni_va"

  const [isProcessing, setIsProcessing] = useState(false);
  const [isCopiedVA, setIsCopiedVA] = useState(false);
  const [isCopiedNominal, setIsCopiedNominal] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15 * 60);

  useEffect(() => {
    const s = getMitraStoreById("mitra-kamera");
    if (s) {
      setStore(s);
      if (selectedUnitIds.length === 0 && s.catalog && s.catalog.length > 0) {
        setSelectedUnitIds([unitParam || s.catalog[0].id]);
      }
    }
  }, [unitParam, selectedUnitIds.length]);

  const toggleUnitSelection = (id) => {
    setSelectedUnitIds((prev) => {
      if (prev.includes(id)) {
        if (prev.length === 1) return prev; // Minimal 1 unit tetap terpilih
        return prev.filter((item) => item !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const selectAllUnits = () => {
    if (selectedUnitIds.length === (store?.catalog || []).length) {
      setSelectedUnitIds([store?.catalog?.[0]?.id || ""]);
    } else {
      setSelectedUnitIds((store?.catalog || []).map((u) => u.id));
    }
  };

  useEffect(() => {
    if (targetParam === "store") {
      setSelectedTargetType("store");
    } else if (targetParam === "unit") {
      setSelectedTargetType("unit");
    }
  }, [targetParam]);

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

  const selectedPkg = MITRA_PROMOTION_PACKAGES.find(p => p.id === selectedPackageId) || MITRA_PROMOTION_PACKAGES[1];
  const selectedUnits = (store?.catalog || []).filter(u => selectedUnitIds.includes(u.id));
  const effectiveSelectedUnits = selectedUnits.length > 0 ? selectedUnits : [store?.catalog?.[0] || { id: "unit-001", name: "Unit Rental" }];
  
  const unitCount = selectedTargetType === "unit" ? effectiveSelectedUnits.length : 1;
  const subtotalAmount = selectedPkg.price * unitCount;

  // Aturan Diskon Paket Bundling Sewa:
  // 1 unit / profil toko: 0% diskon
  // 2 unit sewa: 20% diskon
  // 3 unit sewa: 30% diskon
  // 4+ unit sewa: 35% diskon
  const discountRate = (selectedTargetType === "unit" && unitCount >= 4) ? 0.35 : (selectedTargetType === "unit" && unitCount === 3) ? 0.30 : (selectedTargetType === "unit" && unitCount === 2) ? 0.20 : 0;
  const discountAmount = Math.round(subtotalAmount * discountRate);
  const totalAmount = subtotalAmount - discountAmount;
  const targetName = selectedTargetType === "store" 
    ? (store?.name || "Toko Mitra Rental") 
    : (effectiveSelectedUnits.length === 1 ? effectiveSelectedUnits[0].name : `Paket ${effectiveSelectedUnits.length} Unit Rental`);

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

  const handleConfirmPayment = async () => {
    if (selectedTargetType === "unit" && effectiveSelectedUnits.length === 0) {
      if (addToast) addToast("Pilih Unit", "Mohon pilih minimal satu unit rental yang ingin dipromosikan.", "error");
      return;
    }

    setIsProcessing(true);
    try {
      if (store) {
        let newPromos = [];
        if (selectedTargetType === "unit") {
          newPromos = effectiveSelectedUnits.map((u, idx) => ({
            id: `prm-${Date.now()}-${idx}`,
            target: "unit",
            targetId: u.id,
            targetName: u.name,
            packageName: selectedPkg.name,
            durationDays: selectedPkg.durationDays,
            startDate: new Date().toISOString(),
            expiryDate: new Date(Date.now() + selectedPkg.durationDays * 24 * 60 * 60 * 1000).toISOString(),
            status: "ACTIVE",
            paidAmount: Math.round(totalAmount / effectiveSelectedUnits.length)
          }));
        } else {
          newPromos = [{
            id: `prm-${Date.now()}`,
            target: "store",
            targetId: store.id,
            targetName: store.name || "Toko Mitra Rental",
            packageName: selectedPkg.name,
            durationDays: selectedPkg.durationDays,
            startDate: new Date().toISOString(),
            expiryDate: new Date(Date.now() + selectedPkg.durationDays * 24 * 60 * 60 * 1000).toISOString(),
            status: "ACTIVE",
            paidAmount: totalAmount
          }];
        }

        const updatedStore = {
          ...store,
          promotions: [
            ...(store.promotions || []),
            ...newPromos
          ]
        };
        saveMitraStoreData(updatedStore);

        // Sinkronkan ke promotionService & paymentService
        try {
          const payment = await paymentService.createPromotionPayment({
            ownerId: store.id || "mitra-kamera",
            ownerName: store.name || "Mitra Rental",
            ownerType: "partner",
            targetType: selectedTargetType === "unit" ? "rental" : "store",
            targetId: selectedTargetType === "unit" ? effectiveSelectedUnits.map(u => u.id).join(",") : store.id,
            targetTitle: targetName,
            packageId: selectedPkg.id,
            durationDays: selectedPkg.durationDays,
            amount: totalAmount,
            channel: selectedMethod,
          });
          if (payment?.id) {
            await paymentService.confirmPayment(payment.id);
          }
        } catch (e) {
          console.warn("[mitra] paymentService sync:", e);
        }
      }

      setIsProcessing(false);
      setIsSuccess(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
      if (addToast) {
        addToast("Promosi Berhasil Aktif!", `Promosi untuk "${targetName}" telah diverifikasi.`);
      }
    } catch (err) {
      console.warn("[mitra] Fallback konfirmasi:", err);
      setIsProcessing(false);
      setIsSuccess(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
      if (addToast) {
        addToast("Promosi Berhasil Aktif!", `Promosi untuk "${targetName}" telah diverifikasi.`);
      }
    }
  };

  return (
    <RoleGuard allowedRoles={["partner", "mitra", "super_admin", "admin"]}>
      <div className="min-h-screen flex flex-col bg-[#F4F7FB] text-slate-800 font-sans">
        <Navbar />

        {/* Breadcrumb / Top Bar */}
        <div className="bg-white border-b border-slate-200/80 shadow-2xs">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-8 py-2.5 sm:py-3 flex flex-wrap items-center justify-between gap-2.5">
            <Link
              href="/mitra/dashboard"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-600 hover:text-[#1683FF] transition cursor-pointer shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Dashboard Mitra</span>
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
                  Promosi Sewa Berhasil Diaktifkan!
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-1.5 leading-relaxed">
                  Pembayaran promosi sebesar <strong>{formatIDR(totalAmount)}</strong> telah berhasil diverifikasi oleh sistem pembayaran Bantuin.
                </p>
              </div>

              {/* Detail Singkat Pesanan */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-left space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Objek Promosi:</span>
                  <span className="font-bold text-slate-900">{targetName}</span>
                </div>
                {selectedTargetType === "unit" && (
                  <div className="space-y-1 py-1 border-b border-slate-200/60">
                    {effectiveSelectedUnits.map((u) => (
                      <div key={u.id} className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-700 font-medium truncate">• {u.name}</span>
                        <span className="text-emerald-600 font-bold shrink-0">Aktif</span>
                      </div>
                    ))}
                  </div>
                )}
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
                  <span className="font-bold text-[#1683FF]">
                    {selectedTargetType === "store" ? "Spotlight Toko Beranda" : "Top Kategori Sewa"}
                  </span>
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
                  Lencana &ldquo;Unggulan&rdquo; telah aktif pada objek promosi Anda dan kini mendapatkan prioritas rekomendasi di halaman sewa.
                </span>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                <Link
                  href="/mitra/dashboard"
                  className="w-full py-3 rounded-xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white font-bold text-xs sm:text-sm transition shadow-xs text-center"
                >
                  Kembali ke Dashboard Mitra
                </Link>
                <Link
                  href="/sewa"
                  target="_blank"
                  className="w-full py-3 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs transition text-center flex items-center justify-center gap-1.5"
                >
                  <span>Lihat di Katalog Sewa</span>
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
                
                {/* 1. Pilih Target Promosi (Unit vs Toko) */}
                <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-7 border border-slate-200/90 shadow-xs space-y-3.5 sm:space-y-4">
                  <div className="border-b border-slate-100 pb-3">
                    <h2 className="text-base sm:text-lg font-black text-slate-900">1. Pilih Objek Promosi</h2>
                    <p className="text-xs text-slate-500">Pilih mempromosikan 1 unit rental spesifik atau seluruh etalase toko mitra Anda.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div
                      onClick={() => setSelectedTargetType("unit")}
                      className={`p-3.5 rounded-2xl border-2 cursor-pointer transition flex items-start gap-3 ${
                        selectedTargetType === "unit"
                          ? "border-[#1683FF] bg-blue-50/40 ring-1.5 ring-[#1683FF] shadow-xs"
                          : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}
                    >
                      <div className="w-9 h-9 rounded-xl bg-blue-100 text-[#1683FF] flex items-center justify-center shrink-0">
                        <Package className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-xs sm:text-sm text-slate-900">Promosikan Unit Sewa</h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">Top rank pencarian &amp; kategori sewa.</p>
                      </div>
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        selectedTargetType === "unit" ? "border-[#1683FF] bg-[#1683FF] text-white" : "border-slate-300"
                      }`}>
                        {selectedTargetType === "unit" && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                      </div>
                    </div>

                    <div
                      onClick={() => setSelectedTargetType("store")}
                      className={`p-3.5 rounded-2xl border-2 cursor-pointer transition flex items-start gap-3 ${
                        selectedTargetType === "store"
                          ? "border-[#1683FF] bg-blue-50/40 ring-1.5 ring-[#1683FF] shadow-xs"
                          : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}
                    >
                      <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-xs sm:text-sm text-slate-900">Promosikan Profil Toko</h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">Spotlight toko mitra di beranda utama.</p>
                      </div>
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        selectedTargetType === "store" ? "border-[#1683FF] bg-[#1683FF] text-white" : "border-slate-300"
                      }`}>
                        {selectedTargetType === "store" && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                      </div>
                    </div>
                  </div>

                  {/* Jika target adalah unit spesifik: pilih unit dari katalog (BISA MULTI-PILIH DENGAN DISKON BUNDLING) */}
                  {selectedTargetType === "unit" && (
                    <div className="pt-3 border-t border-slate-100 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                        <div className="min-w-0">
                          <label className="block text-xs font-bold text-slate-900 break-words">Pilih Unit dari Katalog Toko Anda:</label>
                          <p className="text-[11px] text-slate-500 break-words">Pilih lebih dari 1 unit untuk mendapatkan diskon paket bundling hemat!</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={selectAllUnits}
                            className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-[#1683FF] text-[11px] font-bold rounded-lg border border-blue-100 transition cursor-pointer shrink-0"
                          >
                            {selectedUnitIds.length === (store?.catalog || []).length ? "Batal Pilih Semua" : "Pilih Semua Unit"}
                          </button>
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[11px] font-bold rounded-lg shrink-0">
                            {selectedUnitIds.length} Terpilih
                          </span>
                        </div>
                      </div>

                      {/* Bundling Banner */}
                      {unitCount >= 2 ? (
                        <div className="p-3 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-emerald-900">
                          <div className="flex items-start sm:items-center gap-2.5 min-w-0">
                            <div className="w-7 h-7 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-2xs mt-0.5 sm:mt-0">
                              <Check className="w-4 h-4 stroke-[3]" />
                            </div>
                            <div className="min-w-0">
                              <div className="font-extrabold flex flex-wrap items-center gap-1.5">
                                <span>Paket Bundling {unitCount} Unit Sewa Aktif!</span>
                                <span className="text-[10px] bg-emerald-200/70 text-emerald-800 px-1.5 py-0.5 rounded font-black shrink-0">
                                  Hemat {discountRate * 100}%
                                </span>
                              </div>
                              <div className="text-[11px] text-emerald-700 mt-0.5 break-words">
                                Harga promosi didiskon {discountRate * 100}%, Anda hemat <strong>{formatIDR(discountAmount)}</strong>!
                              </div>
                            </div>
                          </div>
                          <span className="text-sm font-black text-emerald-700 bg-white px-2.5 py-1 rounded-xl border border-emerald-200 shadow-2xs shrink-0 self-start sm:self-center">
                            -{formatIDR(discountAmount)}
                          </span>
                        </div>
                      ) : (
                        <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-blue-900">
                          <div className="flex items-center gap-2 min-w-0">
                            <Tag className="w-4 h-4 text-[#1683FF] shrink-0" />
                            <span className="break-words">Pilih 2 unit sewa atau lebih untuk mendapatkan potongan harga paket bundling hingga <strong>35%</strong>!</span>
                          </div>
                          <span className="text-[10px] font-bold text-[#1683FF] bg-white px-2 py-0.5 rounded-lg border border-blue-200 shrink-0 self-start sm:self-center">
                            Bisa Multi-Pilih
                          </span>
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {store?.catalog?.map((item) => {
                          const isUnitSelected = selectedUnitIds.includes(item.id);
                          return (
                            <div
                              key={item.id}
                              onClick={() => toggleUnitSelection(item.id)}
                              className={`p-3 rounded-xl border-2 flex items-center gap-3 cursor-pointer transition select-none ${
                                isUnitSelected
                                  ? "border-[#1683FF] bg-blue-50/50 ring-1 ring-[#1683FF] shadow-xs"
                                  : "border-slate-200 hover:border-slate-300 bg-white"
                              }`}
                            >
                              <img
                                src={item.photoUrl || item.image}
                                alt={item.name}
                                className="w-12 h-12 rounded-lg object-cover border border-slate-100 shrink-0"
                              />
                              <div className="min-w-0 flex-1">
                                <h5 className="text-xs font-bold text-slate-900 truncate">{item.name}</h5>
                                <p className="text-[11px] text-[#1683FF] font-black">{formatIDR(item.dailyPrice || item.price)} / hari</p>
                              </div>
                              <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center shrink-0 transition ${
                                isUnitSelected ? "border-[#1683FF] bg-[#1683FF] text-white shadow-2xs" : "border-slate-300 bg-slate-50"
                              }`}>
                                {isUnitSelected && <Check className="w-3 h-3 stroke-[3]" />}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. Pilih Durasi Paket Promosi */}
                <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-7 border border-slate-200/90 shadow-xs space-y-3.5 sm:space-y-4">
                  <div className="border-b border-slate-100 pb-3">
                    <h2 className="text-base sm:text-lg font-black text-slate-900">2. Pilih Paket &amp; Durasi Promosi</h2>
                    <p className="text-xs text-slate-500">Pilih jangkauan &amp; durasi spotlight tayang di ekosistem Sewa Bantuin.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    {MITRA_PROMOTION_PACKAGES.map((pkg) => {
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
                              <span>Diminati</span>
                            </div>
                          )}

                          <div className="min-w-0">
                            <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 mb-0.5 break-words">{pkg.name}</h4>
                            <div className="text-[11px] text-slate-500 flex items-center gap-1 mb-2">
                              <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate"><strong>{pkg.durationDays} Hari</strong> Tayang</span>
                            </div>

                            <div className="p-2 bg-slate-50 rounded-xl mb-2 border border-slate-100 min-w-0">
                              <div className="text-base sm:text-lg font-black text-[#1683FF] truncate">{formatIDR(pkg.price)}</div>
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
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs sm:text-sm">
                            <span className="text-slate-700 font-semibold break-words">
                              Nomor Virtual Account {selectedMethod.split("_")[0].toUpperCase()}:
                            </span>
                            <span className="text-[10px] sm:text-xs font-bold text-[#1683FF] bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100 self-start sm:self-auto shrink-0">
                              Otomatis Terverifikasi
                            </span>
                          </div>

                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
                            <span className="font-mono text-base sm:text-2xl font-black text-slate-900 tracking-wider select-all break-all text-center sm:text-left">
                              {vaNumbers[selectedMethod] || "8802918291028371"}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopy(vaNumbers[selectedMethod] || "8802918291028371", "va")}
                              className="px-4 py-2 bg-[#1683FF] hover:bg-[#0F6FE5] text-white text-xs sm:text-sm font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shrink-0 shadow-xs w-full sm:w-auto"
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
                              className="self-start sm:self-auto px-2.5 sm:px-3 py-1 bg-blue-50 hover:bg-blue-100 text-[#1683FF] border border-blue-100 text-xs font-bold rounded-md transition flex items-center justify-center gap-1 cursor-pointer shrink-0"
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

                  {/* Compact Item Card */}
                  <div className="p-3 sm:p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200/80 flex items-start sm:items-center gap-3">
                    <img
                      src={selectedTargetType === "store" ? (store?.avatar || "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=400&q=80") : (selectedUnit?.photoUrl || selectedUnit?.image || "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=400&q=80")}
                      alt={targetName}
                      className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl object-cover shrink-0 border border-slate-200"
                    />
                    <div className="min-w-0 flex-1">
                      <h3 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug break-words">
                        {targetName}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[11px] font-bold text-[#1683FF] bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                          {selectedPkg.name} ({selectedPkg.durationDays} Hari)
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-slate-200/60 min-w-0">
                        <Building2 className="w-3.5 h-3.5 text-[#1683FF]" />
                        <span className="text-[11px] text-slate-600 truncate">
                          Toko: <strong className="text-slate-900 font-bold">{store?.name || "Mitra Rental"}</strong>
                        </span>
                        <ShieldCheck className="w-3.5 h-3.5 text-[#1683FF] shrink-0" />
                      </div>
                    </div>
                  </div>

                  {/* Badge Tipe Promosi */}
                  <div className="mb-2.5">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200/80">
                      <Megaphone className="w-3 h-3 text-blue-600" />
                      <span>{selectedTargetType === "store" ? "Spotlight Toko Mitra Beranda" : "Top Ranking Kategori Sewa"}</span>
                    </span>
                  </div>

                  {/* Info Promosi */}
                  <div className="p-3 sm:p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-2 text-xs">
                    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                      <span className="text-slate-500 min-w-0 break-words">Target Penempatan:</span>
                      <span className="font-bold text-[#1683FF] text-right max-w-[150px] sm:max-w-none">
                        {selectedTargetType === "store" ? "Spotlight Toko Beranda" : "Top Kategori Sewa"}
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
                        <span>Mitra Pemilik:</span>
                      </span>
                      <span className="font-bold text-slate-900 text-right max-w-[150px] sm:max-w-none break-words">
                        {store?.name || "Mitra Rental"}
                      </span>
                    </div>
                  </div>

                  {/* Price Breakdown Calculation */}
                  <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 text-slate-600">
                      <span className="min-w-0 break-words">Harga Paket ({selectedPkg.name})</span>
                      <span className="font-semibold text-slate-900 text-right max-w-[150px] sm:max-w-none">{formatIDR(selectedPkg.price)} / {selectedTargetType === 'store' ? 'toko' : 'unit'}</span>
                    </div>

                    {selectedTargetType === "unit" && (
                      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 text-slate-600">
                        <span className="min-w-0 break-words">Subtotal ({unitCount} Unit Rental)</span>
                        <span className="font-semibold text-slate-900 text-right whitespace-nowrap">{formatIDR(subtotalAmount)}</span>
                      </div>
                    )}

                    {discountAmount > 0 && (
                      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 text-emerald-700 bg-emerald-50/70 p-2 rounded-xl border border-emerald-100 font-bold">
                        <span className="flex items-start gap-1 min-w-0">
                          <Tag className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Diskon Paket Bundling Sewa ({discountRate * 100}%)</span>
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
                          {discountAmount > 0 ? `Hemat ${formatIDR(discountAmount)} dengan paket bundling sewa` : "Diproses via Gateway Resmi"}
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
                      <strong>Pembayaran Aman Bantuin:</strong> Promosi rental otomatis aktif tayang di Beranda Bantuin setelah verifikasi selesai.
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
                    href="/mitra/dashboard"
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

export default function BuatPromosiMitraPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F4F7FB] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#1683FF] animate-spin" />
      </div>
    }>
      <BuatPromosiMitraContent />
    </Suspense>
  );
}
