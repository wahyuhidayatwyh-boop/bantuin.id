"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ProductProfileCard from "@/components/cards/ProductProfileCard";
import MapComponent from "@/components/map/MapComponent";
import { useApp } from "@/lib/context/AppContext";
import { MITRA_STORES } from "@/lib/mock/mitraData";
import { 
  Camera, 
  Search, 
  Headphones, 
  Sparkles, 
  Layers, 
  Video, 
  Radio, 
  Wrench, 
  Tv, 
  X,
  Map,
  MapPin,
  ChevronDown,
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
    isItemInCurrentKabupaten 
  } = useApp();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const categoryDropdownRef = useRef(null);

  // Close category dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target)) {
        setIsCategoryOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const ITEMS_PER_PAGE = 16;

  // List of verified rental stores
  const storeList = useMemo(() => Object.values(MITRA_STORES), []);

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

  // Categories for dropdown
  const categories = [
    { id: "Semua", name: "Semua Kategori", icon: Layers },
    { id: "Kamera", name: "Kamera & Lensa", icon: Camera },
    { id: "Audio", name: "Audio & Mic", icon: Headphones },
    { id: "Proyektor", name: "Proyektor & Layar", icon: Video },
    { id: "Drone", name: "Drone & Action Cam", icon: Radio },
    { id: "Lighting", name: "Lighting Studio", icon: Sparkles },
    { id: "Perkakas", name: "Alat Perkakas", icon: Wrench },
    { id: "Display", name: "TV & Layar Expo", icon: Tv },
  ];

  const currentCat = categories.find((c) => c.id === selectedCategory) || categories[0];
  const CurrentCatIcon = currentCat.icon;

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

      const matchCategory =
        selectedCategory === "Semua" ||
        item.category.toLowerCase().includes(selectedCategory.toLowerCase()) ||
        (selectedCategory === "Kamera" && item.category.toLowerCase().includes("kamera")) ||
        (selectedCategory === "Audio" && item.category.toLowerCase().includes("audio")) ||
        (selectedCategory === "Proyektor" && item.category.toLowerCase().includes("proyektor")) ||
        (selectedCategory === "Drone" && (item.category.toLowerCase().includes("drone") || item.category.toLowerCase().includes("action"))) ||
        (selectedCategory === "Lighting" && (item.category.toLowerCase().includes("light") || item.category.toLowerCase().includes("studio"))) ||
        (selectedCategory === "Perkakas" && (item.category.toLowerCase().includes("perkakas") || item.category.toLowerCase().includes("bor"))) ||
        (selectedCategory === "Display" && (item.category.toLowerCase().includes("display") || item.category.toLowerCase().includes("tv")));

      return matchQuery && matchCategory;
    });
  }, [rentals, searchQuery, selectedCategory, filterByKabupaten, isItemInCurrentKabupaten]);

  // Reset to page 1 whenever filters/search/category change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, filterByKabupaten]);

  const totalPages = Math.ceil(filteredRentals.length / ITEMS_PER_PAGE);
  const paginatedRentals = filteredRentals.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const goToPage = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F7FB]">
      <Navbar />

      <main className="flex-1 max-w-[1360px] w-full mx-auto px-4 md:px-6 lg:px-8 py-8">
        
        {/* Layer 1: Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Sewa di <span className="text-[#1683FF]">{activeKabupaten}</span>
              </h1>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-[#1683FF] border border-blue-100">
                {filteredRentals.length} unit tersedia
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Temukan kamera mirrorless, drone, audio podcast, proyektor, hingga perkakas harian di sekitarmu.
            </p>
          </div>
        </div>

        {/* Layer 2: Clean Unified Toolbar (Pencarian, Dropdown Kategori, Filter Wilayah, & Peta) */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2.5">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                placeholder="Cari barang sewa (misal: kamera Sony, drone, mic wireless, proyektor)..."
                className="w-full text-xs sm:text-sm pl-10 pr-9 py-2.5 rounded-xl border border-slate-200 focus:border-[#1683FF] focus:ring-2 focus:ring-[#1683FF]/15 bg-white text-slate-900 transition outline-none shadow-2xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => { setSearchQuery(""); setCurrentPage(1); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Action Filters: Dropdown Kategori + Toggle Wilayah + Tombol Peta */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Dropdown Kategori */}
              <div className="relative shrink-0 flex-1 sm:flex-none" ref={categoryDropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                  className={`w-full sm:w-auto px-3.5 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-between gap-2 border shadow-2xs cursor-pointer ${
                    selectedCategory !== "Semua"
                      ? "bg-blue-50 text-[#1683FF] border-blue-200 ring-1 ring-blue-500/20"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <CurrentCatIcon className={`w-4 h-4 shrink-0 ${selectedCategory !== "Semua" ? "text-[#1683FF]" : "text-slate-400"}`} />
                    <span className="truncate max-w-[130px] sm:max-w-[150px]">
                      {selectedCategory === "Semua" ? "Semua Kategori" : currentCat.name}
                    </span>
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 shrink-0 transition-transform ${isCategoryOpen ? "rotate-180 text-[#1683FF]" : "text-slate-400"}`} />
                </button>

                {/* Popover Menu Dropdown */}
                {isCategoryOpen && (
                  <div className="absolute left-0 sm:right-0 sm:left-auto top-full mt-1.5 w-60 bg-white rounded-2xl border border-slate-200 shadow-xl p-1.5 z-50 animate-in fade-in duration-100">
                    <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 mb-1">
                      Kategori Sewa Alat
                    </div>
                    <div className="space-y-0.5 max-h-64 overflow-y-auto">
                      {categories.map((cat) => {
                        const Icon = cat.icon;
                        const isSelected = selectedCategory === cat.id;
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => {
                              setSelectedCategory(cat.id);
                              setIsCategoryOpen(false);
                              setCurrentPage(1);
                            }}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition cursor-pointer ${
                              isSelected
                                ? "bg-blue-50 text-[#1683FF] font-bold"
                                : "hover:bg-slate-50 text-slate-700 font-medium"
                            }`}
                          >
                            <div className="flex items-center gap-2.5 truncate">
                              <Icon className={`w-3.5 h-3.5 shrink-0 ${isSelected ? "text-[#1683FF]" : "text-slate-400"}`} />
                              <span className="truncate">{cat.name}</span>
                            </div>
                            {isSelected && <Check className="w-3.5 h-3.5 text-[#1683FF] shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Toggle Wilayah: Ringkas & Tidak Bertumpuk */}
              <div className="flex items-center p-1 bg-white border border-slate-200 rounded-xl shadow-2xs text-xs shrink-0">
                <button
                  type="button"
                  onClick={() => { setFilterByKabupaten(true); setCurrentPage(1); }}
                  className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                    filterByKabupaten
                      ? "bg-[#1683FF] text-white shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Hanya {activeKabupaten}
                </button>
                <button
                  type="button"
                  onClick={() => { setFilterByKabupaten(false); setCurrentPage(1); }}
                  className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                    !filterByKabupaten
                      ? "bg-[#1683FF] text-white shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Semua
                </button>
              </div>

              {/* Tombol Toggle Peta */}
              <button
                type="button"
                onClick={() => setShowMap(!showMap)}
                className={`px-3.5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer shrink-0 ${
                  showMap
                    ? "bg-[#1683FF] text-white shadow-blue-500/20"
                    : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
                }`}
              >
                <Map className="w-4 h-4" />
                <span className="hidden sm:inline">{showMap ? "Tutup Peta" : "Lihat Peta"}</span>
              </button>
            </div>
          </div>
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
                  <div className="flex items-center gap-3.5">
                    <div className="relative w-14 h-14 rounded-2xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                      <img src={st.avatar} alt={st.name} className="w-full h-full object-cover" />
                      <div className="absolute -bottom-0.5 -right-0.5 bg-emerald-500 rounded-full p-1 text-white border-2 border-white">
                        <ShieldCheck className="w-2.5 h-2.5" />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link 
                          href={`/mitra/${st.id}`}
                          className="font-extrabold text-sm sm:text-base text-slate-900 hover:text-[#1683FF] transition-colors"
                        >
                          {st.name}
                        </Link>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-emerald-600" />
                          Terverifikasi
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{st.tagline}</p>
                      <div className="flex items-center gap-3 text-xs text-slate-600 mt-2 flex-wrap">
                        <span className="flex items-center gap-1 font-bold text-slate-800">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          {st.rating} ({st.reviewCount} ulasan)
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="text-slate-500 font-medium">{st.catalog.length} unit sewa</span>
                        <span className="text-slate-300">•</span>
                        <span className="text-slate-500 font-medium">{st.address}</span>
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
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
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

        {/* Catalog 4-Column Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
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

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-1.5">
            {/* Prev */}
            <button
              type="button"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3.5 py-2 rounded-xl text-xs font-bold border transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed bg-white hover:bg-slate-50 text-slate-700 border-slate-200"
            >
              ← Sebelumnya
            </button>

            {/* Page Numbers */}
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
              // Show first, last, current ±1, and ellipsis
              const showPage =
                page === 1 ||
                page === totalPages ||
                Math.abs(page - currentPage) <= 1;

              if (!showPage) {
                // Show ellipsis only once per gap
                const prevShown =
                  page - 1 === 1 ||
                  page - 1 === totalPages ||
                  Math.abs(page - 1 - currentPage) <= 1;
                if (!prevShown) return null;
                return (
                  <span key={`ellipsis-${page}`} className="px-1 text-slate-400 text-xs">
                    …
                  </span>
                );
              }

              return (
                <button
                  key={page}
                  type="button"
                  onClick={() => goToPage(page)}
                  className={`w-9 h-9 rounded-xl text-xs font-bold transition cursor-pointer ${
                    page === currentPage
                      ? "bg-[#1683FF] text-white shadow-2xs"
                      : "bg-white hover:bg-slate-50 text-slate-700 border border-slate-200"
                  }`}
                >
                  {page}
                </button>
              );
            })}

            {/* Next */}
            <button
              type="button"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3.5 py-2 rounded-xl text-xs font-bold border transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed bg-white hover:bg-slate-50 text-slate-700 border-slate-200"
            >
              Berikutnya →
            </button>
          </div>
        )}

      </main>

      <Footer />
    </div>
  );
}
