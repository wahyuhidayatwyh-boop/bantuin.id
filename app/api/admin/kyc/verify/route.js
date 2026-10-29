import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/session";

/**
 * POST /api/admin/kyc/verify
 * Task 41: Verifikasi KYC pengguna oleh Admin
 */
export async function POST(req) {
  try {
    const adminCheck = await requireAdmin(req);
    if (!adminCheck.authorized) {
      return adminCheck.response;
    }
    const adminProfile = adminCheck.profile;

    const body = await req.json().catch(() => ({}));
    const { userId, notes } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Parameter 'userId' wajib disertakan." },
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

    const roleToKeep = targetUser.accountRole || "user";

    const updated = await prisma.$transaction(async (tx) => {
      const res = await tx.profile.update({
        where: { id: userId },
        data: {
          verificationStatus: "verified",
          verificationNotes: notes ? notes.trim() : "Terverifikasi oleh Admin",
          accountRole: roleToKeep,
        },
      });

      // Audit Log
      await tx.auditLog.create({
        data: {
          actorId: adminProfile.id,
          actorEmail: adminProfile.email,
          action: "kyc.verified",
          targetEntity: "profiles",
          targetId: userId,
          payload: { verificationNotes: notes },
        },
      });

      // Notification to user
      await tx.notification.create({
        data: {
          userId,
          title: "Verifikasi Identitas (KYC) Berhasil!",
          message: "Selamat! Dokumen identitas Anda telah diverifikasi resmi oleh Admin Bantuin. Anda kini memiliki lencana 'Terverifikasi'.",
          type: "verification",
          link: `/profile`,
        },
      });

      return res;
    });

    return NextResponse.json({
      success: true,
      message: `Pengguna ${updated.fullName} berhasil diverifikasi.`,
      data: {
        id: updated.id,
        verificationStatus: updated.verificationStatus,
      },
    });
  } catch (err) {
    console.error("[POST /api/admin/kyc/verify error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Gagal memverifikasi KYC." },
      { status: 500 }
    );
  }
}
