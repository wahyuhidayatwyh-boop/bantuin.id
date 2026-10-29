import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { generateTokens, verifyAccessToken, verifyActionToken } from "@/lib/auth/jwt";
import { supabaseAdmin, supabase } from "@/lib/supabase/client";

export async function POST(req) {
  try {
    const body = await req.json();
    const {
      fullName,
      email,
      phone,
      password,
      role = "user",
      accountType,
      address,
      province,
      city,
      district,
      storeName,
      storeCategory,
      skills,
      idNumber,
      idCardUrl,
      bankInfo,
      verificationStatus,
      authProvider = "local",
      avatarUrl,
      supabaseToken,
      googleAuthToken,
    } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Alamat email wajib diisi." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check optional bearer token for logged-in user upgrade
    const authHeader = req.headers.get("authorization");
    let authenticatedUser = null;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      try {
        const token = authHeader.substring(7).trim();
        authenticatedUser = verifyAccessToken(token);
      } catch {}
    }

    // Verifikasi token OAuth Google jika metode pendaftaran melalui Google
    let verifiedGoogleEmail = null;
    if (supabaseToken && typeof supabaseToken === "string") {
      try {
        const client = supabaseAdmin || supabase;
        const { data: userData, error: verifyErr } = await client.auth.getUser(supabaseToken);
        if (!verifyErr && userData?.user?.email) {
          verifiedGoogleEmail = userData.user.email.trim().toLowerCase();
        }
      } catch {}
    }
    if (!verifiedGoogleEmail && googleAuthToken && typeof googleAuthToken === "string") {
      const decodedOAuth = verifyActionToken(googleAuthToken, "google_oauth_verified");
      if (decodedOAuth?.email) {
        verifiedGoogleEmail = String(decodedOAuth.email).trim().toLowerCase();
      }
    }

    const isVerifiedGoogleOwner = Boolean(
      verifiedGoogleEmail && verifiedGoogleEmail === normalizedEmail
    );

    const isTokenValidForEmail = Boolean(
      authenticatedUser &&
        authenticatedUser.email?.toLowerCase() === normalizedEmail
    );

    if (!isTokenValidForEmail && !isVerifiedGoogleOwner) {
      if (authProvider === "google") {
        return NextResponse.json(
          {
            code: "INVALID_OAUTH_TOKEN",
            error: "Sesi verifikasi Google tidak valid atau telah kedaluwarsa. Silakan ulangi proses daftar dengan Google.",
          },
          { status: 401 }
        );
      }
      if (!password || password.length < 6) {
        return NextResponse.json(
          { error: "Kata sandi minimal 6 karakter." },
          { status: 400 }
        );
      }
    }

    // 0. Rate Limiter Guard: Cegah bot mass registration
    const { getClientIp, checkRateLimit, RATE_LIMIT_RULES } = await import("@/lib/security/rateLimiter");
    const clientIp = getClientIp(req);
    const ipLimit = checkRateLimit(`register:ip:${clientIp}`, RATE_LIMIT_RULES.REGISTER);
    if (!ipLimit.allowed) {
      return NextResponse.json(
        {
          error: ipLimit.message,
          retryAfter: ipLimit.resetInSeconds,
        },
        { status: 429, headers: { "Retry-After": String(ipLimit.resetInSeconds) } }
      );
    }

    // 1. Cek apakah email sudah terdaftar
    const existingProfile = await prisma.profile.findUnique({
      where: { email: normalizedEmail },
    });

    // 2. Hash password jika pendaftaran lokal
    let hashedPassword = null;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    // 3. Normalisasi Role publik (admin tidak pernah diizinkan dari form pendaftaran publik)
    const { normalizePublicRole, buildUserPayload, suspendedResponse } = await import("@/lib/auth/session");
    const { isPersistableDocumentRef, normalizeToStorageRef } = await import("@/lib/supabase/storage");

    const requestedRole = (accountType || role || "user").toLowerCase();
    if (requestedRole === "admin" || requestedRole === "super_admin" || requestedRole === "superadmin") {
      return NextResponse.json(
        { error: "Pendaftaran akun Administrator tidak diizinkan melalui form publik." },
        { status: 403 }
      );
    }

    const accountRole = normalizePublicRole(requestedRole);
    const isPartner = accountRole === "partner";

    // 4. Susun lokasi domisili/kampus
    const fullLocation = [district, city, province].filter(Boolean).join(", ") || address || "Indonesia";

    // 5. Validasi dokumen KYC (hanya simpan jika merupakan referensi dokumen permanen, bukan blob: lokal)
    const validIdCardRef = isPersistableDocumentRef(idCardUrl) ? normalizeToStorageRef(idCardUrl) : null;
    const initialKycStatus = validIdCardRef ? "pending_review" : "unverified";

    // 6. Simpan atau perbarui tabel Profile
    let profile;
    if (existingProfile) {
      if (existingProfile.verificationStatus === "suspended") {
        return suspendedResponse(existingProfile);
      }

      // SEC-01: Hanya pemilik sah yang terbukti secara kriptografis yang dapat memperbarui akun:
      // 1) Token OAuth Google yang terverifikasi untuk email ini
      // 2) Sesi login aktif (Bearer token valid yang cocok dengan akun ini)
      // 3) Kata sandi lokal yang valid
      const isTokenOwner = Boolean(
        authenticatedUser &&
          (authenticatedUser.id === existingProfile.id ||
            authenticatedUser.email?.toLowerCase() === existingProfile.email.toLowerCase())
      );

      let isPasswordOwner = false;
      if (password && existingProfile.password) {
        try {
          isPasswordOwner = await bcrypt.compare(password, existingProfile.password);
        } catch {}
      }

      if (isVerifiedGoogleOwner || isTokenOwner || isPasswordOwner) {
        profile = await prisma.profile.update({
          where: { id: existingProfile.id },
          data: {
            fullName: fullName || existingProfile.fullName,
            phoneNumber: phone || existingProfile.phoneNumber,
            accountRole: isPartner ? "partner" : (accountRole || existingProfile.accountRole),
            isPartner: isPartner ? true : existingProfile.isPartner,
            partnerBusinessName: isPartner ? (storeName || existingProfile.partnerBusinessName) : existingProfile.partnerBusinessName,
            partnerAddress: isPartner ? (address || fullLocation || existingProfile.partnerAddress) : existingProfile.partnerAddress,
            campusName: fullLocation || existingProfile.campusName,
            idNumber: idNumber ? String(idNumber).trim() : existingProfile.idNumber,
            idCardUrl: validIdCardRef || existingProfile.idCardUrl,
            payoutBank: bankInfo?.bankName || existingProfile.payoutBank,
            payoutAccountNumber: bankInfo?.accountNumber || existingProfile.payoutAccountNumber,
            payoutAccountHolder: bankInfo?.accountHolder || fullName || existingProfile.payoutAccountHolder,
            verificationStatus:
              existingProfile.verificationStatus === "verified"
                ? "verified"
                : validIdCardRef
                ? "pending_review"
                : existingProfile.verificationStatus,
            avatarUrl: avatarUrl && !avatarUrl.includes("images.unsplash.com") ? avatarUrl : existingProfile.avatarUrl,
          },
        });
      } else {
        return NextResponse.json(
          { error: "Email sudah terdaftar. Silakan masuk atau gunakan email lain." },
          { status: 409 }
        );
      }
    } else {
      profile = await prisma.profile.create({
        data: {
          email: normalizedEmail,
          fullName: fullName || "Pengguna Baru",
          phoneNumber: phone || null,
          password: hashedPassword,
          authProvider: isVerifiedGoogleOwner ? "google" : "local",
          accountRole,
          isPartner,
          isAdmin: false,
          partnerBusinessName: isPartner ? storeName || null : null,
          partnerAddress: isPartner ? address || fullLocation : null,
          campusName: fullLocation,
          idNumber: idNumber ? String(idNumber).trim() : null,
          idCardUrl: validIdCardRef,
          payoutBank: bankInfo?.bankName || null,
          payoutAccountNumber: bankInfo?.accountNumber || null,
          payoutAccountHolder: bankInfo?.accountHolder || fullName || null,
          verificationStatus: initialKycStatus,
          avatarUrl: avatarUrl && !avatarUrl.includes("images.unsplash.com") ? avatarUrl : null,
        },
      });
    }

    // 7. Sinkronkan juga ke model User jika diperlukan
    try {
      await prisma.user.upsert({
        where: { email: normalizedEmail },
        update: {
          name: fullName || "Pengguna Baru",
          verified: isVerifiedGoogleOwner ? true : false,
        },
        create: {
          email: normalizedEmail,
          name: fullName || "Pengguna Baru",
          password: hashedPassword,
          verified: isVerifiedGoogleOwner ? true : false,
        },
      });
    } catch {
      // Abaikan jika sudah ada
    }

    // 8. Format data user untuk frontend secara konsisten
    const userPayload = buildUserPayload(profile);

    // 9. Generate JWT Access Token & Refresh Token
    const tokens = generateTokens(userPayload);

    const response = NextResponse.json({
      success: true,
      message: "Pendaftaran akun berhasil.",
      user: userPayload,
      ...tokens,
      token: tokens.accessToken, // Backward compatibility
    });

    response.cookies.set("bantuin_auth_token", tokens.accessToken, {
      path: "/",
      maxAge: 7 * 86400,
      sameSite: "lax",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    });

    return response;
  } catch (error) {
    console.error("Register Error:", error);
    return NextResponse.json(
      { error: error.message || "Terjadi kesalahan saat mendaftar akun." },
      { status: 500 }
    );
  }
}
