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

    // 2. Verifikasi kata sandi
    if (profile.password) {
      let isMatch = false;
      // Periksa jika password adalah bcrypt hash
      if (profile.password.startsWith("$2a$") || profile.password.startsWith("$2b$")) {
        isMatch = await bcrypt.compare(password, profile.password);
      } else {
        // Plain text fallback untuk akun demo
        isMatch = profile.password === password;
      }

      if (!isMatch) {
        return NextResponse.json(
          { error: "Kata sandi yang Anda masukkan salah." },
          { status: 401 }
        );
      }
    }

    // 3. Update waktu login terakhir
    try {
      await prisma.profile.update({
        where: { id: profile.id },
        data: { updatedAt: new Date() },
      });
    } catch {}

    // 4. Susun payload user untuk sesi
    const userPayload = {
      id: profile.id,
      email: profile.email,
      fullName: profile.fullName,
      phone: profile.phoneNumber,
      phoneNumber: profile.phoneNumber,
      role: profile.accountRole || "user",
      isPartner: profile.isPartner || false,
      isAdmin: profile.isAdmin || false,
      storeName: profile.partnerBusinessName || "",
      campusName: profile.campusName || "Universitas Indonesia",
      address: profile.partnerAddress || profile.campusName || "",
      avatarUrl: profile.avatarUrl && !profile.avatarUrl.includes("images.unsplash.com") ? profile.avatarUrl : null,
      verificationStatus: profile.verificationStatus || "unverified",
      authProvider: profile.authProvider || "local",
      ratingAvg: Number(profile.ratingAvg) || 5.0,
      completedHelpsCount: profile.completedHelpsCount || 0,
      reliabilityScore: profile.reliabilityScore || 100,
      createdAt: profile.createdAt,
    };

    // 5. Generate JWT Access Token & Refresh Token
    const tokens = generateTokens(userPayload);

    return NextResponse.json({
      success: true,
      message: "Login berhasil.",
      user: userPayload,
      ...tokens,
      token: tokens.accessToken, // Backward compatibility
    });
  } catch (error) {
    console.error("Login Error:", error);
    return NextResponse.json(
      { error: error.message || "Terjadi kesalahan pada server saat proses login." },
      { status: 500 }
    );
  }
}
