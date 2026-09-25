"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import logoImg from "@/components/image/logo.png";
import { useApp } from "@/lib/context/AppContext";
import RoleGuard from "@/components/auth/RoleGuard";
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
  ChevronRight,
  Edit3,
  Upload,
  Camera,
  Award,
  Loader2,
  User,
  Store,
  Bell,
  AlertTriangle,
  Send,
  Shapes,
  Eye,
  FileText,
  CheckCircle,
  Rocket,
  Megaphone,
  AlertCircle,
  QrCode,
  CreditCard,
  RefreshCw,
  RotateCcw,
  Navigation,
} from "lucide-react";
import { resolveCategoryIcon } from "@/lib/services/categoryService";
import { promotionService } from "@/lib/services/promotionService";
import { paymentService, PAYMENT_METHODS } from "@/lib/services/paymentService";
import { reportService } from "@/lib/services/reportService";
import { imageService } from "@/lib/services/imageService";

export default function JasaDashboardPage() {
  const router = useRouter();
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
  const [isDetectingGps, setIsDetectingGps] = useState(false);
  const [catalogForm, setCatalogForm] = useState({
    title: "",
    category: "Logo",
    price: 75000,
    unit: "/ desain",
    image: "https://images.unsplash.com/photo-1626785774573-4b799315345d?auto=format&fit=crop&w=600&q=80",
    desc: "",
    locationType: "hybrid", // onsite, customer_location, online, hybrid
    latitude: -6.2088,
    longitude: 106.8456,
    address: "",
  });

  const handleDetectCatalogLocation = () => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      addToast?.("GPS Tidak Didukung", "Browser Anda tidak mendukung deteksi lokasi.", "error");
      return;
    }
    setIsDetectingGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsDetectingGps(false);
        setCatalogForm((prev) => ({
          ...prev,
          latitude: parseFloat(pos.coords.latitude.toFixed(6)),
          longitude: parseFloat(pos.coords.longitude.toFixed(6)),
          address: prev.address || "Area Layanan Anda (Terdeteksi GPS)",
        }));
        addToast?.("Lokasi Terdeteksi", "Koordinat GPS akurat berhasil diterapkan pada layanan ini.");
      },
      (err) => {
        setIsDetectingGps(false);
        addToast?.("Gagal Deteksi Lokasi", "Pastikan izin GPS diaktifkan pada browser Anda.", "error");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

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

  // 7. Orders with Canonical Flow (Section L)
  const [providerOrders, setProviderOrders] = useState([
    {
      id: "ord-js-101",
      orderNumber: "BTN-ORD-99120",
      customerName: "Dimas Anggara",
      customerPhone: "081234567890",
      serviceTitle: "Desain Logo & Identitas Brand",
      packageName: "Paket Brand Lengkap",
      amount: 175000,
      paymentStatus: "paid",
      status: "Sedang Dikerjakan",
      deadline: "Besok, 18:00 WIB",
      brief: "Membutuhkan 2 konsep logo modern minimalis untuk kedai kopi artisan di Banyumas. Warna utama earthy brown dan soft cream.",
      createdAt: "2026-03-22T08:30:00Z",
      timeline: [
        { status: "Menunggu Pembayaran", time: "2026-03-22 08:30", note: "Pesanan dibuat oleh klien" },
        { status: "Pesanan Dibayar", time: "2026-03-22 08:45", note: "Pembayaran terkonfirmasi via Payment Gateway Resmi" },
        { status: "Menunggu Dikerjakan", time: "2026-03-22 09:00", note: "Brief telah diverifikasi penyedia jasa" },
        { status: "Sedang Dikerjakan", time: "2026-03-22 10:15", note: "Penyedia jasa mulai eksplorasi sketsa logo" },
      ],
    },
    {
      id: "ord-js-102",
      orderNumber: "BTN-ORD-99121",
      customerName: "Siti Nurhaliza",
      customerPhone: "082198765432",
      serviceTitle: "Desain Kemasan & Label Produk UMKM",
      packageName: "Paket Cetak Siap Pakai",
      amount: 120000,
      paymentStatus: "paid",
      status: "Menunggu Konfirmasi",
      deadline: "Hari Ini, 21:00 WIB",
      brief: "Desain label pouch keripik pisang ukuran 15x20cm lengkap dengan komposisi, barcode mockup, dan legalitas Dinkes.",
      createdAt: "2026-03-21T14:00:00Z",
      timeline: [
        { status: "Menunggu Pembayaran", time: "2026-03-21 14:00", note: "Pesanan dibuat oleh klien" },
        { status: "Pesanan Dibayar", time: "2026-03-21 14:10", note: "Pembayaran terkonfirmasi via Payment Gateway Resmi" },
        { status: "Sedang Dikerjakan", time: "2026-03-21 15:00", note: "Pengerjaan desain kemasan" },
        { status: "Menunggu Konfirmasi", time: "2026-03-22 16:30", note: "Draft final telah diunggah ke ruang order" },
      ],
    },
    {
      id: "ord-js-103",
      orderNumber: "BTN-ORD-99118",
      customerName: "Rian Prasetya",
      customerPhone: "085712349988",
      serviceTitle: "UI/UX Mobile App Landing Page",
      packageName: "Paket Figma Prototyping",
      amount: 450000,
      paymentStatus: "paid",
      status: "Selesai",
      deadline: "20 Maret 2026",
      brief: "High fidelity design 5 screen aplikasi pencatatan keuangan UMKM berbasis mobile.",
      createdAt: "2026-03-18T10:00:00Z",
      timeline: [
        { status: "Dibayar", time: "2026-03-18 10:15", note: "Dana terverifikasi aman" },
        { status: "Sedang Dikerjakan", time: "2026-03-18 11:00", note: "Pengerjaan Figma dimulai" },
        { status: "Menunggu Konfirmasi", time: "2026-03-20 12:00", note: "File .fig diserahkan" },
        { status: "Selesai", time: "2026-03-20 15:30", note: "Klien mengonfirmasi pesanan selesai. Dana Rp 450.000 masuk saldo mitra." },
      ],
    },
  ]);

  const [selectedOrderForDetail, setSelectedOrderForDetail] = useState(null);
  const [orderFilter, setOrderFilter] = useState("all");

  // Custom Category State (Section O & P)
  const [isCustomCategoryMode, setIsCustomCategoryMode] = useState(false);
  const [customCategoryName, setCustomCategoryName] = useState("");

  // Notifications State
  const [providerNotifications, setProviderNotifications] = useState([
    {
      id: "pnotif-1",
      title: "Pesanan Baru Masuk",
      message: "Dimas Anggara memesan Desain Logo & Identitas Brand. Segera periksa brief klien.",
      time: "2 jam yang lalu",
      isRead: false,
    },
    {
      id: "pnotif-2",
      title: "Dana Telah Masuk Saldo",
      message: "Pesanan BTN-ORD-99118 telah selesai. Dana Rp 450.000 telah masuk ke saldo dompet Anda.",
      time: "1 hari yang lalu",
      isRead: true,
    },
    {
      id: "pnotif-3",
      title: "Ulasan Bintang 5",
      message: "Rian Prasetya memberikan ulasan bintang 5 atas pekerjaan UI/UX Anda.",
      time: "2 hari yang lalu",
      isRead: true,
    },
  ]);

  // ── Promosi Jasa State (Section 7 & 9) ──────────────────────────────────
  const [providerPromotions, setProviderPromotions] = useState(() => {
    return promotionService.getPromotionsSync({ ownerId: provider?.id || "fajar-ramadhan-desain" });
  });
  const [isPromoModalOpen, setIsPromoModalOpen] = useState(false);
  const [promoModalStep, setPromoModalStep] = useState("form"); // "form" | "waiting_payment" | "success" | "failed" | "expired" | "cancelled"
  const [promoTargetServiceId, setPromoTargetServiceId] = useState("");
  const [selectedPromoPkgId, setSelectedPromoPkgId] = useState("pkg-7d");
  const [selectedPromoChannel, setSelectedPromoChannel] = useState("qris");
  const [activePayment, setActivePayment] = useState(null);
  const [activePromotion, setActivePromotion] = useState(null);
  const [isCreatingPayment, setIsCreatingPayment] = useState(false);
  const [isCheckingPayment, setIsCheckingPayment] = useState(false);
  const promoPackages = promotionService.getPackagesSync();

  // Listener untuk sinkronisasi otomatis promosi dan pembayaran
  useEffect(() => {
    const handlePromosUpdate = () => {
      const updated = promotionService.getPromotionsSync({ ownerId: provider?.id || "fajar-ramadhan-desain" });
      setProviderPromotions(updated);
    };
    window.addEventListener("bantuin_promotions_updated", handlePromosUpdate);
    window.addEventListener("bantuin_payments_updated", handlePromosUpdate);
    return () => {
      window.removeEventListener("bantuin_promotions_updated", handlePromosUpdate);
      window.removeEventListener("bantuin_payments_updated", handlePromosUpdate);
    };
  }, [provider?.id]);

  // ── Laporan & Sengketa State (Section 7 & 28) ───────────────────────────
  const [providerReports, setProviderReports] = useState(() => {
    return [
      {
        id: "rep-prov-01",
        targetName: "Dimas Anggara (Klien)",
        orderId: "ord-8819",
        reason: "Permintaan revisi di luar batas kesepakatan paket",
        description: "Klien meminta penambahan 5 halaman desain UI baru yang tidak termasuk dalam paket kesepakatan awal.",
        status: "investigating",
        createdAt: new Date(Date.now() - 24 * 3600000).toISOString(),
      },
    ];
  });
  const [isDisputeModalOpen, setIsDisputeModalOpen] = useState(false);
  const [disputeForm, setDisputeForm] = useState({
    targetName: "",
    orderId: "",
    reason: "",
    description: "",
  });

  const activePromotionsCount = providerPromotions.filter((p) => p.status === "active").length;

  // Sidebar navigation links (13 Menus sesuai Section 7)
  const sidebarLinks = [
    { id: "overview", label: "Ringkasan Jasa", icon: LayoutDashboard },
    { id: "catalog", label: "Katalog Layanan", icon: Layers, count: provider.catalog?.length || 0 },
    { id: "packages", label: "Paket Bundling", icon: Package, count: provider.packages?.length || 0 },
    { id: "portfolio", label: "Portofolio & Foto", icon: ImageIcon, count: provider.portfolioPhotos?.length || 0 },
    { id: "orders", label: "Pesanan Klien", icon: Receipt, count: providerOrders.filter((o) => o.status !== "Selesai").length },
    { id: "wallet", label: "Dompet & Penarikan", icon: Wallet },
    { id: "profile", label: "Keahlian & Profil", icon: UserCheck },
    { id: "reviews", label: "Ulasan Pelanggan", icon: Star, count: provider.reviews?.length || 0 },
    { id: "settings", label: "Tarif & Ketersediaan", icon: Settings },
    { id: "promotions", label: "Promosi Saya", icon: Rocket, count: activePromotionsCount > 0 ? "Aktif" : 0 },
    { id: "chat", label: "Chat Customer", icon: MessageSquare, count: 2 },
    { id: "notifications", label: "Notifikasi", icon: Bell, count: providerNotifications.filter((n) => !n.isRead).length },
    { id: "disputes", label: "Laporan & Sengketa", icon: AlertTriangle, count: providerReports.filter((r) => r.status === "investigating" || r.status === "open").length },
  ];

  // -------------------------------------------------------------
  // HANDLERS: KATALOG JASA (DEDICATED FULL PAGE - SECTION 85)
  // -------------------------------------------------------------
  const handleOpenAddCatalog = () => {
    router.push("/jasa/dashboard/katalog/tambah");
  };

  const handleOpenEditCatalog = (item) => {
    router.push(`/jasa/dashboard/katalog/${item.id}/edit`);
  };

  const handleSaveCatalog = (e) => {
    e.preventDefault();
    if (!catalogForm.title || !catalogForm.price) {
      addToast?.("Form Belum Lengkap", "Silakan isi judul dan tarif layanan.", "error");
      return;
    }

    if (catalogForm.locationType !== "online" && !catalogForm.address) {
      addToast?.("Lokasi Wajib Diisi", "Layanan offline / onsite wajib menyertakan alamat atau koordinat lokasi.", "error");
      return;
    }

    const resolvedCategory = catalogForm.category === "__CUSTOM__" 
      ? (customCategoryName.trim() || "Layanan Kustom")
      : catalogForm.category;

    let updatedCatalog;
    if (editingCatalogItem) {
      updatedCatalog = provider.catalog.map((c) =>
        c.id === editingCatalogItem.id
          ? {
              ...c,
              title: catalogForm.title,
              category: resolvedCategory,
              price: Number(catalogForm.price),
              unit: catalogForm.unit,
              image: catalogForm.image,
              desc: catalogForm.desc,
              locationType: catalogForm.locationType,
              latitude: catalogForm.latitude,
              longitude: catalogForm.longitude,
              address: catalogForm.address,
            }
          : c
      );
    } else {
      const newItem = {
        id: `cat-${Date.now()}`,
        title: catalogForm.title,
        category: resolvedCategory,
        price: Number(catalogForm.price),
        unit: catalogForm.unit,
        image: catalogForm.image,
        desc: catalogForm.desc,
        locationType: catalogForm.locationType,
        latitude: catalogForm.latitude,
        longitude: catalogForm.longitude,
        address: catalogForm.address,
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
  const handlePortfolioPhotoFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await imageService.uploadImage(file, "portfolio");
      if (res.success && res.url) {
        setPortfolioForm((prev) => ({ ...prev, url: res.url }));
        addToast?.("Foto Terunggah", "Foto karya berhasil dimuat.");
      }
    } catch (err) {
      addToast?.("Gagal Upload", err.message || "Gagal mengunggah foto.", "error");
    }
  };

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

  // -------------------------------------------------------------
  // HANDLERS: PROMOSI SAYA & DISPUTES (DEDICATED FULL PAGE)
  // -------------------------------------------------------------
  const handleOpenPromoModal = (serviceId = "", existingPromo = null) => {
    if (serviceId) {
      router.push(`/jasa/dashboard/promosi/buat?serviceId=${serviceId}`);
    } else {
      router.push("/jasa/dashboard/promosi/buat");
    }
  };

  const handleCreatePromotionPayment = async (e) => {
    e.preventDefault();
    const service = provider.catalog?.find((s) => s.id === promoTargetServiceId) || provider.catalog?.[0];
    const pkg = promoPackages.find((p) => p.id === selectedPromoPkgId) || promoPackages[1];

    setIsCreatingPayment(true);
    try {
      // 1. Buat transaksi pembayaran baru di Tripay Payment Gateway (status awal: pending)
      const payment = await paymentService.createPromotionPayment({
        ownerId: provider.id,
        ownerName: provider.name,
        ownerType: "provider",
        targetType: "service",
        targetId: service?.id || `srv-${Date.now()}`,
        targetTitle: service?.title || "Layanan Jasa Unggulan",
        packageId: pkg.id,
        packageName: pkg.name,
        amount: pkg.price,
        paymentProvider: "tripay",
        paymentMethod: selectedPromoChannel || "qris",
        payerName: provider.name,
        payerEmail: provider.email || "provider@bantuin.id",
        payerPhone: provider.phone || "081298765432",
      });

      setActivePayment(payment);
      const promo = promotionService.getPromotionById(payment.promotionId || payment.orderId);
      setActivePromotion(promo);

      // Perbarui daftar promosi lokal (status masih pending_payment)
      const updated = promotionService.getPromotionsSync({ ownerId: provider.id });
      setProviderPromotions(updated);

      setPromoModalStep("waiting_payment");
      addToast?.("Menunggu Pembayaran", "Silakan selesaikan pembayaran melalui Payment Gateway resmi.");
    } catch (err) {
      addToast?.("Gagal Membuat Transaksi", err.message || "Terjadi kesalahan saat memproses pembayaran.", "error");
    } finally {
      setIsCreatingPayment(false);
    }
  };

  const handleCheckPaymentStatus = async () => {
    if (!activePayment?.id) return;
    setIsCheckingPayment(true);
    try {
      const statusRes = await paymentService.getPaymentStatus(activePayment.id);
      setActivePayment(statusRes);

      const promo = promotionService.getPromotionByPaymentId(activePayment.id) || promotionService.getPromotionById(activePayment.orderId);
      if (promo) setActivePromotion(promo);

      const updated = promotionService.getPromotionsSync({ ownerId: provider.id });
      setProviderPromotions(updated);

      if (statusRes.status === "paid") {
        setPromoModalStep("success");
        addToast?.("Pembayaran Berhasil!", "Promosi layanan Anda kini aktif dan tampil di etalase Unggulan.");
      } else if (statusRes.status === "failed") {
        setPromoModalStep("failed");
      } else if (statusRes.status === "expired") {
        setPromoModalStep("expired");
      } else if (statusRes.status === "cancelled") {
        setPromoModalStep("cancelled");
      } else {
        addToast?.("Status Transaksi", "Pembayaran masih belum terkonfirmasi dari gateway (PENDING).");
      }
    } catch (err) {
      addToast?.("Gagal Cek Status", "Tidak dapat memeriksa status transaksi saat ini.", "error");
    } finally {
      setIsCheckingPayment(false);
    }
  };

  const handleCancelPayment = async () => {
    if (!activePayment?.id) return;
    try {
      await paymentService.cancelPayment(activePayment.id, "Dibatalkan oleh penyedia jasa");
      const updated = promotionService.getPromotionsSync({ ownerId: provider.id });
      setProviderPromotions(updated);
      setPromoModalStep("cancelled");
      addToast?.("Pembayaran Dibatalkan", "Transaksi pembayaran promosi telah dibatalkan.");
    } catch (err) {
      addToast?.("Gagal Membatalkan", err.message || "Terjadi kesalahan.", "error");
    }
  };

  // [DEVELOPMENT MOCK ONLY] Handler untuk simulasi callback/webhook gateway
  const handleSimulateDevGateway = async (targetStatus) => {
    if (!activePayment?.id) return;
    setIsCheckingPayment(true);
    try {
      await paymentService.mockSimulateTripayPayment(activePayment.id, targetStatus);
      await handleCheckPaymentStatus();
    } finally {
      setIsCheckingPayment(false);
    }
  };

  const handleTogglePromoStatus = async (promoId) => {
    await promotionService.toggleStatus(promoId);
    const updated = promotionService.getPromotionsSync({ ownerId: provider.id });
    setProviderPromotions(updated);
    addToast?.("Status Promosi Diperbarui", "Perubahan status tayang promosi berhasil disimpan.");
  };

  const handleCreateDispute = async (e) => {
    e.preventDefault();
    if (!disputeForm.reason || !disputeForm.description) {
      addToast?.("Form Belum Lengkap", "Alasan dan rincian laporan wajib diisi.", "error");
      return;
    }
    try {
      const newReport = await reportService.createReport({
        reporterId: provider.id,
        reporterName: provider.name,
        targetType: "client",
        targetName: disputeForm.targetName || "Klien Terlapor",
        orderId: disputeForm.orderId || null,
        reason: disputeForm.reason,
        description: disputeForm.description,
      });
      setProviderReports([newReport, ...providerReports]);
      setIsDisputeModalOpen(false);
      setDisputeForm({ targetName: "", orderId: "", reason: "", description: "" });
      addToast?.("Laporan Terkirim", "Laporan pengaduan berhasil dikirim ke Admin Pusat Bantuin.");
    } catch (err) {
      addToast?.("Gagal Mengirim Laporan", err.message || "Terjadi kendala.", "error");
    }
  };

  return (
    <RoleGuard allowedRoles={["provider"]}>
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

          <div className="flex items-center gap-1.5">
            <Link
              href="/profile"
              className="text-[11px] font-bold px-2 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition flex items-center gap-1"
              title="Profil Akun Utama"
            >
              <User className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Profil Akun</span>
            </Link>

            <Link
              href="/mitra/dashboard"
              className="text-[11px] font-bold px-2 py-1.5 rounded-lg bg-blue-50 text-[#1683FF] hover:bg-blue-100 transition flex items-center gap-1"
              title="Buka Dashboard Mitra Sewa"
            >
              <Store className="w-3.5 h-3.5" />
              <span>Mitra Sewa</span>
            </Link>

            <Link
              href={`/jasa/penyedia/${provider.id}`}
              className="text-[11px] font-bold px-2 py-1.5 rounded-lg bg-slate-50 text-slate-600 hover:bg-slate-100 transition flex items-center gap-1"
            >
              <span>Publik</span>
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
              Penyedia Jasa
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

        {/* Bottom CTA / Cross Portal Switchers */}
        <div className="pt-4 border-t border-slate-100 space-y-2">
          <Link
            href="/profile"
            className="flex items-center justify-between w-full px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition border border-slate-200/80"
          >
            <div className="flex items-center gap-2">
              <User className="w-3.5 h-3.5 text-slate-600" />
              <span>Profil Akun Saya</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          </Link>

          <Link
            href="/mitra/dashboard"
            className="flex items-center justify-between w-full px-3 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#1683FF] text-xs font-bold transition border border-blue-200/80"
          >
            <div className="flex items-center gap-2">
              <Store className="w-3.5 h-3.5 text-[#1683FF]" />
              <span>Dashboard Mitra Sewa</span>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-[#1683FF]/70" />
          </Link>

          <Link
            href={`/jasa/penyedia/${provider.id}`}
            target="_blank"
            className="flex items-center justify-center gap-1.5 w-full py-2 rounded-xl text-slate-600 hover:text-slate-900 text-xs font-medium transition"
          >
            <span>Lihat Profil Publik Saya</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>

          <Link
            href="/"
            className="flex items-center justify-center gap-1.5 w-full py-1.5 rounded-xl text-slate-400 hover:text-slate-700 text-[11px] font-medium transition"
          >
            <ArrowLeft className="w-3 h-3" />
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
              {activeMenu === "wallet" && "Dompet Saldo & Penarikan Hak Pembayaran"}
              {activeMenu === "profile" && "Keahlian & Pengaturan Profil Publik"}
              {activeMenu === "reviews" && "Ulasan Pelanggan Terverifikasi"}
              {activeMenu === "settings" && "Pengaturan Tarif & Ketersediaan"}
              {activeMenu === "promotions" && "Promosi Layanan Saya & Featured Placement"}
              {activeMenu === "notifications" && "Pusat Notifikasi & Pembaruan Pesanan"}
              {activeMenu === "chat" && "Pesan Masuk & Komunikasi Klien"}
              {activeMenu === "disputes" && "Pusat Laporan & Mediasi Sengketa"}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/jasa/dashboard/katalog/tambah"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white text-xs font-bold shadow-xs transition active:scale-95 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Tambah Layanan Baru</span>
            </Link>
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
                <div className="px-5 sm:px-6 pb-5 sm:pb-6 relative z-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                  <div className="flex flex-col sm:flex-row sm:items-end gap-3.5 sm:gap-4">
                    <div className="-mt-12 sm:-mt-16 relative group shrink-0 self-start">
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

                    <div className="space-y-1 pt-2 sm:pt-0 sm:pb-1 min-w-0">
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

                  <div className="flex items-center gap-2 sm:pb-1">
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
                    <p className="text-xs text-slate-500">Pantau progres pengerjaan, chat klien, dan hak pembayaran aman</p>
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
                        <div className="text-[10px] text-emerald-600 font-semibold">Dana Aman Terkunci</div>
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
                        <div className="text-[10px] text-emerald-600 font-semibold">Hak Bayar Siap Cair</div>
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
                <Link
                  href="/jasa/dashboard/katalog/tambah"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1683FF] text-white text-xs font-bold hover:bg-[#0F6FE5] transition shadow-2xs"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Tambah Layanan Baru</span>
                </Link>
              </div>

              {/* Grid Katalog Layanan Jasa (Persis Foto & Harga di User) */}
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-4 pt-2">
                {provider.catalog?.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl sm:rounded-2xl border border-slate-200/90 bg-white overflow-hidden shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group"
                  >
                    <div>
                      {/* Foto Layanan */}
                      <Link href={`/jasa/dashboard/katalog/${item.id}`} className="block relative aspect-4/3 sm:aspect-16/10 w-full bg-slate-100 overflow-hidden cursor-pointer">
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute top-2 left-2 sm:top-2.5 sm:left-2.5">
                          <span className="px-1.5 sm:px-2 py-0.5 rounded-md text-[9px] sm:text-[10px] font-extrabold uppercase bg-black/60 text-white backdrop-blur-xs">
                            {item.category}
                          </span>
                        </div>
                      </Link>

                      {/* Detail Layanan */}
                      <div className="p-2.5 sm:p-4 space-y-1 sm:space-y-1.5">
                        <Link href={`/jasa/dashboard/katalog/${item.id}`} className="block">
                          <h4 className="font-bold text-xs sm:text-sm text-slate-900 group-hover:text-[#1683FF] transition line-clamp-2 leading-snug min-h-[32px] sm:min-h-0">
                            {item.title}
                          </h4>
                        </Link>
                        <p className="hidden sm:block text-xs text-slate-500 line-clamp-2 leading-relaxed">
                          {item.desc}
                        </p>
                      </div>
                    </div>

                    {/* Harga & Aksi */}
                    <div className="p-2.5 sm:p-4 pt-2 sm:pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-2">
                      <div>
                        <span className="text-[9px] sm:text-[10px] text-slate-400 block uppercase font-medium">Tarif:</span>
                        <div className="font-black text-xs sm:text-sm text-[#1683FF]">
                          {formatIDR(item.price)}
                          <span className="text-[9px] sm:text-[10px] text-slate-400 font-normal ml-0.5">{item.unit}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 sm:gap-1.5 self-end sm:self-auto">
                        <Link
                          href={`/jasa/dashboard/katalog/${item.id}`}
                          className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl text-slate-600 hover:bg-slate-100 hover:text-[#1683FF] transition border border-slate-100"
                          title="Lihat Detail Layanan"
                        >
                          <Eye className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                        </Link>
                        <Link
                          href={`/jasa/dashboard/katalog/${item.id}/edit`}
                          className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl text-slate-600 hover:bg-slate-100 hover:text-[#1683FF] transition border border-slate-100"
                          title="Edit Layanan"
                        >
                          <Edit3 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                        </Link>
                        <button
                          onClick={() => handleDeleteCatalog(item.id)}
                          className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl text-rose-600 hover:bg-rose-50 transition border border-slate-100 cursor-pointer"
                          title="Hapus Layanan"
                        >
                          <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                        </button>
                        <Link
                          href={`/jasa/${item.id}`}
                          target="_blank"
                          className="px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg sm:rounded-xl bg-blue-50 hover:bg-blue-100 text-[#1683FF] text-[10px] sm:text-xs font-bold inline-flex items-center gap-1 transition"
                          title="Buka Halaman Checkout Publik"
                        >
                          <span>Publik</span>
                          <ExternalLink className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
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
                <Link
                  href="/jasa/dashboard/bundling/tambah"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1683FF] text-white text-xs font-bold hover:bg-[#0F6FE5] transition shadow-2xs"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Tambah Paket Baru</span>
                </Link>
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
                      <div className="absolute -top-2.5 right-4 bg-[#1683FF] text-white text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full shadow-xs flex items-center gap-1">
                        <Star className="w-3 h-3 fill-white text-white" />
                        <span>Paling Diminati</span>
                      </div>
                    )}

                    <div className="space-y-3">
                      <div>
                        <span className="text-[10px] font-extrabold uppercase text-slate-400 block mb-0.5">
                          {pkg.tier}
                        </span>
                        <Link href={`/jasa/dashboard/bundling/${pkg.id}`} className="hover:text-[#1683FF] transition">
                          <h4 className="font-black text-base text-slate-900">{pkg.name}</h4>
                        </Link>
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
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/jasa/dashboard/bundling/${pkg.id}`}
                          className="text-xs font-bold text-[#1683FF] hover:bg-blue-50 px-2 py-1 rounded-lg transition"
                        >
                          Detail
                        </Link>
                        <Link
                          href={`/jasa/dashboard/bundling/${pkg.id}/edit`}
                          className="text-xs font-bold text-slate-600 hover:bg-slate-100 px-2 py-1 rounded-lg transition"
                        >
                          Edit
                        </Link>
                      </div>
                      <button
                        onClick={() => handleDeletePackage(pkg.id)}
                        className="text-xs font-bold text-rose-600 hover:bg-rose-50 px-2.5 py-1 rounded-lg transition cursor-pointer"
                      >
                        Hapus
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
                <Link
                  href="/jasa/dashboard/portofolio/tambah"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1683FF] text-white text-xs font-bold hover:bg-[#0F6FE5] transition shadow-2xs"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Tambah Foto Portofolio</span>
                </Link>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-4 pt-2">
                {provider.portfolioPhotos?.map((photo, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl sm:rounded-2xl border border-slate-200/90 bg-white overflow-hidden shadow-2xs group flex flex-col justify-between"
                  >
                    <div>
                      <Link href={`/jasa/dashboard/portofolio/${photo.id || idx}`} className="block relative aspect-4/3 w-full bg-slate-100 overflow-hidden cursor-pointer">
                        <img
                          src={photo.url}
                          alt={photo.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute top-2 left-2 sm:top-2.5 sm:left-2.5">
                          <span className="px-1.5 sm:px-2 py-0.5 rounded-md text-[9px] sm:text-[10px] font-extrabold uppercase bg-black/60 text-white backdrop-blur-xs">
                            {photo.category}
                          </span>
                        </div>
                      </Link>

                      <div className="p-2.5 sm:p-4 space-y-1">
                        <Link href={`/jasa/dashboard/portofolio/${photo.id || idx}`}>
                          <h4 className="font-bold text-xs sm:text-sm text-slate-900 line-clamp-1 hover:text-[#1683FF] transition">{photo.title}</h4>
                        </Link>
                        <p className="hidden sm:block text-xs text-slate-500 line-clamp-2 leading-relaxed">
                          {photo.description}
                        </p>
                      </div>
                    </div>

                    <div className="p-2.5 sm:p-4 pt-2 border-t border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Link
                          href={`/jasa/dashboard/portofolio/${photo.id || idx}`}
                          className="text-[10px] sm:text-xs font-bold text-[#1683FF] hover:bg-blue-50 px-1.5 sm:px-2 py-0.5 rounded-md transition"
                        >
                          Detail
                        </Link>
                        <Link
                          href={`/jasa/dashboard/portofolio/${photo.id || idx}/edit`}
                          className="text-[10px] sm:text-xs font-bold text-slate-600 hover:bg-slate-100 px-1.5 sm:px-2 py-0.5 rounded-md transition"
                        >
                          Edit
                        </Link>
                      </div>
                      <button
                        onClick={() => handleDeletePortfolio(idx)}
                        className="text-[10px] sm:text-xs font-bold text-rose-600 hover:bg-rose-50 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md sm:rounded-lg transition cursor-pointer"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* VIEW 5: ORDERS (PESANAN KLIEN MASUK - CANONICAL FLOW)        */}
          {/* ============================================================ */}
          {activeMenu === "orders" && (
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-base text-slate-900">Pesanan Klien Masuk</h3>
                  <p className="text-xs text-slate-500">
                    Alur pengerjaan jasa: Menunggu Dikerjakan &rarr; Sedang Dikerjakan &rarr; Menunggu Konfirmasi &rarr; Selesai
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#1683FF] bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                    {providerOrders.filter(o => o.status !== "Selesai").length} Pesanan Berjalan
                  </span>
                </div>
              </div>

              {/* Status Filters */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-xs">
                {["all", "Sedang Dikerjakan", "Menunggu Konfirmasi", "Selesai"].map((st) => (
                  <button
                    key={st}
                    onClick={() => setOrderFilter(st)}
                    className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap ${
                      orderFilter === st
                        ? "bg-[#1683FF] text-white shadow-xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {st === "all" ? "Semua Status" : st}
                  </button>
                ))}
              </div>

              {/* Orders List */}
              <div className="space-y-3 pt-1">
                {providerOrders
                  .filter(o => orderFilter === "all" || o.status === orderFilter)
                  .map((order) => {
                    const isCompleted = order.status === "Selesai";
                    const isPendingConfirmation = order.status === "Menunggu Konfirmasi";

                    return (
                      <div 
                        key={order.id} 
                        className="p-4 sm:p-5 rounded-2xl border border-slate-200 bg-[#F8FAFC] flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 hover:border-blue-200 transition"
                      >
                        <div className="flex items-start sm:items-center gap-3.5">
                          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-xs shrink-0 ${
                            isCompleted ? "bg-emerald-500 text-white" : isPendingConfirmation ? "bg-amber-500 text-white" : "bg-[#1683FF] text-white"
                          }`}>
                            {order.orderNumber.slice(-4)}
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs font-bold text-slate-900">{order.customerName}</span>
                              <span className="text-[10px] text-slate-400 font-mono">({order.orderNumber})</span>
                              <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${
                                isCompleted 
                                  ? "bg-emerald-100 text-emerald-800"
                                  : isPendingConfirmation
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-blue-100 text-blue-800"
                              }`}>
                                {order.status}
                              </span>
                            </div>
                            <h4 className="font-bold text-sm text-slate-900 mt-1">{order.serviceTitle}</h4>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {order.packageName} &middot; Batas Waktu: {order.deadline}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-between lg:justify-end w-full lg:w-auto gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-200">
                          <div className="text-left lg:text-right">
                            <div className="text-xs font-black text-slate-900">{formatIDR(order.amount)}</div>
                            <div className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1 lg:justify-end">
                              <ShieldCheck className="w-3 h-3 text-emerald-500" />
                              <span>{isCompleted ? "Hak Bayar Masuk" : "Pembayaran Terkonfirmasi"}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setSelectedOrderForDetail(order)}
                              className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold rounded-xl transition shadow-2xs inline-flex items-center gap-1.5 cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Detail &amp; Timeline</span>
                            </button>

                            {order.status === "Sedang Dikerjakan" && (
                              <button
                                onClick={() => {
                                  const updated = providerOrders.map(o => o.id === order.id ? {
                                    ...o,
                                    status: "Menunggu Konfirmasi",
                                    timeline: [
                                      ...o.timeline,
                                      { status: "Menunggu Konfirmasi", time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }), note: "Hasil pekerjaan diserahkan. Menunggu konfirmasi klien." }
                                    ]
                                  } : o);
                                  setProviderOrders(updated);
                                  addToast?.("Status Diperbarui", "Hasil pekerjaan telah diserahkan ke klien.");
                                }}
                                className="px-3.5 py-2 bg-[#1683FF] hover:bg-[#0F6FE5] text-white text-xs font-bold rounded-xl transition shadow-2xs inline-flex items-center gap-1.5 cursor-pointer"
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                                <span>Serahkan Hasil</span>
                              </button>
                            )}

                            <Link
                              href="/chat?room=order-room-102&role=helper"
                              className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition shadow-2xs inline-flex items-center gap-1.5"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Chat</span>
                            </Link>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* VIEW: NOTIFICATIONS (PUSAT NOTIFIKASI PESANAN)                */}
          {/* ============================================================ */}
          {activeMenu === "notifications" && (
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-base text-slate-900">Notifikasi Masuk</h3>
                  <p className="text-xs text-slate-500">Pemberitahuan penting tentang status pesanan, pembayaran, dan ulasan</p>
                </div>
                <button
                  onClick={() => {
                    setProviderNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
                    addToast?.("Semua Dibaca", "Seluruh notifikasi ditandai telah dibaca.");
                  }}
                  className="text-xs font-bold text-[#1683FF] hover:underline"
                >
                  Tandai Semua Dibaca
                </button>
              </div>

              <div className="divide-y divide-slate-100">
                {providerNotifications.map((notif) => (
                  <div key={notif.id} className={`py-3.5 flex items-start gap-3.5 ${!notif.isRead ? "bg-blue-50/40 -mx-4 px-4 rounded-xl" : ""}`}>
                    <div className="w-9 h-9 rounded-xl bg-blue-100 text-[#1683FF] flex items-center justify-center shrink-0 mt-0.5">
                      <Bell className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-xs font-bold text-slate-900 truncate">{notif.title}</h4>
                        <span className="text-[10px] text-slate-400 shrink-0">{notif.time}</span>
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{notif.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* VIEW: CHAT (KOMUNIKASI KLIEN)                                 */}
          {/* ============================================================ */}
          {activeMenu === "chat" && (
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs space-y-4">
              <div>
                <h3 className="font-bold text-base text-slate-900">Ruang Percakapan Klien</h3>
                <p className="text-xs text-slate-500">Diskusi langsung dengan klien mengenai brief, revisi, dan serah terima file</p>
              </div>

              <div className="space-y-3">
                <div className="p-4 rounded-2xl border border-slate-200 hover:border-blue-300 transition flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-800 font-bold flex items-center justify-center text-xs">
                        DA
                      </div>
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white absolute bottom-0 right-0" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">Dimas Anggara</div>
                      <p className="text-xs text-slate-500 line-clamp-1">Halo kak, untuk logo konsep minimalisnya apa sudah mulai disketsa?</p>
                    </div>
                  </div>

                  <Link
                    href="/chat?room=order-room-101&role=helper"
                    className="px-4 py-2 bg-[#1683FF] hover:bg-[#0F6FE5] text-white text-xs font-bold rounded-xl transition shrink-0"
                  >
                    Buka Chat
                  </Link>
                </div>

                <div className="p-4 rounded-2xl border border-slate-200 hover:border-blue-300 transition flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-800 font-bold flex items-center justify-center text-xs">
                        SN
                      </div>
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-400 border-2 border-white absolute bottom-0 right-0" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">Siti Nurhaliza</div>
                      <p className="text-xs text-slate-500 line-clamp-1">Terima kasih kak, file PDF cetak sudah kami terima dengan baik.</p>
                    </div>
                  </div>

                  <Link
                    href="/chat?room=order-room-102&role=helper"
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition shrink-0"
                  >
                    Buka Chat
                  </Link>
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

                <div className="px-5 sm:px-6 pb-5 sm:pb-6 relative z-10 flex flex-col sm:flex-row sm:items-end gap-3.5 sm:gap-4">
                  <div className="-mt-10 sm:-mt-12 relative group shrink-0 self-start">
                    <img
                      src={provider.avatar}
                      alt={provider.name}
                      className="w-20 h-20 sm:w-22 sm:h-22 rounded-2xl object-cover border-4 border-white shadow-md bg-white"
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

                  <div className="min-w-0 pt-2 sm:pt-0 sm:pb-1">
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

          {/* ============================================================ */}
          {/* VIEW 10: PROMOSI SAYA (FEATURED SERVICE PLACEMENT)           */}
          {/* ============================================================ */}
          {activeMenu === "promotions" && (
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-base text-slate-900">Promosi Layanan Saya &amp; Featured Landing Page</h3>
                  <p className="text-xs text-slate-500">
                    Dapatkan penempatan khusus di etalase Jasa Unggulan Beranda Bantuin untuk meningkatkan pesanan klien.
                  </p>
                </div>
                <Link
                  href="/jasa/dashboard/promosi/buat"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white text-xs font-bold shadow-xs transition self-start sm:self-auto"
                >
                  <Rocket className="w-4 h-4" />
                  <span>Promosikan Layanan Jasa</span>
                </Link>
              </div>

              {/* Prinsip Integritas Promosi */}
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-amber-950">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Prinsip Integritas Promosi Bantuin:</span>
                </div>
                <p className="leading-relaxed text-[11px] text-amber-800">
                  Promosi hanya mempengaruhi <strong>penempatan/slot visual etalase</strong> di beranda. Promosi <strong>TIDAK PERNAH</strong> mengubah skor rating, jumlah ulasan, atau skor reputasi organik Anda. Listing berbayar selalu diberi label transparan &ldquo;Promosi / Unggulan&rdquo;.
                </p>
              </div>

              {/* Status Promosi Jasa Saat Ini */}
              {providerPromotions.length > 0 ? (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Daftar Promosi Layanan Anda:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {providerPromotions.map((prm) => {
                      const isActive = prm.status === "active";
                      const isPending = prm.status === "pending_payment";
                      const isExpired = prm.status === "expired";
                      const isCancelled = prm.status === "cancelled";

                      return (
                        <div key={prm.id} className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-900 truncate max-w-[200px]">
                              {prm.targetTitle || "Layanan Jasa"}
                            </span>
                            <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md ${
                              isActive
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : isPending
                                ? "bg-amber-50 text-amber-700 border border-amber-200 animate-pulse"
                                : isExpired
                                ? "bg-slate-100 text-slate-600 border border-slate-200"
                                : "bg-rose-50 text-rose-600 border border-rose-200"
                            }`}>
                              {isActive ? "Sedang Tayang" : isPending ? "Menunggu Bayar" : isExpired ? "Kedaluwarsa" : isCancelled ? "Dibatalkan" : prm.status}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 space-y-0.5">
                            <div>Paket: <strong>{prm.packageName}</strong> &middot; Biaya: <strong>{formatIDR(prm.amount)}</strong></div>
                            {prm.startDate && prm.endDate && (
                              <div>Periode: {new Date(prm.startDate).toLocaleDateString("id-ID", { day: "numeric", month: "short" })} - {new Date(prm.endDate).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}</div>
                            )}
                            {prm.paymentId && (
                              <div className="text-[10px] text-slate-400 font-mono">ID Bayar: {prm.paymentId} (Gateway)</div>
                            )}
                          </div>
                          <div className="pt-1.5 flex items-center justify-between border-t border-slate-100">
                            <span className="text-[10px] text-slate-400">Target: Jasa Freelance</span>
                            {isPending ? (
                              <Link
                                href={`/jasa/dashboard/promosi/buat?serviceId=${prm.targetId}`}
                                className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-bold shadow-2xs transition flex items-center gap-1"
                              >
                                <CreditCard className="w-3 h-3" />
                                <span>Lanjutkan Pembayaran</span>
                              </Link>
                            ) : isActive ? (
                              <button
                                type="button"
                                onClick={() => handleTogglePromoStatus(prm.id)}
                                className="text-[11px] font-bold text-[#1683FF] hover:underline cursor-pointer"
                              >
                                Jeda Promosi
                              </button>
                            ) : (
                              <Link
                                href={`/jasa/dashboard/promosi/buat?serviceId=${prm.targetId}`}
                                className="text-[11px] font-bold text-[#1683FF] hover:underline flex items-center gap-1"
                              >
                                <Rocket className="w-3 h-3" />
                                <span>Promosikan Lagi</span>
                              </Link>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="p-8 rounded-2xl border border-dashed border-slate-200 text-center space-y-2">
                  <Megaphone className="w-10 h-10 text-slate-300 mx-auto" />
                  <h4 className="text-sm font-bold text-slate-800">Belum Ada Layanan yang Dipromosikan</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Pilih layanan terbaik dari katalog Anda untuk ditampilkan di etalase rekomendasi utama platform.
                  </p>
                  <Link
                    href="/jasa/dashboard/promosi/buat"
                    className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white text-xs font-bold transition"
                  >
                    <Plus className="w-3.5 h-3.5" /> Pilih Jasa untuk Dipromosikan
                  </Link>
                </div>
              )}

              {/* Pilihan Paket Promosi Resmi */}
              <div className="pt-2">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">Pilihan Paket Promosi Layanan:</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {promoPackages.map((pkg) => (
                    <div
                      key={pkg.id}
                      className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                        pkg.isPopular
                          ? "border-[#1683FF] bg-blue-50/20 ring-2 ring-[#1683FF]/15 shadow-sm"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900">{pkg.name}</span>
                          {pkg.badgeText && (
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-[#1683FF] text-white">
                              {pkg.badgeText}
                            </span>
                          )}
                        </div>
                        <div className="text-xl font-black text-slate-900">{formatIDR(pkg.price)}</div>
                        <p className="text-[11px] text-slate-500 leading-relaxed">{pkg.description}</p>
                        <ul className="space-y-1.5 pt-2 border-t border-slate-100">
                          {pkg.features.map((feat, idx) => (
                            <li key={idx} className="flex items-center gap-2 text-[11px] text-slate-600">
                              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span>{feat}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <Link
                        href={`/jasa/dashboard/promosi/buat?pkg=${pkg.id}`}
                        className={`mt-4 w-full py-2.5 rounded-xl text-xs font-bold transition text-center block cursor-pointer ${
                          pkg.isPopular
                            ? "bg-[#1683FF] hover:bg-[#0F6FE5] text-white shadow-2xs"
                            : "bg-slate-100 hover:bg-slate-200 text-slate-800"
                        }`}
                      >
                        Pilih Paket Ini
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* VIEW 13: LAPORAN & SENGKETA (MEDIASI PENGADUAN)              */}
          {/* ============================================================ */}
          {activeMenu === "disputes" && (
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-base text-slate-900">Pusat Laporan &amp; Mediasi Sengketa</h3>
                  <p className="text-xs text-slate-500">
                    Laporkan kendala transaksi, pelanggaran kesepakatan brief, atau permintaan bayar di luar platform.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsDisputeModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition cursor-pointer self-start sm:self-auto"
                >
                  <AlertTriangle className="w-4 h-4" />
                  <span>Buat Laporan Baru</span>
                </button>
              </div>

              {/* Daftar Laporan Aktif */}
              <div className="space-y-3">
                {providerReports.map((rep) => {
                  const isOpen = rep.status === "open" || rep.status === "investigating";
                  return (
                    <div key={rep.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-slate-400 font-bold">#{rep.id}</span>
                          <span className="font-bold text-slate-900">{rep.reason}</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isOpen ? "bg-amber-50 text-amber-700 border border-amber-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        }`}>
                          {isOpen ? "Dalam Investigasi" : "Selesai"}
                        </span>
                      </div>
                      <p className="text-slate-600 leading-relaxed text-[11px]">{rep.description}</p>
                      <div className="pt-2 flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-200/60">
                        <span>Pihak Terlapor: <strong className="text-slate-700">{rep.targetName}</strong></span>
                        <span>Dilaporkan: {new Date(rep.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}</span>
                      </div>
                    </div>
                  );
                })}

                {providerReports.length === 0 && (
                  <div className="text-center py-10 text-slate-400 text-xs">
                    Tidak ada laporan sengketa aktif. Seluruh pengerjaan jasa Anda berjalan lancar.
                  </div>
                )}
              </div>
            </div>
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
                    onChange={(e) => {
                      setCatalogForm({ ...catalogForm, category: e.target.value });
                    }}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#1683FF]"
                  >
                    <option value="Logo">Logo</option>
                    <option value="Kemasan">Kemasan</option>
                    <option value="Sosial Media">Sosial Media</option>
                    <option value="Cetak">Cetak</option>
                    <option value="UI/UX">UI/UX</option>
                    <option value="Web & IT">Web & IT</option>
                    <option value="Fotografi">Fotografi</option>
                    <option value="Servis">Servis & Teknisi</option>
                    <option value="Pendidikan">Pendidikan & Tutor</option>
                    <option value="Musik">Musik & Audio</option>
                    <option value="Umum">Umum</option>
                    <option value="__CUSTOM__">+ Buat Kategori Baru...</option>
                  </select>

                  {catalogForm.category === "__CUSTOM__" && (
                    <div className="mt-2 space-y-1.5 animate-in fade-in duration-150">
                      <input
                        type="text"
                        required
                        placeholder="Nama kategori kustom (misal: Animasi 3D)"
                        value={customCategoryName}
                        onChange={(e) => setCustomCategoryName(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-blue-300 bg-blue-50/30 text-xs focus:outline-none focus:border-[#1683FF]"
                      />
                      {customCategoryName && (() => {
                        const ResolvedIcon = resolveCategoryIcon(customCategoryName);
                        return (
                          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#EAF4FF] rounded-lg text-[11px] font-semibold text-[#1683FF] border border-[#DCEAF7]">
                            <ResolvedIcon className="w-3.5 h-3.5 shrink-0" />
                            <span>Icon sistem: {customCategoryName}</span>
                          </div>
                        );
                      })()}
                    </div>
                  )}
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

              {/* SECTION: TIPE LAYANAN & LOKASI FISIK */}
              <div className="pt-2 border-t border-slate-100 space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-900 mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#1683FF]" />
                      <span>Mode &amp; Lokasi Pengerjaan Jasa</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal">Wajib untuk layanan tatap muka</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: "onsite", label: "Di Studio / Tempat Saya" },
                      { id: "customer_location", label: "Panggilan ke Klien" },
                      { id: "online", label: "100% Online / Remote" },
                      { id: "hybrid", label: "Hybrid (Online/Onsite)" },
                    ].map((type) => (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => setCatalogForm({ ...catalogForm, locationType: type.id })}
                        className={`p-2 rounded-xl text-[11px] font-bold border text-center transition ${
                          catalogForm.locationType === type.id
                            ? "bg-[#1683FF] text-white border-[#1683FF] shadow-2xs"
                            : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>

                {catalogForm.locationType !== "online" ? (
                  <div className="p-3.5 rounded-2xl bg-blue-50/50 border border-blue-100 space-y-2.5 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-800">Koordinat &amp; Alamat Layanan</span>
                      <button
                        type="button"
                        onClick={handleDetectCatalogLocation}
                        disabled={isDetectingGps}
                        className="px-2.5 py-1 rounded-lg bg-white border border-blue-200 text-[#1683FF] hover:bg-blue-50 text-[10px] font-bold transition flex items-center gap-1 shadow-2xs"
                      >
                        {isDetectingGps ? (
                          <Loader2 className="w-3 h-3 animate-spin text-[#1683FF]" />
                        ) : (
                          <Navigation className="w-3 h-3 text-[#1683FF]" />
                        )}
                        <span>{isDetectingGps ? "Mendeteksi..." : "Gunakan Lokasi GPS Saya"}</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <div>
                        <span className="text-slate-400 block mb-0.5">Latitude:</span>
                        <input
                          type="text"
                          readOnly
                          value={catalogForm.latitude || "-"}
                          className="w-full p-1.5 rounded-lg bg-white border border-slate-200 font-mono text-slate-700 text-[10px]"
                        />
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-0.5">Longitude:</span>
                        <input
                          type="text"
                          readOnly
                          value={catalogForm.longitude || "-"}
                          className="w-full p-1.5 rounded-lg bg-white border border-slate-200 font-mono text-slate-700 text-[10px]"
                        />
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-600 block text-[11px] font-semibold mb-1">Alamat / Patokan Studio:</span>
                      <input
                        type="text"
                        placeholder="Contoh: Jl. Sudirman No. 42, Purwokerto (Dekat Alun-alun)"
                        value={catalogForm.address}
                        onChange={(e) => setCatalogForm({ ...catalogForm, address: e.target.value })}
                        className="w-full p-2 rounded-xl bg-white border border-slate-200 text-xs focus:outline-none focus:border-[#1683FF]"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500 flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Layanan ini dikerjakan secara digital/remote tanpa kewajiban kehadiran fisik.</span>
                  </div>
                )}
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

      {/* ============================================================ */}
      {/* MODAL 5: DETAIL PESANAN & TIMELINE (CANONICAL FLOW)          */}
      {/* ============================================================ */}
      {selectedOrderForDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-mono font-bold text-[#1683FF] uppercase tracking-wider block">
                  {selectedOrderForDetail.orderNumber}
                </span>
                <h3 className="text-sm font-extrabold text-slate-900">{selectedOrderForDetail.serviceTitle}</h3>
              </div>
              <button 
                onClick={() => setSelectedOrderForDetail(null)} 
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Info Summary */}
            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
              <div>
                <span className="text-slate-400 block text-[11px]">Klien Pemesan:</span>
                <span className="font-bold text-slate-900">{selectedOrderForDetail.customerName}</span>
                <span className="text-[10px] text-slate-500 block">{selectedOrderForDetail.customerPhone}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Paket & Nilai Transaksi:</span>
                <span className="font-bold text-slate-900">{selectedOrderForDetail.packageName}</span>
                <span className="text-xs font-black text-[#1683FF] block">{formatIDR(selectedOrderForDetail.amount)}</span>
              </div>
            </div>

            {/* Client Brief */}
            <div>
              <h4 className="text-xs font-bold text-slate-900 mb-1 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-[#1683FF]" />
                <span>Brief & Catatan Klien</span>
              </h4>
              <p className="text-xs text-slate-700 bg-blue-50/50 border border-blue-100 p-3 rounded-xl leading-relaxed">
                {selectedOrderForDetail.brief}
              </p>
            </div>

            {/* Canonical Order Timeline */}
            <div>
              <h4 className="text-xs font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-600" />
                <span>Timeline Status Transaksi</span>
              </h4>
              <div className="space-y-3 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 pl-7">
                {selectedOrderForDetail.timeline?.map((step, sIdx) => (
                  <div key={sIdx} className="relative">
                    <div className="absolute -left-7 top-1 w-3.5 h-3.5 rounded-full bg-[#1683FF] border-2 border-white ring-2 ring-blue-100" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">{step.status}</span>
                        <span className="text-[10px] text-slate-400">{step.time}</span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5">{step.note}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  addToast?.("Laporan Terkirim", "Pengaduan pesanan diteruskan ke Admin Bantuin untuk pemeriksaan.");
                  setSelectedOrderForDetail(null);
                }}
                className="text-xs font-bold text-rose-600 hover:bg-rose-50 px-3 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Laporkan Masalah / Sengketa</span>
              </button>

              <div className="flex items-center gap-2">
                <Link
                  href="/chat?room=order-room-102&role=helper"
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition"
                >
                  Chat Klien
                </Link>
                <button
                  type="button"
                  onClick={() => setSelectedOrderForDetail(null)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 6: PROMOSIKAN JASA (TRIPAY PAYMENT GATEWAY WORKFLOW)    */}
      {/* ============================================================ */}
      {isPromoModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                  promoModalStep === "success" 
                    ? "bg-emerald-50 text-emerald-600" 
                    : promoModalStep === "failed" || promoModalStep === "cancelled"
                    ? "bg-rose-50 text-rose-600"
                    : promoModalStep === "waiting_payment"
                    ? "bg-amber-50 text-amber-600"
                    : "bg-blue-50 text-[#1683FF]"
                }`}>
                  {promoModalStep === "success" ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : promoModalStep === "failed" ? (
                    <AlertTriangle className="w-4 h-4" />
                  ) : promoModalStep === "waiting_payment" ? (
                    <CreditCard className="w-4 h-4" />
                  ) : (
                    <Rocket className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">
                    {promoModalStep === "form" && "Promosikan Layanan Jasa"}
                    {promoModalStep === "waiting_payment" && "Pembayaran Promosi"}
                    {promoModalStep === "success" && "Pembayaran Berhasil"}
                    {promoModalStep === "failed" && "Pembayaran Gagal"}
                    {promoModalStep === "expired" && "Pembayaran Kedaluwarsa"}
                    {promoModalStep === "cancelled" && "Pembayaran Dibatalkan"}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {promoModalStep === "form" && "Penempatan etalase unggulan di Beranda Bantuin"}
                    {promoModalStep === "waiting_payment" && "Menunggu konfirmasi gateway pembayaran resmi"}
                    {promoModalStep === "success" && "Promosi layanan berhasil diaktifkan"}
                    {promoModalStep === "failed" && "Pembayaran belum berhasil diproses"}
                    {promoModalStep === "expired" && "Batas waktu transaksi pembayaran telah habis"}
                    {promoModalStep === "cancelled" && "Transaksi pembayaran telah dibatalkan"}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsPromoModalOpen(false)} 
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* ────────────────────────────────────────────────────────── */}
            {/* STATE 1: FORM PEMILIHAN JASA & PAKET                       */}
            {/* ────────────────────────────────────────────────────────── */}
            {promoModalStep === "form" && (
              <form onSubmit={handleCreatePromotionPayment} className="space-y-4">
                {/* Pilih Layanan */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Pilih Layanan dari Katalog</label>
                  <select
                    value={promoTargetServiceId}
                    onChange={(e) => setPromoTargetServiceId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-[#1683FF]"
                  >
                    {provider.catalog?.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.title} &middot; {formatIDR(cat.price)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Pilih Durasi Paket Promosi */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Pilih Durasi Paket Promosi</label>
                  <div className="grid grid-cols-3 gap-2.5">
                    {promoPackages.map((pkg) => {
                      const isSelected = selectedPromoPkgId === pkg.id;
                      return (
                        <button
                          key={pkg.id}
                          type="button"
                          onClick={() => setSelectedPromoPkgId(pkg.id)}
                          className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between ${
                            isSelected
                              ? "border-[#1683FF] bg-blue-50/40 ring-2 ring-[#1683FF]/20"
                              : "border-slate-200 bg-white hover:border-slate-300"
                          }`}
                        >
                          <div>
                            <span className="text-[11px] font-bold text-slate-800 block">{pkg.name}</span>
                            <span className="text-xs font-extrabold text-[#1683FF] block mt-1">{formatIDR(pkg.price)}</span>
                          </div>
                          <span className="text-[10px] text-slate-400 mt-2 block">{pkg.durationDays} Hari Tayang</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Pilih Kanal Pembayaran Tripay */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Kanal Pembayaran Resmi</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedPromoChannel("qris")}
                      className={`p-2.5 rounded-xl border text-left text-xs font-semibold flex items-center gap-2 transition ${
                        selectedPromoChannel === "qris"
                          ? "border-[#1683FF] bg-blue-50/50 text-[#1683FF] font-bold"
                          : "border-slate-200 hover:border-slate-300 text-slate-700"
                      }`}
                    >
                      <QrCode className="w-4 h-4 shrink-0" />
                      <span>QRIS (Semua E-Wallet)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedPromoChannel("bca_va")}
                      className={`p-2.5 rounded-xl border text-left text-xs font-semibold flex items-center gap-2 transition ${
                        selectedPromoChannel === "bca_va"
                          ? "border-[#1683FF] bg-blue-50/50 text-[#1683FF] font-bold"
                          : "border-slate-200 hover:border-slate-300 text-slate-700"
                      }`}
                    >
                      <CreditCard className="w-4 h-4 shrink-0" />
                      <span>Virtual Account Bank</span>
                    </button>
                  </div>
                </div>

                {/* Rincian Ringkasan Biaya */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Metode Pembayaran:</span>
                    <span className="font-bold text-slate-900">Payment Gateway Resmi</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Target Penempatan:</span>
                    <span className="font-bold text-[#1683FF]">Jasa Unggulan Beranda</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-900 pt-2 border-t border-slate-200 font-bold">
                    <span>Total Biaya Promosi:</span>
                    <span className="text-sm font-black text-[#1683FF]">
                      {formatIDR(promoPackages.find((p) => p.id === selectedPromoPkgId)?.price || 140000)}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsPromoModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isCreatingPayment}
                    className="px-5 py-2.5 rounded-xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white text-xs font-bold shadow-2xs transition cursor-pointer flex items-center gap-1.5 disabled:opacity-60"
                  >
                    {isCreatingPayment ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Memproses Pembayaran...</span>
                      </>
                    ) : (
                      <>
                        <Rocket className="w-3.5 h-3.5" />
                        <span>Bayar &amp; Aktifkan Promosi Sekarang</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* ────────────────────────────────────────────────────────── */}
            {/* STATE 2: MENUNGGU PEMBAYARAN (TRIPAY GATEWAY WAITING)     */}
            {/* ────────────────────────────────────────────────────────── */}
            {promoModalStep === "waiting_payment" && activePayment && (
              <div className="space-y-4 text-xs">
                
                {/* Status Indicator */}
                <div className="flex items-center justify-between p-3 rounded-2xl bg-amber-50/80 border border-amber-200">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                    </span>
                    <span className="font-bold text-amber-900">Menunggu Pembayaran...</span>
                  </div>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-300">
                    PENDING
                  </span>
                </div>

                {/* Detail Transaksi */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">ID Transaksi:</span>
                    <span className="font-mono font-bold text-slate-900">{activePayment.id}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Referensi Transaksi:</span>
                    <span className="font-mono font-semibold text-slate-700">{activePayment.reference || activePayment.externalReference}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Promosi:</span>
                    <span className="font-bold text-slate-900 truncate max-w-[200px]">
                      {activePayment.metadata?.targetTitle || activePromotion?.targetTitle || "Layanan Jasa"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Paket:</span>
                    <span className="font-semibold text-slate-800">
                      {activePayment.metadata?.packageName || activePromotion?.packageName || "Paket Mingguan 7 Hari"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-slate-200 font-bold">
                    <span className="text-slate-700">Total Pembayaran:</span>
                    <span className="text-base font-black text-[#1683FF]">{formatIDR(activePayment.amount)}</span>
                  </div>
                </div>

                {/* Checkout Gateway Actions */}
                <div className="p-4 rounded-2xl border border-blue-100 bg-blue-50/40 text-center space-y-2.5">
                  <p className="text-[11px] text-slate-600">
                    Selesaikan pembayaran dengan membuka tautan pembayaran resmi atau gunakan aplikasi perbankan/e-wallet Anda.
                  </p>
                  
                  {activePayment.paymentUrl && (
                    <a
                      href={activePayment.paymentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white font-bold text-xs shadow-xs transition"
                    >
                      <span>Lanjutkan Pembayaran Resmi</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}

                  {activePayment.payCode && (
                    <div className="p-2.5 rounded-xl bg-white border border-slate-200 font-mono text-center">
                      <span className="text-[10px] text-slate-400 block">Kode Bayar / Virtual Account:</span>
                      <span className="text-sm font-extrabold text-slate-900 tracking-wider">{activePayment.payCode}</span>
                    </div>
                  )}
                </div>

                {/* Action Buttons: Cek Status & Batalkan */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleCheckPaymentStatus}
                    disabled={isCheckingPayment}
                    className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-2xs transition flex items-center justify-center gap-1.5 disabled:opacity-60 cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isCheckingPayment ? "animate-spin" : ""}`} />
                    <span>Cek Status Pembayaran</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelPayment}
                    className="py-2.5 px-3 rounded-xl border border-rose-200 bg-rose-50/50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition cursor-pointer"
                  >
                    Batalkan Transaksi
                  </button>
                </div>

                {/* ────────────────────────────────────────────────────────── */}
                {/* [DEVELOPMENT MOCK ONLY] SANDBOX SIMULATOR                  */}
                {/* ────────────────────────────────────────────────────────── */}
                <div className="p-3.5 rounded-2xl border-2 border-dashed border-indigo-200 bg-indigo-50/40 space-y-2 mt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold text-indigo-700 tracking-wider uppercase">
                      ⚡ DEVELOPMENT MOCK ONLY
                    </span>
                    <span className="text-[9px] text-indigo-500 font-semibold">Simulasi Callback Gateway</span>
                  </div>
                  <p className="text-[10px] text-slate-600 leading-snug">
                    Gunakan kontrol sandbox di bawah untuk menguji respons webhook sebelum integrasi server live:
                  </p>
                  <div className="grid grid-cols-3 gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => handleSimulateDevGateway("paid")}
                      disabled={isCheckingPayment}
                      className="py-1.5 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] shadow-2xs transition cursor-pointer text-center"
                    >
                      ✓ Bayar Sukses
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSimulateDevGateway("failed")}
                      disabled={isCheckingPayment}
                      className="py-1.5 px-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] shadow-2xs transition cursor-pointer text-center"
                    >
                      ✕ Bayar Gagal
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSimulateDevGateway("expired")}
                      disabled={isCheckingPayment}
                      className="py-1.5 px-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[10px] shadow-2xs transition cursor-pointer text-center"
                    >
                      ⏰ Expired
                    </button>
                  </div>
                </div>

              </div>
            )}

            {/* ────────────────────────────────────────────────────────── */}
            {/* STATE 3: PEMBAYARAN BERHASIL (SUCCESS & ACTIVATED)         */}
            {/* ────────────────────────────────────────────────────────── */}
            {promoModalStep === "success" && (
              <div className="space-y-4 text-center py-2">
                <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-xs animate-in zoom-in-75 duration-200">
                  <CheckCircle className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="text-base font-extrabold text-slate-900">Pembayaran Berhasil!</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Pembayaran terverifikasi sistem resmi. Promosi layanan telah aktif di Landing Page.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left text-xs space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Promosi:</span>
                    <span className="font-bold text-slate-900 truncate max-w-[200px]">
                      {activePromotion?.targetTitle || "Desain Logo & Identitas Brand"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Paket:</span>
                    <span className="font-semibold text-slate-800">
                      {activePromotion?.packageName || "Paket Mingguan — 7 Hari"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Total Biaya:</span>
                    <span className="font-extrabold text-slate-900">
                      {formatIDR(activePromotion?.amount || activePayment?.amount || 140000)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Status Promosi:</span>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-extrabold uppercase text-[10px]">
                      AKTIF
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-slate-200 text-[11px]">
                    <span className="text-slate-500">Tanggal Aktif:</span>
                    <span className="font-bold text-slate-800">
                      {new Date(activePromotion?.startDate || Date.now()).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-500">Berlaku Sampai:</span>
                    <span className="font-bold text-[#1683FF]">
                      {new Date(activePromotion?.endDate || Date.now() + 7 * 86400000).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsPromoModalOpen(false);
                      setActiveMenu("promotions");
                    }}
                    className="py-2.5 px-3 rounded-xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white text-xs font-bold shadow-xs transition cursor-pointer"
                  >
                    Lihat Promosi Saya
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsPromoModalOpen(false);
                      setActiveMenu("overview");
                    }}
                    className="py-2.5 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition cursor-pointer"
                  >
                    Kembali ke Dashboard
                  </button>
                </div>
              </div>
            )}

            {/* ────────────────────────────────────────────────────────── */}
            {/* STATE 4: PEMBAYARAN GAGAL                                  */}
            {/* ────────────────────────────────────────────────────────── */}
            {promoModalStep === "failed" && (
              <div className="space-y-4 text-center py-2">
                <div className="w-14 h-14 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-xs">
                  <AlertTriangle className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="text-base font-extrabold text-slate-900">Pembayaran Gagal</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Pembayaran belum berhasil diproses oleh gateway.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-left text-xs text-rose-900 space-y-1">
                  <div className="font-bold">Keterangan:</div>
                  <p className="text-[11px] text-rose-800">
                    {activePayment?.failureReason || "Transaksi pembayaran tidak disetujui atau dibatalkan oleh bank penerbit."}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setPromoModalStep("form")}
                    className="py-2.5 px-3 rounded-xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white text-xs font-bold shadow-xs transition cursor-pointer"
                  >
                    Coba Bayar Lagi
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsPromoModalOpen(false)}
                    className="py-2.5 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition cursor-pointer"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            )}

            {/* ────────────────────────────────────────────────────────── */}
            {/* STATE 5: PEMBAYARAN KEDALUWARSA (EXPIRED)                  */}
            {/* ────────────────────────────────────────────────────────── */}
            {promoModalStep === "expired" && (
              <div className="space-y-4 text-center py-2">
                <div className="w-14 h-14 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto shadow-xs">
                  <Clock className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="text-base font-extrabold text-slate-900">Pembayaran Kedaluwarsa</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Batas waktu pembayaran telah habis. Transaksi ini tidak dapat digunakan lagi.
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setPromoModalStep("form")}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white text-xs font-bold shadow-xs transition cursor-pointer"
                  >
                    Buat Pembayaran Baru
                  </button>
                </div>
              </div>
            )}

            {/* ────────────────────────────────────────────────────────── */}
            {/* STATE 6: PEMBAYARAN DIBATALKAN (CANCELLED)                 */}
            {/* ────────────────────────────────────────────────────────── */}
            {promoModalStep === "cancelled" && (
              <div className="space-y-4 text-center py-2">
                <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center mx-auto shadow-xs">
                  <RotateCcw className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="text-base font-extrabold text-slate-900">Pembayaran Dibatalkan</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Transaksi pembayaran promosi telah dibatalkan. Promosi tetap tidak aktif.
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setPromoModalStep("form")}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white text-xs font-bold shadow-xs transition cursor-pointer"
                  >
                    Pilih Paket Promosi Kembali
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 7: BUAT LAPORAN & SENGKETA                            */}
      {/* ============================================================ */}
      {isDisputeModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">Buat Laporan / Sengketa</h3>
                  <p className="text-[11px] text-slate-500">Diteruskan langsung ke Admin Pusat Bantuin</p>
                </div>
              </div>
              <button 
                onClick={() => setIsDisputeModalOpen(false)} 
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateDispute} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Klien / Pihak Terlapor</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Dimas Anggara"
                  value={disputeForm.targetName}
                  onChange={(e) => setDisputeForm({ ...disputeForm, targetName: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nomor Pesanan Terkait (Opsional)</label>
                <select
                  value={disputeForm.orderId}
                  onChange={(e) => setDisputeForm({ ...disputeForm, orderId: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-rose-500"
                >
                  <option value="">-- Pilih Pesanan (Jika Ada) --</option>
                  {providerOrders.map((o) => (
                    <option key={o.id} value={o.orderNumber}>
                      {o.orderNumber} - {o.customerName} ({o.serviceTitle})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Alasan Pengaduan</label>
                <select
                  value={disputeForm.reason}
                  onChange={(e) => setDisputeForm({ ...disputeForm, reason: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-rose-500"
                >
                  <option value="Klien Membatalkan Sepihak di Tengah Proyek">Klien Membatalkan Sepihak di Tengah Proyek</option>
                  <option value="Permintaan Revisi di Luar Ruang Lingkup Brief">Permintaan Revisi di Luar Ruang Lingkup Brief</option>
                  <option value="Klien Tidak Merespons Konfirmasi Penyelesaian">Klien Tidak Merespons Konfirmasi Penyelesaian</option>
                  <option value="Ajakan Transaksi di Luar Platform">Ajakan Transaksi di Luar Platform</option>
                  <option value="Lainnya">Lainnya / Masalah Teknis</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Kronologi &amp; Rincian Masalah</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Jelaskan secara detail urutan kejadian dan kesepakatan awal dengan klien..."
                  value={disputeForm.description}
                  onChange={(e) => setDisputeForm({ ...disputeForm, description: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-rose-500 leading-relaxed"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsDisputeModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-2xs transition cursor-pointer flex items-center gap-1.5"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Kirim Laporan Pengaduan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      </div>
    </RoleGuard>
  );
}

