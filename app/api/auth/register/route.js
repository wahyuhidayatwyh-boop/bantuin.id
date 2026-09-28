import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { generateTokens } from "@/lib/auth/jwt";

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
    } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Alamat email wajib diisi." },
        { status: 400 }
      );
    }

    if (authProvider === "local" && (!password || password.length < 6)) {
      return NextResponse.json(
        { error: "Kata sandi minimal 6 karakter." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // 1. Cek apakah email sudah terdaftar
    const existingProfile = await prisma.profile.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingProfile) {
      return NextResponse.json(
        { error: "Email sudah terdaftar. Silakan masuk atau gunakan email lain." },
        { status: 409 }
      );
    }

    // 2. Hash password jika pendaftaran lokal
    let hashedPassword = null;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    // 3. Normalisasi Role
    const effectiveRole = (accountType || role || "user").toLowerCase();
    let accountRole = "user";
    let isPartner = false;
    let isAdmin = false;

    if (effectiveRole === "admin") {
      accountRole = "admin";
      isAdmin = true;
    } else if (effectiveRole === "provider" || effectiveRole === "jasa") {
      accountRole = "provider";
    } else if (effectiveRole === "mitra" || effectiveRole === "partner" || effectiveRole === "sewa") {
      accountRole = "partner";
      isPartner = true;
    }

    // 4. Susun lokasi domisili/kampus
    const fullLocation = [district, city, province].filter(Boolean).join(", ") || address || "Indonesia";

    // 5. Simpan ke tabel Profile
    const profile = await prisma.profile.create({
      data: {
        email: normalizedEmail,
        fullName: fullName || "Pengguna Baru",
        phoneNumber: phone || null,
        password: hashedPassword,
        authProvider,
        accountRole,
        isPartner,
        isAdmin,
        partnerBusinessName: isPartner ? storeName || null : null,
        partnerAddress: isPartner ? address || fullLocation : null,
        campusName: fullLocation,
        idNumber: idNumber || null,
        idCardUrl: idCardUrl || null,
        payoutBank: bankInfo?.bankName || null,
        payoutAccountNumber: bankInfo?.accountNumber || null,
        payoutAccountHolder: bankInfo?.accountHolder || fullName || null,
        verificationStatus: verificationStatus === "verified" ? "verified" : (idCardUrl ? "pending_review" : "unverified"),
        avatarUrl:
          accountRole === "provider"
            ? "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80"
            : isPartner
            ? "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=400&q=80"
            : "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80",
      },
    });

    // 6. Sinkronkan juga ke model User jika diperlukan
    try {
      await prisma.user.upsert({
        where: { email: normalizedEmail },
        update: {
          name: fullName || "Pengguna Baru",
          verified: verificationStatus === "verified" || authProvider === "google",
        },
        create: {
          email: normalizedEmail,
          name: fullName || "Pengguna Baru",
          password: hashedPassword,
          verified: verificationStatus === "verified" || authProvider === "google",
        },
      });
    } catch {
      // Abaikan jika sudah ada
    }

    // 7. Format data user untuk frontend
    const userPayload = {
      id: profile.id,
      email: profile.email,
      fullName: profile.fullName,
      phone: profile.phoneNumber,
      phoneNumber: profile.phoneNumber,
      role: profile.accountRole,
      isPartner: profile.isPartner,
      isAdmin: profile.isAdmin,
      storeName: profile.partnerBusinessName,
      campusName: profile.campusName,
      address: profile.partnerAddress || profile.campusName,
      avatarUrl: profile.avatarUrl,
      verificationStatus: profile.verificationStatus,
      authProvider: profile.authProvider,
      ratingAvg: Number(profile.ratingAvg) || 5.0,
      completedHelpsCount: profile.completedHelpsCount || 0,
      createdAt: profile.createdAt,
    };

    // 8. Generate JWT Access Token & Refresh Token
    const tokens = generateTokens(userPayload);

    return NextResponse.json({
      success: true,
      message: "Pendaftaran akun berhasil.",
      user: userPayload,
      ...tokens,
      token: tokens.accessToken, // Backward compatibility
    });
  } catch (error) {
    console.error("Register Error:", error);
    return NextResponse.json(
      { error: error.message || "Terjadi kesalahan saat mendaftar akun." },
      { status: 500 }
    );
  }
}
