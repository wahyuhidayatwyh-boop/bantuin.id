import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth/session";

/**
 * POST /api/withdrawals/request
 * Task 30: Pengajuan penarikan saldo dompet (Withdrawal Request)
 * 
 * Rules:
 * 1. Strict JWT Authentication via requireAuth.
 * 2. KYC Gate: verificationStatus MUST be 'verified'.
 * 3. Available Balance Validation:
 *    - Strictly checks that requested amount does not exceed verified available balance.
 *    - Minimum withdrawal limit: Rp 10.000.
 * 4. Prevents duplicate pending spam: Checks if user already has an active pending withdrawal.
 * 5. Stores bank/e-wallet payout destination.
 * 6. Logs audit trail and sends user notification.
 */
export async function POST(req) {
  try {
    // 1. Auth check
    const authCheck = await requireAuth(req);
    if (!authCheck.authorized) {
      return authCheck.response;
    }

    const userProfile = authCheck.profile;
    const userId = userProfile.id;

    // 2. KYC Verification Gate
    if (userProfile.verificationStatus !== "verified") {
      return NextResponse.json(
        {
          success: false,
          error: "Penarikan saldo diblokir. Akun Anda harus berstatus KYC Terverifikasi oleh Admin terlebih dahulu sebelum dapat mencairkan dana. Silakan lengkapi verifikasi identitas di menu Profil Anda.",
          kycRequired: true,
          verificationStatus: userProfile.verificationStatus,
        },
        { status: 403 }
      );
    }

    // 2. Parse Body
    const body = await req.json().catch(() => ({}));
    const {
      amount,
      destinationType = userProfile.payoutBank || "BCA",
      destinationAccount = userProfile.payoutAccountNumber,
      destinationHolder = userProfile.payoutAccountHolder || userProfile.fullName,
    } = body;

    const requestedAmount = Number(amount);
    if (isNaN(requestedAmount) || requestedAmount < 10000) {
      return NextResponse.json(
        { success: false, error: "Nominal penarikan minimal adalah Rp 10.000." },
        { status: 400 }
      );
    }

    if (!destinationAccount || !destinationHolder) {
      return NextResponse.json(
        {
          success: false,
          error: "Nomor rekening tujuan dan nama pemilik rekening wajib disertakan.",
        },
        { status: 400 }
      );
    }

    // 3. Atomic Balance Verification & Reservation inside Prisma Transaction with Row-Level Lock (SEC-04)
    const newWithdrawal = await prisma.$transaction(async (tx) => {
      // Acquire per-user row-level mutex lock on profiles to prevent concurrent double-withdrawal (Promise.all race)
      await tx.$queryRaw`SELECT id FROM profiles WHERE id = ${userId}::uuid FOR UPDATE`;

      // a. Check if user already has an active pending withdrawal
      const activePending = await tx.withdrawal.findFirst({
        where: {
          ownerId: userId,
          status: { in: ["pending", "processing"] },
        },
      });

      if (activePending) {
        throw new Error(
          "PENDING_EXISTS: Anda masih memiliki pengajuan penarikan dana yang sedang diproses. Harap tunggu hingga selesai sebelum mengajukan kembali."
        );
      }

      const targetOwnerType = body.ownerType || (userProfile.isPartner || userProfile.accountRole === "partner" ? "partner" : "provider");

      let totalEarned = 0;

      if (targetOwnerType === "partner") {
        // c. Rental earnings only for partner (must be PAID and verified_settled)
        const settledRentals = await tx.rentalBooking.findMany({
          where: {
            ownerId: userId,
            bookingStatus: "verified_settled",
            paymentStatus: "PAID",
          },
          select: { rentalFee: true },
        });

        for (const r of settledRentals) {
          totalEarned += Number(r.rentalFee || 0);
        }
      } else {
        // b. Order earnings for jasa provider (exclude rental companion OrderRooms to prevent 2x double counting)
        const completedOrders = await tx.orderRoom.findMany({
          where: {
            helperId: userId,
            orderStatus: "completed",
            paymentStatus: "PAID",
            request: {
              category: { not: "Sewa Alat & Kendaraan" },
              NOT: [
                { description: { contains: "[BOOKING_ID:" } },
                { description: { contains: "[RENTAL_ID:" } },
              ],
            },
          },
          select: { helperPayoutAmount: true, lockedAmount: true },
        });

        for (const o of completedOrders) {
          totalEarned += Number(o.helperPayoutAmount || o.lockedAmount || 0);
        }
      }

      // d. Deduct all existing non-rejected withdrawals for this specific role
      const withdrawals = await tx.withdrawal.findMany({
        where: {
          ownerId: userId,
          ownerType: targetOwnerType === "partner" ? "partner" : "provider",
          status: { in: ["pending", "approved", "processing", "completed"] },
        },
        select: { amount: true },
      });

      let totalDeductions = 0;
      for (const w of withdrawals) {
        totalDeductions += Number(w.amount || 0);
      }

      const availableBalance = Math.max(0, totalEarned - totalDeductions);

      if (requestedAmount > availableBalance) {
        throw new Error(
          `INSUFFICIENT_BALANCE: Saldo tidak mencukupi. Saldo tersedia Anda saat ini adalah Rp ${availableBalance.toLocaleString("id-ID")}.`
        );
      }

      // e. Create withdrawal record (automatically reserves requested amount)
      const withdrawal = await tx.withdrawal.create({
        data: {
          ownerId: userId,
          ownerName: userProfile.fullName,
          ownerType: body.ownerType || (userProfile.isPartner || userProfile.accountRole === "partner" ? "partner" : "provider"),
          amount: requestedAmount,
          destinationType: destinationType.toUpperCase(),
          destinationAccount: destinationAccount.trim(),
          destinationHolder: destinationHolder.trim(),
          status: "pending",
        },
      });

      // f. Save payout details to profile if not previously set
      if (!userProfile.payoutBank || !userProfile.payoutAccountNumber) {
        await tx.profile.update({
          where: { id: userId },
          data: {
            payoutBank: destinationType,
            payoutAccountNumber: destinationAccount.trim(),
            payoutAccountHolder: destinationHolder.trim(),
          },
        });
      }

      // g. Record AuditLog
      await tx.auditLog.create({
        data: {
          actorId: userId,
          actorEmail: userProfile.email,
          action: "withdrawal.requested",
          targetEntity: "withdrawals",
          targetId: withdrawal.id,
          payload: {
            amount: requestedAmount,
            destinationType,
            destinationAccount,
            remainingBalance: availableBalance - requestedAmount,
          },
        },
      });

      // h. User notification
      await tx.notification.create({
        data: {
          userId: userId,
          title: "Pengajuan Penarikan Saldo Dikirim",
          message: `Permohonan penarikan dana sebesar Rp ${requestedAmount.toLocaleString("id-ID")} ke ${destinationType} (${destinationAccount}) berhasil dikirim dan sedang ditinjau admin.`,
          type: "payment",
          link: `/profile`,
        },
      });

      return {
        withdrawal,
        remainingBalance: availableBalance - requestedAmount,
      };
    });

    return NextResponse.json({
      success: true,
      message: "Pengajuan penarikan dana berhasil dibuat. Tim kami akan memproses transfer dalam 1x24 jam kerja.",
      data: newWithdrawal,
    });
  } catch (err) {
    console.error("[POST /api/withdrawals/request error]:", err);
    const msg = err.message || "";
    if (msg.startsWith("PENDING_EXISTS:") || msg.startsWith("INSUFFICIENT_BALANCE:")) {
      return NextResponse.json(
        { success: false, error: msg.replace(/^[A-Z_]+:\s*/, "") },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: msg || "Gagal mengajukan penarikan dana." },
      { status: 500 }
    );
  }
}

