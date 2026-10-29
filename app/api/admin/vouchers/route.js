import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth/jwt";

/**
 * GET /api/admin/vouchers
 * Task 83: Admin mengambil daftar seluruh voucher diskon (aktif & terpakai)
 */
export async function GET(req) {
  try {
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
        { success: false, error: "Akses ditolak. Hanya Administrator yang dapat melihat daftar voucher." },
        { status: 403 }
      );
    }

    const vouchers = await prisma.voucher.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: vouchers.map((v) => ({
        ...v,
        discountValue: Number(v.discountValue),
        minTransaction: Number(v.minTransaction),
        maxDiscount: v.maxDiscount ? Number(v.maxDiscount) : null,
      })),
    });
  } catch (err) {
    console.error("[GET /api/admin/vouchers error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Gagal mengambil daftar voucher." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/vouchers
 * Task 84: Admin membuat kode voucher promo diskon baru
 */
export async function POST(req) {
  try {
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
        { success: false, error: "Akses ditolak. Hanya Administrator yang dapat membuat voucher." },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const {
      code,
      title,
      description,
      discountType = "percentage",
      discountValue,
      minTransaction = 0,
      maxDiscount,
      quota = 100,
      appliesTo = "all",
      targetLocation = "all",
      startsAt,
      expiresAt,
    } = body;

    if (!code || !title || !discountValue) {
      return NextResponse.json(
        { success: false, error: "Field 'code', 'title', dan 'discountValue' wajib diisi." },
        { status: 400 }
      );
    }

    const cleanCode = code.trim().toUpperCase();
    const existing = await prisma.voucher.findUnique({
      where: { code: cleanCode },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: "Kode voucher sudah digunakan. Harap gunakan kode lain." },
        { status: 400 }
      );
    }

    const startDate = startsAt ? new Date(startsAt) : new Date();
    const expireDate = expiresAt ? new Date(expiresAt) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const newVoucher = await prisma.voucher.create({
      data: {
        code: cleanCode,
        title: title.trim(),
        description: description ? description.trim() : null,
        discountType,
        discountValue: Number(discountValue),
        minTransaction: Number(minTransaction) || 0,
        maxDiscount: maxDiscount ? Number(maxDiscount) : null,
        quota: parseInt(quota) || 100,
        appliesTo,
        targetLocation: targetLocation || "all",
        isActive: true,
        startsAt: startDate,
        expiresAt: expireDate,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: `Kode voucher '${cleanCode}' berhasil dibuat.`,
        data: newVoucher,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[POST /api/admin/vouchers error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Gagal membuat voucher." },
      { status: 500 }
    );
  }
}
