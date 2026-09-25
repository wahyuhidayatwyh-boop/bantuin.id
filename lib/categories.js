/**
 * categories.js — Single Source of Truth untuk semua kategori di Bantuin
 *
 * Setiap kali kategori perlu ditambah/diubah, cukup edit file ini.
 * Semua halaman (listing, form daftar, icon grid, dropdown) otomatis menyesuaikan.
 *
 * Struktur tiap entry:
 *   id        — nilai unik untuk filter/matching (string, tanpa spasi jika bisa)
 *   name      — nama tampilan canonical (untuk dropdown, filter chip, badge)
 *   label     — nama tampilan (alias untuk backward-compat)
 *   slug      — slug url-friendly
 *   type      — "sewa" | "bantuan" | "jasa"
 *   keywords  — kata kunci tambahan untuk search/matching pada data mock
 *   icon      — Lucide icon component atau string name (otomatis diresolve secara aman)
 *   isPlatform— true (kategori resmi platform)
 */

import {
  Layers,
  Camera,
  Headphones,
  Video,
  Radio,
  Sun,
  Brush,
  Wrench,
  Tv,
  Tent,
  Truck,
  Package,
  FileText,
  Hammer,
  Car,
  MoreHorizontal,
  Palette,
  Laptop,
  Globe,
  Music,
  PenLine,
  Code2,
  GraduationCap,
  ShoppingBag,
  Shapes,
} from "lucide-react";
import CategoryIcon from "@/components/common/CategoryIcon";
import { resolveCategoryIcon, normalizeCategoryName } from "@/lib/categoryIcons";

export { CategoryIcon, resolveCategoryIcon, normalizeCategoryName };

// ─── SEWA ─────────────────────────────────────────────────────────────────────
export const SEWA_CATEGORIES = [
  {
    id: "Semua",
    name: "Semua Kategori",
    label: "Semua Kategori",
    slug: "semua",
    type: "sewa",
    keywords: [],
    icon: Layers,
    isPlatform: true,
  },
  {
    id: "Kamera",
    name: "Kamera & Lensa",
    label: "Kamera & Lensa",
    slug: "kamera-lensa",
    type: "sewa",
    keywords: ["kamera", "lensa", "mirrorless", "dslr", "multimedia", "sony", "canon"],
    icon: Camera,
    isPlatform: true,
  },
  {
    id: "Audio",
    name: "Audio & Podcast",
    label: "Audio & Podcast",
    slug: "audio-podcast",
    type: "sewa",
    keywords: ["audio", "mic", "microphone", "podcast", "speaker", "soundsystem", "wireless"],
    icon: Music,
    isPlatform: true,
  },
  {
    id: "Proyektor",
    name: "Proyektor & Layar",
    label: "Proyektor & Layar",
    slug: "proyektor-layar",
    type: "sewa",
    keywords: ["proyektor", "projector", "layar", "screen", "display"],
    icon: Tv,
    isPlatform: true,
  },
  {
    id: "Drone",
    name: "Drone & Action Cam",
    label: "Drone & Action Cam",
    slug: "drone-action-cam",
    type: "sewa",
    keywords: ["drone", "action", "gopro", "dji", "cam"],
    icon: Radio,
    isPlatform: true,
  },
  {
    id: "Lighting",
    name: "Lighting Studio",
    label: "Lighting Studio",
    slug: "lighting-studio",
    type: "sewa",
    keywords: ["lighting", "light", "studio", "lampu", "softbox", "led"],
    icon: Sun,
    isPlatform: true,
  },
  {
    id: "Perkakas",
    name: "Alat Perkakas",
    label: "Alat Perkakas",
    slug: "alat-perkakas",
    type: "sewa",
    keywords: ["perkakas", "bor", "pertukangan", "tools", "gerinda", "obeng"],
    icon: Wrench,
    isPlatform: true,
  },
  {
    id: "Display",
    name: "TV & Layar Expo",
    label: "TV & Layar Expo",
    slug: "tv-layar-expo",
    type: "sewa",
    keywords: ["display", "tv", "televisi", "monitor", "vendor", "bazar", "event"],
    icon: Tv,
    isPlatform: true,
  },
  {
    id: "Camping",
    name: "Camping & Outdoor",
    label: "Camping & Outdoor",
    slug: "camping-outdoor",
    type: "sewa",
    keywords: ["camping", "outdoor", "tenda", "ransel", "gunung", "carrier"],
    icon: Tent,
    isPlatform: true,
  },
];

// Label dropdown pendaftaran mitra sewa (harus subset / superset dari SEWA_CATEGORIES)
export const SEWA_REGISTER_OPTIONS = SEWA_CATEGORIES
  .filter((c) => c.id !== "Semua")
  .map((c) => ({
    value: c.label,
    label: c.label,
  }))
  .concat([{ value: "Lainnya", label: "Lainnya" }]);

// ─── BANTUAN ──────────────────────────────────────────────────────────────────
export const BANTUAN_CATEGORIES = [
  {
    id: "Semua",
    name: "Semua Bantuan",
    label: "Semua Bantuan",
    slug: "semua",
    type: "bantuan",
    keywords: [],
    icon: Layers,
    isPlatform: true,
  },
  {
    id: "Pindahan",
    name: "Pindahan Kos / Rumah",
    label: "Pindahan Kos / Rumah",
    slug: "pindahan-kos-rumah",
    type: "bantuan",
    keywords: ["pindahan", "pindah", "kos", "rumah", "angkat", "kost"],
    icon: Truck,
    isPlatform: true,
  },
  {
    id: "Bawaan",
    name: "Angkat & Bawa Barang",
    label: "Angkat & Bawa Barang",
    slug: "angkat-bawa-barang",
    type: "bantuan",
    keywords: ["angkat", "bawa", "kasur", "lemari", "berat", "barang"],
    icon: Package,
    isPlatform: true,
  },
  {
    id: "Errand",
    name: "Antar Berkas / Dokumen",
    label: "Antar Berkas / Dokumen",
    slug: "antar-berkas-dokumen",
    type: "bantuan",
    keywords: ["antar", "berkas", "dokumen", "surat", "errand", "print", "fotokopi"],
    icon: FileText,
    isPlatform: true,
  },
  {
    id: "Rakit",
    name: "Rakit Furnitur",
    label: "Rakit Furnitur",
    slug: "rakit-furnitur",
    type: "bantuan",
    keywords: ["rakit", "meja", "kursi", "lemari", "furnitur", "ikea"],
    icon: Hammer,
    isPlatform: true,
  },
  {
    id: "Logistik",
    name: "Bongkar Muat Pickup",
    label: "Bongkar Muat Pickup",
    slug: "bongkar-muat-pickup",
    type: "bantuan",
    keywords: ["bongkar", "muat", "pickup", "logistik", "truk"],
    icon: Car,
    isPlatform: true,
  },
  {
    id: "Kebersihan",
    name: "Bersih-Bersih & Cuci",
    label: "Bersih-Bersih & Cuci",
    slug: "bersih-bersih-cuci",
    type: "bantuan",
    keywords: ["bersih", "cuci", "cleaning", "kos", "rumah", "laundry"],
    icon: Brush,
    isPlatform: true,
  },
  {
    id: "Belanja",
    name: "Titip Belanja & Apotek",
    label: "Titip Belanja & Apotek",
    slug: "titip-belanja-apotek",
    type: "bantuan",
    keywords: ["belanja", "titip", "jastip", "obat", "apotek", "pasar", "sembako"],
    icon: ShoppingBag,
    isPlatform: true,
  },
  {
    id: "Lainnya",
    name: "Bantuan Lainnya",
    label: "Bantuan Lainnya",
    slug: "bantuan-lainnya",
    type: "bantuan",
    keywords: [],
    icon: Shapes,
    isPlatform: true,
  },
];

// ─── JASA ─────────────────────────────────────────────────────────────────────
export const JASA_CATEGORIES = [
  {
    id: "Semua",
    name: "Semua Jasa",
    label: "Semua Jasa",
    slug: "semua",
    type: "jasa",
    keywords: [],
    icon: Layers,
    isPlatform: true,
  },
  {
    id: "Desain",
    name: "Desain Grafis",
    label: "Desain Grafis",
    slug: "desain-grafis",
    type: "jasa",
    keywords: ["desain", "design", "logo", "branding", "kemasan", "banner", "feed", "ui", "ux"],
    icon: Palette,
    isPlatform: true,
  },
  {
    id: "Fotografi",
    name: "Fotografi & Video",
    label: "Fotografi & Video",
    slug: "fotografi-video",
    type: "jasa",
    keywords: ["foto", "photography", "video", "wisuda", "dokumentasi", "potret", "event", "videografi"],
    icon: Camera,
    isPlatform: true,
  },
  {
    id: "Teknisi",
    name: "Teknisi AC & Listrik",
    label: "Teknisi AC & Listrik",
    slug: "teknisi-ac-listrik",
    type: "jasa",
    keywords: ["teknisi", "ac", "freon", "listrik", "mcb", "instalasi", "cuci ac", "servis"],
    icon: Wrench,
    isPlatform: true,
  },
  {
    id: "Komputer",
    name: "Servis Laptop & PC",
    label: "Servis Laptop & PC",
    slug: "servis-laptop-pc",
    type: "jasa",
    keywords: ["laptop", "pc", "komputer", "instal", "ssd", "ram", "keyboard", "pasta", "software", "hardware"],
    icon: Laptop,
    isPlatform: true,
  },
  {
    id: "Web",
    name: "Web & IT",
    label: "Web & IT",
    slug: "web-it",
    type: "jasa",
    keywords: ["web", "website", "it", "react", "next", "landing", "bug", "frontend", "backend", "program", "coding"],
    icon: Code2,
    isPlatform: true,
  },
  {
    id: "Bahasa",
    name: "Penerjemah & Tutor",
    label: "Penerjemah & Tutor",
    slug: "penerjemah-tutor",
    type: "jasa",
    keywords: ["terjemah", "penerjemah", "bahasa", "tutor", "jurnal", "skripsi", "inggris", "les", "belajar"],
    icon: GraduationCap,
    isPlatform: true,
  },
  {
    id: "Musik",
    name: "Musik & Rekaman",
    label: "Musik & Rekaman",
    slug: "musik-rekaman",
    type: "jasa",
    keywords: ["musik", "rekaman", "mixing", "mastering", "studio", "lagu", "audio", "sound"],
    icon: Music,
    isPlatform: true,
  },
  {
    id: "Konten",
    name: "Konten & Copywriting",
    label: "Konten & Copywriting",
    slug: "konten-copywriting",
    type: "jasa",
    keywords: ["konten", "content", "copywriting", "artikel", "caption", "sosmed", "penulisan"],
    icon: PenLine,
    isPlatform: true,
  },
];

// Opsi untuk dropdown pendaftaran provider jasa
export const JASA_REGISTER_OPTIONS = JASA_CATEGORIES
  .filter((c) => c.id !== "Semua")
  .map((c) => ({
    value: c.id,
    label: c.label,
  }))
  .concat([{ value: "Lainnya", label: "Lainnya" }]);

/**
 * resolveIcon(name)
 * Returns Lucide icon component, safely resolving Lucide component, string name or category object
 */
export function resolveIcon(name) {
  return resolveCategoryIcon(name);
}

/**
 * matchesCategory(item, categoryId, type)
 * Cek apakah item rental/bantuan/jasa cocok dengan kategori yang dipilih.
 * @param {object} item   — item data (rental, request, service, dll)
 * @param {string} catId  — category.id yang dipilih
 * @param {"sewa"|"bantuan"|"jasa"} type
 */
export function matchesCategory(item, catId, type = "sewa") {
  if (!catId || catId === "Semua") return true;

  const CAT_MAP = { sewa: SEWA_CATEGORIES, bantuan: BANTUAN_CATEGORIES, jasa: JASA_CATEGORIES };
  const cats = CAT_MAP[type] || SEWA_CATEGORIES;
  const cat = cats.find((c) => c.id === catId);
  if (!cat) return false;

  // Gabungkan semua field teks item menjadi satu string untuk matching
  const haystack = [
    item.category,
    item.categoryGroup,
    item.title,
    item.name,
    item.description,
    item.businessCategory,
    item.serviceType,
    item.about,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  // Match jika id ada di haystack ATAU salah satu keyword ada di haystack
  const terms = [catId.toLowerCase(), cat.label.toLowerCase(), ...cat.keywords];
  return terms.some((kw) => haystack.includes(kw));
}
