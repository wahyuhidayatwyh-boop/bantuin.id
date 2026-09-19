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
  Trash2,
  ArrowUpRight,
  Clock,
  Check,
  X,
  Loader2,
  AlertCircle,
  Building2,
  CreditCard,
  UserCheck
} from "lucide-react";

export default function PartnerDashboardPage() {
  const { 
    rentals, 
    currentUser, 
    mitraAvailableBalance, 
    mitraPendingBalance, 
    mitraTotalEarned, 
    withdrawFunds, 
    withdrawals, 
    addToast 
  } = useApp();

  const [activeMenu, setActiveMenu] = useState("overview");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Modal State: Tarik Saldo (Withdrawal)
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [withdrawForm, setWithdrawForm] = useState({
    amount: "200000",
    bankName: "BCA",
    accountNumber: "8820192841",
    accountHolder: currentUser?.fullName || "Rian Prasetya",
  });

  const sidebarLinks = [
    { id: "overview", label: "Ringkasan Bisnis", icon: LayoutDashboard },
    { id: "catalog", label: "Katalog Rental & Jasa", icon: Package, count: rentals.length },
    { id: "orders", label: "Pesanan Masuk", icon: Receipt, count: 3 },
    { id: "wallet", label: "Hak Pembayaran & Payout", icon: Wallet },
    { id: "profile", label: "Profil Toko Mitra", icon: Store },
    { id: "settings", label: "Pengaturan", icon: Settings },
  ];

  const handleWithdrawSubmit = (e) => {
    e.preventDefault();
    const success = withdrawFunds({
      amount: withdrawForm.amount,
      bankName: withdrawForm.bankName,
      accountNumber: withdrawForm.accountNumber,
      accountHolder: withdrawForm.accountHolder,
    });
    if (success) {
      setIsWithdrawModalOpen(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#F4F7FB]">
      
      {/* 1. MOBILE TOP NAVIGATION BAR (< lg) */}
      <div className="lg:hidden bg-white border-b border-slate-200/90 sticky top-0 z-40 shadow-xs">
        {/* Top Header with Brand & Mode Switch */}
        <div className="px-4 py-2.5 flex items-center justify-between border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center">
              <Image
                src={logoImg}
                alt="Bantuin"
                height={26}
                className="h-6 w-auto object-contain mix-blend-multiply"
              />
            </Link>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
              Mitra Hub
            </span>
          </div>

          <div className="flex items-center gap-2">
            {activeMenu === "wallet" ? (
              <button
                onClick={() => setIsWithdrawModalOpen(true)}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-[#1683FF] text-white text-[11px] font-bold shadow-2xs transition active:scale-95"
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>Tarik</span>
              </button>
            ) : (
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-[#1683FF] text-white text-[11px] font-bold shadow-2xs transition active:scale-95"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Tambah</span>
              </button>
            )}
            <Link
              href="/"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold transition"
            >
              <ArrowLeft className="w-3 h-3" />
              <span>User</span>
            </Link>
          </div>
        </div>

        {/* Store Micro-info Bar */}
        <div className="px-4 py-1.5 bg-slate-50/80 flex items-center justify-between border-b border-slate-100 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-5 h-5 rounded-md bg-[#1683FF] text-white flex items-center justify-center shrink-0">
              <Store className="w-3 h-3" />
            </div>
            <span className="font-bold text-slate-900 truncate">Jogja Cam & Audio Hub</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-[#1683FF] shrink-0" />
          </div>
          <div className="flex items-center gap-1 text-[11px] text-slate-500 shrink-0">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            <span className="font-semibold text-slate-700">4.95</span>
          </div>
        </div>

        {/* Horizontal Scrollable Tabs */}
        <div className="px-3 py-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {sidebarLinks.map((item) => {
            const Icon = item.icon;
            const isActive = activeMenu === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveMenu(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition ${
                  isActive
                    ? "bg-[#1683FF] text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:text-slate-900"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-white" : "text-slate-500"}`} />
                <span>{item.label}</span>
                {item.count !== undefined && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                    isActive ? "bg-white/20 text-white" : "bg-white text-slate-600 shadow-2xs"
                  }`}>
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. DEDICATED DESKTOP SIDEBAR NAVIGATION */}
      <aside className="hidden lg:flex lg:w-72 bg-white border-r border-slate-200/90 flex-col justify-between shrink-0 shadow-xs sticky top-0 h-screen overflow-y-auto">
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
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
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

      {/* 3. MAIN CONTENT AREA FOR MITRA */}
      <main className="flex-1 flex flex-col min-w-0">
        
        {/* Top Sticky Bar (Desktop) */}
        <header className="hidden lg:flex sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-6 py-3.5 items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
              {activeMenu === "overview" && "Ringkasan Bisnis Mitra"}
              {activeMenu === "catalog" && "Katalog Produk & Layanan"}
              {activeMenu === "orders" && "Daftar Pesanan Masuk"}
              {activeMenu === "wallet" && "Hak Pembayaran & Penarikan Dana"}
              {activeMenu === "profile" && "Profil Toko & Informasi Bisnis"}
              {activeMenu === "settings" && "Pengaturan Akun Mitra"}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {activeMenu === "wallet" ? (
              <button
                onClick={() => setIsWithdrawModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white text-xs font-bold shadow-xs transition active:scale-95 cursor-pointer"
              >
                <ArrowUpRight className="w-4 h-4" />
                <span>Tarik Dana Sekarang</span>
              </button>
            ) : (
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white text-xs font-bold shadow-xs transition active:scale-95 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Tambah Produk Baru</span>
              </button>
            )}
          </div>
        </header>

        {/* Dynamic Main Body Content */}
        <div className="p-4 sm:p-6 md:p-8 space-y-6 max-w-[1200px] w-full">
          
          {/* VIEW 1: OVERVIEW */}
          {activeMenu === "overview" && (
            <div className="space-y-6">
              {/* Metric Cards Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-2xs">
                  <div className="text-xs text-slate-500 flex items-center justify-between mb-1 font-medium">
                    <span className="flex items-center gap-1.5">
                      <DollarSign className="w-4 h-4 text-emerald-600" />
                      <span>Saldo Siap Cair</span>
                    </span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700">
                      AVAILABLE
                    </span>
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-slate-900">
                    {formatIDR(mitraAvailableBalance)}
                  </div>
                  <button 
                    onClick={() => setIsWithdrawModalOpen(true)}
                    className="text-[11px] text-[#1683FF] mt-1 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>Tarik Dana</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </button>
                </div>

                <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs">
                  <div className="text-xs text-slate-500 flex items-center justify-between mb-1 font-medium">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-amber-500" />
                      <span>Hak Tertahan</span>
                    </span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700">
                      PENDING
                    </span>
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-slate-900">
                    {formatIDR(mitraPendingBalance)}
                  </div>
                  <div className="text-[11px] text-amber-600 mt-1 font-semibold">Dalam masa sewa aktif</div>
                </div>

                <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs">
                  <div className="text-xs text-slate-500 flex items-center gap-1.5 mb-1 font-medium">
                    <Package className="w-4 h-4 text-[#1683FF]" />
                    <span>Unit Rental Aktif</span>
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-slate-900">
                    {rentals.length} Unit
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">Siap disewa mahasiswa</div>
                </div>

                <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs">
                  <div className="text-xs text-slate-500 flex items-center gap-1.5 mb-1 font-medium">
                    <TrendingUp className="w-4 h-4 text-indigo-600" />
                    <span>Total Omset Bersih</span>
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-slate-900">
                    {formatIDR(mitraTotalEarned)}
                  </div>
                  <div className="text-[11px] text-emerald-600 mt-1 font-semibold">Fee transfer Rp0</div>
                </div>
              </div>

              {/* Active Orders Box */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-base text-slate-900">Pesanan Rental Aktif Hari Ini</h3>
                    <p className="text-xs text-slate-500">Pantau status serah terima fisik dan deposit jaminan unit</p>
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
                        <div className="text-[10px] text-emerald-600 font-semibold">Hak Payout Menunggu Kembali</div>
                      </div>
                      <span className="text-xs font-bold px-3 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-200">
                        Sedang Disewa
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Catalog Listing Preview */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-base text-slate-900">Katalog Barang Rental Saya</h3>
                    <p className="text-xs text-slate-500">{rentals.length} produk aktif tayang di pencarian</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {rentals.slice(0, 3).map((rental) => (
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
          )}

          {/* VIEW 2: CATALOG */}
          {activeMenu === "catalog" && (
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-base text-slate-900">Katalog Barang Rental &amp; Jasa</h3>
                  <p className="text-xs text-slate-500">Kelola stok unit, tarif sewa harian, dan jaminan deposit</p>
                </div>
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="px-4 py-2 bg-[#1683FF] hover:bg-[#0F6FE5] text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Tambah Produk</span>
                </button>
              </div>

              <div className="space-y-3 pt-2">
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
          )}

          {/* VIEW 3: ORDERS */}
          {activeMenu === "orders" && (
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-base text-slate-900">Daftar Pesanan Masuk</h3>
                  <p className="text-xs text-slate-500">Daftar pesanan rental dan jasa dari customer</p>
                </div>
                <span className="text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-full">
                  3 Berjalan
                </span>
              </div>

              <div className="space-y-3 pt-2">
                <div className="p-4 rounded-xl border border-slate-200 bg-[#F8FAFF] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-[#1683FF] text-white flex items-center justify-center font-black text-xs shrink-0">
                      RNT-01
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">Dimas Anggara</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-bold">
                          Sedang Disewa
                        </span>
                      </div>
                      <h4 className="font-bold text-sm text-slate-900 mt-0.5">Sony Alpha A6400 (1 Hari)</h4>
                      <p className="text-xs text-slate-500 mt-0.5">Titik Temu: Bantuin Point Rektorat · Deposit Rp200.000 aman</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between w-full md:w-auto gap-4">
                    <div className="text-left md:text-right">
                      <div className="text-xs font-black text-slate-900">{formatIDR(75000)}</div>
                      <div className="text-[10px] text-amber-600 font-semibold">Hak Sewa PENDING</div>
                    </div>
                    <Link
                      href="/chat?room=order-room-rental-kamera"
                      className="px-4 py-2 bg-[#1683FF] hover:bg-[#0F6FE5] text-white text-xs font-bold rounded-xl transition shadow-2xs inline-flex items-center gap-1.5"
                    >
                      <Receipt className="w-3.5 h-3.5" />
                      <span>Lihat Ruang Chat</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 4: WALLET & HAK PEMBAYARAN MITRA */}
          {activeMenu === "wallet" && (
            <div className="space-y-6">
              {/* Wallet Summary Card */}
              <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden border border-slate-800">
                <div className="absolute right-0 top-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-blue-300 uppercase tracking-wider block">
                        Saldo Dapat Dicairkan (Mitra)
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        Status: AVAILABLE
                      </span>
                    </div>
                    <div className="text-3xl sm:text-4xl font-black tracking-tight text-white mb-2">
                      {formatIDR(mitraAvailableBalance)}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-300">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>Hak bersih dari transaksi selesai · Biaya transfer admin ditanggung Bantuin.id</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      onClick={() => setIsWithdrawModalOpen(true)}
                      className="px-6 py-3 rounded-2xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white text-xs sm:text-sm font-bold shadow-lg transition active:scale-95 flex items-center justify-center gap-2"
                    >
                      <ArrowUpRight className="w-4 h-4" />
                      <span>Ajukan Penarikan Dana</span>
                    </button>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 text-xs">
                  <div>
                    <div className="text-slate-400">Hak Tertahan / Diproses (Masa Sewa Aktif)</div>
                    <div className="font-bold text-amber-400 text-sm mt-0.5">{formatIDR(mitraPendingBalance)}</div>
                  </div>
                  <div>
                    <div className="text-slate-400">Total Omset Bersih (All-Time)</div>
                    <div className="font-bold text-white text-sm mt-0.5">
                      {formatIDR(mitraTotalEarned)}
                    </div>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <div className="text-slate-400">Biaya Transfer Pencairan</div>
                    <div className="font-bold text-emerald-400 text-sm mt-0.5">Rp0 (Ditanggung Bantuin.id)</div>
                  </div>
                </div>
              </div>

              {/* Informational Alert on Ledger & Manual Transfer */}
              <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-[#1683FF] shrink-0 mt-0.5" />
                <div className="text-xs text-slate-700 leading-relaxed">
                  <strong className="text-slate-900 block font-bold mb-0.5">
                    Kebijakan Hak Pembayaran &amp; Payout Manual MVP:
                  </strong>
                  Saldo di atas merupakan catatan ledger hak pembayaran Anda yang sah setelah barang dikembalikan dan diverifikasi. Pencairan dana ditransfer secara manual oleh Admin Bantuin via m-Banking (BCA/Mandiri/BRI) dalam 1×24 jam tanpa potongan fee transfer.
                </div>
              </div>

              {/* Withdrawals History Table */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-base text-slate-900">Riwayat Penarikan Dana Mitra</h3>
                    <p className="text-xs text-slate-500">Pencairan ditransfer secara manual oleh admin via m-Banking</p>
                  </div>
                  <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                    {withdrawals.length} Pengajuan
                  </span>
                </div>

                <div className="divide-y divide-slate-100">
                  {withdrawals.map((wd) => {
                    const isSuccess = wd.status === "SUCCESS";

                    return (
                      <div key={wd.id} className="py-3.5 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                            isSuccess ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                          }`}>
                            {isSuccess ? <Check className="w-4 h-4" /> : <Loader2 className="w-4 h-4 animate-spin" />}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-900">
                              Transfer Rekening {wd.bankName} - {wd.accountNumber} ({wd.accountHolder})
                            </div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                              <span>ID: {wd.id}</span>
                              <span>·</span>
                              <span>{new Date(wd.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                              {wd.transferReference && (
                                <>
                                  <span>·</span>
                                  <span className="font-mono text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                                    Ref: {wd.transferReference}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-xs font-black text-slate-900">{formatIDR(wd.amount)}</div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mt-0.5 ${
                            isSuccess 
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}>
                            {isSuccess ? "SUCCESS (Ditransfer Admin)" : "PENDING (Menunggu Transfer Admin)"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* VIEW 5: PROFILE */}
          {activeMenu === "profile" && (
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs space-y-4">
              <h3 className="font-bold text-base text-slate-900">Profil Toko Mitra</h3>
              <p className="text-xs text-slate-500">Informasi toko Anda yang ditampilkan kepada mahasiswa penyewa</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/60">
                  <span className="text-[11px] text-slate-500 block">Nama Toko</span>
                  <strong className="text-sm text-slate-900">Jogja Cam &amp; Audio Hub</strong>
                </div>
                <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/60">
                  <span className="text-[11px] text-slate-500 block">Lokasi Serah Terima</span>
                  <strong className="text-sm text-slate-900">Jl. Kaliurang KM 5, Sleman (Dekat UGM)</strong>
                </div>
                <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/60">
                  <span className="text-[11px] text-slate-500 block">Kontak WhatsApp</span>
                  <strong className="text-sm text-slate-900">0812-3456-7890</strong>
                </div>
                <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/60">
                  <span className="text-[11px] text-slate-500 block">Status Verifikasi Usaha</span>
                  <strong className="text-sm text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Mitra Terverifikasi Resmi</span>
                  </strong>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 6: SETTINGS */}
          {activeMenu === "settings" && (
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs space-y-4">
              <h3 className="font-bold text-base text-slate-900">Pengaturan Akun &amp; Rekening Payout</h3>
              <p className="text-xs text-slate-500">Konfigurasi rekening tujuan transfer admin m-Banking</p>

              <div className="max-w-md space-y-4 pt-2">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Bank Tujuan Payout</label>
                  <select 
                    value={withdrawForm.bankName}
                    onChange={(e) => setWithdrawForm({ ...withdrawForm, bankName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium"
                  >
                    <option value="BCA">BCA (Bank Central Asia)</option>
                    <option value="Mandiri">Mandiri</option>
                    <option value="BRI">BRI (Bank Rakyat Indonesia)</option>
                    <option value="BNI">BNI (Bank Negara Indonesia)</option>
                    <option value="BSI">BSI (Bank Syariah Indonesia)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Nomor Rekening</label>
                  <input
                    type="text"
                    value={withdrawForm.accountNumber}
                    onChange={(e) => setWithdrawForm({ ...withdrawForm, accountNumber: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Nama Pemilik Rekening</label>
                  <input
                    type="text"
                    value={withdrawForm.accountHolder}
                    onChange={(e) => setWithdrawForm({ ...withdrawForm, accountHolder: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => addToast("Pengaturan Disimpan", "Rekening payout utama Anda telah diperbarui.")}
                  className="px-5 py-2.5 bg-[#1683FF] hover:bg-[#0F6FE5] text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
                >
                  Simpan Pengaturan
                </button>
              </div>
            </div>
          )}

        </div>

      </main>

      {/* MODAL 1: TARIK DANA (WITHDRAWAL) */}
      {isWithdrawModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto p-5 sm:p-7 border border-slate-200 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1683FF] flex items-center justify-center">
                  <ArrowUpRight className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Tarik Hak Pembayaran Mitra</h3>
                  <p className="text-[11px] text-slate-500">Ditransfer manual oleh Admin via m-Banking</p>
                </div>
              </div>
              <button
                onClick={() => setIsWithdrawModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleWithdrawSubmit} className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-100 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-500 block">Saldo Dapat Dicairkan:</span>
                  <span className="text-lg font-black text-[#1683FF]">{formatIDR(mitraAvailableBalance)}</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-700">
                  AVAILABLE
                </span>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Nominal Penarikan (Rp)</label>
                <input
                  type="number"
                  min="50000"
                  max={mitraAvailableBalance}
                  value={withdrawForm.amount}
                  onChange={(e) => setWithdrawForm({ ...withdrawForm, amount: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-900 focus:outline-hidden focus:border-[#1683FF]"
                  placeholder="Min. Rp 50.000"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Bank Tujuan</label>
                  <select
                    value={withdrawForm.bankName}
                    onChange={(e) => setWithdrawForm({ ...withdrawForm, bankName: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-medium"
                  >
                    <option value="BCA">BCA</option>
                    <option value="Mandiri">Mandiri</option>
                    <option value="BRI">BRI</option>
                    <option value="BNI">BNI</option>
                    <option value="BSI">BSI</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">No. Rekening</label>
                  <input
                    type="text"
                    value={withdrawForm.accountNumber}
                    onChange={(e) => setWithdrawForm({ ...withdrawForm, accountNumber: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-medium"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Nama Pemilik Rekening</label>
                <input
                  type="text"
                  value={withdrawForm.accountHolder}
                  onChange={(e) => setWithdrawForm({ ...withdrawForm, accountHolder: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium"
                  required
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 space-y-1">
                <div className="flex items-center justify-between">
                  <span>Biaya Transfer Admin (m-Banking):</span>
                  <span className="font-bold text-emerald-600">Rp 0 (Ditanggung Bantuin.id)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Dana Bersih Diterima:</span>
                  <span className="font-bold text-slate-900">{formatIDR(Number(withdrawForm.amount) || 0)}</span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsWithdrawModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={Number(withdrawForm.amount) <= 0 || Number(withdrawForm.amount) > mitraAvailableBalance}
                  className="px-6 py-2.5 rounded-xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white text-xs font-bold shadow-xs transition active:scale-95 disabled:opacity-50"
                >
                  Kirim Pengajuan Payout
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: TAMBAH PRODUK BARU */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto p-5 sm:p-7 border border-slate-200 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Tambah Unit Rental Baru</h3>
                <p className="text-[11px] text-slate-500">Tayangkan perlengkapan atau barang untuk disewakan</p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              addToast("Unit Ditambahkan", "Barang sewa baru berhasil didaftarkan dan segera tayang.");
              setIsAddModalOpen(false);
            }} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Nama Barang / Seri</label>
                <input
                  type="text"
                  placeholder="Contoh: Sony A7 IV Body Only"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Tarif Sewa / Hari (Rp)</label>
                  <input
                    type="number"
                    placeholder="150000"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Deposit Jaminan (Rp)</label>
                  <input
                    type="number"
                    placeholder="200000"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-medium"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Kategori</label>
                <select className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium">
                  <option>Kamera &amp; Lensa</option>
                  <option>Audio &amp; Mic</option>
                  <option>Lighting &amp; Studio</option>
                  <option>Elektronik &amp; Gadget</option>
                  <option>Peralatan Event &amp; Tenda</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white text-xs font-bold shadow-xs transition active:scale-95"
                >
                  Simpan &amp; Tayangkan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
