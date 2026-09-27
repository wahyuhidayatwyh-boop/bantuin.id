/**
 * voucherService.js
 * Discount & Promo Voucher Management Service Abstraction
 * Complies with Section 41 of requirements.
 *
 * PENTING:
 * Voucher adalah DISCOUNT / POTONGAN HARGA transaksi.
 * Paid Promotion adalah penempatan etalase unggulan (Featured Placement).
 * Keduanya merupakan domain terpisah.
 */

import { initialVouchers, isVoucherLocationMatch } from "@/lib/mock/voucherData";

const VOUCHER_STORAGE_KEY = "bantuin_vouchers_state";

function getStoredVouchers() {
  if (typeof window === "undefined") return initialVouchers;
  try {
    const raw = localStorage.getItem(VOUCHER_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return initialVouchers;
}

function saveVouchers(items) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(VOUCHER_STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new Event("bantuin_vouchers_updated"));
  } catch {}
}

export const voucherService = {
  /**
   * Mengambil daftar seluruh voucher aktif & nonaktif
   */
  async getVouchers(filter = {}) {
    let list = getStoredVouchers();
    if (filter.status === "active") {
      const now = new Date();
      list = list.filter((v) => v.isActive && new Date(v.expiresAt) > now && (v.quota - v.usedCount) > 0);
    }
    if (filter.category && filter.category !== "all") {
      list = list.filter((v) => v.appliesTo === "all" || v.appliesTo === filter.category);
    }
    return list;
  },

  /**
   * Validasi dan perhitungan diskon voucher untuk checkout
   */
  async validateVoucher(code, { category = "all", amount = 0, location = "" }) {
    if (!code) return { ok: false, error: "Kode voucher tidak boleh kosong." };

    const vouchers = getStoredVouchers();
    const vc = vouchers.find((v) => v.code.toUpperCase() === code.trim().toUpperCase());

    if (!vc) return { ok: false, error: "Kode voucher tidak ditemukan." };
    if (!vc.isActive) return { ok: false, error: "Voucher ini sudah tidak aktif." };
    if (vc.quota - vc.usedCount <= 0) return { ok: false, error: "Kuota voucher sudah habis." };
    if (new Date(vc.expiresAt) < new Date()) return { ok: false, error: "Voucher sudah kadaluarsa." };
    if (vc.appliesTo !== "all" && vc.appliesTo !== category) {
      return { ok: false, error: `Voucher ini hanya berlaku untuk kategori ${vc.appliesTo}.` };
    }
    if (amount < (vc.minOrder || 0)) {
      return { ok: false, error: `Minimal transaksi untuk voucher ini adalah Rp ${(vc.minOrder || 0).toLocaleString("id-ID")}.` };
    }

    if (vc.targetLocation && vc.targetLocation !== "all" && !isVoucherLocationMatch(vc.targetLocation, location)) {
      return {
        ok: false,
        error: `Voucher ini hanya berlaku khusus untuk wilayah ${vc.targetLocation}. Lokasi Anda saat ini (${location || "di luar wilayah promo"}) tidak memenuhi kriteria.`,
      };
    }

    // Hitung nominal diskon
    let discount = 0;
    if (vc.type === "percent") {
      discount = Math.round((amount * vc.value) / 100);
      if (vc.maxDiscount && discount > vc.maxDiscount) {
        discount = vc.maxDiscount;
      }
    } else {
      discount = vc.value;
    }
    if (discount > amount) discount = amount;

    return {
      ok: true,
      discount,
      voucher: vc,
    };
  },

  /**
   * Admin: Membuat voucher baru
   */
  async createVoucher(data) {
    if (!data.code || !data.value) {
      throw new Error("Kode dan nilai diskon voucher wajib diisi.");
    }

    const newVoucher = {
      id: `vch-${Date.now()}`,
      code: data.code.trim().toUpperCase(),
      title: data.title || data.code.trim().toUpperCase(),
      description: data.description || "Voucher potongan harga spesial platform Bantuin.",
      type: data.type || "percent",
      value: Number(data.value) || 0,
      minOrder: Number(data.minOrder) || 0,
      maxDiscount: Number(data.maxDiscount) || 25000,
      targetLocation: data.targetLocation || "all",
      appliesTo: data.appliesTo || "all",
      quota: Number(data.quota) || 50,
      usedCount: 0,
      startDate: new Date().toISOString(),
      expiresAt: data.expiresAt || new Date(Date.now() + 30 * 86400000).toISOString(),
      isActive: true,
    };

    const list = getStoredVouchers();
    saveVouchers([newVoucher, ...list]);
    return newVoucher;
  },

  /**
   * Admin: Mengaktifkan / Menutup voucher
   */
  async toggleVoucher(id) {
    const list = getStoredVouchers();
    const updated = list.map((v) => (v.id === id ? { ...v, isActive: !v.isActive } : v));
    saveVouchers(updated);
    return updated.find((v) => v.id === id);
  },

  /**
   * Admin: Menghapus voucher
   */
  async deleteVoucher(id) {
    const list = getStoredVouchers();
    const updated = list.filter((v) => v.id !== id);
    saveVouchers(updated);
    return true;
  },
};
