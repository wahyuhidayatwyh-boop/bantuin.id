"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import logoImg from "@/components/image/logo.png";
import { saveFormDraft, getFormDraft, clearFormDraft, useBeforeUnload } from "@/lib/hooks/useFormDraft";
import { useApp } from "@/lib/context/AppContext";
import UnreadBadge from "@/components/ui/UnreadBadge";
import RoleGuard from "@/components/auth/RoleGuard";
import VerificationBanner from "@/components/auth/VerificationBanner";
import JasaDashboardSkeleton from "@/components/skeletons/JasaDashboardSkeleton";
import { authService } from "@/lib/services/authService";
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
    isAuthReady,
    mitraAvailableBalance, 
    mitraPendingBalance, 
    mitraTotalEarned, 
    withdrawFunds, 
    withdrawals, 
    customerDeposits,
    orderRooms,
    addToast 
  } = useApp();

  // Helper auth token yang andal (sync dengan token JWT aktif & cookies)
  const getAuthToken = () => {
    return (
      authService.getToken?.() ||
      authService.getAccessToken?.() ||
      (typeof window !== "undefined"
        ? localStorage.getItem("bantuin_auth_access_token") ||
          localStorage.getItem("bantuin_auth_session_token") ||
          localStorage.getItem("bantuin_token")
        : null)
    );
  };

  // Helper to build clean store identity exclusively from logged in user (No dummy mockup fallbacks)
  const buildStoreFromUser = (user) => {
    if (!user) {
      return {
        id: "",
        name: "Toko Mitra Sewa",
        tagline: "Rental Resmi Terpercaya",
        category: "Rental & Sewa Alat",
        badge: "Mitra Rental",
        email: "",
        phone: "",
        avatar: null,
        coverImage: null,
        address: "Indonesia",
        verificationStatus: "unverified",
        verificationNotes: "",
        rating: 5.0,
        totalOrders: 0,
        reviewsCount: 0,
        reliabilityScore: 100,
        catalog: [],
        packages: [],
        gallery: [],
        reviews: [],
        about: "Penyedia rental dan sewa alat terverifikasi Bantuin.id.",
        operationalHours: "Setiap Hari, 08:00 - 21:00 WIB",
        securityDepositPolicy: "Wajib menunjukkan identitas fisik (KTP/KTM) dan menyelesaikan pembayaran escrow Bantuin sebelum serah terima unit.",
      };
    }
    return {
      id: user.id,
      name: user.partnerBusinessName || user.fullName || "Toko Mitra Sewa",
      tagline: user.storeCategory ? `Rental Resmi ${user.storeCategory}` : "Rental Resmi Terpercaya",
      category: user.storeCategory || "Rental & Sewa Alat",
      badge: "Mitra Rental Terverifikasi",
      email: user.email,
      phone: user.phoneNumber || user.phone || "",
      avatar: user.avatarUrl && !user.avatarUrl.includes("images.unsplash.com") ? user.avatarUrl : null,
      coverImage: user.bannerUrl || null,
      address: user.partnerAddress || user.campusName || "Indonesia",
      verificationStatus: user.verificationStatus || "unverified",
      verificationNotes: user.verificationNotes || "",
      rating: Number(user.ratingAvg) || 5.0,
      totalOrders: 0,
      reviewsCount: user.ratingCount || 0,
      reliabilityScore: user.reliabilityScore || 100,
      catalog: user.rentals || [],
      packages: user.packages || [],
      gallery: user.gallery || [],
      reviews: user.reviews || [],
      about: user.about || "Penyedia rental dan sewa alat terverifikasi Bantuin.id.",
      operationalHours: user.operatingHours || "Setiap Hari, 08:00 - 21:00 WIB",
      securityDepositPolicy: user.securityDepositPolicy || "Wajib menunjukkan identitas fisik (KTP/KTM) dan menyelesaikan pembayaran escrow Bantuin sebelum serah terima unit.",
    };
  };

  // Primary active rental store derived from logged in user
  const [store, setStore] = useState(() => {
    const built = buildStoreFromUser(currentUser);
    if (typeof window !== "undefined" && currentUser?.id) {
      try {
        const saved = localStorage.getItem(`bantuin_mitra_store_${currentUser.id}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          return {
            ...built,
            ...parsed,
            catalog: (parsed.catalog || []).filter((c) => !String(c.id).startsWith("cam-") && !String(c.image || "").includes("images.unsplash.com")),
          };
        }
      } catch (e) {}
    }
    return built;
  });
  const [isStoreLoading, setIsStoreLoading] = useState(true);

  const [partnerWallet, setPartnerWallet] = useState({
    availableBalance: 0,
    pendingBalance: 0,
    totalEarned: 0,
    withdrawals: [],
  });
  const [partnerReviews, setPartnerReviews] = useState([]);

  const liveAvailableBalance = partnerWallet.availableBalance;
  const livePendingBalance = partnerWallet.pendingBalance;
  const liveTotalEarned = partnerWallet.totalEarned;
  const liveWithdrawals = partnerWallet.withdrawals;

  const fetchWalletData = async () => {
    try {
      const token = getAuthToken();
      if (!token) return;
      const res = await fetch("/api/profile/wallet?role=partner", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success && json.data) {
        setPartnerWallet({
          availableBalance: Number(json.data.availableBalance || 0),
          pendingBalance: Number(json.data.pendingBalance || 0),
          totalEarned: Number(json.data.totalEarned || 0),
          withdrawals: json.data.withdrawals || [],
        });
      }
    } catch (err) {
      console.warn("Could not load partner wallet:", err);
    }
  };

  const fetchReviews = async () => {
    if (!currentUser?.id) return;
    try {
      const token = getAuthToken();
      const res = await fetch(`/api/reviews/${currentUser.id}?type=rental`, {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
      });
      const json = await res.json();
      if (json.success && Array.isArray(json.data?.reviews)) {
        const revList = json.data.reviews.map((r) => ({
          id: r.id,
          userName: r.userName || r.reviewer?.fullName || "Pelanggan Bantuin",
          userAvatar: r.userAvatar || r.avatar || r.reviewer?.avatarUrl || "/logotab.png",
          avatar: r.userAvatar || r.avatar || r.reviewer?.avatarUrl || "/logotab.png",
          rating: r.rating,
          comment: r.comment,
          date: r.date || formatDateIndo(r.createdAt),
          itemTitle: r.itemTitle || r.rentalTitle || r.orderTitle || "Unit Sewa",
          item: r.itemTitle || r.rentalTitle || r.orderTitle || "Unit Sewa",
          reply: r.reply ? { comment: r.reply, date: formatDateIndo(r.repliedAt || r.updatedAt), author: store.name } : null,
        }));
        setPartnerReviews(revList);
        setStore((prev) => ({
          ...prev,
          reviews: revList,
          rating: json.data?.averageRating ?? json.data?.stats?.averageRating ?? prev.rating,
          reviewsCount: json.data?.totalReviews ?? json.data?.stats?.totalReviews ?? revList.length,
        }));
      }
    } catch (err) {
      console.warn("Could not load rental reviews:", err);
    }
  };

  // Sync with live store from database
  useEffect(() => {
    let isMounted = true;
    if (!isAuthReady) return;
    if (!currentUser) {
      setIsStoreLoading(false);
      return;
    }

    const loadStoreAndData = async () => {
      const token = getAuthToken();
      if (!token) {
        setIsStoreLoading(false);
        return;
      }
      try {
        const res = await fetch("/api/mitra/store", {
          headers: { Authorization: `Bearer ${token}` }
        });
        const json = await res.json();
        if (isMounted && json.success && json.data) {
          const d = json.data;
          setStore((prev) => ({
            ...prev,
            id: d.id,
            name: d.partnerBusinessName || d.fullName || "Toko Mitra Sewa",
            tagline: d.bio ? d.bio.slice(0, 50) : "Rental Resmi Terpercaya",
            category: "Rental & Sewa Alat",
            badge: d.verificationStatus === "verified" ? "Mitra Rental Terverifikasi" : "Mitra Rental",
            email: d.email,
            phone: d.phoneNumber || "",
            avatar: d.avatarUrl && !d.avatarUrl.includes("images.unsplash.com") ? d.avatarUrl : null,
            coverImage: d.bannerUrl || null,
            address: d.partnerAddress || d.campusName || "Indonesia",
            verificationStatus: d.verificationStatus || "unverified",
            verificationNotes: d.verificationNotes || "",
            rating: Number(d.ratingAvg) || 5.0,
            reviewsCount: d.ratingCount || 0,
            reliabilityScore: d.reliabilityScore || 100,
            payoutBank: d.payoutBank || "BCA",
            payoutAccountNumber: d.payoutAccountNumber || "",
            payoutAccountHolder: d.payoutAccountHolder || d.partnerBusinessName || d.fullName,
            isAcceptingRentals: d.isAcceptingRentals !== undefined ? Boolean(d.isAcceptingRentals) : true,
            requirePhysicalId: d.requirePhysicalId !== undefined ? Boolean(d.requirePhysicalId) : true,
            securityDepositPolicy: d.securityDepositPolicy || prev.securityDepositPolicy || "Wajib menunjukkan identitas fisik (KTP/KTM) dan menyelesaikan pembayaran escrow Bantuin sebelum serah terima unit.",
            portfolioPhotos: Array.isArray(d.portfolioPhotos) ? d.portfolioPhotos : [],
            catalog: (d.rentals || []).map((r) => {
              let parsedT = {};
              if (r.termsAndConditions) {
                try {
                  if (typeof r.termsAndConditions === "string" && r.termsAndConditions.trim().startsWith("{")) {
                    parsedT = JSON.parse(r.termsAndConditions);
                  } else if (typeof r.termsAndConditions === "object" && r.termsAndConditions !== null) {
                    parsedT = r.termsAndConditions;
                  }
                } catch (_) {}
              }
              return {
                id: r.id,
                name: r.title,
                category: r.category,
                type: "sewa",
                price: Number(r.dailyPrice),
                depositAmount: Number(r.depositAmount),
                unit: r.unit || parsedT.unit || "/ hari",
                image: r.photoUrls?.[0] || "/logotab.png",
                photos: r.photoUrls || [],
                stockStatus: r.stockStatus || parsedT.stockStatus || (r.isAvailable ? "Siap Sewa" : "Sedang Disewa"),
                desc: r.description,
                stockCount: r.stockCount !== undefined ? Number(r.stockCount) : (parsedT.stockCount !== undefined ? Number(parsedT.stockCount) : (r.stock !== undefined ? Number(r.stock) : 1)),
                rating: Number(r.ratingAvg) || 5.0,
                pickupLocation: r.pickupLocation,
                tag: r.tag || parsedT.tag,
                packages: r.packages || parsedT.packages || [],
                pricingMode: r.pricingMode || parsedT.pricingMode || "single",
                includedItems: r.includedItems || parsedT.includedItems || "",
                securityDeposit: r.securityDeposit || parsedT.securityDeposit || "",
              };
            }),
          }));

          setProfileForm((prev) => ({
            ...prev,
            name: d.partnerBusinessName || d.fullName || prev.name,
            address: d.partnerAddress || prev.address,
            whatsapp: d.phoneNumber || prev.whatsapp,
            about: d.bio || prev.about,
            securityDepositPolicy: d.securityDepositPolicy || prev.securityDepositPolicy || "Wajib menunjukkan identitas fisik (KTP/KTM) dan menyelesaikan pembayaran escrow Bantuin sebelum serah terima unit.",
          }));

          setSettingsForm((prev) => ({
            ...prev,
            isAcceptingRentals: d.isAcceptingRentals !== undefined ? Boolean(d.isAcceptingRentals) : prev.isAcceptingRentals,
            requirePhysicalId: d.requirePhysicalId !== undefined ? Boolean(d.requirePhysicalId) : prev.requirePhysicalId,
            payoutBank: d.payoutBank || prev.payoutBank,
            payoutAccountNumber: d.payoutAccountNumber || prev.payoutAccountNumber,
            payoutAccountHolder: d.payoutAccountHolder || prev.payoutAccountHolder,
          }));

          setWithdrawForm((prev) => ({
            ...prev,
            bankName: d.payoutBank || prev.bankName,
            accountNumber: d.payoutAccountNumber || prev.accountNumber,
            accountHolder: d.payoutAccountHolder || d.partnerBusinessName || d.fullName || prev.accountHolder,
          }));
        }
      } catch (err) {
        console.warn("Could not load live store profile from DB:", err);
      } finally {
        if (isMounted) setIsStoreLoading(false);
      }
    };

    loadStoreAndData();
    fetchWalletData();
    fetchReviews();
    fetchNotifications();

    window.addEventListener("bantuin_rentals_updated", loadStoreAndData);
    window.addEventListener("bantuin_mitra_store_updated", loadStoreAndData);

    return () => {
      isMounted = false;
      window.removeEventListener("bantuin_rentals_updated", loadStoreAndData);
      window.removeEventListener("bantuin_mitra_store_updated", loadStoreAndData);
    };
  }, [currentUser?.id, isAuthReady]);

  // Save changes to store state, localStorage, and sync to server
  const handleUpdateStore = async (updatedStore, successMessage = "Data toko mitra berhasil diperbarui.") => {
    setStore(updatedStore);
    saveMitraStoreData(updatedStore);
    if (addToast) {
      addToast("Perubahan Disimpan", successMessage);
    }
    try {
      const token = getAuthToken();
      if (!token) return;
      await fetch("/api/mitra/store", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          portfolioPhotos: updatedStore.portfolioPhotos,
          securityDepositPolicy: updatedStore.securityDepositPolicy,
          bio: updatedStore.about,
          partnerBusinessName: updatedStore.name,
          partnerAddress: updatedStore.address,
        })
      });
    } catch (err) {
      console.warn("Failed to sync store update to server:", err);
    }
  };

  const searchParams = useSearchParams();

  const getInitialMenu = () => {
    if (typeof window !== "undefined") {
      const urlMenu = searchParams?.get("menu");
      if (urlMenu === "packages") return "catalog";
      if (urlMenu) return urlMenu;
      const stored = sessionStorage.getItem("bantuin_mitra_active_menu");
      if (stored === "packages") return "catalog";
      if (stored) return stored;
    }
    return "overview";
  };

  const [activeMenu, setActiveMenuState] = useState(getInitialMenu);

  const setActiveMenu = (menuId) => {
    const targetMenu = menuId === "packages" ? "catalog" : menuId;
    setActiveMenuState(targetMenu);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("bantuin_mitra_active_menu", targetMenu);
      const url = new URL(window.location.href);
      url.searchParams.set("menu", targetMenu);
      window.history.replaceState(null, "", url.toString());
    }
  };

  const [isMobileMoreOpen, setIsMobileMoreOpen] = useState(false);
  // Menu IDs: overview, catalog, packages, gallery, orders, wallet, profile, reviews, settings

  // -------------------------------------------------------------
  // REAL PHOTO UPLOAD HANDLERS (AVATAR & BANNER SAMPUL TOKO)
  // -------------------------------------------------------------
  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await imageService.uploadImage(file, "profile");
      if (res?.success && res.url) {
        const token = getAuthToken();
        await fetch("/api/mitra/store", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify({ avatarUrl: res.url })
        });
        setStore((prev) => ({ ...prev, avatar: res.url }));
        addToast?.("Foto Berhasil Diperbarui", "Logo / avatar toko berhasil disimpan ke database.");
      }
    } catch (err) {
      addToast?.("Gagal Unggah", err.message || "Gagal mengunggah foto.", "error");
    }
  };

  const handleBannerUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await imageService.uploadImage(file, "banner");
      if (res?.success && res.url) {
        const token = getAuthToken();
        await fetch("/api/mitra/store", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify({ bannerUrl: res.url })
        });
        setStore((prev) => ({ ...prev, coverImage: res.url }));
        addToast?.("Banner Berhasil Diperbarui", "Banner sampul toko berhasil disimpan ke database.");
      }
    } catch (err) {
      addToast?.("Gagal Unggah", err.message || "Gagal mengunggah banner.", "error");
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
    depositAmount: 100000,
    unit: "/ hari",
    image: "",
    photos: [],
    stockStatus: "Siap Sewa",
    tag: "Unit Baru",
    desc: "",
    stockCount: 1,
    includedItems: "",
  });
  const [newPhotoUrlInput, setNewPhotoUrlInput] = useState("");

  // 2. Modal: Tambah Foto Galeri Showcase
  const [isGalleryModalOpen, setIsGalleryModalOpen] = useState(false);
  const [galleryForm, setGalleryForm] = useState({
    title: "",
    category: "Kamera & Rig",
    url: "",
    description: "",
  });

  // 4. Modal: Tarik Saldo (Withdrawal)
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [isSubmittingWithdraw, setIsSubmittingWithdraw] = useState(false);
  const [withdrawForm, setWithdrawForm] = useState({
    amount: "200000",
    bankName: store?.payoutBank || "BCA",
    accountNumber: store?.payoutAccountNumber || "",
    accountHolder: store?.payoutAccountHolder || store?.name || currentUser?.fullName || "",
  });

  // 5. Modal: Balas Ulasan Pelanggan
  const [isReplyModalOpen, setIsReplyModalOpen] = useState(false);
  const [selectedReviewToReply, setSelectedReviewToReply] = useState(null);
  const [replyCommentText, setReplyCommentText] = useState("");

  const DRAFT_MITRA_PROFILE_KEY = currentUser?.id ? `bantuin_draft_mitra_profile_${currentUser.id}` : "bantuin_draft_mitra_profile";
  const DRAFT_MITRA_SETTINGS_KEY = currentUser?.id ? `bantuin_draft_mitra_settings_${currentUser.id}` : "bantuin_draft_mitra_settings";

  // 6. Form State: Profil Toko
  const [profileForm, setProfileForm] = useState(() => {
    const saved = getFormDraft(DRAFT_MITRA_PROFILE_KEY, null);
    const initial = {
      name: store.name,
      tagline: store.tagline,
      category: store.category,
      address: store.address,
      whatsapp: store.whatsapp,
      operationalHours: store.operationalHours,
      about: store.about,
      securityDepositPolicy: store.securityDepositPolicy || "Wajib menunjukkan identitas fisik (KTP/KTM) dan menyelesaikan pembayaran escrow Bantuin sebelum serah terima unit.",
    };
    return saved ? { ...initial, ...saved } : initial;
  });

  // 7. Form State: Pengaturan Operasional & Kebijakan
  const [settingsForm, setSettingsForm] = useState(() => {
    const saved = getFormDraft(DRAFT_MITRA_SETTINGS_KEY, null);
    const initial = {
      isAcceptingRentals: store?.isAcceptingRentals !== undefined ? store.isAcceptingRentals : true,
      minRentalDays: 1,
      requirePhysicalId: store?.requirePhysicalId !== undefined ? store.requirePhysicalId : true,
      autoApproveDepositRefund: true,
      payoutBank: store?.payoutBank || "BCA",
      payoutAccountNumber: store?.payoutAccountNumber || "",
      payoutAccountHolder: store?.payoutAccountHolder || store?.name || "",
    };
    return saved ? { ...initial, ...saved } : initial;
  });

  useEffect(() => {
    saveFormDraft(DRAFT_MITRA_PROFILE_KEY, profileForm);
  }, [profileForm, DRAFT_MITRA_PROFILE_KEY]);

  useEffect(() => {
    saveFormDraft(DRAFT_MITRA_SETTINGS_KEY, settingsForm);
  }, [settingsForm, DRAFT_MITRA_SETTINGS_KEY]);

  const isMitraFormDirty = Boolean(
    profileForm.name !== store.name ||
    profileForm.about !== store.about ||
    profileForm.whatsapp !== store.whatsapp
  );
  useBeforeUnload(isMitraFormDirty, "Ada perubahan pengaturan atau profil toko yang belum disimpan. Yakin ingin meninggalkan halaman?");

  // Custom Category State (Section O & P)
  const [customCategoryName, setCustomCategoryName] = useState("");

  // Canonical Partner Handover Orders (Live From Database / Clean State)
  const [partnerOrders, setPartnerOrders] = useState([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [selectedOrderForHandover, setSelectedOrderForHandover] = useState(null);
  const [orderFilter, setOrderFilter] = useState("all");

  const fetchOrders = async () => {
    const token = getAuthToken();
    if (!token) return;
    setIsLoadingOrders(true);
    try {
      const res = await fetch("/api/rentals/bookings?role=owner", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      let dbMapped = [];
      if (json.success && Array.isArray(json.data?.bookings)) {
        dbMapped = json.data.bookings.map((b) => ({
          id: b.id,
          orderRoomId: b.orderRoomId || null,
          rawCreatedAt: b.createdAt,
          orderNumber: b.bookingNumber || `BTN-RNT-${b.id.slice(-5)}`,
          customerName: b.renter?.fullName || "Penyewa",
          customerPhone: b.renter?.phoneNumber || "-",
          unitName: b.rental?.title || "Unit Sewa",
          duration: `${b.totalDays || 1} Hari`,
          amount: Number(b.rentalFee || b.totalAmount || 0),
          depositAmount: Number(b.depositFee || 0),
          status: (b.bookingStatus === "payment_held" || b.bookingStatus === "paid_escrow") ? "Menunggu Konfirmasi" :
                  b.bookingStatus === "confirmed_by_owner" ? "Siap Diambil" :
                  (b.bookingStatus === "handed_over" || b.bookingStatus === "item_handed_over" || b.bookingStatus === "in_use" || b.bookingStatus === "active") ? "Sedang Disewa" :
                  b.bookingStatus === "returned" ? "Pemeriksaan" :
                  (b.bookingStatus === "verified_settled" || b.bookingStatus === "completed") ? "Selesai" :
                  b.bookingStatus === "cancelled" ? "Dibatalkan" :
                  b.bookingStatus === "disputed" ? "Sengketa" : "Menunggu Konfirmasi",
          rawStatus: b.bookingStatus,
          meetingLocation: b.rental?.pickupLocation || "Lokasi Toko",
          conditionBefore: b.startNotes || "Kondisi unit baik dan siap sewa.",
          conditionAfter: b.returnNotes || null,
          photoBefore: b.startPhotoUrl || b.rental?.photoUrls?.[0] || null,
          photoAfter: b.returnPhotoUrl || null,
          timeline: [
            { status: "Pesanan Masuk & Terbayar", time: formatDateIndo(b.createdAt), note: `Hak Sewa ${formatIDR(b.rentalFee || 0)} + Deposit ${formatIDR(b.depositFee || 0)} tertampung di Escrow Bantuin.` },
            ...(b.bookingStatus !== "payment_held" && b.bookingStatus !== "temp_locked" ? [{ status: "Kesiapan Dikonfirmasi", time: formatDateIndo(b.updatedAt || b.startDate), note: "Mitra menyetujui ketersediaan barang dan menyiapkan unit." }] : []),
            ...(["handed_over", "in_use", "returned", "verified_settled"].includes(b.bookingStatus) ? [{ status: "Handover Serah Terima", time: formatDateIndo(b.startDate), note: "Unit diserahterimakan ke penyewa dengan verifikasi identitas fisik." }] : []),
            ...(["returned", "verified_settled"].includes(b.bookingStatus) ? [{ status: "Pengembalian Unit", time: formatDateIndo(b.endDate), note: "Unit diterima kembali oleh mitra untuk pemeriksaan kondisi fisik." }] : []),
            ...(b.bookingStatus === "verified_settled" ? [{ status: "Selesai & Dicairkan", time: formatDateIndo(b.updatedAt || b.endDate), note: "Pemeriksaan tuntas, deposit dikembalikan ke penyewa & hak sewa dicairkan ke saldo mitra." }] : []),
            ...(b.bookingStatus === "disputed" ? [{ status: "Dalam Sengketa", time: formatDateIndo(b.updatedAt), note: "Laporan sengketa diajukan. Penahanan dana diproses tim mediasi Bantuin." }] : []),
          ]
        }));
      }

      // Merge with orderRooms from AppContext if any rental orders belong to this partner
      const myId = currentUser?.id || store?.id;
      const clientMapped = (orderRooms || [])
        .filter((r) => {
          const isRental = r.isRental === true || r.categoryType === "sewa" || r.orderType === "rental" || Boolean(r.rentalId);
          if (!isRental) return false;
          if (!myId) return true;
          return (
            r.helperId === myId ||
            r.helper?.id === myId ||
            r.providerId === myId ||
            r.ownerId === myId ||
            r.partnerId === myId ||
            r.partner?.id === myId
          );
        })
        .map((r) => ({
          id: r.bookingId || r.id,
          orderRoomId: r.id,
          rawCreatedAt: r.createdAt || new Date().toISOString(),
          orderNumber: r.bookingNumber || `BTN-RNT-${(r.bookingId || r.id).slice(-5)}`,
          customerName: r.requester?.fullName || r.requesterName || r.customerName || "Penyewa",
          customerPhone: r.requester?.phoneNumber || r.customerPhone || "-",
          unitName: r.rental?.title || r.unitName || r.title || "Unit Sewa",
          duration: `${r.duration || r.totalDays || 1} Hari`,
          amount: Number(r.rentalFee || r.amount || r.totalAmount || 0),
          depositAmount: Number(r.depositFee || r.depositAmount || 0),
          status: (r.orderStatus === "paid_escrow" || r.orderStatus === "room_created" || r.orderStatus === "inquiry") ? "Menunggu Konfirmasi" :
                  (r.orderStatus === "item_handed_over" || r.orderStatus === "item_picked_up" || r.orderStatus === "in_use" || r.orderStatus === "handed_over") ? "Sedang Disewa" :
                  r.orderStatus === "returned" ? "Pemeriksaan" :
                  (r.orderStatus === "completed" || r.orderStatus === "verified_settled") ? "Selesai" :
                  r.orderStatus === "cancelled" ? "Dibatalkan" :
                  r.status || "Menunggu Konfirmasi",
          rawStatus: r.orderStatus || r.status || "payment_held",
          meetingLocation: r.meetingLocation || r.pickupLocation || "Lokasi Toko",
          conditionBefore: r.conditionBefore || "Kondisi unit baik dan siap sewa.",
          conditionAfter: r.conditionAfter || null,
          photoBefore: r.photoBefore || null,
          photoAfter: r.photoAfter || null,
          timeline: r.timeline || [
            { status: "Pesanan Masuk", time: formatDateIndo(r.createdAt || new Date()), note: "Pesanan sewa tercatat di sistem Bantuin." }
          ]
        }));

      // Combine & Deduplicate (dbMapped has priority)
      const combined = [...dbMapped];
      clientMapped.forEach((co) => {
        const exists = combined.some((dbo) => dbo.id === co.id || (co.orderRoomId && dbo.orderRoomId === co.orderRoomId));
        if (!exists) {
          combined.push(co);
        }
      });

      setPartnerOrders(combined);
    } catch (err) {
      console.warn("Failed to load rental bookings:", err);
    } finally {
      setIsLoadingOrders(false);
    }
  };

  const handleUpdateBookingStatus = async (bookingId, targetStatus, reason = "") => {
    try {
      const token = getAuthToken();
      let updatedSuccessfully = false;

      // 1. Sinkronisasi ke route rental bookings status
      try {
        const res = await fetch(`/api/rentals/bookings/${bookingId}/status`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify({ status: targetStatus, reason })
        });
        const json = await res.json();
        if (json.success) updatedSuccessfully = true;
      } catch (_) {}

      // 2. Sinkronisasi ke route chat rooms (agar sinkron ke bilik chat & database)
      try {
        await fetch("/api/chat/rooms", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify({
            orderRoomId: bookingId,
            status: targetStatus === "handed_over" ? "item_handed_over" : targetStatus,
          })
        });
        updatedSuccessfully = true;
      } catch (_) {}

      if (updatedSuccessfully) {
        addToast?.("Status Pesanan Diperbarui", "Status transaksi sewa berhasil diperbarui di sistem.");
        fetchOrders();
        fetchWalletData();
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("bantuin_activity_updated"));
          window.dispatchEvent(new Event("bantuin_chat_update"));
          window.dispatchEvent(new Event("bantuin_order_created"));
        }
        if (selectedOrderForHandover?.id === bookingId) {
          setSelectedOrderForHandover(null);
        }
      } else {
        throw new Error("Gagal memperbarui status transaksi sewa.");
      }
    } catch (err) {
      addToast?.("Gagal Update Status", err.message, "error");
    }
  };

  // Partner Reports / Disputes State (Clean from dummy reporterId)
  const [partnerReports, setPartnerReports] = useState([]);
  const [isDisputeModalOpen, setIsDisputeModalOpen] = useState(false);
  const [disputeForm, setDisputeForm] = useState({
    targetName: "",
    orderId: "",
    reason: "Penyewa Merusak Unit / Lecet Parah",
    description: "",
  });

  const fetchReports = async () => {
    try {
      const token = getAuthToken();
      if (!token) return;
      const res = await fetch("/api/reports?type=rental", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setPartnerReports(json.data);
      }
    } catch (err) {
      console.warn("Could not load rental reports:", err);
    }
  };

  const handleOpenDisputeForOrder = (order) => {
    setDisputeForm({
      targetName: order.customerName || "Penyewa",
      orderId: order.id,
      reason: "Penyewa Merusak Unit / Lecet Parah",
      description: "",
    });
    setSelectedOrderForHandover(null);
    setIsDisputeModalOpen(true);
  };

  // Notifications State (Clean array connected to real notifications API)
  const [partnerNotifications, setPartnerNotifications] = useState([]);

  const fetchNotifications = async () => {
    const token = getAuthToken();
    if (!token) return;
    try {
      const res = await fetch("/api/notifications", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success && Array.isArray(json.data?.notifications)) {
        const mapped = json.data.notifications.map((n) => ({
          id: n.id,
          title: n.title,
          message: n.message,
          isRead: Boolean(n.isRead),
          type: n.type,
          time: formatDateIndo(n.createdAt),
          link: n.link || null,
        }));
        setPartnerNotifications(mapped);
      }
    } catch (err) {
      console.warn("Could not load notifications:", err);
    }
  };

  const handleMarkNotificationsRead = async (id = null) => {
    try {
      const token = getAuthToken();
      if (!token) return;
      if (id) {
        setPartnerNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
        await fetch("/api/notifications", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ id })
        });
      } else {
        setPartnerNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        await fetch("/api/notifications", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ all: true })
        });
        addToast?.("Semua Dibaca", "Seluruh notifikasi ditandai telah dibaca.");
      }
    } catch (err) {
      console.warn("Failed to mark notifications read:", err);
    }
  };

  // Dedicated Database Chat Rooms for Partner Rental
  const [partnerChatRooms, setPartnerChatRooms] = useState([]);

  const fetchChatRooms = async () => {
    try {
      const token = getAuthToken();
      if (!token) return;
      const res = await fetch("/api/chat/rooms", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setPartnerChatRooms(json.data);
        }
      }
    } catch (err) {
      console.warn("Could not load partner rental chat rooms:", err);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchNotifications();
    fetchReports();
    fetchChatRooms();

    if (typeof window !== "undefined") {
      const handleSync = () => {
        fetchChatRooms();
        fetchOrders();
        fetchNotifications();
      };
      window.addEventListener("bantuin_chat_update", handleSync);
      window.addEventListener("bantuin_activity_updated", handleSync);
      window.addEventListener("bantuin_order_created", handleSync);
      window.addEventListener("bantuin_notification_updated", handleSync);
      return () => {
        window.removeEventListener("bantuin_chat_update", handleSync);
        window.removeEventListener("bantuin_activity_updated", handleSync);
        window.removeEventListener("bantuin_order_created", handleSync);
        window.removeEventListener("bantuin_notification_updated", handleSync);
      };
    }
  }, [currentUser?.id, orderRooms]);

  // Filtered Rental Chat Rooms (Dedicated for Rental, totally isolated from Jasa)
  const rentalChatRooms = useMemo(() => {
    const roomMap = new Map();

    const checkRental = (r) => {
      return (
        r.isRental === true ||
        r.categoryType === "sewa" ||
        r.orderType === "rental" ||
        Boolean(r.rentalId) ||
        Boolean(r.bookingId) ||
        r.category?.toLowerCase()?.includes("sewa") ||
        r.category?.toLowerCase()?.includes("rental") ||
        r.title?.toLowerCase()?.startsWith("sewa") ||
        r.title?.toLowerCase()?.startsWith("rental") ||
        r.title?.toLowerCase()?.includes("sewa:") ||
        r.title?.toLowerCase()?.includes("rental:")
      );
    };

    const isMyRoom = (r) => {
      const myId = currentUser?.id || store?.id;
      if (!myId) return true;
      return (
        r.helperId === myId ||
        r.helper?.id === myId ||
        r.requesterId === myId ||
        r.requester?.id === myId ||
        r.providerId === myId ||
        r.ownerId === myId ||
        r.partnerId === myId ||
        r.partner?.id === myId
      );
    };

    // First add from backend partnerChatRooms
    (partnerChatRooms || []).forEach((r) => {
      if (checkRental(r) && isMyRoom(r)) {
        roomMap.set(r.id, r);
      }
    });

    // Then add from orderRooms (context) if not already present
    (orderRooms || []).forEach((r) => {
      if (checkRental(r) && isMyRoom(r)) {
        if (!roomMap.has(r.id)) {
          roomMap.set(r.id, r);
        }
      }
    });

    return Array.from(roomMap.values());
  }, [partnerChatRooms, orderRooms, currentUser?.id, store?.id]);

  const unreadChatCount = useMemo(() => {
    return rentalChatRooms.reduce((sum, r) => {
      if (typeof r.unreadCount === "number" && r.unreadCount > 0) return sum + r.unreadCount;
      const unreadMsgs = (r.messages || []).filter(
        (m) => m.senderId !== currentUser?.id && !m.isRead && !m.read
      ).length;
      return sum + unreadMsgs;
    }, 0);
  }, [rentalChatRooms, currentUser?.id]);

  // Dynamic deposit & ongoing orders calculation
  const activeDepositAmount = useMemo(() => {
    return partnerOrders
      .filter((o) => o.status !== "Selesai" && o.status !== "Dibatalkan")
      .reduce((sum, o) => sum + (Number(o.depositAmount) || 0), 0);
  }, [partnerOrders]);

  const activeOrdersCount = useMemo(() => {
    return partnerOrders.filter((o) => o.status !== "Selesai" && o.status !== "Dibatalkan").length;
  }, [partnerOrders]);

  const liveCustomerDeposits = useMemo(() => {
    return partnerOrders
      .filter((o) => Number(o.depositAmount) > 0)
      .map((o) => ({
        id: o.id,
        rentalTitle: o.unitName,
        customerAccountHolder: o.customerName,
        customerBank: "Bantuin Escrow",
        customerAccountNumber: o.orderNumber,
        depositAmount: o.depositAmount,
        status: o.status === "Selesai" ? "REFUNDED" : "HELD",
      }));
  }, [partnerOrders]);

  // Dynamic Performance Analytics from actual rental orders and reports
  const performanceStats = useMemo(() => {
    const totalOrders = partnerOrders.length;
    const completedOrders = partnerOrders.filter((o) => o.rawStatus === "verified_settled" || o.rawStatus === "completed" || o.status === "Selesai").length;
    const disputedOrders = partnerOrders.filter((o) => o.rawStatus === "disputed" || o.status === "Sengketa").length + (partnerReports?.length || 0);

    const onTimeRate = totalOrders > 0
      ? Math.max(0, Math.min(100, Math.round(((totalOrders - disputedOrders) / totalOrders) * 100)))
      : 100;

    const safeDepositRate = totalOrders > 0
      ? Math.max(0, Math.min(100, Math.round(((totalOrders - disputedOrders) / totalOrders) * 100)))
      : 100;

    const daysName = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
    const now = new Date();
    const past7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const dayLabel = daysName[d.getDay()];
      past7Days.push({ dateStr, dayLabel, countSewa: 0, countKembali: 0 });
    }

    partnerOrders.forEach((o) => {
      const orderDate = o.rawCreatedAt ? new Date(o.rawCreatedAt).toISOString().split("T")[0] : null;
      if (orderDate) {
        const found = past7Days.find((d) => d.dateStr === orderDate);
        if (found) {
          found.countSewa += 1;
          if (["returned", "verified_settled", "completed"].includes(o.rawStatus) || o.status === "Selesai") {
            found.countKembali += 1;
          }
        }
      }
    });

    const maxDayCount = Math.max(...past7Days.map((d) => Math.max(d.countSewa, d.countKembali)), 1);
    const chartData = past7Days.map((d) => ({
      day: d.dayLabel,
      sewa: d.countSewa,
      kembali: d.countKembali,
      sewaHeight: d.countSewa > 0 ? Math.max(15, Math.round((d.countSewa / maxDayCount) * 100)) : 4,
      kembaliHeight: d.countKembali > 0 ? Math.max(15, Math.round((d.countKembali / maxDayCount) * 100)) : 4,
    }));

    const hasAnyActivity = past7Days.some((d) => d.countSewa > 0 || d.countKembali > 0);

    return {
      totalOrders,
      completedOrders,
      disputedOrders,
      onTimeRate: `${onTimeRate}%`,
      safeDepositRate: `${safeDepositRate}%`,
      chartData,
      hasAnyActivity,
    };
  }, [partnerOrders, partnerReports]);

  // Promotions State (Section AA, AB, AC, AD, AE)
  // Mitra rental hanya menawarkan promosi unit sewa, bukan promosi toko atau jasa.
  const [promoPackages, setPromoPackages] = useState(() => promotionService.getPackagesByTypeSync("sewa"));
  const [partnerPromotions, setPartnerPromotions] = useState(() => {
    return promotionService.getPromotionsSync({ ownerId: store?.id || currentUser?.id });
  });

  const loadMyPromotions = async () => {
    try {
      const token = (await authService.getValidAccessToken?.()) || authService.getToken?.() || getAuthToken();
      if (!token) return;
      const res = await fetch("/api/promotions/my-promotions", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json().catch(() => ({}));
      if (json.success && Array.isArray(json.data)) {
        setPartnerPromotions(json.data);
      }
    } catch (err) {
      console.warn("Could not load my promotions:", err);
    }
  };

  useEffect(() => {
    const loadLivePackages = async () => {
      try {
        const live = await promotionService.fetchLivePackages("sewa");
        if (Array.isArray(live)) {
          setPromoPackages(live);
        }
      } catch (err) {
        console.warn("Failed to load live rental promotion packages:", err);
      }
    };
    loadLivePackages();
    loadMyPromotions();

    const handleSync = () => {
      const live = promotionService.getPackagesByTypeSync("sewa");
      setPromoPackages(live);
      loadMyPromotions();
    };

    window.addEventListener("bantuin_promotion_packages_updated", handleSync);
    window.addEventListener("bantuin_promotions_updated", handleSync);
    window.addEventListener("bantuin_payments_updated", handleSync);
    return () => {
      window.removeEventListener("bantuin_promotion_packages_updated", handleSync);
      window.removeEventListener("bantuin_promotions_updated", handleSync);
      window.removeEventListener("bantuin_payments_updated", handleSync);
    };
  }, [store?.id, currentUser?.id]);

  const [isPromoModalOpen, setIsPromoModalOpen] = useState(false);
  const [selectedPromoPackage, setSelectedPromoPackage] = useState(null);
  const [promoStep, setPromoStep] = useState("select"); // "select" | "review" | "pending_payment" | "success"
  const [currentPromoOrder, setCurrentPromoOrder] = useState(null);

  // Rental Unit Promotion State
  const [isRentalPromoModalOpen, setIsRentalPromoModalOpen] = useState(false);
  const [selectedRentalForPromo, setSelectedRentalForPromo] = useState(store.catalog?.[0]?.id || "");
  const [selectedRentalPromoPkgId, setSelectedRentalPromoPkgId] = useState("");

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


  // Handlers for Promotions & Disputes
  const handlePurchaseRentalPromotion = async (e) => {
    e.preventDefault();
    const rentalItem = store.catalog?.find(c => c.id === selectedRentalForPromo) || store.catalog?.[0];
    const pkg = promoPackages.find(p => p.id === selectedRentalPromoPkgId) || promoPackages[1];
    try {
      const payment = await paymentService.createPromotionPayment({
        ownerId: store.id || currentUser?.id,
        ownerName: store.name || currentUser?.fullName || "Mitra Toko",
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
      if (payment?.id) {
        await paymentService.confirmPayment(payment.id);
      }
      const updated = promotionService.getPromotionsSync({ ownerId: store.id || currentUser?.id });
      setPartnerPromotions(updated);
      setIsRentalPromoModalOpen(false);
      addToast?.("Promosi Aktif!", `Unit rental "${rentalItem?.name}" berhasil dipromosikan & tayang.`);
    } catch (err) {
      addToast?.("Gagal Memproses Promosi", err.message || "Terjadi kesalahan.", "error");
    }
  };

  const handleTogglePromoStatus = async (promoId) => {
    setPartnerPromotions((prev) =>
      prev.map((p) =>
        p.id === promoId || p.paymentId === promoId || p.midtransOrderId === promoId || p.targetId === promoId
          ? { ...p, status: p.status === "active" ? "paused" : "active" }
          : p
      )
    );
    try {
      await promotionService.toggleStatus(promoId);
      await loadMyPromotions();
      addToast?.("Status Promosi Diperbarui", "Perubahan status tayang promosi berhasil disimpan.");
    } catch (err) {
      console.warn("Toggle mitra promo error:", err);
      await loadMyPromotions();
      addToast?.("Gagal Mengubah Status", err.message || "Terjadi kesalahan.", "error");
    }
  };

  const handleCreatePartnerDispute = async (e) => {
    e.preventDefault();
    if (!disputeForm.reason || !disputeForm.description) {
      addToast?.("Form Belum Lengkap", "Alasan dan rincian masalah wajib diisi.", "error");
      return;
    }
    try {
      const token = getAuthToken();
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          category: "barang_rusak",
          targetType: "customer",
          targetName: disputeForm.targetName || "Penyewa Terlapor",
          orderId: disputeForm.orderId || null,
          reason: disputeForm.reason,
          description: disputeForm.description,
        })
      });
      const json = await res.json();
      if (json.success) {
        setIsDisputeModalOpen(false);
        setDisputeForm({ targetName: "", orderId: "", reason: "Penyewa Merusak Unit / Lecet Parah", description: "" });
        addToast?.("Laporan Terkirim", "Pengaduan sengketa sewa berhasil diteruskan ke Admin Bantuin.");
        fetchReports();
        fetchOrders();
      } else {
        throw new Error(json.error || "Gagal mengirim pengaduan sengketa.");
      }
    } catch (err) {
      addToast?.("Gagal Mengirim Laporan", err.message || "Terjadi kesalahan.", "error");
    }
  };

  const handleDeleteReport = async (reportId) => {
    try {
      const token = getAuthToken();
      if (!token) return;
      const res = await fetch(`/api/reports?id=${reportId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        addToast?.("Laporan Dihapus", "Laporan sengketa berhasil diarsipkan / dibersihkan.");
        fetchReports();
      } else {
        throw new Error(json.error || "Gagal menghapus laporan.");
      }
    } catch (err) {
      addToast?.("Gagal Menghapus Laporan", err.message || "Terjadi kesalahan.", "error");
    }
  };

  // Sidebar navigation links with dynamic count badges (14 Canonical Menus)
  const sidebarLinks = [
    { id: "overview", label: "Ringkasan & Analisis", icon: LayoutDashboard },
    { id: "catalog", label: "Katalog Unit Sewa", icon: Package, count: store.catalog?.length || 0 },
    { id: "gallery", label: "Galeri Showcase Gear", icon: ImageIcon, count: store.portfolioPhotos?.length || 0 },
    { id: "orders", label: "Pesanan & Handover", icon: Receipt, count: activeOrdersCount || undefined },
    { id: "wallet", label: "Hak Pembayaran & Payout", icon: Wallet },
    { id: "profile", label: "Profil Toko Mitra", icon: Store },
    { id: "reviews", label: "Ulasan Pelanggan", icon: Star, count: store.reviews?.length || 0 },
    { id: "settings", label: "Pengaturan Toko", icon: Settings },
    { id: "promote_rental", label: "Promosi Unit Sewa", icon: Rocket, count: partnerPromotions.filter(p => p.targetType === "rental" && p.status === "active").length },
    { id: "chat", label: "Chat", icon: MessageSquare, count: unreadChatCount > 0 ? unreadChatCount : (rentalChatRooms.length || undefined) },
    { id: "notifications", label: "Notifikasi", icon: Bell, count: partnerNotifications.filter(n => !n.isRead).length || undefined },
    { id: "disputes", label: "Laporan & Sengketa", icon: AlertTriangle, count: partnerReports.filter(r => r.status === "open" || r.status === "investigating").length || undefined },
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

  const handleSaveCatalogItem = async (e) => {
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
      : (catalogForm.image ? [catalogForm.image] : []);
    const primaryPhoto = allPhotos[0] || "/logotab.png";

    let updatedCatalog;
    const newItemId = editingCatalogItem ? editingCatalogItem.id : `rnt-${Date.now()}`;
    const isAvail = catalogForm.stockStatus === "Siap Sewa";
    const countVal = Math.max(1, Number(catalogForm.stockCount) || 1);

    // Sinkronisasi PATCH ke PostgreSQL jika item terdaftar di DB (UUID)
    if (editingCatalogItem && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(editingCatalogItem.id)) {
      try {
        const token = getAuthToken();
        await fetch(`/api/rentals/${editingCatalogItem.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify({
            title: catalogForm.name.trim(),
            category: resolvedCategory,
            dailyPrice: Number(catalogForm.price),
            depositAmount: Number(catalogForm.depositAmount || 0),
            photoUrls: allPhotos,
            description: catalogForm.desc || "",
            stockStatus: catalogForm.stockStatus || "Siap Sewa",
            isAvailable: isAvail,
            stockCount: countVal,
            tag: catalogForm.tag ? catalogForm.tag.trim() : "",
            includedItems: catalogForm.includedItems ? catalogForm.includedItems.trim() : "",
            termsAndConditions: {
              stockStatus: catalogForm.stockStatus || "Siap Sewa",
              stockCount: countVal,
              tag: catalogForm.tag ? catalogForm.tag.trim() : "",
              includedItems: catalogForm.includedItems ? catalogForm.includedItems.trim() : "",
            }
          })
        });
      } catch (patchErr) {
        console.warn("Could not patch rental from modal:", patchErr);
      }
    }

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
              stockStatus: catalogForm.stockStatus || "Siap Sewa",
              isAvailable: isAvail,
              tag: catalogForm.tag || "",
              desc: catalogForm.desc,
              stockCount: countVal,
              stock: countVal,
              includedItems: catalogForm.includedItems || "",
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
        stockStatus: catalogForm.stockStatus || "Siap Sewa",
        isAvailable: isAvail,
        tag: catalogForm.tag || "",
        desc: catalogForm.desc,
        stockCount: countVal,
        stock: countVal,
        includedItems: catalogForm.includedItems || "",
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
        const itemExists = prev.some((r) => String(r.id) === String(newItemId));
        if (itemExists) {
          return prev.map((r) =>
            String(r.id) === String(newItemId)
              ? {
                  ...r,
                  title: catalogForm.name,
                  category: resolvedCategory,
                  dailyPrice: Number(catalogForm.price),
                  depositAmount: Number(catalogForm.depositAmount),
                  unit: catalogForm.unit || "/ hari",
                  photoUrl: primaryPhoto,
                  photos: allPhotos,
                  stock: countVal,
                  stockCount: countVal,
                  stockStatus: catalogForm.stockStatus || "Siap Sewa",
                  isAvailable: isAvail,
                  tag: catalogForm.tag || "",
                  includedItems: catalogForm.includedItems || "",
                  description: catalogForm.desc,
                }
              : r
          );
        } else {
          const newRentalItem = {
            id: newItemId,
            title: catalogForm.name,
            category: resolvedCategory,
            dailyPrice: Number(catalogForm.price),
            depositAmount: Number(catalogForm.depositAmount),
            unit: catalogForm.unit || "/ hari",
            photoUrl: primaryPhoto,
            photos: allPhotos,
            stock: countVal,
            stockCount: countVal,
            stockStatus: catalogForm.stockStatus || "Siap Sewa",
            isAvailable: isAvail,
            tag: catalogForm.tag || "",
            includedItems: catalogForm.includedItems || "",
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

    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("bantuin_rentals_updated"));
    }

    setIsCatalogModalOpen(false);
  };

  const handleDeleteCatalogItem = async (id) => {
    if (!window.confirm("Yakin ingin menghapus unit rental ini dari katalog?")) return;
    try {
      const token = getAuthToken();
      const res = await fetch(`/api/rentals/${id}`, {
        method: "DELETE",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      const json = await res.json();
      if (json.success) {
        const updated = (store.catalog || []).filter((c) => c.id !== id);
        setStore((prev) => ({ ...prev, catalog: updated }));
        if (setRentals) {
          setRentals((prev) => prev.filter((r) => r.id !== id));
        }
        addToast?.("Unit Dihapus", "Unit rental berhasil dihapus dari katalog.");
      } else {
        throw new Error(json.error || "Gagal menghapus unit rental.");
      }
    } catch (err) {
      addToast?.("Gagal Menghapus", err.message, "error");
    }
  };

  const handleToggleStockStatus = async (item) => {
    const nextAvail = item.stockStatus !== "Siap Sewa";
    const nextStatus = nextAvail ? "Siap Sewa" : "Sedang Disewa";
    try {
      const token = getAuthToken();
      const res = await fetch(`/api/rentals/${item.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ isAvailable: nextAvail, stockStatus: nextStatus })
      });
      const json = await res.json();
      if (json.success) {
        const updatedCatalog = (store.catalog || []).map((c) =>
          String(c.id) === String(item.id) ? { ...c, isAvailable: nextAvail, stockStatus: nextStatus } : c
        );
        setStore((prev) => ({ ...prev, catalog: updatedCatalog }));
        if (setRentals) {
          setRentals((prev) =>
            prev.map((r) => (String(r.id) === String(item.id) ? { ...r, isAvailable: nextAvail, stockStatus: nextStatus } : r))
          );
        }
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("bantuin_rentals_updated"));
          window.dispatchEvent(new Event("bantuin_rental_updated"));
        }
        addToast?.("Status Diperbarui", `Status unit "${item.name}" diubah menjadi: ${nextStatus}`);
      } else {
        throw new Error(json.error || "Gagal memperbarui ketersediaan unit.");
      }
    } catch (err) {
      addToast?.("Gagal Mengubah Status", err.message, "error");
    }
  };


  // -------------------------------------------------------------
  // CRUD HANDLERS: PAKET SEWA BUNDLING
  // -------------------------------------------------------------
  const handleSavePackage = async (e) => {
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
    setStore((prev) => ({ ...prev, packages: updatedPackages }));
    setIsPackageModalOpen(false);

    try {
      const token = getAuthToken();
      if (token) {
        await fetch("/api/mitra/packages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            title: newPkg.name,
            dailyPrice: newPkg.price,
            description: newPkg.description,
            category: "Paket Bundling Sewa",
          })
        });
      }
      addToast?.("Paket Bundling Disimpan", "Paket bundling sewa baru berhasil disimpan ke database.");
    } catch (err) {
      addToast?.("Paket Tersimpan Lokal", "Paket disimpan di etalase toko Anda.", "info");
    }
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

  const handleSaveGallery = async (e) => {
    e.preventDefault();
    if (!galleryForm.title || !galleryForm.url) {
      addToast?.("Form Belum Lengkap", "Silakan isi judul dan foto showcase.", "error");
      return;
    }

    try {
      const token = getAuthToken();
      const res = await fetch("/api/mitra/gallery", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          url: galleryForm.url,
          photoUrl: galleryForm.url,
          title: galleryForm.title,
          caption: galleryForm.title,
          category: galleryForm.category,
          description: galleryForm.description || "Dokumentasi unit perlengkapan rental siap pakai.",
        })
      });
      const json = await res.json();
      if (json.success) {
        const newPhoto = {
          id: json.data?.id || `gal-${Date.now()}`,
          url: galleryForm.url,
          title: galleryForm.title,
          category: galleryForm.category,
          description: galleryForm.description,
        };
        const updatedPhotos = [newPhoto, ...(store.portfolioPhotos || [])];
        setStore((prev) => ({ ...prev, portfolioPhotos: updatedPhotos }));
        setIsGalleryModalOpen(false);
        setGalleryForm({ title: "", category: "Kamera & Rig", url: "", description: "" });
        addToast?.("Showcase Disimpan", "Foto showcase gear berhasil disimpan ke database.");
      } else {
        throw new Error(json.error || "Gagal menyimpan foto showcase.");
      }
    } catch (err) {
      addToast?.("Gagal Menyimpan", err.message, "error");
    }
  };

  const handleDeleteGallery = async (idx) => {
    const itemToDelete = store.portfolioPhotos?.[idx];
    if (!itemToDelete) return;
    try {
      const token = getAuthToken();
      const deleteUrl = `/api/mitra/gallery?id=${encodeURIComponent(itemToDelete.id || "")}&url=${encodeURIComponent(itemToDelete.url || "")}`;
      const res = await fetch(deleteUrl, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ url: itemToDelete.url, id: itemToDelete.id })
      });
      const json = await res.json();
      if (json.success) {
        const updated = (store.portfolioPhotos || []).filter((_, i) => i !== idx);
        setStore((prev) => ({ ...prev, portfolioPhotos: updated }));
        addToast?.("Showcase Dihapus", "Foto showcase gear berhasil dihapus.");
      } else {
        throw new Error(json.error || "Gagal menghapus showcase.");
      }
    } catch (err) {
      addToast?.("Gagal Menghapus", err.message, "error");
    }
  };

  // -------------------------------------------------------------
  // CRUD HANDLERS: PROFIL TOKO & BRANDING
  // -------------------------------------------------------------
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      const token = getAuthToken();
      const res = await fetch("/api/mitra/store", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          partnerBusinessName: profileForm.name,
          partnerAddress: profileForm.address,
          bio: profileForm.about,
          phoneNumber: profileForm.whatsapp,
          securityDepositPolicy: profileForm.securityDepositPolicy,
        })
      });
      const json = await res.json();
      if (json.success) {
        setStore((prev) => ({
          ...prev,
          name: profileForm.name,
          tagline: profileForm.tagline,
          category: profileForm.category,
          address: profileForm.address,
          whatsapp: profileForm.whatsapp,
          operationalHours: profileForm.operationalHours,
          about: profileForm.about,
          securityDepositPolicy: profileForm.securityDepositPolicy,
        }));
        clearFormDraft(DRAFT_MITRA_PROFILE_KEY);
        addToast?.("Profil Disimpan", "Profil toko mitra berhasil disimpan dan sinkron dengan etalase user.");
      } else {
        throw new Error(json.error || "Gagal menyimpan profil toko.");
      }
    } catch (err) {
      addToast?.("Gagal Menyimpan Profil", err.message, "error");
    }
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
  const handleWithdrawSubmit = async (e) => {
    e.preventDefault();
    if (isSubmittingWithdraw) return;

    if (store.verificationStatus !== "verified") {
      addToast?.(
        "KYC Belum Terverifikasi",
        "Penarikan dana memerlukan akun berstatus KYC Terverifikasi oleh Admin Bantuin.",
        "error"
      );
      return;
    }

    const cleanAmountStr = String(withdrawForm.amount || "").replace(/[^0-9]/g, "");
    const amountNum = Number(cleanAmountStr);

    if (!amountNum || amountNum < 20000) {
      addToast?.("Nominal Tidak Valid", "Minimal penarikan saldo adalah Rp20.000.", "error");
      return;
    }

    if (amountNum > liveAvailableBalance) {
      addToast?.("Saldo Tidak Cukup", "Nominal penarikan melebihi saldo yang tersedia.", "error");
      return;
    }

    if (!withdrawForm.accountNumber?.trim()) {
      addToast?.("Nomor Rekening Diperlukan", "Mohon isi nomor rekening tujuan payout.", "error");
      return;
    }

    setIsSubmittingWithdraw(true);
    try {
      const token = getAuthToken();
      const res = await fetch("/api/withdrawals/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          amount: amountNum,
          destinationType: withdrawForm.bankName,
          destinationAccount: withdrawForm.accountNumber.trim(),
          destinationHolder: withdrawForm.accountHolder.trim() || store.name,
          ownerType: "partner"
        })
      });
      const json = await res.json();
      if (json.success) {
        setIsWithdrawModalOpen(false);
        addToast?.("Pengajuan Dikirim", "Pengajuan penarikan dana berhasil diteruskan ke Admin Bantuin.");
        fetchWalletData();
      } else {
        throw new Error(json.error || "Gagal mengajukan penarikan dana.");
      }
    } catch (err) {
      addToast?.("Gagal Tarik Dana", err.message, "error");
    } finally {
      setIsSubmittingWithdraw(false);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      const token = getAuthToken();
      const res = await fetch("/api/mitra/store", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          isAcceptingRentals: settingsForm.isAcceptingRentals,
          requirePhysicalId: settingsForm.requirePhysicalId,
          payoutBank: settingsForm.payoutBank,
          payoutAccountNumber: settingsForm.payoutAccountNumber,
          payoutAccountHolder: settingsForm.payoutAccountHolder,
        })
      });
      const json = await res.json();
      if (json.success) {
        setStore((prev) => ({
          ...prev,
          isAcceptingRentals: settingsForm.isAcceptingRentals,
          requirePhysicalId: settingsForm.requirePhysicalId,
          payoutBank: settingsForm.payoutBank,
          payoutAccountNumber: settingsForm.payoutAccountNumber,
          payoutAccountHolder: settingsForm.payoutAccountHolder,
        }));
        clearFormDraft(DRAFT_MITRA_SETTINGS_KEY);
        addToast?.("Pengaturan Disimpan", "Preferensi operasional dan rekening payout utama berhasil diperbarui.");
      } else {
        throw new Error(json.error || "Gagal menyimpan pengaturan.");
      }
    } catch (err) {
      addToast?.("Gagal Menyimpan Pengaturan", err.message, "error");
    }
  };

  return (
    <RoleGuard allowedRoles={["partner", "mitra", "super_admin", "admin"]} fallback={<JasaDashboardSkeleton />}>
      {isStoreLoading || !store?.id ? (
        <JasaDashboardSkeleton />
      ) : (
        <div className="min-h-screen flex flex-col lg:flex-row bg-[#F4F7FB]">

      
      {/* ============================================================ */}
      {/* 1. MOBILE TOP NAVIGATION BAR (< lg)                          */}
      {/* ============================================================ */}
      <div className="lg:hidden sticky top-0 z-40 bg-white border-b border-slate-200/90 shadow-2xs">
        <div className="px-3.5 py-2 flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <Image
              src={logoImg}
              alt="Bantuin"
              height={26}
              className="h-6 w-auto object-contain mix-blend-multiply"
            />
          </Link>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-lg bg-blue-50 text-[#1683FF] border border-blue-100 flex items-center gap-1">
              <Store className="w-3 h-3" />
              <span>Portal Mitra</span>
            </span>
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
                src={store.avatar || "/logotab.png"}
                alt={store.name}
                onError={(e) => { e.currentTarget.src = "/logotab.png"; }}
                className="w-11 h-11 rounded-2xl object-cover border border-slate-200 shrink-0 bg-white shadow-2xs"
              />
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-900 truncate flex items-center gap-1">
                  <span>{store.name}</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#1683FF] shrink-0" />
                </div>
                <div className="text-[11px] text-slate-500 truncate flex items-center gap-1 mt-0.5">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  <span className="font-semibold text-slate-700">{store.rating || 5.0}</span>
                  <span>({store.reviewsCount || store.reviews?.length || 0} ulasan)</span>
                </div>
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
              <span className="text-slate-500 font-medium">Status Outlet:</span>
              {store.verificationStatus === "verified" ? (
                <span className="inline-flex items-center gap-1 text-emerald-600 font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Buka &amp; Aktif</span>
                </span>
              ) : store.verificationStatus === "rejected" ? (
                <span className="inline-flex items-center gap-1 text-rose-600 font-bold">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  <span>Verifikasi Ditolak</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-amber-600 font-bold">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  <span>Menunggu Verifikasi</span>
                </span>
              )}
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

          {(currentUser?.accountRole === "provider" || currentUser?.accountType === "provider" || currentUser?.isProviderEnabled || currentUser?.role === "provider" || currentUser?.isAdmin) && (
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
          )}

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
              {activeMenu === "gallery" && "Galeri Showcase & Portofolio Gear"}
              {activeMenu === "orders" && "Pesanan Masuk & Handover Fisik"}
              {activeMenu === "wallet" && "Hak Pembayaran & Payout Saldo"}
              {activeMenu === "promote_rental" && "Promosikan Unit Sewa"}
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
        <div className="p-3 sm:p-6 md:p-8 space-y-5 max-w-[1240px] w-full pb-24 lg:pb-8">
          
          {/* KYC Status Verification Banner */}
          <VerificationBanner user={currentUser || store} />

          {/* ============================================================ */}
          {/* VIEW 1: OVERVIEW (RINGKASAN & ANALISIS SEWA)                  */}
          {/* ============================================================ */}
          {activeMenu === "overview" && (
            <>
              {/* Store Banner & Visual Header (Identik 100% dengan Halaman Toko User) */}
              <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 overflow-hidden shadow-xs">
                {/* Banner Sampul Toko */}
                <div className="relative w-full h-28 sm:h-52 bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 overflow-hidden group">
                  {store.coverImage ? (
                    <img
                      src={store.coverImage}
                      alt={store.name}
                      onError={(e) => { e.currentTarget.style.display = "none"; }}
                      className="w-full h-full object-cover transition duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-blue-600 via-indigo-600 to-slate-900 opacity-90">
                      <div className="text-white/30 text-xs sm:text-sm font-black tracking-widest uppercase">
                        {store.name || "Bantuin.id Mitra"}
                      </div>
                    </div>
                  )}
                  
                  {/* Badge Status Outlet */}
                  <div className="absolute top-2.5 left-2.5 sm:top-4 sm:left-4">
                    {store.verificationStatus === "verified" ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-white/90 backdrop-blur-md text-emerald-700 text-[10px] sm:text-[11px] font-bold shadow-xs">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span>Outlet Aktif &amp; Terverifikasi</span>
                      </span>
                    ) : store.verificationStatus === "rejected" ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-white/90 backdrop-blur-md text-rose-700 text-[10px] sm:text-[11px] font-bold shadow-xs">
                        <span className="w-2 h-2 rounded-full bg-rose-500" />
                        <span>Verifikasi Ditolak</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-white/90 backdrop-blur-md text-amber-700 text-[10px] sm:text-[11px] font-bold shadow-xs">
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                        <span>Menunggu Verifikasi Admin</span>
                      </span>
                    )}
                  </div>

                  {/* Tombol Ganti Banner dari Lokal */}
                  <label className="absolute top-2.5 right-2.5 sm:top-4 sm:right-4 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl bg-black/60 hover:bg-black/80 text-white text-[10px] sm:text-[11px] font-bold backdrop-blur-md cursor-pointer transition flex items-center gap-1 shadow-xs">
                    <Upload className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    <span>Ganti Sampul</span>
                    <input type="file" accept="image/*" onChange={handleBannerUpload} className="hidden" />
                  </label>
                </div>

                {/* Profile Header Detail */}
                <div className="px-4 sm:px-6 pb-4 sm:pb-6 relative z-10 flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4">
                  <div className="flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-4">
                    <div className="-mt-7 sm:-mt-16 relative group shrink-0 self-start">
                      <img
                        src={store.avatar || "/logotab.png"}
                        alt={store.name}
                        onError={(e) => { e.currentTarget.src = "/logotab.png"; }}
                        className="w-14 h-14 sm:w-24 sm:h-24 rounded-2xl object-cover border-3 sm:border-4 border-white shadow-md bg-white"
                      />
                      <label 
                        className="absolute inset-0 rounded-2xl bg-black/60 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer text-[9px] sm:text-[10px] font-bold"
                        title="Upload Logo Toko dari File Lokal"
                      >
                        <Camera className="w-3.5 h-3.5 mb-0.5" />
                        <span>Ganti Foto</span>
                        <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                      </label>
                    </div>

                    <div className="space-y-1 pt-1 sm:pt-0 sm:pb-1 min-w-0">
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded-md bg-blue-50 text-[#1683FF] text-[9px] sm:text-[11px] font-extrabold uppercase border border-blue-100">
                          {store.badge || "Mitra Rental"}
                        </span>
                        {store.verificationStatus === "verified" ? (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[9px] sm:text-[11px] font-bold border border-emerald-100 flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-emerald-600" />
                            <span>KTP Terverifikasi</span>
                          </span>
                        ) : store.verificationStatus === "pending_review" ? (
                          <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[9px] sm:text-[11px] font-bold border border-blue-100 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-[#1683FF]" />
                            <span>KYC Menunggu Review</span>
                          </span>
                        ) : store.verificationStatus === "rejected" ? (
                          <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 text-[9px] sm:text-[11px] font-bold border border-rose-100 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3 text-rose-600" />
                            <span>KYC Ditolak</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 text-[9px] sm:text-[11px] font-bold border border-amber-200 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                            <span>Belum Verifikasi KTP</span>
                          </span>
                        )}
                      </div>

                      <h2 className="text-base sm:text-2xl font-black text-slate-900 tracking-tight truncate">
                        {store.name}
                      </h2>

                      <p className="text-[11px] sm:text-sm font-semibold text-slate-600 truncate">
                        {store.tagline} &middot; <span className="text-[#1683FF]">{store.address}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:pb-1 w-full sm:w-auto">
                    <Link
                      href={`/mitra/${store.id}`}
                      target="_blank"
                      className="w-full sm:w-auto px-3.5 py-2 bg-[#1683FF] hover:bg-[#0F6FE5] text-white text-xs font-bold rounded-xl shadow-xs transition inline-flex items-center justify-center gap-1.5"
                    >
                      <span>Buka Toko Publik</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>

              {/* 4 Core Financial & Unit Metrics (Compact 2x2 grid on mobile) */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
                <div className="bg-white border border-slate-200/90 rounded-2xl p-3 sm:p-5 shadow-2xs">
                  <div className="text-[11px] sm:text-xs text-slate-500 flex items-center justify-between mb-1 font-medium">
                    <span className="flex items-center gap-1 sm:gap-1.5 truncate">
                      <DollarSign className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Saldo Cair</span>
                    </span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 shrink-0">
                      AVAILABLE
                    </span>
                  </div>
                  <div className="text-sm sm:text-2xl font-black text-slate-900">
                    {formatIDR(liveAvailableBalance)}
                  </div>
                  <button 
                    onClick={() => setIsWithdrawModalOpen(true)}
                    className="text-[10px] sm:text-[11px] text-[#1683FF] mt-1 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>Tarik Dana</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </button>
                </div>

                <div className="bg-white border border-slate-200/90 rounded-2xl p-3 sm:p-5 shadow-2xs">
                  <div className="text-[11px] sm:text-xs text-slate-500 flex items-center justify-between mb-1 font-medium">
                    <span className="flex items-center gap-1 sm:gap-1.5 truncate">
                      <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span>Hak Tertahan</span>
                    </span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 shrink-0">
                      PENDING
                    </span>
                  </div>
                  <div className="text-sm sm:text-2xl font-black text-slate-900">
                    {formatIDR(livePendingBalance)}
                  </div>
                  <div className="text-[10px] sm:text-[11px] text-amber-600 mt-1 font-semibold truncate">Masa sewa aktif</div>
                </div>

                <div className="bg-white border border-slate-200/90 rounded-2xl p-3 sm:p-5 shadow-2xs">
                  <div className="text-[11px] sm:text-xs text-slate-500 flex items-center gap-1 sm:gap-1.5 mb-1 font-medium truncate">
                    <Package className="w-3.5 h-3.5 text-[#1683FF] shrink-0" />
                    <span>Unit Rental</span>
                  </div>
                  <div className="text-sm sm:text-2xl font-black text-slate-900">
                    {store.catalog?.length || 0} Unit
                  </div>
                  <div className="text-[10px] sm:text-[11px] text-slate-500 mt-1 truncate">Siap disewa</div>
                </div>

                <div className="bg-white border border-slate-200/90 rounded-2xl p-3 sm:p-5 shadow-2xs">
                  <div className="text-[11px] sm:text-xs text-slate-500 flex items-center gap-1 sm:gap-1.5 mb-1 font-medium truncate">
                    <TrendingUp className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <span>Total Omset</span>
                  </div>
                  <div className="text-sm sm:text-2xl font-black text-slate-900">
                    {formatIDR(liveTotalEarned)}
                  </div>
                  <div className="text-[10px] sm:text-[11px] text-emerald-600 mt-1 font-semibold truncate">Fee admin Rp0</div>
                </div>
              </div>

              {/* Business Analysis & Performance Overview */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                {/* Column 1 & 2: Performance Graph & Activity */}
                <div className="lg:col-span-2 bg-white border border-slate-200/90 rounded-2xl p-3.5 sm:p-6 shadow-2xs space-y-4 sm:space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2">
                    <div>
                      <h3 className="font-bold text-sm sm:text-base text-slate-900">Analisis Performa Aktivitas Sewa</h3>
                      <p className="text-[10px] sm:text-xs text-slate-500">Statistik serah terima unit dan ketepatan pengembalian 7 hari terakhir</p>
                    </div>
                    <span className="text-[10px] sm:text-xs font-bold text-[#1683FF] bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100 self-start sm:self-auto">
                      Minggu Ini
                    </span>
                  </div>

                  {/* 3 Metric Highlights — Responsif di Mobile */}
                  <div className="grid grid-cols-3 gap-1.5 sm:gap-3 pt-1">
                    <div className="p-2 sm:p-3.5 rounded-xl bg-blue-50/60 border border-blue-100">
                      <div className="text-[9px] sm:text-[11px] font-semibold text-slate-600 leading-tight truncate">Tepat Waktu</div>
                      <div className="text-xs sm:text-xl font-black text-[#1683FF] mt-0.5 truncate">{performanceStats.onTimeRate}</div>
                      <div className="text-[8px] sm:text-[10px] text-emerald-600 font-bold mt-0.5 truncate">Bebas Denda</div>
                    </div>
                    <div className="p-2 sm:p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-100">
                      <div className="text-[9px] sm:text-[11px] font-semibold text-slate-600 leading-tight truncate">Deposit Aman</div>
                      <div className="text-xs sm:text-xl font-black text-emerald-700 mt-0.5 truncate">{performanceStats.safeDepositRate}</div>
                      <div className="text-[8px] sm:text-[10px] text-emerald-600 font-bold mt-0.5 truncate">
                        {performanceStats.disputedOrders === 0 ? "0 Sengketa" : `${performanceStats.disputedOrders} Sengketa`}
                      </div>
                    </div>
                    <div className="p-2 sm:p-3.5 rounded-xl bg-amber-50/60 border border-amber-100">
                      <div className="text-[9px] sm:text-[11px] font-semibold text-slate-600 leading-tight truncate">Kepuasan</div>
                      <div className="text-xs sm:text-xl font-black text-amber-700 mt-0.5 truncate">{(Number(store.rating) || 5.0).toFixed(1)} / 5</div>
                      <div className="text-[8px] sm:text-[10px] text-amber-700 font-bold mt-0.5 truncate">Ulasan Positif</div>
                    </div>
                  </div>

                  {/* Visual Bar Chart — Responsif & Rapi */}
                  <div className="pt-1">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] sm:text-xs text-slate-500 font-medium mb-2 gap-1.5">
                      <span>Grafik Unit Tersewa vs Pengembalian Sukses</span>
                      <div className="flex items-center gap-2.5 self-start sm:self-auto">
                        <span className="flex items-center gap-1 text-[10px] sm:text-[11px]">
                          <span className="w-2 h-2 rounded-xs bg-[#1683FF]" />
                          <span>Tersewa</span>
                        </span>
                        <span className="flex items-center gap-1 text-[10px] sm:text-[11px]">
                          <span className="w-2 h-2 rounded-xs bg-blue-300" />
                          <span>Kembali</span>
                        </span>
                      </div>
                    </div>

                    {performanceStats.hasAnyActivity ? (
                      <div className="grid grid-cols-7 gap-1 sm:gap-2 items-end h-28 sm:h-36 pt-3 border-b border-slate-100 pb-2">
                        {performanceStats.chartData.map((item, i) => (
                          <div key={i} className="flex flex-col items-center gap-1 h-full justify-end">
                            <div className="w-full flex items-end justify-center gap-0.5 sm:gap-1 h-20 sm:h-24">
                              <div 
                                style={{ height: `${item.sewaHeight}%` }} 
                                className={`w-2.5 sm:w-3.5 ${item.sewa > 0 ? "bg-[#1683FF]" : "bg-slate-200"} rounded-t-md transition-all hover:opacity-85`}
                                title={`Unit Tersewa: ${item.sewa} unit`}
                              />
                              <div 
                                style={{ height: `${item.kembaliHeight}%` }} 
                                className={`w-2.5 sm:w-3.5 ${item.kembali > 0 ? "bg-blue-300" : "bg-slate-100"} rounded-t-md transition-all hover:opacity-85`}
                                title={`Pengembalian: ${item.kembali} unit`}
                              />
                            </div>
                            <span className="text-[9px] sm:text-[10px] font-bold text-slate-500">{item.day}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-28 sm:h-36 border border-dashed border-slate-200 rounded-xl bg-slate-50/50 p-4 text-center">
                        <Clock className="w-5 h-5 text-slate-300 mb-1" />
                        <p className="text-xs font-semibold text-slate-600">Belum Ada Aktivitas 7 Hari Terakhir</p>
                        <p className="text-[10px] text-slate-400">Statistik serah terima &amp; pengembalian unit sewa akan otomatis tercatat di sini.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Column 3: Segregated Deposit Tracking & Quick Store Stats */}
                <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 sm:p-6 shadow-2xs flex flex-col justify-between space-y-3.5">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <h3 className="font-bold text-sm sm:text-base text-slate-900">Deposit Jaminan Sewa</h3>
                    </div>
                    <p className="text-[11px] sm:text-xs text-slate-500 leading-relaxed">
                      Jaminan fisik dan deposit uang customer tersimpan aman 100% tanpa potongan komisi hingga unit kembali utuh.
                    </p>

                    <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">Deposit Tertampung:</span>
                        <span className="font-bold text-slate-900">{formatIDR(activeDepositAmount)}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">Unit Sedang Dirental:</span>
                        <span className="font-bold text-[#1683FF]">{activeOrdersCount} Barang</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">Kecepatan Respon:</span>
                        <span className="font-bold text-emerald-600">&lt; 10 Menit</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-100 text-[11px] text-slate-700 leading-relaxed">
                    <strong className="block text-slate-900 font-bold mb-0.5">Tips Mitra Terpercaya:</strong>
                    Lakukan pemeriksaan kelengkapan fisik bersama penyewa saat serah terima barang di Bantuin Point atau toko Anda.
                  </div>
                </div>
              </div>

              {/* Active Incoming & Ongoing Orders Box (Clean Single Card List) */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 sm:p-5 shadow-2xs space-y-3">
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                  <div>
                    <h3 className="font-bold text-sm sm:text-base text-slate-900">Pesanan Rental Sedang Berjalan</h3>
                    <p className="text-[10px] sm:text-xs text-slate-500">Pantau serah terima unit fisik, masa sewa, dan pengembalian deposit</p>
                  </div>
                  <button 
                    onClick={() => setActiveMenu("orders")}
                    className="text-xs font-bold text-[#1683FF] hover:underline cursor-pointer shrink-0"
                  >
                    Semua Pesanan →
                  </button>
                </div>

                <div className="divide-y divide-slate-100">
                  {partnerOrders.filter((o) => o.status !== "Selesai" && o.status !== "Dibatalkan").length === 0 ? (
                    <div className="py-8 text-center text-slate-500">
                      <Package className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-xs font-bold text-slate-700">Belum Ada Pesanan Rental Berjalan</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Pesanan sewa baru yang telah dibayar akan tampil di sini untuk proses serah terima.
                      </p>
                    </div>
                  ) : (
                    partnerOrders
                      .filter((o) => o.status !== "Selesai" && o.status !== "Dibatalkan")
                      .slice(0, 5)
                      .map((order) => {
                        const initials = order.customerName
                          ? order.customerName
                              .split(" ")
                              .map((n) => n[0])
                              .slice(0, 2)
                              .join("")
                              .toUpperCase()
                          : "U";
                        return (
                          <div
                            key={order.id}
                            className="py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 sm:gap-4"
                          >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <div className="relative shrink-0">
                                <div className="w-10 h-10 rounded-full bg-blue-100 text-[#1683FF] font-black text-xs flex items-center justify-center ring-2 ring-blue-50 shadow-2xs">
                                  {initials}
                                </div>
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white absolute bottom-0 right-0" title="Online" />
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <h4 className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                                    {order.unitName}
                                  </h4>
                                  <span className="text-[9px] font-mono font-bold text-[#1683FF] bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded-md shrink-0">
                                    {order.orderNumber}
                                  </span>
                                </div>
                                <p className="text-[10px] sm:text-[11px] text-slate-500 truncate mt-0.5">
                                  Penyewa: <span className="font-semibold text-slate-700">{order.customerName}</span> &middot; Deposit {formatIDR(order.depositAmount)} Aman
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 shrink-0">
                              <div className="text-left sm:text-right">
                                <div className="font-extrabold text-xs text-slate-900">{formatIDR(order.amount)}</div>
                                <div className="text-[9px] sm:text-[10px] text-amber-600 font-semibold flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                  <span>{order.status}</span>
                                </div>
                              </div>
                              <Link
                                href={`/chat?room=${order.id}&role=partner&category=sewa`}
                                className="text-xs font-bold px-3 py-1.5 rounded-xl bg-[#1683FF] text-white hover:bg-[#0F6FE5] transition shadow-2xs shrink-0 flex items-center gap-1"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                                <span>Chat Order</span>
                              </Link>
                            </div>
                          </div>
                        );
                      })
                  )}
                </div>
              </div>
            </>
          )}

          {/* ============================================================ */}
          {/* VIEW 2: KATALOG UNIT SEWA (FULL CRUD DENGAN UPLOAD LOKAL)     */}
          {/* ============================================================ */}
          {activeMenu === "catalog" && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-base sm:text-lg text-slate-900">Katalog Barang Rental Anda</h3>
                  <p className="text-xs text-slate-500">
                    Kelola unit rental yang tampil persis pada pencarian sewa publik dan etalase toko Anda.
                  </p>
                </div>
                <Link
                  href="/mitra/dashboard/katalog/tambah"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#1683FF] text-white text-xs font-bold hover:bg-[#0F6FE5] transition shadow-xs self-start sm:self-auto"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Tambah Unit Baru</span>
                </Link>
              </div>

              {/* Search & Category Filter Bar */}
              <div className="flex flex-col sm:flex-row items-center gap-2.5 sm:gap-3">
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Cari nama unit atau spesifikasi..."
                    value={catalogSearch}
                    onChange={(e) => setCatalogSearch(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#1683FF] bg-white shadow-2xs"
                  />
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar w-full sm:w-auto py-0.5">
                  {["Semua", "Kamera", "Lensa", "Audio", "Lighting", "Drone", "Aksesoris"].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCatalogCategory(cat)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                        selectedCatalogCategory === cat
                          ? "bg-[#1683FF] text-white shadow-xs"
                          : "bg-white text-slate-600 border border-slate-200 hover:text-slate-900"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Grid of Rental Unit Cards (2-column on mobile, single card) */}
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-4">
                {filteredStoreCatalog.map((item) => {
                  const isAvailable = item.stockStatus === "Siap Sewa";

                  return (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-slate-200/90 bg-white overflow-hidden shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group"
                    >
                      <div>
                        {/* Unit Image & Badges */}
                        <Link href={`/mitra/dashboard/katalog/${item.id}`} className="block relative aspect-16/10 w-full bg-slate-100 overflow-hidden cursor-pointer">
                          <img
                            src={item.image || (item.photos && item.photos[0]) || "/logotab.png"}
                            alt={item.name}
                            onError={(e) => { e.currentTarget.src = "/logotab.png"; }}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute top-2 left-2 flex items-center gap-1 flex-wrap">
                            <span className="px-1.5 py-0.5 rounded-md text-[9px] font-extrabold uppercase bg-black/60 text-white backdrop-blur-xs">
                              {item.category}
                            </span>
                            {item.tag && (
                              <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-amber-500 text-white backdrop-blur-xs shadow-xs">
                                {item.tag}
                              </span>
                            )}
                            {item.photos && item.photos.length > 1 && (
                              <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-white/95 text-slate-800 backdrop-blur-xs flex items-center gap-0.5 shadow-xs">
                                <Camera className="w-2.5 h-2.5 text-[#1683FF]" />
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
                            className={`absolute bottom-2 right-2 px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-md text-[9px] sm:text-[10px] font-bold backdrop-blur-md shadow-xs transition ${
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
                        <div className="p-2.5 sm:p-4 space-y-1">
                          <Link href={`/mitra/dashboard/katalog/${item.id}`} className="block">
                            <h4 className="font-bold text-xs sm:text-sm text-slate-900 group-hover:text-[#1683FF] transition line-clamp-2 leading-snug min-h-[30px] sm:min-h-0">
                              {item.name}
                            </h4>
                          </Link>

                          <div className="pt-1 text-[10px] sm:text-[11px] text-slate-500 flex items-center justify-between border-t border-slate-100">
                            <span>Stok: <strong>{item.stockCount ?? item.stock ?? 1}</strong></span>
                            <span className="truncate">Deposit: <strong>{formatIDR(item.depositAmount || 200000)}</strong></span>
                          </div>
                        </div>
                      </div>

                      {/* Pricing & Actions Bar */}
                      <div className="p-2.5 sm:p-4 pt-2 border-t border-slate-100 space-y-2">
                        <div className="flex items-center justify-between gap-1">
                          <div>
                            <span className="text-[9px] text-slate-400 block uppercase font-medium">
                              {item.packages?.length > 0 || item.pricingMode === "tiered" ? "Mulai Tarif:" : "Tarif:"}
                            </span>
                            <div className="font-black text-xs sm:text-sm text-[#1683FF]">
                              {formatIDR(item.price)}
                              <span className="text-[9px] text-slate-400 font-normal ml-0.5">{item.unit || "/ hari"}</span>
                            </div>
                            {item.packages && item.packages.length > 0 && (
                              <span className="inline-block mt-0.5 px-1.5 py-0.5 text-[9px] font-bold text-[#1683FF] bg-blue-50 rounded border border-blue-100">
                                {item.packages.length} Opsi Paket
                              </span>
                            )}
                          </div>
                          <Link
                            href={`/sewa/${item.id}`}
                            target="_blank"
                            className="px-2 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#1683FF] text-[10px] font-bold inline-flex items-center gap-1 transition"
                            title="Lihat Tampilan Publik"
                          >
                            <span>Publik</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </Link>
                        </div>

                        <div className="grid grid-cols-4 gap-1 pt-1 border-t border-slate-100">
                          <Link
                            href={`/mitra/dashboard/promosi/buat?target=unit&unitId=${item.id}`}
                            className="py-1.5 rounded-lg text-[#1683FF] bg-blue-50/70 hover:bg-blue-100 transition border border-blue-100 flex items-center justify-center"
                            title="Promosikan Unit Sewa Ini"
                          >
                            <Rocket className="w-3.5 h-3.5" />
                          </Link>
                          <Link
                            href={`/mitra/dashboard/katalog/${item.id}`}
                            className="py-1.5 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-[#1683FF] transition border border-slate-200/80 flex items-center justify-center"
                            title="Lihat Detail Unit"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Link>
                          <Link
                            href={`/mitra/dashboard/katalog/${item.id}/edit`}
                            className="py-1.5 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-[#1683FF] transition border border-slate-200/80 flex items-center justify-center"
                            title="Edit Unit Rental"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </Link>
                          <button
                            onClick={() => handleDeleteCatalogItem(item.id)}
                            className="py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition border border-slate-200/80 cursor-pointer flex items-center justify-center"
                            title="Hapus Unit"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {filteredStoreCatalog.length === 0 && (
                  <div className="col-span-full p-8 sm:p-12 text-center bg-white rounded-2xl border border-dashed border-slate-200">
                    <Package className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <h4 className="text-sm font-bold text-slate-800">Belum Ada Unit Sewa di Katalog</h4>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                      Tambahkan barang sewa pertama Anda agar calon penyewa di sekitar kampus dapat menemukan etalase Anda.
                    </p>
                    <Link
                      href="/mitra/dashboard/katalog/tambah"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1683FF] text-white text-xs font-bold hover:bg-[#0F6FE5] transition shadow-xs"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>Tambah Unit Sewa Baru</span>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}



          {/* ============================================================ */}
          {/* VIEW 4: GALERI SHOWCASE & FOTO GEAR                          */}
          {/* ============================================================ */}
          {activeMenu === "gallery" && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-slate-900">Galeri Showcase Perlengkapan &amp; Setup</h3>
                  <p className="text-xs text-slate-500">
                    Foto showcase alat ini meyakinkan calon penyewa tentang kebersihan dan kondisi prima unit Anda.
                  </p>
                </div>
                <Link
                  href="/mitra/dashboard/galeri/tambah"
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#1683FF] text-white text-xs font-bold hover:bg-[#0F6FE5] transition shadow-xs w-full sm:w-auto"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Tambah Foto Galeri</span>
                </Link>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-4">
                {(!store.portfolioPhotos || store.portfolioPhotos.length === 0) && (
                  <div className="col-span-full p-8 sm:p-12 text-center bg-white rounded-2xl border border-dashed border-slate-200">
                    <ImageIcon className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <h4 className="text-sm font-bold text-slate-800">Belum Ada Foto Galeri</h4>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                      Unggah foto showcase alat atau workshop Anda untuk meningkatkan kepercayaan calon penyewa.
                    </p>
                    <Link
                      href="/mitra/dashboard/galeri/tambah"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1683FF] text-white text-xs font-bold hover:bg-[#0F6FE5] transition shadow-xs"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>Tambah Foto Galeri</span>
                    </Link>
                  </div>
                )}
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

                    <div className="p-2 sm:p-3.5 border-t border-slate-100 flex items-center justify-between">
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
          {/* VIEW 5: PESANAN SEWA MASUK & HANDOVER FISIK                  */}
          {/* ============================================================ */}
          {activeMenu === "orders" && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-slate-900">Pesanan Sewa &amp; Handover Fisik</h3>
                  <p className="text-xs text-slate-500">
                    Alur handover: Pesanan Dibayar &rarr; Siap Diambil &rarr; Handover &rarr; Sedang Disewa &rarr; Dikembalikan &rarr; Pemeriksaan &rarr; Selesai
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] sm:text-xs font-bold text-[#1683FF] bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
                    {partnerOrders.filter(o => o.status !== "Selesai").length} Transaksi Berjalan
                  </span>
                </div>
              </div>

              {/* Status Filters */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-xs">
                {["all", "Menunggu Konfirmasi", "Siap Diambil", "Sedang Disewa", "Pemeriksaan", "Selesai", "Sengketa"].map((st) => (
                  <button
                    key={st}
                    onClick={() => setOrderFilter(st)}
                    className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap cursor-pointer ${
                      orderFilter === st
                        ? "bg-[#1683FF] text-white shadow-xs"
                        : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {st === "all" ? "Semua Status" : st}
                  </button>
                ))}
              </div>

              {/* Orders List */}
              <div className="space-y-2.5 sm:space-y-3">
                {partnerOrders.filter(o => orderFilter === "all" || o.status === orderFilter).length === 0 ? (
                  <div className="p-8 sm:p-12 text-center bg-white rounded-2xl border border-dashed border-slate-200">
                    <Receipt className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <h4 className="text-sm font-bold text-slate-800">Tidak Ada Pesanan Sewa</h4>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                      Belum ada transaksi sewa dengan status ini. Pesanan masuk dari penyewa akan tercatat otomatis di sini.
                    </p>
                  </div>
                ) : (
                  partnerOrders
                    .filter(o => orderFilter === "all" || o.status === orderFilter)
                    .map((order) => {
                      const isCompleted = order.status === "Selesai";
                      const isInspection = order.status === "Pemeriksaan";

                      return (
                        <div 
                          key={order.id}
                          className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-200/90 bg-white flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 sm:gap-4 shadow-2xs hover:border-blue-200 transition"
                        >
                          <div className="flex items-start sm:items-center gap-3">
                            <div className="relative shrink-0">
                              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-blue-100 text-[#1683FF] font-black text-xs flex items-center justify-center ring-2 ring-blue-50 shadow-2xs">
                                {order.customerName ? order.customerName.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase() : "U"}
                              </div>
                              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white absolute bottom-0 right-0" />
                            </div>
                            <div>
                              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                                <span className="text-xs font-bold text-slate-900">{order.customerName}</span>
                                <span className="text-[10px] text-[#1683FF] bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded-md font-mono font-bold">
                                  {order.orderNumber}
                                </span>
                                <span className={`text-[9px] sm:text-[10px] px-2 py-0.5 rounded-md font-bold ${
                                  isCompleted 
                                    ? "bg-emerald-100 text-emerald-800"
                                    : isInspection
                                    ? "bg-amber-100 text-amber-800"
                                    : "bg-blue-100 text-blue-800"
                                }`}>
                                  {order.status}
                                </span>
                              </div>
                              <h4 className="font-bold text-xs sm:text-sm text-slate-900 mt-0.5">{order.unitName}</h4>
                              <p className="text-[11px] text-slate-500 mt-0.5">
                                Durasi: {order.duration} &middot; Titik Temu: {order.meetingLocation}
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center justify-between lg:justify-end w-full lg:w-auto gap-2.5 sm:gap-3 pt-2.5 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                            <div className="text-left lg:text-right">
                              <div className="text-xs sm:text-sm font-black text-slate-900">{formatIDR(order.amount)}</div>
                              <div className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1 lg:justify-end">
                                <ShieldCheck className="w-3 h-3 text-emerald-500" />
                                <span>Deposit: {formatIDR(order.depositAmount)}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto justify-end">
                              <button
                                onClick={() => setSelectedOrderForHandover(order)}
                                className="px-2.5 sm:px-3 py-1.5 sm:py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold rounded-lg sm:rounded-xl transition shadow-2xs inline-flex items-center gap-1.5 cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Detail &amp; Handover</span>
                                <span className="sm:hidden">Detail</span>
                              </button>

                              {(order.rawStatus === "payment_held" || order.rawStatus === "paid_escrow") && (
                                <button
                                  onClick={() => handleUpdateBookingStatus(order.id, "confirmed_by_owner")}
                                  className="px-3 py-1.5 sm:py-2 bg-[#1683FF] hover:bg-[#0F6FE5] text-white text-xs font-bold rounded-lg sm:rounded-xl transition shadow-2xs inline-flex items-center gap-1.5 cursor-pointer"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Konfirmasi Kesiapan</span>
                                </button>
                              )}

                              {(order.rawStatus === "confirmed_by_owner" || order.rawStatus === "payment_held" || order.rawStatus === "paid_escrow") && (
                                <Link
                                  href={`/chat?room=${order.orderRoomId || order.id}&role=partner&category=sewa`}
                                  className="px-3 py-1.5 sm:py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg sm:rounded-xl transition shadow-2xs inline-flex items-center gap-1.5 cursor-pointer"
                                >
                                  <Camera className="w-3.5 h-3.5" />
                                  <span>Serah Terima Unit</span>
                                </Link>
                              )}

                              {(order.rawStatus === "handed_over" || order.rawStatus === "item_handed_over" || order.rawStatus === "in_use") && (
                                <button
                                  onClick={() => handleUpdateBookingStatus(order.id, "returned")}
                                  className="px-3 py-1.5 sm:py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg sm:rounded-xl transition shadow-2xs inline-flex items-center gap-1.5 cursor-pointer"
                                >
                                  <RefreshCw className="w-3.5 h-3.5" />
                                  <span>Terima Pengembalian</span>
                                </button>
                              )}

                              {order.rawStatus === "returned" && (
                                <button
                                  onClick={() => handleUpdateBookingStatus(order.id, "verified_settled")}
                                  className="px-3 py-1.5 sm:py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg sm:rounded-xl transition shadow-2xs inline-flex items-center gap-1.5 cursor-pointer"
                                >
                                  <CheckCircle className="w-3.5 h-3.5" />
                                  <span>Selesaikan &amp; Cairkan</span>
                                </button>
                              )}

                              <Link
                                href={`/chat?room=${order.id}&role=partner&category=sewa`}
                                className="px-2.5 sm:px-3 py-1.5 sm:py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg sm:rounded-xl transition shadow-2xs inline-flex items-center gap-1.5"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                                <span>Chat</span>
                              </Link>
                            </div>
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* VIEW 6: WALLET & HAK PEMBAYARAN MITRA                        */}
          {/* ============================================================ */}
          {activeMenu === "wallet" && (
            <div className="space-y-4 sm:space-y-6">
              {/* Wallet Summary Card */}
              <div className="bg-gradient-to-br from-slate-900 via-[#0C2D48] to-slate-900 text-white rounded-2xl sm:rounded-3xl p-4 sm:p-7 shadow-lg relative overflow-hidden border border-slate-800">
                <div className="absolute right-0 top-0 w-80 h-80 bg-[#1683FF]/15 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-[11px] sm:text-xs font-bold text-blue-300 uppercase tracking-wider block">
                        Saldo Hak Pembayaran Mitra Sewa
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        Status: AVAILABLE
                      </span>
                    </div>
                    <div className="text-2xl sm:text-4xl font-black tracking-tight text-white mb-1.5">
                      {formatIDR(liveAvailableBalance)}
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-slate-300">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Hak bersih dari transaksi sewa selesai &middot; Fee transfer ditanggung platform</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                    <button
                      onClick={() => setIsWithdrawModalOpen(true)}
                      className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white text-xs sm:text-sm font-bold shadow-md transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <ArrowUpRight className="w-4 h-4" />
                      <span>Ajukan Penarikan Dana</span>
                    </button>
                  </div>
                </div>

                <div className="mt-4 sm:mt-6 pt-4 sm:pt-5 border-t border-white/10 grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4 text-xs">
                  <div className="bg-white/5 p-2.5 sm:p-0 rounded-xl sm:rounded-none">
                    <div className="text-slate-400 text-[10px] sm:text-xs">Dana Tertahan (Sewa Aktif)</div>
                    <div className="font-bold text-amber-400 text-xs sm:text-sm mt-0.5">{formatIDR(livePendingBalance)}</div>
                  </div>
                  <div className="bg-white/5 p-2.5 sm:p-0 rounded-xl sm:rounded-none">
                    <div className="text-slate-400 text-[10px] sm:text-xs">Total Akumulasi Omset</div>
                    <div className="font-bold text-white text-xs sm:text-sm mt-0.5">
                      {formatIDR(liveTotalEarned)}
                    </div>
                  </div>
                  <div className="col-span-2 sm:col-span-1 bg-white/5 p-2.5 sm:p-0 rounded-xl sm:rounded-none">
                    <div className="text-slate-400 text-[10px] sm:text-xs">Biaya Transfer Pencairan</div>
                    <div className="font-bold text-emerald-400 text-xs sm:text-sm mt-0.5">Rp0 (Ditanggung Bantuin.id)</div>
                  </div>
                </div>
              </div>

              {/* Customer Segregated Deposit Tracker */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-6 shadow-2xs space-y-3 sm:space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-2">
                  <div>
                    <h3 className="font-bold text-sm sm:text-base text-slate-900">Pelacakan Deposit Jaminan Pelanggan (0% Komisi)</h3>
                    <p className="text-xs text-slate-500">Dana jaminan customer ditampung terpisah secara aman dan dikembalikan utuh setelah pemeriksaan unit</p>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 self-start sm:self-auto">
                    Deposit Terpisah
                  </span>
                </div>

                <div className="divide-y divide-slate-100">
                  {liveCustomerDeposits.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-400">
                      Belum ada transaksi dengan deposit jaminan aktif.
                    </div>
                  ) : (
                    liveCustomerDeposits.map((dep) => (
                      <div key={dep.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3">
                        <div>
                          <div className="text-xs font-bold text-slate-900">{dep.rentalTitle}</div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            Penyewa: {dep.customerAccountHolder} &middot; {dep.customerBank} ({dep.customerAccountNumber})
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-3">
                          <div className="text-left sm:text-right">
                            <div className="text-xs font-bold text-slate-900">{formatIDR(dep.depositAmount)}</div>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mt-0.5 ${
                              dep.status === "REFUNDED" 
                                ? "bg-emerald-50 text-emerald-700" 
                                : "bg-amber-50 text-amber-700"
                            }`}>
                              {dep.status === "REFUNDED" ? "Deposit Telah Dikembalikan" : "Terkunci Selama Sewa"}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Withdrawals History Table */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-6 shadow-2xs space-y-3 sm:space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-sm sm:text-base text-slate-900">Riwayat Penarikan Dana Mitra</h3>
                    <p className="text-xs text-slate-500">Pencairan ditransfer via m-Banking admin</p>
                  </div>
                  <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                    {(liveWithdrawals.length > 0 ? liveWithdrawals : (withdrawals || []).filter(w => w.ownerType === "partner")).length} Pengajuan
                  </span>
                </div>

                <div className="divide-y divide-slate-100">
                  {(liveWithdrawals.length > 0 ? liveWithdrawals : (withdrawals || []).filter(w => w.ownerType === "partner")).length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-400">
                      Belum ada riwayat penarikan dana mitra sewa.
                    </div>
                  ) : (
                    (liveWithdrawals.length > 0 ? liveWithdrawals : (withdrawals || []).filter(w => w.ownerType === "partner")).map((wd) => {
                      const isSuccess = wd.status === "SUCCESS" || wd.status === "completed" || wd.status === "approved";
                      const bName = wd.destinationType || wd.bankName || "Bank";
                      const accNo = wd.destinationAccount || wd.accountNumber || "-";
                      const accHolder = wd.destinationHolder || wd.accountHolder || "Mitra";

                      return (
                        <div key={wd.id} className="py-3 flex items-center justify-between gap-2.5 sm:gap-4">
                          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                            <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                              isSuccess ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                            }`}>
                              {isSuccess ? <Check className="w-4 h-4" /> : <Loader2 className="w-4 h-4 animate-spin" />}
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-slate-900 truncate">
                                Transfer Rek. {bName} - {accNo} ({accHolder})
                              </div>
                              <div className="text-[10px] sm:text-[11px] text-slate-500 flex flex-wrap items-center gap-1.5 mt-0.5">
                                <span>ID: {wd.id}</span>
                                <span>&middot;</span>
                                <span>{formatDateIndo(wd.requestedAt || wd.createdAt)}</span>
                                {wd.transferReference && (
                                  <>
                                    <span>&middot;</span>
                                    <span className="font-mono text-[9px] sm:text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                      Ref: {wd.transferReference}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <div className="text-xs font-extrabold text-slate-900">
                              -{formatIDR(wd.amount)}
                            </div>
                            <span className={`text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full inline-block mt-0.5 ${
                              isSuccess 
                                ? "bg-emerald-50 text-emerald-700" 
                                : wd.status === "rejected"
                                ? "bg-rose-50 text-rose-700"
                                : "bg-amber-50 text-amber-700"
                            }`}>
                              {isSuccess ? "Berhasil" : wd.status === "rejected" ? "Ditolak" : "Menunggu Admin"}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* VIEW 7: PROFIL TOKO & BRANDING PUBLIK                        */}
          {/* ============================================================ */}
          {activeMenu === "profile" && (
            <div className="space-y-4 sm:space-y-6">
              {/* Visual Store Header with Local Uploads */}
              <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 overflow-hidden shadow-xs">
                {/* Banner Sampul */}
                <div className="relative w-full h-28 sm:h-44 bg-slate-100 overflow-hidden group">
                  <img
                    src={store.coverImage}
                    alt={store.name}
                    className="w-full h-full object-cover"
                  />
                  <label className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl bg-black/60 hover:bg-black/80 text-white text-[10px] sm:text-[11px] font-bold backdrop-blur-md cursor-pointer transition flex items-center gap-1.5 shadow-xs">
                    <Upload className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    <span>Upload Banner</span>
                    <input type="file" accept="image/*" onChange={handleBannerUpload} className="hidden" />
                  </label>
                </div>

                <div className="px-4 sm:px-6 pb-4 sm:pb-6 relative z-10 flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-4">
                  <div className="-mt-8 sm:-mt-12 relative group shrink-0 self-start">
                    <img
                      src={store.avatar}
                      alt={store.name}
                      className="w-16 h-16 sm:w-22 sm:h-22 rounded-2xl object-cover border-4 border-white shadow-md bg-white"
                    />
                    <label 
                      className="absolute inset-0 rounded-2xl bg-black/60 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer text-[9px] sm:text-[10px] font-bold"
                      title="Upload Avatar Toko dari File Lokal"
                    >
                      <Camera className="w-3.5 h-3.5 sm:w-4 sm:h-4 mb-0.5" />
                      <span>Ganti Foto</span>
                      <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                    </label>
                  </div>

                  <div className="min-w-0 pt-1 sm:pt-0 sm:pb-1">
                    <h3 className="font-black text-base sm:text-lg text-slate-900">{store.name}</h3>
                    <p className="text-xs text-slate-500">{store.tagline}</p>
                    <div className="text-[11px] text-[#1683FF] font-semibold mt-0.5 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      <span>{store.address}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Store Profile Edit Form */}
              <form onSubmit={handleSaveProfile} className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-6 shadow-2xs space-y-4">
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-slate-900">Edit Informasi Toko Mitra</h3>
                  <p className="text-xs text-slate-500">
                    Perubahan di sini langsung terhubung dan mengubah apa yang dilihat pelanggan di halaman /mitra/{store.id} dan /sewa.
                  </p>
                </div>

                <div className="space-y-3.5 sm:space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
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

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
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
                      className="w-full p-2.5 sm:p-3 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-[#1683FF]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Kebijakan Deposit &amp; Jaminan Identitas (KTP/KTM)</label>
                    <textarea
                      rows={2}
                      value={profileForm.securityDepositPolicy}
                      onChange={(e) => setProfileForm({ ...profileForm, securityDepositPolicy: e.target.value })}
                      className="w-full p-2.5 sm:p-3 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-[#1683FF]"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white text-xs font-bold shadow-2xs transition cursor-pointer"
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
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-slate-900">Ulasan Pelanggan Sewa Terverifikasi</h3>
                  <p className="text-xs text-slate-500">
                    Testimoni dari penyewa terverifikasi Bantuin.
                  </p>
                </div>
                <div className="flex items-center gap-1.5 bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span className="text-xs font-black text-amber-800">{store.rating || 5.0} / 5.0</span>
                </div>
              </div>

              <div className="space-y-3">
                {(!store.reviews || store.reviews.length === 0) && (
                  <div className="p-8 sm:p-12 text-center bg-white rounded-2xl border border-dashed border-slate-200">
                    <Star className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <h4 className="text-sm font-bold text-slate-800">Belum Ada Ulasan Pelanggan</h4>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                      Ulasan dan rating dari penyewa akan tampil di sini setelah transaksi sewa pertama Anda selesai.
                    </p>
                  </div>
                )}
                {store.reviews?.map((rev) => (
                  <div key={rev.id} className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-100 bg-white shadow-2xs space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={rev.userAvatar || rev.avatar || "/logotab.png"}
                          alt={rev.userName}
                          onError={(e) => { e.currentTarget.src = "/logotab.png"; }}
                          className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover border border-slate-200 bg-white"
                        />
                        <div>
                          <div className="text-xs font-bold text-slate-900">{rev.userName}</div>
                          <div className="text-[10px] text-slate-400">{rev.date} &middot; Unit: <strong>{rev.itemTitle || rev.item || "Unit Sewa"}</strong></div>
                        </div>
                      </div>

                      <div className="flex items-center gap-0.5 text-amber-400">
                        {Array.from({ length: rev.rating || 5 }).map((_, r) => (
                          <Star key={r} className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                    </div>

                    <p className="text-xs text-slate-700 leading-relaxed italic bg-slate-50 p-2.5 sm:p-3 rounded-xl border border-slate-100">
                      &ldquo;{rev.comment}&rdquo;
                    </p>

                    {/* Partner Reply Display or Action Button */}
                    {rev.reply ? (
                      <div className="ml-2 sm:ml-4 p-2.5 sm:p-3 rounded-xl bg-blue-50/70 border border-blue-100 text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-[#1683FF] flex items-center gap-1 text-[11px] sm:text-xs">
                            <Store className="w-3 h-3" />
                            <span>Tanggapan dari {rev.reply.author || store.name}:</span>
                          </span>
                          <span className="text-[10px] text-slate-400">{rev.reply.date}</span>
                        </div>
                        <p className="text-slate-700 text-xs">{rev.reply.comment}</p>
                      </div>
                    ) : (
                      <div className="flex justify-end">
                        <button
                          onClick={() => handleOpenReplyModal(rev)}
                          className="text-xs font-bold text-[#1683FF] hover:bg-blue-50 px-3 py-1.5 rounded-lg transition inline-flex items-center gap-1 cursor-pointer"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>Balas Ulasan</span>
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
            <form onSubmit={handleSaveSettings} className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-6 shadow-2xs space-y-4 sm:space-y-6">
              <div>
                <h3 className="font-bold text-sm sm:text-base text-slate-900">Pengaturan Toko &amp; Rekening Pencairan</h3>
                <p className="text-xs text-slate-500">Atur ketersediaan penerimaan sewa, aturan identitas, dan rekening payout transfer manual admin</p>
              </div>

              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center justify-between p-3.5 sm:p-4 rounded-xl bg-slate-50 border border-slate-100">
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

                <div className="flex items-center justify-between p-3.5 sm:p-4 rounded-xl bg-slate-50 border border-slate-100">
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

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 pt-1">
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

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white text-xs font-bold shadow-2xs transition cursor-pointer"
                  >
                    Simpan Pengaturan
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* ============================================================ */}
          {/* VIEW: PROMOSI UNIT SEWA                                      */}
          {/* ============================================================ */}
          {activeMenu === "promote_rental" && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-slate-900">Promosikan Unit Sewa</h3>
                  <p className="text-xs text-slate-500">
                    Pilih unit kamera, lensa, atau gear spesifik dari katalog toko untuk ditempatkan di jajaran teratas Sewa Unggulan.
                  </p>
                </div>
                <Link
                  href="/mitra/dashboard/promosi/buat"
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white text-xs font-bold shadow-xs transition cursor-pointer w-full sm:w-auto"
                >
                  <Rocket className="w-4 h-4" />
                  <span>Promosikan Unit Sewa</span>
                </Link>
              </div>

              {/* Status Promosi Unit Sewa */}
              {(() => {
                const rentalPromos = partnerPromotions.filter(p => p.targetType === "rental");
                return rentalPromos.length > 0 ? (
                  <div className="space-y-2.5">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Daftar Unit Sewa yang Sedang Dipromosikan:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3.5">
                      {rentalPromos.map((prm) => {
                        const isActive = prm.status === "active";
                        return (
                          <div key={prm.id} className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2">
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
                                className="text-[11px] font-bold text-[#1683FF] hover:underline cursor-pointer"
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
                  <div className="p-6 sm:p-8 rounded-2xl border border-dashed border-slate-200 bg-white text-center space-y-2">
                    <Package className="w-8 h-8 sm:w-10 sm:h-10 text-slate-300 mx-auto" />
                    <h4 className="text-xs sm:text-sm font-bold text-slate-800">Belum Ada Unit Sewa yang Dipromosikan</h4>
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

              {/* Pilihan Paket Promosi Layanan Unit Sewa */}
              <div className="pt-2">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">Pilihan Paket Promosi Layanan:</h4>
                {promoPackages.length === 0 ? (
                  <div className="p-6 sm:p-8 rounded-2xl border border-dashed border-slate-200 bg-white text-center space-y-2">
                    <Megaphone className="w-8 h-8 sm:w-10 sm:h-10 text-slate-300 mx-auto" />
                    <h4 className="text-xs sm:text-sm font-bold text-slate-800">Paket Promosi Belum Tersedia</h4>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                      Admin belum menambahkan paket promosi untuk kategori sewa. Paket yang dibuat oleh admin di Admin Panel akan otomatis muncul di sini.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {promoPackages.map((pkg) => {
                      const features = pkg.features || pkg.benefits || [];
                      return (
                        <div
                          key={pkg.id}
                          className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                            pkg.isPopular
                              ? "border-[#1683FF] bg-blue-50/20 ring-2 ring-[#1683FF]/15 shadow-sm"
                              : "border-slate-200/90 bg-white shadow-2xs hover:border-slate-300"
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
                            <p className="text-[11px] text-slate-500 leading-relaxed">{pkg.description || `${pkg.durationDays} hari masa tayang promosi.`}</p>
                            <ul className="space-y-1.5 pt-2 border-t border-slate-100">
                              {features.map((feat, idx) => (
                                <li key={idx} className="flex items-center gap-2 text-[11px] text-slate-600">
                                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                  <span>{feat}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                          <Link
                            href={`/mitra/dashboard/promosi/buat?pkg=${pkg.id}&target=unit`}
                            className={`mt-4 w-full py-2.5 rounded-xl text-xs font-bold transition text-center block cursor-pointer ${
                              pkg.isPopular
                                ? "bg-[#1683FF] hover:bg-[#0F6FE5] text-white shadow-2xs"
                                : "bg-slate-100 hover:bg-slate-200 text-slate-800"
                            }`}
                          >
                            Pilih Paket Ini
                          </Link>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* VIEW 12: CHAT (KOMUNIKASI PENYEWA - NATIVE CHAT LIST APP)     */}
          {/* ============================================================ */}
          {activeMenu === "chat" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-base sm:text-lg text-slate-900">Ruang Percakapan Penyewa</h3>
                  <p className="text-[11px] sm:text-xs text-slate-500">Koordinasi titik serah terima, unit rental, dan jadwal pengembalian</p>
                </div>
                <Link
                  href="/chat?role=partner&category=sewa"
                  className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white text-xs font-bold transition shrink-0"
                >
                  Buka Chat Penuh
                </Link>
              </div>

              {/* Chat Conversation List (Native Row Style) */}
              <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-2xs divide-y divide-slate-100">
                {rentalChatRooms.length === 0 ? (
                  <div className="p-8 sm:p-12 text-center text-slate-500">
                    <MessageSquare className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <h4 className="text-sm font-bold text-slate-800">Belum Ada Percakapan Penyewa</h4>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                      Ketika ada calon penyewa atau pesanan masuk untuk unit rental Anda, obrolan sewa akan otomatis muncul di sini secara terpisah dari jasa.
                    </p>
                  </div>
                ) : (
                  rentalChatRooms.map((room) => {
                    const isUserRequester = room.requesterId === currentUser?.id || room.requester?.id === currentUser?.id;
                    const counterpart = isUserRequester
                      ? (room.helper || { fullName: "Penyedia Rental", name: "Penyedia Rental" })
                      : (room.requester || { fullName: "Penyewa", name: "Penyewa" });
                    const counterpartName = counterpart.fullName || counterpart.name || "Pelanggan Sewa";
                    const initials = counterpartName
                      .split(" ")
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase();
                    const lastMsg = room.messages?.[room.messages.length - 1];

                    return (
                      <Link
                        key={room.id}
                        href={`/chat?room=${room.id}&role=partner&category=sewa`}
                        className="flex items-center gap-3 p-3 sm:p-4 hover:bg-blue-50/40 transition group"
                      >
                        <div className="relative shrink-0">
                          {counterpart.avatar || counterpart.avatarUrl ? (
                            <img
                              src={counterpart.avatar || counterpart.avatarUrl}
                              alt={counterpartName}
                              onError={(e) => { e.currentTarget.style.display = "none"; }}
                              className="w-10 h-10 rounded-full object-cover border border-slate-200 bg-white"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-blue-100 text-[#1683FF] font-black flex items-center justify-center text-xs">
                              {initials}
                            </div>
                          )}
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white absolute bottom-0 right-0" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-xs sm:text-sm font-bold text-slate-900 truncate group-hover:text-[#1683FF] transition">
                              {counterpartName} <span className="text-[10px] font-normal text-slate-400">&middot; {room.title || room.itemTitle || "Unit Sewa"}</span>
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium shrink-0">
                              {lastMsg?.timestamp || lastMsg?.time || "Terbaru"}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 truncate mt-0.5">
                            {lastMsg?.message || lastMsg?.text || lastMsg?.content || "Ketuk untuk membuka ruang obrolan sewa..."}
                          </p>
                        </div>
                        <div className="shrink-0 flex items-center gap-1.5">
                          {((room.unreadCount && room.unreadCount > 0) || (room.messages || []).filter(m => m.senderId !== currentUser?.id && !m.isRead && !m.read).length > 0) && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#1683FF] text-white">
                              {room.unreadCount || (room.messages || []).filter(m => m.senderId !== currentUser?.id && !m.isRead && !m.read).length}
                            </span>
                          )}
                          <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-[#1683FF] transition" />
                        </div>
                      </Link>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* VIEW 13: NOTIFICATIONS (PUSAT NOTIFIKASI TOKO MITRA)         */}
          {/* ============================================================ */}
          {activeMenu === "notifications" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-base sm:text-lg text-slate-900">Notifikasi Masuk</h3>
                  <p className="text-[11px] sm:text-xs text-slate-500">Pemberitahuan transaksi sewa, jadwal serah terima, dan pencairan saldo</p>
                </div>
                {partnerNotifications.length > 0 && (
                  <button
                    type="button"
                    onClick={() => handleMarkNotificationsRead()}
                    className="text-[11px] sm:text-xs font-bold text-[#1683FF] hover:underline cursor-pointer shrink-0"
                  >
                    Tandai Semua Dibaca
                  </button>
                )}
              </div>

              <div className="bg-white border border-slate-200/90 rounded-2xl p-3 sm:p-5 shadow-2xs divide-y divide-slate-100">
                {partnerNotifications.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-xs">
                    <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-700">Belum Ada Notifikasi</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Pemberitahuan transaksi sewa dan jadwal serah terima barang akan tampil di sini.
                    </p>
                  </div>
                ) : (
                  partnerNotifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => !notif.isRead && handleMarkNotificationsRead(notif.id)}
                      className={`py-3 flex items-start gap-3 transition ${!notif.isRead ? "bg-blue-50/40 -mx-2.5 px-2.5 rounded-xl cursor-pointer hover:bg-blue-50/70" : ""}`}
                    >
                      <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#1683FF] flex items-center justify-center shrink-0 mt-0.5 border border-blue-100">
                        <Bell className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1.5">
                          <h4 className="text-xs font-bold text-slate-900 truncate">{notif.title}</h4>
                          <span className="text-[10px] text-slate-400 shrink-0">{notif.time}</span>
                        </div>
                        <p className="text-[11px] sm:text-xs text-slate-600 mt-0.5 leading-relaxed">{notif.message}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* VIEW 14: LAPORAN & SENGKETA RENTAL                           */}
          {/* ============================================================ */}
          {activeMenu === "disputes" && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-slate-900">Pusat Laporan &amp; Sengketa Sewa</h3>
                  <p className="text-xs text-slate-500">
                    Laporkan kerusakan fisik barang, keterlambatan pengembalian ekstrem, atau klaim potongan deposit jaminan.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsDisputeModalOpen(true)}
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition cursor-pointer w-full sm:w-auto"
                >
                  <AlertTriangle className="w-4 h-4" />
                  <span>Buat Laporan Baru</span>
                </button>
              </div>

              {/* Daftar Laporan Aktif Mitra */}
              <div className="space-y-2.5 sm:space-y-3">
                {partnerReports.map((rep) => {
                  const isOpen = rep.status === "open" || rep.status === "investigating" || rep.status === "pending";
                  return (
                    <div key={rep.id} className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200 bg-white shadow-2xs space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-slate-400 font-bold">#{rep.id.slice(0, 8)}</span>
                          <span className="font-bold text-slate-900">{rep.reason || rep.category}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isOpen ? "bg-amber-50 text-amber-700 border border-amber-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          }`}>
                            {isOpen ? "Dalam Investigasi" : "Selesai"}
                          </span>
                          {!isOpen && (
                            <button
                              type="button"
                              onClick={() => handleDeleteReport(rep.id)}
                              className="text-slate-400 hover:text-rose-600 transition p-1 cursor-pointer"
                              title="Arsipkan / Hapus Laporan Selesai"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="text-slate-600 leading-relaxed text-[11px]">{rep.description}</p>
                      <div className="pt-2 flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-100">
                        <span>Penyewa: <strong className="text-slate-700">{rep.targetName || rep.targetUser?.fullName || "-"}</strong></span>
                        <span>{new Date(rep.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}</span>
                      </div>
                    </div>
                  );
                })}

                {partnerReports.length === 0 && (
                  <div className="text-center py-8 sm:py-10 bg-white rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs">
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
                <span className="text-sm font-extrabold text-[#1683FF]">{formatIDR(liveAvailableBalance)}</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nominal Penarikan (Rp)</label>
                <input
                  type="number"
                  required
                  min={20000}
                  max={liveAvailableBalance}
                  value={withdrawForm.amount}
                  onChange={(e) => setWithdrawForm({ ...withdrawForm, amount: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-bold focus:outline-none focus:border-[#1683FF]"
                />
                <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                  <span>Minimal Rp20.000</span>
                  <button
                    type="button"
                    onClick={() => setWithdrawForm({ ...withdrawForm, amount: liveAvailableBalance.toString() })}
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
                  disabled={isSubmittingWithdraw || Number(withdrawForm.amount) < 20000 || Number(withdrawForm.amount) > liveAvailableBalance}
                  className="px-5 py-2 rounded-xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white text-xs font-bold shadow-2xs transition cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5"
                >
                  {isSubmittingWithdraw ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Memproses...</span>
                    </>
                  ) : (
                    "Konfirmasi Penarikan"
                  )}
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
                  placeholder="Terima kasih Kak telah menyewa unit di toko kami..."
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
                onClick={() => handleOpenDisputeForOrder(selectedOrderForHandover)}
                className="text-xs font-bold text-rose-600 hover:bg-rose-50 px-3 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Laporkan Kerusakan / Sengketa</span>
              </button>

              <div className="flex items-center gap-2">
                <Link
                  href={`/chat?room=${selectedOrderForHandover.orderRoomId || selectedOrderForHandover.id}&role=partner&category=sewa`}
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
                  placeholder="Contoh: Budi Santoso"
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

          {/* 3. Chat */}
          <button
            type="button"
            onClick={() => { setActiveMenu("chat"); setIsMobileMoreOpen(false); }}
            className={`flex flex-col items-center justify-center py-1 rounded-xl transition min-h-[44px] cursor-pointer relative ${
              activeMenu === "chat" ? "text-[#1683FF]" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <div className="relative">
              <div className={`w-9 h-7 rounded-full flex items-center justify-center transition ${
                activeMenu === "chat" ? "bg-[#EAF4FF] text-[#1683FF]" : "bg-transparent"
              }`}>
                <MessageSquare className={`w-5 h-5 ${activeMenu === "chat" ? "scale-110" : ""}`} />
              </div>
              <UnreadBadge count={unreadChatCount} />
            </div>
            <span className="text-[10px] font-bold leading-tight mt-0.5 truncate max-w-[64px]">Chat</span>
          </button>

          {/* 4. Notifikasi */}
          <button
            type="button"
            onClick={() => { setActiveMenu("notifications"); setIsMobileMoreOpen(false); }}
            className={`flex flex-col items-center justify-center py-1 rounded-xl transition min-h-[44px] cursor-pointer relative ${
              activeMenu === "notifications" ? "text-[#1683FF]" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <div className="relative">
              <div className={`w-9 h-7 rounded-full flex items-center justify-center transition ${
                activeMenu === "notifications" ? "bg-[#EAF4FF] text-[#1683FF]" : "bg-transparent"
              }`}>
                <Bell className={`w-5 h-5 ${activeMenu === "notifications" ? "scale-110" : ""}`} />
              </div>
              <UnreadBadge count={partnerNotifications.filter((n) => !n.isRead).length} />
            </div>
            <span className="text-[10px] font-bold leading-tight mt-0.5 truncate max-w-[64px]">Notifikasi</span>
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

            {/* Group 1: Transaksi & Sengketa */}
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Transaksi &amp; Sengketa
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => { setActiveMenu("orders"); setIsMobileMoreOpen(false); }}
                  className={`p-3 rounded-2xl border text-left flex items-center gap-2.5 transition cursor-pointer relative ${
                    activeMenu === "orders" ? "bg-blue-50 border-[#1683FF] text-[#1683FF]" : "bg-slate-50 border-slate-200/80 text-slate-700"
                  }`}
                >
                  <Receipt className="w-4 h-4 shrink-0 text-[#1683FF]" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold truncate block">Pesanan &amp; Handover</span>
                      {activeOrdersCount > 0 && (
                        <span className="px-1.5 py-0.2 rounded-full text-[9px] font-extrabold bg-[#1683FF] text-white">
                          {activeOrdersCount}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 block truncate">
                      {activeOrdersCount} aktif
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => { setActiveMenu("wallet"); setIsMobileMoreOpen(false); }}
                  className={`p-3 rounded-2xl border text-left flex items-center gap-2.5 transition cursor-pointer ${
                    activeMenu === "wallet" ? "bg-blue-50 border-[#1683FF] text-[#1683FF]" : "bg-slate-50 border-slate-200/80 text-slate-700"
                  }`}
                >
                  <Wallet className="w-4 h-4 shrink-0 text-[#1683FF]" />
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-bold truncate block">Dompet &amp; Payout</span>
                    <span className="text-[10px] text-emerald-600 font-semibold block truncate">
                      {formatIDR(liveAvailableBalance)}
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => { setActiveMenu("disputes"); setIsMobileMoreOpen(false); }}
                  className={`p-3 rounded-2xl border text-left flex items-center gap-2.5 transition cursor-pointer col-span-2 ${
                    activeMenu === "disputes" ? "bg-rose-50 border-rose-300 text-rose-700" : "bg-slate-50 border-slate-200/80 text-slate-700"
                  }`}
                >
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-bold truncate block">Laporan &amp; Sengketa</span>
                    <span className="text-[10px] text-slate-400 block truncate">
                      Klaim deposit &amp; kerusakan barang
                    </span>
                  </div>
                </button>
              </div>
            </div>

            {/* Group 2: Pemasaran & Portofolio */}
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Pemasaran &amp; Inventaris
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => { setActiveMenu("gallery"); setIsMobileMoreOpen(false); }}
                  className={`p-3 rounded-2xl border text-left flex items-center gap-2.5 transition cursor-pointer ${
                    activeMenu === "gallery" ? "bg-blue-50 border-[#1683FF] text-[#1683FF]" : "bg-slate-50 border-slate-200/80 text-slate-700"
                  }`}
                >
                  <ImageIcon className="w-4 h-4 shrink-0 text-[#1683FF]" />
                  <span className="text-xs font-bold truncate">Galeri Showcase</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setActiveMenu("promote_rental"); setIsMobileMoreOpen(false); }}
                  className={`p-3 rounded-2xl border text-left flex items-center gap-2.5 transition cursor-pointer ${
                    activeMenu === "promote_rental" ? "bg-blue-50 border-[#1683FF] text-[#1683FF]" : "bg-slate-50 border-slate-200/80 text-slate-700"
                  }`}
                >
                  <Rocket className="w-4 h-4 shrink-0 text-[#1683FF]" />
                  <span className="text-xs font-bold truncate">Promosi Unit</span>
                </button>
              </div>
            </div>

            {/* Group 3: Toko & Pengaturan */}
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Toko &amp; Pengaturan
              </div>
              <div className="space-y-1.5">
                <button
                  type="button"
                  onClick={() => { setActiveMenu("profile"); setIsMobileMoreOpen(false); }}
                  className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition cursor-pointer ${
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
                  className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition cursor-pointer ${
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
                  onClick={() => { setActiveMenu("settings"); setIsMobileMoreOpen(false); }}
                  className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition cursor-pointer ${
                    activeMenu === "settings" ? "bg-blue-50 border-[#1683FF] text-[#1683FF]" : "bg-slate-50/60 border-slate-200/60 text-slate-700"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Settings className="w-4 h-4 text-slate-500" />
                    <span className="text-xs font-bold">Pengaturan Toko &amp; Payout</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </button>
              </div>
            </div>

            {/* Quick External Links */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
              <Link
                href={`/mitra/${store.id}`}
                target="_blank"
                className="flex-1 py-2 px-2.5 rounded-xl bg-blue-50 text-[#1683FF] text-xs font-bold text-center flex items-center justify-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Toko Publik</span>
              </Link>
              {(currentUser?.accountRole === "provider" || currentUser?.accountType === "provider" || currentUser?.isProviderEnabled || currentUser?.role === "provider" || currentUser?.isAdmin) && (
                <Link
                  href="/jasa/dashboard"
                  className="flex-1 py-2 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold text-center flex items-center justify-center gap-1.5"
                >
                  <Briefcase className="w-3.5 h-3.5" />
                  <span>Portal Jasa</span>
                </Link>
              )}
              <Link
                href="/"
                className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold text-center flex items-center justify-center gap-1"
                title="Kembali ke Mode User"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">User</span>
              </Link>
            </div>
          </div>
        </div>
      )}

        </div>
      )}
    </RoleGuard>

  );
}
