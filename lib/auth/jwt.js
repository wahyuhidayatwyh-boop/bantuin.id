import jwt from "jsonwebtoken";
import crypto from "crypto";

const INSECURE_PLACEHOLDERS = new Set([
  "your-jwt-access-secret-key",
  "your-jwt-refresh-secret-key",
  "your-jwt-secret",
  "changeme",
  "secret",
  "password",
  "12345678",
  "default_secret",
]);

function isStrongConfiguredSecret(val) {
  if (!val || typeof val !== "string") return false;
  const trimmed = val.trim();
  if (trimmed.length < 24) return false;
  if (INSECURE_PLACEHOLDERS.has(trimmed.toLowerCase())) return false;
  return true;
}

function getEphemeralDevSecret(keyName) {
  if (!globalThis.__bantuin_ephemeral_jwt_secrets) {
    globalThis.__bantuin_ephemeral_jwt_secrets = {};
  }
  if (!globalThis.__bantuin_ephemeral_jwt_secrets[keyName]) {
    globalThis.__bantuin_ephemeral_jwt_secrets[keyName] = crypto.randomBytes(48).toString("hex");
  }
  return globalThis.__bantuin_ephemeral_jwt_secrets[keyName];
}

function getAccessSecret() {
  const envSecret = process.env.JWT_SECRET;
  if (isStrongConfiguredSecret(envSecret)) {
    return envSecret.trim();
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error("Konfigurasi keamanan kritis: JWT_SECRET belum diatur atau tidak memenuhi standar keamanan produksi.");
  }
  return getEphemeralDevSecret("access");
}

function getRefreshSecret() {
  const envSecret = process.env.JWT_REFRESH_SECRET;
  if (isStrongConfiguredSecret(envSecret)) {
    return envSecret.trim();
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error("Konfigurasi keamanan kritis: JWT_REFRESH_SECRET belum diatur atau tidak memenuhi standar keamanan produksi.");
  }
  return getEphemeralDevSecret("refresh");
}

const ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || "7d";
const REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || "30d";

/**
 * Membuat sepasang JWT Access Token dan Refresh Token
 * @param {Object} payload Data identitas pengguna (id, email, role, dsb.)
 * @returns {{ accessToken: string, refreshToken: string, expiresIn: string }}
 */
export function generateTokens(payload) {
  const accessSecret = getAccessSecret();
  const refreshSecret = getRefreshSecret();

  const tokenPayload = {
    id: payload.id,
    email: payload.email,
    role: payload.role || payload.accountRole || "user",
    fullName: payload.fullName || payload.name || "",
  };

  const accessToken = jwt.sign(tokenPayload, accessSecret, {
    expiresIn: ACCESS_EXPIRES_IN,
  });

  const refreshToken = jwt.sign(
    {
      id: payload.id,
      email: payload.email,
      type: "refresh",
    },
    refreshSecret,
    {
      expiresIn: REFRESH_EXPIRES_IN,
    }
  );

  return {
    accessToken,
    refreshToken,
    expiresIn: ACCESS_EXPIRES_IN,
  };
}

/**
 * Memverifikasi Access Token.
 * Hanya token yang DITANDATANGANI dengan ACCESS_SECRET milik Bantuin yang diterima.
 * (Tidak ada fallback decode tanpa verifikasi tanda tangan — itu membuka celah token palsu.)
 * @param {string} token
 * @returns {Object|null} Decoded token data
 */
export function verifyAccessToken(token) {
  if (!token || typeof token !== "string") return null;
  try {
    const accessSecret = getAccessSecret();
    const decoded = jwt.verify(token, accessSecret);
    if (!decoded || typeof decoded !== "object" || decoded.type === "refresh" || decoded.type === "action") {
      return null;
    }
    return decoded;
  } catch {
    return null;
  }
}

/**
 * Memverifikasi Refresh Token (wajib ditandatangani REFRESH_SECRET dan bertipe "refresh").
 * @param {string} token
 * @returns {Object|null} Decoded token data
 */
export function verifyRefreshToken(token) {
  if (!token || typeof token !== "string") return null;
  try {
    const refreshSecret = getRefreshSecret();
    const decoded = jwt.verify(token, refreshSecret);
    if (!decoded || typeof decoded !== "object" || decoded.type !== "refresh") return null;
    return decoded;
  } catch {
    return null;
  }
}

/**
 * Membuat token aksi khusus berjangka pendek (misal: verifikasi email atau registrasi OAuth terverifikasi)
 * @param {Object} payload
 * @param {string} purpose
 * @param {string} [expiresIn="30m"]
 * @returns {string}
 */
export function generateActionToken(payload, purpose, expiresIn = "30m") {
  const accessSecret = getAccessSecret();
  return jwt.sign(
    {
      ...payload,
      type: "action",
      purpose,
    },
    accessSecret,
    { expiresIn }
  );
}

/**
 * Memverifikasi token aksi khusus berdasarkan purpose
 * @param {string} token
 * @param {string} expectedPurpose
 * @returns {Object|null}
 */
export function verifyActionToken(token, expectedPurpose) {
  if (!token || typeof token !== "string" || !expectedPurpose) return null;
  try {
    const accessSecret = getAccessSecret();
    const decoded = jwt.verify(token, accessSecret);
    if (!decoded || typeof decoded !== "object" || decoded.type !== "action" || decoded.purpose !== expectedPurpose) {
      return null;
    }
    return decoded;
  } catch {
    return null;
  }
}
