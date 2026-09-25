"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import RoleGuard from "@/components/auth/RoleGuard";
import { useApp } from "@/lib/context/AppContext";
import { getProviderById, saveProviderData } from "@/lib/mock/providersData";
import { 
  ArrowLeft, 
  Package, 
  ChevronRight,
  Save,
  Loader2,
  Check,
  Plus,
  Trash2
} from "lucide-react";

export default function TambahBundlingJasaPage() {
  const router = useRouter();
  const { addToast } = useApp() || {};

  const [provider, setProvider] = useState(() => {
    return getProviderById("fajar-ramadhan-desain") || {};
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    tier: "Paket Standar",
    price: 150000,
    duration: "2-3 Hari Kerja",
    description: "Paket lengkap pengerjaan desain profesional dengan jaminan kepuasan dan revisi.",
    featuresStr: "2 Konsep Desain Pilihan\nFile Master Siap Edit (AI / PSD / Figma)\nExport Resolusi Tinggi (PNG / PDF / SVG)\nGaransi Revisi 3 Kali",
    isPopular: false,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      addToast?.("Form Belum Lengkap", "Silakan isi nama paket bundling.", "error");
      return;
    }
    if (!formData.price || Number(formData.price) <= 0) {
      addToast?.("Form Belum Lengkap", "Silakan isi harga paket yang valid.", "error");
      return;
    }

    setIsSubmitting(true);

    const features = formData.featuresStr
      .split("\n")
      .map((f) => f.trim())
      .filter(Boolean);

    const newPackage = {
      id: `pkg-${Date.now()}`,
      name: formData.name.trim(),
      tier: formData.tier,
      price: Number(formData.price),
      duration: formData.duration.trim(),
      description: formData.description.trim(),
      features: features.length > 0 ? features : ["Pengerjaan Sesuai Brief", "Revisi Bergaransi"],
      isPopular: formData.isPopular,
      createdAt: new Date().toISOString(),
    };

    const currentPackages = provider.packages || [];
    const updatedProvider = {
      ...provider,
      packages: [...currentPackages, newPackage],
    };

    saveProviderData(updatedProvider);
    setProvider(updatedProvider);
    setIsSubmitting(false);

    addToast?.("Paket Tersimpan", `Paket bundling "${newPackage.name}" berhasil ditambahkan.`);
    router.push("/jasa/dashboard");
  };

  return (
    <RoleGuard allowedRoles={["provider"]}>
      <div className="min-h-screen bg-[#F4F7FB] pb-24">
        {/* Header & Breadcrumb */}
        <div className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                <Link href="/jasa/dashboard" className="hover:text-[#1683FF] transition font-medium">
                  Dashboard
                </Link>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                <Link href="/jasa/dashboard" className="hover:text-[#1683FF] transition font-medium">
                  Paket Bundling
                </Link>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-900 font-bold">Tambah Paket</span>
              </div>
              <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 flex items-center gap-2">
                <Package className="w-5 h-5 text-[#1683FF]" />
                <span>Buat Paket Bundling Jasa Baru</span>
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
        <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/90 shadow-xs space-y-5">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-sm sm:text-base font-extrabold text-slate-900">Rincian Paket Bundling</h2>
                <p className="text-xs text-slate-500">Tentukan nama, tier, durasi, harga, dan fitur apa saja yang diperoleh klien.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    Nama Paket Bundling <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Paket Brand Komplit UMKM"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-3 rounded-2xl border border-slate-200 text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:border-[#1683FF] bg-slate-50/50"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                      Tingkatan / Tier Paket
                    </label>
                    <select
                      value={formData.tier}
                      onChange={(e) => setFormData({ ...formData, tier: e.target.value })}
                      className="w-full p-3 rounded-2xl border border-slate-200 text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:border-[#1683FF] bg-white"
                    >
                      <option value="Paket Hemat">Paket Hemat</option>
                      <option value="Paket Standar">Paket Standar</option>
                      <option value="Paket Lengkap">Paket Lengkap</option>
                      <option value="Paket Premium (VIP)">Paket Premium (VIP)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                      Estimasi Durasi Pengerjaan
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: 2-3 Hari Kerja"
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                      className="w-full p-3 rounded-2xl border border-slate-200 text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-[#1683FF] bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    Harga Paket (Rp) <span className="text-rose-500">*</span>
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
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    Fitur &amp; Deliverables Paket (1 Poin per Baris)
                  </label>
                  <textarea
                    rows={5}
                    placeholder="2 Konsep Desain&#10;File Master Vector (AI/Figma)&#10;Export Resolusi Tinggi (PNG/PDF)&#10;Revisi 3 Kali"
                    value={formData.featuresStr}
                    onChange={(e) => setFormData({ ...formData, featuresStr: e.target.value })}
                    className="w-full p-3.5 rounded-2xl border border-slate-200 text-xs sm:text-sm font-mono text-slate-800 focus:outline-none focus:border-[#1683FF] bg-white leading-relaxed"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Tekan Enter untuk membuat poin fitur baru.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    Deskripsi Ringkas Paket
                  </label>
                  <textarea
                    rows={2}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full p-3 rounded-2xl border border-slate-200 text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-[#1683FF] bg-white"
                  />
                </div>

                <div className="pt-2 flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    id="popular-check"
                    checked={formData.isPopular}
                    onChange={(e) => setFormData({ ...formData, isPopular: e.target.checked })}
                    className="w-4 h-4 accent-[#1683FF] rounded cursor-pointer"
                  />
                  <label htmlFor="popular-check" className="text-xs font-bold text-slate-700 cursor-pointer">
                    Tandai sebagai Paket Paling Populer (Best Seller)
                  </label>
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
                    <span>Menyimpan Paket...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Simpan Paket Bundling</span>
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
