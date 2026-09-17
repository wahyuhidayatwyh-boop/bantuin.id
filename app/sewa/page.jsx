"use client";

import React, { useState, useMemo } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ProductProfileCard from "@/components/cards/ProductProfileCard";
import MapComponent from "@/components/map/MapComponent";
import { useApp } from "@/lib/context/AppContext";
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
  MoreHorizontal, 
  ChevronDown, 
  Check,
  X,
  Map,
  MapPin
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
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [showMap, setShowMap] = useState(false);

  // 4 Primary top category cards
  const primaryCategoryCards = [
    { id: "Semua", name: "Semua Rental", desc: "Semua alat", icon: Layers },
    { id: "Kamera", name: "Kamera & Lensa", desc: "Mirrorless & Lensa", icon: Camera },
    { id: "Audio", name: "Audio & Mic", desc: "Wireless & Podcast", icon: Headphones },
    { id: "Proyektor", name: "Proyektor", desc: "Seminar & Layar", icon: Video },
  ];

  // Extended subcategories accessible via "Lainnya..."
  const moreCategories = [
    { id: "Drone", name: "Drone & Action Cam", desc: "DJI 4K & Aerial", icon: Radio },
    { id: "Lighting", name: "Lighting Studio & Softbox", desc: "Godox & Ringlight", icon: Sparkles },
    { id: "Perkakas", name: "Alat Perkakas & Mesin", desc: "Bor & Pertukangan", icon: Wrench },
    { id: "Display", name: "TV LED & Display Expo", desc: "LED 55' & Stand", icon: Tv },
  ];

  const isSelectedInMore = moreCategories.some((c) => c.id === selectedCategory);

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

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F7FB]">
      <Navbar />

      <main className="flex-1 max-w-[1360px] w-full mx-auto px-4 md:px-6 lg:px-8 py-8">
        
        {/* Page Header */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1683FF] uppercase tracking-wider mb-2">
            <Camera className="w-3.5 h-3.5" />
            <span>KATALOG SEWA & RENTAL ALAT</span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
            Sewa Peralatan, Gadget & Perlengkapan Sekitarmu
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl">
            Sewa kamera mirrorless, drone, audio podcast, proyektor seminar, lighting, hingga perkakas rumah harian dengan aman & transparan.
          </p>
        </div>

        {/* Scalable 3D Glass Category Filter (4 Primary + 1 "Lainnya" Card) */}
        <div className="relative mb-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
            {primaryCategoryCards.map((cat) => {
              const Icon = cat.icon;
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    setIsMoreOpen(false);
                  }}
                  className={`group relative text-left rounded-2xl p-3.5 sm:p-4 border transition-all duration-200 flex flex-col items-center justify-center text-center backdrop-blur-md ${
                    isSelected
                      ? "bg-white border-[#1683FF] shadow-[0_8px_24px_rgba(22,131,255,0.2),inset_0_1px_2px_rgba(255,255,255,1)] ring-2 ring-[#1683FF]/30 -translate-y-0.5"
                      : "bg-gradient-to-b from-white/95 via-[#F6FAFF]/90 to-[#EBF4FD]/80 border-white/90 shadow-[0_4px_14px_rgba(180,205,235,0.25),inset_0_1px_1px_rgba(255,255,255,1)] hover:shadow-[0_8px_20px_rgba(22,131,255,0.12)] hover:-translate-y-0.5"
                  }`}
                >
                  {/* 3D Convex Dome */}
                  <div className={`relative w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center mb-2 transition-transform group-hover:scale-105 ${
                    isSelected
                      ? "bg-gradient-to-b from-[#1683FF] to-[#0F6FE5] text-white shadow-[0_4px_12px_rgba(22,131,255,0.4),inset_0_2px_4px_rgba(255,255,255,0.6)]"
                      : "bg-gradient-to-b from-white via-[#F0F6FD] to-[#DCEAF9] text-slate-700 shadow-[0_4px_10px_rgba(160,195,230,0.35),inset_0_2px_4px_rgba(255,255,255,0.95)] border border-white/80"
                  }`}>
                    <div className="absolute top-1 left-1/2 -translate-x-1/2 w-6 h-1.5 bg-gradient-to-b from-white to-transparent rounded-full opacity-70 pointer-events-none" />
                    <Icon className={`w-5 h-5 ${isSelected ? "text-white" : "text-slate-700 group-hover:text-[#1683FF]"} stroke-[1.75]`} />
                  </div>

                  {/* Title & Desc */}
                  <h4 className={`font-bold text-xs sm:text-[13px] tracking-tight mb-0.5 ${
                    isSelected ? "text-[#1683FF]" : "text-slate-900 group-hover:text-[#1683FF]"
                  }`}>
                    {cat.name}
                  </h4>
                  <p className="text-[10px] text-slate-400 font-medium truncate max-w-full">
                    {cat.desc}
                  </p>
                </button>
              );
            })}

            {/* 5th Card: Dedicated "Lainnya..." 3D Glass Card */}
            <button
              onClick={() => setIsMoreOpen(!isMoreOpen)}
              className={`group relative text-left rounded-2xl p-3.5 sm:p-4 border transition-all duration-200 flex flex-col items-center justify-center text-center backdrop-blur-md ${
                isSelectedInMore || isMoreOpen
                  ? "bg-white border-[#1683FF] shadow-[0_8px_24px_rgba(22,131,255,0.2),inset_0_1px_2px_rgba(255,255,255,1)] ring-2 ring-[#1683FF]/30 -translate-y-0.5"
                  : "bg-gradient-to-b from-white/95 via-[#F6FAFF]/90 to-[#EBF4FD]/80 border-white/90 shadow-[0_4px_14px_rgba(180,205,235,0.25),inset_0_1px_1px_rgba(255,255,255,1)] hover:shadow-[0_8px_20px_rgba(22,131,255,0.12)] hover:-translate-y-0.5"
              }`}
            >
              {/* 3D Convex Dome */}
              <div className={`relative w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center mb-2 transition-transform group-hover:scale-105 ${
                isSelectedInMore || isMoreOpen
                  ? "bg-gradient-to-b from-[#1683FF] to-[#0F6FE5] text-white shadow-[0_4px_12px_rgba(22,131,255,0.4),inset_0_2px_4px_rgba(255,255,255,0.6)]"
                  : "bg-gradient-to-b from-white via-[#F0F6FD] to-[#DCEAF9] text-slate-700 shadow-[0_4px_10px_rgba(160,195,230,0.35),inset_0_2px_4px_rgba(255,255,255,0.95)] border border-white/80"
              }`}>
                <div className="absolute top-1 left-1/2 -translate-x-1/2 w-6 h-1.5 bg-gradient-to-b from-white to-transparent rounded-full opacity-70 pointer-events-none" />
                <MoreHorizontal className={`w-5 h-5 ${isSelectedInMore || isMoreOpen ? "text-white" : "text-slate-700 group-hover:text-[#1683FF]"} stroke-[2]`} />
              </div>

              {/* Title & Active indicator */}
              <h4 className={`font-bold text-xs sm:text-[13px] tracking-tight mb-0.5 flex items-center gap-1 ${
                isSelectedInMore ? "text-[#1683FF]" : "text-slate-900 group-hover:text-[#1683FF]"
              }`}>
                <span>{isSelectedInMore ? selectedCategory : "Lainnya..."}</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${isMoreOpen ? "rotate-180" : ""}`} />
              </h4>
              <p className="text-[10px] text-slate-400 font-medium truncate max-w-full">
                {isSelectedInMore ? "Kategori terpilih" : "+4 kategori lain"}
              </p>
            </button>
          </div>

          {/* Smooth Dropdown Popover for "Lainnya" */}
          {isMoreOpen && (
            <div className="absolute right-0 top-full mt-3 w-full sm:w-96 bg-white/95 backdrop-blur-2xl rounded-3xl border border-slate-200/90 shadow-[0_20px_50px_rgba(0,0,0,0.15)] p-3.5 z-40 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100 mb-2">
                <span className="text-xs font-bold text-slate-900">Pilih Kategori Rental Lainnya</span>
                <button
                  onClick={() => setIsMoreOpen(false)}
                  className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-1.5 max-h-72 overflow-y-auto">
                {moreCategories.map((cat) => {
                  const Icon = cat.icon;
                  const isSelected = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setSelectedCategory(cat.id);
                        setIsMoreOpen(false);
                      }}
                      className={`w-full flex items-center justify-between p-3 rounded-2xl transition text-left ${
                        isSelected 
                          ? "bg-blue-50 border border-blue-200 text-[#1683FF]" 
                          : "hover:bg-slate-50 border border-transparent text-slate-700"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          isSelected ? "bg-[#1683FF] text-white" : "bg-slate-100 text-slate-600"
                        }`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold">{cat.name}</div>
                          <div className="text-[11px] text-slate-400">{cat.desc}</div>
                        </div>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-[#1683FF] shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Sleek Compact Location Sync Strip */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 px-3.5 py-2.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs mb-5 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <MapPin className="w-4 h-4 text-[#1683FF]" />
              <span>Wilayah Rental:</span>
              <span className="text-[#1683FF]">{activeKabupaten}</span>
            </div>
            {userCoordinates && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>GPS Aktif</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setFilterByKabupaten(true)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                filterByKabupaten
                  ? "bg-[#1683FF] text-white shadow-2xs"
                  : "text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200"
              }`}
            >
              Hanya {activeKabupaten}
            </button>
            <button
              type="button"
              onClick={() => setFilterByKabupaten(false)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                !filterByKabupaten
                  ? "bg-[#1683FF] text-white shadow-2xs"
                  : "text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200"
              }`}
            >
              Semua Wilayah
            </button>
          </div>
        </div>

        {/* Search & Map Toggle Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6">
          <div className="flex-1 bg-white border border-slate-200/90 rounded-2xl p-3 shadow-2xs flex items-center gap-3">
            <Search className="w-4 h-4 text-slate-400 ml-2 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Cari barang sewa dalam kategori ${selectedCategory}...`}
              className="w-full text-xs sm:text-sm text-slate-900 placeholder-slate-400 bg-transparent focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="text-xs font-semibold text-slate-400 hover:text-slate-600 px-2"
              >
                Reset
              </button>
            )}
          </div>

          <button
            onClick={() => setShowMap(!showMap)}
            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border text-xs font-bold transition shadow-xs shrink-0 ${
              showMap
                ? "bg-[#1683FF] text-white border-[#1683FF] shadow-blue-500/20"
                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
            }`}
          >
            <Map className="w-4 h-4" />
            <span>{showMap ? "Tutup Peta Titik Sewa" : "Lihat Peta Titik Sewa"}</span>
          </button>
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

        {/* Catalog 4-Column Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {filteredRentals.map((rental) => (
            <ProductProfileCard key={rental.id} item={rental} type="rental" />
          ))}
        </div>

        {filteredRentals.length === 0 && (
          <div className="text-center py-16 px-4 bg-white rounded-3xl border border-slate-200">
            <p className="text-sm font-bold text-slate-800">
              {filterByKabupaten
                ? `Belum ada unit sewa di ${activeKabupaten} untuk kategori ini.`
                : "Tidak ada barang rental yang cocok."}
            </p>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              {filterByKabupaten
                ? `Anda dapat beralih ke "Semua Wilayah" untuk melihat unit sewa di kota lain.`
                : "Coba ubah kata kunci pencarian atau pilih kategori lainnya."}
            </p>
            <div className="flex items-center justify-center gap-3 mt-4">
              {filterByKabupaten && (
                <button
                  type="button"
                  onClick={() => setFilterByKabupaten(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition"
                >
                  Lihat Semua Wilayah
                </button>
              )}
              <button
                type="button"
                onClick={() => { setSelectedCategory("Semua"); setSearchQuery(""); }}
                className="px-4 py-2 rounded-xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white text-xs font-bold transition shadow-xs"
              >
                Tampilkan Semua Kategori
              </button>
            </div>
          </div>
        )}

      </main>

      <Footer />
    </div>
  );
}
