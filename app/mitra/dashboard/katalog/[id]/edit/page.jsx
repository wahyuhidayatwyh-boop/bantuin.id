"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Save, 
  Upload, 
  Trash2, 
  Star, 
  Plus, 
  ShieldCheck, 
  Info, 
  Check, 
  ChevronRight, 
  Eye,
  Camera,
  Layers,
  AlertCircle,
  Loader2
} from "lucide-react";
import RoleGuard from "@/components/auth/RoleGuard";
import { useApp } from "@/lib/context/AppContext";
import { getMitraStoreById, saveMitraStoreData } from "@/lib/mock/mitraData";
import { imageService } from "@/lib/services/imageService";
import { formatIDR } from "@/lib/utils";

const RENTAL_CATEGORIES = [
  "Kamera",
  "Lensa",
  "Aksesoris",
  "Lighting",
  "Audio",
  "Drone",
  "Gimbal & Stabilizer",
  "Laptop & PC",
  "Display & TV",
  "Sound System",
  "Percetakan & Display",
  "Lainnya"
];

const STOCK_STATUSES = [
  "Siap Sewa",
  "Sedang Disewa",
  "Dalam Perawatan",
  "Nonaktif"
];

const UNIT_PERIODS = [
  "/ hari",
  "/ 12 jam",
  "/ 24 jam",
  "/ shift",
  "/ event",
  "/ minggu"
];

export default function EditRentalUnitPage({ params }) {
  const router = useRouter();
  const unwrappedParams = use(params);
  const itemId = unwrappedParams.id;
  const { addToast, setRentals } = useApp();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [store, setStore] = useState(null);
  const [notFound, setNotFound] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Kamera");
  const [price, setPrice] = useState("");
  const [unit, setUnit] = useState("/ hari");
  const [tag, setTag] = useState("");
  const [stockStatus, setStockStatus] = useState("Siap Sewa");
  const [desc, setDesc] = useState("");
  const [securityDeposit, setSecurityDeposit] = useState("");
  const [includes, setIncludes] = useState("");
  
  // Photos state: [{ id, url, isPrimary, file }]
  const [photos, setPhotos] = useState([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [rating, setRating] = useState(5.0);
  const [reviews, setReviews] = useState(0);

  useEffect(() => {
    const currentStore = getMitraStoreById("mitra-kamera");
    if (!currentStore) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    setStore(currentStore);

    const unitItem = currentStore.catalog?.find(c => String(c.id) === String(itemId));
    if (!unitItem) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    setName(unitItem.name || "");
    setCategory(unitItem.category || "Kamera");
    setPrice(unitItem.price ? String(unitItem.price) : "");
    setUnit(unitItem.unit || "/ hari");
    setTag(unitItem.tag || "");
    setStockStatus(unitItem.stockStatus || "Siap Sewa");
    setDesc(unitItem.desc || "");
    setSecurityDeposit(unitItem.securityDeposit || currentStore.securityDepositPolicy || "");
    setIncludes(unitItem.includes || "1x Unit Utama, 1x Tas Carrier, 2x Baterai, 1x Charger Original");
    setRating(unitItem.rating || 5.0);
    setReviews(unitItem.reviews || 0);

    const initialPhotos = [];
    if (unitItem.image) {
      initialPhotos.push({
        id: "main-0",
        url: unitItem.image,
        isPrimary: true
      });
    }
    if (Array.isArray(unitItem.photos)) {
      unitItem.photos.forEach((photoUrl, idx) => {
        if (photoUrl !== unitItem.image && !initialPhotos.some(p => p.url === photoUrl)) {
          initialPhotos.push({
            id: `sub-${idx}`,
            url: photoUrl,
            isPrimary: false
          });
        }
      });
    }
    if (initialPhotos.length === 0) {
      initialPhotos.push({
        id: "default-1",
        url: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80",
        isPrimary: true
      });
    }
    setPhotos(initialPhotos);
    setLoading(false);
  }, [itemId]);

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploadingPhoto(true);
    try {
      const uploadResults = await imageService.uploadImages(files, "mitra-catalog");
      const newPhotoObjects = uploadResults.map((res, i) => ({
        id: `uploaded-${Date.now()}-${i}`,
        url: res.url,
        isPrimary: photos.length === 0 && i === 0
      }));

      setPhotos(prev => {
        const combined = [...prev, ...newPhotoObjects];
        if (!combined.some(p => p.isPrimary) && combined.length > 0) {
          combined[0].isPrimary = true;
        }
        return combined;
      });

      if (addToast) {
        addToast("Foto Ditambahkan", `${files.length} foto berhasil diunggah.`);
      }
    } catch (err) {
      console.error(err);
      if (addToast) {
        addToast("Gagal Unggah", "Terjadi kesalahan saat mengunggah foto.");
      }
    } finally {
      setUploadingPhoto(false);
    }
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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      alert("Mohon masukkan nama unit rental.");
      return;
    }
    if (!price || isNaN(Number(price))) {
      alert("Mohon masukkan tarif sewa yang valid.");
      return;
    }

    setSaving(true);

    const primaryPhoto = photos.find(p => p.isPrimary)?.url || photos[0]?.url || "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80";
    const allPhotoUrls = photos.map(p => p.url);

    const updatedUnit = {
      id: itemId,
      name: name.trim(),
      category,
      type: "sewa",
      price: Number(price),
      unit,
      tag: tag.trim() || undefined,
      stockStatus,
      image: primaryPhoto,
      photos: allPhotoUrls,
      desc: desc.trim(),
      securityDeposit: securityDeposit.trim(),
      includes: includes.trim(),
      rating,
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
        return prev.map(r => String(r.id) === String(itemId) ? { ...r, ...updatedUnit } : r);
      });
    }

    if (addToast) {
      addToast("Unit Diperbarui", `Perubahan untuk "${updatedUnit.name}" berhasil disimpan.`);
    }

    router.push(`/mitra/dashboard/katalog/${itemId}`);
  };

  if (loading) {
    return (
      <RoleGuard allowedRoles={["mitra", "super_admin"]}>
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
          <div className="text-center">
            <Loader2 className="w-10 h-10 text-emerald-600 animate-spin mx-auto mb-3" />
            <p className="text-slate-600 font-medium">Memuat data unit rental...</p>
          </div>
        </div>
      </RoleGuard>
    );
  }

  if (notFound) {
    return (
      <RoleGuard allowedRoles={["mitra", "super_admin"]}>
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center max-w-md w-full">
            <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-900 mb-2">Unit Tidak Ditemukan</h2>
            <p className="text-slate-600 text-sm mb-6">
              Unit sewa dengan ID <strong>{itemId}</strong> tidak ditemukan pada katalog toko mitra Anda.
            </p>
            <Link
              href="/mitra/dashboard"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Kembali ke Dashboard Mitra
            </Link>
          </div>
        </div>
      </RoleGuard>
    );
  }

  return (
    <RoleGuard allowedRoles={["mitra", "super_admin"]}>
      <div className="min-h-screen bg-slate-50 pb-24">
        {/* Top Header with Breadcrumbs */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
            <div>
              <nav className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                <Link href="/mitra/dashboard" className="hover:text-emerald-600 transition">
                  Dashboard Mitra
                </Link>
                <ChevronRight className="w-3.5 h-3.5" />
                <Link href={`/mitra/dashboard/katalog/${itemId}`} className="hover:text-emerald-600 transition">
                  Detail Unit
                </Link>
                <ChevronRight className="w-3.5 h-3.5" />
                <span className="text-slate-800 font-semibold truncate max-w-[200px]">Edit {name}</span>
              </nav>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2.5">
                <span className="w-2.5 h-6 bg-emerald-600 rounded-full inline-block"></span>
                Edit Unit Rental
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href={`/mitra/dashboard/katalog/${itemId}`}
                className="hidden sm:inline-flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-100 font-medium text-sm transition"
              >
                <ArrowLeft className="w-4 h-4" />
                Batal
              </Link>
            </div>
          </div>
        </header>

        {/* Main Content Form */}
        <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Card 1: Informasi Utama Unit */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-6">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  1
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Informasi Pokok Unit</h2>
                  <p className="text-xs text-slate-500">Ubah spesifikasi, nama barang, dan kategori rental</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-800 mb-2">
                    Nama Unit Barang <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Contoh: Sony Alpha A7 III (Body Only)"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 transition text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-2">
                    Kategori Sewa <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 transition text-slate-900 bg-white"
                  >
                    {RENTAL_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-2">
                    Highlight / Badge Tag
                  </label>
                  <input
                    type="text"
                    value={tag}
                    onChange={(e) => setTag(e.target.value)}
                    placeholder="Contoh: Terlaris / Primadona / Unit Baru"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 transition text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-2">
                    Tarif Sewa (Rp) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-3.5 text-slate-400 font-semibold text-sm">Rp</span>
                    <input
                      type="number"
                      required
                      min="1000"
                      step="1000"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="185000"
                      className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 transition text-slate-900 font-semibold"
                    />
                  </div>
                  {price && !isNaN(Number(price)) && (
                    <p className="text-xs text-emerald-600 mt-1 font-medium">
                      Tarif per sewa: {formatIDR(Number(price))}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-2">
                    Satuan Waktu Sewa <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 transition text-slate-900 bg-white"
                  >
                    {UNIT_PERIODS.map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-800 mb-2">
                    Status Ketersediaan Unit <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {STOCK_STATUSES.map((status) => (
                      <button
                        type="button"
                        key={status}
                        onClick={() => setStockStatus(status)}
                        className={`p-3 rounded-xl text-center text-xs sm:text-sm font-semibold border transition ${
                          stockStatus === status 
                            ? "bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm"
                            : "border-slate-200 hover:bg-slate-50 text-slate-600"
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-800 mb-2">
                    Deskripsi Lengkap & Spesifikasi
                  </label>
                  <textarea
                    rows={4}
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                    placeholder="Jelaskan kondisi alat, kelayakan fungsi, sensor, kelengkapan aksesoris, dan instruksi penyewaan..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 transition text-slate-900"
                  />
                </div>
              </div>
            </div>

            {/* Card 2: Foto Unit Rental */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                    2
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Foto & Galeri Unit</h2>
                    <p className="text-xs text-slate-500">Unggah foto real fisik alat. Foto pertama bertanda bintang akan menjadi foto sampul.</p>
                  </div>
                </div>
              </div>

              {/* Upload Drop Area */}
              <div className="border-2 border-dashed border-slate-300 hover:border-emerald-500 bg-slate-50/50 hover:bg-emerald-50/20 rounded-2xl p-6 text-center transition cursor-pointer mb-6 relative">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={uploadingPhoto}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="flex flex-col items-center justify-center pointer-events-none">
                  <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-slate-200 flex items-center justify-center text-emerald-600 mb-3">
                    {uploadingPhoto ? (
                      <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
                    ) : (
                      <Upload className="w-6 h-6" />
                    )}
                  </div>
                  <p className="font-semibold text-slate-800 text-sm mb-1">
                    {uploadingPhoto ? "Sedang Mengunggah Foto..." : "Klik atau seret foto fisik alat ke sini"}
                  </p>
                  <p className="text-xs text-slate-500">
                    Mendukung JPG, PNG, WEBP (Maks 10MB per foto). Bisa upload multiple foto sekaligus.
                  </p>
                </div>
              </div>

              {/* Photo Thumbnails */}
              {photos.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {photos.map((p, idx) => (
                    <div 
                      key={p.id || idx} 
                      className={`relative group rounded-xl overflow-hidden border-2 bg-slate-100 aspect-square ${
                        p.isPrimary ? "border-emerald-500 ring-2 ring-emerald-200" : "border-slate-200"
                      }`}
                    >
                      <img
                        src={p.url}
                        alt={`Unit Photo ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      
                      {/* Primary badge */}
                      {p.isPrimary && (
                        <span className="absolute top-2 left-2 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                          <Star className="w-3 h-3 fill-white" />
                          Foto Utama
                        </span>
                      )}

                      {/* Action overlays */}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2 p-2">
                        {!p.isPrimary && (
                          <button
                            type="button"
                            onClick={() => setAsPrimaryPhoto(idx)}
                            className="p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
                            title="Jadikan Foto Utama"
                          >
                            <Star className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => removePhoto(idx)}
                          className="p-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition"
                          title="Hapus Foto"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Card 3: Kelengkapan & Ketentuan Jaminan */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-6">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  3
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Kelengkapan & Syarat Jaminan</h2>
                  <p className="text-xs text-slate-500">Perjelas isi paket unit dan persyaratan identitas penyewa</p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-2">
                    Kelengkapan Bawaan Unit
                  </label>
                  <input
                    type="text"
                    value={includes}
                    onChange={(e) => setIncludes(e.target.value)}
                    placeholder="Contoh: 1x Body Kamera, 2x Baterai, 1x Charger, 1x Strap, 1x Tas Carrier"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 transition text-slate-900"
                  />
                  <p className="text-xs text-slate-500 mt-1">Daftar item yang disertakan dalam paket sewa saat serah terima.</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-2">
                    Syarat & Jaminan Khusus Unit Ini
                  </label>
                  <textarea
                    rows={3}
                    value={securityDeposit}
                    onChange={(e) => setSecurityDeposit(e.target.value)}
                    placeholder="Contoh: Wajib titip 1 ID Asli (KTP/KTM/SIM) + Verifikasi Akun Bantuin..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 transition text-slate-900"
                  />
                </div>
              </div>
            </div>

            {/* Sticky Action Footer */}
            <div className="sticky bottom-4 z-20 bg-white/95 backdrop-blur-md border border-slate-200 shadow-xl rounded-2xl p-4 flex items-center justify-between">
              <Link
                href={`/mitra/dashboard/katalog/${itemId}`}
                className="px-5 py-2.5 border border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-slate-100 transition text-sm"
              >
                Batal
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-sm transition disabled:opacity-50 text-sm"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Simpan Perubahan Unit
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
