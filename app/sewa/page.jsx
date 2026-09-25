"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ProductProfileCard from "@/components/cards/ProductProfileCard";
import MapComponent from "@/components/map/MapComponent";
import { useApp } from "@/lib/context/AppContext";
import { MITRA_STORES, getAllMitraStores } from "@/lib/mock/mitraData";
import CategoryIcon from "@/components/common/CategoryIcon";
import { SEWA_CATEGORIES, resolveIcon, matchesCategory } from "@/lib/categories";
import { 
  Search, 
  X,
  Map,
  MapPin,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Check,
  ShieldCheck,
  Star,
  Store
} from "lucide-react";

export default function SewaPage() {
  const { 
    rentals, 
    userCoordinates, 
    activeKabupaten, 
    filterByKabupaten, 
    setFilterByKabupaten, 
    isItemInCurrentKabupaten,
    setIsGpsModalOpen
  } = useApp();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [activeModal, setActiveModal] = useState(null); // null | "kategori" | "wilayah"
  const [showMap, setShowMap] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const controlsRef = useRef(null);

  // Close dropdowns when clicking outside or pressing Escape
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

  const ITEMS_PER_PAGE = 16;

  // List of verified rental stores (reaktif terhadap pembaruan dashboard mitra)
  const [storeList, setStoreList] = useState(() => Object.values(MITRA_STORES));

  useEffect(() => {
    setStoreList(getAllMitraStores());
    const handleMitraUpdate = () => {
      setStoreList(getAllMitraStores());
    };
    window.addEventListener("bantuin_mitra_store_updated", handleMitraUpdate);
    return () => window.removeEventListener("bantuin_mitra_store_updated", handleMitraUpdate);
  }, []);

  // Smart Search: Temukan toko rental yang cocok dengan pencarian pengguna secara otomatis
  const matchedStores = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return storeList.filter((st) => {
      const matchBasic =
        st.name.toLowerCase().includes(q) ||
        st.tagline.toLowerCase().includes(q) ||
        st.category.toLowerCase().includes(q) ||
        (st.about && st.about.toLowerCase().includes(q));
      const matchCatalog = st.catalog && st.catalog.some((item) =>
        item.name.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
      );
      return matchBasic || matchCatalog;
    });
  }, [searchQuery, storeList]);

  // Ambil dari sumber kebenaran tunggal — tambah kategori di lib/categories.js
  const categories = SEWA_CATEGORIES;

  const currentCat = categories.find((c) => c.id === selectedCategory) || categories[0];
  const currentCatName = currentCat?.name || currentCat?.label || "Semua Kategori";

  const filteredRentals = useMemo(() => {
    return rentals.filter((item) => {
      // Filter Kabupaten: Tampilkan hanya di kabupaten yang sama jika filter aktif
      if (filterByKabupaten && !isItemInCurrentKabupaten(item)) {
        return false;
      }

      const matchQuery =
        !searchQuery ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchCategory = matchesCategory(item, selectedCategory, "sewa");

      return matchQuery && matchCategory;
    });
  }, [rentals, searchQuery, selectedCategory, filterByKabupaten, isItemInCurrentKabupaten]);

  // Reset to page 1 whenever filters/search/category change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, filterByKabupaten]);

  const totalPages = Math.ceil(filteredRentals.length / ITEMS_PER_PAGE) || 1;
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, filteredRentals.length);
  const paginatedRentals = filteredRentals.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 180, behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F7FB]">
      <Navbar />

      <main className="flex-1 max-w-[1360px] w-full mx-auto px-4 md:px-6 lg:px-8 py-8">
        
        {/* ============================================================ */}
        {/* HEADER SECTION (CLEAN & COMPACT)                             */}
        {/* ============================================================ */}
        <div className="space-y-3 sm:space-y-4 mb-5 sm:mb-6">
          
          {/* Header Title */}
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
              Sewa di {filterByKabupaten ? activeKabupaten.replace(/^Kabupaten\s+/i, 'Kab. ') : "Semua Wilayah"}
            </h1>
            <div className="hidden sm:flex items-center gap-2 text-xs sm:text-sm text-slate-500 mt-1">
              <span className="font-bold text-[#1683FF]">
                {filteredRentals.length} unit tersedia
              </span>
              <span>·</span>
              <span>Temukan kamera mirrorless, drone, audio podcast, proyektor, hingga perkakas harian</span>
            </div>
          </div>

          {/* Search Bar (Fokus Utama & Lebar) */}
          <div className="relative">
            <div className="relative flex items-center bg-white border border-slate-300 hover:border-slate-400 focus-within:border-[#1683FF] focus-within:ring-4 focus-within:ring-[#1683FF]/15 rounded-2xl shadow-xs transition-all">
              <Search className="w-5 h-5 text-slate-400 ml-3.5 sm:ml-4 shrink-0 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                placeholder="Cari barang sewa..."
                className="w-full h-12 sm:h-13 pl-3 pr-10 text-xs sm:text-sm md:text-base text-slate-900 placeholder:text-slate-400 font-medium bg-transparent outline-none rounded-2xl"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => { setSearchQuery(""); setCurrentPage(1); }}
                  className="absolute right-3.5 p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                  title="Hapus pencarian"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Compact Controls: [ Semua Kategori ] [ Wilayah ] [ Peta ] */}
          <div ref={controlsRef} className="relative">
            <div className="grid grid-cols-3 gap-2 sm:flex sm:items-center sm:gap-2.5">
              
              {/* 1. KONTROL KATEGORI */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setActiveModal(activeModal === "kategori" ? null : "kategori")}
                  className={`w-full sm:w-auto flex items-center justify-center sm:justify-start gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-2 rounded-xl text-[11px] sm:text-xs font-semibold sm:font-bold border transition cursor-pointer shadow-2xs ${
                    selectedCategory !== "Semua"
                      ? "bg-blue-50 border-[#1683FF] text-[#1683FF]"
                      : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                  title="Pilih Kategori"
                >
                  <CategoryIcon category={currentCat} className={`w-3.5 h-3.5 shrink-0 ${selectedCategory !== "Semua" ? "text-[#1683FF]" : "text-slate-500"}`} />
                  <span className="hidden sm:inline truncate max-w-[150px]">
                    {selectedCategory === "Semua" ? "Semua Kategori" : currentCatName}
                  </span>
                  <span className="sm:hidden truncate">
                    {selectedCategory === "Semua" ? "Kategori" : currentCatName}
                  </span>
                  {selectedCategory !== "Semua" && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#1683FF] shrink-0 sm:hidden" />
                  )}
                  <ChevronDown className={`w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0 transition-transform duration-200 ${activeModal === "kategori" ? "rotate-180" : ""}`} />
                </button>

                {/* Popover Desktop: Kategori */}
                {activeModal === "kategori" && (
                  <div className="hidden sm:block absolute top-full left-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 p-2.5 z-30 animate-in fade-in zoom-in-95 duration-150">
                    <div className="flex items-center justify-between pb-2 mb-1.5 border-b border-slate-100 px-1">
                      <span className="text-xs font-bold text-slate-900">Kategori Sewa Alat</span>
                      {selectedCategory !== "Semua" && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCategory("Semua");
                            setActiveModal(null);
                            setCurrentPage(1);
                          }}
                          className="text-[11px] font-semibold text-[#1683FF] hover:underline cursor-pointer"
                        >
                          Reset
                        </button>
                      )}
                    </div>
                    <div className="space-y-0.5 max-h-64 overflow-y-auto pr-0.5">
                      {categories.map((cat) => {
                        const isSelected = selectedCategory === cat.id;
                        const catDisplayName = cat.name || cat.label;
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => {
                              setSelectedCategory(cat.id);
                              setActiveModal(null);
                              setCurrentPage(1);
                            }}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition cursor-pointer ${
                              isSelected
                                ? "bg-blue-50 text-[#1683FF] font-bold"
                                : "hover:bg-slate-50 text-slate-700 font-medium"
                            }`}
                          >
                            <div className="flex items-center gap-2.5 truncate">
                              <CategoryIcon category={cat} className={`w-3.5 h-3.5 shrink-0 ${isSelected ? "text-[#1683FF]" : "text-slate-400"}`} />
                              <span className="truncate">{catDisplayName}</span>
                            </div>
                            {isSelected && <Check className="w-3.5 h-3.5 text-[#1683FF] shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* 2. KONTROL WILAYAH */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setActiveModal(activeModal === "wilayah" ? null : "wilayah")}
                  className={`w-full sm:w-auto flex items-center justify-center sm:justify-start gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-2 rounded-xl text-[11px] sm:text-xs font-semibold sm:font-bold border transition cursor-pointer shadow-2xs ${
                    filterByKabupaten
                      ? "bg-blue-50 border-[#1683FF] text-[#1683FF]"
                      : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                  title="Pilih Wilayah"
                >
                  <MapPin className={`w-3.5 h-3.5 shrink-0 ${filterByKabupaten ? "text-[#1683FF]" : "text-slate-500"}`} />
                  <span className="hidden sm:inline truncate max-w-[140px]">
                    {filterByKabupaten ? activeKabupaten.replace(/^Kabupaten\s+/i, 'Kab. ') : "Semua Wilayah"}
                  </span>
                  <span className="sm:hidden truncate">Wilayah</span>
                  {filterByKabupaten && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#1683FF] shrink-0 sm:hidden" />
                  )}
                  <ChevronDown className={`w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0 transition-transform duration-200 ${activeModal === "wilayah" ? "rotate-180" : ""}`} />
                </button>

                {/* Popover Desktop: Wilayah */}
                {activeModal === "wilayah" && (
                  <div className="hidden sm:block absolute top-full left-0 mt-2 w-76 bg-white rounded-2xl shadow-xl border border-slate-200 p-3 z-30 animate-in fade-in zoom-in-95 duration-150">
                    <span className="text-xs font-bold text-slate-900 block pb-2 mb-2 border-b border-slate-100">
                      Cakupan Wilayah
                    </span>
                    <div className="space-y-1">
                      <button
                        type="button"
                        onClick={() => {
                          setFilterByKabupaten(true);
                          setActiveModal(null);
                          setCurrentPage(1);
                        }}
                        className={`w-full p-2.5 rounded-xl text-left flex items-start gap-2.5 transition cursor-pointer ${
                          filterByKabupaten
                            ? "bg-blue-50 text-[#1683FF] font-bold"
                            : "hover:bg-slate-50 text-slate-700"
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full border mt-0.5 flex items-center justify-center shrink-0 ${
                          filterByKabupaten ? "border-[#1683FF] bg-[#1683FF]" : "border-slate-300"
                        }`}>
                          {filterByKabupaten && <Check className="w-2.5 h-2.5 text-white stroke-[3]" />}
                        </div>
                        <div>
                          <div className="text-xs font-bold">Hanya {activeKabupaten}</div>
                          <div className="text-[10px] text-slate-500 mt-0.5 leading-snug">
                            Tampilkan barang sewa lokal terdekat
                          </div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setFilterByKabupaten(false);
                          setActiveModal(null);
                          setCurrentPage(1);
                        }}
                        className={`w-full p-2.5 rounded-xl text-left flex items-start gap-2.5 transition cursor-pointer ${
                          !filterByKabupaten
                            ? "bg-blue-50 text-[#1683FF] font-bold"
                            : "hover:bg-slate-50 text-slate-700"
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full border mt-0.5 flex items-center justify-center shrink-0 ${
                          !filterByKabupaten ? "border-[#1683FF] bg-[#1683FF]" : "border-slate-300"
                        }`}>
                          {!filterByKabupaten && <Check className="w-2.5 h-2.5 text-white stroke-[3]" />}
                        </div>
                        <div>
                          <div className="text-xs font-bold">Semua Wilayah</div>
                          <div className="text-[10px] text-slate-500 mt-0.5 leading-snug">
                            Tampilkan seluruh unit sewa dari berbagai kota
                          </div>
                        </div>
                      </button>
                    </div>

                    <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">Pusat Lokasi:</span>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveModal(null);
                          setIsGpsModalOpen?.(true);
                        }}
                        className="font-bold text-[#1683FF] hover:underline cursor-pointer"
                      >
                        Ganti GPS
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* 3. KONTROL PETA (Paling Kanan) */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowMap(!showMap)}
                  className={`w-full sm:w-auto flex items-center justify-center sm:justify-start gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-2 rounded-xl text-[11px] sm:text-xs font-semibold sm:font-bold border transition cursor-pointer shadow-2xs ${
                    showMap
                      ? "bg-[#1683FF] border-[#1683FF] text-white shadow-xs"
                      : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                  title={showMap ? "Tutup Peta" : "Lihat Peta"}
                >
                  <Map className="w-3.5 h-3.5 shrink-0" />
                  <span className="hidden sm:inline">{showMap ? "Tutup Peta" : "Lihat Peta"}</span>
                  <span className="sm:hidden">{showMap ? "Tutup" : "Peta"}</span>
                </button>
              </div>

            </div>
          </div>

          {/* ============================================================ */}
          {/* MOBILE BOTTOM SHEET FOR KATEGORI & WILAYAH                   */}
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
                    {activeModal === "kategori" && <CategoryIcon category={currentCat} className="w-4 h-4 text-[#1683FF]" />}
                    {activeModal === "wilayah" && <MapPin className="w-4 h-4 text-[#1683FF]" />}
                    <h3 className="font-extrabold text-sm text-slate-900">
                      {activeModal === "kategori" && "Pilih Kategori Sewa Alat"}
                      {activeModal === "wilayah" && "Cakupan Wilayah"}
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
                  <div className="space-y-1.5 max-h-[60vh] overflow-y-auto pr-0.5">
                    {categories.map((cat) => {
                      const isSelected = selectedCategory === cat.id;
                      const catDisplayName = cat.name || cat.label;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => {
                            setSelectedCategory(cat.id);
                            setActiveModal(null);
                            setCurrentPage(1);
                          }}
                          className={`w-full flex items-center justify-between p-3 rounded-2xl border text-xs transition cursor-pointer ${
                            isSelected
                              ? "bg-blue-50 border-[#1683FF] text-[#1683FF] font-bold"
                              : "border-slate-200 text-slate-700 hover:bg-slate-50 font-medium"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 truncate">
                            <CategoryIcon category={cat} className={`w-4 h-4 shrink-0 ${isSelected ? "text-[#1683FF]" : "text-slate-400"}`} />
                            <span className="truncate">{catDisplayName}</span>
                          </div>
                          {isSelected && <Check className="w-3.5 h-3.5 text-[#1683FF] shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Content: Wilayah Sheet */}
                {activeModal === "wilayah" && (
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => {
                        setFilterByKabupaten(true);
                        setActiveModal(null);
                        setCurrentPage(1);
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
                          Tampilkan barang sewa lokal terdekat di sekitar Anda
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setFilterByKabupaten(false);
                        setActiveModal(null);
                        setCurrentPage(1);
                      }}
                      className={`w-full p-3.5 rounded-2xl border text-left flex items-start gap-3 transition cursor-pointer ${
                        !filterByKabupaten
                          ? "bg-blue-50 text-[#1683FF] font-bold"
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
                          Tampilkan seluruh unit sewa dari berbagai kota
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

              </div>
            </div>
          )}

          {/* Active Chips & Clear All */}
          {(selectedCategory !== "Semua" || !filterByKabupaten || searchQuery) && (
            <div className="flex items-center gap-1.5 flex-wrap pt-0.5 text-xs">
              <span className="text-slate-400 font-semibold text-[11px]">Filter aktif:</span>
              
              {selectedCategory !== "Semua" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-[#1683FF] font-bold text-[11px] border border-blue-100">
                  <span>{currentCatName}</span>
                  <button
                    type="button"
                    onClick={() => { setSelectedCategory("Semua"); setCurrentPage(1); }}
                    className="hover:text-blue-900 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {!filterByKabupaten && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-[#1683FF] font-bold text-[11px] border border-blue-100">
                  <span>Semua Wilayah</span>
                  <button
                    type="button"
                    onClick={() => { setFilterByKabupaten(true); setCurrentPage(1); }}
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
                    onClick={() => { setSearchQuery(""); setCurrentPage(1); }}
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
                  setFilterByKabupaten(true);
                  setSearchQuery("");
                  setCurrentPage(1);
                }}
                className="text-[11px] font-bold text-slate-500 hover:text-rose-600 transition underline cursor-pointer ml-1"
              >
                Reset Semua
              </button>
            </div>
          )}

        </div>

        {/* Interactive Map of Rental Locations */}
        {showMap && (
          <div className="mb-8 p-4 sm:p-5 bg-white rounded-3xl border border-slate-200 shadow-sm animate-in fade-in duration-200">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#1683FF]" />
                <h3 className="font-bold text-sm text-slate-900">
                  Peta Titik Lokasi Pengambilan Alat & Rental
                </h3>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                {userCoordinates && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#1683FF] bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#1683FF] animate-ping"></span>
                    <span>Posisi GPS Terpantau</span>
                  </span>
                )}
                <span>
                  {filteredRentals.filter((r) => r.latitude && r.longitude).length} Titik Alat Terpetakan
                </span>
              </div>
            </div>
            <MapComponent
              points={filteredRentals
                .filter((r) => r.latitude && r.longitude)
                .map((r) => ({
                  ...r,
                  type: "rental",
                  name: r.title,
                  address: r.address || r.location,
                }))}
              userLocation={userCoordinates}
              height="360px"
            />
          </div>
        )}

        {/* SMART SEARCH RESULT: TOKO RENTAL TERKAIT */}
        {searchQuery.trim() !== "" && matchedStores.length > 0 && (
          <div className="mb-8 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center text-[#1683FF]">
                  <Store className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
                    <span>Toko Rental Terkait Pencarian</span>
                    <span className="text-[11px] font-bold text-white bg-[#1683FF] px-2 py-0.5 rounded-full">
                      {matchedStores.length} Toko
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Toko mitra resmi terverifikasi dengan armada/katalog sesuai &ldquo;{searchQuery}&rdquo;
                  </p>
                </div>
              </div>
            </div>

            <div className={`grid gap-4 ${matchedStores.length === 1 ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2"}`}>
              {matchedStores.map((st) => (
                <div
                  key={st.id}
                  className="bg-white rounded-2xl p-4 sm:p-5 border border-blue-200/90 shadow-[0_4px_16px_rgba(22,131,255,0.06)] hover:shadow-md transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <div className="relative w-14 h-14 rounded-2xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                      <img src={st.avatar} alt={st.name} className="w-full h-full object-cover" />
                      <div className="absolute -bottom-0.5 -right-0.5 bg-emerald-500 rounded-full p-1 text-white border-2 border-white">
                        <ShieldCheck className="w-2.5 h-2.5" />
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link 
                          href={`/mitra/${st.id}`}
                          className="font-extrabold text-sm sm:text-base text-slate-900 hover:text-[#1683FF] transition-colors truncate"
                        >
                          {st.name}
                        </Link>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                          <ShieldCheck className="w-3 h-3 text-emerald-600" />
                          Terverifikasi
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{st.tagline}</p>
                      <div className="flex items-center gap-3 text-xs text-slate-600 mt-2 flex-wrap min-w-0">
                        <span className="flex items-center gap-1 font-bold text-slate-800 shrink-0">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          {st.rating} ({st.reviewCount} ulasan)
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="text-slate-500 font-medium shrink-0">{st.catalog?.length || 0} unit sewa</span>
                        <span className="text-slate-300">•</span>
                        <span className="text-slate-500 font-medium truncate max-w-[180px] sm:max-w-none">{st.address}</span>
                      </div>
                    </div>
                  </div>

                  <Link
                    href={`/mitra/${st.id}`}
                    className="shrink-0 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white text-xs font-bold shadow-xs hover:shadow-md transition cursor-pointer"
                  >
                    <span>Kunjungi Toko</span>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* KATALOG PRODUK BARANG SEWA */}
        <div className="pt-2 sm:pt-3 border-t border-slate-200/80 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2">
              <span>Daftar Unit Barang Sewa</span>
              <span className="text-xs font-bold text-[#1683FF] bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">
                {filteredRentals.length} unit
              </span>
            </h2>
            {searchQuery && (
              <p className="text-[11px] text-slate-500 mt-0.5">
                Menampilkan hasil untuk &ldquo;{searchQuery}&rdquo;
              </p>
            )}
          </div>
          {totalPages > 1 && (
            <span className="text-xs text-slate-500">
              Halaman {currentPage} dari {totalPages}
            </span>
          )}
        </div>

        {/* Catalog 4-Column Grid (2 Columns on Mobile) */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4 md:gap-5">
          {paginatedRentals.map((rental) => (
            <ProductProfileCard key={rental.id} item={rental} type="rental" />
          ))}
        </div>

        {/* Empty State */}
        {filteredRentals.length === 0 && (
          <div className="text-center py-14 px-4 bg-white rounded-3xl border border-slate-200">
            {matchedStores.length > 0 ? (
              <>
                <p className="text-sm font-bold text-slate-800">
                  Toko rental ditemukan pada bagian di atas!
                </p>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  Silakan klik tombol <strong>&ldquo;Kunjungi Toko&rdquo;</strong> untuk menjelajahi katalog lengkap alat sewa toko tersebut.
                </p>
              </>
            ) : (
              <>
                <p className="text-sm font-bold text-slate-800">
                  {filterByKabupaten
                    ? `Belum ada unit sewa di ${activeKabupaten} untuk pencarian atau kategori ini.`
                    : "Tidak ada barang atau toko rental yang cocok."}
                </p>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  {filterByKabupaten
                    ? `Beralih ke "Semua Wilayah" untuk melihat unit di kota lain.`
                    : "Coba ubah kata kunci atau pilih kategori lain."}
                </p>
              </>
            )}
            <div className="flex items-center justify-center gap-3 mt-4">
              {filterByKabupaten && (
                <button
                  type="button"
                  onClick={() => setFilterByKabupaten(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition cursor-pointer"
                >
                  Lihat Semua Wilayah
                </button>
              )}
              <button
                type="button"
                onClick={() => { setSelectedCategory("Semua"); setSearchQuery(""); }}
                className="px-4 py-2 rounded-xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white text-xs font-bold transition shadow-xs cursor-pointer"
              >
                Reset Pencarian &amp; Kategori
              </button>
            </div>
          </div>
        )}

        {/* Pagination Navigasi Halaman */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 pt-6 border-t border-slate-200/80">
            {/* Info Jumlah */}
            <div className="text-xs text-slate-500 font-medium order-2 sm:order-1">
              Menampilkan <span className="font-bold text-slate-800">{startIndex + 1}</span> - <span className="font-bold text-slate-800">{endIndex}</span> dari <span className="font-bold text-slate-800">{filteredRentals.length}</span> barang sewa
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

      </main>

      <Footer />
    </div>
  );
}
