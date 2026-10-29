/**
 * lib/services/rentalService.js
 * Official Rental Units & Catalog Service (Connected to Database Backend API)
 */

export const rentalService = {
  /**
   * Mengambil daftar rental unit dari backend API
   */
  async getRentals(filter = {}) {
    try {
      const params = new URLSearchParams();
      if (filter.category && filter.category !== "Semua" && filter.category !== "all") {
        params.set("category", filter.category);
      }
      if (filter.search) params.set("search", filter.search);
      if (filter.campus) params.set("campus", filter.campus);

      const res = await fetch(`/api/rentals?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      return json.data || [];
    } catch (err) {
      console.error("[rentalService.getRentals error]:", err);
      return [];
    }
  },

  /**
   * Mengambil detail rental berdasarkan ID dari backend API
   */
  async getRentalById(rentalId) {
    try {
      const res = await fetch(`/api/rentals/${rentalId}`);
      if (!res.ok) return null;
      const json = await res.json();
      return json.data || null;
    } catch (err) {
      console.error("[rentalService.getRentalById error]:", err);
      return null;
    }
  },

  /**
   * Membuat listing rental baru melalui backend API
   */
  async createRental(rentalData, token) {
    const res = await fetch("/api/rentals", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(rentalData),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || "Gagal membuat listing rental.");
    }
    return json.data;
  },

  /**
   * Mengupdate data unit sewa
   */
  async updateRental(rentalId, updates, token) {
    const res = await fetch(`/api/rentals/${rentalId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(updates),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || "Gagal memperbarui listing rental.");
    }
    return json.data;
  },

  /**
   * Menghapus unit sewa
   */
  async deleteRental(rentalId, token) {
    const res = await fetch(`/api/rentals/${rentalId}`, {
      method: "DELETE",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || "Gagal menghapus unit sewa.");
    }
    return true;
  },
};
