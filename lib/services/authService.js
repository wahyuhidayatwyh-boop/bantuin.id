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

import { supabase } from "@/lib/supabase/client";

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
   */
  getRedirectPathByRole(role) {
    const low = (role || "").toLowerCase();
    if (low === CANONICAL_ROLES.ADMIN) return "/admin";
    if (low === CANONICAL_ROLES.PROVIDER) return "/jasa/dashboard";
    if (low === CANONICAL_ROLES.PARTNER) return "/mitra/dashboard";
    return "/bantuan";
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
    return localStorage.getItem(AUTH_ACCESS_TOKEN_KEY) || localStorage.getItem(AUTH_TOKEN_KEY);
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

    // 1. Coba refresh session jika ada refreshToken
    if (refreshToken && !this.isTokenExpired(refreshToken)) {
      try {
        const res = await this.refreshSession();
        if (res?.accessToken) return res.accessToken;
      } catch {}
    }

    // 2. Coba auto-recovery via Supabase session aktif
    try {
      const { data } = await supabase.auth.getSession();
      const effectiveEmail = data?.session?.user?.email || user?.email;
      if (effectiveEmail) {
        const syncRes = await fetch("/api/auth/google", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: effectiveEmail,
            fullName: data?.session?.user?.user_metadata?.full_name || user?.fullName || user?.name || "Pengguna",
            avatarUrl: data?.session?.user?.user_metadata?.avatar_url || user?.avatarUrl,
          }),
        });
        const syncData = await syncRes.json();
        if (syncData.success && (syncData.accessToken || syncData.token)) {
          this.saveSession(syncData);
          return syncData.accessToken || syncData.token;
        }
      }
    } catch {}

    // 3. Coba auto-recovery untuk local session jika user profile tersimpan
    if (user?.email) {
      try {
        const syncRes = await fetch("/api/auth/google", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: user.email,
            fullName: user.fullName || user.name || "Pengguna",
            avatarUrl: user.avatarUrl,
          }),
        });
        const syncData = await syncRes.json();
        if (syncData.success && (syncData.accessToken || syncData.token)) {
          this.saveSession(syncData);
          return syncData.accessToken || syncData.token;
        }
      } catch {}
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
  async loginWithGoogle(role = "user") {
    try {
      if (typeof window === "undefined") return;
      const redirectTo = `${window.location.origin}/auth/callback?role=${encodeURIComponent(role)}`;
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      if (error) {
        throw new Error(error.message || "Gagal menginisialisasi login Google.");
      }

      return data;
    } catch (err) {
      throw err;
    }
  },

  /**
   * Pendaftaran akun baru (Email + Password) - Terhubung ke Database Prisma
   * @param {{ fullName: string, email: string, phone: string, role?: string, password?: string, [key: string]: any }} param0
   */
  async register({ fullName, email, phone, role = "user", password, ...extraData }) {
    if (!fullName || !email || !phone) {
      throw new Error("Nama lengkap, email, dan nomor WhatsApp wajib diisi");
    }
    if (!password || password.length < 6) {
      throw new Error("Kata sandi minimal 6 karakter");
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          email,
          phone,
          role,
          password,
          authProvider: "local",
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
   * Pendaftaran akun dengan Google - Supabase OAuth Flow
   * @param {{ role?: string }} param0
   */
  async registerWithGoogle({ role = "user" } = {}) {
    return this.loginWithGoogle(role);
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
