"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, CheckCircle, AlertTriangle } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { authService } from "@/lib/services/authService";

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
  } catch (e) {
    return null;
  }
}

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState("loading"); // 'loading' | 'success' | 'error'
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isMounted = true;
    let hasProcessed = false;

    async function processUserData({ email, fullName, avatarUrl, role }) {
      if (hasProcessed) return;
      hasProcessed = true;

      try {
        // Sinkronkan ke API backend (/api/auth/google) yang mendaftarkan ke tabel User (verified: true) & Profile
        const res = await fetch("/api/auth/google", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            fullName,
            avatarUrl,
            role,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Gagal sinkronisasi data akun ke database.");
        }

        const { accessToken, refreshToken, token, user } = data;

        // Simpan sesi (JWT Access Token & Refresh Token)
        authService.saveSession({ accessToken, refreshToken, token, user });

        if (isMounted) {
          setStatus("success");
          setTimeout(() => {
            const redirectPath = authService.getRedirectPathByRole(user.role);
            router.push(redirectPath);
          }, 600);
        }
      } catch (err) {
        console.error("Auth Processing Error:", err);
        if (isMounted) {
          setStatus("error");
          setErrorMessage(err.message || "Terjadi kesalahan saat otentikasi Google.");
        }
      }
    }

    async function handleAuthCallback() {
      try {
        const role = searchParams.get("role") || "user";

        // Metode 1: Ekstraksi instan dari URL Hash fragment (#access_token=...)
        if (typeof window !== "undefined" && window.location.hash) {
          const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
          const accessToken = hashParams.get("access_token");

          if (accessToken) {
            const payload = parseJwtPayload(accessToken);
            if (payload && payload.email) {
              const email = payload.email;
              const fullName =
                payload.user_metadata?.full_name ||
                payload.user_metadata?.name ||
                payload.user_metadata?.user_name ||
                email.split("@")[0];
              const avatarUrl =
                payload.user_metadata?.avatar_url ||
                payload.user_metadata?.picture ||
                null;

              await processUserData({ email, fullName, avatarUrl, role });
              return;
            }
          }
        }

        // Metode 2: Ambil session dari Supabase client
        const { data: { session }, error } = await supabase.auth.getSession();
        if (!error && session?.user) {
          const user = session.user;
          const email = user.email;
          const fullName =
            user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            email.split("@")[0];
          const avatarUrl =
            user.user_metadata?.avatar_url ||
            user.user_metadata?.picture ||
            null;

          await processUserData({ email, fullName, avatarUrl, role });
          return;
        }

        // Metode 3: Event listener Supabase
        const { data: authListener } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
          if (currentSession?.user && isMounted && !hasProcessed) {
            const user = currentSession.user;
            const email = user.email;
            const fullName =
              user.user_metadata?.full_name ||
              user.user_metadata?.name ||
              email.split("@")[0];
            const avatarUrl =
              user.user_metadata?.avatar_url ||
              user.user_metadata?.picture ||
              null;

            await processUserData({ email, fullName, avatarUrl, role });
          }
        });

        // Timeout fallback jika tidak ada data sama sekali dalam 6 detik
        const timeout = setTimeout(() => {
          if (!hasProcessed && isMounted) {
            setStatus("error");
            setErrorMessage("Waktu otentikasi habis atau token tidak ditemukan. Silakan login kembali.");
          }
        }, 6000);

        return () => {
          clearTimeout(timeout);
          authListener?.subscription?.unsubscribe();
        };
      } catch (err) {
        console.error("Auth Callback Error:", err);
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
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#EBF3FE] via-[#F0F6FF] to-[#DEEEFC] p-4 font-sans">
      <div className="bg-white/95 backdrop-blur-md p-8 rounded-2xl shadow-xl border border-blue-100 max-w-md w-full text-center space-y-4">
        {status === "loading" && (
          <>
            <div className="flex justify-center">
              <Loader2 className="w-12 h-12 text-[#1683FF] animate-spin" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Menghubungkan Akun Google...</h2>
            <p className="text-sm text-gray-600">
              Sedang memverifikasi data akun Anda ke sistem Bantuin.id.
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="flex justify-center">
              <CheckCircle className="w-12 h-12 text-emerald-500 animate-bounce" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Otentikasi Berhasil!</h2>
            <p className="text-sm text-emerald-700 font-medium">
              Akun Google telah terverifikasi. Mengalihkan ke dashboard...
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <div className="flex justify-center">
              <AlertTriangle className="w-12 h-12 text-rose-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Otentikasi Gagal</h2>
            <p className="text-sm text-rose-600 font-medium">{errorMessage}</p>
            <div className="pt-4">
              <button
                onClick={() => router.push("/auth/login")}
                className="w-full py-2.5 px-4 bg-[#1683FF] hover:bg-blue-600 text-white font-semibold rounded-xl transition cursor-pointer"
              >
                Kembali ke Halaman Login
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <Loader2 className="w-10 h-10 text-[#1683FF] animate-spin" />
        </div>
      }
    >
      <CallbackHandler />
    </Suspense>
  );
}
