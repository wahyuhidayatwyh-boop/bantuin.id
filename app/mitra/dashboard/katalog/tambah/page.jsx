"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import RoleGuard from "@/components/auth/RoleGuard";
import { useApp } from "@/lib/context/AppContext";
import { getMitraStoreById, saveMitraStoreData } from "@/lib/mock/mitraData";
import { imageService } from "@/lib/services/imageService";
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
  Info,
  ShieldCheck,
  DollarSign
} from "lucide-react";

export default function TambahKatalogRentalPage() {
  const router = useRouter();
  const { setRentals, addToast } = useApp() || {};

  const [store, setStore] = useState(() => {
    return getMitraStoreById("mitra-kamera") || {};
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [newPhotoUrlInput, setNewPhotoUrlInput] = useState("");

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    category: "Kamera",
    customCategory: "",
    price: 150000,
    depositAmount: 200000,
    unit: "/ hari",
    image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80",
    photos: [
      "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&w=800&q=80"
    ],
    stockStatus: "Siap Sewa",
    tag: "Unit Baru",
    desc: "Unit dalam kondisi 98% sangat prima, sensor bersih kinclong tanpa jamur atau debu, baterai sehat awet seharian.",
    stockCount: 2,
    includedItems: "Unit Kamera Body, 2 Baterai Cadangan, Dual Charger, SD Card 64GB High Speed, Tas Waterproof",
  });

  const categoryPresets = [
    "Kamera",
    "Lensa",
    "Stabilizer",
    "Lighting",
    "Audio",
    "Drone",
    "Paket Studio",
    "Outdoor",
    "__CUSTOM__"
  ];

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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      addToast?.("Form Belum Lengkap", "Silakan isi nama unit sewa.", "error");
      return;
    }
    if (!formData.price || Number(formData.price) <= 0) {
      addToast?.("Form Belum Lengkap", "Silakan isi tarif sewa yang valid.", "error");
      return;
    }

    setIsSubmitting(true);

    const resolvedCategory = formData.category === "__CUSTOM__"
      ? (formData.customCategory.trim() || "Unit Rental")
      : formData.category;

    const allPhotos = (formData.photos && formData.photos.length > 0)
      ? formData.photos
      : [formData.image || "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80"];

    const newItemId = `rnt-${Date.now()}`;
    const newItem = {
      id: newItemId,
      name: formData.name.trim(),
      category: resolvedCategory,
      type: "sewa",
      price: Number(formData.price),
      depositAmount: Number(formData.depositAmount) || 0,
      unit: formData.unit,
      image: allPhotos[0],
      photos: allPhotos,
      rating: 5.0,
      reviews: 0,
      stockStatus: formData.stockStatus,
      tag: formData.tag,
      desc: formData.desc.trim(),
      stockCount: Number(formData.stockCount) || 1,
      includedItems: formData.includedItems,
      createdAt: new Date().toISOString(),
    };

    const updatedCatalog = [newItem, ...(store.catalog || [])];
    const updatedStore = { ...store, catalog: updatedCatalog };

    saveMitraStoreData(updatedStore);
    setStore(updatedStore);

    // Sync with AppContext rentals so user sees it in /sewa
    if (setRentals) {
      setRentals((prev) => [
        {
          id: newItemId,
          title: newItem.name,
          category: newItem.category,
          dailyPrice: newItem.price,
          depositAmount: newItem.depositAmount,
          photoUrl: newItem.image,
          photos: newItem.photos,
          stock: newItem.stockCount,
          description: newItem.desc,
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
        ...prev,
      ]);
    }

    setIsSubmitting(false);
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
                      Jumlah Stok Unit
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

                {/* Tarif Sewa & Deposit Jaminan */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
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
                        required
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

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    Kelengkapan Bawaan Unit (Aksesoris Termasuk)
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
                    value={formData.desc}
                    onChange={(e) => setFormData({ ...formData, desc: e.target.value })}
                    className="w-full p-3.5 rounded-2xl border border-slate-200 text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-[#1683FF] bg-white leading-relaxed"
                  />
                </div>
              </div>
            </div>

            {/* 2. Galeri Foto Multi-Item */}
            <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/90 shadow-xs space-y-5">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <div>
                  <h2 className="text-sm sm:text-base font-extrabold text-slate-900">2. Galeri Foto Unit Rental</h2>
                  <p className="text-xs text-slate-500">Unggah foto fisik asli alat dari berbagai sudut (Bisa banyak foto).</p>
                </div>
                <span className="text-xs font-bold text-[#1683FF]">
                  {formData.photos.length} Foto Ditambahkan
                </span>
              </div>

              {/* Photo Previews Grid */}
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

              {/* Upload Dropzone */}
              <div className="space-y-3 pt-2">
                <label className="block p-5 rounded-2xl border-2 border-dashed border-[#1683FF]/40 hover:border-[#1683FF] bg-blue-50/20 hover:bg-blue-50/50 transition cursor-pointer text-center">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    disabled={isUploadingPhoto}
                    className="hidden"
                  />
                  <div className="flex flex-col items-center justify-center gap-1.5">
                    {isUploadingPhoto ? (
                      <Loader2 className="w-7 h-7 text-[#1683FF] animate-spin" />
                    ) : (
                      <Upload className="w-7 h-7 text-[#1683FF]" />
                    )}
                    <span className="text-xs sm:text-sm font-bold text-slate-800">
                      {isUploadingPhoto ? "Mengunggah Foto..." : "+ Pilih Foto Unit dari Perangkat (Bisa Banyak File)"}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Format JPG, PNG, WEBP hingga 5 MB per foto
                    </span>
                  </div>
                </label>

                {/* Input URL */}
                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    placeholder="Atau masukkan URL foto online (https://...)"
                    value={newPhotoUrlInput}
                    onChange={(e) => setNewPhotoUrlInput(e.target.value)}
                    className="flex-1 p-2.5 rounded-xl border border-slate-200 text-xs font-mono text-slate-700 bg-slate-50"
                  />
                  <button
                    type="button"
                    onClick={handleAddPhotoByUrl}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-[#1683FF] text-xs font-bold transition flex items-center gap-1 cursor-pointer border border-slate-200"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah URL</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Sticky Action Footer */}
            <div className="sticky bottom-4 z-20 bg-white/95 backdrop-blur-md p-4 rounded-3xl border border-slate-200 shadow-xl flex items-center justify-between gap-3">
              <Link
                href="/mitra/dashboard"
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
                    <span>Menerbitkan Unit...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Simpan &amp; Publikasikan Unit Rental</span>
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
