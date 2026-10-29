import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/session";

function normalizePlacements(placements = []) {
  if (!Array.isArray(placements)) return ["katalog", "search"];
  return placements.map((p) => {
    const s = String(p).toLowerCase().trim();
    if (s === "beranda" || s === "landing") return "landing";
    if (s === "pencarian" || s === "search") return "search";
    return s;
  });
}

/**
 * DELETE /api/admin/promotion-packages/:id
 * Menghapus paket promosi dengan pencegahan kerusakan relasi:
 * Jika memiliki transaksi aktif/riwayat promosi mitra, dialihkan ke soft delete (status: inactive).
 */
export async function DELETE(req, { params }) {
  try {
    const adminCheck = await requireAdmin(req);
    if (!adminCheck.authorized) return adminCheck.response;

    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID paket promosi diperlukan." },
        { status: 400 }
      );
    }

    const pkg = await prisma.promotionPackage.findUnique({
      where: { id },
      include: {
        _count: {
          select: { promotions: true },
        },
      },
    });

    if (!pkg) {
      return NextResponse.json(
        { success: false, error: "Paket promosi tidak ditemukan." },
        { status: 404 }
      );
    }

    const activePromosCount = await prisma.promotion.count({
      where: {
        packageId: id,
        status: { in: ["active", "paid", "pending_payment"] },
      },
    });

    const totalPromosCount = pkg._count?.promotions || 0;

    // Jika sedang digunakan oleh promosi aktif atau ada riwayat transaksi promosi
    if (activePromosCount > 0 || totalPromosCount > 0) {
      const updated = await prisma.promotionPackage.update({
        where: { id },
        data: { status: "inactive" },
      });

      return NextResponse.json({
        success: true,
        isSoftDeleted: true,
        message: activePromosCount > 0
          ? `Paket "${pkg.name}" sedang digunakan oleh ${activePromosCount} transaksi aktif mitra dan telah dinonaktifkan (soft delete).`
          : `Paket "${pkg.name}" memiliki riwayat transaksi dan telah dinonaktifkan (soft delete).`,
        data: {
          ...updated,
          price: Number(updated.price),
        },
      });
    }

    // Jika sama sekali belum pernah digunakan, aman dihapus permanen dari database
    await prisma.promotionPackage.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      isSoftDeleted: false,
      message: `Paket promosi "${pkg.name}" berhasil dihapus permanen.`,
    });
  } catch (err) {
    console.error("[DELETE /api/admin/promotion-packages/:id error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Gagal menghapus paket promosi." },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/promotion-packages/:id
 * Memperbarui data paket promosi
 */
export async function PATCH(req, { params }) {
  try {
    const adminCheck = await requireAdmin(req);
    if (!adminCheck.authorized) return adminCheck.response;

    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID paket promosi diperlukan." },
        { status: 400 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const updateData = {};

    if (body.name !== undefined) updateData.name = body.name.trim();
    if (body.service_type !== undefined || body.type !== undefined) {
      const t = (body.service_type || body.type).toLowerCase().trim();
      updateData.type = t === "sewa" ? "sewa" : "jasa";
    }
    if (body.duration_days !== undefined || body.durationDays !== undefined) {
      updateData.durationDays = Number(body.duration_days || body.durationDays);
    }
    if (body.price !== undefined) updateData.price = Math.max(10000, Number(body.price));
    if (body.priority_level !== undefined || body.priority !== undefined) {
      updateData.priority = Number(body.priority_level || body.priority);
    }
    if (body.placements !== undefined) updateData.placements = normalizePlacements(body.placements);
    if (body.benefits !== undefined) {
      updateData.benefits = Array.isArray(body.benefits)
        ? body.benefits.map((b) => String(b).trim()).filter(Boolean)
        : [];
    }
    if (body.description !== undefined) updateData.description = body.description;
    if (body.status !== undefined) updateData.status = body.status;

    const updated = await prisma.promotionPackage.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      message: `Paket promosi "${updated.name}" berhasil diperbarui.`,
      data: {
        ...updated,
        price: Number(updated.price),
        service_type: updated.type.toUpperCase(),
        duration_days: updated.durationDays,
        priority_level: updated.priority,
      },
    });
  } catch (err) {
    console.error("[PATCH /api/admin/promotion-packages/:id error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Gagal memperbarui paket promosi." },
      { status: 500 }
    );
  }
}
