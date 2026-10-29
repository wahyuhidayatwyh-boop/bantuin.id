"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import RoleGuard from "@/components/auth/RoleGuard";
import { useApp } from "@/lib/context/AppContext";
import { getProviderById, saveProviderData } from "@/lib/mock/providersData";
import { formatIDR } from "@/lib/utils";
import { resolveCategoryIcon } from "@/lib/services/categoryService";
import { authService } from "@/lib/services/authService";
import { 
  ArrowLeft, 
  Layers, 
  Edit3, 
  Trash2, 
  Rocket, 
  MapPin, 
  Star, 
  Clock, 
  CheckCircle2, 
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  FileText,
  DollarSign,
  Calendar,
  Eye,
  Check,
  X,
  Loader2,
  Package
} from "lucide-react";

export default function DetailKatalogJasaPage() {
  const { id } = useParams();
  const router = useRouter();
  const { currentUser, addToast } = useApp() || {};

  const [provider, setProvider] = useState(() => {
    return currentUser || {};
  });

  const [service, setService] = useState(null);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setProvider(currentUser);
    }
  }, [currentUser]);

  // Fetch service from DB or local provider
  useEffect(() => {
    let isMounted = true;

    const loadService = async () => {
      setIsLoading(true);
      // 1. Try local provider catalog first
      const p = currentUser?.id ? (getProviderById(currentUser.id) || currentUser) : currentUser;
      const localService = (p?.catalog || []).find((s) => s.id === id);
      if (localService && isMounted) {
        const localPhotos = (localService.portfolioUrls && localService.portfolioUrls.length > 0)
          ? localService.portfolioUrls
          : (localService.photos && localService.photos.length > 0 ? localService.photos : [localService.image]);
        setService({
          ...localService,
          photos: localPhotos,
          packages: localService.packages || [],
          pricingMode: localService.pricingMode || (localService.packages?.length > 1 ? "tiered" : "single"),
        });
      }

      // 2. Fetch from DB
      if (id) {
        try {
          const res = await fetch(`/api/services/${id}`);
          if (res.ok) {
            const resJson = await res.json();
            if (resJson.success && resJson.data && isMounted) {
              const s = resJson.data;
              const dbPhotos = (s.portfolioUrls && s.portfolioUrls.length > 0)
                ? s.portfolioUrls
                : (s.photos && s.photos.length > 0 ? s.photos : [s.image || "https://images.unsplash.com/photo-1626785774573-4b799315345d?auto=format&fit=crop&w=800&q=80"]);
              setService({
                id: s.id,
                title: s.title,
                category: s.category,
                price: Number(s.startingPrice) || 0,
                unit: "/ proyek",
                packages: Array.isArray(s.packages) ? s.packages : [],
                pricingMode: (Array.isArray(s.packages) && s.packages.length > 1) ? "tiered" : "single",
                image: dbPhotos[0],
                photos: dbPhotos,
                desc: s.description || "",
                skills: s.tags || [],
                status: "active",
                locationType: s.locationType || s.location_type || "hybrid",
                latitude: s.latitude !== null && s.latitude !== undefined ? s.latitude : (s.provider?.latitude || -7.4112),
                longitude: s.longitude !== null && s.longitude !== undefined ? s.longitude : (s.provider?.longitude || 109.2458),
                address: s.address || s.provider?.campusName || s.provider?.partnerAddress || "",
                deliveryDuration: s.packages?.[0]?.duration || "1-2 Hari Kerja",
                views: 0,
                orders: s.ordersCount || 0,
                rating: Number(s.ratingAvg) || 0,
                ratingCount: s.ratingCount || 0,
                createdAt: s.createdAt,
              });
            }
          }
        } catch (err) {
          console.warn("Could not fetch service from DB:", err);
        }
      }

      if (isMounted) {
        setIsLoading(false);
      }
    };

    loadService();

    return () => {
      isMounted = false;
    };
  }, [id, currentUser]);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const token = await authService.getValidAccessToken();
      await fetch(`/api/services/${id}`, {
        method: "DELETE",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (currentUser?.id) {
        const p = getProviderById(currentUser.id) || currentUser;
        const updatedCatalog = (p.catalog || []).filter((s) => s.id !== id);
        const updatedProvider = { ...p, catalog: updatedCatalog };
        saveProviderData(updatedProvider);
        setProvider(updatedProvider);
      }

      window.dispatchEvent(new Event("bantuin_service_updated"));
      addToast?.("Layanan Dihapus", `Layanan "${service?.title || 'Jasa'}" berhasil dihapus dari katalog.`);
      router.push("/jasa/dashboard");
    } catch (err) {
      console.error("Gagal menghapus layanan:", err);
      addToast?.("Gagal Menghapus", err.message || "Gagal menghapus layanan dari database.", "error");
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  if (isLoading && !service) {
    return (
      <RoleGuard allowedRoles={["provider"]}>
        <div className="min-h-screen bg-[#F4F7FB] flex flex-col items-center justify-center p-6 text-center">
          <Loader2 className="w-8 h-8 text-[#1683FF] animate-spin mb-3" />
          <p className="text-xs font-bold text-slate-500">Memuat rincian layanan...</p>
        </div>
      </RoleGuard>
    );
  }

  if (!service) {
    return (
      <RoleGuard allowedRoles={["provider"]}>
        <div className="min-h-screen bg-[#F4F7FB] flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-3xl bg-blue-50 text-[#1683FF] flex items-center justify-center mb-4">
            <Layers className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900">Layanan Jasa Tidak Ditemukan</h2>
          <p className="text-xs text-slate-500 mt-1 max-w-sm">
            Layanan dengan ID <code className="font-mono bg-slate-200 px-1 py-0.5 rounded">{id}</code> tidak terdaftar di katalog Anda.
          </p>
          <Link
            href="/jasa/dashboard"
            className="mt-5 px-5 py-2.5 rounded-2xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white text-xs font-bold transition flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Katalog Dashboard</span>
          </Link>
        </div>
      </RoleGuard>
    );
  }

  const CategoryIconComp = resolveCategoryIcon(service.category);

  return (
    <RoleGuard allowedRoles={["provider"]}>
      <div className="min-h-screen bg-[#F4F7FB] pb-24">
        {/* Header & Breadcrumb */}
        <div className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1 overflow-x-auto whitespace-nowrap scrollbar-none py-0.5 max-w-full">
                <Link href="/jasa/dashboard" className="hover:text-[#1683FF] transition font-medium shrink-0">
                  Dashboard
                </Link>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <Link href="/jasa/dashboard" className="hover:text-[#1683FF] transition font-medium shrink-0">
                  Katalog Layanan
                </Link>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="text-slate-900 font-bold truncate max-w-[200px] shrink-0">{service.title}</span>
              </div>
              <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 flex items-center gap-2">
                <span>Rincian Layanan Katalog</span>
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/jasa/dashboard"
                className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Kembali</span>
              </Link>

              <Link
                href={`/jasa/dashboard/katalog/${service.id}/edit`}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition flex items-center gap-1.5 shadow-2xs"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Layanan</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
          
          {/* Main Hero Card */}
          <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/90 shadow-xs">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
              {/* Image Preview */}
              <div className="md:col-span-1 space-y-2.5">
                <div className="aspect-4/3 rounded-2xl overflow-hidden border border-slate-200 relative group bg-slate-100">
                  <img
                    src={(service.photos && service.photos[activePhotoIndex]) || service.image}
                    alt={service.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                  <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-xs text-white text-[10px] font-bold flex items-center gap-1">
                    <CategoryIconComp className="w-3 h-3 text-blue-300" />
                    <span>{service.category}</span>
                  </div>
                  {service.photos && service.photos.length > 1 && (
                    <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-xs text-white text-[10px] font-bold">
                      {activePhotoIndex + 1} / {service.photos.length}
                    </div>
                  )}
                </div>

                {/* Thumbnails if > 1 photo */}
                {service.photos && service.photos.length > 1 && (
                  <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                    {service.photos.map((pUrl, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setActivePhotoIndex(idx)}
                        className={`relative w-12 h-12 rounded-xl overflow-hidden shrink-0 border-2 transition cursor-pointer ${
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

              {/* Service Info */}
              <div className="md:col-span-2 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-extrabold border border-emerald-200/60 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Status: Aktif di Katalog Publik</span>
                  </span>

                  <span className="text-xs text-slate-400 font-mono">
                    ID: {service.id}
                  </span>
                </div>

                <h2 className="text-lg sm:text-2xl font-black text-slate-900 leading-snug">
                  {service.title}
                </h2>

                <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs font-bold text-slate-500 uppercase">
                      {Array.isArray(service.packages) && service.packages.length > 1 ? "Tarif Mulai Dari:" : "Tarif:"}
                    </span>
                    <span className="text-xl sm:text-2xl font-black text-[#1683FF]">
                      {formatIDR(service.price)}
                    </span>
                    <span className="text-xs font-bold text-slate-600">
                      {service.unit || "/ proyek"}
                    </span>
                  </div>
                  {Array.isArray(service.packages) && service.packages.length > 1 && (
                    <span className="px-2.5 py-1 rounded-lg bg-blue-100 text-[#1683FF] text-[11px] font-extrabold uppercase tracking-wide self-start sm:self-auto">
                      Paket Bertingkat ({service.packages.length} Pilihan)
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1.5">
                    Deskripsi Layanan
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                    {service.desc || "Belum ada deskripsi khusus untuk layanan ini."}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Daftar Paket Layanan (Jika Layanan Memiliki Paket Bertingkat) */}
          {Array.isArray(service.packages) && service.packages.length > 1 && (
            <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/90 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2">
                    <Package className="w-4 h-4 text-[#1683FF]" />
                    <span>Daftar Paket Bertingkat Layanan</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Pilihan paket yang dapat dipilih langsung oleh calon klien saat melakukan pemesanan.
                  </p>
                </div>
                <span className="text-xs font-bold text-[#1683FF] bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100 self-start sm:self-auto shrink-0">
                  {service.packages.length} Tingkatan Paket Aktif
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {service.packages.map((pkg, idx) => (
                  <div
                    key={pkg.id || idx}
                    className={`rounded-2xl p-4.5 border-2 flex flex-col justify-between relative transition ${
                      pkg.isPopular
                        ? "border-[#1683FF] bg-blue-50/20 shadow-xs ring-2 ring-blue-100"
                        : "border-slate-200 bg-white"
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                          pkg.tier === "Basic"
                            ? "bg-amber-100 text-amber-800"
                            : pkg.tier === "Standard"
                            ? "bg-blue-100 text-[#1683FF]"
                            : "bg-purple-100 text-purple-800"
                        }`}>
                          {pkg.tier || `Tier ${idx + 1}`}
                        </span>

                        {pkg.isPopular && (
                          <span className="px-2 py-0.5 rounded-md bg-amber-400 text-amber-950 font-black text-[10px] flex items-center gap-0.5 shadow-2xs">
                            <Star className="w-2.5 h-2.5 fill-current" />
                            <span>Paling Diminati</span>
                          </span>
                        )}
                      </div>

                      <div>
                        <h4 className="text-sm font-extrabold text-slate-900">
                          {pkg.name || `Paket ${pkg.tier}`}
                        </h4>
                        <div className="text-lg font-black text-[#1683FF] mt-1">
                          {formatIDR(pkg.price)}
                        </div>
                      </div>

                      {pkg.duration && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-100 font-medium">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>Pengerjaan: {pkg.duration}</span>
                        </div>
                      )}

                      {pkg.description && (
                        <p className="text-xs text-slate-600 leading-relaxed">
                          {pkg.description}
                        </p>
                      )}

                      {Array.isArray(pkg.features) && pkg.features.length > 0 && (
                        <div className="space-y-1.5 pt-2 border-t border-slate-100">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            Fitur Paket:
                          </span>
                          <ul className="space-y-1">
                            {pkg.features.map((feat, fIdx) => (
                              <li key={fIdx} className="text-xs text-slate-700 flex items-start gap-1.5">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                <span>{feat}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Details Metadata & Location */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Lokasi & Mode */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-xs space-y-4">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#1683FF]" />
                <span>Mode &amp; Lokasi Pengerjaan</span>
              </h3>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-500 font-medium">Tipe Layanan:</span>
                  <span className="font-bold text-slate-900 capitalize">
                    {service.locationType === "onsite" ? "Klien Datang ke Lokasi Mitra" :
                     service.locationType === "customer_location" ? "Mitra Datang ke Lokasi Klien" :
                     service.locationType === "online" ? "100% Online / Digital" : "Hybrid (Online / Tatap Muka)"}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <span className="text-slate-500 font-medium block">Alamat / Patokan Lokasi:</span>
                  <span className="font-semibold text-slate-800 block">
                    {service.address || provider.address || "Lokasi Mitra Terdaftar"}
                  </span>
                </div>

                {service.latitude && service.longitude && (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 font-mono text-[11px]">
                    <span className="text-slate-500">Koordinat GPS:</span>
                    <span className="font-bold text-slate-800">
                      {service.latitude}, {service.longitude}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions & Promosi */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-xs space-y-4">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Rocket className="w-4 h-4 text-[#1683FF]" />
                <span>Aksi &amp; Promosi Layanan</span>
              </h3>

              <p className="text-xs text-slate-500 leading-relaxed">
                Tingkatkan keterlihatan layanan ini di posisi teratas pencarian dengan paket promosi berbayar resmi Bantuin.
              </p>

              <div className="space-y-2.5 pt-1">
                <Link
                  href={`/jasa/dashboard/promosi/buat?serviceId=${service.id}`}
                  className="w-full p-3 rounded-2xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs"
                >
                  <Rocket className="w-4 h-4" />
                  <span>Promosikan Layanan Ini Sekarang</span>
                </Link>

                <div className="grid grid-cols-2 gap-2.5">
                  <Link
                    href={`/jasa/dashboard/katalog/${service.id}/edit`}
                    className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-800 text-xs font-bold transition flex items-center justify-center gap-1.5"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                    <span>Edit Data</span>
                  </Link>

                  <button
                    type="button"
                    onClick={() => setIsDeleteModalOpen(true)}
                    className="p-2.5 rounded-xl border border-rose-200 bg-rose-50/50 hover:bg-rose-100/60 text-rose-600 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus Layanan</span>
                  </button>
                </div>
              </div>
            </div>

          </div>
        </main>

        {/* Modal Konfirmasi Hapus */}
        {isDeleteModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-7 h-7" />
              </div>

              <div>
                <h3 className="text-base font-extrabold text-slate-900">Hapus Layanan dari Katalog?</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Apakah Anda yakin ingin menghapus layanan <span className="font-bold text-slate-800">&ldquo;{service.title}&rdquo;</span>? Tindakan ini tidak dapat dibatalkan.
                </p>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition"
                >
                  {isDeleting ? "Menghapus..." : "Ya, Hapus"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
