/**
 * lib/security/rateLimiter.js
 * In-Memory Sliding Window Rate Limiter & Anti-Brute Force Guard
 * Menahan spam request dan serangan brute force login/registrasi.
 */

const tracker = new Map();

// Bersihkan tracker setiap 10 menit untuk mencegah memory leak
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of tracker.entries()) {
      if (now > record.resetTime) {
        tracker.delete(key);
      }
    }
  }, 10 * 60 * 1000);
}

/**
 * Konfigurasi Limit berdasarkan tipe aksi
 */
export const RATE_LIMIT_RULES = {
  // Login: Maksimal 5x percobaan per 15 menit per IP / identifier
  LOGIN: {
    limit: 5,
    windowMs: 15 * 60 * 1000,
    message: "Terlalu banyak percobaan login gagal. Demi keamanan, akun/IP diblokir sementara selama 15 menit.",
  },
  // Register: Maksimal 5x pendaftaran per 30 menit per IP
  REGISTER: {
    limit: 5,
    windowMs: 30 * 60 * 1000,
    message: "Terlalu banyak request pendaftaran dari IP ini. Silakan coba lagi nanti.",
  },
  // Google Auth: Maksimal 15x request per 15 menit
  GOOGLE_AUTH: {
    limit: 15,
    windowMs: 15 * 60 * 1000,
    message: "Terlalu banyak request otentikasi Google. Silakan coba lagi nanti.",
  },
  // Umum API: Maksimal 120 request per 1 menit
  GENERAL_API: {
    limit: 120,
    windowMs: 60 * 1000,
    message: "Terlalu banyak permintaan ke server. Silakan pelan-pelan.",
  },
};

/**
 * Ekstraksi IP address dari HTTP Request Next.js
 */
export function getClientIp(req) {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }
  return "127.0.0.1";
}

/**
 * Memeriksa apakah request melampaui batas rate limit
 * @param {string} key Identifier unik (misal: "login:192.168.1.1" atau "login:email@domain.com")
 * @param {object} rule Konfigurasi dari RATE_LIMIT_RULES
 * @returns {{ allowed: boolean, remaining: number, resetInSeconds: number, message: string }}
 */
export function checkRateLimit(key, rule = RATE_LIMIT_RULES.GENERAL_API) {
  const now = Date.now();
  const record = tracker.get(key) || { count: 0, resetTime: now + rule.windowMs };

  // Jika window waktu sudah lewat, reset counter
  if (now > record.resetTime) {
    record.count = 0;
    record.resetTime = now + rule.windowMs;
  }

  record.count += 1;
  tracker.set(key, record);

  const resetInSeconds = Math.max(1, Math.ceil((record.resetTime - now) / 1000));
  const remaining = Math.max(0, rule.limit - record.count);

  if (record.count > rule.limit) {
    return {
      allowed: false,
      remaining: 0,
      resetInSeconds,
      message: rule.message,
    };
  }

  return {
    allowed: true,
    remaining,
    resetInSeconds,
    message: "",
  };
}

/**
 * Reset counter jika aksi berhasil (contoh: user berhasil login dengan password benar)
 */
export function resetRateLimit(key) {
  tracker.delete(key);
}
