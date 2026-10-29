import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateTokens, generateActionToken, verifyActionToken } from "@/lib/auth/jwt";
import { normalizePublicRole, buildUserPayload, suspendedResponse } from "@/lib/auth/session";
import { supabaseAdmin, supabase } from "@/lib/supabase/client";

export async function POST(req) {
  try {
    const body = await req.json();
    const {
      email: rawEmail,
      fullName,
      avatarUrl,
      role: rawRole = "user",
      supabaseToken,
      googleAuthToken,
      mode = "login",
    } = body;

    // 0. Rate Limiter Guard: Cegah flood auth request
    const { getClientIp, checkRateLimit, RATE_LIMIT_RULES } = await import("@/lib/security/rateLimiter");
    const clientIp = getClientIp(req);
    const ipLimit = checkRateLimit(`google_auth:ip:${clientIp}`, RATE_LIMIT_RULES.GOOGLE_AUTH);
    if (!ipLimit.allowed) {
      return NextResponse.json(
        {
          error: ipLimit.message,
          retryAfter: ipLimit.resetInSeconds,
        },
        { status: 429, headers: { "Retry-After": String(ipLimit.resetInSeconds) } }
      );
    }

    // Jika mode === "check", hanya memeriksa keberadaan akun tanpa menerbitkan token/sesi
    if (mode === "check") {
      if (!rawEmail || typeof rawEmail !== "string") {
        return NextResponse.json({ error: "Email wajib disertakan." }, { status: 400 });
      }
      const checkEmail = rawEmail.trim().toLowerCase();
      const existing = await prisma.profile.findUnique({
        where: { email: checkEmail },
        select: { id: true },
      });
      return NextResponse.json({
        exists: Boolean(existing),
        email: checkEmail,
      });
    }

    // SEC-01: Wajib verifikasi identitas OAuth di server (Supabase token atau token aksi OAuth bertanda tangan server)
    let verifiedEmail = null;
    let verifiedName = fullName;
    let verifiedAvatar = avatarUrl;

    if (supabaseToken && typeof supabaseToken === "string") {
      try {
        const client = supabaseAdmin || supabase;
        const { data: userData, error: verifyErr } = await client.auth.getUser(supabaseToken);
        if (!verifyErr && userData?.user?.email) {
          verifiedEmail = userData.user.email.trim().toLowerCase();
          verifiedName =
            userData.user.user_metadata?.full_name ||
            userData.user.user_metadata?.name ||
            verifiedName;
          verifiedAvatar =
            userData.user.user_metadata?.avatar_url ||
            userData.user.user_metadata?.picture ||
            verifiedAvatar;
        }
      } catch (err) {
        console.warn("[Google Auth]: Verifikasi Supabase token gagal:", err?.message || err);
      }
    }

    if (!verifiedEmail && googleAuthToken && typeof googleAuthToken === "string") {
      const decodedOAuth = verifyActionToken(googleAuthToken, "google_oauth_verified");
      if (decodedOAuth?.email) {
        verifiedEmail = String(decodedOAuth.email).trim().toLowerCase();
        verifiedName = decodedOAuth.fullName || verifiedName;
        verifiedAvatar = decodedOAuth.avatarUrl || verifiedAvatar;
      }
    }

    if (!verifiedEmail) {
      return NextResponse.json(
        {
          code: "INVALID_OAUTH_TOKEN",
          error: "Verifikasi token Google gagal atau tidak disertakan. Silakan masuk kembali melalui Google.",
        },
        { status: 401 }
      );
    }

    const normalizedEmail = verifiedEmail;
    const signedGoogleAuthToken = generateActionToken(
      {
        email: normalizedEmail,
        fullName: verifiedName || "",
        avatarUrl: verifiedAvatar || null,
      },
      "google_oauth_verified",
      "30m"
    );

    if (mode === "verify_oauth") {
      return NextResponse.json({
        success: true,
        email: normalizedEmail,
        fullName: verifiedName || "",
        avatarUrl: verifiedAvatar || null,
        googleAuthToken: signedGoogleAuthToken,
      });
    }

    const cleanRole = normalizePublicRole(rawRole);

    // 1. Cari profil di database
    let profile = await prisma.profile.findUnique({
      where: { email: normalizedEmail },
    });

    // Periksa tabel User legacy jika belum ada di Profile
    if (!profile) {
      const legacyUser = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      });

      if (legacyUser) {
        // SEC-08: Pisahkan verifikasi email dari verifikasi identitas KYC (verificationStatus selalu unverified untuk profil baru)
        profile = await prisma.profile.create({
          data: {
            email: legacyUser.email,
            fullName: legacyUser.name || verifiedName || "Pengguna Google",
            accountRole: cleanRole,
            authProvider: "google",
            verificationStatus: "unverified",
          },
        });
      }
    }

    // Jika akun belum terdaftar:
    if (!profile) {
      return NextResponse.json(
        {
          code: "ACCOUNT_NOT_FOUND",
          googleAuthToken: signedGoogleAuthToken,
          error: "Akun Google ini belum terdaftar di platform Bantuin. Silakan lakukan pendaftaran akun baru terlebih dahulu.",
        },
        { status: 404 }
      );
    }

    // Tolak jika akun ditangguhkan (suspended)
    if (profile.verificationStatus === "suspended") {
      return suspendedResponse(profile);
    }

    const isUnsplashDefault = !profile.avatarUrl || profile.avatarUrl.includes("images.unsplash.com");
    if (verifiedAvatar && isUnsplashDefault) {
      profile = await prisma.profile.update({
        where: { id: profile.id },
        data: {
          avatarUrl: verifiedAvatar,
          fullName: profile.fullName || verifiedName,
        },
      });
    } else if (isUnsplashDefault && !verifiedAvatar) {
      profile = await prisma.profile.update({
        where: { id: profile.id },
        data: {
          avatarUrl: null,
        },
      });
    }

    // 2. Sinkronkan ke tabel User
    try {
      await prisma.user.upsert({
        where: { email: normalizedEmail },
        update: {
          name: verifiedName || profile.fullName || "Pengguna Google",
          verified: true,
        },
        create: {
          email: normalizedEmail,
          name: verifiedName || "Pengguna Google",
          verified: true,
        },
      });
    } catch (userSyncErr) {
      console.warn("Sinkronisasi tabel User warning:", userSyncErr);
    }

    // 3. Susun user payload standar
    const userPayload = buildUserPayload(profile);

    // 4. Generate JWT Access Token & Refresh Token
    const tokens = generateTokens(userPayload);

    const response = NextResponse.json({
      success: true,
      message: "Login Google berhasil.",
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
    console.error("Google Auth Error:", error);
    return NextResponse.json(
      { error: error.message || "Terjadi kesalahan saat otentikasi Google." },
      { status: 500 }
    );
  }
}
