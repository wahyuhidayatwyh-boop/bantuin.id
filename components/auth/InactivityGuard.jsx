"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/context/AppContext";
import { authService } from "@/lib/services/authService";

const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 Menit tidak aktif
const LAST_ACTIVE_KEY = "bantuin_last_user_activity";

/**
 * InactivityGuard
 * Memantau aktivitas fisik user (klik, scroll, ketik, sentuh).
 * Jika user telah login dan tidak ada aktivitas selama 30 menit,
 * sistem akan otomatis mengakhiri sesi (auto logout) demi keamanan.
 */
export default function InactivityGuard({ children }) {
  const router = useRouter();
  const { currentUser, isAuthenticated, addToast, setCurrentUser, setIsAuthenticated } = useApp() || {};
  const lastUpdateRef = useRef(Date.now());

  useEffect(() => {
    // Hanya aktif jika user sedang login
    if (!isAuthenticated && !currentUser) return;

    // Inisialisasi waktu aktif
    const now = Date.now();
    localStorage.setItem(LAST_ACTIVE_KEY, String(now));
    lastUpdateRef.current = now;

    // Catat aktivitas jika ada interaksi (dibatasi maksimal 1x per 5 detik untuk performa)
    const updateActivity = () => {
      const current = Date.now();
      if (current - lastUpdateRef.current > 5000) {
        lastUpdateRef.current = current;
        try {
          localStorage.setItem(LAST_ACTIVE_KEY, String(current));
        } catch {}
      }
    };

    const events = ["mousemove", "mousedown", "keydown", "scroll", "touchstart", "click"];
    events.forEach((evt) => window.addEventListener(evt, updateActivity, { passive: true }));

    // Timer pengecekan periodik setiap 15 detik
    const interval = setInterval(() => {
      try {
        const storedLastActive = Number(localStorage.getItem(LAST_ACTIVE_KEY)) || lastUpdateRef.current;
        const idleDuration = Date.now() - storedLastActive;

        if (idleDuration >= INACTIVITY_TIMEOUT_MS) {
          clearInterval(interval);
          events.forEach((evt) => window.removeEventListener(evt, updateActivity));

          // Akhiri sesi
          authService.logout();
          setCurrentUser?.(null);
          setIsAuthenticated?.(false);
          try {
            localStorage.removeItem(LAST_ACTIVE_KEY);
          } catch {}

          addToast?.(
            "Sesi Berakhir",
            "Sesi akun Anda telah diakhiri otomatis karena tidak ada aktivitas selama 30 menit.",
            "info"
          );

          router.push("/auth/login?reason=inactivity");
        }
      } catch (err) {
        console.warn("Inactivity check error:", err);
      }
    }, 15000);

    return () => {
      clearInterval(interval);
      events.forEach((evt) => window.removeEventListener(evt, updateActivity));
    };
  }, [isAuthenticated, currentUser, router, addToast, setCurrentUser, setIsAuthenticated]);

  return <>{children}</>;
}
