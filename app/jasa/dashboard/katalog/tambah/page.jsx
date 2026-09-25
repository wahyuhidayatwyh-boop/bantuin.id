"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import RoleGuard from "@/components/auth/RoleGuard";
import { useApp } from "@/lib/context/AppContext";
import { getProviderById, saveProviderData } from "@/lib/mock/providersData";
import { imageService } from "@/lib/services/imageService";
import { 
  ArrowLeft, 
  Layers, 
  Upload, 
  MapPin, 
  Navigation, 
  Loader2, 
  ChevronRight,
  Image as ImageIcon,
  Save
} from "lucide-react";

export default function TambahKatalogJasaPage() {
  const router = useRouter();
  const { addToast } = useApp() || {};

  const [provider, setProvider] = useState(() => {
    return getProviderById("fajar-ramadhan-desain") || {};
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDetectingGps, setIsDetectingGps] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    category: "Logo",
    customCategory: "",
    price: 75000,
    unit: "/ proyek",
    image: "https://images.unsplash.com/photo-1626785774573-4b799315345d?auto=format&fit=crop&w=800&q=80",
    desc: "",
    locationType: "hybrid",
    latitude: -7.4112,
    longitude: 109.2458,
    address: provider?.address || "Studio Desain Kreatif, Purwokerto Utara",
    skillsStr: "Desain Grafis, Branding, Mockup",
    deliveryDuration: "1-2 Hari Kerja",
    notes: "",
  });

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

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingPhoto(true);
    try {
      const res = await imageService.uploadImage(file, "service");
      if (res.success && res.url) {
        setFormData((prev) => ({ ...prev, image: res.url }));
        addToast?.("Foto Terunggah", "Foto layanan utama berhasil diperbarui.");
      }
    } catch (err) {
      addToast?.("Gagal Upload", err.message || "Gagal mengunggah foto.", "error");
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleDetectGPS = async () => {
    if (typeof window === "undefined" || typeof navigator === "undefined" || !navigator.geolocation) {
      addToast?.("GPS Tidak Didukung", "Browser Anda tidak mendukung deteksi lokasi.", "warning");
      return;
    }
    setIsDetectingGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFormData((prev) => ({
          ...prev,
          latitude: Number(pos.coords.latitude.toFixed(5)),
          longitude: Number(pos.coords.longitude.toFixed(5)),
        }));
        setIsDetectingGps(false);
        addToast?.("Lokasi Terdeteksi", "Koordinat GPS studio Anda berhasil disinkronkan.");
      },
      (err) => {
        setIsDetectingGps(false);
        addToast?.("Gagal Deteksi GPS", "Izin lokasi diblokir atau sinyal lemah.", "warning");
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      addToast?.("Form Belum Lengkap", "Silakan isi nama / judul layanan jasa.", "error");
      return;
    }
    if (!formData.price || Number(formData.price) <= 0) {
      addToast?.("Form Belum Lengkap", "Silakan isi tarif layanan yang valid.", "error");
      return;
    }

    setIsSubmitting(true);

    const resolvedCategory = formData.category === "__CUSTOM__"
      ? (formData.customCategory.trim() || "Layanan Kustom")
      : formData.category;

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
    addToast?.("Layanan Ditambahkan", `"${newItem.title}" berhasil dipublikasikan ke katalog.`);

    setTimeout(() => {
      router.push("/jasa/dashboard");
    }, 400);
  };

  return (
    <RoleGuard allowedRoles={["provider"]}>
      <div className="min-h-screen bg-[#F4F7FB] pb-24">
        {/* Header Navigation & Breadcrumb */}
        <div className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                <Link href="/jasa/dashboard" className="hover:text-[#1683FF] transition font-medium">
                  Dashboard
                </Link>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                <Link href="/jasa/dashboard" className="hover:text-[#1683FF] transition font-medium">
                  Katalog Layanan
                </Link>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-900 font-bold">Tambah Layanan Baru</span>
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

                {/* Tarif & Satuan */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                      Tarif Mulai Dari (Rp) <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                        Rp
                      </div>
                      <input
                        type="number"
                        required
                        min={1000}
                        step={1000}
                        placeholder="75000"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        className="w-full pl-10 pr-3.5 py-3 rounded-2xl border border-slate-200 text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:border-[#1683FF] bg-slate-50/50"
                      />
                    </div>
                  </div>

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
                      <option value="/ desain">/ desain</option>
                      <option value="/ halaman">/ halaman</option>
                      <option value="/ jam">/ jam</option>
                      <option value="/ sesi">/ sesi</option>
                      <option value="/ pekerjaan">/ pekerjaan</option>
                    </select>
                  </div>
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

            {/* Section 2: Foto Utama & Visual Layanan */}
            <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/90 shadow-xs space-y-5">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-sm sm:text-base font-extrabold text-slate-900">2. Foto Sampul &amp; Visual Layanan</h2>
                <p className="text-xs text-slate-500">Unggah foto hasil karya atau sampel visual yang memikat calon klien.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                <div className="md:col-span-1">
                  <div className="aspect-4/3 rounded-2xl border-2 border-dashed border-slate-200 overflow-hidden relative bg-slate-50 group flex items-center justify-center">
                    {formData.image ? (
                      <img
                        src={formData.image}
                        alt="Preview Layanan"
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                    ) : (
                      <div className="text-center p-4">
                        <ImageIcon className="w-8 h-8 text-slate-300 mx-auto mb-1" />
                        <span className="text-[11px] text-slate-400">Belum ada foto</span>
                      </div>
                    )}
                    <span className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold rounded-md">
                      Foto Sampul
                    </span>
                  </div>
                </div>

                <div className="md:col-span-2 space-y-3">
                  <label className="block p-4 rounded-2xl border-2 border-dashed border-[#1683FF]/40 hover:border-[#1683FF] bg-blue-50/20 hover:bg-blue-50/50 transition cursor-pointer text-center">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      disabled={isUploadingPhoto}
                      className="hidden"
                    />
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      {isUploadingPhoto ? (
                        <Loader2 className="w-6 h-6 text-[#1683FF] animate-spin" />
                      ) : (
                        <Upload className="w-6 h-6 text-[#1683FF]" />
                      )}
                      <span className="text-xs font-bold text-slate-800">
                        {isUploadingPhoto ? "Sedang Memproses Foto..." : "Klik untuk Pilih Foto dari Perangkat"}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Mendukung format JPG, PNG, WEBP (Maksimal 5 MB)
                      </span>
                    </div>
                  </label>

                  <div>
                    <span className="block text-xs font-bold text-slate-700 mb-1">Atau Tempel URL Gambar Web:</span>
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/..."
                      value={formData.image}
                      onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-mono text-slate-700 focus:outline-none focus:border-[#1683FF] bg-slate-50"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3: Mode Pengerjaan & Lokasi Studio */}
            <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/90 shadow-xs space-y-5">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-sm sm:text-base font-extrabold text-slate-900">3. Mode Pengerjaan &amp; Lokasi Jasa</h2>
                <p className="text-xs text-slate-500">Tentukan apakah jasa dilakukan online / remote, di studio, atau panggilan.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-2">Tipe / Mode Layanan</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {[
                      { id: "onsite", label: "Di Studio Saya", desc: "Klien datang ke tempat" },
                      { id: "customer_location", label: "Panggilan ke Klien", desc: "Penyedia datang ke klien" },
                      { id: "online", label: "100% Online / Remote", desc: "Pengerjaan digital via file" },
                      { id: "hybrid", label: "Hybrid (Online/Onsite)", desc: "Bisa remote & tatap muka" },
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
                        <span>Koordinat Titik Studio / Workshop</span>
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
                      <span className="text-[11px] text-slate-700 font-semibold block mb-1">Alamat / Patokan Studio Fisik:</span>
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
