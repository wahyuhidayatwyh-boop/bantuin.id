"use client";

import { useCallback, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useApp } from "@/lib/context/AppContext";

const PROTECTED_PATHS = [
  /^\/chat(?:\/|$)/,
  /^\/profile(?:\/|$)/,
  /^\/activity(?:\/|$)/,
  /^\/admin(?:\/|$)/,
  /^\/lapor(?:\/|$)/,
  /^\/bantuan\/create(?:\/|$)/,
  /^\/bantuan\/[^/]+\/ajukan(?:\/|$)/,
  /^\/(bantuan|jasa|sewa)\/[^/]+\/pembayaran(?:\/|$)/,
  /^\/(jasa|mitra)\/dashboard(?:\/|$)/,
];

const ACTION_LABEL = /\b(pesan|chat|bayar|pembayaran|sewa|booking|ajukan|buat bantuan|lanjutkan|simpan|terbitkan|aktifkan promosi|mulai|hubungi|kirim|konfirmasi|pilih helper)\b/i;

function isProtectedPath(path) {
  return PROTECTED_PATHS.some((pattern) => pattern.test(path));
}

export default function GuestActionGuard({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isAuthReady, addToast } = useApp() || {};

  const goToLogin = useCallback((target) => {
    const redirect = target || `${window.location.pathname}${window.location.search}`;
    addToast?.("Login diperlukan", "Silakan masuk terlebih dahulu untuk menggunakan fitur ini.", "error");
    router.push(`/auth/login?redirect=${encodeURIComponent(redirect)}`);
  }, [addToast, router]);

  useEffect(() => {
    if (isAuthReady && !isAuthenticated && isProtectedPath(pathname)) {
      goToLogin(`${window.location.pathname}${window.location.search}`);
    }
  }, [pathname, isAuthenticated, isAuthReady, goToLogin]);

  useEffect(() => {
    if (!isAuthReady || isAuthenticated) return;

    const handleGuestAction = (event) => {
      // Login and registration controls (including Google OAuth) must remain
      // usable for guests even when their label contains words like "Lanjutkan".
      if (pathname.startsWith("/auth/") || pathname === "/mitra/login" || pathname === "/mitra/register") {
        return;
      }
      const target = event.target instanceof Element ? event.target : null;
      const link = target?.closest("a[href]");
      if (link) {
        const url = new URL(link.href, window.location.origin);
        if (url.origin === window.location.origin && isProtectedPath(url.pathname)) {
          event.preventDefault();
          goToLogin(`${url.pathname}${url.search}`);
        }
        return;
      }

      const button = target?.closest("button");
      if (button && !button.disabled && ACTION_LABEL.test(button.textContent || "")) {
        event.preventDefault();
        event.stopPropagation();
        goToLogin();
      }
    };

    document.addEventListener("click", handleGuestAction, true);
    return () => document.removeEventListener("click", handleGuestAction, true);
  }, [pathname, isAuthenticated, isAuthReady, goToLogin]);

  return children;
}
