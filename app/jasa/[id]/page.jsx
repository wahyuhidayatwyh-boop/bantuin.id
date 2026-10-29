"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import LocationPickerMap from "@/components/map/LocationPickerMap";
import { reverseGeocodeCoordinates } from "@/lib/services/gpsService";
import { useApp } from "@/lib/context/AppContext";
import { formatIDR } from "@/lib/utils";
import { getCatalogServiceById } from "@/lib/mock/providersData";
import ServiceDetailSkeleton from "@/components/skeletons/ServiceDetailSkeleton";
import CategoryIcon from "@/components/common/CategoryIcon";
import { saveFormDraft, getFormDraft, clearFormDraft } from "@/lib/hooks/useFormDraft";
import { 
  ArrowLeft, 
  Star, 
  ShieldCheck, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Store, 
  Calendar,
  ChevronRight,
  MessageSquare,
  Lock,
  Check,
  Award,
  Globe,
  FileText,
  Home,
  Navigation,
  Loader2,
  Building2,
  ExternalLink
} from "lucide-react";

export default function JasaCheckoutDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const { 
    currentUser,
    services = [],
    userCoordinates, 
    userRealLocation, 
    selectedLocation, 
    detectUserLocation,
    startJasaInquiry,
    addToast
  } = useApp() || {};

  const [dbService, setDbService] = useState(null);
  const [loadingService, setLoadingService] = useState(true);

  useEffect(() => {
    if (!id) {
      setLoadingService(false);
      return;
    }
    setLoadingService(true);
    
    // Selalu prioritaskan fetch data riil dari database backend
    fetch(`/api/services/${id}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          const s = json.data;
          const realImage =
            (Array.isArray(s.portfolioUrls) && s.portfolioUrls.length > 0 && s.portfolioUrls[0]) ||
            s.coverImageUrl ||
            s.imageUrl ||
            s.image ||
            "/logotab.png";
          const photosList =
            Array.isArray(s.portfolioUrls) && s.portfolioUrls.length > 0
              ? s.portfolioUrls
              : [realImage];

          setDbService({
            id: s.id,
            title: s.title,
            desc: s.description || "Layanan profesional dari penyedia terverifikasi Bantuin.",
            price: Number(s.startingPrice) || 0,
            image: realImage,
            photos: photosList,
            category: s.category || "Jasa",
            locationType: s.locationType || s.location_type || "hybrid",
            latitude: s.latitude,
            longitude: s.longitude,
            address: s.address,
            categoryGroup: s.category?.includes("Desain")
              ? "Desain"
              : s.category?.includes("Foto")
              ? "Fotografi"
              : s.category?.includes("Laptop")
              ? "Komputer"
              : s.category?.includes("AC")
              ? "Teknisi"
              : "Jasa",
            provider: {
              id: s.provider?.id,
              name: s.provider?.fullName || "Mitra Jasa Bantuin",
              brandTitle: s.provider?.partnerBusinessName || s.provider?.bio || "",
              avatar:
                (s.provider?.avatarUrl && !s.provider.avatarUrl.includes("dicebear.com") && !s.provider.avatarUrl.includes("images.unsplash.com"))
                  ? s.provider.avatarUrl
                  : (s.provider?.avatarUrl || "/logotab.png"),
              coverBanner: s.provider?.bannerUrl || null,
              location: s.provider?.campusName || "Kab. Banyumas (Purwokerto)",
              phone: s.provider?.phoneNumber || "081234567890",
              rating: (s.provider?.ratingAvg !== undefined && s.provider?.ratingAvg !== null && Number(s.provider.ratingAvg) > 0)
                ? Number(s.provider.ratingAvg).toFixed(1)
                : ((s.ratingAvg !== undefined && s.ratingAvg !== null && Number(s.ratingAvg) > 0)
                    ? Number(s.ratingAvg).toFixed(1)
                    : "0.0"),
              reviewsCount: Math.max(Number(s.provider?.ratingCount ?? 0), Number(s.ratingCount ?? 0)),
              completedJobs: Number(s.provider?.completedHelpsCount ?? s.completedOrders ?? 0),
              verified:
                s.provider?.verificationStatus === "verified" ||
                s.provider?.isVerified === true,
            },
            unit: s.unit || s.packages?.[0]?.unit || "/ proyek",
            deliveryDuration: s.deliveryDuration || s.packages?.[0]?.duration || "1-2 Hari Kerja",
            packages: Array.isArray(s.packages) && s.packages.length > 0
              ? s.packages.map((p, idx) => ({
                  id: p.id || `pkg-${idx}`,
                  name: p.name || `Paket ${idx + 1}`,
                  tier: p.tier || "Paket Pilihan",
                  price: Number(p.price) || Number(s.startingPrice) || 0,
                  unit: p.unit || s.unit || "/ proyek",
                  duration: p.duration || s.deliveryDuration || "1-2 Hari Kerja",
                  description: p.description || s.description || "Pengerjaan layanan profesional bergaransi.",
                  features: Array.isArray(p.features) && p.features.length > 0
                    ? p.features
                    : [
                        "Pengerjaan langsung oleh mitra terverifikasi",
                        "Garansi pengerjaan & revisi wajar",
                        "File / hasil siap pakai berstandar tinggi",
                        "Koordinasi langsung via chat Bantuin"
                      ],
                  isPopular: Boolean(p.isPopular),
                }))
              : [
                  {
                    id: `pkg-${s.id}`,
                    name: s.title || "Paket Standar",
                    tier: "Layanan Standar",
                    price: Number(s.startingPrice) || 0,
                    unit: s.unit || "/ proyek",
                    duration: s.deliveryDuration || "1-2 Hari Kerja",
                    description: s.description || "Pengerjaan layanan standar sesuai deskripsi kebutuhan.",
                    features: [
                      "Pengerjaan langsung oleh mitra terverifikasi",
                      "Garansi pengerjaan & revisi wajar",
                      "File / hasil siap pakai berstandar tinggi",
                      "Koordinasi langsung via chat Bantuin"
                    ],
                    isPopular: true
                  }
                ],
            reviews: Array.isArray(s.reviews)
              ? s.reviews.map((r) => ({
                  id: r.id,
                  userName: r.userName || r.reviewer?.fullName || "Pelanggan Terverifikasi",
                  userAvatar: r.userAvatar || r.reviewer?.avatarUrl || null,
                  date: r.date || (r.createdAt ? new Date(r.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "Baru saja"),
                  rating: Number(r.rating || 5),
                  comment: r.comment || "Layanan sangat memuaskan!",
                  packageName: r.packageName || s.title || "Layanan Jasa",
                }))
              : []
          });
        }
      })
      .catch((err) => {
        console.warn("Failed fetching service detail from DB:", err);
      })
      .finally(() => {
        setLoadingService(false);
      });
  }, [id]);

  const service = useMemo(() => {
    if (dbService) return dbService;
    if (!loadingService) return getCatalogServiceById(id);
    return null;
  }, [id, dbService, loadingService]);

  // ── Semua hooks harus dideklarasikan SEBELUM early return (Rules of Hooks) ──
  const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split("T")[0];

  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [targetDate, setTargetDate] = useState(tomorrowStr);
  const [targetTime, setTargetTime] = useState("09:00");
  const [notes, setNotes] = useState("");
  const [alamat, setAlamat] = useState(userRealLocation?.fullAddress || selectedLocation || "");
  const [patokan, setPatokan] = useState("");
  const [brief, setBrief] = useState("");     // untuk jasa digital
  const [coords, setCoords] = useState(
    userCoordinates || 
    (userRealLocation ? { latitude: userRealLocation.latitude, longitude: userRealLocation.longitude } : { latitude: -7.4243, longitude: 109.2304 })
  );
  const [isDetectingGPS, setIsDetectingGPS] = useState(false);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);

  const autoGeocodeTimeoutRef = useRef(null);

  const handleUseMyGPS = async () => {
    setIsDetectingGPS(true);
    setIsReverseGeocoding(true);
    try {
      let loc = userRealLocation;
      if (!loc || !userCoordinates) {
        if (detectUserLocation) {
          loc = await detectUserLocation();
        }
      }
      if (loc) {
        const lat = loc.latitude;
        const lng = loc.longitude;
        setCoords({ latitude: lat, longitude: lng });

        let address = loc.fullAddress;
        if (!address) {
          try {
            const geo = await reverseGeocodeCoordinates(lat, lng);
            if (geo?.fullAddress) address = geo.fullAddress;
            else if (geo?.shortLocation) address = geo.shortLocation;
          } catch (geoErr) {
            console.warn("Reverse geocode in GPS detection failed:", geoErr);
          }
        }
        if (!address) {
          address = `${loc.district ? loc.district + ", " : ""}${loc.city || ""}`.trim();
        }
        if (address) {
          setAlamat(address);
        }
      }
    } catch (e) {
      console.warn("GPS detection failed in jasa order:", e);
    } finally {
      setIsDetectingGPS(false);
      setIsReverseGeocoding(false);
    }
  };

  const handleMapLocationChange = ({ latitude, longitude }) => {
    setCoords({ latitude, longitude });
    if (autoGeocodeTimeoutRef.current) {
      clearTimeout(autoGeocodeTimeoutRef.current);
    }
    autoGeocodeTimeoutRef.current = setTimeout(async () => {
      setIsReverseGeocoding(true);
      try {
        const res = await reverseGeocodeCoordinates(latitude, longitude);
        if (res && (res.fullAddress || res.shortLocation)) {
          setAlamat(res.fullAddress || res.shortLocation);
        }
      } catch (err) {
        console.warn("Auto reverse geocode on map pin change failed:", err);
      } finally {
        setIsReverseGeocoding(false);
      }
    }, 450);
  };

  const handleSyncAddressFromCoords = async () => {
    if (!coords) return;
    setIsReverseGeocoding(true);
    try {
      const res = await reverseGeocodeCoordinates(coords.latitude, coords.longitude);
      if (res && (res.fullAddress || res.shortLocation)) {
        setAlamat(res.fullAddress || res.shortLocation);
      }
    } catch (e) {
      console.warn("Reverse geocode failed:", e);
    } finally {
      setIsReverseGeocoding(false);
    }
  };

  // Pilihan paket — diinisialisasi null dulu, di-resolve setelah guard
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [isOrderedSuccess, setIsOrderedSuccess] = useState(false);
  const [hybridChoice, setHybridChoice] = useState("onsite");

  const DRAFT_BOOKING_KEY = id ? `bantuin_draft_jasa_booking_${id}` : null;

  useEffect(() => {
    if (!DRAFT_BOOKING_KEY) return;
    const draft = getFormDraft(DRAFT_BOOKING_KEY, null);
    if (draft) {
      if (draft.targetDate) setTargetDate(draft.targetDate);
      if (draft.targetTime) setTargetTime(draft.targetTime);
      if (draft.notes) setNotes(draft.notes);
      if (draft.alamat) setAlamat(draft.alamat);
      if (draft.patokan) setPatokan(draft.patokan);
      if (draft.brief) setBrief(draft.brief);
      if (draft.hybridChoice) setHybridChoice(draft.hybridChoice);
      if (draft.selectedPackage) setSelectedPackage(draft.selectedPackage);
    }
  }, [DRAFT_BOOKING_KEY]);

  useEffect(() => {
    if (!DRAFT_BOOKING_KEY) return;
    if (notes || brief || patokan) {
      saveFormDraft(DRAFT_BOOKING_KEY, {
        targetDate,
        targetTime,
        notes,
        alamat,
        patokan,
        brief,
        hybridChoice,
        selectedPackage,
      });
    }
  }, [DRAFT_BOOKING_KEY, targetDate, targetTime, notes, alamat, patokan, brief, hybridChoice, selectedPackage]);

  // Loading state saat mengambil data dari database
  if (loadingService && !dbService) {
    return <ServiceDetailSkeleton />;
  }

  // Jika jasa tidak ditemukan setelah selesai loading
  if (!service) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <h2 className="text-xl font-bold text-slate-900">Layanan Jasa Tidak Ditemukan</h2>
          <p className="text-xs text-slate-500 mt-1">Layanan yang Anda cari mungkin sudah tidak aktif atau berpindah.</p>
          <Link 
            href="/jasa" 
            className="mt-4 px-4 py-2 bg-[#1683FF] text-white rounded-xl text-xs font-semibold hover:bg-[#0F6FE5] transition"
          >
            Kembali ke Katalog Jasa
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  // ── Deteksi tipe jasa berorientasi database: onsite, customer_location, online, hybrid ──
  const baseLocationType = String(service?.locationType || service?.location_type || "onsite").toLowerCase();
  const effectiveMode = baseLocationType === "hybrid"
    ? hybridChoice
    : (baseLocationType === "onsite" || baseLocationType === "studio" || baseLocationType === "workshop")
    ? "onsite"
    : (baseLocationType === "customer_location" || baseLocationType === "panggilan" || baseLocationType === "lokasi")
    ? "customer_location"
    : (baseLocationType === "online" || baseLocationType === "digital")
    ? "online"
    : "onsite";

  const isDigitalService = effectiveMode === "online";
  const isCustomerLoc = effectiveMode === "customer_location";
  const isOnsite = effectiveMode === "onsite";

  // Galeri Foto
  const photos = service.photos && service.photos.length > 0
    ? service.photos
    : [service.image];

  // Pilihan Paket Layanan yang Benar-Benar Sesuai dengan Penyedia Jasa
  const availablePackages = service.packages && service.packages.length > 0
    ? service.packages
    : [
        {
          id: `pkg-${service.id}`,
          name: service.title,
          tier: "Layanan Standar",
          price: service.price,
          duration: "1 - 2 Hari Kerja",
          description: service.desc || "Pengerjaan layanan standar sesuai deskripsi kebutuhan.",
          features: [
            "Pengerjaan langsung oleh mitra terverifikasi",
            "Garansi pengerjaan & revisi wajar",
            "File resolusi tinggi siap pakai",
            "Koordinasi langsung via chat Bantuin"
          ],
          isPopular: true
        }
      ];

  // Resolve paket aktif (gunakan state jika sudah dipilih, fallback ke popular/first)
  const activePkg = selectedPackage ||
    (availablePackages.find((p) => p.isPopular) || availablePackages[0]);

  const platformFee = Math.round(activePkg.price * 0.08);
  const netProviderPayout = activePkg.price - platformFee;

  const isOwnService = Boolean(
    currentUser &&
    service?.provider &&
    (currentUser.id === service.provider.id ||
      (currentUser.email &&
        service.provider.email &&
        String(currentUser.email).toLowerCase() === String(service.provider.email).toLowerCase()))
  );

  const handleCheckout = (e) => {
    e.preventDefault();
    if (!currentUser) {
      if (addToast) addToast("Perlu Login", "Silakan login terlebih dahulu untuk memesan jasa.", "warning");
      const currentUrl = typeof window !== "undefined" ? window.location.pathname + window.location.search : `/jasa/${service?.id}`;
      router.push(`/auth/login?redirect=${encodeURIComponent(currentUrl)}`);
      return;
    }

    const finalAlamat = isCustomerLoc
      ? [alamat, patokan ? `(Patokan: ${patokan})` : ""].filter(Boolean).join(" ")
      : isOnsite
      ? (service.address || service.provider?.address || "Lokasi Pengerjaan Mitra")
      : "";

    const finalLat = isCustomerLoc
      ? (coords?.latitude || "")
      : isOnsite
      ? (service.latitude || "")
      : "";

    const finalLng = isCustomerLoc
      ? (coords?.longitude || "")
      : isOnsite
      ? (service.longitude || "")
      : "";

    const extraParam = isDigitalService
      ? `&brief=${encodeURIComponent(brief)}&mode=online&locationType=online`
      : `&time=${encodeURIComponent(targetTime)}&alamat=${encodeURIComponent(finalAlamat)}&lat=${finalLat}&lng=${finalLng}&mode=${effectiveMode}&locationType=${effectiveMode}`;

    router.push(
      `/jasa/${service.id}/pembayaran?pkg=${activePkg.id}&date=${targetDate}${extraParam}&notes=${encodeURIComponent(notes || "")}`
    );
  };

  const handleStartChat = () => {
    if (startJasaInquiry && service) {
      const inqRoom = startJasaInquiry({
        serviceId: service.id,
        serviceTitle: service.title,
        serviceImage: service.image,
        servicePrice: activePkg?.price || service.price,
        providerId: service.provider?.id,
        providerName: service.provider?.name,
        providerAvatar: service.provider?.avatar,
        providerPhone: service.provider?.phone,
        providerRating: service.provider?.rating,
        providerAddress: service.address || service.provider?.address || service.provider?.location,
        category: service.category,
        locationType: effectiveMode,
        latitude: service.latitude,
        longitude: service.longitude,
      });
      router.push(`/chat?room=${inqRoom?.id}`);
    } else {
      router.push(`/chat?partnerId=${service.provider?.id}&serviceId=${service.id}&locationType=${effectiveMode}`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <Navbar />

      <main className="flex-1 max-w-[1360px] w-full mx-auto px-4 md:px-6 lg:px-8 py-6 sm:py-8">
        
        {/* Breadcrumb / Navigasi Kembali */}
        <div className="mb-5">
          <Link
            href="/jasa"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-[#1683FF] transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Katalog Jasa</span>
          </Link>
        </div>

        {/* Layout 2 Kolom: Detail Layanan (Kiri) + Checkout Box (Kanan) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
          
          {/* ============================================================ */}
          {/* KOLOM KIRI (7 Kolom): FOTO, RINCIAN & PILIHAN PAKETAN       */}
          {/* ============================================================ */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* CARD 1: FOTO & DETAIL UTAMA JASA */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-7 shadow-xs space-y-5">
              
              {/* Galeri Foto Jasa */}
              <div className="space-y-3">
                <div className="relative aspect-[16/10] w-full rounded-2xl overflow-hidden bg-slate-100 border border-slate-100">
                  <img
                    src={photos[activePhotoIndex] || service.image}
                    alt={service.title}
                    className="w-full h-full object-cover transition-all duration-300"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="inline-flex items-center gap-1.5 text-xs font-extrabold px-3 py-1 rounded-lg bg-black/60 text-white backdrop-blur-xs shadow-xs">
                      <CategoryIcon category={service.category} className="w-3.5 h-3.5 text-white shrink-0" />
                      <span>{service.category}</span>
                    </span>
                  </div>
                </div>

                {/* Thumbnail Bar jika lebih dari 1 foto */}
                {photos.length > 1 && (
                  <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                    {photos.map((pUrl, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setActivePhotoIndex(idx)}
                        className={`relative w-16 h-16 rounded-xl overflow-hidden shrink-0 border-2 transition cursor-pointer ${
                          activePhotoIndex === idx
                            ? "border-[#1683FF] ring-2 ring-[#1683FF]/20"
                            : "border-slate-200 opacity-70 hover:opacity-100"
                        }`}
                      >
                        <img
                          src={pUrl}
                          alt={`Thumbnail ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Judul & Rating */}
              <div className="space-y-2 pt-1 border-t border-slate-100">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-snug">
                  {service.title}
                </h1>

                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <div className="flex items-center gap-1 font-bold text-amber-500">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <span>{service.provider.rating}</span>
                    <span className="text-slate-400 font-normal">
                      ({service.provider.reviewsCount ?? 0} ulasan)
                    </span>
                  </div>
                  <span>•</span>
                  <span className="font-semibold text-slate-700">
                    {service.provider.completedJobs ?? 0} pesanan selesai
                  </span>
                </div>
              </div>

              {/* Deskripsi Layanan */}
              <div className="pt-3 border-t border-slate-100 space-y-1.5">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Deskripsi Layanan
                </h3>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                  {service.desc}
                </p>
              </div>

            </div>

            {/* CARD 2: PROFIL TOKO / MITRA PENYEDIA (DILENGKAPI BANNER & FOTO PROFIL) */}
            <div className="bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-xs">
              {/* Mini Cover Banner */}
              {service.provider.coverBanner && (
                <div className="relative h-20 sm:h-24 w-full bg-slate-900 overflow-hidden">
                  <img
                    src={service.provider.coverBanner}
                    alt={service.provider.name}
                    className="w-full h-full object-cover opacity-50"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />
                </div>
              )}
              
              <div className="px-5 sm:px-6 pb-5 sm:pb-6 pt-3 sm:pt-4 relative z-10 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                  <Link
                    href={`/jasa/penyedia/${service.provider?.id || service.providerId || service.provider?.name || "provider"}`}
                    className="flex items-center gap-3.5 min-w-0 group/provider hover:opacity-95 transition cursor-pointer"
                    title={`Lihat profil ${service.provider?.name}`}
                  >
                    <div className={service.provider.coverBanner ? "-mt-8 sm:-mt-10 relative shrink-0" : "relative shrink-0"}>
                      <img
                        src={service.provider.avatar}
                        alt={service.provider.name}
                        className="w-16 h-16 rounded-2xl object-cover border-3 border-white shadow-md bg-white group-hover/provider:border-[#1683FF] transition"
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-black text-sm sm:text-base text-slate-900 group-hover/provider:text-[#1683FF] transition truncate">
                          {service.provider.name}
                        </h4>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1 shrink-0">
                          <ShieldCheck className="w-3 h-3" />
                          <span>Terverifikasi</span>
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                        {service.provider.brandTitle}
                      </div>
                    </div>
                  </Link>

                  <Link
                    href={`/jasa/penyedia/${service.provider?.id || service.providerId || service.provider?.name || "provider"}`}
                    className="px-4 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#1683FF] text-xs font-bold transition flex items-center gap-1.5 shrink-0 self-start sm:self-auto border border-blue-100 shadow-2xs"
                  >
                    <Store className="w-3.5 h-3.5" />
                    <span>Kunjungi Profil Lengkap</span>
                  </Link>
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-500 pt-2 border-t border-slate-100 flex-wrap">
                  <div className="flex items-center gap-1 text-amber-500 font-bold">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>{service.provider.rating || "0.0"}</span>
                    <span className="text-slate-400 font-medium">({service.provider.reviewsCount ?? 0} ulasan)</span>
                  </div>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Award className="w-3.5 h-3.5 text-[#1683FF]" />
                    <span>{service.provider.completedJobs ?? 0} Projek Selesai</span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-slate-600">
                    <MapPin className="w-3 h-3 text-[#1683FF]" />
                    <span className="truncate max-w-[160px]">{service.provider.location}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* CARD 3: PILIHAN PAKETAN (BENTUK CARD SEDERHANA) */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-7 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                    Pilihan Paket Layanan
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Pilih paket yang sesuai kebutuhan Anda. Rincian harga di samping akan otomatis menyesuaikan.
                  </p>
                </div>
                <span className="text-xs font-bold text-slate-400 shrink-0">
                  {availablePackages.length} Pilihan Tersedia
                </span>
              </div>

              {/* Grid Card Sederhana Pilihan Paketan */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
                {availablePackages.map((pkg) => {
                  const isSelected = activePkg.id === pkg.id;
                  return (
                    <div
                      key={pkg.id}
                      onClick={() => setSelectedPackage(pkg)}
                      className={`p-4 rounded-2xl border-2 transition-all duration-200 cursor-pointer flex flex-col justify-between relative ${
                        isSelected
                          ? "border-[#1683FF] bg-blue-50/35 shadow-xs"
                          : "border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50/50"
                      }`}
                    >
                      {/* Checkmark Indicator Terpilih */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          {pkg.tier && (
                            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 block w-fit mb-1">
                              {pkg.tier}
                            </span>
                          )}
                          <h4 className="font-bold text-sm text-slate-900 leading-snug">
                            {pkg.name}
                          </h4>
                        </div>

                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition ${
                            isSelected
                              ? "bg-[#1683FF] text-white"
                              : "border-2 border-slate-300 text-transparent"
                          }`}
                        >
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      </div>

                      {/* Deskripsi & Durasi */}
                      <p className="text-xs text-slate-500 line-clamp-2 mb-3">
                        {pkg.description}
                      </p>

                      {/* Fitur Bullet List */}
                      {pkg.features && pkg.features.length > 0 && (
                        <div className="space-y-1.5 pt-2 border-t border-slate-100/80 mb-3">
                          {pkg.features.slice(0, 3).map((feat, fIdx) => (
                            <div key={fIdx} className="flex items-start gap-1.5 text-[11px] text-slate-700">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                              <span className="line-clamp-1">{feat}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Harga Paket */}
                      <div className="pt-2 border-t border-slate-100/80 flex items-center justify-between mt-auto">
                        <span className="text-[11px] text-slate-400 font-medium">
                          Durasi: {pkg.duration || service.deliveryDuration || "1-2 Hari Kerja"}
                        </span>
                        <span className="font-black text-sm sm:text-base text-[#1683FF]">
                          {formatIDR(pkg.price)} {pkg.unit || service.unit ? (pkg.unit || service.unit) : ""}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>

            {/* CARD 4: ULASAN PELANGGAN TERVERIFIKASI */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-7 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  Ulasan Pelanggan ({service.reviews?.length || 0})
                </h3>
                <div className="text-xs font-bold text-amber-500 flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>{service.provider.rating} / 5.0</span>
                </div>
              </div>

              {service.reviews && service.reviews.length > 0 ? (
                <div className="space-y-3.5 divide-y divide-slate-100">
                  {service.reviews.map((rev) => (
                    <div key={rev.id} className="pt-3.5 first:pt-0 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          {rev.userAvatar && !rev.userAvatar.includes("dicebear.com") && !rev.userAvatar.includes("images.unsplash.com") ? (
                            <img
                              src={rev.userAvatar}
                              alt={rev.userName}
                              className="w-7 h-7 rounded-full object-cover border border-slate-200 shrink-0"
                            />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-linear-to-br from-[#1683FF] to-[#0E5FCC] text-white flex items-center justify-center font-bold text-[10px] shrink-0 shadow-2xs">
                              {((rev.userName || "U").trim()[0] || "U").toUpperCase()}
                            </div>
                          )}
                          <div>
                            <span className="font-bold text-xs text-slate-900 block leading-tight">
                              {rev.userName}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {rev.date}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-0.5">
                          {[...Array(Number(rev.rating) || 5)].map((_, i) => (
                            <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-slate-600 pl-9.5 leading-relaxed">
                        {rev.comment}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-6 text-center text-slate-400 space-y-1.5">
                  <Star className="w-7 h-7 mx-auto text-slate-300" />
                  <p className="text-xs font-bold text-slate-700">Belum Ada Ulasan</p>
                  <p className="text-[11px] text-slate-400">
                    Belum ada ulasan untuk layanan ini. Jadilah pelanggan pertama yang memesan!
                  </p>
                </div>
              )}
            </div>

          </div>

          {/* ============================================================ */}
          {/* KOLOM KANAN (5 Kolom): STICKY CHECKOUT PANEL (MIRIP SEWA)   */}
          {/* ============================================================ */}
          <div className="lg:col-span-5 lg:sticky lg:top-24">
            <div className="bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl p-4 sm:p-7 shadow-xs space-y-4 sm:space-y-5">
              
              {/* Header Box Checkout */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <h3 className="font-black text-sm sm:text-base text-slate-900">
                  Checkout Pesanan Jasa
                </h3>
                <span className="text-[10px] sm:text-[11px] font-bold text-[#1683FF] bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100 shrink-0">
                  Pembayaran Terverifikasi
                </span>
              </div>

              {/* Preview Produk & Penyedia */}
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50/80 border border-slate-100">
                <img
                  src={service.image}
                  alt={service.title}
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl object-cover border border-slate-200 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <h4 className="font-bold text-xs sm:text-sm text-slate-900 leading-snug break-words line-clamp-2">
                    {service.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">
                    Oleh: <span className="font-semibold text-slate-700">{service.provider.name}</span>
                  </p>
                </div>
              </div>

              {/* Rincian Paket Terpilih */}
              <div className="p-3 sm:p-3.5 rounded-2xl bg-blue-50/60 border border-blue-100 space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block">
                  Paket yang Dipilih:
                </span>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <span className="font-extrabold text-xs sm:text-sm text-slate-900 break-words">
                    {activePkg.name}
                  </span>
                  <span className="font-black text-sm sm:text-base text-[#1683FF] shrink-0 text-left sm:text-right">
                    {formatIDR(activePkg.price)} {activePkg.unit || service.unit ? (activePkg.unit || service.unit) : ""}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 pt-0.5">
                  Estimasi durasi: {activePkg.duration || service.deliveryDuration || "1-2 Hari Kerja"}
                </div>
              </div>

              {/* Form Input Pesanan */}
              {!isOrderedSuccess ? (
                <form onSubmit={handleCheckout} className="space-y-3.5 sm:space-y-4">

                  {/* Pilihan Metode jika Jasa bertipe Hybrid */}
                  {baseLocationType === "hybrid" && (
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-800">
                        Pilih Metode Pelaksanaan:
                      </label>
                      <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-xl">
                        <button
                          type="button"
                          onClick={() => setHybridChoice("onsite")}
                          className={`py-2 px-1 text-center rounded-lg text-[11px] font-bold transition flex flex-col items-center gap-0.5 ${
                            hybridChoice === "onsite"
                              ? "bg-white text-[#1683FF] shadow-xs"
                              : "text-slate-600 hover:text-slate-900"
                          }`}
                        >
                          <Building2 className="w-3.5 h-3.5 shrink-0" />
                          <span className="leading-tight">Klien Datang</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setHybridChoice("customer_location")}
                          className={`py-2 px-1 text-center rounded-lg text-[11px] font-bold transition flex flex-col items-center gap-0.5 ${
                            hybridChoice === "customer_location"
                              ? "bg-white text-[#1683FF] shadow-xs"
                              : "text-slate-600 hover:text-slate-900"
                          }`}
                        >
                          <MapPin className="w-3.5 h-3.5 shrink-0" />
                          <span className="leading-tight">Mitra Datang</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setHybridChoice("online")}
                          className={`py-2 px-1 text-center rounded-lg text-[11px] font-bold transition flex flex-col items-center gap-0.5 ${
                            hybridChoice === "online"
                              ? "bg-white text-[#1683FF] shadow-xs"
                              : "text-slate-600 hover:text-slate-900"
                          }`}
                        >
                          <Globe className="w-3.5 h-3.5 shrink-0" />
                          <span className="leading-tight">100% Online</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Badge Tipe Metode Pelaksanaan Jasa */}
                  <div className={`flex items-center gap-2.5 px-3 py-2 rounded-2xl text-xs font-bold border ${
                    isDigitalService
                      ? "bg-blue-50 text-blue-700 border-blue-200/80"
                      : isOnsite
                      ? "bg-emerald-50 text-emerald-800 border-emerald-200/80"
                      : "bg-amber-50 text-amber-800 border-amber-200/80"
                  }`}>
                    {isDigitalService ? (
                      <Globe className="w-4 h-4 shrink-0 text-blue-600" />
                    ) : isOnsite ? (
                      <Building2 className="w-4 h-4 shrink-0 text-emerald-600" />
                    ) : (
                      <MapPin className="w-4 h-4 shrink-0 text-amber-600" />
                    )}
                    <span className="min-w-0 break-words">
                      {isDigitalService
                        ? "100% Online — Pengerjaan Digital & Pengiriman Berkas Jarak Jauh"
                        : isOnsite
                        ? "Klien Datang — Anda Berkunjung Langsung ke Lokasi Tempat Mitra"
                        : "Mitra Datang — Layanan Panggilan, Mitra Hadir ke Lokasi Anda"}
                    </span>
                  </div>

                  {/* Tanggal Pelaksanaan / Deadline */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      {isDigitalService
                        ? "Target Deadline Selesai:"
                        : isOnsite
                        ? "Tanggal Kedatangan ke Lokasi Mitra:"
                        : "Tanggal Kunjungan Mitra ke Lokasi Anda:"}
                    </label>
                    <div className="relative">
                      <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 shrink-0" />
                      <input
                        type="date"
                        required
                        value={targetDate}
                        onChange={(e) => setTargetDate(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 outline-none focus:border-[#1683FF] focus:ring-2 focus:ring-[#1683FF]/15 transition bg-white"
                      />
                    </div>
                  </div>

                  {/* ── KONDISI 1: KLIEN DATANG KE LOKASI MITRA (ONSITE) ── */}
                  {isOnsite && (
                    <>
                      {/* Jam Kedatangan */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-xs font-bold text-slate-800">
                            Jam Kedatangan yang Anda Pilih:
                          </label>
                          <span className="text-[11px] font-bold text-[#1683FF]">
                            {targetTime} WIB
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="relative w-full sm:w-36 shrink-0">
                            <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 shrink-0" />
                            <input
                              type="time"
                              required
                              value={targetTime}
                              onChange={(e) => setTargetTime(e.target.value)}
                              className="w-full pl-9 pr-2 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 outline-none focus:border-[#1683FF] focus:ring-2 focus:ring-[#1683FF]/15 transition bg-white font-bold"
                            />
                          </div>
                          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5 flex-1 min-w-0">
                            {["08:00", "10:00", "13:00", "15:00", "17:00"].map((preset) => (
                              <button
                                key={preset}
                                type="button"
                                onClick={() => setTargetTime(preset)}
                                className={`px-2 py-1.5 rounded-lg text-[11px] font-bold transition cursor-pointer border shrink-0 ${
                                  targetTime === preset
                                    ? "bg-[#1683FF] text-white border-[#1683FF]"
                                    : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                                }`}
                              >
                                {preset}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Box Info Lokasi Tempat Mitra (Klien Cukup Melihat & Mengunjungi) */}
                      <div className="p-3 sm:p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 space-y-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                              <Building2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span>Lokasi Tempat Mitra Terdaftar</span>
                            </h4>
                            <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                              {service.address || service.provider?.partnerAddress || service.provider?.address || service.provider?.location || "Alamat pengerjaan mitra terdaftar di sistem Bantuin."}
                            </p>
                          </div>

                          {(service.latitude && service.longitude) ? (
                            <a
                              href={`https://www.google.com/maps/dir/?api=1&destination=${service.latitude},${service.longitude}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white hover:bg-emerald-100 text-emerald-800 text-[11px] font-bold border border-emerald-300 transition shrink-0 cursor-pointer shadow-2xs"
                            >
                              <span>Buka Peta</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (service.address || service.provider?.address) ? (
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(service.address || service.provider?.address)}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white hover:bg-emerald-100 text-emerald-800 text-[11px] font-bold border border-emerald-300 transition shrink-0 cursor-pointer shadow-2xs"
                            >
                              <span>Buka Peta</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : null}
                        </div>

                        {service.latitude && service.longitude && (
                          <div className="flex items-center gap-1.5 text-emerald-900 text-[10px] bg-white/80 px-2.5 py-1 rounded-lg border border-emerald-200 font-mono">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                            <span>Koordinat GPS Mitra: {Number(service.latitude).toFixed(5)}, {Number(service.longitude).toFixed(5)}</span>
                          </div>
                        )}

                        <div className="text-[11px] text-emerald-800 flex items-start gap-1.5 pt-0.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span>Anda cukup hadir langsung ke tempat mitra sesuai jadwal yang Anda pilih di atas.</span>
                        </div>
                      </div>
                    </>
                  )}

                  {/* ── KONDISI 2: MITRA DATANG KE LOKASI KLIEN (CUSTOMER_LOCATION / PANGGILAN) ── */}
                  {isCustomerLoc && (
                    <>
                      {/* Jam Kunjungan */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-xs font-bold text-slate-800">
                            Jam Kunjungan Mitra:
                          </label>
                          <span className="text-[11px] font-bold text-[#1683FF]">
                            {targetTime} WIB
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="relative w-full sm:w-36 shrink-0">
                            <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 shrink-0" />
                            <input
                              type="time"
                              required
                              value={targetTime}
                              onChange={(e) => setTargetTime(e.target.value)}
                              className="w-full pl-9 pr-2 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 outline-none focus:border-[#1683FF] focus:ring-2 focus:ring-[#1683FF]/15 transition bg-white font-bold"
                            />
                          </div>
                          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5 flex-1 min-w-0">
                            {["07:00", "09:00", "11:00", "14:00", "16:00"].map((preset) => (
                              <button
                                key={preset}
                                type="button"
                                onClick={() => setTargetTime(preset)}
                                className={`px-2 py-1.5 rounded-lg text-[11px] font-bold transition cursor-pointer border shrink-0 ${
                                  targetTime === preset
                                    ? "bg-[#1683FF] text-white border-[#1683FF]"
                                    : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                                }`}
                              >
                                {preset}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Interactive Map & Titik Lokasi Pemesan */}
                      <div className="space-y-3 p-3 sm:p-4 rounded-2xl bg-slate-50/80 border border-slate-200/90">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-slate-200/60">
                          <div>
                            <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-[#1683FF] shrink-0" />
                              <span>Titik Lokasi Pemesanan Anda</span>
                              <span className="text-red-500">*</span>
                            </h4>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              Tentukan titik di peta agar mitra dapat langsung menuju ke alamat Anda dengan presisi.
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={handleUseMyGPS}
                            disabled={isDetectingGPS}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1683FF] hover:text-[#0F6FE5] bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-xl border border-blue-200/80 transition cursor-pointer self-start sm:self-auto shrink-0"
                          >
                            {isDetectingGPS ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                                <span>Mendeteksi GPS...</span>
                              </>
                            ) : (
                              <>
                                <Navigation className="w-3.5 h-3.5 shrink-0" />
                                <span>Gunakan GPS Saya</span>
                              </>
                            )}
                          </button>
                        </div>

                        {/* Peta Pin Picker */}
                        <div>
                          <LocationPickerMap
                            latitude={coords?.latitude || -7.4243}
                            longitude={coords?.longitude || 109.2304}
                            onChange={handleMapLocationChange}
                            onAddressResolved={(resolvedAddr) => {
                              if (resolvedAddr) {
                                setAlamat(resolvedAddr);
                              }
                            }}
                            onGeocodingStateChange={setIsReverseGeocoding}
                            height="200px"
                          />

                          <div className="mt-2 flex flex-wrap items-center justify-between gap-1.5 text-[11px]">
                            <div className="flex items-center gap-1.5 text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/80 font-medium">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
                              <span className="truncate">
                                Pin Terkunci: {coords ? `${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}` : "Belum ditentukan"}
                              </span>
                            </div>

                            {isReverseGeocoding ? (
                              <div className="text-[#1683FF] font-bold inline-flex items-center gap-1 animate-pulse shrink-0">
                                <Loader2 className="w-3 h-3 animate-spin shrink-0" />
                                <span>Alamat terisi otomatis...</span>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={handleSyncAddressFromCoords}
                                className="text-[#1683FF] hover:text-[#0F6FE5] font-bold hover:underline inline-flex items-center gap-1 cursor-pointer shrink-0"
                              >
                                <span>Sinkron Alamat dari Pin Peta</span>
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Alamat Terisi Otomatis & Patokan */}
                        <div className="space-y-2 pt-1">
                          <div>
                            <label className="block text-xs font-bold text-slate-800 mb-1">
                              <span className="text-red-500">*</span> Alamat Lengkap:
                            </label>
                            <textarea
                              rows={2}
                              required
                              value={alamat}
                              onChange={(e) => setAlamat(e.target.value)}
                              placeholder="Alamat akan terisi otomatis dari titik peta, atau ketik langsung di sini..."
                              className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-[#1683FF] focus:ring-2 focus:ring-[#1683FF]/15 transition resize-none bg-white"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                              Patokan / Detail Khusus (Opsional):
                            </label>
                            <input
                              type="text"
                              value={patokan}
                              onChange={(e) => setPatokan(e.target.value)}
                              placeholder="Contoh: Kamar 3B, pagar hitam, samping mini market..."
                              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-[#1683FF] focus:ring-2 focus:ring-[#1683FF]/15 transition bg-white"
                            />
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {/* ── KONDISI 3: 100% ONLINE / DIGITAL (PENGERJAAN JARAK JAUH) ── */}
                  {isDigitalService && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-800 mb-1">
                          <span className="text-red-500">*</span> Brief &amp; Rincian Kebutuhan:
                        </label>
                        <textarea
                          rows={3}
                          required
                          value={brief}
                          onChange={(e) => setBrief(e.target.value)}
                          placeholder="Jelaskan kebutuhan, referensi gaya, spesifikasi file yang diinginkan, atau catatan pengerjaan..."
                          className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-[#1683FF] focus:ring-2 focus:ring-[#1683FF]/15 transition resize-none bg-white"
                        />
                      </div>
                    </div>
                  )}

                  {/* Catatan Tambahan — semua tipe jasa */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Catatan Tambahan (Opsional):
                    </label>
                    <textarea
                      rows={2}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Catatan atau instruksi tambahan (opsional)..."
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-[#1683FF] focus:ring-2 focus:ring-[#1683FF]/15 transition resize-none bg-white"
                    />
                  </div>

                  {/* Rincian Transparansi Biaya */}
                  <div className="pt-3 border-t border-slate-100 space-y-1.5 text-xs">
                    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 text-slate-600">
                      <span className="min-w-0 break-words">Tarif Layanan ({activePkg.name})</span>
                      <span className="font-semibold text-slate-900 text-right whitespace-nowrap">{formatIDR(activePkg.price)}</span>
                    </div>
                    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 text-slate-500 text-[11px]">
                      <span className="min-w-0 break-words">Potongan Platform Bantuin (8%)</span>
                      <span className="text-slate-700 font-medium text-right">-{formatIDR(platformFee)} (ditanggung mitra)</span>
                    </div>
                    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 text-slate-500 text-[11px]">
                      <span className="min-w-0 break-words">Biaya Sistem Terverifikasi</span>
                      <span className="text-emerald-600 font-bold text-right whitespace-nowrap">Gratis (Rp 0)</span>
                    </div>
                    <div className="pt-2.5 border-t border-slate-200/90 flex items-center justify-between gap-3 mt-1">
                      <div className="min-w-0">
                        <span className="font-black text-xs sm:text-sm text-slate-900 block">Total Pembayaran</span>
                        <span className="text-[10px] text-slate-400 font-normal block leading-tight">Diproses via Payment Gateway Resmi</span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[#1683FF] text-xl sm:text-2xl font-black tracking-tight whitespace-nowrap block">
                          {formatIDR(activePkg.price)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Jaminan Pembayaran */}
                  <div className="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-100 flex items-start gap-2.5 text-[11px] text-emerald-800 leading-snug">
                    <Lock className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="min-w-0 break-words">
                      <strong>Pembayaran Terverifikasi:</strong> Hak pembayaran mitra baru dapat dicairkan setelah pekerjaan selesai dan Anda konfirmasi tuntas.
                    </span>
                  </div>

                  {/* Tombol Lanjut */}
                  {/* Tombol Lanjut */}
                  <div className="pt-1 space-y-2">
                    <button
                      type="submit"
                      className="w-full py-3.5 rounded-xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white font-bold text-xs sm:text-sm transition shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Lock className="w-4 h-4 shrink-0" />
                      <span>Lanjut ke Pembayaran (Bayar Dulu)</span>
                      <ChevronRight className="w-4 h-4 shrink-0" />
                    </button>
                    <button
                      type="button"
                      onClick={handleStartChat}
                      className="w-full py-2.5 rounded-xl border border-slate-200 hover:border-[#1683FF] text-slate-700 hover:text-[#1683FF] font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer text-center"
                    >
                      <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                      <span>Tanya / Konsultasi via Chat</span>
                    </button>
                  </div>

                </form>
              ) : (
                /* State Berhasil Checkout */
                <div className="text-center py-6 space-y-3 animate-in fade-in duration-200">
                  <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                  <h4 className="font-bold text-base text-slate-900">
                    Pesanan Jasa Berhasil Dibuat!
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed px-2">
                    Mitra penyedia telah menerima rincian pesanan Anda dan akan segera mengonfirmasi jadwal pengerjaan.
                  </p>
                  <div className="pt-3 space-y-2">
                    <Link
                      href="/activity"
                      className="block w-full py-2.5 rounded-xl bg-[#1683FF] text-white font-bold text-xs hover:bg-[#0F6FE5] transition"
                    >
                      Lihat Aktivitas &amp; Status Pesanan
                    </Link>
                    <button
                      type="button"
                      onClick={() => setIsOrderedSuccess(false)}
                      className="text-xs font-semibold text-slate-500 hover:underline"
                    >
                      Pesan Layanan Lain
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>

        </div>

      </main>

      <Footer />
    </div>
  );
}
