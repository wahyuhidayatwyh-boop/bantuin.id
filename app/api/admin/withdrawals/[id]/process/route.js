import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth/jwt";

/**
 * PATCH /api/admin/withdrawals/[id]/process
 * Task 93: Admin menyetujui / menolak pencairan saldo + input nomor referensi transfer
 * 
 * Rules:
 * 1. Strict Admin Authorization.
 * 2. Supported actions: 'approve' (siap transfer), 'complete' (dana berhasil ditransfer), 'reject' (ditolak).
 * 3. Records transferReference, proofUrl, rejectionReason, processedBy, processedAt.
 * 4. Records immutable AuditLog and sends user notification.
 */
export async function PATCH(req, { params }) {
  try {
    const { id } = await params;

    // 1. Auth check
    const authHeader = req.headers.get("authorization");
    let token = null;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7).trim();
    }

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Akses ditolak. Silakan login terlebih dahulu." },
        { status: 401 }
      );
    }

    const decoded = verifyAccessToken(token);
    if (!decoded || (!decoded.id && !decoded.email)) {
      return NextResponse.json(
        { success: false, error: "Sesi otentikasi tidak valid atau telah berakhir." },
        { status: 401 }
      );
    }

    const adminProfile = await prisma.profile.findFirst({
      where: {
        OR: [
          ...(decoded.id ? [{ id: decoded.id }] : []),
          ...(decoded.email ? [{ email: decoded.email.toLowerCase() }] : []),
        ],
      },
    });

    if (!adminProfile || !adminProfile.isAdmin) {
      return NextResponse.json(
        { success: false, error: "Akses ditolak. Hanya Administrator yang dapat memproses penarikan dana." },
        { status: 403 }
      );
    }


    // 2. Parse Body
    const body = await req.json().catch(() => ({}));
    const { action, transferReference, proofUrl, rejectionReason } = body;

    if (!action || !["approve", "complete", "reject"].includes(action)) {
      return NextResponse.json(
        { success: false, error: "Parameter 'action' wajib berupa 'approve', 'complete', atau 'reject'." },
        { status: 400 }
      );
    }

    // 3. Find Withdrawal
    const withdrawal = await prisma.withdrawal.findUnique({
      where: { id },
      include: {
        owner: {
          select: { id: true, email: true, fullName: true },
        },
      },
    });

    if (!withdrawal) {
      return NextResponse.json(
        { success: false, error: "Data permohonan penarikan dana tidak ditemukan." },
        { status: 404 }
      );
    }

    if (withdrawal.status === "completed") {
      return NextResponse.json({
        success: true,
        message: "Penarikan dana ini sudah selesai diproses.",
        data: withdrawal,
      });
    }

    // 4. Determine New Status
    let nextStatus = "pending";
    if (action === "approve") nextStatus = "approved";
    if (action === "complete") nextStatus = "completed";
    if (action === "reject") nextStatus = "failed";

    const ref = transferReference || (action === "complete" ? `TRF-BANTUIN-${Date.now()}` : null);

    // 5. Update in Transaction
    const updated = await prisma.$transaction(async (tx) => {
      const res = await tx.withdrawal.update({
        where: { id: withdrawal.id },
        data: {
          status: nextStatus,
          transferReference: ref || withdrawal.transferReference,
          proofUrl: proofUrl || withdrawal.proofUrl,
          rejectionReason: action === "reject" ? (rejectionReason || "Ditolak oleh admin") : null,
          processedAt: new Date(),
          processedBy: adminProfile.email,
        },
      });

      // Audit Log
      await tx.auditLog.create({
        data: {
          actorId: adminProfile.id,
          actorEmail: adminProfile.email,
          action: `withdrawal.${action}d`,
          targetEntity: "withdrawals",
          targetId: withdrawal.id,
          payload: {
            ownerId: withdrawal.ownerId,
            amount: Number(withdrawal.amount),
            action,
            transferReference: res.transferReference,
            rejectionReason: res.rejectionReason,
          },
        },
      });

      // Notification to Owner
      let notifTitle = "Pembaruan Status Penarikan Dana";
      let notifMessage = "";

      if (action === "complete") {
        notifTitle = "Pencairan Dana Berhasil!";
        notifMessage = `Dana penarikan sebesar Rp ${Number(withdrawal.amount).toLocaleString("id-ID")} telah dikirimkan ke rekening ${withdrawal.destinationType} (${withdrawal.destinationAccount}). No Ref: ${res.transferReference}.`;
      } else if (action === "approve") {
        notifTitle = "Penarikan Dana Disetujui";
        notifMessage = `Pengajuan penarikan dana sebesar Rp ${Number(withdrawal.amount).toLocaleString("id-ID")} telah disetujui dan sedang dalam antrean transfer bank.`;
      } else {
        notifTitle = "Penarikan Dana Ditolak";
        notifMessage = `Pengajuan penarikan dana Anda sebesar Rp ${Number(withdrawal.amount).toLocaleString("id-ID")} ditolak. Alasan: ${rejectionReason || "Data tidak sesuai"}. Saldo dikembalikan ke dompet.`;
      }

      await tx.notification.create({
        data: {
          userId: withdrawal.ownerId,
          title: notifTitle,
          message: notifMessage,
          type: "payment",
          link: `/profile`,
        },
      });

      return res;
    });

    return NextResponse.json({
      success: true,
      message: `Permohonan penarikan dana berhasil diperbarui ke status '${updated.status}'.`,
      data: updated,
    });
  } catch (err) {
    console.error("[PATCH /api/admin/withdrawals/[id]/process error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Gagal memproses penarikan dana." },
      { status: 500 }
    );
  }
}
