import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyRefreshToken, generateTokens } from "@/lib/auth/jwt";

export async function POST(req) {
  try {
    const body = await req.json();
    const { refreshToken } = body;

    if (!refreshToken) {
      return NextResponse.json(
        { error: "Refresh token wajib disertakan." },
        { status: 400 }
      );
    }

    // 1. Verifikasi validity refresh token
    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded || decoded.type !== "refresh") {
      return NextResponse.json(
        { error: "Refresh token tidak valid atau telah kedaluwarsa. Silakan login kembali." },
        { status: 401 }
      );
    }

    // 2. Ambil profil user terbaru dari database
    const profile = await prisma.profile.findUnique({
      where: { email: decoded.email },
    });

    if (!profile) {
      return NextResponse.json(
        { error: "Akun pengguna tidak ditemukan." },
        { status: 404 }
      );
    }

    // 3. Susun data user
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
      avatarUrl: profile.avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80",
      verificationStatus: profile.verificationStatus || "unverified",
      authProvider: profile.authProvider || "local",
      ratingAvg: Number(profile.ratingAvg) || 5.0,
      completedHelpsCount: profile.completedHelpsCount || 0,
      reliabilityScore: profile.reliabilityScore || 100,
      createdAt: profile.createdAt,
    };

    // 4. Generate sepasang token baru (Access Token + Refresh Token)
    const tokens = generateTokens(userPayload);

    return NextResponse.json({
      success: true,
      message: "Token berhasil diperbarui.",
      ...tokens,
      token: tokens.accessToken, // Backward compatibility
      user: userPayload,
    });
  } catch (error) {
    console.error("Refresh Token Error:", error);
    return NextResponse.json(
      { error: error.message || "Gagal memperbarui token otentikasi." },
      { status: 500 }
    );
  }
}
