"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useApp } from "@/lib/context/AppContext";
import { formatIDR } from "@/lib/utils";
import { getProviderById, getAllProviders } from "@/lib/mock/providersData";
import {
  ShieldCheck,
  MapPin,
  Clock,
  Star,
  ArrowLeft,
  MessageCircle,
  Share2,
  CheckCircle2,
  ChevronRight,
  Layers,
  Image as ImageIcon,
  UserCheck,
  Award,
  Package,
  Lock,
  X
} from "lucide-react";

export default function ProviderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { activeKabupaten } = useApp();

  const providerId = params?.id;
  const provider = getProviderById(providerId);

  // States
  // 'katalog' = Katalog Jasa Satuan (Card dengan foto & harga per layanan)
  // 'paketan' = Paketan Bundling (Card bertingkat dengan list fitur)
  // 'portofolio' = Foto & Portofolio
  // 'ulasan' = Ulasan Pelanggan
  // 'tentang' = Profil & Kontak
  const [activeTab, setActiveTab] = useState("katalog");
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [isCopied, setIsCopied] = useState(false);

  // Jika penyedia tidak ditemukan
  if (!provider) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center text-[#1683FF] mb-4 shadow-sm">
            <UserCheck className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-slate-900">Penyedia Jasa Tidak Ditemukan</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1.5 max-w-md">
            Profil penyedia jasa atau helper ini belum tersedia atau tautan salah.
          </p>
          <Link
            href="/jasa"
            className="mt-5 px-6 py-2.5 rounded-xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white font-bold text-xs sm:text-sm shadow-md transition"
          >
            ← Kembali ke Daftar Jasa
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  // Salin Tautan
  const handleShare = () => {
    if (typeof window !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    }
  };

  // Penyedia lain di wilayah yang sama
  const otherProviders = getAllProviders()
    .filter((p) => p.id !== provider.id)
    .slice(0, 3);

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <Navbar />

      <main className="flex-1 pb-16">
        
        {/* Navigasi Kembali */}
        <div className="bg-white border-b border-slate-200/80">
          <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
            <Link
              href="/jasa"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-[#1683FF] transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Daftar Jasa</span>
            </Link>

            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 bg-white text-slate-600 hover:text-slate-900 text-xs font-semibold transition cursor-pointer shadow-2xs"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{isCopied ? "Tautan Disalin!" : "Bagikan"}</span>
            </button>
          </div>
        </div>

        {/* Foto Sampul */}
        <div className="relative w-full h-40 sm:h-56 md:h-64 bg-slate-900 overflow-hidden">
          <img
            src={provider.coverBanner}
            alt={provider.name}
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
          
          <div className="absolute top-4 left-4 sm:left-8">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-md text-slate-800 text-[11px] font-bold shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Siap Terima Pekerjaan</span>
            </span>
          </div>
        </div>

        {/* Kartu Profil Penyedia */}
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 -mt-16 sm:-mt-20 relative z-10">
          <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-7 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-5">
              
              {/* Data Diri */}
              <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-5">
                <div className="relative shrink-0">
                  <img
                    src={provider.avatar}
                    alt={provider.name}
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-4 border-white shadow-md"
                  />
                  {provider.isVerified && (
                    <div className="absolute -bottom-1 -right-1 bg-[#1683FF] text-white p-1 rounded-full border-2 border-white shadow-xs" title="Terverifikasi KTP & SKCK">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded-md bg-blue-50 text-[#1683FF] text-[11px] font-extrabold uppercase border border-blue-100">
                      {provider.type === "helper" ? "Helper Terverifikasi" : "Penyedia Jasa Terverifikasi"}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-100 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      <span>KTP Terverifikasi</span>
                    </span>
                  </div>

                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    {provider.name}
                  </h1>

                  <p className="text-xs sm:text-sm font-semibold text-slate-600">
                    {provider.brandTitle}
                  </p>

                  {/* Rating & Lokasi */}
                  <div className="flex items-center gap-3 sm:gap-4 flex-wrap text-xs text-slate-600 pt-1">
                    <div className="flex items-center gap-1 text-amber-500 font-bold">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>{provider.rating}</span>
                      <span className="text-slate-400 font-medium">({provider.reviewsCount} ulasan)</span>
                    </div>

                    <span className="text-slate-300">•</span>

                    <div className="flex items-center gap-1 text-slate-700 font-medium">
                      <Award className="w-3.5 h-3.5 text-[#1683FF]" />
                      <span>{provider.completedJobs} Pekerjaan Selesai</span>
                    </div>

                    <span className="text-slate-300">•</span>

                    <div className="flex items-center gap-1 text-slate-600">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>Balas ± {provider.responseTime}</span>
                    </div>

                    <span className="text-slate-300">•</span>

                    <div className="flex items-center gap-1 text-slate-600">
                      <MapPin className="w-3.5 h-3.5 text-[#1683FF]" />
                      <span>{provider.location}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tombol Aksi */}
              <div className="flex sm:flex-col gap-2.5 shrink-0 pt-1 sm:pt-0 w-full md:w-auto">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("katalog");
                    const el = document.getElementById("tab-section");
                    if (el) el.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white text-xs sm:text-sm font-bold shadow-xs transition text-center cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Layers className="w-4 h-4" />
                  <span>Katalog Jasa</span>
                </button>

                <button
                  type="button"
                  onClick={() => router.push(`/chat?partnerId=${provider.id}`)}
                  className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs sm:text-sm font-bold transition text-center cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <MessageCircle className="w-4 h-4 text-slate-600" />
                  <span>Chat Penyedia</span>
                </button>
              </div>

            </div>

            {/* Jaminan Singkat */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-500">
              <ShieldCheck className="w-4 h-4 text-[#1683FF] shrink-0" />
              <span>
                <strong>Jaminan Pembayaran Bantuin:</strong> Pembayaran Anda aman dan baru diteruskan setelah pekerjaan disetujui.
              </span>
            </div>
          </div>
        </div>

        {/* Tab Navigasi: Memisahkan dengan Jelas antara KATALOG JASA dan PAKETAN */}
        <div id="tab-section" className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 mt-6">
          <div className="flex items-center gap-2 border-b border-slate-200/90 pb-1 overflow-x-auto no-scrollbar">
            
            {/* TAB 1: KATALOG JASA */}
            <button
              type="button"
              onClick={() => setActiveTab("katalog")}
              className={`px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition cursor-pointer shrink-0 flex items-center gap-2 ${
                activeTab === "katalog"
                  ? "bg-[#1683FF] text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Katalog Jasa ({provider.catalog?.length || 0})</span>
            </button>

            {/* TAB 2: FOTO & HASIL KERJA */}
            <button
              type="button"
              onClick={() => setActiveTab("portofolio")}
              className={`px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition cursor-pointer shrink-0 flex items-center gap-2 ${
                activeTab === "portofolio"
                  ? "bg-[#1683FF] text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <ImageIcon className="w-4 h-4" />
              <span>Foto Hasil Kerja ({provider.portfolioPhotos.length})</span>
            </button>

            {/* TAB 4: ULASAN */}
            <button
              type="button"
              onClick={() => setActiveTab("ulasan")}
              className={`px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition cursor-pointer shrink-0 flex items-center gap-2 ${
                activeTab === "ulasan"
                  ? "bg-[#1683FF] text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <Star className="w-4 h-4" />
              <span>Ulasan ({provider.reviews.length})</span>
            </button>

            {/* TAB 5: PROFIL */}
            <button
              type="button"
              onClick={() => setActiveTab("tentang")}
              className={`px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition cursor-pointer shrink-0 flex items-center gap-2 ${
                activeTab === "tentang"
                  ? "bg-[#1683FF] text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>Profil &amp; Kontak</span>
            </button>

          </div>
        </div>

        {/* Isi Tab */}
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 mt-6">
          
          {/* ============================================================ */}
          {/* TAB 1: KATALOG JASA (CARD DENGAN FOTO & HARGA SATUAN)        */}
          {/* ============================================================ */}
          {activeTab === "katalog" && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                    Katalog Layanan Jasa
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                    Daftar jasa satuan dengan foto dan tarif langsung per pekerjaan.
                  </p>
                </div>
                <span className="text-xs font-bold text-slate-500">
                  {provider.catalog?.length || 0} Layanan Tersedia
                </span>
              </div>

              {/* Grid Card Jasa (Foto + Judul + Deskripsi + Harga Satuan) */}
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4 md:gap-5">
                {provider.catalog?.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-xl sm:rounded-3xl overflow-hidden border border-slate-200/90 shadow-2xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between group"
                  >
                    {/* Foto Jasa */}
                    <div>
                      <div className="relative aspect-4/3 w-full bg-slate-100 overflow-hidden">
                        <img
                          src={item.image}
                          alt={item.title}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute top-2 left-2 sm:top-2.5 sm:left-2.5">
                          <span className="px-1.5 sm:px-2 py-0.5 rounded-md text-[9px] sm:text-[10px] font-extrabold uppercase bg-black/60 text-white backdrop-blur-xs">
                            {item.category}
                          </span>
                        </div>
                      </div>

                      {/* Info Jasa */}
                      <div className="p-2.5 sm:p-4 space-y-1 sm:space-y-1.5">
                        <h3 className="text-xs sm:text-sm font-black text-slate-900 group-hover:text-[#1683FF] transition line-clamp-2 leading-snug min-h-[32px] sm:min-h-0 break-words">
                          {item.title}
                        </h3>
                        <p className="hidden sm:block text-xs text-slate-500 line-clamp-2 leading-relaxed">
                          {item.desc}
                        </p>
                      </div>
                    </div>

                    {/* Harga & Tombol Pesan Jasa */}
                    <div className="p-2.5 sm:p-4 pt-2 sm:pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-2 min-w-0 overflow-hidden">
                      <div className="min-w-0 overflow-hidden">
                        <span className="text-[9px] sm:text-[10px] text-slate-400 block font-medium truncate">Tarif:</span>
                        <div className="text-xs sm:text-base font-black text-[#1683FF] truncate">
                          {formatIDR(item.price)}
                          <span className="text-[9px] sm:text-[10px] font-normal text-slate-500 ml-0.5">{item.unit}</span>
                        </div>
                      </div>

                      <Link
                        href={`/jasa/${item.id}`}
                        className="w-full sm:w-auto justify-center px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-lg sm:rounded-xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white font-bold text-[11px] sm:text-xs transition shadow-2xs cursor-pointer shrink-0 inline-flex items-center gap-1 truncate"
                      >
                        <span>Pesan</span>
                        <ChevronRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}



          {/* ============================================================ */}
          {/* TAB 3: FOTO HASIL KERJA                                      */}
          {/* ============================================================ */}
          {activeTab === "portofolio" && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                    Foto &amp; Hasil Kerja
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                    Klik foto untuk memperbesar tampilan.
                  </p>
                </div>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-700">
                  {provider.portfolioPhotos.length} Foto
                </span>
              </div>

              {/* Grid Foto */}
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-5">
                {provider.portfolioPhotos.map((photo, idx) => (
                  <div
                    key={idx}
                    onClick={() => setSelectedPhoto(photo)}
                    className="group bg-white rounded-xl sm:rounded-2xl overflow-hidden border border-slate-200/80 shadow-2xs hover:shadow-md transition-all duration-300 cursor-pointer flex flex-col"
                  >
                    <div className="relative aspect-16/10 overflow-hidden bg-slate-900">
                      <img
                        src={photo.url}
                        alt={photo.title}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-2 left-2 sm:top-3 sm:left-3">
                        <span className="px-1.5 sm:px-2.5 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-white text-[9px] sm:text-[10px] font-bold">
                          {photo.category}
                        </span>
                      </div>
                    </div>

                    <div className="p-2.5 sm:p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <h4 className="font-bold text-xs sm:text-sm text-slate-900 group-hover:text-[#1683FF] transition line-clamp-1 sm:line-clamp-2">
                          {photo.title}
                        </h4>
                        <p className="hidden sm:block text-xs text-slate-500 mt-1 line-clamp-2">
                          {photo.description}
                        </p>
                      </div>

                      <div className="mt-2 sm:mt-3 pt-2 sm:pt-2.5 border-t border-slate-100 flex items-center justify-between text-[10px] sm:text-[11px] text-[#1683FF] font-bold">
                        <span>Lihat Foto</span>
                        <ChevronRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 4: ULASAN PELANGGAN                                      */}
          {/* ============================================================ */}
          {activeTab === "ulasan" && (
            <div className="space-y-5 animate-in fade-in duration-200">
              
              {/* Ringkasan Skor Ulasan */}
              <div className="rounded-3xl bg-white border border-slate-200/90 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row items-center gap-5 sm:gap-8">
                <div className="text-center sm:border-r sm:border-slate-100 sm:pr-8 shrink-0">
                  <div className="text-4xl sm:text-5xl font-black text-slate-900">
                    {provider.rating}
                  </div>
                  <div className="flex items-center justify-center gap-0.5 my-1 text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <div className="text-xs text-slate-500 font-medium">
                    Dari <strong>{provider.reviewsCount}</strong> ulasan
                  </div>
                </div>

                <div className="flex-1 w-full space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                    <span>Tingkat Kepuasan</span>
                    <span className="text-emerald-600">100% Puas</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full w-[99%]" />
                  </div>
                  <p className="text-xs text-slate-400 pt-0.5">
                    Ulasan terverifikasi dari pesanan yang telah selesai dikerjakan.
                  </p>
                </div>
              </div>

              {/* Daftar Ulasan */}
              <div className="space-y-3.5">
                {provider.reviews.map((rev) => (
                  <div
                    key={rev.id}
                    className="rounded-2xl bg-white border border-slate-200/80 p-4 sm:p-5 shadow-2xs space-y-2.5"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={rev.userAvatar}
                          alt={rev.userName}
                          className="w-9 h-9 rounded-full object-cover border border-slate-100"
                        />
                        <div>
                          <h4 className="font-bold text-xs sm:text-sm text-slate-900">
                            {rev.userName}
                          </h4>
                          <span className="text-[11px] text-slate-400">
                            {rev.date}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-0.5 text-amber-400">
                        {[...Array(rev.rating)].map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                    </div>

                    <div className="inline-block px-2.5 py-0.5 rounded-md bg-blue-50 text-[#1683FF] text-[10px] font-semibold">
                      Pesanan: {rev.packageName}
                    </div>

                    <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                      &ldquo;{rev.comment}&rdquo;
                    </p>
                  </div>
                ))}
              </div>

            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 5: PROFIL & KONTAK                                       */}
          {/* ============================================================ */}
          {activeTab === "tentang" && (
            <div className="space-y-5 animate-in fade-in duration-200">
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Biodata & Keahlian */}
                <div className="md:col-span-2 space-y-5">
                  <div className="rounded-3xl bg-white border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-3">
                    <h3 className="text-base font-black text-slate-900">
                      Tentang Penyedia
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                      {provider.bio}
                    </p>
                  </div>

                  <div className="rounded-3xl bg-white border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-3">
                    <h3 className="text-base font-black text-slate-900">
                      Keahlian &amp; Peralatan
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {provider.skills.map((skill, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-800 text-xs font-semibold"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Info Lokasi & Kontak */}
                <div className="space-y-5">
                  <div className="rounded-3xl bg-white border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-4">
                    <h3 className="text-base font-black text-slate-900">
                      Lokasi &amp; Kontak
                    </h3>

                    <div className="space-y-3 text-xs">
                      <div>
                        <span className="text-slate-400 font-semibold block">Wilayah Operasional:</span>
                        <span className="text-slate-800 font-bold">{provider.location}</span>
                        <span className="text-slate-500 block text-[11px] mt-0.5">{provider.address}</span>
                      </div>

                      <div className="pt-2 border-t border-slate-100">
                        <span className="text-slate-400 font-semibold block">Waktu Respon:</span>
                        <span className="text-slate-800 font-bold">Rata-rata {provider.responseTime}</span>
                      </div>

                      <div className="pt-2 border-t border-slate-100">
                        <span className="text-slate-400 font-semibold block">Status Verifikasi:</span>
                        <span className="text-emerald-600 font-bold flex items-center gap-1 mt-0.5">
                          <ShieldCheck className="w-4 h-4" />
                          <span>KTP &amp; Identitas Terverifikasi</span>
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => router.push(`/chat?partnerId=${provider.id}`)}
                      className="w-full mt-3 py-2.5 rounded-xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white text-xs font-bold transition shadow-xs cursor-pointer text-center flex items-center justify-center gap-2"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Kirim Pesan Langsung</span>
                    </button>
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Rekomendasi Penyedia Lainnya */}
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 mt-10 pt-8 border-t border-slate-200/80">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-black text-slate-900">
                Penyedia Jasa &amp; Helper Lainnya di {activeKabupaten}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Spesialis dan tenaga bantuan terpercaya dengan transaksi terverifikasi.
              </p>
            </div>
            <Link
              href="/jasa"
              className="text-xs font-bold text-[#1683FF] hover:underline"
            >
              Lihat Semua
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {otherProviders.map((other) => (
              <Link
                key={other.id}
                href={`/jasa/penyedia/${other.id}`}
                className="group bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs hover:shadow-md hover:border-[#1683FF]/40 transition-all flex items-center gap-3.5"
              >
                <img
                  src={other.avatar}
                  alt={other.name}
                  className="w-12 h-12 rounded-xl object-cover shrink-0 group-hover:scale-105 transition-transform"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1 text-[11px] text-amber-500 font-bold">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>{other.rating}</span>
                    <span className="text-slate-400 font-normal">({other.reviewsCount})</span>
                  </div>
                  <h4 className="font-bold text-xs sm:text-sm text-slate-900 truncate group-hover:text-[#1683FF] transition">
                    {other.name}
                  </h4>
                  <p className="text-[11px] text-slate-500 truncate">
                    {other.brandTitle}
                  </p>
                  <span className="text-[11px] font-bold text-[#1683FF] block mt-0.5">
                    Tarif Mulai {formatIDR(other.catalog?.[0]?.price || other.packages?.[0]?.price || 50000)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>

      </main>

      {/* ============================================================ */}
      {/* MODAL 1: PRATINJAU FOTO BESAR                                */}
      {/* ============================================================ */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="relative max-w-3xl w-full bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-white/10">
            <button
              type="button"
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/60 text-white hover:bg-black/90 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="max-h-[65vh] bg-black flex items-center justify-center overflow-hidden">
              <img
                src={selectedPhoto.url}
                alt={selectedPhoto.title}
                className="max-h-[65vh] w-auto object-contain"
              />
            </div>

            <div className="p-4 sm:p-5 bg-slate-950 text-white">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#1683FF] bg-blue-500/10 px-2.5 py-0.5 rounded-full inline-block mb-1">
                {selectedPhoto.category}
              </span>
              <h3 className="text-base font-bold">
                {selectedPhoto.title}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {selectedPhoto.description}
              </p>
            </div>
          </div>
        </div>
      )}



      <Footer />
    </div>
  );
}
