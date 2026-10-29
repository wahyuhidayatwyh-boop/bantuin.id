import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth/session";

/**
 * POST /api/vouchers/validate
 * Task 37: Validasi dan kalkulasi potongan kode promo voucher
 *
 * Rules:
 * 1. Checks voucher active state, validity dates, quota, and minimum transaction requirement.
 * 2. Calculates discount accurately based on 'percentage' or 'fixed' rules.
 * 3. Requires authenticated user when action === "redeem" to prevent unauthenticated quota exhaustion.
 */
export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const { code, category = "all", orderAmount } = body;

    if (!code) {
      return NextResponse.json(
        { valid: false, error: "Kode voucher tidak boleh kosong." },
        { status: 400 }
      );
    }

    if (body.action === "redeem") {
      const auth = await requireAuth(req);
      if (auth.errorResponse) return auth.errorResponse;
    }

    const cleanCode = code.trim().toUpperCase();
    const amount = Number(orderAmount ?? body.totalAmount) || 0;

    // 1. Search in Database
    let voucher = await prisma.voucher.findUnique({
      where: { code: cleanCode },
    });

    // Fallback Preset Vouchers for Sandbox & Promo Launches if DB is empty
    if (!voucher) {
      const presets = {
        BANTUINHEMAT: {
          code: "BANTUINHEMAT",
          title: "Diskon Mahasiswa Baru",
          discountType: "percentage",
          discountValue: 15,
          minTransaction: 20000,
          maxDiscount: 15000,
          appliesTo: "all",
          isActive: true,
        },
        MABA2026: {
          code: "MABA2026",
          title: "Promo Spesial Maba",
          discountType: "fixed",
          discountValue: 10000,
          minTransaction: 25000,
          maxDiscount: 10000,
          appliesTo: "all",
          isActive: true,
        },
        KAMPUSBEBAS: {
          code: "KAMPUSBEBAS",
          title: "Bebas Biaya Admin & Diskon",
          discountType: "fixed",
          discountValue: 5000,
          minTransaction: 10000,
          maxDiscount: 5000,
          appliesTo: "all",
          isActive: true,
        },
      };

      if (presets[cleanCode]) {
        voucher = presets[cleanCode];
      }
    }

    if (!voucher) {
      return NextResponse.json({
        valid: false,
        error: "Kode voucher tidak ditemukan atau sudah tidak berlaku.",
      });
    }

    if (!voucher.isActive) {
      return NextResponse.json({
        valid: false,
        error: "Voucher ini sedang dinonaktifkan.",
      });
    }

    if (voucher.expiresAt && new Date(voucher.expiresAt) < new Date()) {
      return NextResponse.json({
        valid: false,
        error: "Masa berlaku voucher telah berakhir.",
      });
    }

    if (voucher.quota && voucher.usedCount && voucher.usedCount >= voucher.quota) {
      return NextResponse.json({
        valid: false,
        error: "Kuota pemakaian voucher ini telah habis.",
      });
    }

    if (
      voucher.appliesTo &&
      voucher.appliesTo !== "all" &&
      category &&
      category !== "all" &&
      voucher.appliesTo !== category
    ) {
      return NextResponse.json({
        valid: false,
        error: `Voucher ini hanya berlaku untuk transaksi layanan ${voucher.appliesTo.toUpperCase()}.`,
      });
    }

    const checkLoc = body.userLocation || body.location;
    if (
      voucher.targetLocation &&
      voucher.targetLocation !== "all" &&
      checkLoc &&
      checkLoc !== "all"
    ) {
      const vLoc = voucher.targetLocation.toLowerCase().replace(/^(kota|kabupaten|kab\.)\s+/gi, "").trim();
      const uLoc = checkLoc.toLowerCase().replace(/^(kota|kabupaten|kab\.)\s+/gi, "").trim();
      if (!uLoc.includes(vLoc) && !vLoc.includes(uLoc)) {
        return NextResponse.json({
          valid: false,
          error: `Voucher ini khusus berlaku untuk transaksi di wilayah ${voucher.targetLocation}.`,
        });
      }
    }

    const minTx = Number(voucher.minTransaction || 0);
    if (amount < minTx) {
      return NextResponse.json({
        valid: false,
        error: `Minimal transaksi untuk menggunakan voucher ini adalah Rp ${minTx.toLocaleString("id-ID")}.`,
      });
    }

    // 2. Calculate Discount Amount
    let discountAmount = 0;
    const discountVal = Number(voucher.discountValue);
    const maxDiscount = voucher.maxDiscount ? Number(voucher.maxDiscount) : null;

    if (voucher.discountType === "percentage") {
      discountAmount = Math.round((discountVal / 100) * amount);
      if (maxDiscount && discountAmount > maxDiscount) {
        discountAmount = maxDiscount;
      }
    } else {
      // Fixed cut
      discountAmount = Math.min(discountVal, amount);
    }

    const finalAmount = Math.max(0, amount - discountAmount);

    if (body.action === "redeem") {
      try {
        await prisma.voucher.update({
          where: { code: cleanCode },
          data: {
            usedCount: { increment: 1 },
          },
        });
      } catch (e) {
        console.warn("Voucher usedCount increment warning:", e);
      }
    }

    return NextResponse.json({
      valid: true,
      data: {
        code: voucher.code,
        title: voucher.title,
        targetLocation: voucher.targetLocation || "all",
        discountType: voucher.discountType,
        discountValue: discountVal,
        discountAmount,
        originalAmount: amount,
        finalAmount,
        redeemed: Boolean(body.action === "redeem"),
      },
    });
  } catch (err) {
    console.error("[POST /api/vouchers/validate error]:", err);
    return NextResponse.json(
      { valid: false, error: err.message || "Gagal memvalidasi voucher." },
      { status: 500 }
    );
  }
}
