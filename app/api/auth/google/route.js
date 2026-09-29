import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateTokens } from "@/lib/auth/jwt";

export async function POST(req) {
  try {
    const body = await req.json();
    const { email, fullName, avatarUrl, role = "user" } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Email akun Google wajib disertakan." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // 1. Cari atau buat profile
    let profile = await prisma.profile.findUnique({
      where: { email: normalizedEmail },
    });

    if (!profile) {
      profile = await prisma.profile.create({
        data: {
          email: normalizedEmail,
          fullName: fullName || "Pengguna Google",
          avatarUrl: avatarUrl || null,
          accountRole: role,
          authProvider: "google",
          verificationStatus: "unverified",
        },
      });
    } else {
      const isUnsplashDefault = !profile.avatarUrl || profile.avatarUrl.includes("images.unsplash.com");
      if (avatarUrl && isUnsplashDefault) {
        profile = await prisma.profile.update({
          where: { id: profile.id },
          data: {
            avatarUrl: avatarUrl,
            fullName: profile.fullName || fullName,
          },
        });
      } else if (isUnsplashDefault && !avatarUrl) {
        profile = await prisma.profile.update({
          where: { id: profile.id },
          data: {
            avatarUrl: null,
          },
        });
      }
    }

    // 2. Sinkronkan ke tabel User
    try {
      await prisma.user.upsert({
        where: { email: normalizedEmail },
        update: {
          name: fullName || profile.fullName || "Pengguna Google",
          verified: profile.verificationStatus === "verified",
        },
        create: {
          email: normalizedEmail,
          name: fullName || "Pengguna Google",
          verified: false,
        },
      });
    } catch (userSyncErr) {
      console.warn("Sinkronisasi tabel User warning:", userSyncErr);
    }

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
      campusName: profile.campusName || "Bekasi, Jawa Barat",
      address: profile.partnerAddress || profile.campusName || "Bekasi, Jawa Barat",
      avatarUrl: profile.avatarUrl,
      verificationStatus: profile.verificationStatus || "unverified",
      authProvider: "google",
      ratingAvg: Number(profile.ratingAvg) || 5.0,
      completedHelpsCount: profile.completedHelpsCount || 0,
      createdAt: profile.createdAt,
    };

    // 3. Generate JWT Access Token & Refresh Token
    const tokens = generateTokens(userPayload);

    return NextResponse.json({
      success: true,
      message: "Login Google berhasil.",
      user: userPayload,
      ...tokens,
      token: tokens.accessToken, // Backward compatibility
    });
  } catch (error) {
    console.error("Google Auth Error:", error);
    return NextResponse.json(
      { error: error.message || "Terjadi kesalahan saat otentikasi Google." },
      { status: 500 }
    );
  }
}
