"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useApp } from "@/lib/context/AppContext";
import { formatIDR } from "@/lib/utils";
import { 
  getAllProviders, 
  getStartingPrice, 
  getAllCatalogServices 
} from "@/lib/mock/providersData";
import { 
  Palette, 
  Search, 
  Camera, 
  Laptop, 
  Video, 
  Layers, 
  Wrench, 
  FileText, 
  Hammer, 
  X,
  MapPin, 
  CheckCircle2, 
  Star,
  ChevronRight,
  Filter,
  Check,
  Store,
  Clock,
  ShieldCheck,
  Globe
} from "lucide-react";

// Kategori dengan Icon 3D Biru Glossy
const CATEGORY_ICONS = [
  { id: "Semua", name: "Semua Jasa", icon: Layers },
  { id: "Helper", name: "Bantuan Tenaga", icon: Hammer },
  { id: "Desain", name: "Desain Grafis", icon: Palette },
  { id: "Teknisi", name: "Teknisi AC", icon: Wrench },
  { id: "Fotografi", name: "Fotografi", icon: Camera },
  { id: "Komputer", name: "Servis Laptop", icon: Laptop },
  { id: "Web & IT", name: "Web & IT", icon: Video },
  { id: "Bahasa", name: "Penerjemah", icon: FileText },
];

// Sub-Kategori Cepat untuk Filter Jasa
const SUB_CATEGORIES = {
  Desain: [
    { id: "Semua", label: "Semua Desain", query: "" },
    { id: "Logo", label: "Logo & Identitas Brand", query: "logo" },
    { id: "Kemasan", label: "Kemasan & Label Produk", query: "kemasan" },
    { id: "Sosial Media", label: "Feed Instagram", query: "feed" },
    { id: "Cetak", label: "Spanduk & Banner", query: "banner" },
    { id: "UI/UX", label: "UI/UX Mobile App", query: "ui" },
  ],
  Helper: [
    { id: "Semua", label: "Semua Bantuan Tenaga", query: "" },
    { id: "Pindahan", label: "Pindahan Kos", query: "pindahan" },
    { id: "Angkat", label: "Angkat Kasur & Lemari", query: "kasur" },
    { id: "Logistik", label: "Bongkar Muat Pickup", query: "pickup" },
    { id: "Errand", label: "Antar Berkas & Dokumen", query: "berkas" },
    { id: "Perabot", label: "Rakit Meja & Lemari", query: "rakit" },
  ],
  Teknisi: [
    { id: "Semua", label: "Semua Teknisi", query: "" },
    { id: "Cuci AC", label: "Cuci Bersih AC Split", query: "cuci" },
    { id: "Freon", label: "Tambah Freon R32/R410A", query: "freon" },
    { id: "Perbaikan", label: "Perbaikan AC Bocor", query: "bocor" },
    { id: "Instalasi", label: "Bongkar Pasang AC", query: "pasang" },
    { id: "Listrik", label: "Perbaikan Listrik & MCB", query: "listrik" },
  ],
  Fotografi: [
    { id: "Semua", label: "Semua Fotografi", query: "" },
    { id: "Wisuda", label: "Foto Wisuda Solo", query: "wisuda" },
    { id: "Keluarga", label: "Wisuda Keluarga", query: "keluarga" },
    { id: "Event", label: "Dokumentasi Acara", query: "seminar" },
    { id: "Potret", label: "Foto Profil & LinkedIn", query: "potret" },
    { id: "Komersial", label: "Foto Produk Cafe", query: "produk" },
  ],
  Komputer: [
    { id: "Semua", label: "Semua Servis Laptop", query: "" },
    { id: "Instal", label: "Instal Ulang OS", query: "instal" },
    { id: "Cleaning", label: "Ganti Thermal Pasta", query: "pasta" },
    { id: "Upgrade", label: "Upgrade SSD & RAM", query: "ssd" },
    { id: "Hardware", label: "Ganti Keyboard & Baterai", query: "keyboard" },
  ],
  "Web & IT": [
    { id: "Semua", label: "Semua Web & IT", query: "" },
    { id: "Landing Page", label: "Landing Page Promosi", query: "landing" },
    { id: "Website", label: "Website UMKM", query: "website" },
    { id: "Frontend", label: "Web App Modern React/Next", query: "react" },
    { id: "Bugfix", label: "Perbaikan Bug Koding", query: "bug" },
  ],
  Bahasa: [
    { id: "Semua", label: "Semua Penerjemah", query: "" },
    { id: "Jurnal", label: "Penerjemah Jurnal & Skripsi", query: "jurnal" },
    { id: "Proofreading", label: "Proofreading Abstrak", query: "abstrak" },
    { id: "Dokumen", label: "Terjemahan Dokumen Resmi", query: "dokumen" },
  ],
};

export default function JasaPage() {
  const { 
    activeKabupaten = "Kabupaten Banyumas",
    filterByKabupaten = true,
    setFilterByKabupaten,
    isItemInCurrentKabupaten
  } = useApp() || {};
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [selectedSubCategory, setSelectedSubCategory] = useState("Semua");
  const [currentPage, setCurrentPage] = useState(1);

  const ITEMS_PER_PAGE = 16;

  // Data
  const allCatalog = useMemo(() => getAllCatalogServices(), []);
  const allProvidersList = useMemo(() => getAllProviders(), []);

  // Reset sub-category and page when main category changes
  const handleSelectCategory = (catId) => {
    setSelectedCategory(catId);
    setSelectedSubCategory("Semua");
    setCurrentPage(1);
  };

  // Helper untuk mengecek apakah jasa merupakan layanan online/digital (bisa dipesan dari mana saja)
  const isOnlineOrDigitalService = (item) => {
    const catGroup = (item.categoryGroup || "").toLowerCase();
    const cat = (item.category || "").toLowerCase();
    const title = (item.title || "").toLowerCase();
    const provCity = (item.provider?.city || "").toLowerCase();

    return (
      catGroup.includes("desain") ||
      catGroup.includes("web") ||
      catGroup.includes("it") ||
      catGroup.includes("bahasa") ||
      cat.includes("logo") ||
      cat.includes("ui") ||
      cat.includes("landing") ||
      cat.includes("jurnal") ||
      cat.includes("abstrak") ||
      title.includes("online") ||
      provCity.includes("online") ||
      provCity.includes("remote")
    );
  };

  // Sub-categories list for active category
  const activeSubCategories = useMemo(() => {
    if (selectedCategory === "Semua" || selectedCategory === "Penyedia") {
      return [];
    }
    return SUB_CATEGORIES[selectedCategory] || [];
  }, [selectedCategory]);

  // Filter Catalog Services
  const filteredCatalog = useMemo(() => {
    if (selectedCategory === "Penyedia") return [];

    return allCatalog.filter((item) => {
      // 1. Filter Wilayah (Sesuai Nav atau Semua Wilayah)
      // Jasa online/digital dapat dipesan dari mana saja (seluruh Indonesia).
      // Jasa lapangan (helper, teknisi AC, dsb.) dicocokkan dengan wilayah nav saat filter aktif.
      if (filterByKabupaten) {
        const isDigital = isOnlineOrDigitalService(item);
        if (!isDigital) {
          const itemLoc = {
            city: item.provider?.city,
            address: item.provider?.address || item.provider?.location,
            location: item.provider?.location,
            latitude: item.provider?.latitude,
            longitude: item.provider?.longitude
          };
          const isLocal = isItemInCurrentKabupaten ? isItemInCurrentKabupaten(itemLoc) : true;
          if (!isLocal) return false;
        }
      }

      // 2. Filter Category Group
      const matchCategory =
        selectedCategory === "Semua" ||
        item.categoryGroup.toLowerCase() === selectedCategory.toLowerCase() ||
        (selectedCategory === "Helper" && item.categoryGroup.toLowerCase().includes("helper")) ||
        (selectedCategory === "Desain" && item.categoryGroup.toLowerCase().includes("desain")) ||
        (selectedCategory === "Teknisi" && item.categoryGroup.toLowerCase().includes("teknisi")) ||
        (selectedCategory === "Fotografi" && item.categoryGroup.toLowerCase().includes("foto")) ||
        (selectedCategory === "Komputer" && (item.categoryGroup.toLowerCase().includes("komputer") || item.categoryGroup.toLowerCase().includes("laptop"))) ||
        (selectedCategory === "Web & IT" && (item.categoryGroup.toLowerCase().includes("web") || item.categoryGroup.toLowerCase().includes("it"))) ||
        (selectedCategory === "Bahasa" && item.categoryGroup.toLowerCase().includes("bahasa"));

      if (!matchCategory) return false;

      // 3. Filter Sub-Category
      if (selectedSubCategory !== "Semua") {
        const subCatObj = activeSubCategories.find((s) => s.id === selectedSubCategory);
        const subMatch =
          item.category.toLowerCase().includes(selectedSubCategory.toLowerCase()) ||
          (subCatObj?.query && item.title.toLowerCase().includes(subCatObj.query.toLowerCase())) ||
          (subCatObj?.query && item.desc.toLowerCase().includes(subCatObj.query.toLowerCase()));

        if (!subMatch) return false;
      }

      // 4. Filter Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchSearch =
          item.title.toLowerCase().includes(q) ||
          item.desc.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q) ||
          item.provider.name.toLowerCase().includes(q);

        if (!matchSearch) return false;
      }

      return true;
    });
  }, [allCatalog, selectedCategory, selectedSubCategory, searchQuery, activeSubCategories, filterByKabupaten, isItemInCurrentKabupaten]);

  // Filter Providers (if "Penyedia" category is selected)
  const filteredProviders = useMemo(() => {
    if (selectedCategory !== "Penyedia") return [];

    const q = searchQuery.toLowerCase().trim();

    return allProvidersList.filter((p) => {
      // Filter Wilayah untuk Penyedia
      if (filterByKabupaten) {
        const isDigital = 
          p.category?.toLowerCase().includes("desain") ||
          p.category?.toLowerCase().includes("web") ||
          p.category?.toLowerCase().includes("bahasa") ||
          p.city?.toLowerCase().includes("online");

        if (!isDigital) {
          const isLocal = isItemInCurrentKabupaten ? isItemInCurrentKabupaten(p) : true;
          if (!isLocal) return false;
        }
      }

      if (!q) return true;

      return (
        p.name.toLowerCase().includes(q) ||
        p.brandTitle.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.skills.some((s) => s.toLowerCase().includes(q))
      );
    });
  }, [allProvidersList, selectedCategory, searchQuery, filterByKabupaten, isItemInCurrentKabupaten]);

  // Pagination for catalog
  const totalPages = Math.ceil(filteredCatalog.length / ITEMS_PER_PAGE);
  const paginatedCatalog = filteredCatalog.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const goToPage = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F7FB] text-slate-800 font-sans">
      <Navbar />

      <main className="flex-1 max-w-[1360px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        
        {/* Header Title + Toggle Wilayah (seperti sewa page) */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Katalog Jasa {filterByKabupaten ? `di ${activeKabupaten}` : "Semua Wilayah"}
              </h1>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-100/70 text-[#1683FF] border border-blue-200">
                {selectedCategory === "Penyedia" 
                  ? `${filteredProviders.length} mitra penyedia` 
                  : `${filteredCatalog.length} layanan tersedia`}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500">
              Pilih layanan langsung dari katalog. Jasa digital dapat dipesan dari mana saja, dan jasa fisik siap datang ke lokasimu.
            </p>
          </div>

          {/* Toggle Wilayah — di header seperti sewa */}
          <div className="flex items-center p-1 bg-white border border-slate-200 rounded-xl shadow-2xs text-xs shrink-0 self-start md:self-auto">
            <button
              type="button"
              onClick={() => { setFilterByKabupaten?.(true); setCurrentPage(1); }}
              className={`px-3.5 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                filterByKabupaten
                  ? "bg-[#1683FF] text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Hanya {activeKabupaten}
            </button>
            <button
              type="button"
              onClick={() => { setFilterByKabupaten?.(false); setCurrentPage(1); }}
              className={`px-3.5 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                !filterByKabupaten
                  ? "bg-[#1683FF] text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Semua Wilayah
            </button>
          </div>
        </div>

        {/* Card Kategori Terpadu: Search + Wilayah + Icon Kategori + Sub-Kategori */}
        {/* Background card identik dengan footer (#EBF3FE & border #D0E2FA) */}
        <div className="relative bg-[#EBF3FE] border border-[#D0E2FA] rounded-3xl p-5 sm:p-6 shadow-xs space-y-5 overflow-hidden">

          {/* ── Dekorasi identik footer ── */}
          {/* 1. Dot Grid Pattern */}
          <div
            className="absolute inset-0 pointer-events-none opacity-35 rounded-3xl"
            style={{
              backgroundImage: "radial-gradient(#1683FF 1.2px, transparent 1.2px)",
              backgroundSize: "24px 24px",
            }}
          />
          {/* 2. Ambient Glow Orbs */}
          <div className="absolute -top-12 -left-12 w-60 h-60 bg-blue-300/30 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-1/2 -right-10 w-48 h-48 bg-sky-200/35 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 left-1/3 w-44 h-44 bg-indigo-200/25 rounded-full blur-3xl pointer-events-none" />
          {/* 3. SVG Wave Corner Accent */}
          <svg
            className="absolute -right-6 -bottom-4 w-56 h-40 pointer-events-none opacity-25 text-[#1683FF]"
            viewBox="0 0 420 320"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M0 240C120 180 240 300 420 210V320H0V240Z" fill="currentColor" fillOpacity="0.12" />
            <path d="M30 190C150 150 270 260 420 170" stroke="currentColor" strokeWidth="2" strokeOpacity="0.35" />
            <path d="M0 270C140 220 260 320 420 250" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.2" />
          </svg>
          {/* ── /Dekorasi ── */}

          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder={selectedCategory === "Penyedia" ? "Cari nama penyedia jasa / helper..." : "Cari jasa (cuci AC, logo, pindahan, perbaikan laptop)..."}
              className="w-full text-xs sm:text-sm pl-10 pr-9 py-2.5 rounded-2xl border border-[#C5DAFD] focus:border-[#1683FF] focus:ring-2 focus:ring-[#1683FF]/15 bg-white/90 text-slate-900 transition outline-none shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setCurrentPage(1);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Divider Halus */}
          <div className="border-t border-[#D0E2FA]/80" />

          {/* Baris 2: Icon Kategori */}
          <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar pb-1">
            {CATEGORY_ICONS.map((cat) => {
              const Icon = cat.icon;
              const isSelected = selectedCategory === cat.id;

              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleSelectCategory(cat.id)}
                  className={`group flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-2xl transition-all duration-200 cursor-pointer shrink-0 min-w-[76px] sm:min-w-[88px] ${
                    isSelected
                      ? "bg-white/90 border-2 border-[#1683FF] shadow-xs"
                      : "border-2 border-transparent hover:bg-white/60"
                  }`}
                >
                  {/* 3D Blue Glossy Dome Icon */}
                  <div
                    className={`relative w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center transition-transform duration-200 mb-1.5 overflow-hidden ${
                      isSelected
                        ? "bg-gradient-to-b from-[#4EA6FF] via-[#1683FF] to-[#0A62D7] shadow-[0_4px_12px_rgba(22,131,255,0.35)] scale-105"
                        : "bg-white border border-slate-200/60 shadow-2xs group-hover:bg-blue-50/80 group-hover:scale-105"
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-0.5 left-1 right-1 h-2.5 bg-gradient-to-b from-white/70 via-white/20 to-transparent rounded-t-lg pointer-events-none" />
                    )}
                    <Icon
                      className={`w-5 h-5 sm:w-5.5 sm:h-5.5 stroke-[2.2] transition-colors ${
                        isSelected
                          ? "text-white drop-shadow-[0_1px_2px_rgba(0,30,80,0.4)]"
                          : "text-slate-600 group-hover:text-[#1683FF]"
                      }`}
                    />
                  </div>

                  {/* Label Kategori */}
                  <span
                    className={`text-[11px] sm:text-xs font-bold transition-colors leading-tight line-clamp-1 ${
                      isSelected ? "text-[#1683FF]" : "text-slate-700 group-hover:text-slate-900"
                    }`}
                  >
                    {cat.name}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Baris 3: Sub-Kategori Quick Filter Pills (Jika Ada) */}
          {activeSubCategories.length > 0 && (
            <div className="pt-3 border-t border-[#D0E2FA]/80 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mr-1 shrink-0">
                Pilihan:
              </span>
              {activeSubCategories.map((sub) => {
                const isSubSelected = selectedSubCategory === sub.id;
                return (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => {
                      setSelectedSubCategory(sub.id);
                      setCurrentPage(1);
                    }}
                    className={`px-3 py-1 rounded-xl text-[11px] font-bold transition whitespace-nowrap cursor-pointer shrink-0 ${
                      isSubSelected
                        ? "bg-[#1683FF] text-white shadow-xs"
                        : "bg-white/80 hover:bg-white text-slate-700 border border-slate-200/60 shadow-2xs"
                    }`}
                  >
                    {sub.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ============================================================ */}
        {/* TAMPILAN 1: KATALOG LANGSUNG (DEFAULT & FOKUS UTAMA)         */}
        {/* ============================================================ */}
        {selectedCategory !== "Penyedia" && (
          <div className="space-y-6">
            
            {/* Grid Produk Jasa Langsung */}
            {filteredCatalog.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {paginatedCatalog.map((item) => {
                  const isDigital = isOnlineOrDigitalService(item);
                  return (
                    <Link
                      key={item.id}
                      href={`/jasa/${item.id}`}
                      className="group bg-white rounded-3xl border border-slate-200/90 hover:border-[#1683FF]/40 shadow-2xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between overflow-hidden cursor-pointer"
                    >
                      <div>
                        {/* Foto Layanan (Aspect Ratio 16:10) */}
                        <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100">
                          <img
                            src={item.image}
                            alt={item.title}
                            loading="lazy"
                            className="w-full h-full object-cover group-hover:scale-106 transition-transform duration-500 ease-out"
                          />
                          <div className="absolute top-3 left-3 flex items-center gap-1.5">
                            <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-black/60 text-white backdrop-blur-xs shadow-xs">
                              {item.category}
                            </span>
                          </div>
                          
                          {/* Badge Digital vs Datang ke Lokasi */}
                          <div className="absolute top-3 right-3">
                            {isDigital ? (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-600 text-white shadow-xs flex items-center gap-1">
                                <Globe className="w-2.5 h-2.5" />
                                <span>Digital</span>
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-900/80 backdrop-blur-xs text-white shadow-xs flex items-center gap-1">
                                <MapPin className="w-2.5 h-2.5 text-amber-300" />
                                <span>Datang ke Lokasi</span>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Detail Judul & Deskripsi */}
                        <div className="p-4 sm:p-5 space-y-2.5">
                          <h3 className="font-bold text-sm sm:text-base text-slate-900 group-hover:text-[#1683FF] transition-colors line-clamp-2 leading-snug">
                            {item.title}
                          </h3>

                          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                            {item.desc}
                          </p>

                          {/* Mitra Penyedia Info */}
                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2 min-w-0">
                              <img
                                src={item.provider.avatar}
                                alt={item.provider.name}
                                className="w-6 h-6 rounded-full object-cover border border-slate-200 shrink-0"
                              />
                              <span className="truncate font-semibold text-slate-700">
                                {item.provider.name}
                              </span>
                              {item.provider.isVerified && (
                                <CheckCircle2 className="w-3.5 h-3.5 text-[#1683FF] shrink-0" />
                              )}
                            </div>

                            <div className="flex items-center gap-1 font-bold text-amber-500 shrink-0">
                              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                              <span>{item.provider.rating}</span>
                            </div>
                          </div>

                          {/* Lokasi / Layanan Area */}
                          <div className="flex items-center text-[11px] text-slate-400 pt-0.5">
                            <span className="flex items-center gap-1 truncate">
                              <MapPin className="w-3 h-3 text-[#1683FF] shrink-0" />
                              <span className="truncate">{item.provider.location}</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Footer Harga & Tombol Pesan */}
                      <div className="px-4 sm:px-5 py-3 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between gap-2">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block leading-tight">
                            Tarif Mulai:
                          </span>
                          <div className="flex items-baseline gap-1">
                            <span className="text-sm sm:text-base font-black text-[#1683FF]">
                              {formatIDR(item.price)}
                            </span>
                            {item.unit && (
                              <span className="text-[10px] font-semibold text-slate-400">
                                {item.unit}
                              </span>
                            )}
                          </div>
                        </div>

                        <span className="px-3 py-1.5 rounded-xl bg-[#1683FF] text-white text-xs font-bold group-hover:bg-[#0F6FE5] transition shadow-2xs flex items-center gap-1">
                          <span>Pesan</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              /* State Kosong */
              <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto space-y-3">
                <Search className="w-10 h-10 text-slate-300 mx-auto" />
                <h3 className="font-bold text-slate-900 text-base">
                  Layanan Jasa Tidak Ditemukan
                </h3>
                <p className="text-xs text-slate-500">
                  {filterByKabupaten
                    ? `Tidak ada layanan di ${activeKabupaten} untuk filter ini. Anda dapat membuka pencarian ke seluruh wilayah.`
                    : "Tidak ada layanan yang cocok dengan kata kunci atau kategori yang Anda pilih."}
                </p>
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2">
                  {filterByKabupaten && (
                    <button
                      type="button"
                      onClick={() => {
                        setFilterByKabupaten?.(false);
                        setCurrentPage(1);
                      }}
                      className="px-4 py-2 bg-[#1683FF] text-white rounded-xl text-xs font-bold hover:bg-[#0F6FE5] transition"
                    >
                      Buka Semua Wilayah
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedCategory("Semua");
                      setSelectedSubCategory("Semua");
                    }}
                    className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200 transition"
                  >
                    Reset Filter
                  </button>
                </div>
              </div>
            )}

            {/* Pagination jika lebih dari 1 halaman */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-4">
                {[...Array(totalPages)].map((_, idx) => {
                  const pNum = idx + 1;
                  const isActive = currentPage === pNum;
                  return (
                    <button
                      key={pNum}
                      type="button"
                      onClick={() => goToPage(pNum)}
                      className={`w-9 h-9 rounded-xl text-xs font-bold transition cursor-pointer ${
                        isActive
                          ? "bg-[#1683FF] text-white shadow-xs"
                          : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {pNum}
                    </button>
                  );
                })}
              </div>
            )}

          </div>
        )}

        {/* ============================================================ */}
        {/* TAMPILAN 2: DAFTAR PENYEDIA JASA (KETIKA TAB PENYEDIA DIPILIH) */}
        {/* ============================================================ */}
        {selectedCategory === "Penyedia" && (
          <div className="space-y-6">
            
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
              <div>
                <h2 className="text-lg font-black text-slate-900">
                  Mitra Penyedia Jasa &amp; Tenaga Bantuan Terverifikasi
                </h2>
                <p className="text-xs text-slate-500">
                  {filterByKabupaten ? `Penyedia dan tenaga bantuan di ${activeKabupaten} serta spesialis digital.` : "Seluruh mitra penyedia dan tenaga bantuan terdaftar di Indonesia."}
                </p>
              </div>
              <span className="text-xs font-bold text-slate-500">
                {filteredProviders.length} Mitra Terdaftar
              </span>
            </div>

            {/* Grid Penyedia Jasa */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredProviders.map((provider) => {
                const startingPrice = getStartingPrice(provider);
                return (
                  <div
                    key={provider.id}
                    className="group bg-white rounded-3xl border border-slate-200 hover:border-[#1683FF]/40 shadow-2xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between overflow-hidden"
                  >
                    <div className="p-5 space-y-4">
                      {/* Header Mitra */}
                      <div className="flex items-start gap-3.5">
                        <div className="relative shrink-0">
                          <img
                            src={provider.avatar}
                            alt={provider.name}
                            className="w-14 h-14 rounded-2xl object-cover border-2 border-slate-100 shadow-xs group-hover:scale-105 transition-transform duration-300"
                          />
                          {provider.isVerified && (
                            <span
                              className="absolute -bottom-1 -right-1 p-0.5 bg-[#1683FF] text-white rounded-full border-2 border-white shadow-xs"
                              title="Terverifikasi"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </span>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap mb-1">
                            <span
                              className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md ${
                                provider.type === "helper"
                                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                                  : "bg-blue-50 text-[#1683FF] border border-blue-100"
                              }`}
                            >
                              {provider.type === "helper" ? "Helper" : "Penyedia Jasa"}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400">
                              • {provider.completedJobs} Selesai
                            </span>
                          </div>

                          <Link
                            href={`/jasa/penyedia/${provider.id}`}
                            className="font-black text-sm sm:text-base text-slate-900 hover:text-[#1683FF] transition line-clamp-1 block"
                          >
                            {provider.name}
                          </Link>
                          <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                            {provider.brandTitle}
                          </p>
                        </div>
                      </div>

                      {/* Rating & Lokasi */}
                      <div className="flex items-center justify-between text-xs py-2 px-3 rounded-xl bg-slate-50/80 border border-slate-100 text-slate-600">
                        <div className="flex items-center gap-1 font-bold text-amber-500">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          <span>{provider.rating}</span>
                          <span className="text-slate-400 font-normal">({provider.reviewsCount})</span>
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-slate-500">
                          <MapPin className="w-3 h-3 text-[#1683FF]" />
                          <span className="truncate max-w-[140px]">{provider.location}</span>
                        </div>
                      </div>

                      {/* Bio Singkat */}
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {provider.bio}
                      </p>

                      {/* Keahlian Tags */}
                      <div className="flex flex-wrap gap-1.5">
                        {provider.skills.slice(0, 3).map((skill, sIdx) => (
                          <span
                            key={sIdx}
                            className="text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Footer Profil */}
                    <div className="p-4 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between gap-3">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block leading-tight">
                          Tarif Mulai:
                        </span>
                        <span className="text-sm sm:text-base font-black text-[#1683FF]">
                          {formatIDR(startingPrice)}
                        </span>
                      </div>

                      <Link
                        href={`/jasa/penyedia/${provider.id}`}
                        className="px-3.5 py-2 rounded-xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white text-xs font-bold transition shadow-xs flex items-center gap-1 cursor-pointer"
                      >
                        <span>Kunjungi Profil</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        )}

      </main>

      <Footer />
    </div>
  );
}
