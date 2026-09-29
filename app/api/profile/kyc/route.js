import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth/jwt";

/**
 * POST /api/profile/kyc
 * Pengajuan verifikasi identitas (Upload KTP & NIK)
 */
export async function POST(req) {
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
        { success: false, error: "Profil pengguna tidak ditemukan." },
        { status: 404 }
      );
    }

    const body = await req.json();
    const { idNumber, idCardUrl, selfieUrl } = body;

    if (!idNumber || !idCardUrl) {
      return NextResponse.json(
        { success: false, error: "Nomor KTP (NIK) dan Foto KTP wajib disertakan." },
        { status: 400 }
      );
    }

    const updatedProfile = await prisma.profile.update({
      where: { id: userProfile.id },
      data: {
        idNumber: idNumber.trim(),
        idCardUrl: idCardUrl.trim(),
        selfieUrl: selfieUrl ? selfieUrl.trim() : null,
        verificationStatus: "verified", // Verifikasi otomatis untuk alur demo / kyc terverifikasi
      },
    });

    return NextResponse.json({
      success: true,
      message: "Pengajuan verifikasi KYC berhasil dikirim.",
      data: {
        id: updatedProfile.id,
        email: updatedProfile.email,
        fullName: updatedProfile.fullName,
        idNumber: updatedProfile.idNumber,
        idCardUrl: updatedProfile.idCardUrl,
        selfieUrl: updatedProfile.selfieUrl,
        verificationStatus: updatedProfile.verificationStatus,
      },
    });
  } catch (error) {
    console.error("POST /api/profile/kyc Error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal mengajukan verifikasi identitas KYC." },
      { status: 500 }
    );
  }
}
