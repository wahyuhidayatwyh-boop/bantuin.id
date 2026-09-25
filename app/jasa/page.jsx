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
import CategoryIcon from "@/components/common/CategoryIcon";
import { JASA_CATEGORIES } from "@/lib/categories";
import { 
  Search, 
  Layers, 
  X,
  MapPin, 
  CheckCircle2, 
  Star,
  ChevronLeft,
  ChevronRight,
  Filter,
  Check,
  Globe,
  ArrowUpDown,
  ChevronDown
} from "lucide-react";

// Kategori ikon dari sumber kebenaran tunggal (lib/categories.js)
const CATEGORY_ICONS = JASA_CATEGORIES;

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

const SORT_OPTIONS = [
  { id: "rekomendasi", label: "Rekomendasi" },
  { id: "harga_rendah", label: "Harga Terendah" },
  { id: "harga_tinggi", label: "Harga Tertinggi" },
  { id: "rating", label: "Rating Tertinggi" },
  { id: "terpopuler", label: "Paling Populer" },
];

const SERVICE_TYPES = [
  { id: "all", label: "Semua Tipe" },
  { id: "digital", label: "Jasa Digital (Online / Remote)" },
  { id: "onsite", label: "Jasa Fisik (Datang ke Lokasi)" },
];

const PRICE_RANGES = [
  { id: "all", label: "Semua Biaya" },
  { id: "under_100k", label: "Di bawah Rp 100 rb" },
  { id: "100k_500k", label: "Rp 100 rb - 500 rb" },
  { id: "above_500k", label: "Di atas Rp 500 rb" },
];

export default function JasaPage() {
  const { 
    activeKabupaten = "Kabupaten Banyumas",
    filterByKabupaten = true,
    setFilterByKabupaten,
    isItemInCurrentKabupaten,
    setIsGpsModalOpen
  } = useApp() || {};
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [selectedSubCategory, setSelectedSubCategory] = useState("Semua");
  const [serviceTypeFilter, setServiceTypeFilter] = useState("all");
  const [priceFilter, setPriceFilter] = useState("all");
  const [sortBy, setSortBy] = useState("rekomendasi");
  const [activeModal, setActiveModal] = useState(null); // null | "kategori" | "wilayah" | "filter" | "urutkan"
  const [currentPage, setCurrentPage] = useState(1);

  const controlsRef = useRef(null);

  const ITEMS_PER_PAGE = 16;

  // Data
  const allCatalog = useMemo(() => getAllCatalogServices(), []);
  const allProvidersList = useMemo(() => getAllProviders(), []);

  // Close desktop dropdowns when clicking outside or pressing Escape
  useEffect(() => {
    function handleClickOutside(event) {
      if (controlsRef.current && !controlsRef.current.contains(event.target)) {
        setActiveModal(null);
      }
    }
    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setActiveModal(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

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

  // Filter Catalog Services (Wilayah, Kategori, Sub-Kategori, Pencarian)
  const filteredCatalog = useMemo(() => {
    if (selectedCategory === "Penyedia") return [];

    return allCatalog.filter((item) => {
      // 1. Filter Wilayah
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

  // Sort & Advanced Filter Catalog Services
  const sortedAndFilteredCatalog = useMemo(() => {
    let list = [...filteredCatalog];

    // Filter service type
    if (serviceTypeFilter === "digital") {
      list = list.filter((item) => isOnlineOrDigitalService(item));
    } else if (serviceTypeFilter === "onsite") {
      list = list.filter((item) => !isOnlineOrDigitalService(item));
    }

    // Filter price range
    if (priceFilter === "under_100k") {
      list = list.filter((item) => (item.price || 0) <= 100000);
    } else if (priceFilter === "100k_500k") {
      list = list.filter((item) => (item.price || 0) >= 100000 && (item.price || 0) <= 500000);
    } else if (priceFilter === "above_500k") {
      list = list.filter((item) => (item.price || 0) > 500000);
    }

    // Sort
    if (sortBy === "harga_rendah") {
      list.sort((a, b) => (a.price || 0) - (b.price || 0));
    } else if (sortBy === "harga_tinggi") {
      list.sort((a, b) => (b.price || 0) - (a.price || 0));
    } else if (sortBy === "rating") {
      list.sort((a, b) => (b.provider?.rating || 0) - (a.provider?.rating || 0));
    } else if (sortBy === "terpopuler") {
      list.sort((a, b) => (b.provider?.completedJobs || 0) - (a.provider?.completedJobs || 0));
    }

    return list;
  }, [filteredCatalog, serviceTypeFilter, priceFilter, sortBy]);

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

  // Reset page when search or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, selectedSubCategory, filterByKabupaten, serviceTypeFilter, priceFilter, sortBy]);

  // Pagination for catalog & providers
  const isProviderTab = selectedCategory === "Penyedia";
  const activeItemsCount = isProviderTab ? filteredProviders.length : sortedAndFilteredCatalog.length;
  const totalPages = Math.ceil(activeItemsCount / ITEMS_PER_PAGE) || 1;
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, activeItemsCount);
  const paginatedCatalog = sortedAndFilteredCatalog.slice(startIndex, endIndex);
  const paginatedProviders = filteredProviders.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 200, behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F7FB] text-slate-800 font-sans">
      <Navbar />

      <main className="flex-1 max-w-[1360px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-7 space-y-4 sm:space-y-5">
        
        {/* ============================================================ */}
        {/* DESKTOP HEADER & CARD KATEGORI TERPADU (sm: and up)          */}
        {/* ============================================================ */}
        <div className="hidden sm:block space-y-4">
          
          {/* Header Title, Count & Wilayah Toggle */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
                  Katalog Jasa {filterByKabupaten ? `di ${activeKabupaten.replace(/^Kabupaten\s+/i, 'Kab. ')}` : "Semua Wilayah"}
                </h1>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-[#1683FF] border border-blue-200">
                  {selectedCategory === "Penyedia" 
                    ? `${filteredProviders.length} mitra penyedia` 
                    : `${sortedAndFilteredCatalog.length} layanan tersedia`}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500">
                Pilih layanan langsung dari katalog. Jasa digital dapat dipesan dari mana saja, dan jasa fisik siap datang ke lokasimu.
              </p>
            </div>

            {/* Toggle Wilayah di header */}
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
                Hanya {activeKabupaten.replace(/^Kabupaten\s+/i, 'Kab. ')}
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

          {/* Card Kategori Terpadu Berwarna: Search + Icon Kategori + Sub-Kategori */}
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

            {/* Search Bar Desktop */}
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
                const isSelected = selectedCategory === cat.id;
                const displayName = cat.name || cat.label;

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
                      <CategoryIcon
                        category={cat}
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
                      {displayName}
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

          {/* Kontrol Filter Tambahan Desktop (Tipe Layanan, Biaya, Urutkan) */}
          <div ref={controlsRef} className="flex items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2">
              {/* Tipe Layanan Filter */}
              <div className="flex items-center p-1 bg-white border border-slate-200 rounded-xl shadow-2xs text-xs">
                {SERVICE_TYPES.map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setServiceTypeFilter(st.id)}
                    className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                      serviceTypeFilter === st.id
                        ? "bg-[#1683FF] text-white shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {st.id === "all" ? "Semua Tipe" : st.id === "digital" ? "Digital" : "Fisik / Datang"}
                  </button>
                ))}
              </div>

              {/* Rentang Biaya Popover */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setActiveModal(activeModal === "desktop_filter" ? null : "desktop_filter")}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition cursor-pointer shadow-2xs ${
                    priceFilter !== "all"
                      ? "bg-blue-50 border-[#1683FF] text-[#1683FF]"
                      : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <Filter className="w-3.5 h-3.5 text-slate-500" />
                  <span>
                    {priceFilter === "all" ? "Biaya" : PRICE_RANGES.find(p => p.id === priceFilter)?.label}
                  </span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>
                {activeModal === "desktop_filter" && (
                  <div className="absolute top-full left-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-30 animate-in fade-in zoom-in-95 duration-150">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block px-2 pb-1.5 mb-1 border-b border-slate-100">
                      Rentang Biaya
                    </span>
                    <div className="space-y-0.5">
                      {PRICE_RANGES.map((pr) => (
                        <button
                          key={pr.id}
                          type="button"
                          onClick={() => {
                            setPriceFilter(pr.id);
                            setActiveModal(null);
                          }}
                          className={`w-full px-2.5 py-1.5 rounded-lg text-xs text-left transition flex items-center justify-between cursor-pointer ${
                            priceFilter === pr.id ? "bg-blue-50 text-[#1683FF] font-bold" : "hover:bg-slate-50 text-slate-700"
                          }`}
                        >
                          <span>{pr.label}</span>
                          {priceFilter === pr.id && <Check className="w-3.5 h-3.5 text-[#1683FF]" />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Urutkan Dropdown on Desktop */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setActiveModal(activeModal === "desktop_sort" ? null : "desktop_sort")}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition cursor-pointer shadow-2xs ${
                  sortBy !== "rekomendasi"
                    ? "bg-blue-50 border-[#1683FF] text-[#1683FF]"
                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
              >
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
                <span>{SORT_OPTIONS.find((s) => s.id === sortBy)?.label || "Urutkan"}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>
              {activeModal === "desktop_sort" && (
                <div className="absolute top-full right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-30 animate-in fade-in zoom-in-95 duration-150">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block px-2 pb-1.5 mb-1 border-b border-slate-100">
                    Urutan Layanan
                  </span>
                  <div className="space-y-0.5">
                    {SORT_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          setSortBy(opt.id);
                          setActiveModal(null);
                        }}
                        className={`w-full px-2.5 py-1.5 rounded-lg text-xs text-left transition flex items-center justify-between cursor-pointer ${
                          sortBy === opt.id ? "bg-blue-50 text-[#1683FF] font-bold" : "hover:bg-slate-50 text-slate-700"
                        }`}
                      >
                        <span>{opt.label}</span>
                        {sortBy === opt.id && <Check className="w-3.5 h-3.5 text-[#1683FF]" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* ============================================================ */}
        {/* MOBILE HEADER & FILTER SECTION (< 640px)                     */}
        {/* ============================================================ */}
        <div className="sm:hidden space-y-3">
          
          {/* Header Title Mobile */}
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              Katalog Jasa {filterByKabupaten ? `di ${activeKabupaten.replace(/^Kabupaten\s+/i, 'Kab. ')}` : "Semua Wilayah"}
            </h1>
            <p className="text-[11px] font-bold text-[#1683FF] mt-0.5">
              {selectedCategory === "Penyedia" 
                ? `${filteredProviders.length} mitra tersedia` 
                : `${sortedAndFilteredCatalog.length} layanan tersedia`}
            </p>
          </div>

          {/* Search Bar Mobile */}
          <div className="relative">
            <div className="relative flex items-center bg-white border border-slate-300 focus-within:border-[#1683FF] focus-within:ring-4 focus-within:ring-[#1683FF]/15 rounded-2xl shadow-xs transition-all">
              <Search className="w-4 h-4 text-slate-400 ml-3.5 shrink-0 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Cari jasa..."
                className="w-full h-11 pl-2.5 pr-9 text-xs text-slate-900 placeholder:text-slate-400 font-medium bg-transparent outline-none rounded-2xl"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setCurrentPage(1);
                  }}
                  className="absolute right-3 p-1 rounded-full text-slate-400 hover:text-slate-700 transition cursor-pointer"
                  title="Hapus pencarian"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* 4 Compact Filter Buttons on Mobile: [ Kategori ] [ Wilayah ] [ Filter ] [ Urutkan ] */}
          <div className="grid grid-cols-4 gap-1.5">
            {/* Kategori Button */}
            <button
              type="button"
              onClick={() => setActiveModal(activeModal === "kategori" ? null : "kategori")}
              className={`flex items-center justify-center gap-1 px-2 py-2 rounded-xl text-[11px] font-semibold border transition cursor-pointer shadow-2xs ${
                selectedCategory !== "Semua"
                  ? "bg-blue-50 border-[#1683FF] text-[#1683FF]"
                  : "bg-white border-slate-200 text-slate-700"
              }`}
            >
              <Layers className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Kategori</span>
              {selectedCategory !== "Semua" && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#1683FF] shrink-0" />
              )}
            </button>

            {/* Wilayah Button */}
            <button
              type="button"
              onClick={() => setActiveModal(activeModal === "wilayah" ? null : "wilayah")}
              className={`flex items-center justify-center gap-1 px-2 py-2 rounded-xl text-[11px] font-semibold border transition cursor-pointer shadow-2xs ${
                filterByKabupaten
                  ? "bg-blue-50 border-[#1683FF] text-[#1683FF]"
                  : "bg-white border-slate-200 text-slate-700"
              }`}
            >
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Wilayah</span>
              {filterByKabupaten && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#1683FF] shrink-0" />
              )}
            </button>

            {/* Filter Button */}
            <button
              type="button"
              onClick={() => setActiveModal(activeModal === "filter" ? null : "filter")}
              className={`flex items-center justify-center gap-1 px-2 py-2 rounded-xl text-[11px] font-semibold border transition cursor-pointer shadow-2xs ${
                serviceTypeFilter !== "all" || priceFilter !== "all"
                  ? "bg-blue-50 border-[#1683FF] text-[#1683FF]"
                  : "bg-white border-slate-200 text-slate-700"
              }`}
            >
              <Filter className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Filter</span>
              {(serviceTypeFilter !== "all" || priceFilter !== "all") && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#1683FF] shrink-0" />
              )}
            </button>

            {/* Urutkan Button */}
            <button
              type="button"
              onClick={() => setActiveModal(activeModal === "urutkan" ? null : "urutkan")}
              className={`flex items-center justify-center gap-1 px-2 py-2 rounded-xl text-[11px] font-semibold border transition cursor-pointer shadow-2xs ${
                sortBy !== "rekomendasi"
                  ? "bg-blue-50 border-[#1683FF] text-[#1683FF]"
                  : "bg-white border-slate-200 text-slate-700"
              }`}
            >
              <ArrowUpDown className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Urutkan</span>
              {sortBy !== "rekomendasi" && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#1683FF] shrink-0" />
              )}
            </button>
          </div>
        </div>

          {/* ============================================================ */}
          {/* MOBILE BOTTOM SHEET FOR ALL 4 CONTROLS                       */}
          {/* ============================================================ */}
          {activeModal && (
            <div className="fixed inset-0 z-50 sm:hidden flex flex-col justify-end">
              <div 
                className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
                onClick={() => setActiveModal(null)}
              />
              <div className="relative z-10 bg-white rounded-t-3xl border-t border-slate-200 shadow-2xl p-5 max-h-[82vh] overflow-y-auto space-y-4 animate-in slide-in-from-bottom duration-200 pb-[max(env(safe-area-inset-bottom),1.5rem)]">
                
                {/* Drag Handle */}
                <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto -mt-1 mb-1" />

                {/* Header Sheet */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    {activeModal === "kategori" && <Layers className="w-4 h-4 text-[#1683FF]" />}
                    {activeModal === "wilayah" && <MapPin className="w-4 h-4 text-[#1683FF]" />}
                    {activeModal === "filter" && <Filter className="w-4 h-4 text-[#1683FF]" />}
                    {activeModal === "urutkan" && <ArrowUpDown className="w-4 h-4 text-[#1683FF]" />}
                    <h3 className="font-extrabold text-sm text-slate-900">
                      {activeModal === "kategori" && "Pilih Kategori Jasa"}
                      {activeModal === "wilayah" && "Cakupan Wilayah"}
                      {activeModal === "filter" && "Filter Layanan"}
                      {activeModal === "urutkan" && "Urutkan Layanan"}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveModal(null)}
                    className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Content: Kategori Sheet */}
                {activeModal === "kategori" && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      {CATEGORY_ICONS.map((cat) => {
                        const isSelected = selectedCategory === cat.id;
                        const displayName = cat.name || cat.label;
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => {
                              handleSelectCategory(cat.id);
                              if (!SUB_CATEGORIES[cat.id]) {
                                setActiveModal(null);
                              }
                            }}
                            className={`p-3 rounded-2xl border text-left flex items-center gap-2.5 transition cursor-pointer ${
                              isSelected
                                ? "bg-blue-50 border-[#1683FF] text-[#1683FF] font-bold shadow-2xs"
                                : "bg-slate-50/80 border-slate-200/80 text-slate-700 font-semibold hover:bg-slate-100"
                            }`}
                          >
                            <CategoryIcon category={cat} className={`w-4 h-4 shrink-0 ${isSelected ? "text-[#1683FF]" : "text-slate-500"}`} />
                            <span className="text-xs truncate">{displayName}</span>
                          </button>
                        );
                      })}
                    </div>

                    {activeSubCategories.length > 0 && (
                      <div className="pt-3 border-t border-slate-100">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                          Pilihan Sub-Kategori {selectedCategory}:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {activeSubCategories.map((sub) => {
                            const isSubSelected = selectedSubCategory === sub.id;
                            return (
                              <button
                                key={sub.id}
                                type="button"
                                onClick={() => {
                                  setSelectedSubCategory(sub.id);
                                  setActiveModal(null);
                                }}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                                  isSubSelected
                                    ? "bg-[#1683FF] text-white shadow-xs"
                                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                                }`}
                              >
                                {sub.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Content: Wilayah Sheet */}
                {activeModal === "wilayah" && (
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => {
                        setFilterByKabupaten?.(true);
                        setActiveModal(null);
                      }}
                      className={`w-full p-3.5 rounded-2xl border text-left flex items-start gap-3 transition cursor-pointer ${
                        filterByKabupaten
                          ? "bg-blue-50 border-[#1683FF] text-[#1683FF] font-bold"
                          : "border-slate-200 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full border mt-0.5 flex items-center justify-center shrink-0 ${
                        filterByKabupaten ? "border-[#1683FF] bg-[#1683FF]" : "border-slate-300"
                      }`}>
                        {filterByKabupaten && <Check className="w-3 h-3 text-white stroke-[3]" />}
                      </div>
                      <div>
                        <div className="text-xs font-bold">Hanya {activeKabupaten}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                          Menampilkan jasa lokal terdekat &amp; jasa digital dari mana saja
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setFilterByKabupaten?.(false);
                        setActiveModal(null);
                      }}
                      className={`w-full p-3.5 rounded-2xl border text-left flex items-start gap-3 transition cursor-pointer ${
                        !filterByKabupaten
                          ? "bg-blue-50 border-[#1683FF] text-[#1683FF] font-bold"
                          : "border-slate-200 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full border mt-0.5 flex items-center justify-center shrink-0 ${
                        !filterByKabupaten ? "border-[#1683FF] bg-[#1683FF]" : "border-slate-300"
                      }`}>
                        {!filterByKabupaten && <Check className="w-3 h-3 text-white stroke-[3]" />}
                      </div>
                      <div>
                        <div className="text-xs font-bold">Semua Wilayah</div>
                        <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                          Menampilkan seluruh penyedia layanan dari 38 provinsi
                        </div>
                      </div>
                    </button>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-slate-500">Pusat Lokasi Perangkat:</span>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveModal(null);
                          setIsGpsModalOpen?.(true);
                        }}
                        className="font-bold text-[#1683FF] hover:underline cursor-pointer"
                      >
                        Ganti GPS / Wilayah
                      </button>
                    </div>
                  </div>
                )}

                {/* Content: Filter Sheet */}
                {activeModal === "filter" && (
                  <div className="space-y-4">
                    <div>
                      <span className="text-xs font-bold text-slate-900 block mb-2">
                        Tipe Layanan
                      </span>
                      <div className="space-y-1.5">
                        {SERVICE_TYPES.map((st) => (
                          <button
                            key={st.id}
                            type="button"
                            onClick={() => setServiceTypeFilter(st.id)}
                            className={`w-full p-2.5 rounded-xl border text-xs text-left transition cursor-pointer flex items-center justify-between ${
                              serviceTypeFilter === st.id
                                ? "bg-blue-50 border-[#1683FF] text-[#1683FF] font-bold"
                                : "border-slate-200 text-slate-700 hover:bg-slate-50"
                            }`}
                          >
                            <span>{st.label}</span>
                            {serviceTypeFilter === st.id && <Check className="w-4 h-4 text-[#1683FF]" />}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className="text-xs font-bold text-slate-900 block mb-2">
                        Rentang Biaya
                      </span>
                      <div className="space-y-1.5">
                        {PRICE_RANGES.map((pr) => (
                          <button
                            key={pr.id}
                            type="button"
                            onClick={() => setPriceFilter(pr.id)}
                            className={`w-full p-2.5 rounded-xl border text-xs text-left transition cursor-pointer flex items-center justify-between ${
                              priceFilter === pr.id
                                ? "bg-blue-50 border-[#1683FF] text-[#1683FF] font-bold"
                                : "border-slate-200 text-slate-700 hover:bg-slate-50"
                            }`}
                          >
                            <span>{pr.label}</span>
                            {priceFilter === pr.id && <Check className="w-4 h-4 text-[#1683FF]" />}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setServiceTypeFilter("all");
                          setPriceFilter("all");
                        }}
                        className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
                      >
                        Reset Filter
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveModal(null)}
                        className="flex-1 py-2.5 rounded-xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white text-xs font-bold transition shadow-xs cursor-pointer"
                      >
                        Terapkan
                      </button>
                    </div>
                  </div>
                )}

                {/* Content: Urutkan Sheet */}
                {activeModal === "urutkan" && (
                  <div className="space-y-1.5">
                    {SORT_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          setSortBy(opt.id);
                          setActiveModal(null);
                        }}
                        className={`w-full p-3 rounded-2xl border text-xs text-left transition cursor-pointer flex items-center justify-between ${
                          sortBy === opt.id
                            ? "bg-blue-50 border-[#1683FF] text-[#1683FF] font-bold"
                            : "border-slate-200 text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <span>{opt.label}</span>
                        {sortBy === opt.id && <Check className="w-4 h-4 text-[#1683FF]" />}
                      </button>
                    ))}
                  </div>
                )}

              </div>
            </div>
          )}

          {/* Active Chips & Clear All */}
          {(selectedCategory !== "Semua" || selectedSubCategory !== "Semua" || serviceTypeFilter !== "all" || priceFilter !== "all" || searchQuery) && (
            <div className="flex items-center gap-1.5 flex-wrap pt-0.5 text-xs">
              <span className="text-slate-400 font-semibold text-[11px]">Filter aktif:</span>
              
              {selectedCategory !== "Semua" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-[#1683FF] font-bold text-[11px] border border-blue-100">
                  <span>{selectedCategory}</span>
                  <button
                    type="button"
                    onClick={() => handleSelectCategory("Semua")}
                    className="hover:text-blue-900 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {selectedSubCategory !== "Semua" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-[#1683FF] font-bold text-[11px] border border-blue-100">
                  <span>{selectedSubCategory}</span>
                  <button
                    type="button"
                    onClick={() => setSelectedSubCategory("Semua")}
                    className="hover:text-blue-900 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {serviceTypeFilter !== "all" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-[#1683FF] font-bold text-[11px] border border-blue-100">
                  <span>{SERVICE_TYPES.find((s) => s.id === serviceTypeFilter)?.label}</span>
                  <button
                    type="button"
                    onClick={() => setServiceTypeFilter("all")}
                    className="hover:text-blue-900 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {priceFilter !== "all" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-[#1683FF] font-bold text-[11px] border border-blue-100">
                  <span>{PRICE_RANGES.find((p) => p.id === priceFilter)?.label}</span>
                  <button
                    type="button"
                    onClick={() => setPriceFilter("all")}
                    className="hover:text-blue-900 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {searchQuery && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-bold text-[11px] border border-slate-200">
                  <span>&quot;{searchQuery}&quot;</span>
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="hover:text-slate-900 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              <button
                type="button"
                onClick={() => {
                  setSelectedCategory("Semua");
                  setSelectedSubCategory("Semua");
                  setServiceTypeFilter("all");
                  setPriceFilter("all");
                  setSearchQuery("");
                  setSortBy("rekomendasi");
                  setCurrentPage(1);
                }}
                className="text-[11px] font-bold text-slate-500 hover:text-rose-600 transition underline cursor-pointer ml-1"
              >
                Reset Semua
              </button>
            </div>
          )}

          {/* -------------------------------------------------- */}
          {/* Section Divider & Heading: Daftar jasa               */}
          {/* -------------------------------------------------- */}
          <div className="pt-2 sm:pt-3 border-t border-slate-200/80 flex items-center justify-between">
            <h2 className="text-sm sm:text-base font-extrabold text-slate-900">
              Daftar jasa
            </h2>
            <span className="text-xs text-slate-500 font-medium">
              {selectedCategory === "Penyedia" 
                ? `${filteredProviders.length} mitra` 
                : `${sortedAndFilteredCatalog.length} layanan`}
            </span>
          </div>

        {/* ============================================================ */}
        {/* TAMPILAN 1: KATALOG LANGSUNG (DEFAULT & FOKUS UTAMA)         */}
        {/* ============================================================ */}
        {selectedCategory !== "Penyedia" && (
          <div className="space-y-6">
            
            {/* Grid Produk Jasa Langsung (2 Kolom di Mobile) */}
            {filteredCatalog.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-4 md:gap-5">
                {paginatedCatalog.map((item) => {
                  const isDigital = isOnlineOrDigitalService(item);
                  return (
                    <Link
                      key={item.id}
                      href={`/jasa/${item.id}`}
                      className="group bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 hover:border-[#1683FF]/40 shadow-2xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between overflow-hidden cursor-pointer"
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
                          <div className="absolute top-2 left-2 sm:top-3 sm:left-3 flex items-center gap-1.5">
                            <span className="text-[9px] sm:text-[11px] font-bold px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-md sm:rounded-lg bg-black/60 text-white backdrop-blur-xs shadow-xs">
                              {item.category}
                            </span>
                          </div>
                          
                          {/* Badge Digital vs Datang ke Lokasi */}
                          <div className="absolute top-2 right-2 sm:top-3 sm:right-3">
                            {isDigital ? (
                              <span className="text-[8px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-md bg-blue-600 text-white shadow-xs flex items-center gap-0.5 sm:gap-1">
                                <Globe className="w-2.5 h-2.5" />
                                <span>Digital</span>
                              </span>
                            ) : (
                              <span className="text-[8px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-md bg-slate-900/80 backdrop-blur-xs text-white shadow-xs flex items-center gap-0.5 sm:gap-1">
                                <MapPin className="w-2.5 h-2.5 text-amber-300" />
                                <span className="hidden xs:inline">Lokasi</span>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Detail Judul & Deskripsi */}
                        <div className="p-2.5 sm:p-4 sm:p-5 space-y-1 sm:space-y-2.5 min-w-0 overflow-hidden">
                          <h3 className="font-bold text-xs sm:text-base text-slate-900 group-hover:text-[#1683FF] transition-colors line-clamp-2 leading-tight sm:leading-snug min-h-[32px] sm:min-h-[44px] break-words">
                            {item.title}
                          </h3>

                          <p className="hidden sm:line-clamp-2 text-xs text-slate-500 leading-relaxed">
                            {item.desc}
                          </p>

                          {/* Mitra Penyedia Info */}
                          <div className="pt-1.5 sm:pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] sm:text-xs min-w-0">
                            <div className="flex items-center gap-1.5 min-w-0 truncate">
                              <img
                                src={item.provider.avatar}
                                alt={item.provider.name}
                                className="w-4 h-4 sm:w-6 sm:h-6 rounded-full object-cover border border-slate-200 shrink-0"
                              />
                              <span className="truncate font-semibold text-slate-700 max-w-[80px] sm:max-w-none">
                                {item.provider.name}
                              </span>
                              {item.provider.isVerified && (
                                <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#1683FF] shrink-0" />
                              )}
                            </div>

                            <div className="flex items-center gap-0.5 sm:gap-1 font-bold text-amber-500 shrink-0">
                              <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-amber-400 text-amber-400" />
                              <span>{item.provider.rating}</span>
                            </div>
                          </div>

                          {/* Lokasi / Layanan Area */}
                          <div className="flex items-center text-[10px] sm:text-[11px] text-slate-400 pt-0.5 min-w-0">
                            <span className="flex items-center gap-1 truncate w-full">
                              <MapPin className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#1683FF] shrink-0" />
                              <span className="truncate">{item.provider.location}</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Footer Harga & Tombol Pesan */}
                      <div className="px-2.5 sm:px-5 py-2 sm:py-3 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between gap-1 sm:gap-2 min-w-0 overflow-hidden">
                        <div className="min-w-0 overflow-hidden">
                          <span className="text-[9px] sm:text-[10px] uppercase font-bold text-slate-400 block leading-tight truncate">
                            Mulai:
                          </span>
                          <div className="flex items-baseline gap-0.5 sm:gap-1 min-w-0">
                            <span className="text-xs sm:text-base font-black text-[#1683FF] truncate">
                              {formatIDR(item.price)}
                            </span>
                            {item.unit && (
                              <span className="text-[9px] sm:text-[10px] font-semibold text-slate-400 hidden xs:inline shrink-0">
                                {item.unit}
                              </span>
                            )}
                          </div>
                        </div>

                        <span className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl bg-[#1683FF] text-white text-[10px] sm:text-xs font-bold group-hover:bg-[#0F6FE5] transition shrink-0 shadow-2xs">
                          Pesan
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

            {/* Pagination Navigasi Halaman */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 pt-6 border-t border-slate-200/80">
                {/* Info Jumlah */}
                <div className="text-xs text-slate-500 font-medium order-2 sm:order-1">
                  Menampilkan <span className="font-bold text-slate-800">{startIndex + 1}</span> - <span className="font-bold text-slate-800">{endIndex}</span> dari <span className="font-bold text-slate-800">{filteredCatalog.length}</span> layanan
                </div>

                {/* Kontrol Halaman */}
                <div className="flex items-center gap-1.5 order-1 sm:order-2">
                  {/* Tombol Sebelumnya */}
                  <button
                    type="button"
                    onClick={() => handlePageChange(safeCurrentPage - 1)}
                    disabled={safeCurrentPage === 1}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1 border shadow-2xs ${
                      safeCurrentPage === 1
                        ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:text-slate-900 cursor-pointer"
                    }`}
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Sebelumnya</span>
                  </button>

                  {/* Tombol Angka Halaman */}
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                      if (
                        totalPages > 6 &&
                        pageNum !== 1 &&
                        pageNum !== totalPages &&
                        Math.abs(pageNum - safeCurrentPage) > 1
                      ) {
                        if (
                          (pageNum === 2 && safeCurrentPage > 3) ||
                          (pageNum === totalPages - 1 && safeCurrentPage < totalPages - 2)
                        ) {
                          return (
                            <span key={pageNum} className="px-1.5 text-xs text-slate-400 font-bold">
                              ...
                            </span>
                          );
                        }
                        return null;
                      }

                      const isActive = pageNum === safeCurrentPage;
                      return (
                        <button
                          key={pageNum}
                          type="button"
                          onClick={() => handlePageChange(pageNum)}
                          className={`w-8 h-8 rounded-xl text-xs font-bold transition flex items-center justify-center cursor-pointer ${
                            isActive
                              ? "bg-[#1683FF] text-white shadow-2xs ring-2 ring-[#1683FF]/20"
                              : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:text-slate-900"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  {/* Tombol Berikutnya */}
                  <button
                    type="button"
                    onClick={() => handlePageChange(safeCurrentPage + 1)}
                    disabled={safeCurrentPage === totalPages}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1 border shadow-2xs ${
                      safeCurrentPage === totalPages
                        ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:text-slate-900 cursor-pointer"
                    }`}
                  >
                    <span className="hidden sm:inline">Berikutnya</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
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
              {paginatedProviders.map((provider) => {
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
                    <div className="p-4 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between gap-3 min-w-0">
                      <div className="min-w-0 overflow-hidden">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block leading-tight truncate">
                          Tarif Mulai:
                        </span>
                        <span className="text-sm sm:text-base font-black text-[#1683FF] truncate block">
                          {formatIDR(startingPrice)}
                        </span>
                      </div>

                      <Link
                        href={`/jasa/penyedia/${provider.id}`}
                        className="px-3.5 py-2 rounded-xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white text-xs font-bold transition shadow-xs flex items-center gap-1 cursor-pointer shrink-0"
                      >
                        <span>Kunjungi Profil</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Navigasi Halaman Penyedia */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 pt-6 border-t border-slate-200/80">
                {/* Info Jumlah */}
                <div className="text-xs text-slate-500 font-medium order-2 sm:order-1">
                  Menampilkan <span className="font-bold text-slate-800">{startIndex + 1}</span> - <span className="font-bold text-slate-800">{endIndex}</span> dari <span className="font-bold text-slate-800">{filteredProviders.length}</span> mitra penyedia
                </div>

                {/* Kontrol Halaman */}
                <div className="flex items-center gap-1.5 order-1 sm:order-2">
                  {/* Tombol Sebelumnya */}
                  <button
                    type="button"
                    onClick={() => handlePageChange(safeCurrentPage - 1)}
                    disabled={safeCurrentPage === 1}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1 border shadow-2xs ${
                      safeCurrentPage === 1
                        ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:text-slate-900 cursor-pointer"
                    }`}
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Sebelumnya</span>
                  </button>

                  {/* Tombol Angka Halaman */}
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                      if (
                        totalPages > 6 &&
                        pageNum !== 1 &&
                        pageNum !== totalPages &&
                        Math.abs(pageNum - safeCurrentPage) > 1
                      ) {
                        if (
                          (pageNum === 2 && safeCurrentPage > 3) ||
                          (pageNum === totalPages - 1 && safeCurrentPage < totalPages - 2)
                        ) {
                          return (
                            <span key={pageNum} className="px-1.5 text-xs text-slate-400 font-bold">
                              ...
                            </span>
                          );
                        }
                        return null;
                      }

                      const isActive = pageNum === safeCurrentPage;
                      return (
                        <button
                          key={pageNum}
                          type="button"
                          onClick={() => handlePageChange(pageNum)}
                          className={`w-8 h-8 rounded-xl text-xs font-bold transition flex items-center justify-center cursor-pointer ${
                            isActive
                              ? "bg-[#1683FF] text-white shadow-2xs ring-2 ring-[#1683FF]/20"
                              : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:text-slate-900"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  {/* Tombol Berikutnya */}
                  <button
                    type="button"
                    onClick={() => handlePageChange(safeCurrentPage + 1)}
                    disabled={safeCurrentPage === totalPages}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1 border shadow-2xs ${
                      safeCurrentPage === totalPages
                        ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:text-slate-900 cursor-pointer"
                    }`}
                  >
                    <span className="hidden sm:inline">Berikutnya</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

          </div>
        )}

      </main>

      <Footer />
    </div>
  );
}
