"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import RoleGuard from "@/components/auth/RoleGuard";
import { useApp } from "@/lib/context/AppContext";
import { getProviderById, saveProviderData } from "@/lib/mock/providersData";
import { imageService } from "@/lib/services/imageService";
import { authService } from "@/lib/services/authService";
import { formatIDR } from "@/lib/utils";
import { saveFormDraft, getFormDraft, clearFormDraft, useBeforeUnload } from "@/lib/hooks/useFormDraft";
import { 
  ArrowLeft, 
  Layers, 
  Upload, 
  MapPin, 
  Navigation, 
  Loader2, 
  ChevronRight,
  Image as ImageIcon,
  Save,
  Star,
  Trash2,
  Plus,
  X,
  CheckCircle2,
  Package
} from "lucide-react";
import { getCurrentCoordinates, reverseGeocodeCoordinates } from "@/lib/services/gpsService";

export default function TambahKatalogJasaPage() {
  const router = useRouter();
  const { currentUser, addToast } = useApp() || {};

  const [provider, setProvider] = useState(() => {
    return currentUser || {};
  });

  useEffect(() => {
    if (currentUser) {
      setProvider(currentUser);
      setFormData((prev) => ({
        ...prev,
        address: prev.address || currentUser.partnerAddress || currentUser.campusName || "",
      }));
    }
  }, [currentUser]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDetectingGps, setIsDetectingGps] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [photoUrlInput, setPhotoUrlInput] = useState("");

  // Form State: Mendukung Mode Hibrida (Harga Tunggal ATAU Paket Bertingkat) & Multi-Foto
  const [formData, setFormData] = useState({
    title: "",
    category: "Logo",
    customCategory: "",
    pricingMode: "single", // 'single' atau 'tiered'
    price: 75000,
    unit: "/ proyek",
    tieredPackages: [
      {
        id: "pkg-basic",
        name: "Paket Basic",
        tier: "Basic",
        price: 50000,
        duration: "1 Hari Kerja",
        description: "Pilihan hemat untuk pengerjaan mendasar.",
        featuresStr: "1 Konsep Desain Pilihan\nRevisi 1 Kali\nFile PNG / JPG Siap Pakai",
        isPopular: false,
      },
      {
        id: "pkg-standard",
        name: "Paket Standard",
        tier: "Standard",
        price: 100000,
        duration: "2 Hari Kerja",
        description: "Paket paling diminati dengan fitur lengkap dan garansi revisi.",
        featuresStr: "2 Konsep Desain Pilihan\nRevisi 3 Kali\nFile Master Siap Edit\nResolusi Tinggi Siap Pakai",
        isPopular: true,
      },
    ],
    photos: [],
    image: "",
    desc: "",
    locationType: "hybrid",
    latitude: -7.4112,
    longitude: 109.2458,
    address: currentUser?.partnerAddress || currentUser?.campusName || "Lokasi Kerja Mitra, Purwokerto Utara",
    skillsStr: "Desain Grafis, Branding, Mockup",
    deliveryDuration: "1-2 Hari Kerja",
    notes: "",
  });

  const DRAFT_KEY = "bantuin_draft_jasa_katalog_tambah";
  const hasLoadedDraftRef = useRef(false);

  useEffect(() => {
    if (hasLoadedDraftRef.current) return;
    hasLoadedDraftRef.current = true;
    const draft = getFormDraft(DRAFT_KEY, null);
    if (draft) {
      setFormData((prev) => ({ ...prev, ...draft }));
    }
  }, []);

  useEffect(() => {
    if (!hasLoadedDraftRef.current) return;
    if (formData.title || formData.desc || formData.customCategory) {
      saveFormDraft(DRAFT_KEY, formData);
    }
  }, [formData]);

  const isFormDirty = Boolean(formData.title.trim().length > 0 || (formData.desc && formData.desc.trim().length > 0));
  useBeforeUnload(isFormDirty, "Ada isian layanan jasa baru yang belum disimpan. Yakin ingin meninggalkan halaman?");

  // Hitung harga paket terendah secara realtime untuk kartu etalase
  const calculatedLowestPrice = formData.pricingMode === "tiered"
    ? Math.min(
        ...formData.tieredPackages
          .map((p) => Number(p.price) || 0)
          .filter((p) => p > 0)
      ) || 50000
    : Number(formData.price || 0);

  // Helper untuk mengubah data tier paket
  const handleTierChange = (index, field, value) => {
    const updated = [...formData.tieredPackages];
    updated[index] = { ...updated[index], [field]: value };
    setFormData((prev) => ({ ...prev, tieredPackages: updated }));
  };

  // Helper tambah paket tier ke-3 (Premium)
  const handleAddTier = () => {
    if (formData.tieredPackages.length >= 3) return;
    const newTier = {
      id: "pkg-premium",
      name: "Paket Premium",
      tier: "Premium",
      price: 200000,
      duration: "3-4 Hari Kerja",
      description: "Solusi terlengkap dan prioritas pengerjaan untuk hasil maksimal.",
      featuresStr: "3 Konsep Desain Eksklusif\nRevisi Tanpa Batas (Wajar)\nFile Master Lengkap + Lisensi Komersial\nPrioritas Support & Pengerjaan Cepat",
      isPopular: false,
    };
    setFormData((prev) => ({
      ...prev,
      tieredPackages: [...prev.tieredPackages, newTier],
    }));
  };

  // Helper hapus paket tier
  const handleRemoveTier = (index) => {
    if (formData.tieredPackages.length <= 2) {
      addToast?.("Minimal 2 Paket", "Paket bertingkat membutuhkan minimal 2 tingkatan paket.", "warning");
      return;
    }
    const updated = formData.tieredPackages.filter((_, i) => i !== index);
    setFormData((prev) => ({ ...prev, tieredPackages: updated }));
  };

  const categoryPresets = [
    "Logo",
    "Kemasan",
    "Sosial Media",
    "Cetak",
    "UI/UX",
    "Website",
    "Fotografi",
    "Video",
    "Dokumen",
    "__CUSTOM__"
  ];

  // Handler upload multiple foto sampul (maksimal 6)
  const handlePhotoUpload = async (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length === 0) return;

    const currentPhotos = formData.photos || [];
    if (currentPhotos.length >= 6) {
      addToast?.("Batas Maksimal", "Maksimal hanya 6 foto sampul layanan yang diperbolehkan.", "warning");
      return;
    }

    const availableSlots = 6 - currentPhotos.length;
    const filesToUpload = selectedFiles.slice(0, availableSlots);

    if (selectedFiles.length > availableSlots) {
      addToast?.("Sebagian Foto Dipotong", `Hanya ${availableSlots} foto yang ditambahkan karena batas maksimal adalah 6 foto.`, "info");
    }

    setIsUploadingPhoto(true);
    try {
      const uploadedUrls = [];
      for (const file of filesToUpload) {
        try {
          const res = await imageService.uploadImage(file, "service", "catalog");
          if (res?.url) uploadedUrls.push(res.url);
        } catch (err) {
          console.warn("Gagal upload salah satu file:", err);
        }
      }

      if (uploadedUrls.length > 0) {
        setFormData((prev) => {
          const updated = [...(prev.photos || []), ...uploadedUrls].slice(0, 6);
          return {
            ...prev,
            photos: updated,
            image: updated[0] || prev.image,
          };
        });
        addToast?.("Foto Berhasil Diunggah", `${uploadedUrls.length} foto sampul berhasil ditambahkan.`);
      }
    } catch (err) {
      addToast?.("Gagal Upload", err.message || "Gagal mengunggah foto.", "error");
    } finally {
      setIsUploadingPhoto(false);
      e.target.value = "";
    }
  };

  // Jadikan foto pada index tertentu sebagai Foto Sampul Utama
  const handleSetPrimaryPhoto = (index) => {
    const currentPhotos = [...(formData.photos || [])];
    if (index <= 0 || index >= currentPhotos.length) return;
    const selected = currentPhotos[index];
    const remaining = currentPhotos.filter((_, i) => i !== index);
    const reordered = [selected, ...remaining];
    setFormData((prev) => ({
      ...prev,
      photos: reordered,
      image: reordered[0],
    }));
    addToast?.("Sampul Utama Diperbarui", "Foto terpilih berhasil dijadikan foto sampul utama.");
  };

  // Hapus foto tertentu
  const handleRemovePhoto = (index) => {
    const currentPhotos = [...(formData.photos || [])];
    if (currentPhotos.length <= 1) {
      addToast?.("Foto Wajib Ada", "Minimal harus ada 1 foto sampul layanan.", "warning");
      return;
    }
    const updated = currentPhotos.filter((_, i) => i !== index);
    setFormData((prev) => ({
      ...prev,
      photos: updated,
      image: updated[0] || "",
    }));
    addToast?.("Foto Dihapus", "Foto berhasil dihapus dari daftar sampul.");
  };

  // Tambah URL foto manual
  const handleAddPhotoUrl = () => {
    const trimmed = photoUrlInput.trim();
    if (!trimmed) return;
    const currentPhotos = formData.photos || [];
    if (currentPhotos.length >= 6) {
      addToast?.("Batas Maksimal", "Maksimal hanya 6 foto sampul layanan yang diperbolehkan.", "warning");
      return;
    }
    const updated = [...currentPhotos, trimmed].slice(0, 6);
    setFormData((prev) => ({
      ...prev,
      photos: updated,
      image: updated[0] || prev.image,
    }));
    setPhotoUrlInput("");
    addToast?.("Foto Ditambahkan", "URL foto berhasil ditambahkan ke sampul.");
  };

  const handleDetectGPS = async () => {
    if (typeof window === "undefined" || typeof navigator === "undefined" || !navigator.geolocation) {
      addToast?.("GPS Tidak Didukung", "Browser Anda tidak mendukung deteksi lokasi.", "warning");
      return;
    }
    setIsDetectingGps(true);
    try {
      const coords = await getCurrentCoordinates();
      const lat = Number(coords.latitude.toFixed(5));
      const lng = Number(coords.longitude.toFixed(5));
      let resolvedAddress = "";
      try {
        const geo = await reverseGeocodeCoordinates(lat, lng);
        if (geo?.fullAddress) {
          resolvedAddress = geo.fullAddress;
        } else if (geo?.shortLocation) {
          resolvedAddress = geo.shortLocation;
        }
      } catch (geoErr) {
        console.warn("Reverse geocode warning:", geoErr);
      }
      setFormData((prev) => ({
        ...prev,
        latitude: lat,
        longitude: lng,
        ...(resolvedAddress ? { address: resolvedAddress } : {}),
      }));
      addToast?.("Lokasi Terdeteksi", "Koordinat GPS dan alamat pengerjaan berhasil disinkronkan.");
    } catch (err) {
      addToast?.("Gagal Deteksi GPS", err.message || "Izin lokasi diblokir atau sinyal lemah.", "warning");
    } finally {
      setIsDetectingGps(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      addToast?.("Form Belum Lengkap", "Silakan isi nama / judul layanan jasa.", "error");
      return;
    }

    let finalPackages = [];
    let startingPrice = Number(formData.price);

    if (formData.pricingMode === "tiered") {
      const validTiers = formData.tieredPackages.map((p, idx) => ({
        id: p.id || `pkg-${Date.now()}-${idx}`,
        name: p.name.trim() || `Paket ${p.tier || idx + 1}`,
        tier: p.tier || `Tier ${idx + 1}`,
        price: Number(p.price) || 50000,
        duration: p.duration?.trim() || "1-2 Hari Kerja",
        description: p.description?.trim() || "Pengerjaan layanan profesional berstandar tinggi.",
        features: (p.featuresStr || "")
          .split("\n")
          .map((f) => f.trim())
          .filter(Boolean),
        isPopular: Boolean(p.isPopular),
      }));

      if (validTiers.some((p) => p.price <= 0 || isNaN(p.price))) {
        addToast?.("Harga Paket Belum Valid", "Pastikan setiap paket memiliki tarif angka yang valid.", "error");
        return;
      }

      finalPackages = validTiers;
      startingPrice = Math.min(...validTiers.map((p) => p.price));
    } else {
      const singlePrice = Number(formData.price);
      if (isNaN(singlePrice) || singlePrice <= 0) {
        addToast?.("Tarif Belum Diisi", "Silakan isi tarif layanan yang valid.", "error");
        return;
      }
      startingPrice = singlePrice;
      const cleanDuration = formData.deliveryDuration?.trim() || "1-2 Hari Kerja";
      const cleanUnit = formData.unit?.trim() || "/ proyek";
      finalPackages = [
        {
          id: `pkg-${Date.now()}-1`,
          name: formData.title.trim() || "Layanan Standar",
          tier: "Standar",
          price: singlePrice,
          unit: cleanUnit,
          duration: cleanDuration,
          deliveryDuration: cleanDuration,
          description: formData.desc.trim() || "Pengerjaan layanan standar sesuai deskripsi kebutuhan.",
          features: [
            "Pengerjaan langsung oleh mitra terverifikasi",
            "Garansi pengerjaan & revisi wajar",
            "Koordinasi langsung via chat Bantuin",
          ],
          isPopular: true,
        },
      ];
    }

    const finalPhotos = Array.isArray(formData.photos) && formData.photos.length > 0
      ? formData.photos.slice(0, 6)
      : (formData.image ? [formData.image] : []);

    if (finalPhotos.length === 0) {
      addToast?.("Foto Wajib Ada", "Silakan sertakan minimal 1 foto sampul layanan.", "warning");
      return;
    }

    setIsSubmitting(true);

    const resolvedCategory = formData.category === "__CUSTOM__"
      ? (formData.customCategory.trim() || "Layanan Kustom")
      : formData.category;

    const payload = {
      title: formData.title.trim(),
      category: resolvedCategory,
      description: formData.desc.trim() || "Layanan pengerjaan profesional berkualitas tinggi dengan garansi kepuasan klien.",
      startingPrice: startingPrice,
      packages: finalPackages,
      portfolioUrls: finalPhotos,
      tags: formData.skillsStr.split(",").map((s) => s.trim()).filter(Boolean),
      locationType: formData.locationType || "hybrid",
      latitude: formData.latitude,
      longitude: formData.longitude,
      address: formData.address,
    };

    try {
      const token = await authService.getValidAccessToken();
      const res = await fetch("/api/services", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const resJson = await res.json();
      if (!res.ok || !resJson.success) {
        throw new Error(resJson.error || "Gagal menyimpan layanan ke database.");
      }

      const newItem = {
        id: resJson.data?.id || `cat-${Date.now()}`,
        title: formData.title.trim(),
        category: resolvedCategory,
        price: startingPrice,
        startingPrice: startingPrice,
        unit: formData.unit,
        packages: finalPackages,
        pricingMode: formData.pricingMode,
        image: finalPhotos[0],
        photos: finalPhotos,
        portfolioUrls: finalPhotos,
        desc: formData.desc.trim() || "Layanan pengerjaan profesional berkualitas tinggi dengan garansi kepuasan klien.",
        locationType: formData.locationType,
        latitude: formData.latitude,
        longitude: formData.longitude,
        address: formData.address,
        skills: formData.skillsStr.split(",").map((s) => s.trim()).filter(Boolean),
        deliveryDuration: formData.deliveryDuration,
        duration: formData.deliveryDuration,
        notes: formData.notes,
        createdAt: new Date().toISOString(),
        status: "active",
      };

      const currentCatalog = provider.catalog || [];
      const updatedProvider = {
        ...provider,
        catalog: [newItem, ...currentCatalog],
      };
      saveProviderData(updatedProvider);
      setProvider(updatedProvider);

      if (typeof window !== "undefined" && currentUser?.id) {
        try {
          localStorage.setItem(`bantuin_provider_catalog_${currentUser.id}`, JSON.stringify([newItem, ...currentCatalog]));
        } catch (_) {}
      }

      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("bantuin_service_updated"));
      }

      clearFormDraft(DRAFT_KEY);
      addToast?.("Layanan Ditambahkan", `"${newItem.title}" berhasil dipublikasikan ke database.`);

      setTimeout(() => {
        router.push("/jasa/dashboard");
      }, 300);
    } catch (err) {
      console.error("Gagal simpan ke DB, menyimpan secara lokal:", err);
      const newItem = {
        id: `cat-${Date.now()}`,
        title: formData.title.trim(),
        category: resolvedCategory,
        price: Number(formData.price),
        unit: formData.unit,
        image: formData.image,
        desc: formData.desc.trim() || "Layanan pengerjaan profesional berkualitas tinggi dengan garansi kepuasan klien.",
        locationType: formData.locationType,
        latitude: formData.latitude,
        longitude: formData.longitude,
        address: formData.address,
        skills: formData.skillsStr.split(",").map((s) => s.trim()).filter(Boolean),
        deliveryDuration: formData.deliveryDuration,
        notes: formData.notes,
        createdAt: new Date().toISOString(),
        status: "active",
      };

      const currentCatalog = provider.catalog || [];
      const updatedProvider = {
        ...provider,
        catalog: [newItem, ...currentCatalog],
      };

      saveProviderData(updatedProvider);
      setProvider(updatedProvider);

      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("bantuin_service_updated"));
      }

      clearFormDraft(DRAFT_KEY);
      addToast?.("Layanan Ditambahkan", `"${newItem.title}" disimpan.`);

      setTimeout(() => {
        router.push("/jasa/dashboard");
      }, 300);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <RoleGuard allowedRoles={["provider"]}>
      <div className="min-h-screen bg-[#F4F7FB] pb-24">
        {/* Header Navigation & Breadcrumb */}
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
                <span className="text-slate-900 font-bold shrink-0">Tambah Layanan Baru</span>
              </div>
              <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 flex items-center gap-2">
                <Layers className="w-5 h-5 text-[#1683FF]" />
                <span>Tambah Layanan Jasa Baru</span>
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/jasa/dashboard"
                className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Kembali ke Dashboard</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Main Form Content */}
        <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Section 1: Informasi Dasar Layanan */}
            <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/90 shadow-xs space-y-5">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <div>
                  <h2 className="text-sm sm:text-base font-extrabold text-slate-900">1. Informasi Utama Layanan</h2>
                  <p className="text-xs text-slate-500">Tentukan judul, kategori, dan tarif yang jelas bagi calon klien.</p>
                </div>
                <span className="px-2.5 py-1 bg-blue-50 text-[#1683FF] rounded-lg text-[11px] font-bold">Wajib Diisi</span>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    Nama / Judul Layanan <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Desain Logo & Identitas Brand UMKM"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full p-3 rounded-2xl border border-slate-200 text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:border-[#1683FF] focus:ring-2 focus:ring-blue-100 transition bg-slate-50/50"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Gunakan judul yang ringkas, deskriptif, dan menarik minat klien.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Kategori Layanan */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                      Kategori Layanan <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full p-3 rounded-2xl border border-slate-200 text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:border-[#1683FF] transition bg-white"
                    >
                      {categoryPresets.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat === "__CUSTOM__" ? "+ Kategori Kustom Sendiri" : cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Kategori Kustom (Jika dipilih) */}
                  {formData.category === "__CUSTOM__" ? (
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1.5">
                        Nama Kategori Kustom <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Contoh: Desain 3D Animasi"
                        value={formData.customCategory}
                        onChange={(e) => setFormData({ ...formData, customCategory: e.target.value })}
                        className="w-full p-3 rounded-2xl border border-blue-200 text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:border-[#1683FF] bg-blue-50/20"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1.5">
                        Estimasi Waktu Pengerjaan
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: 1-2 Hari Kerja"
                        value={formData.deliveryDuration}
                        onChange={(e) => setFormData({ ...formData, deliveryDuration: e.target.value })}
                        className="w-full p-3 rounded-2xl border border-slate-200 text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-[#1683FF] bg-white"
                      />
                    </div>
                  )}
                </div>

                {/* Sub-Section: Skema Tarif Layanan (Mode Hibrida) */}
                <div className="pt-2 border-t border-slate-100 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-blue-50/50 border border-blue-100/80">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-extrabold text-slate-900">
                          Skema Tarif &amp; Paket Layanan
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-blue-100 text-[#1683FF] text-[10px] font-extrabold uppercase">
                          {formData.pricingMode === "tiered" ? "Paket Bertingkat Aktif" : "Harga Tunggal"}
                        </span>
                      </div>
                      <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
                        Pilih harga tunggal untuk jasa sederhana, atau aktifkan paket bertingkat (Basic / Standard / Premium).
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
                        <span>+ Paket Bertingkat</span>
                      </button>
                    </div>
                  </div>

                  {/* JIKA MODE HARGA TUNGGAL */}
                  {formData.pricingMode === "single" ? (
                    <div className="space-y-4 animate-in fade-in duration-200">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                        {/* 1. Tarif Layanan */}
                        <div>
                          <label className="block text-xs font-bold text-slate-800 mb-1.5">
                            Tarif Layanan (Rp) <span className="text-rose-500">*</span>
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
                              placeholder="75000"
                              value={formData.price}
                              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                              className="w-full pl-10 pr-3.5 py-3 rounded-2xl border border-slate-200 text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:border-[#1683FF] bg-slate-50/50"
                            />
                          </div>
                          <p className="text-[10px] text-slate-400 mt-1">
                            Tarif tetap etalase katalog.
                          </p>
                        </div>

                        {/* 2. Satuan / Unit Tarif */}
                        <div>
                          <label className="block text-xs font-bold text-slate-800 mb-1.5">
                            Satuan / Unit Tarif
                          </label>
                          <select
                            value={formData.unit}
                            onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                            className="w-full p-3 rounded-2xl border border-slate-200 text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:border-[#1683FF] bg-white"
                          >
                            <option value="/ proyek">/ proyek</option>
                            <option value="/ pekerjaan">/ pekerjaan</option>
                            <option value="/ jam">/ jam</option>
                            <option value="/ sesi">/ sesi</option>
                            <option value="/ desain">/ desain</option>
                            <option value="/ halaman">/ halaman</option>
                            <option value="/ unit">/ unit</option>
                          </select>
                          <p className="text-[10px] text-slate-400 mt-1">
                            Satuan hitung layanan.
                          </p>
                        </div>

                        {/* 3. Estimasi Durasi Pengerjaan */}
                        <div>
                          <label className="block text-xs font-bold text-slate-800 mb-1.5">
                            Estimasi Durasi Pengerjaan
                          </label>
                          <input
                            type="text"
                            placeholder="Contoh: 1-2 Hari Kerja, 3 Jam"
                            value={formData.deliveryDuration}
                            onChange={(e) => setFormData({ ...formData, deliveryDuration: e.target.value })}
                            className="w-full px-3.5 py-3 rounded-2xl border border-slate-200 text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:border-[#1683FF] bg-white"
                          >
                          </input>
                          <p className="text-[10px] text-slate-400 mt-1">
                            Contoh: 1-2 Hari Kerja, 3 Jam.
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* JIKA MODE PAKET BERTINGKAT */
                    <div className="space-y-4 animate-in fade-in duration-200">
                      {/* Banner Preview Harga Card Etalase */}
                      <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                            <CheckCircle2 className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-[11px] font-extrabold uppercase text-emerald-800 block">
                              Tampilan Harga di Kartu Etalase Katalog:
                            </span>
                            <span className="text-xs sm:text-sm font-black text-emerald-900">
                              Mulai dari {formatIDR(calculatedLowestPrice)}
                            </span>
                          </div>
                        </div>
                        <span className="text-[10px] text-emerald-700 font-medium hidden sm:inline text-right max-w-[200px]">
                          Otomatis mengambil paket paling murah sebagai harga pembuka
                        </span>
                      </div>

                      {/* Grid Paket Bertingkat */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                        {formData.tieredPackages.map((pkg, pIdx) => (
                          <div
                            key={pIdx}
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
                                  placeholder={`Paket ${pkg.tier}`}
                                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#1683FF]"
                                />
                              </div>

                              <div>
                                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                  Tarif Paket (Rp) <span className="text-rose-500">*</span>
                                </label>
                                <div className="relative">
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400">
                                    Rp
                                  </span>
                                  <input
                                    type="number"
                                    required={formData.pricingMode === "tiered"}
                                    min={1000}
                                    step={1000}
                                    value={pkg.price}
                                    onChange={(e) => handleTierChange(pIdx, "price", e.target.value)}
                                    placeholder="100000"
                                    className="w-full pl-9 pr-2.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#1683FF]"
                                  />
                                </div>
                              </div>

                              <div>
                                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                  Estimasi Pengerjaan
                                </label>
                                <input
                                  type="text"
                                  value={pkg.duration}
                                  onChange={(e) => handleTierChange(pIdx, "duration", e.target.value)}
                                  placeholder="1-2 Hari Kerja"
                                  className="w-full p-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-[#1683FF]"
                                />
                              </div>

                              <div>
                                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                  Deskripsi Singkat Paket
                                </label>
                                <input
                                  type="text"
                                  value={pkg.description}
                                  onChange={(e) => handleTierChange(pIdx, "description", e.target.value)}
                                  placeholder="Deskripsi spesifikasi paket..."
                                  className="w-full p-2 rounded-xl border border-slate-200 text-xs text-slate-700 focus:outline-none focus:border-[#1683FF]"
                                />
                              </div>

                              <div>
                                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                  Fitur Paket (1 baris = 1 poin)
                                </label>
                                <textarea
                                  rows={3}
                                  value={pkg.featuresStr}
                                  onChange={(e) => handleTierChange(pIdx, "featuresStr", e.target.value)}
                                  placeholder={"File PNG / JPG\nRevisi 2x\nMaster File Siap Pakai"}
                                  className="w-full p-2 rounded-xl border border-slate-200 text-[11px] text-slate-700 focus:outline-none focus:border-[#1683FF]"
                                />
                              </div>
                            </div>

                            {formData.tieredPackages.length > 2 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveTier(pIdx)}
                                className="w-full py-1.5 text-rose-600 hover:bg-rose-50 rounded-lg text-[10px] font-bold transition flex items-center justify-center gap-1 cursor-pointer mt-2"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>Hapus Tier {pkg.tier}</span>
                              </button>
                            )}
                          </div>
                        ))}
                      </div>

                      {formData.tieredPackages.length < 3 && (
                        <button
                          type="button"
                          onClick={handleAddTier}
                          className="w-full py-2.5 rounded-2xl border-2 border-dashed border-blue-200 hover:border-[#1683FF] bg-blue-50/20 hover:bg-blue-50/50 text-[#1683FF] text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                          <span>+ Tambah Paket Premium (Tier 3)</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    Deskripsi Detail Layanan
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Jelaskan secara rinci apa saja yang didapatkan klien, spesifikasi hasil kerja, dan garansi revisi..."
                    value={formData.desc}
                    onChange={(e) => setFormData({ ...formData, desc: e.target.value })}
                    className="w-full p-3.5 rounded-2xl border border-slate-200 text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-[#1683FF] transition bg-white leading-relaxed"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Foto Sampul & Visual Layanan (1 - 6 Foto) */}
            <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/90 shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <h2 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2">
                    <span>2. Foto Sampul &amp; Visual Layanan</span>
                  </h2>
                  <p className="text-xs text-slate-500">
                    Unggah 1 hingga maksimal 6 foto hasil karya atau sampel layanan. Foto pertama bertanda bintang otomatis menjadi foto sampul utama yang dilihat klien.
                  </p>
                </div>
                <span className="text-xs font-bold text-[#1683FF] bg-blue-50 px-3 py-1 rounded-full border border-blue-100 self-start sm:self-auto shrink-0">
                  {(formData.photos || []).length} / 6 Foto Terpasang
                </span>
              </div>

              {/* Grid Galeri Foto (Maksimal 6 Foto) */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                {(formData.photos || []).map((photoUrl, idx) => (
                  <div
                    key={idx}
                    className={`group relative aspect-square rounded-2xl overflow-hidden border-2 transition ${
                      idx === 0
                        ? "border-[#1683FF] ring-2 ring-blue-100 shadow-xs"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <img
                      src={photoUrl}
                      alt={`Foto Sampul ${idx + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />

                    {/* Badge Utama / Button Jadikan Utama */}
                    {idx === 0 ? (
                      <div className="absolute top-1.5 left-1.5 px-2 py-0.5 bg-[#1683FF] text-white text-[10px] font-extrabold rounded-md shadow-xs flex items-center gap-1">
                        <Star className="w-2.5 h-2.5 fill-white shrink-0" />
                        <span>Sampul</span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSetPrimaryPhoto(idx)}
                        className="absolute top-1.5 left-1.5 px-2 py-0.5 bg-black/70 hover:bg-[#1683FF] text-white text-[10px] font-bold rounded-md opacity-0 group-hover:opacity-100 transition shadow-xs flex items-center gap-1 cursor-pointer"
                        title="Jadikan Foto Sampul Utama"
                      >
                        <Star className="w-2.5 h-2.5" />
                        <span>Set Utama</span>
                      </button>
                    )}

                    {/* Tombol Hapus */}
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(idx)}
                      className="absolute top-1.5 right-1.5 p-1 rounded-md bg-black/60 hover:bg-rose-600 text-white opacity-0 group-hover:opacity-100 transition shadow-xs cursor-pointer"
                      title="Hapus Foto"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>

                    <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 bg-black/50 text-white text-[9px] font-bold rounded">
                      {idx === 0 ? "Foto 1 (Utama)" : `Foto ${idx + 1}`}
                    </span>
                  </div>
                ))}

                {/* Slot Tambah Foto Jika Kurang Dari 6 */}
                {(formData.photos || []).length < 6 && (
                  <label className="aspect-square rounded-2xl border-2 border-dashed border-[#1683FF]/40 hover:border-[#1683FF] bg-blue-50/20 hover:bg-blue-50/50 transition cursor-pointer flex flex-col items-center justify-center p-3 text-center group">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handlePhotoUpload}
                      disabled={isUploadingPhoto}
                      className="hidden"
                    />
                    {isUploadingPhoto ? (
                      <Loader2 className="w-6 h-6 text-[#1683FF] animate-spin mb-1" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-[#1683FF] group-hover:bg-[#1683FF] group-hover:text-white transition flex items-center justify-center mb-1">
                        <Plus className="w-4 h-4" />
                      </div>
                    )}
                    <span className="text-[11px] font-bold text-slate-800 leading-tight">
                      {isUploadingPhoto ? "Mengunggah..." : "Tambah Foto"}
                    </span>
                    <span className="text-[9px] text-slate-400 mt-0.5">
                      Sisa {6 - (formData.photos || []).length} slot
                    </span>
                  </label>
                )}
              </div>

              {/* Opsi Tambah via URL Web */}
              {(formData.photos || []).length < 6 && (
                <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-2">
                  <input
                    type="url"
                    placeholder="Atau tempel URL gambar web (https://...)"
                    value={photoUrlInput}
                    onChange={(e) => setPhotoUrlInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddPhotoUrl();
                      }
                    }}
                    className="flex-1 w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-700 focus:outline-none focus:border-[#1683FF] bg-slate-50 font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleAddPhotoUrl}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah URL</span>
                  </button>
                </div>
              )}
            </div>

            {/* Section 3: Mode Pengerjaan & Lokasi Mitra */}
            <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/90 shadow-xs space-y-5">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-sm sm:text-base font-extrabold text-slate-900">3. Mode Pengerjaan &amp; Lokasi Jasa</h2>
                <p className="text-xs text-slate-500">Tentukan apakah jasa dilakukan online / remote, klien datang ke tempat mitra, atau panggilan.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-2">Tipe / Mode Layanan</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {[
                      { id: "onsite", label: "Klien Datang ke Lokasi Mitra", desc: "Klien datang ke tempat mitra" },
                      { id: "customer_location", label: "Mitra Datang ke Lokasi Klien", desc: "Penyedia datang ke tempat klien" },
                      { id: "online", label: "100% Online / Digital", desc: "Pengerjaan jarak jauh & berkas digital" },
                      { id: "hybrid", label: "Hybrid (Online / Tatap Muka)", desc: "Bisa online atau bertemu langsung" },
                    ].map((mode) => (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, locationType: mode.id })}
                        className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                          formData.locationType === mode.id
                            ? "bg-[#1683FF] text-white border-[#1683FF] shadow-xs"
                            : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        <span className="block text-xs font-bold">{mode.label}</span>
                        <span className={`block text-[10px] mt-0.5 ${formData.locationType === mode.id ? "text-blue-100" : "text-slate-400"}`}>
                          {mode.desc}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {formData.locationType !== "online" && (
                  <div className="p-4 rounded-2xl bg-blue-50/40 border border-blue-100 space-y-3 animate-in fade-in duration-150">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-[#1683FF]" />
                        <span>Koordinat Titik Lokasi Pengerjaan Mitra</span>
                      </span>
                      <button
                        type="button"
                        onClick={handleDetectGPS}
                        disabled={isDetectingGps}
                        className="px-3 py-1.5 bg-white border border-blue-200 text-[#1683FF] hover:bg-blue-50 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer self-start sm:self-auto"
                      >
                        {isDetectingGps ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Navigation className="w-3.5 h-3.5" />
                        )}
                        <span>{isDetectingGps ? "Mendeteksi..." : "Gunakan Titik GPS Saya"}</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-[11px] text-slate-500 block mb-1">Latitude</span>
                        <input
                          type="number"
                          step="any"
                          value={formData.latitude}
                          onChange={(e) => setFormData({ ...formData, latitude: Number(e.target.value) })}
                          className="w-full p-2 rounded-xl bg-white border border-slate-200 font-mono text-xs text-slate-800"
                        />
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-500 block mb-1">Longitude</span>
                        <input
                          type="number"
                          step="any"
                          value={formData.longitude}
                          onChange={(e) => setFormData({ ...formData, longitude: Number(e.target.value) })}
                          className="w-full p-2 rounded-xl bg-white border border-slate-200 font-mono text-xs text-slate-800"
                        />
                      </div>
                    </div>

                    <div>
                      <span className="text-[11px] text-slate-700 font-semibold block mb-1">Alamat Lengkap / Patokan Lokasi Mitra:</span>
                      <input
                        type="text"
                        placeholder="Contoh: Jl. HR Bunyamin No. 45, Grendeng, Purwokerto Utara (Dekat Kampus Unsoed)"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        className="w-full p-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-[#1683FF]"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Sticky Action Footer */}
            <div className="sticky bottom-4 z-20 bg-white/95 backdrop-blur-md p-4 rounded-3xl border border-slate-200 shadow-xl flex items-center justify-between gap-3">
              <Link
                href="/jasa/dashboard"
                className="px-5 py-2.5 rounded-2xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
              >
                Batal
              </Link>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-2xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Menyimpan Layanan...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Simpan &amp; Publikasikan Layanan</span>
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
