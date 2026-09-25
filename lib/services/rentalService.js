/**
 * rentalService.js
 * Rental Units & Inventory Service Abstraction
 * Complies with Section J (Rental data contract).
 */

import { INITIAL_RENTALS } from "@/lib/mock/mockData";

const RENTALS_STORAGE_KEY = "bantuin_rentals_state";

function getStoredRentals() {
  if (typeof window === "undefined") return INITIAL_RENTALS;
  try {
    const raw = localStorage.getItem(RENTALS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return INITIAL_RENTALS;
}

function saveRentals(items) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(RENTALS_STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new Event("bantuin_rentals_updated"));
  } catch {}
}

export const rentalService = {
  /**
   * Mengambil daftar rental unit dengan filter
   */
  async getRentals(filter = {}) {
    let list = getStoredRentals();

    if (filter.category && filter.category !== "Semua" && filter.category !== "all") {
      list = list.filter((r) => r.category?.toLowerCase() === filter.category.toLowerCase());
    }
    if (filter.partnerId) {
      list = list.filter((r) => r.partnerId === filter.partnerId || r.owner?.id === filter.partnerId);
    }
    if (filter.search) {
      const q = filter.search.toLowerCase();
      list = list.filter((r) => r.title.toLowerCase().includes(q) || r.description?.toLowerCase().includes(q));
    }
    return list;
  },

  /**
   * Mengambil detail rental berdasarkan ID
   */
  async getRentalById(rentalId) {
    const list = getStoredRentals();
    return list.find((r) => r.id === rentalId) || null;
  },

  /**
   * Membuat listing rental baru
   */
  async createRental(rentalData) {
    const id = `rent-${Date.now()}`;
    const newRental = {
      id,
      partnerId: rentalData.partnerId || "ptr-current",
      categoryId: rentalData.categoryId || "kamera",
      title: rentalData.title,
      price: Number(rentalData.price) || 0,
      stock: Number(rentalData.stock) || 1,
      status: "available",
      latitude: rentalData.latitude || null,
      longitude: rentalData.longitude || null,
      ratingAvg: null,
      ratingCount: 0,
      createdAt: new Date().toISOString(),
      ...rentalData,
    };

    const current = getStoredRentals();
    saveRentals([newRental, ...current]);
    return newRental;
  },

  /**
   * Mengupdate data unit sewa
   */
  async updateRental(rentalId, updates) {
    const list = getStoredRentals();
    let updated = null;
    const next = list.map((r) => {
      if (r.id === rentalId) {
        updated = { ...r, ...updates, updatedAt: new Date().toISOString() };
        return updated;
      }
      return r;
    });
    saveRentals(next);
    return updated;
  },

  /**
   * Menghapus unit sewa
   */
  async deleteRental(rentalId) {
    const list = getStoredRentals();
    const next = list.filter((r) => r.id !== rentalId);
    saveRentals(next);
  },
};
