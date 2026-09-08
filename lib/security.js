/**
 * Trust & Safety / Security Helpers for Bantuin
 * - Anti-disintermediation detector (blocks sharing phone numbers / external payments before order room is locked)
 * - Input sanitizer against XSS
 */

// Regex patterns to detect Indonesian phone numbers and common evasion techniques
const PHONE_PATTERNS = [
  /(?:\+?62|08)[0-9\s\-_.]{8,14}/gi,
  /(?:wa\.me|api\.whatsapp\.com)\/[0-9]+/gi,
  /\b0\s*8\s*[0-9\s\-_.]{7,13}\b/gi,
  /\b(?:nol|o)\s*delapan\s*[0-9a-zA-Z\s]{5,20}\b/gi,
];

const DISINTERMEDIATION_KEYWORDS = [
  "transfer langsung",
  "rekening pribadi",
  "luar aplikasi",
  "chat wa",
  "nomor wa",
  "kontak wa",
  "tf langsung",
  "bca saya",
  "mandiri saya",
  "bni saya",
  "dana saya",
  "gopay saya",
  "spay saya",
];

export function detectDisintermediation(text) {
  if (!text || typeof text !== "string") {
    return { flagged: false, reason: null };
  }

  // Check phone patterns
  for (const pattern of PHONE_PATTERNS) {
    if (pattern.test(text)) {
      return {
        flagged: true,
        reason: "Terdeteksi nomor telepon atau kontak WhatsApp. Demi keamanan dan garansi dana escrow Bantuin, pertukaran kontak dilarang sebelum Order Room resmi terbentuk.",
      };
    }
  }

  // Check keywords
  const lowerText = text.toLowerCase();
  for (const keyword of DISINTERMEDIATION_KEYWORDS) {
    if (lowerText.includes(keyword)) {
      return {
        flagged: true,
        reason: `Terdeteksi indikasi ajakan transaksi di luar platform ("${keyword}"). Seluruh pembayaran wajib melalui escrow Xendit untuk perlindungan dana kedua pihak.`,
      };
    }
  }

  return { flagged: false, reason: null };
}

export function sanitizeInput(input) {
  if (typeof input !== "string") return input;
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
