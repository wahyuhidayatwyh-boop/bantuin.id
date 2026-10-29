import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth/jwt";

/**
 * POST /api/admin/disputes/resolve
 * Task 42: Resolusi sengketa dan pembagian dana arbitrase oleh Admin
 * 
 * Rules:
 * 1. Strict Admin Authorization.
 * 2. Supported decisions:
 *    - 'payout_helper': Release escrow fully to helper.
 *    - 'refund_requester': Refund escrow fully to requester.
 *    - 'split': Divide escrow between requester and helper by helperSharePercentage.
 * 3. Records immutable AuditLog and sends notifications to both parties.
 */
export async function POST(req) {
  try {
    // 1. Auth check from header or cookie
    const authHeader = req.headers.get("authorization");
    let token = null;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7).trim();
    }
    if (!token) {
      const cookieHeader = req.headers.get("cookie") || "";
      const match = cookieHeader.match(/bantuin_auth_token=([^;]+)/) || cookieHeader.match(/bantuin_token=([^;]+)/);
      if (match) token = match[1];
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
        { success: false, error: "Akses ditolak. Hanya Administrator yang dapat menyelesaikan sengketa." },
        { status: 403 }
      );
    }

    // 2. Parse Body
    const body = await req.json().catch(() => ({}));
    const {
      reportId,
      orderRoomId,
      bookingId,
      decision = "payout_helper", // 'payout_helper' | 'refund_requester' | 'split' | 'resolved' | 'dismiss'
      helperSharePercentage = 50,
      adminNotes = "",
    } = body;

    // A. Resolve Report (Trust & Safety / Pelanggaran)
    if (reportId) {
      const report = await prisma.report.findUnique({
        where: { id: reportId },
        include: { targetRequest: true, targetUser: true },
      });

      if (!report) {
        return NextResponse.json(
          { success: false, error: "Laporan tidak ditemukan." },
          { status: 404 }
        );
      }

      const reportStatus = decision === "dismiss" ? "dismissed" : "resolved";

      const updatedReport = await prisma.$transaction(async (tx) => {
        const rep = await tx.report.update({
          where: { id: reportId },
          data: {
            status: reportStatus,
            adminNotes: adminNotes || `Diputuskan oleh Admin (${reportStatus})`,
            resolvedAt: new Date(),
            resolvedBy: adminProfile.id,
          },
        });

        // Audit Log
        await tx.auditLog.create({
          data: {
            actorId: adminProfile.id,
            actorEmail: adminProfile.email,
            action: "report.resolved",
            targetEntity: "reports",
            targetId: report.id,
            payload: {
              decision,
              reportStatus,
              adminNotes,
            },
          },
        });

        // If targetRequest exists and was disputed, restore or finalize it
        if (report.targetRequestId) {
          const newOrderStatus = decision === "refund_requester" || decision === "refund_customer" ? "cancelled" : "completed";
          await tx.orderRoom.updateMany({
            where: { requestId: report.targetRequestId },
            data: { orderStatus: newOrderStatus },
          });
        }

        // Notification to Reporter
        const notesSnippet = adminNotes?.trim() ? ` Catatan Admin: "${adminNotes.trim()}".` : "";
        await tx.notification.create({
          data: {
            userId: report.reporterId,
            title: "Laporan Anda Telah Ditinjau",
            message: `Laporan Anda mengenai ${report.category} telah selesai ditinjau oleh Tim Trust & Safety Bantuin. Status: ${reportStatus.toUpperCase()}.${notesSnippet}`,
            type: "report",
            link: "/jasa/dashboard?tab=disputes",
          },
        });

        return rep;
      });

      return NextResponse.json({
        success: true,
        message: "Laporan berhasil diselesaikan oleh Admin.",
        data: updatedReport,
      });
    }

    if (!orderRoomId && !bookingId) {
      return NextResponse.json(
        { success: false, error: "Parameter 'reportId', 'orderRoomId', atau 'bookingId' wajib disertakan." },
        { status: 400 }
      );
    }

    // A. Resolve OrderRoom Dispute
    if (orderRoomId) {
      const orderRoom = await prisma.orderRoom.findUnique({
        where: { id: orderRoomId },
        include: { request: true },
      });

      if (!orderRoom) {
        return NextResponse.json(
          { success: false, error: "Bilik transaksi tidak ditemukan." },
          { status: 404 }
        );
      }

      const totalLocked = Number(orderRoom.lockedAmount || 0);

      let finalHelperAmount = totalLocked;
      let finalRefundAmount = 0;

      if (decision === "refund_requester") {
        finalHelperAmount = 0;
        finalRefundAmount = totalLocked;
      } else if (decision === "split") {
        const pct = Math.min(100, Math.max(0, Number(helperSharePercentage)));
        finalHelperAmount = Math.round((totalLocked * pct) / 100);
        finalRefundAmount = totalLocked - finalHelperAmount;
      }

      const updated = await prisma.$transaction(async (tx) => {
        const res = await tx.orderRoom.update({
          where: { id: orderRoom.id },
          data: {
            orderStatus: decision === "refund_requester" ? "cancelled" : "completed",
            helperPayoutAmount: finalHelperAmount,
            completedAt: new Date(),
          },
        });

        // Sync associated Request status
        if (orderRoom.requestId) {
          await tx.request.update({
            where: { id: orderRoom.requestId },
            data: { status: decision === "refund_requester" ? "cancelled" : "completed" },
          });
        }

        // Audit Log
        await tx.auditLog.create({
          data: {
            actorId: adminProfile.id,
            actorEmail: adminProfile.email,
            action: "dispute.resolved",
            targetEntity: "order_rooms",
            targetId: orderRoom.id,
            payload: {
              decision,
              totalLocked,
              finalHelperAmount,
              finalRefundAmount,
              adminNotes,
            },
          },
        });

        // Notification to Requester
        await tx.notification.create({
          data: {
            userId: orderRoom.requesterId,
            title: "Resolusi Sengketa Transaksi Selesai",
            message: `Sengketa untuk '${orderRoom.request?.title || "Pesanan"}' telah diputuskan oleh Admin. Keputusan: ${decision}. ${finalRefundAmount > 0 ? `Pengembalian dana: Rp ${finalRefundAmount.toLocaleString("id-ID")}.` : ""}`,
            type: "report",
            link: `/activity`,
          },
        });

        // Notification to Helper
        await tx.notification.create({
          data: {
            userId: orderRoom.helperId,
            title: "Resolusi Sengketa Transaksi Selesai",
            message: `Sengketa untuk '${orderRoom.request?.title || "Pesanan"}' telah diputuskan oleh Admin. Payout saldo Anda: Rp ${finalHelperAmount.toLocaleString("id-ID")}.`,
            type: "report",
            link: `/activity`,
          },
        });

        return res;
      });

      return NextResponse.json({
        success: true,
        message: "Sengketa pesanan bantuan berhasil diselesaikan oleh Admin.",
        data: {
          decision,
          finalHelperAmount,
          finalRefundAmount,
          orderRoom: updated,
        },
      });
    }

    // B. Resolve RentalBooking Dispute
    if (bookingId) {
      const booking = await prisma.rentalBooking.findUnique({
        where: { id: bookingId },
        include: { rental: true },
      });

      if (!booking) {
        return NextResponse.json(
          { success: false, error: "Booking sewa tidak ditemukan." },
          { status: 404 }
        );
      }

      const totalDeposit = Number(booking.depositFee || 0);
      let depositRefund = totalDeposit;

      if (decision === "payout_helper") {
        depositRefund = 0; // Deposit diberikan ke pemilik sebagai ganti rugi
      }

      const updatedBooking = await prisma.rentalBooking.update({
        where: { id: bookingId },
        data: {
          bookingStatus: "verified_settled",
          depositRefundAmount: depositRefund,
          depositDeductionReason: adminNotes || `Arbitrase Admin: Keputusan ${decision}`,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Sengketa sewa barang berhasil diselesaikan oleh Admin.",
        data: updatedBooking,
      });
    }
  } catch (err) {
    console.error("[POST /api/admin/disputes/resolve error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Gagal menyelesaikan sengketa." },
      { status: 500 }
    );
  }
}
