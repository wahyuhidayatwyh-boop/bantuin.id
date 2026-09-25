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
  Image as ImageIcon, 
  Upload, 
  Loader2, 
  ChevronRight,
  Save,
  Tag,
  FileText
} from "lucide-react";

export default function TambahPortofolioPage() {
  const router = useRouter();
  const { addToast } = useApp() || {};

  const [provider, setProvider] = useState(() => {
    return getProviderById("fajar-ramadhan-desain") || {};
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    category: "Branding",
    url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80",
    description: "",
    clientName: "",
    completedYear: "2026",
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

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingPhoto(true);
    try {
      const res = await imageService.uploadImage(file, "portfolio");
      if (res.success && res.url) {
        setFormData((prev) => ({ ...prev, url: res.url }));
        addToast?.("Foto Terunggah", "Foto karya berhasil dimuat.");
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
      addToast?.("Form Belum Lengkap", "Silakan isi judul karya portofolio.", "error");
      return;
    }
    if (!formData.url) {
      addToast?.("Foto Belum Diunggah", "Silakan pilih foto karya portofolio.", "error");
      return;
    }

    setIsSubmitting(true);

    const newPhoto = {
      id: `port-${Date.now()}`,
      url: formData.url,
      title: formData.title.trim(),
      category: formData.category,
      description: formData.description.trim() || "Dokumentasi hasil karya terverifikasi untuk klien Bantuin.",
      clientName: formData.clientName,
      completedYear: formData.completedYear,
      createdAt: new Date().toISOString(),
    };

    const currentPhotos = provider.portfolioPhotos || [];
    const updatedProvider = {
      ...provider,
      portfolioPhotos: [newPhoto, ...currentPhotos],
    };

    saveProviderData(updatedProvider);
    setProvider(updatedProvider);
    setIsSubmitting(false);

    addToast?.("Karya Ditambahkan", `Foto "${newPhoto.title}" berhasil ditambahkan ke portofolio.`);
    router.push("/jasa/dashboard");
  };

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
                <span className="text-slate-900 font-bold">Tambah Foto Portofolio</span>
              </div>
              <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-[#1683FF]" />
                <span>Tambah Karya ke Portofolio</span>
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/jasa/dashboard"
                className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Kembali</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Upload Area & Preview */}
            <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/90 shadow-xs space-y-5">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-sm sm:text-base font-extrabold text-slate-900">1. Unggah Foto Karya</h2>
                <p className="text-xs text-slate-500">Pilih gambar resolusi tinggi dari komputer / HP Anda.</p>
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
                    <div className="flex flex-col items-center justify-center gap-2 py-4">
                      {isUploadingPhoto ? (
                        <Loader2 className="w-8 h-8 text-[#1683FF] animate-spin" />
                      ) : (
                        <Upload className="w-8 h-8 text-[#1683FF]" />
                      )}
                      <span className="text-xs sm:text-sm font-bold text-slate-800">
                        {isUploadingPhoto ? "Mengunggah..." : "Pilih Berkas Foto Karya"}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Mendukung format JPG, PNG, WEBP hingga 5 MB
                      </span>
                    </div>
                  </label>

                  <div className="mt-3">
                    <span className="block text-[11px] font-bold text-slate-600 mb-1">Atau Gunakan URL Gambar:</span>
                    <input
                      type="url"
                      placeholder="https://..."
                      value={formData.url}
                      onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-mono text-slate-700 focus:outline-none focus:border-[#1683FF] bg-slate-50"
                    />
                  </div>
                </div>

                <div>
                  <span className="block text-xs font-bold text-slate-700 mb-2">Pratinjau Foto:</span>
                  <div className="aspect-4/3 rounded-2xl border border-slate-200 overflow-hidden relative bg-slate-100 shadow-2xs">
                    <img
                      src={formData.url}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Informasi Karya */}
            <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/90 shadow-xs space-y-5">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-sm sm:text-base font-extrabold text-slate-900">2. Rincian &amp; Keterangan Karya</h2>
                <p className="text-xs text-slate-500">Beri judul dan deskripsi singkat hasil pengerjaan.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    Judul Karya / Proyek <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Desain Label Botol Kopi Dingin Kencana"
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
                      Nama Klien / Acara (Opsional)
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Kedai Kopi Kencana Purwokerto"
                      value={formData.clientName}
                      onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                      className="w-full p-3 rounded-2xl border border-slate-200 text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-[#1683FF] bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    Deskripsi Singkat Karya
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Contoh: Desain stiker label kemasan tahan air ukuran 5x10cm dengan konsep vintage minimalis siap cetak..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full p-3.5 rounded-2xl border border-slate-200 text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-[#1683FF] bg-white leading-relaxed"
                  />
                </div>
              </div>
            </div>

            {/* Sticky Action Bar */}
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
                    <span>Menyimpan Karya...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Simpan ke Portofolio</span>
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
