import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth/jwt";

/**
 * PATCH /api/profile/update
 * Update data profil, bio, domisili, dan foto profil
 */
export async function PATCH(req) {
  try {
    const authHeader = req.headers.get("authorization");
    let token = null;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7).trim();
    }

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Akses ditolak. Token otentikasi tidak ditemukan." },
        { status: 401 }
      );
    }

    const decoded = verifyAccessToken(token);
    if (!decoded || (!decoded.id && !decoded.email)) {
      return NextResponse.json(
        { success: false, error: "Sesi tidak valid atau telah kedaluwarsa." },
        { status: 401 }
      );
    }

    const userProfile = await prisma.profile.findFirst({
      where: {
        OR: [
          ...(decoded.id ? [{ id: decoded.id }] : []),
          ...(decoded.email ? [{ email: decoded.email.toLowerCase() }] : []),
        ],
      },
    });

    if (!userProfile) {
      return NextResponse.json(
        { success: false, error: "Profil pengguna tidak ditemukan di database." },
        { status: 404 }
      );
    }

    const body = await req.json();
    const {
      fullName,
      phoneNumber,
      campusName,
      bio,
      avatarUrl,
    } = body;

    const updateData = {};

    if (typeof fullName === "string" && fullName.trim()) {
      updateData.fullName = fullName.trim();
    }
    if (typeof phoneNumber === "string") {
      updateData.phoneNumber = phoneNumber.trim();
    }
    if (typeof campusName === "string") {
      updateData.campusName = campusName.trim();
    }
    if (typeof bio === "string") {
      updateData.bio = bio.trim();
    }
    if (typeof avatarUrl === "string" && avatarUrl.trim()) {
      updateData.avatarUrl = avatarUrl.trim();
    }

    const updatedProfile = await prisma.profile.update({
      where: { id: userProfile.id },
      data: updateData,
    });

    // Sinkronkan ke tabel User jika nama berubah
    if (updateData.fullName) {
      try {
        await prisma.user.updateMany({
          where: { email: userProfile.email },
          data: { name: updateData.fullName },
        });
      } catch {}
    }

    const userPayload = {
      id: updatedProfile.id,
      email: updatedProfile.email,
      fullName: updatedProfile.fullName,
      phone: updatedProfile.phoneNumber,
      phoneNumber: updatedProfile.phoneNumber,
      role: updatedProfile.accountRole || "user",
      isPartner: updatedProfile.isPartner || false,
      isAdmin: updatedProfile.isAdmin || false,
      storeName: updatedProfile.partnerBusinessName || "",
      campusName: updatedProfile.campusName,
      address: updatedProfile.partnerAddress || updatedProfile.campusName,
      avatarUrl: updatedProfile.avatarUrl,
      bio: updatedProfile.bio,
      verificationStatus: updatedProfile.verificationStatus || "unverified",
      createdAt: updatedProfile.createdAt,
      updatedAt: updatedProfile.updatedAt,
    };

    return NextResponse.json({
      success: true,
      message: "Profil pengguna berhasil diperbarui.",
      data: userPayload,
      user: userPayload,
    });
  } catch (error) {
    console.error("PATCH /api/profile/update Error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal memperbarui profil pengguna." },
      { status: 500 }
    );
  }
}
