"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import logoImg from "@/components/image/logo.png";
import { useApp } from "@/lib/context/AppContext";
import { formatIDR, formatDateIndo } from "@/lib/utils";
import { 
  getProviderById, 
  getAllProviders, 
  saveProviderData 
} from "@/lib/mock/providersData";
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
  Layers,
  Image as ImageIcon,
  UserCheck,
  Package,
  Clock,
  MapPin,
  Sparkles,
  ChevronRight,
  Edit3,
  Upload,
  Camera,
  Award,
  Loader2
} from "lucide-react";

export default function JasaDashboardPage() {
  const { 
    currentUser, 
    mitraAvailableBalance, 
    mitraPendingBalance, 
    mitraTotalEarned,
    withdrawals, 
    withdrawFunds,
    providerSettings,
    updateProviderSettings,
    addToast
  } = useApp();

  // Active provider initialized from primary verified mock provider
  const [provider, setProvider] = useState(() => {
    return getProviderById("fajar-ramadhan-desain") || getAllProviders()[0];
  });

  // Sync with storage on mount or custom event
  useEffect(() => {
    const handleStorageUpdate = () => {
      const updated = getProviderById("fajar-ramadhan-desain");
      if (updated) setProvider(updated);
    };
    window.addEventListener("bantuin_provider_updated", handleStorageUpdate);
    return () => window.removeEventListener("bantuin_provider_updated", handleStorageUpdate);
  }, []);

  // Save changes to provider state and localStorage
  const handleUpdateProvider = (updatedProvider, successMessage = "Data penyedia jasa berhasil diperbarui.") => {
    setProvider(updatedProvider);
    saveProviderData(updatedProvider);
    if (addToast) {
      addToast("Perubahan Disimpan", successMessage);
    }
  };

  const [activeMenu, setActiveMenu] = useState("overview"); 
  // Menu IDs: overview, catalog, packages, portfolio, orders, wallet, profile, reviews, settings

  // -------------------------------------------------------------
  // LOCAL PHOTO UPLOAD HANDLERS (FOTO DARI LOKAL)
  // -------------------------------------------------------------
  const handleAvatarUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const localUrl = URL.createObjectURL(file);
      const updated = { ...provider, avatar: localUrl };
      handleUpdateProvider(updated, "Foto profil berhasil diperbarui dari file lokal.");
    }
  };

  const handleBannerUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const localUrl = URL.createObjectURL(file);
      const updated = { ...provider, coverBanner: localUrl };
      handleUpdateProvider(updated, "Foto banner sampul berhasil diperbarui dari file lokal.");
    }
  };

  // -------------------------------------------------------------
  // MODAL STATES
  // -------------------------------------------------------------
  // 1. Modal: Tambah/Edit Katalog Jasa
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);
  const [editingCatalogItem, setEditingCatalogItem] = useState(null);
  const [catalogForm, setCatalogForm] = useState({
    title: "",
    category: "Logo",
    price: 75000,
    unit: "/ desain",
    image: "https://images.unsplash.com/photo-1626785774573-4b799315345d?auto=format&fit=crop&w=600&q=80",
    desc: "",
  });

  const handleCatalogPhotoFile = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const localUrl = URL.createObjectURL(file);
      setCatalogForm({ ...catalogForm, image: localUrl });
    }
  };

  // 2. Modal: Tambah Paket Bundling
  const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);
  const [packageForm, setPackageForm] = useState({
    name: "",
    tier: "Paket Hemat",
    price: 100000,
    duration: "1 - 2 Hari",
    description: "",
    featuresStr: "2 Konsep Desain Pilihan\nFile PNG Transparan & JPEG\nRevisi 2 Kali\nPengerjaan Cepat",
    isPopular: false,
  });

  // 3. Modal: Tambah Foto Portofolio
  const [isPortfolioModalOpen, setIsPortfolioModalOpen] = useState(false);
  const [portfolioForm, setPortfolioForm] = useState({
    title: "",
    category: "Branding",
    url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80",
    description: "",
  });

  const handlePortfolioPhotoFile = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const localUrl = URL.createObjectURL(file);
      setPortfolioForm({ ...portfolioForm, url: localUrl });
    }
  };

  // 4. Modal: Tarik Saldo
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [withdrawForm, setWithdrawForm] = useState({
    amount: "200000",
    bankName: "BCA",
    accountNumber: "8820192841",
    accountHolder: provider?.name || currentUser?.fullName || "Fajar Ramadhan",
  });

  // 5. Settings Form State
  const [settingsForm, setSettingsForm] = useState(providerSettings);

  // 6. Profile Edit State
  const [profileForm, setProfileForm] = useState({
    name: provider.name,
    brandTitle: provider.brandTitle,
    bio: provider.bio,
    location: provider.location,
    address: provider.address,
    skillsStr: provider.skills?.join(", ") || "",
  });

  const sidebarLinks = [
    { id: "overview", label: "Ringkasan Jasa", icon: LayoutDashboard },
    { id: "catalog", label: "Katalog Layanan", icon: Layers, count: provider.catalog?.length || 0 },
    { id: "packages", label: "Paket Bundling", icon: Package, count: provider.packages?.length || 0 },
    { id: "portfolio", label: "Portofolio & Foto", icon: ImageIcon, count: provider.portfolioPhotos?.length || 0 },
    { id: "orders", label: "Pesanan Klien", icon: Receipt, count: 2 },
    { id: "wallet", label: "Dompet & Penarikan", icon: Wallet },
    { id: "profile", label: "Keahlian & Profil", icon: UserCheck },
    { id: "reviews", label: "Ulasan Pelanggan", icon: Star, count: provider.reviews?.length || 0 },
    { id: "settings", label: "Tarif & Ketersediaan", icon: Settings },
  ];

  // -------------------------------------------------------------
  // HANDLERS: KATALOG JASA
  // -------------------------------------------------------------
  const handleOpenAddCatalog = () => {
    setEditingCatalogItem(null);
    setCatalogForm({
      title: "",
      category: "Logo",
      price: 75000,
      unit: "/ desain",
      image: "https://images.unsplash.com/photo-1626785774573-4b799315345d?auto=format&fit=crop&w=600&q=80",
      desc: "Layanan pengerjaan profesional berkualitas tinggi dengan garansi kepuasan.",
    });
    setIsCatalogModalOpen(true);
  };

  const handleOpenEditCatalog = (item) => {
    setEditingCatalogItem(item);
    setCatalogForm({
      title: item.title,
      category: item.category,
      price: item.price,
      unit: item.unit || "/ pekerjaan",
      image: item.image,
      desc: item.desc || "",
    });
    setIsCatalogModalOpen(true);
  };

  const handleSaveCatalog = (e) => {
    e.preventDefault();
    if (!catalogForm.title || !catalogForm.price) {
      addToast?.("Form Belum Lengkap", "Silakan isi judul dan tarif layanan.", "error");
      return;
    }

    let updatedCatalog;
    if (editingCatalogItem) {
      updatedCatalog = provider.catalog.map((c) =>
        c.id === editingCatalogItem.id
          ? {
              ...c,
              title: catalogForm.title,
              category: catalogForm.category,
              price: Number(catalogForm.price),
              unit: catalogForm.unit,
              image: catalogForm.image,
              desc: catalogForm.desc,
            }
          : c
      );
    } else {
      const newItem = {
        id: `cat-${Date.now()}`,
        title: catalogForm.title,
        category: catalogForm.category,
        price: Number(catalogForm.price),
        unit: catalogForm.unit,
        image: catalogForm.image,
        desc: catalogForm.desc,
      };
      updatedCatalog = [newItem, ...(provider.catalog || [])];
    }

    handleUpdateProvider(
      { ...provider, catalog: updatedCatalog },
      editingCatalogItem ? "Layanan katalog berhasil diperbarui." : "Layanan baru berhasil ditambahkan ke katalog."
    );
    setIsCatalogModalOpen(false);
  };

  const handleDeleteCatalog = (id) => {
    const updated = provider.catalog.filter((c) => c.id !== id);
    handleUpdateProvider({ ...provider, catalog: updated }, "Layanan katalog berhasil dihapus.");
  };

  // -------------------------------------------------------------
  // HANDLERS: PAKET BUNDLING
  // -------------------------------------------------------------
  const handleSavePackage = (e) => {
    e.preventDefault();
    if (!packageForm.name || !packageForm.price) {
      addToast?.("Form Belum Lengkap", "Silakan lengkapi nama dan harga paket.", "error");
      return;
    }

    const features = packageForm.featuresStr
      .split("\n")
      .map((f) => f.trim())
      .filter(Boolean);

    const newPkg = {
      id: `pkg-${Date.now()}`,
      name: packageForm.name,
      tier: packageForm.tier,
      price: Number(packageForm.price),
      duration: packageForm.duration,
      description: packageForm.description || "Paket pengerjaan lengkap dengan revisi terjamin.",
      features,
      isPopular: packageForm.isPopular,
    };

    const updatedPackages = [...(provider.packages || []), newPkg];
    handleUpdateProvider({ ...provider, packages: updatedPackages }, "Paket bundling baru berhasil disimpan.");
    setIsPackageModalOpen(false);
  };

  const handleDeletePackage = (id) => {
    const updated = provider.packages.filter((p) => p.id !== id);
    handleUpdateProvider({ ...provider, packages: updated }, "Paket bundling berhasil dihapus.");
  };

  // -------------------------------------------------------------
  // HANDLERS: FOTO PORTOFOLIO
  // -------------------------------------------------------------
  const handleSavePortfolio = (e) => {
    e.preventDefault();
    if (!portfolioForm.title || !portfolioForm.url) {
      addToast?.("Form Belum Lengkap", "Silakan isi judul dan foto portofolio.", "error");
      return;
    }

    const newPhoto = {
      url: portfolioForm.url,
      title: portfolioForm.title,
      description: portfolioForm.description || "Dokumentasi hasil karya untuk klien Bantuin.",
      category: portfolioForm.category,
    };

    const updatedPhotos = [newPhoto, ...(provider.portfolioPhotos || [])];
    handleUpdateProvider({ ...provider, portfolioPhotos: updatedPhotos }, "Foto hasil karya berhasil ditambahkan.");
    setIsPortfolioModalOpen(false);
  };

  const handleDeletePortfolio = (idx) => {
    const updated = provider.portfolioPhotos.filter((_, i) => i !== idx);
    handleUpdateProvider({ ...provider, portfolioPhotos: updated }, "Foto portofolio berhasil dihapus.");
  };

  // -------------------------------------------------------------
  // HANDLERS: PROFILE
  // -------------------------------------------------------------
  const handleSaveProfile = (e) => {
    e.preventDefault();
    const skills = profileForm.skillsStr
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const updated = {
      ...provider,
      name: profileForm.name,
      brandTitle: profileForm.brandTitle,
      bio: profileForm.bio,
      location: profileForm.location,
      address: profileForm.address,
      skills,
    };

    handleUpdateProvider(updated, "Profil penyedia jasa berhasil diperbarui.");
  };

  // -------------------------------------------------------------
  // HANDLERS: PENARIKAN & SETTINGS
  // -------------------------------------------------------------
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
    addToast?.("Pengaturan Disimpan", "Preferensi tarif dan order berhasil diperbarui.");
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#F4F7FB]">
      
      {/* 1. MOBILE TOP HEADER (Sticky on small screens) */}
      <div className="lg:hidden sticky top-0 z-40 bg-white border-b border-slate-200/90 shadow-2xs">
        <div className="px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src={logoImg}
              alt="Bantuin"
              height={32}
              className="h-7 w-auto object-contain mix-blend-multiply"
            />
          </Link>

          <div className="flex items-center gap-2">
            <Link
              href={`/jasa/penyedia/${provider.id}`}
              className="text-[11px] font-bold px-2.5 py-1.5 rounded-lg bg-blue-50 text-[#1683FF] hover:bg-blue-100 transition flex items-center gap-1"
            >
              <span>Profil Publik</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Horizontal Navigation Pills */}
        <div className="flex items-center gap-1.5 px-3 py-2 overflow-x-auto no-scrollbar border-t border-slate-100 bg-[#F8FAFC]">
          {sidebarLinks.map((link) => {
            const Icon = link.icon;
            const isActive = activeMenu === link.id;
            return (
              <button
                key={link.id}
                onClick={() => setActiveMenu(link.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer shrink-0 ${
                  isActive
                    ? "bg-[#1683FF] text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 bg-white border border-slate-200/80"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{link.label}</span>
                {link.count !== undefined && link.count > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isActive ? "bg-white/20 text-white" : "bg-blue-50 text-[#1683FF]"
                  }`}>
                    {link.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. DESKTOP SIDEBAR (Pure Biru & Putih) */}
      <aside className="hidden lg:flex w-72 bg-white border-r border-slate-200/90 flex-col justify-between p-5 sticky top-0 h-screen overflow-y-auto shrink-0 z-20">
        <div>
          {/* Logo & Brand */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src={logoImg}
                alt="Bantuin"
                height={34}
                className="h-8 w-auto object-contain mix-blend-multiply"
              />
            </Link>
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-blue-50 text-[#1683FF] border border-blue-100">
              Jasa Pro
            </span>
          </div>

          {/* Provider Card Profile in Sidebar */}
          <div className="p-3.5 rounded-2xl bg-blue-50/50 border border-blue-100/80 mb-5 flex items-center gap-3 relative group">
            <div className="relative shrink-0">
              <img
                src={provider.avatar}
                alt={provider.name}
                className="w-11 h-11 rounded-xl object-cover border border-slate-200 shadow-2xs"
              />
              <label 
                className="absolute inset-0 rounded-xl bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer"
                title="Ganti Foto Profil dari File Lokal"
              >
                <Camera className="w-4 h-4" />
                <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
              </label>
            </div>

            <div className="min-w-0 flex-1">
              <div className="font-black text-xs text-slate-900 truncate">
                {provider.name}
              </div>
              <div className="text-[10px] text-slate-500 truncate mt-0.5">
                {provider.brandTitle}
              </div>
              <div className="flex items-center gap-1 text-[10px] text-amber-500 font-bold mt-0.5">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                <span>{provider.rating} ({provider.reviewsCount} ulasan)</span>
              </div>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="space-y-1">
            {sidebarLinks.map((link) => {
              const Icon = link.icon;
              const isActive = activeMenu === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => setActiveMenu(link.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    isActive
                      ? "bg-[#1683FF] text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4" />
                    <span>{link.label}</span>
                  </div>
                  {link.count !== undefined && link.count > 0 && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      isActive ? "bg-white/20 text-white" : "bg-blue-50 text-[#1683FF]"
                    }`}>
                      {link.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom CTA / Public Profile Link */}
        <div className="pt-4 border-t border-slate-100 space-y-2">
          <Link
            href={`/jasa/penyedia/${provider.id}`}
            target="_blank"
            className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#1683FF] text-xs font-bold transition"
          >
            <span>Lihat Profil Publik Saya</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
          <Link
            href="/"
            className="flex items-center justify-center gap-1.5 w-full py-2 rounded-xl text-slate-500 hover:text-slate-800 text-xs font-medium transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Beranda User</span>
          </Link>
        </div>
      </aside>

      {/* 3. MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col min-w-0">
        
        {/* Desktop Sticky Header */}
        <header className="hidden lg:flex sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-6 py-3.5 items-center justify-between gap-4">
          <div>
            <h1 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
              {activeMenu === "overview" && "Ringkasan Kinerja Jasa & Freelance"}
              {activeMenu === "catalog" && "Katalog Layanan Jasa (Sesuai Tampilan User)"}
              {activeMenu === "packages" && "Pilihan Paket Bundling & Borongan"}
              {activeMenu === "portfolio" && "Galeri Foto Portofolio & Hasil Karya"}
              {activeMenu === "orders" && "Daftar Pesanan & Brief Klien Masuk"}
              {activeMenu === "wallet" && "Dompet Saldo & Penarikan Escrow"}
              {activeMenu === "profile" && "Keahlian & Pengaturan Profil Publik"}
              {activeMenu === "reviews" && "Ulasan Pelanggan Terverifikasi"}
              {activeMenu === "settings" && "Pengaturan Tarif & Ketersediaan"}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleOpenAddCatalog}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white text-xs font-bold shadow-xs transition active:scale-95 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Tambah Layanan Baru</span>
            </button>
          </div>
        </header>

        {/* Content Body */}
        <div className="p-4 sm:p-6 md:p-8 space-y-6 max-w-[1240px] w-full">
          
          {/* ============================================================ */}
          {/* VIEW 1: OVERVIEW (RINGKASAN)                                  */}
          {/* ============================================================ */}
          {activeMenu === "overview" && (
            <>
              {/* Cover Banner & Identity Header (Sama Persis dengan Halaman Profil User) */}
              <div className="bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-xs">
                {/* Banner Sampul */}
                <div className="relative w-full h-40 sm:h-52 bg-slate-900 overflow-hidden group">
                  <img
                    src={provider.coverBanner}
                    alt={provider.name}
                    className="w-full h-full object-cover opacity-60 transition duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
                  
                  {/* Badge & Tombol Ganti Banner dari Lokal */}
                  <div className="absolute top-3 left-3 sm:top-4 sm:left-4">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/90 backdrop-blur-md text-slate-800 text-[11px] font-bold shadow-xs">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span>Outlet Aktif di Pencarian</span>
                    </span>
                  </div>

                  <label className="absolute top-3 right-3 sm:top-4 sm:right-4 px-3 py-1.5 rounded-xl bg-black/60 hover:bg-black/80 text-white text-[11px] font-bold backdrop-blur-md cursor-pointer transition flex items-center gap-1.5 shadow-xs">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Ganti Banner Sampul</span>
                    <input type="file" accept="image/*" onChange={handleBannerUpload} className="hidden" />
                  </label>
                </div>

                {/* Profile Card Header */}
                <div className="p-5 sm:p-6 -mt-12 sm:-mt-16 relative z-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                  <div className="flex items-end gap-3.5 sm:gap-4">
                    <div className="relative group shrink-0">
                      <img
                        src={provider.avatar}
                        alt={provider.name}
                        className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-4 border-white shadow-md bg-white"
                      />
                      <label 
                        className="absolute inset-0 rounded-2xl bg-black/60 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer text-[10px] font-bold"
                        title="Upload Foto Profil dari File Lokal"
                      >
                        <Camera className="w-4 h-4 mb-0.5" />
                        <span>Ganti Foto</span>
                        <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                      </label>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded-md bg-blue-50 text-[#1683FF] text-[10px] sm:text-[11px] font-extrabold uppercase border border-blue-100">
                          {provider.type === "helper" ? "Helper Terverifikasi" : "Penyedia Jasa Terverifikasi"}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] sm:text-[11px] font-bold border border-emerald-100 flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-emerald-600" />
                          <span>KTP Terverifikasi</span>
                        </span>
                      </div>

                      <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                        {provider.name}
                      </h2>

                      <p className="text-xs sm:text-sm font-semibold text-slate-600">
                        {provider.brandTitle} &middot; <span className="text-[#1683FF]">{provider.location}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/jasa/penyedia/${provider.id}`}
                      target="_blank"
                      className="px-4 py-2 bg-[#1683FF] hover:bg-[#0F6FE5] text-white text-xs font-bold rounded-xl shadow-xs transition inline-flex items-center gap-1.5"
                    >
                      <span>Buka Halaman Publik</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>

              {/* 4 Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-2xs">
                  <div className="text-xs text-slate-500 flex items-center gap-1.5 mb-1 font-medium">
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                    <span>Saldo Dapat Dicairkan</span>
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-slate-900">
                    {formatIDR(mitraAvailableBalance)}
                  </div>
                  <button 
                    onClick={() => setActiveMenu("wallet")}
                    className="text-[11px] text-[#1683FF] hover:underline mt-1 font-semibold block cursor-pointer"
                  >
                    Ajukan Penarikan →
                  </button>
                </div>

                <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs">
                  <div className="text-xs text-slate-500 flex items-center gap-1.5 mb-1 font-medium">
                    <Layers className="w-4 h-4 text-[#1683FF]" />
                    <span>Layanan Jasa Aktif</span>
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-slate-900">
                    {provider.catalog?.length || 0} Layanan
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">Tayang di etalase publik</div>
                </div>

                <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs">
                  <div className="text-xs text-slate-500 flex items-center gap-1.5 mb-1 font-medium">
                    <Receipt className="w-4 h-4 text-[#1683FF]" />
                    <span>Pesanan Selesai</span>
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-slate-900">
                    {provider.completedJobs || 72} Projek
                  </div>
                  <div className="text-[11px] text-emerald-600 mt-1 font-semibold">100% Kepuasan Klien</div>
                </div>

                <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs">
                  <div className="text-xs text-slate-500 flex items-center gap-1.5 mb-1 font-medium">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <span>Rating Jasa</span>
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-slate-900">
                    {provider.rating} / 5.0
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">Dari {provider.reviewsCount} ulasan klien</div>
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
                    className="text-xs font-bold text-[#1683FF] hover:underline"
                  >
                    Lihat Semua Pesanan →
                  </button>
                </div>

                <div className="space-y-3">
                  <div className="p-4 rounded-xl border border-slate-100 bg-[#F8FAFF] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-blue-100 text-[#1683FF] flex items-center justify-center font-bold text-xs shrink-0">
                        #JS-01
                      </div>
                      <div>
                        <h4 className="font-bold text-xs sm:text-sm text-slate-900">Desain Logo &amp; Identitas Brand</h4>
                        <p className="text-[11px] text-slate-500">Klien: Dimas Anggara &middot; Paket: Paket Brand Lengkap &middot; Status: Draft Dikirim</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 self-end sm:self-auto">
                      <div className="text-right">
                        <div className="font-extrabold text-xs text-slate-900">Rp 175.000</div>
                        <div className="text-[10px] text-emerald-600 font-semibold">Escrow Xendit Terkunci</div>
                      </div>
                      <Link 
                        href="/chat?room=order-room-102"
                        className="text-xs font-bold px-3 py-1.5 rounded-lg bg-[#1683FF] text-white hover:bg-[#0F6FE5] transition"
                      >
                        Buka Chat Order
                      </Link>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-100 bg-[#F8FAFF] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-blue-100 text-[#1683FF] flex items-center justify-center font-bold text-xs shrink-0">
                        #JS-02
                      </div>
                      <div>
                        <h4 className="font-bold text-xs sm:text-sm text-slate-900">Desain Kemasan &amp; Label Produk UMKM</h4>
                        <p className="text-[11px] text-slate-500">Klien: Siti Nurhaliza &middot; Sesi Pengerjaan Berlangsung &middot; Deadline Besok</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 self-end sm:self-auto">
                      <div className="text-right">
                        <div className="font-extrabold text-xs text-slate-900">Rp 120.000</div>
                        <div className="text-[10px] text-emerald-600 font-semibold">Escrow Siap Cair</div>
                      </div>
                      <Link 
                        href="/chat?room=order-room-102"
                        className="text-xs font-bold px-3 py-1.5 rounded-lg bg-slate-800 text-white hover:bg-slate-900 transition"
                      >
                        Buka Chat Order
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ============================================================ */}
          {/* VIEW 2: KATALOG LAYANAN JASA (SESUAI FITUR JASA DI USER)     */}
          {/* ============================================================ */}
          {activeMenu === "catalog" && (
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-base text-slate-900">Katalog Layanan Jasa Anda</h3>
                  <p className="text-xs text-slate-500">
                    Daftar layanan satuan yang ditampilkan persis pada profil publik dan fitur jasa yang dilihat pelanggan.
                  </p>
                </div>
                <button
                  onClick={handleOpenAddCatalog}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1683FF] text-white text-xs font-bold hover:bg-[#0F6FE5] transition shadow-2xs cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Tambah Layanan Baru</span>
                </button>
              </div>

              {/* Grid Katalog Layanan Jasa (Persis Foto & Harga di User) */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                {provider.catalog?.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-slate-200/90 bg-white overflow-hidden shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group"
                  >
                    <div>
                      {/* Foto Layanan */}
                      <div className="relative aspect-16/10 w-full bg-slate-100 overflow-hidden">
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute top-2.5 left-2.5">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase bg-black/60 text-white backdrop-blur-xs">
                            {item.category}
                          </span>
                        </div>
                      </div>

                      {/* Detail Layanan */}
                      <div className="p-4 space-y-1.5">
                        <h4 className="font-bold text-sm text-slate-900 group-hover:text-[#1683FF] transition line-clamp-1">
                          {item.title}
                        </h4>
                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                          {item.desc}
                        </p>
                      </div>
                    </div>

                    {/* Harga & Aksi */}
                    <div className="p-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase font-medium">Tarif:</span>
                        <div className="font-black text-sm text-[#1683FF]">
                          {formatIDR(item.price)}
                          <span className="text-[10px] text-slate-400 font-normal ml-0.5">{item.unit}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleOpenEditCatalog(item)}
                          className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-[#1683FF] transition border border-slate-100 cursor-pointer"
                          title="Edit Layanan"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteCatalog(item.id)}
                          className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 transition border border-slate-100 cursor-pointer"
                          title="Hapus Layanan"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <Link
                          href={`/jasa/${item.id}`}
                          target="_blank"
                          className="px-2.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#1683FF] text-xs font-bold inline-flex items-center gap-1 transition"
                          title="Buka Halaman Checkout Publik"
                        >
                          <span>Lihat</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* VIEW 3: PAKET BUNDLING & BORONGAN                            */}
          {/* ============================================================ */}
          {activeMenu === "packages" && (
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-base text-slate-900">Pilihan Paket Bundling &amp; Borongan</h3>
                  <p className="text-xs text-slate-500">
                    Paket lengkap yang otomatis terhubung ke setiap pesanan katalog jasa saat klien memilih paket.
                  </p>
                </div>
                <button
                  onClick={() => setIsPackageModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1683FF] text-white text-xs font-bold hover:bg-[#0F6FE5] transition shadow-2xs cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Tambah Paket Baru</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                {provider.packages?.map((pkg) => (
                  <div
                    key={pkg.id}
                    className={`rounded-2xl p-5 border flex flex-col justify-between relative transition-all ${
                      pkg.isPopular
                        ? "border-[#1683FF] bg-blue-50/30 shadow-xs ring-2 ring-[#1683FF]/10"
                        : "border-slate-200/90 bg-white shadow-2xs"
                    }`}
                  >
                    {pkg.isPopular && (
                      <div className="absolute -top-2.5 right-4 bg-[#1683FF] text-white text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full shadow-xs">
                        ⭐ Paling Diminati
                      </div>
                    )}

                    <div className="space-y-3">
                      <div>
                        <span className="text-[10px] font-extrabold uppercase text-slate-400 block mb-0.5">
                          {pkg.tier}
                        </span>
                        <h4 className="font-black text-base text-slate-900">{pkg.name}</h4>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">{pkg.description}</p>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="text-xl font-black text-[#1683FF]">{formatIDR(pkg.price)}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>Pengerjaan: <strong>{pkg.duration}</strong></span>
                        </div>
                      </div>

                      <div className="space-y-1.5 pt-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Fitur Termasuk:
                        </span>
                        {pkg.features?.map((feat, idx) => (
                          <div key={idx} className="flex items-start gap-1.5 text-xs text-slate-600">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                            <span className="line-clamp-1">{feat}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] text-slate-400 font-medium">Terhubung ke Checkout Jasa</span>
                      <button
                        onClick={() => handleDeletePackage(pkg.id)}
                        className="text-xs font-bold text-rose-600 hover:bg-rose-50 px-2.5 py-1 rounded-lg transition cursor-pointer"
                      >
                        Hapus Paket
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* VIEW 4: PORTOFOLIO & FOTO HASIL KARYA                        */}
          {/* ============================================================ */}
          {activeMenu === "portfolio" && (
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-base text-slate-900">Galeri Foto &amp; Hasil Karya Portofolio</h3>
                  <p className="text-xs text-slate-500">
                    Foto-foto portofolio ini tampil persis pada tab &quot;Foto Hasil Kerja&quot; di halaman profil publik Anda.
                  </p>
                </div>
                <button
                  onClick={() => setIsPortfolioModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1683FF] text-white text-xs font-bold hover:bg-[#0F6FE5] transition shadow-2xs cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Tambah Foto Portofolio</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                {provider.portfolioPhotos?.map((photo, idx) => (
                  <div
                    key={idx}
                    className="rounded-2xl border border-slate-200/90 bg-white overflow-hidden shadow-2xs group flex flex-col justify-between"
                  >
                    <div>
                      <div className="relative aspect-4/3 w-full bg-slate-100 overflow-hidden">
                        <img
                          src={photo.url}
                          alt={photo.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute top-2.5 left-2.5">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase bg-black/60 text-white backdrop-blur-xs">
                            {photo.category}
                          </span>
                        </div>
                      </div>

                      <div className="p-4 space-y-1">
                        <h4 className="font-bold text-sm text-slate-900">{photo.title}</h4>
                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                          {photo.description}
                        </p>
                      </div>
                    </div>

                    <div className="p-4 pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[10px] text-slate-400">Foto #{idx + 1}</span>
                      <button
                        onClick={() => handleDeletePortfolio(idx)}
                        className="text-xs font-bold text-rose-600 hover:bg-rose-50 px-2 py-1 rounded-lg transition cursor-pointer"
                      >
                        Hapus Foto
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* VIEW 5: ORDERS (PESANAN KLIEN MASUK)                         */}
          {/* ============================================================ */}
          {activeMenu === "orders" && (
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-base text-slate-900">Pesanan Klien Masuk</h3>
                  <p className="text-xs text-slate-500">Semua pesanan jasa, status pengerjaan, dan pencairan pembayaran</p>
                </div>
                <span className="text-xs font-bold text-[#1683FF] bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                  2 Pesanan Aktif
                </span>
              </div>

              <div className="space-y-3 pt-2">
                <div className="p-4 rounded-xl border border-slate-200 bg-[#F8FAFF] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-[#1683FF] text-white flex items-center justify-center font-black text-xs shrink-0">
                      JS-01
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">Dimas Anggara</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-bold">
                          Sedang Dikerjakan
                        </span>
                      </div>
                      <h4 className="font-bold text-sm text-slate-900 mt-0.5">Desain Logo &amp; Identitas Brand</h4>
                      <p className="text-xs text-slate-500 mt-0.5">Paket Brand Lengkap &middot; Batas Pengiriman: Besok 18.00 WIB &middot; 1x Revisi Termasuk</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between w-full md:w-auto gap-4">
                    <div className="text-left md:text-right">
                      <div className="text-xs font-black text-slate-900">{formatIDR(175000)}</div>
                      <div className="text-[10px] text-emerald-600 font-semibold">Escrow Terkunci Aman</div>
                    </div>
                    <Link
                      href="/chat?room=order-room-102"
                      className="px-4 py-2 bg-[#1683FF] hover:bg-[#0F6FE5] text-white text-xs font-bold rounded-xl transition shadow-2xs inline-flex items-center gap-1.5"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Chat &amp; Kirim File</span>
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
                        <span className="text-xs font-bold text-slate-900">Siti Nurhaliza</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 font-bold">
                          Menunggu Review Klien
                        </span>
                      </div>
                      <h4 className="font-bold text-sm text-slate-900 mt-0.5">Desain Kemasan &amp; Label Produk UMKM</h4>
                      <p className="text-xs text-slate-500 mt-0.5">Draft Final telah dikirim &middot; Auto-release dalam 24 jam</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between w-full md:w-auto gap-4">
                    <div className="text-left md:text-right">
                      <div className="text-xs font-black text-slate-900">{formatIDR(120000)}</div>
                      <div className="text-[10px] text-emerald-600 font-semibold">Escrow Siap Cair</div>
                    </div>
                    <Link
                      href="/chat?room=order-room-102"
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

          {/* ============================================================ */}
          {/* VIEW 6: WALLET & HAK PEMBAYARAN MITRA                        */}
          {/* ============================================================ */}
          {activeMenu === "wallet" && (
            <div className="space-y-6">
              {/* Wallet Summary Card */}
              <div className="bg-gradient-to-br from-slate-900 via-[#0C2D48] to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden border border-slate-800">
                <div className="absolute right-0 top-0 w-80 h-80 bg-[#1683FF]/15 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-blue-300 uppercase tracking-wider block">
                        Saldo Hak Pembayaran Jasa
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
                      <span>Hak bersih dari pekerjaan selesai &middot; Fee transfer admin ditanggung platform</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      onClick={() => setIsWithdrawModalOpen(true)}
                      className="px-6 py-3 rounded-2xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white text-xs sm:text-sm font-bold shadow-lg transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <ArrowUpRight className="w-4 h-4" />
                      <span>Ajukan Penarikan Dana</span>
                    </button>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-white/10 grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <div className="text-slate-400">Dana Tertahan (Projek Berjalan)</div>
                    <div className="font-bold text-amber-400 text-sm mt-0.5">{formatIDR(mitraPendingBalance)}</div>
                  </div>
                  <div>
                    <div className="text-slate-400">Total Akumulasi Pendapatan</div>
                    <div className="font-bold text-white text-sm mt-0.5">
                      {formatIDR(mitraTotalEarned)}
                    </div>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <div className="text-slate-400">Biaya Transfer Admin</div>
                    <div className="font-bold text-emerald-400 text-sm mt-0.5">Rp0 (Ditanggung Bantuin.id)</div>
                  </div>
                </div>
              </div>

              {/* Withdrawals History Table */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-base text-slate-900">Riwayat Penarikan Dana</h3>
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
                              Transfer ke {wd.bankName} ({wd.accountNumber})
                            </div>
                            <div className="text-[11px] text-slate-400">
                              {formatDateIndo(wd.requestedAt)} &middot; Atas Nama: {wd.accountHolder}
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-xs font-extrabold text-slate-900">
                            -{formatIDR(wd.amount)}
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isSuccess
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-amber-50 text-amber-700"
                          }`}>
                            {isSuccess ? "Berhasil Ditransfer" : "Menunggu Transfer Admin"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* VIEW 7: PROFILE & SKILLS (KEAHLIAN & PROFIL PUBLIK)          */}
          {/* ============================================================ */}
          {activeMenu === "profile" && (
            <div className="space-y-6">
              {/* Profile Visual Card with Local Uploads */}
              <div className="bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-xs">
                {/* Banner Sampul */}
                <div className="relative w-full h-36 sm:h-44 bg-slate-900 overflow-hidden group">
                  <img
                    src={provider.coverBanner}
                    alt={provider.name}
                    className="w-full h-full object-cover opacity-60"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent" />
                  <label className="absolute top-3 right-3 px-3 py-1.5 rounded-xl bg-black/60 hover:bg-black/80 text-white text-[11px] font-bold backdrop-blur-md cursor-pointer transition flex items-center gap-1.5 shadow-xs">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Banner Lokal</span>
                    <input type="file" accept="image/*" onChange={handleBannerUpload} className="hidden" />
                  </label>
                </div>

                <div className="p-5 sm:p-6 -mt-10 sm:-mt-12 relative z-10 flex items-center gap-4">
                  <div className="relative group shrink-0">
                    <img
                      src={provider.avatar}
                      alt={provider.name}
                      className="w-20 h-20 rounded-2xl object-cover border-4 border-white shadow-md bg-white"
                    />
                    <label 
                      className="absolute inset-0 rounded-2xl bg-black/60 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer text-[10px] font-bold"
                      title="Upload Avatar dari File Lokal"
                    >
                      <Camera className="w-4 h-4 mb-0.5" />
                      <span>Ganti Foto</span>
                      <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                    </label>
                  </div>

                  <div className="min-w-0">
                    <h3 className="font-black text-lg text-slate-900">{provider.name}</h3>
                    <p className="text-xs text-slate-500">{provider.brandTitle}</p>
                    <div className="text-[11px] text-[#1683FF] font-semibold mt-0.5 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      <span>{provider.location}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Editable Profile Form */}
              <form onSubmit={handleSaveProfile} className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs space-y-5">
                <div>
                  <h3 className="font-bold text-base text-slate-900">Edit Informasi Profil Publik</h3>
                  <p className="text-xs text-slate-500">
                    Perubahan di sini langsung terhubung dan mengubah data yang dilihat klien di halaman profil jasa Anda.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Nama Lengkap &amp; Gelar</label>
                      <input
                        type="text"
                        required
                        value={profileForm.name}
                        onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-[#1683FF]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Judul Brand / Spesialisasi</label>
                      <input
                        type="text"
                        required
                        value={profileForm.brandTitle}
                        onChange={(e) => setProfileForm({ ...profileForm, brandTitle: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-[#1683FF]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Wilayah Operasional</label>
                      <input
                        type="text"
                        required
                        value={profileForm.location}
                        onChange={(e) => setProfileForm({ ...profileForm, location: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-[#1683FF]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Alamat Lengkap Studio / Lokasi</label>
                      <input
                        type="text"
                        required
                        value={profileForm.address}
                        onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-[#1683FF]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Keahlian &amp; Software (Pisahkan dengan koma)</label>
                    <input
                      type="text"
                      required
                      value={profileForm.skillsStr}
                      onChange={(e) => setProfileForm({ ...profileForm, skillsStr: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-[#1683FF]"
                    />
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {profileForm.skillsStr.split(",").map((s) => s.trim()).filter(Boolean).map((skill, sIdx) => (
                        <span key={sIdx} className="px-2.5 py-1 rounded-lg bg-blue-50 text-[#1683FF] text-[11px] font-bold border border-blue-100 flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          <span>{skill}</span>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Bio Lengkap Profil</label>
                    <textarea
                      rows={3}
                      value={profileForm.bio}
                      onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                      className="w-full p-3 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-[#1683FF]"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="px-6 py-2.5 rounded-xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white text-xs font-bold shadow-2xs transition cursor-pointer"
                    >
                      Simpan Perubahan Profil Publik
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* ============================================================ */}
          {/* VIEW 8: REVIEWS (ULASAN PELANGGAN TERVERIFIKASI)             */}
          {/* ============================================================ */}
          {activeMenu === "reviews" && (
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-base text-slate-900">Ulasan Pelanggan Terverifikasi</h3>
                  <p className="text-xs text-slate-500">
                    Testimoni dari klien yang telah memesan dan menyelesaikan transaksi jasa dengan Anda.
                  </p>
                </div>
                <div className="flex items-center gap-1.5 bg-amber-50 px-3 py-1 rounded-xl border border-amber-200">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span className="text-xs font-black text-amber-800">{provider.rating} / 5.0</span>
                </div>
              </div>

              <div className="space-y-3.5 pt-2">
                {provider.reviews?.map((rev) => (
                  <div key={rev.id} className="p-4 rounded-2xl border border-slate-100 bg-[#F8FAFC] space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={rev.userAvatar}
                          alt={rev.userName}
                          className="w-8 h-8 rounded-full object-cover border border-slate-200"
                        />
                        <div>
                          <div className="text-xs font-bold text-slate-900">{rev.userName}</div>
                          <div className="text-[10px] text-slate-400">{rev.date} &middot; {rev.packageName}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-0.5 text-amber-400">
                        {Array.from({ length: rev.rating || 5 }).map((_, r) => (
                          <Star key={r} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                    </div>

                    <p className="text-xs text-slate-700 leading-relaxed italic bg-white p-3 rounded-xl border border-slate-100">
                      &ldquo;{rev.comment}&rdquo;
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* VIEW 9: SETTINGS (TARIF & KETERSEDIAAN)                      */}
          {/* ============================================================ */}
          {activeMenu === "settings" && (
            <form onSubmit={handleSaveSettings} className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs space-y-6">
              <div>
                <h3 className="font-bold text-base text-slate-900">Pengaturan Tarif &amp; Ketersediaan</h3>
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
                    className="w-5 h-5 accent-[#1683FF] rounded cursor-pointer"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Tarif Minimum Penerimaan Order (Rp)</label>
                    <input
                      type="number"
                      value={settingsForm.minRate}
                      onChange={(e) => setSettingsForm({ ...settingsForm, minRate: Number(e.target.value) })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-[#1683FF]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Batas Maksimal Order Aktif Bersamaan</label>
                    <input
                      type="number"
                      value={settingsForm.maxActiveOrders}
                      onChange={(e) => setSettingsForm({ ...settingsForm, maxActiveOrders: Number(e.target.value) })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-[#1683FF]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Target Respon Chat Klien (Menit)</label>
                    <input
                      type="number"
                      value={settingsForm.slaResponseMinutes}
                      onChange={(e) => setSettingsForm({ ...settingsForm, slaResponseMinutes: Number(e.target.value) })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-[#1683FF]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Batas Gratis Revisi per Order</label>
                    <input
                      type="number"
                      value={settingsForm.revisionLimit}
                      onChange={(e) => setSettingsForm({ ...settingsForm, revisionLimit: Number(e.target.value) })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-[#1683FF]"
                    />
                  </div>
                </div>

                <div className="pt-3">
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white text-xs font-bold shadow-2xs transition cursor-pointer"
                  >
                    Simpan Pengaturan
                  </button>
                </div>
              </div>
            </form>
          )}

        </div>

      </main>

      {/* ============================================================ */}
      {/* MODAL 1: TAMBAH / EDIT KATALOG JASA (DENGAN UPLOAD LOKAL)    */}
      {/* ============================================================ */}
      {isCatalogModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-sm font-extrabold text-slate-900">
                {editingCatalogItem ? "Edit Layanan Katalog" : "Tambah Layanan Baru ke Katalog"}
              </h3>
              <button onClick={() => setIsCatalogModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCatalog} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Judul Layanan Jasa</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Desain Logo & Identitas Brand"
                  value={catalogForm.title}
                  onChange={(e) => setCatalogForm({ ...catalogForm, title: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#1683FF]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kategori</label>
                  <select
                    value={catalogForm.category}
                    onChange={(e) => setCatalogForm({ ...catalogForm, category: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#1683FF]"
                  >
                    <option value="Logo">Logo</option>
                    <option value="Kemasan">Kemasan</option>
                    <option value="Sosial Media">Sosial Media</option>
                    <option value="Cetak">Cetak</option>
                    <option value="UI/UX">UI/UX</option>
                    <option value="Web & IT">Web & IT</option>
                    <option value="Fotografi">Fotografi</option>
                    <option value="Umum">Umum</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tarif (Rp)</label>
                  <input
                    type="number"
                    required
                    placeholder="Contoh: 75000"
                    value={catalogForm.price}
                    onChange={(e) => setCatalogForm({ ...catalogForm, price: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#1683FF]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Satuan Harga</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: / desain, / produk, / jam"
                  value={catalogForm.unit}
                  onChange={(e) => setCatalogForm({ ...catalogForm, unit: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#1683FF]"
                />
              </div>

              {/* Upload Foto Layanan dari File Lokal */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Foto Produk Layanan (Dari Lokal)</label>
                <div className="flex items-center gap-3">
                  <img
                    src={catalogForm.image}
                    alt="Preview"
                    className="w-16 h-12 rounded-xl object-cover border border-slate-200 shrink-0 bg-slate-50"
                  />
                  <label className="flex-1 px-3 py-2 rounded-xl border border-dashed border-slate-300 hover:border-[#1683FF] text-xs font-bold text-slate-600 hover:text-[#1683FF] transition cursor-pointer text-center flex items-center justify-center gap-1.5 bg-slate-50 hover:bg-blue-50/40">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Pilih Foto dari Komputer / HP</span>
                    <input type="file" accept="image/*" onChange={handleCatalogPhotoFile} className="hidden" />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Deskripsi Layanan</label>
                <textarea
                  rows={3}
                  placeholder="Jelaskan apa yang didapatkan klien dari layanan ini..."
                  value={catalogForm.desc}
                  onChange={(e) => setCatalogForm({ ...catalogForm, desc: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#1683FF]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCatalogModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white text-xs font-bold shadow-2xs transition cursor-pointer"
                >
                  {editingCatalogItem ? "Simpan Perubahan" : "Publikasikan Layanan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 2: TAMBAH PAKET BUNDLING                               */}
      {/* ============================================================ */}
      {isPackageModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-sm font-extrabold text-slate-900">Tambah Paket Bundling Baru</h3>
              <button onClick={() => setIsPackageModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePackage} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Paket</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Paket Brand Komplit & Sosmed"
                  value={packageForm.name}
                  onChange={(e) => setPackageForm({ ...packageForm, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#1683FF]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tier / Tingkatan</label>
                  <select
                    value={packageForm.tier}
                    onChange={(e) => setPackageForm({ ...packageForm, tier: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#1683FF]"
                  >
                    <option value="Paket Hemat">Paket Hemat</option>
                    <option value="Paket Standar">Paket Standar</option>
                    <option value="Paket Lengkap">Paket Lengkap</option>
                    <option value="Paket Pro VIP">Paket Pro VIP</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Harga (Rp)</label>
                  <input
                    type="number"
                    required
                    placeholder="Contoh: 175000"
                    value={packageForm.price}
                    onChange={(e) => setPackageForm({ ...packageForm, price: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#1683FF]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Estimasi Durasi Pengerjaan</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: 2 Hari Kerja"
                  value={packageForm.duration}
                  onChange={(e) => setPackageForm({ ...packageForm, duration: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#1683FF]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Fitur Paket (1 fitur per baris)</label>
                <textarea
                  rows={4}
                  required
                  placeholder="3 Konsep Logo&#10;Master File AI / SVG&#10;Revisi Sepuasnya"
                  value={packageForm.featuresStr}
                  onChange={(e) => setPackageForm({ ...packageForm, featuresStr: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#1683FF]"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="populer-check"
                  checked={packageForm.isPopular}
                  onChange={(e) => setPackageForm({ ...packageForm, isPopular: e.target.checked })}
                  className="w-4 h-4 accent-[#1683FF] rounded cursor-pointer"
                />
                <label htmlFor="populer-check" className="text-xs font-bold text-slate-700 cursor-pointer">
                  Tandai sebagai Paket Paling Diminati (Best Seller)
                </label>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPackageModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white text-xs font-bold shadow-2xs transition cursor-pointer"
                >
                  Simpan Paket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 3: TAMBAH FOTO PORTOFOLIO (DENGAN UPLOAD LOKAL)         */}
      {/* ============================================================ */}
      {isPortfolioModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-sm font-extrabold text-slate-900">Tambah Foto Portofolio Baru</h3>
              <button onClick={() => setIsPortfolioModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePortfolio} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Judul Karya / Projek</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Desain Kemasan Botol Kopi Susu"
                  value={portfolioForm.title}
                  onChange={(e) => setPortfolioForm({ ...portfolioForm, title: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#1683FF]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Kategori Karya</label>
                <select
                  value={portfolioForm.category}
                  onChange={(e) => setPortfolioForm({ ...portfolioForm, category: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#1683FF]"
                >
                  <option value="Branding">Branding</option>
                  <option value="UI/UX">UI/UX</option>
                  <option value="Cetak">Cetak</option>
                  <option value="Kemasan">Kemasan</option>
                  <option value="Web UI">Web UI</option>
                  <option value="Sosmed">Sosmed</option>
                </select>
              </div>

              {/* Upload Foto Portofolio dari File Lokal */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">File Foto Karya (Dari Lokal)</label>
                <div className="flex items-center gap-3">
                  <img
                    src={portfolioForm.url}
                    alt="Preview Karya"
                    className="w-16 h-12 rounded-xl object-cover border border-slate-200 shrink-0 bg-slate-50"
                  />
                  <label className="flex-1 px-3 py-2 rounded-xl border border-dashed border-slate-300 hover:border-[#1683FF] text-xs font-bold text-slate-600 hover:text-[#1683FF] transition cursor-pointer text-center flex items-center justify-center gap-1.5 bg-slate-50 hover:bg-blue-50/40">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Pilih Foto dari Komputer / HP</span>
                    <input type="file" accept="image/*" onChange={handlePortfolioPhotoFile} className="hidden" />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Deskripsi Singkat Karya</label>
                <textarea
                  rows={3}
                  placeholder="Contoh: Desain label stiker botol kopi dingin tahan air siap cetak."
                  value={portfolioForm.description}
                  onChange={(e) => setPortfolioForm({ ...portfolioForm, description: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#1683FF]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPortfolioModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white text-xs font-bold shadow-2xs transition cursor-pointer"
                >
                  Simpan ke Portofolio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 4: TARIK SALDO HAK PEMBAYARAN (WITHDRAWAL)             */}
      {/* ============================================================ */}
      {isWithdrawModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">Tarik Saldo Hak Pembayaran</h3>
                <p className="text-[11px] text-slate-500">Pencairan manual via m-Banking admin tanpa potongan biaya</p>
              </div>
              <button onClick={() => setIsWithdrawModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleWithdrawSubmit} className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-100 flex items-center justify-between">
                <span className="text-xs text-slate-700 font-medium">Saldo Tersedia:</span>
                <span className="text-sm font-extrabold text-[#1683FF]">{formatIDR(mitraAvailableBalance)}</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nominal Penarikan (Rp)</label>
                <input
                  type="number"
                  required
                  min={20000}
                  max={mitraAvailableBalance}
                  value={withdrawForm.amount}
                  onChange={(e) => setWithdrawForm({ ...withdrawForm, amount: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-bold focus:outline-none focus:border-[#1683FF]"
                />
                <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                  <span>Minimal Rp20.000</span>
                  <button
                    type="button"
                    onClick={() => setWithdrawForm({ ...withdrawForm, amount: mitraAvailableBalance.toString() })}
                    className="text-[#1683FF] font-bold hover:underline"
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
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-[#1683FF]"
                  >
                    <option value="BCA">BCA</option>
                    <option value="Mandiri">Bank Mandiri</option>
                    <option value="BRI">BRI</option>
                    <option value="BNI">BNI</option>
                    <option value="BSI">Bank Syariah Indonesia</option>
                    <option value="DANA">DANA</option>
                    <option value="GoPay">GoPay</option>
                    <option value="OVO">OVO</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nomor Rekening / HP</label>
                  <input
                    type="text"
                    required
                    value={withdrawForm.accountNumber}
                    onChange={(e) => setWithdrawForm({ ...withdrawForm, accountNumber: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-[#1683FF]"
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
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-[#1683FF]"
                />
              </div>

              <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/80 text-[11px] text-slate-600 space-y-1">
                <div className="flex justify-between">
                  <span>Biaya Transfer Admin (Rp2.500):</span>
                  <span className="font-bold text-emerald-700">GRATIS (Ditanggung Bantuin.id)</span>
                </div>
                <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-emerald-200">
                  <span>Total Ditransfer ke Rekening Anda:</span>
                  <span className="text-emerald-700 font-black text-sm">
                    {formatIDR(Number(withdrawForm.amount) || 0)}
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
                  className="px-5 py-2 rounded-xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white text-xs font-bold shadow-2xs transition cursor-pointer"
                >
                  Konfirmasi Pengajuan Penarikan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
