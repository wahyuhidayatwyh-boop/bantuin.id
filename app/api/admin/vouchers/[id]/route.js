import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth/jwt";

/**
 * PATCH /api/admin/vouchers/[id]
 * Task 85: Admin toggle status aktif/nonaktif atau update voucher
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
        { success: false, error: "Akses ditolak. Hanya Administrator yang dapat memperbarui voucher." },
        { status: 403 }
      );
    }

    const voucher = await prisma.voucher.findUnique({
      where: { id },
    });

    if (!voucher) {
      return NextResponse.json(
        { success: false, error: "Voucher tidak ditemukan." },
        { status: 404 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const updateData = {};

    if (body.isActive !== undefined) updateData.isActive = Boolean(body.isActive);
    if (body.title !== undefined) updateData.title = body.title.trim();
    if (body.description !== undefined) updateData.description = body.description ? body.description.trim() : null;
    if (body.quota !== undefined) updateData.quota = parseInt(body.quota);
    if (body.discountValue !== undefined) updateData.discountValue = Number(body.discountValue);
    if (body.minTransaction !== undefined) updateData.minTransaction = Number(body.minTransaction);
    if (body.maxDiscount !== undefined) updateData.maxDiscount = Number(body.maxDiscount);
    if (body.appliesTo !== undefined) updateData.appliesTo = body.appliesTo;
    if (body.targetLocation !== undefined) updateData.targetLocation = body.targetLocation;
    if (body.discountType !== undefined) updateData.discountType = body.discountType;
    if (body.startsAt !== undefined) updateData.startsAt = new Date(body.startsAt);
    if (body.expiresAt !== undefined) updateData.expiresAt = new Date(body.expiresAt);

    const updated = await prisma.voucher.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      message: `Voucher '${updated.code}' berhasil diperbarui.`,
      data: updated,
    });
  } catch (err) {
    console.error("[PATCH /api/admin/vouchers/[id] error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Gagal memperbarui voucher." },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/vouchers/[id]
 * Task 85: Admin menghapus kode voucher
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
        { success: false, error: "Akses ditolak. Hanya Administrator yang dapat menghapus voucher." },
        { status: 403 }
      );
    }

    await prisma.voucher.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Voucher berhasil dihapus.",
    });
  } catch (err) {
    console.error("[DELETE /api/admin/vouchers/[id] error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Gagal menghapus voucher." },
      { status: 500 }
    );
  }
}
