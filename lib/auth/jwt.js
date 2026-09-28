import jwt from "jsonwebtoken";

const ACCESS_SECRET = process.env.JWT_SECRET || "bantuin_jwt_access_secret_super_secure_key_2026_id";
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "bantuin_jwt_refresh_secret_super_secure_key_2026_id";
const ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || "7d";
const REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || "30d";

/**
 * Membuat sepasang JWT Access Token dan Refresh Token
 * @param {Object} payload Data identitas pengguna (id, email, role, dsb.)
 * @returns {{ accessToken: string, refreshToken: string, expiresIn: string }}
 */
export function generateTokens(payload) {
  const tokenPayload = {
    id: payload.id,
    email: payload.email,
    role: payload.role || payload.accountRole || "user",
    fullName: payload.fullName || payload.name || "",
  };

  const accessToken = jwt.sign(tokenPayload, ACCESS_SECRET, {
    expiresIn: ACCESS_EXPIRES_IN,
  });

  const refreshToken = jwt.sign(
    {
      id: payload.id,
      email: payload.email,
      type: "refresh",
    },
    REFRESH_SECRET,
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
 * Memverifikasi Access Token
 * @param {string} token
 * @returns {Object|null} Decoded token data
 */
export function verifyAccessToken(token) {
  try {
    return jwt.verify(token, ACCESS_SECRET);
  } catch (err) {
    return null;
  }
}

/**
 * Memverifikasi Refresh Token
 * @param {string} token
 * @returns {Object|null} Decoded token data
 */
export function verifyRefreshToken(token) {
  try {
    return jwt.verify(token, REFRESH_SECRET);
  } catch (err) {
    return null;
  }
}
