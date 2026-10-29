"use client";

import React, { Suspense, useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useApp } from "@/lib/context/AppContext";
import { formatIDR } from "@/lib/utils";
import { promotionService } from "@/lib/services/promotionService";
import RecommendedCarousel from "@/components/promotion/RecommendedCarousel";
import { 
  getStartingPrice 
} from "@/lib/mock/providersData";
import CategoryIcon from "@/components/common/CategoryIcon";
import { JASA_CATEGORIES } from "@/lib/categories";
import { JasaCardSkeleton } from "@/components/skeletons/ItemGridSkeleton";

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
  Web: [
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

let cachedLiveServices = null;
let cachedPromotedServices = null;

function JasaPageContent() {
  const searchParams = useSearchParams();
  const { 
    services = [],
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

  useEffect(() => {
    const category = searchParams.get("category");
    if (category && CATEGORY_ICONS.some((item) => item.id === category)) {
      setSelectedCategory(category);
      setSelectedSubCategory("Semua");
      setCurrentPage(1);
    } else {
      setSelectedCategory("Semua");
      setSelectedSubCategory("Semua");
      setCurrentPage(1);
    }
  }, [searchParams]);

  const controlsRef = useRef(null);

  const ITEMS_PER_PAGE = 16;

  const [liveServices, setLiveServices] = useState([]);
  const [isLoadingServices, setIsLoadingServices] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setIsLoadingServices(true);

    // Bersihkan seluruh legacy bantuin_provider_ dan stale live_services di storage
    if (typeof window !== "undefined") {
      try {
        sessionStorage.removeItem("bantuin_cached_live_services");
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const key = localStorage.key(i);
          if (key && (key.startsWith("bantuin_provider_") || key === "bantuin_providers")) {
            localStorage.removeItem(key);
          }
        }
      } catch (_) {}
    }

    fetch("/api/services?limit=50")
      .then((res) => res.json())
      .then((json) => {
        if (isMounted && json.success && Array.isArray(json.data?.services)) {
          cachedLiveServices = json.data.services;
          setLiveServices(json.data.services);
        }
      })
      .catch((e) => console.warn("Live services fetch error in /jasa:", e))
      .finally(() => {
        if (isMounted) setIsLoadingServices(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Data (Hanya menggunakan layanan jasa resmi dari database PostgreSQL)
  const allCatalog = useMemo(() => {
    const rawList = liveServices.length > 0 ? liveServices : (isLoadingServices ? [] : services);
    if (!rawList || rawList.length === 0) return [];

    // Deduplikasi ketat berdasarkan ID unik layanan agar tidak ada card ganda
    const seenIds = new Set();
    const uniqueRaw = [];
    for (const item of rawList) {
      if (item && item.id && !seenIds.has(String(item.id))) {
        seenIds.add(String(item.id));
        uniqueRaw.push(item);
      }
    }

    return uniqueRaw.map((s) => {
      const realImg =
        (Array.isArray(s.portfolioUrls) && s.portfolioUrls.length > 0 && s.portfolioUrls[0]) ||
        s.coverImageUrl ||
        s.imageUrl ||
        s.image ||
        "/logotab.png";

      // Resolusi rating yang akurat sesuai profil penyedia asli di database (bukan default paksa 5.0)
      const rawRating = s.provider?.ratingAvg !== undefined && s.provider?.ratingAvg !== null
        ? Number(s.provider.ratingAvg)
        : (s.ratingAvg !== undefined && s.ratingAvg !== null ? Number(s.ratingAvg) : 0);

      const isVerified =
        s.provider?.verificationStatus === "verified" ||
        s.provider?.isVerified === true;

      const realRatingCount = Math.max(Number(s.ratingCount || 0), Number(s.provider?.ratingCount || 0));
      const firstPkg = (Array.isArray(s.packages) && s.packages[0]) || {};

      return {
        id: s.id,
        title: s.title,
        desc: s.description || "Layanan profesional dari penyedia terverifikasi.",
        price: Number(s.startingPrice || s.price || 0),
        unit: s.unit || firstPkg.unit || "/ proyek",
        deliveryDuration: s.deliveryDuration || firstPkg.duration || "1-2 Hari Kerja",
        completedOrders: Number(s.completedOrders || 0),
        ratingAvg: rawRating,
        ratingCount: realRatingCount,
        image: realImg,
        category: s.category || "Jasa",
        categoryGroup:
          s.category?.includes("Desain")
            ? "Desain"
            : s.category?.includes("Foto")
            ? "Fotografi"
            : s.category?.includes("Laptop") || s.category?.includes("PC")
            ? "Komputer"
            : s.category?.includes("AC")
            ? "Teknisi"
            : "Jasa",
        location:
          s.location ||
          (s.locationType === "online"
            ? "Online / Seluruh Indonesia"
            : s.provider?.campusName || activeKabupaten || "Kab. Banyumas (Purwokerto)"),
        locationType: s.locationType || "hybrid",
        mode: s.locationType || s.mode || "hybrid",
        provider: {
          id: s.provider?.id,
          name: s.provider?.fullName || "Mitra Jasa Bantuin",
          avatar:
            (s.provider?.avatarUrl && !s.provider.avatarUrl.includes("dicebear.com") && !s.provider.avatarUrl.includes("images.unsplash.com"))
              ? s.provider.avatarUrl
              : null,
          location:
            s.location ||
            (s.locationType === "online"
              ? "Online / Seluruh Indonesia"
              : s.provider?.campusName || activeKabupaten || "Kab. Banyumas (Purwokerto)"),
          city: s.provider?.campusName || activeKabupaten || "Kab. Banyumas (Purwokerto)",
          rating: rawRating > 0 ? rawRating.toFixed(1) : "0.0",
          completedJobs: Number(s.provider?.completedHelpsCount ?? s.completedOrders ?? 0),
          reviewsCount: realRatingCount,
          verified: isVerified,
          isVerified: isVerified,
        },
        portfolioUrls: Array.isArray(s.portfolioUrls) && s.portfolioUrls.length > 0 ? s.portfolioUrls : (realImg ? [realImg] : []),
      };
    });
  }, [liveServices, services, activeKabupaten, isLoadingServices]);


  const allProvidersList = useMemo(() => {
    const dbProviders = [];
    allCatalog.forEach((item) => {
      if (item.provider?.id && !dbProviders.some((p) => p.id === item.provider.id)) {
        dbProviders.push({
          id: item.provider.id,
          name: item.provider.name,
          brandTitle: "Penyedia Jasa Profesional",
          type: "specialist",
          category: item.categoryGroup || "Jasa",
          avatar: item.provider.avatar,
          coverBanner: null,
          rating: item.provider.rating || "0.0",
          reviewsCount: item.ratingCount || 0,
          completedJobs: item.provider.completedJobs || 0,
          responseTime: "10 menit",
          location: item.provider.location,
          city: item.provider.city,
          isVerified: item.provider.isVerified || true,
          bio: item.desc || "Penyedia jasa profesional terverifikasi di platform Bantuin.",
          skills: [item.category, "Layanan Cepat", "Kualitas Terbaik"]
        });
      }
    });
    return dbProviders;
  }, [allCatalog]);

  // Promoted Services (Sistem Promosi Terpadu Bantuin)
  const [promotedServices, setPromotedServices] = useState(() => {
    if (cachedPromotedServices && cachedPromotedServices.length > 0) return cachedPromotedServices;
    if (typeof window === "undefined") return [];
    try {
      const activePromos = promotionService.getActivePromotionsSync({
        type: "jasa",
        placement: "jasa",
      });
      const initial = activePromos.map((promo) => ({
        promoId: promo.id,
        id: promo.targetId || promo.id,
        title: promo.targetTitle,
        category: promo.category || promo.targetCategory || "Jasa",
        price: promo.price || promo.targetPrice || 0,
        image: promo.image || promo.targetImage || "/logotab.png",
        desc: promo.description || promo.desc || "",
        locationType: promo.locationType || "hybrid",
        mode: promo.locationType || "hybrid",
        rating: Number(promo.ratingAvg || promo.ownerRating || 5.0),
        ratingAvg: Number(promo.ratingAvg || promo.ownerRating || 5.0),
        reviewCount: Number(promo.reviewCount || promo.ratingCount || 0),
        completedOrders: Number(promo.completedCount || promo.completedJobs || 0),
        completedJobs: Number(promo.completedCount || promo.completedJobs || 0),
        completedCount: Number(promo.completedCount || promo.completedJobs || 0),
        provider: {
          name: promo.ownerName || "Mitra Bantuin",
          city: promo.targetLocation || "Banyumas",
          rating: Number(promo.ratingAvg || promo.ownerRating || 5.0),
          completedJobs: Number(promo.completedCount || promo.completedJobs || 0),
          verified: true,
        },
      }));
      cachedPromotedServices = initial;
      return initial;
    } catch {
      return [];
    }
  });

  useEffect(() => {
    let isMounted = true;
    const fetchPromoted = async (trackImpressions = false) => {
      try {
        await promotionService.fetchLivePromotions();
      } catch (err) {
        console.warn("Could not sync live promotions:", err);
      }

      if (!isMounted) return;

      const activePromos = promotionService.getActivePromotionsSync({
        type: "jasa",
        placement: "jasa",
        userLocation: filterByKabupaten ? activeKabupaten : undefined,
        category: selectedCategory !== "Semua" && selectedCategory !== "Penyedia" ? selectedCategory : undefined,
        search: searchQuery.trim() || undefined,
      });

      const mapped = activePromos.map((promo) => {
        const catalogItem = allCatalog.find(
          (c) => String(c?.id) === String(promo?.targetId) || String(c?.title || "").toLowerCase() === String(promo?.targetTitle || "").toLowerCase()
        );
        const realRating = Number(catalogItem?.ratingAvg ?? promo.ratingAvg ?? promo.rating ?? 5.0);
        const realReviews = Math.max(
          Number(catalogItem?.ratingCount ?? 0),
          Number(catalogItem?.provider?.reviewsCount ?? 0),
          Number(promo.reviewCount ?? 0),
          Number(promo.ratingCount ?? 0)
        );
        const realCompleted = Number(catalogItem?.completedOrders ?? promo.completedOrders ?? promo.completedCount ?? 0);

        return {
          promoId: promo.id,
          id: catalogItem?.id || promo.targetId || promo.id,
          targetId: promo.targetId || catalogItem?.id,
          title: promo.targetTitle || catalogItem?.title,
          category: promo.category || promo.targetCategory || catalogItem?.category || "Jasa",
          price: promo.price || promo.targetPrice || catalogItem?.price || 0,
          unit: catalogItem?.unit || promo.unit || "/ proyek",
          deliveryDuration: catalogItem?.deliveryDuration || promo.deliveryDuration || "1-2 Hari Kerja",
          image: promo.image || promo.targetImage || catalogItem?.image || "/logotab.png",
          desc: promo.description || promo.desc || catalogItem?.desc || "",
          priority: Number(promo.priority) || 1,
          isPromoted: true,
          rating: realRating,
          ratingAvg: realRating,
          reviewCount: realReviews,
          ratingCount: realReviews,
          completedOrders: realCompleted,
          completedJobs: realCompleted,
          completedCount: realCompleted,
          provider: catalogItem?.provider || {
            name: promo.ownerName || "Mitra Bantuin",
            city: promo.targetLocation || "Banyumas",
            rating: realRating,
            completedJobs: realCompleted,
            verified: true,
          },
        };
      });

      // Deduplikasi ketat agar tidak ada layanan jasa yang tampil ganda
      const seenServiceKeys = new Set();
      const uniqueMapped = [];
      for (const item of mapped) {
        const sKey = String(item.id || item.targetId || item.title);
        if (!seenServiceKeys.has(sKey)) {
          seenServiceKeys.add(sKey);
          uniqueMapped.push(item);
        }
      }

      cachedPromotedServices = uniqueMapped;
      setPromotedServices(uniqueMapped);

      // Pencatatan impresi hanya saat halaman pertama dimuat
      if (trackImpressions) {
        activePromos.forEach((p) => {
          promotionService.recordImpression(p.id);
        });
      }
    };

    fetchPromoted(true);
    const handleSync = () => {
      if (!isMounted) return;
      cachedPromotedServices = null;
      const activePromos = promotionService.getActivePromotionsSync({
        type: "jasa",
        placement: "jasa",
        userLocation: filterByKabupaten ? activeKabupaten : undefined,
        category: selectedCategory !== "Semua" && selectedCategory !== "Penyedia" ? selectedCategory : undefined,
        search: searchQuery.trim() || undefined,
      });

      const mapped = activePromos.map((promo) => {
        const catalogItem = allCatalog.find(
          (c) => String(c?.id) === String(promo?.targetId) || String(c?.title || "").toLowerCase() === String(promo?.targetTitle || "").toLowerCase()
        );
        const realRating = Number(catalogItem?.ratingAvg ?? promo.ratingAvg ?? promo.rating ?? 5.0);
        const realReviews = Math.max(
          Number(catalogItem?.ratingCount ?? 0),
          Number(catalogItem?.provider?.reviewsCount ?? 0),
          Number(promo.reviewCount ?? 0),
          Number(promo.ratingCount ?? 0)
        );
        const realCompleted = Number(catalogItem?.completedOrders ?? promo.completedOrders ?? promo.completedCount ?? 0);

        return {
          promoId: promo.id,
          id: catalogItem?.id || promo.targetId || promo.id,
          targetId: promo.targetId || catalogItem?.id,
          title: promo.targetTitle || catalogItem?.title,
          category: promo.category || promo.targetCategory || catalogItem?.category || "Jasa",
          price: promo.price || promo.targetPrice || catalogItem?.price || 0,
          unit: catalogItem?.unit || promo.unit || "/ proyek",
          deliveryDuration: catalogItem?.deliveryDuration || promo.deliveryDuration || "1-2 Hari Kerja",
          image: promo.image || promo.targetImage || catalogItem?.image || "/logotab.png",
          desc: promo.description || promo.desc || catalogItem?.desc || "",
          locationType: catalogItem?.locationType || promo.locationType || "hybrid",
          mode: catalogItem?.locationType || promo.locationType || "hybrid",
          priority: Number(promo.priority) || 1,
          isPromoted: true,
          rating: realRating,
          ratingAvg: realRating,
          reviewCount: realReviews,
          ratingCount: realReviews,
          completedOrders: realCompleted,
          completedJobs: realCompleted,
          completedCount: realCompleted,
          provider: catalogItem?.provider || {
            name: promo.ownerName || "Mitra Bantuin",
            city: promo.targetLocation || "Banyumas",
            rating: realRating,
            completedJobs: realCompleted,
            verified: true,
          },
        };
      });

      const seenSyncKeys = new Set();
      const uniqueSyncMapped = [];
      for (const item of mapped) {
        const sKey = String(item.id || item.targetId || item.title);
        if (!seenSyncKeys.has(sKey)) {
          seenSyncKeys.add(sKey);
          uniqueSyncMapped.push(item);
        }
      }

      cachedPromotedServices = uniqueSyncMapped;
      setPromotedServices(uniqueSyncMapped);
    };

    window.addEventListener("bantuin_promotions_updated", handleSync);
    window.addEventListener("bantuin_promotion_packages_updated", handleSync);
    window.addEventListener("bantuin_services_updated", handleSync);
    window.addEventListener("bantuin_service_updated", handleSync);
    return () => {
      isMounted = false;
      window.removeEventListener("bantuin_promotions_updated", handleSync);
      window.removeEventListener("bantuin_promotion_packages_updated", handleSync);
      window.removeEventListener("bantuin_services_updated", handleSync);
      window.removeEventListener("bantuin_service_updated", handleSync);
    };
  }, [allCatalog, activeKabupaten, filterByKabupaten, selectedCategory, searchQuery]);

  // Close desktop dropdowns when clicking outside or pressing Escape
  useEffect(() => {
    function handleClickOutside(event) {
      // Mobile uses a bottom sheet with its own backdrop. Treating the sheet
      // as an outside click here closes it before its controls can be used.
      if (window.innerWidth < 640) return;
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
    if (!item) return false;

    // Prioritas 1: Gunakan mode pengerjaan / locationType asli dari database
    const locType = String(item.locationType || item.location_type || item.mode || "").toLowerCase().trim();
    if (locType === "online" || locType === "digital") return true;
    if (locType === "onsite" || locType === "customer_location" || locType === "offline") return false;

    // Prioritas 2: Periksa teks lokasi jika secara eksplisit tertulis online / remote / seluruh indonesia
    const locStr = String(item.location || item.provider?.location || item.provider?.city || "").toLowerCase();
    if (locStr.includes("online") || locStr.includes("remote") || locStr.includes("digital") || locStr.includes("seluruh indonesia")) {
      return true;
    }

    // Prioritas 3: Heuristik fallback jika locationType default/hybrid atau belum terisi
    const catGroup = String(item.categoryGroup || "").toLowerCase();
    const cat = String(item.category || "").toLowerCase();
    const title = String(item.title || "").toLowerCase();
    const provCity = String(item.provider?.city || "").toLowerCase();

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
      cat.includes("3d") ||
      title.includes("online") ||
      provCity.includes("online") ||
      provCity.includes("remote")
    );
  };

  // Helper ringkas untuk badge lokasi kartu agar rapi, padat, dan estetis
  const formatLocationBadge = (loc) => {
    if (!loc || typeof loc !== "string") return "Di Lokasi";
    const clean = loc.trim();
    if (clean.toLowerCase().includes("online")) return "Digital";

    const parts = clean.split(",").map((p) => p.trim()).filter(Boolean);
    if (parts.length > 0) {
      let main = parts[0];
      // Jika bagian pertama adalah alamat jalan/nomor, cari bagian kota/kabupaten
      if (
        parts.length > 1 &&
        (main.match(/^\d/) ||
          main.toLowerCase().startsWith("jl") ||
          main.toLowerCase().startsWith("jalan") ||
          main.toLowerCase().startsWith("gang") ||
          main.toLowerCase().startsWith("gg"))
      ) {
        const cityPart = parts.find(
          (p) =>
            p.toLowerCase().includes("kab") ||
            p.toLowerCase().includes("kota") ||
            p.toLowerCase().includes("purwokerto") ||
            p.toLowerCase().includes("banyumas") ||
            p.toLowerCase().includes("kec")
        );
        if (cityPart) main = cityPart;
        else main = parts[1];
      }

      // Bersihkan teks kurung redundan seperti "(Purwokerto)"
      main = main.replace(/\s*\(.*?\)/g, "").trim();
      // Bersihkan prefix administratif panjang agar badge tetap padat dan elegan
      main = main.replace(/^(kab\.?|kabupaten|kota|kec\.?|kecamatan)\s+/i, "").trim();

      return main || "Di Lokasi";
    }

    return clean.slice(0, 16);
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

      // 2. Filter Category Group (Aman dari undefined)
      const itemCatGroup = String(item?.categoryGroup || "").toLowerCase();
      const itemCat = String(item?.category || "").toLowerCase();
      const selCatLower = String(selectedCategory || "").toLowerCase();

      const matchCategory =
        !selectedCategory ||
        selectedCategory === "Semua" ||
        itemCatGroup === selCatLower ||
        itemCat.includes(selCatLower) ||
        (selectedCategory === "Helper" && (itemCatGroup.includes("helper") || itemCat.includes("tenaga") || itemCat.includes("bantuan"))) ||
        (selectedCategory === "Desain" && (itemCatGroup.includes("desain") || itemCat.includes("logo"))) ||
        (selectedCategory === "Teknisi" && (itemCatGroup.includes("teknisi") || itemCat.includes("ac") || itemCat.includes("listrik"))) ||
        (selectedCategory === "Fotografi" && (itemCatGroup.includes("foto") || itemCat.includes("wisuda"))) ||
        (selectedCategory === "Komputer" && (itemCatGroup.includes("komputer") || itemCatGroup.includes("laptop") || itemCat.includes("laptop"))) ||
        (selectedCategory === "Web" && (itemCatGroup.includes("web") || itemCatGroup.includes("it"))) ||
        (selectedCategory === "Bahasa" && itemCatGroup.includes("bahasa"));

      if (!matchCategory) return false;

      // 3. Filter Sub-Category
      if (selectedSubCategory && selectedSubCategory !== "Semua") {
        const subCatObj = activeSubCategories.find((s) => s.id === selectedSubCategory);
        const subCatLower = String(selectedSubCategory || "").toLowerCase();
        const subQuery = String(subCatObj?.query || "").toLowerCase();
        const itemTitle = String(item?.title || "").toLowerCase();
        const itemDesc = String(item?.desc || "").toLowerCase();

        const subMatch =
          itemCat.includes(subCatLower) ||
          (subQuery && itemTitle.includes(subQuery)) ||
          (subQuery && itemDesc.includes(subQuery));

        if (!subMatch) return false;
      }

      // 4. Filter Search Query
      if (searchQuery.trim()) {
        const q = String(searchQuery || "").toLowerCase().trim();
        const itemTitle = String(item?.title || "").toLowerCase();
        const itemDesc = String(item?.desc || "").toLowerCase();
        const itemCat = String(item?.category || "").toLowerCase();
        const itemProvName = String(item?.provider?.name || "").toLowerCase();

        const matchSearch =
          itemTitle.includes(q) ||
          itemDesc.includes(q) ||
          itemCat.includes(q) ||
          itemProvName.includes(q);

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

    // Boost ranking & anotasi status promosi
    const listWithPromo = list.map((item) => {
      const promoMatch = promotedServices.find(
        (p) => String(p?.id) === String(item?.id) ||
               String(p?.promoId) === String(item?.id) ||
               String(p?.targetId) === String(item?.id) ||
               (p?.title && item?.title && String(p.title).trim().toLowerCase() === String(item.title).trim().toLowerCase())
      );
      return {
        ...item,
        isPromoted: Boolean(promoMatch),
        promoPriority: promoMatch ? Number(promoMatch.priority || promoMatch.package?.priority || 1) : 0,
      };
    });

    // Urutan prioritas teratas (boost ranking) untuk jasa yang dipromosikan (Priority 3 > 2 > 1 > organik)
    listWithPromo.sort((a, b) => {
      if (a.isPromoted && !b.isPromoted) return -1;
      if (!a.isPromoted && b.isPromoted) return 1;
      if (a.isPromoted && b.isPromoted) {
        return (b.promoPriority || 0) - (a.promoPriority || 0);
      }
      return 0;
    });

    return listWithPromo;
  }, [filteredCatalog, serviceTypeFilter, priceFilter, sortBy, promotedServices]);

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
        String(p?.name || "").toLowerCase().includes(q) ||
        String(p?.brandTitle || "").toLowerCase().includes(q) ||
        String(p?.category || "").toLowerCase().includes(q) ||
        (Array.isArray(p?.skills) && p.skills.some((s) => String(s || "").toLowerCase().includes(q)))
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

          {/* ───────────────────────────────────────────────────────────── */}
          {!isLoadingServices && promotedServices.length > 0 && selectedCategory !== "Penyedia" && (
            <div className="rounded-2xl sm:rounded-3xl bg-gradient-to-b from-blue-50/70 via-blue-50/20 to-white border border-blue-200/80 p-3.5 sm:p-5 shadow-2xs space-y-3.5">

              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#1683FF] shadow-[0_0_8px_rgba(22,131,255,0.6)]" />
                  <h3 className="text-sm sm:text-base font-black text-slate-900 tracking-tight whitespace-nowrap">
                    Jasa Direkomendasikan
                  </h3>
                </div>
                <Link
                  href="/jasa/direkomendasikan"
                  className="text-[11px] text-[#1683FF] font-bold hover:underline transition shrink-0 whitespace-nowrap"
                >
                  Kunjungi Semua →
                </Link>
              </div>

              <RecommendedCarousel
                items={promotedServices}
                variant="jasa"
                getHref={(item) => `/jasa/${item.id}`}
                onCardClick={(item) => {
                  if (item.promoId) promotionService.recordClick(item.promoId);
                }}
              />
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
            {isLoadingServices ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-4 md:gap-5">
                {Array.from({ length: 8 }).map((_, sk) => (
                  <JasaCardSkeleton key={sk} />
                ))}
              </div>
            ) : allCatalog.length === 0 ? (

              <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 text-center max-w-md mx-auto space-y-3 shadow-2xs">
                <div className="w-16 h-16 rounded-2xl bg-blue-50 text-[#1683FF] flex items-center justify-center mx-auto mb-2">
                  <Layers className="w-8 h-8" />
                </div>
                <h3 className="font-bold text-slate-900 text-base sm:text-lg">
                  Belum Ada Jasa Tersedia
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Katalog layanan jasa saat ini sedang bersih dan siap menampilkan data asli yang ditambahkan oleh penyedia jasa.
                </p>
                <div className="pt-2">
                  <Link
                    href="/jasa/dashboard"
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#1683FF] text-white rounded-xl text-xs font-bold hover:bg-[#0F6FE5] transition shadow-xs"
                  >
                    <span>Buka Panel Penyedia Jasa</span>
                  </Link>
                </div>
              </div>
            ) : filteredCatalog.length > 0 ? (
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
                          {/* Kategori Layanan (Top Left) */}
                          <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1.5">
                            <span className="inline-flex items-center text-[9px] sm:text-[10px] font-bold px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-slate-900/65 text-white backdrop-blur-md shadow-2xs border border-white/10 whitespace-nowrap max-w-[100px] sm:max-w-[120px] truncate">
                              {item.category}
                            </span>
                          </div>
                          
                          {/* Badge Digital vs Datang ke Lokasi (Top Right) */}
                          <div className="absolute top-2.5 right-2.5 z-10">
                            {isDigital ? (
                              <span className="inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-bold px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-blue-600/90 text-white backdrop-blur-md shadow-2xs border border-blue-400/30 whitespace-nowrap">
                                <Globe className="w-2.5 h-2.5 sm:w-3 sm:h-3 shrink-0" />
                                <span>Digital</span>
                              </span>
                            ) : (
                              <span 
                                title={item.location || item.provider?.city || "Di Lokasi"}
                                className="hidden sm:inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-bold px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-white/95 text-slate-800 backdrop-blur-md shadow-2xs border border-white/90 whitespace-nowrap max-w-[125px] sm:max-w-[155px]"
                              >
                                <MapPin className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#1683FF] shrink-0" />
                                <span className="truncate">{formatLocationBadge(item.provider?.city || item.location)}</span>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Detail Judul & Deskripsi */}
                        <div className="p-3 sm:p-4 sm:p-5 flex flex-col flex-1 justify-between min-w-0">
                          <div>
                            <h3 className="font-bold text-xs sm:text-[15px] text-slate-900 group-hover:text-[#1683FF] transition-colors line-clamp-2 leading-snug break-words">
                              {item.title}
                            </h3>

                            {/* Deskripsi ringkas: hanya di layar lebih lebar agar tidak menumpuk di kartu mobile */}
                            <p className="hidden md:line-clamp-2 text-xs text-slate-500 leading-relaxed mt-1 break-words">
                              {item.desc}
                            </p>
                          </div>

                          {/* Mitra Penyedia Info & Reputasi (Responsif Vertikal di Mobile, Horizontal di Desktop) */}
                          <div className="pt-2 mt-2 sm:mt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] sm:text-xs min-w-0 gap-1.5">
                            <Link
                              href={`/jasa/penyedia/${item.provider?.id || item.provider?.name || "provider"}`}
                              onClick={(e) => e.stopPropagation()}
                              className="flex items-center gap-1.5 min-w-0 truncate group/prov hover:opacity-90 transition cursor-pointer"
                              title={`Lihat profil ${item.provider?.name || "Penyedia"}`}
                            >
                              {item.provider?.avatar && !item.provider.avatar.includes("dicebear.com") && !item.provider.avatar.includes("images.unsplash.com") ? (
                                <img
                                  src={item.provider.avatar}
                                  alt={item.provider?.name || "Penyedia"}
                                  className="w-5 h-5 rounded-full object-cover border border-slate-200 group-hover/prov:border-[#1683FF] shrink-0 transition"
                                />
                              ) : (
                                <div className="w-5 h-5 rounded-full bg-linear-to-br from-[#1683FF] to-[#0E5FCC] text-white flex items-center justify-center font-bold text-[9px] shrink-0 shadow-2xs">
                                  {((item.provider?.name || "P").trim()[0] || "P").toUpperCase()}
                                </div>
                              )}
                              <span className="truncate font-semibold text-slate-700 group-hover/prov:text-[#1683FF] transition max-w-[100px] sm:max-w-[120px]">
                                {item.provider?.name || "Penyedia Jasa"}
                              </span>
                              {(item.provider?.isVerified || item.provider?.verified) && (
                                <CheckCircle2 className="w-3.5 h-3.5 text-[#1683FF] shrink-0" />
                              )}
                            </Link>

                            <div className="flex items-center gap-1 font-bold text-amber-500 shrink-0 text-[10px] sm:text-xs flex-wrap">
                              <div className="flex items-center gap-0.5">
                                <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-amber-400 text-amber-400" />
                                <span>{Number(item.provider?.rating !== undefined && item.provider?.rating !== null ? item.provider.rating : (item.ratingAvg || 0)).toFixed(1)}</span>
                                <span className="text-slate-400 font-normal text-[9px] sm:text-[10px]">
                                  ({Number(item.ratingCount || item.provider?.reviewsCount || 0)})
                                </span>
                              </div>
                              <span className="text-slate-300">•</span>
                              <span className="text-slate-500 font-medium text-[9px] sm:text-[10px] whitespace-nowrap">
                                {Number(item.completedOrders || item.provider?.completedJobs || 0)} selesai
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Footer Harga & Tombol Pesan (Bersih & Proporsional) */}
                      <div className="px-3 sm:px-4 py-2 sm:py-2.5 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between gap-1.5 min-w-0">
                        <div className="min-w-0">
                          <span className="text-[9px] uppercase font-bold text-slate-400 block leading-tight">
                            Mulai
                          </span>
                          <div className="flex items-baseline gap-0.5 min-w-0 flex-wrap">
                            <span className="text-xs sm:text-sm md:text-base font-black text-[#1683FF] truncate">
                              {formatIDR(item.price)}
                            </span>
                            {item.unit && (
                              <span className="text-[9px] sm:text-[10px] font-semibold text-slate-400">
                                {item.unit}
                              </span>
                            )}
                          </div>
                        </div>

                        <span className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-[#1683FF] text-white text-[10px] sm:text-xs font-bold group-hover:bg-[#0F6FE5] transition shrink-0 shadow-2xs">
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
                        <div className="flex items-center gap-1 text-[11px] text-slate-600 font-medium">
                          <MapPin className="w-3 h-3 text-[#1683FF]" />
                          <span className="truncate max-w-[140px]">{provider.location || provider.city || "Indonesia"}</span>
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
                        <span className="text-[10px] uppercase font-bold text-slate-500 block leading-tight truncate">
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

export default function JasaPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F4F7FB]" />}>
      <JasaPageContent />
    </Suspense>
  );
}
