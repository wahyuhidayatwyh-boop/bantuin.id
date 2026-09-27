"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Save, 
  Plus, 
  Trash2, 
  Package, 
  Clock, 
  ChevronRight, 
  Loader2,
  CheckCircle2,
  Star,
  AlertCircle
} from "lucide-react";
import RoleGuard from "@/components/auth/RoleGuard";
import { useApp } from "@/lib/context/AppContext";
import { getMitraStoreById, saveMitraStoreData } from "@/lib/mock/mitraData";
import { formatIDR } from "@/lib/utils";

const TIER_OPTIONS = [
  "Paket Hemat",
  "Paket Standar",
  "Paket Profesional",
  "Paket Wisuda & Event",
  "Paket Sinema & Film",
  "Paket Custom"
];

const DURATION_PRESETS = [
  "12 Jam (Setengah Hari)",
  "1 Hari (24 Jam)",
  "2 Hari (48 Jam)",
  "3 Hari",
  "1 Minggu",
  "Durasi Event Custom"
];

export default function EditBundlingMitraPage({ params }) {
  const router = useRouter();
  const unwrappedParams = use(params);
  const pkgId = unwrappedParams.id;
  const { addToast } = useApp();

  const [loading, setLoading] = useState(true);
  const [store, setStore] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [tier, setTier] = useState("Paket Hemat");
  const [price, setPrice] = useState("");
  const [duration, setDuration] = useState("1 Hari (24 Jam)");
  const [description, setDescription] = useState("");
  const [isPopular, setIsPopular] = useState(false);
  const [featureInputs, setFeatureInputs] = useState([]);
  const [newFeatureText, setNewFeatureText] = useState("");

  useEffect(() => {
    const currentStore = getMitraStoreById("mitra-kamera");
    if (!currentStore) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    setStore(currentStore);

    const found = currentStore.packages?.find(p => String(p.id) === String(pkgId));
    if (!found) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    setName(found.name || "");
    setTier(found.tier || "Paket Hemat");
    setPrice(found.price ? String(found.price) : "");
    setDuration(found.duration || "1 Hari (24 Jam)");
    setDescription(found.description || "");
    setIsPopular(!!found.isPopular);
    setFeatureInputs(Array.isArray(found.features) ? found.features : []);
    setLoading(false);
  }, [pkgId]);

  const addFeature = () => {
    if (newFeatureText.trim()) {
      setFeatureInputs([...featureInputs, newFeatureText.trim()]);
      setNewFeatureText("");
    }
  };

  const removeFeature = (idx) => {
    setFeatureInputs(featureInputs.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      alert("Mohon masukkan nama paket bundling.");
      return;
    }
    if (!price || isNaN(Number(price))) {
      alert("Mohon masukkan harga paket yang valid.");
      return;
    }
    if (featureInputs.length === 0) {
      alert("Mohon masukkan minimal 1 kelengkapan/fitur paket.");
      return;
    }

    setSaving(true);
    const currentPackages = store?.packages || [];
    const updatedPackage = {
      id: pkgId,
      name: name.trim(),
      tier,
      price: Number(price),
      duration,
      description: description.trim(),
      features: featureInputs,
      isPopular,
      updatedAt: new Date().toISOString()
    };

    const updatedPackages = currentPackages.map(p => 
      String(p.id) === String(pkgId) ? updatedPackage : p
    );

    const updatedStore = {
      ...store,
      packages: updatedPackages
    };

    saveMitraStoreData(updatedStore);

    if (addToast) {
      addToast("Paket Diperbarui", `Perubahan untuk paket "${updatedPackage.name}" berhasil disimpan.`);
    }

    router.push(`/mitra/dashboard/bundling/${pkgId}`);
  };

  if (loading) {
    return (
      <RoleGuard allowedRoles={["mitra", "super_admin"]}>
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
          <div className="text-center">
            <Loader2 className="w-10 h-10 text-emerald-600 animate-spin mx-auto mb-3" />
            <p className="text-slate-600 font-medium">Memuat data paket...</p>
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
            <h2 className="text-xl font-bold text-slate-900 mb-2">Paket Tidak Ditemukan</h2>
            <p className="text-slate-600 text-sm mb-6">
              Paket bundling dengan ID <strong>{pkgId}</strong> tidak ditemukan pada toko Anda.
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
                <Link href={`/mitra/dashboard/bundling/${pkgId}`} className="hover:text-emerald-600 transition">
                  Detail Paket
                </Link>
                <ChevronRight className="w-3.5 h-3.5" />
                <span className="text-slate-800 font-semibold truncate max-w-[200px]">Edit {name}</span>
              </nav>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2.5">
                <span className="w-2.5 h-6 bg-emerald-600 rounded-full inline-block"></span>
                Edit Paket Sewa Bundling
              </h1>
            </div>
            <Link
              href={`/mitra/dashboard/bundling/${pkgId}`}
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-100 font-medium text-sm transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Batal
            </Link>
          </div>
        </header>

        {/* Form Body */}
        <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Card 1: Informasi Paket */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-6">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  1
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Informasi Paket Sewa</h2>
                  <p className="text-xs text-slate-500">Nama paket, kategori tingkatan, dan harga sewa borongan</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-800 mb-2">
                    Nama Paket Bundling <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Contoh: Paket Liputan Wisuda Lengkap"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 transition text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-2">
                    Tier / Tingkatan Paket <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={tier}
                    onChange={(e) => setTier(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 transition text-slate-900 bg-white"
                  >
                    {TIER_OPTIONS.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-2">
                    Durasi Sewa Paket <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 transition text-slate-900 bg-white"
                  >
                    {DURATION_PRESETS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-800 mb-2">
                    Harga Sewa Paket (Rp) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-3.5 text-slate-400 font-semibold text-sm">Rp</span>
                    <input
                      type="number"
                      required
                      min="10000"
                      step="5000"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="250000"
                      className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 transition text-slate-900 font-semibold"
                    />
                  </div>
                  {price && !isNaN(Number(price)) && (
                    <p className="text-xs text-emerald-600 mt-1 font-medium">
                      Tarif paket: {formatIDR(Number(price))}
                    </p>
                  )}
                </div>

                <div className="flex items-center pt-7">
                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isPopular}
                      onChange={(e) => setIsPopular(e.target.checked)}
                      className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <div>
                      <span className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                        <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                        Tandai Sebagai Paket Terpopuler
                      </span>
                      <span className="text-xs text-slate-500 block">Tampil dengan badge &ldquo;Paling Diminati&rdquo;</span>
                    </div>
                  </label>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-800 mb-2">
                    Deskripsi Ringkas Paket
                  </label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Contoh: Paket sewa hemat untuk dokumentasi wisuda perorangan atau keluarga..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 transition text-slate-900"
                  />
                </div>
              </div>
            </div>

            {/* Card 2: Kelengkapan & Fitur Paket */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-6">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  2
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Kelengkapan Barang Termasuk</h2>
                  <p className="text-xs text-slate-500">Rincian item barang fisik dan aksesoris yang disertakan dalam paket ini</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newFeatureText}
                    onChange={(e) => setNewFeatureText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addFeature();
                      }
                    }}
                    placeholder="Tambah kelengkapan barang (contoh: 2x Baterai Sony FZ100)"
                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 text-sm"
                  />
                  <button
                    type="button"
                    onClick={addFeature}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm transition flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    Tambah
                  </button>
                </div>

                <div className="space-y-2 pt-2">
                  {featureInputs.map((item, idx) => (
                    <div 
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80"
                    >
                      <div className="flex items-center gap-2 text-sm text-slate-800">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{item}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFeature(idx)}
                        className="text-rose-500 hover:text-rose-700 p-1 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sticky Action Footer */}
            <div className="sticky bottom-4 z-20 bg-white/95 backdrop-blur-md border border-slate-200 shadow-xl rounded-2xl p-4 flex items-center justify-between">
              <Link
                href={`/mitra/dashboard/bundling/${pkgId}`}
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
                    Simpan Perubahan
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
