/**
 * Trust & Safety / Security Helpers for Bantuin
 * - Risk Classification Moderation (BLOCK vs REVIEW)
 * - Anti-disintermediation detector (flags evasion patterns to off-platform transactions)
 * - Input sanitizer against XSS
 */

// Regex patterns to detect Indonesian phone numbers and external messaging links
const DIRECT_PHONE_PATTERNS = [
  /(?:\+?62|08)[0-9\s\-_.]{8,14}/gi,
  /(?:wa\.me|api\.whatsapp\.com)\/[0-9]+/gi,
];

// Targeted off-platform solicitation keywords (avoids false positives like "rekening saya sudah di profil")
const SOLICITATION_KEYWORDS = [
  "transfer langsung",
  "tf langsung",
  "direct transfer",
  "direct tf",
  "bayar langsung aja",
  "bayar di luar",
  "di luar aplikasi",
  "rekening pribadi",
  "minta no rekening",
  "kirim no rekening",
  "kirim nomor rekening",
  "transfer ke rek",
  "tf ke rek",
  "ke wa aja",
  "chat di wa",
  "hubungi wa saya",
  "japri ya",
  "wa langsung",
];

// Prohibited Items and Unlawful Services with Severity (BLOCK vs REVIEW)
const PROHIBITED_ITEMS = [
  // Narkotika & Zat Terlarang (UU No. 35/2009) -> BLOCK
  { term: "sabu", label: "Narkotika", severity: "BLOCK", reason: "Zat narkotika dan psikotropika dilarang keras oleh hukum Republik Indonesia." },
  { term: "ganja", label: "Narkotika", severity: "BLOCK", reason: "Zat narkotika dan obat terlarang dilarang keras oleh hukum." },
  { term: "tembakau gorila", label: "Narkotika", severity: "BLOCK", reason: "Zat berbahaya dan narkotika sintetis dilarang keras." },
  { term: "sinte", label: "Narkotika", severity: "BLOCK", reason: "Zat berbahaya sintetis dilarang keras oleh hukum." },
  { term: "ekstasi", label: "Narkotika", severity: "BLOCK", reason: "Narkotika & zat psikotropika dilarang keras." },
  { term: "inex", label: "Narkotika", severity: "BLOCK", reason: "Narkotika & zat psikotropika dilarang keras." },
  { term: "tramadol", label: "Obat Keras", severity: "BLOCK", reason: "Peredaran obat keras daftar G tanpa resep dokter melanggar UU Kesehatan." },
  { term: "oplosan", label: "Miras Ilegal", severity: "BLOCK", reason: "Minuman keras oplosan dan zat beracun dilarang keras." },
  { term: "senjata api", label: "Senjata", severity: "BLOCK", reason: "Senjata api dan amunisi ilegal dilarang hukum pidana." },
  { term: "senpi", label: "Senjata", severity: "BLOCK", reason: "Senjata api ilegal dilarang keras." },
  { term: "celurit", label: "Senjata Tajam", severity: "BLOCK", reason: "Senjata tajam berbahaya dilarang diperjualbelikan/dititipkan." },
  
  // Pelanggaran Integritas Akademik Kampus (Permendikbudristek No. 39/2021) -> BLOCK
  { term: "joki skripsi", label: "Integritas Akademik", severity: "BLOCK", reason: "Jasa joki penulisan skripsi melanggar kode etik universitas. Anda dapat menggunakan layanan 'Tutor / Konsultasi Metodologi' atau 'Proofreading'." },
  { term: "buatkan skripsi", label: "Integritas Akademik", severity: "BLOCK", reason: "Jasa pembuatan skripsi dilarang. Gunakan layanan bimbingan belajar atau konsultasi resmi." },
  { term: "joki tesis", label: "Integritas Akademik", severity: "BLOCK", reason: "Jasa joki penulisan tesis melanggar kode etik universitas." },
  { term: "joki ujian", label: "Integritas Akademik", severity: "BLOCK", reason: "Pengerjaan ujian oleh pihak ketiga melanggar sanksi akademik kampus." },
  { term: "joki uas", label: "Integritas Akademik", severity: "BLOCK", reason: "Pengerjaan UAS oleh pihak ketiga melanggar integritas akademik." },
  { term: "joki uts", label: "Integritas Akademik", severity: "BLOCK", reason: "Pengerjaan UTS oleh pihak ketiga melanggar integritas akademik." },
  { term: "kerjakan ujian", label: "Integritas Akademik", severity: "BLOCK", reason: "Pengerjaan ujian oleh orang lain melanggar kode etik kampus." },
  
  // Asusila & Eksploitasi -> BLOCK
  { term: "open bo", label: "Konten Asusila", severity: "BLOCK", reason: "Layanan bermuatan asusila atau prostitusi dilarang keras di platform Bantuin." },
  { term: "booking cewek", label: "Konten Asusila", severity: "BLOCK", reason: "Layanan asusila dilarang keras oleh hukum RI dan platform Bantuin." },
  { term: "vcs", label: "Konten Asusila", severity: "BLOCK", reason: "Konten bermuatan pornografi dilarang keras UU Pornografi & UU ITE." },
  { term: "kencan berbayar", label: "Konten Asusila", severity: "BLOCK", reason: "Layanan kencan berbayar tidak diizinkan di platform komunitas kampus." },

  // Borderline Terms (Obat resep dokter, kimia tertentu) -> REVIEW (Peringatan & Catatan)
  { term: "resep dokter", label: "Verifikasi Resep", severity: "REVIEW", reason: "Pastikan pengantaran obat disertai salinan resep dokter yang sah dan dibeli dari apotek berizin." },
  { term: "bahan kimia", label: "Bahan Khusus", severity: "REVIEW", reason: "Bahan kimia praktikum laboratorium wajib dikemas dalam wadah bersegel resmi institusi." },
];

/**
 * Detects prohibited substances or academic integrity violations
 * Returns { flagged, severity: 'BLOCK' | 'REVIEW', category, reason, term }
 */
export function detectProhibitedContent(text) {
  if (!text || typeof text !== "string") {
    return { flagged: false, severity: null, category: null, reason: null, term: null };
  }

  const lower = text.toLowerCase();
  for (const item of PROHIBITED_ITEMS) {
    const regex = new RegExp(`\\b${item.term}\\b`, "i");
    if (regex.test(lower) || lower.includes(item.term)) {
      return {
        flagged: true,
        severity: item.severity,
        category: item.label,
        reason: item.reason,
        term: item.term,
      };
    }
  }

  return { flagged: false, severity: null, category: null, reason: null, term: null };
}

/**
 * Detects attempts to solicit off-platform transactions or direct phone exchanges
 */
export function detectDisintermediation(text) {
  if (!text || typeof text !== "string") {
    return { flagged: false, reason: null };
  }

  // Check direct phone patterns
  for (const pattern of DIRECT_PHONE_PATTERNS) {
    if (pattern.test(text)) {
      return {
        flagged: true,
        reason: "Terdeteksi nomor telepon atau kontak WhatsApp. Demi keamanan dan proteksi sistem pembayaran resmi Bantuin, pertukaran kontak dianjurkan setelah pesanan resmi disepakati.",
      };
    }
  }

  // Check solicitation keywords
  const lowerText = text.toLowerCase();
  for (const keyword of SOLICITATION_KEYWORDS) {
    if (lowerText.includes(keyword)) {
      return {
        flagged: true,
        reason: `Terdeteksi indikasi ajakan transaksi luar sistem ("${keyword}"). Gunakan sistem pembayaran resmi Bantuin untuk memastikan garansi transaksi aman.`,
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
