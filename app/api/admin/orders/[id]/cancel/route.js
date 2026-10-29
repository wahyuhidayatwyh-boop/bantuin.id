import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth/jwt";

async function verifyAdminAuth(req) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { error: "Akses ditolak. Token tidak disediakan.", status: 401 };
  }
  const token = authHeader.substring(7).trim();
  const decoded = verifyAccessToken(token);
  if (!decoded || (!decoded.id && !decoded.email)) {
    return { error: "Sesi tidak valid atau telah berakhir.", status: 401 };
  }

  const profile = await prisma.profile.findFirst({
    where: {
      OR: [
        ...(decoded.id ? [{ id: decoded.id }] : []),
        ...(decoded.email ? [{ email: decoded.email.toLowerCase() }] : []),
      ],
    },
  });

  if (!profile || !profile.isAdmin) {
    return { error: "Akses ditolak. Hanya Administrator yang dapat membatalkan paksa pesanan.", status: 403 };
  }

  return { profile };
}

/**
 * POST /api/admin/orders/[id]/cancel
 * Task 100: Pembatalan paksa order oleh Admin & pengembalian escrow (force cancel)
 */
export async function POST(req, { params }) {
  try {
    const { id } = await params;
    const authResult = await verifyAdminAuth(req);
    if (authResult.error) {
      return NextResponse.json({ success: false, error: authResult.error }, { status: authResult.status });
    }
    const admin = authResult.profile;

    const body = await req.json().catch(() => ({}));
    const { reason = "Dibatalkan secara paksa oleh Administrator atas pelanggaran aturan atau sengketa tidak terselesaikan." } = body;

    const orderRoom = await prisma.orderRoom.findFirst({
      where: {
        OR: [{ id }, { requestId: id }],
      },
      include: {
        request: true,
        requester: { select: { id: true, fullName: true, email: true } },
        helper: { select: { id: true, fullName: true, email: true } },
      },
    });

    if (!orderRoom) {
      return NextResponse.json(
        { success: false, error: "Bilik transaksi tidak ditemukan." },
        { status: 404 }
      );
    }

    if (orderRoom.orderStatus === "cancelled") {
      return NextResponse.json(
        { success: false, error: "Pesanan ini sudah dibatalkan sebelumnya." },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Update OrderRoom status
      const updatedOrder = await tx.orderRoom.update({
        where: { id: orderRoom.id },
        data: {
          orderStatus: "cancelled",
          disputeReason: `[FORCE CANCEL ADMIN] ${reason.trim()}`,
          paymentStatus: orderRoom.paymentStatus === "PAID" ? "REFUNDED" : "CANCELLED",
        },
      });

      // 2. Update Request status
      if (orderRoom.requestId) {
        await tx.request.update({
          where: { id: orderRoom.requestId },
          data: {
            status: "cancelled",
            cancellationReason: `Dibatalkan paksa oleh Admin: ${reason.trim()}`,
          },
        });
      }

      // 3. Record AuditLog
      await tx.auditLog.create({
        data: {
          actorId: admin.id,
          actorEmail: admin.email,
          action: "order.force_cancelled",
          targetEntity: "order_rooms",
          targetId: orderRoom.id,
          payload: {
            orderRoomId: orderRoom.id,
            requestId: orderRoom.requestId,
            reason: reason.trim(),
            lockedAmount: Number(orderRoom.lockedAmount),
            previousOrderStatus: orderRoom.orderStatus,
            previousPaymentStatus: orderRoom.paymentStatus,
          },
        },
      });

      // 4. Send Notifications
      await tx.notification.createMany({
        data: [
          {
            userId: orderRoom.requesterId,
            title: "Pesanan Dibatalkan oleh Admin (Escrow Dikembalikan)",
            message: `Pesanan '${orderRoom.request?.title || "Bantuan"}' telah dibatalkan paksa oleh Admin. Alasan: ${reason}. Dana escrow senilai Rp ${Number(orderRoom.lockedAmount).toLocaleString("id-ID")} dikembalikan ke saldo dompet Anda.`,
            type: "order",
            link: `/aktivitas`,
          },
          {
            userId: orderRoom.helperId,
            title: "Pesanan Dibatalkan oleh Admin",
            message: `Pesanan '${orderRoom.request?.title || "Bantuan"}' telah dibatalkan paksa oleh Admin. Alasan: ${reason}. Bilik transaksi telah ditutup.`,
            type: "order",
            link: `/aktivitas`,
          },
        ],
      });

      return updatedOrder;
    });

    return NextResponse.json({
      success: true,
      message: "Pesanan berhasil dibatalkan secara paksa oleh Admin dan dana escrow dikembalikan.",
      data: result,
    });
  } catch (error) {
    console.error("POST /api/admin/orders/[id]/cancel Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Gagal membatalkan paksa pesanan." },
      { status: 500 }
    );
  }
}
