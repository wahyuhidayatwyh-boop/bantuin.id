/**
 * lib/services/serviceService.js
 * Official Freelance & Student Services Catalog Service (Connected to Database Backend API)
 */

export const serviceService = {
  /**
   * Mengambil semua listing jasa dari backend API
   */
  async getServices(filter = {}) {
    try {
      const params = new URLSearchParams();
      if (filter.category && filter.category !== "Semua" && filter.category !== "all") {
        params.set("category", filter.category);
      }
      if (filter.search) params.set("search", filter.search);
      if (filter.providerId) params.set("providerId", filter.providerId);

      const res = await fetch(`/api/services?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      return json.data || [];
    } catch (err) {
      console.error("[serviceService.getServices error]:", err);
      return [];
    }
  },

  /**
   * Mengambil detail jasa berdasarkan ID dari backend API
   */
  async getServiceById(serviceId) {
    try {
      const res = await fetch(`/api/services/${serviceId}`);
      if (!res.ok) return null;
      const json = await res.json();
      return json.data || null;
    } catch (err) {
      console.error("[serviceService.getServiceById error]:", err);
      return null;
    }
  },

  /**
   * Membuat listing jasa baru melalui backend API
   */
  async createService(serviceData, token) {
    const res = await fetch("/api/services", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(serviceData),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || "Gagal membuat listing jasa.");
    }
    return json.data;
  },

  /**
   * Mengupdate listing jasa
   */
  async updateService(serviceId, updates, token) {
    const res = await fetch(`/api/services/${serviceId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(updates),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || "Gagal memperbarui listing jasa.");
    }
    return json.data;
  },

  /**
   * Menghapus listing jasa
   */
  async deleteService(serviceId, token) {
    const res = await fetch(`/api/services/${serviceId}`, {
      method: "DELETE",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || "Gagal menghapus listing jasa.");
    }
    return true;
  },
};
