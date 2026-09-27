/**
 * serviceService.js
 * Jasa / Services Catalog & Listing Abstraction
 * Complies with Section J (Service data contract).
 */

import { INITIAL_SERVICES } from "@/lib/mock/mockData";

const SERVICES_STORAGE_KEY = "bantuin_services_state";

function getStoredServices() {
  if (typeof window === "undefined") return INITIAL_SERVICES;
  try {
    const raw = localStorage.getItem(SERVICES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return INITIAL_SERVICES;
}

function saveServices(items) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SERVICES_STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new Event("bantuin_services_updated"));
  } catch {}
}

export const serviceService = {
  /**
   * Mengambil semua listing jasa dengan filter
   */
  async getServices(filter = {}) {
    let list = getStoredServices();

    if (filter.category && filter.category !== "Semua" && filter.category !== "all") {
      list = list.filter((s) => s.category?.toLowerCase() === filter.category.toLowerCase() || s.businessCategory?.toLowerCase() === filter.category.toLowerCase());
    }
    if (filter.providerId) {
      list = list.filter((s) => s.providerId === filter.providerId || s.authorId === filter.providerId);
    }
    if (filter.search) {
      const q = filter.search.toLowerCase();
      list = list.filter((s) => s.title.toLowerCase().includes(q) || s.description?.toLowerCase().includes(q));
    }
    return list;
  },

  /**
   * Mengambil detail jasa berdasarkan ID
   */
  async getServiceById(serviceId) {
    const list = getStoredServices();
    return list.find((s) => s.id === serviceId) || null;
  },

  /**
   * Membuat listing jasa baru
   */
  async createService(serviceData) {
    const id = `srv-${Date.now()}`;
    const newService = {
      id,
      providerId: serviceData.providerId || "prv-current",
      categoryId: serviceData.categoryId || "desain",
      title: serviceData.title,
      price: Number(serviceData.price) || 0,
      status: "active",
      ratingAvg: null,
      ratingCount: 0,
      createdAt: new Date().toISOString(),
      ...serviceData,
    };

    const current = getStoredServices();
    saveServices([newService, ...current]);
    return newService;
  },

  /**
   * Mengupdate listing jasa
   */
  async updateService(serviceId, updates) {
    const list = getStoredServices();
    let updated = null;
    const next = list.map((s) => {
      if (s.id === serviceId) {
        updated = { ...s, ...updates, updatedAt: new Date().toISOString() };
        return updated;
      }
      return s;
    });
    saveServices(next);
    return updated;
  },

  /**
   * Menghapus listing jasa
   */
  async deleteService(serviceId) {
    const list = getStoredServices();
    const next = list.filter((s) => s.id !== serviceId);
    saveServices(next);
  },
};
