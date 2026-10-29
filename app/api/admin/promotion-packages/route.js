import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/session";

/**
 * Normalisasi placement ke format standar database
 */
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
 * GET /api/admin/promotion-packages
 * Mengambil seluruh paket promosi untuk Admin
 */
export async function GET(req) {
  try {
    const adminCheck = await requireAdmin(req);
    if (!adminCheck.authorized) return adminCheck.response;

    const packages = await prisma.promotionPackage.findMany({
      orderBy: [
        { type: "asc" },
        { priority: "asc" },
      ],
      include: {
        _count: {
          select: { promotions: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: packages.map((pkg) => ({
        ...pkg,
        price: Number(pkg.price),
        service_type: pkg.type.toUpperCase(),
        duration_days: pkg.durationDays,
        priority_level: pkg.priority,
        active_promotions_count: pkg._count?.promotions || 0,
      })),
    });
  } catch (err) {
    console.error("[GET /api/admin/promotion-packages error]:", err);
    return NextResponse.json(
      { success: false, error: "Gagal memuat paket promosi." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/promotion-packages
 * Membuat paket promosi baru oleh Admin
 */
export async function POST(req) {
  try {
    const adminCheck = await requireAdmin(req);
    if (!adminCheck.authorized) return adminCheck.response;

    const body = await req.json().catch(() => ({}));
    const {
      name,
      service_type,
      type,
      duration_days,
      durationDays,
      price = 35000,
      placements = ["katalog", "search"],
      priority_level,
      priority = 1,
      benefits = [],
      description = "",
      status = "active",
      reach_options,
      reachOptions = ["around", "city"],
    } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { success: false, error: "Nama paket promosi harus diisi." },
        { status: 400 }
      );
    }

    const rawType = (service_type || type || "JASA").toLowerCase().trim();
    const resolvedType = rawType === "sewa" ? "sewa" : "jasa";
    const resolvedDuration = Number(duration_days || durationDays || 7);
    const resolvedPrice = Math.max(10000, Number(price) || 10000);
    const resolvedPriority = Number(priority_level || priority || 1);
    const resolvedPlacements = normalizePlacements(placements);
    const resolvedBenefits = Array.isArray(benefits)
      ? benefits.map((b) => String(b).trim()).filter(Boolean)
      : [];

    const newPackage = await prisma.promotionPackage.create({
      data: {
        name: name.trim(),
        type: resolvedType,
        durationDays: resolvedDuration,
        price: resolvedPrice,
        placements: resolvedPlacements,
        priority: resolvedPriority,
        slotLimit: resolvedPlacements.includes("landing") ? 4 : 5,
        reachOptions: Array.isArray(reach_options || reachOptions) ? (reach_options || reachOptions) : ["around", "city"],
        benefits: resolvedBenefits,
        description: description || "",
        status: status === "inactive" ? "inactive" : "active",
      },
    });

    return NextResponse.json({
      success: true,
      message: `Paket promosi "${newPackage.name}" berhasil ditambahkan.`,
      data: {
        ...newPackage,
        price: Number(newPackage.price),
        service_type: newPackage.type.toUpperCase(),
        duration_days: newPackage.durationDays,
        priority_level: newPackage.priority,
      },
    }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/admin/promotion-packages error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Gagal membuat paket promosi." },
      { status: 500 }
    );
  }
}
