import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/session";
import { resolveDocumentUrl } from "@/lib/supabase/storage";

/**
 * GET /api/admin/kyc
 * Ambil antrean pengajuan KYC untuk Administrator dengan signed URL dokumen privat
 */
export async function GET(req) {
  try {
    const adminAuth = await requireAdmin(req);
    if (adminAuth.error) return adminAuth.error;

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "pending_review";

    const where = {};
    if (status === "all") {
      where.OR = [
        { idCardUrl: { not: null } },
        { idNumber: { not: null } },
        { verificationStatus: { in: ["pending_review", "verified", "rejected"] } },
      ];
    } else {
      where.verificationStatus = status;
    }

    const pendingKycUsers = await prisma.profile.findMany({
      where,
      select: {
        id: true,
        fullName: true,
        email: true,
        phoneNumber: true,
        campusName: true,
        accountRole: true,
        isPartner: true,
        partnerBusinessName: true,
        verificationStatus: true,
        idNumber: true,
        idCardUrl: true,
        selfieUrl: true,
        verificationNotes: true,
        avatarUrl: true,
        skills: true,
        payoutBank: true,
        payoutAccountNumber: true,
        payoutAccountHolder: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: "desc" },
    });

    // Buat signed URL sementara (15 menit) untuk setiap dokumen privat agar admin bisa melihatnya
    const resolvedUsers = await Promise.all(
      pendingKycUsers.map(async (u) => {
        const [viewableKtpUrl, viewableSelfieUrl] = await Promise.all([
          resolveDocumentUrl(u.idCardUrl, 900),
          resolveDocumentUrl(u.selfieUrl, 900),
        ]);
        return {
          ...u,
          idCardViewUrl: viewableKtpUrl,
          selfieViewUrl: viewableSelfieUrl,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: resolvedUsers,
    });
  } catch (err) {
    console.error("[GET /api/admin/kyc error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Gagal mengambil antrean KYC." },
      { status: 500 }
    );
  }
}
