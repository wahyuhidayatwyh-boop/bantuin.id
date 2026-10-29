import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/session";

/**
 * POST /api/admin/kyc/reject
 * Task 91: Tolak verifikasi identitas (KYC) dengan catatan alasan penolakan
 */
export async function POST(req) {
  try {
    const adminCheck = await requireAdmin(req);
    if (!adminCheck.authorized) {
      return adminCheck.response;
    }
    const adminProfile = adminCheck.profile;

    const body = await req.json().catch(() => ({}));
    const { userId, reason } = body;

    if (!userId || !reason) {
      return NextResponse.json(
        { success: false, error: "Parameter 'userId' dan 'reason' (alasan penolakan) wajib disertakan." },
        { status: 400 }
      );
    }

    const targetUser = await prisma.profile.findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: "Pengguna tidak ditemukan." },
        { status: 404 }
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      const res = await tx.profile.update({
        where: { id: userId },
        data: {
          verificationStatus: "rejected",
          verificationNotes: reason.trim(),
        },
      });

      // Audit Log
      await tx.auditLog.create({
        data: {
          actorId: adminProfile.id,
          actorEmail: adminProfile.email,
          action: "kyc.rejected",
          targetEntity: "profiles",
          targetId: userId,
          payload: { reason: reason.trim() },
        },
      });

      // Notification to user
      await tx.notification.create({
        data: {
          userId,
          title: "Pengajuan Verifikasi Identitas Ditolak",
          message: `Pengajuan verifikasi identitas (KYC) Anda belum dapat disetujui. Alasan: ${reason.trim()}. Silakan unggah ulang dokumen yang jelas melalui menu Profil.`,
          type: "verification",
          link: `/profile`,
        },
      });

      return res;
    });

    return NextResponse.json({
      success: true,
      message: `Pengajuan KYC ${updated.fullName} berhasil ditolak.`,
      data: {
        id: updated.id,
        verificationStatus: updated.verificationStatus,
        verificationNotes: updated.verificationNotes,
      },
    });
  } catch (err) {
    console.error("[POST /api/admin/kyc/reject error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Gagal menolak KYC." },
      { status: 500 }
    );
  }
}
