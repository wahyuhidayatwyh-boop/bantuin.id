/**
 * lib/security/sanitize.js
 * Input Sanitization & Anti-XSS Helper
 * Membersihkan input teks dari payload berbahaya (script injection, iframe, event handlers)
 */

/**
 * Membersihkan string dari karakter berbahaya dan tag HTML (Anti-XSS)
 * @param {string} input
 * @returns {string}
 */
export function sanitizeString(input) {
  if (typeof input !== "string") return input;

  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
    .replace(/javascript:[^"']*/gi, "")
    .replace(/on\w+\s*=/gi, "")
    .trim();
}

/**
 * Membersihkan seluruh properti string dalam sebuah objek input
 * @param {object} obj
 * @returns {object}
 */
export function sanitizeObject(obj) {
  if (!obj || typeof obj !== "object") return obj;

  const sanitized = Array.isArray(obj) ? [] : {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string") {
      sanitized[key] = sanitizeString(value);
    } else if (value && typeof value === "object") {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

/**
 * Validasi format email
 */
export function isValidEmail(email) {
  if (!email || typeof email !== "string") return false;
  const re = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+$/;
  return re.test(email.trim());
}

/**
 * Validasi nomor HP/WhatsApp Indonesia (08... atau +628...)
 */
export function isValidIndonesianPhone(phone) {
  if (!phone || typeof phone !== "string") return false;
  const clean = phone.replace(/\D/g, "");
  return (clean.startsWith("08") || clean.startsWith("628")) && clean.length >= 10 && clean.length <= 15;
}

/**
 * Validasi format NIK KTP (tepat 16 digit angka)
 */
export function isValidNIK(nik) {
  if (!nik || typeof nik !== "string") return false;
  return /^\d{16}$/.test(nik.trim());
}
