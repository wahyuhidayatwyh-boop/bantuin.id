/**
 * partnerService.js
 * Partner & Rental Store Service Abstraction
 * Complies with Section J & M of requirements.
 */

import { MITRA_STORES } from "@/lib/mock/mitraData";

const PARTNERS_STORAGE_KEY = "bantuin_partners_data";

function getStoredPartners() {
  if (typeof window === "undefined") return Object.values(MITRA_STORES);
  try {
    const raw = localStorage.getItem(PARTNERS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return Object.values(MITRA_STORES);
}

function savePartners(items) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PARTNERS_STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new Event("bantuin_partners_updated"));
  } catch {}
}

export const partnerService = {
  /**
   * Mengambil daftar mitra rental toko
   */
  async getPartners(filter = {}) {
    let list = getStoredPartners();

    if (filter.category && filter.category !== "Semua" && filter.category !== "all") {
      list = list.filter((p) => p.category?.toLowerCase().includes(filter.category.toLowerCase()));
    }
    if (filter.city) {
      list = list.filter((p) => p.city?.toLowerCase().includes(filter.city.toLowerCase()));
    }
    if (filter.search) {
      const q = filter.search.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q) || p.about?.toLowerCase().includes(q));
    }
    return list;
  },

  /**
   * Mengambil detail mitra berdasarkan ID
   */
  async getPartnerById(partnerId) {
    const list = getStoredPartners();
    return list.find((p) => p.id === partnerId) || MITRA_STORES[partnerId] || null;
  },

  /**
   * Memperbarui profil atau informasi toko mitra
   */
  async updatePartnerProfile(partnerId, updates) {
    const list = getStoredPartners();
    let updatedTarget = null;

    const nextList = list.map((p) => {
      if (p.id === partnerId) {
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
      savePartners(nextList);
    }
    return updatedTarget;
  },

  /**
   * Mengambil katalog unit sewa toko
   */
  async getCatalog(partnerId) {
    const partner = await this.getPartnerById(partnerId);
    return partner?.catalog || [];
  },

  /**
   * Menambah unit sewa baru ke katalog
   */
  async addCatalogItem(partnerId, itemData) {
    const partner = await this.getPartnerById(partnerId);
    if (!partner) throw new Error("Mitra toko tidak ditemukan");

    const newItem = {
      id: `unit-${partnerId.slice(0, 4)}-${Date.now()}`,
      name: itemData.name,
      category: itemData.category || "Kamera",
      type: "sewa",
      price: Number(itemData.price) || 0,
      unit: itemData.unit || "/ hari",
      image: itemData.image || "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=600&q=80",
      photos: itemData.photos || [],
      stockStatus: itemData.stockStatus || "Siap Sewa",
      desc: itemData.desc || "",
      ratingAvg: null,
      ratingCount: 0,
    };

    const updatedCatalog = [newItem, ...(partner.catalog || [])];
    return this.updatePartnerProfile(partnerId, { catalog: updatedCatalog });
  },

  /**
   * Menghapus unit sewa dari katalog
   */
  async deleteCatalogItem(partnerId, itemId) {
    const partner = await this.getPartnerById(partnerId);
    if (!partner) throw new Error("Mitra toko tidak ditemukan");

    const updatedCatalog = (partner.catalog || []).filter((i) => i.id !== itemId);
    return this.updatePartnerProfile(partnerId, { catalog: updatedCatalog });
  },

  /**
   * Mengambil paket bundling sewa
   */
  async getPackages(partnerId) {
    const partner = await this.getPartnerById(partnerId);
    return partner?.packages || [];
  },

  /**
   * Menambah paket bundling sewa
   */
  async addPackage(partnerId, packageData) {
    const partner = await this.getPartnerById(partnerId);
    if (!partner) throw new Error("Mitra toko tidak ditemukan");

    const newPkg = {
      id: `pkg-rent-${Date.now()}`,
      name: packageData.name || packageData.title,
      price: Number(packageData.price) || 0,
      unit: packageData.unit || "/ hari",
      badge: packageData.badge || "Paket Komplit",
      desc: packageData.desc || "",
      items: Array.isArray(packageData.items) ? packageData.items : [],
    };

    const updatedPackages = [newPkg, ...(partner.packages || [])];
    return this.updatePartnerProfile(partnerId, { packages: updatedPackages });
  },

  /**
   * Menghapus paket bundling sewa
   */
  async deletePackage(partnerId, packageId) {
    const partner = await this.getPartnerById(partnerId);
    if (!partner) throw new Error("Mitra toko tidak ditemukan");

    const updatedPackages = (partner.packages || []).filter((p) => p.id !== packageId);
    return this.updatePartnerProfile(partnerId, { packages: updatedPackages });
  },

  /**
   * Mengambil galeri foto showcase gear
   */
  async getGallery(partnerId) {
    const partner = await this.getPartnerById(partnerId);
    return partner?.gallery || [];
  },

  /**
   * Menambah foto ke showcase gear
   */
  async addGalleryPhoto(partnerId, photoData) {
    const partner = await this.getPartnerById(partnerId);
    if (!partner) throw new Error("Mitra toko tidak ditemukan");

    const newPhoto = {
      id: `gal-${Date.now()}`,
      title: photoData.title || "Showcase Gear",
      url: photoData.url,
      caption: photoData.caption || "",
      createdAt: new Date().toISOString(),
    };

    const updatedGallery = [newPhoto, ...(partner.gallery || [])];
    return this.updatePartnerProfile(partnerId, { gallery: updatedGallery });
  },

  /**
   * Menghapus foto dari showcase gear
   */
  async deleteGalleryPhoto(partnerId, photoId) {
    const partner = await this.getPartnerById(partnerId);
    if (!partner) throw new Error("Mitra toko tidak ditemukan");

    const updatedGallery = (partner.gallery || []).filter((g) => g.id !== photoId);
    return this.updatePartnerProfile(partnerId, { gallery: updatedGallery });
  },
};
