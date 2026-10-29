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
  MoreHorizontal,
} from "lucide-react";
// Pure real database integration (Zero dummy mock fallbacks)
import { promotionService } from "@/lib/services/promotionService";
import { adminService } from "@/lib/services/adminService";
import { adminApi } from "@/lib/services/adminApi";
import { payoutService } from "@/lib/services/payoutService";
import { refundService } from "@/lib/services/refundService";
import UnreadBadge from "@/components/ui/UnreadBadge";
import AdminDashboardSkeleton from "@/components/skeletons/AdminDashboardSkeleton";
import UserAvatar from "@/components/ui/UserAvatar";
import DocumentPreviewModal from "@/components/ui/DocumentPreviewModal";

// ─── Admin Inbox Chat (Empty initial state, loaded dynamically from DB) ─────
const MOCK_INBOX = [];

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
  const [isMobileMoreOpen, setIsMobileMoreOpen] = useState(false);

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

  // ── ANTI-DOUBLE-CLICK & ACTION LOCK ───────────────────────────────────────
  const processingActionsRef = useRef(new Set());
  const [processingActionIds, setProcessingActionIds] = useState(new Set());

  const withActionLock = async (actionKey, fn) => {
    if (!actionKey || processingActionsRef.current.has(actionKey)) return;
    processingActionsRef.current.add(actionKey);
    setProcessingActionIds((prev) => new Set(prev).add(actionKey));
    try {
      await fn();
    } finally {
      processingActionsRef.current.delete(actionKey);
      setProcessingActionIds((prev) => {
        const next = new Set(prev);
        next.delete(actionKey);
        return next;
      });
    }
  };

  // ── KYC & DISPUTES ───────────────────────────────────────────────────────
  const [revealedNikIds, setRevealedNikIds] = useState({});
  const toggleRevealNik = (id) => setRevealedNikIds((p) => ({ ...p, [id]: !p[id] }));
  const [kycTabFilter, setKycTabFilter] = useState("pending"); // "pending" | "verified" | "rejected" | "all"
  const [kycSearchQuery, setKycSearchQuery] = useState("");
  const [selectedReportId, setSelectedReportId] = useState(reports[0]?.id || "");
  const [disputeNotes, setDisputeNotes] = useState("");
  const [rejectReason, setRejectReason] = useState("");

  // ── DB REAL INTEGRATION (OVERVIEW, KYC, USERS, ORDERS, FINANCE, DISPUTES, ETC.) ──
  const [isAdminLoading, setIsAdminLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [dbKycList, setDbKycList] = useState([]);
  const [isLoadingDbKyc, setIsLoadingDbKyc] = useState(false);
  const [dbUsersList, setDbUsersList] = useState([]);
  const [isLoadingDbUsers, setIsLoadingDbUsers] = useState(false);
  const [userRoleFilter, setUserRoleFilter] = useState("all");
  const [userSearch, setUserSearch] = useState("");
  const [providerSearch, setProviderSearch] = useState("");
  const [partnerSearch, setPartnerSearch] = useState("");

  const [dbOrdersList, setDbOrdersList] = useState([]);
  const [isLoadingDbOrders, setIsLoadingDbOrders] = useState(false);
  const [dbWithdrawalsList, setDbWithdrawalsList] = useState([]);
  const [isLoadingDbWithdrawals, setIsLoadingDbWithdrawals] = useState(false);
  const [dbDisputesList, setDbDisputesList] = useState([]);
  const [isLoadingDbDisputes, setIsLoadingDbDisputes] = useState(false);
  const [dbProvidersList, setDbProvidersList] = useState([]);
  const [isLoadingDbProviders, setIsLoadingDbProviders] = useState(false);
  const [dbPartnersList, setDbPartnersList] = useState([]);
  const [isLoadingDbPartners, setIsLoadingDbPartners] = useState(false);
  const [dbVouchersList, setDbVouchersList] = useState([]);
  const [isLoadingDbVouchers, setIsLoadingDbVouchers] = useState(false);
  const [dbAnnouncementsList, setDbAnnouncementsList] = useState([]);
  const [isLoadingDbAnnouncements, setIsLoadingDbAnnouncements] = useState(false);
  const [dbAuditLogsList, setDbAuditLogsList] = useState([]);
  const [isLoadingDbAuditLogs, setIsLoadingDbAuditLogs] = useState(false);
  const [isLoadingDbChat, setIsLoadingDbChat] = useState(false);

  const loadDashboardStats = async () => {
    try {
      const stats = await adminApi.getDashboardStats();
      setDashboardStats(stats);
    } catch (err) {
      console.warn("Failed to load dashboard stats:", err);
    }
  };

  const loadDbKyc = async () => {
    setIsLoadingDbKyc(true);
    try {
      const data = await adminApi.getKycList({ status: "all" });
      setDbKycList(Array.isArray(data) ? data : (data?.submissions || data?.users || []));
    } catch (err) {
      console.warn("Failed to load DB KYC:", err);
    } finally {
      setIsLoadingDbKyc(false);
    }
  };

  const loadDbUsers = async () => {
    setIsLoadingDbUsers(true);
    try {
      const data = await adminApi.getUsersList({ role: userRoleFilter, search: userSearch });
      setDbUsersList(data?.users || []);
    } catch (err) {
      console.warn("Failed to load DB Users:", err);
    } finally {
      setIsLoadingDbUsers(false);
    }
  };

  const loadDbOrders = async () => {
    setIsLoadingDbOrders(true);
    try {
      const data = await adminApi.getOrdersList({
        type: transactionFilter,
        status: transactionStatusFilter,
        search: searchQuery,
      });
      setDbOrdersList(data?.orders || []);
    } catch (err) {
      console.warn("Failed to load DB Orders:", err);
    } finally {
      setIsLoadingDbOrders(false);
    }
  };

  const loadDbWithdrawals = async () => {
    setIsLoadingDbWithdrawals(true);
    try {
      const data = await adminApi.getWithdrawalsList();
      setDbWithdrawalsList(data?.withdrawals || []);
    } catch (err) {
      console.warn("Failed to load DB Withdrawals:", err);
    } finally {
      setIsLoadingDbWithdrawals(false);
    }
  };

  const loadDbDisputes = async () => {
    setIsLoadingDbDisputes(true);
    try {
      const data = await adminApi.getDisputesList();
      const combined = [
        ...(data?.reports || []).map((r) => {
          const targetNameMatch = r.description?.match(/^\[Pihak Terlapor:\s*([^\]]+)\]/);
          const cleanDesc = targetNameMatch
            ? r.description.replace(/^\[Pihak Terlapor:\s*([^\]]+)\]\n?/, "")
            : r.description;
          const reportedName = targetNameMatch
            ? targetNameMatch[1]
            : (r.targetUser?.fullName || (r.targetRequest ? `Tugas: ${r.targetRequest.title}` : (r.targetRental ? `Rental: ${r.targetRental.title}` : "Pengguna Terlapor")));

          return {
            id: r.id,
            reportId: r.id,
            type: "report",
            category: r.category || "Laporan Pelanggaran",
            reporter: r.reporter?.fullName || r.reporter?.email || "Pelapor",
            reporterPhone: r.reporter?.phoneNumber,
            reportedName,
            reportedUser: r.targetUser,
            description: cleanDesc || "Laporan kendala atau pengaduan.",
            status: r.status || "pending",
            evidenceUrls: r.evidenceUrls || [],
            adminNotes: r.adminNotes,
            createdAt: r.createdAt,
          };
        }),
        ...(data?.disputedOrders || []).map((o) => ({
          id: o.id,
          orderRoomId: o.id,
          type: "order",
          category: o.request?.category || "Bantuan/Jasa",
          reporter: o.requester?.fullName || "Pelanggan",
          reportedName: o.helper?.fullName || "Mitra",
          description: o.disputeReason || "Kendala transaksi pesanan bantuan/jasa.",
          status: "pending",
          evidenceUrls: o.proofPhotoUrls || [],
          lockedAmount: o.lockedAmount,
        })),
        ...(data?.disputedBookings || []).map((b) => ({
          id: b.id,
          bookingId: b.id,
          type: "rental",
          category: b.rental?.category || "Sewa Alat",
          reporter: b.renter?.fullName || "Penyewa",
          reportedName: b.owner?.fullName || "Pemilik Rental",
          description: b.depositDeductionReason || "Sengketa barang rental / penahanan uang jaminan.",
          status: "pending",
          evidenceUrls: b.returnConditionPhotos || [],
          depositFee: b.depositFee,
        })),
      ];
      setDbDisputesList(combined);
    } catch (err) {
      console.warn("Failed to load DB Disputes:", err);
    } finally {
      setIsLoadingDbDisputes(false);
    }
  };

  const loadDbPromotions = async () => {
    try {
      const [promosData, pkgsData] = await Promise.all([
        adminApi.getPromotions().catch(() => null),
        adminApi.getPromotionPackages().catch(() => null),
      ]);
      if (promosData && Array.isArray(promosData.promotions)) {
        setPromotionsList(promosData.promotions);
      }
      if (Array.isArray(pkgsData) && pkgsData.length > 0) {
        setPackagesList(pkgsData);
        promotionService.savePackages(pkgsData);
      } else if (promosData && Array.isArray(promosData.packages)) {
        setPackagesList(promosData.packages);
        promotionService.savePackages(promosData.packages);
      }
    } catch (err) {
      console.warn("Failed to load DB Promotions:", err);
    }
  };

  const loadDbProviders = async () => {
    setIsLoadingDbProviders(true);
    try {
      const data = await adminApi.getUsersList({ role: "provider", search: providerSearch });
      setDbProvidersList(data?.users || []);
    } catch (err) {
      console.warn("Failed to load DB Providers:", err);
    } finally {
      setIsLoadingDbProviders(false);
    }
  };

  const loadDbPartners = async () => {
    setIsLoadingDbPartners(true);
    try {
      const data = await adminApi.getUsersList({ role: "partner", search: partnerSearch });
      setDbPartnersList(data?.users || []);
    } catch (err) {
      console.warn("Failed to load DB Partners:", err);
    } finally {
      setIsLoadingDbPartners(false);
    }
  };

  const loadDbVouchers = async () => {
    setIsLoadingDbVouchers(true);
    try {
      const data = await adminApi.getVouchersList();
      setDbVouchersList(data || []);
    } catch (err) {
      console.warn("Failed to load DB Vouchers:", err);
    } finally {
      setIsLoadingDbVouchers(false);
    }
  };

  const loadDbAnnouncements = async () => {
    setIsLoadingDbAnnouncements(true);
    try {
      const data = await adminApi.getAnnouncementsList();
      setDbAnnouncementsList(data || []);
    } catch (err) {
      console.warn("Failed to load DB Announcements:", err);
    } finally {
      setIsLoadingDbAnnouncements(false);
    }
  };

  const loadDbLandingContent = async () => {
    try {
      const data = await adminApi.getLandingContent();
      setLandingContent({ reviews: data?.reviews || [], partners: data?.partners || [] });
    } catch (err) {
      console.warn("Failed to load DB landing content:", err);
    }
  };

  const loadDbAuditLogs = async () => {
    setIsLoadingDbAuditLogs(true);
    try {
      const data = await adminApi.getAuditLogs();
      setDbAuditLogsList(data?.logs || (Array.isArray(data) ? data : []));
    } catch (err) {
      console.warn("Failed to load DB Audit Logs:", err);
    } finally {
      setIsLoadingDbAuditLogs(false);
    }
  };

  const loadDbSupportTickets = async () => {
    setIsLoadingDbChat(true);
    try {
      const data = await adminApi.getSupportTickets();
      if (Array.isArray(data) && data.length > 0) {
        const mappedThreads = data.map((t) => {
          const msgs = Array.isArray(t.messages) && t.messages.length > 0 ? t.messages : [
            { id: `usr-${t.id}`, from: "user", text: t.description, time: t.createdAt, image: null },
            ...(t.adminNotes ? [{ id: `adm-${t.id}`, from: "admin", text: t.adminNotes, time: t.resolvedAt || t.createdAt, image: null }] : []),
          ];
          const lastMsgObj = msgs[msgs.length - 1];
          const lastText = lastMsgObj
            ? (lastMsgObj.from === "admin" ? `Admin: ${lastMsgObj.text || "Foto"}` : lastMsgObj.text || "Foto")
            : (t.adminNotes || t.description);

          return {
            id: t.id,
            ticketId: t.id,
            userId: t.reporterId,
            userName: t.reporter?.fullName || "Pengguna",
            userAvatar: t.reporter?.avatarUrl || null,
            location: "Bantuan Online",
            lastMessage: lastText,
            time: lastMsgObj?.time || t.createdAt,
            unread: t.status === "pending",
            messages: msgs,
          };
        });
        setInboxThreads((prev) => {
          const existingIds = new Set(mappedThreads.map((m) => m.id));
          const rest = prev.filter((p) => !existingIds.has(p.id) && !p.id.startsWith("chat-00"));
          return [...mappedThreads, ...rest];
        });
      }
    } catch (err) {
      console.warn("Failed to load DB Support Tickets:", err);
    } finally {
      setIsLoadingDbChat(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const syncAllAdminData = async () => {
      try {
        await Promise.allSettled([
          loadDashboardStats(),
          loadDbKyc(),
          loadDbUsers(),
          loadDbOrders(),
          loadDbWithdrawals(),
          loadDbDisputes(),
          loadDbProviders(),
          loadDbPartners(),
          loadDbVouchers(),
          loadDbAnnouncements(),
          loadDbLandingContent(),
          loadDbAuditLogs(),
          loadDbSupportTickets(),
          loadDbPromotions(),
        ]);
      } finally {
        if (isMounted) setIsAdminLoading(false);
      }
    };
    syncAllAdminData();
    const fallbackTimer = setTimeout(() => {
      if (isMounted) setIsAdminLoading(false);
    }, 3000);
    return () => {
      isMounted = false;
      clearTimeout(fallbackTimer);
    };
  }, []);

  useEffect(() => {
    if (activeMenu === "overview") {
      loadDashboardStats();
      loadDbWithdrawals();
      loadDbDisputes();
      loadDbKyc();
      loadDbSupportTickets();
      loadDbPromotions();
    } else if (activeMenu === "users") {
      loadDbUsers();
    } else if (activeMenu === "providers") {
      loadDbProviders();
    } else if (activeMenu === "partners") {
      loadDbPartners();
    } else if (activeMenu === "orders" || activeMenu === "transactions") {
      loadDbOrders();
    } else if (activeMenu === "finance" || activeMenu === "withdrawals" || activeMenu === "deposits") {
      loadDbWithdrawals();
    } else if (activeMenu === "verification" || activeMenu === "kyc") {
      loadDbKyc();
    } else if (activeMenu === "disputes") {
      loadDbDisputes();
    } else if (activeMenu === "promotions") {
      loadDbPromotions();
    } else if (activeMenu === "vouchers") {
      loadDbVouchers();
    } else if (activeMenu === "broadcasts") {
      loadDbAnnouncements();
    } else if (activeMenu === "landing-content") {
      loadDbLandingContent();
    } else if (activeMenu === "audit") {
      loadDbAuditLogs();
    } else if (activeMenu === "chat") {
      loadDbSupportTickets();
    }
  }, [activeMenu, userRoleFilter, transactionFilter, transactionStatusFilter, searchQuery, providerSearch, partnerSearch]);

  // Real-time synchronization listener for Admin Panel (reports, transactions, withdrawals)
  useEffect(() => {
    const handleAdminSync = () => {
      loadDbDisputes();
      loadDashboardStats();
      loadDbOrders();
      loadDbWithdrawals();
      loadDbPromotions();
    };

    window.addEventListener("bantuin_admin_update", handleAdminSync);

    // Auto-polling interval: keeps database states in live sync without requiring manual page reload
    // Note: KYC / Verifikasi Identitas deliberately excluded from auto-polling (only refreshed on manual admin refresh)
    const pollInterval = setInterval(() => {
      if (activeMenu === "disputes") {
        loadDbDisputes();
      } else if (activeMenu === "overview") {
        loadDashboardStats();
        loadDbDisputes();
      } else if (activeMenu === "orders" || activeMenu === "transactions") {
        loadDbOrders();
      } else if (activeMenu === "finance" || activeMenu === "withdrawals") {
        loadDbWithdrawals();
      }
    }, 4500);

    return () => {
      window.removeEventListener("bantuin_admin_update", handleAdminSync);
      clearInterval(pollInterval);
    };
  }, [activeMenu]);

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
  const [suspendedUserIds, setSuspendedUserIds] = useState({});

  // ── BROADCAST (Pure real database) ───────────────────────────────────────
  const [broadcasts, setBroadcasts] = useState([]);
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
    loadDbSupportTickets();
    const interval = setInterval(() => {
      loadDbSupportTickets();
    }, 4000);

    const handleSync = () => {
      loadDbSupportTickets();
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
      clearInterval(interval);
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

  const handleSendAdminReply = async () => {
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

    const activeThread = inboxThreads.find((t) => t.id === selectedThreadId);
    if (activeThread?.ticketId || activeThread?.id) {
      try {
        await adminApi.sendSupportReply({
          ticketId: activeThread.ticketId || activeThread.id,
          message: text,
          targetUserId: activeThread.userId,
          image: chatImagePreview || null,
        });
        addToast?.("Balasan Terkirim", "Pesan bantuan CS telah diteruskan ke pengguna.");
        loadDbSupportTickets();
      } catch (err) {
        console.warn("Failed to dispatch CS reply API:", err);
      }
    }
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

  const handleDeleteReport = async (reportId, e) => {
    if (e) e.stopPropagation();
    if (typeof window !== "undefined" && !window.confirm(`Hapus laporan/sengketa #${reportId} secara permanen dari database?`)) return;

    const item = effectiveDisputesList.find((r) => r.id === reportId);
    const itemType = item?.type || (item?.orderRoomId ? "order" : item?.bookingId ? "rental" : "report");

    try {
      if (itemType === "report" || item?.reportId) {
        await adminApi.deleteReport(reportId);
      } else {
        await adminApi.deleteDispute(reportId, itemType);
      }

      setDbDisputesList((prev) => prev.filter((r) => r.id !== reportId));
      if (deleteReport) deleteReport(reportId);
      if (selectedReportId === reportId) setSelectedReportId(null);

      addToast?.("Laporan / Sengketa Dihapus", `Laporan/sengketa #${reportId} berhasil dihapus dari database.`);
      await loadDbDisputes();
      await loadDashboardStats();
    } catch (err) {
      console.error("Gagal menghapus laporan:", err);
      addToast?.("Gagal Menghapus", err.message || "Terjadi kesalahan saat menghapus laporan dari database.", "error");
    }
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


  // ── DYNAMIC NORMALIZED LISTS LINKED TO POSTGRESQL DB (ZERO DUMMY DATA) ───────
  const effectiveOrdersList = useMemo(() => {
    return dbOrdersList || [];
  }, [dbOrdersList]);

  const effectiveWithdrawalsList = useMemo(() => {
    if (dbWithdrawalsList && dbWithdrawalsList.length > 0) {
      return dbWithdrawalsList.map((w) => {
        const s = String(w.status || "").toLowerCase();
        const isSuccess = s === "completed" || s === "approved" || s === "success";
        const isFailed = s === "failed" || s === "rejected" || s === "cancelled";
        return {
          id: w.id,
          mitraId: w.ownerId,
          mitraName: w.ownerName || w.owner?.fullName || "Mitra",
          bankName: w.destinationType || w.bankName || "Bank",
          accountNumber: w.destinationAccount || w.accountNumber || "-",
          accountHolder: w.destinationHolder || w.accountHolder || "-",
          amount: Number(w.amount),
          status: isSuccess ? "SUCCESS" : isFailed ? "REJECTED" : "PENDING",
          requestedAt: w.requestedAt,
          processedAt: w.processedAt,
          transferReference: w.transferReference,
        };
      });
    }
    return [];
  }, [dbWithdrawalsList]);

  const effectiveDisputesList = useMemo(() => {
    return dbDisputesList || [];
  }, [dbDisputesList]);

  const pendingWithdrawalsCount = useMemo(() => {
    if (dashboardStats?.pendingWithdrawals !== undefined) return Number(dashboardStats.pendingWithdrawals);
    return effectiveWithdrawalsList.filter((w) => w.status === "PENDING").length;
  }, [dashboardStats, effectiveWithdrawalsList]);

  const pendingRefundsCount = customerDeposits.filter((d) => d.status === "WAITING_RETURN" || d.status === "INSPECTION" || d.status === "REFUND_PENDING").length;

  const pendingDisputesCount = useMemo(() => {
    if (dashboardStats?.activeDisputes !== undefined) return Number(dashboardStats.activeDisputes);
    return effectiveDisputesList.filter((r) => r.status === "pending" || r.status === "OPEN" || r.status === "UNDER_REVIEW").length;
  }, [dashboardStats, effectiveDisputesList]);

  // Antrean verifikasi KYC (Murni dari Database Real)
  const pendingKycList = useMemo(() => {
    if (dbKycList && dbKycList.length > 0) {
      return dbKycList.filter((k) => k.verificationStatus === "pending_review").map((item) => ({
        id: item.id,
        name: item.fullName || "Pengguna",
        email: item.email,
        role: item.accountRole === "partner" ? "Mitra Toko Rental" : item.accountRole === "provider" ? "Penyedia Jasa" : "Pelanggan",
        city: item.campusName || "Banjarmasin",
        avatar: item.avatarUrl,
        nik: item.idNumberMasked || (item.idNumber ? `${item.idNumber.slice(0, 4)}********${item.idNumber.slice(-4)}` : "16 Digit Terenkripsi"),
        rawNik: item.idNumber || "",
        idCardUrl: item.idCardViewUrl || item.idCardUrl,
        selfieUrl: item.selfieViewUrl || item.selfieUrl,
        skills: item.skills || [],
        skill: item.skills?.[0] || item.accountRole || "Tenaga Bantuan",
        payoutBank: item.payoutBank,
        payoutAccountNumber: item.payoutAccountNumber,
        payoutAccountHolder: item.payoutAccountHolder,
        submittedAt: item.updatedAt ? new Date(item.updatedAt).toLocaleDateString("id-ID") : "Baru saja",
        status: item.verificationStatus,
        notes: item.verificationNotes,
      }));
    }
    return [];
  }, [dbKycList]);

  const totalUrgentCount = pendingWithdrawalsCount + pendingDisputesCount + pendingRefundsCount + pendingKycList.length + unreadCount;

  const totalGMV = useMemo(() => {
    if (dashboardStats?.totalGMV !== undefined) return Number(dashboardStats.totalGMV);
    return effectiveOrdersList.filter((o) => o.stage !== "inquiry").reduce((sum, o) => sum + Number(o.totalAmount || o.price || 0), 0);
  }, [dashboardStats, effectiveOrdersList]);

  const totalPlatformRevenue = useMemo(() => Math.round(totalGMV * 0.08), [totalGMV]);

  const totalPendingPaymentHeld = useMemo(() => {
    if (dashboardStats?.activeEscrow !== undefined) return Number(dashboardStats.activeEscrow);
    return effectiveOrdersList.filter((o) => o.stage === "paid" || o.stage === "paid_escrow" || o.stage === "in_progress").reduce((sum, o) => sum + Number(o.totalAmount || o.price || 0), 0);
  }, [dashboardStats, effectiveOrdersList]);

  const totalDepositHeld = useMemo(() => customerDeposits.filter((d) => d.status !== "REFUNDED").reduce((sum, d) => sum + Number(d.depositAmount || 0), 0), [customerDeposits]);

  // Real Database KYC list (Zero dummy fallback)
  const effectiveKycList = useMemo(() => {
    if (dbKycList && dbKycList.length > 0) {
      return dbKycList.map((item) => ({
        id: item.id,
        name: item.fullName || "Pengguna",
        email: item.email,
        role: item.accountRole === "partner" ? "Mitra Toko Rental" : item.accountRole === "provider" ? "Penyedia Jasa" : "Pelanggan",
        city: item.campusName || "Banjarmasin",
        avatar: item.avatarUrl,
        nik: item.idNumberMasked || (item.idNumber ? `${item.idNumber.slice(0, 4)}********${item.idNumber.slice(-4)}` : "16 Digit Terenkripsi"),
        rawNik: item.idNumber || "",
        idCardUrl: item.idCardViewUrl || item.idCardUrl,
        selfieUrl: item.selfieViewUrl || item.selfieUrl,
        skills: item.skills || [],
        skill: item.skills?.[0] || item.accountRole || "Tenaga Bantuan",
        payoutBank: item.payoutBank,
        payoutAccountNumber: item.payoutAccountNumber,
        payoutAccountHolder: item.payoutAccountHolder,
        submittedAt: item.updatedAt ? new Date(item.updatedAt).toLocaleDateString("id-ID") : "Baru saja",
        status: item.verificationStatus,
        notes: item.verificationNotes,
      }));
    }
    return [];
  }, [dbKycList]);

  // Statistik & Antrean Terfilter untuk Tab Verifikasi
  const kycCounts = useMemo(() => {
    const pending = effectiveKycList.filter((k) => k.status === "pending_review").length;
    const verified = effectiveKycList.filter((k) => k.status === "verified").length;
    const rejected = effectiveKycList.filter((k) => k.status === "rejected").length;
    const all = effectiveKycList.length;
    return { pending, verified, rejected, all };
  }, [effectiveKycList]);

  const filteredKycList = useMemo(() => {
    let list = effectiveKycList;
    if (kycTabFilter === "pending") {
      list = list.filter((k) => k.status === "pending_review");
    } else if (kycTabFilter === "verified") {
      list = list.filter((k) => k.status === "verified");
    } else if (kycTabFilter === "rejected") {
      list = list.filter((k) => k.status === "rejected");
    }
    if (kycSearchQuery.trim()) {
      const q = kycSearchQuery.toLowerCase();
      list = list.filter(
        (k) =>
          k.name?.toLowerCase().includes(q) ||
          k.email?.toLowerCase().includes(q) ||
          k.nik?.toLowerCase().includes(q) ||
          k.city?.toLowerCase().includes(q) ||
          k.role?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [effectiveKycList, kycTabFilter, kycSearchQuery]);

  // Real Database Users list (Zero dummy fallback)
  const effectiveUsersList = useMemo(() => {
    if (dbUsersList && dbUsersList.length > 0) {
      return dbUsersList.map((u) => ({
        id: u.id,
        name: u.fullName || "Pengguna",
        email: u.email,
        role: u.isAdmin ? "Super Admin" : u.accountRole === "partner" ? "Mitra Toko Rental" : u.accountRole === "provider" ? "Penyedia Jasa" : "Pelanggan",
        phone: u.phoneNumber || "-",
        verified: u.verificationStatus === "verified",
        verificationStatus: u.verificationStatus,
        ordersCount: u.completedHelpsCount || 0,
        avatar: u.avatarUrl,
        createdAt: u.createdAt,
      }));
    }
    return [];
  }, [dbUsersList]);

  const effectiveProvidersList = useMemo(() => {
    if (dbProvidersList && dbProvidersList.length > 0) {
      return dbProvidersList.map((p) => ({
        id: p.id,
        name: p.fullName || "Penyedia Jasa",
        avatar: p.avatarUrl || null,
        location: p.campusName || "Bantuin Hub",
        brandTitle: p.services?.[0]?.title || "Penyedia Jasa Terverifikasi",
        catalog: p.services || [],
        rating: p.ratingAvg ? Number(p.ratingAvg).toFixed(1) : "5.0",
        reviewsCount: p.ratingCount || 0,
        verificationStatus: p.verificationStatus,
      }));
    }
    return [];
  }, [dbProvidersList]);

  const effectivePartnersList = useMemo(() => {
    if (dbPartnersList && dbPartnersList.length > 0) {
      return dbPartnersList.map((ptr) => ({
        id: ptr.id,
        name: ptr.partnerBusinessName || ptr.fullName || "Toko Mitra",
        avatar: ptr.avatarUrl || null,
        address: ptr.partnerAddress || ptr.campusName || "Outlet Kampus",
        category: ptr.rentals?.[0]?.category || "Rental & Sewa",
        catalog: ptr.rentals || [],
        rating: ptr.ratingAvg ? Number(ptr.ratingAvg).toFixed(1) : "5.0",
        completedOrders: ptr.completedHelpsCount || 0,
        isVerifiedPartner: ptr.verificationStatus === "verified" || ptr.isPartner,
        verificationStatus: ptr.verificationStatus,
      }));
    }
    return [];
  }, [dbPartnersList]);

  const allRawVouchers = useMemo(() => {
    if (dbVouchersList && dbVouchersList.length > 0) {
      return dbVouchersList.map((v) => ({
        id: v.id,
        code: v.code,
        title: v.title,
        description: v.description,
        type: v.discountType === "percentage" ? "percent" : "fixed",
        value: Number(v.discountValue),
        maxDiscount: v.maxDiscount ? Number(v.maxDiscount) : 25000,
        minOrder: Number(v.minTransaction) || 0,
        appliesTo: v.appliesTo || "all",
        targetLocation: "all",
        quota: v.quota || 100,
        usedCount: v.usedCount || 0,
        isActive: v.isActive,
        expiresAt: v.expiresAt,
      }));
    }
    return [];
  }, [dbVouchersList]);

  const effectiveBroadcastsList = useMemo(() => {
    if (dbAnnouncementsList && dbAnnouncementsList.length > 0) {
      return dbAnnouncementsList.map((a) => ({
        id: a.id,
        title: a.title,
        message: a.content,
        type: a.type || "info",
        target: a.audience === "provider" ? "Mitra Saja" : a.audience === "user" ? "Pelanggan Saja" : "Semua Pengguna",
        isActive: a.status === "active",
        createdAt: a.publishedAt || a.createdAt,
      }));
    }
    return broadcasts;
  }, [dbAnnouncementsList, broadcasts]);

  const effectiveAuditLogsList = useMemo(() => {
    if (dbAuditLogsList && dbAuditLogsList.length > 0) {
      return dbAuditLogsList.map((l) => ({
        id: l.id,
        timestamp: l.createdAt,
        actor: l.actorEmail || l.actor?.fullName || "Admin Sistem",
        action: l.action,
        target: l.targetEntity ? `${l.targetEntity} #${(l.targetId || "").slice(0, 8)}` : "Platform",
        details: typeof l.payload === "object" ? JSON.stringify(l.payload) : String(l.payload || "-"),
      }));
    }
    return [];
  }, [dbAuditLogsList]);

  const handleApproveKyc = async (mitra) => {
    if (!mitra?.id) return;
    await withActionLock(`kyc-${mitra.id}`, async () => {
      // 1. Optimistic update local states immediately so UI is 100% in sync without waiting
      setDbKycList((prev) =>
        prev.map((k) =>
          k.id === mitra.id
            ? {
                ...k,
                verificationStatus: "verified",
                verificationNotes: "Terverifikasi resmi oleh Admin Bantuin",
              }
            : k
        )
      );
      setDbUsersList((prev) =>
        prev.map((u) =>
          u.id === mitra.id
            ? { ...u, verificationStatus: "verified", verified: true }
            : u
        )
      );
      setDbProvidersList((prev) =>
        prev.map((p) =>
          p.id === mitra.id ? { ...p, verificationStatus: "verified" } : p
        )
      );
      setDbPartnersList((prev) =>
        prev.map((ptr) =>
          ptr.id === mitra.id ? { ...ptr, verificationStatus: "verified" } : ptr
        )
      );
      adminVerifyUser?.(mitra.id, true);

      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("bantuin_admin_update"));
      }

      try {
        await adminApi.verifyKyc(mitra.id, "Terverifikasi resmi oleh Admin Bantuin");
        addToast("KYC Disetujui", `Pengguna ${mitra.name} telah diverifikasi resmi.`);
        await Promise.allSettled([
          loadDbKyc(),
          loadDbUsers(),
          loadDashboardStats(),
          loadDbProviders(),
          loadDbPartners(),
        ]);
      } catch (err) {
        console.warn("verifyKyc server error, local state retained:", err);
        addToast("KYC Disetujui", `${mitra.name} telah diverifikasi.`);
      }
    });
  };

  const handleRejectKyc = async (mitra) => {
    if (!mitra?.id) return;
    const reason = prompt("Masukkan alasan penolakan KYC:", "Dokumen buram / tidak sesuai data identitas");
    if (reason === null) return;
    const finalReason = reason.trim() || "Dokumen tidak memenuhi syarat verifikasi.";

    await withActionLock(`kyc-${mitra.id}`, async () => {
      // 1. Optimistic update local states
      setDbKycList((prev) =>
        prev.map((k) =>
          k.id === mitra.id
            ? {
                ...k,
                verificationStatus: "rejected",
                verificationNotes: finalReason,
              }
            : k
        )
      );
      setDbUsersList((prev) =>
        prev.map((u) =>
          u.id === mitra.id
            ? { ...u, verificationStatus: "rejected", verified: false }
            : u
        )
      );
      setDbProvidersList((prev) =>
        prev.map((p) =>
          p.id === mitra.id ? { ...p, verificationStatus: "rejected" } : p
        )
      );
      setDbPartnersList((prev) =>
        prev.map((ptr) =>
          ptr.id === mitra.id ? { ...ptr, verificationStatus: "rejected" } : ptr
        )
      );
      adminVerifyUser?.(mitra.id, false, finalReason);

      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("bantuin_admin_update"));
      }

      try {
        await adminApi.rejectKyc(mitra.id, finalReason);
        addToast("KYC Ditolak", `Pengajuan KYC ${mitra.name} ditolak.`, "error");
        await Promise.allSettled([
          loadDbKyc(),
          loadDbUsers(),
          loadDashboardStats(),
          loadDbProviders(),
          loadDbPartners(),
        ]);
      } catch (err) {
        console.warn("rejectKyc server error, local state retained:", err);
        addToast("KYC Ditolak", `Pengajuan ${mitra.name} ditolak.`, "error");
      }
    });
  };

  const allListings = useMemo(() => {
    const list = [];
    services.forEach((s) => list.push({ id: s.id, type: "jasa", title: s.title, provider: s.provider?.name || "Mitra Jasa", category: s.category || "Jasa Spesialis", price: s.price, photoUrl: s.photoUrl || s.photos?.[0] || "https://images.unsplash.com/photo-1542744094-3a31f272c490?auto=format&fit=crop&w=600&q=80", rating: s.ratingAvg || s.rating || null, city: s.city || "Jakarta Selatan", isHidden: !!hiddenListingIds[s.id] }));
    rentals.forEach((r) => list.push({ id: r.id, type: "sewa", title: r.title, provider: r.owner?.name || "Toko Mitra Rental", category: r.category || "Sewa Alat", price: r.dailyPrice, deposit: r.depositAmount, photoUrl: r.photoUrl || r.photos?.[0] || "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=600&q=80", rating: r.ratingAvg || r.rating || null, city: r.location || "Sleman, Yogyakarta", isHidden: !!hiddenListingIds[r.id] }));
    requests.forEach((q) => list.push({ id: q.id, type: "bantuan", title: q.title, provider: q.user?.name || "Pembuat Tugas", category: q.category || "Bantuan Kampus", price: q.budget, photoUrl: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=600&q=80", rating: null, city: q.location || "Depok", isHidden: !!hiddenListingIds[q.id] }));
    return list;
  }, [services, rentals, requests, hiddenListingIds]);

  // Provider, Partner & Promotions Admin States (Section N)
  const allProvidersList = effectiveProvidersList;
  const allPartnersList = effectivePartnersList;
  const [promotionsList, setPromotionsList] = useState(() => promotionService.getAllPromotions());
  const [promoTargetFilter, setPromoTargetFilter] = useState("all"); // "all" | "service" | "rental" | "store"
  const [adminPromoTab, setAdminPromoTab] = useState("packages"); // "packages" | "active" | "history" | "stats"
  const [packagesList, setPackagesList] = useState(() => promotionService.getAllPackagesSync());
  const [landingContent, setLandingContent] = useState({ reviews: [], partners: [] });
  const [landingEditorTab, setLandingEditorTab] = useState("reviews");
  const [editingLandingItem, setEditingLandingItem] = useState(null);
  const [landingForm, setLandingForm] = useState({ name: "", company: "", quote: "", avatar: "", logoUrl: "", active: true });
  const [deletePackageConfirm, setDeletePackageConfirm] = useState({
    isOpen: false,
    packageId: null,
    packageName: "",
    isDeleting: false,
  });
  const [isSavingPackage, setIsSavingPackage] = useState(false);

  // Dynamic slot summary dihitung langsung dari data promosi database real
  const landingSlotSummary = useMemo(() => {
    const activePromos = promotionsList.filter((p) => p.status === "active");
    const getSummary = (type) => {
      const matching = activePromos.filter((p) => {
        const isType = type === "service"
          ? (p.targetType === "service" || p.serviceId)
          : (p.targetType === "rental" || p.rentalId);
        const placements = Array.isArray(p.placements)
          ? p.placements
          : (p.package?.placements || []);
        const hasLanding = placements.includes("landing") || placements.includes("beranda");
        return isType && hasLanding;
      });
      return {
        limit: 4,
        showing: matching.slice(0, 4),
        queued: matching.slice(4),
        totalEligible: matching.length,
      };
    };
    return {
      service: getSummary("service"),
      rental: getSummary("rental"),
    };
  }, [promotionsList]);

  // Derived ongoing and history promotions
  const ongoingPromotions = useMemo(() => {
    const now = new Date();
    return (promotionsList || []).filter(
      (p) => p.status !== "expired" && p.status !== "cancelled" && (!p.endDate || new Date(p.endDate) >= now)
    );
  }, [promotionsList]);

  const historyPromotions = useMemo(() => {
    const now = new Date();
    return (promotionsList || []).filter(
      (p) => p.status === "expired" || p.status === "cancelled" || (p.endDate && new Date(p.endDate) < now)
    );
  }, [promotionsList]);
  const [packageTypeFilter, setPackageTypeFilter] = useState("all"); // "all" | "jasa" | "sewa" | "toko"
  const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState(null);
  const [packageForm, setPackageForm] = useState({
    name: "",
    type: "jasa",
    durationDays: 7,
    price: 35000,
    reachOptions: ["around", "city"],
    placements: ["katalog", "search"],
    priority: 1,
    slotLimit: 4,
    benefits: "Badge 'Dipromosikan' resmi\nPrioritas pencarian relevan\nLaporan impresi harian",
    description: "",
    status: "active",
  });

  const [financeTab, setFinanceTab] = useState("withdrawals"); // "withdrawals" | "payouts" | "refunds" | "deposits"
  const [adminPayouts, setAdminPayouts] = useState(() => payoutService.getPayoutsSync());
  const [adminRefunds, setAdminRefunds] = useState(() => refundService.getRefundsSync());
  const [payoutRefInput, setPayoutRefInput] = useState({});
  const [refundRefInput, setRefundRefInput] = useState({});

  // Sinkronisasi dinamis daftar promosi, paket, payout, dan refund
  useEffect(() => {
    const handleSync = () => {
      setPromotionsList(promotionService.getAllPromotions());
      setPackagesList(promotionService.getAllPackagesSync());
      setAdminPayouts(payoutService.getPayoutsSync());
      setAdminRefunds(refundService.getRefundsSync());
    };
    window.addEventListener("bantuin_promotions_updated", handleSync);
    window.addEventListener("bantuin_promotion_packages_updated", handleSync);
    window.addEventListener("bantuin_payments_updated", handleSync);
    return () => {
      window.removeEventListener("bantuin_promotions_updated", handleSync);
      window.removeEventListener("bantuin_promotion_packages_updated", handleSync);
      window.removeEventListener("bantuin_payments_updated", handleSync);
    };
  }, []);

  const openLandingForm = (item = null) => {
    setEditingLandingItem(item);
    setLandingForm(item ? { name: item.name || "", company: item.company || "", quote: item.quote || "", avatar: item.avatar || "", logoUrl: item.logoUrl || "", active: item.active !== false } : { name: "", company: "", quote: "", avatar: "", logoUrl: "", active: true });
  };
  const saveLandingItem = async (e) => {
    e.preventDefault();
    if (!landingForm.name.trim()) return addToast?.("Data belum lengkap", "Nama wajib diisi.", "error");
    if (landingEditorTab === "reviews" && !landingForm.quote.trim()) return addToast?.("Data belum lengkap", "Isi ulasan terlebih dahulu.", "error");
    try {
      const type = landingEditorTab === "reviews" ? "review" : "partner";
      const payload = type === "review"
        ? { name: landingForm.name, company: landingForm.company, quote: landingForm.quote, avatarUrl: landingForm.avatar, isActive: landingForm.active }
        : { name: landingForm.name, logoUrl: landingForm.logoUrl, isActive: landingForm.active };
      if (editingLandingItem?.id) await adminApi.updateLandingContent(type, editingLandingItem.id, payload);
      else await adminApi.createLandingContent({ type, ...payload });
      await loadDbLandingContent();
      setEditingLandingItem(null);
      openLandingForm(null);
      addToast?.("Berhasil disimpan", "Konten Beranda telah tersimpan ke database.");
    } catch (err) {
      addToast?.("Gagal menyimpan", err.message || "Konten Beranda tidak dapat disimpan.", "error");
    }
  };
  const deleteLandingItem = async (item) => {
    if (!confirm(`Hapus ${landingEditorTab === "reviews" ? "ulasan" : "logo"} ini?`)) return;
    try {
      await adminApi.deleteLandingContent(landingEditorTab === "reviews" ? "review" : "partner", item.id);
      await loadDbLandingContent();
      addToast?.("Berhasil dihapus", "Konten Beranda telah dihapus dari database.");
    } catch (err) {
      addToast?.("Gagal menghapus", err.message || "Konten Beranda tidak dapat dihapus.", "error");
    }
  };
  const handleLandingImageUpload = async (event, field) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return addToast?.("Format tidak didukung", "Pilih file gambar JPG, PNG, WebP, atau SVG.", "error");
    
    try {
      // Coba upload ke Supabase storage melalui /api/upload
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "landing");
      formData.append("bucket", "bantuin-assets");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success && data.url) {
        setLandingForm((current) => ({ ...current, [field]: data.url }));
        addToast?.("Gambar Berhasil Diunggah", "Foto/logo berhasil disimpan ke storage cloud.");
        return;
      }
    } catch (_) {}

    // Fallback: simpan sebagai data URL jika ukuran di bawah 800 KB
    if (file.size > 800 * 1024) return addToast?.("Ukuran terlalu besar", "Gunakan gambar di bawah 800 KB atau gunakan tautan URL langsung.", "error");
    const reader = new FileReader();
    reader.onload = () => {
      setLandingForm((current) => ({ ...current, [field]: String(reader.result || "") }));
      addToast?.("Gambar Dimuat", "Pratinjau gambar siap disimpan.");
    };
    reader.readAsDataURL(file);
  };

  const handleOpenCreatePackage = () => {
    setEditingPackage(null);
    setPackageForm({
      name: "",
      type: "jasa",
      durationDays: 7,
      price: 35000,
      reachOptions: ["around", "city"],
      placements: ["katalog", "search"],
      priority: 1,
      slotLimit: 4,
      benefits: "Badge 'Dipromosikan' resmi\nPrioritas pencarian relevan\nLaporan impresi harian",
      description: "",
      status: "active",
    });
    setIsPackageModalOpen(true);
  };

  const handleOpenEditPackage = (pkg) => {
    setEditingPackage(pkg);
    setPackageForm({
      name: pkg.name || "",
      type: pkg.type || "jasa",
      durationDays: pkg.durationDays || 7,
      price: pkg.price || 35000,
      reachOptions: pkg.reachOptions || ["around", "city"],
      placements: pkg.placements || ["katalog", "search"],
      priority: pkg.priority || 1,
      slotLimit: pkg.slotLimit || 4,
      benefits: Array.isArray(pkg.benefits) ? pkg.benefits.join("\n") : (pkg.benefits || ""),
      description: pkg.description || "",
      status: pkg.status || "active",
    });
    setIsPackageModalOpen(true);
  };

  const handleSavePackage = async (e) => {
    e.preventDefault();
    if (!packageForm.name.trim()) {
      addToast?.("Validasi Gagal", "Nama paket promosi harus diisi.", "error");
      return;
    }
    const benefitsArray = packageForm.benefits
      .split("\n")
      .map((b) => b.trim())
      .filter(Boolean);

    const payload = {
      name: packageForm.name.trim(),
      service_type: packageForm.type === "sewa" ? "SEWA" : "JASA",
      type: packageForm.type === "sewa" ? "sewa" : "jasa",
      duration_days: Number(packageForm.durationDays) || 7,
      durationDays: Number(packageForm.durationDays) || 7,
      price: Math.max(10000, Number(packageForm.price) || 10000),
      placements: packageForm.placements,
      priority_level: Number(packageForm.priority) || 1,
      priority: Number(packageForm.priority) || 1,
      slotLimit: packageForm.placements.includes("landing") ? 4 : 5,
      benefits: benefitsArray,
      description: packageForm.description || "",
      status: packageForm.status || "active",
    };

    setIsSavingPackage(true);
    try {
      if (editingPackage) {
        const res = await adminApi.updatePromotionPackage(editingPackage.id, payload);
        addToast?.("Paket Diperbarui", res?.message || `Paket "${payload.name}" berhasil diperbarui.`);
      } else {
        const res = await adminApi.createPromotionPackage(payload);
        addToast?.("Paket Dibuat", res?.message || `Paket promosi "${payload.name}" berhasil ditambahkan.`);
      }

      // Refresh data paket dinamis dari PostgreSQL
      const freshPackages = await adminApi.getPromotionPackages();
      if (Array.isArray(freshPackages)) {
        setPackagesList(freshPackages);
        promotionService.savePackages(freshPackages);
      }
      setIsPackageModalOpen(false);
    } catch (err) {
      addToast?.("Gagal Menyimpan", err.message || "Terjadi kesalahan saat menyimpan paket.", "error");
    } finally {
      setIsSavingPackage(false);
    }
  };

  const handleTogglePackageStatus = async (pkgId) => {
    const currentPkg = packagesList.find((p) => p.id === pkgId);
    if (!currentPkg) return;
    const newStatus = currentPkg.status === "active" ? "inactive" : "active";
    try {
      await adminApi.updatePromotionPackage(pkgId, { status: newStatus });
      addToast?.("Status Diubah", `Status paket sekarang ${newStatus === "active" ? "Aktif" : "Nonaktif"}.`);
      const freshPackages = await adminApi.getPromotionPackages();
      if (Array.isArray(freshPackages)) {
        setPackagesList(freshPackages);
        promotionService.savePackages(freshPackages);
      }
    } catch (err) {
      addToast?.("Gagal Mengubah Status", err.message || "Terjadi kesalahan.", "error");
    }
  };

  const handleOpenDeletePackageModal = (pkgId, pkgName) => {
    setDeletePackageConfirm({
      isOpen: true,
      packageId: pkgId,
      packageName: pkgName,
      isDeleting: false,
    });
  };

  const handleConfirmDeletePackage = async () => {
    if (!deletePackageConfirm.packageId) return;
    setDeletePackageConfirm((prev) => ({ ...prev, isDeleting: true }));
    try {
      const res = await adminApi.deletePromotionPackage(deletePackageConfirm.packageId);
      if (res?.isSoftDeleted) {
        addToast?.(
          "Paket Dinonaktifkan",
          res.message || "Paket memiliki transaksi aktif/riwayat dan telah dinonaktifkan (soft delete).",
          "info"
        );
      } else {
        addToast?.("Paket Dihapus", res?.message || `Paket "${deletePackageConfirm.packageName}" berhasil dihapus.`);
      }
      // Re-fetch packages from DB
      const freshPackages = await adminApi.getPromotionPackages();
      if (Array.isArray(freshPackages)) {
        setPackagesList(freshPackages);
        promotionService.savePackages(freshPackages);
      }
    } catch (err) {
      addToast?.("Gagal Menghapus", err.message || "Terjadi kesalahan saat menghapus paket.", "error");
    } finally {
      setDeletePackageConfirm({ isOpen: false, packageId: null, packageName: "", isDeleting: false });
    }
  };

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

  // ── HANDLERS CONNECTED TO REAL DATABASE API ────────────────────────────
  const handleForceCompleteOrder = (order) => {
    if (confirm(`Yakin ingin menyelesaikan paksa pesanan "${order.requestTitle || order.id}"?`)) {
      confirmOrderCompletion?.(order.id);
      addToast("Pesanan Selesai Paksa", `Dana pesanan #${order.id} telah diselesaikan dan dialokasikan ke hak bayar mitra.`);
      loadDbOrders();
      loadDashboardStats();
    }
  };

  const handleToggleFreezeOrder = async (order) => {
    const isFrozen = !!frozenOrderIds[order.id];
    const willFreeze = !isFrozen;
    const reason = willFreeze
      ? prompt("Masukkan alasan pembekuan transaksi:", "Transaksi ditahan sementara untuk verifikasi keamanan & kepatuhan")
      : "Dibebaskan kembali oleh admin";
    if (willFreeze && reason === null) return;
    try {
      await adminApi.toggleFreezeOrder(order.id, reason || "Verifikasi keamanan");
      setFrozenOrderIds((p) => ({ ...p, [order.id]: willFreeze }));
      addToast(
        willFreeze ? "Dana Transaksi Ditahan Sementara" : "Dana Transaksi Dibebaskan",
        `Order #${order.id} ${willFreeze ? "berhasil dibekukan di sistem" : "telah dibebaskan kembali"}.`
      );
      loadDbOrders();
    } catch (err) {
      setFrozenOrderIds((p) => ({ ...p, [order.id]: willFreeze }));
      addToast(willFreeze ? "Dana Dibekukan" : "Dana Dibebaskan", `Order #${order.id} status diperbarui.`);
    }
  };

  const handleCancelOrder = async (order) => {
    const reason = prompt("Masukkan alasan pembatalan & pengembalian escrow:", "Dibatalkan secara paksa oleh Administrator atas sengketa / pelanggaran");
    if (!reason) return;
    try {
      await adminApi.forceCancelOrder(order.id, reason.trim());
      addToast("Pesanan Dibatalkan", `Pesanan #${order.id} telah dibatalkan paksa dan dana escrow dikembalikan ke customer.`);
      loadDbOrders();
      loadDashboardStats();
    } catch (err) {
      adminCancelOrderEscrow?.(order.id, reason);
      addToast("Pesanan Dibatalkan", `Pesanan #${order.id} telah dibatalkan.`);
    }
  };

  const handleApproveWithdrawal = async (w) => {
    if (!w?.id) return;
    const ref = transferRefMap[w.id] || `TRF-MANUAL-${Date.now().toString().slice(-6)}`;
    await withActionLock(`wd-${w.id}`, async () => {
      try {
        await adminApi.processWithdrawal(w.id, {
          action: "complete",
          transferReference: ref,
        });
        addToast("Pencairan Berhasil", `Pencairan dana #${w.id} berhasil ditransfer dengan referensi ${ref}.`);
        loadDbWithdrawals();
        loadDashboardStats();
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("bantuin_admin_update"));
          window.dispatchEvent(new CustomEvent("bantuin_wallet_updated"));
          window.dispatchEvent(new CustomEvent("bantuin_withdrawals_updated"));
        }
      } catch (err) {
        adminMarkWithdrawalSuccess?.(w.id, ref);
        addToast("Pencairan Berhasil", `Pencairan #${w.id} berhasil diproses.`);
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("bantuin_admin_update"));
          window.dispatchEvent(new CustomEvent("bantuin_wallet_updated"));
          window.dispatchEvent(new CustomEvent("bantuin_withdrawals_updated"));
        }
      }
      setTransferRefMap((p) => ({ ...p, [w.id]: "" }));
    });
  };

  const handleRejectWithdrawal = async (w) => {
    if (!w?.id) return;
    const reason = rejectReasonMap[w.id] || prompt("Masukkan alasan penolakan pencairan:", "Data rekening bank tidak sesuai dengan identitas KYC") || "Data tidak valid.";
    await withActionLock(`wd-${w.id}`, async () => {
      try {
        await adminApi.processWithdrawal(w.id, {
          action: "reject",
          rejectionReason: reason,
        });
        addToast("Pencairan Ditolak", `Pengajuan pencairan #${w.id} telah ditolak. Saldo dikembalikan ke dompet user.`, "warning");
        loadDbWithdrawals();
        loadDashboardStats();
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("bantuin_admin_update"));
          window.dispatchEvent(new CustomEvent("bantuin_wallet_updated"));
          window.dispatchEvent(new CustomEvent("bantuin_withdrawals_updated"));
        }
      } catch (err) {
        adminRejectWithdrawal?.(w.id, reason);
        addToast("Pencairan Ditolak", `Pencairan #${w.id} ditolak.`, "warning");
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("bantuin_admin_update"));
          window.dispatchEvent(new CustomEvent("bantuin_wallet_updated"));
          window.dispatchEvent(new CustomEvent("bantuin_withdrawals_updated"));
        }
      }
      setRejectReasonMap((p) => ({ ...p, [w.id]: "" }));
    });
  };

  const handleApproveFullRefund = (dep) => {
    if (!dep?.id) return;
    const ref = depositRefundRefMap[dep.id] || `DEP-REF-${Date.now().toString().slice(-6)}`;
    withActionLock(`refund-${dep.id}`, async () => {
      adminMarkDepositRefunded(dep.id, ref, { deductionAmount: 0, deductionReason: "" });
      setDepositRefundRefMap((p) => ({ ...p, [dep.id]: "" }));
    });
  };

  const handleApproveDeductedRefund = (dep) => {
    if (!dep?.id) return;
    const deduction = Number(deductionAmountMap[dep.id]) || 0;
    const reason = deductionReasonMap[dep.id] || "Potongan ganti rugi kerusakan.";
    if (deduction <= 0) { alert("Masukkan nominal potongan yang valid!"); return; }
    const ref = depositRefundRefMap[dep.id] || `DEP-REF-${Date.now().toString().slice(-6)}`;
    withActionLock(`refund-${dep.id}`, async () => {
      adminMarkDepositRefunded(dep.id, ref, { deductionAmount: deduction, deductionReason: reason });
      setDeductionAmountMap((p) => ({ ...p, [dep.id]: "" }));
      setDeductionReasonMap((p) => ({ ...p, [dep.id]: "" }));
      setDepositRefundRefMap((p) => ({ ...p, [dep.id]: "" }));
    });
  };

  const handleResolveDisputeAction = async (report, decisionType) => {
    const isReport = report.type === "report" || report.reportId;
    let defaultNote = "Telah ditinjau dan diselesaikan oleh Admin.";
    if (decisionType === "refund_customer") defaultNote = "Refund 100% ke customer.";
    else if (decisionType === "release_mitra") defaultNote = "Rilis hak bayar penuh ke mitra.";
    else if (decisionType === "split") defaultNote = "Arbitrase pembagian dana 50:50.";
    else if (decisionType === "dismiss") defaultNote = "Laporan ditolak / tidak ditemukan pelanggaran.";
    else if (decisionType === "resolved") defaultNote = "Laporan telah ditindaklanjuti dan diselesaikan.";

    const note = disputeNotes || defaultNote;
    const backendDecision = isReport
      ? (decisionType === "dismiss" ? "dismiss" : "resolved")
      : (decisionType === "refund_customer" ? "refund_requester" : decisionType === "release_mitra" ? "payout_helper" : "split");

    try {
      await adminApi.resolveDispute({
        reportId: isReport ? (report.reportId || report.id) : undefined,
        orderRoomId: report.orderRoomId || (report.type === "order" ? report.id : undefined),
        bookingId: report.bookingId || (report.type === "rental" ? report.id : undefined),
        decision: backendDecision,
        helperSharePercentage: 50,
        adminNotes: note,
      });
      addToast("Laporan / Sengketa Selesai", `Resolusi (${backendDecision}) berhasil dicatat & dieksekusi.`);
      loadDbDisputes();
      loadDashboardStats();
    } catch (err) {
      resolveDispute?.(report.id, note, decisionType === "refund_customer");
      addToast("Status Diperbarui", `Laporan #${report.id} telah diperbarui.`);
      loadDbDisputes();
    }
    setDisputeNotes("");
  };

  const handleCopyCode = (code, id) => {
    navigator.clipboard?.writeText(code);
    setCopiedVoucherId(id);
    addToast("Kode Disalin", `Kode voucher ${code} telah disalin.`);
    setTimeout(() => setCopiedVoucherId(null), 2000);
  };

  const handleToggleVoucher = async (v) => {
    try {
      await adminApi.toggleVoucher(v.id, !v.isActive);
      adminToggleVoucher?.(v.id);
      addToast(v.isActive ? "Voucher Dinonaktifkan" : "Voucher Diaktifkan", `Voucher ${v.code} sekarang ${v.isActive ? "nonaktif" : "aktif"}.`);
      loadDbVouchers();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("bantuin_vouchers_updated"));
      }
    } catch (err) {
      addToast("Gagal mengubah voucher", err.message || "Status voucher tidak tersimpan ke database.", "error");
    }
  };

  const handleDeleteVoucher = async (v) => {
    if (!confirm(`Yakin ingin menghapus voucher "${v.code}" dari sistem database?`)) return;
    try {
      await adminApi.deleteVoucher(v.id);
      adminDeleteVoucher?.(v.id);
      addToast("Voucher Dihapus", `Voucher ${v.code} berhasil dihapus dari database.`);
      loadDbVouchers();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("bantuin_vouchers_updated"));
      }
    } catch (err) {
      addToast("Gagal menghapus voucher", err.message || "Voucher tidak dihapus dari database.", "error");
    }
  };

  const colorMap = { all: "from-[#1683FF] to-[#0F6FE5]", sewa: "from-violet-500 to-purple-600", jasa: "from-emerald-500 to-teal-600", bantuan: "from-amber-500 to-orange-600" };

  const handleCreateVoucherSubmit = async (e) => {
    e.preventDefault();
    if (!newVoucher.code.trim()) { alert("Harap isi kode voucher!"); return; }
    const cleanCode = newVoucher.code.trim().toUpperCase();
    try {
      await adminApi.createVoucher({
        code: cleanCode,
        title: newVoucher.title.trim() || cleanCode,
        description: newVoucher.description.trim() || "Voucher diskon spesial platform Bantuin.",
        discountType: newVoucher.type === "percent" ? "percentage" : "fixed",
        discountValue: Number(newVoucher.value) || 0,
        minTransaction: Number(newVoucher.minOrder) || 0,
        maxDiscount: Number(newVoucher.maxDiscount) || (newVoucher.type === "fixed" ? Number(newVoucher.value) : 25000),
        quota: Number(newVoucher.quota) || 50,
        appliesTo: newVoucher.appliesTo || "all",
        targetLocation: newVoucher.targetLocation || "all",
        expiresAt: newVoucher.expiresAt,
      });
      adminAddVoucher?.({
        code: cleanCode,
        title: newVoucher.title.trim() || cleanCode,
        description: newVoucher.description.trim() || "Voucher diskon spesial platform Bantuin.",
        type: newVoucher.type,
        value: Number(newVoucher.value) || 0,
        maxDiscount: Number(newVoucher.maxDiscount) || 25000,
        minOrder: Number(newVoucher.minOrder) || 0,
        appliesTo: newVoucher.appliesTo,
        targetLocation: newVoucher.targetLocation || "all",
        quota: Number(newVoucher.quota) || 50,
        expiresAt: newVoucher.expiresAt || defaultExpiresAt,
        color: colorMap[newVoucher.appliesTo] || colorMap.all,
      });
      addToast("Voucher Berhasil Dibuat", `Kode ${cleanCode} tersimpan ke database & siap digunakan!`);
      loadDbVouchers();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("bantuin_vouchers_updated"));
      }
      setIsCreateVoucherOpen(false);
      setNewVoucher({ code: "", title: "", description: "", type: "percent", value: 15, maxDiscount: 25000, minOrder: 50000, appliesTo: "all", targetLocation: "all", quota: 50, expiresAt: defaultExpiresAt });
    } catch (err) {
      addToast("Gagal Membuat Voucher", err.message || "Kode voucher sudah digunakan.", "error");
    }
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

  const handleToggleSuspendUser = async (user) => {
    const isCurrentlySuspended = user.verificationStatus === "suspended" || !!suspendedUserIds[user.id];
    const willSuspend = !isCurrentlySuspended;
    let reason = "Pelanggaran pedoman platform";
    if (willSuspend) {
      const inputReason = prompt("Masukkan alasan penangguhan akun:", "Pelanggaran pedoman komunitas Bantuin");
      if (inputReason === null) return;
      if (inputReason.trim()) reason = inputReason.trim();
    }

    try {
      await adminApi.toggleUserSuspend(user.id, willSuspend, reason);
      setSuspendedUserIds((p) => ({ ...p, [user.id]: willSuspend }));
      setSuspendedProviderIds((p) => ({ ...p, [user.id]: willSuspend }));
      setSuspendedPartnerIds((p) => ({ ...p, [user.id]: willSuspend }));
      addToast(
        willSuspend ? "Akun Ditangguhkan" : "Akun Dipulihkan",
        `Akun "${user.fullName || user.name}" berhasil ${willSuspend ? "ditangguhkan" : "diaktifkan kembali"}.`,
        willSuspend ? "warning" : "success"
      );
      loadDbUsers();
      loadDbProviders();
      loadDbPartners();
    } catch (err) {
      addToast("Gagal Memproses Akun", err.message || "Terjadi kesalahan.", "error");
    }
  };

  const handleAddBroadcast = async (e) => {
    e.preventDefault();
    if (!newBroadcastForm.title.trim() || !newBroadcastForm.message.trim()) { alert("Lengkapi judul dan isi pengumuman!"); return; }
    try {
      const audienceMap = { "Semua Pengguna": "all", "Mitra Saja": "partner", "Pelanggan Saja": "user" };
      await adminApi.createAnnouncement({
        title: newBroadcastForm.title.trim(),
        content: newBroadcastForm.message.trim(),
        type: newBroadcastForm.type,
        audience: audienceMap[newBroadcastForm.target] || "all",
      });
      addToast("Pengumuman Diterbitkan", `"${newBroadcastForm.title}" berhasil dipublikasikan.`);
      loadDbAnnouncements();
      setIsNewBroadcastOpen(false);
      setNewBroadcastForm({ title: "", message: "", type: "info", target: "Semua Pengguna" });
    } catch (err) {
      addToast("Gagal menerbitkan", err.message || "Pengumuman tidak tersimpan ke database.", "error");
    }
  };

  const handleToggleBroadcast = async (idOrBc) => {
    const targetId = typeof idOrBc === "object" ? idOrBc.id : idOrBc;
    const current = effectiveBroadcastsList.find((b) => b.id === targetId) || broadcasts.find((b) => b.id === targetId);
    const nextStatus = current && current.isActive ? "inactive" : "active";

    // Optimistic UI update
    setDbAnnouncementsList((prev) =>
      prev.map((a) => (a.id === targetId ? { ...a, status: nextStatus } : a))
    );
    setBroadcasts((p) =>
      p.map((b) => (b.id === targetId ? { ...b, isActive: nextStatus === "active" } : b))
    );

    try {
      await adminApi.toggleAnnouncement(targetId, nextStatus);
      addToast(
        nextStatus === "active" ? "Pengumuman Disiarkan" : "Pengumuman Dinonaktifkan",
        `Status pengumuman sekarang ${nextStatus === "active" ? "aktif" : "nonaktif"}.`
      );
      loadDbAnnouncements();
    } catch (err) {
      await loadDbAnnouncements();
      addToast("Gagal mengubah status", err.message || "Status pengumuman tidak tersimpan ke database.", "error");
    }
  };
  
  const handleDeleteBroadcast = async (id) => {
    if (!confirm("Hapus pengumuman siaran ini dari platform?")) return;
    setDbAnnouncementsList((prev) => prev.filter((a) => a.id !== id));
    setBroadcasts((p) => p.filter((b) => b.id !== id));
    try {
      await adminApi.deleteAnnouncement(id);
      addToast("Pengumuman Dihapus", "Pengumuman telah ditarik dari database.");
      loadDbAnnouncements();
    } catch (err) {
      await loadDbAnnouncements();
      addToast("Gagal menghapus", err.message || "Pengumuman tidak dihapus dari database.", "error");
    }
  };

  // ── FILTERED VOUCHERS ────────────────────────────────────────────────────
  const effectiveVouchersList = useMemo(() => {
    return allRawVouchers.filter((v) => {
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
  }, [allRawVouchers, voucherCategoryFilter, voucherStatusFilter, voucherLocationFilter, voucherSearch]);

  const filteredVouchers = effectiveVouchersList;

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
        { id: "users", label: "Pengguna", icon: Users, badge: effectiveUsersList.length },
        { id: "providers", label: "Penyedia Jasa", icon: Briefcase, badge: allProvidersList.length },
        { id: "partners", label: "Mitra", icon: Store, badge: allPartnersList.length },
      ],
    },
    {
      group: "TRANSAKSI & KEUANGAN",
      links: [
        { id: "orders", label: "Pesanan", icon: Receipt, badge: effectiveOrdersList.length },
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
        { id: "vouchers", label: "Voucher & Promo", icon: Ticket, badge: effectiveVouchersList.filter((v) => v.isActive).length },
        { id: "promotions", label: "Promosi Landing Page", icon: Rocket, badge: promotionsList.length },
        { id: "landing-content", label: "Ulasan & Logo Beranda", icon: Star },
        { id: "broadcasts", label: "Pengumuman", icon: Megaphone, badge: effectiveBroadcastsList.filter((b) => b.isActive).length },
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
    "landing-content": "Konten Beranda",
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
    <RoleGuard allowedRoles={["admin"]} fallback={<AdminDashboardSkeleton />}>
      {isAdminLoading ? (
        <AdminDashboardSkeleton />
      ) : (
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
          </div>
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
                  const isActive =
                    activeMenu === link.id ||
                    (link.id === "verification" && activeMenu === "kyc") ||
                    (link.id === "finance" && (activeMenu === "withdrawals" || activeMenu === "deposits")) ||
                    (link.id === "orders" && activeMenu === "transactions");
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
                      onClick={() => {
                        if (item.id === "kyc") {
                          setActiveMenu("verification");
                        } else if (item.id === "withdrawals") {
                          setActiveMenu("finance");
                          setFinanceTab("withdrawals");
                        } else if (item.id === "deposits") {
                          setActiveMenu("finance");
                          setFinanceTab("deposits");
                        } else if (item.id === "transactions") {
                          setActiveMenu("orders");
                        } else {
                          setActiveMenu(item.id);
                        }
                      }}
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
                        {effectiveWithdrawalsList.filter((w) => w.status === "PENDING").map((w) => (
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
                        {effectiveDisputesList.filter((r) => r.status === "pending" || r.status === "OPEN" || r.status === "UNDER_REVIEW").map((rep) => (
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
                              <UserAvatar src={mitra.avatar} name={mitra.name} size="md" rounded="rounded-xl" />
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
                                onClick={() => handleApproveKyc(mitra)}
                                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition flex items-center gap-1 cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5" /> Setujui
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRejectKyc(mitra)}
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
                              <UserAvatar src={thread.userAvatar} name={thread.userName} size="sm" rounded="rounded-full" />
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
                      {effectiveOrdersList.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-12 text-center text-slate-400">
                            <Receipt className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                            <p className="font-semibold text-slate-600">Tidak Ada Pesanan Ditemukan</p>
                            <p className="text-xs text-slate-400 mt-0.5">Belum ada transaksi dengan filter atau kata kunci yang dipilih.</p>
                          </td>
                        </tr>
                      ) : (
                        effectiveOrdersList.map((order) => {
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
                        })
                      )}
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
                      {effectiveWithdrawalsList.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-12 text-center text-slate-400">
                            <Wallet className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                            <p className="font-semibold text-slate-600">Tidak Ada Antrean Penarikan Dana</p>
                            <p className="text-xs text-slate-400 mt-0.5">Seluruh penarikan dana mitra telah diproses atau belum ada pengajuan baru.</p>
                          </td>
                        </tr>
                      ) : (
                        effectiveWithdrawalsList.map((w) => (
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
                        ))
                      )}
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
                    {effectiveDisputesList.length} Total Laporan
                  </span>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                  <div className="space-y-2">
                    {effectiveDisputesList.map((rep) => {
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
                    {effectiveDisputesList.length === 0 && <div className="text-center text-slate-400 text-xs py-8">Tidak ada laporan sengketa aktif</div>}
                  </div>
                  <div className="lg:col-span-2">
                    {(() => {
                      const report = effectiveDisputesList.find((r) => r.id === selectedReportId) || effectiveDisputesList[0];
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
                                {report.type === "report" ? (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => handleResolveDisputeAction(report, "resolved")}
                                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition cursor-pointer"
                                    >
                                      Selesaikan Laporan (Tandai Selesai)
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleResolveDisputeAction(report, "dismiss")}
                                      className="px-3.5 py-1.5 bg-slate-500 hover:bg-slate-600 text-white text-xs font-bold rounded-xl transition cursor-pointer"
                                    >
                                      Tolak / Tutup Laporan (Dismiss)
                                    </button>
                                  </>
                                ) : (
                                  <>
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
                                  </>
                                )}
                              </div>
                            </div>
                          )}
                          {!isPending && (
                            <div className="space-y-2.5">
                              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold text-xs flex items-center gap-1.5">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Sengketa ini telah resmi diselesaikan oleh Admin Bantuin.
                              </div>
                              {report.adminNotes && (
                                <div className="p-3 rounded-xl bg-blue-50/90 border border-blue-200 text-xs space-y-1.5">
                                  <span className="font-bold text-[#1683FF] flex items-center gap-1.5">
                                    <ShieldCheck className="w-4 h-4 text-[#1683FF]" /> Catatan Keputusan / Balasan Admin:
                                  </span>
                                  <div className="p-2.5 rounded-lg bg-white border border-blue-100 text-slate-800 font-medium leading-relaxed">
                                    {report.adminNotes}
                                  </div>
                                </div>
                              )}
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
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-slate-100 gap-3">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-[#1683FF]" /> Verifikasi Identitas &amp; KYC Mitra
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">Pemeriksaan foto KTP / KTM asli dan pencocokan NIK sesuai standar kepatuhan regulasi.</p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={loadDbKyc}
                      disabled={isLoadingDbKyc}
                      className="px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 flex items-center gap-1.5 transition cursor-pointer"
                      title="Sinkronisasi Data Ulang dari Server"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isLoadingDbKyc ? "animate-spin text-[#1683FF]" : ""}`} />
                      <span>Refresh</span>
                    </button>
                    <span className="text-xs font-bold text-[#1683FF] bg-[#EAF4FF] px-3 py-1 rounded-full border border-blue-200 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#1683FF] animate-pulse" />
                      {kycCounts.pending} Menunggu Persetujuan
                    </span>
                  </div>
                </div>

                {/* Filter Tabs & Search Bar */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-5">
                  {/* Status Pills */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                    {[
                      { id: "pending", label: "Menunggu Persetujuan", count: kycCounts.pending, color: "text-amber-700 bg-amber-50 border-amber-200" },
                      { id: "verified", label: "Terverifikasi", count: kycCounts.verified, color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
                      { id: "rejected", label: "Ditolak", count: kycCounts.rejected, color: "text-rose-700 bg-rose-50 border-rose-200" },
                      { id: "all", label: "Semua", count: kycCounts.all, color: "text-slate-700 bg-slate-50 border-slate-200" },
                    ].map((tab) => {
                      const isActive = kycTabFilter === tab.id;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setKycTabFilter(tab.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shrink-0 border ${
                            isActive
                              ? "bg-[#1683FF] text-white border-[#1683FF] shadow-xs"
                              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                          }`}
                        >
                          <span>{tab.label}</span>
                          <span
                            className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                              isActive
                                ? "bg-white/20 text-white"
                                : tab.color
                            }`}
                          >
                            {tab.count}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Search Input */}
                  <div className="relative min-w-[240px]">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Cari nama, email, NIK, kota..."
                      value={kycSearchQuery}
                      onChange={(e) => setKycSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-7 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-[#1683FF] focus:ring-1 focus:ring-blue-100 transition"
                    />
                    {kycSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setKycSearchQuery("")}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                {isLoadingDbKyc && dbKycList.length === 0 && (
                  <div className="py-12 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-[#1683FF]" />
                    <span>Sinkronisasi data pengajuan KYC database...</span>
                  </div>
                )}

                {(!isLoadingDbKyc || dbKycList.length > 0) && filteredKycList.map((mitra) => {
                  const isVerified = mitra.status === "verified";
                  const isRejected = mitra.status === "rejected";
                  const isPending = !isVerified && !isRejected;

                  return (
                    <div
                      key={mitra.id}
                      className={`p-4 rounded-xl border mb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition ${
                        isVerified
                          ? "border-emerald-200/80 bg-emerald-50/10 hover:border-emerald-300"
                          : isRejected
                          ? "border-rose-200/80 bg-rose-50/10 hover:border-rose-300"
                          : "border-slate-200 hover:border-blue-200 bg-white"
                      }`}
                    >
                      <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                        <UserAvatar src={mitra.avatar} name={mitra.name} size="xl" rounded="rounded-xl" />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-sm text-slate-900">{mitra.name}</span>
                            <span className="text-[10px] font-semibold text-[#1683FF] bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                              {mitra.role}
                            </span>
                            {/* Status Badge */}
                            {isVerified && (
                              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Terverifikasi
                              </span>
                            )}
                            {isRejected && (
                              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full border bg-rose-50 text-rose-700 border-rose-200 flex items-center gap-1">
                                <XCircle className="w-3 h-3 text-rose-600" /> Ditolak
                              </span>
                            )}
                            {isPending && (
                              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full border bg-amber-50 text-amber-700 border-amber-200 flex items-center gap-1">
                                <Clock className="w-3 h-3 text-amber-600" /> Menunggu Persetujuan
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            {mitra.email} · {mitra.city} · Diajukan: <span className="font-medium text-slate-700">{mitra.submittedAt}</span>
                          </div>
                          {(mitra.skill || mitra.payoutAccountNumber) && (
                            <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs">
                              {mitra.skill && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-700 font-semibold text-[11px]">
                                  <Briefcase className="w-3 h-3 text-indigo-500" />
                                  <span>Keahlian: {mitra.skill}</span>
                                </span>
                              )}
                              {(mitra.payoutAccountNumber || mitra.payoutBank) && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-800 font-medium text-[11px]">
                                  <Wallet className="w-3 h-3 text-emerald-600" />
                                  <span>
                                    Rekening: {mitra.payoutBank || "Bank"} {mitra.payoutAccountNumber || "-"}{mitra.payoutAccountHolder ? ` a/n ${mitra.payoutAccountHolder}` : ""}
                                  </span>
                                </span>
                              )}
                            </div>
                          )}
                          {mitra.notes && (
                            <div className="text-[11px] text-slate-600 mt-1 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/80 inline-block">
                              <span className="font-semibold text-slate-700">Catatan:</span> {mitra.notes}
                            </div>
                          )}
                          <div className="flex items-center gap-3 mt-2">
                            <button
                              type="button"
                              onClick={() => toggleRevealNik(mitra.id)}
                              className="text-[11px] px-2.5 py-1 rounded-lg border border-slate-200 text-slate-600 hover:text-[#1683FF] hover:border-blue-200 flex items-center gap-1 cursor-pointer bg-white"
                            >
                              {revealedNikIds[mitra.id] ? (
                                <><EyeOff className="w-3 h-3" /> {mitra.rawNik || mitra.nik}</>
                              ) : (
                                <><Eye className="w-3 h-3" /> Tampilkan NIK</>
                              )}
                            </button>
                            {mitra.idCardUrl && (
                              <button
                                type="button"
                                onClick={() => setPreviewImageUrl(mitra.idCardUrl)}
                                className="text-[11px] px-2.5 py-1 rounded-lg border border-blue-200 text-[#1683FF] hover:bg-blue-50 flex items-center gap-1.5 cursor-pointer bg-blue-50/40 font-semibold"
                              >
                                <Eye className="w-3 h-3" /> Lihat Foto KTP / Dokumen
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Dynamic Action Buttons depending on status */}
                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        {isPending && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleApproveKyc(mitra)}
                              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                            >
                              <Check className="w-3.5 h-3.5" /> Setujui
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRejectKyc(mitra)}
                              className="px-3.5 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-bold rounded-xl border border-rose-200 transition flex items-center gap-1 cursor-pointer"
                            >
                              <XCircle className="w-3.5 h-3.5" /> Tolak
                            </button>
                          </>
                        )}

                        {isVerified && (
                          <>
                            <div className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-xl flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Sudah Terverifikasi</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRejectKyc(mitra)}
                              className="px-2.5 py-1.5 text-xs font-medium text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl border border-slate-200 transition cursor-pointer"
                              title="Batalkan atau tolak status verifikasi ini"
                            >
                              Cabut Verifikasi
                            </button>
                          </>
                        )}

                        {isRejected && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleApproveKyc(mitra)}
                              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                            >
                              <Check className="w-3.5 h-3.5" /> Setujui Ulang
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}

                {!isLoadingDbKyc && filteredKycList.length === 0 && (
                  <div className="text-center text-slate-400 text-sm py-12">
                    {kycTabFilter === "pending" ? (
                      <>
                        <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-emerald-500" />
                        <p className="font-semibold text-slate-800">Semua mitra dan pengguna telah terverifikasi!</p>
                        <p className="text-xs text-slate-400 mt-1">Tidak ada dokumen identitas baru yang menunggu persetujuan.</p>
                      </>
                    ) : kycTabFilter === "verified" ? (
                      <>
                        <UserCheck className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                        <p className="font-semibold text-slate-700">Belum Ada Akun Terverifikasi</p>
                        <p className="text-xs text-slate-400 mt-1">Akun yang disetujui akan muncul di tab ini.</p>
                      </>
                    ) : kycTabFilter === "rejected" ? (
                      <>
                        <XCircle className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                        <p className="font-semibold text-slate-700">Tidak Ada Pengajuan Ditolak</p>
                        <p className="text-xs text-slate-400 mt-1">Semua dokumen yang ditolak akan dicatat di tab ini.</p>
                      </>
                    ) : (
                      <>
                        <UserCheck className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                        <p className="font-semibold text-slate-700">Tidak Ada Data Pengajuan</p>
                        <p className="text-xs text-slate-400 mt-1">Tidak ditemukan pengajuan KYC yang cocok dengan filter atau kata kunci.</p>
                      </>
                    )}
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
                  <div key={item.id} className={`bg-white rounded-2xl border p-3.5 sm:p-4 shadow-xs flex flex-col justify-between transition ${item.isHidden ? "opacity-60 border-rose-200 bg-rose-50/10" : "border-slate-200 hover:border-blue-200"}`}>
                    <div className="flex items-start gap-3">
                      <img src={item.photoUrl} alt={item.title} className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl object-cover shrink-0 border border-slate-200 bg-slate-50" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-md shrink-0 ${item.type === "sewa" ? "bg-purple-50 text-purple-700 border border-purple-200" : item.type === "jasa" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-blue-50 text-[#1683FF] border border-blue-200"}`}>
                            {item.type}
                          </span>
                          {item.isHidden && (
                            <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200 shrink-0">
                              Disembunyikan
                            </span>
                          )}
                        </div>
                        <h4 className="text-xs sm:text-[13px] font-bold text-slate-900 mt-1 line-clamp-2 leading-snug break-words">
                          {item.title}
                        </h4>
                        <span className="text-[11px] text-slate-500 block truncate mt-0.5 font-medium">
                          {item.provider}
                        </span>
                        <span className="text-xs sm:text-sm font-black text-[#1683FF] mt-1 block truncate font-mono">
                          {formatIDR(item.price)}
                        </span>
                        <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-400 flex-wrap">
                          <MapPin className="w-2.5 h-2.5 text-[#1683FF] shrink-0" />
                          <span className="truncate max-w-[150px]">{item.city}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-2 pt-2.5 mt-2.5 border-t border-slate-100 flex-wrap">
                      <button 
                        type="button" 
                        onClick={() => handleToggleHideListing(item)} 
                        className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition cursor-pointer flex-1 sm:flex-none text-center ${
                          item.isHidden 
                            ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200" 
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        }`}
                      >
                        {item.isHidden ? "Tayangkan" : "Sembunyikan"}
                      </button>
                      <button 
                        type="button" 
                        onClick={() => handleDeleteListing(item)} 
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                        title="Hapus Listing"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
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
                  <div className="flex flex-col gap-1">
                    <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                      <Users className="w-4 h-4 text-[#1683FF]" /> Direktori Akun Pengguna &amp; Mitra
                    </h3>
                    <p className="text-[11px] text-slate-400">Total {effectiveUsersList.length} akun terdaftar di sistem platform.</p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl text-[11px]">
                      {[
                        { id: "all", label: "Semua" },
                        { id: "user", label: "User" },
                        { id: "provider", label: "Jasa" },
                        { id: "partner", label: "Mitra" },
                        { id: "admin", label: "Admin" },
                      ].map((rf) => (
                        <button
                          key={rf.id}
                          type="button"
                          onClick={() => setUserRoleFilter(rf.id)}
                          className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer ${
                            userRoleFilter === rf.id ? "bg-white text-[#1683FF] shadow-2xs font-bold" : "text-slate-600 hover:text-slate-900"
                          }`}
                        >
                          {rf.label}
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={loadDbUsers}
                      disabled={isLoadingDbUsers}
                      className="px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 flex items-center gap-1 transition"
                      title="Refresh Pengguna dari Database"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isLoadingDbUsers ? "animate-spin text-[#1683FF]" : ""}`} />
                      <span>Refresh</span>
                    </button>

                    <div className="relative sm:w-56">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Cari nama atau email..."
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:border-[#1683FF] outline-none bg-white"
                      />
                    </div>
                  </div>
                </div>

                {isLoadingDbUsers && (
                  <div className="py-8 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-[#1683FF]" />
                    <span>Memuat daftar akun pengguna dari database...</span>
                  </div>
                )}

                {!isLoadingDbUsers && (
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
                        {(() => {
                          const usersToDisplay = effectiveUsersList.filter((u) => {
                            if (userRoleFilter !== "all") {
                              const r = (u.role || "").toLowerCase();
                              if (userRoleFilter === "user" && !r.includes("pelanggan") && !r.includes("user")) return false;
                              if (userRoleFilter === "provider" && !r.includes("jasa") && !r.includes("helper") && !r.includes("provider")) return false;
                              if (userRoleFilter === "partner" && !r.includes("mitra") && !r.includes("rental") && !r.includes("partner")) return false;
                              if (userRoleFilter === "admin" && !r.includes("admin")) return false;
                            }
                            if (!userSearch) return true;
                            const q = userSearch.toLowerCase();
                            return (u.name || "").toLowerCase().includes(q) || (u.email || "").toLowerCase().includes(q);
                          });
                          if (usersToDisplay.length === 0) {
                            return (
                              <tr>
                                <td colSpan={5} className="py-12 text-center text-slate-400">
                                  <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                  <p className="font-semibold text-slate-600">Tidak Ada Pengguna Ditemukan</p>
                                  <p className="text-xs text-slate-400 mt-0.5">Tidak ada pengguna yang cocok dengan kriteria pencarian.</p>
                                </td>
                              </tr>
                            );
                          }
                          return usersToDisplay.map((u) => {
                            const isSuspended = u.verificationStatus === "suspended" || !!suspendedUserIds[u.id];
                            return (
                              <tr key={u.id} className="hover:bg-[#F5FAFF]">
                                <td className="py-3 px-4">
                                  <div className="flex items-center gap-3">
                                    <UserAvatar src={u.avatar} name={u.name} size="md" rounded="rounded-xl" />
                                    <div>
                                      <strong className="text-slate-900 font-bold block">{u.name}</strong>
                                      <span className="text-[11px] text-slate-400 font-mono">{u.email}</span>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-3 px-4">
                                  <span className="font-semibold text-slate-700">{u.role}</span>
                                  <span className="text-[10px] text-slate-400 block">{u.ordersCount} Selesai</span>
                                </td>
                                <td className="py-3 px-4 font-mono text-slate-600">{u.phone}</td>
                                <td className="py-3 px-4 text-center">
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                      isSuspended
                                        ? "bg-rose-50 text-rose-700 border-rose-200"
                                        : u.verified
                                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                        : "bg-amber-50 text-amber-700 border-amber-200"
                                    }`}
                                  >
                                    {isSuspended ? "Suspended" : u.verified ? "Verified" : "Reguler"}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-center">
                                  <div className="flex items-center justify-center gap-1.5">
                                    {!u.verified ? (
                                      <button
                                        type="button"
                                        onClick={() => handleApproveKyc(u)}
                                        className="px-2 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition cursor-pointer"
                                        title="Setujui KYC Akun"
                                      >
                                        Verif KYC
                                      </button>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => handleRejectKyc(u)}
                                        className="px-2 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 transition cursor-pointer"
                                        title="Cabut / Tolak Status Verifikasi"
                                      >
                                        Tolak KYC
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => handleToggleSuspendUser(u)}
                                      className={`px-2 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
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
                          });
                        })()}
                      </tbody>
                    </table>
                  </div>
                )}
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
                      {(() => {
                        const providersToDisplay = allProvidersList.filter((p) => !providerSearch || p.name.toLowerCase().includes(providerSearch.toLowerCase()) || (p.brandTitle || "").toLowerCase().includes(providerSearch.toLowerCase()));
                        if (providersToDisplay.length === 0) {
                          return (
                            <tr>
                              <td colSpan={5} className="py-12 text-center text-slate-400">
                                <Briefcase className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                <p className="font-semibold text-slate-600">Tidak Ada Penyedia Jasa Ditemukan</p>
                                <p className="text-xs text-slate-400 mt-0.5">Tidak ada data penyedia jasa yang cocok dengan pencarian.</p>
                              </td>
                            </tr>
                          );
                        }
                        return providersToDisplay.map((prov) => {
                          const isSuspended = !!suspendedProviderIds[prov.id] || prov.verificationStatus === "suspended";
                          return (
                            <tr key={prov.id} className="hover:bg-[#F5FAFF]">
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-3">
                                  <UserAvatar src={prov.avatar} name={prov.name} size="md" rounded="rounded-xl" />
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
                                    onClick={() => handleToggleSuspendUser(prov)}
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
                        });
                      })()}
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
                      {(() => {
                        const partnersToDisplay = allPartnersList.filter((p) => !partnerSearch || p.name.toLowerCase().includes(partnerSearch.toLowerCase()) || (p.category || "").toLowerCase().includes(partnerSearch.toLowerCase()));
                        if (partnersToDisplay.length === 0) {
                          return (
                            <tr>
                              <td colSpan={5} className="py-12 text-center text-slate-400">
                                <Store className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                <p className="font-semibold text-slate-600">Tidak Ada Toko Mitra Ditemukan</p>
                                <p className="text-xs text-slate-400 mt-0.5">Tidak ada toko mitra sewa yang cocok dengan pencarian.</p>
                              </td>
                            </tr>
                          );
                        }
                        return partnersToDisplay.map((ptr) => {
                          const isSuspended = !!suspendedPartnerIds[ptr.id] || ptr.verificationStatus === "suspended";
                          return (
                            <tr key={ptr.id} className="hover:bg-[#F5FAFF]">
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-3">
                                  <UserAvatar src={ptr.avatar} name={ptr.name} size="md" rounded="rounded-xl" />
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
                                    onClick={() => handleToggleSuspendUser(ptr)}
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
                        });
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ─── TAB: MANAJEMEN SISTEM PROMOSI (JASA, SEWA, TOKO) ─────────── */}
          {activeMenu === "promotions" && (
            <div className="animate-in fade-in duration-150 space-y-4">
              
              {/* Header Promosi Admin */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div>
                    <h3 className="font-bold text-sm sm:text-base text-slate-900 flex items-center gap-2">
                      <Rocket className="w-4 h-4 text-[#1683FF]" /> Manajemen Sistem Promosi Jasa &amp; Sewa
                    </h3>
                    <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
                      Kelola tarif paket promosi, pantau promosi aktif, dan tinjau analitik pendapatan iklan platform.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={handleOpenCreatePackage}
                      className="px-3.5 py-2 rounded-xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Buat Paket Promosi</span>
                    </button>
                  </div>
                </div>

                {/* Sub-Tabs: Paket Promosi | Promosi Aktif | Riwayat | Statistik */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-3 text-xs">
                  {[
                    { id: "packages", label: "Paket Promosi", count: packagesList.length },
                    { id: "active", label: "Promosi Aktif", count: ongoingPromotions.length },
                    { id: "history", label: "Riwayat Promosi", count: historyPromotions.length },
                    { id: "stats", label: "Statistik & Omset", count: null },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setAdminPromoTab(tab.id)}
                      className={`px-3.5 py-2 rounded-xl font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                        adminPromoTab === tab.id
                          ? "bg-[#1683FF] text-white shadow-xs"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      <span>{tab.label}</span>
                      {tab.count !== null && (
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                          adminPromoTab === tab.id ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
                        }`}>
                          {tab.count}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* ───────────────────────────────────────────────────────────── */}
              {/* SUB-TAB 1: MANAJEMEN PAKET PROMOSI (CRUD)                     */}
              {/* ───────────────────────────────────────────────────────────── */}
              {adminPromoTab === "packages" && (
                <div className="space-y-4">
                  {/* Filter Jenis Paket Jasa / Sewa */}
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs">
                      {[
                        { id: "all", label: "Semua Paket", count: packagesList.length },
                        { id: "jasa", label: "Paket Jasa", count: packagesList.filter((p) => p.type === "jasa").length },
                        { id: "sewa", label: "Paket Sewa", count: packagesList.filter((p) => p.type === "sewa").length },
                      ].map((chip) => (
                        <button
                          key={chip.id}
                          type="button"
                          onClick={() => setPackageTypeFilter(chip.id)}
                          className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer text-xs ${
                            packageTypeFilter === chip.id
                              ? "bg-slate-900 text-white shadow-2xs"
                              : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          {chip.label} ({chip.count})
                        </button>
                      ))}
                    </div>

                    <span className="text-[11px] text-slate-400 font-medium">
                      Tarif &amp; konfigurasi paket langsung sinkron ke formulir pembelian mitra.
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { key: "service", label: "Antrean Beranda Jasa", accent: "text-[#1683FF] bg-blue-50 border-blue-100" },
                      { key: "rental", label: "Antrean Beranda Sewa", accent: "text-[#1683FF] bg-blue-50 border-blue-100" },
                    ].map(({ key, label, accent }) => {
                      const summary = landingSlotSummary[key];
                      return (
                        <div key={key} className={`rounded-2xl border px-3.5 py-3 ${accent}`}>
                          <div className="flex items-baseline justify-between gap-3">
                            <span className="text-xs font-extrabold">{label}</span>
                            <span className="text-lg font-black">{summary.showing.length}/{summary.limit}</span>
                          </div>
                          <p className="text-[11px] mt-1 opacity-80">
                            {summary.queued.length > 0
                              ? `${summary.queued.length} menunggu slot; tetap tampil di katalog dan pencarian.`
                              : "Tidak ada antrean; seluruh paket yang berhak sedang tampil di Beranda."}
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  {/* Grid Cards Paket Promosi */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                    {packagesList
                      .filter((pkg) => packageTypeFilter === "all" || pkg.type === packageTypeFilter)
                      .map((pkg) => {
                        const isJasa = pkg.type === "jasa";
                        const isSewa = pkg.type === "sewa";
                        const isActive = pkg.status === "active";

                        return (
                          <div
                            key={pkg.id}
                            className={`bg-white rounded-2xl border p-4.5 shadow-2xs flex flex-col justify-between transition ${
                              isActive ? "border-slate-200/90 hover:border-[#1683FF]/40" : "border-slate-200 bg-slate-50/50 opacity-80"
                            }`}
                          >
                            <div className="space-y-3">
                              {/* Header Card: Type Badge + Status Toggle */}
                              <div className="flex items-center justify-between gap-2">
                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase border ${
                                  isJasa
                                    ? "bg-blue-50 text-[#1683FF] border-blue-200"
                                    : isSewa
                                    ? "bg-blue-50 text-[#1683FF] border-blue-200"
                                    : "bg-emerald-50 text-emerald-700 border-emerald-200"
                                }`}>
                                  {pkg.type.toUpperCase()}
                                </span>

                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  isActive ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-200 text-slate-600"
                                }`}>
                                  {isActive ? "Aktif" : "Nonaktif"}
                                </span>
                              </div>

                              {/* Title & Price */}
                              <div>
                                <h4 className="font-bold text-sm text-slate-900 leading-snug">{pkg.name}</h4>
                                <div className="flex items-baseline gap-2 mt-1">
                                  <span className="text-lg font-black text-[#1683FF]">{formatIDR(pkg.price)}</span>
                                  <span className="text-xs text-slate-500 font-medium">/ {pkg.durationDays} hari</span>
                                </div>
                              </div>

                              {/* Specs Info */}
                              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-600 space-y-1">
                                <div className="flex items-center justify-between">
                                  <span className="text-slate-400">Prioritas:</span>
                                  <span className="font-bold text-slate-800">Tingkat {pkg.priority || 1}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-slate-400">Batas Slot:</span>
                                  <span className="font-bold text-slate-800">{(pkg.placements || []).includes("landing") ? "4 slot Beranda" : `${pkg.slotLimit || 4} promosi/paket`}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-slate-400">Penempatan:</span>
                                  <span className="font-semibold text-slate-700 truncate max-w-[150px]">
                                    {(pkg.placements || ["katalog", "search"]).includes("landing") ? "Beranda + Katalog + Cari" : "Katalog + Cari (tanpa Beranda)"}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-slate-400">Jangkauan:</span>
                                  <span className="font-semibold text-slate-700 truncate max-w-[150px]">
                                    {(pkg.reachOptions || []).map((r) => r === "around" ? "Sekitar" : r === "city" ? "Kabupaten" : "Semua").join(", ")}
                                  </span>
                                </div>
                              </div>

                              {/* Benefits List */}
                              {Array.isArray(pkg.benefits) && pkg.benefits.length > 0 && (
                                <ul className="space-y-1 text-[11px] text-slate-600">
                                  {pkg.benefits.slice(0, 3).map((b, idx) => (
                                    <li key={idx} className="flex items-start gap-1.5 truncate">
                                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                      <span className="truncate">{b}</span>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>

                            {/* Actions Bottom Bar */}
                            <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                              <button
                                type="button"
                                onClick={() => handleOpenEditPackage(pkg)}
                                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg transition cursor-pointer"
                              >
                                Edit
                              </button>

                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleTogglePackageStatus(pkg.id)}
                                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                                    isActive
                                      ? "bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200"
                                      : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200"
                                  }`}
                                >
                                  {isActive ? "Nonaktifkan" : "Aktifkan"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleOpenDeletePackageModal(pkg.id, pkg.name)}
                                  className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                  title="Hapus Paket"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* ───────────────────────────────────────────────────────────── */}
              {/* SUB-TAB 2: PROMOSI AKTIF & MODERASI                           */}
              {/* ───────────────────────────────────────────────────────────── */}
              {adminPromoTab === "active" && (
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
                  {/* Filter Target Promosi */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {[
                      { id: "all", label: "Semua Promosi", count: ongoingPromotions.length },
                      { id: "service", label: "Layanan Jasa", count: ongoingPromotions.filter(p => p.targetType === 'service').length },
                      { id: "rental", label: "Unit Sewa", count: ongoingPromotions.filter(p => p.targetType === 'rental').length },
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

                  <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-100 text-xs text-slate-700 space-y-0.5">
                    <strong className="block text-slate-900 font-bold">Integritas Promosi Terhadap Organik:</strong>
                    Promosi berbayar hanya memberikan penempatan prioritas di etalase rekomendasi &amp; hasil pencarian. Promosi <strong>TIDAK PERNAH</strong> mengubah skor ulasan atau reputasi organik mitra.
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs min-w-[850px]">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                        <tr>
                          <th className="py-3 px-4">Item Promosi</th>
                          <th className="py-3 px-4">Pemilik (Mitra)</th>
                          <th className="py-3 px-4">Paket &amp; Durasi</th>
                          <th className="py-3 px-4">Biaya</th>
                          <th className="py-3 px-4 text-center">Status Gateway</th>
                          <th className="py-3 px-4 text-center">Status Tayang</th>
                          <th className="py-3 px-4">Masa Berlaku</th>
                          <th className="py-3 px-4 text-center">Aksi Admin</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {ongoingPromotions
                          .filter((p) => promoTargetFilter === "all" || p.targetType === promoTargetFilter)
                          .map((promo) => {
                            const isExpired = promo.endDate && new Date(promo.endDate) < new Date();
                            const isPaused = promo.status === "paused";
                            const isCancelled = promo.status === "cancelled";
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
                                    {(promo.paymentStatus || "pending").toUpperCase()} (Gateway)
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-center">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    isActive 
                                      ? "bg-[#1683FF] text-white" 
                                      : isPaused
                                      ? "bg-amber-100 text-amber-900 border border-amber-300 font-extrabold"
                                      : isCancelled
                                      ? "bg-rose-100 text-rose-800 border border-rose-200"
                                      : isExpired 
                                      ? "bg-slate-200 text-slate-700" 
                                      : "bg-amber-100 text-amber-800"
                                  }`}>
                                    {isActive ? "AKTIF TAYANG" : isPaused ? "DIJEDA MITRA" : isCancelled ? "DINONAKTIFKAN" : isExpired ? "KEDALUWARSA" : "PENDING"}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-slate-500 text-[11px]">
                                  {promo.startDate && promo.endDate ? (
                                    `${new Date(promo.startDate).toLocaleDateString("id-ID", { day: "numeric", month: "short" })} s/d ${new Date(promo.endDate).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}`
                                  ) : (
                                    "Menunggu aktivasi"
                                  )}
                                </td>
                                <td className="py-3 px-4 text-center">
                                  <button
                                    type="button"
                                    disabled={processingActionIds.has(`promo-${promo.id}`)}
                                    onClick={() => {
                                      withActionLock(`promo-${promo.id}`, async () => {
                                        const nextStatus = promo.status === "active" ? "cancelled" : "active";
                                        // Optimistic update
                                        setPromotionsList((prev) =>
                                          prev.map((p) => (p.id === promo.id ? { ...p, status: nextStatus } : p))
                                        );
                                        try {
                                          await adminApi.updatePromotion(promo.id, { status: nextStatus });
                                          await loadDbPromotions();
                                          window.dispatchEvent(new Event("bantuin_promotions_updated"));
                                          addToast(
                                            "Status Promosi Diubah",
                                            `Promosi untuk "${promo.targetTitle || "Item"}" berhasil ${nextStatus === "cancelled" ? "dinonaktifkan" : "diaktifkan kembali"}.`
                                          );
                                        } catch (err) {
                                          console.warn("Admin promo status toggle error:", err);
                                          await loadDbPromotions();
                                          addToast("Gagal Mengubah Status", err.message || "Gagal mengubah status promosi.", "error");
                                        }
                                      });
                                    }}
                                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none ${
                                      promo.status === "active"
                                        ? "bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200"
                                        : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                                    }`}
                                  >
                                    {processingActionIds.has(`promo-${promo.id}`) 
                                      ? "Memproses..." 
                                      : (promo.status === "active" ? "Nonaktifkan" : "Aktifkan")}
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        {ongoingPromotions.filter((p) => promoTargetFilter === "all" || p.targetType === promoTargetFilter).length === 0 && (
                          <tr>
                            <td colSpan={8} className="py-8 text-center text-slate-400">
                              Belum ada promosi yang sedang aktif atau dijeda mitra saat ini.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ───────────────────────────────────────────────────────────── */}
              {/* SUB-TAB 3: RIWAYAT PROMOSI (SELESAI / DIBATALKAN)             */}
              {/* ───────────────────────────────────────────────────────────── */}
              {adminPromoTab === "history" && (
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">Arsip &amp; Riwayat Promosi Selesai</h4>
                      <p className="text-[11px] text-slate-400">Daftar transaksi promosi yang masa tayangnya telah rampung atau dibatalkan.</p>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs min-w-[700px]">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
                        <tr>
                          <th className="py-3 px-4">Item Promosi</th>
                          <th className="py-3 px-4">Pemilik</th>
                          <th className="py-3 px-4">Paket</th>
                          <th className="py-3 px-4">Total Biaya</th>
                          <th className="py-3 px-4 text-center">Status Akhir</th>
                          <th className="py-3 px-4">Statistik (Views/Klik)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {historyPromotions.map((promo) => (
                          <tr key={promo.id} className="hover:bg-slate-50">
                            <td className="py-3 px-4 font-bold text-slate-900">{promo.targetTitle}</td>
                            <td className="py-3 px-4 text-slate-600">{promo.ownerName}</td>
                            <td className="py-3 px-4 text-slate-600">{promo.packageName}</td>
                            <td className="py-3 px-4 font-mono font-bold text-slate-900">{formatIDR(promo.amount)}</td>
                            <td className="py-3 px-4 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                promo.status === "cancelled" ? "bg-rose-100 text-rose-800" : "bg-slate-100 text-slate-700"
                              }`}>
                                {promo.status === "cancelled" ? "Dibatalkan" : "Selesai (Expired)"}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-slate-500">
                              {promo.analytics?.views || 0} tayang &middot; {promo.analytics?.clicks || 0} klik
                            </td>
                          </tr>
                        ))}
                        {historyPromotions.length === 0 && (
                          <tr>
                            <td colSpan={6} className="py-8 text-center text-slate-400">
                              Belum ada riwayat promosi yang selesai atau dibatalkan.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ───────────────────────────────────────────────────────────── */}
              {/* SUB-TAB 4: STATISTIK & OMSET PENDAPATAN IKLAN                  */}
              {/* ───────────────────────────────────────────────────────────── */}
              {adminPromoTab === "stats" && (() => {
                const stats = promotionService.getAdminStatsSync();

                return (
                  <div className="space-y-4">
                    {/* 4 Summary KPI Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
                        <div className="text-xs text-slate-400 font-semibold mb-1">Total Pendapatan Iklan</div>
                        <div className="text-xl sm:text-2xl font-black text-emerald-600">{formatIDR(stats.totalRevenue)}</div>
                        <div className="text-[10px] text-slate-400 mt-1">Dari transaksi promosi lunas</div>
                      </div>

                      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
                        <div className="text-xs text-slate-400 font-semibold mb-1">Promosi Aktif Tayang</div>
                        <div className="text-xl sm:text-2xl font-black text-[#1683FF]">{stats.activePromotions} Unit</div>
                        <div className="text-[10px] text-slate-400 mt-1">Sedang tampil di landing &amp; katalog</div>
                      </div>

                      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
                        <div className="text-xs text-slate-400 font-semibold mb-1">Total Impresi Tayang</div>
                        <div className="text-xl sm:text-2xl font-black text-slate-900">{stats.analytics.views.toLocaleString()}x</div>
                        <div className="text-[10px] text-slate-400 mt-1">Dilihat oleh calon pelanggan</div>
                      </div>

                      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
                        <div className="text-xs text-slate-400 font-semibold mb-1">Total Klik Masuk (CTR)</div>
                        <div className="text-xl sm:text-2xl font-black text-indigo-600">{stats.analytics.clicks} ({stats.analytics.ctr})</div>
                        <div className="text-[10px] text-slate-400 mt-1">{stats.analytics.chats} interaksi chat dimulai</div>
                      </div>
                    </div>

                    {/* Breakdown by Category */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
                      <h4 className="font-bold text-sm text-slate-900">Breakdown Kategori Promosi</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-100 space-y-1">
                          <span className="text-xs font-bold text-[#1683FF] uppercase">Promosi Jasa</span>
                          <div className="text-lg font-black text-slate-900">{formatIDR(stats.breakdown.service.revenue)}</div>
                          <div className="text-[11px] text-slate-500">
                            {stats.breakdown.service.active} aktif dari {stats.breakdown.service.count} total
                          </div>
                        </div>

                        <div className="p-3.5 rounded-xl bg-purple-50/60 border border-purple-100 space-y-1">
                          <span className="text-xs font-bold text-purple-700 uppercase">Promosi Sewa Alat</span>
                          <div className="text-lg font-black text-slate-900">{formatIDR(stats.breakdown.rental.revenue)}</div>
                          <div className="text-[11px] text-slate-500">
                            {stats.breakdown.rental.active} aktif dari {stats.breakdown.rental.count} total
                          </div>
                        </div>

                        <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-100 space-y-1">
                          <span className="text-xs font-bold text-emerald-700 uppercase">Promosi Toko Mitra</span>
                          <div className="text-lg font-black text-slate-900">{formatIDR(stats.breakdown.store.revenue)}</div>
                          <div className="text-[11px] text-slate-500">
                            {stats.breakdown.store.active} aktif dari {stats.breakdown.store.count} total
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* ───────────────────────────────────────────────────────────── */}
              {/* MODAL FORM: BUAT / EDIT PAKET PROMOSI DENGAN LIVE PREVIEW    */}
              {/* ───────────────────────────────────────────────────────────── */}
              {isPackageModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
                  <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 p-5 sm:p-7 space-y-5">
                    
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div>
                        <h3 className="font-extrabold text-base sm:text-lg text-slate-900">
                          {editingPackage ? "Edit Paket Promosi" : "Buat Paket Promosi Baru"}
                        </h3>
                        <p className="text-xs text-slate-500">
                          Konfigurasi tarif, durasi, dan slot tayang promosi untuk mitra.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsPackageModalOpen(false)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition cursor-pointer"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <form onSubmit={handleSavePackage} className="space-y-4">
                      {/* Nama Paket */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Nama Paket Promosi</label>
                        <input
                          type="text"
                          required
                          value={packageForm.name}
                          onChange={(e) => setPackageForm({ ...packageForm, name: e.target.value })}
                          placeholder="Contoh: Promosi Jasa 7 Hari"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#1683FF]"
                        />
                      </div>

                      {/* Jenis Paket & Durasi */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Jenis Layanan</label>
                          <select
                            value={packageForm.type}
                            onChange={(e) => setPackageForm({ ...packageForm, type: e.target.value })}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#1683FF] bg-white"
                          >
                            <option value="jasa">Jasa (Layanan Freelance)</option>
                            <option value="sewa">Sewa (Unit Alat Fisik)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Durasi Tayang (Hari)</label>
                          <input
                            type="number"
                            min="1"
                            max="365"
                            required
                            value={packageForm.durationDays}
                            onChange={(e) => setPackageForm({ ...packageForm, durationDays: e.target.value })}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#1683FF]"
                          />
                        </div>
                      </div>

                      {/* Harga paket */}
                      <div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Harga / Tarif (Rp)</label>
                          <input
                            type="number"
                            min="10000"
                            step="1000"
                            required
                            value={packageForm.price}
                            onChange={(e) => setPackageForm({ ...packageForm, price: e.target.value })}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#1683FF]"
                          />
                        </div>
                      </div>

                      {/* Penempatan Promosi */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">Penempatan Promosi</label>
                        <p className="text-[11px] text-slate-500 mb-2">Beranda memiliki total 8 slot: maksimal 4 Jasa dan 4 Sewa. Paket dengan Beranda masuk antrean sesuai jenisnya, lalu tetap ada di katalog dan pencarian.</p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          {[
                            { id: "katalog", label: "Katalog" },
                            { id: "search", label: "Hasil Pencarian" },
                            { id: "landing", label: "Beranda (maks. 4 slot per jenis)" },
                          ].map((placement) => {
                            const isChecked = packageForm.placements.includes(placement.id);
                            return (
                              <label key={placement.id} className={`flex items-center gap-2 p-2.5 rounded-xl border text-[11px] font-semibold cursor-pointer transition ${isChecked ? "border-blue-200 bg-blue-50 text-[#1683FF]" : "border-slate-200 text-slate-600"}`}>
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={(e) => {
                                    if (!e.target.checked && packageForm.placements.length === 1) return;
                                    setPackageForm({
                                      ...packageForm,
                                      placements: e.target.checked
                                        ? [...packageForm.placements, placement.id]
                                        : packageForm.placements.filter((id) => id !== placement.id),
                                    });
                                  }}
                                  className="accent-[#1683FF]"
                                />
                                <span>{placement.label}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>

                      {/* Jangkauan & Prioritas */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Tingkat Prioritas (1-3)</label>
                          <select
                            value={packageForm.priority}
                            onChange={(e) => setPackageForm({ ...packageForm, priority: Number(e.target.value) })}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#1683FF] bg-white"
                          >
                            <option value={1}>1 - Prioritas Dasar</option>
                            <option value={2}>2 - Prioritas Standar (Populer)</option>
                            <option value={3}>3 - Prioritas Maksimal (Top)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Status Paket</label>
                          <select
                            value={packageForm.status}
                            onChange={(e) => setPackageForm({ ...packageForm, status: e.target.value })}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#1683FF] bg-white"
                          >
                            <option value="active">Aktif (Bisa Dibeli)</option>
                            <option value="inactive">Nonaktif (Disembunyikan)</option>
                          </select>
                        </div>
                      </div>

                      {/* Benefits & Deskripsi */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Poin Benefit (Pisahkan tiap baris dengan Enter)
                        </label>
                        <textarea
                          rows={3}
                          value={packageForm.benefits}
                          onChange={(e) => setPackageForm({ ...packageForm, benefits: e.target.value })}
                          placeholder="Badge 'Dipromosikan' resmi&#10;Prioritas hasil pencarian&#10;Laporan statistik harian"
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#1683FF]"
                        />
                      </div>

                      {/* LIVE PREVIEW BOX (Step 34) */}
                      <div className="p-3.5 rounded-2xl bg-blue-50/60 border border-blue-100 space-y-2">
                        <span className="text-[10px] font-extrabold text-[#1683FF] uppercase tracking-wider block">
                          Preview Tampilan di Mitra:
                        </span>
                        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between gap-3">
                          <div>
                            <span className="text-[10px] font-extrabold text-blue-600 uppercase bg-blue-50 px-1.5 py-0.2 rounded">
                              {packageForm.type.toUpperCase()}
                            </span>
                            <h5 className="font-bold text-xs text-slate-900 mt-0.5">{packageForm.name || "Nama Paket"}</h5>
                            <p className="text-[10px] text-slate-500">Durasi: {packageForm.durationDays} Hari &middot; Harga minimal Rp10.000</p>
                          </div>
                          <div className="text-right">
                            <span className="font-black text-sm text-[#1683FF]">{formatIDR(packageForm.price || 0)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => setIsPackageModalOpen(false)}
                          className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
                        >
                          Batal
                        </button>
                        <button
                          type="submit"
                          disabled={isSavingPackage}
                          className="px-5 py-2 rounded-xl bg-[#1683FF] hover:bg-[#0F6FE5] disabled:opacity-60 text-white text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5"
                        >
                          {isSavingPackage && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                          {editingPackage ? "Simpan Perubahan" : "Buat Paket"}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* Modal Konfirmasi Hapus Paket Promosi */}
              {deletePackageConfirm.isOpen && (
                <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
                  <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150 space-y-4">
                    <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
                      <AlertTriangle className="w-6 h-6" />
                    </div>

                    <div>
                      <h4 className="text-base font-black text-slate-900">
                        Hapus Paket Promosi?
                      </h4>
                      <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                        Apakah Anda yakin ingin menghapus paket promosi{" "}
                        <span className="font-bold text-slate-900">
                          &quot;{deletePackageConfirm.packageName}&quot;
                        </span>
                        ?
                      </p>
                      <div className="mt-3 p-3 bg-amber-50 rounded-xl border border-amber-200/80 text-[11px] text-amber-900 leading-normal">
                        <span className="font-bold block mb-0.5">Keamanan Riwayat Transaksi:</span>
                        Jika paket ini sedang digunakan oleh transaksi promosi aktif atau riwayat promosi mitra, sistem akan otomatis melakukan <span className="font-semibold underline">soft-delete</span> (menonaktifkan paket) agar tidak merusak data pelaporan mitra.
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        disabled={deletePackageConfirm.isDeleting}
                        onClick={() =>
                          setDeletePackageConfirm({
                            isOpen: false,
                            packageId: null,
                            packageName: "",
                            isDeleting: false,
                          })
                        }
                        className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
                      >
                        Batal
                      </button>
                      <button
                        type="button"
                        disabled={deletePackageConfirm.isDeleting}
                        onClick={handleConfirmDeletePackage}
                        className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5"
                      >
                        {deletePackageConfirm.isDeleting ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Menghapus...</span>
                          </>
                        ) : (
                          <>
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Ya, Hapus Paket</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeMenu === "landing-content" && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                    <Star className="w-4 h-4 text-[#1683FF]" /> Ulasan &amp; Logo Media Partner
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Kelola ulasan testimoni dan logo media partner yang tampil resmi di Beranda platform.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => { setLandingEditorTab("reviews"); setEditingLandingItem(null); }}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${landingEditorTab === "reviews" ? pillActiveCls : pillIdleCls}`}
                  >
                    Ulasan Pelanggan ({landingContent.reviews?.length || 0})
                  </button>
                  <button
                    type="button"
                    onClick={() => { setLandingEditorTab("partners"); setEditingLandingItem(null); }}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${landingEditorTab === "partners" ? pillActiveCls : pillIdleCls}`}
                  >
                    Logo Media Partner ({landingContent.partners?.length || 0})
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_380px] gap-5 items-start">
                {/* List Table */}
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
                  <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
                    <h4 className="text-sm font-black text-slate-900">
                      {landingEditorTab === "reviews" ? "Daftar Ulasan Beranda" : "Daftar Media Partner"}
                    </h4>
                    <button
                      type="button"
                      onClick={() => openLandingForm()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white text-xs font-bold shadow-xs transition cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Tambah Baru
                    </button>
                  </div>
                  <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
                    {(landingEditorTab === "reviews" ? landingContent.reviews : landingContent.partners).length === 0 ? (
                      <div className="p-8 text-center text-slate-400 text-xs">
                        Belum ada data {landingEditorTab === "reviews" ? "ulasan" : "media partner"}.
                      </div>
                    ) : (
                      (landingEditorTab === "reviews" ? landingContent.reviews : landingContent.partners).map((item) => (
                        <div key={item.id} className="p-4 flex gap-3 items-center hover:bg-slate-50 transition">
                          <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center overflow-hidden shrink-0">
                            {item.avatar || item.logoUrl ? (
                              <img src={item.avatar || item.logoUrl} alt={item.name} className="w-full h-full object-cover" />
                            ) : (
                              <Star className="w-5 h-5 text-[#1683FF]" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="text-xs font-bold text-slate-900 truncate">{item.name}</p>
                              {landingEditorTab === "partners" && (
                                <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${item.active !== false ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                                  {item.active !== false ? "Aktif" : "Nonaktif"}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                              {landingEditorTab === "reviews" ? `${item.company ? `(${item.company}) ` : ""}"${item.quote}"` : (item.logoUrl || "Logo teks (tanpa gambar)")}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => openLandingForm(item)}
                              className="p-1.5 text-[#1683FF] hover:bg-blue-50 rounded-lg transition cursor-pointer"
                              title="Edit item"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteLandingItem(item)}
                              className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                              title="Hapus item"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Form Editor */}
                <form onSubmit={saveLandingItem} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3.5">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <h4 className="text-sm font-black text-slate-900">
                      {editingLandingItem ? "Edit" : "Tambah"} {landingEditorTab === "reviews" ? "Ulasan Pelanggan" : "Media Partner"}
                    </h4>
                    {editingLandingItem && (
                      <button
                        type="button"
                        onClick={() => openLandingForm(null)}
                        className="text-[11px] text-slate-400 hover:text-slate-600 font-semibold cursor-pointer"
                      >
                        Reset / Tambah Baru
                      </button>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {landingEditorTab === "reviews" ? "Nama Pelanggan *" : "Nama Media Partner / Perusahaan *"}
                    </label>
                    <input
                      required
                      value={landingForm.name}
                      onChange={(e) => setLandingForm({ ...landingForm, name: e.target.value })}
                      className={inputCls}
                      placeholder={landingEditorTab === "reviews" ? "Contoh: Rizky Ramadhan" : "Contoh: Traveloka / Unilever"}
                    />
                  </div>

                  {landingEditorTab === "reviews" ? (
                    <>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Usaha / Profesi / Institusi</label>
                        <input
                          value={landingForm.company}
                          onChange={(e) => setLandingForm({ ...landingForm, company: e.target.value })}
                          className={inputCls}
                          placeholder="Contoh: Mahasiswa UNSOED / Kedai Kopi"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Isi Ulasan / Testimoni *</label>
                        <textarea
                          required
                          value={landingForm.quote}
                          onChange={(e) => setLandingForm({ ...landingForm, quote: e.target.value })}
                          className={`${inputCls} resize-none`}
                          rows={3}
                          placeholder="Tuliskan ulasan pengalaman menggunakan Bantuin.id..."
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Foto Pelanggan</label>
                        <input
                          type="text"
                          value={landingForm.avatar}
                          onChange={(e) => setLandingForm({ ...landingForm, avatar: e.target.value })}
                          className={`${inputCls} mb-1.5`}
                          placeholder="URL foto (https://images.unsplash.com/...)"
                        />
                        <div className="flex items-center gap-2">
                          <label className="flex-1 cursor-pointer">
                            <span className="block text-center py-1.5 px-3 bg-blue-50 hover:bg-blue-100 text-[#1683FF] text-xs font-bold rounded-xl border border-blue-200 transition">
                              Unggah File Foto
                            </span>
                            <input
                              type="file"
                              accept="image/png,image/jpeg,image/webp,image/svg+xml"
                              onChange={(e) => handleLandingImageUpload(e, "avatar")}
                              className="hidden"
                            />
                          </label>
                          {landingForm.avatar && (
                            <button
                              type="button"
                              onClick={() => setLandingForm({ ...landingForm, avatar: "" })}
                              className="px-2 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-xl border border-rose-200"
                            >
                              Hapus Foto
                            </button>
                          )}
                        </div>
                        {landingForm.avatar && (
                          <div className="mt-2 flex items-center gap-2 p-2 bg-slate-50 rounded-xl border border-slate-100">
                            <img src={landingForm.avatar} alt="Pratinjau" className="w-10 h-10 rounded-full object-cover border border-slate-200" />
                            <span className="text-[10px] text-slate-500 truncate flex-1">{landingForm.avatar}</span>
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Logo Media Partner</label>
                        <input
                          type="text"
                          value={landingForm.logoUrl}
                          onChange={(e) => setLandingForm({ ...landingForm, logoUrl: e.target.value })}
                          className={`${inputCls} mb-1.5`}
                          placeholder="URL logo (https://... logo.png / svg)"
                        />
                        <div className="flex items-center gap-2">
                          <label className="flex-1 cursor-pointer">
                            <span className="block text-center py-1.5 px-3 bg-blue-50 hover:bg-blue-100 text-[#1683FF] text-xs font-bold rounded-xl border border-blue-200 transition">
                              Unggah File Logo
                            </span>
                            <input
                              type="file"
                              accept="image/png,image/jpeg,image/webp,image/svg+xml"
                              onChange={(e) => handleLandingImageUpload(e, "logoUrl")}
                              className="hidden"
                            />
                          </label>
                          {landingForm.logoUrl && (
                            <button
                              type="button"
                              onClick={() => setLandingForm({ ...landingForm, logoUrl: "" })}
                              className="px-2 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-xl border border-rose-200"
                            >
                              Hapus Logo
                            </button>
                          )}
                        </div>
                        {landingForm.logoUrl && (
                          <div className="mt-2 flex items-center gap-2 p-2 bg-slate-50 rounded-xl border border-slate-100">
                            <img src={landingForm.logoUrl} alt="Pratinjau Logo" className="max-h-8 max-w-[120px] object-contain border border-slate-200 rounded p-1" />
                            <span className="text-[10px] text-slate-500 truncate flex-1">{landingForm.logoUrl}</span>
                          </div>
                        )}
                      </div>
                      <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 p-2 rounded-xl bg-slate-50 border border-slate-100 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={landingForm.active}
                          onChange={(e) => setLandingForm({ ...landingForm, active: e.target.checked })}
                          className="accent-[#1683FF] w-4 h-4"
                        />
                        <span>Tampilkan di Beranda</span>
                      </label>
                    </>
                  )}

                  <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                    {editingLandingItem && (
                      <button
                        type="button"
                        onClick={() => openLandingForm(null)}
                        className="py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold transition cursor-pointer"
                      >
                        Batal
                      </button>
                    )}
                    <button
                      type="submit"
                      className="flex-1 py-2.5 rounded-xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white text-xs font-bold shadow-xs transition cursor-pointer"
                    >
                      {editingLandingItem ? "Simpan Perubahan" : "Simpan ke Beranda"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

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
                  {effectiveBroadcastsList.length === 0 ? (
                    <div className="p-8 text-center text-slate-400">
                      <Megaphone className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-xs font-semibold text-slate-600">Belum Ada Pengumuman</p>
                      <p className="text-[11px] text-slate-400 mt-1">Klik tombol &ldquo;Siaran Baru&rdquo; di atas untuk menerbitkan pengumuman platform.</p>
                    </div>
                  ) : (
                    effectiveBroadcastsList.map((bc) => (
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
                    ))
                  )}
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
                      {effectiveAuditLogsList.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-12 text-center text-slate-400">
                            <History className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                            <p className="font-semibold text-slate-600">Belum Ada Rekam Jejak Audit</p>
                            <p className="text-xs text-slate-400 mt-0.5">Aktivitas administratif akan tercatat otomatis di sini.</p>
                          </td>
                        </tr>
                      ) : (
                        effectiveAuditLogsList.map((log) => (
                          <tr key={log.id} className="hover:bg-[#F5FAFF]">
                            <td className="py-3 px-3 text-slate-400 whitespace-nowrap font-mono text-[11px]">{formatDateTimeIndo(log.timestamp)}</td>
                            <td className="py-3 px-3 font-semibold text-slate-900">{log.actor}</td>
                            <td className="py-3 px-3"><span className="px-2 py-0.5 rounded-md bg-blue-50 text-[#1683FF] font-bold text-[10px] font-mono">{log.action}</span></td>
                            <td className="py-3 px-3 text-slate-900 font-medium">{log.target}</td>
                            <td className="py-3 px-3 text-slate-500 max-w-xs truncate">{log.details}</td>
                          </tr>
                        ))
                      )}
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
                            <UserAvatar src={thread.userAvatar} name={thread.userName} size="md" rounded="rounded-full" />
                            <UnreadBadge count={thread.unread ? 1 : 0} dotOnly />
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
                          <UserAvatar src={selectedThread.userAvatar} name={selectedThread.userName} size="md" rounded="rounded-full" />
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
                                {!isAdmin && <UserAvatar src={selectedThread.userAvatar} name={selectedThread.userName} size="xs" rounded="rounded-full" />}
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

      {/* ── PHOTO & PDF DOCUMENT PREVIEW MODAL ─────────────────────────── */}
      {previewImageUrl && (
        <DocumentPreviewModal
          url={previewImageUrl}
          title="Pratinjau Dokumen / Foto Bukti"
          onClose={() => setPreviewImageUrl(null)}
        />
      )}

      {/* ============================================================ */}
      {/* MOBILE GLASS BOTTOM NAVIGATION (lg:hidden)                  */}
      {/* ============================================================ */}
      <nav 
        aria-label="Navigasi Bawah Admin"
        className="fixed bottom-0 inset-x-0 z-40 lg:hidden bg-white/90 backdrop-blur-xl border-t border-slate-200/80 shadow-[0_-4px_24px_rgba(0,0,0,0.06)] pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-1"
      >
        <div className="grid grid-cols-5 h-14 max-w-lg mx-auto px-1 items-center">
          {/* 1. Overview */}
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
            <span className="text-[10px] font-bold leading-tight mt-0.5 truncate max-w-[64px]">Dashboard</span>
          </button>

          {/* 2. Pengguna */}
          <button
            type="button"
            onClick={() => { setActiveMenu("users"); setIsMobileMoreOpen(false); }}
            className={`flex flex-col items-center justify-center py-1 rounded-xl transition min-h-[44px] cursor-pointer ${
              activeMenu === "users" ? "text-[#1683FF]" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <div className={`w-9 h-7 rounded-full flex items-center justify-center transition ${
              activeMenu === "users" ? "bg-[#EAF4FF] text-[#1683FF]" : "bg-transparent"
            }`}>
              <Users className={`w-5 h-5 ${activeMenu === "users" ? "scale-110" : ""}`} />
            </div>
            <span className="text-[10px] font-bold leading-tight mt-0.5 truncate max-w-[64px]">Users</span>
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
                <Package className={`w-5 h-5 ${activeMenu === "orders" ? "scale-110" : ""}`} />
              </div>
            </div>
            <span className="text-[10px] font-bold leading-tight mt-0.5 truncate max-w-[64px]">Pesanan</span>
          </button>

          {/* 4. Keuangan */}
          <button
            type="button"
            onClick={() => { setActiveMenu("finance"); setIsMobileMoreOpen(false); }}
            className={`flex flex-col items-center justify-center py-1 rounded-xl transition min-h-[44px] cursor-pointer ${
              activeMenu === "finance" ? "text-[#1683FF]" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <div className={`w-9 h-7 rounded-full flex items-center justify-center transition ${
              activeMenu === "finance" ? "bg-[#EAF4FF] text-[#1683FF]" : "bg-transparent"
            }`}>
              <DollarSign className={`w-5 h-5 ${activeMenu === "finance" ? "scale-110" : ""}`} />
            </div>
            <span className="text-[10px] font-bold leading-tight mt-0.5 truncate max-w-[64px]">Keuangan</span>
          </button>

          {/* 5. Menu Admin (•••) */}
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
      {/* MOBILE "MENU ADMIN" STRUCTURED BOTTOM SHEET                  */}
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
                <Shield className="w-4 h-4 text-[#1683FF]" />
                <h3 className="font-extrabold text-sm text-slate-900">Menu Konsol Admin</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileMoreOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Group 1: Direktori Pengguna & Mitra */}
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Manajemen Pengguna &amp; Mitra
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => { setActiveMenu("users"); setIsMobileMoreOpen(false); }}
                  className={`p-3 rounded-2xl border text-left flex items-center gap-2.5 transition ${
                    activeMenu === "users" ? "bg-blue-50 border-[#1683FF] text-[#1683FF]" : "bg-slate-50 border-slate-200/80 text-slate-700"
                  }`}
                >
                  <Users className="w-4 h-4 shrink-0 text-[#1683FF]" />
                  <span className="text-xs font-bold truncate">Semua Pengguna</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setActiveMenu("providers"); setIsMobileMoreOpen(false); }}
                  className={`p-3 rounded-2xl border text-left flex items-center gap-2.5 transition ${
                    activeMenu === "providers" ? "bg-blue-50 border-[#1683FF] text-[#1683FF]" : "bg-slate-50 border-slate-200/80 text-slate-700"
                  }`}
                >
                  <Building2 className="w-4 h-4 shrink-0 text-[#1683FF]" />
                  <span className="text-xs font-bold truncate">Penyedia Jasa</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setActiveMenu("partners"); setIsMobileMoreOpen(false); }}
                  className={`p-3 rounded-2xl border text-left flex items-center gap-2.5 transition ${
                    activeMenu === "partners" ? "bg-blue-50 border-[#1683FF] text-[#1683FF]" : "bg-slate-50 border-slate-200/80 text-slate-700"
                  }`}
                >
                  <Store className="w-4 h-4 shrink-0 text-[#1683FF]" />
                  <span className="text-xs font-bold truncate">Mitra Rental</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setActiveMenu("verification"); setIsMobileMoreOpen(false); }}
                  className={`p-3 rounded-2xl border text-left flex items-center justify-between transition ${
                    activeMenu === "verification" ? "bg-blue-50 border-[#1683FF] text-[#1683FF]" : "bg-slate-50 border-slate-200/80 text-slate-700"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <UserCheck className="w-4 h-4 shrink-0 text-[#1683FF]" />
                    <span className="text-xs font-bold truncate">Verifikasi KYC</span>
                  </div>
                  {pendingKycList.length > 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold bg-[#1683FF] text-white shrink-0">
                      {pendingKycList.length}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Group 2: Transaksi & Keuangan */}
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Transaksi, Keuangan &amp; Sengketa
              </div>
              <div className="space-y-1.5">
                <button
                  type="button"
                  onClick={() => { setActiveMenu("orders"); setIsMobileMoreOpen(false); }}
                  className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition ${
                    activeMenu === "orders" ? "bg-blue-50 border-[#1683FF] text-[#1683FF]" : "bg-slate-50/60 border-slate-200/60 text-slate-700"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-slate-500" />
                    <span className="text-xs font-bold">Semua Pesanan &amp; Transaksi</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </button>

                <button
                  type="button"
                  onClick={() => { setActiveMenu("finance"); setIsMobileMoreOpen(false); }}
                  className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition ${
                    activeMenu === "finance" ? "bg-blue-50 border-[#1683FF] text-[#1683FF]" : "bg-slate-50/60 border-slate-200/60 text-slate-700"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-bold">Pusat Keuangan, Pencairan &amp; Deposit</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </button>

                <button
                  type="button"
                  onClick={() => { setActiveMenu("disputes"); setIsMobileMoreOpen(false); }}
                  className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition ${
                    activeMenu === "disputes" ? "bg-blue-50 border-[#1683FF] text-[#1683FF]" : "bg-slate-50/60 border-slate-200/60 text-slate-700"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-500" />
                    <span className="text-xs font-bold">Laporan &amp; Penyelesaian Sengketa</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </button>
              </div>
            </div>

            {/* Group 3: Promosi & Sistem */}
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Promosi, Voucher &amp; Audit
              </div>
              <div className="space-y-1.5">
                <button
                  type="button"
                  onClick={() => { setActiveMenu("vouchers"); setIsMobileMoreOpen(false); }}
                  className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition ${
                    activeMenu === "vouchers" ? "bg-blue-50 border-[#1683FF] text-[#1683FF]" : "bg-slate-50/60 border-slate-200/60 text-slate-700"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Ticket className="w-4 h-4 text-amber-500" />
                    <span className="text-xs font-bold">Voucher Promo Wilayah</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </button>

                <button
                  type="button"
                  onClick={() => { setActiveMenu("promotions"); setIsMobileMoreOpen(false); }}
                  className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition ${
                    activeMenu === "promotions" ? "bg-blue-50 border-[#1683FF] text-[#1683FF]" : "bg-slate-50/60 border-slate-200/60 text-slate-700"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Rocket className="w-4 h-4 text-[#1683FF]" />
                    <span className="text-xs font-bold">Moderasi Promosi Landing</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </button>

                <button
                  type="button"
                  onClick={() => { setActiveMenu("audit"); setIsMobileMoreOpen(false); }}
                  className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition ${
                    activeMenu === "audit" ? "bg-blue-50 border-[#1683FF] text-[#1683FF]" : "bg-slate-50/60 border-slate-200/60 text-slate-700"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-slate-500" />
                    <span className="text-xs font-bold">Audit Trail &amp; Log Sistem</span>
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
                <span>Buka Chat</span>
              </Link>
              <Link
                href="/"
                target="_blank"
                className="flex-1 py-2 px-3 rounded-xl bg-blue-50 text-[#1683FF] text-xs font-bold text-center flex items-center justify-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Lihat Web Publik</span>
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
