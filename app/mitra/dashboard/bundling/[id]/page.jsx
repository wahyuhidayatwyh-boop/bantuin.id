"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Edit3, 
  Trash2, 
  Clock, 
  CheckCircle2, 
  Star, 
  ChevronRight, 
  Package, 
  AlertCircle, 
  Loader2,
  Share2,
  ExternalLink,
  ShieldCheck,
  Megaphone
} from "lucide-react";
import RoleGuard from "@/components/auth/RoleGuard";
import { useApp } from "@/lib/context/AppContext";
import { getMitraStoreById, saveMitraStoreData } from "@/lib/mock/mitraData";
import { formatIDR } from "@/lib/utils";

export default function DetailRentalBundlingMitraPage({ params }) {
  const router = useRouter();
  const unwrappedParams = use(params);
  const pkgId = unwrappedParams.id;
  const { addToast } = useApp();

  const [loading, setLoading] = useState(true);
  const [store, setStore] = useState(null);
  const [pkg, setPkg] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    const currentStore = getMitraStoreById("mitra-kamera");
    if (!currentStore) {
      setLoading(false);
      return;
    }
    setStore(currentStore);

    const found = currentStore.packages?.find(p => String(p.id) === String(pkgId));
    setPkg(found || null);
    setLoading(false);
  }, [pkgId]);

  const handleDelete = () => {
    const currentPackages = store?.packages || [];
    const updatedPackages = currentPackages.filter(p => String(p.id) !== String(pkgId));

    const updatedStore = {
      ...store,
      packages: updatedPackages
    };

    saveMitraStoreData(updatedStore);

    if (addToast) {
      addToast("Paket Dihapus", `Paket bundling "${pkg?.name}" berhasil dihapus.`);
    }

    router.push("/mitra/dashboard");
  };

  if (loading) {
    return (
      <RoleGuard allowedRoles={["mitra", "super_admin"]}>
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
          <div className="text-center">
            <Loader2 className="w-10 h-10 text-emerald-600 animate-spin mx-auto mb-3" />
            <p className="text-slate-600 font-medium">Memuat detail paket bundling...</p>
          </div>
        </div>
      </RoleGuard>
    );
  }

  if (!pkg) {
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
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
            <div>
              <nav className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                <Link href="/mitra/dashboard" className="hover:text-emerald-600 transition">
                  Dashboard Mitra
                </Link>
                <ChevronRight className="w-3.5 h-3.5" />
                <span className="text-slate-800 font-semibold truncate max-w-[200px]">{pkg.name}</span>
              </nav>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2.5">
                <span className="w-2.5 h-6 bg-emerald-600 rounded-full inline-block"></span>
                Detail Paket Sewa Bundling
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href={`/mitra/dashboard/bundling/${pkgId}/edit`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm transition shadow-sm"
              >
                <Edit3 className="w-4 h-4" />
                <span>Edit Paket</span>
              </Link>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="inline-flex items-center gap-2 px-3 py-2 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl font-medium text-sm transition"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">Hapus</span>
              </button>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Details (Col 1 & 2) */}
            <div className="lg:col-span-2 space-y-6">
              {/* Card 1: Package Header & Price */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <span className="px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider bg-slate-100 text-slate-700">
                    {pkg.tier || "Paket Hemat"}
                  </span>
                  {pkg.isPopular && (
                    <span className="bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5 border border-amber-200">
                      <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                      Paling Diminati Pelanggan
                    </span>
                  )}
                </div>

                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mb-3">{pkg.name}</h2>
                <p className="text-slate-600 text-sm leading-relaxed mb-6">
                  {pkg.description || "Paket bundling komplit dengan penyesuaian harga hemat untuk kebutuhan tugas mahasiswa dan event."}
                </p>

                <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-100 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-emerald-800 block">Tarif Sewa Borongan:</span>
                    <div className="text-2xl sm:text-3xl font-black text-emerald-700 mt-0.5">
                      {formatIDR(pkg.price)}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-500 block">Durasi Pemakaian:</span>
                    <span className="text-sm font-bold text-slate-900 flex items-center gap-1.5 justify-end mt-0.5">
                      <Clock className="w-4 h-4 text-emerald-600" />
                      {pkg.duration || "1 Hari (24 Jam)"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 2: Kelengkapan Termasuk */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Package className="w-5 h-5 text-emerald-600" />
                  Daftar Kelengkapan Unit Termasuk
                </h3>
                <div className="space-y-3">
                  {Array.isArray(pkg.features) && pkg.features.map((feat, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                      <span className="text-sm font-medium text-slate-800">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar Information (Col 3) */}
            <div className="space-y-6">
              {/* Promotion CTA Card */}
              <div className="bg-linear-to-br from-emerald-600 to-teal-700 rounded-2xl p-6 text-white shadow-md">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mb-4">
                  <Megaphone className="w-5 h-5 text-white" />
                </div>
                <h4 className="font-bold text-base mb-1">Promosikan Paket Ini</h4>
                <p className="text-emerald-100 text-xs leading-relaxed mb-4">
                  Tingkatkan pesanan sewa hingga 4x lipat dengan menempatkan paket ini di halaman utama `/sewa`.
                </p>
                <Link
                  href="/mitra/dashboard/promosi/buat"
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 bg-white text-emerald-700 font-bold rounded-xl text-xs hover:bg-emerald-50 transition shadow-sm"
                >
                  <Megaphone className="w-4 h-4" />
                  Buat Iklan Promosi
                </Link>
              </div>

              {/* Metadata Card */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                <h4 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-3">
                  Informasi Paket
                </h4>
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">ID Paket:</span>
                    <span className="font-mono font-bold text-slate-800">{pkg.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Toko Mitra:</span>
                    <span className="font-bold text-slate-800">{store?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Kategori:</span>
                    <span className="font-semibold text-slate-800">{pkg.tier}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Status Integrasi:</span>
                    <span className="font-bold text-emerald-600">Aktif di Toko</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100">
                  <Link
                    href="/mitra/dashboard"
                    className="w-full inline-flex items-center justify-center gap-2 py-2 border border-slate-200 text-slate-700 font-medium rounded-xl text-xs hover:bg-slate-50 transition"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Kembali ke Dashboard
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
              <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mb-4">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Hapus Paket Bundling?</h3>
              <p className="text-slate-600 text-sm mb-6">
                Apakah Anda yakin ingin menghapus paket <strong>&ldquo;{pkg.name}&rdquo;</strong>? Pelanggan tidak akan dapat lagi memilih paket bundling ini.
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
                  Ya, Hapus Paket
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
