import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/promotion-packages
 * Mengambil daftar paket promosi aktif untuk mitra (Jasa / Sewa)
 * Query params:
 * - status: 'active' (default) | 'all'
 * - type | service_type: 'jasa' | 'sewa' (case-insensitive)
 */
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "active";
    const rawType = searchParams.get("type") || searchParams.get("service_type");

    const where = {};
    if (status !== "all") {
      where.status = status;
    }

    if (rawType) {
      const normalizedType = rawType.toLowerCase().trim();
      where.type = normalizedType === "sewa" ? "sewa" : "jasa";
    }

    const packages = await prisma.promotionPackage.findMany({
      where,
      orderBy: [
        { priority: "asc" },
        { price: "asc" },
      ],
    });

    return NextResponse.json({
      success: true,
      data: packages.map((pkg) => ({
        ...pkg,
        price: Number(pkg.price),
        service_type: pkg.type.toUpperCase(),
        duration_days: pkg.durationDays,
        priority_level: pkg.priority,
      })),
    });
  } catch (err) {
    console.error("[GET /api/promotion-packages error]:", err);
    return NextResponse.json(
      { success: false, error: "Gagal mengambil daftar paket promosi." },
      { status: 500 }
    );
  }
}
