import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth/jwt";

/**
 * PATCH /api/admin/promotions/packages/[id]
 * Memperbarui data atau status paket promosi
 */
export async function PATCH(req, { params }) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID paket promosi diperlukan." },
        { status: 400 }
      );
    }

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
        { success: false, error: "Akses terbatas untuk administrator." },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const updateData = {};

    if (body.name !== undefined) updateData.name = body.name.trim();
    if (body.type !== undefined) updateData.type = body.type === "sewa" ? "sewa" : "jasa";
    if (body.durationDays !== undefined) updateData.durationDays = Number(body.durationDays);
    if (body.price !== undefined) updateData.price = Number(body.price);
    if (body.reachOptions !== undefined) updateData.reachOptions = body.reachOptions;
    if (body.placements !== undefined) updateData.placements = body.placements;
    if (body.priority !== undefined) updateData.priority = Number(body.priority);
    if (body.slotLimit !== undefined) updateData.slotLimit = Number(body.slotLimit);
    if (body.benefits !== undefined) updateData.benefits = body.benefits;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.status !== undefined) updateData.status = body.status;

    const updated = await prisma.promotionPackage.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      message: "Paket promosi berhasil diperbarui.",
      data: {
        ...updated,
        price: Number(updated.price),
      },
    });
  } catch (err) {
    console.error("[PATCH /api/admin/promotions/packages/[id] error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Gagal memperbarui paket promosi." },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/promotions/packages/[id]
 * Menghapus paket promosi jika belum digunakan
 */
export async function DELETE(req, { params }) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID paket promosi diperlukan." },
        { status: 400 }
      );
    }

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
        { success: false, error: "Akses terbatas untuk administrator." },
        { status: 403 }
      );
    }

    const pkg = await prisma.promotionPackage.findUnique({
      where: { id },
      include: {
        _count: { select: { promotions: true } },
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

    if (activePromosCount > 0 || (pkg._count?.promotions || 0) > 0) {
      const updated = await prisma.promotionPackage.update({
        where: { id },
        data: { status: "inactive" },
      });
      return NextResponse.json({
        success: true,
        isSoftDeleted: true,
        message: `Paket promosi "${pkg.name}" sedang digunakan atau memiliki riwayat transaksi dan telah dinonaktifkan (soft delete).`,
        data: {
          ...updated,
          price: Number(updated.price),
        },
      });
    }

    await prisma.promotionPackage.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      isSoftDeleted: false,
      message: `Paket promosi "${pkg.name}" berhasil dihapus permanen.`,
    });
  } catch (err) {
    console.error("[DELETE /api/admin/promotions/packages/[id] error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Gagal menghapus paket promosi." },
      { status: 500 }
    );
  }
}
