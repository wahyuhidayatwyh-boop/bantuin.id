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
    if (typeof window === "undefined") return INITIAL_USER;
    try {
      const stored = localStorage.getItem(AUTH_USER_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {}
    return INITIAL_USER;
  },

  /**
   * Login pengguna (Email + Password)
   * ATURAN: Role didapat otomatis dari authenticated user / session backend.
   * @param {{ email: string, password?: string, role?: string }} credentials
   */
  async login({ email, password, role }) {
    if (!email) {
      throw new Error("Email wajib diisi");
    }

    // Cek apakah ada data akun tersimpan sebelumnya untuk email ini di localStorage
    let storedUser = null;
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(AUTH_USER_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed?.email?.toLowerCase() === email.toLowerCase()) {
            storedUser = parsed;
          }
        }
      } catch {}
    }

    // Role mapping normalization / auto-detection dari email atau parameter
    let normalizedRole = storedUser?.role || CANONICAL_ROLES.USER;
    const lowRole = (role || "").toLowerCase();
    const lowEmail = email.toLowerCase();

    if (lowRole === "admin" || lowEmail.includes("admin")) {
      normalizedRole = CANONICAL_ROLES.ADMIN;
    } else if (lowRole === "provider" || lowRole === "penyedia" || lowRole === "jasa" || lowEmail.includes("jasa") || lowEmail.includes("provider")) {
      normalizedRole = CANONICAL_ROLES.PROVIDER;
    } else if (lowRole === "partner" || lowRole === "mitra" || lowRole === "sewa" || lowEmail.includes("mitra") || lowEmail.includes("rental")) {
      normalizedRole = CANONICAL_ROLES.PARTNER;
    } else if (lowRole === "user") {
      normalizedRole = CANONICAL_ROLES.USER;
    }

    const mockToken = `mock-token-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const user = {
      ...(storedUser || INITIAL_USER),
      email,
      role: normalizedRole,
      roleLabel: ROLE_LABELS[normalizedRole] || "Pengguna",
      lastLoginAt: new Date().toISOString(),
    };

    if (typeof window !== "undefined") {
      localStorage.setItem(AUTH_TOKEN_KEY, mockToken);
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
      window.dispatchEvent(new Event("bantuin_auth_changed"));
    }

    return { token: mockToken, user };
  },

  /**
   * Login dengan Google (Frontend Contract)
   * Menggunakan Google sebagai identity provider.
   * Mengembalikan sesi login dan role pengguna.
   */
  async loginWithGoogle() {
    // Simulasi delay handshake Google OAuth di frontend
    await new Promise((resolve) => setTimeout(resolve, 600));

    // Cek apakah user Google sudah pernah tersimpan
    let user = null;
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(AUTH_USER_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && (parsed.authProvider === "google" || parsed.email)) {
            user = parsed;
          }
        }
      } catch {}
    }

    if (!user) {
      // Akun Google demo default jika belum pernah login
      user = {
        ...INITIAL_USER,
        id: `usr-google-${Date.now()}`,
        fullName: "Pengguna Google",
        email: "user.google@gmail.com",
        avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80",
        role: CANONICAL_ROLES.USER,
        roleLabel: ROLE_LABELS[CANONICAL_ROLES.USER],
        authProvider: "google",
        lastLoginAt: new Date().toISOString(),
      };
    } else {
      user = {
        ...user,
        authProvider: "google",
        lastLoginAt: new Date().toISOString(),
      };
    }

    const mockToken = `mock-google-token-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    if (typeof window !== "undefined") {
      localStorage.setItem(AUTH_TOKEN_KEY, mockToken);
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
      window.dispatchEvent(new Event("bantuin_auth_changed"));
    }

    return { token: mockToken, user };
  },

  /**
   * Pendaftaran akun baru (Email + Password)
   * @param {{ fullName: string, email: string, phone: string, role?: string, password?: string, [key: string]: any }} param0
   */
  async register({ fullName, email, phone, role = "user", ...extraData }) {
    if (!fullName || !email || !phone) {
      throw new Error("Nama lengkap, email, dan nomor WhatsApp wajib diisi");
    }

    let normalizedRole = CANONICAL_ROLES.USER;
    const lowRole = (role || "").toLowerCase();
    if (lowRole === "provider" || lowRole === "penyedia" || lowRole === "jasa") normalizedRole = CANONICAL_ROLES.PROVIDER;
    else if (lowRole === "partner" || lowRole === "mitra" || lowRole === "sewa") normalizedRole = CANONICAL_ROLES.PARTNER;
    else if (lowRole === "admin") normalizedRole = CANONICAL_ROLES.ADMIN;

    const newUser = {
      id: `usr-${Date.now()}`,
      fullName,
      email,
      phone,
      phoneNumber: phone,
      role: normalizedRole,
      roleLabel: ROLE_LABELS[normalizedRole],
      avatarUrl: normalizedRole === CANONICAL_ROLES.PROVIDER
        ? "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80"
        : normalizedRole === CANONICAL_ROLES.PARTNER
        ? "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=400&q=80"
        : "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80",
      isVerified: false,
      verificationStatus: "pending",
      authProvider: "local",
      ...extraData,
      createdAt: new Date().toISOString(),
    };

    const mockToken = `mock-token-${Date.now()}`;
    if (typeof window !== "undefined") {
      localStorage.setItem(AUTH_TOKEN_KEY, mockToken);
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(newUser));
      window.dispatchEvent(new Event("bantuin_auth_changed"));
    }

    return { token: mockToken, user: newUser };
  },

  /**
   * Pendaftaran akun dengan Google (Google Identity Provider)
   * ATURAN: Tidak meminta password/confirm password Bantuin.
   * Field nomor HP, domisili, KTP, dan data role tetap dilengkapi sesuai aturan Bantuin.
   * @param {{ fullName: string, email: string, phone: string, role?: string, [key: string]: any }} param0
   */
  async registerWithGoogle({ fullName, email, phone, role = "user", ...extraData }) {
    if (!fullName || !email) {
      throw new Error("Nama dan email Google wajib tersedia");
    }

    let normalizedRole = CANONICAL_ROLES.USER;
    const lowRole = (role || "").toLowerCase();
    if (lowRole === "provider" || lowRole === "penyedia" || lowRole === "jasa") normalizedRole = CANONICAL_ROLES.PROVIDER;
    else if (lowRole === "partner" || lowRole === "mitra" || lowRole === "sewa") normalizedRole = CANONICAL_ROLES.PARTNER;
    else if (lowRole === "admin") normalizedRole = CANONICAL_ROLES.ADMIN;

    const newUser = {
      id: `usr-google-${Date.now()}`,
      fullName,
      email,
      phone: phone || "",
      phoneNumber: phone || "",
      role: normalizedRole,
      roleLabel: ROLE_LABELS[normalizedRole],
      avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80",
      isVerified: false,
      verificationStatus: "pending",
      authProvider: "google",
      ...extraData,
      createdAt: new Date().toISOString(),
    };

    const mockToken = `mock-google-token-${Date.now()}`;
    if (typeof window !== "undefined") {
      localStorage.setItem(AUTH_TOKEN_KEY, mockToken);
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(newUser));
      window.dispatchEvent(new Event("bantuin_auth_changed"));
    }

    return { token: mockToken, user: newUser };
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
