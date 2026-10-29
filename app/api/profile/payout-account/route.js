import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, maskIdNumber } from "@/lib/auth/session";

/**
 * PUT /api/profile/payout-account
 * Update data rekening pencairan saldo (Bank & E-Wallet)
 */
export async function PUT(req) {
  try {
    const auth = await requireAuth(req);
    if (auth.errorResponse) return auth.errorResponse;
    const userProfile = auth.profile;

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
        idNumber: maskIdNumber(updatedProfile.idNumber),
        hasIdCardUploaded: Boolean(updatedProfile.idCardUrl),
        hasSelfieUploaded: Boolean(updatedProfile.selfieUrl),
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
