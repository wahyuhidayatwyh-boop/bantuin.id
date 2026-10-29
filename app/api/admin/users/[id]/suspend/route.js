import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/session";

/**
 * PATCH /api/admin/users/[id]/suspend
 * Task 98: Penangguhan atau blokir akun pengguna (suspend / ban user)
 */
export async function PATCH(req, { params }) {
  try {
    const { id: targetUserId } = await params;

    const adminCheck = await requireAdmin(req);
    if (!adminCheck.authorized) {
      return adminCheck.response;
    }
    const adminProfile = adminCheck.profile;

    if (adminProfile.id === targetUserId) {
      return NextResponse.json(
        { success: false, error: "Anda tidak dapat menangguhkan akun Anda sendiri." },
        { status: 400 }
      );
    }

    const targetUser = await prisma.profile.findUnique({
      where: { id: targetUserId },
    });

    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: "Pengguna tidak ditemukan." },
        { status: 404 }
      );
    }

    if (targetUser.isAdmin) {
      return NextResponse.json(
        { success: false, error: "Akun Administrator tidak dapat ditangguhkan." },
        { status: 400 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { isSuspended = true, reason = "Pelanggaran pedoman komunitas Bantuin" } = body;

    const newStatus = isSuspended
      ? "suspended"
      : (targetUser.idCardUrl ? "verified" : "unverified");

    const updated = await prisma.$transaction(async (tx) => {
      const res = await tx.profile.update({
        where: { id: targetUserId },
        data: {
          verificationStatus: newStatus,
          verificationNotes: isSuspended ? reason : "Pemulihan akun oleh Admin",
        },
      });

      // Audit Log
      await tx.auditLog.create({
        data: {
          actorId: adminProfile.id,
          actorEmail: adminProfile.email,
          action: isSuspended ? "user.suspended" : "user.unsuspended",
          targetEntity: "profiles",
          targetId: targetUserId,
          payload: { reason, previousStatus: targetUser.verificationStatus },
        },
      });

      // User notification
      try {
        await tx.notification.create({
          data: {
            userId: targetUserId,
            title: isSuspended ? "Akun Anda Ditangguhkan" : "Akun Anda Telah Diaktifkan Kembali",
            message: isSuspended
              ? `Akun Anda telah ditangguhkan oleh Administrator Bantuin. Alasan: ${reason}. Hubungi admin untuk informasi lebih lanjut.`
              : "Akun Anda telah dipulihkan dan dapat digunakan kembali secara normal.",
            type: "verification",
            link: "/profile",
          },
        });
      } catch {}

      return res;
    });

    return NextResponse.json({
      success: true,
      message: `Akun ${updated.fullName} berhasil ${isSuspended ? "ditangguhkan (suspended)" : "diaktifkan kembali"}.`,
      data: {
        id: updated.id,
        verificationStatus: updated.verificationStatus,
      },
    });
  } catch (err) {
    console.error("[PATCH /api/admin/users/[id]/suspend error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Gagal menangguhkan akun pengguna." },
      { status: 500 }
    );
  }
}
