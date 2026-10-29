import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth/jwt";

/**
 * PATCH /api/admin/orders/[id]/freeze
 * Task 99: Pembekuan sementara transaksi mencurigakan (freeze order)
 */
export async function PATCH(req, { params }) {
  try {
    const { id } = await params;

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
        { success: false, error: "Akses ditolak. Hanya Administrator yang dapat membekukan transaksi." },
        { status: 403 }
      );
    }

    const orderRoom = await prisma.orderRoom.findFirst({
      where: {
        OR: [{ id }, { requestId: id }],
      },
    });

    if (!orderRoom) {
      return NextResponse.json(
        { success: false, error: "Bilik transaksi tidak ditemukan." },
        { status: 404 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { reason = "Transaksi dibekukan sementara untuk investigasi kepatuhan dan keamanan." } = body;

    const updated = await prisma.$transaction(async (tx) => {
      const res = await tx.orderRoom.update({
        where: { id: orderRoom.id },
        data: {
          orderStatus: "disputed",
          disputeReason: reason.trim(),
          disputeOpenedBy: adminProfile.id,
        },
      });

      // Audit Log
      await tx.auditLog.create({
        data: {
          actorId: adminProfile.id,
          actorEmail: adminProfile.email,
          action: "order.frozen",
          targetEntity: "order_rooms",
          targetId: orderRoom.id,
          payload: { reason },
        },
      });

      // Notify Requester & Helper
      await tx.notification.createMany({
        data: [
          {
            userId: orderRoom.requesterId,
            title: "Transaksi Dibekukan oleh Admin",
            message: `Bilik transaksi telah dibekukan sementara oleh Admin untuk verifikasi keamanan. Alasan: ${reason}`,
            type: "order",
            link: `/chat?room=${orderRoom.id}`,
          },
          {
            userId: orderRoom.helperId,
            title: "Transaksi Dibekukan oleh Admin",
            message: `Bilik transaksi telah dibekukan sementara oleh Admin untuk verifikasi keamanan. Alasan: ${reason}`,
            type: "order",
            link: `/chat?room=${orderRoom.id}`,
          },
        ],
      });

      return res;
    });

    return NextResponse.json({
      success: true,
      message: "Transaksi berhasil dibekukan.",
      data: updated,
    });
  } catch (err) {
    console.error("[PATCH /api/admin/orders/[id]/freeze error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Gagal membekukan transaksi." },
      { status: 500 }
    );
  }
}
