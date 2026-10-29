/**
 * lib/security/logger.js
 * Secure Audit & Activity Logger
 * Mencegah data rahasia (password, token, secret, NIK) bocor ke log server / runtime Vercel.
 */

const SENSITIVE_KEYS = new Set([
  "password",
  "pass",
  "token",
  "accesstoken",
  "refreshtoken",
  "supabasetoken",
  "secret",
  "jwt_secret",
  "service_role_key",
  "idnumber",
  "nik",
  "authorization",
  "cookie",
]);

/**
 * Masking nilai string sensitif
 */
function maskValue(val) {
  if (typeof val !== "string") return "[REDACTED]";
  if (val.length <= 4) return "****";
  return val.substring(0, 2) + "****" + val.substring(val.length - 2);
}

/**
 * Rekursif membersihkan objek dari properti sensitif sebelum di-log
 */
export function sanitizeLogData(data) {
  if (!data || typeof data !== "object") return data;

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeLogData(item));
  }

  const clean = {};
  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_KEYS.has(lowerKey) || lowerKey.includes("password") || lowerKey.includes("secret")) {
      clean[key] = maskValue(value);
    } else if (value && typeof value === "object") {
      clean[key] = sanitizeLogData(value);
    } else {
      clean[key] = value;
    }
  }
  return clean;
}

export const logger = {
  info(message, meta = null) {
    if (meta) {
      console.log(`[INFO] ${message}`, sanitizeLogData(meta));
    } else {
      console.log(`[INFO] ${message}`);
    }
  },
  warn(message, meta = null) {
    if (meta) {
      console.warn(`[WARN] ${message}`, sanitizeLogData(meta));
    } else {
      console.warn(`[WARN] ${message}`);
    }
  },
  error(message, error = null, meta = null) {
    const errMessage = error?.message || error || "";
    if (meta) {
      console.error(`[ERROR] ${message} - ${errMessage}`, sanitizeLogData(meta));
    } else {
      console.error(`[ERROR] ${message} - ${errMessage}`);
    }
  },
};
