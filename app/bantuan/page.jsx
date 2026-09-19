"use client";

import React, { useState, useMemo, useRef, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import RequestCard from "@/components/cards/RequestCard";
import MapComponent from "@/components/map/MapComponent";
import { useApp } from "@/lib/context/AppContext";
import { formatIDR, formatDeadlineWithHour } from "@/lib/utils";
import { 
  Search, 
  Map, 
  Plus, 
  X, 
  MapPin, 
  FileText, 
  Printer, 
  Package, 
  Layers, 
  Truck, 
  ShoppingCart, 
  Clock, 
  AlertTriangle, 
  Zap, 
  LayoutGrid, 
  List, 
  CheckCircle2, 
  Send,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Check,
  Globe
} from "lucide-react";

function BantuanContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const { 
    requests, 
    currentUser, 
    bantuinPoints, 
    submitOffer,
    getDistanceToUser,
    userCoordinates,
    activeKabupaten,
    filterByKabupaten,
    setFilterByKabupaten,
    isItemInCurrentKabupaten
  } = useApp();

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [scopeFilter, setScopeFilter] = useState("others"); // 'others' | 'my_requests'
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [showMap, setShowMap] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const ITEMS_PER_PAGE = 10;
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

  // Modal offer state for list view
  const [selectedTask, setSelectedTask] = useState(null);
  const [pitchMessage, setPitchMessage] = useState("");
  const [proposedPrice, setProposedPrice] = useState(15000);
  const [submitted, setSubmitted] = useState(false);

  // Counts for scope tabs
  const countOthers = useMemo(() => {
    return requests.filter((r) => r.requester?.id !== currentUser?.id && r.status !== "closed" && r.status !== "completed").length;
  }, [requests, currentUser]);

  const countMyRequests = useMemo(() => {
    return requests.filter((r) => r.requester?.id === currentUser?.id).length;
  }, [requests, currentUser]);

  // Unified categories for dropdown
  const categories = [
    { id: "Semua", name: "Semua Kategori", icon: Layers },
    { id: "Ambil Dokumen", name: "Ambil Dokumen", icon: FileText },
    { id: "Print & Fotokopi", name: "Print & Jilid", icon: Printer },
    { id: "Antar Barang", name: "Antar Barang", icon: Package },
    { id: "Bantu Pindahan", name: "Pindahan", icon: Truck },
    { id: "Titip Belanja", name: "Titip Belanja", icon: ShoppingCart },
    { id: "Bantu Antri", name: "Bantu Antri RS & Tiket", icon: Clock },
    { id: "Bantuan Darurat", name: "Aki Motor & Tambal Ban", icon: Zap },
    { id: "Bantu Event", name: "Penjaga Stand & Acara", icon: AlertTriangle },
  ];

  // Filtered Requests Logic
  const filteredRequests = useMemo(() => {
    return requests.filter((item) => {
      const isMine = item.requester?.id === currentUser?.id;

      // Filter Scope: 'others' vs 'my_requests'
      if (scopeFilter === "others" && isMine) return false;
      if (scopeFilter === "my_requests" && !isMine) return false;

      // Exclude requests where a helper has already finished/closed unless viewing my own requests
      if (!isMine) {
        const isAcceptedOrFinished =
          item.status === "completed" ||
          item.status === "closed";
        if (isAcceptedOrFinished) return false;
      }

      // Filter Kabupaten: Hanya muncul di kabupaten yang sama jika filter aktif
      if (filterByKabupaten && !isMine && !isItemInCurrentKabupaten(item)) {
        return false;
      }

      const matchQuery =
        !searchQuery ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase());

      const matchCategory =
        selectedCategory === "Semua" || 
        item.category.toLowerCase().includes(selectedCategory.toLowerCase()) ||
        (selectedCategory === "Print & Fotokopi" && (item.category.includes("Print") || item.title.includes("Print"))) ||
        (selectedCategory === "Bantu Pindahan" && (item.category.includes("Pindah") || item.title.includes("Pindah"))) ||
        (selectedCategory === "Titip Belanja" && (item.category.includes("Belanja") || item.title.includes("Obat"))) ||
        (selectedCategory === "Bantu Antri" && (item.category.includes("Antri") || item.title.includes("Antri"))) ||
        (selectedCategory === "Bantuan Darurat" && (item.category.includes("Darurat") || item.title.includes("Aki") || item.title.includes("Mogok"))) ||
        (selectedCategory === "Bantu Event" && (item.category.includes("Event") || item.title.includes("Acara") || item.title.includes("Bazar")));

      return matchQuery && matchCategory;
    });
  }, [requests, currentUser, scopeFilter, searchQuery, selectedCategory, filterByKabupaten, isItemInCurrentKabupaten]);

  const currentCat = categories.find((c) => c.id === selectedCategory) || categories[0];
  const CurrentCatIcon = currentCat.icon;

  // Pagination Logic (Maksimal 10 bantuan per halaman)
  const totalPages = Math.ceil(filteredRequests.length / ITEMS_PER_PAGE) || 1;
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, filteredRequests.length);
  const paginatedRequests = filteredRequests.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 180, behavior: "smooth" });
    }
  };

  const handleOpenOfferModal = (task) => {
    setSelectedTask(task);
    setProposedPrice(task.rewardAmount || 15000);
    setPitchMessage("");
    setSubmitted(false);
  };

  const handleSendOffer = (e) => {
    e.preventDefault();
    if (!pitchMessage.trim()) return;
    submitOffer(selectedTask.id, pitchMessage, Number(proposedPrice));
    setSubmitted(true);
    setTimeout(() => {
      setSelectedTask(null);
      setSubmitted(false);
      setPitchMessage("");
    }, 1200);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-800">
      <Navbar />

      <main className="flex-1 max-w-[1360px] w-full mx-auto px-4 md:px-6 lg:px-8 py-5 sm:py-7">
        
        {/* Layer 1: Header + Scope Tabs + Main CTA */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Bantuan di <span className="text-[#1683FF]">{activeKabupaten}</span>
              </h1>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-[#1683FF] border border-blue-100">
                {filteredRequests.length} tugas tersedia
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Temukan kebutuhan tolong mikro di sekitarmu dan dapatkan imbalan yang adil.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* Scope Filter Tabs: Sederhana & Intuitif */}
            <div className="flex items-center p-1 bg-slate-200/70 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => { setScopeFilter("others"); setCurrentPage(1); }}
                className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                  scopeFilter === "others"
                    ? "bg-white text-[#1683FF] shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <span>Semua Tugas</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-50 text-[#1683FF]">
                  {countOthers}
                </span>
              </button>

              <button
                type="button"
                onClick={() => { setScopeFilter("my_requests"); setCurrentPage(1); }}
                className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                  scopeFilter === "my_requests"
                    ? "bg-white text-emerald-700 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <span>Tugas Saya</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800">
                  {countMyRequests}
                </span>
              </button>
            </div>

            {/* Tombol Utama */}
            <Link
              href="/bantuan/create"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white font-bold text-xs sm:text-sm shadow-xs transition active:scale-95 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Buat Permintaan</span>
            </Link>
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
                placeholder="Cari tugas (misal: ambil dokumen, print tugas, angkat barang)..."
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
                      Kategori Bantuan
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
                className={`px-3.5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 border cursor-pointer ${
                  showMap
                    ? "bg-[#1683FF] text-white border-[#1683FF] shadow-2xs"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                }`}
              >
                <Map className="w-4 h-4" />
                <span className="hidden sm:inline">{showMap ? "Tutup Peta" : "Peta"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Peta Interaktif (Bisa Dibuka/Tutup) */}
        {showMap && (
          <div className="mb-6 animate-in fade-in duration-200 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#1683FF]" />
                <h3 className="font-bold text-sm text-slate-900">
                  Peta Titik Permintaan di Sekitar
                </h3>
              </div>
              <span className="text-xs text-slate-500">
                {filteredRequests.filter(r => r.latitude && r.longitude).length} tugas terpetakan
              </span>
            </div>
            <MapComponent 
              points={[
                ...bantuinPoints,
                ...filteredRequests
                  .filter((r) => r.latitude && r.longitude)
                  .map((r) => ({
                    ...r,
                    type: "request",
                    name: r.title,
                    address: r.locationName,
                  }))
              ]}
              userLocation={userCoordinates}
              height="360px" 
            />
          </div>
        )}

        {/* Layer 3: Daftar Bantuan (Format List Rapi & Nyaman - Maksimal 10 Bantuan per Halaman) */}
        {filteredRequests.length > 0 ? (
          <div>
            <div className="space-y-3">
              {paginatedRequests.map((req) => (
                <RequestCard key={req.id} request={req} />
              ))}
            </div>

            {/* Pagination Navigasi Halaman */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 pt-6 border-t border-slate-200/80">
                {/* Info Jumlah */}
                <div className="text-xs text-slate-500 font-medium order-2 sm:order-1">
                  Menampilkan <span className="font-bold text-slate-800">{startIndex + 1}</span> - <span className="font-bold text-slate-800">{endIndex}</span> dari <span className="font-bold text-slate-800">{filteredRequests.length}</span> bantuan
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
        ) : (
          <div className="text-center py-16 px-4 bg-white rounded-3xl border border-slate-200">
            <p className="text-sm font-bold text-slate-800">
              {filterByKabupaten 
                ? `Belum ada permintaan bantuan di ${activeKabupaten} untuk filter saat ini.`
                : "Tidak ada permintaan bantuan yang cocok dengan filter pencarian."}
            </p>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              {filterByKabupaten
                ? `Anda dapat beralih ke "Semua Wilayah" untuk melihat bantuan di kota lain, atau jadilah yang pertama membuat permintaan di ${activeKabupaten}.`
                : "Coba ubah kata kunci pencarian atau pilih kategori bantuan lainnya."}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
              {filterByKabupaten && (
                <button
                  type="button"
                  onClick={() => setFilterByKabupaten(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition cursor-pointer"
                >
                  Lihat Semua Wilayah
                </button>
              )}
              <Link
                href="/bantuan/create"
                className="px-4 py-2 rounded-xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white text-xs font-bold transition shadow-xs"
              >
                Buat Permintaan Baru
              </Link>
            </div>
          </div>
        )}

      </main>

      <Footer />
    </div>
  );
}

export default function BantuanPage() {
  return (
    <Suspense fallback={null}>
      <BantuanContent />
    </Suspense>
  );
}
