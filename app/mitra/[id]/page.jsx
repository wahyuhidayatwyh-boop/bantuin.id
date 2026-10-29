"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useApp } from "@/lib/context/AppContext";
import { formatIDR } from "@/lib/utils";
import { getMitraStoreById } from "@/lib/mock/mitraData";
import ProductProfileCard from "@/components/cards/ProductProfileCard";
import {
  ShieldCheck,
  MapPin,
  Clock,
  Star,
  ArrowLeft,
  MessageCircle,
  Share2,
  CheckCircle2,
  Store,
  Calendar,
  ShoppingBag,
  Info,
  ChevronRight,
  ExternalLink,
  Lock,
  ThumbsUp,
  Camera,
  X,
  Eye,
  Package,
  ChevronDown
} from "lucide-react";

export default function MitraStorePage() {
  const { id } = useParams();
  const router = useRouter();
  const { activeKabupaten, createRentalOrder } = useApp();

  const [currentStore, setCurrentStore] = useState(() => getMitraStoreById(id));
  const [isLoadingStore, setIsLoadingStore] = useState(true);

  React.useEffect(() => {
    let isMounted = true;
    const fetchStore = async () => {
      try {
        const res = await fetch(`/api/mitra/${id}`);
        const json = await res.json();
        if (isMounted && json.success && json.data?.store) {
          const { store: s, rentals: rList = [], reviews: revList = [] } = json.data;
          setCurrentStore({
            id: s.id,
            name: s.partnerBusinessName || s.fullName || "Toko Mitra",
            tagline: s.bio || "Penyedia Rental Resmi Bantuin",
            category: "Rental & Sewa",
            badge: s.badge || (s.verificationStatus === "verified" ? "Mitra Rental Terverifikasi" : (s.verificationStatus === "pending_review" ? "Menunggu Verifikasi" : "Mitra Rental")),
            avatar: s.avatarUrl || s.avatar,
            coverImage: s.bannerUrl || s.coverImage,
            address: s.partnerAddress || s.campusName || "Indonesia",
            verificationStatus: s.verificationStatus,
            rating: Number(s.ratingAvg || s.rating || 5.0),
            reviewsCount: Number(s.reviewsCount || s.ratingCount || revList.length || 0),
            reviewCount: Number(s.reviewCount || s.reviewsCount || s.ratingCount || revList.length || 0),
            reliabilityScore: s.reliabilityScore || 100,
            completedOrders: s.completedOrders !== undefined ? s.completedOrders : (s.completedHelpsCount || 0),
            responseTime: s.responseTime || `${s.responseTimeMinutes || 15} Menit`,
            joinedYear: s.joinedYear || (s.createdAt ? new Date(s.createdAt).getFullYear() : 2026),
            catalog: rList.map((r) => ({
              id: r.id,
              name: r.title,
              category: r.category,
              price: r.dailyPrice,
              depositAmount: r.depositAmount,
              unit: "/ hari",
              image: r.photoUrls?.[0] || "/logotab.png",
              photos: r.photoUrls || [],
              rating: r.ratingAvg || 5.0,
              reviews: r.ratingCount || 0,
              stockStatus: r.isAvailable ? "Siap Sewa" : "Sedang Disewa",
              desc: r.description,
              type: "sewa",
              pickupLocation: r.pickupLocation,
            })),
            portfolioPhotos: Array.isArray(s.portfolioPhotos)
              ? s.portfolioPhotos
              : (Array.isArray(s.gallery) ? s.gallery : []),
            gallery: Array.isArray(s.portfolioPhotos)
              ? s.portfolioPhotos
              : (Array.isArray(s.gallery) ? s.gallery : []),
            reviews: revList.map((rev) => ({
              id: rev.id,
              userName: rev.userName || rev.reviewer?.fullName || "Pelanggan Bantuin",
              userAvatar: rev.userAvatar || rev.reviewer?.avatarUrl || "/logotab.png",
              avatar: rev.avatar || rev.userAvatar || rev.reviewer?.avatarUrl || "/logotab.png",
              rating: rev.rating || 5,
              comment: rev.comment || "",
              date: rev.date || (rev.createdAt ? new Date(rev.createdAt).toLocaleDateString("id-ID") : "Baru saja"),
              item: rev.item || rev.rentalTitle || rev.orderTitle || "Unit Sewa",
            })),
            about: s.bio || "Penyedia rental dan sewa alat terverifikasi Bantuin.id.",
            operationalHours: s.operationalHours || "Setiap Hari, 08:00 - 21:00 WIB",
            securityDepositPolicy: s.securityDepositPolicy || "Wajib menunjukkan identitas fisik (KTP/KTM) dan menyelesaikan pembayaran escrow Bantuin sebelum serah terima unit.",
          });
        }
      } catch (err) {
        console.warn("Could not fetch store from DB, fallback to local:", err);
      } finally {
        if (isMounted) setIsLoadingStore(false);
      }
    };

    fetchStore();

    const handleUpdate = () => {
      fetchStore();
    };
    window.addEventListener("bantuin_mitra_store_updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      isMounted = false;
      window.removeEventListener("bantuin_mitra_store_updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, [id]);

  const store = currentStore || getMitraStoreById(id);

  const [activeTab, setActiveTab] = useState("katalog"); // 'katalog' | 'galeri' | 'ulasan' | 'kebijakan'
  const [categoryFilter, setCategoryFilter] = useState("semua");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedModalPhotoIndex, setSelectedModalPhotoIndex] = useState(0);
  const [selectedGalleryPhoto, setSelectedGalleryPhoto] = useState(null);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [bookStartDate, setBookStartDate] = useState("2026-09-18");
  const [bookDurationDays, setBookDurationDays] = useState(1);
  const [createdRoomId, setCreatedRoomId] = useState(null);
  const [isDescExpanded, setIsDescExpanded] = useState(false);

  const cleanStoreAddress = React.useMemo(() => {
    let addr = (store?.address || "").trim();
    if (!addr) return activeKabupaten || "Indonesia";
    const kab = (activeKabupaten || "").trim();
    if (kab && addr.toLowerCase().includes(kab.toLowerCase())) {
      return addr;
    }
    return `${addr}, ${kab}`;
  }, [store?.address, activeKabupaten]);

  // Jika sedang loading awal dan belum ada data store, tampilkan skeleton elegan
  if (isLoadingStore && !store) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F8FBFF]">
        <Navbar />
        <div className="relative w-full h-48 sm:h-64 md:h-72 lg:h-80 bg-slate-200 animate-pulse" />
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 -mt-20 sm:-mt-24 relative z-20 w-full">
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-md border border-slate-100 flex flex-col gap-6">
            <div className="flex items-center gap-5">
              <div className="w-24 h-24 rounded-2xl bg-slate-200 animate-pulse shrink-0" />
              <div className="space-y-2 flex-1">
                <div className="w-48 h-6 bg-slate-200 rounded-md animate-pulse" />
                <div className="w-72 h-4 bg-slate-200 rounded-md animate-pulse" />
                <div className="w-36 h-4 bg-slate-200 rounded-md animate-pulse" />
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F8FBFF]">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center text-[#1683FF] mb-4">
            <Store className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Toko Mitra Tidak Ditemukan</h2>
          <p className="text-xs text-slate-500 mt-1 max-w-sm">
            Toko mitra yang Anda cari tidak tersedia atau sedang dinonaktifkan sementara.
          </p>
          <Link
            href="/sewa"
            className="px-6 py-3 rounded-xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white font-bold text-sm shadow-md transition"
          >
            Jelajahi Rental Lainnya
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const catalogList = store.catalog || [];
  const filteredCatalog = catalogList.filter((item) => {
    if (categoryFilter === "semua") return true;
    if (categoryFilter === "sewa") return item.type === "sewa";
    if (categoryFilter === "jasa") return item.type === "jasa";
    return true;
  });

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    }
  };

  const handleBookProduct = (e) => {
    e.preventDefault();
    setBookingSuccess(true);
    setTimeout(() => {
      setBookingSuccess(false);
      setSelectedProduct(null);
      router.push("/chat");
    }, 1800);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FBFF]">
      <Navbar />

      <main className="flex-1 pb-16">
        
        {/* Cover Banner Header */}
        <div className="relative w-full h-48 sm:h-64 md:h-72 lg:h-80 bg-slate-900 overflow-hidden">
          {store.coverImage ? (
            <img
              src={store.coverImage}
              alt={store.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 flex items-center justify-center">
              <div className="absolute inset-0 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:24px_24px] opacity-15" />
            </div>
          )}
          
          {/* Top Breadcrumbs / Back */}
          <div className="absolute top-4 sm:top-6 left-4 sm:left-6 lg:left-8 z-10">
            <Link
              href="/sewa"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-black/40 hover:bg-black/60 text-white backdrop-blur-md text-xs sm:text-sm font-semibold border border-white/20 transition shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Rental</span>
            </Link>
          </div>

          <div className="absolute top-4 sm:top-6 right-4 sm:right-6 lg:right-8 z-10">
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-black/40 hover:bg-black/60 text-white backdrop-blur-md text-xs sm:text-sm font-semibold border border-white/20 transition shadow-sm cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
              <span>{isCopied ? "Link Tersalin!" : "Bagikan"}</span>
            </button>
          </div>
        </div>

        {/* Store Profile Card */}
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 -mt-20 sm:-mt-24 relative z-20">
          <div className="bg-white rounded-3xl p-5 sm:p-7 lg:p-8 shadow-[0_12px_36px_rgba(22,131,255,0.06)] border border-slate-100">
            
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5 sm:gap-6">
              
              {/* Store Avatar & Main Identity */}
              <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6 flex-1 min-w-0">
                
                <div className="relative shrink-0">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-2xl sm:rounded-3xl overflow-hidden border-4 border-white shadow-md bg-slate-100 flex items-center justify-center">
                    {store.avatar && !store.avatar.includes("dicebear.com") ? (
                      <img
                        src={store.avatar}
                        alt={store.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-linear-to-br from-[#1683FF] to-[#0E5FCC] text-white flex items-center justify-center font-black text-3xl sm:text-4xl">
                        {((store.name || "M").trim()[0] || "M").toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-1 sm:p-1.5 rounded-full ring-2 ring-white shadow-xs" title="Terverifikasi Resmi">
                    <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                </div>

                <div className="flex-1 min-w-0 w-full">
                  {/* Badges */}
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-2">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-[#1683FF] text-[11px] sm:text-xs font-bold border border-blue-100">
                      <Store className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      <span>{store.category || "Rental & Sewa"}</span>
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-[11px] sm:text-xs font-bold border border-emerald-100">
                      <ShieldCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      <span>{store.badge || "Mitra Rental Terverifikasi"}</span>
                    </span>
                  </div>

                  {/* Store Title */}
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">
                    {store.name}
                  </h1>

                  {/* Store Quick Meta Pills */}
                  <div className="flex flex-wrap items-center gap-2 mt-2.5 text-xs text-slate-600 font-medium">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-50 text-amber-900 border border-amber-200/60 font-bold text-xs shrink-0">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                      <span>{store.rating}</span>
                      <span className="text-amber-700/70 font-normal">({store.reviewCount || store.reviewsCount || (store.reviews?.length) || 0} ulasan)</span>
                    </div>

                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-50 text-slate-700 border border-slate-200/70 text-xs shrink-0 min-w-0">
                      <MapPin className="w-3.5 h-3.5 text-[#1683FF] shrink-0" />
                      <span className="truncate max-w-[200px] sm:max-w-xs">{cleanStoreAddress}</span>
                    </div>

                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200/70 text-xs shrink-0">
                      <Clock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{store.operationalHours}</span>
                    </div>
                  </div>

                  {/* Polished Store Description Block (Desktop & Mobile Friendly) */}
                  {store.tagline && (
                    <div className="mt-3.5 bg-slate-50/80 hover:bg-slate-50 border border-slate-200/70 rounded-2xl p-3 sm:p-3.5 transition-all max-w-2xl">
                      <div className="flex items-start gap-2.5">
                        <div className="p-1 rounded-lg bg-blue-50 text-[#1683FF] shrink-0 mt-0.5" title="Deskripsi Toko">
                          <Info className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs sm:text-[13px] text-slate-600 leading-relaxed font-normal ${!isDescExpanded ? "line-clamp-2" : ""}`}>
                            {store.tagline}
                          </p>
                          {store.tagline.length > 110 && (
                            <button
                              type="button"
                              onClick={() => setIsDescExpanded(!isDescExpanded)}
                              className="mt-1.5 text-xs font-bold text-[#1683FF] hover:text-[#0E5FCC] inline-flex items-center gap-1 transition cursor-pointer select-none"
                            >
                              <span>{isDescExpanded ? "Sembunyikan deskripsi" : "Baca deskripsi selengkapnya"}</span>
                              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isDescExpanded ? "rotate-180" : ""}`} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                </div>

              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center gap-2.5 shrink-0 w-full lg:w-48 mt-1 lg:mt-0">
                <Link
                  href={`/chat?partnerId=${store.id}`}
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 sm:py-3.5 rounded-xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white font-bold text-sm shadow-[0_8px_20px_rgba(22,131,255,0.25)] transition active:scale-95"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Chat Toko</span>
                </Link>
                <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Pembayaran Terverifikasi</span>
                </div>
              </div>

            </div>

            {/* Quick Stats Banner */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4 mt-6 pt-6 border-t border-slate-100">
              <div className="bg-slate-50/80 rounded-2xl p-3 sm:p-3.5 text-center">
                <div className="text-base sm:text-xl font-black text-slate-900">{store.rating} / 5.0</div>
                <div className="text-[11px] sm:text-xs text-slate-500 font-medium mt-0.5">Rating Kepuasan</div>
              </div>
              <div className="bg-slate-50/80 rounded-2xl p-3 sm:p-3.5 text-center">
                <div className="text-base sm:text-xl font-black text-[#1683FF]">{store.completedOrders || 0}+</div>
                <div className="text-[11px] sm:text-xs text-slate-500 font-medium mt-0.5">Pesanan Sukses</div>
              </div>
              <div className="bg-slate-50/80 rounded-2xl p-3 sm:p-3.5 text-center">
                <div className="text-base sm:text-xl font-black text-emerald-600">{store.responseTime}</div>
                <div className="text-[11px] sm:text-xs text-slate-500 font-medium mt-0.5">Waktu Respon</div>
              </div>
              <div className="bg-slate-50/80 rounded-2xl p-3 sm:p-3.5 text-center">
                <div className="text-base sm:text-xl font-black text-slate-900">Sejak {store.joinedYear}</div>
                <div className="text-[11px] sm:text-xs text-slate-500 font-medium mt-0.5">Mitra Terverifikasi</div>
              </div>
            </div>

          </div>
        </div>

        {/* Tab Navigation & Content Container */}
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 mt-8">
          
          {/* Tabs Pill Header */}
          <div className="flex items-center gap-2 border-b border-slate-200 pb-3 mb-8 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveTab("katalog")}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-xs sm:text-sm transition cursor-pointer shrink-0 ${
                activeTab === "katalog"
                  ? "bg-[#1683FF] text-white shadow-sm"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Katalog Barang Sewa ({store.catalog?.length || 0})</span>
            </button>

            <button
              onClick={() => setActiveTab("galeri")}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-xs sm:text-sm transition cursor-pointer shrink-0 ${
                activeTab === "galeri"
                  ? "bg-[#1683FF] text-white shadow-sm"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              <Camera className="w-4 h-4" />
              <span>Galeri Showcase ({store.portfolioPhotos?.length || 0})</span>
            </button>

            <button
              onClick={() => setActiveTab("ulasan")}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-xs sm:text-sm transition cursor-pointer shrink-0 ${
                activeTab === "ulasan"
                  ? "bg-[#1683FF] text-white shadow-sm"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              <Star className="w-4 h-4" />
              <span>Ulasan & Rating ({store.reviews?.length || 0})</span>
            </button>

            <button
              onClick={() => setActiveTab("kebijakan")}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-xs sm:text-sm transition cursor-pointer shrink-0 ${
                activeTab === "kebijakan"
                  ? "bg-[#1683FF] text-white shadow-sm"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              <Info className="w-4 h-4" />
              <span>Syarat & Kebijakan Sewa</span>
            </button>
          </div>

          {/* TAB 1: KATALOG BARANG SEWA (4 CARD PER BARIS DI DESKTOP) */}
          {activeTab === "katalog" && (
            <div>
              {/* Category Filter Pills */}
              <div className="flex items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                  <button
                    onClick={() => setCategoryFilter("semua")}
                    className={`px-4 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      categoryFilter === "semua"
                        ? "bg-slate-900 text-white"
                        : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                    }`}
                  >
                    Semua Unit Sewa ({store.catalog.length})
                  </button>
                  <button
                    onClick={() => setCategoryFilter("populer")}
                    className={`px-4 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      categoryFilter === "populer"
                        ? "bg-slate-900 text-white"
                        : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                    }`}
                  >
                    Unit Terpopuler
                  </button>
                </div>

                <div className="text-xs text-slate-500 hidden sm:block">
                  Menampilkan <span className="font-bold text-slate-800">{filteredCatalog.length}</span> barang sewa
                </div>
              </div>

              {/* Products Grid: 2 Columns on Mobile, 4 on Desktop */}
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4 md:gap-5">
                {filteredCatalog.map((item) => (
                  <ProductProfileCard
                    key={item.id}
                    item={{
                      ...item,
                      title: item.name || item.title,
                      dailyPrice: item.price ?? item.dailyPrice,
                      photoUrl: item.image || (item.photos && item.photos[0]),
                      ownerName: store.name,
                      ownerId: store.id,
                      pickupLocation: store.address,
                      isVerifiedPartner: true,
                    }}
                    type="rental"
                  />
                ))}
              </div>

              {/* Empty State Katalog */}
              {filteredCatalog.length === 0 && (
                <div className="py-14 sm:py-20 text-center bg-white rounded-3xl border border-dashed border-slate-200 p-8">
                  <div className="w-16 h-16 rounded-3xl bg-blue-50 text-[#1683FF] flex items-center justify-center mx-auto mb-3">
                    <Package className="w-8 h-8" />
                  </div>
                  <h4 className="text-base font-bold text-slate-900">Belum Ada Unit Sewa Tersedia</h4>
                  <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mt-1 leading-relaxed">
                    Toko mitra ini belum mengunggah unit rental pada kategori yang dipilih. Silakan pilih kategori lain atau hubungi toko via chat.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: GALERI SHOWCASE GEAR & SETUP */}
          {activeTab === "galeri" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Camera className="w-5 h-5 text-[#1683FF]" />
                    <span>Showcase Perlengkapan &amp; Setup Toko</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Dokumentasi riil perlengkapan kamera, setup gear, dan workshop dari {store.name}
                  </p>
                </div>
                <span className="text-xs font-semibold text-slate-500 self-start sm:self-auto px-3 py-1 bg-slate-50 rounded-full border border-slate-200/80">
                  Total {(store.portfolioPhotos || []).length} Foto Showcase
                </span>
              </div>

              {(!store.portfolioPhotos || store.portfolioPhotos.length === 0) ? (
                <div className="py-14 sm:py-20 text-center bg-white rounded-3xl border border-dashed border-slate-200 p-8">
                  <div className="w-16 h-16 rounded-3xl bg-blue-50 text-[#1683FF] flex items-center justify-center mx-auto mb-3">
                    <Camera className="w-8 h-8" />
                  </div>
                  <h4 className="text-base font-bold text-slate-900">Belum Ada Foto Galeri Showcase</h4>
                  <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mt-1 leading-relaxed">
                    Toko mitra ini belum mengunggah foto portofolio showcase perlengkapan atau setup gear.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
                  {store.portfolioPhotos.map((photo, idx) => {
                    const photoUrl = typeof photo === "string" ? photo : (photo.url || photo.photoUrl || photo.image);
                    const photoTitle = typeof photo === "string" ? `Showcase ${idx + 1}` : (photo.title || photo.caption || "Showcase Gear");
                    const photoCategory = typeof photo === "string" ? "Perlengkapan" : (photo.category || "Gear & Setup");
                    const photoDesc = typeof photo === "string" ? "" : (photo.description || photo.desc || "");

                    return (
                      <div
                        key={photo.id || idx}
                        onClick={() => setSelectedGalleryPhoto({ url: photoUrl, title: photoTitle, category: photoCategory, description: photoDesc })}
                        className="bg-white rounded-2xl overflow-hidden border border-slate-200/90 shadow-2xs hover:shadow-lg hover:border-[#1683FF]/40 transition-all duration-300 flex flex-col group cursor-pointer"
                      >
                        <div className="relative aspect-4/3 w-full bg-slate-100 overflow-hidden">
                          <img
                            src={photoUrl}
                            alt={photoTitle}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            onError={(e) => { e.currentTarget.src = "/logotab.png"; }}
                          />
                          <div className="absolute top-2 left-2 sm:top-2.5 sm:left-2.5">
                            <span className="px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-extrabold uppercase bg-black/60 text-white backdrop-blur-xs border border-white/20">
                              {photoCategory}
                            </span>
                          </div>
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="px-3 py-1.5 rounded-xl bg-white/90 text-slate-900 font-bold text-xs shadow-md backdrop-blur-xs flex items-center gap-1.5 transform scale-90 group-hover:scale-100 transition-transform">
                              <Eye className="w-3.5 h-3.5 text-[#1683FF]" />
                              <span>Lihat Detail</span>
                            </span>
                          </div>
                        </div>

                        <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between">
                          <div>
                            <h4 className="font-bold text-xs sm:text-sm text-slate-900 group-hover:text-[#1683FF] transition line-clamp-1">
                              {photoTitle}
                            </h4>
                            {photoDesc && (
                              <p className="text-[11px] sm:text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                                {photoDesc}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ULASAN & RATING TOKO */}
          {activeTab === "ulasan" && (
            <div className="space-y-8">
              
              {/* Overall Score Header Card */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-8">
                
                <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
                  <div className="w-28 h-28 rounded-3xl bg-amber-50 border border-amber-200/60 flex flex-col items-center justify-center">
                    <span className="text-4xl font-black text-slate-900">{store.rating}</span>
                    <div className="flex items-center gap-1 text-amber-400 mt-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                      ))}
                    </div>
                    <span className="text-[10px] text-slate-500 font-bold mt-1">dari 5.0</span>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-slate-900">Ulasan Terverifikasi Pelanggan</h3>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-md">
                      Semua ulasan berasal dari transaksi yang telah selesai diverifikasi secara resmi melalui sistem pembayaran resmi Bantuin.
                    </p>
                    <div className="flex items-center gap-2 mt-3 text-xs font-semibold text-emerald-600">
                      <ShieldCheck className="w-4 h-4" />
                      <span>100% Review Asli Pembeli {activeKabupaten}</span>
                    </div>
                  </div>
                </div>

                {/* Rating Bar Breakdown */}
                <div className="w-full md:w-72 space-y-2 text-xs font-medium">
                  <div className="flex items-center gap-2">
                    <span className="w-10 text-slate-500 flex items-center gap-0.5">5 <Star className="w-3 h-3 fill-amber-400 text-amber-400 inline" /></span>
                    <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full bg-amber-400 rounded-full w-[90%]" />
                    </div>
                    <span className="w-8 text-right text-slate-600 font-bold">90%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-10 text-slate-500 flex items-center gap-0.5">4 <Star className="w-3 h-3 fill-amber-400 text-amber-400 inline" /></span>
                    <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full bg-amber-400 rounded-full w-[8%]" />
                    </div>
                    <span className="w-8 text-right text-slate-600 font-bold">8%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-10 text-slate-500 flex items-center gap-0.5">3 <Star className="w-3 h-3 fill-amber-400 text-amber-400 inline" /></span>
                    <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full bg-amber-400 rounded-full w-[2%]" />
                    </div>
                    <span className="w-8 text-right text-slate-600 font-bold">2%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-10 text-slate-500 flex items-center gap-0.5">2 <Star className="w-3 h-3 fill-amber-400 text-amber-400 inline" /></span>
                    <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full bg-amber-400 rounded-full w-[0%]" />
                    </div>
                    <span className="w-8 text-right text-slate-600 font-bold">0%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-10 text-slate-500 flex items-center gap-0.5">1 <Star className="w-3 h-3 fill-amber-400 text-amber-400 inline" /></span>
                    <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full bg-amber-400 rounded-full w-[0%]" />
                    </div>
                    <span className="w-8 text-right text-slate-600 font-bold">0%</span>
                  </div>
                </div>

              </div>

              {/* Reviews List */}
              {(!store.reviews || store.reviews.length === 0) ? (
                <div className="py-14 sm:py-20 text-center bg-white rounded-3xl border border-dashed border-slate-200 p-8">
                  <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-500 flex items-center justify-center mx-auto mb-3">
                    <Star className="w-8 h-8" />
                  </div>
                  <h4 className="text-base font-bold text-slate-900">Belum Ada Ulasan Pelanggan</h4>
                  <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mt-1 leading-relaxed">
                    Toko ini belum memiliki ulasan transaksi sewa. Jadilah pelanggan pertama yang menyewa unit dan memberikan ulasan!
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {store.reviews.map((rev) => (
                    <div
                      key={rev.id}
                      className="bg-white rounded-3xl p-6 border border-slate-100 shadow-2xs hover:border-blue-100 transition"
                    >
                      <div className="flex items-start justify-between gap-4">
                        
                        <div className="flex items-center gap-3.5">
                          <img
                            src={rev.userAvatar || rev.avatar || "/logotab.png"}
                            alt={rev.userName}
                            onError={(e) => { e.currentTarget.src = "/logotab.png"; }}
                            className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-xs"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-bold text-slate-900">{rev.userName}</h4>
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                                <ShieldCheck className="w-3 h-3" />
                                <span>Terverifikasi</span>
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="flex items-center gap-0.5 text-amber-400">
                                {[...Array(rev.rating || 5)].map((_, i) => (
                                  <Star key={i} className="w-3 h-3 fill-amber-400" />
                                ))}
                              </div>
                              <span className="text-[11px] text-slate-400">• {rev.date}</span>
                            </div>
                          </div>
                        </div>

                        <span className="text-xs font-semibold text-slate-500 bg-slate-50 px-3 py-1 rounded-xl hidden sm:inline-block">
                          Item: {rev.item || "Unit Sewa"}
                        </span>
                      </div>

                      <p className="text-xs sm:text-sm text-slate-700 leading-relaxed mt-4">
                        &ldquo;{rev.comment}&rdquo;
                      </p>

                      <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-400">
                        <ThumbsUp className="w-3 h-3 text-[#1683FF]" />
                        <span>Pengalaman transaksi aman via pembayaran resmi Bantuin</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

            </div>
          )}

          {/* TAB 3: TENTANG & KEBIJAKAN TOKO */}
          {activeTab === "kebijakan" && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-2xs space-y-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Tentang Toko Kami</h3>
                <div className="bg-slate-50/70 p-4 sm:p-5 rounded-2xl border border-slate-100">
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal whitespace-pre-line">
                    {store.about}
                  </p>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100">
                <h3 className="text-lg font-bold text-slate-900 mb-2">Kebijakan Deposit & Jaminan</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {store.securityDepositPolicy}
                </p>
              </div>

              <div className="pt-6 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-blue-50/60 rounded-2xl p-4 border border-blue-100">
                  <div className="flex items-center gap-2 text-[#1683FF] font-bold text-sm mb-1">
                    <Lock className="w-4 h-4" />
                    <span>Sistem Pembayaran Terverifikasi</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Dana pembayaran diamankan melalui Payment Gateway resmi sampai barang diterima atau jasa selesai dikerjakan dengan memuaskan.
                  </p>
                </div>

                <div className="bg-emerald-50/60 rounded-2xl p-4 border border-emerald-100">
                  <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm mb-1">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Identitas Toko Tervalidasi</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Mitra ini telah melewati verifikasi dokumen legalitas, lokasi fisik di {activeKabupaten}, dan nomor kontak penanggung jawab resmi.
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>

      </main>

      {/* Booking / Rental Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-[#1683FF] uppercase tracking-wider">
                  {selectedProduct.type === "sewa" ? "Konfirmasi Sewa Barang" : "Pemesanan Jasa"}
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                  {selectedProduct.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedProduct(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleBookProduct} className="p-5 sm:p-6 space-y-4">
              
              {bookingSuccess ? (
                <div className="py-8 text-center space-y-3">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h4 className="text-lg font-bold text-slate-900">Permintaan Terkirim!</h4>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto">
                    Mengalihkan kamu ke chat toko {store.name} untuk konfirmasi jadwal &amp; pembayaran...
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-2.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-3.5">
                      <img
                        src={(selectedProduct.photos && selectedProduct.photos[selectedModalPhotoIndex]) || selectedProduct.image}
                        alt={selectedProduct.name}
                        className="w-16 h-16 rounded-xl object-cover border border-slate-200"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-slate-900 line-clamp-1">{selectedProduct.name}</div>
                        <div className="text-sm font-extrabold text-[#1683FF] mt-0.5">
                          {formatIDR(selectedProduct.price)} {selectedProduct.unit}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">Vendor: {store.name}</div>
                      </div>
                    </div>

                    {/* Multi-Photo Gallery Selector in Modal */}
                    {selectedProduct.photos && selectedProduct.photos.length > 1 && (
                      <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
                          {selectedProduct.photos.map((ph, pIdx) => (
                            <button
                              key={pIdx}
                              type="button"
                              onClick={() => setSelectedModalPhotoIndex(pIdx)}
                              className={`w-9 h-9 rounded-lg overflow-hidden shrink-0 border-2 transition cursor-pointer ${
                                selectedModalPhotoIndex === pIdx
                                  ? "border-[#1683FF] ring-2 ring-blue-100 shadow-xs"
                                  : "border-slate-200 opacity-60 hover:opacity-100"
                              }`}
                            >
                              <img src={ph} alt={`Thumb ${pIdx + 1}`} className="w-full h-full object-cover" />
                            </button>
                          ))}
                        </div>
                        <Link
                          href={`/sewa/${selectedProduct.id}`}
                          target="_blank"
                          className="text-[11px] font-bold text-[#1683FF] hover:underline flex items-center gap-1 shrink-0 px-2 py-1 bg-white rounded-lg border border-slate-200 shadow-2xs"
                        >
                          <span>Galeri Penuh</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Mulai Sewa
                      </label>
                      <input
                        type="date"
                        required
                        value={bookStartDate}
                        onChange={(e) => setBookStartDate(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-[#1683FF]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Durasi Sewa (Hari)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="30"
                        value={bookDurationDays}
                        onChange={(e) => setBookDurationDays(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-[#1683FF]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Catatan Tambahan untuk Mitra Rental
                    </label>
                    <textarea
                      rows={2}
                      value={bookNotes}
                      onChange={(e) => setBookNotes(e.target.value)}
                      placeholder="Contoh: Butuh diantar ke lokasi atau diambil langsung jam 9 pagi..."
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-[#1683FF]"
                    />
                  </div>

                  {/* Rincian Biaya Transparan */}
                  <div className="p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-2xl space-y-2 text-xs">
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Biaya Sewa ({bookDurationDays} hari):</span>
                      <span className="font-bold text-slate-900">{formatIDR(selectedProduct.price * bookDurationDays)}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Deposit Jaminan Sewa:</span>
                      <span className="font-bold text-slate-900">{formatIDR(Math.max(selectedProduct.price, 250000))}</span>
                    </div>
                    <div className="pt-2 border-t border-blue-200 flex items-center justify-between font-extrabold text-slate-900">
                      <span>Total Pembayaran Aman:</span>
                      <span className="text-[#1683FF] text-sm">
                        {formatIDR(selectedProduct.price * bookDurationDays + Math.max(selectedProduct.price, 250000))}
                      </span>
                    </div>
                  </div>

                  <div className="bg-emerald-50/80 p-3 rounded-xl flex items-center gap-2 text-xs text-emerald-800 font-medium border border-emerald-200">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Deposit jaminan 100% dikembalikan otomatis ke saldo saat alat dikembalikan.</span>
                  </div>

                  <div className="pt-2 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedProduct(null)}
                      className="w-1/3 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="w-2/3 py-3 rounded-xl bg-gradient-to-r from-[#1683FF] to-[#0F6FE5] hover:from-[#0F6FE5] hover:to-[#0b5ac4] text-white font-bold text-xs shadow-md transition cursor-pointer"
                    >
                      Lanjut Pembayaran &amp; Chat Toko
                    </button>
                  </div>
                </>
              )}

            </form>

          </div>
        </div>
      )}

      {/* Lightbox Modal for Gallery Showcase */}
      {selectedGalleryPhoto && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedGalleryPhoto(null)}
        >
          <div 
            className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-slate-800 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative aspect-16/10 w-full bg-slate-950 flex items-center justify-center overflow-hidden">
              <img
                src={selectedGalleryPhoto.url}
                alt={selectedGalleryPhoto.title}
                className="w-full h-full object-contain"
                onError={(e) => { e.currentTarget.src = "/logotab.png"; }}
              />
              <button
                onClick={() => setSelectedGalleryPhoto(null)}
                className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center backdrop-blur-md transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 sm:p-6 space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-blue-50 text-[#1683FF] border border-blue-200">
                  {selectedGalleryPhoto.category}
                </span>
                <span className="text-xs text-slate-400 font-medium">Vendor: {store.name}</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                {selectedGalleryPhoto.title}
              </h3>
              {selectedGalleryPhoto.description && (
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pt-1">
                  {selectedGalleryPhoto.description}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
