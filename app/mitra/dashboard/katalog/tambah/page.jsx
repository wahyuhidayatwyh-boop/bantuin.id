"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import RoleGuard from "@/components/auth/RoleGuard";
import { useApp } from "@/lib/context/AppContext";
import { getMitraStoreById, saveMitraStoreData } from "@/lib/mock/mitraData";
import { imageService } from "@/lib/services/imageService";
import { authService } from "@/lib/services/authService";
import { formatIDR } from "@/lib/utils";
import { saveFormDraft, getFormDraft, clearFormDraft, useBeforeUnload } from "@/lib/hooks/useFormDraft";
import { 
  ArrowLeft, 
  Package, 
  Upload, 
  Loader2, 
  ChevronRight,
  Plus,
  Trash2,
  Star,
  Check,
  ShieldCheck,
  DollarSign,
  CheckCircle2,
  Camera,
  Layers,
  Clock
} from "lucide-react";

const DRAFT_KEY = "bantuin_draft_mitra_katalog_tambah";

const DEFAULT_FORM_DATA = {
  name: "",
  category: "Kamera",
  customCategory: "",
  pricingMode: "single", // 'single' atau 'tiered'
  price: 150000,
  depositAmount: 100000,
  unit: "/ hari",
  image: "",
  photos: [],
  stockStatus: "Siap Sewa",
  tag: "Unit Baru",
  desc: "",
  stockCount: 1,
  includedItems: "",
  securityDeposit: "Wajib menitipkan 1 identitas asli (KTP/KTM) & verifikasi akun Bantuin",
  tieredPackages: [
    {
      id: "pkg-basic",
      name: "Paket Unit Standar",
      tier: "Basic",
      price: 120000,
      depositAmount: 100000,
      duration: "1 Hari (24 Jam)",
      description: "Pilihan sewa unit esensial untuk kebutuhan harian atau tugas singkat.",
      featuresStr: "1x Unit Utama Siap Pakai\n1x Baterai & Charger Original\nTas Pelindung",
      isPopular: false,
    },
    {
      id: "pkg-standard",
      name: "Paket Lengkap Event",
      tier: "Standard",
      price: 200000,
      depositAmount: 150000,
      duration: "2 Hari Penuh",
      description: "Set peralatan lengkap dengan perlengkapan cadangan untuk liputan & acara.",
      featuresStr: "1x Unit Utama Siap Pakai\n2x Baterai Cadangan & Dual Charger\n1x Memory Card / Storage High Speed\nTas Waterproof & Aksesoris Tambahan",
      isPopular: true,
    },
    {
      id: "pkg-pro",
      name: "Paket Borongan Pro",
      tier: "Lengkap/Pro",
      price: 350000,
      depositAmount: 250000,
      duration: "3 Hari Penuh",
      description: "Set komplit borongan untuk produksi film, wisuda, atau dokumentasi skala besar.",
      featuresStr: "Set Unit Utama + Aksesoris Lengkap\n3x Baterai & Aksesoris Ekstra\nGaransi unit pengganti darurat jika kendala",
      isPopular: false,
    },
  ],
};

export default function TambahKatalogRentalPage() {
  const router = useRouter();
  const { setRentals, refreshRentals, addToast, currentUser } = useApp() || {};

  const [store, setStore] = useState(() => {
    if (currentUser?.id) {
      return getMitraStoreById(currentUser.id) || {
        id: currentUser.id,
        name: currentUser.partnerBusinessName || currentUser.fullName || "Toko Mitra",
        address: currentUser.partnerAddress || currentUser.campusName || "Indonesia",
        catalog: currentUser.rentals || []
      };
    }
    return getMitraStoreById("mitra-kamera") || {};
  });

  useEffect(() => {
    if (currentUser?.id) {
      const s = getMitraStoreById(currentUser.id);
      if (s) setStore(s);
    }
  }, [currentUser?.id]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [newPhotoUrlInput, setNewPhotoUrlInput] = useState("");

  // Form State with draft persistence
  const [formData, setFormData] = useState(() => {
    const saved = getFormDraft(DRAFT_KEY, null);
    if (!saved) return DEFAULT_FORM_DATA;
    // Clean any legacy dummy unsplash photos from saved draft
    const cleanPhotos = Array.isArray(saved.photos)
      ? saved.photos.filter((p) => !String(p).includes("images.unsplash.com"))
      : [];
    const cleanImage = saved.image && !saved.image.includes("images.unsplash.com") ? saved.image : (cleanPhotos[0] || "");
    return {
      ...DEFAULT_FORM_DATA,
      ...saved,
      photos: cleanPhotos,
      image: cleanImage,
      tieredPackages: saved.tieredPackages && saved.tieredPackages.length > 0 ? saved.tieredPackages : DEFAULT_FORM_DATA.tieredPackages,
    };
  });

  useEffect(() => {
    saveFormDraft(DRAFT_KEY, formData);
  }, [formData]);

  const isDirty = Boolean(formData.name.trim());
  useBeforeUnload(isDirty, "Ada data pengisian unit rental yang belum disimpan. Yakin ingin meninggalkan halaman?");

  const categoryPresets = [
    "Kamera",
    "Lensa",
    "Stabilizer",
    "Lighting",
    "Audio",
    "Drone",
    "Paket Studio",
    "Outdoor",
    "Perkakas & Elektronik",
    "__CUSTOM__"
  ];

  // Hitung tarif terendah saat mode paket bertingkat aktif
  const calculatedLowestPrice = useMemo(() => {
    if (formData.pricingMode !== "tiered" || !formData.tieredPackages?.length) {
      return Number(formData.price) || 0;
    }
    const prices = formData.tieredPackages.map((p) => Number(p.price) || 0).filter((p) => p > 0);
    return prices.length > 0 ? Math.min(...prices) : Number(formData.price) || 0;
  }, [formData.pricingMode, formData.tieredPackages, formData.price]);

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setIsUploadingPhoto(true);
    try {
      const urls = await imageService.uploadImages(files, "rental");
      setFormData((prev) => {
        const combined = [...(prev.photos || []), ...urls];
        return { ...prev, photos: combined, image: combined[0] || prev.image };
      });
      addToast?.("Foto Berhasil Diunggah", `${urls.length} foto unit berhasil ditambahkan.`);
    } catch (err) {
      addToast?.("Gagal Upload", err.message || "Gagal mengunggah foto.", "error");
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleAddPhotoByUrl = () => {
    if (!newPhotoUrlInput.trim()) return;
    const url = newPhotoUrlInput.trim();
    setFormData((prev) => {
      const combined = [...(prev.photos || []), url];
      return { ...prev, photos: combined, image: combined[0] || prev.image };
    });
    setNewPhotoUrlInput("");
    addToast?.("URL Ditambahkan", "Foto berhasil dimasukkan ke galeri unit.");
  };

  const handleSetPrimaryPhoto = (idx) => {
    setFormData((prev) => {
      const photos = [...(prev.photos || [])];
      if (idx < 0 || idx >= photos.length) return prev;
      const [chosen] = photos.splice(idx, 1);
      photos.unshift(chosen);
      return { ...prev, photos, image: photos[0] };
    });
  };

  const handleRemovePhoto = (idx) => {
    setFormData((prev) => {
      const photos = (prev.photos || []).filter((_, i) => i !== idx);
      return { ...prev, photos, image: photos[0] || "" };
    });
  };

  // Tier package handlers
  const handleTierChange = (index, field, value) => {
    setFormData((prev) => {
      const updated = [...prev.tieredPackages];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, tieredPackages: updated };
    });
  };

  const handleAddTier = () => {
    const newTierObj = {
      id: `pkg-${Date.now()}`,
      name: `Paket Tambahan ${formData.tieredPackages.length + 1}`,
      tier: "Kustom",
      price: 150000,
      depositAmount: 100000,
      duration: "1 - 2 Hari",
      description: "Paket sewa pilihan dengan kelengkapan terpadu.",
      featuresStr: "1x Unit Utama Siap Pakai\nAksesoris Lengkap",
      isPopular: false,
    };
    setFormData((prev) => ({
      ...prev,
      tieredPackages: [...prev.tieredPackages, newTierObj],
    }));
  };

  const handleRemoveTier = (index) => {
    if (formData.tieredPackages.length <= 1) {
      addToast?.("Minimal 1 Paket", "Setidaknya harus ada 1 paket dalam mode paket bertingkat.", "warning");
      return;
    }
    setFormData((prev) => ({
      ...prev,
      tieredPackages: prev.tieredPackages.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      addToast?.("Form Belum Lengkap", "Silakan isi nama unit sewa.", "error");
      return;
    }

    if (formData.pricingMode === "single" && (!formData.price || Number(formData.price) <= 0)) {
      addToast?.("Form Belum Lengkap", "Silakan isi tarif sewa harian yang valid.", "error");
      return;
    }

    if (formData.pricingMode === "tiered") {
      const hasInvalidPrice = formData.tieredPackages.some((p) => !p.price || Number(p.price) <= 0);
      if (hasInvalidPrice) {
        addToast?.("Tarif Paket Belum Lengkap", "Pastikan semua paket memiliki harga yang valid.", "error");
        return;
      }
    }

    const allPhotos = Array.isArray(formData.photos) && formData.photos.length > 0
      ? formData.photos
      : (formData.image ? [formData.image] : []);

    if (allPhotos.length === 0) {
      addToast?.("Foto Wajib Ada", "Silakan sertakan minimal 1 foto fisik alat/unit sewa.", "warning");
      return;
    }

    setIsSubmitting(true);

    const resolvedCategory = formData.category === "__CUSTOM__"
      ? (formData.customCategory.trim() || "Unit Rental")
      : formData.category;

    const finalPackages = formData.pricingMode === "tiered"
      ? formData.tieredPackages.map((p) => ({
          ...p,
          price: Number(p.price),
          depositAmount: Number(p.depositAmount) || 0,
          features: typeof p.featuresStr === "string"
            ? p.featuresStr.split("\n").map((f) => f.trim()).filter(Boolean)
            : (Array.isArray(p.features) ? p.features : []),
        }))
      : [];

    const effectivePrice = formData.pricingMode === "tiered" ? calculatedLowestPrice : Number(formData.price);
    const effectiveDeposit = Number(formData.depositAmount) || 0;

    let newItemId = `rnt-${Date.now()}`;

    // 1. Simpan ke database riil PostgreSQL via API /api/rentals
    try {
      const token =
        (await authService.getValidAccessToken?.()) ||
        authService.getAccessToken?.() ||
        authService.getToken?.() ||
        (typeof window !== "undefined"
          ? localStorage.getItem("bantuin_auth_access_token") ||
            localStorage.getItem("bantuin_auth_session_token") ||
            localStorage.getItem("bantuin_token")
          : null);

      const payload = {
        title: formData.name.trim(),
        category: resolvedCategory,
        description: formData.desc.trim() || "Unit alat sewa terawat dalam kondisi prima.",
        dailyPrice: effectivePrice,
        depositAmount: effectiveDeposit,
        photoUrls: allPhotos,
        pickupLocation: store.address || currentUser?.partnerAddress || currentUser?.campusName || "Indonesia",
        latitude: currentUser?.latitude || null,
        longitude: currentUser?.longitude || null,
        tag: formData.tag ? formData.tag.trim() : "",
        stockCount: Math.max(1, Number(formData.stockCount) || 1),
        stockStatus: formData.stockStatus || "Siap Sewa",
        isAvailable: (formData.stockStatus || "Siap Sewa") === "Siap Sewa",
        includedItems: formData.includedItems ? formData.includedItems.trim() : "",
        securityDeposit: formData.securityDeposit ? formData.securityDeposit.trim() : "",
        termsAndConditions: {
          pricingMode: formData.pricingMode,
          packages: finalPackages,
          tag: formData.tag ? formData.tag.trim() : "",
          stockCount: Math.max(1, Number(formData.stockCount) || 1),
          stockStatus: formData.stockStatus || "Siap Sewa",
          includedItems: formData.includedItems ? formData.includedItems.trim() : "",
          securityDeposit: formData.securityDeposit ? formData.securityDeposit.trim() : "",
        },
      };

      const res = await fetch("/api/rentals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const resJson = await res.json().catch(() => ({}));
      if (res.ok && resJson.success && resJson.data?.id) {
        newItemId = resJson.data.id;
      }
    } catch (apiErr) {
      console.warn("Could not save rental directly to DB API:", apiErr);
    }

    // 2. Simpan ke katalog store lokal
    const newItem = {
      id: newItemId,
      name: formData.name.trim(),
      category: resolvedCategory,
      type: "sewa",
      price: effectivePrice,
      depositAmount: effectiveDeposit,
      unit: formData.unit,
      pricingMode: formData.pricingMode,
      packages: finalPackages,
      tieredPackages: formData.tieredPackages,
      image: allPhotos[0],
      photos: allPhotos,
      rating: 5.0,
      reviews: 0,
      stockStatus: formData.stockStatus,
      tag: formData.tag,
      desc: formData.desc.trim(),
      stockCount: Number(formData.stockCount) || 1,
      includedItems: formData.includedItems,
      securityDeposit: formData.securityDeposit,
      createdAt: new Date().toISOString(),
    };

    const updatedCatalog = [newItem, ...(store.catalog || [])];
    const updatedStore = { ...store, catalog: updatedCatalog };

    saveMitraStoreData(updatedStore);
    setStore(updatedStore);

    // Sync with AppContext rentals so user immediately sees it in /sewa
    if (setRentals) {
      setRentals((prev) => [
        {
          id: newItemId,
          title: newItem.name,
          category: newItem.category,
          dailyPrice: newItem.price,
          pricePerDay: newItem.price,
          depositAmount: newItem.depositAmount,
          photoUrl: newItem.image,
          photos: newItem.photos,
          stock: newItem.stockCount,
          stockCount: newItem.stockCount,
          stockStatus: newItem.stockStatus,
          tag: newItem.tag,
          includedItems: newItem.includedItems,
          securityDeposit: newItem.securityDeposit,
          description: newItem.desc,
          pricingMode: newItem.pricingMode,
          packages: newItem.packages,
          ratingAvg: 5.0,
          ratingCount: 0,
          totalRentedCount: 0,
          isVerifiedPartner: true,
          isSafeEscrow: true,
          storeId: store.id,
          ownerName: store.name,
          location: store.address,
          address: store.address,
        },
        ...prev.filter((r) => r.id !== newItemId),
      ]);
    }

    if (refreshRentals) {
      refreshRentals();
    }

    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("bantuin_rentals_updated"));
    }

    setIsSubmitting(false);
    clearFormDraft(DRAFT_KEY);
    addToast?.("Unit Ditambahkan", `Unit "${newItem.name}" berhasil dipublikasikan ke katalog rental.`);
    router.push("/mitra/dashboard");
  };

  return (
    <RoleGuard allowedRoles={["partner"]}>
      <div className="min-h-screen bg-[#F4F7FB] pb-24">
        {/* Header & Breadcrumb */}
        <div className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                <Link href="/mitra/dashboard" className="hover:text-[#1683FF] transition font-medium">
                  Dashboard Mitra
                </Link>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                <Link href="/mitra/dashboard" className="hover:text-[#1683FF] transition font-medium">
                  Katalog Unit Sewa
                </Link>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-900 font-bold">Tambah Unit Baru</span>
              </div>
              <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 flex items-center gap-2">
                <Package className="w-5 h-5 text-[#1683FF]" />
                <span>Tambah Unit Rental Baru</span>
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/mitra/dashboard"
                className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Kembali ke Dashboard</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* 1. Informasi Unit */}
            <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/90 shadow-xs space-y-5">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <div>
                  <h2 className="text-sm sm:text-base font-extrabold text-slate-900">1. Informasi Unit &amp; Spesifikasi</h2>
                  <p className="text-xs text-slate-500">Tentukan nama alat, kategori, dan stok unit yang tersedia.</p>
                </div>
                <span className="px-2.5 py-1 bg-blue-50 text-[#1683FF] rounded-lg text-[11px] font-bold">Wajib Diisi</span>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    Nama Unit / Alat Rental <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Sony Alpha A7 III + Lensa 24-70mm GM"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-3 rounded-2xl border border-slate-200 text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:border-[#1683FF] bg-slate-50/50"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                      Kategori Alat <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full p-3 rounded-2xl border border-slate-200 text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:border-[#1683FF] bg-white"
                    >
                      {categoryPresets.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat === "__CUSTOM__" ? "+ Kategori Kustom" : cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  {formData.category === "__CUSTOM__" ? (
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1.5">
                        Kategori Kustom <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Contoh: Alat Camping"
                        value={formData.customCategory}
                        onChange={(e) => setFormData({ ...formData, customCategory: e.target.value })}
                        className="w-full p-3 rounded-2xl border border-blue-200 text-xs sm:text-sm text-slate-900 bg-blue-50/20"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1.5">
                        Lencana / Tag Unit
                      </label>
                      <select
                        value={formData.tag}
                        onChange={(e) => setFormData({ ...formData, tag: e.target.value })}
                        className="w-full p-3 rounded-2xl border border-slate-200 text-xs sm:text-sm text-slate-800 bg-white"
                      >
                        <option value="Unit Baru">Unit Baru</option>
                        <option value="Paling Dicari">Paling Dicari</option>
                        <option value="Best Seller">Best Seller</option>
                        <option value="Terawat Prima">Terawat Prima</option>
                        <option value="Pro Gear">Pro Gear</option>
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                      Jumlah Stok Unit Ready
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={formData.stockCount}
                      onChange={(e) => setFormData({ ...formData, stockCount: Number(e.target.value) })}
                      className="w-full p-3 rounded-2xl border border-slate-200 text-xs sm:text-sm font-bold text-slate-900 bg-white"
                    />
                  </div>
                </div>

                {/* Sub-Section: Skema Tarif & Paket Layanan Unit (Mirip Jasa) */}
                <div className="pt-2 border-t border-slate-100 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-blue-50/50 border border-blue-100/80">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-extrabold text-slate-900">
                          Skema Tarif &amp; Paket Unit Sewa
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-blue-100 text-[#1683FF] text-[10px] font-extrabold uppercase">
                          {formData.pricingMode === "tiered" ? "Paket Bertingkat Aktif" : "Harga Tunggal"}
                        </span>
                      </div>
                      <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
                        Pilih harga tunggal untuk tarif harian biasa, atau aktifkan opsi paket bertingkat (Basic / Standard / Pro Borongan).
                      </p>
                    </div>

                    {/* Toggle Switch Mode */}
                    <div className="inline-flex p-1 bg-white rounded-xl border border-slate-200 self-start sm:self-auto shrink-0 shadow-2xs">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, pricingMode: "single" })}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                          formData.pricingMode === "single"
                            ? "bg-[#1683FF] text-white shadow-xs"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        <DollarSign className="w-3.5 h-3.5" />
                        <span>Harga Tunggal</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, pricingMode: "tiered" })}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                          formData.pricingMode === "tiered"
                            ? "bg-[#1683FF] text-white shadow-xs"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        <span>+ Opsi Paketan</span>
                      </button>
                    </div>
                  </div>

                  {/* JIKA MODE HARGA TUNGGAL */}
                  {formData.pricingMode === "single" ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in duration-200">
                      <div>
                        <label className="block text-xs font-bold text-slate-800 mb-1.5">
                          Tarif Sewa Harian (Rp) <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                            Rp
                          </div>
                          <input
                            type="number"
                            required={formData.pricingMode === "single"}
                            min={1000}
                            step={1000}
                            value={formData.price}
                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                            className="w-full pl-10 pr-3.5 py-3 rounded-2xl border border-slate-200 text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:border-[#1683FF] bg-slate-50/50"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                          <span>Deposit Jaminan Perlindungan Unit (Rp)</span>
                          <span className="text-[10px] text-emerald-600 font-normal">100% Refundable</span>
                        </label>
                        <div className="relative">
                          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                            Rp
                          </div>
                          <input
                            type="number"
                            min={0}
                            step={1000}
                            value={formData.depositAmount}
                            onChange={(e) => setFormData({ ...formData, depositAmount: e.target.value })}
                            className="w-full pl-10 pr-3.5 py-3 rounded-2xl border border-slate-200 text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:border-[#1683FF] bg-slate-50/50"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* JIKA MODE OPSI PAKETAN BERTINGKAT */
                    <div className="space-y-4 animate-in fade-in duration-200">
                      {/* Banner Preview Harga Card Etalase */}
                      <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                            <CheckCircle2 className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-[11px] font-extrabold uppercase text-emerald-800 block">
                              Tampilan Harga di Kartu Etalase Sewa:
                            </span>
                            <span className="text-xs sm:text-sm font-black text-emerald-900">
                              Mulai dari {formatIDR(calculatedLowestPrice)} / hari
                            </span>
                          </div>
                        </div>
                        <span className="text-[10px] text-emerald-700 font-medium hidden sm:inline text-right max-w-[200px]">
                          Penyewa dapat memilih paket sesuai kelengkapan &amp; durasi
                        </span>
                      </div>

                      {/* Grid Paket Bertingkat */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                        {formData.tieredPackages.map((pkg, pIdx) => (
                          <div
                            key={pkg.id || pIdx}
                            className={`rounded-2xl p-4 border-2 transition flex flex-col justify-between relative bg-white ${
                              pkg.isPopular
                                ? "border-[#1683FF] ring-2 ring-blue-100 shadow-xs"
                                : "border-slate-200 hover:border-slate-300"
                            }`}
                          >
                            <div className="space-y-3 mb-3">
                              <div className="flex items-center justify-between gap-2">
                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                                  pkg.tier === "Basic"
                                    ? "bg-amber-100 text-amber-800"
                                    : pkg.tier === "Standard"
                                    ? "bg-blue-100 text-[#1683FF]"
                                    : "bg-purple-100 text-purple-800"
                                }`}>
                                  {pkg.tier}
                                </span>

                                <label className="flex items-center gap-1.5 cursor-pointer text-[10px] font-bold text-slate-600 hover:text-[#1683FF]">
                                  <input
                                    type="checkbox"
                                    checked={pkg.isPopular}
                                    onChange={(e) => {
                                      const updated = formData.tieredPackages.map((item, idx) => ({
                                        ...item,
                                        isPopular: idx === pIdx ? e.target.checked : false,
                                      }));
                                      setFormData({ ...formData, tieredPackages: updated });
                                    }}
                                    className="rounded border-slate-300 text-[#1683FF] focus:ring-0"
                                  />
                                  <span>Populer</span>
                                </label>
                              </div>

                              <div>
                                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                  Nama Paket <span className="text-rose-500">*</span>
                                </label>
                                <input
                                  type="text"
                                  required={formData.pricingMode === "tiered"}
                                  value={pkg.name}
                                  onChange={(e) => handleTierChange(pIdx, "name", e.target.value)}
                                  placeholder="Contoh: Paket Unit Standar"
                                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#1683FF]"
                                />
                              </div>

                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                    Tarif Sewa (Rp) <span className="text-rose-500">*</span>
                                  </label>
                                  <input
                                    type="number"
                                    required={formData.pricingMode === "tiered"}
                                    min={1000}
                                    step={1000}
                                    value={pkg.price}
                                    onChange={(e) => handleTierChange(pIdx, "price", e.target.value)}
                                    placeholder="120000"
                                    className="w-full p-2 rounded-xl border border-slate-200 text-xs font-black text-[#1683FF] focus:outline-none focus:border-[#1683FF]"
                                  />
                                </div>

                                <div>
                                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                    Deposit (Rp)
                                  </label>
                                  <input
                                    type="number"
                                    min={0}
                                    step={1000}
                                    value={pkg.depositAmount}
                                    onChange={(e) => handleTierChange(pIdx, "depositAmount", e.target.value)}
                                    placeholder="100000"
                                    className="w-full p-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 focus:outline-none focus:border-[#1683FF]"
                                  />
                                </div>
                              </div>

                              <div>
                                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                  Durasi Paket
                                </label>
                                <input
                                  type="text"
                                  value={pkg.duration}
                                  onChange={(e) => handleTierChange(pIdx, "duration", e.target.value)}
                                  placeholder="Contoh: 1 Hari (24 Jam)"
                                  className="w-full p-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-[#1683FF]"
                                />
                              </div>

                              <div>
                                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                  Kelengkapan / Fitur Paket (1 per baris)
                                </label>
                                <textarea
                                  rows={3}
                                  value={pkg.featuresStr}
                                  onChange={(e) => handleTierChange(pIdx, "featuresStr", e.target.value)}
                                  placeholder="1x Unit Utama&#10;2x Baterai&#10;Tas Pelindung"
                                  className="w-full p-2 rounded-xl border border-slate-200 text-[11px] text-slate-800 focus:outline-none focus:border-[#1683FF]"
                                />
                              </div>
                            </div>

                            {formData.tieredPackages.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveTier(pIdx)}
                                className="w-full py-1.5 text-center text-[11px] font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition border border-rose-100 cursor-pointer"
                              >
                                Hapus Paket Ini
                              </button>
                            )}
                          </div>
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={handleAddTier}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#1683FF] text-xs font-bold transition border border-blue-200 cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Tambah Opsi Paket Baru</span>
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    Kelengkapan Bawaan Standar Unit
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Unit Lengkap, 2 Baterai Original, Dual Charger, SD Card 64GB, Tas Waterproof"
                    value={formData.includedItems}
                    onChange={(e) => setFormData({ ...formData, includedItems: e.target.value })}
                    className="w-full p-3 rounded-2xl border border-slate-200 text-xs sm:text-sm text-slate-800 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    Deskripsi Kondisi &amp; Spesifikasi Alat
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Jelaskan kondisi fisik alat, spesifikasi, dan panduan penggunaan..."
                    value={formData.desc}
                    onChange={(e) => setFormData({ ...formData, desc: e.target.value })}
                    className="w-full p-3.5 rounded-2xl border border-slate-200 text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-[#1683FF] bg-white leading-relaxed"
                  />
                </div>
              </div>
            </div>

            {/* 2. Galeri Foto Multi-Item (Clean & Real) */}
            <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/90 shadow-xs space-y-5">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <div>
                  <h2 className="text-sm sm:text-base font-extrabold text-slate-900">2. Galeri Foto Unit Rental</h2>
                  <p className="text-xs text-slate-500">Unggah foto fisik asli alat dari berbagai sudut (Tanpa foto tiruan/dummy).</p>
                </div>
                <span className="text-xs font-bold text-[#1683FF]">
                  {formData.photos.length} Foto Ditambahkan
                </span>
              </div>

              {/* Photo Previews Grid */}
              {formData.photos.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                  {formData.photos.map((photo, idx) => (
                    <div key={idx} className="relative aspect-4/3 rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 group shadow-2xs">
                      <img src={photo} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />
                      
                      {idx === 0 ? (
                        <span className="absolute top-2 left-2 px-2 py-0.5 bg-[#1683FF] text-white text-[10px] font-black rounded-md shadow-xs flex items-center gap-1">
                          <Star className="w-2.5 h-2.5 fill-white" />
                          <span>Utama</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSetPrimaryPhoto(idx)}
                          className="absolute top-2 left-2 px-2 py-0.5 bg-black/70 hover:bg-[#1683FF] text-white text-[10px] font-bold rounded-md opacity-0 group-hover:opacity-100 transition shadow-xs cursor-pointer"
                        >
                          Set Utama
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(idx)}
                        className="absolute top-2 right-2 w-6 h-6 bg-rose-600/90 hover:bg-rose-600 text-white rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow-xs cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload Dropzone */}
              <div className="space-y-3 pt-2">
                <label className="block p-6 rounded-2xl border-2 border-dashed border-[#1683FF]/40 hover:border-[#1683FF] bg-blue-50/20 hover:bg-blue-50/50 transition cursor-pointer text-center">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    disabled={isUploadingPhoto}
                    className="hidden"
                  />
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#1683FF] flex items-center justify-center mx-auto mb-2">
                    {isUploadingPhoto ? <Loader2 className="w-6 h-6 animate-spin" /> : <Camera className="w-6 h-6" />}
                  </div>
                  <div className="text-xs font-bold text-slate-800">
                    {isUploadingPhoto ? "Sedang Mengunggah Foto..." : "Klik untuk Pilih Foto Fisik Alat dari HP / Laptop"}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Format JPG, PNG, WEBP. Bisa pilih banyak foto sekaligus.
                  </p>
                </label>

                {/* Input via URL alternatif */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="url"
                    placeholder="Atau tempel URL gambar (opsional)..."
                    value={newPhotoUrlInput}
                    onChange={(e) => setNewPhotoUrlInput(e.target.value)}
                    className="flex-1 p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#1683FF] bg-white"
                  />
                  <button
                    type="button"
                    onClick={handleAddPhotoByUrl}
                    className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
                  >
                    Tambah
                  </button>
                </div>
              </div>
            </div>

            {/* 3. Syarat & Jaminan Unit */}
            <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/90 shadow-xs space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-sm sm:text-base font-extrabold text-slate-900">3. Syarat &amp; Jaminan Unit</h2>
                <p className="text-xs text-slate-500">Persyaratan identitas dan ketentuan sewa khusus untuk unit ini.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Ketentuan Jaminan / Kebijakan Titip ID
                </label>
                <textarea
                  rows={3}
                  placeholder="Contoh: Wajib titip 1 ID Asli (KTP/KTM/SIM) + Verifikasi Akun Bantuin..."
                  value={formData.securityDeposit}
                  onChange={(e) => setFormData({ ...formData, securityDeposit: e.target.value })}
                  className="w-full p-3.5 rounded-2xl border border-slate-200 text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-[#1683FF] bg-white leading-relaxed"
                />
              </div>
            </div>

            {/* Submit Action */}
            <div className="flex items-center justify-end gap-3 pt-4">
              <Link
                href="/mitra/dashboard"
                className="px-5 py-3 rounded-2xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
              >
                Batal
              </Link>
              <button
                type="submit"
                disabled={isSubmitting || isUploadingPhoto}
                className="px-7 py-3 rounded-2xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white text-xs sm:text-sm font-bold shadow-xs hover:shadow-md transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Menyimpan ke Katalog...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Publikasikan Unit Sewa</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </main>
      </div>
    </RoleGuard>
  );
}
