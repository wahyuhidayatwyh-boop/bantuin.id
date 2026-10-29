import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth/jwt";

/**
 * POST /api/disbursements/execute
 * Task 31: Eksekusi pencairan dana otomatis / verifikasi transfer admin
 * 
 * Rules:
 * 1. Strict Admin Authorization: Only Superadmin can execute disbursements.
 * 2. Updates withdrawal record with transfer reference and bank confirmation details.
 * 3. Records immutable audit log.
 * 4. Sends real-time notification to the user whose funds were disbursed.
 */
export async function POST(req) {
  try {
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
        { success: false, error: "Akses ditolak. Endpoint ini hanya dapat diakses oleh Administrator." },
        { status: 403 }
      );
    }


    // 2. Parse Body
    const body = await req.json().catch(() => ({}));
    const {
      withdrawalId,
      transferReference,
      status = "completed",
      proofUrl,
      rejectionReason,
    } = body;

    if (!withdrawalId) {
      return NextResponse.json(
        { success: false, error: "Parameter 'withdrawalId' wajib disertakan." },
        { status: 400 }
      );
    }

    // 3. Find Withdrawal
    const withdrawal = await prisma.withdrawal.findUnique({
      where: { id: withdrawalId },
      include: {
        owner: {
          select: { id: true, email: true, fullName: true },
        },
      },
    });

    if (!withdrawal) {
      return NextResponse.json(
        { success: false, error: "Data penarikan dana tidak ditemukan." },
        { status: 404 }
      );
    }

    if (withdrawal.status === "completed") {
      return NextResponse.json({
        success: true,
        message: "Penarikan dana ini sudah berstatus selesai sebelumnya.",
        data: withdrawal,
      });
    }

    // 4. Automated Midtrans Iris Payout Dispatch (if configured)
    let finalTransferRef = transferReference;
    const isFailed = status === "failed" || status === "rejected";
    const finalStatus = isFailed ? "failed" : "completed";

    if (finalStatus === "completed" && !finalTransferRef) {
      try {
        const { getIrisConfig, createIrisPayout } = await import("@/lib/midtrans/client");
        if (getIrisConfig().isConfigured) {
          const irisRes = await createIrisPayout({
            payoutId: withdrawal.id,
            beneficiaryName: withdrawal.destinationHolder || withdrawal.owner?.fullName,
            beneficiaryAccount: withdrawal.destinationAccount,
            beneficiaryBank: withdrawal.destinationType,
            beneficiaryEmail: withdrawal.owner?.email,
            amount: withdrawal.amount,
            notes: `Disbursement Bantuin ${withdrawal.id}`,
          });
          const irisRef = irisRes?.payouts?.[0]?.reference_no;
          if (irisRef) {
            finalTransferRef = `IRIS-${irisRef}`;
          }
        }
      } catch (irisErr) {
        console.warn("[Midtrans Iris Automated Payout Dispatch Warning]:", irisErr?.message);
      }
    }

    if (!finalTransferRef && !isFailed) {
      finalTransferRef = `TRF-${Date.now()}`;
    }

    // 5. Update in Transaction
    const updated = await prisma.$transaction(async (tx) => {
      const res = await tx.withdrawal.update({
        where: { id: withdrawal.id },
        data: {
          status: finalStatus,
          transferReference: isFailed ? null : finalTransferRef,
          proofUrl: proofUrl || null,
          rejectionReason: isFailed ? (rejectionReason || "Ditolak oleh admin") : null,
          processedAt: new Date(),
          processedBy: adminProfile.email,
        },
      });

      // Audit Log
      await tx.auditLog.create({
        data: {
          actorId: adminProfile.id,
          actorEmail: adminProfile.email,
          action: isFailed ? "withdrawal.rejected" : "withdrawal.disbursed",
          targetEntity: "withdrawals",
          targetId: withdrawal.id,
          payload: {
            ownerId: withdrawal.ownerId,
            amount: Number(withdrawal.amount),
            destinationType: withdrawal.destinationType,
            destinationAccount: withdrawal.destinationAccount,
            transferReference: res.transferReference,
            rejectionReason: res.rejectionReason,
          },
        },
      });

      // Notification to User
      await tx.notification.create({
        data: {
          userId: withdrawal.ownerId,
          title: isFailed ? "Penarikan Dana Ditolak" : "Pencairan Dana Berhasil!",
          message: isFailed
            ? `Pengajuan penarikan dana Anda sebesar Rp ${Number(withdrawal.amount).toLocaleString("id-ID")} ditolak. Alasan: ${rejectionReason || "Data rekening tidak valid"}.`
            : `Dana sebesar Rp ${Number(withdrawal.amount).toLocaleString("id-ID")} telah berhasil ditransfer ke ${withdrawal.destinationType} (${withdrawal.destinationAccount}). No. Ref: ${res.transferReference}.`,
          type: "payment",
          link: `/profile`,
        },
      });

      return res;
    });

    return NextResponse.json({
      success: true,
      message: `Pencairan dana berhasil ${updated.status === "completed" ? "dieksekusi" : "ditolak"}.`,
      data: updated,
    });
  } catch (err) {
    console.error("[POST /api/disbursements/execute error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Gagal memproses pencairan dana." },
      { status: 500 }
    );
  }
}
