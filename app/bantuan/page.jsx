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
import CategoryIcon from "@/components/common/CategoryIcon";
import { BANTUAN_CATEGORIES } from "@/lib/categories";
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
  Globe,
  ArrowUpDown,
  Filter
} from "lucide-react";

const SORT_OPTIONS = [
  { id: "terbaru", label: "Terbaru" },
  { id: "imbalan_tinggi", label: "Imbalan Tertinggi" },
  { id: "imbalan_rendah", label: "Imbalan Terendah" },
  { id: "deadline", label: "Batas Waktu Terdekat" },
];

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
  const [sortBy, setSortBy] = useState("terbaru");
  const [activeModal, setActiveModal] = useState(null); // null | 'kategori' | 'wilayah' | 'urutkan'
  const [showMap, setShowMap] = useState(false);
  const ITEMS_PER_PAGE = 10;
  const [currentPage, setCurrentPage] = useState(1);
  const controlsRef = useRef(null);

  // Close desktop dropdowns on outside click or escape
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

  // Unified categories for dropdown from canonical source of truth
  const categories = BANTUAN_CATEGORIES;

  // Filtered Requests Logic
  const filteredRequests = useMemo(() => {
    let list = requests.filter((item) => {
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

    // Apply sorting
    if (sortBy === "imbalan_tinggi") {
      list.sort((a, b) => (b.rewardAmount || 0) - (a.rewardAmount || 0));
    } else if (sortBy === "imbalan_rendah") {
      list.sort((a, b) => (a.rewardAmount || 0) - (b.rewardAmount || 0));
    } else if (sortBy === "deadline") {
      list.sort((a, b) => {
        const da = a.deadline ? new Date(a.deadline).getTime() : Infinity;
        const db = b.deadline ? new Date(b.deadline).getTime() : Infinity;
        return da - db;
      });
    }

    return list;
  }, [requests, currentUser, scopeFilter, searchQuery, selectedCategory, filterByKabupaten, isItemInCurrentKabupaten, sortBy]);

  const currentCat = categories.find((c) => c.id === selectedCategory) || categories[0];
  const currentCatName = currentCat?.name || currentCat?.label || "Semua Kategori";

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
        
        {/* ============================================================ */}
        {/* 1. HEADER SECTION (COMPACT)                                  */}
        {/* ============================================================ */}
        <div className="mb-3 sm:mb-4">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
              Bantuan di <span className="text-[#1683FF]">{activeKabupaten.replace(/^Kabupaten\s+/i, 'Kab. ')}</span>
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-[#1683FF] border border-blue-100">
              {filteredRequests.length} tugas tersedia
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Temukan kebutuhan tolong mikro di sekitarmu dengan imbalan adil.
          </p>
        </div>

        {/* ============================================================ */}
        {/* 2. TOMBOL BAGIAN ATAS: [ Semua Tugas ] [ Tugas Saya ] [ Buat ]*/}
        {/* ============================================================ */}
        <div className="flex items-center justify-between gap-2 mb-3 sm:mb-3.5">
          {/* Scope Filter Tabs */}
          <div className="flex items-center p-0.5 sm:p-1 bg-slate-200/70 rounded-xl text-xs font-bold shrink-0">
            <button
              type="button"
              onClick={() => { setScopeFilter("others"); setCurrentPage(1); }}
              className={`px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-lg transition flex items-center gap-1 sm:gap-1.5 cursor-pointer ${
                scopeFilter === "others"
                  ? "bg-white text-[#1683FF] shadow-2xs font-extrabold"
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
              className={`px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-lg transition flex items-center gap-1 sm:gap-1.5 cursor-pointer ${
                scopeFilter === "my_requests"
                  ? "bg-white text-emerald-700 shadow-2xs font-extrabold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span>Tugas Saya</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800">
                {countMyRequests}
              </span>
            </button>
          </div>

          {/* Buat Permintaan Button */}
          <Link
            href="/bantuan/create"
            className="inline-flex items-center gap-1 sm:gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white font-bold text-xs sm:text-sm shadow-xs transition active:scale-95 shrink-0"
          >
            <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span className="hidden xs:inline">Buat Permintaan</span>
            <span className="xs:hidden">Buat</span>
          </Link>
        </div>

        {/* ============================================================ */}
        {/* 3. SEARCH INPUT (FOKUS UTAMA, LEBAR & MENONJOL)               */}
        {/* ============================================================ */}
        <div className="mb-2.5 sm:mb-3">
          <div className="relative flex items-center bg-white border border-slate-300 hover:border-slate-400 focus-within:border-[#1683FF] focus-within:ring-4 focus-within:ring-[#1683FF]/15 rounded-2xl shadow-xs transition-all">
            <Search className="w-4 sm:w-5 h-4 sm:h-5 text-slate-400 ml-3.5 sm:ml-4 shrink-0 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              placeholder="Cari tugas (misal: ambil dokumen, print tugas, angkat barang)..."
              className="w-full h-11 sm:h-12 pl-2.5 sm:pl-3 pr-10 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 font-medium bg-transparent outline-none rounded-2xl"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => { setSearchQuery(""); setCurrentPage(1); }}
                className="absolute right-3.5 p-1 rounded-full text-slate-400 hover:text-slate-700 transition cursor-pointer"
                title="Hapus pencarian"
              >
                <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            )}
          </div>
        </div>

        {/* ============================================================ */}
        {/* 4. COMPACT FILTER CONTROLS: [ Kategori ] [ Wilayah ] [ Urutkan ] [ Peta ] */}
        {/* ============================================================ */}
        <div ref={controlsRef} className="relative mb-3.5 sm:mb-4">
          <div className="grid grid-cols-4 sm:flex sm:items-center gap-1.5 sm:gap-2">
            
            {/* 1. KONTROL KATEGORI */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setActiveModal(activeModal === "kategori" ? null : "kategori")}
                className={`w-full sm:w-auto flex items-center justify-center sm:justify-start gap-1 sm:gap-1.5 px-2 sm:px-3.5 py-2 rounded-xl text-[11px] sm:text-xs font-semibold sm:font-bold border transition cursor-pointer shadow-2xs ${
                  selectedCategory !== "Semua"
                    ? "bg-blue-50 border-[#1683FF] text-[#1683FF]"
                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                }`}
                title="Pilih Kategori"
              >
                <Layers className={`w-3.5 h-3.5 shrink-0 ${selectedCategory !== "Semua" ? "text-[#1683FF]" : "text-slate-500"}`} />
                <span className="hidden sm:inline truncate max-w-[130px]">
                  {selectedCategory === "Semua" ? "Semua Kategori" : currentCatName}
                </span>
                <span className="sm:hidden truncate">Kategori</span>
                {selectedCategory !== "Semua" && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1683FF] shrink-0 sm:hidden" />
                )}
                <ChevronDown className={`w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0 transition-transform duration-200 ${activeModal === "kategori" ? "rotate-180" : ""}`} />
              </button>

              {/* Popover Desktop: Kategori */}
              {activeModal === "kategori" && (
                <div className="hidden sm:block absolute top-full left-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 p-2.5 z-30 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between pb-2 mb-1.5 border-b border-slate-100">
                    <span className="text-xs font-bold text-slate-900">Pilih Kategori</span>
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
                  <div className="space-y-0.5 max-h-64 overflow-y-auto">
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
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs transition cursor-pointer ${
                            isSelected
                              ? "bg-blue-50 text-[#1683FF] font-bold"
                              : "hover:bg-slate-50 text-slate-700 font-medium"
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
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

            {/* 2. KONTROL WILAYAH (Single Control) */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setActiveModal(activeModal === "wilayah" ? null : "wilayah")}
                className={`w-full sm:w-auto flex items-center justify-center sm:justify-start gap-1 sm:gap-1.5 px-2 sm:px-3.5 py-2 rounded-xl text-[11px] sm:text-xs font-semibold sm:font-bold border transition cursor-pointer shadow-2xs ${
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
                <div className="hidden sm:block absolute top-full left-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 p-3 z-30 animate-in fade-in zoom-in-95 duration-150">
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
                          Tampilkan tugas lokal terdekat
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
                          Tampilkan tugas dari seluruh kota
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 3. KONTROL URUTKAN */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setActiveModal(activeModal === "urutkan" ? null : "urutkan")}
                className={`w-full sm:w-auto flex items-center justify-center sm:justify-start gap-1 sm:gap-1.5 px-2 sm:px-3.5 py-2 rounded-xl text-[11px] sm:text-xs font-semibold sm:font-bold border transition cursor-pointer shadow-2xs ${
                  sortBy !== "terbaru"
                    ? "bg-blue-50 border-[#1683FF] text-[#1683FF]"
                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                }`}
                title="Urutkan Hasil"
              >
                <ArrowUpDown className={`w-3.5 h-3.5 shrink-0 ${sortBy !== "terbaru" ? "text-[#1683FF]" : "text-slate-500"}`} />
                <span className="hidden sm:inline truncate max-w-[120px]">
                  {SORT_OPTIONS.find((s) => s.id === sortBy)?.label || "Urutkan"}
                </span>
                <span className="sm:hidden truncate">Urutkan</span>
                {sortBy !== "terbaru" && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1683FF] shrink-0 sm:hidden" />
                )}
                <ChevronDown className={`w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0 transition-transform duration-200 ${activeModal === "urutkan" ? "rotate-180" : ""}`} />
              </button>

              {/* Popover Desktop: Urutkan */}
              {activeModal === "urutkan" && (
                <div className="hidden sm:block absolute top-full left-0 sm:left-auto sm:right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-30 animate-in fade-in zoom-in-95 duration-150">
                  <span className="text-xs font-bold text-slate-900 block px-2 py-1.5 border-b border-slate-100 mb-1">
                    Urutkan Tugas
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
                        className={`w-full px-2.5 py-1.5 rounded-xl text-xs text-left transition cursor-pointer flex items-center justify-between ${
                          sortBy === opt.id
                            ? "bg-blue-50 text-[#1683FF] font-bold"
                            : "hover:bg-slate-50 text-slate-700"
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

            {/* 4. TOMBOL TOGGLE PETA */}
            <button
              type="button"
              onClick={() => setShowMap(!showMap)}
              className={`w-full sm:w-auto px-2.5 sm:px-3.5 py-2 rounded-xl text-[11px] sm:text-xs font-bold transition flex items-center justify-center gap-1.5 shrink-0 border cursor-pointer ${
                showMap
                  ? "bg-[#1683FF] text-white border-[#1683FF] shadow-2xs"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              }`}
              title="Toggle Peta"
            >
              <Map className="w-3.5 h-3.5 shrink-0" />
              <span>{showMap ? "Tutup Peta" : "Peta"}</span>
            </button>
          </div>
        </div>

        {/* ============================================================ */}
        {/* MOBILE BOTTOM SHEET FOR [ Kategori ] [ Wilayah ] [ Urutkan ] */}
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

              {/* Sheet Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-extrabold text-sm text-slate-900">
                  {activeModal === "kategori" && "Pilih Kategori Bantuan"}
                  {activeModal === "wilayah" && "Cakupan Wilayah"}
                  {activeModal === "urutkan" && "Urutkan Tugas"}
                </h3>
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Content: Kategori Sheet */}
              {activeModal === "kategori" && (
                <div className="space-y-1">
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
                        className={`w-full p-3 rounded-2xl border text-xs text-left transition cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? "bg-blue-50 border-[#1683FF] text-[#1683FF] font-bold"
                            : "border-slate-200 text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <CategoryIcon category={cat} className={`w-4 h-4 shrink-0 ${isSelected ? "text-[#1683FF]" : "text-slate-400"}`} />
                          <span>{catDisplayName}</span>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-[#1683FF]" />}
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
                        ? "bg-blue-50 border-[#1683FF] text-[#1683FF]"
                        : "border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full border mt-0.5 flex items-center justify-center shrink-0 ${
                      filterByKabupaten ? "border-[#1683FF] bg-[#1683FF]" : "border-slate-300"
                    }`}>
                      {filterByKabupaten && <Check className="w-2.5 h-2.5 text-white stroke-[3]" />}
                    </div>
                    <div>
                      <div className="text-xs font-bold">Hanya {activeKabupaten}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Tampilkan tugas lokal terdekat
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
                        ? "bg-blue-50 border-[#1683FF] text-[#1683FF]"
                        : "border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full border mt-0.5 flex items-center justify-center shrink-0 ${
                      !filterByKabupaten ? "border-[#1683FF] bg-[#1683FF]" : "border-slate-300"
                    }`}>
                      {!filterByKabupaten && <Check className="w-2.5 h-2.5 text-white stroke-[3]" />}
                    </div>
                    <div>
                      <div className="text-xs font-bold">Semua Wilayah</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Tampilkan tugas dari seluruh kota
                      </div>
                    </div>
                  </button>
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

        {/* Section Divider & Heading: Daftar Tugas */}
        <div className="pt-2 sm:pt-2.5 border-t border-slate-200/80 flex items-center justify-between mb-3">
          <h2 className="text-sm sm:text-base font-extrabold text-slate-900">
            Daftar Tugas
          </h2>
          <span className="text-xs text-slate-500 font-medium">
            {filteredRequests.length} tugas
          </span>
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
            <div className="space-y-3.5 sm:space-y-4">
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
