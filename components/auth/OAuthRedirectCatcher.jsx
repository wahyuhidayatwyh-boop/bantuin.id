"use client";

import { useEffect, useState } from "react";
import AuthLoadingScreen from "@/components/auth/AuthLoadingScreen";

/**
 * OAuthRedirectCatcher
 * Menangkap redirect callback dari Supabase OAuth apabila Supabase mengarahkan ke Site URL (misal beranda "/")
 * dan seketika menampilkan loading screen serta meneruskannya ke /auth/callback tanpa jeda/flicker.
 */
export default function OAuthRedirectCatcher() {
  const [redirecting, setRedirecting] = useState(() => {
    if (typeof window === "undefined") return false;
    if (window.location.pathname.startsWith("/auth/callback")) return false;
    const search = window.location.search || "";
    const hash = window.location.hash || "";
    return (
      search.includes("code=") ||
      hash.includes("access_token=") ||
      hash.includes("refresh_token=") ||
      search.includes("error=") ||
      hash.includes("error=")
    );
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Jangan lakukan apa-apa jika sudah berada di halaman callback
    if (window.location.pathname.startsWith("/auth/callback")) {
      return;
    }

    const search = window.location.search || "";
    const hash = window.location.hash || "";

    const hasPkceCode = search.includes("code=");
    const hasHashTokens = hash.includes("access_token=") || hash.includes("refresh_token=");
    const hasAuthError = search.includes("error=") || hash.includes("error=");

    if (hasPkceCode || hasHashTokens || hasAuthError) {
      setRedirecting(true);
      const targetUrl = `/auth/callback${search}${hash}`;
      window.location.replace(targetUrl);
    }
  }, []);

  if (redirecting) {
    return (
      <AuthLoadingScreen
        title="Mempersiapkan Masuk..."
        subtitle="Sedang menghubungkan data akun Anda secara aman, mohon tunggu sebentar..."
      />
    );
  }

  return null;
}
