"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useApp } from "@/lib/context/AppContext";
import UnreadBadge from "@/components/ui/UnreadBadge";
import { 
  Home, 
  HandHelping, 
  Store, 
  Activity, 
  Briefcase
} from "lucide-react";

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { currentUser, orderRooms = [], notifications = [] } = useApp();

  // Count ongoing activities and unread notifications combined for "Aktivitas" badge
  const activeActivitiesCount = useMemo(() => {
    const ongoing = (orderRooms || []).filter(
      (r) => r.orderStatus !== "completed" && r.orderStatus !== "cancelled"
    ).length;
    const unreadNotifs = (notifications || []).filter((n) => n.unread).length;
    return ongoing + unreadNotifs;
  }, [orderRooms, notifications]);

  // If in chat workspace, let the chat UI manage full mobile screen
  const isInsideChatRoom = pathname === "/chat";
  if (isInsideChatRoom) return null;

  // Also do not render on dedicated full-screen dashboards that have their own custom bottom navigation
  if (
    pathname?.startsWith("/mitra/dashboard") ||
    pathname?.startsWith("/jasa/dashboard") ||
    pathname?.startsWith("/admin")
  ) {
    return null;
  }

  const navItems = [
    {
      label: "Beranda",
      href: "/",
      icon: Home,
      isActive: pathname === "/",
    },
    {
      label: "Jasa",
      href: "/jasa",
      icon: Briefcase,
      isActive: pathname?.startsWith("/jasa"),
    },
    {
      label: "Bantuan",
      href: "/bantuan",
      icon: HandHelping,
      isActive: pathname?.startsWith("/bantuan"),
    },
    {
      label: "Sewa",
      href: "/sewa",
      icon: Store,
      isActive: pathname?.startsWith("/sewa"),
    },
    {
      label: "Aktivitas",
      href: "/activity",
      icon: Activity,
      isActive: pathname?.startsWith("/activity"),
      badge: activeActivitiesCount > 0 ? activeActivitiesCount : undefined,
    },
  ];

  return (
    <nav 
      aria-label="Navigasi Utama Mobile"
      className="fixed bottom-0 inset-x-0 z-40 md:hidden bg-white/90 backdrop-blur-xl border-t border-slate-200/80 shadow-[0_-4px_24px_rgba(0,0,0,0.06)] pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-1"
    >
      <div className="grid grid-cols-5 h-14 max-w-lg mx-auto px-1 items-center">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = item.isActive;

          return (
            <Link
              key={item.label}
              href={item.href}
              aria-label={item.label}
              className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all relative min-h-[44px] ${
                active 
                  ? "text-[#1683FF] font-extrabold" 
                  : "text-slate-600 hover:text-slate-900 font-semibold"
              }`}
            >
              <div className="relative">
                <div 
                  className={`w-9 h-7 rounded-full flex items-center justify-center transition-all ${
                    active ? "bg-[#EAF4FF] text-[#1683FF]" : "bg-transparent"
                  }`}
                >
                  <Icon className={`w-5 h-5 transition-transform ${active ? "scale-110" : ""}`} />
                </div>

                <UnreadBadge count={item.badge} />
              </div>

              <span className={`text-[10px] leading-tight tracking-tight mt-0.5 truncate max-w-[64px] ${
                active ? "text-[#1683FF] font-bold" : "text-slate-600 font-medium"
              }`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
