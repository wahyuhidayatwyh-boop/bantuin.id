"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Upload, 
  Save, 
  Image as ImageIcon, 
  Trash2, 
  ChevronRight, 
  Loader2, 
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

export default function TambahFotoGaleriMitraPage() {
  const router = useRouter();
  const { addToast } = useApp();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Kamera & Rig");
  const [description, setDescription] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const res = await imageService.uploadImage(file, "mitra-gallery");
      setPhotoUrl(res.url);
      if (!title) {
        // Autofill title from filename nicely
        const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
        setTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
      }
      if (addToast) {
        addToast("Foto Siap", "Foto berhasil diunggah.");
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
      alert("Mohon unggah foto fisik gear atau setup terlebih dahulu.");
      return;
    }
    if (!title.trim()) {
      alert("Mohon masukkan judul foto showcase.");
      return;
    }

    setSaving(true);
    const store = getMitraStoreById("mitra-kamera");
    const currentPortfolio = Array.isArray(store?.portfolioPhotos) ? store.portfolioPhotos : [];

    const newPhotoItem = {
      id: `gal-${Date.now()}`,
      title: title.trim(),
      category,
      url: photoUrl,
      description: description.trim(),
      createdAt: new Date().toISOString()
    };

    const updatedStore = {
      ...store,
      portfolioPhotos: [newPhotoItem, ...currentPortfolio]
    };

    saveMitraStoreData(updatedStore);

    if (addToast) {
      addToast("Foto Ditambahkan", `Foto "${newPhotoItem.title}" berhasil disimpan ke galeri showcase.`);
    }

    router.push("/mitra/dashboard");
  };

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
                <span className="text-slate-800 font-semibold">Tambah Foto Galeri Showcase</span>
              </nav>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2.5">
                <span className="w-2.5 h-6 bg-emerald-600 rounded-full inline-block"></span>
                Tambah Foto Galeri Gear &amp; Setup
              </h1>
            </div>
            <Link
              href="/mitra/dashboard"
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-100 font-medium text-sm transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Batal
            </Link>
          </div>
        </header>

        {/* Main Content Form */}
        <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Card 1: Upload Foto */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-6">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  1
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Upload Foto Gear / Setup</h2>
                  <p className="text-xs text-slate-500">Unggah foto real fisik alat, ruang operasional, atau hasil setup sewa</p>
                </div>
              </div>

              {!photoUrl ? (
                <div className="border-2 border-dashed border-slate-300 hover:border-emerald-500 bg-slate-50/50 hover:bg-emerald-50/20 rounded-2xl p-8 sm:p-12 text-center transition cursor-pointer relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    disabled={uploading}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="flex flex-col items-center justify-center pointer-events-none">
                    <div className="w-14 h-14 bg-white rounded-2xl shadow-sm border border-slate-200 flex items-center justify-center text-emerald-600 mb-3">
                      {uploading ? (
                        <Loader2 className="w-7 h-7 animate-spin text-emerald-600" />
                      ) : (
                        <Upload className="w-7 h-7" />
                      )}
                    </div>
                    <p className="font-bold text-slate-800 text-sm mb-1">
                      {uploading ? "Sedang Mengunggah Foto..." : "Klik atau seret foto fisik gear ke sini"}
                    </p>
                    <p className="text-xs text-slate-500">
                      Mendukung format PNG, JPG, JPEG, WEBP (Maksimal 10MB)
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 aspect-video max-h-[380px] w-full">
                    <img
                      src={photoUrl}
                      alt="Preview Galeri"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 right-3 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setPhotoUrl("")}
                        className="px-3 py-1.5 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 transition flex items-center gap-1.5 shadow-md"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Ganti Foto
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Card 2: Informasi Foto Showcase */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-6">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  2
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Deskripsi &amp; Detail Showcase</h2>
                  <p className="text-xs text-slate-500">Beri judul dan penjelasan mengenai foto perlengkapan</p>
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
                    Simpan Foto Galeri
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
