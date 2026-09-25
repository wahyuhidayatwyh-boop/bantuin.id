"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import RoleGuard from "@/components/auth/RoleGuard";
import { useApp } from "@/lib/context/AppContext";
import { getProviderById, saveProviderData } from "@/lib/mock/providersData";
import { imageService } from "@/lib/services/imageService";
import { 
  ArrowLeft, 
  Image as ImageIcon, 
  Upload, 
  Loader2, 
  ChevronRight,
  Save
} from "lucide-react";

export default function EditPortofolioPage() {
  const { id } = useParams();
  const router = useRouter();
  const { addToast } = useApp() || {};

  const [provider, setProvider] = useState(() => {
    return getProviderById("fajar-ramadhan-desain") || {};
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  useEffect(() => {
    const p = getProviderById("fajar-ramadhan-desain");
    if (p) setProvider(p);
  }, []);

  const photos = provider.portfolioPhotos || [];
  const photo = photos.find((p, idx) => p.id === id || String(idx) === String(id));

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    category: "Branding",
    url: "",
    description: "",
    clientName: "",
  });

  const categoryPresets = [
    "Branding",
    "UI/UX",
    "Cetak",
    "Kemasan",
    "Web UI",
    "Sosmed",
    "Fotografi",
    "Lainnya"
  ];

  useEffect(() => {
    if (photo) {
      setFormData({
        title: photo.title || "",
        category: photo.category || "Branding",
        url: photo.url || "",
        description: photo.description || "",
        clientName: photo.clientName || "",
      });
    }
  }, [photo]);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingPhoto(true);
    try {
      const res = await imageService.uploadImage(file, "portfolio");
      if (res.success && res.url) {
        setFormData((prev) => ({ ...prev, url: res.url }));
        addToast?.("Foto Terunggah", "Foto karya berhasil diganti.");
      }
    } catch (err) {
      addToast?.("Gagal Upload", err.message || "Gagal mengunggah foto.", "error");
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      addToast?.("Form Belum Lengkap", "Silakan isi judul karya.", "error");
      return;
    }

    setIsSubmitting(true);

    const updatedPhotos = photos.map((p, idx) => {
      if (p.id === id || String(idx) === String(id)) {
        return {
          ...p,
          title: formData.title.trim(),
          category: formData.category,
          url: formData.url,
          description: formData.description.trim(),
          clientName: formData.clientName,
          updatedAt: new Date().toISOString(),
        };
      }
      return p;
    });

    const updatedProvider = { ...provider, portfolioPhotos: updatedPhotos };
    saveProviderData(updatedProvider);
    setProvider(updatedProvider);
    setIsSubmitting(false);

    addToast?.("Karya Diperbarui", `Perubahan pada "${formData.title}" berhasil disimpan.`);
    router.push(`/jasa/dashboard/portofolio/${id}`);
  };

  if (!photo) {
    return (
      <RoleGuard allowedRoles={["provider"]}>
        <div className="min-h-screen bg-[#F4F7FB] flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-3xl bg-blue-50 text-[#1683FF] flex items-center justify-center mb-4">
            <ImageIcon className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900">Karya Tidak Ditemukan</h2>
          <p className="text-xs text-slate-500 mt-1 max-w-sm">
            Foto yang ingin Anda edit tidak ditemukan.
          </p>
          <Link
            href="/jasa/dashboard"
            className="mt-5 px-5 py-2.5 rounded-2xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white text-xs font-bold transition flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Dashboard</span>
          </Link>
        </div>
      </RoleGuard>
    );
  }

  return (
    <RoleGuard allowedRoles={["provider"]}>
      <div className="min-h-screen bg-[#F4F7FB] pb-24">
        {/* Header & Breadcrumb */}
        <div className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                <Link href="/jasa/dashboard" className="hover:text-[#1683FF] transition font-medium">
                  Dashboard
                </Link>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                <Link href="/jasa/dashboard" className="hover:text-[#1683FF] transition font-medium">
                  Portofolio &amp; Foto
                </Link>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                <Link href={`/jasa/dashboard/portofolio/${id}`} className="hover:text-[#1683FF] transition font-medium truncate max-w-[140px]">
                  {photo.title}
                </Link>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-900 font-bold">Edit Foto</span>
              </div>
              <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 flex items-center gap-2">
                <span>Edit Karya Portofolio</span>
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href={`/jasa/dashboard/portofolio/${id}`}
                className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Batal</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Foto Area */}
            <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/90 shadow-xs space-y-5">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-sm sm:text-base font-extrabold text-slate-900">1. Foto Karya</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                <div>
                  <label className="block p-6 rounded-2xl border-2 border-dashed border-[#1683FF]/40 hover:border-[#1683FF] bg-blue-50/20 hover:bg-blue-50/50 transition cursor-pointer text-center">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      disabled={isUploadingPhoto}
                      className="hidden"
                    />
                    <div className="flex flex-col items-center justify-center gap-2 py-3">
                      {isUploadingPhoto ? (
                        <Loader2 className="w-7 h-7 text-[#1683FF] animate-spin" />
                      ) : (
                        <Upload className="w-7 h-7 text-[#1683FF]" />
                      )}
                      <span className="text-xs font-bold text-slate-800">
                        {isUploadingPhoto ? "Sedang Mengunggah..." : "Ganti Berkas Foto"}
                      </span>
                    </div>
                  </label>

                  <div className="mt-3">
                    <span className="block text-[11px] font-bold text-slate-600 mb-1">URL Gambar:</span>
                    <input
                      type="url"
                      value={formData.url}
                      onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-mono text-slate-700 bg-slate-50"
                    />
                  </div>
                </div>

                <div>
                  <span className="block text-xs font-bold text-slate-700 mb-2">Pratinjau Foto:</span>
                  <div className="aspect-4/3 rounded-2xl border border-slate-200 overflow-hidden relative bg-slate-100">
                    <img
                      src={formData.url}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Informasi Rincian */}
            <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/90 shadow-xs space-y-5">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-sm sm:text-base font-extrabold text-slate-900">2. Rincian &amp; Keterangan</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    Judul Karya <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full p-3 rounded-2xl border border-slate-200 text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:border-[#1683FF] bg-slate-50/50"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                      Kategori Karya
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full p-3 rounded-2xl border border-slate-200 text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:border-[#1683FF] bg-white"
                    >
                      {categoryPresets.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                      Nama Klien / Acara
                    </label>
                    <input
                      type="text"
                      value={formData.clientName}
                      onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                      className="w-full p-3 rounded-2xl border border-slate-200 text-xs sm:text-sm text-slate-800 bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    Deskripsi Singkat Karya
                  </label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full p-3.5 rounded-2xl border border-slate-200 text-xs sm:text-sm text-slate-800 bg-white leading-relaxed"
                  />
                </div>
              </div>
            </div>

            {/* Sticky Action Bar */}
            <div className="sticky bottom-4 z-20 bg-white/95 backdrop-blur-md p-4 rounded-3xl border border-slate-200 shadow-xl flex items-center justify-between gap-3">
              <Link
                href={`/jasa/dashboard/portofolio/${id}`}
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
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Simpan Perubahan</span>
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
