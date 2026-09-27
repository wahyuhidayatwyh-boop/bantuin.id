/**
 * categoryService.js
 * Single source of truth & centralized resolver for Bantuin categories
 * Complies with Section O, P, Q of architectural requirements.
 */

import {
  Camera,
  Video,
  Palette,
  Code2,
  GraduationCap,
  Music,
  Wrench,
  Brush,
  Hammer,
  ShoppingBag,
  Truck,
  Car,
  Tent,
  Calendar,
  Tv,
  Package,
  FileText,
  Radio,
  Laptop,
  Layers,
  Shapes,
} from "lucide-react";
import CategoryIcon from "@/components/common/CategoryIcon";
import {
  resolveCategoryIcon,
  normalizeCategoryName,
  CATEGORY_ICON_REGISTRY,
} from "@/lib/categoryIcons";

export { CategoryIcon, resolveCategoryIcon, normalizeCategoryName, CATEGORY_ICON_REGISTRY };

// ─── Platform Categories (Requirement Q) ──────────────────────────────────
// Platform category: global, tampil di navbar & filter utama, dikontrol sistem
export const PLATFORM_CATEGORIES = {
  jasa: [
    { id: "all", name: "Semua Jasa", label: "Semua Jasa", slug: "semua-jasa", type: "jasa", scope: "platform", isPlatform: true },
    { id: "desain", name: "Desain Grafis", label: "Desain Grafis", slug: "desain-grafis", type: "jasa", scope: "platform", isPlatform: true },
    { id: "teknologi", name: "Teknologi & IT", label: "Teknologi & IT", slug: "teknologi-it", type: "jasa", scope: "platform", isPlatform: true },
    { id: "fotografi-video", name: "Fotografi & Video", label: "Fotografi & Video", slug: "fotografi-video", type: "jasa", scope: "platform", isPlatform: true },
    { id: "pendidikan", name: "Pendidikan & Tutor", label: "Pendidikan & Tutor", slug: "pendidikan-tutor", type: "jasa", scope: "platform", isPlatform: true },
    { id: "rumah-tangga", name: "Servis & Rumah Tangga", label: "Servis & Rumah Tangga", slug: "servis-rumah-tangga", type: "jasa", scope: "platform", isPlatform: true },
    { id: "musik", name: "Musik & Audio", label: "Musik & Audio", slug: "musik-audio", type: "jasa", scope: "platform", isPlatform: true },
    { id: "acara", name: "Event & Acara", label: "Event & Acara", slug: "event-acara", type: "jasa", scope: "platform", isPlatform: true },
  ],
  sewa: [
    { id: "all", name: "Semua Sewa", label: "Semua Sewa", slug: "semua-sewa", type: "sewa", scope: "platform", isPlatform: true },
    { id: "kamera", name: "Kamera & Multimedia", label: "Kamera & Multimedia", slug: "kamera-multimedia", type: "sewa", scope: "platform", isPlatform: true },
    { id: "kendaraan", name: "Kendaraan & Transportasi", label: "Kendaraan & Transportasi", slug: "kendaraan-transportasi", type: "sewa", scope: "platform", isPlatform: true },
    { id: "elektronik", name: "Elektronik & Display", label: "Elektronik & Display", slug: "elektronik-display", type: "sewa", scope: "platform", isPlatform: true },
    { id: "peralatan-acara", name: "Peralatan Acara & Audio", label: "Peralatan Acara & Audio", slug: "peralatan-acara-audio", type: "sewa", scope: "platform", isPlatform: true },
    { id: "outdoor", name: "Camping & Outdoor", label: "Camping & Outdoor", slug: "camping-outdoor", type: "sewa", scope: "platform", isPlatform: true },
    { id: "perkakas", name: "Perkakas & Tools", label: "Perkakas & Tools", slug: "perkakas-tools", type: "sewa", scope: "platform", isPlatform: true },
  ],
  bantuan: [
    { id: "all", name: "Semua Bantuan", label: "Semua Bantuan", slug: "semua-bantuan", type: "bantuan", scope: "platform", isPlatform: true },
    { id: "pindahan", name: "Pindahan Kos / Rumah", label: "Pindahan Kos / Rumah", slug: "pindahan-kos-rumah", type: "bantuan", scope: "platform", isPlatform: true },
    { id: "angkut", name: "Angkat & Bawa Barang", label: "Angkat & Bawa Barang", slug: "angkat-bawa-barang", type: "bantuan", scope: "platform", isPlatform: true },
    { id: "errand", name: "Antar Berkas & Titip", label: "Antar Berkas & Titip", slug: "antar-berkas-titip", type: "bantuan", scope: "platform", isPlatform: true },
    { id: "rakit", name: "Rakit Furnitur", label: "Rakit Furnitur", slug: "rakit-furnitur", type: "bantuan", scope: "platform", isPlatform: true },
    { id: "kebersihan", name: "Kebersihan & Cuci", label: "Kebersihan & Cuci", slug: "kebersihan-cuci", type: "bantuan", scope: "platform", isPlatform: true },
  ],
};

// ─── Custom Categories Storage (In-Memory + LocalStorage fallback) ────────
const CUSTOM_CATEGORIES_KEY = "bantuin_custom_categories";

function getStoredCustomCategories() {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CUSTOM_CATEGORIES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCustomCategories(items) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CUSTOM_CATEGORIES_KEY, JSON.stringify(items));
    window.dispatchEvent(new Event("bantuin_categories_updated"));
  } catch {}
}

// ─── Category Service Methods ─────────────────────────────────────────────
export const categoryService = {
  /**
   * Mengambil kategori platform global
   * @param {"jasa"|"sewa"|"bantuan"} type
   */
  async getPlatformCategories(type = "jasa") {
    return PLATFORM_CATEGORIES[type] || PLATFORM_CATEGORIES.jasa;
  },

  /**
   * Mengambil custom category milik provider/partner tertentu
   * @param {string} ownerId
   * @param {"jasa"|"sewa"} type
   */
  async getCustomCategories(ownerId, type = "jasa") {
    const all = getStoredCustomCategories();
    return all.filter((c) => c.ownerId === ownerId && (!type || c.type === type));
  },

  /**
   * Membuat custom category baru oleh Provider/Partner
   * ATURAN: Hanya menerima 'name'. Icon otomatis ditentukan sistem via resolveCategoryIcon.
   * DILARANG upload icon / pilih warna di client.
   * @param {string} ownerId
   * @param {{ name: string, type: "jasa"|"sewa" }} param1
   */
  async createCustomCategory(ownerId, { name, type = "jasa" }) {
    if (!name || !name.trim()) {
      throw new Error("Nama kategori wajib diisi");
    }

    const trimmedName = name.trim();
    const id = `custom-${ownerId}-${trimmedName.toLowerCase().replace(/[^a-z0-9]/g, "-")}`;
    const all = getStoredCustomCategories();

    // Check duplicate
    const existing = all.find((c) => c.id === id);
    if (existing) {
      return existing;
    }

    const newCategory = {
      id,
      ownerId,
      name: trimmedName,
      label: trimmedName,
      slug: trimmedName.toLowerCase().replace(/[^a-z0-9]/g, "-"),
      type,
      scope: type === "sewa" ? "partner" : "provider",
      isPlatform: false,
      isPromotedToGlobal: false,
      createdAt: new Date().toISOString(),
    };

    all.push(newCategory);
    saveCustomCategories(all);
    return newCategory;
  },

  /**
   * Admin: Mempromosikan custom category menjadi platform category
   * @param {string} categoryId
   */
  async promoteCustomCategory(categoryId) {
    const all = getStoredCustomCategories();
    const target = all.find((c) => c.id === categoryId);
    if (!target) throw new Error("Kategori tidak ditemukan");

    target.isPromotedToGlobal = true;
    target.promotedAt = new Date().toISOString();
    saveCustomCategories(all);
    return target;
  },

  /**
   * Mengambil seluruh kategori yang relevan untuk listing
   * (Platform categories + Promoted custom categories)
   * @param {"jasa"|"sewa"|"bantuan"} type
   */
  async getAllActiveCategories(type = "jasa") {
    const platform = PLATFORM_CATEGORIES[type] || PLATFORM_CATEGORIES.jasa;
    const customs = getStoredCustomCategories()
      .filter((c) => c.type === type && c.isPromotedToGlobal)
      .map((c) => ({
        id: c.id,
        name: c.name,
        label: c.name,
        slug: c.slug || c.name.toLowerCase().replace(/[^a-z0-9]/g, "-"),
        type: c.type,
        scope: c.scope,
        isPlatform: true,
        isCustomPromoted: true,
      }));

    return [...platform, ...customs];
  },

  /**
   * Centralized icon component getter
   */
  resolveIcon(categoryName) {
    return resolveCategoryIcon(categoryName);
  },
};
