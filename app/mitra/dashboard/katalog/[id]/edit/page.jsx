"use client";

import React, { useState, useEffect, useMemo, use } from "react";
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
  Save,
  Check,
  ShieldCheck,
  DollarSign,
  CheckCircle2,
  Camera,
  Layers,
  Clock
} from "lucide-react";

const RENTAL_CATEGORIES = [
  "Kamera",
  "Lensa",
  "Aksesoris",
  "Lighting",
  "Audio",
  "Drone",
  "Paket Studio",
  "Outdoor",
  "Perkakas & Elektronik",
  "Lainnya"
];

const UNIT_PERIODS = [
  "/ hari",
  "/ 12 jam",
  "/ 24 jam",
  "/ shift",
  "/ event",
  "/ minggu"
];

const DEFAULT_PACKAGES = [
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
];

export default function EditRentalUnitPage({ params }) {
  const router = useRouter();
  const unwrappedParams = use(params);
  const itemId = unwrappedParams.id;
  const { addToast, setRentals, refreshRentals, currentUser } = useApp();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [store, setStore] = useState(null);
  const [notFound, setNotFound] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Kamera");
  const [pricingMode, setPricingMode] = useState("single"); // 'single' atau 'tiered'
  const [price, setPrice] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [unit, setUnit] = useState("/ hari");
  const [tag, setTag] = useState("");
  const [stockStatus, setStockStatus] = useState("Siap Sewa");
  const [stockCount, setStockCount] = useState(1);
  const [desc, setDesc] = useState("");
  const [securityDeposit, setSecurityDeposit] = useState("");
  const [includes, setIncludes] = useState("");
  const [tieredPackages, setTieredPackages] = useState(DEFAULT_PACKAGES);

  // Photos state: [{ id, url, isPrimary }]
  const [photos, setPhotos] = useState([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [newPhotoUrlInput, setNewPhotoUrlInput] = useState("");
  const [rating, setRating] = useState(5.0);
  const [reviews, setReviews] = useState(0);

  useEffect(() => {
    let isMounted = true;
    const loadItem = async () => {
      let currentStore = null;
      if (currentUser?.id) {
        currentStore = getMitraStoreById(currentUser.id) || {
          id: currentUser.id,
          name: currentUser.partnerBusinessName || currentUser.fullName || "Toko Mitra",
          catalog: currentUser.rentals || []
        };
      }
      if (!currentStore) {
        currentStore = getMitraStoreById("mitra-kamera");
      }
      if (currentStore && isMounted) {
        setStore(currentStore);
      }

      let unitItem = null;

      try {
        const res = await fetch(`/api/rentals/${itemId}`);
        const json = await res.json();
        if (json.success && json.data) {
          const r = json.data;
          unitItem = {
            id: r.id,
            name: r.title,
            category: r.category,
            type: "sewa",
            price: Number(r.dailyPrice),
            depositAmount: Number(r.depositAmount || 0),
            unit: r.unit || "/ hari",
            image: r.photoUrls?.[0] || "/logotab.png",
            photos: r.photoUrls || [],
            stockStatus: r.stockStatus || (r.isAvailable ? "Siap Sewa" : "Sedang Disewa"),
            tag: r.tag || "",
            desc: r.description,
            stockCount: r.stockCount !== undefined ? Number(r.stockCount) : (r.stock !== undefined ? Number(r.stock) : 1),
            includedItems: r.includedItems || r.includes || "",
            includes: r.includedItems || r.includes || "",
            rating: Number(r.ratingAvg) || 5.0,
            pickupLocation: r.pickupLocation,
            packages: r.packages || [],
            pricingMode: r.pricingMode || "single",
            securityDeposit: r.securityDeposit || currentStore?.securityDepositPolicy || "",
          };
        }
      } catch (apiErr) {
        console.warn("Could not fetch rental from API:", apiErr);
      }

      if (!unitItem && currentStore?.catalog) {
        unitItem = currentStore.catalog.find(c => String(c.id) === String(itemId));
      }

      if (!unitItem) {
        if (isMounted) {
          setNotFound(true);
          setLoading(false);
        }
        return;
      }

      const draftKey = `bantuin_draft_mitra_katalog_edit_${itemId}`;
      const savedDraft = typeof window !== "undefined" ? getFormDraft(draftKey, null) : null;

      if (!isMounted) return;

      setName(savedDraft?.name || unitItem.name || "");
      setCategory(savedDraft?.category || unitItem.category || "Kamera");
      setPrice(savedDraft?.price || (unitItem.price ? String(unitItem.price) : ""));
      setDepositAmount(savedDraft?.depositAmount || (unitItem.depositAmount ? String(unitItem.depositAmount) : "100000"));
      setUnit(savedDraft?.unit || unitItem.unit || "/ hari");
      setTag(savedDraft?.tag !== undefined ? savedDraft.tag : (unitItem.tag || ""));
      setStockStatus(savedDraft?.stockStatus || unitItem.stockStatus || "Siap Sewa");
      setStockCount(savedDraft?.stockCount !== undefined ? Number(savedDraft.stockCount) : (unitItem.stockCount !== undefined ? Number(unitItem.stockCount) : 1));
      setDesc(savedDraft?.desc !== undefined ? savedDraft.desc : (unitItem.desc || ""));
      setSecurityDeposit(savedDraft?.securityDeposit !== undefined ? savedDraft.securityDeposit : (unitItem.securityDeposit || currentStore?.securityDepositPolicy || ""));
      setIncludes(savedDraft?.includes !== undefined ? savedDraft.includes : (unitItem.includedItems || unitItem.includes || ""));
      setRating(unitItem.rating || 5.0);
      setReviews(unitItem.reviews || 0);

      // Pricing mode & packages
      const hasPackages = Array.isArray(unitItem.packages) && unitItem.packages.length > 0;
      const initialMode = savedDraft?.pricingMode || unitItem.pricingMode || (hasPackages ? "tiered" : "single");
      setPricingMode(initialMode);

      if (savedDraft?.tieredPackages && savedDraft.tieredPackages.length > 0) {
        setTieredPackages(savedDraft.tieredPackages);
      } else if (hasPackages) {
        setTieredPackages(
          unitItem.packages.map((p, idx) => ({
            ...p,
            id: p.id || `pkg-${idx}`,
            featuresStr: Array.isArray(p.features) ? p.features.join("\n") : (p.featuresStr || ""),
          }))
        );
      }

      const initialPhotos = [];
      if (unitItem.image && !unitItem.image.includes("images.unsplash.com")) {
        initialPhotos.push({
          id: "main-0",
          url: unitItem.image,
          isPrimary: true
        });
      }
      if (Array.isArray(unitItem.photos)) {
        unitItem.photos.forEach((photoUrl, idx) => {
          if (photoUrl && !photoUrl.includes("images.unsplash.com") && photoUrl !== unitItem.image && !initialPhotos.some(p => p.url === photoUrl)) {
            initialPhotos.push({
              id: `sub-${idx}`,
              url: photoUrl,
              isPrimary: false
            });
          }
        });
      }
      setPhotos(initialPhotos);
      setLoading(false);
    };

    loadItem();
    return () => { isMounted = false; };
  }, [itemId, currentUser?.id]);

  const DRAFT_KEY = `bantuin_draft_mitra_katalog_edit_${itemId}`;
  useEffect(() => {
    if (name) {
      saveFormDraft(DRAFT_KEY, {
        name,
        category,
        price,
        depositAmount,
        unit,
        tag,
        stockStatus,
        stockCount,
        desc,
        securityDeposit,
        includes,
        pricingMode,
        tieredPackages,
      });
    }
  }, [name, category, price, depositAmount, unit, tag, stockStatus, stockCount, desc, securityDeposit, includes, pricingMode, tieredPackages, DRAFT_KEY]);

  const isDirty = Boolean(name.trim());
  useBeforeUnload(isDirty, "Ada perubahan unit rental yang belum disimpan. Yakin ingin meninggalkan halaman?");

  // Calculated lowest price when tiered
  const calculatedLowestPrice = useMemo(() => {
    if (pricingMode !== "tiered" || !tieredPackages?.length) {
      return Number(price) || 0;
    }
    const prices = tieredPackages.map((p) => Number(p.price) || 0).filter((p) => p > 0);
    return prices.length > 0 ? Math.min(...prices) : Number(price) || 0;
  }, [pricingMode, tieredPackages, price]);

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploadingPhoto(true);
    try {
      const urls = await imageService.uploadImages(files, "mitra-catalog");
      const newPhotoObjects = urls.map((url, i) => ({
        id: `uploaded-${Date.now()}-${i}`,
        url: url,
        isPrimary: photos.length === 0 && i === 0
      }));

      setPhotos(prev => {
        const combined = [...prev, ...newPhotoObjects];
        if (!combined.some(p => p.isPrimary) && combined.length > 0) {
          combined[0].isPrimary = true;
        }
        return combined;
      });

      addToast?.("Foto Ditambahkan", `${files.length} foto berhasil diunggah.`);
    } catch (err) {
      addToast?.("Gagal Unggah", "Terjadi kesalahan saat mengunggah foto.", "error");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleAddPhotoUrl = () => {
    if (!newPhotoUrlInput.trim()) return;
    const url = newPhotoUrlInput.trim();
    setPhotos(prev => {
      const combined = [...prev, { id: `url-${Date.now()}`, url, isPrimary: prev.length === 0 }];
      return combined;
    });
    setNewPhotoUrlInput("");
    addToast?.("Foto Ditambahkan", "Foto berhasil dimasukkan ke galeri.");
  };

  const setAsPrimaryPhoto = (index) => {
    setPhotos(prev => prev.map((p, i) => ({
      ...p,
      isPrimary: i === index
    })));
  };

  const removePhoto = (index) => {
    setPhotos(prev => {
      const filtered = prev.filter((_, i) => i !== index);
      if (filtered.length > 0 && !filtered.some(p => p.isPrimary)) {
        filtered[0].isPrimary = true;
      }
      return filtered;
    });
  };

  // Tier package handlers
  const handleTierChange = (index, field, value) => {
    setTieredPackages((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleAddTier = () => {
    const newTierObj = {
      id: `pkg-${Date.now()}`,
      name: `Paket Pilihan ${tieredPackages.length + 1}`,
      tier: "Kustom",
      price: 150000,
      depositAmount: 100000,
      duration: "1 - 2 Hari",
      description: "Paket sewa pilihan dengan kelengkapan terpadu.",
      featuresStr: "1x Unit Utama Siap Pakai\nAksesoris Lengkap",
      isPopular: false,
    };
    setTieredPackages((prev) => [...prev, newTierObj]);
  };

  const handleRemoveTier = (index) => {
    if (tieredPackages.length <= 1) {
      addToast?.("Minimal 1 Paket", "Setidaknya harus ada 1 paket dalam mode paket bertingkat.", "warning");
      return;
    }
    setTieredPackages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      addToast?.("Form Belum Lengkap", "Mohon masukkan nama unit rental.", "error");
      return;
    }

    if (pricingMode === "single" && (!price || isNaN(Number(price)) || Number(price) <= 0)) {
      addToast?.("Form Belum Lengkap", "Mohon masukkan tarif sewa harian yang valid.", "error");
      return;
    }

    if (pricingMode === "tiered") {
      const hasInvalid = tieredPackages.some((p) => !p.price || Number(p.price) <= 0);
      if (hasInvalid) {
        addToast?.("Tarif Paket Belum Lengkap", "Pastikan semua paket memiliki harga yang valid.", "error");
        return;
      }
    }

    setSaving(true);

    const primaryPhoto = photos.find(p => p.isPrimary)?.url || photos[0]?.url || "/logotab.png";
    const allPhotoUrls = photos.map(p => p.url).filter(Boolean);

    const finalPackages = pricingMode === "tiered"
      ? tieredPackages.map((p) => ({
          ...p,
          price: Number(p.price),
          depositAmount: Number(p.depositAmount) || 0,
          features: typeof p.featuresStr === "string"
            ? p.featuresStr.split("\n").map((f) => f.trim()).filter(Boolean)
            : (Array.isArray(p.features) ? p.features : []),
        }))
      : [];

    const effectivePrice = pricingMode === "tiered" ? calculatedLowestPrice : Number(price);
    const effectiveDeposit = Number(depositAmount) || 0;

    // PATCH to PostgreSQL DB if item is registered
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
        title: name.trim(),
        category,
        dailyPrice: effectivePrice,
        depositAmount: effectiveDeposit,
        unit: unit || "/ hari",
        description: desc.trim(),
        photoUrls: allPhotoUrls.length > 0 ? allPhotoUrls : [primaryPhoto],
        pricingMode,
        packages: finalPackages,
        tag: tag.trim(),
        stockCount: Math.max(1, Number(stockCount) || 1),
        stockStatus: stockStatus || "Siap Sewa",
        isAvailable: stockStatus === "Siap Sewa",
        includedItems: includes.trim(),
        includes: includes.trim(),
        securityDeposit: securityDeposit.trim(),
        termsAndConditions: {
          unit: unit || "/ hari",
          pricingMode,
          packages: finalPackages,
          tag: tag.trim(),
          stockCount: Math.max(1, Number(stockCount) || 1),
          stockStatus: stockStatus || "Siap Sewa",
          includedItems: includes.trim(),
          securityDeposit: securityDeposit.trim(),
        },
      };

      const patchRes = await fetch(`/api/rentals/${itemId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const patchJson = await patchRes.json().catch(() => ({}));
      if (!patchRes.ok && patchRes.status !== 404) {
        console.warn("Could not patch rental in DB:", patchJson?.error || patchRes.statusText);
      }
    } catch (apiErr) {
      console.warn("Could not patch rental in DB:", apiErr);
    }

    const updatedUnit = {
      id: itemId,
      name: name.trim(),
      title: name.trim(),
      category,
      type: "sewa",
      price: effectivePrice,
      dailyPrice: effectivePrice,
      pricePerDay: effectivePrice,
      depositAmount: effectiveDeposit,
      unit,
      pricingMode,
      packages: finalPackages,
      tieredPackages,
      tag: tag.trim(),
      stockStatus: stockStatus || "Siap Sewa",
      isAvailable: stockStatus === "Siap Sewa",
      stockCount: Math.max(1, Number(stockCount) || 1),
      stock: Math.max(1, Number(stockCount) || 1),
      image: primaryPhoto,
      photoUrl: primaryPhoto,
      photos: allPhotoUrls.length > 0 ? allPhotoUrls : [primaryPhoto],
      photoUrls: allPhotoUrls.length > 0 ? allPhotoUrls : [primaryPhoto],
      desc: desc.trim(),
      description: desc.trim(),
      securityDeposit: securityDeposit.trim(),
      includedItems: includes.trim(),
      includes: includes.trim(),
      rating,
      ratingAvg: rating,
      reviews,
      updatedAt: new Date().toISOString()
    };

    const currentCatalog = store?.catalog || [];
    const updatedCatalog = currentCatalog.map(item => 
      String(item.id) === String(itemId) ? updatedUnit : item
    );

    const updatedStore = {
      ...store,
      catalog: updatedCatalog
    };

    saveMitraStoreData(updatedStore);

    if (setRentals) {
      setRentals(prev => {
        if (!Array.isArray(prev)) return prev;
        const exists = prev.some(r => String(r.id) === String(itemId));
        if (exists) {
          return prev.map(r => String(r.id) === String(itemId) ? { 
            ...r, 
            ...updatedUnit, 
            title: updatedUnit.name, 
            dailyPrice: updatedUnit.price, 
            pricePerDay: updatedUnit.price, 
            unit: updatedUnit.unit || "/ hari",
            photoUrl: updatedUnit.image,
            stock: updatedUnit.stockCount,
            stockCount: updatedUnit.stockCount,
            stockStatus: updatedUnit.stockStatus,
            isAvailable: updatedUnit.isAvailable,
            tag: updatedUnit.tag,
            includedItems: updatedUnit.includedItems,
            securityDeposit: updatedUnit.securityDeposit
          } : r);
        } else {
          return [updatedUnit, ...prev];
        }
      });
    }

    clearFormDraft(DRAFT_KEY);

    if (refreshRentals) {
      refreshRentals();
    }

    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("bantuin_rentals_updated"));
      window.dispatchEvent(new Event("bantuin_mitra_store_updated"));
    }

    addToast?.("Unit Diperbarui", `Perubahan untuk "${updatedUnit.name}" berhasil disimpan.`);
    router.push(`/mitra/dashboard/katalog/${itemId}`);
  };

  if (loading) {
    return (
      <RoleGuard allowedRoles={["partner"]}>
        <div className="min-h-screen bg-[#F4F7FB] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#1683FF]" />
        </div>
      </RoleGuard>
    );
  }

  if (notFound) {
    return (
      <RoleGuard allowedRoles={["partner"]}>
        <div className="min-h-screen bg-[#F4F7FB] flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-3xl bg-blue-50 text-[#1683FF] flex items-center justify-center mb-4">
            <Package className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900">Unit Sewa Tidak Ditemukan</h2>
          <p className="text-xs text-slate-500 mt-1 max-w-sm">
            Unit dengan ID <code className="font-mono bg-slate-200 px-1 py-0.5 rounded">{itemId}</code> tidak terdaftar di etalase toko Anda.
          </p>
          <Link
            href="/mitra/dashboard"
            className="mt-5 px-5 py-2.5 rounded-2xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white text-xs font-bold transition flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Dashboard Mitra</span>
          </Link>
        </div>
      </RoleGuard>
    );
  }

  return (
    <RoleGuard allowedRoles={["partner"]}>
      <div className="min-h-screen bg-[#F4F7FB] pb-24">
        {/* Header Navigation */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                <Link href="/mitra/dashboard" className="hover:text-[#1683FF] transition font-medium">
                  Dashboard Mitra
                </Link>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                <Link href={`/mitra/dashboard/katalog/${itemId}`} className="hover:text-[#1683FF] transition font-medium">
                  Detail Unit
                </Link>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-900 font-bold">Edit Unit</span>
              </div>
              <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 flex items-center gap-2">
                <Package className="w-5 h-5 text-[#1683FF]" />
                <span>Edit Unit: {name || "Unit Sewa"}</span>
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href={`/mitra/dashboard/katalog/${itemId}`}
                className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Batal</span>
              </Link>
            </div>
          </div>
        </header>

        {/* Main Content Form */}
        <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Card 1: Informasi Pokok Unit */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-7 shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h2 className="text-sm sm:text-base font-extrabold text-slate-900">1. Informasi Pokok Unit</h2>
                  <p className="text-xs text-slate-500">Ubah spesifikasi, nama barang, dan kategori rental.</p>
                </div>
                <span className="px-2.5 py-1 bg-blue-50 text-[#1683FF] rounded-lg text-[11px] font-bold">Wajib Diisi</span>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    Nama Unit Barang <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Contoh: Sony Alpha A7 III (Body Only)"
                    className="w-full p-3 rounded-2xl border border-slate-200 text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:border-[#1683FF] bg-slate-50/50"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                      Kategori Sewa <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full p-3 rounded-2xl border border-slate-200 text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:border-[#1683FF] bg-white"
                    >
                      {RENTAL_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                      Highlight / Badge Tag
                    </label>
                    <input
                      type="text"
                      value={tag}
                      onChange={(e) => setTag(e.target.value)}
                      placeholder="Contoh: Terlaris / Primadona / Unit Baru"
                      className="w-full p-3 rounded-2xl border border-slate-200 text-xs sm:text-sm text-slate-800 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                      Status Ketersediaan
                    </label>
                    <select
                      value={stockStatus}
                      onChange={(e) => setStockStatus(e.target.value)}
                      className="w-full p-3 rounded-2xl border border-slate-200 text-xs sm:text-sm text-slate-800 bg-white"
                    >
                      <option value="Siap Sewa">Siap Sewa (Aktif)</option>
                      <option value="Sedang Disewa">Sedang Disewa</option>
                      <option value="Maintenance">Maintenance / Perawatan</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                      Jumlah Stok Unit Ready <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      min={1}
                      required
                      value={stockCount}
                      onChange={(e) => setStockCount(Math.max(1, parseInt(e.target.value) || 1))}
                      placeholder="Contoh: 2"
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
                          {pricingMode === "tiered" ? "Paket Bertingkat Aktif" : "Harga Tunggal"}
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
                        onClick={() => setPricingMode("single")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                          pricingMode === "single"
                            ? "bg-[#1683FF] text-white shadow-xs"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        <DollarSign className="w-3.5 h-3.5" />
                        <span>Harga Tunggal</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPricingMode("tiered")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                          pricingMode === "tiered"
                            ? "bg-[#1683FF] text-white shadow-xs"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        <span>+ Opsi Paketan</span>
                      </button>
                    </div>
                  </div>

                  {/* JIKA MODE HARGA TUNGGAL */}
                  {pricingMode === "single" ? (
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
                            required={pricingMode === "single"}
                            min={1000}
                            step={1000}
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
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
                            value={depositAmount}
                            onChange={(e) => setDepositAmount(e.target.value)}
                            className="w-full pl-10 pr-3.5 py-3 rounded-2xl border border-slate-200 text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:border-[#1683FF] bg-slate-50/50"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* JIKA MODE OPSI PAKETAN BERTINGKAT */
                    <div className="space-y-4 animate-in fade-in duration-200">
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
                        {tieredPackages.map((pkg, pIdx) => (
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
                                      const updated = tieredPackages.map((item, idx) => ({
                                        ...item,
                                        isPopular: idx === pIdx ? e.target.checked : false,
                                      }));
                                      setTieredPackages(updated);
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
                                  required={pricingMode === "tiered"}
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
                                    required={pricingMode === "tiered"}
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

                            {tieredPackages.length > 1 && (
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
                    value={includes}
                    onChange={(e) => setIncludes(e.target.value)}
                    placeholder="Contoh: 1x Body Kamera, 2x Baterai, 1x Charger, 1x Strap, 1x Tas Carrier"
                    className="w-full p-3 rounded-2xl border border-slate-200 text-xs sm:text-sm text-slate-800 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    Deskripsi Kondisi &amp; Spesifikasi Alat
                  </label>
                  <textarea
                    rows={3}
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                    placeholder="Jelaskan kondisi fisik alat, spesifikasi, dan panduan penggunaan..."
                    className="w-full p-3.5 rounded-2xl border border-slate-200 text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-[#1683FF] bg-white leading-relaxed"
                  />
                </div>
              </div>
            </div>

            {/* Card 2: Foto Unit (Multi-Foto Bersih Tanpa Dummy) */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-7 shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h2 className="text-sm sm:text-base font-extrabold text-slate-900">2. Foto Unit Rental</h2>
                  <p className="text-xs text-slate-500">Kelola foto asli alat untuk menarik minat calon penyewa.</p>
                </div>
                <span className="text-xs font-bold text-[#1683FF]">
                  {photos.length} Foto Aktif
                </span>
              </div>

              {photos.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                  {photos.map((p, idx) => (
                    <div
                      key={p.id || idx}
                      className="relative aspect-4/3 rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 group shadow-2xs"
                    >
                      <img
                        src={p.url}
                        alt={`Unit Photo ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      
                      {p.isPrimary && (
                        <span className="absolute top-2 left-2 bg-[#1683FF] text-white text-[10px] font-black px-2 py-0.5 rounded-md shadow-xs flex items-center gap-1">
                          <Star className="w-2.5 h-2.5 fill-white" />
                          <span>Utama</span>
                        </span>
                      )}

                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2 p-2">
                        {!p.isPrimary && (
                          <button
                            type="button"
                            onClick={() => setAsPrimaryPhoto(idx)}
                            className="p-2 bg-[#1683FF] text-white rounded-lg hover:bg-[#0F6FE5] transition cursor-pointer"
                            title="Jadikan Foto Utama"
                          >
                            <Star className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => removePhoto(idx)}
                          className="p-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition cursor-pointer"
                          title="Hapus Foto"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
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
                    onChange={handleFileUpload}
                    disabled={uploadingPhoto}
                    className="hidden"
                  />
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#1683FF] flex items-center justify-center mx-auto mb-2">
                    {uploadingPhoto ? <Loader2 className="w-6 h-6 animate-spin" /> : <Camera className="w-6 h-6" />}
                  </div>
                  <div className="text-xs font-bold text-slate-800">
                    {uploadingPhoto ? "Sedang Mengunggah Foto..." : "Klik untuk Pilih Foto Tambahan dari HP / Laptop"}
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
                    onClick={handleAddPhotoUrl}
                    className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
                  >
                    Tambah
                  </button>
                </div>
              </div>
            </div>

            {/* Card 3: Syarat & Jaminan Khusus */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-7 shadow-xs space-y-4">
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
                  value={securityDeposit}
                  onChange={(e) => setSecurityDeposit(e.target.value)}
                  placeholder="Contoh: Wajib titip 1 ID Asli (KTP/KTM/SIM) + Verifikasi Akun Bantuin..."
                  className="w-full p-3.5 rounded-2xl border border-slate-200 text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-[#1683FF] bg-white leading-relaxed"
                />
              </div>
            </div>

            {/* Sticky Action Footer */}
            <div className="sticky bottom-4 z-20 bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-xl rounded-2xl p-4 flex items-center justify-between">
              <Link
                href={`/mitra/dashboard/katalog/${itemId}`}
                className="px-5 py-2.5 border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-100 transition text-xs"
              >
                Batal
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#1683FF] hover:bg-[#0F6FE5] text-white font-bold rounded-xl shadow-xs hover:shadow-md transition disabled:opacity-50 text-xs cursor-pointer"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Simpan Perubahan Unit</span>
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
