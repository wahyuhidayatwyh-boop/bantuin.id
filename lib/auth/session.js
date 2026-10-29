/**
 * lib/auth/session.js
 * Satu sumber kebenaran untuk identitas akun di sisi server:
 * - resolveRole / normalizePublicRole  : aturan role kanonikal
 * - buildUserPayload                   : bentuk data user yang dikirim ke frontend
 * - requireAuth / requireAdmin         : guard untuk API route
 *
 * CANONICAL ROLES: user | provider | partner | admin
 * Role "admin" TIDAK PERNAH boleh berasal dari input publik (register / OAuth).
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth/jwt";
import {
  CANONICAL_ROLES,
  PUBLIC_ROLES,
  normalizePublicRole,
  resolveRole,
  maskIdNumber,
} from "./roles.js";

/**
 * Membersihkan URL avatar jika null atau placeholder unsplash default
 */
export function cleanAvatar(url) {
  if (!url || typeof url !== "string") return null;
  if (url.includes("images.unsplash.com")) return null;
  return url;
}

export { CANONICAL_ROLES, PUBLIC_ROLES, normalizePublicRole, resolveRole, maskIdNumber };

/**
 * Bentuk payload user yang konsisten untuk semua endpoint auth.
 * `role` dan `accountRole` selalu bernilai sama.
 * Dokumen KYC mentah (NIK penuh, path KTP) tidak pernah dikirim ke frontend.
 */
export function buildUserPayload(profile) {
  const role = resolveRole(profile);
  return {
    id: profile.id,
    email: profile.email,
    fullName: profile.fullName || "",
    phone: profile.phoneNumber || "",
    phoneNumber: profile.phoneNumber || "",
    avatarUrl: cleanAvatar(profile.avatarUrl),
    bio: profile.bio || "",
    campusName: profile.campusName || "",
    address: profile.partnerAddress || profile.campusName || "",

    role,
    accountRole: role,
    isAdmin: Boolean(profile.isAdmin),
    isPartner: role === "partner" || Boolean(profile.isPartner),
    storeName: profile.partnerBusinessName || "",
    partnerBusinessName: profile.partnerBusinessName || "",
    brandTitle: profile.partnerBusinessName || "",
    partnerAddress: profile.partnerAddress || "",
    bannerUrl: profile.bannerUrl || null,
    coverBanner: profile.bannerUrl || null,
    portfolioPhotos: Array.isArray(profile.portfolioPhotos) ? profile.portfolioPhotos : [],
    packages: Array.isArray(profile.packages) ? profile.packages : [],
    skills: Array.isArray(profile.skills) ? profile.skills : [],

    verificationStatus: profile.verificationStatus || "unverified",
    verificationNotes: profile.verificationNotes || "",
    hasKycDocument: Boolean(profile.idCardUrl),
    hasSelfie: Boolean(profile.selfieUrl),
    idNumberMasked: maskIdNumber(profile.idNumber),

    payoutBank: profile.payoutBank || "",
    payoutAccountNumber: profile.payoutAccountNumber || "",
    payoutAccountHolder: profile.payoutAccountHolder || "",

    authProvider: profile.authProvider || (profile.password ? "local" : "google"),
    hasPassword: Boolean(profile.password),

    ratingAvg: Number(profile.ratingAvg) || 5.0,
    ratingCount: profile.ratingCount || 0,
    completedHelpsCount: profile.completedHelpsCount || 0,
    reliabilityScore: profile.reliabilityScore ?? 100,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
  };
}

export function extractBearerToken(req) {
  const header = req.headers.get("authorization") || "";
  if (header.startsWith("Bearer ")) {
    const token = header.substring(7).trim();
    if (token) return token;
  }

  // Fallback to cookie authentication
  try {
    if (req.cookies && typeof req.cookies.get === "function") {
      const cookieToken =
        req.cookies.get("bantuin_auth_token")?.value ||
        req.cookies.get("bantuin_token")?.value;
      if (cookieToken) return cookieToken.trim();
    }
    const cookieHeader = req.headers.get("cookie") || "";
    const match =
      cookieHeader.match(/bantuin_auth_token=([^;]+)/) ||
      cookieHeader.match(/bantuin_token=([^;]+)/);
    if (match?.[1]) {
      return decodeURIComponent(match[1]).trim();
    }
  } catch {}

  return null;
}

function errorResponse(status, error, extra = {}) {
  return NextResponse.json({ success: false, error, ...extra }, { status });
}

export function suspendedResponse(profile) {
  return errorResponse(
    403,
    `Akun Anda sedang ditangguhkan oleh Admin Bantuin.${
      profile?.verificationNotes ? ` Alasan: ${profile.verificationNotes}.` : ""
    } Hubungi admin untuk informasi lebih lanjut.`,
    { code: "ACCOUNT_SUSPENDED" }
  );
}

/**
 * Guard untuk API route yang membutuhkan login.
 * Mendukung kontrak ganda:
 * 1. if (auth.error) return auth.error; const profile = auth.profile;
 * 2. if (!auth.authorized) return auth.response; const profile = auth.profile;
 * @returns {Promise<{ profile?: object, error?: NextResponse, authorized: boolean, response?: NextResponse }>}
 */
export async function requireAuth(req, { allowSuspended = false } = {}) {
  const token = extractBearerToken(req);
  if (!token) {
    const errRes = errorResponse(401, "Akses ditolak. Silakan login terlebih dahulu.");
    return { error: errRes, errorResponse: errRes, authorized: false, response: errRes };
  }

  const decoded = verifyAccessToken(token);
  if (!decoded?.id) {
    const errRes = errorResponse(401, "Sesi tidak valid atau telah berakhir. Silakan login kembali.");
    return { error: errRes, errorResponse: errRes, authorized: false, response: errRes };
  }

  const profile = await prisma.profile.findUnique({ where: { id: decoded.id } });
  if (!profile) {
    const errRes = errorResponse(401, "Akun tidak ditemukan. Silakan login kembali.");
    return { error: errRes, errorResponse: errRes, authorized: false, response: errRes };
  }

  if (!allowSuspended && profile.verificationStatus === "suspended") {
    const errRes = suspendedResponse(profile);
    return { error: errRes, errorResponse: errRes, authorized: false, response: errRes };
  }

  return { profile, authorized: true, error: null, errorResponse: null };
}

/**
 * Helper opsional untuk route publik yang ingin memeriksa apakah request dikirim oleh user login / admin
 * tanpa menolak pengunjung anonim.
 */
export async function getAuthenticatedContext(req) {
  try {
    const auth = await requireAuth(req, { allowSuspended: false });
    if (!auth.authorized || !auth.profile) return null;
    return {
      profile: auth.profile,
      isAdmin: Boolean(auth.profile.isAdmin),
    };
  } catch {
    return null;
  }
}

/**
 * Guard untuk API route khusus Administrator (dicek dari kolom isAdmin di DB).
 */
export async function requireAdmin(req) {
  const auth = await requireAuth(req);
  if (!auth.authorized || auth.error) return auth;
  if (!auth.profile.isAdmin) {
    const errRes = errorResponse(403, "Akses ditolak. Halaman ini khusus Administrator.");
    return { error: errRes, errorResponse: errRes, authorized: false, response: errRes };
  }
  return { ...auth, authorized: true, error: null, errorResponse: null };
}

