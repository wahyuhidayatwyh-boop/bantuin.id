"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import logoImg from "@/components/image/logo.png";
import { useApp } from "@/lib/context/AppContext";
import { formatIDR } from "@/lib/utils";
import { 
  Store, 
  TrendingUp, 
  Package, 
  DollarSign, 
  PlusCircle, 
  Star, 
  Calendar,
  CheckCircle2,
  LayoutDashboard,
  Receipt,
  Wallet,
  Settings,
  ArrowLeft,
  ShieldCheck,
  Search,
  Bell,
  SlidersHorizontal,
  ChevronRight,
  Eye,
  Edit,
  Trash2
} from "lucide-react";

export default function PartnerDashboardPage() {
  const { rentals, currentUser } = useApp();
  const [activeMenu, setActiveMenu] = useState("overview");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const sidebarLinks = [
    { id: "overview", label: "Ringkasan Bisnis", icon: LayoutDashboard },
    { id: "catalog", label: "Katalog Rental & Jasa", icon: Package, count: rentals.length },
    { id: "orders", label: "Pesanan Masuk", icon: Receipt, count: 3 },
    { id: "wallet", label: "Dompet & Escrow", icon: Wallet },
    { id: "profile", label: "Profil Toko Mitra", icon: Store },
    { id: "settings", label: "Pengaturan", icon: Settings },
  ];

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#F4F7FB]">
      
      {/* 1. DEDICATED LEFT SIDEBAR NAVIGATION FOR MITRA */}
      <aside className="w-full lg:w-72 bg-white border-r border-slate-200/90 flex flex-col justify-between shrink-0 shadow-xs">
        <div>
          {/* Top Mitra Brand Header */}
          <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 group">
              <Image
                src={logoImg}
                alt="Bantuin"
                height={32}
                className="h-7 w-auto object-contain mix-blend-multiply"
              />
            </Link>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
              Mitra Hub
            </span>
          </div>


          {/* Store Profile Card */}
          <div className="p-5 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#1683FF] to-[#0F6FE5] text-white flex items-center justify-center font-black shadow-xs shrink-0">
                <Store className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-900 truncate flex items-center gap-1">
                  <span>Jogja Cam & Audio Hub</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#1683FF] shrink-0" />
                </div>
                <div className="text-[11px] text-slate-500 truncate flex items-center gap-1 mt-0.5">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  <span className="font-semibold text-slate-700">4.95</span>
                  <span>(42 ulasan)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Nav Items */}
          <nav className="p-3 space-y-1">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 py-2">
              Menu Mitra
            </div>

            {sidebarLinks.map((item) => {
              const Icon = item.icon;
              const isActive = activeMenu === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveMenu(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                    isActive
                      ? "bg-[#1683FF] text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-500"}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.count !== undefined && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                      isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                    }`}>
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom: Return to User Mode */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/60">
          <Link
            href="/"
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-bold transition shadow-2xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Mode User</span>
          </Link>
        </div>
      </aside>

      {/* 2. MAIN CONTENT AREA FOR MITRA */}
      <main className="flex-1 flex flex-col min-w-0">
        
        {/* Top Sticky Bar */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-6 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
              {activeMenu === "overview" && "Ringkasan Bisnis Mitra"}
              {activeMenu === "catalog" && "Katalog Produk & Layanan"}
              {activeMenu === "orders" && "Daftar Pesanan Masuk"}
              {activeMenu === "wallet" && "Dompet & Penarikan Saldo"}
              {activeMenu === "profile" && "Profil Toko & Informasi Bisnis"}
              {activeMenu === "settings" && "Pengaturan Akun Mitra"}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white text-xs font-bold shadow-xs transition active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Tambah Produk Baru</span>
            </button>
          </div>
        </header>

        {/* Dynamic Main Body Content */}
        <div className="p-6 md:p-8 space-y-6 max-w-[1200px] w-full">
          
          {/* Metric Cards Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs">
              <div className="text-xs text-slate-500 flex items-center gap-1.5 mb-1 font-medium">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                <span>Total Pendapatan</span>
              </div>
              <div className="text-xl sm:text-2xl font-black text-slate-900">
                {formatIDR(2450000)}
              </div>
              <div className="text-[11px] text-emerald-600 mt-1 font-semibold">↑ 18% bulan ini</div>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs">
              <div className="text-xs text-slate-500 flex items-center gap-1.5 mb-1 font-medium">
                <Package className="w-4 h-4 text-[#1683FF]" />
                <span>Unit Rental Aktif</span>
              </div>
              <div className="text-xl sm:text-2xl font-black text-slate-900">
                {rentals.length} Unit
              </div>
              <div className="text-[11px] text-slate-500 mt-1">4 unit sedang tersewa</div>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs">
              <div className="text-xs text-slate-500 flex items-center gap-1.5 mb-1 font-medium">
                <Receipt className="w-4 h-4 text-indigo-600" />
                <span>Pesanan Selesai</span>
              </div>
              <div className="text-xl sm:text-2xl font-black text-slate-900">
                38 Order
              </div>
              <div className="text-[11px] text-emerald-600 mt-1 font-semibold">100% Escrow Aman</div>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs">
              <div className="text-xs text-slate-500 flex items-center gap-1.5 mb-1 font-medium">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span>Rating Mitra</span>
              </div>
              <div className="text-xl sm:text-2xl font-black text-slate-900">
                4.95 / 5.0
              </div>
              <div className="text-[11px] text-slate-500 mt-1">Dari 42 penyewa</div>
            </div>
          </div>

          {/* Active Orders Box */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-base text-slate-900">Pesanan Rental Aktif Hari Ini</h3>
                <p className="text-xs text-slate-500">Pantau status serah terima dan saldo escrow tertahan</p>
              </div>
              <span className="text-xs font-bold text-[#1683FF] bg-blue-50 px-3 py-1 rounded-full">
                3 Berjalan
              </span>
            </div>

            <div className="space-y-3">
              <div className="p-4 rounded-xl border border-slate-100 bg-[#F8FBFF] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-blue-100/60 text-[#1683FF] flex items-center justify-center font-bold text-xs shrink-0">
                    #082
                  </div>
                  <div>
                    <h4 className="font-bold text-xs sm:text-sm text-slate-900">Sony Alpha A6400 (1 Hari)</h4>
                    <p className="text-[11px] text-slate-500">Penyewa: Dimas Anggara · Titik Temu: Bantuin Point Rektorat</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 self-end sm:self-auto">
                  <div className="text-right">
                    <div className="font-extrabold text-xs text-slate-900">Rp 75.000</div>
                    <div className="text-[10px] text-emerald-600 font-semibold">Escrow Xendit Terkunci</div>
                  </div>
                  <span className="text-xs font-bold px-3 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-200">
                    Sedang Disewa
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Catalog Listing Table */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-base text-slate-900">Katalog Barang Rental Saya</h3>
                <p className="text-xs text-slate-500">{rentals.length} produk aktif tayang di pencarian</p>
              </div>
            </div>

            <div className="space-y-3">
              {rentals.map((rental) => (
                <div
                  key={rental.id}
                  className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3.5">
                    <img
                      src={rental.photoUrl}
                      alt={rental.title}
                      className="w-14 h-14 rounded-xl object-cover border border-slate-200 shrink-0"
                    />
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">{rental.title}</h4>
                      <p className="text-xs text-slate-500">{rental.category} · Deposit: {formatIDR(rental.depositAmount || 50000)}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between w-full sm:w-auto gap-4 self-stretch sm:self-auto">
                    <div className="text-left sm:text-right">
                      <div className="font-black text-sm text-[#1683FF]">
                        {formatIDR(rental.dailyPrice)}<span className="text-xs text-slate-400 font-normal">/hari</span>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        Aktif Tayang
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-[#1683FF] shadow-2xs">
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </main>

    </div>
  );
}
