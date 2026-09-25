/**
 * userService.js
 * User Directory & Profile Management Service Abstraction
 * Complies with Section G, J, and N of requirements.
 */

import { INITIAL_USER } from "@/lib/mock/mockData";

const USERS_STORAGE_KEY = "bantuin_users_directory";

const INITIAL_USERS = [
  {
    id: "usr-001",
    fullName: "Rian Prasetya",
    email: "rian.prasetya@gmail.com",
    phone: "081234567890",
    role: "user",
    roleLabel: "User",
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80",
    status: "active", // active, suspended
    verificationStatus: "verified",
    completedOrders: 14,
    totalSpent: 2850000,
    city: "Jakarta Selatan",
    createdAt: "2024-01-15T10:00:00.000Z",
  },
  {
    id: "usr-002",
    fullName: "Siti Rahma",
    email: "siti.rahma@student.ac.id",
    phone: "082198765432",
    role: "user",
    roleLabel: "User",
    avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80",
    status: "active",
    verificationStatus: "verified",
    completedOrders: 8,
    totalSpent: 950000,
    city: "Kabupaten Banyumas",
    createdAt: "2024-02-10T14:30:00.000Z",
  },
  {
    id: "usr-003",
    fullName: "Dimas Arya",
    email: "dimas.arya@outlook.com",
    phone: "085712349988",
    role: "user",
    roleLabel: "User",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80",
    status: "active",
    verificationStatus: "pending",
    completedOrders: 3,
    totalSpent: 350000,
    city: "Kota Depok",
    createdAt: "2024-03-01T09:15:00.000Z",
  },
];

function getStoredUsers() {
  if (typeof window === "undefined") return INITIAL_USERS;
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return INITIAL_USERS;
}

function saveUsers(items) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new Event("bantuin_users_updated"));
  } catch {}
}

export const userService = {
  /**
   * Mengambil direktori pengguna
   */
  async getUsers(filter = {}) {
    let list = getStoredUsers();
    if (filter.status && filter.status !== "all") {
      list = list.filter((u) => u.status === filter.status);
    }
    if (filter.search) {
      const q = filter.search.toLowerCase();
      list = list.filter((u) => u.fullName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.phone.includes(q));
    }
    return list;
  },

  /**
   * Mengambil detail user berdasarkan ID
   */
  async getUserById(userId) {
    const list = getStoredUsers();
    return list.find((u) => u.id === userId) || null;
  },

  /**
   * Menangguhkan (suspend) akun pengguna oleh Admin
   */
  async suspendUser(userId, reason = "Pelanggaran aturan platform") {
    const list = getStoredUsers();
    const updated = list.map((u) => {
      if (u.id === userId) {
        return {
          ...u,
          status: "suspended",
          suspendedReason: reason,
          suspendedAt: new Date().toISOString(),
        };
      }
      return u;
    });
    saveUsers(updated);
    return updated.find((u) => u.id === userId);
  },

  /**
   * Mengaktifkan kembali (reactivate) akun pengguna
   */
  async reactivateUser(userId) {
    const list = getStoredUsers();
    const updated = list.map((u) => {
      if (u.id === userId) {
        return {
          ...u,
          status: "active",
          suspendedReason: null,
          reactivatedAt: new Date().toISOString(),
        };
      }
      return u;
    });
    saveUsers(updated);
    return updated.find((u) => u.id === userId);
  },
};
