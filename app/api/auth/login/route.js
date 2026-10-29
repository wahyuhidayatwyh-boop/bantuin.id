import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { generateTokens } from "@/lib/auth/jwt";

export async function POST(req) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !email.trim()) {
      return NextResponse.json(
        { error: "Alamat email wajib diisi." },
        { status: 400 }
      );
    }

    if (!password) {
      return NextResponse.json(
        { error: "Kata sandi wajib diisi." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // 0. Anti-Brute Force & Rate Limiter Guard
    const { getClientIp, checkRateLimit, resetRateLimit, RATE_LIMIT_RULES } = await import("@/lib/security/rateLimiter");
    const clientIp = getClientIp(req);

    const ipLimit = checkRateLimit(`login:ip:${clientIp}`, RATE_LIMIT_RULES.LOGIN);
    if (!ipLimit.allowed) {
      return NextResponse.json(
        {
          error: ipLimit.message,
          retryAfter: ipLimit.resetInSeconds,
        },
        { status: 429, headers: { "Retry-After": String(ipLimit.resetInSeconds) } }
      );
    }

    const emailLimit = checkRateLimit(`login:email:${normalizedEmail}`, RATE_LIMIT_RULES.LOGIN);
    if (!emailLimit.allowed) {
      return NextResponse.json(
        {
          error: `Terlalu banyak percobaan masuk untuk akun ${normalizedEmail}. Demi perlindungan akun, silakan tunggu ${Math.ceil(emailLimit.resetInSeconds / 60)} menit lagi.`,
          retryAfter: emailLimit.resetInSeconds,
        },
        { status: 429, headers: { "Retry-After": String(emailLimit.resetInSeconds) } }
      );
    }

    // 1. Cari profil di database berdasarkan email
    let profile = await prisma.profile.findUnique({
      where: { email: normalizedEmail },
    });

    // Jika belum ada di Profile, periksa di model User
    if (!profile) {
      const user = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      });

      if (user) {
        // Auto-create profile jika user ada di tabel user
        profile = await prisma.profile.create({
          data: {
            email: user.email,
            fullName: user.name || "Pengguna",
            password: user.password,
            accountRole: "user",
          },
        });
      }
    }

    if (!profile) {
      return NextResponse.json(
        { error: "Akun dengan email ini belum terdaftar. Silakan daftar akun baru." },
        { status: 404 }
      );
    }

    // 2. Cek apakah akun ditangguhkan (suspended)
    if (profile.verificationStatus === "suspended") {
      const { suspendedResponse } = await import("@/lib/auth/session");
      return suspendedResponse(profile);
    }

    // 3. Verifikasi kata sandi (Bcrypt) - Wajib memiliki password hash (SEC-01 hardening)
    if (!profile.password) {
      return NextResponse.json(
        {
          error:
            "Akun ini terdaftar melalui Google OAuth dan belum memiliki kata sandi. Silakan masuk menggunakan tombol Login Google.",
        },
        { status: 401 }
      );
    }

    let isMatch = false;
    if (profile.password.startsWith("$2a$") || profile.password.startsWith("$2b$")) {
      isMatch = await bcrypt.compare(password, profile.password);
    } else {
      // Fallback untuk legacy record lalu otomatis upgrade ke bcrypt
      isMatch = profile.password === password;
      if (isMatch) {
        const upgradedHash = await bcrypt.hash(password, 10);
        await prisma.profile.update({
          where: { id: profile.id },
          data: { password: upgradedHash },
        });
      }
    }

    if (!isMatch) {
      return NextResponse.json(
        {
          error: `Kata sandi salah. Sisa percobaan: ${emailLimit.remaining} sebelum akun dikunci sementara.`,
        },
        { status: 401 }
      );
    }

    // Login Sukses: Reset counter percobaan gagal untuk email dan IP ini
    resetRateLimit(`login:email:${normalizedEmail}`);
    resetRateLimit(`login:ip:${clientIp}`);

    // 4. Update waktu login terakhir
    try {
      await prisma.profile.update({
        where: { id: profile.id },
        data: { updatedAt: new Date() },
      });
    } catch {}

    // 5. Susun payload user untuk sesi secara konsisten
    const { buildUserPayload } = await import("@/lib/auth/session");
    const userPayload = buildUserPayload(profile);

    // 6. Generate JWT Access Token & Refresh Token
    const tokens = generateTokens(userPayload);

    const response = NextResponse.json({
      success: true,
      message: "Login berhasil.",
      user: userPayload,
      ...tokens,
      token: tokens.accessToken, // Backward compatibility
    });

    response.cookies.set("bantuin_auth_token", tokens.accessToken, {
      path: "/",
      maxAge: 7 * 86400,
      sameSite: "lax",
    });

    return response;
  } catch (error) {
    console.error("Login Error:", error);
    return NextResponse.json(
      { error: error.message || "Terjadi kesalahan pada server saat proses login." },
      { status: 500 }
    );
  }
}
