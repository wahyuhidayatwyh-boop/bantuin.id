"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useApp } from "@/lib/context/AppContext";
import logoImg from "@/components/image/logo.png";
import { 
  Menu, 
  X,
  Navigation,
  Briefcase,
  MessageSquare,
  Bell,
  CheckCircle2,
  MapPin,
  Compass,
  ArrowRight
} from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const { 
    currentUser, 
    selectedLocation, 
    setSelectedLocation, 
    detectUserLocation, 
    isDetectingLocation,
    userCoordinates, 
    userRealLocation,
    setIsGpsModalOpen,
  } = useApp();
  const [isDetectingGPS, setIsDetectingGPS] = useState(false);

  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const currentLocation = userRealLocation?.shortLocation || selectedLocation || "Jakarta & Sekitarnya";

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

  // Clean core nav links
  const navLinks = [
    { name: "Bantuan", href: "/bantuan" },
    { name: "Sewa", href: "/sewa" },
    { name: "Jasa", href: "/jasa" },
  ];

  const notifications = [
    {
      id: "n-1",
      title: "Tawaran Bantuan Diterima",
      desc: "Sarah K. menerima penawaran bantuan dokumen kamu.",
      time: "5m lalu",
      unread: true,
    },
    {
      id: "n-2",
      title: "Escrow Xendit Terkunci",
      desc: "Pembayaran rental Sony A6400 berhasil diamankan.",
      time: "1j lalu",
      unread: false,
    },
  ];

  const recentChats = [
    {
      id: "c-1",
      name: "Andi Saputra",
      avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=120&q=80",
      lastMsg: "Halo kak, saya sudah di lokasi lobby notaris ya...",
      time: "2m lalu",
      unread: true,
    },
    {
      id: "c-2",
      name: "Depok Cam Hub",
      avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=120&q=80",
      lastMsg: "Unit kamera dan 2 baterai sudah siap diambil.",
      time: "35m lalu",
      unread: false,
    },
  ];

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
              
              {/* Portal Jasa Shortcut Button */}
              <Link
                href="/jasa/dashboard"
                className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-indigo-50/90 hover:bg-indigo-100 text-indigo-800 border border-indigo-200/70 shadow-2xs transition active:scale-95 shrink-0"
                title="Portal Penyedia Jasa"
              >
                <Briefcase className="w-3.5 h-3.5 text-indigo-600" />
                <span className="hidden xl:inline">Portal Jasa</span>
              </Link>

              {/* Compact Chat Button with Indicator */}
              <div className="relative">
                <button
                  onClick={() => {
                    setIsChatOpen(!isChatOpen);
                    setIsNotifOpen(false);
                  }}
                  className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/80 hover:bg-white border border-slate-200/80 shadow-2xs flex items-center justify-center text-slate-600 hover:text-[#1683FF] transition active:scale-95"
                  title="Pesan & Chat"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#1683FF] ring-2 ring-white" />
                </button>

                {/* Chat Popover */}
                {isChatOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white/95 backdrop-blur-2xl rounded-2xl shadow-xl border border-white/90 p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
                      <span className="text-xs font-bold text-slate-900">Pesan & Diskusi</span>
                      <span className="text-[10px] font-bold text-[#1683FF] bg-blue-50 px-2 py-0.5 rounded-full">1 Baru</span>
                    </div>
                    <div className="space-y-1.5">
                      {recentChats.map((chat) => (
                        <div
                          key={chat.id}
                          className="p-2.5 rounded-xl hover:bg-slate-50 transition cursor-pointer flex items-center gap-3"
                        >
                          <div className="relative shrink-0">
                            <img
                              src={chat.avatar}
                              alt={chat.name}
                              className="w-9 h-9 rounded-full object-cover"
                            />
                            {chat.unread && (
                              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between mb-0.5">
                              <span className="text-xs font-bold text-slate-900 truncate">{chat.name}</span>
                              <span className="text-[10px] text-slate-400">{chat.time}</span>
                            </div>
                            <p className="text-[11px] text-slate-500 truncate">{chat.lastMsg}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <Link
                      href="/chat"
                      onClick={() => setIsChatOpen(false)}
                      className="mt-2 w-full py-2 bg-slate-50 hover:bg-[#1683FF] text-slate-700 hover:text-white rounded-xl text-[11px] font-bold transition flex items-center justify-center gap-1 border border-slate-200 hover:border-[#1683FF]"
                    >
                      <span>Buka Workspace Obrolan Penuh</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                )}
              </div>

              {/* Compact Notification Button with Indicator */}
              <div className="relative">
                <button
                  onClick={() => {
                    setIsNotifOpen(!isNotifOpen);
                    setIsChatOpen(false);
                  }}
                  className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/80 hover:bg-white border border-slate-200/80 shadow-2xs flex items-center justify-center text-slate-600 hover:text-[#1683FF] transition active:scale-95"
                  title="Notifikasi"
                >
                  <Bell className="w-4 h-4" />
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white" />
                </button>

                {/* Notif Popover */}
                {isNotifOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white/95 backdrop-blur-2xl rounded-2xl shadow-xl border border-white/90 p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
                      <span className="text-xs font-bold text-slate-900">Notifikasi</span>
                      <span className="text-[10px] text-slate-400">Terbaru</span>
                    </div>
                    <div className="space-y-1.5">
                      {notifications.map((n) => (
                        <div
                          key={n.id}
                          className="p-2.5 rounded-xl hover:bg-slate-50 transition flex items-start gap-2.5"
                        >
                          <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#1683FF] flex items-center justify-center shrink-0 mt-0.5">
                            <CheckCircle2 className="w-4 h-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-900 truncate">{n.title}</span>
                              <span className="text-[10px] text-slate-400 shrink-0">{n.time}</span>
                            </div>
                            <p className="text-[11px] text-slate-500 leading-snug mt-0.5">{n.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* User Profile */}
              <Link 
                href="/profile" 
                className="flex items-center gap-1.5 p-1 pl-2.5 rounded-full border border-white/90 bg-white/80 hover:bg-white shadow-2xs transition shrink-0"
              >
                <span className="text-xs font-bold text-slate-800 hidden md:inline max-w-[75px] truncate">
                  {currentUser.fullName.split(" ")[0]}
                </span>
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.fullName}
                  className="w-7 h-7 rounded-full object-cover ring-1 ring-slate-100 shrink-0"
                />
              </Link>

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
                  href="/chat"
                  onClick={() => setIsMobileOpen(false)}
                  className="w-full text-center py-2.5 rounded-full bg-blue-50 border border-blue-200 text-[#1683FF] text-xs font-bold block"
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
                <Link
                  href="/jasa/dashboard"
                  onClick={() => setIsMobileOpen(false)}
                  className="w-full text-center py-2.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs font-bold block"
                >
                  Portal Penyedia Jasa
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
