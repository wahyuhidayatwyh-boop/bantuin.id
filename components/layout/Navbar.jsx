"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useApp } from "@/lib/context/AppContext";
import logoImg from "@/components/image/logo.png";
import { 
  Navigation,
  Briefcase,
  Store,
  MessageSquare,
  Bell,
  CheckCircle2,
  MapPin,
  Compass,
  ArrowRight,
  Activity,
  ChevronDown,
  User,
  LogOut,
  ShieldCheck,
  ShieldAlert,
  HelpCircle,
  FileText,
  BookOpen
} from "lucide-react";
import MobileBottomNav from "@/components/layout/MobileBottomNav";
import UnreadBadge from "@/components/ui/UnreadBadge";

function formatNavChatTime(d) {
  if (!d) return "Baru saja";
  if (typeof d === "string" && !d.includes("T") && !d.includes("-")) return d;
  const dateObj = typeof d === "string" ? new Date(d) : d;
  if (!dateObj || isNaN(dateObj.getTime?.())) return typeof d === "string" ? d : "Baru saja";
  const now = new Date();
  const diff = now - dateObj;
  if (diff < 60000) return "Baru saja";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}j`;
  return dateObj.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { 
    currentUser, 
    selectedLocation, 
    setSelectedLocation, 
    detectUserLocation, 
    isDetectingLocation,
    userCoordinates, 
    userRealLocation,
    setIsGpsModalOpen,
    orderRooms = [],
    notifications = [],
    markNotificationAsRead,
    markAllNotificationsAsRead,
    markChatRoomAsRead,
  } = useApp();
  const [isDetectingGPS, setIsDetectingGPS] = useState(false);

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const chatRef = useRef(null);
  const notifRef = useRef(null);
  const profileRef = useRef(null);
  const mobileProfileTriggerRef = useRef(null);

  // Close popovers on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (chatRef.current && !chatRef.current.contains(event.target)) {
        setIsChatOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setIsNotifOpen(false);
      }
      if (
        profileRef.current && 
        !profileRef.current.contains(event.target) &&
        (!mobileProfileTriggerRef.current || !mobileProfileTriggerRef.current.contains(event.target))
      ) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currentLocation = userRealLocation?.shortLocation || selectedLocation || "Pilih Lokasi";

  const handleDetectGPS = async () => {
    setIsDetectingGPS(true);
    try {
      if (detectUserLocation) {
        const loc = await detectUserLocation();
        if (loc?.shortLocation) {
          setSelectedLocation(loc.shortLocation);
        }
      }
    } catch (err) {
      console.warn("GPS detection failed:", err);
    } finally {
      setIsDetectingGPS(false);
    }
  };

  // Core nav links tengah — Bantuan · Sewa · Jasa (Desktop)
  const navLinks = [
    { name: "Bantuan", href: "/bantuan" },
    { name: "Sewa", href: "/sewa" },
    { name: "Jasa", href: "/jasa" },
  ];

  // Dynamic Recent Chats derived from real orderRooms
  const recentChats = (orderRooms || []).slice(0, 5).map((room) => {
    const isRequesterMe = room.requester?.id === currentUser?.id;
    const partner = isRequesterMe ? room.helper : room.requester;
    const partnerName = partner?.name || "Mitra / Pengguna";
    const partnerAvatar = partner?.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80";
    
    // Find last message
    const msgs = room.messages || [];
    const lastMsgObj = msgs[msgs.length - 1];
    const lastMsgText = lastMsgObj ? lastMsgObj.message : (room.requestTitle || "Pesanan aktif");
    const lastMsgTime = lastMsgObj?.timestamp || room.lastUpdated || "Baru saja";
    const hasUnread = (room.unreadCount && room.unreadCount > 0) || (lastMsgObj && !lastMsgObj.isMe && lastMsgObj.senderId !== "system" && !lastMsgObj.read);

    const categoryType = room.orderType === "rental" ? "Sewa" : (room.orderType === "service" || room.categoryType === "jasa" ? "Jasa" : "Bantuan");

    return {
      id: room.id,
      name: partnerName,
      avatar: partnerAvatar,
      lastMsg: lastMsgText,
      time: formatNavChatTime(lastMsgTime),
      unread: Boolean(hasUnread),
      category: categoryType,
      roomTitle: room.requestTitle || room.rentalDetails?.unitName || "Transaksi",
    };
  });

  const totalChatUnread = recentChats.filter((c) => c.unread).length;
  const totalNotifUnread = (notifications || []).filter((n) => n.unread).length;
  const activeOrdersCount = (orderRooms || []).filter(
    (r) => r.orderStatus !== "completed" && r.orderStatus !== "cancelled"
  ).length;

  const handleChatClick = (roomId) => {
    if (markChatRoomAsRead) {
      markChatRoomAsRead(roomId);
    }
    setIsChatOpen(false);
    router.push(`/chat?room=${roomId}`);
  };

  const handleNotifClick = (notif) => {
    if (markNotificationAsRead) {
      markNotificationAsRead(notif.id);
    }
    setIsNotifOpen(false);
    if (notif.link) {
      router.push(notif.link);
    } else {
      router.push("/activity");
    }
  };

  return (
    <>
    <header className="sticky top-0 z-50 w-full bg-white/85 backdrop-blur-xl border-b border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] transition-all">
      {/* Full Width Container */}
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 h-16 flex items-center justify-between gap-3 sm:gap-4 relative">
        
        {/* Left: Official Logo & Realtime 38-Provinces Location Pill */}
        <div className="flex items-center gap-2.5 sm:gap-4">
          <Link href="/" className="flex items-center group shrink-0">
            <Image
              src={logoImg}
              alt="Bantuin"
              height={38}
              className="h-8 sm:h-9 w-auto object-contain mix-blend-multiply transition-transform group-hover:scale-105"
              priority
            />
          </Link>

          {/* Focused GPS Location Button (Desktop only) */}
          <div className="relative hidden md:flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleDetectGPS}
              disabled={isDetectingGPS || isDetectingLocation}
              className="flex items-center gap-2 text-xs font-semibold px-4 py-1.5 rounded-full bg-slate-100/80 hover:bg-slate-100 text-slate-700 border border-slate-200/60 shadow-2xs hover:shadow-xs transition active:scale-95 group cursor-pointer"
              title={userRealLocation?.fullAddress || "Klik untuk deteksi & sinkronisasi lokasi GPS perangkat"}
            >
              <Navigation className={`w-3.5 h-3.5 shrink-0 transition-transform ${
                isDetectingGPS || isDetectingLocation
                  ? "text-[#1683FF] animate-spin"
                  : userCoordinates
                  ? "text-emerald-600 fill-emerald-100"
                  : "text-[#1683FF] group-hover:scale-110"
              }`} />
              <span className="max-w-[170px] sm:max-w-[210px] lg:max-w-[260px] truncate font-bold text-slate-900">
                {isDetectingGPS || isDetectingLocation ? "Mendeteksi GPS..." : currentLocation}
              </span>
              {userCoordinates ? (
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" title="GPS Aktif" />
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] text-[#1683FF] font-bold bg-blue-50 hover:bg-blue-100 px-2.5 py-0.5 rounded-full border border-blue-200/70 shrink-0">
                  <Compass className={`w-3 h-3 ${isDetectingGPS || isDetectingLocation ? "animate-spin" : ""}`} />
                  <span>Deteksi GPS</span>
                </span>
              )}
            </button>

            {/* Quick button to open full location permission / preset modal */}
            <button
              type="button"
              onClick={() => setIsGpsModalOpen(true)}
              title="Atur izin lokasi atau pilih wilayah simulasi"
              className="p-2 rounded-full text-slate-400 hover:text-[#1683FF] hover:bg-slate-100 transition cursor-pointer"
            >
              <MapPin className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Center: Clean Dedicated Nav Links (Bantuan · Sewa · Jasa) (Desktop only) */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 backdrop-blur-md p-1 rounded-full border border-slate-200/60">
          {navLinks.map((link) => {
            const isActive = pathname === link.href || (link.href === "/bantuan" && pathname.startsWith("/bantuan"));
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`px-4 py-1.5 text-xs xl:text-[13px] font-semibold rounded-full transition-all ${
                  isActive 
                    ? "text-[#1683FF] font-bold bg-white shadow-[0_2px_8px_rgba(0,0,0,0.06)]" 
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </nav>

        {/* Right Section: Desktop Full Nav vs Mobile Simplified Nav */}
        <div className="flex items-center gap-2">
          
          {/* ======================================================== */}
          {/* DESKTOP NAVIGATION (MD & UP)                             */}
          {/* ======================================================== */}
          <div className="hidden md:flex items-center gap-2">
            {currentUser ? (
              <div className="flex items-center gap-2">
                {/* Portal Jasa — Desktop */}
                <Link
                  href="/jasa/dashboard"
                  className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-[#EAF4FF] hover:bg-[#1683FF] text-[#1683FF] hover:text-white border border-[#DCEAF7] hover:border-[#1683FF] shadow-2xs transition active:scale-95 shrink-0"
                  title="Portal Jasa — Dashboard Penyedia Layanan"
                >
                  <Briefcase className="w-3.5 h-3.5" />
                  <span>Portal Jasa</span>
                </Link>

                {/* Desktop Chat Button with Interactive Popover */}
                <div className="relative" ref={chatRef}>
                  <button
                    onClick={() => {
                      setIsChatOpen(!isChatOpen);
                      setIsNotifOpen(false);
                      setIsProfileOpen(false);
                    }}
                    className="relative w-9 h-9 rounded-full bg-white/80 hover:bg-white border border-slate-200/80 shadow-2xs flex items-center justify-center text-slate-600 hover:text-[#1683FF] transition active:scale-95 cursor-pointer"
                    title="Pesan & Obrolan"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <UnreadBadge count={totalChatUnread} />
                  </button>

                  {/* Desktop Chat Popover */}
                  {isChatOpen && (
                    <div className="absolute right-0 mt-2 w-84 bg-white/95 backdrop-blur-2xl rounded-2xl shadow-xl border border-white/90 p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
                        <div className="flex items-center gap-1.5">
                          <MessageSquare className="w-3.5 h-3.5 text-[#1683FF]" />
                          <span className="text-xs font-bold text-slate-900">Pesan &amp; Obrolan</span>
                        </div>
                        {totalChatUnread > 0 ? (
                          <span className="text-[10px] font-bold text-[#1683FF] bg-blue-50 px-2 py-0.5 rounded-full">
                            {totalChatUnread} Belum Dibaca
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium text-slate-400">Semua Terbaca</span>
                        )}
                      </div>

                      <div className="space-y-1.5 max-h-[320px] overflow-y-auto pr-0.5">
                        {recentChats.length === 0 ? (
                          <div className="py-6 text-center text-xs text-slate-400">
                            Belum ada obrolan aktif.
                          </div>
                        ) : (
                          recentChats.map((chat) => (
                            <div
                              key={chat.id}
                              onClick={() => handleChatClick(chat.id)}
                              className="p-2.5 rounded-xl hover:bg-blue-50/70 transition cursor-pointer flex items-center gap-3 group border border-transparent hover:border-blue-100"
                            >
                              <div className="relative shrink-0">
                                <img
                                  src={chat.avatar}
                                  alt={chat.name}
                                  className="w-9 h-9 rounded-full object-cover ring-1 ring-slate-100"
                                />
                                {chat.unread && (
                                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#1683FF] ring-2 ring-white" />
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between mb-0.5">
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <span className="text-xs font-bold text-slate-900 truncate group-hover:text-[#1683FF] transition">
                                      {chat.name}
                                    </span>
                                    <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded shrink-0 ${
                                      chat.category === "Sewa" 
                                        ? "bg-blue-50 text-[#1683FF] border border-blue-200/60" 
                                        : chat.category === "Jasa"
                                        ? "bg-indigo-50 text-indigo-700 border border-indigo-200/60"
                                        : "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                                    }`}>
                                      {chat.category}
                                    </span>
                                  </div>
                                  <span className="text-[10px] text-slate-400 shrink-0 ml-1">{chat.time}</span>
                                </div>
                                <p className="text-[11px] text-slate-500 truncate leading-snug">
                                  {chat.lastMsg}
                                </p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      <Link
                        href="/chat"
                        onClick={() => setIsChatOpen(false)}
                        className="mt-2 w-full py-2 bg-slate-50 hover:bg-[#1683FF] text-slate-700 hover:text-white rounded-xl text-[11px] font-bold transition flex items-center justify-center gap-1 border border-slate-200 hover:border-[#1683FF]"
                      >
                        <span>Buka Ruang Obrolan Lengkap</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  )}
                </div>

                {/* Desktop Notification Button with Indicator */}
                <div className="relative" ref={notifRef}>
                  <button
                    onClick={() => {
                      setIsNotifOpen(!isNotifOpen);
                      setIsChatOpen(false);
                      setIsProfileOpen(false);
                    }}
                    className="relative w-9 h-9 rounded-full bg-white/80 hover:bg-white border border-slate-200/80 shadow-2xs flex items-center justify-center text-slate-600 hover:text-[#1683FF] transition active:scale-95 cursor-pointer"
                    title="Notifikasi"
                  >
                    <Bell className="w-4 h-4" />
                    {totalNotifUnread > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white animate-pulse">
                        {totalNotifUnread}
                      </span>
                    )}
                  </button>

                  {/* Desktop Notif Popover */}
                  {isNotifOpen && (
                    <div className="absolute right-0 mt-2 w-84 sm:w-88 bg-white/95 backdrop-blur-2xl rounded-2xl shadow-xl border border-white/90 p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
                        <div className="flex items-center gap-1.5">
                          <Bell className="w-3.5 h-3.5 text-rose-500" />
                          <span className="text-xs font-bold text-slate-900">Notifikasi</span>
                          {totalNotifUnread > 0 && (
                            <span className="text-[10px] font-bold bg-rose-50 text-rose-600 px-2 py-0.5 rounded-full">
                              {totalNotifUnread} Baru
                            </span>
                          )}
                        </div>
                        {totalNotifUnread > 0 && (
                          <button
                            type="button"
                            onClick={markAllNotificationsAsRead}
                            className="text-[10px] font-semibold text-[#1683FF] hover:underline cursor-pointer"
                          >
                            Tandai Semua Dibaca
                          </button>
                        )}
                      </div>

                      <div className="space-y-1.5 max-h-[320px] overflow-y-auto pr-0.5">
                        {notifications.length === 0 ? (
                          <div className="py-6 text-center text-xs text-slate-400">
                            Tidak ada notifikasi saat ini.
                          </div>
                        ) : (
                          notifications.map((n) => (
                            <div
                              key={n.id}
                              onClick={() => handleNotifClick(n)}
                              className={`p-2.5 rounded-xl transition cursor-pointer flex items-start gap-2.5 border ${
                                n.unread 
                                  ? "bg-blue-50/40 border-blue-100/80 hover:bg-blue-50/80" 
                                  : "bg-white hover:bg-slate-50 border-transparent"
                              }`}
                            >
                              <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                                n.category === "sewa"
                                  ? "bg-blue-50 text-[#1683FF]"
                                  : n.category === "bantuan"
                                  ? "bg-emerald-50 text-emerald-600"
                                  : n.category === "jasa"
                                  ? "bg-indigo-50 text-indigo-600"
                                  : "bg-purple-50 text-purple-600"
                              }`}>
                                <CheckCircle2 className="w-4 h-4" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between">
                                  <span className={`text-xs font-bold truncate ${n.unread ? "text-[#102A43]" : "text-slate-700"}`}>
                                    {n.title}
                                  </span>
                                  <span className="text-[10px] text-slate-400 shrink-0 ml-1">{n.time}</span>
                                </div>
                                <p className="text-[11px] text-slate-500 leading-snug mt-0.5 line-clamp-2">
                                  {n.desc}
                                </p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      <Link
                        href="/activity"
                        onClick={() => setIsNotifOpen(false)}
                        className="mt-2 w-full py-2 bg-slate-50 hover:bg-[#1683FF] text-slate-700 hover:text-white rounded-xl text-[11px] font-bold transition flex items-center justify-center gap-1 border border-slate-200 hover:border-[#1683FF]"
                      >
                        <span>Lihat Riwayat &amp; Status Aktivitas</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  )}
                </div>

                {/* Desktop User Profile Button */}
                <button 
                  type="button"
                  onClick={() => {
                    setIsProfileOpen(!isProfileOpen);
                    setIsChatOpen(false);
                    setIsNotifOpen(false);
                  }}
                  className="flex items-center gap-1.5 p-1 pl-2.5 rounded-full border border-slate-200/80 bg-white/80 hover:bg-white hover:border-[#1683FF]/50 shadow-2xs transition active:scale-95 cursor-pointer"
                  title="Menu Profil & Akun"
                >
                  <span className="text-xs font-bold text-slate-800 max-w-[75px] truncate">
                    {currentUser.fullName.split(" ")[0]}
                  </span>
                  <img
                    src={currentUser.avatarUrl}
                    alt={currentUser.fullName}
                    className="w-7 h-7 rounded-full object-cover ring-1 ring-slate-100 shrink-0"
                  />
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 mr-0.5 transition-transform duration-200 ${isProfileOpen ? "rotate-180 text-[#1683FF]" : ""}`} />
                </button>
              </div>
            ) : (
              /* Desktop Logged Out */
              <div className="flex items-center gap-2">
                <Link
                  href="/auth/login"
                  className="text-xs sm:text-sm font-bold px-4 py-2 text-slate-700 hover:text-slate-950 transition rounded-full hover:bg-white/70"
                >
                  Masuk
                </Link>
                <Link
                  href="/auth/register"
                  className="text-xs sm:text-sm font-black px-5 sm:px-6 py-2 rounded-full bg-gradient-to-b from-[#1683FF] to-[#0F6FE5] text-white hover:brightness-105 shadow-[0_4px_16px_rgba(22,131,255,0.35)] transition active:scale-95"
                >
                  Daftar
                </Link>
              </div>
            )}
          </div>

          {/* ======================================================== */}
          {/* MOBILE TOP NAVIGATION (MD:HIDDEN)                        */}
          {/* STRUCTURE: [Peta] [Chat] [Profil]                        */}
          {/* ======================================================== */}
          <div className="flex md:hidden items-center gap-1.5">
            
            {/* [Peta] Button */}
            <button
              type="button"
              onClick={() => {
                setIsProfileOpen(false);
                setIsGpsModalOpen(true);
              }}
              aria-label="Pilih Lokasi & GPS"
              className="relative w-9 h-9 rounded-full bg-slate-100/90 hover:bg-slate-200/80 active:scale-95 transition flex items-center justify-center text-slate-700 border border-slate-200/70 cursor-pointer"
              title="Pilih Lokasi & GPS"
            >
              <MapPin className="w-4 h-4 text-[#1683FF]" />
              {userCoordinates && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white" />
              )}
            </button>

            {/* [Chat] Direct Button */}
            <Link
              href={currentUser ? "/chat" : "/auth/login?redirect=/chat"}
              aria-label="Pesan & Obrolan"
              className="relative w-9 h-9 rounded-full bg-slate-100/90 hover:bg-slate-200/80 active:scale-95 transition flex items-center justify-center text-slate-700 border border-slate-200/70"
              title="Pesan & Obrolan"
            >
              <MessageSquare className="w-4 h-4 text-slate-700" />
              <UnreadBadge count={totalChatUnread} />
            </Link>

            {/* [Profil] Trigger Button */}
            <button
              ref={mobileProfileTriggerRef}
              type="button"
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              aria-label="Menu Profil & Navigasi"
              className="relative w-9 h-9 rounded-full bg-slate-100/90 hover:bg-slate-200/80 active:scale-95 transition flex items-center justify-center border border-slate-200/70 overflow-hidden cursor-pointer"
              title="Menu Profil & Navigasi"
            >
              {currentUser ? (
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.fullName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-4 h-4 text-slate-700" />
              )}
            </button>

          </div>

        </div>

      </div>

      {/* ======================================================== */}
      {/* UNIFIED PROFILE SUBMENU (DRAWER/POPOVER)                 */}
      {/* Hosts all secondary links formerly in hamburger menu     */}
      {/* ======================================================== */}
      {isProfileOpen && (
        <div
          ref={profileRef}
          className="fixed top-[66px] inset-x-3 sm:inset-x-auto sm:right-6 md:right-8 lg:right-10 md:absolute md:top-full md:mt-2 w-auto sm:w-84 max-h-[82vh] overflow-y-auto bg-white/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-[#DCEAF7] p-2.5 z-50 animate-in fade-in zoom-in-95 duration-150"
        >
          {currentUser ? (
            /* LOGGED IN USER PROFILE SUBMENU */
            <>
              {/* Header: User Summary */}
              <div className="px-3 py-2.5 border-b border-[#DCEAF7] mb-1">
                <div className="flex items-center gap-3">
                  <img
                    src={currentUser.avatarUrl}
                    alt={currentUser.fullName}
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-[#DCEAF7] shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-[#102A43] truncate">
                        {currentUser.fullName}
                      </span>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" title="Aktif" />
                    </div>
                    <p className="text-[11px] text-[#61758A] truncate">
                      {currentUser.email}
                    </p>
                    <div className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.2 rounded-full mt-1 border border-emerald-200/60">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      <span>Terverifikasi KYC</span>
                    </div>
                  </div>
                </div>

                {/* Location Pill & Switcher */}
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[11px]">
                  <div className="flex items-center gap-1.5 text-slate-600 min-w-0">
                    <MapPin className="w-3.5 h-3.5 text-[#1683FF] shrink-0" />
                    <span className="truncate font-semibold max-w-[170px] sm:max-w-[190px]">{currentLocation}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileOpen(false);
                      setIsGpsModalOpen(true);
                    }}
                    className="text-[10px] font-bold text-[#1683FF] hover:underline shrink-0 cursor-pointer ml-2"
                  >
                    Ubah
                  </button>
                </div>
              </div>

              {/* SECTION 1: Akun & Pengaturan */}
              <div className="py-1">
                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider px-2.5 py-1">
                  Akun &amp; Pengaturan
                </div>

                {/* Aktivitas Saya (Desktop only, mobile diakses via Bottom Nav) */}
                <Link
                  href="/activity"
                  onClick={() => setIsProfileOpen(false)}
                  className="hidden md:flex items-center justify-between p-2 rounded-xl hover:bg-[#EAF4FF] transition group text-[#102A43] hover:text-[#1683FF]"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#EAF4FF] group-hover:bg-[#1683FF] text-[#1683FF] group-hover:text-white flex items-center justify-center transition shrink-0">
                      <Activity className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold leading-none">Aktivitas Saya</div>
                      <div className="text-[10px] text-[#61758A] group-hover:text-[#1683FF] mt-1">
                        Pesanan aktif, sewa &amp; riwayat
                      </div>
                    </div>
                  </div>
                  {activeOrdersCount > 0 && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#1683FF] text-white shrink-0">
                      {activeOrdersCount} Aktif
                    </span>
                  )}
                </Link>

                {/* Profil & Akun (Mobile & Desktop) */}
                <Link
                  href="/profile"
                  onClick={() => setIsProfileOpen(false)}
                  className="flex items-center justify-between p-2 rounded-xl hover:bg-[#EAF4FF] transition group text-[#102A43] hover:text-[#1683FF]"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#EAF4FF] group-hover:bg-[#1683FF] text-[#1683FF] group-hover:text-white flex items-center justify-center transition shrink-0">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold leading-none">Profil &amp; Akun</div>
                      <div className="text-[10px] text-[#61758A] mt-1">Identitas &amp; verifikasi data</div>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-[#61758A] group-hover:translate-x-0.5 group-hover:text-[#1683FF] transition shrink-0" />
                </Link>

                {/* Ruang Obrolan (Desktop only, mobile diakses via Top Nav) */}
                <Link
                  href="/chat"
                  onClick={() => setIsProfileOpen(false)}
                  className="hidden md:flex items-center justify-between p-2 rounded-xl hover:bg-[#EAF4FF] transition group text-[#102A43] hover:text-[#1683FF]"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#EAF4FF] group-hover:bg-[#1683FF] text-[#1683FF] group-hover:text-white flex items-center justify-center transition shrink-0">
                      <MessageSquare className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold leading-none">Ruang Obrolan</div>
                      <div className="text-[10px] text-[#61758A] mt-1">Pesan &amp; koordinasi pesanan</div>
                    </div>
                  </div>
                  {totalChatUnread > 0 ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#1683FF] text-white shrink-0">
                      {totalChatUnread} Baru
                    </span>
                  ) : (
                    <ArrowRight className="w-3.5 h-3.5 text-[#61758A] group-hover:translate-x-0.5 group-hover:text-[#1683FF] transition shrink-0" />
                  )}
                </Link>
              </div>

              {/* SECTION 2: Bisnis & Mitra */}
              <div className="py-1 border-t border-[#DCEAF7]/80">
                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider px-2.5 py-1">
                  Bisnis &amp; Mitra
                </div>

                {/* Dashboard Jasa */}
                <Link
                  href="/jasa/dashboard"
                  onClick={() => setIsProfileOpen(false)}
                  className="flex items-center justify-between p-2 rounded-xl hover:bg-[#EAF4FF] transition group text-[#102A43] hover:text-[#1683FF]"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#EAF4FF] group-hover:bg-[#1683FF] text-[#1683FF] group-hover:text-white flex items-center justify-center transition shrink-0">
                      <Briefcase className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold leading-none">
                        {currentUser.accountType === "provider" ? "Dashboard Jasa" : "Portal Penyedia Jasa"}
                      </div>
                      <div className="text-[10px] text-[#61758A] mt-1">Kelola katalog layanan &amp; keahlian</div>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-[#61758A] group-hover:text-[#1683FF] shrink-0" />
                </Link>

                {/* Dashboard Mitra Sewa / Daftar Mitra */}
                {currentUser.accountType === "mitra" ? (
                  <Link
                    href="/mitra/dashboard"
                    onClick={() => setIsProfileOpen(false)}
                    className="flex items-center justify-between p-2 rounded-xl hover:bg-[#EAF4FF] transition group text-[#102A43] hover:text-[#1683FF]"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-[#EAF4FF] group-hover:bg-[#1683FF] text-[#1683FF] group-hover:text-white flex items-center justify-center transition shrink-0">
                        <Store className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold leading-none">Dashboard Mitra Sewa</div>
                        <div className="text-[10px] text-[#61758A] mt-1">Kelola unit &amp; toko sewa</div>
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-[#61758A] group-hover:text-[#1683FF] shrink-0" />
                  </Link>
                ) : (
                  <Link
                    href="/mitra/register"
                    onClick={() => setIsProfileOpen(false)}
                    className="flex items-center justify-between p-2 rounded-xl hover:bg-[#EAF4FF] transition group text-[#102A43] hover:text-[#1683FF]"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-[#EAF4FF] group-hover:bg-[#1683FF] text-[#1683FF] group-hover:text-white flex items-center justify-center transition shrink-0">
                        <Store className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold leading-none">Daftar Mitra Sewa</div>
                        <div className="text-[10px] text-[#61758A] mt-1">Buka rental alat &amp; kendaraan</div>
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-[#61758A] group-hover:text-[#1683FF] shrink-0" />
                  </Link>
                )}
              </div>

              {/* SECTION 3: Bantuan & Legalitas */}
              <div className="py-1 border-t border-[#DCEAF7]/80">
                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider px-2.5 py-1">
                  Bantuan &amp; Panduan
                </div>

                {/* Pusat Keamanan */}
                <Link
                  href="/keamanan"
                  onClick={() => setIsProfileOpen(false)}
                  className="flex items-center justify-between p-2 rounded-xl hover:bg-[#EAF4FF] transition group text-[#102A43] hover:text-[#1683FF]"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#EAF4FF] group-hover:bg-[#1683FF] text-[#1683FF] group-hover:text-white flex items-center justify-center transition shrink-0">
                      <ShieldAlert className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold leading-none">Pusat Keamanan &amp; Garansi</div>
                      <div className="text-[10px] text-[#61758A] mt-1">Garansi Pembayaran &amp; Safe Point</div>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-[#61758A] group-hover:text-[#1683FF] shrink-0" />
                </Link>

                {/* Cara Kerja */}
                <Link
                  href="/cara-kerja"
                  onClick={() => setIsProfileOpen(false)}
                  className="flex items-center justify-between p-2 rounded-xl hover:bg-[#EAF4FF] transition group text-[#102A43] hover:text-[#1683FF]"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#EAF4FF] group-hover:bg-[#1683FF] text-[#1683FF] group-hover:text-white flex items-center justify-center transition shrink-0">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold leading-none">Cara Kerja Platform</div>
                      <div className="text-[10px] text-[#61758A] mt-1">Panduan sewa, bantuan, &amp; jasa</div>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-[#61758A] group-hover:text-[#1683FF] shrink-0" />
                </Link>

                {/* FAQ & Bantuan */}
                <Link
                  href="/faq"
                  onClick={() => setIsProfileOpen(false)}
                  className="flex items-center justify-between p-2 rounded-xl hover:bg-[#EAF4FF] transition group text-[#102A43] hover:text-[#1683FF]"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#EAF4FF] group-hover:bg-[#1683FF] text-[#1683FF] group-hover:text-white flex items-center justify-center transition shrink-0">
                      <HelpCircle className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold leading-none">FAQ &amp; Kendala</div>
                      <div className="text-[10px] text-[#61758A] mt-1">Pertanyaan umum &amp; solusi</div>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-[#61758A] group-hover:text-[#1683FF] shrink-0" />
                </Link>

                {/* Syarat & Ketentuan */}
                <Link
                  href="/syarat-ketentuan"
                  onClick={() => setIsProfileOpen(false)}
                  className="flex items-center justify-between p-2 rounded-xl hover:bg-[#EAF4FF] transition group text-[#102A43] hover:text-[#1683FF]"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#EAF4FF] group-hover:bg-[#1683FF] text-[#1683FF] group-hover:text-white flex items-center justify-center transition shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold leading-none">Syarat &amp; Ketentuan</div>
                      <div className="text-[10px] text-[#61758A] mt-1">Aturan penggunaan platform</div>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-[#61758A] group-hover:text-[#1683FF] shrink-0" />
                </Link>

                {/* Kebijakan Privasi */}
                <Link
                  href="/kebijakan-privasi"
                  onClick={() => setIsProfileOpen(false)}
                  className="flex items-center justify-between p-2 rounded-xl hover:bg-[#EAF4FF] transition group text-[#102A43] hover:text-[#1683FF]"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#EAF4FF] group-hover:bg-[#1683FF] text-[#1683FF] group-hover:text-white flex items-center justify-center transition shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold leading-none">Kebijakan Privasi</div>
                      <div className="text-[10px] text-[#61758A] mt-1">Perlindungan data pengguna</div>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-[#61758A] group-hover:text-[#1683FF] shrink-0" />
                </Link>
              </div>

              {/* Logout Button */}
              <div className="pt-2 mt-1 border-t border-[#DCEAF7]">
                <Link
                  href="/auth/logout"
                  onClick={() => setIsProfileOpen(false)}
                  className="w-full flex items-center gap-2.5 p-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600 shrink-0">
                    <LogOut className="w-4 h-4" />
                  </div>
                  <span>Keluar dari Akun</span>
                </Link>
              </div>
            </>
          ) : (
            /* GUEST USER PROFILE SUBMENU */
            <>
              {/* Header: Welcome */}
              <div className="px-3 py-2.5 border-b border-[#DCEAF7] mb-2">
                <div className="flex items-center gap-2.5 mb-1">
                  <div className="w-9 h-9 rounded-full bg-[#EAF4FF] text-[#1683FF] flex items-center justify-center font-black shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-[#102A43]">Selamat Datang di Bantuin</h3>
                    <p className="text-[11px] text-[#61758A]">Masuk atau daftar untuk akses penuh fitur</p>
                  </div>
                </div>

                {/* Location Quick Indicator */}
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[11px]">
                  <div className="flex items-center gap-1.5 text-slate-600 min-w-0">
                    <MapPin className="w-3.5 h-3.5 text-[#1683FF] shrink-0" />
                    <span className="truncate font-semibold max-w-[170px] sm:max-w-[190px]">{currentLocation}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileOpen(false);
                      setIsGpsModalOpen(true);
                    }}
                    className="text-[10px] font-bold text-[#1683FF] hover:underline shrink-0 cursor-pointer ml-2"
                  >
                    Ubah
                  </button>
                </div>
              </div>

              {/* Primary Action Buttons */}
              <div className="grid grid-cols-2 gap-2 p-1 mb-2">
                <Link
                  href="/auth/login"
                  onClick={() => setIsProfileOpen(false)}
                  className="w-full text-center py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold block transition"
                >
                  Masuk
                </Link>
                <Link
                  href="/auth/register"
                  onClick={() => setIsProfileOpen(false)}
                  className="w-full text-center py-2.5 rounded-xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white text-xs font-bold block shadow-xs transition"
                >
                  Daftar
                </Link>
              </div>

              {/* Bisnis & Kemitraan */}
              <div className="py-1 border-t border-[#DCEAF7]/80">
                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider px-2.5 py-1">
                  Peluang Mitra
                </div>

                <Link
                  href="/mitra/register"
                  onClick={() => setIsProfileOpen(false)}
                  className="flex items-center justify-between p-2 rounded-xl hover:bg-[#EAF4FF] transition group text-[#102A43] hover:text-[#1683FF]"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#EAF4FF] group-hover:bg-[#1683FF] text-[#1683FF] group-hover:text-white flex items-center justify-center transition shrink-0">
                      <Store className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold leading-none">Daftar Mitra Sewa</div>
                      <div className="text-[10px] text-[#61758A] mt-1">Buka rental alat &amp; barang</div>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-[#61758A] group-hover:text-[#1683FF] shrink-0" />
                </Link>

                <Link
                  href="/jasa/dashboard"
                  onClick={() => setIsProfileOpen(false)}
                  className="flex items-center justify-between p-2 rounded-xl hover:bg-[#EAF4FF] transition group text-[#102A43] hover:text-[#1683FF]"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#EAF4FF] group-hover:bg-[#1683FF] text-[#1683FF] group-hover:text-white flex items-center justify-center transition shrink-0">
                      <Briefcase className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold leading-none">Portal Penyedia Jasa</div>
                      <div className="text-[10px] text-[#61758A] mt-1">Tawarkan keahlian &amp; skill Anda</div>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-[#61758A] group-hover:text-[#1683FF] shrink-0" />
                </Link>
              </div>

              {/* Bantuan & Legal */}
              <div className="py-1 border-t border-[#DCEAF7]/80">
                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider px-2.5 py-1">
                  Bantuan &amp; Panduan
                </div>

                <Link
                  href="/keamanan"
                  onClick={() => setIsProfileOpen(false)}
                  className="flex items-center justify-between p-2 rounded-xl hover:bg-[#EAF4FF] transition group text-[#102A43] hover:text-[#1683FF]"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#EAF4FF] group-hover:bg-[#1683FF] text-[#1683FF] group-hover:text-white flex items-center justify-center transition shrink-0">
                      <ShieldAlert className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold leading-none">Pusat Keamanan &amp; Garansi</div>
                      <div className="text-[10px] text-[#61758A] mt-1">Garansi Pembayaran &amp; Safe Point</div>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-[#61758A] group-hover:text-[#1683FF] shrink-0" />
                </Link>

                <Link
                  href="/cara-kerja"
                  onClick={() => setIsProfileOpen(false)}
                  className="flex items-center justify-between p-2 rounded-xl hover:bg-[#EAF4FF] transition group text-[#102A43] hover:text-[#1683FF]"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#EAF4FF] group-hover:bg-[#1683FF] text-[#1683FF] group-hover:text-white flex items-center justify-center transition shrink-0">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold leading-none">Cara Kerja Platform</div>
                      <div className="text-[10px] text-[#61758A] mt-1">Panduan sewa, bantuan, &amp; jasa</div>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-[#61758A] group-hover:text-[#1683FF] shrink-0" />
                </Link>

                <Link
                  href="/faq"
                  onClick={() => setIsProfileOpen(false)}
                  className="flex items-center justify-between p-2 rounded-xl hover:bg-[#EAF4FF] transition group text-[#102A43] hover:text-[#1683FF]"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#EAF4FF] group-hover:bg-[#1683FF] text-[#1683FF] group-hover:text-white flex items-center justify-center transition shrink-0">
                      <HelpCircle className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold leading-none">FAQ &amp; Kendala</div>
                      <div className="text-[10px] text-[#61758A] mt-1">Pertanyaan umum &amp; solusi</div>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-[#61758A] group-hover:text-[#1683FF] shrink-0" />
                </Link>

                <Link
                  href="/syarat-ketentuan"
                  onClick={() => setIsProfileOpen(false)}
                  className="flex items-center justify-between p-2 rounded-xl hover:bg-[#EAF4FF] transition group text-[#102A43] hover:text-[#1683FF]"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#EAF4FF] group-hover:bg-[#1683FF] text-[#1683FF] group-hover:text-white flex items-center justify-center transition shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold leading-none">Syarat &amp; Ketentuan</div>
                      <div className="text-[10px] text-[#61758A] mt-1">Aturan penggunaan platform</div>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-[#61758A] group-hover:text-[#1683FF] shrink-0" />
                </Link>

                <Link
                  href="/kebijakan-privasi"
                  onClick={() => setIsProfileOpen(false)}
                  className="flex items-center justify-between p-2 rounded-xl hover:bg-[#EAF4FF] transition group text-[#102A43] hover:text-[#1683FF]"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#EAF4FF] group-hover:bg-[#1683FF] text-[#1683FF] group-hover:text-white flex items-center justify-center transition shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold leading-none">Kebijakan Privasi</div>
                      <div className="text-[10px] text-[#61758A] mt-1">Perlindungan data pengguna</div>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-[#61758A] group-hover:text-[#1683FF] shrink-0" />
                </Link>
              </div>
            </>
          )}
        </div>
      )}

    </header>
    <MobileBottomNav />
    </>
  );
}
