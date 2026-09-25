"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import RoleGuard from "@/components/auth/RoleGuard";
import { useApp } from "@/lib/context/AppContext";
import { getProviderById, saveProviderData } from "@/lib/mock/providersData";
import { 
  ArrowLeft, 
  Package, 
  ChevronRight,
  Save,
  Loader2
} from "lucide-react";

export default function EditBundlingJasaPage() {
  const { id } = useParams();
  const router = useRouter();
  const { addToast } = useApp() || {};

  const [provider, setProvider] = useState(() => {
    return getProviderById("fajar-ramadhan-desain") || {};
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const p = getProviderById("fajar-ramadhan-desain");
    if (p) setProvider(p);
  }, []);

  const pkg = (provider.packages || []).find((p) => p.id === id);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    tier: "Paket Standar",
    price: 150000,
    duration: "2-3 Hari Kerja",
    description: "",
    featuresStr: "",
    isPopular: false,
  });

  useEffect(() => {
    if (pkg) {
      setFormData({
        name: pkg.name || "",
        tier: pkg.tier || "Paket Standar",
        price: pkg.price || 100000,
        duration: pkg.duration || "1-2 Hari",
        description: pkg.description || "",
        featuresStr: (pkg.features || []).join("\n"),
        isPopular: !!pkg.isPopular,
      });
    }
  }, [pkg]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      addToast?.("Form Belum Lengkap", "Silakan isi nama paket bundling.", "error");
      return;
    }

    setIsSubmitting(true);

    const features = formData.featuresStr
      .split("\n")
      .map((f) => f.trim())
      .filter(Boolean);

    const updatedPackages = (provider.packages || []).map((p) => {
      if (p.id === id) {
        return {
          ...p,
          name: formData.name.trim(),
          tier: formData.tier,
          price: Number(formData.price),
          duration: formData.duration.trim(),
          description: formData.description.trim(),
          features: features.length > 0 ? features : ["Pengerjaan Sesuai Brief"],
          isPopular: formData.isPopular,
          updatedAt: new Date().toISOString(),
        };
      }
      return p;
    });

    const updatedProvider = { ...provider, packages: updatedPackages };
    saveProviderData(updatedProvider);
    setProvider(updatedProvider);
    setIsSubmitting(false);

    addToast?.("Paket Diperbarui", `Perubahan pada "${formData.name}" berhasil disimpan.`);
    router.push(`/jasa/dashboard/bundling/${id}`);
  };

  if (!pkg) {
    return (
      <RoleGuard allowedRoles={["provider"]}>
        <div className="min-h-screen bg-[#F4F7FB] flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-3xl bg-blue-50 text-[#1683FF] flex items-center justify-center mb-4">
            <Package className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900">Paket Tidak Ditemukan</h2>
          <p className="text-xs text-slate-500 mt-1 max-w-sm">
            Data paket bundling tidak ditemukan untuk diedit.
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
                <Link href={`/jasa/dashboard/bundling/${id}`} className="hover:text-[#1683FF] transition font-medium truncate max-w-[140px]">
                  {pkg.name}
                </Link>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-900 font-bold">Edit Paket</span>
              </div>
              <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 flex items-center gap-2">
                <span>Edit Paket Bundling Jasa</span>
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href={`/jasa/dashboard/bundling/${id}`}
                className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Batal</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/90 shadow-xs space-y-5">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-sm sm:text-base font-extrabold text-slate-900">Perbarui Rincian Paket</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    Nama Paket Bundling <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-3 rounded-2xl border border-slate-200 text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:border-[#1683FF] bg-slate-50/50"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                      Tingkatan / Tier
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
                      Durasi Pengerjaan
                    </label>
                    <input
                      type="text"
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                      className="w-full p-3 rounded-2xl border border-slate-200 text-xs sm:text-sm text-slate-800 bg-white"
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
                    Fitur &amp; Deliverables (1 Poin per Baris)
                  </label>
                  <textarea
                    rows={5}
                    value={formData.featuresStr}
                    onChange={(e) => setFormData({ ...formData, featuresStr: e.target.value })}
                    className="w-full p-3.5 rounded-2xl border border-slate-200 text-xs sm:text-sm font-mono text-slate-800 focus:outline-none focus:border-[#1683FF] bg-white leading-relaxed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    Deskripsi Ringkas
                  </label>
                  <textarea
                    rows={2}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full p-3 rounded-2xl border border-slate-200 text-xs sm:text-sm text-slate-800 bg-white"
                  />
                </div>

                <div className="pt-2 flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    id="popular-check-edit"
                    checked={formData.isPopular}
                    onChange={(e) => setFormData({ ...formData, isPopular: e.target.checked })}
                    className="w-4 h-4 accent-[#1683FF] rounded cursor-pointer"
                  />
                  <label htmlFor="popular-check-edit" className="text-xs font-bold text-slate-700 cursor-pointer">
                    Tandai sebagai Paket Paling Populer (Best Seller)
                  </label>
                </div>
              </div>
            </div>

            {/* Sticky Action Bar */}
            <div className="sticky bottom-4 z-20 bg-white/95 backdrop-blur-md p-4 rounded-3xl border border-slate-200 shadow-xl flex items-center justify-between gap-3">
              <Link
                href={`/jasa/dashboard/bundling/${id}`}
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
