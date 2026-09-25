"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useApp } from "@/lib/context/AppContext";
import logoImg from "@/components/image/logo.png";
import { 
  Menu, 
  X,
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
  CheckCheck,
  Clock,
  ChevronDown,
  User,
  LogOut,
  ShieldCheck,
  ShieldAlert
} from "lucide-react";

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

  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const chatRef = useRef(null);
  const notifRef = useRef(null);
  const profileRef = useRef(null);

  // Close popovers on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (chatRef.current && !chatRef.current.contains(event.target)) {
        setIsChatOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setIsNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
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

  // Core nav links tengah — Bantuan · Sewa · Jasa
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
    <header className="sticky top-0 z-50 w-full bg-white/85 backdrop-blur-xl border-b border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] transition-all">
      {/* Full Width Container */}
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 h-16 flex items-center justify-between gap-3 sm:gap-4">
        
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

          {/* Focused GPS Location Button */}
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

        {/* Center: Clean Dedicated Nav Links (Bantuan · Sewa · Jasa) */}
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

        {/* Right: Conditional Navigation (Logged In VS Logged Out) */}
        <div className="flex items-center gap-2">
          
          {/* IF LOGGED IN: Show Portal Jasa, Chat, Notifikasi & User Profile */}
          {currentUser ? (
            <div className="flex items-center gap-1.5 sm:gap-2">
              
              {/* Portal Jasa — tampil untuk semua user login */}
              <Link
                href="/jasa/dashboard"
                className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-[#EAF4FF] hover:bg-[#1683FF] text-[#1683FF] hover:text-white border border-[#DCEAF7] hover:border-[#1683FF] shadow-2xs transition active:scale-95 shrink-0"
                title="Portal Jasa — Dashboard Penyedia Layanan"
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>Portal Jasa</span>
              </Link>

              {/* Interactive Chat Button with Real Unread Indicator */}
              <div className="relative" ref={chatRef}>
                <button
                  onClick={() => {
                    setIsChatOpen(!isChatOpen);
                    setIsNotifOpen(false);
                  }}
                  className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/80 hover:bg-white border border-slate-200/80 shadow-2xs flex items-center justify-center text-slate-600 hover:text-[#1683FF] transition active:scale-95 cursor-pointer"
                  title="Pesan & Obrolan"
                >
                  <MessageSquare className="w-4 h-4" />
                  {totalChatUnread > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-[#1683FF] text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white animate-pulse">
                      {totalChatUnread}
                    </span>
                  )}
                </button>

                {/* Interactive Chat Popover */}
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

              {/* Interactive Notification Button with Indicator */}
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => {
                    setIsNotifOpen(!isNotifOpen);
                    setIsChatOpen(false);
                  }}
                  className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/80 hover:bg-white border border-slate-200/80 shadow-2xs flex items-center justify-center text-slate-600 hover:text-[#1683FF] transition active:scale-95 cursor-pointer"
                  title="Notifikasi"
                >
                  <Bell className="w-4 h-4" />
                  {totalNotifUnread > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white animate-pulse">
                      {totalNotifUnread}
                    </span>
                  )}
                </button>

                {/* Interactive Notif Popover */}
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

              {/* Interactive User Profile Dropdown */}
              <div className="relative" ref={profileRef}>
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
                  <span className="text-xs font-bold text-slate-800 hidden md:inline max-w-[75px] truncate">
                    {currentUser.fullName.split(" ")[0]}
                  </span>
                  <img
                    src={currentUser.avatarUrl}
                    alt={currentUser.fullName}
                    className="w-7 h-7 rounded-full object-cover ring-1 ring-slate-100 shrink-0"
                  />
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 mr-0.5 transition-transform duration-200 ${isProfileOpen ? "rotate-180 text-[#1683FF]" : ""}`} />
                </button>

                {/* Profile Dropdown Popover */}
                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-72 bg-white/95 backdrop-blur-2xl rounded-2xl shadow-xl border border-[#DCEAF7] p-2.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                    
                    {/* Header: User Summary */}
                    <div className="px-3 py-2.5 border-b border-[#DCEAF7] flex items-center gap-3 mb-1">
                      <img
                        src={currentUser.avatarUrl}
                        alt={currentUser.fullName}
                        className="w-10 h-10 rounded-full object-cover ring-1 ring-[#DCEAF7] shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-[#102A43] truncate">
                            {currentUser.fullName}
                          </span>
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="Aktif" />
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

                    {/* Navigation Items */}
                    <div className="space-y-0.5 py-1">
                      
                      {/* 1. AKTIVITAS SAYA (UTAMA) */}
                      <Link
                        href="/activity"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center justify-between p-2.5 rounded-xl hover:bg-[#EAF4FF] transition group text-[#102A43] hover:text-[#1683FF]"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-[#EAF4FF] group-hover:bg-[#1683FF] text-[#1683FF] group-hover:text-white flex items-center justify-center transition">
                            <Activity className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-xs font-bold leading-none">Aktivitas Saya</div>
                            <div className="text-[10px] text-[#61758A] group-hover:text-[#1683FF] mt-1">
                              Status sewa, bantuan &amp; riwayat
                            </div>
                          </div>
                        </div>
                        {orderRooms.filter((r) => r.orderStatus !== "completed" && r.orderStatus !== "cancelled").length > 0 && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#1683FF] text-white">
                            {orderRooms.filter((r) => r.orderStatus !== "completed" && r.orderStatus !== "cancelled").length} Aktif
                          </span>
                        )}
                      </Link>

                      {/* 2. PROFIL SAYA */}
                      <Link
                        href="/profile"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center justify-between p-2.5 rounded-xl hover:bg-[#EAF4FF] transition group text-[#102A43] hover:text-[#1683FF]"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-[#EAF4FF] group-hover:bg-[#1683FF] text-[#1683FF] group-hover:text-white flex items-center justify-center transition">
                            <User className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-xs font-bold leading-none">Profil &amp; Akun</div>
                            <div className="text-[10px] text-[#61758A] mt-1">Pengaturan data &amp; identitas</div>
                          </div>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-[#61758A] group-hover:translate-x-0.5 group-hover:text-[#1683FF] transition" />
                      </Link>

                      {/* 3. WORKSPACE CHAT */}
                      <Link
                        href="/chat"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center justify-between p-2.5 rounded-xl hover:bg-[#EAF4FF] transition group text-[#102A43] hover:text-[#1683FF]"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-[#EAF4FF] group-hover:bg-[#1683FF] text-[#1683FF] group-hover:text-white flex items-center justify-center transition">
                            <MessageSquare className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-xs font-bold leading-none">Ruang Obrolan</div>
                            <div className="text-[10px] text-[#61758A] mt-1">Pesan &amp; koordinasi pesanan</div>
                          </div>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-[#61758A] group-hover:translate-x-0.5 group-hover:text-[#1683FF] transition" />
                      </Link>

                      {/* 4. DASHBOARD MITRA / PENYEDIA / DAFTAR MITRA */}
                      {currentUser.accountType === "provider" ? (
                        <Link
                          href="/jasa/dashboard"
                          onClick={() => setIsProfileOpen(false)}
                          className="flex items-center justify-between p-2.5 rounded-xl hover:bg-[#EAF4FF] transition group text-[#102A43] hover:text-[#1683FF]"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-[#EAF4FF] group-hover:bg-[#1683FF] text-[#1683FF] group-hover:text-white flex items-center justify-center transition">
                              <Briefcase className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="text-xs font-bold leading-none">Dashboard Jasa</div>
                              <div className="text-[10px] text-[#61758A] mt-1">Kelola katalog layanan</div>
                            </div>
                          </div>
                          <ArrowRight className="w-3.5 h-3.5 text-[#61758A] group-hover:text-[#1683FF]" />
                        </Link>
                      ) : currentUser.accountType === "mitra" ? (
                        <Link
                          href="/mitra/dashboard"
                          onClick={() => setIsProfileOpen(false)}
                          className="flex items-center justify-between p-2.5 rounded-xl hover:bg-[#EAF4FF] transition group text-[#102A43] hover:text-[#1683FF]"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-[#EAF4FF] group-hover:bg-[#1683FF] text-[#1683FF] group-hover:text-white flex items-center justify-center transition">
                              <Store className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="text-xs font-bold leading-none">Dashboard Mitra</div>
                              <div className="text-[10px] text-[#61758A] mt-1">Kelola unit &amp; toko sewa</div>
                            </div>
                          </div>
                          <ArrowRight className="w-3.5 h-3.5 text-[#61758A] group-hover:text-[#1683FF]" />
                        </Link>
                      ) : (
                        <Link
                          href="/mitra/register"
                          onClick={() => setIsProfileOpen(false)}
                          className="flex items-center justify-between p-2.5 rounded-xl hover:bg-[#EAF4FF] transition group text-[#102A43] hover:text-[#1683FF]"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-[#EAF4FF] group-hover:bg-[#1683FF] text-[#1683FF] group-hover:text-white flex items-center justify-center transition">
                              <Store className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="text-xs font-bold leading-none">Daftar Mitra Sewa</div>
                              <div className="text-[10px] text-[#61758A] mt-1">Buka rental alat &amp; kendaraan</div>
                            </div>
                          </div>
                          <ArrowRight className="w-3.5 h-3.5 text-[#61758A] group-hover:text-[#1683FF]" />
                        </Link>
                      )}

                      {/* 5. PUSAT KEAMANAN */}
                      <Link
                        href="/keamanan"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex items-center justify-between p-2.5 rounded-xl hover:bg-[#EAF4FF] transition group text-[#102A43] hover:text-[#1683FF]"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-[#EAF4FF] group-hover:bg-[#1683FF] text-[#1683FF] group-hover:text-white flex items-center justify-center transition">
                            <ShieldAlert className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-xs font-bold leading-none">Pusat Keamanan</div>
                            <div className="text-[10px] text-[#61758A] mt-1">Garansi Pembayaran &amp; Safe Point</div>
                          </div>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-[#61758A] group-hover:text-[#1683FF]" />
                      </Link>
                    </div>

                    {/* Divider & Logout */}
                    <div className="pt-1.5 mt-1 border-t border-[#DCEAF7]">
                      <Link
                        href="/auth/logout"
                        onClick={() => setIsProfileOpen(false)}
                        className="w-full flex items-center gap-2.5 p-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                      >
                        <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600">
                          <LogOut className="w-4 h-4" />
                        </div>
                        <span>Keluar dari Akun</span>
                      </Link>
                    </div>

                  </div>
                )}
              </div>

            </div>
          ) : (
            /* IF LOGGED OUT: Show STRICTLY ONLY Clean 'Masuk' and 'Daftar' */
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Link
                href="/auth/login"
                className="text-xs sm:text-sm font-bold px-3.5 py-2 text-slate-700 hover:text-slate-950 transition rounded-full hover:bg-white/70"
              >
                Masuk
              </Link>
              <Link
                href="/auth/register"
                className="text-xs sm:text-sm font-black px-5 sm:px-6 py-2 sm:py-2.5 rounded-full bg-gradient-to-b from-[#1683FF] to-[#0F6FE5] text-white hover:brightness-105 shadow-[0_4px_16px_rgba(22,131,255,0.35)] transition active:scale-95"
              >
                Daftar
              </Link>
            </div>
          )}

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            className="md:hidden p-2 text-slate-700 hover:bg-slate-100 rounded-full transition"
          >
            {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

      </div>

      {/* Mobile Glass Dropdown Menu */}
      {isMobileOpen && (
        <div className="md:hidden w-full bg-white/95 backdrop-blur-2xl border-b border-slate-200/80 px-4 sm:px-6 py-4 shadow-xl space-y-2 animate-in fade-in duration-200">
          <div className="pb-2.5 mb-2 border-b border-slate-100 flex items-center justify-between text-xs px-1">
            <div className="flex items-center gap-2 min-w-0">
              <Navigation className={`w-3.5 h-3.5 shrink-0 ${userCoordinates ? "text-emerald-600 fill-emerald-100" : "text-[#1683FF]"}`} />
              <span className="font-bold text-slate-900 truncate max-w-[200px]">
                {currentLocation}
              </span>
            </div>
            {userCoordinates ? (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" title="GPS Aktif" />
            ) : (
              <button
                type="button"
                onClick={handleDetectGPS}
                disabled={isDetectingGPS}
                className="text-[11px] font-bold text-[#1683FF] hover:underline shrink-0"
              >
                {isDetectingGPS ? "Mendeteksi..." : "Deteksi GPS"}
              </button>
            )}
          </div>

          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              onClick={() => setIsMobileOpen(false)}
              className="block px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-white/80 hover:text-[#1683FF] rounded-xl transition"
            >
              {link.name}
            </Link>
          ))}
          
          <div className="pt-2 border-t border-slate-100 space-y-2">
            {!currentUser ? (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/auth/login"
                  onClick={() => setIsMobileOpen(false)}
                  className="w-full text-center py-2.5 rounded-full bg-slate-100 text-slate-800 text-xs font-bold block"
                >
                  Masuk
                </Link>
                <Link
                  href="/auth/register"
                  onClick={() => setIsMobileOpen(false)}
                  className="w-full text-center py-2.5 rounded-full bg-[#1683FF] text-white text-xs font-bold block shadow-md"
                >
                  Daftar
                </Link>
              </div>
            ) : (
              <>
                <Link
                  href="/activity"
                  onClick={() => setIsMobileOpen(false)}
                  className="w-full text-center py-2.5 rounded-full bg-blue-50 border border-blue-200 text-[#1683FF] text-xs font-bold block"
                >
                  Aktivitas Saya
                </Link>
                <Link
                  href="/chat"
                  onClick={() => setIsMobileOpen(false)}
                  className="w-full text-center py-2.5 rounded-full bg-slate-100 text-slate-800 text-xs font-bold block"
                >
                  Workspace Obrolan
                </Link>
                <Link
                  href="/profile"
                  onClick={() => setIsMobileOpen(false)}
                  className="w-full text-center py-2.5 rounded-full bg-slate-100 text-slate-800 text-xs font-bold block"
                >
                  Profil Saya
                </Link>
                {currentUser.accountType === "provider" ? (
                  <Link
                    href="/jasa/dashboard"
                    onClick={() => setIsMobileOpen(false)}
                    className="w-full text-center py-2.5 rounded-full bg-blue-50 border border-blue-200 text-[#1683FF] text-xs font-bold block"
                  >
                    Dashboard Jasa
                  </Link>
                ) : currentUser.accountType === "mitra" ? (
                  <Link
                    href="/mitra/dashboard"
                    onClick={() => setIsMobileOpen(false)}
                    className="w-full text-center py-2.5 rounded-full bg-blue-50 border border-blue-200 text-[#1683FF] text-xs font-bold block"
                  >
                    Dashboard Mitra Sewa
                  </Link>
                ) : (
                  <Link
                    href="/mitra/register"
                    onClick={() => setIsMobileOpen(false)}
                    className="w-full text-center py-2.5 rounded-full bg-blue-50 border border-blue-200 text-[#1683FF] text-xs font-bold block"
                  >
                    Daftar Mitra Sewa
                  </Link>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
