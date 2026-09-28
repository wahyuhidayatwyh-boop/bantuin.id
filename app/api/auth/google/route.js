import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
          avatarUrl: avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80",
          accountRole: role,
          authProvider: "google",
          verificationStatus: "verified",
        },
      });
    }

    const token = `session-google-${profile.id}-${Date.now()}`;
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
      avatarUrl: profile.avatarUrl,
      verificationStatus: profile.verificationStatus || "verified",
      authProvider: "google",
      ratingAvg: Number(profile.ratingAvg) || 5.0,
      completedHelpsCount: profile.completedHelpsCount || 0,
      createdAt: profile.createdAt,
    };

    return NextResponse.json({
      success: true,
      message: "Login Google berhasil.",
      user: userPayload,
      token,
    });
  } catch (error) {
    console.error("Google Auth Error:", error);
    return NextResponse.json(
      { error: error.message || "Terjadi kesalahan saat otentikasi Google." },
      { status: 500 }
    );
  }
}
