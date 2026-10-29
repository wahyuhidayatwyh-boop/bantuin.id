import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/vouchers
 * Mengambil daftar voucher diskon aktif yang memenuhi syarat dari database PostgreSQL
 * Parameter opsional:
 *  - category: 'all' | 'bantuan' | 'jasa' | 'sewa'
 *  - location: filter berdasarkan targetLocation wilayah
 */
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const location = searchParams.get("location");

    const now = new Date();

    const where = {
      isActive: true,
      expiresAt: { gte: now },
    };

    if (category && category !== "all") {
      where.OR = [
        { appliesTo: "all" },
        { appliesTo: category },
      ];
    }

    const vouchers = await prisma.voucher.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    const formatted = vouchers
      .filter((v) => (v.quota || 100) - (v.usedCount || 0) > 0)
      .map((v) => ({
        id: v.id,
        code: v.code,
        title: v.title,
        description: v.description || "",
        type: v.discountType === "percentage" ? "percent" : "fixed",
        discountType: v.discountType,
        value: Number(v.discountValue),
        discountValue: Number(v.discountValue),
        minOrder: Number(v.minTransaction || 0),
        minTransaction: Number(v.minTransaction || 0),
        maxDiscount: v.maxDiscount ? Number(v.maxDiscount) : (v.discountType === "fixed" ? Number(v.discountValue) : 50000),
        quota: v.quota,
        usedCount: v.usedCount || 0,
        appliesTo: v.appliesTo,
        targetLocation: v.targetLocation || "all",
        isActive: v.isActive,
        expiresAt: v.expiresAt.toISOString(),
        startsAt: v.startsAt.toISOString(),
      }));

    const filtered = formatted.filter((v) => {
      if (!location || location === "all") return true;
      if (!v.targetLocation || v.targetLocation === "all") return true;
      const vLoc = v.targetLocation.toLowerCase().replace(/^(kota|kabupaten|kab\.)\s+/gi, "").trim();
      const uLoc = location.toLowerCase().replace(/^(kota|kabupaten|kab\.)\s+/gi, "").trim();
      return vLoc.includes(uLoc) || uLoc.includes(vLoc);
    });

    return NextResponse.json({
      success: true,
      data: filtered,
    });
  } catch (err) {
    console.error("[GET /api/vouchers error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Gagal mengambil daftar voucher." },
      { status: 500 }
    );
  }
}
