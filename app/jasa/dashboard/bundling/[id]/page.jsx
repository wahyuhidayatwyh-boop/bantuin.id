"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import RoleGuard from "@/components/auth/RoleGuard";
import { useApp } from "@/lib/context/AppContext";
import { getProviderById, saveProviderData } from "@/lib/mock/providersData";
import { formatIDR } from "@/lib/utils";
import { 
  ArrowLeft, 
  Package, 
  Edit3, 
  Trash2, 
  ChevronRight,
  CheckCircle2,
  Clock,
  Star,
  AlertTriangle
} from "lucide-react";

export default function DetailBundlingJasaPage() {
  const { id } = useParams();
  const router = useRouter();
  const { addToast } = useApp() || {};

  const [provider, setProvider] = useState(() => {
    return getProviderById("fajar-ramadhan-desain") || {};
  });

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const p = getProviderById("fajar-ramadhan-desain");
    if (p) setProvider(p);
  }, []);

  const pkg = (provider.packages || []).find((p) => p.id === id);

  const handleDelete = () => {
    setIsDeleting(true);
    const updatedPackages = (provider.packages || []).filter((p) => p.id !== id);
    const updatedProvider = { ...provider, packages: updatedPackages };
    saveProviderData(updatedProvider);
    setProvider(updatedProvider);
    setIsDeleting(false);
    setIsDeleteModalOpen(false);
    addToast?.("Paket Dihapus", `Paket "${pkg?.name}" berhasil dihapus.`);
    router.push("/jasa/dashboard");
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
            Paket bundling dengan ID <code className="font-mono bg-slate-200 px-1 py-0.5 rounded">{id}</code> tidak terdaftar.
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
                <span className="text-slate-900 font-bold truncate max-w-xs">{pkg.name}</span>
              </div>
              <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 flex items-center gap-2">
                <span>Rincian Paket Bundling</span>
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/jasa/dashboard"
                className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Kembali</span>
              </Link>

              <Link
                href={`/jasa/dashboard/bundling/${pkg.id}/edit`}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition flex items-center gap-1.5 shadow-2xs"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Paket</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-6">
            
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-xl bg-blue-50 text-[#1683FF] text-xs font-extrabold border border-blue-100">
                  {pkg.tier || "Paket Standar"}
                </span>
                {pkg.isPopular && (
                  <span className="px-2.5 py-1 rounded-xl bg-amber-500 text-white text-[11px] font-extrabold flex items-center gap-1">
                    <Star className="w-3 h-3 fill-white" />
                    <span>Paling Diminati</span>
                  </span>
                )}
              </div>

              <span className="text-xs text-slate-400 font-mono">ID: {pkg.id}</span>
            </div>

            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">{pkg.name}</h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed">{pkg.description}</p>
            </div>

            <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Harga Paket:</span>
                <span className="text-2xl font-black text-[#1683FF]">{formatIDR(pkg.price)}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Durasi:</span>
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1 mt-0.5 justify-end">
                  <Clock className="w-3.5 h-3.5 text-[#1683FF]" />
                  <span>{pkg.duration || "1-2 Hari Kerja"}</span>
                </span>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
                Fitur &amp; Apa yang Klien Dapatkan:
              </h3>
              <div className="space-y-2">
                {(pkg.features || []).map((feat, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="font-medium">{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(true)}
                className="px-4 py-2 rounded-xl border border-rose-200 bg-rose-50 text-rose-600 text-xs font-bold hover:bg-rose-100 transition flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus Paket Ini</span>
              </button>

              <Link
                href={`/jasa/dashboard/bundling/${pkg.id}/edit`}
                className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition flex items-center gap-1.5 shadow-2xs"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Paket</span>
              </Link>
            </div>

          </div>
        </main>

        {/* Modal Konfirmasi Hapus */}
        {isDeleteModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-7 h-7" />
              </div>

              <div>
                <h3 className="text-base font-extrabold text-slate-900">Hapus Paket Bundling?</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Apakah Anda yakin ingin menghapus paket <span className="font-bold text-slate-800">&ldquo;{pkg.name}&rdquo;</span>?
                </p>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition"
                >
                  {isDeleting ? "Menghapus..." : "Ya, Hapus"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
