"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useApp } from "@/lib/context/AppContext";
import { formatIDR } from "@/lib/utils";
import { getProviderById, getAllProviders } from "@/lib/mock/providersData";
import { getMitraStoreById } from "@/lib/mock/mitraData";
import ProviderProfileSkeleton from "@/components/skeletons/ProviderProfileSkeleton";
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
  X,
  Loader2,
  Check,
  AlertCircle,
  ExternalLink
} from "lucide-react";

/**
 * Normalizes any raw provider/user profile data (from mock or PostgreSQL Prisma API)
 * into the rich structure required by the dedicated Jasa Provider design.
 */
function normalizeProvider(raw, fallbackId) {
  if (!raw) return null;

  const name = (raw.fullName || raw.name || "Pengguna Bantuin").trim();
  const cleanAvatar = (raw.avatarUrl && !raw.avatarUrl.includes("dicebear.com") && !raw.avatarUrl.includes("images.unsplash.com"))
    ? raw.avatarUrl
    : ((raw.avatar && !raw.avatar.includes("dicebear.com") && !raw.avatar.includes("images.unsplash.com")) ? raw.avatar : null);
  const avatar = cleanAvatar;
  // Jangan gunakan foto dummy unsplash. Hanya gunakan jika ada coverBanner eksplisit dari database/user
  const coverBanner = raw.coverBanner || raw.bannerUrl || null;

  const isRentalPartner = raw.accountRole === "partner" || raw.isPartner === true || (Array.isArray(raw.rentals) && raw.rentals.length > 0 && (!raw.services || raw.services.length === 0));
  const isHelper = !isRentalPartner && (raw.accountRole === "helper" || raw.type === "helper");
  const hasCatalog = (Array.isArray(raw.services) && raw.services.length > 0) || (Array.isArray(raw.catalog) && raw.catalog.length > 0) || (Array.isArray(raw.rentals) && raw.rentals.length > 0);
  const isProvider = !isRentalPartner && (raw.accountRole === "provider" || raw.isProvider || hasCatalog);
  const isRegularUser = !isRentalPartner && !isHelper && !isProvider;

  const type = isRentalPartner ? "partner" : (isRegularUser ? "user" : (isHelper ? "helper" : "specialist"));
  const brandTitle =
    raw.partnerBusinessName ||
    raw.brandTitle ||
    (isRentalPartner
      ? "Mitra Rental & Sewa Resmi"
      : (isRegularUser
        ? "Pengguna Terverifikasi Bantuin"
        : (isHelper
          ? "Helper Kampus Terpercaya"
          : "Penyedia Jasa Profesional")));
  const isVerified =
    raw.verificationStatus === "verified" ||
    raw.isVerified === true ||
    raw.verified === true;
  const rawRatingNum = Number(raw.ratingAvg ?? raw.rating ?? 0);
  const rating = rawRatingNum > 0 ? rawRatingNum.toFixed(1) : "0.0";
  const reviewsCount = Number(
    raw.ratingCount ??
      raw.reviewsCount ??
      raw.reviewsReceived?.length ??
      raw.reviews?.length ??
      0
  );
  const completedJobs = Number(
    raw.completedHelpsCount ??
      raw.completedJobs ??
      raw.completedOrders ??
      (Array.isArray(raw.services) ? raw.services.reduce((sum, s) => sum + (s.completedOrders || 0), 0) : 0) ??
      0
  );
  const responseTime =
    raw.responseTime ||
    (raw.responseTimeMinutes ? `${raw.responseTimeMinutes} Menit` : "10 Menit");
  const location =
    raw.campusName ||
    raw.location ||
    raw.city ||
    "Kab. Banyumas (Purwokerto)";
  const address =
    raw.partnerAddress || raw.address || raw.partner_address || "";
  const bio =
    raw.bio ||
    (isRentalPartner
      ? "Penyedia rental dan sewa alat terverifikasi Bantuin.id. Siap melayani kebutuhan unit rental Anda dengan kondisi prima dan jaminan keamanan transaksi."
      : (isRegularUser
        ? "Pengguna aktif terverifikasi di komunitas Bantuin.id."
        : "Penyedia jasa terpercaya di platform Bantuin. Siap melayani dan menyelesaikan tugas Anda dengan kualitas terbaik dan standar profesional."));

  // Skills
  let skills = [];
  if (Array.isArray(raw.skills) && raw.skills.length > 0) {
    skills = raw.skills;
  } else if (Array.isArray(raw.services) && raw.services.length > 0) {
    skills = raw.services.map((s) => s.title);
  } else if (isRentalPartner && Array.isArray(raw.rentals) && raw.rentals.length > 0) {
    skills = raw.rentals.map((r) => r.title);
  } else {
    skills = ["Layanan Cepat", "Kualitas Terbaik", "Komunikasi Ramah", "Garansi Kepuasan"];
  }

  // Catalog Layanan Jasa atau Barang Sewa
  let catalog = [];
  if (Array.isArray(raw.catalog) && raw.catalog.length > 0) {
    catalog = raw.catalog;
  } else if (isRentalPartner && Array.isArray(raw.rentals) && raw.rentals.length > 0) {
    catalog = raw.rentals.map((r) => {
      const realImg =
        (Array.isArray(r.photoUrls) && r.photoUrls.length > 0 && r.photoUrls[0]) ||
        r.photoUrl ||
        "/logotab.png";

      return {
        id: r.id,
        title: r.title,
        desc: r.description || "Unit sewa berkualitas dari mitra rental terverifikasi.",
        price: Number(r.dailyPrice || r.price || 0),
        startingPrice: Number(r.dailyPrice || r.price || 0),
        packages: [],
        pricingMode: "single",
        unit: "/ hari",
        category: r.category || "Rental & Sewa",
        image: realImg,
        isRental: true,
        linkUrl: `/sewa/${r.id}`,
      };
    });
  } else if (Array.isArray(raw.services) && raw.services.length > 0) {
    catalog = raw.services.map((s) => {
      const realImg =
        (Array.isArray(s.portfolioUrls) && s.portfolioUrls.length > 0 && s.portfolioUrls[0]) ||
        s.imageUrl ||
        s.coverImage ||
        s.image ||
        "/logotab.png";

      return {
        id: s.id,
        title: s.title,
        desc: s.description || "Layanan profesional dari penyedia terverifikasi.",
        price: Number(s.startingPrice || s.price || 0),
        startingPrice: Number(s.startingPrice || s.price || 0),
        packages: Array.isArray(s.packages) ? s.packages : [],
        pricingMode: (Array.isArray(s.packages) && s.packages.length > 1) ? "tiered" : "single",
        unit: s.priceUnit ? `/${s.priceUnit}` : "/pekerjaan",
        category: s.category || "Jasa",
        image: realImg,
        isRental: false,
        linkUrl: `/jasa/${s.id}`,
      };
    });
  }

  // Portfolio Photos: Murni dari CRUD Portofolio & Foto penyedia di Dashboard Jasa
  let portfolioPhotos = [];
  if (Array.isArray(raw.portfolioPhotos) && raw.portfolioPhotos.length > 0) {
    raw.portfolioPhotos.forEach((item) => {
      if (typeof item === "string") {
        portfolioPhotos.push({
          url: item,
          title: "Hasil Kerja",
          category: "Portofolio",
          description: "Dokumentasi hasil pengerjaan",
        });
      } else if (item && item.url) {
        portfolioPhotos.push({
          id: item.id,
          url: item.url,
          title: item.title || "Hasil Karya",
          category: item.category || "Portofolio",
          description: item.description || "Dokumentasi hasil karya portofolio.",
        });
      }
    });
  }

  // Reviews
  let reviews = [];
  const sourceReviews = Array.isArray(raw.reviews) && raw.reviews.length > 0
    ? raw.reviews
    : (Array.isArray(raw.reviewsReceived) && raw.reviewsReceived.length > 0 ? raw.reviewsReceived : []);

  reviews = sourceReviews.map((r) => {
    const name = r.reviewerName || r.userName || r.reviewer?.fullName || r.reviewer?.name || r.user?.name || "Pelanggan Terverifikasi";
    const avatar = r.reviewerAvatar || r.userAvatar || r.reviewer?.avatarUrl || r.user?.avatar || null;
    const date = r.date || (r.createdAt ? new Date(r.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "Baru saja");
    const pkg = r.packageName || r.serviceTitle || (r.transaction?.orderTitle ? r.transaction.orderTitle.replace(/^Pemesanan Jasa:\s*/i, "").trim() : "Layanan Jasa");

    return {
      id: r.id,
      userName: name,
      userAvatar: (avatar && !avatar.includes("dicebear.com") && !avatar.includes("images.unsplash.com")) ? avatar : null,
      rating: Number(r.rating || 5),
      date,
      packageName: pkg,
      comment: r.comment || "Layanan sangat memuaskan, ramah, dan profesional!",
    };
  });

  const rawRequests = Array.isArray(raw.requests)
    ? raw.requests
    : (Array.isArray(raw.requestsCreated) ? raw.requestsCreated : []);

  // Filter keluar permintaan bantuan yang sudah diambil atau tidak open lagi
  const requests = rawRequests.filter((rq) => {
    if (!rq) return false;
    if (rq.selectedHelperId) return false;
    const takenStatuses = ["in_progress", "completed", "cancelled", "closed", "helper_selected", "awaiting_confirmation"];
    if (takenStatuses.includes(rq.status)) return false;
    return true;
  });

  return {
    id: raw.id || fallbackId,
    name,
    brandTitle,
    type,
    isRegularUser,
    isHelper,
    isProvider,
    avatar,
    coverBanner,
    isVerified,
    rating,
    reviewsCount,
    completedJobs,
    responseTime,
    location,
    address,
    bio: raw.bio || (isRegularUser ? "Pengguna aktif terverifikasi di komunitas Bantuin.id." : "Penyedia jasa terpercaya di platform Bantuin. Siap melayani dan menyelesaikan tugas Anda dengan kualitas terbaik dan standar profesional."),
    skills,
    catalog,
    packages: Array.isArray(raw.packages) ? raw.packages : [],
    portfolioPhotos,
    reviews,
    requests,
  };
}

export default function ProviderProfileView({ profileId }) {
  const router = useRouter();
  const { currentUser, activeKabupaten } = useApp() || {};

  const [provider, setProvider] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("katalog");
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [isCopied, setIsCopied] = useState(false);

  // Keyboard shortcut ESC untuk menutup modal foto
  useEffect(() => {
    if (!selectedPhoto) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setSelectedPhoto(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedPhoto]);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setIsLoading(true);

      // 1. Selalu utamakan fetch LIVE data dari PostgreSQL Database API
      try {
        const res = await fetch(`/api/profile/${encodeURIComponent(profileId)}`);
        const json = await res.json();
        if (isMounted && res.ok && json.success && json.profile) {
          // Jika profil ini adalah mitra rental (accountRole: partner, isPartner, atau toko rental murni),
          // arahkan langsung ke halaman toko resmi /mitra/[id]
          const isRentalStore =
            json.profile.accountRole === "partner" ||
            json.profile.isPartner === true ||
            (Array.isArray(json.profile.rentals) && json.profile.rentals.length > 0 && (!json.profile.services || json.profile.services.length === 0));

          if (isRentalStore) {
            router.replace(`/mitra/${encodeURIComponent(json.profile.id || profileId)}`);
            return;
          }

          const norm = normalizeProvider(json.profile, profileId);
          setProvider(norm);
          if (norm?.isRegularUser) {
            setActiveTab((norm.requests && norm.requests.length > 0) ? "permintaan" : "tentang");
          } else {
            setActiveTab((norm.catalog && norm.catalog.length > 0) ? "katalog" : ((norm.requests && norm.requests.length > 0) ? "permintaan" : "tentang"));
          }
          setIsLoading(false);
          return;
        }

        // Coba alternatif /api/services/provider/[id]
        const srvRes = await fetch(`/api/services/provider/${encodeURIComponent(profileId)}`);
        const srvJson = await srvRes.json();
        if (isMounted && srvRes.ok && srvJson.success && srvJson.data) {
          const norm = normalizeProvider(
            {
              ...srvJson.data.provider,
              services: srvJson.data.services,
              reviews: srvJson.data.reviews,
              completedJobs: srvJson.data.stats?.completedOrders
            },
            profileId
          );
          setProvider(norm);
          if (norm?.isRegularUser) {
            setActiveTab((norm.requests && norm.requests.length > 0) ? "permintaan" : "tentang");
          } else {
            setActiveTab((norm.catalog && norm.catalog.length > 0) ? "katalog" : ((norm.requests && norm.requests.length > 0) ? "permintaan" : "tentang"));
          }
          setIsLoading(false);
          return;
        }
      } catch (err) {
        console.warn("Failed fetching live provider profile from DB:", err);
      }

      // 2. Fallback hanya jika profile tidak ditemukan di database
      if (isMounted) {
        const localMitra = getMitraStoreById(profileId);
        if (localMitra) {
          router.replace(`/mitra/${encodeURIComponent(profileId)}`);
          return;
        }

        const local = getProviderById(profileId);
        if (local) {
          setProvider(normalizeProvider(local, profileId));
        } else {
          setProvider(null);
        }
        setIsLoading(false);
      }
    }

    if (profileId) {
      loadData();
    }
    return () => {
      isMounted = false;
    };
  }, [profileId]);

  // Salin Tautan
  const handleShare = () => {
    if (typeof window !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    }
  };

  // Rekomendasi penyedia lainnya
  const otherProviders = (getAllProviders() || [])
    .filter((p) => p.id !== profileId)
    .slice(0, 3);

  // Loading state
  if (isLoading) {
    return <ProviderProfileSkeleton />;
  }

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
            Profil penyedia jasa atau helper ini belum tersedia atau tautan tidak valid.
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

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <Navbar />

      <main className="flex-1 pb-16">
        {/* Foto Sampul Banner Jasa (Full ke atas sampai batas bawah navbar, clean tanpa gradient/shadow) */}
        <div className="relative w-full h-48 sm:h-64 md:h-72 lg:h-80 bg-slate-900 overflow-hidden">
          {provider.coverBanner ? (
            <img
              src={provider.coverBanner}
              alt={provider.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-linear-to-r from-slate-950 via-slate-900 to-blue-950 flex items-center justify-center">
              <div className="absolute inset-0 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:24px_24px] opacity-15" />
            </div>
          )}

          {/* Tombol Back & Status Siap Kerja Glass (Mirip Banner Sewa) */}
          <div className="absolute top-4 sm:top-6 left-4 sm:left-6 lg:left-8 z-10 flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => {
                if (typeof window !== "undefined" && window.history.length > 1) {
                  router.back();
                } else {
                  router.push("/jasa");
                }
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-black/40 hover:bg-black/60 text-white backdrop-blur-md text-xs sm:text-sm font-semibold border border-white/20 transition shadow-sm cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali</span>
            </button>

            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-black/40 text-white backdrop-blur-md text-xs sm:text-sm font-semibold border border-white/20 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Siap Terima Pekerjaan</span>
            </span>
          </div>

          {/* Tombol Share Glass (Mirip Banner Sewa) */}
          <div className="absolute top-4 sm:top-6 right-4 sm:right-6 lg:right-8 z-10">
            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-black/40 hover:bg-black/60 text-white backdrop-blur-md text-xs sm:text-sm font-semibold border border-white/20 transition shadow-sm cursor-pointer"
            >
              {isCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
              <span>{isCopied ? "Link Tersalin!" : "Bagikan"}</span>
            </button>
          </div>
        </div>

        {/* Kartu Profil Penyedia */}
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 -mt-20 sm:-mt-24 relative z-20">
          <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-7 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.12)] ring-1 ring-slate-900/5">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-5">
              {/* Data Diri */}
              <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-5">
                <div className="relative shrink-0">
                  {provider.avatar && !provider.avatar.includes("dicebear.com") && !provider.avatar.includes("images.unsplash.com") ? (
                    <img
                      src={provider.avatar}
                      alt={provider.name}
                      className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-4 border-white shadow-xl ring-1 ring-slate-900/10 bg-white"
                    />
                  ) : (
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-linear-to-br from-[#1683FF] to-[#0E5FCC] text-white flex items-center justify-center font-black text-2xl sm:text-3xl border-4 border-white shadow-xl ring-1 ring-slate-900/10 shrink-0">
                      {((provider.name || "U").trim()[0] || "U").toUpperCase()}
                    </div>
                  )}
                  {provider.isVerified && (
                    <div
                      className="absolute -bottom-1 -right-1 bg-[#1683FF] text-white p-1 rounded-full border-2 border-white shadow-xs"
                      title="Terverifikasi KTP & Identitas Resmi"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded-md bg-blue-50 text-[#1683FF] text-[11px] font-extrabold uppercase border border-blue-100">
                      {provider.type === "partner"
                        ? "Mitra Rental Terverifikasi"
                        : (provider.type === "user"
                          ? "Pengguna Terverifikasi"
                          : (provider.type === "helper" ? "Helper Terverifikasi" : "Penyedia Jasa Terverifikasi"))}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-100 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      <span>KTP Terverifikasi</span>
                    </span>
                    <span className="inline-flex sm:hidden items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-100">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span>Siap Terima Pekerjaan</span>
                    </span>
                  </div>

                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    {provider.name}
                  </h1>

                  <p className="text-xs sm:text-sm font-semibold text-slate-600">
                    {provider.type === "user" ? "Pengguna Terverifikasi Komunitas Bantuin" : provider.brandTitle}
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
                      <span>
                        {provider.type === "partner"
                          ? `${provider.catalog?.length || 0} Unit Sewa Siap Dipinjam`
                          : (provider.type === "user"
                            ? `${provider.requests?.length || 1} Permintaan Bantuan`
                            : `${provider.completedJobs} Pekerjaan Selesai`)}
                      </span>
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
                {provider.type === "user" ? (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab("permintaan");
                      const el = document.getElementById("tab-section");
                      if (el) el.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white text-xs sm:text-sm font-bold shadow-xs transition text-center cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Layers className="w-4 h-4" />
                    <span>Daftar Bantuan ({provider.requests?.length || 0})</span>
                  </button>
                ) : (
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
                    <span>{provider.type === "partner" ? "Katalog Sewa" : "Katalog Jasa"}</span>
                  </button>
                )}

                {currentUser && provider && (currentUser.id === provider.id || (currentUser.email && provider.email && String(currentUser.email).toLowerCase() === String(provider.email).toLowerCase())) ? (
                  <button
                    type="button"
                    onClick={() => router.push(provider.type === "partner" ? "/mitra/dashboard" : (provider.type === "user" ? "/dashboard" : "/jasa/dashboard"))}
                    className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#1683FF] text-xs sm:text-sm font-bold transition text-center cursor-pointer flex items-center justify-center gap-1.5 border border-blue-200"
                  >
                    <span>{provider.type === "partner" ? "Buka Dashboard Mitra" : (provider.type === "user" ? "Buka Dashboard Saya" : "Buka Dashboard Jasa")}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => router.push(`/chat?partnerId=${encodeURIComponent(provider.id)}`)}
                    className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs sm:text-sm font-bold transition text-center cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <MessageCircle className="w-4 h-4 text-slate-600" />
                    <span>{provider.type === "partner" ? "Chat Toko Rental" : (provider.type === "user" ? "Hubungi Pengguna" : "Chat Penyedia")}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Jaminan Singkat */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-500">
              <ShieldCheck className="w-4 h-4 text-[#1683FF] shrink-0" />
              <span>
                <strong>Jaminan Pembayaran Bantuin:</strong> {provider.type === "partner"
                  ? "Pembayaran Anda aman dan baru diteruskan ke mitra rental setelah unit diterima dan masa sewa selesai."
                  : "Pembayaran Anda aman dan baru diteruskan ke penyedia setelah pekerjaan Anda disetujui selesai."}
              </span>
            </div>
          </div>
        </div>

        {/* Tab Navigasi */}
        <div id="tab-section" className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 mt-6">
          <div className="flex items-center gap-2 border-b border-slate-200/90 pb-1 overflow-x-auto scrollbar-none">
            {/* TAB: PERMINTAAN BANTUAN (Hanya tampil jika ada permintaan bantuan terbuka yang belum diambil) */}
            {provider.requests && provider.requests.length > 0 && (
              <button
                type="button"
                onClick={() => setActiveTab("permintaan")}
                className={`px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition cursor-pointer shrink-0 flex items-center gap-2 ${
                  activeTab === "permintaan"
                    ? "bg-[#1683FF] text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>Permintaan Bantuan ({provider.requests.length})</span>
              </button>
            )}

            {/* TAB 1: KATALOG JASA ATAU SEWA */}
            {(provider.type !== "user" || (provider.catalog && provider.catalog.length > 0)) && (
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
                <span>{provider.type === "partner" ? `Katalog Sewa (${provider.catalog?.length || 0})` : `Katalog Jasa (${provider.catalog?.length || 0})`}</span>
              </button>
            )}

            {/* TAB 2: FOTO & HASIL KERJA */}
            {(provider.type !== "user" || (provider.portfolioPhotos && provider.portfolioPhotos.length > 0)) && (
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
                <span>{provider.type === "partner" ? `Galeri Unit (${provider.portfolioPhotos?.length || 0})` : `Foto Hasil Kerja (${provider.portfolioPhotos?.length || 0})`}</span>
              </button>
            )}

            {/* TAB 3: ULASAN */}
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
              <span>Ulasan ({provider.reviews?.length || 0})</span>
            </button>

            {/* TAB 4: PROFIL */}
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

        {/* Isi Tab Content */}
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 mt-6">
          {/* TAB: PERMINTAAN BANTUAN AKTIF */}
          {activeTab === "permintaan" && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                    Permintaan Bantuan
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                    Daftar kebutuhan tugas aktif yang diajukan oleh {provider.name}.
                  </p>
                </div>
                <span className="text-xs font-bold text-slate-500">
                  {provider.requests?.length || 0} Tugas Terdaftar
                </span>
              </div>

              {(!provider.requests || provider.requests.length === 0) ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400 space-y-2">
                  <Package className="w-8 h-8 mx-auto text-slate-300" />
                  <p className="text-xs font-medium">Belum ada tugas bantuan aktif yang diajukan.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  {provider.requests.map((rq) => (
                    <Link
                      key={rq.id}
                      href={`/bantuan/${rq.id}`}
                      className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 hover:border-[#1683FF] hover:shadow-md transition block group"
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="px-2.5 py-0.5 rounded-md bg-blue-50 text-[#1683FF] text-[10px] font-extrabold uppercase">
                          {rq.category || "Bantuan"}
                        </span>
                        <span className="text-sm font-black text-[#1683FF]">
                          {formatIDR(rq.rewardAmount || rq.reward || 0)}
                        </span>
                      </div>
                      <h3 className="font-extrabold text-sm sm:text-base text-slate-900 group-hover:text-[#1683FF] transition line-clamp-2">
                        {rq.title}
                      </h3>
                      {rq.description && (
                        <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                          {rq.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between text-xs text-slate-500 mt-3 pt-2.5 border-t border-slate-100">
                        <div className="flex items-center gap-1 truncate max-w-[200px]">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{rq.locationName || provider.location}</span>
                        </div>
                        <span className="text-[11px] font-bold text-[#1683FF] group-hover:translate-x-0.5 transition flex items-center gap-0.5">
                          <span>Lihat Detail</span>
                          <ChevronRight className="w-3 h-3" />
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 1: KATALOG JASA */}
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

              {provider.catalog?.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400 space-y-2">
                  <Package className="w-8 h-8 mx-auto text-slate-300" />
                  <p className="text-xs font-medium">Belum ada katalog layanan yang diterbitkan.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4 md:gap-5">
                  {provider.catalog?.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white rounded-xl sm:rounded-3xl overflow-hidden border border-slate-200/90 shadow-2xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between group"
                    >
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

                        <div className="p-2.5 sm:p-4 space-y-1 sm:space-y-1.5">
                          <h3 className="text-xs sm:text-sm font-black text-slate-900 group-hover:text-[#1683FF] transition line-clamp-2 leading-snug min-h-[32px] sm:min-h-0 break-words">
                            {item.title}
                          </h3>
                          <p
                            className="text-xs text-slate-500 line-clamp-2 leading-relaxed break-words"
                            style={{
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                            }}
                          >
                            {item.desc}
                          </p>
                        </div>
                      </div>

                      <div className="p-2.5 sm:p-4 pt-2 sm:pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-2 min-w-0 overflow-hidden">
                        <div className="min-w-0 overflow-hidden">
                          <span className="text-[9px] sm:text-[10px] text-slate-400 block font-medium truncate">
                            {(Array.isArray(item.packages) && item.packages.length > 1) || item.pricingMode === "tiered" ? "Mulai dari:" : "Tarif:"}
                          </span>
                          <div className="text-xs sm:text-base font-black text-[#1683FF] truncate">
                            {(Array.isArray(item.packages) && item.packages.length > 1) || item.pricingMode === "tiered" ? "Mulai " : ""}{formatIDR(item.price)}
                            <span className="text-[9px] sm:text-[10px] font-normal text-slate-500 ml-0.5">{item.unit}</span>
                          </div>
                        </div>

                        <Link
                          href={item.linkUrl || (item.isRental ? `/sewa/${item.id}` : `/jasa/${item.id}`)}
                          className="w-full sm:w-auto justify-center px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-lg sm:rounded-xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white font-bold text-[11px] sm:text-xs transition shadow-2xs cursor-pointer shrink-0 inline-flex items-center gap-1 truncate"
                        >
                          <span>{item.isRental ? "Sewa" : "Pesan"}</span>
                          <ChevronRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}



          {/* TAB 2: FOTO & HASIL KERJA */}
          {activeTab === "portofolio" && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                    Foto &amp; Hasil Kerja
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                    Klik foto untuk memperbesar tampilan hasil pengerjaan.
                  </p>
                </div>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-700">
                  {provider.portfolioPhotos?.length || 0} Foto
                </span>
              </div>

              {provider.portfolioPhotos?.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400 space-y-2">
                  <ImageIcon className="w-8 h-8 mx-auto text-slate-300" />
                  <p className="text-xs font-medium">Belum ada foto portofolio hasil kerja.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-5">
                  {provider.portfolioPhotos?.map((photo, idx) => (
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
              )}
            </div>
          )}

          {/* TAB 3: ULASAN PELANGGAN */}
          {activeTab === "ulasan" && (
            <div className="space-y-5 animate-in fade-in duration-200">
              {/* Ringkasan Skor Ulasan */}
              {(() => {
                const numRating = Number(provider.rating || 0);
                const satisfactionPercent = numRating > 0 ? Math.min(100, Math.max(0, Math.round((numRating / 5) * 100))) : 0;
                const isGood = satisfactionPercent >= 80;
                const isMedium = satisfactionPercent >= 60;
                const barColor = isGood ? "bg-emerald-500" : (isMedium ? "bg-amber-500" : "bg-rose-500");
                const textColor = isGood ? "text-emerald-600" : (isMedium ? "text-amber-600" : "text-rose-600");

                return (
                  <div className="rounded-3xl bg-white border border-slate-200/90 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row items-center gap-5 sm:gap-8">
                    <div className="text-center sm:border-r sm:border-slate-100 sm:pr-8 shrink-0">
                      <div className="text-4xl sm:text-5xl font-black text-slate-900">
                        {provider.rating}
                      </div>
                      <div className="flex items-center justify-center gap-0.5 my-1">
                        {[...Array(5)].map((_, i) => {
                          const isFilled = i < Math.round(numRating);
                          return (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                isFilled
                                  ? "fill-amber-400 text-amber-400"
                                  : "fill-slate-200 text-slate-200"
                              }`}
                            />
                          );
                        })}
                      </div>
                      <div className="text-xs text-slate-500 font-medium">
                        Dari <strong>{provider.reviewsCount}</strong> ulasan
                      </div>
                    </div>

                    <div className="flex-1 w-full space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                        <span>Tingkat Kepuasan</span>
                        <span className={textColor}>{satisfactionPercent}% Puas</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 rounded-full ${barColor}`}
                          style={{ width: `${satisfactionPercent}%` }}
                        />
                      </div>
                      <p className="text-xs text-slate-400 pt-0.5">
                        Ulasan terverifikasi dari pesanan yang telah diselesaikan.
                      </p>
                    </div>
                  </div>
                );
              })()}

              {/* Daftar Ulasan */}
              {provider.reviews?.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400 space-y-2">
                  <Star className="w-8 h-8 mx-auto text-slate-300" />
                  <p className="text-xs font-medium">Belum ada ulasan yang diberikan untuk penyedia ini.</p>
                </div>
              ) : (
                <div className="space-y-3.5">
                  {provider.reviews?.map((rev) => (
                    <div
                      key={rev.id}
                      className="rounded-2xl bg-white border border-slate-200/80 p-4 sm:p-5 shadow-2xs space-y-2.5"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          {rev.userAvatar && !rev.userAvatar.includes("dicebear.com") && !rev.userAvatar.includes("images.unsplash.com") ? (
                            <img
                              src={rev.userAvatar}
                              alt={rev.userName}
                              className="w-9 h-9 rounded-full object-cover border border-slate-100"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-linear-to-br from-[#1683FF] to-[#0E5FCC] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                              {((rev.userName || "P").trim()[0] || "P").toUpperCase()}
                            </div>
                          )}
                          <div>
                            <h4 className="font-bold text-xs sm:text-sm text-slate-900">
                              {rev.userName}
                            </h4>
                            <span className="text-[11px] text-slate-400">
                              {rev.date}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-0.5">
                          {[...Array(5)].map((_, i) => {
                            const isFilled = i < Number(rev.rating || 5);
                            return (
                              <Star
                                key={i}
                                className={`w-3.5 h-3.5 ${
                                  isFilled
                                    ? "fill-amber-400 text-amber-400"
                                    : "fill-slate-200 text-slate-200"
                                }`}
                              />
                            );
                          })}
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
              )}
            </div>
          )}

          {/* TAB 4: PROFIL & KONTAK */}
          {activeTab === "tentang" && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Biodata & Keahlian */}
                <div className="md:col-span-2 space-y-5">
                  <div className="rounded-3xl bg-white border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-3">
                    <h3 className="text-base font-black text-slate-900">
                      {provider.type === "partner" ? "Tentang Toko Rental" : (provider.type === "user" ? "Tentang Pengguna" : "Tentang Penyedia")}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                      {provider.bio}
                    </p>
                  </div>

                  <div className="rounded-3xl bg-white border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-3">
                    <h3 className="text-base font-black text-slate-900">
                      {provider.type === "partner" ? "Keunggulan & Layanan Rental" : (provider.type === "user" ? "Minat & Keahlian" : "Keahlian & Peralatan")}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {provider.skills?.map((skill, idx) => (
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
                      </div>

                      {provider.address && (
                        <div className="pt-2 border-t border-slate-100">
                          <span className="text-slate-400 font-semibold block">Alamat Lengkap / Lokasi Mitra:</span>
                          <span className="text-slate-800 font-bold">{provider.address}</span>
                        </div>
                      )}

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
                      onClick={() => router.push(`/chat?partnerId=${encodeURIComponent(provider.id)}`)}
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
        {otherProviders.length > 0 && (
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
                  {other.avatar && !other.avatar.includes("dicebear.com") && !other.avatar.includes("images.unsplash.com") ? (
                    <img
                      src={other.avatar}
                      alt={other.name}
                      className="w-12 h-12 rounded-xl object-cover shrink-0 group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-linear-to-br from-[#1683FF] to-[#0E5FCC] text-white flex items-center justify-center font-bold text-base shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
                      {((other.name || "U").trim()[0] || "U").toUpperCase()}
                    </div>
                  )}
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
                      Tarif Mulai {formatIDR(other.catalog?.[0]?.price || 50000)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* MODAL PRATINJAU FOTO BESAR (CARD PUTIH BERSIH & RAPI) */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200"
          onClick={() => setSelectedPhoto(null)}
        >
          <div
            className="relative max-w-2xl sm:max-w-3xl w-full bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-200/90 my-auto animate-in zoom-in-95 duration-200 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Modal Bersih & Rapi */}
            <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-100 bg-white">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="px-2.5 py-1 rounded-lg text-[10px] sm:text-xs font-extrabold uppercase bg-blue-50 text-[#1683FF] border border-blue-100 shrink-0">
                  {selectedPhoto.category || "Hasil Karya"}
                </span>
                <span className="text-xs font-bold text-slate-400 truncate">
                  Dokumentasi Portofolio
                </span>
              </div>

              <button
                type="button"
                onClick={() => setSelectedPhoto(null)}
                className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition flex items-center justify-center cursor-pointer shrink-0"
                title="Tutup (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Area Foto dengan Background Lembut & Bingkai Presisi */}
            <div className="bg-slate-50/70 p-3 sm:p-6 flex items-center justify-center border-b border-slate-100 min-h-[280px] max-h-[60vh] overflow-hidden relative">
              <img
                src={selectedPhoto.url}
                alt={selectedPhoto.title}
                className="max-h-[55vh] w-auto max-w-full rounded-2xl object-contain shadow-xs border border-slate-200/80 bg-white transition duration-200"
              />
            </div>

            {/* Info Judul & Deskripsi Hasil Kerja (Teks Jelas di Atas Putih) */}
            <div className="p-5 sm:p-6 bg-white space-y-3">
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 leading-snug">
                  {selectedPhoto.title}
                </h3>
                {selectedPhoto.description && (
                  <p className="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed whitespace-pre-line">
                    {selectedPhoto.description}
                  </p>
                )}
              </div>

              {/* Action Bar Bawah */}
              <div className="pt-3 flex items-center justify-between gap-3 border-t border-slate-100">
                <a
                  href={selectedPhoto.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1683FF] hover:text-[#0F6FE5] transition"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Lihat Resolusi Penuh</span>
                </a>

                <button
                  type="button"
                  onClick={() => setSelectedPhoto(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
