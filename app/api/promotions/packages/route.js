import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/promotions/packages
 * Task 81: Ambil daftar paket promosi unggulan (paket 1 hari, 7 hari, 30 hari)
 */
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const rawType = searchParams.get("type") || searchParams.get("service_type");
    const where = { status: "active" };

    if (rawType) {
      where.type = rawType.toLowerCase().trim() === "sewa" ? "sewa" : "jasa";
    }

    const dbPackages = await prisma.promotionPackage.findMany({
      where,
      orderBy: [
        { priority: "asc" },
        { price: "asc" },
      ],
    });

    return NextResponse.json({
      success: true,
      data: (dbPackages || []).map((p) => ({
        ...p,
        price: Number(p.price),
        durationDays: p.durationDays,
        priority: p.priority,
      })),
    });
  } catch (err) {
    console.error("[GET /api/promotions/packages error]:", err);
    return NextResponse.json(
      { success: false, error: "Gagal mengambil daftar paket promosi." },
      { status: 500 }
    );
  }
}
