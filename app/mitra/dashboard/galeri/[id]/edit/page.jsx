"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Upload, 
  Save, 
  Trash2, 
  ChevronRight, 
  Loader2, 
  AlertCircle,
  Info
} from "lucide-react";
import RoleGuard from "@/components/auth/RoleGuard";
import { useApp } from "@/lib/context/AppContext";
import { getMitraStoreById, saveMitraStoreData } from "@/lib/mock/mitraData";
import { imageService } from "@/lib/services/imageService";

const GALLERY_CATEGORIES = [
  "Kamera & Rig",
  "Lensa & Optik",
  "Lighting & Studio",
  "Audio & Wireless Mic",
  "Drone & Gimbal",
  "Setup Event & Booth",
  "Perawatan & Sensor Clean",
  "Lainnya"
];

export default function EditFotoGaleriMitraPage({ params }) {
  const router = useRouter();
  const unwrappedParams = use(params);
  const photoId = unwrappedParams.id;
  const { addToast } = useApp();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [store, setStore] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(-1);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Kamera & Rig");
  const [description, setDescription] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    const currentStore = getMitraStoreById("mitra-kamera");
    if (!currentStore) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    setStore(currentStore);

    const portfolio = currentStore.portfolioPhotos || [];
    let foundIndex = -1;
    let item = null;

    // Check by id or by index
    foundIndex = portfolio.findIndex((p, idx) => p.id === photoId || String(idx) === String(photoId));
    if (foundIndex !== -1) {
      item = portfolio[foundIndex];
    }

    if (!item) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    setPhotoIndex(foundIndex);
    setTitle(item.title || "");
    setCategory(item.category || "Kamera & Rig");
    setDescription(item.description || "");
    setPhotoUrl(item.url || "");
    setLoading(false);
  }, [photoId]);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const res = await imageService.uploadImage(file, "mitra-gallery");
      setPhotoUrl(res.url);
      if (addToast) {
        addToast("Foto Diperbarui", "Foto baru berhasil diunggah.");
      }
    } catch (err) {
      console.error(err);
      if (addToast) {
        addToast("Gagal Unggah", "Gagal memproses file foto.");
      }
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!photoUrl) {
      alert("Foto tidak boleh kosong.");
      return;
    }
    if (!title.trim()) {
      alert("Mohon masukkan judul foto showcase.");
      return;
    }

    setSaving(true);
    const portfolio = Array.isArray(store?.portfolioPhotos) ? [...store.portfolioPhotos] : [];

    if (photoIndex >= 0 && photoIndex < portfolio.length) {
      portfolio[photoIndex] = {
        ...portfolio[photoIndex],
        title: title.trim(),
        category,
        url: photoUrl,
        description: description.trim(),
        updatedAt: new Date().toISOString()
      };
    }

    const updatedStore = {
      ...store,
      portfolioPhotos: portfolio
    };

    saveMitraStoreData(updatedStore);

    if (addToast) {
      addToast("Foto Diperbarui", `Perubahan untuk "${title}" berhasil disimpan.`);
    }

    router.push("/mitra/dashboard");
  };

  const handleDelete = () => {
    const portfolio = Array.isArray(store?.portfolioPhotos) ? [...store.portfolioPhotos] : [];
    if (photoIndex >= 0 && photoIndex < portfolio.length) {
      portfolio.splice(photoIndex, 1);
    }

    const updatedStore = {
      ...store,
      portfolioPhotos: portfolio
    };

    saveMitraStoreData(updatedStore);

    if (addToast) {
      addToast("Foto Dihapus", "Foto berhasil dihapus dari galeri showcase.");
    }

    router.push("/mitra/dashboard");
  };

  if (loading) {
    return (
      <RoleGuard allowedRoles={["mitra", "super_admin"]}>
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
          <div className="text-center">
            <Loader2 className="w-10 h-10 text-emerald-600 animate-spin mx-auto mb-3" />
            <p className="text-slate-600 font-medium">Memuat data foto galeri...</p>
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
            <h2 className="text-xl font-bold text-slate-900 mb-2">Foto Tidak Ditemukan</h2>
            <p className="text-slate-600 text-sm mb-6">
              Foto galeri dengan ID <strong>{photoId}</strong> tidak ditemukan pada toko Anda.
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
        {/* Header with Breadcrumbs */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
            <div>
              <nav className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                <Link href="/mitra/dashboard" className="hover:text-emerald-600 transition">
                  Dashboard Mitra
                </Link>
                <ChevronRight className="w-3.5 h-3.5" />
                <span className="text-slate-800 font-semibold truncate max-w-[200px]">Edit {title}</span>
              </nav>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2.5">
                <span className="w-2.5 h-6 bg-emerald-600 rounded-full inline-block"></span>
                Edit Foto Galeri Showcase
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="inline-flex items-center gap-2 px-3 py-2 border border-rose-200 text-rose-600 rounded-xl hover:bg-rose-50 font-medium text-sm transition"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">Hapus</span>
              </button>
              <Link
                href="/mitra/dashboard"
                className="hidden sm:inline-flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-100 font-medium text-sm transition"
              >
                <ArrowLeft className="w-4 h-4" />
                Batal
              </Link>
            </div>
          </div>
        </header>

        {/* Main Content Form */}
        <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Card 1: Foto Preview & Ganti Foto */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-6">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  1
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Foto Gear / Setup</h2>
                  <p className="text-xs text-slate-500">Tampilan foto showcase saat ini</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 aspect-video max-h-[380px] w-full">
                  <img
                    src={photoUrl}
                    alt={title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 right-3">
                    <label className="px-3.5 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition flex items-center gap-1.5 shadow-md cursor-pointer">
                      <Upload className="w-3.5 h-3.5" />
                      Ganti Foto
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        disabled={uploading}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Informasi Foto Showcase */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-6">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  2
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Deskripsi &amp; Detail Showcase</h2>
                  <p className="text-xs text-slate-500">Ubah judul dan detail keterangan foto</p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-2">
                    Judul Foto Showcase <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Contoh: Rig Cinema Sony FX3 + Wireless Transmission Ready"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 transition text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-2">
                    Kategori Gear <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 transition text-slate-900 bg-white"
                  >
                    {GALLERY_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-2">
                    Keterangan Tambahan / Caption
                  </label>
                  <textarea
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Ceritakan detail setup alat, kebersihan sensor, atau penggunaan pada event sebelumnya..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 transition text-slate-900"
                  />
                </div>
              </div>
            </div>

            {/* Sticky Action Footer */}
            <div className="sticky bottom-4 z-20 bg-white/95 backdrop-blur-md border border-slate-200 shadow-xl rounded-2xl p-4 flex items-center justify-between">
              <Link
                href="/mitra/dashboard"
                className="px-5 py-2.5 border border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-slate-100 transition text-sm"
              >
                Batal
              </Link>
              <button
                type="submit"
                disabled={saving || !photoUrl}
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
                    Simpan Perubahan
                  </>
                )}
              </button>
            </div>
          </form>
        </main>

        {/* Delete Confirmation Modal (Rule G: DELETE confirmation modal is allowed) */}
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
              <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mb-4">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Hapus Foto Showcase?</h3>
              <p className="text-slate-600 text-sm mb-6">
                Apakah Anda yakin ingin menghapus foto <strong>&ldquo;{title}&rdquo;</strong> dari galeri showcase toko Anda? Tindakan ini tidak dapat dibatalkan.
              </p>
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-slate-100 transition text-sm"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl transition text-sm shadow-sm"
                >
                  Ya, Hapus Foto
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
