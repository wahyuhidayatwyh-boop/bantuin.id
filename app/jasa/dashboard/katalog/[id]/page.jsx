"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import RoleGuard from "@/components/auth/RoleGuard";
import { useApp } from "@/lib/context/AppContext";
import { getProviderById, saveProviderData } from "@/lib/mock/providersData";
import { formatIDR } from "@/lib/utils";
import { resolveCategoryIcon } from "@/lib/services/categoryService";
import { 
  ArrowLeft, 
  Layers, 
  Edit3, 
  Trash2, 
  Rocket, 
  MapPin, 
  Star, 
  Clock, 
  CheckCircle2, 
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  FileText,
  DollarSign,
  Calendar,
  Eye,
  Check,
  X
} from "lucide-react";

export default function DetailKatalogJasaPage() {
  const { id } = useParams();
  const router = useRouter();
  const { addToast } = useApp() || {};

  const [provider, setProvider] = useState(() => {
    return getProviderById("fajar-ramadhan-desain") || {};
  });

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Sync on mount
  useEffect(() => {
    const p = getProviderById("fajar-ramadhan-desain");
    if (p) setProvider(p);
  }, []);

  const service = (provider.catalog || []).find((s) => s.id === id);

  const handleDelete = () => {
    setIsDeleting(true);
    const updatedCatalog = (provider.catalog || []).filter((s) => s.id !== id);
    const updatedProvider = { ...provider, catalog: updatedCatalog };
    saveProviderData(updatedProvider);
    setProvider(updatedProvider);
    setIsDeleting(false);
    setIsDeleteModalOpen(false);
    addToast?.("Layanan Dihapus", `Layanan "${service?.title}" berhasil dihapus dari katalog.`);
    router.push("/jasa/dashboard");
  };

  if (!service) {
    return (
      <RoleGuard allowedRoles={["provider"]}>
        <div className="min-h-screen bg-[#F4F7FB] flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-3xl bg-blue-50 text-[#1683FF] flex items-center justify-center mb-4">
            <Layers className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900">Layanan Jasa Tidak Ditemukan</h2>
          <p className="text-xs text-slate-500 mt-1 max-w-sm">
            Layanan dengan ID <code className="font-mono bg-slate-200 px-1 py-0.5 rounded">{id}</code> tidak terdaftar di katalog Anda.
          </p>
          <Link
            href="/jasa/dashboard"
            className="mt-5 px-5 py-2.5 rounded-2xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white text-xs font-bold transition flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Katalog Dashboard</span>
          </Link>
        </div>
      </RoleGuard>
    );
  }

  const CategoryIconComp = resolveCategoryIcon(service.category);

  return (
    <RoleGuard allowedRoles={["provider"]}>
      <div className="min-h-screen bg-[#F4F7FB] pb-24">
        {/* Header & Breadcrumb */}
        <div className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                <Link href="/jasa/dashboard" className="hover:text-[#1683FF] transition font-medium">
                  Dashboard
                </Link>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                <Link href="/jasa/dashboard" className="hover:text-[#1683FF] transition font-medium">
                  Katalog Layanan
                </Link>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-900 font-bold truncate max-w-xs">{service.title}</span>
              </div>
              <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 flex items-center gap-2">
                <span>Rincian Layanan Katalog</span>
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
                href={`/jasa/dashboard/katalog/${service.id}/edit`}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold transition flex items-center gap-1.5 shadow-2xs"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Layanan</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
          
          {/* Main Hero Card */}
          <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/90 shadow-xs">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
              {/* Image Preview */}
              <div className="md:col-span-1">
                <div className="aspect-4/3 rounded-2xl overflow-hidden border border-slate-200 relative group bg-slate-100">
                  <img
                    src={service.image}
                    alt={service.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                  <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-xs text-white text-[10px] font-bold flex items-center gap-1">
                    <CategoryIconComp className="w-3 h-3 text-blue-300" />
                    <span>{service.category}</span>
                  </div>
                </div>
              </div>

              {/* Service Info */}
              <div className="md:col-span-2 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-extrabold border border-emerald-200/60 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Status: Aktif di Katalog Publik</span>
                  </span>

                  <span className="text-xs text-slate-400 font-mono">
                    ID: {service.id}
                  </span>
                </div>

                <h2 className="text-lg sm:text-2xl font-black text-slate-900 leading-snug">
                  {service.title}
                </h2>

                <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 flex items-baseline gap-2">
                  <span className="text-xs font-bold text-slate-500 uppercase">Tarif:</span>
                  <span className="text-xl sm:text-2xl font-black text-[#1683FF]">
                    {formatIDR(service.price)}
                  </span>
                  <span className="text-xs font-bold text-slate-600">
                    {service.unit || "/ proyek"}
                  </span>
                </div>

                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1.5">
                    Deskripsi Layanan
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                    {service.desc || "Belum ada deskripsi khusus untuk layanan ini."}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Details Metadata & Location */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Lokasi & Mode */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-xs space-y-4">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#1683FF]" />
                <span>Mode &amp; Lokasi Pengerjaan</span>
              </h3>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-500 font-medium">Tipe Layanan:</span>
                  <span className="font-bold text-slate-900 capitalize">
                    {service.locationType === "onsite" ? "Di Studio / Workshop" :
                     service.locationType === "customer_location" ? "Panggilan ke Tempat Klien" :
                     service.locationType === "online" ? "100% Online / Remote" : "Hybrid (Online/Onsite)"}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <span className="text-slate-500 font-medium block">Alamat / Patokan:</span>
                  <span className="font-semibold text-slate-800 block">
                    {service.address || provider.address || "Studio Penyedia Jasa"}
                  </span>
                </div>

                {service.latitude && service.longitude && (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 font-mono text-[11px]">
                    <span className="text-slate-500">Koordinat GPS:</span>
                    <span className="font-bold text-slate-800">
                      {service.latitude}, {service.longitude}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions & Promosi */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-xs space-y-4">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Rocket className="w-4 h-4 text-[#1683FF]" />
                <span>Aksi &amp; Promosi Layanan</span>
              </h3>

              <p className="text-xs text-slate-500 leading-relaxed">
                Tingkatkan keterlihatan layanan ini di posisi teratas pencarian dengan paket promosi berbayar resmi Bantuin.
              </p>

              <div className="space-y-2.5 pt-1">
                <Link
                  href={`/jasa/dashboard/promosi/buat?serviceId=${service.id}`}
                  className="w-full p-3 rounded-2xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs"
                >
                  <Rocket className="w-4 h-4" />
                  <span>Promosikan Layanan Ini Sekarang</span>
                </Link>

                <div className="grid grid-cols-2 gap-2.5">
                  <Link
                    href={`/jasa/dashboard/katalog/${service.id}/edit`}
                    className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-800 text-xs font-bold transition flex items-center justify-center gap-1.5"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                    <span>Edit Data</span>
                  </Link>

                  <button
                    type="button"
                    onClick={() => setIsDeleteModalOpen(true)}
                    className="p-2.5 rounded-xl border border-rose-200 bg-rose-50/50 hover:bg-rose-100/60 text-rose-600 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus Layanan</span>
                  </button>
                </div>
              </div>
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
                <h3 className="text-base font-extrabold text-slate-900">Hapus Layanan dari Katalog?</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Apakah Anda yakin ingin menghapus layanan <span className="font-bold text-slate-800">&ldquo;{service.title}&rdquo;</span>? Tindakan ini tidak dapat dibatalkan.
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
