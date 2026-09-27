/**
 * providerService.js
 * Provider & Jasa Service Abstraction
 * Complies with Section J, L, and data contracts.
 */

import { PROVIDERS_DATA, getAllProviders, getProviderById, saveProviderData } from "@/lib/mock/providersData";

const PROVIDERS_STORAGE_KEY = "bantuin_providers_data";

function getStoredProviders() {
  if (typeof window === "undefined") return PROVIDERS_DATA;
  try {
    const raw = localStorage.getItem(PROVIDERS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return PROVIDERS_DATA;
}

function saveProviders(items) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PROVIDERS_STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new Event("bantuin_providers_updated"));
  } catch {}
}

export const providerService = {
  /**
   * Mengambil daftar penyedia jasa dengan filter
   */
  async getProviders(filter = {}) {
    let list = getStoredProviders();

    if (filter.category && filter.category !== "Semua" && filter.category !== "all") {
      list = list.filter((p) => p.category === filter.category || p.categoryLabel?.includes(filter.category));
    }
    if (filter.city) {
      list = list.filter((p) => p.city?.toLowerCase().includes(filter.city.toLowerCase()));
    }
    if (filter.search) {
      const q = filter.search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.brandTitle?.toLowerCase().includes(q) ||
          p.categoryLabel?.toLowerCase().includes(q) ||
          p.skills?.some((s) => s.toLowerCase().includes(q))
      );
    }
    return list;
  },

  /**
   * Mengambil detail provider berdasarkan ID atau slug
   */
  async getProviderById(providerId) {
    const list = getStoredProviders();
    return list.find((p) => p.id === providerId) || getProviderById(providerId) || null;
  },

  /**
   * Memperbarui profil provider
   */
  async updateProviderProfile(providerId, updates) {
    const list = getStoredProviders();
    let updatedTarget = null;

    const nextList = list.map((p) => {
      if (p.id === providerId) {
        updatedTarget = {
          ...p,
          ...updates,
          updatedAt: new Date().toISOString(),
        };
        return updatedTarget;
      }
      return p;
    });

    if (updatedTarget) {
      saveProviders(nextList);
      saveProviderData(updatedTarget);
    }
    return updatedTarget;
  },

  /**
   * Mengambil katalog layanan satuan dari provider
   */
  async getCatalogServices(providerId) {
    const provider = await this.getProviderById(providerId);
    return provider?.catalog || [];
  },

  /**
   * Menambah layanan satuan baru ke katalog
   */
  async addCatalogService(providerId, serviceData) {
    const provider = await this.getProviderById(providerId);
    if (!provider) throw new Error("Provider tidak ditemukan");

    const newService = {
      id: `cat-${providerId.slice(0, 3)}-${Date.now()}`,
      title: serviceData.title,
      price: Number(serviceData.price) || 0,
      image: serviceData.image || "https://images.unsplash.com/photo-1626785774573-4b799315345d?auto=format&fit=crop&w=600&q=80",
      unit: serviceData.unit || "/ sesi",
      category: serviceData.category || provider.category || "Jasa",
      desc: serviceData.desc || "",
      ratingAvg: null,
      ratingCount: 0,
    };

    const updatedCatalog = [newService, ...(provider.catalog || [])];
    return this.updateProviderProfile(providerId, { catalog: updatedCatalog });
  },

  /**
   * Menghapus layanan dari katalog
   */
  async deleteCatalogService(providerId, serviceId) {
    const provider = await this.getProviderById(providerId);
    if (!provider) throw new Error("Provider tidak ditemukan");

    const updatedCatalog = (provider.catalog || []).filter((s) => s.id !== serviceId);
    return this.updateProviderProfile(providerId, { catalog: updatedCatalog });
  },

  /**
   * Mengambil paket bundling borongan dari provider
   */
  async getPackages(providerId) {
    const provider = await this.getProviderById(providerId);
    return provider?.packages || [];
  },

  /**
   * Menambah paket bundling baru
   */
  async addPackage(providerId, packageData) {
    const provider = await this.getProviderById(providerId);
    if (!provider) throw new Error("Provider tidak ditemukan");

    const newPkg = {
      id: `pkg-${providerId.slice(0, 3)}-${Date.now()}`,
      title: packageData.title,
      price: Number(packageData.price) || 0,
      estimatedTime: packageData.estimatedTime || "1-2 hari",
      badge: packageData.badge || "Paket Baru",
      desc: packageData.desc || "",
      features: Array.isArray(packageData.features) ? packageData.features : [],
    };

    const updatedPackages = [newPkg, ...(provider.packages || [])];
    return this.updateProviderProfile(providerId, { packages: updatedPackages });
  },

  /**
   * Menghapus paket bundling
   */
  async deletePackage(providerId, packageId) {
    const provider = await this.getProviderById(providerId);
    if (!provider) throw new Error("Provider tidak ditemukan");

    const updatedPackages = (provider.packages || []).filter((p) => p.id !== packageId);
    return this.updateProviderProfile(providerId, { packages: updatedPackages });
  },
};
