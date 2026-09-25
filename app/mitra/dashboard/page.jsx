"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import logoImg from "@/components/image/logo.png";
import { useApp } from "@/lib/context/AppContext";
import UnreadBadge from "@/components/ui/UnreadBadge";
import RoleGuard from "@/components/auth/RoleGuard";
import { formatIDR, formatDateIndo } from "@/lib/utils";
import { 
  getMitraStoreById, 
  saveMitraStoreData, 
  getAllMitraStores 
} from "@/lib/mock/mitraData";
import { 
  Store, 
  TrendingUp, 
  Package, 
  DollarSign, 
  PlusCircle, 
  Star, 
  CheckCircle2, 
  LayoutDashboard, 
  Receipt, 
  Wallet, 
  Settings, 
  ArrowLeft, 
  ShieldCheck, 
  Search, 
  SlidersHorizontal, 
  ChevronRight, 
  Eye, 
  Trash2, 
  ArrowUpRight, 
  Clock, 
  Check, 
  X, 
  Loader2, 
  AlertCircle, 
  CreditCard, 
  UserCheck, 
  Upload, 
  Camera, 
  ExternalLink, 
  MessageSquare, 
  Layers, 
  Image as ImageIcon, 
  Megaphone,
  Rocket, 
  MapPin, 
  Award, 
  Edit3, 
  MessageCircle, 
  RefreshCw,
  Plus,
  Briefcase,
  User,
  Bell,
  FileText,
  CheckCircle,
  AlertTriangle,
  MoreHorizontal,
} from "lucide-react";
import { resolveCategoryIcon } from "@/lib/services/categoryService";
import { promotionService } from "@/lib/services/promotionService";
import { paymentService } from "@/lib/services/paymentService";
import { reportService } from "@/lib/services/reportService";
import { imageService } from "@/lib/services/imageService";

export default function PartnerDashboardPage() {
  const router = useRouter();
  const { 
    rentals, 
    setRentals,
    currentUser, 
    mitraAvailableBalance, 
    mitraPendingBalance, 
    mitraTotalEarned, 
    withdrawFunds, 
    withdrawals, 
    customerDeposits,
    addToast 
  } = useApp();

  // Primary active verified rental store
  const [store, setStore] = useState(() => {
    return getMitraStoreById("mitra-kamera");
  });

  // Sync with storage on mount or custom event
  useEffect(() => {
    const handleStorageUpdate = () => {
      const updated = getMitraStoreById("mitra-kamera");
      if (updated) setStore(updated);
    };
    window.addEventListener("bantuin_mitra_store_updated", handleStorageUpdate);
    return () => window.removeEventListener("bantuin_mitra_store_updated", handleStorageUpdate);
  }, []);

  // Save changes to store state and localStorage
  const handleUpdateStore = (updatedStore, successMessage = "Data toko mitra berhasil diperbarui.") => {
    setStore(updatedStore);
    saveMitraStoreData(updatedStore);
    if (addToast) {
      addToast("Perubahan Disimpan", successMessage);
    }
  };

  // Active navigation menu (Identik dengan standar Dashboard Jasa)
  const [activeMenu, setActiveMenu] = useState("overview");
  const [isMobileMoreOpen, setIsMobileMoreOpen] = useState(false);
  // Menu IDs: overview, catalog, packages, gallery, orders, wallet, profile, reviews, settings

  // -------------------------------------------------------------
  // LOCAL PHOTO UPLOAD HANDLERS (AVATAR & BANNER SAMPUL TOKO)
  // -------------------------------------------------------------
  const handleAvatarUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const localUrl = URL.createObjectURL(file);
      const updated = { ...store, avatar: localUrl };
      handleUpdateStore(updated, "Foto logo/avatar toko berhasil diperbarui dari file lokal.");
    }
  };

  const handleBannerUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const localUrl = URL.createObjectURL(file);
      const updated = { ...store, coverImage: localUrl };
      handleUpdateStore(updated, "Banner sampul toko berhasil diperbarui dari file lokal.");
    }
  };

  // -------------------------------------------------------------
  // MODAL STATES & FORMS
  // -------------------------------------------------------------

  // 1. Modal: Tambah/Edit Katalog Unit Rental
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);
  const [editingCatalogItem, setEditingCatalogItem] = useState(null);
  const [catalogForm, setCatalogForm] = useState({
    name: "",
    category: "Kamera",
    price: 150000,
    depositAmount: 200000,
    unit: "/ hari",
    image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=600&q=80",
    photos: [
      "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&w=800&q=80"
    ],
    stockStatus: "Siap Sewa",
    tag: "Terlaris",
    desc: "",
    stockCount: 3,
    includedItems: "Kamera Body, 2 Baterai Original, Dual Charger, SD Card 64GB, Tas Kamera",
  });
  const [newPhotoUrlInput, setNewPhotoUrlInput] = useState("");

  // 2. Modal: Tambah/Edit Paket Sewa Bundling
  const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);
  const [packageForm, setPackageForm] = useState({
    name: "",
    tier: "Paket Hemat",
    price: 250000,
    duration: "1 Hari (24 Jam)",
    description: "",
    featuresStr: "Kamera Full Frame Mirrorless\nLensa Portrait F/1.8 Bokeh\n2x Baterai & Dual Charger\nSD Card 64GB High Speed\nTas Kamera Waterproof",
    isPopular: false,
  });

  // 3. Modal: Tambah Foto Galeri Showcase
  const [isGalleryModalOpen, setIsGalleryModalOpen] = useState(false);
  const [galleryForm, setGalleryForm] = useState({
    title: "",
    category: "Kamera & Rig",
    url: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80",
    description: "",
  });

  // 4. Modal: Tarik Saldo (Withdrawal)
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [withdrawForm, setWithdrawForm] = useState({
    amount: "200000",
    bankName: "BCA",
    accountNumber: "8820192841",
    accountHolder: store?.name || currentUser?.fullName || "Focus Lens Studio",
  });

  // 5. Modal: Balas Ulasan Pelanggan
  const [isReplyModalOpen, setIsReplyModalOpen] = useState(false);
  const [selectedReviewToReply, setSelectedReviewToReply] = useState(null);
  const [replyCommentText, setReplyCommentText] = useState("");

  // 6. Form State: Profil Toko
  const [profileForm, setProfileForm] = useState({
    name: store.name,
    tagline: store.tagline,
    category: store.category,
    address: store.address,
    whatsapp: store.whatsapp,
    operationalHours: store.operationalHours,
    about: store.about,
    securityDepositPolicy: store.securityDepositPolicy,
  });

  // 7. Form State: Pengaturan Operasional & Kebijakan
  const [settingsForm, setSettingsForm] = useState({
    isAcceptingRentals: true,
    minRentalDays: 1,
    requirePhysicalId: true,
    autoApproveDepositRefund: true,
    payoutBank: "BCA",
    payoutAccountNumber: "8820192841",
    payoutAccountHolder: store?.name || "Focus Lens Studio",
  });

  // Custom Category State (Section O & P)
  const [customCategoryName, setCustomCategoryName] = useState("");

  // Canonical Partner Handover Orders (Section M & J)
  const [partnerOrders, setPartnerOrders] = useState([
    {
      id: "ord-rnt-101",
      orderNumber: "BTN-RNT-88120",
      customerName: "Dimas Anggoro",
      customerPhone: "081234567890",
      unitName: "Sony Alpha A7 III (Body Only)",
      duration: "2 Hari",
      amount: 370000,
      depositAmount: 200000,
      status: "Sedang Disewa",
      meetingLocation: "Bantuin Point Rektorat",
      conditionBefore: "Mulus 98%, sensor bersih, baterai 100%, 1 gores halus pada case bawah.",
      conditionAfter: null,
      photoBefore: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=600&q=80",
      photoAfter: null,
      timeline: [
        { status: "Pesanan Dibayar", time: "2026-03-21 09:00", note: "Sewa Rp370.000 + Jaminan Rp200.000 terverifikasi via Payment Gateway Resmi" },
        { status: "Siap Diambil", time: "2026-03-21 10:30", note: "Unit disiapkan dan dicek oleh mitra toko" },
        { status: "Handover", time: "2026-03-21 14:00", note: "Penyewa bertemu di Bantuin Point Rektorat" },
        { status: "Barang Diserahkan", time: "2026-03-21 14:15", note: "Fisik unit dan kelengkapan diverifikasi bersama" },
        { status: "Sedang Disewa", time: "2026-03-21 14:20", note: "Masa sewa aktif hingga 23 Maret 2026 14:00" },
      ]
    },
    {
      id: "ord-rnt-102",
      orderNumber: "BTN-RNT-88121",
      customerName: "Rifky Fauzi",
      customerPhone: "082198765432",
      unitName: "DJI Ronin RS 3 Gimbal Stabilizer",
      duration: "1 Hari",
      amount: 95000,
      depositAmount: 150000,
      status: "Pemeriksaan",
      meetingLocation: "Toko Mitra - Focus Lens Studio",
      conditionBefore: "Berfungsi normal, motor stabil, kabel lengkap.",
      conditionAfter: "Unit kembali lengkap, motor normal, tidak ada lecet baru.",
      photoBefore: "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&w=600&q=80",
      photoAfter: "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&w=600&q=80",
      timeline: [
        { status: "Pesanan Dibayar", time: "2026-03-22 08:00", note: "Biaya sewa & deposit terverifikasi" },
        { status: "Barang Diserahkan", time: "2026-03-22 09:30", note: "Handover selesai" },
        { status: "Sedang Disewa", time: "2026-03-22 10:00", note: "Digunakan untuk video shoot" },
        { status: "Dikembalikan", time: "2026-03-23 09:30", note: "Unit diserahkan kembali oleh penyewa di toko" },
        { status: "Pemeriksaan", time: "2026-03-23 09:45", note: "Mitra sedang memeriksa kelengkapan fisik sebelum pelepasan deposit" },
      ]
    },
    {
      id: "ord-rnt-103",
      orderNumber: "BTN-RNT-88118",
      customerName: "Natasha Caroline",
      customerPhone: "085712349988",
      unitName: "Fujifilm X-T30 II + XF 18-55mm",
      duration: "1 Hari",
      amount: 125000,
      depositAmount: 200000,
      status: "Selesai",
      meetingLocation: "Bantuin Point Perpustakaan",
      conditionBefore: "Body mulus, sensor bersih.",
      conditionAfter: "Sempurna tanpa minus.",
      photoBefore: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=600&q=80",
      photoAfter: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=600&q=80",
      timeline: [
        { status: "Pesanan Dibayar", time: "2026-03-20 10:00", note: "Pembayaran terkonfirmasi" },
        { status: "Barang Diserahkan", time: "2026-03-20 11:00", note: "Diserahterimakan di titik temu" },
        { status: "Dikembalikan", time: "2026-03-21 11:00", note: "Penyewa mengembalikan unit tepat waktu" },
        { status: "Pemeriksaan", time: "2026-03-21 11:15", note: "Pemeriksaan lolos tanpa kerusakan" },
        { status: "Deposit Dikembalikan", time: "2026-03-21 11:20", note: "Deposit Rp200.000 dikembalikan otomatis ke saldo klien" },
        { status: "Selesai", time: "2026-03-21 11:25", note: "Hak sewa Rp125.000 masuk ke saldo dompet mitra" },
      ]
    }
  ]);
  const [selectedOrderForHandover, setSelectedOrderForHandover] = useState(null);
  const [orderFilter, setOrderFilter] = useState("all");

  // Notifications State
  const [partnerNotifications, setPartnerNotifications] = useState([
    {
      id: "mnotif-1",
      title: "Pesanan Sewa Masuk",
      message: "Dimas Anggoro telah membayar sewa Sony Alpha A7 III. Siapkan unit untuk serah terima.",
      time: "3 jam yang lalu",
      isRead: false,
    },
    {
      id: "mnotif-2",
      title: "Pemeriksaan Pengembalian",
      message: "Rifky Fauzi mengembalikan DJI Ronin RS 3. Segera konfirmasi kondisi fisik barang.",
      time: "1 hari yang lalu",
      isRead: false,
    },
    {
      id: "mnotif-3",
      title: "Hak Sewa Ditransfer",
      message: "Transaksi Natasha Caroline telah selesai. Hak sewa Rp125.000 telah masuk saldo dompet mitra.",
      time: "2 hari yang lalu",
      isRead: true,
    }
  ]);

  // Promotions State (Section AA, AB, AC, AD, AE)
  const promoPackages = useMemo(() => promotionService.getPackagesSync(), []);
  const [partnerPromotions, setPartnerPromotions] = useState(() => {
    return promotionService.getPromotionsSync({ ownerId: store?.id || "mitra-kamera" });
  });
  const [isPromoModalOpen, setIsPromoModalOpen] = useState(false);
  const [selectedPromoPackage, setSelectedPromoPackage] = useState(null);
  const [promoStep, setPromoStep] = useState("select"); // "select" | "review" | "pending_payment" | "success"
  const [currentPromoOrder, setCurrentPromoOrder] = useState(null);

  // Rental Unit Promotion State
  const [isRentalPromoModalOpen, setIsRentalPromoModalOpen] = useState(false);
  const [selectedRentalForPromo, setSelectedRentalForPromo] = useState(store.catalog?.[0]?.id || "");
  const [selectedRentalPromoPkgId, setSelectedRentalPromoPkgId] = useState("pkg-7d");

  // Partner Reports / Disputes State
  const [partnerReports, setPartnerReports] = useState(() => {
    return reportService.getReportsSync().filter(r => r.reporterId === store?.id || r.reporterId === "mitra-kamera");
  });
  const [isDisputeModalOpen, setIsDisputeModalOpen] = useState(false);
  const [disputeForm, setDisputeForm] = useState({
    targetName: "",
    orderId: "",
    reason: "Penyewa Merusak Unit / Lecet Parah",
    description: "",
  });

  // Search & Filter state for catalog view
  const [catalogSearch, setCatalogSearch] = useState("");
  const [selectedCatalogCategory, setSelectedCatalogCategory] = useState("Semua");

  // Filtered store catalog
  const filteredStoreCatalog = useMemo(() => {
    let list = store.catalog || [];
    if (selectedCatalogCategory !== "Semua") {
      list = list.filter((item) => 
        item.category?.toLowerCase() === selectedCatalogCategory.toLowerCase()
      );
    }
    if (catalogSearch.trim()) {
      const q = catalogSearch.toLowerCase();
      list = list.filter((item) => 
        item.name.toLowerCase().includes(q) || 
        (item.desc && item.desc.toLowerCase().includes(q)) ||
        (item.tag && item.tag.toLowerCase().includes(q))
      );
    }
    return list;
  }, [store.catalog, selectedCatalogCategory, catalogSearch]);

  // Listen for promotion and payment updates
  useEffect(() => {
    const handleSync = () => {
      const updated = promotionService.getPromotionsSync({ ownerId: store?.id || "mitra-kamera" });
      setPartnerPromotions(updated);
    };
    window.addEventListener("bantuin_promotions_updated", handleSync);
    window.addEventListener("bantuin_payments_updated", handleSync);
    return () => {
      window.removeEventListener("bantuin_promotions_updated", handleSync);
      window.removeEventListener("bantuin_payments_updated", handleSync);
    };
  }, [store?.id]);

  // Handlers for Promotions & Disputes
  const handlePurchaseRentalPromotion = async (e) => {
    e.preventDefault();
    const rentalItem = store.catalog?.find(c => c.id === selectedRentalForPromo) || store.catalog?.[0];
    const pkg = promoPackages.find(p => p.id === selectedRentalPromoPkgId) || promoPackages[1];
    try {
      await paymentService.createPromotionPayment({
        ownerId: store.id || "mitra-kamera",
        ownerName: store.name || "Focus Lens Studio",
        ownerType: "partner",
        targetType: "rental",
        targetId: rentalItem?.id || `rnt-${Date.now()}`,
        targetTitle: rentalItem?.name || "Unit Sewa",
        packageId: pkg.id,
        packageName: pkg.name,
        amount: pkg.price,
        paymentProvider: "tripay",
        paymentMethod: "qris",
      });
      const updated = promotionService.getPromotionsSync({ ownerId: store.id || "mitra-kamera" });
      setPartnerPromotions(updated);
      setIsRentalPromoModalOpen(false);
      addToast?.("Menunggu Pembayaran", `Transaksi promosi unit "${rentalItem?.name}" dibuat. Silakan selesaikan pembayaran.`);
    } catch (err) {
      addToast?.("Gagal Memproses Promosi", err.message || "Terjadi kesalahan.", "error");
    }
  };

  const handleTogglePromoStatus = async (promoId) => {
    await promotionService.toggleStatus(promoId);
    const updated = promotionService.getPromotionsSync({ ownerId: store.id || "mitra-kamera" });
    setPartnerPromotions(updated);
    addToast?.("Status Promosi Diperbarui", "Perubahan status tayang promosi berhasil disimpan.");
  };

  const handleCreatePartnerDispute = async (e) => {
    e.preventDefault();
    if (!disputeForm.reason || !disputeForm.description) {
      addToast?.("Form Belum Lengkap", "Alasan dan rincian masalah wajib diisi.", "error");
      return;
    }
    try {
      const newRep = await reportService.createReport({
        reporterId: store.id || "mitra-kamera",
        reporterName: store.name || "Focus Lens Studio",
        targetType: "customer",
        targetName: disputeForm.targetName || "Penyewa Terlapor",
        orderId: disputeForm.orderId || null,
        reason: disputeForm.reason,
        description: disputeForm.description,
      });
      setPartnerReports([newRep, ...partnerReports]);
      setIsDisputeModalOpen(false);
      setDisputeForm({ targetName: "", orderId: "", reason: "Penyewa Merusak Unit / Lecet Parah", description: "" });
      addToast?.("Laporan Terkirim", "Pengaduan sengketa sewa berhasil diteruskan ke Admin Bantuin.");
    } catch (err) {
      addToast?.("Gagal Mengirim Laporan", err.message || "Terjadi kesalahan.", "error");
    }
  };

  // Sidebar navigation links with dynamic count badges (14 Canonical Menus)
  const sidebarLinks = [
    { id: "overview", label: "Ringkasan & Analisis", icon: LayoutDashboard },
    { id: "catalog", label: "Katalog Unit Sewa", icon: Package, count: store.catalog?.length || 0 },
    { id: "packages", label: "Paket Bundling Sewa", icon: Layers, count: store.packages?.length || 0 },
    { id: "gallery", label: "Galeri Showcase Gear", icon: ImageIcon, count: store.portfolioPhotos?.length || 0 },
    { id: "orders", label: "Pesanan & Handover", icon: Receipt, count: partnerOrders.filter(o => o.status !== "Selesai").length },
    { id: "wallet", label: "Hak Pembayaran & Payout", icon: Wallet },
    { id: "profile", label: "Profil Toko Mitra", icon: Store },
    { id: "reviews", label: "Ulasan Pelanggan", icon: Star, count: store.reviews?.length || 0 },
    { id: "settings", label: "Pengaturan Toko", icon: Settings },
    { id: "promotions", label: "Promosikan Toko", icon: Megaphone, count: partnerPromotions.filter(p => p.targetType === "store" && p.status === "active").length > 0 ? "Aktif" : 0 },
    { id: "promote_rental", label: "Promosikan Unit Sewa", icon: Rocket, count: partnerPromotions.filter(p => p.targetType === "rental" && p.status === "active").length },
    { id: "chat", label: "Chat", icon: MessageSquare, count: 2 },
    { id: "notifications", label: "Notifikasi", icon: Bell, count: partnerNotifications.filter(n => !n.isRead).length },
    { id: "disputes", label: "Laporan & Sengketa", icon: AlertTriangle, count: partnerReports.filter(r => r.status === "open" || r.status === "investigating").length },
  ];

  // -------------------------------------------------------------
  // CRUD HANDLERS: KATALOG UNIT SEWA (DEDICATED FULL PAGE - SECTION 85)
  // -------------------------------------------------------------
  const handleOpenAddCatalog = () => {
    router.push("/mitra/dashboard/katalog/tambah");
  };

  const handleOpenEditCatalog = (item) => {
    router.push(`/mitra/dashboard/katalog/${item.id}/edit`);
  };

  const handleSetPrimaryPhoto = (idx) => {
    setCatalogForm((prev) => {
      const photos = [...(prev.photos || [])];
      if (idx < 0 || idx >= photos.length) return prev;
      const [chosen] = photos.splice(idx, 1);
      photos.unshift(chosen);
      return { ...prev, photos, image: photos[0] };
    });
  };

  const handleRemoveCatalogPhoto = (idx) => {
    setCatalogForm((prev) => {
      const photos = (prev.photos || []).filter((_, i) => i !== idx);
      return { ...prev, photos, image: photos[0] || "" };
    });
  };

  const handleCatalogPhotoFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    try {
      const urls = await imageService.uploadImages(files, "rental");
      setCatalogForm((prev) => {
        const combined = [...(prev.photos || []), ...urls];
        return { ...prev, photos: combined, image: combined[0] || prev.image };
      });
      addToast?.("Foto Berhasil Diunggah", `${urls.length} foto unit berhasil ditambahkan.`);
    } catch (err) {
      addToast?.("Gagal Unggah Foto", err.message || "Gagal mengunggah foto.", "error");
    }
  };

  const handleAddPhotoByUrl = () => {
    if (!newPhotoUrlInput.trim()) return;
    const url = newPhotoUrlInput.trim();
    setCatalogForm((prev) => {
      const combined = [...(prev.photos || []), url];
      return { ...prev, photos: combined, image: combined[0] || prev.image };
    });
    setNewPhotoUrlInput("");
    addToast?.("URL Foto Ditambahkan", "Foto berhasil dimasukkan ke daftar foto unit.");
  };

  const handleSaveCatalogItem = (e) => {
    e.preventDefault();
    if (!catalogForm.name || !catalogForm.price) {
      addToast?.("Form Belum Lengkap", "Silakan isi nama barang dan tarif sewa.", "error");
      return;
    }

    const resolvedCategory = catalogForm.category === "__CUSTOM__"
      ? (customCategoryName.trim() || "Unit Rental")
      : catalogForm.category;

    const allPhotos = (catalogForm.photos && catalogForm.photos.length > 0)
      ? catalogForm.photos
      : (catalogForm.image ? [catalogForm.image] : ["https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=600&q=80"]);
    const primaryPhoto = allPhotos[0];

    let updatedCatalog;
    const newItemId = editingCatalogItem ? editingCatalogItem.id : `rnt-${Date.now()}`;

    if (editingCatalogItem) {
      updatedCatalog = store.catalog.map((c) =>
        c.id === editingCatalogItem.id
          ? {
              ...c,
              name: catalogForm.name,
              category: resolvedCategory,
              price: Number(catalogForm.price),
              depositAmount: Number(catalogForm.depositAmount),
              unit: catalogForm.unit,
              image: primaryPhoto,
              photos: allPhotos,
              stockStatus: catalogForm.stockStatus,
              tag: catalogForm.tag,
              desc: catalogForm.desc,
              stockCount: Number(catalogForm.stockCount),
              includedItems: catalogForm.includedItems,
            }
          : c
      );
    } else {
      const newItem = {
        id: newItemId,
        name: catalogForm.name,
        category: resolvedCategory,
        type: "sewa",
        price: Number(catalogForm.price),
        depositAmount: Number(catalogForm.depositAmount),
        unit: catalogForm.unit,
        image: primaryPhoto,
        photos: allPhotos,
        rating: 5.0,
        reviews: 0,
        stockStatus: catalogForm.stockStatus,
        tag: catalogForm.tag,
        desc: catalogForm.desc,
        stockCount: Number(catalogForm.stockCount),
        includedItems: catalogForm.includedItems,
      };
      updatedCatalog = [newItem, ...(store.catalog || [])];
    }

    // Update store state and persist
    const updatedStore = { ...store, catalog: updatedCatalog };
    handleUpdateStore(
      updatedStore,
      editingCatalogItem
        ? "Data unit rental berhasil diperbarui dengan galeri foto."
        : "Unit rental baru berhasil ditambahkan ke katalog publik."
    );

    // Synchronize with AppContext rentals so user sees it in /sewa immediately
    if (setRentals) {
      setRentals((prev) => {
        const itemExists = prev.some((r) => r.id === newItemId);
        if (itemExists) {
          return prev.map((r) =>
            r.id === newItemId
              ? {
                  ...r,
                  title: catalogForm.name,
                  category: catalogForm.category,
                  dailyPrice: Number(catalogForm.price),
                  depositAmount: Number(catalogForm.depositAmount),
                  photoUrl: primaryPhoto,
                  photos: allPhotos,
                  stock: Number(catalogForm.stockCount),
                  description: catalogForm.desc,
                }
              : r
          );
        } else {
          const newRentalItem = {
            id: newItemId,
            title: catalogForm.name,
            category: catalogForm.category,
            dailyPrice: Number(catalogForm.price),
            depositAmount: Number(catalogForm.depositAmount),
            photoUrl: primaryPhoto,
            photos: allPhotos,
            stock: Number(catalogForm.stockCount),
            description: catalogForm.desc,
            ratingAvg: 5.0,
            ratingCount: 0,
            totalRentedCount: 0,
            isVerifiedPartner: true,
            isSafeEscrow: true,
            storeId: store.id,
            ownerName: store.name,
            owner: {
              id: store.id,
              name: store.name,
              avatar: store.avatar,
              rating: store.rating,
              completedOrders: store.completedOrders,
            },
            location: store.address,
            address: store.address,
          };
          return [newRentalItem, ...prev];
        }
      });
    }

    setIsCatalogModalOpen(false);
  };

  const handleDeleteCatalogItem = (id) => {
    const updated = store.catalog.filter((c) => c.id !== id);
    handleUpdateStore({ ...store, catalog: updated }, "Unit rental berhasil dihapus dari katalog.");
    if (setRentals) {
      setRentals((prev) => prev.filter((r) => r.id !== id));
    }
  };

  const handleToggleStockStatus = (item) => {
    const nextStatus = 
      item.stockStatus === "Siap Sewa" ? "Sedang Disewa" : "Siap Sewa";
    const updatedCatalog = store.catalog.map((c) =>
      c.id === item.id ? { ...c, stockStatus: nextStatus } : c
    );
    handleUpdateStore(
      { ...store, catalog: updatedCatalog },
      `Status unit "${item.name}" diubah menjadi: ${nextStatus}`
    );
  };

  // -------------------------------------------------------------
  // CRUD HANDLERS: PAKET SEWA BUNDLING
  // -------------------------------------------------------------
  const handleSavePackage = (e) => {
    e.preventDefault();
    if (!packageForm.name || !packageForm.price) {
      addToast?.("Form Belum Lengkap", "Silakan lengkapi nama dan tarif paket.", "error");
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
      description: packageForm.description || "Paket sewa bundling lengkap siap pakai untuk kegiatan event dan tugas.",
      features,
      isPopular: packageForm.isPopular,
    };

    const updatedPackages = [...(store.packages || []), newPkg];
    handleUpdateStore({ ...store, packages: updatedPackages }, "Paket bundling sewa baru berhasil disimpan.");
    setIsPackageModalOpen(false);
  };

  const handleDeletePackage = (id) => {
    const updated = store.packages.filter((p) => p.id !== id);
    handleUpdateStore({ ...store, packages: updated }, "Paket bundling berhasil dihapus.");
  };

  // -------------------------------------------------------------
  // CRUD HANDLERS: GALERI SHOWCASE GEAR
  // -------------------------------------------------------------
  const handleGalleryPhotoFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await imageService.uploadImage(file, "gallery");
      if (res.success && res.url) {
        setGalleryForm((prev) => ({ ...prev, url: res.url }));
        addToast?.("Foto Terunggah", "Foto showcase gear berhasil dimuat.");
      }
    } catch (err) {
      addToast?.("Gagal Upload", err.message || "Gagal mengunggah foto.", "error");
    }
  };

  const handleSaveGallery = (e) => {
    e.preventDefault();
    if (!galleryForm.title || !galleryForm.url) {
      addToast?.("Form Belum Lengkap", "Silakan isi judul dan foto showcase.", "error");
      return;
    }

    const newPhoto = {
      url: galleryForm.url,
      title: galleryForm.title,
      category: galleryForm.category,
      description: galleryForm.description || "Dokumentasi unit perlengkapan rental siap pakai.",
    };

    const updatedPhotos = [newPhoto, ...(store.portfolioPhotos || [])];
    handleUpdateStore({ ...store, portfolioPhotos: updatedPhotos }, "Foto showcase gear berhasil ditambahkan.");
    setIsGalleryModalOpen(false);
  };

  const handleDeleteGallery = (idx) => {
    const updated = store.portfolioPhotos.filter((_, i) => i !== idx);
    handleUpdateStore({ ...store, portfolioPhotos: updated }, "Foto showcase berhasil dihapus.");
  };

  // -------------------------------------------------------------
  // CRUD HANDLERS: PROFIL TOKO & BRANDING
  // -------------------------------------------------------------
  const handleSaveProfile = (e) => {
    e.preventDefault();
    const updated = {
      ...store,
      name: profileForm.name,
      tagline: profileForm.tagline,
      category: profileForm.category,
      address: profileForm.address,
      whatsapp: profileForm.whatsapp,
      operationalHours: profileForm.operationalHours,
      about: profileForm.about,
      securityDepositPolicy: profileForm.securityDepositPolicy,
    };
    handleUpdateStore(updated, "Profil toko mitra berhasil diperbarui dan sinkron dengan etalase user.");
  };

  // -------------------------------------------------------------
  // CRUD HANDLERS: ULASAN & BALASAN MITRA
  // -------------------------------------------------------------
  const handleOpenReplyModal = (review) => {
    setSelectedReviewToReply(review);
    setReplyCommentText(review.reply?.comment || "");
    setIsReplyModalOpen(true);
  };

  const handleSaveReviewReply = (e) => {
    e.preventDefault();
    if (!selectedReviewToReply || !replyCommentText.trim()) return;

    const updatedReviews = (store.reviews || []).map((rev) => {
      if (rev.id === selectedReviewToReply.id) {
        return {
          ...rev,
          reply: {
            comment: replyCommentText.trim(),
            date: "Baru saja",
            author: store.name,
          },
        };
      }
      return rev;
    });

    handleUpdateStore(
      { ...store, reviews: updatedReviews },
      `Balasan untuk ulasan ${selectedReviewToReply.userName} berhasil dipublikasikan.`
    );
    setIsReplyModalOpen(false);
  };

  // -------------------------------------------------------------
  // HANDLERS: PENARIKAN & PENGATURAN
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
    addToast?.("Pengaturan Disimpan", "Preferensi operasional dan rekening payout utama berhasil diperbarui.");
  };

  return (
    <RoleGuard allowedRoles={["partner"]}>
      <div className="min-h-screen flex flex-col lg:flex-row bg-[#F4F7FB]">
      
      {/* ============================================================ */}
      {/* 1. MOBILE TOP NAVIGATION BAR (< lg)                          */}
      {/* ============================================================ */}
      <div className="lg:hidden sticky top-0 z-40 bg-white border-b border-slate-200/90 shadow-2xs">
        {/* Top bar with logo and mode switches */}
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center">
              <Image
                src={logoImg}
                alt="Bantuin"
                height={30}
                className="h-7 w-auto object-contain mix-blend-multiply"
              />
            </Link>
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-blue-50 text-[#1683FF] border border-blue-100">
              Mitra Sewa
            </span>
          </div>

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
              href="/jasa/dashboard"
              className="text-[11px] font-bold px-2 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition flex items-center gap-1"
              title="Buka Dashboard Jasa"
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>Jasa</span>
            </Link>

            <Link
              href={`/mitra/${store.id}`}
              target="_blank"
              className="text-[11px] font-bold px-2.5 py-1.5 rounded-lg bg-blue-50 text-[#1683FF] hover:bg-blue-100 transition flex items-center gap-1"
            >
              <span>Toko Publik</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>

      </div>

      {/* ============================================================ */}
      {/* 2. DEDICATED DESKTOP SIDEBAR (Konsisten Biru & Putih)        */}
      {/* ============================================================ */}
      <aside className="hidden lg:flex w-72 bg-white border-r border-slate-200/90 flex-col justify-between p-5 sticky top-0 h-screen overflow-y-auto shrink-0 z-20 shadow-xs">
        <div>
          {/* Logo & Brand */}
          <div className="flex items-center justify-between mb-5 pb-4 border-b border-slate-100">
            <Link href="/" className="flex items-center gap-2 group">
              <Image
                src={logoImg}
                alt="Bantuin"
                height={34}
                className="h-8 w-auto object-contain mix-blend-multiply"
              />
            </Link>
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-blue-50 text-[#1683FF] border border-blue-100">
              Mitra Sewa
            </span>
          </div>

          {/* Store Profile Card */}
          <div className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-slate-200/80 mb-5">
            <div className="flex items-center gap-3">
              <img
                src={store.avatar}
                alt={store.name}
                className="w-11 h-11 rounded-2xl object-cover border border-slate-200 shrink-0 bg-white shadow-2xs"
              />
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-900 truncate flex items-center gap-1">
                  <span>{store.name}</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#1683FF] shrink-0" />
                </div>
                <div className="text-[11px] text-slate-500 truncate flex items-center gap-1 mt-0.5">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  <span className="font-semibold text-slate-700">{store.rating || 4.9}</span>
                  <span>({store.reviewCount || store.reviews?.length || 42} ulasan)</span>
                </div>
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
              <span className="text-slate-500 font-medium">Status Outlet:</span>
              <span className="inline-flex items-center gap-1 text-emerald-600 font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Buka &amp; Aktif</span>
              </span>
            </div>
          </div>

          {/* Sidebar Menu Items */}
          <nav className="space-y-1">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 py-1.5">
              Menu Dashboard Sewa
            </div>

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
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-500"}`} />
                    <span>{link.label}</span>
                  </div>

                  {link.count !== undefined && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                      isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                    }`}>
                      {link.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Sidebar Switchers / Cross Portal Links */}
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
            href="/jasa/dashboard"
            className="flex items-center justify-between w-full px-3 py-2 rounded-xl bg-blue-50/60 hover:bg-blue-100 text-slate-700 hover:text-[#1683FF] text-xs font-bold transition border border-blue-200/80"
          >
            <div className="flex items-center gap-2">
              <Briefcase className="w-3.5 h-3.5 text-[#1683FF]" />
              <span>Dashboard Jasa</span>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </Link>

          <Link
            href={`/mitra/${store.id}`}
            target="_blank"
            className="flex items-center justify-center gap-1.5 w-full py-2 rounded-xl text-slate-600 hover:text-slate-900 text-xs font-medium transition"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Lihat Etalase Publik</span>
          </Link>

          <Link
            href="/"
            className="flex items-center justify-center gap-1.5 w-full py-1.5 rounded-xl text-slate-400 hover:text-slate-700 text-[11px] font-medium transition"
          >
            <ArrowLeft className="w-3 h-3" />
            <span>Kembali ke Mode User</span>
          </Link>
        </div>
      </aside>

      {/* ============================================================ */}
      {/* 3. MAIN CONTENT AREA FOR MITRA SEWA                          */}
      {/* ============================================================ */}
      <main className="flex-1 flex flex-col min-w-0">
        
        {/* Top Sticky Header (Desktop) */}
        <header className="hidden lg:flex sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-6 py-3.5 items-center justify-between gap-4 shadow-2xs">
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
              {activeMenu === "overview" && "Ringkasan Bisnis & Analisis Sewa"}
              {activeMenu === "catalog" && "Katalog Unit Barang Rental"}
              {activeMenu === "packages" && "Pilihan Paket Sewa Bundling"}
              {activeMenu === "gallery" && "Galeri Showcase & Portofolio Gear"}
              {activeMenu === "orders" && "Pesanan Masuk & Handover Fisik"}
              {activeMenu === "wallet" && "Hak Pembayaran & Payout Saldo"}
              {activeMenu === "promotions" && "Promosikan Toko & Featured Landing Page"}
              {activeMenu === "profile" && "Profil Toko & Informasi Bisnis Mitra"}
              {activeMenu === "reviews" && "Ulasan Pelanggan Terverifikasi"}
              {activeMenu === "settings" && "Pengaturan Toko & Kebijakan Sewa"}
              {activeMenu === "notifications" && "Pusat Notifikasi & Pembaruan Transaksi"}
              {activeMenu === "chat" && "Percakapan & Koordinasi Pelanggan"}
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
              <Link
                href="/mitra/dashboard/katalog/tambah"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white text-xs font-bold shadow-xs transition active:scale-95 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Tambah Unit Baru</span>
              </Link>
            )}
          </div>
        </header>

        {/* Main Content Body */}
        <div className="p-4 sm:p-6 md:p-8 space-y-6 max-w-[1240px] w-full">
          
          {/* ============================================================ */}
          {/* VIEW 1: OVERVIEW (RINGKASAN & ANALISIS SEWA)                  */}
          {/* ============================================================ */}
          {activeMenu === "overview" && (
            <>
              {/* Store Banner & Visual Header (Identik 100% dengan Halaman Toko User) */}
              <div className="bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-xs">
                {/* Banner Sampul Toko */}
                <div className="relative w-full h-40 sm:h-52 bg-slate-900 overflow-hidden group">
                  <img
                    src={store.coverImage}
                    alt={store.name}
                    className="w-full h-full object-cover opacity-65 transition duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
                  
                  {/* Badge Status Outlet */}
                  <div className="absolute top-3 left-3 sm:top-4 sm:left-4">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/90 backdrop-blur-md text-slate-800 text-[11px] font-bold shadow-xs">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span>Outlet Aktif di Pencarian Sewa</span>
                    </span>
                  </div>

                  {/* Tombol Ganti Banner dari Lokal */}
                  <label className="absolute top-3 right-3 sm:top-4 sm:right-4 px-3 py-1.5 rounded-xl bg-black/60 hover:bg-black/80 text-white text-[11px] font-bold backdrop-blur-md cursor-pointer transition flex items-center gap-1.5 shadow-xs">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Ganti Banner Sampul</span>
                    <input type="file" accept="image/*" onChange={handleBannerUpload} className="hidden" />
                  </label>
                </div>

                {/* Profile Header Detail */}
                <div className="px-5 sm:px-6 pb-5 sm:pb-6 relative z-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                  <div className="flex flex-col sm:flex-row sm:items-end gap-3.5 sm:gap-4">
                    <div className="-mt-12 sm:-mt-16 relative group shrink-0 self-start">
                      <img
                        src={store.avatar}
                        alt={store.name}
                        className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-4 border-white shadow-md bg-white"
                      />
                      <label 
                        className="absolute inset-0 rounded-2xl bg-black/60 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer text-[10px] font-bold"
                        title="Upload Logo Toko dari File Lokal"
                      >
                        <Camera className="w-4 h-4 mb-0.5" />
                        <span>Ganti Foto</span>
                        <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                      </label>
                    </div>

                    <div className="space-y-1 pt-2 sm:pt-0 sm:pb-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded-md bg-blue-50 text-[#1683FF] text-[10px] sm:text-[11px] font-extrabold uppercase border border-blue-100">
                          {store.badge || "Mitra Rental Terverifikasi"}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] sm:text-[11px] font-bold border border-emerald-100 flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-emerald-600" />
                          <span>Identitas KTP &amp; Usaha Valid</span>
                        </span>
                      </div>

                      <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                        {store.name}
                      </h2>

                      <p className="text-xs sm:text-sm font-semibold text-slate-600">
                        {store.tagline} &middot; <span className="text-[#1683FF]">{store.address}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:pb-1">
                    <Link
                      href={`/mitra/${store.id}`}
                      target="_blank"
                      className="px-4 py-2 bg-[#1683FF] hover:bg-[#0F6FE5] text-white text-xs font-bold rounded-xl shadow-xs transition inline-flex items-center gap-1.5"
                    >
                      <span>Buka Toko Publik</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>

              {/* 4 Core Financial & Unit Metrics */}
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
                    {store.catalog?.length || 0} Unit
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
                  <div className="text-[11px] text-emerald-600 mt-1 font-semibold">Fee transfer admin Rp0</div>
                </div>
              </div>

              {/* Business Analysis & Performance Overview (Persis Permintaan User) */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Column 1 & 2: Performance Graph & Activity */}
                <div className="lg:col-span-2 bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-base text-slate-900">Analisis Performa Aktivitas Sewa</h3>
                      <p className="text-xs text-slate-500">Statistik serah terima unit dan ketepatan pengembalian 7 hari terakhir</p>
                    </div>
                    <span className="text-xs font-bold text-[#1683FF] bg-blue-50 px-3 py-1 rounded-full border border-blue-100 self-start sm:self-auto">
                      Minggu Ini
                    </span>
                  </div>

                  {/* 3 Metric Highlights */}
                  <div className="grid grid-cols-3 gap-3 pt-1">
                    <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-100">
                      <div className="text-[11px] font-semibold text-slate-600">Pengembalian Tepat Waktu</div>
                      <div className="text-lg sm:text-xl font-black text-[#1683FF] mt-0.5">99.4%</div>
                      <div className="text-[10px] text-emerald-600 font-bold mt-0.5">Bebas Denda</div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-100">
                      <div className="text-[11px] font-semibold text-slate-600">Deposit Jaminan Aman</div>
                      <div className="text-lg sm:text-xl font-black text-emerald-700 mt-0.5">100%</div>
                      <div className="text-[10px] text-emerald-600 font-bold mt-0.5">0 Sengketa</div>
                    </div>
                    <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-100">
                      <div className="text-[11px] font-semibold text-slate-600">Kepuasan Pelanggan</div>
                      <div className="text-lg sm:text-xl font-black text-amber-700 mt-0.5">{store.rating || 4.9} / 5.0</div>
                      <div className="text-[10px] text-amber-700 font-bold mt-0.5">Ulasan Positif</div>
                    </div>
                  </div>

                  {/* Visual Bar Chart (Clean Pure Blue & White) */}
                  <div className="pt-2">
                    <div className="flex items-center justify-between text-xs text-slate-500 font-medium mb-3">
                      <span>Grafik Unit Tersewa vs Pengembalian Sukses</span>
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1 text-[11px]">
                          <span className="w-2.5 h-2.5 rounded-sm bg-[#1683FF]" />
                          <span>Tersewa</span>
                        </span>
                        <span className="flex items-center gap-1 text-[11px]">
                          <span className="w-2.5 h-2.5 rounded-sm bg-blue-200" />
                          <span>Kembali</span>
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-7 gap-2 items-end h-36 pt-4 border-b border-slate-100 pb-2">
                      {[
                        { day: "Sen", sewa: 65, kembali: 55 },
                        { day: "Sel", sewa: 80, kembali: 70 },
                        { day: "Rab", sewa: 45, kembali: 40 },
                        { day: "Kam", sewa: 90, kembali: 85 },
                        { day: "Jum", sewa: 100, kembali: 90 },
                        { day: "Sab", sewa: 110, kembali: 95 },
                        { day: "Min", sewa: 85, kembali: 80 },
                      ].map((item, i) => (
                        <div key={i} className="flex flex-col items-center gap-1.5 h-full justify-end">
                          <div className="w-full flex items-end justify-center gap-1 h-24">
                            <div 
                              style={{ height: `${item.sewa}%` }} 
                              className="w-3.5 bg-[#1683FF] rounded-t-md transition-all hover:opacity-85"
                              title={`Unit Tersewa: ${item.sewa}%`}
                            />
                            <div 
                              style={{ height: `${item.kembali}%` }} 
                              className="w-3.5 bg-blue-200 rounded-t-md transition-all hover:opacity-85"
                              title={`Pengembalian: ${item.kembali}%`}
                            />
                          </div>
                          <span className="text-[10px] font-bold text-slate-500">{item.day}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Column 3: Segregated Deposit Tracking & Quick Store Stats */}
                <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <ShieldCheck className="w-5 h-5 text-emerald-600" />
                      <h3 className="font-bold text-base text-slate-900">Deposit Jaminan Sewa</h3>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Jaminan fisik dan deposit uang customer tersimpan aman 100% tanpa potongan komisi hingga unit kembali utuh.
                    </p>

                    <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">Deposit Tertampung:</span>
                        <span className="font-bold text-slate-900">{formatIDR(700000)}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">Unit Sedang Dirental:</span>
                        <span className="font-bold text-[#1683FF]">3 Barang</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">Kecepatan Respon:</span>
                        <span className="font-bold text-emerald-600">&lt; 10 Menit</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-100 text-xs text-slate-700 leading-relaxed">
                    <strong className="block text-slate-900 font-bold mb-1">Tips Mitra Terpercaya:</strong>
                    Lakukan pemeriksaan kelengkapan fisik bersama penyewa saat serah terima barang di Bantuin Point atau toko Anda.
                  </div>
                </div>
              </div>

              {/* Active Incoming & Ongoing Orders Box */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-base text-slate-900">Pesanan Rental Sedang Berjalan</h3>
                    <p className="text-xs text-slate-500">Pantau serah terima unit fisik, masa sewa, dan pengembalian deposit</p>
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
                        #RNT-01
                      </div>
                      <div>
                        <h4 className="font-bold text-xs sm:text-sm text-slate-900">Sony Alpha A7 III (Body Only)</h4>
                        <p className="text-[11px] text-slate-500">Penyewa: Dimas Anggoro &middot; Titik Temu: Bantuin Point Rektorat &middot; Deposit Rp200.000 Terverifikasi Aman</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 self-end sm:self-auto">
                      <div className="text-right">
                        <div className="font-extrabold text-xs text-slate-900">Rp 185.000</div>
                        <div className="text-[10px] text-amber-600 font-semibold">Sedang Disewa (Hari 1/2)</div>
                      </div>
                      <Link 
                        href="/chat?room=order-room-rental-kamera"
                        className="text-xs font-bold px-3 py-1.5 rounded-lg bg-[#1683FF] text-white hover:bg-[#0F6FE5] transition"
                      >
                        Buka Chat Order
                      </Link>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-slate-100 bg-[#F8FAFF] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-blue-100 text-[#1683FF] flex items-center justify-center font-bold text-xs shrink-0">
                        #RNT-02
                      </div>
                      <div>
                        <h4 className="font-bold text-xs sm:text-sm text-slate-900">DJI Ronin RS 3 Gimbal Stabilizer</h4>
                        <p className="text-[11px] text-slate-500">Penyewa: Rifky Fauzi &middot; Serah Terima di Toko Focus Lens &middot; Deposit Rp200.000 Aman</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 self-end sm:self-auto">
                      <div className="text-right">
                        <div className="font-extrabold text-xs text-slate-900">Rp 95.000</div>
                        <div className="text-[10px] text-emerald-600 font-semibold">Menunggu Cek Fisik Kembali</div>
                      </div>
                      <Link 
                        href="/chat?room=order-room-rental-kamera"
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
          {/* VIEW 2: KATALOG UNIT SEWA (FULL CRUD DENGAN UPLOAD LOKAL)     */}
          {/* ============================================================ */}
          {activeMenu === "catalog" && (
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-base text-slate-900">Katalog Barang Rental Anda</h3>
                  <p className="text-xs text-slate-500">
                    Kelola unit rental yang tampil persis pada pencarian sewa publik dan etalase toko Anda.
                  </p>
                </div>
                <Link
                  href="/mitra/dashboard/katalog/tambah"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1683FF] text-white text-xs font-bold hover:bg-[#0F6FE5] transition shadow-2xs self-start sm:self-auto"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Tambah Unit Baru</span>
                </Link>
              </div>

              {/* Search & Category Filter Bar */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Cari nama unit atau spesifikasi..."
                    value={catalogSearch}
                    onChange={(e) => setCatalogSearch(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#1683FF]"
                  />
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar w-full sm:w-auto">
                  {["Semua", "Kamera", "Lensa", "Audio", "Lighting", "Drone", "Aksesoris"].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCatalogCategory(cat)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                        selectedCatalogCategory === cat
                          ? "bg-[#1683FF] text-white"
                          : "bg-slate-100 text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Grid of Rental Unit Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-4 pt-2">
                {filteredStoreCatalog.map((item) => {
                  const isAvailable = item.stockStatus === "Siap Sewa";

                  return (
                    <div
                      key={item.id}
                      className="rounded-xl sm:rounded-2xl border border-slate-200/90 bg-white overflow-hidden shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group"
                    >
                      <div>
                        {/* Unit Image & Badges */}
                        <Link href={`/mitra/dashboard/katalog/${item.id}`} className="block relative aspect-4/3 sm:aspect-16/10 w-full bg-slate-100 overflow-hidden cursor-pointer">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute top-2 left-2 sm:top-2.5 sm:left-2.5 flex items-center gap-1 flex-wrap">
                            <span className="px-1.5 sm:px-2 py-0.5 rounded-md text-[9px] sm:text-[10px] font-extrabold uppercase bg-black/60 text-white backdrop-blur-xs">
                              {item.category}
                            </span>
                            {item.tag && (
                              <span className="hidden sm:inline px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#1683FF] text-white">
                                {item.tag}
                              </span>
                            )}
                            {item.photos && item.photos.length > 1 && (
                              <span className="px-1.5 sm:px-2 py-0.5 rounded-md text-[9px] sm:text-[10px] font-bold bg-white/95 text-slate-800 backdrop-blur-xs flex items-center gap-1 shadow-xs">
                                <Camera className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#1683FF]" />
                                <span>{item.photos.length}</span>
                              </span>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleToggleStockStatus(item);
                            }}
                            className={`absolute bottom-2 right-2 sm:bottom-2.5 sm:right-2.5 px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-md sm:rounded-lg text-[9px] sm:text-[10px] font-bold backdrop-blur-md shadow-xs transition ${
                              isAvailable
                                ? "bg-emerald-500/90 text-white"
                                : "bg-amber-500/90 text-white"
                            }`}
                            title="Klik untuk ubah status ketersediaan"
                          >
                            {item.stockStatus || "Siap Sewa"}
                          </button>
                        </Link>

                        {/* Unit Details */}
                        <div className="p-2.5 sm:p-4 space-y-1 sm:space-y-1.5">
                          <Link href={`/mitra/dashboard/katalog/${item.id}`} className="block">
                            <h4 className="font-bold text-xs sm:text-sm text-slate-900 group-hover:text-[#1683FF] transition line-clamp-2 leading-snug min-h-[32px] sm:min-h-0">
                              {item.name}
                            </h4>
                          </Link>
                          <p className="hidden sm:block text-xs text-slate-500 line-clamp-2 leading-relaxed">
                            {item.desc}
                          </p>

                          <div className="pt-1.5 sm:pt-2 text-[10px] sm:text-[11px] text-slate-500 flex items-center justify-between border-t border-slate-100">
                            <span>Stok: <strong>{item.stockCount || 3}</strong></span>
                            <span className="hidden sm:inline">Deposit: <strong>{formatIDR(item.depositAmount || 200000)}</strong></span>
                          </div>
                        </div>
                      </div>

                      {/* Pricing & Actions Bar */}
                      <div className="p-2.5 sm:p-4 pt-2 sm:pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-2">
                        <div>
                          <span className="text-[9px] sm:text-[10px] text-slate-400 block uppercase font-medium">Tarif:</span>
                          <div className="font-black text-xs sm:text-sm text-[#1683FF]">
                            {formatIDR(item.price)}
                            <span className="text-[9px] sm:text-[10px] text-slate-400 font-normal ml-0.5">{item.unit || "/ hari"}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 sm:gap-1.5 self-end sm:self-auto">
                          <Link
                            href={`/mitra/dashboard/katalog/${item.id}`}
                            className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl text-slate-600 hover:bg-slate-100 hover:text-[#1683FF] transition border border-slate-200/80"
                            title="Lihat Detail Unit"
                          >
                            <Eye className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                          </Link>
                          <Link
                            href={`/mitra/dashboard/katalog/${item.id}/edit`}
                            className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl text-slate-600 hover:bg-slate-100 hover:text-[#1683FF] transition border border-slate-200/80"
                            title="Edit Unit Rental"
                          >
                            <Edit3 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                          </Link>
                          <button
                            onClick={() => handleDeleteCatalogItem(item.id)}
                            className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl text-rose-600 hover:bg-rose-50 transition border border-slate-200/80 cursor-pointer"
                            title="Hapus Unit"
                          >
                            <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                          </button>
                          <Link
                            href={`/sewa/${item.id}`}
                            target="_blank"
                            className="px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg sm:rounded-xl bg-blue-50 hover:bg-blue-100 text-[#1683FF] text-[10px] sm:text-xs font-bold inline-flex items-center gap-1 transition"
                            title="Buka Tampilan Pelanggan di /sewa/[id]"
                          >
                            <span>Lihat</span>
                            <ExternalLink className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
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
          {/* VIEW 3: PAKET SEWA BUNDLING / BORONGAN                       */}
          {/* ============================================================ */}
          {activeMenu === "packages" && (
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-base text-slate-900">Pilihan Paket Sewa Bundling &amp; Borongan</h3>
                  <p className="text-xs text-slate-500">
                    Paket set lengkap yang memudahkan pelanggan memesan sekaligus (misal: Wisuda, Podcast, Sinema).
                  </p>
                </div>
                <Link
                  href="/mitra/dashboard/bundling/tambah"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1683FF] text-white text-xs font-bold hover:bg-[#0F6FE5] transition shadow-2xs"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Tambah Paket Baru</span>
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                {store.packages?.map((pkg) => (
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
                        <Link href={`/mitra/dashboard/bundling/${pkg.id}`} className="hover:text-[#1683FF] transition">
                          <h4 className="font-black text-base text-slate-900">{pkg.name}</h4>
                        </Link>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">{pkg.description}</p>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="text-xl font-black text-[#1683FF]">{formatIDR(pkg.price)}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>Durasi: <strong>{pkg.duration}</strong></span>
                        </div>
                      </div>

                      <div className="space-y-1.5 pt-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Kelengkapan Termasuk:
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
                          href={`/mitra/dashboard/bundling/${pkg.id}`}
                          className="text-xs font-bold text-[#1683FF] hover:bg-blue-50 px-2 py-1 rounded-lg transition"
                        >
                          Detail
                        </Link>
                        <Link
                          href={`/mitra/dashboard/bundling/${pkg.id}/edit`}
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
          {/* VIEW 4: GALERI SHOWCASE & FOTO GEAR                          */}
          {/* ============================================================ */}
          {activeMenu === "gallery" && (
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-base text-slate-900">Galeri Showcase Perlengkapan &amp; Setup</h3>
                  <p className="text-xs text-slate-500">
                    Foto-foto showcase alat ini meyakinkan calon penyewa tentang kebersihan dan kondisi prima unit Anda.
                  </p>
                </div>
                <Link
                  href="/mitra/dashboard/galeri/tambah"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1683FF] text-white text-xs font-bold hover:bg-[#0F6FE5] transition shadow-2xs"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Tambah Foto Galeri</span>
                </Link>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-4 pt-2">
                {store.portfolioPhotos?.map((photo, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl sm:rounded-2xl border border-slate-200/90 bg-white overflow-hidden shadow-2xs group flex flex-col justify-between"
                  >
                    <div>
                      <div className="relative aspect-4/3 w-full bg-slate-100 overflow-hidden">
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
                      </div>

                      <div className="p-2.5 sm:p-4 space-y-1">
                        <h4 className="font-bold text-xs sm:text-sm text-slate-900 line-clamp-1">{photo.title}</h4>
                        <p className="hidden sm:block text-xs text-slate-500 line-clamp-2 leading-relaxed">
                          {photo.description}
                        </p>
                      </div>
                    </div>

                    <div className="p-2.5 sm:p-4 pt-2 border-t border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/mitra/dashboard/galeri/${photo.id || idx}/edit`}
                          className="text-[10px] sm:text-xs font-bold text-slate-600 hover:bg-slate-100 px-2 py-1 rounded-md transition"
                        >
                          Edit
                        </Link>
                      </div>
                      <button
                        onClick={() => handleDeleteGallery(idx)}
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
          {/* VIEW 5: PESANAN SEWA MASUK & HANDOVER FISIK (CANONICAL)       */}
          {/* ============================================================ */}
          {activeMenu === "orders" && (
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-base text-slate-900">Pesanan Sewa &amp; Handover Fisik</h3>
                  <p className="text-xs text-slate-500">
                    Alur handover: Pesanan Dibayar &rarr; Siap Diambil &rarr; Handover &rarr; Sedang Disewa &rarr; Dikembalikan &rarr; Pemeriksaan &rarr; Deposit Dikembalikan &rarr; Selesai
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#1683FF] bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                    {partnerOrders.filter(o => o.status !== "Selesai").length} Transaksi Berjalan
                  </span>
                </div>
              </div>

              {/* Status Filters */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-xs">
                {["all", "Sedang Disewa", "Pemeriksaan", "Selesai"].map((st) => (
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
                {partnerOrders
                  .filter(o => orderFilter === "all" || o.status === orderFilter)
                  .map((order) => {
                    const isCompleted = order.status === "Selesai";
                    const isInspection = order.status === "Pemeriksaan";

                    return (
                      <div 
                        key={order.id}
                        className="p-4 sm:p-5 rounded-2xl border border-slate-200 bg-[#F8FAFC] flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 hover:border-blue-200 transition"
                      >
                        <div className="flex items-start sm:items-center gap-3.5">
                          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-xs shrink-0 ${
                            isCompleted ? "bg-emerald-500 text-white" : isInspection ? "bg-amber-500 text-white" : "bg-[#1683FF] text-white"
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
                                  : isInspection
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-blue-100 text-blue-800"
                              }`}>
                                {order.status}
                              </span>
                            </div>
                            <h4 className="font-bold text-sm text-slate-900 mt-1">{order.unitName}</h4>
                            <p className="text-xs text-slate-500 mt-0.5">
                              Durasi: {order.duration} &middot; Titik Temu: {order.meetingLocation}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-between lg:justify-end w-full lg:w-auto gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-200">
                          <div className="text-left lg:text-right">
                            <div className="text-xs font-black text-slate-900">{formatIDR(order.amount)}</div>
                            <div className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1 lg:justify-end">
                              <ShieldCheck className="w-3 h-3 text-emerald-500" />
                              <span>Jaminan Deposit: {formatIDR(order.depositAmount)}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setSelectedOrderForHandover(order)}
                              className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold rounded-xl transition shadow-2xs inline-flex items-center gap-1.5 cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Detail &amp; Handover Fisik</span>
                            </button>

                            {order.status === "Pemeriksaan" && (
                              <button
                                onClick={() => {
                                  const updated = partnerOrders.map(o => o.id === order.id ? {
                                    ...o,
                                    status: "Selesai",
                                    timeline: [
                                      ...o.timeline,
                                      { status: "Deposit Dikembalikan", time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }), note: `Pemeriksaan selesai tanpa kerusakan. Deposit ${formatIDR(order.depositAmount)} dikembalikan ke klien.` },
                                      { status: "Selesai", time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }), note: `Transaksi tuntas. Hak sewa ${formatIDR(order.amount)} masuk saldo mitra.` }
                                    ]
                                  } : o);
                                  setPartnerOrders(updated);
                                  addToast?.("Pemeriksaan Selesai", "Kondisi unit telah diverifikasi. Deposit dikembalikan & hak sewa dicairkan.");
                                }}
                                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-2xs inline-flex items-center gap-1.5 cursor-pointer"
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                                <span>Lepas Deposit &amp; Selesaikan</span>
                              </button>
                            )}

                            <Link
                              href="/chat?room=order-room-rental-kamera&role=helper"
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
          {/* VIEW: NOTIFICATIONS (PUSAT NOTIFIKASI TRANSAKSI)             */}
          {/* ============================================================ */}
          {activeMenu === "notifications" && (
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-base text-slate-900">Pusat Notifikasi Toko Mitra</h3>
                  <p className="text-xs text-slate-500">Pemberitahuan masuk terkait pesanan, handover, dan pencairan sewa</p>
                </div>
                <button
                  onClick={() => {
                    setPartnerNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
                    addToast?.("Semua Dibaca", "Seluruh notifikasi toko ditandai telah dibaca.");
                  }}
                  className="text-xs font-bold text-[#1683FF] hover:underline cursor-pointer"
                >
                  Tandai Semua Dibaca
                </button>
              </div>

              <div className="divide-y divide-slate-100">
                {partnerNotifications.map((notif) => (
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
          {/* VIEW: CHAT (PERCAKAPAN & KOORDINASI PELANGGAN)                */}
          {/* ============================================================ */}
          {activeMenu === "chat" && (
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs space-y-4">
              <div>
                <h3 className="font-bold text-base text-slate-900">Percakapan Pelanggan Sewa</h3>
                <p className="text-xs text-slate-500">Koordinasi titik temu serah terima, ketersediaan alat, dan tanya jawab teknis</p>
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
                      <div className="text-xs font-bold text-slate-900">Dimas Anggoro</div>
                      <p className="text-xs text-slate-500 line-clamp-1">Halo kak, untuk pengambilan Sony A7 III apa bisa di depan gerbang utama?</p>
                    </div>
                  </div>

                  <Link
                    href="/chat?room=order-room-rental-kamera&role=helper"
                    className="px-4 py-2 bg-[#1683FF] hover:bg-[#0F6FE5] text-white text-xs font-bold rounded-xl transition shrink-0"
                  >
                    Buka Chat
                  </Link>
                </div>

                <div className="p-4 rounded-2xl border border-slate-200 hover:border-blue-300 transition flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-800 font-bold flex items-center justify-center text-xs">
                        RF
                      </div>
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-400 border-2 border-white absolute bottom-0 right-0" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">Rifky Fauzi</div>
                      <p className="text-xs text-slate-500 line-clamp-1">Gimbal sudah saya serahkan ke mas yang di kasir toko ya kak. Terima kasih!</p>
                    </div>
                  </div>

                  <Link
                    href="/chat?room=order-room-rental-kamera&role=helper"
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
                        Saldo Hak Pembayaran Mitra Sewa
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
                      <span>Hak bersih dari transaksi sewa selesai &middot; Fee transfer admin ditanggung Bantuin.id</span>
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
                    <div className="text-slate-400">Dana Tertahan (Masa Sewa Aktif)</div>
                    <div className="font-bold text-amber-400 text-sm mt-0.5">{formatIDR(mitraPendingBalance)}</div>
                  </div>
                  <div>
                    <div className="text-slate-400">Total Akumulasi Omset Bersih</div>
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

              {/* Customer Segregated Deposit Tracker */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-base text-slate-900">Pelacakan Deposit Jaminan Pelanggan (0% Komisi)</h3>
                    <p className="text-xs text-slate-500">Dana jaminan customer ditampung terpisah secara aman dan dikembalikan utuh setelah pemeriksaan unit</p>
                  </div>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    Deposit Jaminan Terpisah
                  </span>
                </div>

                <div className="divide-y divide-slate-100">
                  {customerDeposits.map((dep) => (
                    <div key={dep.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="text-xs font-bold text-slate-900">{dep.rentalTitle}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Penyewa: {dep.customerAccountHolder} &middot; Rekening Pengembalian: {dep.customerBank} ({dep.customerAccountNumber})
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3">
                        <div className="text-left sm:text-right">
                          <div className="text-xs font-bold text-slate-900">{formatIDR(dep.depositAmount)}</div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            dep.status === "REFUNDED" 
                              ? "bg-emerald-50 text-emerald-700" 
                              : "bg-amber-50 text-amber-700"
                          }`}>
                            {dep.status === "REFUNDED" ? "Deposit Telah Dikembalikan" : "Terkunci Selama Sewa"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
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
                              Transfer ke Rekening {wd.bankName} - {wd.accountNumber} ({wd.accountHolder})
                            </div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                              <span>ID: {wd.id}</span>
                              <span>&middot;</span>
                              <span>{formatDateIndo(wd.requestedAt || wd.createdAt)}</span>
                              {wd.transferReference && (
                                <>
                                  <span>&middot;</span>
                                  <span className="font-mono text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                                    Ref: {wd.transferReference}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-xs font-extrabold text-slate-900">
                            -{formatIDR(wd.amount)}
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mt-0.5 ${
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
          {/* VIEW 7: PROFIL TOKO & BRANDING PUBLIK                        */}
          {/* ============================================================ */}
          {activeMenu === "profile" && (
            <div className="space-y-6">
              {/* Visual Store Header with Local Uploads */}
              <div className="bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-xs">
                {/* Banner Sampul */}
                <div className="relative w-full h-36 sm:h-44 bg-slate-900 overflow-hidden group">
                  <img
                    src={store.coverImage}
                    alt={store.name}
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
                      src={store.avatar}
                      alt={store.name}
                      className="w-20 h-20 sm:w-22 sm:h-22 rounded-2xl object-cover border-4 border-white shadow-md bg-white"
                    />
                    <label 
                      className="absolute inset-0 rounded-2xl bg-black/60 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer text-[10px] font-bold"
                      title="Upload Avatar Toko dari File Lokal"
                    >
                      <Camera className="w-4 h-4 mb-0.5" />
                      <span>Ganti Foto</span>
                      <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                    </label>
                  </div>

                  <div className="min-w-0 pt-2 sm:pt-0 sm:pb-1">
                    <h3 className="font-black text-lg text-slate-900">{store.name}</h3>
                    <p className="text-xs text-slate-500">{store.tagline}</p>
                    <div className="text-[11px] text-[#1683FF] font-semibold mt-0.5 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      <span>{store.address}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Store Profile Edit Form */}
              <form onSubmit={handleSaveProfile} className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs space-y-5">
                <div>
                  <h3 className="font-bold text-base text-slate-900">Edit Informasi Toko Mitra</h3>
                  <p className="text-xs text-slate-500">
                    Perubahan di sini langsung terhubung dan mengubah apa yang dilihat pelanggan di halaman /mitra/{store.id} dan /sewa.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Nama Toko Mitra</label>
                      <input
                        type="text"
                        required
                        value={profileForm.name}
                        onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-[#1683FF]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Tagline / Slogan Layanan</label>
                      <input
                        type="text"
                        required
                        value={profileForm.tagline}
                        onChange={(e) => setProfileForm({ ...profileForm, tagline: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-[#1683FF]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Nomor WhatsApp Resmi Toko</label>
                      <input
                        type="text"
                        required
                        value={profileForm.whatsapp}
                        onChange={(e) => setProfileForm({ ...profileForm, whatsapp: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-[#1683FF]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Jam Operasional Toko</label>
                      <input
                        type="text"
                        required
                        value={profileForm.operationalHours}
                        onChange={(e) => setProfileForm({ ...profileForm, operationalHours: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-[#1683FF]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Alamat Lengkap &amp; Titik Temu Serah Terima</label>
                    <input
                      type="text"
                      required
                      value={profileForm.address}
                      onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-[#1683FF]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Deskripsi Lengkap Toko (Tentang Kami)</label>
                    <textarea
                      rows={3}
                      value={profileForm.about}
                      onChange={(e) => setProfileForm({ ...profileForm, about: e.target.value })}
                      className="w-full p-3 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-[#1683FF]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Kebijakan Deposit &amp; Jaminan Identitas (KTP/KTM)</label>
                    <textarea
                      rows={2}
                      value={profileForm.securityDepositPolicy}
                      onChange={(e) => setProfileForm({ ...profileForm, securityDepositPolicy: e.target.value })}
                      className="w-full p-3 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-[#1683FF]"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="px-6 py-2.5 rounded-xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white text-xs font-bold shadow-2xs transition cursor-pointer"
                    >
                      Simpan Perubahan Profil Toko
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* ============================================================ */}
          {/* VIEW 8: ULASAN PELANGGAN & FITUR BALASAN                     */}
          {/* ============================================================ */}
          {activeMenu === "reviews" && (
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-base text-slate-900">Ulasan Pelanggan Sewa Terverifikasi</h3>
                  <p className="text-xs text-slate-500">
                    Testimoni dari penyewa yang telah menyewa barang dari toko Anda melalui platform terverifikasi Bantuin.
                  </p>
                </div>
                <div className="flex items-center gap-1.5 bg-amber-50 px-3 py-1 rounded-xl border border-amber-200">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span className="text-xs font-black text-amber-800">{store.rating || 4.9} / 5.0</span>
                </div>
              </div>

              <div className="space-y-4 pt-2">
                {store.reviews?.map((rev) => (
                  <div key={rev.id} className="p-4 rounded-2xl border border-slate-100 bg-[#F8FAFC] space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={rev.avatar}
                          alt={rev.userName}
                          className="w-9 h-9 rounded-full object-cover border border-slate-200 bg-white"
                        />
                        <div>
                          <div className="text-xs font-bold text-slate-900">{rev.userName}</div>
                          <div className="text-[10px] text-slate-400">{rev.date} &middot; Unit: <strong>{rev.item}</strong></div>
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

                    {/* Partner Reply Display or Action Button */}
                    {rev.reply ? (
                      <div className="ml-4 p-3 rounded-xl bg-blue-50/70 border border-blue-100 text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-[#1683FF] flex items-center gap-1">
                            <Store className="w-3 h-3" />
                            <span>Tanggapan dari {rev.reply.author || store.name}:</span>
                          </span>
                          <span className="text-[10px] text-slate-400">{rev.reply.date}</span>
                        </div>
                        <p className="text-slate-700">{rev.reply.comment}</p>
                      </div>
                    ) : (
                      <div className="flex justify-end">
                        <button
                          onClick={() => handleOpenReplyModal(rev)}
                          className="text-xs font-bold text-[#1683FF] hover:bg-blue-50 px-3 py-1.5 rounded-lg transition inline-flex items-center gap-1"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>Balas Ulasan Ini</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* VIEW 9: SETTINGS (OPERASIONAL & REKENING PAYOUT)             */}
          {/* ============================================================ */}
          {activeMenu === "settings" && (
            <form onSubmit={handleSaveSettings} className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs space-y-6">
              <div>
                <h3 className="font-bold text-base text-slate-900">Pengaturan Toko &amp; Rekening Pencairan</h3>
                <p className="text-xs text-slate-500">Atur ketersediaan penerimaan sewa, aturan identitas, dan rekening payout transfer manual admin</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <div>
                    <div className="text-xs font-bold text-slate-900">Status Menerima Sewa Baru</div>
                    <div className="text-[11px] text-slate-500">Toko dan seluruh unit aktif tayang di pencarian sewa publik</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settingsForm.isAcceptingRentals}
                    onChange={(e) => setSettingsForm({ ...settingsForm, isAcceptingRentals: e.target.checked })}
                    className="w-5 h-5 accent-[#1683FF] rounded cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <div>
                    <div className="text-xs font-bold text-slate-900">Wajib Titip Identitas Fisik (KTP/KTM Asli)</div>
                    <div className="text-[11px] text-slate-500">Syarat standar serah terima barang sewa di Bantuin.id</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settingsForm.requirePhysicalId}
                    onChange={(e) => setSettingsForm({ ...settingsForm, requirePhysicalId: e.target.checked })}
                    className="w-5 h-5 accent-[#1683FF] rounded cursor-pointer"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Bank Rekening Payout</label>
                    <select
                      value={settingsForm.payoutBank}
                      onChange={(e) => setSettingsForm({ ...settingsForm, payoutBank: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-[#1683FF]"
                    >
                      <option value="BCA">BCA (Bank Central Asia)</option>
                      <option value="Mandiri">Bank Mandiri</option>
                      <option value="BRI">BRI</option>
                      <option value="BNI">BNI</option>
                      <option value="BSI">BSI (Bank Syariah Indonesia)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Nomor Rekening</label>
                    <input
                      type="text"
                      value={settingsForm.payoutAccountNumber}
                      onChange={(e) => setSettingsForm({ ...settingsForm, payoutAccountNumber: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-[#1683FF]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Nama Pemilik Rekening</label>
                    <input
                      type="text"
                      value={settingsForm.payoutAccountHolder}
                      onChange={(e) => setSettingsForm({ ...settingsForm, payoutAccountHolder: e.target.value })}
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
          {/* VIEW 10: PROMOSIKAN TOKO MITRA                               */}
          {/* ============================================================ */}
          {activeMenu === "promotions" && (
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-base text-slate-900">Promosikan Toko Mitra di Beranda Utama</h3>
                  <p className="text-xs text-slate-500">
                    Tampilkan toko Anda di banner/slot Toko Mitra Unggulan di halaman utama Bantuin untuk meningkatkan kunjungan penyewa.
                  </p>
                </div>
                <Link
                  href="/mitra/dashboard/promosi/buat?target=store"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white text-xs font-bold shadow-xs transition cursor-pointer self-start sm:self-auto"
                >
                  <Rocket className="w-4 h-4" />
                  <span>Promosikan Profil Toko</span>
                </Link>
              </div>

              {/* Prinsip Integritas Promosi */}
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-amber-950">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Prinsip Integritas Promosi Bantuin:</span>
                </div>
                <p className="leading-relaxed text-[11px] text-amber-800">
                  Promosi hanya mempengaruhi <strong>penempatan/slot visual etalase</strong> di beranda. Promosi <strong>TIDAK PERNAH</strong> mengubah skor rating, jumlah ulasan, atau skor reputasi organik toko Anda. Listing berbayar selalu diberi label transparan &ldquo;Promosi / Unggulan&rdquo;.
                </p>
              </div>

              {/* Status Promosi Toko Aktif */}
              {(() => {
                const storePromos = partnerPromotions.filter(p => p.targetType === "store");
                return storePromos.length > 0 ? (
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Status Promosi Toko Saat Ini:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      {storePromos.map((prm) => {
                        const isActive = prm.status === "active";
                        return (
                          <div key={prm.id} className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2.5">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-900 truncate max-w-[200px]">
                                {prm.targetTitle || store.name}
                              </span>
                              <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md ${
                                isActive ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-600 border border-slate-200"
                              }`}>
                                {isActive ? "Sedang Tayang" : prm.status}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 space-y-0.5">
                              <div>Paket: <strong>{prm.packageName}</strong> &middot; Biaya: <strong>{formatIDR(prm.amount)}</strong></div>
                              {prm.endDate && (
                                <div>Berakhir: {new Date(prm.endDate).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</div>
                              )}
                            </div>
                            <div className="pt-1 flex items-center justify-between border-t border-slate-100">
                              <span className="text-[10px] text-slate-400">Target: Profil Toko Mitra</span>
                              <button
                                type="button"
                                onClick={() => handleTogglePromoStatus(prm.id)}
                                className="text-[11px] font-bold text-[#1683FF] hover:underline"
                              >
                                {isActive ? "Jeda Promosi" : "Aktifkan Kembali"}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="p-8 rounded-2xl border border-dashed border-slate-200 text-center space-y-2">
                    <Store className="w-10 h-10 text-slate-300 mx-auto" />
                    <h4 className="text-sm font-bold text-slate-800">Toko Mitra Belum Dipromosikan</h4>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                      Dapatkan visibilitas maksimal di etalase Mitra Unggulan Beranda dengan mengaktifkan paket promosi resmi.
                    </p>
                  </div>
                );
              })()}
            </div>
          )}

          {/* ============================================================ */}
          {/* VIEW 11: PROMOSIKAN UNIT SEWA                                */}
          {/* ============================================================ */}
          {activeMenu === "promote_rental" && (
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-base text-slate-900">Promosikan Unit Sewa Tertentu</h3>
                  <p className="text-xs text-slate-500">
                    Pilih unit kamera, lensa, atau gear spesifik dari katalog toko untuk ditempatkan di carousel Sewa Unggulan Beranda.
                  </p>
                </div>
                <Link
                  href="/mitra/dashboard/promosi/buat?target=unit"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white text-xs font-bold shadow-xs transition cursor-pointer self-start sm:self-auto"
                >
                  <Rocket className="w-4 h-4" />
                  <span>Promosikan Unit Sewa</span>
                </Link>
              </div>

              {/* Status Promosi Unit Sewa */}
              {(() => {
                const rentalPromos = partnerPromotions.filter(p => p.targetType === "rental");
                return rentalPromos.length > 0 ? (
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Daftar Unit Sewa yang Sedang Dipromosikan:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      {rentalPromos.map((prm) => {
                        const isActive = prm.status === "active";
                        return (
                          <div key={prm.id} className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2.5">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-900 truncate max-w-[200px]">
                                {prm.targetTitle || "Unit Sewa"}
                              </span>
                              <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md ${
                                isActive ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-600 border border-slate-200"
                              }`}>
                                {isActive ? "Sedang Tayang" : prm.status}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 space-y-0.5">
                              <div>Paket: <strong>{prm.packageName}</strong> &middot; Biaya: <strong>{formatIDR(prm.amount)}</strong></div>
                              {prm.endDate && (
                                <div>Berakhir: {new Date(prm.endDate).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</div>
                              )}
                            </div>
                            <div className="pt-1 flex items-center justify-between border-t border-slate-100">
                              <span className="text-[10px] text-slate-400">Target: Produk Unit Rental</span>
                              <button
                                type="button"
                                onClick={() => handleTogglePromoStatus(prm.id)}
                                className="text-[11px] font-bold text-[#1683FF] hover:underline"
                              >
                                {isActive ? "Jeda Promosi" : "Aktifkan Kembali"}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="p-8 rounded-2xl border border-dashed border-slate-200 text-center space-y-2">
                    <Package className="w-10 h-10 text-slate-300 mx-auto" />
                    <h4 className="text-sm font-bold text-slate-800">Belum Ada Unit Sewa yang Dipromosikan</h4>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                      Pilih barang terlaris dari katalog sewa Anda agar tampil di posisi terdepan etalase beranda Bantuin.
                    </p>
                    <Link
                      href="/mitra/dashboard/promosi/buat?target=unit"
                      className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white text-xs font-bold transition shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" /> Pilih Unit untuk Dipromosikan
                    </Link>
                  </div>
                );
              })()}
            </div>
          )}

          {/* ============================================================ */}
          {/* VIEW 12: CHAT DENGAN PENYEWA                                 */}
          {/* ============================================================ */}
          {activeMenu === "chat" && (
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-base text-slate-900">Pusat Pesan &amp; Komunikasi Sewa</h3>
                  <p className="text-xs text-slate-500">Koordinasikan titik serah terima, panduan unit, dan jadwal pengembalian</p>
                </div>
                <Link
                  href="/chat?role=partner"
                  className="px-4 py-2 rounded-xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white text-xs font-bold transition"
                >
                  Buka Ruang Chat Penuh
                </Link>
              </div>

              <div className="divide-y divide-slate-100">
                {[
                  { name: "Dimas Anggoro", unit: "Sony Alpha A7 III", msg: "Halo mas, untuk titik temu di lobi Rektorat jam 2 siang aman ya?", time: "10:15 WIB", unread: true },
                  { name: "Rifky Fauzi", unit: "DJI Ronin RS 3 Gimbal", msg: "Mas unit sudah selesai dicek belum ya untuk depositnya?", time: "Kemarin", unread: false },
                  { name: "Natasha Caroline", unit: "Fujifilm X-T30 II", msg: "Terima kasih mas, kameranya mantap banget dipakai wisuda!", time: "2 hari lalu", unread: false },
                ].map((c, i) => (
                  <div key={i} className="py-3.5 flex items-center justify-between hover:bg-slate-50 px-2 rounded-xl transition cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 text-[#1683FF] font-bold text-xs flex items-center justify-center">
                        {c.name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">{c.name}</span>
                          <span className="text-[10px] text-slate-400">&middot; {c.unit}</span>
                          <UnreadBadge count={c.unread ? 1 : 0} dotOnly className="static shrink-0" />
                        </div>
                        <p className="text-[11px] text-slate-500 truncate max-w-sm mt-0.5">{c.msg}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block">{c.time}</span>
                      <Link href="/chat?role=partner" className="text-[11px] text-[#1683FF] font-bold hover:underline">
                        Balas
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* VIEW 13: NOTIFIKASI TOKO MITRA                               */}
          {/* ============================================================ */}
          {activeMenu === "notifications" && (
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-base text-slate-900">Notifikasi Toko Mitra</h3>
                  <p className="text-xs text-slate-500">Pembaruan transaksi sewa, jadwal serah terima, dan pencairan hak sewa</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setPartnerNotifications(partnerNotifications.map(n => ({ ...n, isRead: true })));
                    addToast?.("Semua Dibaca", "Seluruh notifikasi telah ditandai sebagai sudah dibaca.");
                  }}
                  className="text-xs font-bold text-[#1683FF] hover:underline"
                >
                  Tandai Semua Dibaca
                </button>
              </div>

              <div className="space-y-2.5">
                {partnerNotifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-4 rounded-2xl border transition flex items-start justify-between gap-3 ${
                      notif.isRead ? "bg-white border-slate-100" : "bg-blue-50/40 border-blue-200"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-xl bg-blue-100 text-[#1683FF] flex items-center justify-center shrink-0 mt-0.5">
                        <Bell className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900">{notif.title}</div>
                        <p className="text-[11px] text-slate-600 mt-0.5">{notif.message}</p>
                        <span className="text-[10px] text-slate-400 mt-1 block">{notif.time}</span>
                      </div>
                    </div>
                    {!notif.isRead && (
                      <span className="w-2 h-2 rounded-full bg-[#1683FF] shrink-0 mt-2" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* VIEW 14: LAPORAN & SENGKETA RENTAL                           */}
          {/* ============================================================ */}
          {activeMenu === "disputes" && (
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-2xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-base text-slate-900">Pusat Laporan &amp; Sengketa Sewa</h3>
                  <p className="text-xs text-slate-500">
                    Laporkan kerusakan fisik barang, keterlambatan pengembalian ekstrem, atau klaim potongan deposit jaminan.
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

              {/* Daftar Laporan Aktif Mitra */}
              <div className="space-y-3">
                {partnerReports.map((rep) => {
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
                        <span>Penyewa Terlapor: <strong className="text-slate-700">{rep.targetName}</strong></span>
                        <span>Dilaporkan: {new Date(rep.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}</span>
                      </div>
                    </div>
                  );
                })}

                {partnerReports.length === 0 && (
                  <div className="text-center py-10 text-slate-400 text-xs">
                    Tidak ada laporan sengketa aktif. Seluruh transaksi sewa dan pengembalian unit berjalan tertib.
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </main>

      {/* ============================================================ */}
      {/* MODAL 1: TAMBAH / EDIT UNIT RENTAL (DENGAN UPLOAD LOKAL)      */}
      {/* ============================================================ */}
      {isCatalogModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">
                  {editingCatalogItem ? "Edit Unit Rental" : "Tambah Unit Rental Baru"}
                </h3>
                <p className="text-[11px] text-slate-500">Tayang langsung di pencarian dan etalase toko sewa</p>
              </div>
              <button onClick={() => setIsCatalogModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCatalogItem} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Barang / Seri Unit</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Sony Alpha A7 III (Body Only)"
                  value={catalogForm.name}
                  onChange={(e) => setCatalogForm({ ...catalogForm, name: e.target.value })}
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
                    <option value="Kamera">Kamera</option>
                    <option value="Lensa">Lensa</option>
                    <option value="Audio">Audio &amp; Mic</option>
                    <option value="Lighting">Lighting Studio</option>
                    <option value="Drone">Drone &amp; Action Cam</option>
                    <option value="Aksesoris">Aksesoris &amp; Gimbal</option>
                    <option value="Proyektor">Proyektor</option>
                    <option value="Display">Display &amp; Layar</option>
                    <option value="__CUSTOM__">+ Buat Kategori Baru...</option>
                  </select>

                  {catalogForm.category === "__CUSTOM__" && (
                    <div className="mt-2 space-y-1.5 animate-in fade-in duration-150">
                      <input
                        type="text"
                        required
                        placeholder="Nama kategori kustom (misal: Rig Sinema)"
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
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tarif Sewa / Hari (Rp)</label>
                  <input
                    type="number"
                    required
                    placeholder="150000"
                    value={catalogForm.price}
                    onChange={(e) => setCatalogForm({ ...catalogForm, price: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#1683FF]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Deposit Jaminan (Rp)</label>
                  <input
                    type="number"
                    required
                    placeholder="200000"
                    value={catalogForm.depositAmount}
                    onChange={(e) => setCatalogForm({ ...catalogForm, depositAmount: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#1683FF]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Jumlah Unit Tersedia (Stok)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={catalogForm.stockCount}
                    onChange={(e) => setCatalogForm({ ...catalogForm, stockCount: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#1683FF]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Status Ketersediaan</label>
                  <select
                    value={catalogForm.stockStatus}
                    onChange={(e) => setCatalogForm({ ...catalogForm, stockStatus: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#1683FF]"
                  >
                    <option value="Siap Sewa">Siap Sewa</option>
                    <option value="Sedang Disewa">Sedang Disewa</option>
                    <option value="Dalam Perawatan">Dalam Perawatan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Badge Tag</label>
                  <input
                    type="text"
                    placeholder="Terlaris / Primadona / 4K"
                    value={catalogForm.tag}
                    onChange={(e) => setCatalogForm({ ...catalogForm, tag: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#1683FF]"
                  />
                </div>
              </div>

              {/* Upload Foto Galeri Katalog (Bisa Lebih Dari 1 Foto) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700">
                    Foto Galeri Produk Katalog
                  </label>
                  <span className="text-[11px] font-bold text-[#1683FF] bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
                    {catalogForm.photos?.length || 0} Foto Terpasang
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Unggah lebih dari satu foto untuk katalog unit. Foto pertama otomatis menjadi foto sampul utama yang dilihat pelanggan di halaman sewa.
                </p>

                {/* List Preview Grid Foto */}
                {catalogForm.photos && catalogForm.photos.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 p-2.5 bg-slate-50 rounded-2xl border border-slate-200/80">
                    {catalogForm.photos.map((photoUrl, idx) => (
                      <div
                        key={idx}
                        className={`relative group rounded-xl overflow-hidden aspect-square border-2 transition ${
                          idx === 0
                            ? "border-[#1683FF] ring-2 ring-blue-100 shadow-xs"
                            : "border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <img
                          src={photoUrl}
                          alt={`Foto Katalog ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        
                        {/* Badge / Button Foto Utama */}
                        {idx === 0 ? (
                          <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-[#1683FF] text-white text-[9px] font-extrabold rounded-md shadow-xs flex items-center gap-0.5">
                            <Star className="w-2.5 h-2.5 fill-white" />
                            <span>Utama</span>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSetPrimaryPhoto(idx)}
                            className="absolute top-1 left-1 px-1.5 py-0.5 bg-black/70 hover:bg-[#1683FF] text-white text-[9px] font-bold rounded-md opacity-0 group-hover:opacity-100 transition shadow-xs flex items-center gap-0.5 cursor-pointer"
                            title="Jadikan Foto Utama"
                          >
                            <Star className="w-2.5 h-2.5" />
                            <span>Jadikan Utama</span>
                          </button>
                        )}

                        {/* Tombol Hapus Foto */}
                        <button
                          type="button"
                          onClick={() => handleRemoveCatalogPhoto(idx)}
                          className="absolute top-1 right-1 w-5 h-5 bg-rose-600/90 hover:bg-rose-600 text-white rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow-xs cursor-pointer"
                          title="Hapus Foto Ini"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Upload Action Area */}
                <div className="space-y-2">
                  <label className="w-full px-3.5 py-2.5 rounded-xl border border-dashed border-[#1683FF]/60 hover:border-[#1683FF] text-xs font-bold text-[#1683FF] hover:bg-blue-50/50 transition cursor-pointer flex items-center justify-center gap-2 bg-blue-50/20">
                    <Upload className="w-3.5 h-3.5 text-[#1683FF]" />
                    <span>+ Pilih Foto Lokal (Bisa Pilih Banyak Foto Sekaligus)</span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleCatalogPhotoFiles}
                      className="hidden"
                    />
                  </label>

                  {/* Input Tambah URL Foto */}
                  <div className="flex items-center gap-1.5">
                    <input
                      type="url"
                      placeholder="Atau tempel URL foto web (https://...)"
                      value={newPhotoUrlInput}
                      onChange={(e) => setNewPhotoUrlInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddPhotoByUrl();
                        }
                      }}
                      className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#1683FF]"
                    />
                    <button
                      type="button"
                      onClick={handleAddPhotoByUrl}
                      className="px-3 py-2 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-[#1683FF] rounded-xl text-xs font-bold transition flex items-center gap-1 shrink-0 cursor-pointer border border-slate-200"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Tambah URL</span>
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Deskripsi Kondisi &amp; Spesifikasi</label>
                <textarea
                  rows={2}
                  placeholder="Sensor bersih, autofocus kilat, baterai sehat siap pakai..."
                  value={catalogForm.desc}
                  onChange={(e) => setCatalogForm({ ...catalogForm, desc: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#1683FF]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Kelengkapan Barang yang Didapat Penyewa</label>
                <input
                  type="text"
                  placeholder="Contoh: Body Kamera, 2 Baterai, Dual Charger, SD Card 64GB, Tas"
                  value={catalogForm.includedItems}
                  onChange={(e) => setCatalogForm({ ...catalogForm, includedItems: e.target.value })}
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
                  {editingCatalogItem ? "Simpan Perubahan" : "Publikasikan Unit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 2: TAMBAH PAKET BUNDLING SEWA                          */}
      {/* ============================================================ */}
      {isPackageModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-sm font-extrabold text-slate-900">Tambah Paket Bundling Sewa Baru</h3>
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
                  placeholder="Contoh: Paket Dokumentasi Wisuda Kilat"
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
                    <option value="Paket Pro Sinema">Paket Pro Sinema</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Harga / Hari (Rp)</label>
                  <input
                    type="number"
                    required
                    placeholder="250000"
                    value={packageForm.price}
                    onChange={(e) => setPackageForm({ ...packageForm, price: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#1683FF]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Durasi Sewa Paket</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: 1 Hari (24 Jam)"
                  value={packageForm.duration}
                  onChange={(e) => setPackageForm({ ...packageForm, duration: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#1683FF]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Kelengkapan Paket (1 alat per baris)</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Sony Alpha A7 III / Fujifilm X-T30 II&#10;Lensa Portrait F/1.8&#10;2 Baterai Cadangan & Dual Charger&#10;SD Card 64GB High Speed&#10;Tas Waterproof"
                  value={packageForm.featuresStr}
                  onChange={(e) => setPackageForm({ ...packageForm, featuresStr: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#1683FF]"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="populer-check-sewa"
                  checked={packageForm.isPopular}
                  onChange={(e) => setPackageForm({ ...packageForm, isPopular: e.target.checked })}
                  className="w-4 h-4 accent-[#1683FF] rounded cursor-pointer"
                />
                <label htmlFor="populer-check-sewa" className="text-xs font-bold text-slate-700 cursor-pointer">
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
      {/* MODAL 3: TAMBAH FOTO GALERI SHOWCASE (UPLOAD LOKAL)          */}
      {/* ============================================================ */}
      {isGalleryModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-sm font-extrabold text-slate-900">Tambah Foto Galeri Showcase</h3>
              <button onClick={() => setIsGalleryModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveGallery} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Judul Setup / Unit</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Setup Sony A7 III & Rig Sinematik"
                  value={galleryForm.title}
                  onChange={(e) => setGalleryForm({ ...galleryForm, title: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#1683FF]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Kategori Alat</label>
                <select
                  value={galleryForm.category}
                  onChange={(e) => setGalleryForm({ ...galleryForm, category: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#1683FF]"
                >
                  <option value="Kamera & Rig">Kamera &amp; Rig</option>
                  <option value="Stabilizer">Stabilizer Gimbal</option>
                  <option value="Lighting">Lighting Studio</option>
                  <option value="Audio">Audio &amp; Mic</option>
                  <option value="Drone">Drone</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">File Foto (Dari Lokal)</label>
                <div className="flex items-center gap-3">
                  <img
                    src={galleryForm.url}
                    alt="Preview"
                    className="w-16 h-12 rounded-xl object-cover border border-slate-200 shrink-0 bg-slate-50"
                  />
                  <label className="flex-1 px-3 py-2 rounded-xl border border-dashed border-slate-300 hover:border-[#1683FF] text-xs font-bold text-slate-600 hover:text-[#1683FF] transition cursor-pointer text-center flex items-center justify-center gap-1.5 bg-slate-50 hover:bg-blue-50/40">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Pilih Foto dari Komputer / HP</span>
                    <input type="file" accept="image/*" onChange={handleGalleryPhotoFile} className="hidden" />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Deskripsi Singkat</label>
                <textarea
                  rows={3}
                  placeholder="Keterangan unit terawat, sensor bersih, siap pakai..."
                  value={galleryForm.description}
                  onChange={(e) => setGalleryForm({ ...galleryForm, description: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#1683FF]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsGalleryModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white text-xs font-bold shadow-2xs transition cursor-pointer"
                >
                  Simpan ke Galeri
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
                <h3 className="text-sm font-extrabold text-slate-900">Tarik Saldo Hak Pembayaran Mitra</h3>
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
                  <label className="block text-xs font-bold text-slate-700 mb-1">Bank Rekening</label>
                  <select
                    value={withdrawForm.bankName}
                    onChange={(e) => setWithdrawForm({ ...withdrawForm, bankName: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-[#1683FF]"
                  >
                    <option value="BCA">BCA</option>
                    <option value="Mandiri">Bank Mandiri</option>
                    <option value="BRI">BRI</option>
                    <option value="BNI">BNI</option>
                    <option value="BSI">BSI</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nomor Rekening</label>
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
                  <span>Total Ditransfer ke Rekening:</span>
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
                  disabled={Number(withdrawForm.amount) <= 0 || Number(withdrawForm.amount) > mitraAvailableBalance}
                  className="px-5 py-2 rounded-xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white text-xs font-bold shadow-2xs transition cursor-pointer disabled:opacity-50"
                >
                  Konfirmasi Penarikan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 5: BALAS ULASAN PELANGGAN                              */}
      {/* ============================================================ */}
      {isReplyModalOpen && selectedReviewToReply && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-md w-full shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-sm font-extrabold text-slate-900">
                Balas Ulasan dari {selectedReviewToReply.userName}
              </h3>
              <button onClick={() => setIsReplyModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveReviewReply} className="space-y-3.5">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-700 italic">
                &ldquo;{selectedReviewToReply.comment}&rdquo;
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tanggapan Toko Anda</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Terima kasih Kak telah menyewa unit di Focus Lens Studio..."
                  value={replyCommentText}
                  onChange={(e) => setReplyCommentText(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#1683FF]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsReplyModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white text-xs font-bold shadow-2xs transition cursor-pointer"
                >
                  Kirim Balasan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 6: DETAIL HANDOVER & INSPEKSI KONDISI FISIK (SEKSI M)  */}
      {/* ============================================================ */}
      {selectedOrderForHandover && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-mono font-bold text-[#1683FF] uppercase tracking-wider block">
                  {selectedOrderForHandover.orderNumber}
                </span>
                <h3 className="text-sm font-extrabold text-slate-900">{selectedOrderForHandover.unitName}</h3>
              </div>
              <button 
                onClick={() => setSelectedOrderForHandover(null)} 
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Ringkasan Biaya & Proteksi */}
            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
              <div>
                <span className="text-slate-400 block text-[11px]">Penyewa:</span>
                <span className="font-bold text-slate-900">{selectedOrderForHandover.customerName}</span>
                <span className="text-[10px] text-slate-500 block">{selectedOrderForHandover.customerPhone}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Biaya Sewa & Deposit:</span>
                <span className="font-bold text-slate-900">{formatIDR(selectedOrderForHandover.amount)}</span>
                <span className="text-[11px] font-semibold text-emerald-600 block">
                  Deposit: {formatIDR(selectedOrderForHandover.depositAmount)} (Terkonfirmasi)
                </span>
              </div>
            </div>

            {/* Bukti Foto Kondisi Barang (Sebelum vs Sesudah) Sesuai Section M */}
            <div>
              <h4 className="text-xs font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-[#1683FF]" />
                <span>Bukti Kondisi Fisik Unit Sewa</span>
              </h4>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
                  <span className="font-bold text-slate-700 text-[11px] block">Sebelum Disewa (Handover Awal):</span>
                  {selectedOrderForHandover.photoBefore ? (
                    <img 
                      src={selectedOrderForHandover.photoBefore} 
                      alt="Sebelum Sewa" 
                      className="w-full h-24 object-cover rounded-lg border border-slate-200"
                    />
                  ) : (
                    <div className="h-24 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 text-[10px]">
                      Belum ada foto
                    </div>
                  )}
                  <p className="text-[10px] text-slate-600 leading-tight">
                    {selectedOrderForHandover.conditionBefore || "Pemeriksaan awal lengkap."}
                  </p>
                </div>

                <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
                  <span className="font-bold text-slate-700 text-[11px] block">Setelah Dikembalikan:</span>
                  {selectedOrderForHandover.photoAfter ? (
                    <img 
                      src={selectedOrderForHandover.photoAfter} 
                      alt="Setelah Sewa" 
                      className="w-full h-24 object-cover rounded-lg border border-slate-200"
                    />
                  ) : (
                    <div className="h-24 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 text-[10px]">
                      Menunggu serah terima
                    </div>
                  )}
                  <p className="text-[10px] text-slate-600 leading-tight">
                    {selectedOrderForHandover.conditionAfter || "Unit belum masuk fase pengembalian."}
                  </p>
                </div>
              </div>
            </div>

            {/* Timeline Handover */}
            <div>
              <h4 className="text-xs font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-600" />
                <span>Alur Status Handover</span>
              </h4>
              <div className="space-y-3 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 pl-7 text-xs">
                {selectedOrderForHandover.timeline?.map((step, sIdx) => (
                  <div key={sIdx} className="relative">
                    <div className="absolute -left-7 top-1 w-3.5 h-3.5 rounded-full bg-[#1683FF] border-2 border-white ring-2 ring-blue-100" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{step.status}</span>
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
                  addToast?.("Laporan Terkirim", "Sengketa handover diteruskan ke Admin Bantuin untuk investigasi.");
                  setSelectedOrderForHandover(null);
                }}
                className="text-xs font-bold text-rose-600 hover:bg-rose-50 px-3 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Laporkan Kerusakan / Sengketa</span>
              </button>

              <div className="flex items-center gap-2">
                <Link
                  href="/chat?room=order-room-rental-kamera&role=helper"
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition"
                >
                  Chat Klien
                </Link>
                <button
                  type="button"
                  onClick={() => setSelectedOrderForHandover(null)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 7: PROMOSIKAN TOKO / FEATURED LANDING (SEKSI AA - AE)  */}
      {/* ============================================================ */}
      {isPromoModalOpen && selectedPromoPackage && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-md w-full shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold text-[#1683FF] uppercase tracking-wider block">
                  Promosikan Toko Mitra
                </span>
                <h3 className="text-sm font-extrabold text-slate-900">
                  {selectedPromoPackage.name} &middot; {selectedPromoPackage.durationDays} Hari
                </h3>
              </div>
              <button 
                onClick={() => {
                  setIsPromoModalOpen(false);
                  setPromoStep("select");
                }} 
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {promoStep === "review" && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Toko yang Dipromosikan:</span>
                    <span className="font-bold text-slate-900">{store.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Durasi Penempatan:</span>
                    <span className="font-bold text-slate-900">{selectedPromoPackage.durationDays} Hari</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Placement:</span>
                    <span className="font-bold text-[#1683FF]">Section Unggulan Beranda</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-blue-200 font-bold text-sm">
                    <span className="text-slate-900">Total Biaya Promosi:</span>
                    <span className="text-[#1683FF] font-black">{formatIDR(selectedPromoPackage.price)}</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-amber-50 text-[11px] text-amber-800 border border-amber-200 leading-relaxed">
                  Catatan: Promosi toko tidak mempengaruhi rating organik toko. Toko akan tampil dengan label resmi &ldquo;Promosi / Unggulan&rdquo;.
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsPromoModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const order = promotionService.createPromotionOrder({
                        ownerId: store.id,
                        storeName: store.name,
                        packageId: selectedPromoPackage.id,
                        amount: selectedPromoPackage.price,
                        paymentMethod: "QRIS",
                      });
                      setCurrentPromoOrder(order);
                      setPromoStep("pending_payment");
                    }}
                    className="px-5 py-2.5 rounded-xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white text-xs font-bold shadow-2xs transition cursor-pointer"
                  >
                    Lanjutkan ke Pembayaran
                  </button>
                </div>
              </div>
            )}

            {promoStep === "pending_payment" && currentPromoOrder && (
              <div className="space-y-4 text-xs">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">ID Tagihan:</span>
                    <span className="font-mono font-bold text-slate-900">{currentPromoOrder.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Metode Pembayaran:</span>
                    <span className="font-bold text-slate-900">QRIS / Transfer Virtual Account</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Status Pembayaran:</span>
                    <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-bold uppercase text-[10px]">
                      {currentPromoOrder.paymentStatus}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-slate-200 font-bold">
                    <span>Jumlah yang Harus Dibayar:</span>
                    <span className="text-slate-900 font-black text-sm">{formatIDR(currentPromoOrder.amount)}</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-center space-y-1">
                  <p className="text-[11px] font-bold text-[#1683FF]">Simulasi Pembayaran (Mode Mock Frontend):</p>
                  <p className="text-[10px] text-slate-600">
                    Sistem backend VPS & payment gateway riil akan disambungkan oleh backend engineer. Klik tombol konfirmasi simulasi untuk mengaktifkan slot promosi sekarang.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsPromoModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                  >
                    Tutup
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const activated = promotionService.confirmPromotionPayment(currentPromoOrder.id);
                      if (activated) {
                        setActivePromotions([activated]);
                        setPromoStep("success");
                        addToast?.("Promosi Aktif!", `Paket ${selectedPromoPackage.name} berhasil diaktifkan.`);
                      }
                    }}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-2xs transition cursor-pointer flex items-center gap-1.5"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Konfirmasi Pembayaran (Simulasi)</span>
                  </button>
                </div>
              </div>
            )}

            {promoStep === "success" && (
              <div className="space-y-4 text-center py-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm">Promosi Toko Berhasil Diaktifkan!</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Toko Anda sekarang tampil di slot promosi beranda Bantuin. Slot aktif selama {selectedPromoPackage.durationDays} hari.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPromoModalOpen(false)}
                  className="w-full py-2.5 rounded-xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white text-xs font-bold shadow-2xs transition cursor-pointer"
                >
                  Selesai
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: PROMOSIKAN UNIT SEWA SPESIFIK                         */}
      {/* ============================================================ */}
      {isRentalPromoModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#1683FF] flex items-center justify-center">
                  <Rocket className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">Promosikan Unit Sewa</h3>
                  <p className="text-[11px] text-slate-500">Penempatan di etalase Sewa Unggulan Beranda</p>
                </div>
              </div>
              <button 
                onClick={() => setIsRentalPromoModalOpen(false)} 
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handlePurchaseRentalPromotion} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Pilih Unit dari Katalog Sewa</label>
                <select
                  value={selectedRentalForPromo}
                  onChange={(e) => setSelectedRentalForPromo(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-[#1683FF]"
                >
                  {store.catalog?.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} &middot; {formatIDR(item.price)} {item.unit}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Pilih Durasi Paket Promosi</label>
                <div className="grid grid-cols-3 gap-2.5">
                  {promoPackages.map((pkg) => {
                    const isSelected = selectedRentalPromoPkgId === pkg.id;
                    return (
                      <button
                        key={pkg.id}
                        type="button"
                        onClick={() => setSelectedRentalPromoPkgId(pkg.id)}
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

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                <div className="flex justify-between items-center text-slate-600">
                  <span>Metode Pembayaran:</span>
                  <span className="font-bold text-slate-900">Payment Gateway Resmi (QRIS)</span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span>Target Penempatan:</span>
                  <span className="font-bold text-[#1683FF]">Carousel Sewa Unggulan</span>
                </div>
                <div className="flex justify-between items-center text-slate-900 pt-2 border-t border-slate-200 font-bold">
                  <span>Total Biaya Promosi:</span>
                  <span className="text-sm font-black text-[#1683FF]">
                    {formatIDR(promoPackages.find((p) => p.id === selectedRentalPromoPkgId)?.price || 120000)}
                  </span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRentalPromoModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white text-xs font-bold shadow-2xs transition cursor-pointer flex items-center gap-1.5"
                >
                  <Rocket className="w-3.5 h-3.5" />
                  <span>Bayar &amp; Aktifkan Promosi Unit</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: BUAT LAPORAN & SENGKETA MITRA SEWA                   */}
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
                  <h3 className="text-sm font-extrabold text-slate-900">Buat Laporan / Sengketa Rental</h3>
                  <p className="text-[11px] text-slate-500">Klaim kerusakan atau pelanggaran sewa ke Admin Bantuin</p>
                </div>
              </div>
              <button 
                onClick={() => setIsDisputeModalOpen(false)} 
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePartnerDispute} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Penyewa / Pihak Terlapor</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Rifky Fauzi"
                  value={disputeForm.targetName}
                  onChange={(e) => setDisputeForm({ ...disputeForm, targetName: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nomor Pesanan Terkait</label>
                <select
                  value={disputeForm.orderId}
                  onChange={(e) => setDisputeForm({ ...disputeForm, orderId: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-rose-500"
                >
                  <option value="">-- Pilih Pesanan Sewa --</option>
                  {partnerOrders.map((o) => (
                    <option key={o.id} value={o.orderNumber}>
                      {o.orderNumber} - {o.customerName} ({o.unitName})
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
                  <option value="Penyewa Merusak Unit / Lecet Parah">Penyewa Merusak Unit / Lecet Parah</option>
                  <option value="Keterlambatan Pengembalian Ekstrem">Keterlambatan Pengembalian Ekstrem</option>
                  <option value="Aksesoris / Kelengkapan Hilang">Aksesoris / Kelengkapan Hilang</option>
                  <option value="Penyewa Menolak Mengembalikan Unit">Penyewa Menolak Mengembalikan Unit</option>
                  <option value="Ajakan Transaksi di Luar Platform">Ajakan Transaksi di Luar Platform</option>
                  <option value="Lainnya">Lainnya / Masalah Teknis</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Kronologi &amp; Rincian Kerusakan</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Jelaskan kondisi unit saat serah terima vs pengembalian, bagian yang rusak, dan estimasi biaya perbaikan..."
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
      {/* ============================================================ */}
      {/* MOBILE GLASS BOTTOM NAVIGATION (lg:hidden)                  */}
      {/* ============================================================ */}
      <nav 
        aria-label="Navigasi Bawah Mitra"
        className="fixed bottom-0 inset-x-0 z-40 lg:hidden bg-white/90 backdrop-blur-xl border-t border-slate-200/80 shadow-[0_-4px_24px_rgba(0,0,0,0.06)] pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-1"
      >
        <div className="grid grid-cols-5 h-14 max-w-lg mx-auto px-1 items-center">
          {/* 1. Ringkasan */}
          <button
            type="button"
            onClick={() => { setActiveMenu("overview"); setIsMobileMoreOpen(false); }}
            className={`flex flex-col items-center justify-center py-1 rounded-xl transition min-h-[44px] cursor-pointer ${
              activeMenu === "overview" ? "text-[#1683FF]" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <div className={`w-9 h-7 rounded-full flex items-center justify-center transition ${
              activeMenu === "overview" ? "bg-[#EAF4FF] text-[#1683FF]" : "bg-transparent"
            }`}>
              <LayoutDashboard className={`w-5 h-5 ${activeMenu === "overview" ? "scale-110" : ""}`} />
            </div>
            <span className="text-[10px] font-bold leading-tight mt-0.5 truncate max-w-[64px]">Home</span>
          </button>

          {/* 2. Unit Sewa */}
          <button
            type="button"
            onClick={() => { setActiveMenu("catalog"); setIsMobileMoreOpen(false); }}
            className={`flex flex-col items-center justify-center py-1 rounded-xl transition min-h-[44px] cursor-pointer ${
              activeMenu === "catalog" ? "text-[#1683FF]" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <div className={`w-9 h-7 rounded-full flex items-center justify-center transition ${
              activeMenu === "catalog" ? "bg-[#EAF4FF] text-[#1683FF]" : "bg-transparent"
            }`}>
              <Package className={`w-5 h-5 ${activeMenu === "catalog" ? "scale-110" : ""}`} />
            </div>
            <span className="text-[10px] font-bold leading-tight mt-0.5 truncate max-w-[64px]">Katalog</span>
          </button>

          {/* 3. Pesanan */}
          <button
            type="button"
            onClick={() => { setActiveMenu("orders"); setIsMobileMoreOpen(false); }}
            className={`flex flex-col items-center justify-center py-1 rounded-xl transition min-h-[44px] cursor-pointer relative ${
              activeMenu === "orders" ? "text-[#1683FF]" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <div className="relative">
              <div className={`w-9 h-7 rounded-full flex items-center justify-center transition ${
                activeMenu === "orders" ? "bg-[#EAF4FF] text-[#1683FF]" : "bg-transparent"
              }`}>
                <Receipt className={`w-5 h-5 ${activeMenu === "orders" ? "scale-110" : ""}`} />
              </div>
              <UnreadBadge count={store.orders?.filter(o => o.status !== "completed").length} />
            </div>
            <span className="text-[10px] font-bold leading-tight mt-0.5 truncate max-w-[64px]">Pesanan</span>
          </button>

          {/* 4. Dompet / Payout */}
          <button
            type="button"
            onClick={() => { setActiveMenu("wallet"); setIsMobileMoreOpen(false); }}
            className={`flex flex-col items-center justify-center py-1 rounded-xl transition min-h-[44px] cursor-pointer ${
              activeMenu === "wallet" ? "text-[#1683FF]" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <div className={`w-9 h-7 rounded-full flex items-center justify-center transition ${
              activeMenu === "wallet" ? "bg-[#EAF4FF] text-[#1683FF]" : "bg-transparent"
            }`}>
              <Wallet className={`w-5 h-5 ${activeMenu === "wallet" ? "scale-110" : ""}`} />
            </div>
            <span className="text-[10px] font-bold leading-tight mt-0.5 truncate max-w-[64px]">Dompet</span>
          </button>

          {/* 5. Lainnya (•••) */}
          <button
            type="button"
            onClick={() => setIsMobileMoreOpen(true)}
            className={`flex flex-col items-center justify-center py-1 rounded-xl transition min-h-[44px] cursor-pointer ${
              isMobileMoreOpen ? "text-[#1683FF]" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <div className={`w-9 h-7 rounded-full flex items-center justify-center transition ${
              isMobileMoreOpen ? "bg-[#EAF4FF] text-[#1683FF]" : "bg-transparent"
            }`}>
              <MoreHorizontal className={`w-5 h-5 ${isMobileMoreOpen ? "scale-110" : ""}`} />
            </div>
            <span className="text-[10px] font-bold leading-tight mt-0.5 truncate max-w-[64px]">Lainnya</span>
          </button>
        </div>
      </nav>

      {/* ============================================================ */}
      {/* MOBILE "LAINNYA" STRUCTURED BOTTOM SHEET                     */}
      {/* ============================================================ */}
      {isMobileMoreOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={() => setIsMobileMoreOpen(false)}
          />

          {/* Bottom Sheet Modal */}
          <div className="relative z-10 bg-white rounded-t-3xl border-t border-slate-200 shadow-2xl p-5 max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-200 space-y-4">
            {/* Sheet Handle & Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Store className="w-4 h-4 text-[#1683FF]" />
                <h3 className="font-extrabold text-sm text-slate-900">Menu Mitra Sewa</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileMoreOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Group 1: Unit & Galeri */}
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Unit &amp; Katalog Sewa
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => { setActiveMenu("catalog"); setIsMobileMoreOpen(false); }}
                  className={`p-3 rounded-2xl border text-left flex items-center gap-2.5 transition ${
                    activeMenu === "catalog" ? "bg-blue-50 border-[#1683FF] text-[#1683FF]" : "bg-slate-50 border-slate-200/80 text-slate-700"
                  }`}
                >
                  <Package className="w-4 h-4 shrink-0 text-[#1683FF]" />
                  <span className="text-xs font-bold truncate">Katalog Unit</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setActiveMenu("gallery"); setIsMobileMoreOpen(false); }}
                  className={`p-3 rounded-2xl border text-left flex items-center gap-2.5 transition ${
                    activeMenu === "gallery" ? "bg-blue-50 border-[#1683FF] text-[#1683FF]" : "bg-slate-50 border-slate-200/80 text-slate-700"
                  }`}
                >
                  <ImageIcon className="w-4 h-4 shrink-0 text-[#1683FF]" />
                  <span className="text-xs font-bold truncate">Galeri Unit</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setActiveMenu("packages"); setIsMobileMoreOpen(false); }}
                  className={`p-3 rounded-2xl border text-left flex items-center gap-2.5 transition col-span-2 ${
                    activeMenu === "packages" ? "bg-blue-50 border-[#1683FF] text-[#1683FF]" : "bg-slate-50 border-slate-200/80 text-slate-700"
                  }`}
                >
                  <Layers className="w-4 h-4 shrink-0 text-[#1683FF]" />
                  <span className="text-xs font-bold truncate">Paket Bundling Sewa</span>
                </button>
              </div>
            </div>

            {/* Group 2: Promosi & Marketing */}
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Promosi &amp; Pemasaran
              </div>
              <button
                type="button"
                onClick={() => { setActiveMenu("promotions"); setIsMobileMoreOpen(false); }}
                className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between transition ${
                  activeMenu === "promotions" ? "bg-blue-50 border-[#1683FF] text-[#1683FF]" : "bg-slate-50 border-slate-200/80 text-slate-700"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Megaphone className="w-4 h-4 text-[#1683FF]" />
                  <div>
                    <div className="text-xs font-bold">Promosi Toko &amp; Unit</div>
                    <div className="text-[10px] text-slate-500">Iklan banner &amp; spotlight pencarian</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            {/* Group 3: Reputasi & Toko */}
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Toko &amp; Pengaturan
              </div>
              <div className="space-y-1.5">
                <button
                  type="button"
                  onClick={() => { setActiveMenu("profile"); setIsMobileMoreOpen(false); }}
                  className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition ${
                    activeMenu === "profile" ? "bg-blue-50 border-[#1683FF] text-[#1683FF]" : "bg-slate-50/60 border-slate-200/60 text-slate-700"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Store className="w-4 h-4 text-slate-500" />
                    <span className="text-xs font-bold">Profil &amp; Lokasi Toko</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </button>

                <button
                  type="button"
                  onClick={() => { setActiveMenu("reviews"); setIsMobileMoreOpen(false); }}
                  className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition ${
                    activeMenu === "reviews" ? "bg-blue-50 border-[#1683FF] text-[#1683FF]" : "bg-slate-50/60 border-slate-200/60 text-slate-700"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-amber-500" />
                    <span className="text-xs font-bold">Ulasan Penyewa</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </button>

                <button
                  type="button"
                  onClick={() => { setActiveMenu("reports"); setIsMobileMoreOpen(false); }}
                  className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition ${
                    activeMenu === "reports" ? "bg-blue-50 border-[#1683FF] text-[#1683FF]" : "bg-slate-50/60 border-slate-200/60 text-slate-700"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-bold">Laporan Bisnis &amp; Sewa</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </button>

                <button
                  type="button"
                  onClick={() => { setActiveMenu("settings"); setIsMobileMoreOpen(false); }}
                  className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition ${
                    activeMenu === "settings" ? "bg-blue-50 border-[#1683FF] text-[#1683FF]" : "bg-slate-50/60 border-slate-200/60 text-slate-700"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Settings className="w-4 h-4 text-slate-500" />
                    <span className="text-xs font-bold">Pengaturan Outlet</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </button>
              </div>
            </div>

            {/* Quick External Links */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
              <Link
                href="/chat"
                className="flex-1 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold text-center flex items-center justify-center gap-1.5"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Chat Workspace</span>
              </Link>
              <Link
                href={`/mitra/${store.id}`}
                target="_blank"
                className="flex-1 py-2 px-3 rounded-xl bg-blue-50 text-[#1683FF] text-xs font-bold text-center flex items-center justify-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Toko Publik</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      </div>
    </RoleGuard>
  );
}
