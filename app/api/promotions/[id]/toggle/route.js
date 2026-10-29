import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth/jwt";

/**
 * POST /api/promotions/[id]/toggle
 * Mengubah status promosi:
 * - Bagi Penyedia/Mitra: Menjeda ('paused') atau Melanjutkan ('active') promosi aktif
 * - Bagi Admin: Mengaktifkan ('active') atau Menonaktifkan ('cancelled') promosi
 */
export async function POST(req, { params }) {
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

    const userProfile = await prisma.profile.findFirst({
      where: {
        OR: [
          ...(decoded.id ? [{ id: decoded.id }] : []),
          ...(decoded.email ? [{ email: decoded.email.toLowerCase() }] : []),
        ],
      },
    });

    if (!userProfile) {
      return NextResponse.json(
        { success: false, error: "Profil akun tidak ditemukan." },
        { status: 404 }
      );
    }

    // Cari data promosi di database (Mendukung ID UUID, midtransOrderId, maupun targetId)
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    let promo = null;
    if (isUuid) {
      promo = await prisma.promotion.findUnique({
        where: { id },
        include: {
          service: true,
          rental: true,
          package: true,
        },
      });
    }

    if (!promo) {
      promo = await prisma.promotion.findFirst({
        where: {
          OR: [
            { midtransOrderId: id },
            { targetId: id },
            ...(promo ? [] : []),
          ],
        },
        include: {
          service: true,
          rental: true,
          package: true,
        },
      });
    }

    if (!promo) {
      return NextResponse.json(
        { success: false, error: "Data promosi tidak ditemukan." },
        { status: 404 }
      );
    }

    const isAdmin = Boolean(userProfile.isAdmin);
    const isOwner = promo.ownerId === userProfile.id;

    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        { success: false, error: "Anda tidak memiliki hak akses untuk mengubah promosi ini." },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const requestedAction = body.action; // 'pause' | 'resume' | 'toggle'
    const now = new Date();

    if ((body.status === "active" || requestedAction === "resume") && promo.paymentStatus !== "PAID") {
      return NextResponse.json({ success: false, error: "Promosi belum dapat tayang karena pembayaran belum terverifikasi." }, { status: 400 });
    }

    let newStatus = promo.status;
    let message = "";

    if (isAdmin && body.status) {
      // Admin explicit status change
      newStatus = body.status;
      message = `Status promosi berhasil diubah menjadi ${newStatus}.`;
    } else if (isAdmin && (!isOwner || requestedAction === "admin_toggle")) {
      // Admin toggle
      if (promo.status === "active") {
        newStatus = "cancelled";
        message = "Promosi dinonaktifkan oleh administrator.";
      } else {
        if (promo.expiresAt && new Date(promo.expiresAt) < now) {
          return NextResponse.json(
            { success: false, error: "Promosi telah melewati masa kedaluwarsa dan tidak dapat diaktifkan kembali." },
            { status: 400 }
          );
        }
        newStatus = "active";
        message = "Promosi berhasil diaktifkan kembali oleh administrator.";
      }
    } else {
      // Provider toggle (Jeda / Lanjutkan)
      if (requestedAction === "pause" || (requestedAction !== "resume" && promo.status === "active")) {
        newStatus = "paused";
        message = "Promosi berhasil dijeda sementara. Iklan tidak akan tampil hingga Anda melanjutkannya.";
      } else if (requestedAction === "resume" || (requestedAction !== "pause" && promo.status === "paused")) {
        // Periksa apakah sudah expired
        if (promo.expiresAt && new Date(promo.expiresAt) < now) {
          await prisma.promotion.update({
            where: { id: promo.id },
            data: { status: "expired" },
          });
          return NextResponse.json(
            { success: false, error: "Masa aktif paket promosi telah kedaluwarsa. Silakan beli paket baru." },
            { status: 400 }
          );
        }
        newStatus = "active";
        message = "Promosi berhasil dilanjutkan dan kini kembali tayang.";
      } else if (promo.status === "expired") {
        return NextResponse.json(
          { success: false, error: "Promosi ini telah kedaluwarsa dan tidak dapat dijeda atau dilanjutkan." },
          { status: 400 }
        );
      } else if (promo.status === "cancelled") {
        return NextResponse.json(
          { success: false, error: "Promosi ini telah dibatalkan oleh admin atau sistem." },
          { status: 400 }
        );
      } else {
        return NextResponse.json(
          { success: false, error: `Promosi berstatus ${promo.status} tidak dapat diubah.` },
          { status: 400 }
        );
      }
    }

    const updated = await prisma.promotion.update({
      where: { id: promo.id },
      data: {
        status: newStatus,
        updatedAt: new Date(),
      },
      include: {
        package: true,
        service: true,
        rental: true,
      },
    });

    return NextResponse.json({
      success: true,
      message,
      data: {
        id: updated.id,
        status: updated.status,
        targetTitle: updated.service?.title || updated.rental?.title || "Item Promosi",
        packageName: updated.package?.name || "Promosi Unggulan",
        expiresAt: updated.expiresAt,
      },
    });
  } catch (err) {
    console.error("[POST /api/promotions/[id]/toggle error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Gagal mengubah status promosi." },
      { status: 500 }
    );
  }
}
