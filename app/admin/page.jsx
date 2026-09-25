"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import logoImg from "@/components/image/logo.png";
import { useApp } from "@/lib/context/AppContext";
import RoleGuard from "@/components/auth/RoleGuard";
import { formatIDR, formatDateTimeIndo, formatDateIndo } from "@/lib/utils";
import { VOUCHER_LOCATIONS } from "@/lib/mock/voucherData";
import {
  Shield,
  AlertTriangle,
  UserCheck,
  CheckCircle2,
  XCircle,
  Lock,
  History,
  DollarSign,
  Receipt,
  ArrowUpRight,
  Check,
  Package,
  Search,
  ExternalLink,
  Clock,
  Building2,
  Filter,
  Eye,
  EyeOff,
  Store,
  ShieldCheck,
  Tag,
  Ticket,
  Plus,
  Trash2,
  Gift,
  Rocket,
  Calendar,
  Copy,
  LayoutDashboard,
  Wallet,
  Users,
  Megaphone,
  AlertCircle,
  UserX,
  Ban,
  ChevronRight,
  RefreshCw,
  X,
  TrendingUp,
  User,
  CreditCard,
  CheckCheck,
  MessageSquare,
  Send,
  ImagePlus,
  MapPin,
  Globe,
  Loader2,
  Briefcase,
  Star,
  Eraser,
} from "lucide-react";
import { getAllProviders } from "@/lib/mock/providersData";
import { getAllMitraStores } from "@/lib/mock/mitraData";
import { promotionService } from "@/lib/services/promotionService";
import { adminService } from "@/lib/services/adminService";
import { payoutService } from "@/lib/services/payoutService";
import { refundService } from "@/lib/services/refundService";

// ─── Mock Admin Inbox Chat ──────────────────────────────────────────────────
const MOCK_INBOX = [
  {
    id: "chat-001",
    userId: "usr-001",
    userName: "Rian Prasetya",
    userAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80",
    location: "Jakarta Selatan",
    lastMessage: "Saya ingin menanyakan soal refund deposit sewa kamera saya.",
    time: new Date(Date.now() - 5 * 60000).toISOString(),
    unread: true,
    messages: [
      { id: 1, from: "user", text: "Halo admin, saya ingin menanyakan soal refund deposit sewa kamera saya.", time: new Date(Date.now() - 5 * 60000).toISOString(), image: null },
    ],
  },
  {
    id: "chat-002",
    userId: "usr-002",
    userName: "Siti Rahma",
    userAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80",
    location: "Sleman, Yogyakarta",
    lastMessage: "Ada pengguna yang minta bayar di luar platform, ini bukti screenshotnya.",
    time: new Date(Date.now() - 30 * 60000).toISOString(),
    unread: true,
    messages: [
      { id: 1, from: "user", text: "Ada pengguna yang minta bayar di luar platform, ini bukti screenshotnya.", time: new Date(Date.now() - 30 * 60000).toISOString(), image: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&w=400&q=60" },
    ],
  },
  {
    id: "chat-003",
    userId: "usr-003",
    userName: "Dimas Arya",
    userAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80",
    location: "Kota Depok",
    lastMessage: "Terima kasih admin, masalah sudah selesai!",
    time: new Date(Date.now() - 2 * 3600000).toISOString(),
    unread: false,
    messages: [
      { id: 1, from: "user", text: "Halo admin, ada masalah dengan status pesanan saya.", time: new Date(Date.now() - 3 * 3600000).toISOString(), image: null },
      { id: 2, from: "admin", text: "Halo! Bisa ceritakan detail pesanannya? ID order berapa?", time: new Date(Date.now() - 2.5 * 3600000).toISOString(), image: null },
      { id: 3, from: "user", text: "Terima kasih admin, masalah sudah selesai!", time: new Date(Date.now() - 2 * 3600000).toISOString(), image: null },
    ],
  },
  {
    id: "chat-004",
    userId: "usr-004",
    userName: "Fajar Ramadhan",
    userAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=120&q=80",
    location: "Jakarta Selatan",
    lastMessage: "Bagaimana cara klaim voucher JASAHEMAT? Tidak bisa dipakai.",
    time: new Date(Date.now() - 4 * 3600000).toISOString(),
    unread: false,
    messages: [
      { id: 1, from: "user", text: "Bagaimana cara klaim voucher JASAHEMAT? Tidak bisa dipakai.", time: new Date(Date.now() - 4 * 3600000).toISOString(), image: null },
    ],
  },
];

function formatChatTime(d) {
  if (!d) return "";
  const dateObj = typeof d === "string" ? new Date(d) : d;
  if (!dateObj || isNaN(dateObj.getTime?.())) return typeof d === "string" ? d : "";
  const now = new Date();
  const diff = now - dateObj;
  if (diff < 60000) return "Baru saja";
  if (diff < 3600000) return `${Math.floor(diff / 60000)} mnt lalu`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} jam lalu`;
  return dateObj.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}

function formatMessageTime(d) {
  if (!d) return "";
  const dateObj = typeof d === "string" ? new Date(d) : d;
  if (!dateObj || isNaN(dateObj.getTime?.())) return typeof d === "string" ? d : "";
  return dateObj.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

// ─── Admin Page ──────────────────────────────────────────────────────────────
export default function AdminDashboardPage() {
  const {
    currentUser,
    orderRooms = [],
    ledgerEntries = [],
    withdrawals = [],
    customerDeposits = [],
    adminMarkWithdrawalSuccess,
    adminRejectWithdrawal,
    adminMarkDepositRefunded,
    adminMarkItemReturned,
    reports = [],
    deleteReport,
    auditLogs = [],
    adminVerifyUser,
    adminCancelOrderEscrow,
    resolveDispute,
    confirmOrderCompletion,
    vouchers = [],
    adminAddVoucher,
    adminToggleVoucher,
    adminDeleteVoucher,
    services = [],
    setServices,
    rentals = [],
    setRentals,
    requests = [],
    setRequests,
    helpers = [],
    partners = [],
    addToast,
  } = useApp();

  // ── Active Menu ──────────────────────────────────────────────────────────
  const [activeMenu, setActiveMenu] = useState("overview");

  // ── Global Location Filter (untuk admin melihat data per wilayah) ────────
  const [adminLocationFilter, setAdminLocationFilter] = useState("all");

  // ── Photo / Evidence Zoom Modal ──────────────────────────────────────────
  const [previewImageUrl, setPreviewImageUrl] = useState(null);

  // ── TRANSAKSI & LEDGER ───────────────────────────────────────────────────
  const [transactionFilter, setTransactionFilter] = useState("all");
  const [transactionStatusFilter, setTransactionStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrderForDetail, setSelectedOrderForDetail] = useState(null);
  const [frozenOrderIds, setFrozenOrderIds] = useState({});

  // ── WITHDRAWALS & REFUNDS ────────────────────────────────────────────────
  const [transferRefMap, setTransferRefMap] = useState({});
  const [rejectReasonMap, setRejectReasonMap] = useState({});
  const [depositRefundRefMap, setDepositRefundRefMap] = useState({});
  const [deductionAmountMap, setDeductionAmountMap] = useState({});
  const [deductionReasonMap, setDeductionReasonMap] = useState({});

  // ── KYC & DISPUTES ───────────────────────────────────────────────────────
  const [revealedNikIds, setRevealedNikIds] = useState({});
  const toggleRevealNik = (id) => setRevealedNikIds((p) => ({ ...p, [id]: !p[id] }));
  const [selectedReportId, setSelectedReportId] = useState(reports[0]?.id || "");
  const [disputeNotes, setDisputeNotes] = useState("");
  const [rejectReason, setRejectReason] = useState("");

  // ── VOUCHER MANAGEMENT ───────────────────────────────────────────────────
  const [voucherCategoryFilter, setVoucherCategoryFilter] = useState("all");
  const [voucherLocationFilter, setVoucherLocationFilter] = useState("all");
  const [voucherStatusFilter, setVoucherStatusFilter] = useState("all");
  const [voucherSearch, setVoucherSearch] = useState("");
  const [isCreateVoucherOpen, setIsCreateVoucherOpen] = useState(false);
  const [copiedVoucherId, setCopiedVoucherId] = useState(null);

  const defaultExpiresAt = new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0];
  const [newVoucher, setNewVoucher] = useState({
    code: "",
    title: "",
    description: "",
    type: "percent",
    value: 15,
    maxDiscount: 25000,
    minOrder: 50000,
    appliesTo: "all",
    targetLocation: "all",
    quota: 50,
    expiresAt: defaultExpiresAt,
  });

  // ── LISTING MODERATION ───────────────────────────────────────────────────
  const [listingTypeFilter, setListingTypeFilter] = useState("all");
  const [listingSearch, setListingSearch] = useState("");
  const [hiddenListingIds, setHiddenListingIds] = useState({});

  // ── USER DIRECTORY ───────────────────────────────────────────────────────
  const [userSearch, setUserSearch] = useState("");
  const [suspendedUserIds, setSuspendedUserIds] = useState({});

  // ── BROADCAST ────────────────────────────────────────────────────────────
  const [broadcasts, setBroadcasts] = useState([
    { id: "bc-1", title: "Pembayaran Aman via Payment Gateway 100% Terverifikasi", message: "Transaksi bantuan, jasa, dan sewa dilindungi penuh melalui sistem Payment Gateway resmi Bantuin. Jangan pernah mentransfer ke rekening pribadi mitra!", type: "info", target: "Semua Pengguna", isActive: true, createdAt: "2026-09-20" },
    { id: "bc-2", title: "Peringatan Keamanan Anti-Disintermediasi", message: "Dilarang keras membagikan kontak WhatsApp atau meminta transaksi di luar platform sebelum pembayaran resmi terkonfirmasi di sistem.", type: "warning", target: "Mitra & Pelanggan", isActive: true, createdAt: "2026-09-21" },
    { id: "bc-3", title: "Promo Voucher Spesial Awal Bulan", message: "Gunakan voucher BANTUIN15 (Diskon 15%) dan SEWAMUDAH (Hemat Rp 20.000 sewa barang) di halaman pembayaran.", type: "promo", target: "Pelanggan", isActive: true, createdAt: "2026-09-22" },
  ]);
  const [isNewBroadcastOpen, setIsNewBroadcastOpen] = useState(false);
  const [newBroadcastForm, setNewBroadcastForm] = useState({ title: "", message: "", type: "info", target: "Semua Pengguna" });

  // ── AUDIT ────────────────────────────────────────────────────────────────
  const [auditActionFilter, setAuditActionFilter] = useState("all");

  // ── CHAT INBOX (Sync 2 Arah dengan /chat/admin) ──────────────────────────
  const [inboxThreads, setInboxThreads] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("bantuin_admin_chat_threads");
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch (e) {}
    }
    return MOCK_INBOX;
  });

  const [selectedThreadId, setSelectedThreadId] = useState(null);
  const [chatInput, setChatInput] = useState("");
  const [chatImagePreview, setChatImagePreview] = useState(null);
  const chatFileInputRef = useRef(null);
  const chatBottomRef = useRef(null);

  // Sync dengan localStorage & user /chat/admin secara real-time
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem("bantuin_admin_chat_threads", JSON.stringify(inboxThreads));
    } catch (e) {}
  }, [inboxThreads]);

  useEffect(() => {
    const handleSync = () => {
      try {
        const raw = localStorage.getItem("bantuin_admin_chat_threads");
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setInboxThreads(parsed);
          }
        }
      } catch (e) {}
    };
    window.addEventListener("bantuin_admin_chat_updated", handleSync);
    window.addEventListener("storage", handleSync);
    return () => {
      window.removeEventListener("bantuin_admin_chat_updated", handleSync);
      window.removeEventListener("storage", handleSync);
    };
  }, []);

  const selectedThread = inboxThreads.find((t) => t.id === selectedThreadId);
  const unreadCount = inboxThreads.filter((t) => t.unread).length;

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedThread?.messages]);

  const handleSelectThread = (id) => {
    setSelectedThreadId(id);
    setInboxThreads((prev) => {
      const updated = prev.map((t) => (t.id === id ? { ...t, unread: false } : t));
      try {
        localStorage.setItem("bantuin_admin_chat_threads", JSON.stringify(updated));
        window.dispatchEvent(new Event("bantuin_admin_chat_updated"));
      } catch (e) {}
      return updated;
    });
  };

  const handleSendAdminReply = () => {
    const text = chatInput.trim();
    const hasImg = !!chatImagePreview;
    if (!text && !hasImg) return;
    const newMsg = {
      id: Date.now(),
      from: "admin",
      text,
      image: chatImagePreview || null,
      time: new Date().toISOString()
    };
    setInboxThreads((prev) => {
      const updated = prev.map((t) =>
        t.id === selectedThreadId
          ? {
              ...t,
              messages: [...(t.messages || []), newMsg],
              lastMessage: text || "📷 Foto",
              time: new Date().toISOString()
            }
          : t
      );
      try {
        localStorage.setItem("bantuin_admin_chat_threads", JSON.stringify(updated));
        window.dispatchEvent(new Event("bantuin_admin_chat_updated"));
      } catch (e) {}
      return updated;
    });
    setChatInput("");
    setChatImagePreview(null);
  };

  const handleChatImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert("Ukuran foto maksimal 5MB."); return; }
    const reader = new FileReader();
    reader.onload = (ev) => setChatImagePreview(ev.target.result);
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // ── PENGHAPUSAN CHAT & PENGADUAN ADMIN ───────────────────────────────────
  const handleDeleteThread = (threadId, e) => {
    if (e) e.stopPropagation();
    if (typeof window !== "undefined" && !window.confirm("Hapus seluruh percakapan pengaduan ini dari inbox admin?")) return;
    setInboxThreads((prev) => {
      const updated = prev.filter((t) => t.id !== threadId);
      try {
        localStorage.setItem("bantuin_admin_chat_threads", JSON.stringify(updated));
        window.dispatchEvent(new Event("bantuin_admin_chat_updated"));
      } catch (err) {}
      return updated;
    });
    if (selectedThreadId === threadId) {
      setSelectedThreadId(null);
    }
    addToast?.("Percakapan Dihapus", "Pesan pengaduan telah berhasil dihapus dari inbox admin.");
  };

  const handleDeleteMessage = (messageId) => {
    if (!selectedThreadId) return;
    setInboxThreads((prev) => {
      const updated = prev.map((t) => {
        if (t.id === selectedThreadId) {
          const newMessages = (t.messages || []).filter((m) => m.id !== messageId);
          const lastMsg = newMessages[newMessages.length - 1];
          return {
            ...t,
            messages: newMessages,
            lastMessage: lastMsg ? (lastMsg.text || "📷 Foto") : "Percakapan kosong",
          };
        }
        return t;
      });
      try {
        localStorage.setItem("bantuin_admin_chat_threads", JSON.stringify(updated));
        window.dispatchEvent(new Event("bantuin_admin_chat_updated"));
      } catch (err) {}
      return updated;
    });
    addToast?.("Pesan Dihapus", "Pesan telah berhasil dihapus.");
  };

  const handleClearThreadMessages = (threadId) => {
    if (typeof window !== "undefined" && !window.confirm("Bersihkan seluruh isi pesan pada percakapan pengaduan ini?")) return;
    setInboxThreads((prev) => {
      const updated = prev.map((t) => {
        if (t.id === threadId) {
          return {
            ...t,
            messages: [],
            lastMessage: "Percakapan telah dibersihkan",
          };
        }
        return t;
      });
      try {
        localStorage.setItem("bantuin_admin_chat_threads", JSON.stringify(updated));
        window.dispatchEvent(new Event("bantuin_admin_chat_updated"));
      } catch (err) {}
      return updated;
    });
    addToast?.("Chat Dibersihkan", "Seluruh isi pesan pengaduan telah dibersihkan.");
  };

  const handleDeleteReport = (reportId, e) => {
    if (e) e.stopPropagation();
    if (typeof window !== "undefined" && !window.confirm(`Hapus laporan/sengketa #${reportId} dari sistem?`)) return;
    if (deleteReport) {
      deleteReport(reportId);
    }
    if (selectedReportId === reportId) {
      setSelectedReportId(null);
    }
    addToast?.("Laporan Dihapus", `Laporan #${reportId} telah dihapus dari sistem.`);
  };

  // ── COMPUTED ─────────────────────────────────────────────────────────────
  const filteredOrders = useMemo(() => {
    return orderRooms.filter((order) => {
      if (order.stage === "inquiry") return false;
      if (transactionFilter === "service" && order.orderType !== "service") return false;
      if (transactionFilter === "rental" && order.orderType !== "rental") return false;
      if (transactionFilter === "task" && order.orderType === "rental") return false;
      if (transactionStatusFilter === "completed" && order.stage !== "completed") return false;
      if (transactionStatusFilter === "paid_escrow" && order.stage !== "paid_escrow") return false;
      if (transactionStatusFilter === "in_progress" && order.stage !== "in_progress") return false;
      if (transactionStatusFilter === "dispute" && order.stage !== "disputed") return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          (order.requestTitle || "").toLowerCase().includes(q) ||
          (order.id || "").toLowerCase().includes(q) ||
          (order.requester?.name || "").toLowerCase().includes(q) ||
          (order.helper?.name || "").toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [orderRooms, transactionFilter, transactionStatusFilter, searchQuery]);

  const pendingWithdrawalsCount = withdrawals.filter((w) => w.status === "PENDING").length;
  const pendingRefundsCount = customerDeposits.filter((d) => d.status === "WAITING_RETURN" || d.status === "INSPECTION" || d.status === "REFUND_PENDING").length;
  const pendingDisputesCount = reports.filter((r) => r.status === "pending" || r.status === "OPEN" || r.status === "UNDER_REVIEW").length;

  // Daftar antrean verifikasi KYC (termasuk currentUser jika pending, dan helpers/partners yang belum verified)
  const pendingKycList = useMemo(() => {
    const list = [];
    if (currentUser?.verificationStatus === "pending_review" || (currentUser?.verificationStatus !== "verified" && currentUser?.idCardUrl)) {
      list.push({
        id: currentUser.id || "usr-current",
        name: currentUser.fullName || "Pengguna",
        email: currentUser.email || "user@bantuin.id",
        role: "Pelanggan & Helper",
        city: currentUser.campusName || "Jakarta Selatan",
        avatar: currentUser.avatarUrl,
        nik: currentUser.nik || "3171029801820003",
        idCardUrl: currentUser.idCardUrl || "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=400&q=80",
        selfieUrl: currentUser.selfieUrl,
        submittedAt: "Baru saja",
      });
    }
    [...helpers, ...partners].forEach((p) => {
      if (p.verificationStatus !== "verified") {
        list.push({
          id: p.id,
          name: p.name || p.fullName,
          email: p.email || `${p.id}@bantuin.id`,
          role: p.role || (p.owner ? "Mitra Toko Rental" : "Helper Komunitas"),
          city: p.city || p.location || "Jakarta",
          avatar: p.avatarUrl || p.avatar,
          nik: p.nik || "3275091827360002",
          idCardUrl: p.idCardUrl || "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=400&q=80",
          selfieUrl: p.selfieUrl,
          submittedAt: "1 hari yang lalu",
        });
      }
    });
    return list;
  }, [currentUser, helpers, partners]);

  const totalUrgentCount = pendingWithdrawalsCount + pendingDisputesCount + pendingRefundsCount + pendingKycList.length + unreadCount;

  const totalGMV = useMemo(() => orderRooms.filter((o) => o.stage !== "inquiry").reduce((sum, o) => sum + Number(o.totalAmount || o.price || 0), 0), [orderRooms]);
  const totalPlatformRevenue = useMemo(() => Math.round(totalGMV * 0.08), [totalGMV]);
  const totalPendingPaymentHeld = useMemo(() => orderRooms.filter((o) => o.stage === "paid" || o.stage === "paid_escrow" || o.stage === "in_progress").reduce((sum, o) => sum + Number(o.totalAmount || o.price || 0), 0), [orderRooms]);
  const totalDepositHeld = useMemo(() => customerDeposits.filter((d) => d.status !== "REFUNDED").reduce((sum, d) => sum + Number(d.depositAmount || 0), 0), [customerDeposits]);

  // Dynamic user directory from context + mock users
  const allUsersList = useMemo(() => {
    const list = [
      { id: "usr-admin-01", name: "Admin Pusat Bantuin", email: "admin@bantuin.id", role: "Super Admin", phone: "08119876543", verified: true, ordersCount: orderRooms.length, avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80", createdAt: "2026-01-01" },
      { id: currentUser.id || "usr-current", name: currentUser.fullName || "Rian Prasetya", email: currentUser.email || "rian.prasetya@gmail.com", role: "Pelanggan & Kreator", phone: currentUser.phoneNumber || "081298765432", verified: currentUser.verificationStatus === "verified", ordersCount: 28, avatar: currentUser.avatarUrl, createdAt: "2026-02-10" },
    ];
    helpers.forEach((h) => {
      if (!list.find((u) => u.id === h.id)) {
        list.push({
          id: h.id,
          name: h.name || h.fullName,
          email: h.email || `${h.id}@gmail.com`,
          role: "Helper Komunitas",
          phone: h.phone || "085712345678",
          verified: h.verificationStatus === "verified",
          ordersCount: h.completedOrders || 31,
          avatar: h.avatarUrl || h.avatar,
          createdAt: "2026-04-05",
        });
      }
    });
    partners.forEach((p) => {
      if (!list.find((u) => u.id === p.id)) {
        list.push({
          id: p.id,
          name: p.name || p.fullName,
          email: p.email || `${p.id}@gmail.com`,
          role: "Mitra Rental Verified",
          phone: p.phone || "081234567890",
          verified: p.verificationStatus === "verified",
          ordersCount: p.completedOrders || 86,
          avatar: p.avatarUrl || p.avatar,
          createdAt: "2026-03-01",
        });
      }
    });
    if (!list.find((u) => u.id === "user-suspect-992")) {
      list.push({ id: "user-suspect-992", name: "Akun Mencurigakan #992", email: "user992@tempmail.com", role: "Pelanggan (Disintermediasi)", phone: "089988776655", verified: false, ordersCount: 2, avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80", createdAt: "2026-09-18" });
    }
    return list;
  }, [currentUser, helpers, partners, orderRooms]);

  const allListings = useMemo(() => {
    const list = [];
    services.forEach((s) => list.push({ id: s.id, type: "jasa", title: s.title, provider: s.provider?.name || "Mitra Jasa", category: s.category || "Jasa Spesialis", price: s.price, photoUrl: s.photoUrl || s.photos?.[0] || "https://images.unsplash.com/photo-1542744094-3a31f272c490?auto=format&fit=crop&w=600&q=80", rating: s.ratingAvg || s.rating || null, city: s.city || "Jakarta Selatan", isHidden: !!hiddenListingIds[s.id] }));
    rentals.forEach((r) => list.push({ id: r.id, type: "sewa", title: r.title, provider: r.owner?.name || "Toko Mitra Rental", category: r.category || "Sewa Alat", price: r.dailyPrice, deposit: r.depositAmount, photoUrl: r.photoUrl || r.photos?.[0] || "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=600&q=80", rating: r.ratingAvg || r.rating || null, city: r.location || "Sleman, Yogyakarta", isHidden: !!hiddenListingIds[r.id] }));
    requests.forEach((q) => list.push({ id: q.id, type: "bantuan", title: q.title, provider: q.user?.name || "Pembuat Tugas", category: q.category || "Bantuan Kampus", price: q.budget, photoUrl: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=600&q=80", rating: null, city: q.location || "Depok", isHidden: !!hiddenListingIds[q.id] }));
    return list;
  }, [services, rentals, requests, hiddenListingIds]);

  // Provider, Partner & Promotions Admin States (Section N)
  const allProvidersList = useMemo(() => getAllProviders(), []);
  const allPartnersList = useMemo(() => getAllMitraStores(), []);
  const [promotionsList, setPromotionsList] = useState(() => promotionService.getAllPromotions());
  const [promoTargetFilter, setPromoTargetFilter] = useState("all"); // "all" | "service" | "rental" | "store"
  const [providerSearch, setProviderSearch] = useState("");
  const [partnerSearch, setPartnerSearch] = useState("");
  const [financeTab, setFinanceTab] = useState("withdrawals"); // "withdrawals" | "payouts" | "refunds" | "deposits"
  const [adminPayouts, setAdminPayouts] = useState(() => payoutService.getPayoutsSync());
  const [adminRefunds, setAdminRefunds] = useState(() => refundService.getRefundsSync());
  const [payoutRefInput, setPayoutRefInput] = useState({});
  const [refundRefInput, setRefundRefInput] = useState({});

  // Sinkronisasi dinamis daftar promosi, payout, dan refund
  useEffect(() => {
    const handleSync = () => {
      setPromotionsList(promotionService.getAllPromotions());
      setAdminPayouts(payoutService.getPayoutsSync());
      setAdminRefunds(refundService.getRefundsSync());
    };
    window.addEventListener("bantuin_promotions_updated", handleSync);
    window.addEventListener("bantuin_payments_updated", handleSync);
    return () => {
      window.removeEventListener("bantuin_promotions_updated", handleSync);
      window.removeEventListener("bantuin_payments_updated", handleSync);
    };
  }, []);

  const handleProcessPayout = async (payoutId) => {
    const ref = payoutRefInput[payoutId] || `MANUAL-TRF-${Date.now().toString().slice(-6)}`;
    await payoutService.processPayout(payoutId, ref, "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=400&q=80", "Admin Pusat");
    setAdminPayouts(payoutService.getPayoutsSync());
    addToast?.("Payout Diproses", `Transfer manual payout #${payoutId} berhasil dikonfirmasi dengan referensi ${ref}.`);
  };

  const handleProcessRefund = async (refundId) => {
    const ref = refundRefInput[refundId] || `REF-TRF-${Date.now().toString().slice(-6)}`;
    await refundService.processRefund(refundId, "manual_bank_transfer", ref, "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=400&q=80", "Admin Pusat");
    setAdminRefunds(refundService.getRefundsSync());
    addToast?.("Refund Diproses", `Pengembalian dana #${refundId} berhasil dikonfirmasi dengan referensi ${ref}.`);
  };
  const [suspendedProviderIds, setSuspendedProviderIds] = useState({});
  const [suspendedPartnerIds, setSuspendedPartnerIds] = useState({});

  // ── HANDLERS ────────────────────────────────────────────────────────────
  const handleForceCompleteOrder = (order) => {
    if (confirm(`Yakin ingin menyelesaikan paksa pesanan "${order.requestTitle || order.id}"?`)) {
      confirmOrderCompletion?.(order.id);
      addToast("Pesanan Selesai Paksa", `Dana pesanan #${order.id} telah diselesaikan dan dialokasikan ke hak bayar mitra.`);
    }
  };

  const handleToggleFreezeOrder = (order) => {
    const isFrozen = !!frozenOrderIds[order.id];
    setFrozenOrderIds((p) => ({ ...p, [order.id]: !isFrozen }));
    addToast(isFrozen ? "Dana Dibebaskan" : "Dana Transaksi Ditahan Sementara", `Order #${order.id} ${isFrozen ? "dibebaskan" : "ditahan sementara untuk investigasi"}.`);
  };

  const handleCancelOrder = (order) => {
    const reason = prompt("Masukkan alasan pembatalan & pengembalian dana:", "Pelanggaran kesepakatan / permintaan kedua belah pihak");
    if (reason) {
      adminCancelOrderEscrow?.(order.id, reason);
    }
  };

  const handleApproveWithdrawal = (w) => {
    const ref = transferRefMap[w.id] || `TRF-MANUAL-${Date.now().toString().slice(-6)}`;
    adminMarkWithdrawalSuccess(w.id, ref);
    setTransferRefMap((p) => ({ ...p, [w.id]: "" }));
  };

  const handleRejectWithdrawal = (w) => {
    const reason = rejectReasonMap[w.id] || "Data rekening tidak valid.";
    adminRejectWithdrawal(w.id, reason);
    setRejectReasonMap((p) => ({ ...p, [w.id]: "" }));
  };

  const handleApproveFullRefund = (dep) => {
    const ref = depositRefundRefMap[dep.id] || `DEP-REF-${Date.now().toString().slice(-6)}`;
    adminMarkDepositRefunded(dep.id, ref, { deductionAmount: 0, deductionReason: "" });
    setDepositRefundRefMap((p) => ({ ...p, [dep.id]: "" }));
  };

  const handleApproveDeductedRefund = (dep) => {
    const deduction = Number(deductionAmountMap[dep.id]) || 0;
    const reason = deductionReasonMap[dep.id] || "Potongan ganti rugi kerusakan.";
    if (deduction <= 0) { alert("Masukkan nominal potongan yang valid!"); return; }
    const ref = depositRefundRefMap[dep.id] || `DEP-REF-${Date.now().toString().slice(-6)}`;
    adminMarkDepositRefunded(dep.id, ref, { deductionAmount: deduction, deductionReason: reason });
    setDeductionAmountMap((p) => ({ ...p, [dep.id]: "" }));
    setDeductionReasonMap((p) => ({ ...p, [dep.id]: "" }));
    setDepositRefundRefMap((p) => ({ ...p, [dep.id]: "" }));
  };

  const handleResolveDisputeAction = (report, decisionType) => {
    const note = disputeNotes || (decisionType === "refund_customer" ? "Dana pembayaran direfund 100% ke customer." : decisionType === "release_mitra" ? "Dana diteruskan ke saldo mitra." : "Pembagian dana disesuaikan.");
    resolveDispute(report.id, note, decisionType === "refund_customer");
    setDisputeNotes("");
  };

  const handleCopyCode = (code, id) => {
    navigator.clipboard?.writeText(code);
    setCopiedVoucherId(id);
    addToast("Kode Disalin", `Kode voucher ${code} telah disalin.`);
    setTimeout(() => setCopiedVoucherId(null), 2000);
  };

  const handleToggleVoucher = (v) => {
    adminToggleVoucher(v.id);
    addToast(v.isActive ? "Voucher Dinonaktifkan" : "Voucher Diaktifkan", `Voucher ${v.code} sekarang ${v.isActive ? "nonaktif" : "aktif"}.`);
  };

  const handleDeleteVoucher = (v) => {
    if (confirm(`Yakin ingin menghapus voucher "${v.code}"?`)) {
      adminDeleteVoucher(v.id);
      addToast("Voucher Dihapus", `Voucher ${v.code} berhasil dihapus.`);
    }
  };

  const colorMap = { all: "from-[#1683FF] to-[#0F6FE5]", sewa: "from-violet-500 to-purple-600", jasa: "from-emerald-500 to-teal-600", bantuan: "from-amber-500 to-orange-600" };

  const handleCreateVoucherSubmit = (e) => {
    e.preventDefault();
    if (!newVoucher.code.trim()) { alert("Harap isi kode voucher!"); return; }
    const created = adminAddVoucher({
      code: newVoucher.code.trim().toUpperCase(),
      title: newVoucher.title.trim() || newVoucher.code.trim().toUpperCase(),
      description: newVoucher.description.trim() || "Voucher diskon spesial platform Bantuin.",
      type: newVoucher.type,
      value: Number(newVoucher.value) || 0,
      maxDiscount: Number(newVoucher.maxDiscount) || (newVoucher.type === "fixed" ? Number(newVoucher.value) : 25000),
      minOrder: Number(newVoucher.minOrder) || 0,
      appliesTo: newVoucher.appliesTo,
      targetLocation: newVoucher.targetLocation || "all",
      quota: Number(newVoucher.quota) || 50,
      expiresAt: newVoucher.expiresAt || defaultExpiresAt,
      color: colorMap[newVoucher.appliesTo] || colorMap.all,
    });
    addToast("Voucher Berhasil Dibuat", `Kode ${created.code} ${newVoucher.targetLocation !== "all" ? `(${newVoucher.targetLocation})` : "(Nasional)"} siap digunakan!`);
    setIsCreateVoucherOpen(false);
    setNewVoucher({ code: "", title: "", description: "", type: "percent", value: 15, maxDiscount: 25000, minOrder: 50000, appliesTo: "all", targetLocation: "all", quota: 50, expiresAt: defaultExpiresAt });
  };

  const handleToggleHideListing = (item) => {
    const isHidden = !!hiddenListingIds[item.id];
    setHiddenListingIds((p) => ({ ...p, [item.id]: !isHidden }));
    addToast(isHidden ? "Listing Ditampilkan" : "Listing Disembunyikan", `"${item.title}" ${isHidden ? "tayang kembali" : "disembunyikan"}.`);
  };

  const handleDeleteListing = (item) => {
    if (confirm(`Hapus listing "${item.title}" secara permanen?`)) {
      if (item.type === "sewa" && setRentals) setRentals((p) => p.filter((r) => r.id !== item.id));
      else if (item.type === "jasa" && setServices) setServices((p) => p.filter((s) => s.id !== item.id));
      else if (item.type === "bantuan" && setRequests) setRequests((p) => p.filter((q) => q.id !== item.id));
      addToast("Listing Dihapus", `"${item.title}" telah dihapus.`);
    }
  };

  const handleToggleSuspendUser = (user) => {
    const isSuspended = !!suspendedUserIds[user.id];
    setSuspendedUserIds((p) => ({ ...p, [user.id]: !isSuspended }));
    addToast(isSuspended ? "Akun Dipulihkan" : "Akun Ditangguhkan", `"${user.name}" ${isSuspended ? "aktif kembali" : "ditangguhkan"}.`);
  };

  const handleAddBroadcast = (e) => {
    e.preventDefault();
    if (!newBroadcastForm.title.trim() || !newBroadcastForm.message.trim()) { alert("Lengkapi judul dan isi pengumuman!"); return; }
    const newBc = { id: `bc-${Date.now()}`, ...newBroadcastForm, isActive: true, createdAt: new Date().toISOString().split("T")[0] };
    setBroadcasts((p) => [newBc, ...p]);
    setIsNewBroadcastOpen(false);
    setNewBroadcastForm({ title: "", message: "", type: "info", target: "Semua Pengguna" });
    addToast("Pengumuman Diterbitkan", `"${newBc.title}" kini disiarkan.`);
  };

  const handleToggleBroadcast = (id) => setBroadcasts((p) => p.map((b) => (b.id === id ? { ...b, isActive: !b.isActive } : b)));
  const handleDeleteBroadcast = (id) => { setBroadcasts((p) => p.filter((b) => b.id !== id)); addToast("Pengumuman Dihapus", "Pengumuman telah ditarik."); };

  // ── FILTERED VOUCHERS ────────────────────────────────────────────────────
  const filteredVouchers = useMemo(() => {
    return vouchers.filter((v) => {
      if (voucherCategoryFilter !== "all" && v.appliesTo !== voucherCategoryFilter) return false;
      if (voucherStatusFilter === "active" && !v.isActive) return false;
      if (voucherStatusFilter === "inactive" && v.isActive) return false;
      if (voucherLocationFilter !== "all") {
        const normFilter = voucherLocationFilter.toLowerCase().replace(/^(kota|kabupaten|kab\.)\s+/gi, "").trim();
        const normTarget = (v.targetLocation || "all").toLowerCase().replace(/^(kota|kabupaten|kab\.)\s+/gi, "").trim();
        if (normTarget !== "all" && normTarget !== normFilter && !normTarget.includes(normFilter) && !normFilter.includes(normTarget)) return false;
      }
      if (voucherSearch) {
        const q = voucherSearch.toLowerCase();
        return v.code.toLowerCase().includes(q) || (v.title || "").toLowerCase().includes(q);
      }
      return true;
    });
  }, [vouchers, voucherCategoryFilter, voucherStatusFilter, voucherLocationFilter, voucherSearch]);

  // ── SIDEBAR NAV CONFIG (Strictly Section N) ─────────────────────────────
  const sidebarNavGroups = [
    {
      group: "UTAMA",
      links: [
        { id: "overview", label: "Dashboard", icon: LayoutDashboard, badge: totalUrgentCount > 0 ? totalUrgentCount : undefined, badgeColor: "bg-rose-500" },
      ],
    },
    {
      group: "PENGGUNA & MITRA",
      links: [
        { id: "users", label: "Pengguna", icon: Users, badge: allUsersList.length },
        { id: "providers", label: "Penyedia Jasa", icon: Briefcase, badge: allProvidersList.length },
        { id: "partners", label: "Mitra", icon: Store, badge: allPartnersList.length },
      ],
    },
    {
      group: "TRANSAKSI & KEUANGAN",
      links: [
        { id: "orders", label: "Pesanan", icon: Receipt, badge: filteredOrders.length },
        { id: "finance", label: "Keuangan", icon: Wallet, badge: pendingWithdrawalsCount + pendingRefundsCount, badgeColor: "bg-rose-500" },
      ],
    },
    {
      group: "KEPATUHAN & PENGAWASAN",
      links: [
        { id: "verification", label: "Verifikasi", icon: UserCheck, badge: pendingKycList.length, badgeColor: "bg-[#1683FF]" },
        { id: "disputes", label: "Laporan & Sengketa", icon: AlertTriangle, badge: pendingDisputesCount, badgeColor: "bg-rose-500" },
        { id: "audit", label: "Audit Trail", icon: History },
      ],
    },
    {
      group: "PROMOSI & ETALASE",
      links: [
        { id: "vouchers", label: "Voucher & Promo", icon: Ticket, badge: vouchers.filter((v) => v.isActive).length },
        { id: "promotions", label: "Promosi Landing Page", icon: Rocket, badge: promotionsList.length },
        { id: "broadcasts", label: "Pengumuman", icon: Megaphone },
      ],
    },
    {
      group: "KOMUNIKASI",
      links: [
        { id: "chat", label: "Bantuan & Pesan", icon: MessageSquare, badge: unreadCount, badgeColor: "bg-rose-500" },
      ],
    },
  ];

  const allNavLinks = sidebarNavGroups.flatMap((g) => g.links);

  const pageTitles = {
    overview: "Pusat Antrean & Tindakan Operasional",
    users: "Direktori & Manajemen Pengguna",
    providers: "Manajemen Penyedia Jasa",
    partners: "Manajemen Toko Mitra Rental",
    orders: "Manajemen Pesanan & Transaksi",
    finance: "Pusat Keuangan, Pencairan Saldo & Deposit",
    verification: "Verifikasi Identitas & KYC Mitra",
    disputes: "Laporan & Penyelesaian Sengketa",
    vouchers: "Voucher & Kode Promo Wilayah",
    promotions: "Moderasi Promosi Landing Page",
    broadcasts: "Pengumuman Platform",
    chat: "Bantuan & Pesan Pengguna",
    audit: "Audit Trail & Rekam Jejak Sistem",
    // aliases
    transactions: "Manajemen Pesanan & Transaksi",
    withdrawals: "Pusat Keuangan & Pencairan Saldo",
    deposits: "Deposit Jaminan Sewa",
    kyc: "Verifikasi Identitas & KYC Mitra",
    listings: "Moderasi Listing Etalase",
  };

  // ── SHARED INPUT STYLE ───────────────────────────────────────────────────
  const inputCls = "w-full px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:border-[#1683FF] focus:ring-1 focus:ring-blue-100 bg-white transition";
  const selectCls = "px-3 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 outline-none cursor-pointer focus:border-[#1683FF]";
  const pillActiveCls = "bg-[#1683FF] text-white shadow-sm";
  const pillIdleCls = "bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:text-slate-900";

  return (
    <RoleGuard allowedRoles={["admin"]}>
      <div className="min-h-screen flex flex-col lg:flex-row bg-[#F4F7FB]">

      {/* ── MOBILE TOP NAV ────────────────────────────────────────────────── */}
      <div className="lg:hidden sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center">
              <Image src={logoImg} alt="Bantuin" height={28} className="h-7 w-auto object-contain mix-blend-multiply" />
            </Link>
            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-[#EAF4FF] text-[#1683FF] border border-blue-200 flex items-center gap-1">
              <Shield className="w-3 h-3" /> Admin
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Link href="/" target="_blank" className="text-[11px] font-semibold px-2 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition flex items-center gap-1">
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
            <Link href="/profile" className="text-[11px] font-semibold px-2 py-1.5 rounded-lg bg-blue-50 text-[#1683FF] hover:bg-blue-100 transition flex items-center gap-1">
              <User className="w-3 h-3" />
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-2 overflow-x-auto no-scrollbar border-t border-slate-100 bg-slate-50/50">
          {allNavLinks.map((link) => {
            const Icon = link.icon;
            const isActive = activeMenu === link.id;
            return (
              <button key={link.id} onClick={() => setActiveMenu(link.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer shrink-0 ${isActive ? pillActiveCls : pillIdleCls}`}>
                <Icon className="w-3.5 h-3.5" />
                <span>{link.label}</span>
                {link.badge !== undefined && link.badge > 0 && (
                  <span className={`text-[10px] px-1.5 rounded-full font-bold ${isActive ? "bg-white/20 text-white" : link.badgeColor ? `${link.badgeColor} text-white` : "bg-blue-50 text-[#1683FF]"}`}>{link.badge}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── DESKTOP SIDEBAR ───────────────────────────────────────────────── */}
      <aside className="hidden lg:flex w-64 bg-white border-r border-slate-200 flex-col justify-between p-4 sticky top-0 h-screen overflow-y-auto shrink-0 z-20">
        <div>
          {/* Logo + Badge */}
          <div className="flex items-center justify-between mb-5 pb-4 border-b border-slate-100">
            <Link href="/" className="flex items-center gap-2">
              <Image src={logoImg} alt="Bantuin" height={32} className="h-8 w-auto object-contain mix-blend-multiply" />
            </Link>
            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-[#EAF4FF] text-[#1683FF] border border-blue-200 flex items-center gap-1">
              <Shield className="w-3 h-3" /> Admin
            </span>
          </div>

          {/* Admin Profile Mini */}
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#F5FAFF] border border-[#DCEAF7] mb-5">
            <div className="w-9 h-9 rounded-xl bg-[#1683FF] text-white flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-slate-900 truncate flex items-center gap-1">
                Admin Pusat <CheckCheck className="w-3 h-3 text-[#1683FF]" />
              </div>
              <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                <span>Payment Gateway · Terhubung</span>
              </div>
            </div>
          </div>

          {/* Nav Groups */}
          <nav className="space-y-5">
            {sidebarNavGroups.map((group, gi) => (
              <div key={gi} className="space-y-0.5">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-1.5">{group.group}</div>
                {group.links.map((link) => {
                  const Icon = link.icon;
                  const isActive = activeMenu === link.id;
                  return (
                    <button key={link.id} onClick={() => setActiveMenu(link.id)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${isActive ? "bg-[#1683FF] text-white" : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"}`}>
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-white" : "text-slate-400"}`} />
                        <span className="truncate">{link.label}</span>
                      </div>
                      {link.badge !== undefined && link.badge > 0 && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${isActive ? "bg-white/20 text-white" : link.badgeColor ? `${link.badgeColor} text-white` : "bg-[#EAF4FF] text-[#1683FF]"}`}>{link.badge}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="pt-4 border-t border-slate-100 space-y-0.5">
          <Link href="/" target="_blank" className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-500 hover:text-slate-900 rounded-xl hover:bg-slate-50 transition">
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            <span>Buka Web Publik</span>
          </Link>
          <Link href="/profile" className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-500 hover:text-slate-900 rounded-xl hover:bg-slate-50 transition">
            <User className="w-3.5 h-3.5 text-slate-400" />
            <span>Profil Admin</span>
          </Link>
        </div>
      </aside>

      {/* ── MAIN CONTENT ─────────────────────────────────────────────────── */}
      <main className="flex-1 min-w-0 flex flex-col overflow-y-auto min-h-screen">

        {/* Top Header Bar */}
        <div className="bg-white border-b border-slate-200 px-5 py-4 sticky top-0 z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="text-[11px] text-slate-400 font-medium mb-0.5 flex items-center gap-1">
              <span>Admin Panel</span>
              <ChevronRight className="w-3 h-3" />
              <span className="text-[#1683FF] font-semibold">{pageTitles[activeMenu]}</span>
            </div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900">{pageTitles[activeMenu]}</h1>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Global Location Filter */}
            <div className="flex items-center gap-1.5 bg-[#F5FAFF] border border-[#DCEAF7] rounded-xl px-3 py-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#1683FF] shrink-0" />
              <select
                value={adminLocationFilter}
                onChange={(e) => setAdminLocationFilter(e.target.value)}
                className="text-[11px] font-semibold text-slate-700 bg-transparent outline-none cursor-pointer"
              >
                <option value="all">Semua Wilayah</option>
                {VOUCHER_LOCATIONS.filter((l) => l.id !== "all").map((loc) => (
                  <option key={loc.id} value={loc.id}>{loc.label}</option>
                ))}
              </select>
            </div>

            <span className="text-[11px] font-semibold text-slate-600 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 flex items-center gap-1.5 hidden sm:flex">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Sistem Bayar: Gateway Resmi
            </span>

            <button type="button" onClick={() => addToast("Data Diperbarui", "Seluruh data platform telah disegarkan.")}
              className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition cursor-pointer">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Panels */}
        <div className="p-4 sm:p-5 lg:p-6 space-y-5">

          {/* ─── TAB: OVERVIEW (PUSAT ANTREAN & TINDAKAN) ─────────────────── */}
          {activeMenu === "overview" && (
            <div className="space-y-5 animate-in fade-in duration-150">
              {/* Status Bar Operasional Ringkas (Actionable Counters) */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {[
                  { id: "withdrawals", label: "Pencairan Mitra", count: pendingWithdrawalsCount, unit: "menunggu transfer", color: "text-rose-600 bg-rose-50 border-rose-200", icon: Wallet },
                  { id: "disputes", label: "Sengketa Terbuka", count: pendingDisputesCount, unit: "butuh mediasi", color: "text-amber-700 bg-amber-50 border-amber-200", icon: AlertTriangle },
                  { id: "kyc", label: "Antrean KYC", count: pendingKycList.length, unit: "verifikasi data", color: "text-[#1683FF] bg-blue-50 border-blue-200", icon: UserCheck },
                  { id: "deposits", label: "Deposit Sewa", count: pendingRefundsCount, unit: "siap refund", color: "text-purple-700 bg-purple-50 border-purple-200", icon: DollarSign },
                  { id: "chat", label: "Pesan Masuk", count: unreadCount, unit: "belum dibalas", color: "text-emerald-700 bg-emerald-50 border-emerald-200", icon: MessageSquare },
                  { id: "transactions", label: "Dana Tertahan Sementara", count: formatIDR(totalPendingPaymentHeld), unit: "koleksi gateway", color: "text-slate-800 bg-slate-50 border-slate-200", isPrice: true, icon: Lock },
                ].map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setActiveMenu(item.id)}
                      className="p-3.5 rounded-2xl border text-left transition cursor-pointer hover:shadow-xs hover:border-[#1683FF] bg-white flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">{item.label}</span>
                        <span className={`p-1.5 rounded-lg ${item.color.split(" ")[1]} ${item.color.split(" ")[0]}`}>
                          <Icon className="w-3.5 h-3.5" />
                        </span>
                      </div>
                      <div>
                        <div className={`font-black text-slate-900 ${item.isPrice ? "text-sm font-mono truncate" : "text-2xl"}`}>
                          {item.count}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{item.unit}</div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Section: Antrean Butuh Tindakan Admin Segera */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-[#FBFDFF]">
                  <div>
                    <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                      <LayoutDashboard className="w-4 h-4 text-[#1683FF]" /> Antrean Tindakan Operasional Hari Ini
                    </h2>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Fokus pada tugas yang memerlukan eksekusi manual, persetujuan identitas, atau keputusan admin.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {totalUrgentCount > 0 ? (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                        {totalUrgentCount} Tugas Menunggu Tindakan
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Semua Operasional Terkendali
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-4 sm:p-5 space-y-4">
                  {/* Antrean 1: Pencairan Mitra */}
                  {pendingWithdrawalsCount > 0 && (
                    <div className="rounded-xl border border-rose-200/80 bg-rose-50/20 p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-rose-500" />
                          <h3 className="font-bold text-xs text-slate-900">Pencairan Saldo Mitra Menunggu Transfer ({pendingWithdrawalsCount})</h3>
                        </div>
                        <button onClick={() => setActiveMenu("withdrawals")} className="text-[11px] text-[#1683FF] hover:underline font-semibold flex items-center gap-1 cursor-pointer">
                          Buka Tab Pencairan <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="space-y-2">
                        {withdrawals.filter((w) => w.status === "PENDING").map((w) => (
                          <div key={w.id} className="p-3 bg-white rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900 text-xs">{w.mitraName}</span>
                                <span className="text-[10px] font-mono text-slate-400">#{w.id}</span>
                              </div>
                              <div className="text-[11px] text-slate-500 mt-0.5">
                                Bank: <strong className="text-slate-800">{w.bankName}</strong> ({w.accountNumber}) · a.n <strong>{w.accountHolder}</strong>
                              </div>
                              <div className="text-xs font-black text-rose-600 font-mono mt-1">
                                Pencairan Bersih: {formatIDR(w.amount)}
                                <span className="text-[10px] text-slate-400 font-normal ml-1.5">(Fee transfer ditanggung platform)</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <input
                                type="text"
                                placeholder="No. Ref Transfer..."
                                value={transferRefMap[w.id] || ""}
                                onChange={(e) => setTransferRefMap({ ...transferRefMap, [w.id]: e.target.value })}
                                className="px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 outline-none focus:border-[#1683FF] font-mono w-36 bg-slate-50"
                              />
                              <button
                                type="button"
                                onClick={() => handleApproveWithdrawal(w)}
                                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition flex items-center gap-1 cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5" /> Transfer Sukses
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRejectWithdrawal(w)}
                                className="px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold text-xs rounded-xl border border-rose-200 transition cursor-pointer"
                              >
                                Tolak
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Antrean 2: Sengketa & Laporan */}
                  {pendingDisputesCount > 0 && (
                    <div className="rounded-xl border border-amber-200/80 bg-amber-50/20 p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-amber-500" />
                          <h3 className="font-bold text-xs text-slate-900">Laporan & Sengketa Terbuka ({pendingDisputesCount})</h3>
                        </div>
                        <button onClick={() => setActiveMenu("disputes")} className="text-[11px] text-[#1683FF] hover:underline font-semibold flex items-center gap-1 cursor-pointer">
                          Buka Tab Sengketa <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="space-y-2">
                        {reports.filter((r) => r.status === "pending" || r.status === "OPEN" || r.status === "UNDER_REVIEW").map((rep) => (
                          <div key={rep.id} className="p-3 bg-white rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-[10px] font-bold text-slate-400">#{rep.id}</span>
                                <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100">
                                  {rep.category || rep.reason || rep.type || "Pelanggaran"}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-600 mt-1 line-clamp-1">
                                {rep.description || "Tidak ada rincian tambahan"}
                              </div>
                              <div className="text-[10px] text-slate-400 mt-0.5">
                                Pelapor: <strong className="text-slate-700">{rep.reporterName || rep.reporter || "Pengguna"}</strong> · Terlapor: <strong className="text-slate-700">{rep.reportedName || rep.target || "Mitra"}</strong>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={() => { setSelectedReportId(rep.id); setActiveMenu("disputes"); }}
                                className="px-3.5 py-1.5 bg-[#1683FF] hover:bg-[#0F6FE5] text-white font-bold text-xs rounded-xl transition cursor-pointer"
                              >
                                Buka & Mediasi
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Antrean 3: Antrean KYC Mitra */}
                  {pendingKycList.length > 0 && (
                    <div className="rounded-xl border border-blue-200/80 bg-blue-50/20 p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-[#1683FF]" />
                          <h3 className="font-bold text-xs text-slate-900">Verifikasi Identitas KYC Mitra ({pendingKycList.length})</h3>
                        </div>
                        <button onClick={() => setActiveMenu("kyc")} className="text-[11px] text-[#1683FF] hover:underline font-semibold flex items-center gap-1 cursor-pointer">
                          Buka Tab KYC <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="space-y-2">
                        {pendingKycList.map((mitra) => (
                          <div key={mitra.id} className="p-3 bg-white rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                            <div className="flex items-center gap-3">
                              <img src={mitra.avatar || "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80"} alt="" className="w-9 h-9 rounded-xl object-cover border border-slate-200" />
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-xs text-slate-900">{mitra.name}</span>
                                  <span className="text-[10px] text-slate-400 font-mono">NIK: {mitra.nik}</span>
                                </div>
                                <div className="text-[11px] text-slate-500 mt-0.5">{mitra.role} · {mitra.city}</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              {mitra.idCardUrl && (
                                <button
                                  type="button"
                                  onClick={() => setPreviewImageUrl(mitra.idCardUrl)}
                                  className="px-2.5 py-1 text-xs rounded-xl border border-slate-200 hover:border-[#1683FF] text-slate-600 transition flex items-center gap-1 cursor-pointer"
                                >
                                  <Eye className="w-3 h-3 text-[#1683FF]" /> Lihat KTP
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => {
                                  adminVerifyUser?.(mitra.id, true);
                                  addToast("KYC Disetujui", `${mitra.name} telah diverifikasi.`);
                                }}
                                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition flex items-center gap-1 cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5" /> Setujui
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Antrean 4: Deposit Sewa */}
                  {pendingRefundsCount > 0 && (
                    <div className="rounded-xl border border-purple-200/80 bg-purple-50/20 p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-purple-500" />
                          <h3 className="font-bold text-xs text-slate-900">Pengembalian Deposit Jaminan Sewa ({pendingRefundsCount})</h3>
                        </div>
                        <button onClick={() => setActiveMenu("deposits")} className="text-[11px] text-[#1683FF] hover:underline font-semibold flex items-center gap-1 cursor-pointer">
                          Buka Tab Deposit <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="space-y-2">
                        {customerDeposits.filter((d) => d.status !== "REFUNDED").map((dep) => (
                          <div key={dep.id} className="p-3 bg-white rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                            <div>
                              <div className="font-bold text-xs text-slate-900">{dep.rentalTitle}</div>
                              <div className="text-[11px] text-slate-500 mt-0.5">
                                Penyewa: <strong>{dep.customerAccountHolder}</strong> ({dep.customerBank} {dep.customerAccountNumber})
                              </div>
                              <div className="text-xs font-black text-purple-700 font-mono mt-1">
                                Uang Jaminan: {formatIDR(dep.depositAmount)}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleApproveFullRefund(dep)}
                                className="px-3.5 py-1.5 bg-[#1683FF] hover:bg-[#0F6FE5] text-white font-bold text-xs rounded-xl transition cursor-pointer"
                              >
                                Refund 100%
                              </button>
                              <button
                                type="button"
                                onClick={() => setActiveMenu("deposits")}
                                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition cursor-pointer"
                              >
                                Periksa Potongan
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Antrean 5: Chat Pesan User Belum Dibalas */}
                  {unreadCount > 0 && (
                    <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/20 p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          <h3 className="font-bold text-xs text-slate-900">Pesan Pengguna Belum Dibalas ({unreadCount})</h3>
                        </div>
                        <button onClick={() => setActiveMenu("chat")} className="text-[11px] text-[#1683FF] hover:underline font-semibold flex items-center gap-1 cursor-pointer">
                          Buka Inbox Chat <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="space-y-2">
                        {inboxThreads.filter((t) => t.unread).map((thread) => (
                          <div key={thread.id} className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between gap-3 shadow-xs">
                            <div className="flex items-center gap-3 min-w-0">
                              <img src={thread.userAvatar} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
                              <div className="min-w-0">
                                <div className="font-bold text-xs text-slate-900 truncate">{thread.userName} ({thread.location})</div>
                                <div className="text-[11px] text-slate-500 truncate mt-0.5">{thread.lastMessage}</div>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => { handleSelectThread(thread.id); setActiveMenu("chat"); }}
                              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition shrink-0 cursor-pointer"
                            >
                              Balas Pesan
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Jika Semua Antrean Kosong */}
                  {totalUrgentCount === 0 && (
                    <div className="text-center py-12 px-4 rounded-2xl bg-emerald-50/50 border border-emerald-100">
                      <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center mb-3">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <h3 className="text-sm font-bold text-slate-900">Seluruh Antrean Operasional Telah Selesai!</h3>
                      <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                        Tidak ada pencairan tertunda, sengketa terbuka, KYC menunggu, atau pengembalian deposit yang belum ditangani.
                      </p>
                      <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
                        <button onClick={() => setActiveMenu("transactions")} className="px-3.5 py-1.5 bg-white border border-slate-200 hover:border-[#1683FF] text-xs font-semibold text-slate-700 rounded-xl transition cursor-pointer">
                          Cek Transaksi Aktif
                        </button>
                        <button onClick={() => setActiveMenu("vouchers")} className="px-3.5 py-1.5 bg-white border border-slate-200 hover:border-[#1683FF] text-xs font-semibold text-slate-700 rounded-xl transition cursor-pointer">
                          Kelola Voucher Wilayah
                        </button>
                        <button onClick={() => setActiveMenu("listings")} className="px-3.5 py-1.5 bg-white border border-slate-200 hover:border-[#1683FF] text-xs font-semibold text-slate-700 rounded-xl transition cursor-pointer">
                          Moderasi Etalase
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ─── TAB: TRANSAKSI & PESANAN (SEKSI N) ───────────────────────── */}
          {(activeMenu === "transactions" || activeMenu === "orders") && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Filter Toolbar */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                  <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1 shrink-0"><Filter className="w-3.5 h-3.5" /> Layanan:</span>
                  {[{ id: "all", label: "Semua" }, { id: "service", label: "Jasa" }, { id: "rental", label: "Sewa" }, { id: "task", label: "Bantuan" }].map((f) => (
                    <button key={f.id} onClick={() => setTransactionFilter(f.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition shrink-0 cursor-pointer ${transactionFilter === f.id ? pillActiveCls : pillIdleCls}`}>
                      {f.label}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <select value={transactionStatusFilter} onChange={(e) => setTransactionStatusFilter(e.target.value)} className={selectCls}>
                    <option value="all">Semua Status</option>
                    <option value="completed">Selesai</option>
                    <option value="paid_escrow">Pembayaran Terkonfirmasi</option>
                    <option value="in_progress">Pengerjaan</option>
                    <option value="dispute">Disengketakan</option>
                  </select>
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="text" placeholder="Cari ID, Mitra, Customer..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-[#1683FF] outline-none w-56" />
                  </div>
                </div>
              </div>

              {/* Transactions Table */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs min-w-[900px]">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="py-3 px-4">ID & Layanan</th>
                        <th className="py-3 px-4">Pihak Transaksi</th>
                        <th className="py-3 px-4 text-right">Nilai Kotor</th>
                        <th className="py-3 px-4 text-right">Fee 8%</th>
                        <th className="py-3 px-4 text-right">Hak Mitra</th>
                        <th className="py-3 px-4 text-right">Deposit</th>
                        <th className="py-3 px-4 text-center">Status Pembayaran</th>
                        <th className="py-3 px-4 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredOrders.map((order) => {
                        const total = Number(order.totalAmount || order.price || 0);
                        const isRental = order.orderType === "rental";
                        const deposit = isRental ? Number(order.depositFee || order.rentalDetails?.depositFee || 0) : 0;
                        const netOrderFee = total - deposit;
                        const platformFee = Math.round(netOrderFee * 0.08);
                        const mitraNet = netOrderFee - platformFee;
                        const isFrozen = !!frozenOrderIds[order.id];
                        return (
                          <tr key={order.id} className="hover:bg-[#F5FAFF] transition">
                            <td className="py-3 px-4">
                              <span className="font-mono text-[11px] font-bold text-slate-900 block">#{order.id}</span>
                              <span className="text-[11px] text-slate-500 line-clamp-1">{order.requestTitle || "Transaksi Layanan"}</span>
                              <span className={`inline-block text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-md mt-1 ${isRental ? "bg-purple-50 text-purple-700" : order.orderType === "service" ? "bg-emerald-50 text-emerald-700" : "bg-blue-50 text-[#1683FF]"}`}>
                                {isRental ? "Sewa" : order.orderType === "service" ? "Jasa" : "Bantuan"}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-[11px]">
                              <div><span className="text-slate-400">Pembeli:</span> <strong className="text-slate-800">{order.requester?.name || "Customer"}</strong></div>
                              <div className="mt-0.5"><span className="text-slate-400">Mitra:</span> <strong className="text-slate-800">{order.helper?.name || "Mitra Bantuin"}</strong></div>
                            </td>
                            <td className="py-3 px-4 text-right font-bold text-slate-900 font-mono">{formatIDR(total)}</td>
                            <td className="py-3 px-4 text-right text-slate-500 font-mono">{formatIDR(platformFee)}</td>
                            <td className="py-3 px-4 text-right font-bold text-emerald-600 font-mono">{formatIDR(mitraNet)}</td>
                            <td className="py-3 px-4 text-right font-mono text-purple-700">{deposit > 0 ? formatIDR(deposit) : "-"}</td>
                            <td className="py-3 px-4 text-center">
                              {isFrozen ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">Dibekukan</span>
                              ) : (
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${order.stage === "completed" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : order.stage === "paid_escrow" ? "bg-blue-50 text-[#1683FF] border-blue-200" : "bg-slate-100 text-slate-700 border-slate-200"}`}>
                                  {order.stage === "completed" ? "Selesai" : order.stage === "paid_escrow" ? "Pembayaran Terkonfirmasi" : order.stage || "Diproses"}
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <button type="button" onClick={() => setSelectedOrderForDetail(order)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition cursor-pointer" title="Detail"><Eye className="w-3.5 h-3.5" /></button>
                                {order.stage !== "completed" && order.stage !== "cancelled" && (
                                  <>
                                    <button type="button" onClick={() => handleForceCompleteOrder(order)} className="px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold transition text-[10px] flex items-center gap-0.5 cursor-pointer" title="Lepas hak bayar ke mitra">
                                      <Check className="w-3 h-3" /> Rilis
                                    </button>
                                    <button type="button" onClick={() => handleCancelOrder(order)} className="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold transition text-[10px] flex items-center gap-0.5 cursor-pointer" title="Batalkan & refund pembayaran ke customer">
                                      <X className="w-3 h-3" /> Batal & Refund
                                    </button>
                                  </>
                                )}
                                <button type="button" onClick={() => handleToggleFreezeOrder(order)} className={`px-2 py-1 rounded-lg text-[10px] font-bold transition flex items-center gap-0.5 cursor-pointer ${isFrozen ? "bg-blue-50 text-[#1683FF] hover:bg-blue-100" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}>
                                  <Lock className="w-3 h-3" /> {isFrozen ? "Bebas" : "Beku"}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ─── TAB: FINANCE SUB-NAV (SEKSI N, 25) ────────────────────────── */}
          {activeMenu === "finance" && (
            <div className="bg-white rounded-2xl border border-slate-200 p-3 sm:p-4 shadow-xs flex items-center gap-2 overflow-x-auto">
              <button
                type="button"
                onClick={() => setFinanceTab("withdrawals")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                  financeTab === "withdrawals" ? "bg-[#1683FF] text-white shadow-xs" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Penarikan Hak Bayar ({pendingWithdrawalsCount})
              </button>
              <button
                type="button"
                onClick={() => setFinanceTab("payouts")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                  financeTab === "payouts" ? "bg-[#1683FF] text-white shadow-xs" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Antrean Payout Mitra ({adminPayouts.filter(p => p.status === 'pending').length})
              </button>
              <button
                type="button"
                onClick={() => setFinanceTab("refunds")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                  financeTab === "refunds" ? "bg-[#1683FF] text-white shadow-xs" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Antrean Refund Pelanggan ({adminRefunds.filter(r => r.status === 'pending').length})
              </button>
              <button
                type="button"
                onClick={() => setFinanceTab("deposits")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                  financeTab === "deposits" ? "bg-[#1683FF] text-white shadow-xs" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Deposit Jaminan Sewa ({pendingRefundsCount})
              </button>
            </div>
          )}

          {/* ─── TAB: WITHDRAWALS & PENCAIRAN ─────────────────────────────────── */}
          {(activeMenu === "withdrawals" || (activeMenu === "finance" && financeTab === "withdrawals")) && (
            <div className="animate-in fade-in duration-150">
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-100">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2"><Wallet className="w-4 h-4 text-[#1683FF]" /> Antrean Penarikan Dana Mitra</h3>
                    <p className="text-[11px] text-slate-400 mt-1">Admin transfer via m-Banking lalu catat nomor referensi. Biaya transfer ditanggung platform.</p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 shrink-0">{pendingWithdrawalsCount} Menunggu Transfer</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs min-w-[800px]">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="py-3 px-3">ID Pengajuan</th>
                        <th className="py-3 px-3">Mitra Pemohon</th>
                        <th className="py-3 px-3">Bank & Rekening</th>
                        <th className="py-3 px-3 text-right">Nominal</th>
                        <th className="py-3 px-3 text-center">Status</th>
                        <th className="py-3 px-3">Aksi Admin</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {withdrawals.map((w) => (
                        <tr key={w.id} className="hover:bg-[#F5FAFF]">
                          <td className="py-3 px-3 font-mono font-bold text-slate-900">{w.id}<span className="text-[10px] text-slate-400 block font-normal">{formatDateTimeIndo(w.requestedAt)}</span></td>
                          <td className="py-3 px-3 font-semibold text-slate-900">{w.mitraName}<span className="text-[10px] text-slate-400 block">ID: {w.mitraId}</span></td>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900">{w.bankName} - {w.accountNumber}</span>
                              {w.accountNumber && (
                                <button
                                  type="button"
                                  title="Salin Nomor Rekening Mitra"
                                  onClick={() => {
                                    navigator.clipboard?.writeText(w.accountNumber);
                                    addToast?.("No. Rekening Disalin", `Nomor rekening ${w.bankName} ${w.accountNumber} telah disalin ke clipboard.`);
                                  }}
                                  className="p-1 rounded hover:bg-blue-50 text-slate-400 hover:text-[#1683FF] transition cursor-pointer"
                                >
                                  <Copy className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-400 block">a.n. {w.accountHolder}</span>
                          </td>
                          <td className="py-3 px-3 text-right font-black text-slate-900 font-mono text-sm">{formatIDR(w.amount)}</td>
                          <td className="py-3 px-3 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${w.status === "SUCCESS" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : w.status === "PENDING" ? "bg-rose-50 text-rose-700 border-rose-200 animate-pulse" : "bg-slate-100 text-slate-600 border-slate-200"}`}>
                              {w.status === "SUCCESS" ? "Berhasil" : w.status === "PENDING" ? "Menunggu Admin" : "Ditolak"}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            {w.status === "PENDING" ? (
                              <div className="space-y-1.5 max-w-xs">
                                <div className="flex items-center gap-1.5">
                                  <input type="text" placeholder="No. Ref Transfer" value={transferRefMap[w.id] || ""} onChange={(e) => setTransferRefMap({ ...transferRefMap, [w.id]: e.target.value })} className="px-2 py-1 text-[11px] rounded-lg border border-slate-200 focus:border-[#1683FF] outline-none flex-1 font-mono" />
                                  <button type="button" onClick={() => handleApproveWithdrawal(w)} className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition shrink-0">Kirim</button>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <input type="text" placeholder="Alasan penolakan..." value={rejectReasonMap[w.id] || ""} onChange={(e) => setRejectReasonMap({ ...rejectReasonMap, [w.id]: e.target.value })} className="px-2 py-1 text-[11px] rounded-lg border border-slate-200 outline-none flex-1" />
                                  <button type="button" onClick={() => handleRejectWithdrawal(w)} className="px-2 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold text-xs rounded-lg transition shrink-0">Tolak</button>
                                </div>
                              </div>
                            ) : (
                              <span className="text-[11px] text-slate-400 font-mono">Selesai ({formatDateIndo(w.processedAt || w.requestedAt)})</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ─── TAB: DEPOSITS & JAMINAN SEWA ─────────────────────────────── */}
          {(activeMenu === "deposits" || (activeMenu === "finance" && financeTab === "deposits")) && (
            <div className="animate-in fade-in duration-150">
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-100">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2"><DollarSign className="w-4 h-4 text-[#1683FF]" /> Pengembalian Deposit Jaminan Sewa</h3>
                    <p className="text-[11px] text-slate-400 mt-1">Deposit titipan proteksi unit. Refund 100% jika unit kembali utuh. Jika ada kerusakan, masukkan potongan.</p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 shrink-0">{pendingRefundsCount} Siap Diproses</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs min-w-[850px]">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="py-3 px-3">ID Deposit & Unit</th>
                        <th className="py-3 px-3">Penyewa (Penerima Refund)</th>
                        <th className="py-3 px-3 text-right">Uang Jaminan</th>
                        <th className="py-3 px-3 text-center">Status</th>
                        <th className="py-3 px-3">Aksi Refund Admin</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {customerDeposits.map((dep) => (
                        <tr key={dep.id} className="hover:bg-[#F5FAFF]">
                          <td className="py-3 px-3"><span className="font-mono font-bold text-slate-900 block">{dep.id}</span><span className="text-[11px] text-slate-600 font-semibold block">{dep.rentalTitle}</span></td>
                          <td className="py-3 px-3">
                            <strong className="text-slate-900 block">{dep.customerAccountHolder}</strong>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[11px] text-slate-700 font-mono font-bold">{dep.customerBank} - {dep.customerAccountNumber}</span>
                              {dep.customerAccountNumber && (
                                <button
                                  type="button"
                                  title="Salin Nomor Rekening Deposit"
                                  onClick={() => {
                                    navigator.clipboard?.writeText(dep.customerAccountNumber);
                                    addToast?.("No. Rekening Disalin", `Nomor rekening ${dep.customerBank} ${dep.customerAccountNumber} telah disalin.`);
                                  }}
                                  className="p-1 rounded hover:bg-blue-50 text-slate-400 hover:text-[#1683FF] transition cursor-pointer"
                                >
                                  <Copy className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-3 text-right font-black text-slate-900 font-mono text-sm">{formatIDR(dep.depositAmount)}</td>
                          <td className="py-3 px-3 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${dep.status === "REFUNDED" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : dep.status === "REFUND_PENDING" ? "bg-amber-50 text-amber-800 border-amber-200" : "bg-blue-50 text-[#1683FF] border-blue-200"}`}>
                              {dep.status === "REFUNDED" ? "Sudah Dikembalikan" : dep.status === "REFUND_PENDING" ? "Siap Transfer" : "Menunggu Unit"}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            {dep.status !== "REFUNDED" ? (
                              <div className="space-y-1.5 max-w-sm">
                                {dep.status === "HELD" && (
                                  <div className="mb-1.5 flex items-center justify-between p-1.5 bg-blue-50/70 rounded-lg border border-blue-100">
                                    <span className="text-[10px] text-blue-700 font-medium">Unit belum dikonfirmasi kembali</span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        adminMarkItemReturned?.(dep.rentalOrderId || dep.id);
                                        addToast?.("Unit Kembali", `Unit ${dep.rentalTitle} ditandai telah kembali.`);
                                      }}
                                      className="px-2 py-0.5 text-[10px] font-bold rounded bg-[#1683FF] hover:bg-[#0F6FE5] text-white transition cursor-pointer"
                                    >
                                      Tandai Kembali
                                    </button>
                                  </div>
                                )}
                                <div className="flex items-center gap-1.5">
                                  <input type="text" placeholder="No. Ref Refund" value={depositRefundRefMap[dep.id] || ""} onChange={(e) => setDepositRefundRefMap({ ...depositRefundRefMap, [dep.id]: e.target.value })} className="px-2 py-1 text-[11px] rounded-lg border border-slate-200 focus:border-[#1683FF] outline-none flex-1 font-mono" />
                                  <button type="button" onClick={() => handleApproveFullRefund(dep)} className="px-3 py-1 bg-[#1683FF] hover:bg-[#0F6FE5] text-white font-bold text-xs rounded-lg transition shrink-0">Refund 100%</button>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <input type="number" placeholder="Potongan (Rp)" value={deductionAmountMap[dep.id] || ""} onChange={(e) => setDeductionAmountMap({ ...deductionAmountMap, [dep.id]: e.target.value })} className="w-28 px-2 py-1 text-[11px] rounded-lg border border-slate-200 outline-none font-mono" />
                                  <input type="text" placeholder="Alasan kerusakan..." value={deductionReasonMap[dep.id] || ""} onChange={(e) => setDeductionReasonMap({ ...deductionReasonMap, [dep.id]: e.target.value })} className="px-2 py-1 text-[11px] rounded-lg border border-slate-200 outline-none flex-1" />
                                  <button type="button" onClick={() => handleApproveDeductedRefund(dep)} className="px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg transition shrink-0">Potong</button>
                                </div>
                              </div>
                            ) : (
                              <span className="text-[11px] text-emerald-600 font-semibold">✓ Refund Selesai ({formatDateIndo(dep.refundedAt)})</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ─── TAB: PAYOUTS (MANUAL TRANSFER DARI ADMIN KE MITRA/PROVIDER) ── */}
          {activeMenu === "finance" && financeTab === "payouts" && (
            <div className="animate-in fade-in duration-150">
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-100">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                      <Wallet className="w-4 h-4 text-[#1683FF]" /> Antrean Payout Manual Mitra &amp; Penyedia Jasa
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Penyaluran hak bayar bersih setelah pesanan selesai. Admin mentransfer manual via bank lalu menginput nomor referensi transfer.
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-[#1683FF] border border-blue-200 shrink-0">
                    {adminPayouts.filter(p => p.status === 'pending').length} Menunggu Penyaluran
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs min-w-[850px]">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="py-3 px-3">ID Payout &amp; Order</th>
                        <th className="py-3 px-3">Penerima (Mitra / Provider)</th>
                        <th className="py-3 px-3">Rekening Tujuan</th>
                        <th className="py-3 px-3 text-right">Rincian Finansial</th>
                        <th className="py-3 px-3 text-center">Status</th>
                        <th className="py-3 px-3">Aksi Transfer Manual</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {adminPayouts.map((py) => {
                        const isPending = py.status === "pending";
                        return (
                          <tr key={py.id} className="hover:bg-[#F5FAFF]">
                            <td className="py-3 px-3">
                              <span className="font-mono font-bold text-slate-900 block">{py.id}</span>
                              <span className="text-[10px] text-slate-400 block font-normal">Order: #{py.orderId}</span>
                            </td>
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-1.5">
                                <span className={`px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase ${
                                  py.recipientType === "partner" ? "bg-purple-50 text-purple-700" : "bg-blue-50 text-blue-700"
                                }`}>
                                  {py.recipientType === "partner" ? "Mitra Sewa" : "Penyedia Jasa"}
                                </span>
                              </div>
                              <span className="font-bold text-slate-900 block mt-0.5">{py.accountHolder}</span>
                            </td>
                            <td className="py-3 px-3">
                              <span className="font-bold text-slate-900 block">{py.bankName}</span>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[11px] text-slate-700 font-mono font-bold">{py.accountNumber || py.accountNumberMasked}</span>
                                {(py.accountNumber || py.accountNumberMasked) && (
                                  <button
                                    type="button"
                                    title="Salin Nomor Rekening Lengkap"
                                    onClick={() => {
                                      const numToCopy = py.accountNumber || py.accountNumberMasked.replace(/[^0-9]/g, "");
                                      navigator.clipboard?.writeText(numToCopy || py.accountNumber);
                                      addToast?.("No. Rekening Disalin", `Nomor rekening ${py.bankName} ${py.accountNumber || numToCopy} telah disalin.`);
                                    }}
                                    className="p-1 rounded hover:bg-blue-50 text-slate-400 hover:text-[#1683FF] transition cursor-pointer"
                                  >
                                    <Copy className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-3 text-right font-mono">
                              <div className="text-slate-400 text-[10px]">Bruto: {formatIDR(py.grossAmount)}</div>
                              <div className="text-rose-500 text-[10px]">Platform Fee: -{formatIDR(py.platformFee)}</div>
                              <div className="font-black text-emerald-700 text-xs mt-0.5">Net: {formatIDR(py.netAmount)}</div>
                            </td>
                            <td className="py-3 px-3 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                py.status === "completed"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : "bg-amber-50 text-amber-800 border-amber-200"
                              }`}>
                                {py.status === "completed" ? "Tersalurkan" : "Menunggu Transfer"}
                              </span>
                            </td>
                            <td className="py-3 px-3">
                              {isPending ? (
                                <div className="flex items-center gap-1.5">
                                  <input
                                    type="text"
                                    placeholder="No. Ref Transfer Bank..."
                                    value={payoutRefInput[py.id] || ""}
                                    onChange={(e) => setPayoutRefInput({ ...payoutRefInput, [py.id]: e.target.value })}
                                    className="px-2 py-1 text-[11px] rounded-lg border border-slate-200 focus:border-[#1683FF] outline-none flex-1 font-mono"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleProcessPayout(py.id)}
                                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition shrink-0 cursor-pointer"
                                  >
                                    Konfirmasi Transfer
                                  </button>
                                </div>
                              ) : (
                                <div className="text-[11px] text-slate-500">
                                  <span className="font-mono text-emerald-700 font-bold block">Ref: {py.transferReference}</span>
                                  <span>Diproses oleh {py.processedBy}</span>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ─── TAB: REFUNDS (PENGEMBALIAN DANA KE CUSTOMER) ────────────────── */}
          {activeMenu === "finance" && financeTab === "refunds" && (
            <div className="animate-in fade-in duration-150">
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-100">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                      <Receipt className="w-4 h-4 text-rose-500" /> Antrean Refund Pembayaran Pelanggan
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Pengembalian dana akibat pembatalan pesanan yang sah atau hasil keputusan mediasi sengketa oleh admin.
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 shrink-0">
                    {adminRefunds.filter(r => r.status === 'pending').length} Menunggu Refund
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs min-w-[850px]">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="py-3 px-3">ID Refund &amp; Order</th>
                        <th className="py-3 px-3">Pelanggan Pemohon</th>
                        <th className="py-3 px-3">Alasan Pengembalian</th>
                        <th className="py-3 px-3 text-right">Nominal Refund</th>
                        <th className="py-3 px-3 text-center">Status</th>
                        <th className="py-3 px-3">Aksi Refund Admin</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {adminRefunds.map((rf) => {
                        const isPending = rf.status === "pending";
                        return (
                          <tr key={rf.id} className="hover:bg-[#F5FAFF]">
                            <td className="py-3 px-3">
                              <span className="font-mono font-bold text-slate-900 block">{rf.id}</span>
                              <span className="text-[10px] text-slate-400 block font-normal">Order: #{rf.orderId}</span>
                            </td>
                            <td className="py-3 px-3">
                              <strong className="text-slate-900 block">{rf.userName || `ID: ${rf.userId}`}</strong>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[11px] text-slate-700 font-mono font-bold">{rf.accountNumber ? `${rf.bankName || "BCA"} ${rf.accountNumber}` : rf.accountMasked}</span>
                                {rf.accountNumber && (
                                  <button
                                    type="button"
                                    title="Salin Nomor Rekening Refund"
                                    onClick={() => {
                                      navigator.clipboard?.writeText(rf.accountNumber);
                                      addToast?.("No. Rekening Disalin", `Nomor rekening ${rf.bankName || "Bank"} ${rf.accountNumber} telah disalin.`);
                                    }}
                                    className="p-1 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                                  >
                                    <Copy className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-3 max-w-xs">
                              <span className="text-xs text-slate-700 block leading-tight">{rf.reason}</span>
                              <span className="text-[10px] text-slate-400 mt-0.5 block">Metode: Transfer Manual Bank / E-Wallet</span>
                            </td>
                            <td className="py-3 px-3 text-right font-black text-slate-900 font-mono text-sm">
                              {formatIDR(rf.amount)}
                            </td>
                            <td className="py-3 px-3 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                rf.status === "completed"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : "bg-rose-50 text-rose-700 border-rose-200"
                              }`}>
                                {rf.status === "completed" ? "Telah Ditransfer" : "Menunggu Transfer"}
                              </span>
                            </td>
                            <td className="py-3 px-3">
                              {isPending ? (
                                <div className="flex items-center gap-1.5">
                                  <input
                                    type="text"
                                    placeholder="No. Ref Transfer Refund..."
                                    value={refundRefInput[rf.id] || ""}
                                    onChange={(e) => setRefundRefInput({ ...refundRefInput, [rf.id]: e.target.value })}
                                    className="px-2 py-1 text-[11px] rounded-lg border border-slate-200 focus:border-[#1683FF] outline-none flex-1 font-mono"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleProcessRefund(rf.id)}
                                    className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg transition shrink-0 cursor-pointer"
                                  >
                                    Kirim Refund
                                  </button>
                                </div>
                              ) : (
                                <div className="text-[11px] text-slate-500">
                                  <span className="font-mono text-emerald-700 font-bold block">Ref: {rf.transferReference}</span>
                                  <span>Diproses oleh {rf.processedBy}</span>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ─── TAB: DISPUTES ─────────────────────────────────────────────── */}
          {activeMenu === "disputes" && (
            <div className="animate-in fade-in duration-150">
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-500" /> Pusat Resolusi Laporan &amp; Sengketa
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">Penanganan laporan kendala pengerjaan, disintermediasi (bypass platform), dan mediasi dana pesanan.</p>
                  </div>
                  <span className="text-xs font-semibold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
                    {reports.length} Total Laporan
                  </span>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                  <div className="space-y-2">
                    {reports.map((rep) => {
                      const isPending = rep.status === "pending" || rep.status === "OPEN" || rep.status === "UNDER_REVIEW";
                      return (
                        <div
                          key={rep.id}
                          onClick={() => setSelectedReportId(rep.id)}
                          className={`p-3.5 rounded-xl border transition cursor-pointer text-xs group relative ${selectedReportId === rep.id ? "border-[#1683FF] bg-blue-50/40 ring-1 ring-[#1683FF]/30" : "border-slate-200 hover:border-slate-300 bg-white"}`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-slate-900 font-mono text-[11px]">#{rep.id}</span>
                            <div className="flex items-center gap-1.5">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${isPending ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"}`}>
                                {isPending ? "Menunggu" : "Selesai"}
                              </span>
                              <button
                                type="button"
                                onClick={(e) => handleDeleteReport(rep.id, e)}
                                title="Hapus laporan pengaduan"
                                className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                          <div className="font-semibold text-slate-800 line-clamp-1">
                            {rep.category || rep.reason || rep.type || "Laporan Pelanggaran"}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            Pelapor: {rep.reporterName || rep.reporter || "User"}
                          </div>
                        </div>
                      );
                    })}
                    {reports.length === 0 && <div className="text-center text-slate-400 text-xs py-8">Tidak ada laporan aktif</div>}
                  </div>
                  <div className="lg:col-span-2">
                    {(() => {
                      const report = reports.find((r) => r.id === selectedReportId);
                      if (!report) return <div className="flex items-center justify-center h-full text-slate-400 text-sm py-12">Pilih laporan di sebelah kiri untuk melihat detail</div>;
                      const isPending = report.status === "pending" || report.status === "OPEN" || report.status === "UNDER_REVIEW";
                      return (
                        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-4 text-xs">
                          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                            <div>
                              <span className="font-bold text-slate-900 font-mono text-xs">Laporan #{report.id}</span>
                              <span className={`ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold ${isPending ? "bg-rose-50 text-rose-700 border border-rose-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200"}`}>
                                {isPending ? "Menunggu Resolusi" : "Selesai"}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => handleDeleteReport(report.id, e)}
                              title="Hapus laporan pengaduan"
                              className="px-2.5 py-1 text-xs text-rose-600 hover:text-white hover:bg-rose-600 rounded-lg border border-rose-200 hover:border-rose-600 transition font-medium flex items-center gap-1.5 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Hapus Laporan
                            </button>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            {[
                              { label: "ID Laporan", value: `#${report.id}` },
                              { label: "Kategori Masalah", value: report.category || report.reason || report.type || "Pelanggaran" },
                              { label: "Pelapor", value: report.reporterName || report.reporter || "Pengguna" },
                              { label: "Pihak Terlapor", value: report.reportedName || report.target || (report.targetRoomId ? `Room #${report.targetRoomId}` : "Mitra") },
                            ].map((item, i) => (
                              <div key={i} className="p-2.5 bg-white rounded-lg border border-slate-200">
                                <span className="text-[10px] text-slate-400 block">{item.label}</span>
                                <strong className="text-slate-900">{item.value}</strong>
                              </div>
                            ))}
                          </div>
                          {report.description && (
                            <div className="p-3 bg-white rounded-lg border border-slate-200">
                              <p className="text-[11px] text-slate-400 mb-1 font-semibold">Deskripsi Kejadian</p>
                              <p className="text-slate-700 leading-relaxed">{report.description}</p>
                            </div>
                          )}

                          {/* Foto Bukti Kejadian */}
                          {report.evidenceUrls && report.evidenceUrls.length > 0 && (
                            <div className="p-3 bg-white rounded-lg border border-slate-200">
                              <p className="text-[11px] text-slate-400 mb-2 font-semibold flex items-center gap-1">
                                <Eye className="w-3.5 h-3.5 text-[#1683FF]" /> Lampiran Bukti Foto ({report.evidenceUrls.length})
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {report.evidenceUrls.map((url, idx) => (
                                  <img
                                    key={idx}
                                    src={url}
                                    alt={`Bukti ${idx + 1}`}
                                    onClick={() => setPreviewImageUrl(url)}
                                    className="w-20 h-20 object-cover rounded-xl border border-slate-200 hover:border-[#1683FF] transition cursor-pointer hover:opacity-90"
                                    title="Klik untuk memperbesar"
                                  />
                                ))}
                              </div>
                            </div>
                          )}

                          {isPending && (
                            <div className="space-y-2 pt-2">
                              <textarea
                                placeholder="Catatan keputusan mediasi admin..."
                                rows={2}
                                value={disputeNotes}
                                onChange={(e) => setDisputeNotes(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:border-[#1683FF] bg-white"
                              />
                              <div className="flex flex-wrap items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleResolveDisputeAction(report, "refund_customer")}
                                  className="px-3.5 py-1.5 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold rounded-xl transition cursor-pointer"
                                >
                                  Refund 100% ke Customer
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleResolveDisputeAction(report, "release_mitra")}
                                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition cursor-pointer"
                                >
                                  Rilis Hak Bayar ke Mitra
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleResolveDisputeAction(report, "split")}
                                  className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition cursor-pointer"
                                >
                                  Bagi Rata (50:50)
                                </button>
                              </div>
                            </div>
                          )}
                          {!isPending && (
                            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold text-xs flex items-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4" /> Sengketa ini telah resmi diselesaikan oleh Admin Bantuin.
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─── TAB: VERIFIKASI & KYC (SEKSI N) ─────────────────────────── */}
          {(activeMenu === "kyc" || activeMenu === "verification") && (
            <div className="animate-in fade-in duration-150">
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-[#1683FF]" /> Antrean Verifikasi Identitas (KYC Mitra & Pengguna)
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">Pemeriksaan foto KTP / KTM asli dan pencocokan NIK sesuai standar kepatuhan regulasi.</p>
                  </div>
                  <span className="text-xs font-bold text-[#1683FF] bg-[#EAF4FF] px-2.5 py-1 rounded-full border border-blue-200">
                    {pendingKycList.length} Menunggu Verifikasi
                  </span>
                </div>

                {pendingKycList.map((mitra) => (
                  <div key={mitra.id} className="p-4 rounded-xl border border-slate-200 mb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-blue-200 transition">
                    <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                      <img src={mitra.avatar || "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80"} alt={mitra.name} className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm text-slate-900">{mitra.name}</span>
                          <span className="text-[10px] font-semibold text-[#1683FF] bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">{mitra.role}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">{mitra.email} · {mitra.city}</div>
                        <div className="flex items-center gap-3 mt-1.5">
                          <button type="button" onClick={() => toggleRevealNik(mitra.id)} className="text-[11px] px-2 py-0.5 rounded-lg border border-slate-200 text-slate-600 hover:text-[#1683FF] flex items-center gap-1 cursor-pointer">
                            {revealedNikIds[mitra.id] ? <><EyeOff className="w-3 h-3" /> {mitra.nik || "3275091827360002"}</> : <><Eye className="w-3 h-3" /> Tampilkan NIK</>}
                          </button>
                          {mitra.idCardUrl && (
                            <button type="button" onClick={() => setPreviewImageUrl(mitra.idCardUrl)} className="text-[11px] px-2 py-0.5 rounded-lg border border-slate-200 text-[#1683FF] hover:bg-blue-50 flex items-center gap-1 cursor-pointer">
                              <Eye className="w-3 h-3" /> Lihat Foto KTP / Dokumen
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={() => {
                          adminVerifyUser?.(mitra.id, true);
                          addToast("KYC Disetujui", `${mitra.name} telah diverifikasi resmi.`);
                        }}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-1 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" /> Setujui
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const reason = prompt("Masukkan alasan penolakan KYC:", "Dokumen buram / tidak sesuai data");
                          if (reason !== null) {
                            adminVerifyUser?.(mitra.id, false, reason);
                            addToast("KYC Ditolak", `Pengajuan ${mitra.name} ditolak.`, "error");
                          }
                        }}
                        className="px-3.5 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-bold rounded-xl border border-rose-200 transition flex items-center gap-1 cursor-pointer"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Tolak
                      </button>
                    </div>
                  </div>
                ))}

                {pendingKycList.length === 0 && (
                  <div className="text-center text-slate-400 text-sm py-12">
                    <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-emerald-400" />
                    <p className="font-semibold text-slate-700">Semua mitra dan pengguna telah terverifikasi!</p>
                    <p className="text-xs text-slate-400 mt-1">Tidak ada dokumen identitas baru yang menunggu peninjauan.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ─── TAB: VOUCHERS ─────────────────────────────────────────────── */}
          {activeMenu === "vouchers" && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Total Voucher", value: vouchers.length, color: "text-slate-900" },
                  { label: "Voucher Aktif", value: vouchers.filter((v) => v.isActive).length, color: "text-emerald-700" },
                  { label: "Total Klaim", value: `${vouchers.reduce((a, v) => a + (v.usedCount || 0), 0)}×`, color: "text-[#1683FF]" },
                  { label: "Voucher Wilayah", value: vouchers.filter((v) => v.targetLocation && v.targetLocation !== "all").length, color: "text-purple-700" },
                ].map((s, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
                    <div className="text-[11px] font-semibold text-slate-400 mb-1">{s.label}</div>
                    <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
                  </div>
                ))}
              </div>

              {/* Filter + Create */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Category */}
                    {[{ id: "all", label: "Semua" }, { id: "bantuan", label: "Bantuan" }, { id: "jasa", label: "Jasa" }, { id: "sewa", label: "Sewa" }].map((f) => (
                      <button key={f.id} onClick={() => setVoucherCategoryFilter(f.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${voucherCategoryFilter === f.id ? pillActiveCls : pillIdleCls}`}>
                        {f.label}
                      </button>
                    ))}
                    {/* Location */}
                    <select value={voucherLocationFilter} onChange={(e) => setVoucherLocationFilter(e.target.value)} className={`${selectCls} flex items-center gap-1`}>
                      <option value="all">📍 Semua Wilayah</option>
                      {VOUCHER_LOCATIONS.filter((l) => l.id !== "all").map((loc) => (
                        <option key={loc.id} value={loc.id}>{loc.label}</option>
                      ))}
                    </select>
                    {/* Status */}
                    <select value={voucherStatusFilter} onChange={(e) => setVoucherStatusFilter(e.target.value)} className={selectCls}>
                      <option value="all">Semua Status</option>
                      <option value="active">Aktif</option>
                      <option value="inactive">Nonaktif</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input type="text" placeholder="Cari kode/nama..." value={voucherSearch} onChange={(e) => setVoucherSearch(e.target.value)} className="pl-8 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-[#1683FF] outline-none w-44" />
                    </div>
                    <button type="button" onClick={() => setIsCreateVoucherOpen(!isCreateVoucherOpen)}
                      className="px-4 py-2 bg-[#1683FF] hover:bg-[#0F6FE5] text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5 shrink-0 cursor-pointer">
                      <Plus className="w-3.5 h-3.5" /> {isCreateVoucherOpen ? "Tutup" : "Buat Voucher"}
                    </button>
                  </div>
                </div>

                {/* ── Create Form ── */}
                {isCreateVoucherOpen && (
                  <div className="border border-[#DCEAF7] rounded-2xl p-5 mb-4 bg-[#F5FAFF] animate-in slide-in-from-top-2 duration-150">
                    <h4 className="font-bold text-sm text-slate-900 mb-4 flex items-center gap-2">
                      <Ticket className="w-4 h-4 text-[#1683FF]" /> Parameter Voucher Baru
                    </h4>
                    <form onSubmit={handleCreateVoucherSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">Kode Voucher *</label>
                          <input type="text" required placeholder="DISKONHEMAT" value={newVoucher.code} onChange={(e) => setNewVoucher({ ...newVoucher, code: e.target.value.toUpperCase() })} className={`${inputCls} font-mono font-bold uppercase`} />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">Judul Promo</label>
                          <input type="text" placeholder="Diskon 15% Sewa Kamera" value={newVoucher.title} onChange={(e) => setNewVoucher({ ...newVoucher, title: e.target.value })} className={inputCls} />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">Berlaku Untuk</label>
                          <select value={newVoucher.appliesTo} onChange={(e) => setNewVoucher({ ...newVoucher, appliesTo: e.target.value })} className={inputCls}>
                            <option value="all">Semua Layanan</option>
                            <option value="sewa">Sewa Barang Saja</option>
                            <option value="jasa">Jasa Spesialis Saja</option>
                            <option value="bantuan">Bantuan Tugas Saja</option>
                          </select>
                        </div>

                        {/* ── FIELD LOKASI — Fitur Utama ── */}
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                            <MapPin className="w-3 h-3 text-[#1683FF]" /> Wilayah Target
                          </label>
                          <select value={newVoucher.targetLocation} onChange={(e) => setNewVoucher({ ...newVoucher, targetLocation: e.target.value })} className={inputCls}>
                            {VOUCHER_LOCATIONS.map((loc) => (
                              <option key={loc.id} value={loc.id}>{loc.label}</option>
                            ))}
                          </select>
                          {newVoucher.targetLocation !== "all" && (
                            <p className="text-[10px] text-[#1683FF] mt-1">Voucher hanya bisa diklaim user di wilayah {newVoucher.targetLocation}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">Tipe Diskon</label>
                          <div className="grid grid-cols-2 gap-2">
                            {[{ t: "percent", l: "Persen (%)" }, { t: "fixed", l: "Nominal (Rp)" }].map((o) => (
                              <button key={o.t} type="button" onClick={() => setNewVoucher({ ...newVoucher, type: o.t })}
                                className={`py-2 rounded-xl text-xs font-semibold border transition ${newVoucher.type === o.t ? "bg-[#EAF4FF] border-[#1683FF] text-[#1683FF]" : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"}`}>
                                {o.l}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">Nilai Diskon *</label>
                          <input type="number" required value={newVoucher.value} onChange={(e) => setNewVoucher({ ...newVoucher, value: e.target.value })} className={inputCls} />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">Maks. Diskon (Rp)</label>
                          <input type="number" value={newVoucher.maxDiscount} disabled={newVoucher.type === "fixed"} onChange={(e) => setNewVoucher({ ...newVoucher, maxDiscount: e.target.value })} className={`${inputCls} disabled:bg-slate-100`} />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">Min. Order (Rp)</label>
                          <input type="number" value={newVoucher.minOrder} onChange={(e) => setNewVoucher({ ...newVoucher, minOrder: e.target.value })} className={inputCls} />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">Kuota Klaim</label>
                          <input type="number" value={newVoucher.quota} onChange={(e) => setNewVoucher({ ...newVoucher, quota: e.target.value })} className={inputCls} />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">Tanggal Kadaluarsa</label>
                          <input type="date" value={newVoucher.expiresAt} onChange={(e) => setNewVoucher({ ...newVoucher, expiresAt: e.target.value })} className={inputCls} />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Deskripsi Singkat</label>
                        <input type="text" placeholder="Deskripsi promo..." value={newVoucher.description} onChange={(e) => setNewVoucher({ ...newVoucher, description: e.target.value })} className={inputCls} />
                      </div>
                      <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                        <button type="button" onClick={() => setIsCreateVoucherOpen(false)} className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition">Batal</button>
                        <button type="submit" className="px-5 py-2 bg-[#1683FF] hover:bg-[#0F6FE5] text-white text-xs font-bold rounded-xl shadow-xs transition">Simpan & Aktifkan</button>
                      </div>
                    </form>
                  </div>
                )}

                {/* ── Voucher Cards Grid ── */}
                {filteredVouchers.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-sm"><Ticket className="w-10 h-10 mx-auto mb-2 text-slate-200" /><p>Tidak ada voucher sesuai filter.</p></div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {filteredVouchers.map((v) => {
                      const percentUsed = Math.min(100, Math.round(((v.usedCount || 0) / (v.quota || 1)) * 100));
                      const isNasional = !v.targetLocation || v.targetLocation === "all";
                      return (
                        <div key={v.id} className={`bg-white rounded-2xl border p-4 shadow-xs flex flex-col justify-between transition ${v.isActive ? "border-slate-200 hover:border-[#1683FF]" : "border-slate-100 opacity-60"}`}>
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${v.appliesTo === "all" ? "bg-blue-50 text-[#1683FF]" : v.appliesTo === "sewa" ? "bg-purple-50 text-purple-700" : v.appliesTo === "jasa" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-800"}`}>
                                {v.appliesTo === "all" ? "Semua" : v.appliesTo.toUpperCase()}
                              </span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${v.isActive ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-500 border-slate-200"}`}>
                                {v.isActive ? "Aktif" : "Nonaktif"}
                              </span>
                            </div>

                            <div className="flex items-baseline justify-between mt-1">
                              <span className="font-mono text-sm font-black text-slate-900">{v.code}</span>
                              <span className="text-sm font-black text-[#1683FF]">{v.type === "percent" ? `${v.value}% OFF` : formatIDR(v.value)}</span>
                            </div>
                            <h4 className="text-xs font-semibold text-slate-700 mt-1">{v.title}</h4>

                            {/* Wilayah badge */}
                            <div className="flex items-center gap-1 mt-2">
                              <MapPin className="w-3 h-3 text-[#1683FF] shrink-0" />
                              <span className={`text-[10px] font-semibold ${isNasional ? "text-slate-500" : "text-[#1683FF]"}`}>
                                {isNasional ? "Nasional" : v.targetLocation}
                              </span>
                            </div>

                            <div className="mt-2.5 space-y-1 text-[10px] text-slate-500">
                              <div className="flex justify-between"><span>Min. Order:</span><strong>{formatIDR(v.minOrder)}</strong></div>
                              <div className="flex justify-between"><span>Kuota:</span><strong>{v.usedCount}/{v.quota} ({percentUsed}%)</strong></div>
                              <div className="w-full bg-slate-100 rounded-full h-1 mt-1"><div className="bg-[#1683FF] h-1 rounded-full transition-all" style={{ width: `${percentUsed}%` }} /></div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-2 pt-3 mt-3 border-t border-slate-100">
                            <div className="flex items-center gap-1.5">
                              <button type="button" onClick={() => handleCopyCode(v.code, v.id)} className="p-1.5 text-slate-400 hover:text-[#1683FF] transition" title="Salin kode">
                                {copiedVoucherId === v.id ? <CheckCheck className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                              <button type="button" onClick={() => handleToggleVoucher(v)} className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 hover:bg-slate-50 transition">
                                {v.isActive ? "Nonaktifkan" : "Aktifkan"}
                              </button>
                            </div>
                            <button type="button" onClick={() => handleDeleteVoucher(v)} className="p-1.5 text-slate-300 hover:text-rose-600 transition"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ─── TAB: LISTINGS ─────────────────────────────────────────────── */}
          {activeMenu === "listings" && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                  {[{ id: "all", label: "Semua" }, { id: "jasa", label: "Jasa" }, { id: "sewa", label: "Sewa" }, { id: "bantuan", label: "Bantuan" }].map((f) => (
                    <button key={f.id} onClick={() => setListingTypeFilter(f.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition shrink-0 cursor-pointer ${listingTypeFilter === f.id ? pillActiveCls : pillIdleCls}`}>
                      {f.label}
                    </button>
                  ))}
                </div>
                <div className="relative sm:w-56">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="text" placeholder="Cari judul listing..." value={listingSearch} onChange={(e) => setListingSearch(e.target.value)} className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-[#1683FF] outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {allListings.filter((item) => {
                  if (listingTypeFilter !== "all" && item.type !== listingTypeFilter) return false;
                  if (adminLocationFilter !== "all") {
                    const city = (item.city || "").toLowerCase();
                    const locFilter = adminLocationFilter.toLowerCase().replace(/^(kota|kabupaten|kab\.)\s+/gi, "").trim();
                    if (!city.includes(locFilter) && !locFilter.includes(city.split(",")[0].trim())) return false;
                  }
                  if (listingSearch) {
                    const q = listingSearch.toLowerCase();
                    return item.title.toLowerCase().includes(q) || item.provider.toLowerCase().includes(q);
                  }
                  return true;
                }).map((item) => (
                  <div key={item.id} className={`bg-white rounded-2xl border p-4 shadow-xs flex flex-col justify-between transition ${item.isHidden ? "opacity-60 border-rose-200 bg-rose-50/10" : "border-slate-200 hover:border-blue-200"}`}>
                    <div className="flex items-start gap-3">
                      <img src={item.photoUrl} alt={item.title} className="w-14 h-14 rounded-xl object-cover shrink-0 border border-slate-200" />
                      <div className="min-w-0 flex-1">
                        <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-md ${item.type === "sewa" ? "bg-purple-50 text-purple-700" : item.type === "jasa" ? "bg-emerald-50 text-emerald-700" : "bg-blue-50 text-[#1683FF]"}`}>{item.type}</span>
                        <h4 className="text-xs font-bold text-slate-900 mt-1 line-clamp-1">{item.title}</h4>
                        <span className="text-[11px] text-slate-400 block truncate">{item.provider}</span>
                        <span className="text-xs font-bold text-[#1683FF] mt-1 block">{formatIDR(item.price)}</span>
                        <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-400">
                          <MapPin className="w-2.5 h-2.5" />{item.city}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-2 pt-3 mt-3 border-t border-slate-100">
                      <button type="button" onClick={() => handleToggleHideListing(item)} className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${item.isHidden ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                        {item.isHidden ? "Tayangkan" : "Sembunyikan"}
                      </button>
                      <button type="button" onClick={() => handleDeleteListing(item)} className="p-1.5 text-slate-300 hover:text-rose-600 transition"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ─── TAB: USERS ────────────────────────────────────────────────── */}
          {activeMenu === "users" && (
            <div className="animate-in fade-in duration-150">
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2"><Users className="w-4 h-4 text-[#1683FF]" /> Direktori Akun Pengguna & Mitra</h3>
                  <div className="relative sm:w-56">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="text" placeholder="Cari nama atau email..." value={userSearch} onChange={(e) => setUserSearch(e.target.value)} className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-[#1683FF] outline-none" />
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs min-w-[700px]">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="py-3 px-4">Pengguna</th>
                        <th className="py-3 px-4">Peran</th>
                        <th className="py-3 px-4">Kontak</th>
                        <th className="py-3 px-4 text-center">Status</th>
                        <th className="py-3 px-4 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {allUsersList.filter((u) => !userSearch || u.name.toLowerCase().includes(userSearch.toLowerCase()) || u.email.toLowerCase().includes(userSearch.toLowerCase())).map((u) => {
                        const isSuspended = !!suspendedUserIds[u.id];
                        return (
                          <tr key={u.id} className="hover:bg-[#F5FAFF]">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <img src={u.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80"} alt={u.name} className="w-9 h-9 rounded-xl object-cover border border-slate-200" />
                                <div><strong className="text-slate-900 font-bold block">{u.name}</strong><span className="text-[11px] text-slate-400 font-mono">{u.email}</span></div>
                              </div>
                            </td>
                            <td className="py-3 px-4"><span className="font-semibold text-slate-700">{u.role}</span><span className="text-[10px] text-slate-400 block">{u.ordersCount} Transaksi</span></td>
                            <td className="py-3 px-4 font-mono text-slate-600">{u.phone}</td>
                            <td className="py-3 px-4 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${isSuspended ? "bg-rose-50 text-rose-700 border-rose-200" : u.verified ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>
                                {isSuspended ? "Suspended" : u.verified ? "Verified" : "Reguler"}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                {!u.verified ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      adminVerifyUser?.(u.id, true);
                                      addToast?.("KYC Diverifikasi", `${u.name} berhasil diverifikasi admin.`);
                                    }}
                                    className="px-2 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition"
                                    title="Setujui KYC Akun"
                                  >
                                    Verif KYC
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      adminVerifyUser?.(u.id, false, "Dicabut oleh admin");
                                      addToast?.("KYC Dicabut", `Status verifikasi ${u.name} dicabut.`, "error");
                                    }}
                                    className="px-2 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 transition"
                                    title="Cabut Status Verifikasi"
                                  >
                                    Cabut KYC
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleToggleSuspendUser(u)}
                                  className={`px-2 py-1 rounded-lg text-xs font-semibold transition ${isSuspended ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200" : "bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200"}`}
                                >
                                  {isSuspended ? "Aktifkan" : "Suspend"}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ─── TAB: PENYEDIA JASA (SEKSI N) ───────────────────────────────── */}
          {activeMenu === "providers" && (
            <div className="animate-in fade-in duration-150 space-y-4">
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-[#1683FF]" /> Manajemen Penyedia Jasa & Freelance
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Verifikasi keahlian, moderasi akun penyedia, dan pengawasan pesanan klien aktif.
                    </p>
                  </div>
                  <div className="relative sm:w-56">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Cari penyedia jasa..." 
                      value={providerSearch} 
                      onChange={(e) => setProviderSearch(e.target.value)} 
                      className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-[#1683FF] outline-none" 
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs min-w-[750px]">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="py-3 px-4">Penyedia Jasa</th>
                        <th className="py-3 px-4">Spesialisasi</th>
                        <th className="py-3 px-4">Rating &amp; Ulasan</th>
                        <th className="py-3 px-4 text-center">Status Akun</th>
                        <th className="py-3 px-4 text-center">Aksi Moderasi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {allProvidersList
                        .filter((p) => !providerSearch || p.name.toLowerCase().includes(providerSearch.toLowerCase()) || (p.brandTitle || "").toLowerCase().includes(providerSearch.toLowerCase()))
                        .map((prov) => {
                          const isSuspended = !!suspendedProviderIds[prov.id];
                          return (
                            <tr key={prov.id} className="hover:bg-[#F5FAFF]">
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-3">
                                  <img 
                                    src={prov.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80"} 
                                    alt={prov.name} 
                                    className="w-9 h-9 rounded-xl object-cover border border-slate-200" 
                                  />
                                  <div>
                                    <strong className="text-slate-900 font-bold block">{prov.name}</strong>
                                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                                      <MapPin className="w-2.5 h-2.5" /> {prov.location}
                                    </span>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <span className="font-semibold text-slate-700 block">{prov.brandTitle || "Spesialis Kreatif"}</span>
                                <span className="text-[10px] text-slate-400">{prov.catalog?.length || 0} Layanan Katalog</span>
                              </td>
                              <td className="py-3 px-4">
                                {prov.rating ? (
                                  <div className="flex items-center gap-1 text-slate-900 font-bold">
                                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                    <span>{prov.rating}</span>
                                    <span className="text-slate-400 font-normal text-[11px]">({prov.reviewsCount || 0} ulasan)</span>
                                  </div>
                                ) : (
                                  <span className="text-slate-400 text-[11px]">Belum ada ulasan</span>
                                )}
                              </td>
                              <td className="py-3 px-4 text-center">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                  isSuspended 
                                    ? "bg-rose-50 text-rose-700 border-rose-200" 
                                    : "bg-emerald-50 text-emerald-700 border-emerald-200"
                                }`}>
                                  {isSuspended ? "Suspended" : "Aktif"}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSuspendedProviderIds((prev) => ({ ...prev, [prov.id]: !isSuspended }));
                                      addToast(isSuspended ? "Akun Diaktifkan" : "Akun Ditangguhkan", `Akun penyedia ${prov.name} ${isSuspended ? "aktif kembali" : "ditangguhkan"}.`);
                                    }}
                                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                                      isSuspended 
                                        ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200" 
                                        : "bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200"
                                    }`}
                                  >
                                    {isSuspended ? "Aktifkan" : "Suspend"}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ─── TAB: TOKO MITRA RENTAL ────────────────────────────────────── */}
          {activeMenu === "partners" && (
            <div className="animate-in fade-in duration-150 space-y-4">
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                      <Store className="w-4 h-4 text-[#1683FF]" /> Manajemen Toko Mitra Rental
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Kelola legalitas outlet rental, pengawasan unit sewa, dan kepatuhan deposit pelanggan.
                    </p>
                  </div>
                  <div className="relative sm:w-56">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Cari toko mitra sewa..." 
                      value={partnerSearch} 
                      onChange={(e) => setPartnerSearch(e.target.value)} 
                      className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-[#1683FF] outline-none" 
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs min-w-[750px]">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="py-3 px-4">Toko Mitra</th>
                        <th className="py-3 px-4">Kategori Alat</th>
                        <th className="py-3 px-4">Rating &amp; Selesai</th>
                        <th className="py-3 px-4 text-center">Status Toko</th>
                        <th className="py-3 px-4 text-center">Aksi Moderasi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {allPartnersList
                        .filter((p) => !partnerSearch || p.name.toLowerCase().includes(partnerSearch.toLowerCase()) || (p.category || "").toLowerCase().includes(partnerSearch.toLowerCase()))
                        .map((ptr) => {
                          const isSuspended = !!suspendedPartnerIds[ptr.id];
                          return (
                            <tr key={ptr.id} className="hover:bg-[#F5FAFF]">
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-3">
                                  <img 
                                    src={ptr.avatar || "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=120&q=80"} 
                                    alt={ptr.name} 
                                    className="w-9 h-9 rounded-xl object-cover border border-slate-200" 
                                  />
                                  <div>
                                    <strong className="text-slate-900 font-bold block">{ptr.name}</strong>
                                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                                      <MapPin className="w-2.5 h-2.5" /> {ptr.address}
                                    </span>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <span className="font-semibold text-slate-700 block">{ptr.category || "Rental Peralatan"}</span>
                                <span className="text-[10px] text-slate-400">{ptr.catalog?.length || 0} Unit Tersedia</span>
                              </td>
                              <td className="py-3 px-4">
                                {ptr.rating ? (
                                  <div className="flex items-center gap-1 text-slate-900 font-bold">
                                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                    <span>{ptr.rating}</span>
                                    <span className="text-slate-400 font-normal text-[11px]">({ptr.completedOrders || 0} sewa)</span>
                                  </div>
                                ) : (
                                  <span className="text-slate-400 text-[11px]">Belum ada rating</span>
                                )}
                              </td>
                              <td className="py-3 px-4 text-center">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                  isSuspended 
                                    ? "bg-rose-50 text-rose-700 border-rose-200" 
                                    : ptr.isVerifiedPartner 
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                                    : "bg-blue-50 text-[#1683FF] border-blue-200"
                                }`}>
                                  {isSuspended ? "Suspended" : ptr.isVerifiedPartner ? "Verified Partner" : "Aktif"}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                  <Link
                                    href={`/mitra/${ptr.id}`}
                                    target="_blank"
                                    className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition inline-flex items-center gap-1"
                                  >
                                    <span>Etalase</span>
                                    <ExternalLink className="w-3 h-3" />
                                  </Link>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSuspendedPartnerIds((prev) => ({ ...prev, [ptr.id]: !isSuspended }));
                                      addToast(isSuspended ? "Toko Diaktifkan" : "Toko Ditangguhkan", `Toko ${ptr.name} ${isSuspended ? "aktif kembali" : "ditangguhkan"}.`);
                                    }}
                                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                                      isSuspended 
                                        ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200" 
                                        : "bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200"
                                    }`}
                                  >
                                    {isSuspended ? "Aktifkan" : "Suspend"}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ─── TAB: PROMOSI LANDING PAGE (SEKSI N, 9, 10, 26) ──────────────── */}
          {activeMenu === "promotions" && (
            <div className="animate-in fade-in duration-150 space-y-4">
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                      <Rocket className="w-4 h-4 text-[#1683FF]" /> Moderasi Promosi Landing Page (Jasa, Sewa, Mitra)
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Kelola penempatan etalase unggulan berbayar untuk Layanan Jasa, Unit Sewa, dan Toko Mitra di Beranda Bantuin.
                    </p>
                  </div>
                  <span className="text-xs font-bold text-[#1683FF] bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                    {promotionsList.length} Promosi Terdaftar
                  </span>
                </div>

                {/* Filter Target Promosi */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {[
                    { id: "all", label: "Semua Promosi", count: promotionsList.length },
                    { id: "service", label: "Layanan Jasa (Provider)", count: promotionsList.filter(p => p.targetType === 'service').length },
                    { id: "rental", label: "Unit Sewa (Partner)", count: promotionsList.filter(p => p.targetType === 'rental').length },
                    { id: "store", label: "Toko Mitra (Partner)", count: promotionsList.filter(p => p.targetType === 'store').length },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setPromoTargetFilter(tab.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                        promoTargetFilter === tab.id
                          ? "bg-[#1683FF] text-white shadow-2xs"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {tab.label} ({tab.count})
                    </button>
                  ))}
                </div>

                <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 space-y-1">
                  <div className="font-bold flex items-center gap-1 text-amber-950">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    <span>Integritas Promosi Terhadap Ranking Organik (Prompt Seksi 9 &amp; 10):</span>
                  </div>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    Promosi berbayar hanya menempatkan listing di carousel &ldquo;Unggulan / Promosi&rdquo; di Landing Page. Promosi <strong>TIDAK PERNAH</strong> mengubah rating, ulasan, atau skor performa organik akun tersebut.
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs min-w-[850px]">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="py-3 px-4">Target Promosi</th>
                        <th className="py-3 px-4">Pemilik (Owner)</th>
                        <th className="py-3 px-4">Paket &amp; Durasi</th>
                        <th className="py-3 px-4">Biaya</th>
                        <th className="py-3 px-4 text-center">Status Gateway</th>
                        <th className="py-3 px-4 text-center">Status Promosi</th>
                        <th className="py-3 px-4">Masa Berlaku</th>
                        <th className="py-3 px-4 text-center">Aksi Admin</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {promotionsList
                        .filter((p) => promoTargetFilter === "all" || p.targetType === promoTargetFilter)
                        .map((promo) => {
                          const isExpired = new Date(promo.endDate) < new Date();
                          const isActive = promo.status === "active" && !isExpired;

                          return (
                            <tr key={promo.id} className="hover:bg-[#F5FAFF]">
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-1.5 mb-0.5">
                                  <span className={`px-1.5 py-0.2 rounded text-[9px] font-extrabold uppercase ${
                                    promo.targetType === "service"
                                      ? "bg-blue-50 text-[#1683FF] border border-blue-200"
                                      : promo.targetType === "rental"
                                      ? "bg-purple-50 text-purple-700 border border-purple-200"
                                      : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  }`}>
                                    {promo.targetType === "service" ? "Jasa" : promo.targetType === "rental" ? "Unit Sewa" : "Toko"}
                                  </span>
                                </div>
                                <strong className="text-slate-900 font-bold block">{promo.targetTitle || promo.storeName}</strong>
                              </td>
                              <td className="py-3 px-4">
                                <span className="text-slate-900 font-semibold block">{promo.ownerName || promo.storeName}</span>
                                <span className="text-[10px] text-slate-400 capitalize">{promo.ownerType || "Partner"}</span>
                              </td>
                              <td className="py-3 px-4 font-semibold text-slate-700">
                                {promo.packageName || promo.packageTitle}
                              </td>
                              <td className="py-3 px-4 font-black text-slate-900 font-mono">{formatIDR(promo.amount)}</td>
                              <td className="py-3 px-4 text-center">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  promo.paymentStatus === "paid" 
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
                                    : "bg-amber-50 text-amber-800 border border-amber-200"
                                }`}>
                                  {promo.paymentStatus.toUpperCase()} (Gateway)
                                </span>
                              </td>
                              <td className="py-3 px-4 text-center">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  isActive 
                                    ? "bg-[#1683FF] text-white" 
                                    : "bg-slate-100 text-slate-600"
                                }`}>
                                  {isActive ? "AKTIF TAYANG" : isExpired ? "KEDALUWARSA" : "PENDING"}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-slate-500 text-[11px]">
                                {new Date(promo.startDate).toLocaleDateString("id-ID", { day: "numeric", month: "short" })} s/d {new Date(promo.endDate).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                              </td>
                              <td className="py-3 px-4 text-center">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const nextStatus = promo.status === "active" ? "cancelled" : "active";
                                    setPromotionsList((prev) => prev.map((p) => p.id === promo.id ? { ...p, status: nextStatus } : p));
                                    addToast("Status Promosi Diubah", `Promosi untuk "${promo.targetTitle || promo.storeName}" diubah menjadi ${nextStatus}.`);
                                  }}
                                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                                    promo.status === "active"
                                      ? "bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200"
                                      : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                                  }`}
                                >
                                  {promo.status === "active" ? "Nonaktifkan" : "Aktifkan"}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ─── TAB: BROADCASTS ───────────────────────────────────────────── */}
          {activeMenu === "broadcasts" && (
            <div className="animate-in fade-in duration-150">
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-100">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2"><Megaphone className="w-4 h-4 text-[#1683FF]" /> Pengumuman & Siaran Platform</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">Siarkan info darurat, promo, atau pemeliharaan ke pengguna.</p>
                  </div>
                  <button type="button" onClick={() => setIsNewBroadcastOpen(!isNewBroadcastOpen)} className="px-4 py-2 bg-[#1683FF] hover:bg-[#0F6FE5] text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 shrink-0">
                    <Plus className="w-3.5 h-3.5" /> {isNewBroadcastOpen ? "Tutup" : "Siaran Baru"}
                  </button>
                </div>

                {isNewBroadcastOpen && (
                  <form onSubmit={handleAddBroadcast} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 mb-4 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div><label className="block font-semibold text-slate-700 mb-1">Judul *</label><input type="text" required placeholder="Judul siaran..." value={newBroadcastForm.title} onChange={(e) => setNewBroadcastForm({ ...newBroadcastForm, title: e.target.value })} className={inputCls} /></div>
                      <div><label className="block font-semibold text-slate-700 mb-1">Tipe</label>
                        <select value={newBroadcastForm.type} onChange={(e) => setNewBroadcastForm({ ...newBroadcastForm, type: e.target.value })} className={inputCls}>
                          <option value="info">Informasi Umum</option>
                          <option value="warning">Peringatan</option>
                          <option value="promo">Promo & Diskon</option>
                        </select>
                      </div>
                      <div><label className="block font-semibold text-slate-700 mb-1">Target</label>
                        <select value={newBroadcastForm.target} onChange={(e) => setNewBroadcastForm({ ...newBroadcastForm, target: e.target.value })} className={inputCls}>
                          <option>Semua Pengguna</option>
                          <option>Mitra Saja</option>
                          <option>Pelanggan Saja</option>
                        </select>
                      </div>
                    </div>
                    <div><label className="block font-semibold text-slate-700 mb-1 text-xs">Isi Pesan *</label><textarea rows={2} required placeholder="Isi pesan siaran..." value={newBroadcastForm.message} onChange={(e) => setNewBroadcastForm({ ...newBroadcastForm, message: e.target.value })} className={`${inputCls} resize-none`} /></div>
                    <div className="flex justify-end gap-2">
                      <button type="button" onClick={() => setIsNewBroadcastOpen(false)} className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold">Batal</button>
                      <button type="submit" className="px-4 py-1.5 bg-[#1683FF] text-white text-xs font-bold rounded-xl">Terbitkan</button>
                    </div>
                  </form>
                )}

                <div className="space-y-3">
                  {broadcasts.map((bc) => (
                    <div key={bc.id} className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition ${!bc.isActive ? "bg-slate-50/50 opacity-60 border-slate-200" : "bg-white border-slate-200"}`}>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${bc.type === "warning" ? "bg-rose-50 text-rose-700" : bc.type === "promo" ? "bg-emerald-50 text-emerald-700" : "bg-blue-50 text-[#1683FF]"}`}>{bc.type.toUpperCase()}</span>
                          <span className="text-[10px] text-slate-400">Target: {bc.target} · {formatDateIndo(bc.createdAt)}</span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-900">{bc.title}</h4>
                        <p className="text-xs text-slate-500 mt-0.5">{bc.message}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button type="button" onClick={() => handleToggleBroadcast(bc.id)} className="px-3 py-1 text-xs font-semibold rounded-lg border border-slate-200 hover:bg-slate-50">{bc.isActive ? "Nonaktifkan" : "Siarkan"}</button>
                        <button type="button" onClick={() => handleDeleteBroadcast(bc.id)} className="p-1.5 text-slate-300 hover:text-rose-600"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ─── TAB: AUDIT TRAIL ──────────────────────────────────────────── */}
          {activeMenu === "audit" && (
            <div className="animate-in fade-in duration-150">
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
                  <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2"><History className="w-4 h-4 text-[#1683FF]" /> Immutable Audit Log</h3>
                  <span className="text-xs text-slate-400 font-mono">Anti-Tamper Record</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs min-w-[700px]">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="py-3 px-3">Waktu</th>
                        <th className="py-3 px-3">Aktor</th>
                        <th className="py-3 px-3">Aksi</th>
                        <th className="py-3 px-3">Target</th>
                        <th className="py-3 px-3">Detail</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {auditLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-[#F5FAFF]">
                          <td className="py-3 px-3 text-slate-400 whitespace-nowrap font-mono text-[11px]">{formatDateTimeIndo(log.timestamp)}</td>
                          <td className="py-3 px-3 font-semibold text-slate-900">{log.actor}</td>
                          <td className="py-3 px-3"><span className="px-2 py-0.5 rounded-md bg-blue-50 text-[#1683FF] font-bold text-[10px] font-mono">{log.action}</span></td>
                          <td className="py-3 px-3 text-slate-900 font-medium">{log.target}</td>
                          <td className="py-3 px-3 text-slate-500 max-w-xs truncate">{log.details}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ─── TAB: CHAT INBOX ───────────────────────────────────────────── */}
          {activeMenu === "chat" && (
            <div className="animate-in fade-in duration-150">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="flex h-[calc(100vh-220px)] min-h-[480px]">

                  {/* Thread List */}
                  <div className={`w-full sm:w-72 border-r border-slate-200 flex flex-col shrink-0 ${selectedThread ? "hidden sm:flex" : "flex"}`}>
                    <div className="p-4 border-b border-slate-100">
                      <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2 mb-3">
                        <MessageSquare className="w-4 h-4 text-[#1683FF]" /> Inbox Pesan User
                        {unreadCount > 0 && <span className="text-[10px] bg-rose-500 text-white px-1.5 py-0.5 rounded-full font-bold">{unreadCount}</span>}
                      </h3>
                      <p className="text-[11px] text-slate-400">Balas pesan langsung dari user & mitra platform.</p>
                    </div>
                    <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                      {inboxThreads.map((thread) => (
                        <div
                          key={thread.id}
                          onClick={() => handleSelectThread(thread.id)}
                          className={`w-full p-4 text-left hover:bg-[#F5FAFF] transition flex items-start gap-3 cursor-pointer group relative ${selectedThreadId === thread.id ? "bg-blue-50/60" : ""}`}
                        >
                          <div className="relative shrink-0">
                            <img src={thread.userAvatar} alt={thread.userName} className="w-9 h-9 rounded-full object-cover border border-slate-200" />
                            {thread.unread && <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-rose-500 border-2 border-white" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-1">
                              <span className={`text-xs font-bold truncate ${thread.unread ? "text-slate-900" : "text-slate-700"}`}>{thread.userName}</span>
                              <div className="flex items-center gap-1 shrink-0">
                                <span className="text-[10px] text-slate-400">{formatChatTime(thread.time)}</span>
                                <button
                                  type="button"
                                  onClick={(e) => handleDeleteThread(thread.id, e)}
                                  title="Hapus percakapan pengaduan"
                                  className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 mt-0.5">
                              <MapPin className="w-2.5 h-2.5 text-[#1683FF] shrink-0" />
                              <span className="text-[10px] text-[#1683FF] font-medium">{thread.location}</span>
                            </div>
                            <p className={`text-[11px] mt-0.5 line-clamp-1 ${thread.unread ? "text-slate-800 font-semibold" : "text-slate-400"}`}>{thread.lastMessage}</p>
                          </div>
                        </div>
                      ))}
                      {inboxThreads.length === 0 && (
                        <div className="p-6 text-center text-slate-400">
                          <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                          <p className="text-xs font-semibold text-slate-600">Inbox Kosong</p>
                          <p className="text-[11px] text-slate-400 mt-1">Tidak ada pesan pengaduan aktif.</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Chat Window */}
                  {selectedThread ? (
                    <div className="flex-1 flex flex-col min-w-0">
                      {/* Chat Header */}
                      <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between gap-3 shrink-0 bg-white">
                        <div className="flex items-center gap-3 min-w-0">
                          <button type="button" onClick={() => setSelectedThreadId(null)} className="sm:hidden p-1.5 -ml-1 rounded-lg hover:bg-slate-100 text-slate-500">
                            <ChevronRight className="w-4 h-4 rotate-180" />
                          </button>
                          <img src={selectedThread.userAvatar} alt={selectedThread.userName} className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-slate-900 truncate">{selectedThread.userName}</span>
                              <span className="text-[10px] font-semibold text-[#1683FF] bg-[#EAF4FF] px-2 py-0.5 rounded-full border border-blue-200 shrink-0">User</span>
                            </div>
                            <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-0.5">
                              <MapPin className="w-2.5 h-2.5 text-[#1683FF]" />
                              <span className="truncate">{selectedThread.location}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100 hidden md:inline">Admin Mode</span>
                          <button
                            type="button"
                            onClick={() => handleClearThreadMessages(selectedThread.id)}
                            title="Hapus semua pesan dalam percakapan ini"
                            className="px-2.5 py-1.5 text-xs text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-xl border border-slate-200 hover:border-rose-200 transition font-medium flex items-center gap-1.5 cursor-pointer"
                          >
                            <Eraser className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Bersihkan Chat</span>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteThread(selectedThread.id, e)}
                            title="Hapus seluruh pengaduan ini dari inbox admin"
                            className="px-2.5 py-1.5 text-xs text-rose-600 hover:text-white hover:bg-rose-600 rounded-xl border border-rose-200 hover:border-rose-600 transition font-semibold flex items-center gap-1.5 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Hapus Pengaduan</span>
                          </button>
                        </div>
                      </div>

                      {/* Messages */}
                      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-[#F5FAFF]">
                        {selectedThread.messages && selectedThread.messages.length > 0 ? (
                          selectedThread.messages.map((msg) => {
                            const isAdmin = msg.from === "admin";
                            return (
                              <div key={msg.id} className={`flex items-end gap-2 group ${isAdmin ? "flex-row-reverse" : ""}`}>
                                {!isAdmin && <img src={selectedThread.userAvatar} alt="" className="w-7 h-7 rounded-full object-cover shrink-0 border border-slate-200" />}
                                {isAdmin && (
                                  <div className="w-7 h-7 rounded-full bg-[#1683FF] text-white text-[10px] font-black flex items-center justify-center shrink-0">A</div>
                                )}
                                <div className="max-w-[70%] space-y-1">
                                  {msg.image && (
                                    <div className={`rounded-2xl overflow-hidden border border-slate-200 ${isAdmin ? "rounded-br-none" : "rounded-bl-none"}`}>
                                      <img src={msg.image} alt="Foto" className="max-w-[220px] w-full object-cover cursor-zoom-in hover:opacity-90 transition" onClick={() => setPreviewImageUrl(msg.image)} title="Klik untuk perbesar" />
                                    </div>
                                  )}
                                  {msg.text && (
                                    <div className={`px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed ${isAdmin ? "bg-[#1683FF] text-white rounded-br-none" : "bg-white border border-slate-200 text-slate-900 rounded-bl-none shadow-xs"}`}>
                                      {msg.text}
                                    </div>
                                  )}
                                  <div className={`flex items-center gap-1.5 ${isAdmin ? "justify-end" : ""}`}>
                                    <span className="text-[10px] text-slate-400">{formatMessageTime(msg.time)}</span>
                                    {isAdmin && <CheckCheck className="w-3 h-3 text-[#1683FF]" />}
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteMessage(msg.id)}
                                      title="Hapus pesan ini"
                                      className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-400 hover:text-rose-600 rounded transition"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="flex flex-col items-center justify-center h-full text-center py-12 text-slate-400">
                            <MessageSquare className="w-10 h-10 text-slate-300 mb-2" />
                            <p className="text-xs font-semibold text-slate-600">Belum ada pesan dalam percakapan ini</p>
                            <p className="text-[11px] text-slate-400 mt-0.5">Percakapan bersih atau pesan sebelumnya telah dibersihkan.</p>
                          </div>
                        )}
                        <div ref={chatBottomRef} />
                      </div>

                      {/* Input Area */}
                      <div className="border-t border-slate-200 px-4 py-3 bg-white shrink-0">
                        {chatImagePreview && (
                          <div className="mb-2 relative inline-block">
                            <img src={chatImagePreview} alt="Preview" className="h-16 w-auto rounded-xl border border-slate-200 object-cover" />
                            <button type="button" onClick={() => setChatImagePreview(null)} className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center hover:bg-rose-600">
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                        <div className="flex items-end gap-2">
                          <input ref={chatFileInputRef} type="file" accept="image/*" className="hidden" onChange={handleChatImageChange} />
                          <button type="button" onClick={() => chatFileInputRef.current?.click()} title="Lampirkan foto"
                            className="w-9 h-9 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 hover:border-[#1683FF] hover:text-[#1683FF] flex items-center justify-center transition shrink-0 cursor-pointer">
                            <ImagePlus className="w-4 h-4" />
                          </button>
                          <textarea value={chatInput} onChange={(e) => setChatInput(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendAdminReply(); } }}
                            placeholder="Balas pesan user..." rows={1}
                            className="flex-1 text-xs border border-slate-200 rounded-xl px-3 py-2.5 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#1683FF] focus:bg-white transition resize-none"
                            style={{ fieldSizing: "content", maxHeight: "100px" }} />
                          <button type="button" onClick={handleSendAdminReply} disabled={!chatInput.trim() && !chatImagePreview}
                            className="w-9 h-9 rounded-xl bg-[#1683FF] hover:bg-[#0F6FE5] disabled:bg-slate-200 text-white flex items-center justify-center transition shrink-0 cursor-pointer disabled:cursor-not-allowed">
                            <Send className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1.5 text-center">Enter kirim · Shift+Enter baris baru · Maks. foto 5MB</p>
                      </div>
                    </div>
                  ) : (
                    <div className="hidden sm:flex flex-1 flex-col items-center justify-center text-slate-400 gap-3">
                      <MessageSquare className="w-10 h-10 text-slate-200" />
                      <p className="text-sm font-medium">Pilih percakapan di sebelah kiri</p>
                      <p className="text-[11px]">untuk membaca dan membalas pesan user</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* ── ORDER DETAIL MODAL ──────────────────────────────────────────── */}
      {selectedOrderForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">Detail Transaksi #{selectedOrderForDetail.id}</h3>
              <button type="button" onClick={() => setSelectedOrderForDetail(null)} className="p-1 rounded-lg text-slate-400 hover:text-slate-700"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl flex items-center gap-3">
                <img src={selectedOrderForDetail.photoUrl || "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=400&q=80"} alt="Unit" className="w-12 h-12 rounded-xl object-cover border border-slate-200" />
                <div>
                  <h4 className="font-bold text-slate-900">{selectedOrderForDetail.requestTitle || "Layanan"}</h4>
                  <p className="text-[11px] text-slate-400">Mitra: {selectedOrderForDetail.helper?.name || "Mitra"}</p>
                  <p className="text-[11px] text-slate-400">Customer: {selectedOrderForDetail.requester?.name || "Customer"}</p>
                </div>
              </div>
              <div className="p-3 rounded-xl border border-slate-200 space-y-1.5">
                <div className="flex justify-between"><span className="text-slate-500">Nilai Tagihan:</span><strong className="font-mono">{formatIDR(selectedOrderForDetail.totalAmount || selectedOrderForDetail.price || 0)}</strong></div>
                <div className="flex justify-between text-emerald-600"><span>Komisi Platform (8%):</span><strong className="font-mono">{formatIDR(Math.round((selectedOrderForDetail.totalAmount || 0) * 0.08))}</strong></div>
                {selectedOrderForDetail.depositFee && <div className="flex justify-between text-purple-700"><span>Deposit Jaminan:</span><strong className="font-mono">{formatIDR(selectedOrderForDetail.depositFee)}</strong></div>}
                <div className="flex justify-between pt-2 border-t font-bold"><span>Status Pembayaran:</span><span className="text-[#1683FF] uppercase font-mono">{selectedOrderForDetail.stage}</span></div>
              </div>
            </div>
            <button type="button" onClick={() => setSelectedOrderForDetail(null)} className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition">Tutup</button>
          </div>
        </div>
      )}

      {/* ── PHOTO ZOOM / PREVIEW MODAL ───────────────────────────────────── */}
      {previewImageUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs animate-in fade-in duration-150" onClick={() => setPreviewImageUrl(null)}>
          <div className="relative max-w-3xl w-full max-h-[90vh] bg-white rounded-2xl p-4 shadow-2xl overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-[#1683FF]" /> Pratinjau Dokumen / Foto Bukti
              </span>
              <button
                type="button"
                onClick={() => setPreviewImageUrl(null)}
                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-auto flex items-center justify-center bg-slate-950/5 rounded-xl p-2 min-h-[300px]">
              <img
                src={previewImageUrl}
                alt="Zoom Preview"
                className="max-h-[75vh] w-auto max-w-full object-contain rounded-lg shadow-sm"
              />
            </div>
            <div className="pt-3 flex justify-between items-center text-xs text-slate-400">
              <span>Klik di luar atau tombol silang untuk menutup</span>
              <a
                href={previewImageUrl}
                target="_blank"
                rel="noreferrer"
                className="text-[#1683FF] hover:underline flex items-center gap-1 font-semibold"
              >
                Buka Tab Baru <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      )}

      </div>
    </RoleGuard>
  );
}
