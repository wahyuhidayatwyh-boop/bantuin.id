/**
 * authService.js
 * Centralized Authentication Abstraction
 * Complies with Section H & G of requirements.
 *
 * CANONICAL ROLES:
 * - user (User)
 * - provider (Penyedia Jasa)
 * - partner (Mitra)
 * - admin (Admin)
 */

import { INITIAL_USER } from "@/lib/mock/mockData";

const AUTH_USER_KEY = "bantuin_auth_current_user";
const AUTH_TOKEN_KEY = "bantuin_auth_session_token";

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
   * Mengambil sesi aktif saat ini
   */
  async getSession() {
    if (typeof window === "undefined") return null;
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    const user = this.getCurrentUser();
    if (!token || !user) return null;
    return {
      token,
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
        return JSON.parse(stored);
      }
    } catch {}
    return null;
  },

  /**
   * Login pengguna (Email + Password) - Terhubung ke Database Prisma
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

      const { token, user } = data;

      if (typeof window !== "undefined") {
        localStorage.setItem(AUTH_TOKEN_KEY, token);
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
        window.dispatchEvent(new Event("bantuin_auth_changed"));
      }

      return { token, user };
    } catch (err) {
      throw err;
    }
  },

  /**
   * Login dengan Google - Sinkronisasi ke Database Prisma
   */
  async loginWithGoogle() {
    try {
      const response = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "user.google@gmail.com",
          fullName: "Pengguna Google",
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Gagal masuk dengan Google");
      }

      const { token, user } = data;

      if (typeof window !== "undefined") {
        localStorage.setItem(AUTH_TOKEN_KEY, token);
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
        window.dispatchEvent(new Event("bantuin_auth_changed"));
      }

      return { token, user };
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

      const { token, user } = data;

      if (typeof window !== "undefined") {
        localStorage.setItem(AUTH_TOKEN_KEY, token);
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
        window.dispatchEvent(new Event("bantuin_auth_changed"));
      }

      return { token, user };
    } catch (err) {
      throw err;
    }
  },

  /**
   * Pendaftaran akun dengan Google - Terhubung ke Database Prisma
   * @param {{ fullName: string, email: string, phone: string, role?: string, [key: string]: any }} param0
   */
  async registerWithGoogle({ fullName, email, phone, role = "user", ...extraData }) {
    if (!fullName || !email) {
      throw new Error("Nama dan email Google wajib tersedia");
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
          authProvider: "google",
          ...extraData,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Pendaftaran Google gagal");
      }

      const { token, user } = data;

      if (typeof window !== "undefined") {
        localStorage.setItem(AUTH_TOKEN_KEY, token);
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
        window.dispatchEvent(new Event("bantuin_auth_changed"));
      }

      return { token, user };
    } catch (err) {
      throw err;
    }
  },

  /**
   * Refresh session token
   */
  async refreshSession() {
    const session = await this.getSession();
    if (!session) throw new Error("Sesi tidak ditemukan");
    const newToken = `mock-refreshed-${Date.now()}`;
    if (typeof window !== "undefined") {
      localStorage.setItem(AUTH_TOKEN_KEY, newToken);
    }
    return { ...session, token: newToken };
  },

  /**
   * Logout pengguna
   */
  async logout() {
    if (typeof window !== "undefined") {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem(AUTH_USER_KEY);
      window.dispatchEvent(new Event("bantuin_auth_changed"));
    }
    return { success: true };
  },

  /**
   * Memperbarui profil pengguna aktif
   */
  async updateProfile(updates) {
    const current = this.getCurrentUser();
    const updated = { ...current, ...updates, updatedAt: new Date().toISOString() };
    if (typeof window !== "undefined") {
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(updated));
      window.dispatchEvent(new Event("bantuin_auth_changed"));
    }
    return updated;
  },
};
