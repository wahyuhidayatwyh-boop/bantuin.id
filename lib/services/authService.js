/**
 * authService.js
 * Centralized Authentication Abstraction
 * Menggunakan JWT Access Token & Refresh Token
 *
 * CANONICAL ROLES:
 * - user (User)
 * - provider (Penyedia Jasa)
 * - partner (Mitra)
 * - admin (Admin)
 */

import { supabase } from "../supabase/client.js";

const AUTH_USER_KEY = "bantuin_auth_current_user";
const AUTH_TOKEN_KEY = "bantuin_auth_session_token";
const AUTH_ACCESS_TOKEN_KEY = "bantuin_auth_access_token";
const AUTH_REFRESH_TOKEN_KEY = "bantuin_auth_refresh_token";

export const CANONICAL_ROLES = {
  USER: "user",
  PROVIDER: "provider",
  PARTNER: "partner",
  ADMIN: "admin",
};

export const ROLE_LABELS = {
  [CANONICAL_ROLES.USER]: "User",
  [CANONICAL_ROLES.PROVIDER]: "Penyedia Jasa",
  [CANONICAL_ROLES.PARTNER]: "Mitra",
  [CANONICAL_ROLES.ADMIN]: "Admin",
};

export const authService = {
  /**
   * Helper untuk menentukan rute redirect berdasarkan role
   * @param {string} role
   * @param {object} [user]
   */
  getRedirectPathByRole(role, user = null) {
    if (user?.isAdmin) return "/admin";
    const low = (role || user?.role || user?.accountRole || "").toLowerCase();
    if (low === CANONICAL_ROLES.ADMIN || low === "admin") return "/admin";
    if (low === CANONICAL_ROLES.PROVIDER || low === "provider") return "/jasa/dashboard";
    if (low === CANONICAL_ROLES.PARTNER || low === "partner" || low === "mitra") return "/mitra/dashboard";
    return "/";
  },

  /**
   * Menyimpan sesi login (JWT Access Token & Refresh Token)
   */
  saveSession({ accessToken, refreshToken, user, token }) {
    if (typeof window === "undefined") return;
    const effectiveAccessToken = accessToken || token;
    if (effectiveAccessToken) {
      localStorage.setItem(AUTH_ACCESS_TOKEN_KEY, effectiveAccessToken);
      localStorage.setItem(AUTH_TOKEN_KEY, effectiveAccessToken);
      localStorage.setItem("bantuin_token", effectiveAccessToken);
    }
    if (refreshToken) {
      localStorage.setItem(AUTH_REFRESH_TOKEN_KEY, refreshToken);
    }
    if (user) {
      const sanitizedUser = {
        ...user,
        avatarUrl: user.avatarUrl && user.avatarUrl.includes("images.unsplash.com") ? null : (user.avatarUrl || null),
      };
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(sanitizedUser));
    }
    window.dispatchEvent(new Event("bantuin_auth_changed"));
  },

  /**
   * Cek apakah token JWT kedaluwarsa
   */
  isTokenExpired(token) {
    if (!token || typeof token !== "string") return true;
    try {
      const parts = token.split(".");
      if (parts.length < 2) return true;
      const base64Url = parts[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );
      const payload = JSON.parse(jsonPayload);
      if (!payload.exp) return false;
      // Berikan toleransi buffer 10 detik
      return payload.exp * 1000 < Date.now() + 10000;
    } catch {
      return true;
    }
  },

  /**
   * Mengambil Access Token aktif
   */
  getAccessToken() {
    if (typeof window === "undefined") return null;
    const token =
      localStorage.getItem(AUTH_ACCESS_TOKEN_KEY) ||
      localStorage.getItem(AUTH_TOKEN_KEY) ||
      localStorage.getItem("bantuin_token");
    if (token && !localStorage.getItem("bantuin_token")) {
      try {
        localStorage.setItem("bantuin_token", token);
      } catch {}
    }
    return token;
  },

  /**
   * Alias sinkron untuk getAccessToken
   */
  getToken() {
    return this.getAccessToken();
  },

  /**
   * Mengambil Access Token yang valid (auto-recovery dari refresh token atau Supabase OAuth jika expired/kosong)
   */
  async getValidAccessToken() {
    if (typeof window === "undefined") return null;
    let token = this.getAccessToken();
    if (token && !this.isTokenExpired(token)) {
      return token;
    }

    const refreshToken = this.getRefreshToken();
    const user = this.getCurrentUser();

    // Coba refresh session jika ada refreshToken
    if (refreshToken && !this.isTokenExpired(refreshToken)) {
      try {
        const res = await this.refreshSession();
        if (res?.accessToken) return res.accessToken;
      } catch (refreshErr) {
        if (refreshErr.name === "TypeError" || refreshErr.message?.includes("fetch")) {
          console.warn("[authService]: Gangguan jaringan saat memperbarui sesi token.");
        }
      }
    }

    return token;
  },

  /**
   * Mengambil Refresh Token
   */
  getRefreshToken() {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(AUTH_REFRESH_TOKEN_KEY);
  },

  /**
   * Mengambil sesi aktif saat ini
   */
  async getSession() {
    if (typeof window === "undefined") return null;
    const user = this.getCurrentUser();
    if (!user) return null;
    const accessToken = await this.getValidAccessToken();
    const refreshToken = this.getRefreshToken();
    if (!accessToken) return null;
    return {
      accessToken,
      refreshToken,
      token: accessToken,
      user,
      expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
    };
  },

  /**
   * Mengambil profil pengguna yang sedang login
   */
  getCurrentUser() {
    if (typeof window === "undefined") return null;
    try {
      const stored = localStorage.getItem(AUTH_USER_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.avatarUrl && parsed.avatarUrl.includes("images.unsplash.com")) {
          parsed.avatarUrl = null;
        }
        return parsed;
      }
    } catch {}
    return null;
  },

  /**
   * Login pengguna (Email + Password) - Mengembalikan JWT Access & Refresh Token
   * @param {{ email: string, password?: string, role?: string }} credentials
   */
  async login({ email, password, role }) {
    if (!email) {
      throw new Error("Email wajib diisi");
    }
    if (!password) {
      throw new Error("Kata sandi wajib diisi");
    }

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Gagal masuk ke akun");
      }

      const { accessToken, refreshToken, token, user } = data;
      this.saveSession({ accessToken, refreshToken, token, user });

      return { accessToken, refreshToken, token: accessToken || token, user };
    } catch (err) {
      throw err;
    }
  },

  /**
   * Login dengan Google - Supabase OAuth dengan sinkronisasi ke tabel User & Profile
   */
  async loginWithGoogle(role = "user", mode = "login") {
    try {
      if (typeof window === "undefined") return;

      // 1. Bersihkan sesi lama secara total agar tidak terjadi akun tertukar / ghost login
      try {
        await supabase.auth.signOut();
      } catch {}

      localStorage.removeItem(AUTH_ACCESS_TOKEN_KEY);
      localStorage.removeItem(AUTH_REFRESH_TOKEN_KEY);
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem(AUTH_USER_KEY);
      window.dispatchEvent(new Event("bantuin_auth_changed"));

      // 2. Simpan role & mode ke storage agar tidak bergantung pada query params URL yang berpotensi ditolak oleh Supabase allowlist
      try {
        localStorage.setItem("bantuin_oauth_role", role);
        localStorage.setItem("bantuin_oauth_mode", mode);
        sessionStorage.setItem("bantuin_oauth_role", role);
        sessionStorage.setItem("bantuin_oauth_mode", mode);
      } catch {}

      // 3. Gunakan exact callback path tanpa query params agar 100% cocok dengan Supabase Redirect URLs
      const redirectTo = `${window.location.origin}/auth/callback`;
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          queryParams: {
            prompt: "select_account consent",
            access_type: "offline",
          },
        },
      });

      if (error) {
        throw new Error(error.message || "Gagal menginisialisasi login Google.");
      }

      // 4. Jika client tidak otomatis redirect (misal pada browser mobile tertentu), navigasi eksplisit
      if (data?.url) {
        window.location.href = data.url;
      }

      return data;
    } catch (err) {
      throw err;
    }
  },

  /**
   * Login atau Registrasi dengan Google ID Token (Google Identity Services Pop-up / One Tap)
   * Menampilkan domain sendiri (bantuinaja.id) langsung di Google tanpa redirect ke supabase.co
   */
  async loginWithGoogleIdToken(idToken, role = "user", mode = "login") {
    try {
      if (typeof window === "undefined") return;

      // 1. Verifikasi ID Token langsung ke Supabase
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: "google",
        token: idToken,
      });

      if (error) {
        throw new Error(error.message || "Gagal memverifikasi ID token Google ke Supabase.");
      }

      const authUser = data?.session?.user || data?.user;
      const supabaseToken = data?.session?.access_token;

      if (!authUser || !authUser.email) {
        throw new Error("Data akun Google tidak ditemukan.");
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

      const googleData = { email, fullName, avatarUrl, role, supabaseToken };
      try {
        localStorage.setItem("bantuin_google_profile", JSON.stringify(googleData));
        sessionStorage.setItem("bantuin_google_profile", JSON.stringify(googleData));
      } catch {}

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
          const verifyJson = await verifyRes.json();
          if (verifyJson?.googleAuthToken) {
            const enriched = { ...googleData, googleAuthToken: verifyJson.googleAuthToken };
            localStorage.setItem("bantuin_google_profile", JSON.stringify(enriched));
            sessionStorage.setItem("bantuin_google_profile", JSON.stringify(enriched));
          }
        } catch {}
        await supabase.auth.signOut().catch(() => {});
        return {
          mode: "register",
          email,
          fullName,
          avatarUrl,
          role,
        };
      }

      // mode === "login"
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

      const resJson = await res.json();

      if (!res.ok) {
        if (resJson?.googleAuthToken) {
          try {
            const enriched = { ...googleData, googleAuthToken: resJson.googleAuthToken };
            localStorage.setItem("bantuin_google_profile", JSON.stringify(enriched));
            sessionStorage.setItem("bantuin_google_profile", JSON.stringify(enriched));
          } catch {}
        }
        await supabase.auth.signOut().catch(() => {});
        if (resJson.code === "ACCOUNT_NOT_FOUND" || res.status === 404) {
          return {
            mode: "unregistered",
            email,
            fullName,
            avatarUrl,
            role,
          };
        }
        throw new Error(resJson.error || "Gagal memproses login Google.");
      }

      // Login berhasil
      this.saveSession(resJson);
      return {
        mode: "login_success",
        user: resJson.user,
        redirectPath: this.getRedirectPathByRole(resJson.user.role, resJson.user),
      };
    } catch (err) {
      throw err;
    }
  },

  /**
   * Pendaftaran akun baru (Email + Password atau Google) - Terhubung ke Database Prisma
   */
  async register({ fullName, email, phone, role = "user", password, authProvider = "local", ...extraData }) {
    const currentToken = this.getAccessToken();
    const isUpgradingLoggedInUser = Boolean(currentToken && (extraData?.isLoggedInUser || extraData?.isUpgrade));

    if (!fullName || !email || !phone) {
      throw new Error("Nama lengkap, email, dan nomor WhatsApp wajib diisi");
    }
    if (!isUpgradingLoggedInUser && authProvider === "local" && (!password || password.length < 6)) {
      throw new Error("Kata sandi minimal 6 karakter");
    }

    try {
      const headers = { "Content-Type": "application/json" };
      if (currentToken) {
        headers["Authorization"] = `Bearer ${currentToken}`;
      }

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers,
        body: JSON.stringify({
          fullName,
          email,
          phone,
          role,
          password: password || undefined,
          authProvider,
          ...extraData,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Pendaftaran akun gagal");
      }

      const { accessToken, refreshToken, token, user } = data;
      this.saveSession({ accessToken, refreshToken, token, user });

      return { accessToken, refreshToken, token: accessToken || token, user };
    } catch (err) {
      throw err;
    }
  },

  /**
   * Menghubungkan Google untuk mengambil profil Google pada formulir pendaftaran
   */
  async registerWithGoogle({ role = "user" } = {}) {
    return this.loginWithGoogle(role, "register");
  },

  /**
   * Refresh session token menggunakan JWT Refresh Token
   */
  async refreshSession() {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      throw new Error("Refresh token tidak ditemukan. Silakan login kembali.");
    }

    try {
      const response = await fetch("/api/auth/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });

      const data = await response.json();
      if (!response.ok) {
        // Jika refresh token invalid / expired, logout
        await this.logout();
        throw new Error(data.error || "Sesi telah berakhir. Silakan login kembali.");
      }

      const { accessToken, refreshToken: newRefreshToken, token, user } = data;
      this.saveSession({
        accessToken,
        refreshToken: newRefreshToken || refreshToken,
        token,
        user,
      });

      return { accessToken, refreshToken: newRefreshToken || refreshToken, user };
    } catch (err) {
      throw err;
    }
  },

  /**
   * Logout pengguna
   */
  async logout() {
    if (typeof window !== "undefined") {
      localStorage.removeItem(AUTH_ACCESS_TOKEN_KEY);
      localStorage.removeItem(AUTH_REFRESH_TOKEN_KEY);
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem(AUTH_USER_KEY);
      localStorage.removeItem("bantuin_token");
      localStorage.removeItem("bantuin_order_rooms_state");
      window.dispatchEvent(new Event("bantuin_auth_changed"));
    }
    try {
      await supabase.auth.signOut();
    } catch {}
    return { success: true };
  },

  /**
   * Memperbarui profil pengguna aktif
   */
  async updateProfile(updates, notify = true) {
    const current = this.getCurrentUser() || {};
    const updated = { ...current, ...updates, updatedAt: new Date().toISOString() };
    if (typeof window !== "undefined") {
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(updated));
      if (notify) {
        window.dispatchEvent(new Event("bantuin_auth_changed"));
      }
    }
    return updated;
  },
};
