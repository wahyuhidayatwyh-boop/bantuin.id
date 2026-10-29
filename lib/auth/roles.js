/**
 * lib/auth/roles.js
 * Aturan kanonikal role dan formatting identitas tanpa dependensi framework.
 *
 * CANONICAL ROLES:
 * - user     : Pengguna reguler pencari jasa / penyewa barang
 * - provider : Penyedia jasa / freelancer
 * - partner  : Mitra sewa / pemilik rental barang
 * - admin    : Administrator platform Bantuin (diperoleh hanya via seed / DB)
 */

export const CANONICAL_ROLES = {
  USER: "user",
  PROVIDER: "provider",
  PARTNER: "partner",
  ADMIN: "admin",
};

export const PUBLIC_ROLES = ["user", "provider", "partner"];

const ROLE_ALIASES = {
  user: "user",
  pengguna: "user",
  customer: "user",
  provider: "provider",
  penyedia: "provider",
  jasa: "provider",
  partner: "partner",
  mitra: "partner",
  sewa: "partner",
};

/**
 * Normalisasi role dari input publik (form register / OAuth).
 * Nilai apa pun di luar daftar publik (termasuk "admin" atau "super_admin") jatuh ke "user".
 */
export function normalizePublicRole(input) {
  const key = String(input || "").trim().toLowerCase();
  return ROLE_ALIASES[key] || "user";
}

/**
 * Menentukan role efektif sebuah profil dari data database.
 */
export function resolveRole(profile) {
  if (!profile) return "user";
  if (profile.isAdmin) return "admin";
  const stored = String(profile.accountRole || "").toLowerCase();
  if (stored === "provider" || stored === "partner") return stored;
  if (profile.isPartner) return "partner";
  return "user";
}

/**
 * Menyembunyikan sebagian NIK KTP untuk keamanan privasi.
 * Contoh: "3201234567890001" -> "3201********0001"
 */
export function maskIdNumber(idNumber) {
  if (!idNumber) return "";
  const s = String(idNumber);
  if (s.length <= 8) return "*".repeat(s.length);
  return `${s.slice(0, 4)}${"*".repeat(s.length - 8)}${s.slice(-4)}`;
}

/**
 * Membersihkan URL avatar jika null atau placeholder unsplash default
 */
export function cleanAvatar(url) {
  if (!url || typeof url !== "string") return null;
  if (url.includes("images.unsplash.com")) return null;
  return url;
}

