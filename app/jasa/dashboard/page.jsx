"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import logoImg from "@/components/image/logo.png";
import { useApp } from "@/lib/context/AppContext";
import { formatIDR, formatDateIndo } from "@/lib/utils";
import { 
  Briefcase, 
  DollarSign, 
  PlusCircle, 
  Star, 
  CheckCircle2, 
  LayoutDashboard, 
  Receipt, 
  Wallet, 
  Settings, 
  ArrowLeft, 
  MessageSquare, 
  Trash2,
  Check, 
  X,
  ArrowUpRight,
  ShieldCheck,
  ExternalLink,
  Plus,
  QrCode,
  Building2,
  Loader2
} from "lucide-react";

export default function JasaDashboardPage() {
  const { 
    services, 
    currentUser, 
    walletBalance, 
    pendingEscrowBalance, 
    withdrawals, 
    withdrawFunds,
    topUpFunds,
    addService,
    deleteService,
    providerSettings,
    updateProviderSettings,
    addToast
  } = useApp();

  const [activeMenu, setActiveMenu] = useState("overview"); // overview, services, orders, wallet, profile, settings
  
  // Modal State: Tambah Layanan
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newServiceForm, setNewServiceForm] = useState({
    title: "",
    category: "Desain Grafis",
    startingPrice: "",
    description: "",
    coverImage: "https://images.unsplash.com/photo-1626785774573-4b799315345d?auto=format&fit=crop&w=800&q=80",
    tags: "Desain, Branding, Logo",
  });

  // Modal State: Tarik Saldo (Withdrawal)
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [withdrawForm, setWithdrawForm] = useState({
    amount: "200000",
    bankName: "BCA",
    accountNumber: "8820192841",
    accountHolder: currentUser?.fullName || "Rian Prasetya",
  });

  // Modal State: Isi Saldo (Top Up)
  const [isTopUpModalOpen, setIsTopUpModalOpen] = useState(false);
  const [topUpForm, setTopUpForm] = useState({
    amount: "50000",
    paymentMethod: "qris",
  });
  const [isProcessingTopUp, setIsProcessingTopUp] = useState(false);
  const [isTopUpSuccess, setIsTopUpSuccess] = useState(false);

  // Settings Form State
  const [settingsForm, setSettingsForm] = useState(providerSettings);

  const sidebarLinks = [
    { id: "overview", label: "Ringkasan Jasa", icon: LayoutDashboard },
    { id: "services", label: "Portofolio & Layanan", icon: Briefcase, count: services.length },
    { id: "orders", label: "Pesanan Klien Masuk", icon: Receipt, count: 2 },
    { id: "wallet", label: "Dompet & Penarikan", icon: Wallet },
    { id: "profile", label: "Keahlian & Profil", icon: Briefcase },
    { id: "settings", label: "Tarif & Ketersediaan", icon: Settings },
  ];

  const handleCreateService = (e) => {
    e.preventDefault();
    if (!newServiceForm.title || !newServiceForm.startingPrice) {
      addToast("Form Belum Lengkap", "Silakan isi judul dan tarif dasar layanan.", "error");
      return;
    }

    addService({
      title: newServiceForm.title,
      category: newServiceForm.category,
      startingPrice: Number(newServiceForm.startingPrice),
      description: newServiceForm.description || "Layanan profesional dengan pengerjaan kilat dan hasil teruji.",
      coverImage: newServiceForm.coverImage,
      tags: newServiceForm.tags.split(",").map(t => t.trim()),
    });

    setIsAddModalOpen(false);
    setNewServiceForm({
      title: "",
      category: "Desain Grafis",
      startingPrice: "",
      description: "",
      coverImage: "https://images.unsplash.com/photo-1626785774573-4b799315345d?auto=format&fit=crop&w=800&q=80",
      tags: "Desain, Branding, Logo",
    });
  };

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

  const handleSaveSettings = (e) => {
    e.preventDefault();
    updateProviderSettings(settingsForm);
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#F4F7FB]">
      
      {/* 1. DEDICATED LEFT SIDEBAR NAVIGATION FOR PENYEDIA JASA */}
      <aside className="w-full lg:w-72 bg-white border-r border-slate-200/90 flex flex-col justify-between shrink-0 shadow-xs">
        <div>
          {/* Top Brand Header */}
          <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 group">
              <Image
                src={logoImg}
                alt="Bantuin"
                height={32}
                className="h-7 w-auto object-contain mix-blend-multiply"
              />
            </Link>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
              Portal Jasa Pro
            </span>
          </div>

          {/* Provider Profile Card */}
          <div className="p-5 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-600 text-white flex items-center justify-center font-black shadow-xs shrink-0">
                <Briefcase className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-900 truncate flex items-center gap-1">
                  <span>{currentUser?.fullName || "Rian Prasetya"}</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#1683FF] shrink-0" />
                </div>
                <div className="text-[11px] text-slate-500 truncate flex items-center gap-1 mt-0.5">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  <span className="font-semibold text-slate-700">4.96</span>
                  <span>(48 order selesai)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Nav Items */}
          <nav className="p-3 space-y-1">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 py-2">
              Menu Penyedia Jasa
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
                      ? "bg-indigo-600 text-white shadow-xs"
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
            <span>Kembali ke Beranda User</span>
          </Link>
        </div>
      </aside>

      {/* 2. MAIN CONTENT AREA FOR PENYEDIA JASA */}
      <main className="flex-1 flex flex-col min-w-0">
        
        {/* Top Sticky Header */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-6 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
              {activeMenu === "overview" && "Ringkasan Kinerja Jasa & Freelance"}
              {activeMenu === "services" && "Manajemen Portofolio & Paket Layanan"}
              {activeMenu === "orders" && "Daftar Pesanan & Brief Klien"}
              {activeMenu === "wallet" && "Dompet Saldo & Penarikan Escrow"}
              {activeMenu === "profile" && "Keahlian & Pengaturan Profil Publik"}
              {activeMenu === "settings" && "Pengaturan Tarif & Ketersediaan"}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Tambah Layanan Baru</span>
            </button>
          </div>
        </header>

        {/* Main Dashboard Body */}
        <div className="p-6 md:p-8 space-y-6 max-w-[1200px] w-full">
          
          {/* VIEW 1: OVERVIEW */}
          {activeMenu === "overview" && (
            <>
              {/* 4 Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs">
                  <div className="text-xs text-slate-500 flex items-center gap-1.5 mb-1 font-medium">
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                    <span>Saldo Dompet Siap Tarik</span>
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-slate-900">
                    {formatIDR(walletBalance)}
                  </div>
                  <button 
                    onClick={() => setActiveMenu("wallet")}
                    className="text-[11px] text-indigo-600 hover:underline mt-1 font-semibold block"
                  >
                    Tarik Saldo Instan →
                  </button>
                </div>

                <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs">
                  <div className="text-xs text-slate-500 flex items-center gap-1.5 mb-1 font-medium">
                    <Briefcase className="w-4 h-4 text-indigo-600" />
                    <span>Paket Layanan Aktif</span>
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-slate-900">
                    {services.length} Paket
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">Tayang di explore publik</div>
                </div>

                <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs">
                  <div className="text-xs text-slate-500 flex items-center gap-1.5 mb-1 font-medium">
                    <Receipt className="w-4 h-4 text-[#1683FF]" />
                    <span>Order Selesai</span>
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-slate-900">
                    48 Projek
                  </div>
                  <div className="text-[11px] text-emerald-600 mt-1 font-semibold">100% Kepuasan Klien</div>
                </div>

                <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs">
                  <div className="text-xs text-slate-500 flex items-center gap-1.5 mb-1 font-medium">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <span>Rating Jasa</span>
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-slate-900">
                    4.96 / 5.0
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">Dari 48 ulasan terverifikasi</div>
                </div>
              </div>

              {/* Active Client Orders Section */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-base text-slate-900">Projek Klien Sedang Berjalan</h3>
                    <p className="text-xs text-slate-500">Pantau progres pengerjaan, chat klien, dan saldo escrow aman</p>
                  </div>
                  <button 
                    onClick={() => setActiveMenu("orders")}
                    className="text-xs font-bold text-indigo-600 hover:underline"
                  >
                    Lihat Semua Pesanan
                  </button>
                </div>

                <div className="space-y-3">
                  <div className="p-4 rounded-xl border border-slate-100 bg-[#F8FAFF] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">
                        #JS-01
                      </div>
                      <div>
                        <h4 className="font-bold text-xs sm:text-sm text-slate-900">Desain 6 Feed Instagram UMKM Kuliner</h4>
                        <p className="text-[11px] text-slate-500">Klien: Cindy Clarissa · Deadline: Besok 18.00 · Brief & Foto Lengkap</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 self-end sm:self-auto">
                      <div className="text-right">
                        <div className="font-extrabold text-xs text-slate-900">Rp 85.000</div>
                        <div className="text-[10px] text-emerald-600 font-semibold">Escrow Xendit Terkunci</div>
                      </div>
                      <Link 
                        href="/order/order-room-101"
                        className="text-xs font-bold px-3 py-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition"
                      >
                        Buka Room Chat
                      </Link>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-100 bg-[#F8FAFF] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">
                        #JS-02
                      </div>
                      <div>
                        <h4 className="font-bold text-xs sm:text-sm text-slate-900">Pembuatan Landing Page Produk Skin Care</h4>
                        <p className="text-[11px] text-slate-500">Klien: PT Kosmetik Sejahtera · Milestone Selesai · Menunggu Review</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 self-end sm:self-auto">
                      <div className="text-right">
                        <div className="font-extrabold text-xs text-slate-900">Rp 200.000</div>
                        <div className="text-[10px] text-emerald-600 font-semibold">Escrow Xendit Terkunci</div>
                      </div>
                      <Link 
                        href="/order/order-room-101"
                        className="text-xs font-bold px-3 py-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition"
                      >
                        Buka Room Chat
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* VIEW 2: SERVICES (MANAJEMEN PAKET JASA) */}
          {activeMenu === "services" && (
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-base text-slate-900">Daftar Paket Jasa Saya</h3>
                  <p className="text-xs text-slate-500">Kelola etalase jasa, tarif mulai dari, dan deskripsi layanan Anda</p>
                </div>
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition shadow-2xs"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Tambah Paket Baru</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {services.map((srv) => (
                  <div
                    key={srv.id}
                    className="p-5 rounded-2xl border border-slate-200/90 bg-white hover:border-indigo-300 transition-all shadow-2xs flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <span className="text-[10px] font-bold px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-lg">
                          {srv.category}
                        </span>
                        <div className="flex items-center gap-1 text-xs text-amber-500 font-bold">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          <span>{srv.rating || 5.0}</span>
                        </div>
                      </div>

                      <h4 className="font-bold text-sm text-slate-900 mb-1.5">{srv.title}</h4>
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-4">
                        {srv.description || "Layanan profesional berkualitas dengan garansi revisi."}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase">Mulai dari</span>
                        <span className="font-extrabold text-sm text-indigo-600">
                          {formatIDR(srv.startingPrice || srv.priceStartFrom || 50000)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => deleteService(srv.id)}
                          className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 transition border border-slate-100"
                          title="Hapus Layanan"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <Link
                          href={`/jasa/${srv.id}`}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold inline-flex items-center gap-1 transition"
                        >
                          <span>Lihat Etalase</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* VIEW 3: ORDERS (DAFTAR PESANAN KLIEN) */}
          {activeMenu === "orders" && (
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-base text-slate-900">Pesanan Klien Masuk</h3>
                  <p className="text-xs text-slate-500">Semua pesanan jasa, status pengerjaan, dan pencairan pembayaran</p>
                </div>
                <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full">
                  2 Pesanan Aktif
                </span>
              </div>

              <div className="space-y-3 pt-2">
                <div className="p-4 rounded-xl border border-slate-200 bg-[#F8FAFF] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-xs shrink-0">
                      JS-01
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">Cindy Clarissa</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-bold">
                          Sedang Dikerjakan
                        </span>
                      </div>
                      <h4 className="font-bold text-sm text-slate-900 mt-0.5">Desain 6 Feed Instagram UMKM Kuliner</h4>
                      <p className="text-xs text-slate-500 mt-0.5">Batas Pengiriman: Besok 18.00 WIB · 1x Revisi Termasuk</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between w-full md:w-auto gap-4">
                    <div className="text-left md:text-right">
                      <div className="text-xs font-black text-slate-900">{formatIDR(85000)}</div>
                      <div className="text-[10px] text-emerald-600 font-semibold">Escrow Terkunci Aman</div>
                    </div>
                    <Link
                      href="/order/order-room-101"
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition shadow-2xs inline-flex items-center gap-1.5"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Chat & Kirim File</span>
                    </Link>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-[#F8FAFF] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-xs shrink-0">
                      JS-02
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">PT Kosmetik Sejahtera</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 font-bold">
                          Menunggu Konfirmasi Selesai
                        </span>
                      </div>
                      <h4 className="font-bold text-sm text-slate-900 mt-0.5">Pembuatan Landing Page Produk Skin Care</h4>
                      <p className="text-xs text-slate-500 mt-0.5">Draft Final telah dikirim · Auto-release dalam 24 jam</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between w-full md:w-auto gap-4">
                    <div className="text-left md:text-right">
                      <div className="text-xs font-black text-slate-900">{formatIDR(200000)}</div>
                      <div className="text-[10px] text-emerald-600 font-semibold">Escrow Siap Cair</div>
                    </div>
                    <Link
                      href="/order/order-room-101"
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition shadow-2xs inline-flex items-center gap-1.5"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Lihat Ruang Order</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 4: WALLET & PENARIKAN ESCROW */}
          {activeMenu === "wallet" && (
            <div className="space-y-6">
              {/* Wallet Summary Card */}
              <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden border border-slate-800">
                <div className="absolute right-0 top-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div>
                    <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider block mb-1">
                      Saldo Dompet Penyedia Jasa
                    </span>
                    <div className="text-3xl sm:text-4xl font-black tracking-tight text-white mb-2">
                      {formatIDR(walletBalance)}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-300">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>Terproteksi Rekening Escrow Xendit & Bebas Biaya Parkir Saldo</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      onClick={() => {
                        setIsTopUpModalOpen(true);
                        setIsProcessingTopUp(false);
                        setIsTopUpSuccess(false);
                      }}
                      className="px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm shadow-lg transition active:scale-95 flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4 stroke-[3]" />
                      <span>Isi Saldo (Top Up)</span>
                    </button>

                    <button
                      onClick={() => setIsWithdrawModalOpen(true)}
                      className="px-6 py-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs sm:text-sm font-bold shadow-lg transition active:scale-95 flex items-center justify-center gap-2"
                    >
                      <ArrowUpRight className="w-4 h-4" />
                      <span>Tarik Saldo ke Rekening</span>
                    </button>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-white/10 grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <div className="text-slate-400">Sedang Ditahan di Escrow (Projek Aktif)</div>
                    <div className="font-bold text-white text-sm mt-0.5">{formatIDR(pendingEscrowBalance)}</div>
                  </div>
                  <div>
                    <div className="text-slate-400">Total Pernah Ditarik</div>
                    <div className="font-bold text-white text-sm mt-0.5">
                      {formatIDR(withdrawals.reduce((acc, curr) => acc + curr.amount, 0))}
                    </div>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <div className="text-slate-400">Metode Penarikan Utama</div>
                    <div className="font-bold text-white text-sm mt-0.5">BCA · 8820192841</div>
                  </div>
                </div>
              </div>

              {/* Withdrawals History Table */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-base text-slate-900">Riwayat Penarikan Dana (Xendit Payouts)</h3>
                  <span className="text-xs text-slate-500">Pencairan real-time 24 jam</span>
                </div>

                <div className="divide-y divide-slate-100">
                  {withdrawals.map((wd) => (
                    <div key={wd.id} className="py-3.5 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs shrink-0">
                          <Check className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900">
                            Transfer ke {wd.bankName} ({wd.accountNumber})
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {formatDateIndo(wd.createdAt)} · Ref: {wd.xenditDisbursementId}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-xs font-extrabold text-slate-900">
                          -{formatIDR(wd.amount)}
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                          Berhasil Cair
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* VIEW 5: PROFILE & SKILLS */}
          {activeMenu === "profile" && (
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs space-y-6">
              <div>
                <h3 className="font-bold text-base text-slate-900">Keahlian & Profil Publik</h3>
                <p className="text-xs text-slate-500">Informasi ini akan ditampilkan kepada klien yang mencari jasa Anda</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tag Keahlian Utama</label>
                  <div className="flex flex-wrap gap-2">
                    {providerSettings.skills.map((skill) => (
                      <span key={skill} className="px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{skill}</span>
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Bio Singkat Portofolio</label>
                  <textarea
                    rows={3}
                    defaultValue="Desainer Grafis & Web Developer berpengalaman 4+ tahun. Siap mengerjakan branding, UI/UX, feed sosial media, dan website kilat."
                    className="w-full p-3 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => addToast("Profil Disimpan", "Informasi keahlian berhasil diperbarui.")}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-2xs transition"
                  >
                    Simpan Perubahan Profil
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 6: SETTINGS (TARIF & KETERSEDIAAN) */}
          {activeMenu === "settings" && (
            <form onSubmit={handleSaveSettings} className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs space-y-6">
              <div>
                <h3 className="font-bold text-base text-slate-900">Pengaturan Tarif & Ketersediaan</h3>
                <p className="text-xs text-slate-500">Atur batasan order, SLA waktu respon, dan preferensi penerimaan kerja</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <div>
                    <div className="text-xs font-bold text-slate-900">Status Menerima Order Baru</div>
                    <div className="text-[11px] text-slate-500">Tampilkan profil Anda di pencarian explore jasa publik</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settingsForm.isAcceptingOrders}
                    onChange={(e) => setSettingsForm({ ...settingsForm, isAcceptingOrders: e.target.checked })}
                    className="w-5 h-5 accent-indigo-600 rounded cursor-pointer"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Tarif Minimum Penerimaan Order (Rp)</label>
                    <input
                      type="number"
                      value={settingsForm.minRate}
                      onChange={(e) => setSettingsForm({ ...settingsForm, minRate: Number(e.target.value) })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Batas Maksimal Order Aktif Bersamaan</label>
                    <input
                      type="number"
                      value={settingsForm.maxActiveOrders}
                      onChange={(e) => setSettingsForm({ ...settingsForm, maxActiveOrders: Number(e.target.value) })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Target Respon Chat Klien (Menit)</label>
                    <input
                      type="number"
                      value={settingsForm.slaResponseMinutes}
                      onChange={(e) => setSettingsForm({ ...settingsForm, slaResponseMinutes: Number(e.target.value) })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Batas Gratis Revisi per Order</label>
                    <input
                      type="number"
                      value={settingsForm.revisionLimit}
                      onChange={(e) => setSettingsForm({ ...settingsForm, revisionLimit: Number(e.target.value) })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="pt-3">
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-2xs transition"
                  >
                    Simpan Pengaturan
                  </button>
                </div>
              </div>
            </form>
          )}

        </div>

      </main>

      {/* MODAL 1: TAMBAH LAYANAN BARU */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-sm font-extrabold text-slate-900">Tambah Paket Layanan Baru</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateService} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Judul Layanan / Paket</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Jasa Desain Kemasan Produk UMKM"
                  value={newServiceForm.title}
                  onChange={(e) => setNewServiceForm({ ...newServiceForm, title: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kategori</label>
                  <select
                    value={newServiceForm.category}
                    onChange={(e) => setNewServiceForm({ ...newServiceForm, category: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Desain Grafis">Desain Grafis</option>
                    <option value="Fotografi & Liputan">Fotografi & Liputan</option>
                    <option value="Web & IT Development">Web & IT</option>
                    <option value="Penerjemah & Copywriting">Penerjemah & Copy</option>
                    <option value="Servis Komputer">Servis Komputer</option>
                    <option value="Print & Fotokopi">Print & Fotokopi</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tarif Mulai Dari (Rp)</label>
                  <input
                    type="number"
                    required
                    placeholder="Contoh: 150000"
                    value={newServiceForm.startingPrice}
                    onChange={(e) => setNewServiceForm({ ...newServiceForm, startingPrice: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Deskripsi Layanan & Garansi</label>
                <textarea
                  rows={3}
                  placeholder="Jelaskan apa yang didapatkan klien, format file, dan batas revisi..."
                  value={newServiceForm.description}
                  onChange={(e) => setNewServiceForm({ ...newServiceForm, description: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-2xs transition"
                >
                  Publikasikan Paket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: TARIK SALDO (WITHDRAWAL MODAL) */}
      {isWithdrawModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Tarik Saldo ke Rekening / E-Wallet</h3>
                <p className="text-[11px] text-slate-500">Pencairan instan otomatis via Xendit Disbursement API</p>
              </div>
              <button onClick={() => setIsWithdrawModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleWithdrawSubmit} className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex items-center justify-between">
                <span className="text-xs text-indigo-900 font-medium">Saldo Tersedia:</span>
                <span className="text-sm font-extrabold text-indigo-700">{formatIDR(walletBalance)}</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nominal Penarikan (Rp)</label>
                <input
                  type="number"
                  required
                  min={20000}
                  max={walletBalance}
                  value={withdrawForm.amount}
                  onChange={(e) => setWithdrawForm({ ...withdrawForm, amount: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-bold focus:outline-none focus:border-indigo-500"
                />
                <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                  <span>Minimal Rp20.000</span>
                  <button
                    type="button"
                    onClick={() => setWithdrawForm({ ...withdrawForm, amount: walletBalance.toString() })}
                    className="text-indigo-600 font-bold hover:underline"
                  >
                    Tarik Semua
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Bank / E-Wallet</label>
                  <select
                    value={withdrawForm.bankName}
                    onChange={(e) => setWithdrawForm({ ...withdrawForm, bankName: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-indigo-500"
                  >
                    <option value="BCA">BCA</option>
                    <option value="Mandiri">Bank Mandiri</option>
                    <option value="BRI">BRI</option>
                    <option value="BNI">BNI</option>
                    <option value="DANA">DANA</option>
                    <option value="GoPay">GoPay</option>
                    <option value="OVO">OVO</option>
                    <option value="ShopeePay">ShopeePay</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nomor Rekening / HP</label>
                  <input
                    type="text"
                    required
                    value={withdrawForm.accountNumber}
                    onChange={(e) => setWithdrawForm({ ...withdrawForm, accountNumber: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Pemilik Rekening</label>
                <input
                  type="text"
                  required
                  value={withdrawForm.accountHolder}
                  onChange={(e) => setWithdrawForm({ ...withdrawForm, accountHolder: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-600 space-y-1">
                <div className="flex justify-between">
                  <span>Biaya Admin Transfer:</span>
                  <span className="font-semibold text-slate-900">Rp2.500</span>
                </div>
                <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-slate-200">
                  <span>Total yang Diterima:</span>
                  <span className="text-emerald-600">
                    {formatIDR(Math.max(0, (Number(withdrawForm.amount) || 0) - 2500))}
                  </span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsWithdrawModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-2xs transition"
                >
                  Konfirmasi & Tarik Sekarang
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: ISI ULANG SALDO (TOP UP) DARI PORTAL JASA */}
      {isTopUpModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-sm font-black text-slate-900">Isi Ulang Saldo Dompet Bantuin</h3>
                <p className="text-[11px] text-slate-500">Top-up saldo cepat via QRIS atau Virtual Account</p>
              </div>
              {!isProcessingTopUp && (
                <button onClick={() => setIsTopUpModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {isProcessingTopUp ? (
              <div className="py-10 text-center space-y-3">
                <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mx-auto" />
                <h4 className="font-bold text-sm text-slate-900">Memproses Top Up Saldo...</h4>
                <p className="text-xs text-slate-500">Menghubungkan ke gateway pembayaran Xendit...</p>
              </div>
            ) : isTopUpSuccess ? (
              <div className="py-8 text-center space-y-3">
                <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                  <Check className="w-7 h-7 stroke-[3]" />
                </div>
                <h4 className="font-black text-base text-slate-900">Top Up Saldo Berhasil!</h4>
                <p className="text-xs text-slate-600">
                  Saldo Anda bertambah sebesar <strong>{formatIDR(Number(topUpForm.amount))}</strong>.
                </p>
                <button
                  type="button"
                  onClick={() => setIsTopUpModalOpen(false)}
                  className="mt-3 px-6 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-xs"
                >
                  Selesai
                </button>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setIsProcessingTopUp(true);
                  setTimeout(() => {
                    topUpFunds({
                      amount: topUpForm.amount,
                      paymentMethod: topUpForm.paymentMethod,
                    });
                    setIsProcessingTopUp(false);
                    setIsTopUpSuccess(true);
                  }, 1200);
                }}
                className="space-y-4"
              >
                {/* Nominal Selection Presets */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">Pilih Nominal Isi Ulang:</label>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    {["25000", "50000", "100000", "200000", "500000", "1000000"].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setTopUpForm({ ...topUpForm, amount: preset })}
                        className={`p-2 rounded-xl border text-center font-bold transition ${
                          topUpForm.amount === preset
                            ? "bg-indigo-50 border-indigo-600 text-indigo-700 shadow-2xs"
                            : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        {formatIDR(Number(preset))}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nominal Lain (Rp):</label>
                  <input
                    type="number"
                    required
                    min={10000}
                    value={topUpForm.amount}
                    onChange={(e) => setTopUpForm({ ...topUpForm, amount: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-bold focus:outline-none focus:border-indigo-600"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Minimal top up Rp10.000</span>
                </div>

                {/* Payment Method Selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">Metode Pembayaran:</label>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setTopUpForm({ ...topUpForm, paymentMethod: "qris" })}
                      className={`p-2.5 rounded-xl border text-left font-semibold transition flex items-center gap-2 ${
                        topUpForm.paymentMethod === "qris"
                          ? "bg-indigo-50 border-indigo-600 text-indigo-700"
                          : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <QrCode className="w-4 h-4 text-indigo-600" />
                      <span>QRIS (E-Wallet)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setTopUpForm({ ...topUpForm, paymentMethod: "bca_va" })}
                      className={`p-2.5 rounded-xl border text-left font-semibold transition flex items-center gap-2 ${
                        topUpForm.paymentMethod === "bca_va"
                          ? "bg-indigo-50 border-indigo-600 text-indigo-700"
                          : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <Building2 className="w-4 h-4 text-indigo-600" />
                      <span>BCA VA</span>
                    </button>
                  </div>
                </div>

                {/* Total Summary */}
                <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs">
                  <span className="text-emerald-900 font-medium">Total Top Up:</span>
                  <span className="text-sm font-black text-emerald-800">{formatIDR(Number(topUpForm.amount) || 0)}</span>
                </div>

                {/* Action Buttons */}
                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsTopUpModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs shadow-sm transition active:scale-95 flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                    <span>Bayar & Tambah Saldo</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* FOOTER OR CLOSING */}
    </div>
  );
}
