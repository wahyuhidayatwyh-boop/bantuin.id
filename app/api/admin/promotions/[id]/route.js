import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth/jwt";

/**
 * PATCH /api/admin/promotions/[id]
 * Mengubah status promosi (misal: membatalkan promosi, mengaktifkan kembali)
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
        { success: false, error: "Akses ditolak. Silakan login admin." },
        { status: 401 }
      );
    }

    const decoded = verifyAccessToken(token);
    if (!decoded || (!decoded.id && !decoded.email)) {
      return NextResponse.json(
        { success: false, error: "Sesi admin tidak valid." },
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
        { success: false, error: "Akses terbatas untuk akun administrator." },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { status } = body;

    const current = await prisma.promotion.findUnique({ where: { id } });
    if (!current) return NextResponse.json({ success: false, error: "Promosi tidak ditemukan." }, { status: 404 });
    if (status === "active" && current.paymentStatus !== "PAID") {
      return NextResponse.json({ success: false, error: "Promosi hanya dapat diaktifkan setelah pembayaran gateway berstatus PAID." }, { status: 400 });
    }

    const updated = await prisma.promotion.update({
      where: { id },
      data: {
        ...(status ? { status } : {}),
        ...(status === "active" && !current.startsAt ? { startsAt: new Date() } : {}),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Status promosi berhasil diperbarui.",
      data: updated,
    });
  } catch (err) {
    console.error("[PATCH /api/admin/promotions/[id] error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Gagal memperbarui promosi." },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/promotions/[id]
 * Menghapus data promosi
 */
export async function DELETE(req, { params }) {
  try {
    const { id } = await params;
    const authHeader = req.headers.get("authorization");
    let token = null;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7).trim();
    }

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Akses ditolak." },
        { status: 401 }
      );
    }

    const decoded = verifyAccessToken(token);
    if (!decoded || (!decoded.id && !decoded.email)) {
      return NextResponse.json(
        { success: false, error: "Sesi admin tidak valid." },
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
        { success: false, error: "Akses terbatas untuk administrator." },
        { status: 403 }
      );
    }

    await prisma.promotion.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Promosi berhasil dihapus.",
    });
  } catch (err) {
    console.error("[DELETE /api/admin/promotions/[id] error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Gagal menghapus promosi." },
      { status: 500 }
    );
  }
}
