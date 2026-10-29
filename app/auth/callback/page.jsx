"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, CheckCircle, AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { authService } from "@/lib/services/authService";
import { useApp } from "@/lib/context/AppContext";
import AuthLoadingScreen from "@/components/auth/AuthLoadingScreen";

function parseJwtPayload(token) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addToast } = useApp();
  const [status, setStatus] = useState("loading"); // 'loading' | 'success' | 'error'
  const [errorMessage, setErrorMessage] = useState("");
  const [targetRedirect, setTargetRedirect] = useState("/auth/login");
  const hasProcessedRef = useRef(false);

  useEffect(() => {
    let isMounted = true;

    async function handleAuthCallback() {
      if (hasProcessedRef.current) return;
      hasProcessedRef.current = true;

      try {
        let role = searchParams.get("role");
        let mode = searchParams.get("mode");

        if (typeof window !== "undefined") {
          if (!role) {
            role = sessionStorage.getItem("bantuin_oauth_role") || localStorage.getItem("bantuin_oauth_role");
          }
          if (!mode) {
            mode = sessionStorage.getItem("bantuin_oauth_mode") || localStorage.getItem("bantuin_oauth_mode");
          }
          try {
            sessionStorage.removeItem("bantuin_oauth_role");
            sessionStorage.removeItem("bantuin_oauth_mode");
            localStorage.removeItem("bantuin_oauth_role");
            localStorage.removeItem("bantuin_oauth_mode");
          } catch {}
        }

        role = role || "user";
        mode = mode || "login";

        const urlError = searchParams.get("error") || searchParams.get("error_description");

        if (urlError) {
          throw new Error(searchParams.get("error_description") || urlError || "Autentikasi Google dibatalkan atau gagal.");
        }

        let authUser = null;
        let supabaseToken = null;

        // 1. Prioritas PKCE Flow: Periksa parameter 'code' dari URL
        const code = searchParams.get("code");
        if (code) {
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            // Jika kode sudah pernah diproses dan ada data profil tersimpan, arahkan langsung
            if (typeof window !== "undefined") {
              try {
                const stored = JSON.parse(
                  sessionStorage.getItem("bantuin_google_profile") ||
                  localStorage.getItem("bantuin_google_profile") ||
                  "{}"
                );
                if (stored.email) {
                  const regUrl = `/auth/register?connected=google&email=${encodeURIComponent(stored.email)}&name=${encodeURIComponent(stored.fullName || "")}&avatar=${encodeURIComponent(stored.avatarUrl || "")}&role=${encodeURIComponent(stored.role || "user")}`;
                  window.location.replace(regUrl);
                  return;
                }
              } catch {}
            }
            throw new Error(exchangeError.message || "Gagal memproses kode autentikasi Google.");
          }
          if (data?.session?.user) {
            authUser = data.session.user;
            supabaseToken = data.session.access_token;
          }
        }

        // 2. Prioritas Hash Fragment: Periksa access_token dari window.location.hash
        if (!authUser && typeof window !== "undefined" && window.location.hash) {
          const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
          const hashAccessToken = hashParams.get("access_token");
          if (hashAccessToken) {
            const payload = parseJwtPayload(hashAccessToken);
            if (payload?.email) {
              authUser = {
                email: payload.email,
                user_metadata: payload.user_metadata || {},
              };
              supabaseToken = hashAccessToken;
            }
          }
        }

        // 3. Fallback: Ambil sesi Supabase
        if (!authUser) {
          const { data: { session }, error: sessionErr } = await supabase.auth.getSession();
          if (!sessionErr && session?.user) {
            authUser = session.user;
            supabaseToken = session.access_token;
          }
        }

        if (!authUser || !authUser.email) {
          // Cek fallback storage jika session hilang karena re-render
          if (typeof window !== "undefined") {
            try {
              const stored = JSON.parse(
                sessionStorage.getItem("bantuin_google_profile") ||
                localStorage.getItem("bantuin_google_profile") ||
                "{}"
              );
              if (stored.email) {
                const regUrl = `/auth/register?connected=google&email=${encodeURIComponent(stored.email)}&name=${encodeURIComponent(stored.fullName || "")}&avatar=${encodeURIComponent(stored.avatarUrl || "")}&role=${encodeURIComponent(stored.role || "user")}`;
                window.location.replace(regUrl);
                return;
              }
            } catch {}
          }
          throw new Error("Data akun Google tidak ditemukan. Silakan coba masuk kembali.");
        }

        const email = authUser.email.trim().toLowerCase();
        const fullName =
          authUser.user_metadata?.full_name ||
          authUser.user_metadata?.name ||
          authUser.user_metadata?.user_name ||
          email.split("@")[0];
        const avatarUrl =
          authUser.user_metadata?.avatar_url ||
          authUser.user_metadata?.picture ||
          null;

        // Simpan data profil Google ke storage agar selalu tersedia di formulir registrasi
        const saveGoogleProfileToStorage = (extra = {}) => {
          if (typeof window !== "undefined") {
            try {
              const googleData = { email, fullName, avatarUrl, role, ...extra };
              localStorage.setItem("bantuin_google_profile", JSON.stringify(googleData));
              sessionStorage.setItem("bantuin_google_profile", JSON.stringify(googleData));
            } catch {}
          }
        };

        saveGoogleProfileToStorage({ supabaseToken });

        // ========================================================
        // KASUS A: DAFTAR DENGAN GOOGLE (mode === "register")
        // Verifikasi token OAuth ke server terlebih dahulu untuk mendapatkan googleAuthToken resmi
        // ========================================================
        if (mode === "register") {
          try {
            const verifyRes = await fetch("/api/auth/google", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                supabaseToken,
                email,
                fullName,
                avatarUrl,
                role,
                mode: "verify_oauth",
              }),
            });
            const verifyData = await verifyRes.json();
            if (verifyData?.googleAuthToken) {
              saveGoogleProfileToStorage({ googleAuthToken: verifyData.googleAuthToken });
            }
          } catch {}
          await supabase.auth.signOut().catch(() => {});
          const registerUrl = `/auth/register?connected=google&email=${encodeURIComponent(email)}&name=${encodeURIComponent(fullName)}&avatar=${encodeURIComponent(avatarUrl || "")}&role=${encodeURIComponent(role)}`;
          window.location.replace(registerUrl);
          return;
        }

        // ========================================================
        // KASUS B: MASUK DENGAN GOOGLE (mode === "login")
        // User ingin LOGIN. Jika akun belum terdaftar, LANGSUNG arahkan ke
        // formulir registrasi akun baru (tanpa memunculkan card error!).
        // ========================================================
        const res = await fetch("/api/auth/google", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            supabaseToken,
            email,
            fullName,
            avatarUrl,
            role,
            mode: "login",
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          if (data?.googleAuthToken) {
            saveGoogleProfileToStorage({ googleAuthToken: data.googleAuthToken });
          }
          await supabase.auth.signOut().catch(() => {});

          // Jika akun belum terdaftar (404):
          // LANGSUNG arahkan ke form pendaftaran dengan prefill data Google, tanpa card error!
          if (data.code === "ACCOUNT_NOT_FOUND" || res.status === 404) {
            const registerUrl = `/auth/register?connected=google&notice=unregistered&email=${encodeURIComponent(email)}&name=${encodeURIComponent(fullName)}&avatar=${encodeURIComponent(avatarUrl || "")}&from=google&role=${encodeURIComponent(role)}`;
            window.location.replace(registerUrl);
            return;
          }

          throw new Error(data.error || "Gagal memproses login Google.");
        }

        // Jika akun terdaftar & berhasil login
        const { accessToken, refreshToken, token, user } = data;
        authService.saveSession({ accessToken, refreshToken, token, user });

        if (isMounted) {
          setStatus("success");
          addToast?.(
            "Login Berhasil",
            `Selamat datang kembali, ${user.fullName || "Pengguna"}!`,
            "success"
          );
          const redirectPath = authService.getRedirectPathByRole(user.role, user);
          window.location.replace(redirectPath);
        }

      } catch (err) {
        console.error("Auth Callback Error:", err);
        await supabase.auth.signOut().catch(() => {});
        if (isMounted) {
          setStatus("error");
          setErrorMessage(err.message || "Terjadi kesalahan saat otentikasi Google.");
        }
      }
    }

    handleAuthCallback();

    return () => {
      isMounted = false;
    };
  }, [router, searchParams, addToast]);

  if (status === "loading" || status === "success") {
    return (
      <AuthLoadingScreen
        status={status === "success" ? "success" : "loading"}
        title={status === "success" ? "Autentikasi Berhasil!" : "Menghubungkan Akun Google..."}
        subtitle={
          status === "success"
            ? "Mengarahkan Anda ke platform BantuinAja.id..."
            : "Sedang memverifikasi data akun Anda secara aman..."
        }
      />
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#EBF3FE] via-[#F0F6FF] to-[#DEEEFC] p-4 font-sans">
      <div className="bg-white/95 backdrop-blur-md p-6 sm:p-8 rounded-2xl sm:rounded-3xl shadow-xl border border-blue-100 max-w-md w-full text-center space-y-4">
        <div className="flex justify-center">
          <AlertCircle className="w-12 h-12 text-rose-500 animate-pulse" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Pemberitahuan Akun</h2>
        <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
          {errorMessage}
        </p>

        <div className="pt-2">
          <Link
            href={targetRedirect}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white text-xs font-bold transition shadow-xs w-full"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Lanjutkan Sekarang</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <AuthLoadingScreen
          title="Menghubungkan Akun Google..."
          subtitle="Sedang memverifikasi data akun Anda secara aman..."
        />
      }
    >
      <CallbackHandler />
    </Suspense>
  );
}
