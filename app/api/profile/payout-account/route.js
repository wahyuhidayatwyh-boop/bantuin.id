import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth/jwt";

/**
 * PUT /api/profile/payout-account
 * Update data rekening pencairan saldo (Bank & E-Wallet)
 */
export async function PUT(req) {
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
    const { payoutBank, payoutAccountNumber, payoutAccountHolder } = body;

    if (!payoutBank || !payoutAccountNumber) {
      return NextResponse.json(
        { success: false, error: "Nama Bank / E-Wallet dan Nomor Rekening wajib diisi." },
        { status: 400 }
      );
    }

    const updatedProfile = await prisma.profile.update({
      where: { id: userProfile.id },
      data: {
        payoutBank: payoutBank.trim(),
        payoutAccountNumber: payoutAccountNumber.trim(),
        payoutAccountHolder: (payoutAccountHolder || "").trim().toUpperCase(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Data rekening pencairan saldo berhasil diperbarui.",
      data: {
        id: updatedProfile.id,
        email: updatedProfile.email,
        fullName: updatedProfile.fullName || "",
        phoneNumber: updatedProfile.phoneNumber || "",
        avatarUrl: updatedProfile.avatarUrl || null,
        accountRole: updatedProfile.accountRole || "user",
        isPartner: updatedProfile.isPartner || false,
        isAdmin: updatedProfile.isAdmin || false,
        partnerBusinessName: updatedProfile.partnerBusinessName || "",
        campusName: updatedProfile.campusName || "",
        verificationStatus: updatedProfile.verificationStatus || "unverified",
        idNumber: updatedProfile.idNumber || "",
        idCardUrl: updatedProfile.idCardUrl || null,
        selfieUrl: updatedProfile.selfieUrl || null,
        payoutBank: updatedProfile.payoutBank || "",
        payoutAccountNumber: updatedProfile.payoutAccountNumber || "",
        payoutAccountHolder: updatedProfile.payoutAccountHolder || "",
        bankInfo: {
          bankName: updatedProfile.payoutBank || "",
          accountNumber: updatedProfile.payoutAccountNumber || "",
          accountHolder: updatedProfile.payoutAccountHolder || "",
        },
      },
    });
  } catch (error) {
    console.error("PUT /api/profile/payout-account Error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal memperbarui rekening pencairan saldo." },
      { status: 500 }
    );
  }
}
