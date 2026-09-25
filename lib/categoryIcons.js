/**
 * categoryIcons.js
 * Single source of truth for Category Icons in Bantuin.
 * Exports resolveCategoryIcon, normalizeCategoryName, and CATEGORY_ICON_REGISTRY.
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

export const CATEGORY_ICON_REGISTRY = {
  camera: Camera,
  video: Video,
  palette: Palette,
  code: Code2,
  education: GraduationCap,
  music: Music,
  wrench: Wrench,
  brush: Brush,
  hammer: Hammer,
  shopping: ShoppingBag,
  delivery: Truck,
  vehicle: Car,
  outdoor: Tent,
  event: Calendar,
  display: Tv,
  package: Package,
  document: FileText,
  gadget: Radio,
  computer: Laptop,
  all: Layers,
  fallback: Shapes,
};

/**
 * Normalizes category name string: lowercase, trimmed, handles special symbols (&, /, -, dan)
 */
export function normalizeCategoryName(categoryName) {
  if (!categoryName) return "";
  if (typeof categoryName === "object") {
    categoryName = categoryName.name || categoryName.label || categoryName.id || "";
  }
  if (typeof categoryName !== "string") return "";

  return categoryName
    .toLowerCase()
    .replace(/[&/\\+]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * resolveCategoryIcon(categoryName)
 * Canonical resolver: ALWAYS returns a valid Lucide icon component.
 * Fallback is ALWAYS Shapes. NEVER returns undefined, null, or empty string.
 */
export function resolveCategoryIcon(categoryInput) {
  const name = normalizeCategoryName(categoryInput);

  if (!name) {
    return Shapes;
  }

  // 1. "Semua" / "All"
  if (/\b(semua|all|katalog)\b/i.test(name)) {
    return Layers;
  }

  // 2. Fotografi / Foto / Photo / Kamera
  if (/\b(foto|photo|fotografi|fotografer|photography|photographer|potret|kamera|camera|lensa|lens|dslr|mirrorless|wisuda|dokumentasi)\b/i.test(name)) {
    // If specifically video editing without camera/photo mentions
    if (/\b(videografi|videografer|editing video|editor video|sinematografi)\b/i.test(name) && !/\b(foto|photo|kamera|camera|photography)\b/i.test(name)) {
      return Video;
    }
    return Camera;
  }

  // 3. Video / Videografi / Editing Video / Reels
  if (/\b(video|videografi|videografer|sinematografi|reels|tiktok|youtube|footage|cinema|movie|film)\b/i.test(name)) {
    return Video;
  }

  // 4. Desain / Design / Grafis / UI / UX / Logo / Branding
  if (/\b(desain|design|grafis|graphic|logo|banner|branding|kemasan|packaging|poster|feed|konten|content|ilustrasi|illustration|canva|figma|vektor|vector|ui|ux)\b/i.test(name)) {
    return Palette;
  }

  // 5. Teknologi / Programming / Coding / Web / IT / Software / App
  if (/\b(teknologi|technology|tech|program|programming|coding|koding|code|website|web|software|developer|dev|it|aplikasi|app|frontend|backend|fullstack|bugfix|react|next|script|database|api|kodingan)\b/i.test(name)) {
    return Code2;
  }

  // 6. Pendidikan / Edukasi / Belajar / Les / Tutor / Skripsi / Jurnal / Bahasa / Penerjemah
  if (/\b(didik|pendidikan|edu|edukasi|tutor|tutoring|kursus|les|belajar|guru|akademik|skripsi|jurnal|bahasa|terjemah|penerjemah|translate|proofreading|inggris|abstrak|kuliah|sekolah)\b/i.test(name)) {
    return GraduationCap;
  }

  // 7. Musik / Audio / Rekaman / Podcast / Sound / Band
  if (/\b(musik|music|band|lagu|song|sound|audio|rekaman|recording|mixing|mastering|podcast|vokal|vocal|instrumen|instrument|mic|microphone|soundsystem|gitar|piano|drum)\b/i.test(name)) {
    return Music;
  }

  // 8. Acara / Event / Wedding / Pernikahan / Pesta / Party / Bazar / Gathering
  if (/\b(acara|event|wedding|nikah|pernikahan|pesta|party|bazar|gathering|ulang tahun|stand|booth|panggung|eo)\b/i.test(name)) {
    return Calendar;
  }

  // 9. Kebersihan / Cleaning / Cuci / Laundry
  if (/\b(bersih|kebersihan|cleaning|cuci|laundry|poles|sapu|setrika|housekeeping)\b/i.test(name)) {
    return Brush;
  }

  // 10. Pertukangan / Rakit Furnitur
  if (/\b(rakit|meja|kursi|lemari|furnitur|ikea|pertukangan|kayu)\b/i.test(name)) {
    return Hammer;
  }

  // 11. Belanja / Shopping / Titip / Jastip / Beli / Apotek / Obat
  if (/\b(belanja|shopping|titip|jastip|beli|pasar|sembako|apotek|obat|supermarket|minimarket)\b/i.test(name)) {
    return ShoppingBag;
  }

  // 12. Pindahan / Antar / Delivery / Kurir / Kirim / Angkut / Logistik
  if (/\b(pindah|pindahan|antar|delivery|kurir|kirim|angkut|muat|logistik|truk|truck|pickup|pick up|ekspedisi|cargo|kargo)\b/i.test(name)) {
    return Truck;
  }

  // 13. Angkat & Bawa Barang / Paket
  if (/\b(angkat|bawa|paket|box|barang|titipan|bawaan)\b/i.test(name)) {
    return Package;
  }

  // 14. Berkas / Dokumen / Print / Fotokopi / Surat / Errand
  if (/\b(berkas|dokumen|surat|print|cetak|fotokopi|jilid|errand|notaris|proposal|laporan)\b/i.test(name)) {
    return FileText;
  }

  // 15. Rumah Tangga / Servis / Perbaikan / Reparasi / Teknisi / AC / Listrik / Perkakas
  if (/\b(rumah tangga|rumah|servis|service|perbaikan|reparasi|repair|teknisi|ac|freon|listrik|mcb|tukang|bengkel|perkakas|bor|tools|maintenance)\b/i.test(name)) {
    return Wrench;
  }

  // 16. Transportasi / Kendaraan / Mobil / Motor / Vehicle
  if (/\b(kendaraan|transportasi|mobil|motor|vehicle|supir|driver)\b/i.test(name)) {
    return Car;
  }

  // 17. Outdoor / Camping / Hiking / Adventure / Gunung / Tenda
  if (/\b(camp|camping|outdoor|tenda|gunung|hiking|adventure|ransel|carrier|matras)\b/i.test(name)) {
    return Tent;
  }

  // 18. Elektronik / TV / Display / Proyektor / Layar
  if (/\b(display|tv|televisi|layar|expo|screen|proyektor|projector|monitor|elektronik|electronic|gadget)\b/i.test(name)) {
    return Tv;
  }

  // 19. Komputer / Laptop / PC / Hardware
  if (/\b(laptop|pc|komputer|hardware)\b/i.test(name)) {
    return Laptop;
  }

  // 20. Drone / Action Cam / Radio / HT / Gimbal
  if (/\b(drone|action cam|gopro|dji|radio|ht|gimbal|stabilizer)\b/i.test(name)) {
    return Radio;
  }

  // Default fallback: Always Shapes. NEVER blank.
  return Shapes;
}
