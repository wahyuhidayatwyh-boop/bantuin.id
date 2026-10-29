import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth/jwt";

/**
 * GET /api/admin/promotions/packages
 * Mengambil semua paket promosi
 */
export async function GET() {
  try {
    const packages = await prisma.promotionPackage.findMany({
      orderBy: { priority: "asc" },
    });

    return NextResponse.json({
      success: true,
      data: packages.map((pkg) => ({
        ...pkg,
        price: Number(pkg.price),
      })),
    });
  } catch (err) {
    console.error("[GET /api/admin/promotions/packages error]:", err);
    return NextResponse.json(
      { success: false, error: "Gagal memuat paket promosi." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/promotions/packages
 * Menambahkan paket promosi baru ke database PostgreSQL
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
    const {
      name,
      type = "jasa",
      durationDays = 7,
      price = 35000,
      reachOptions = ["around", "city"],
      placements = ["katalog", "search"],
      priority = 1,
      slotLimit = 4,
      benefits = [],
      description = "",
      status = "active",
    } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { success: false, error: "Nama paket promosi harus diisi." },
        { status: 400 }
      );
    }

    const newPackage = await prisma.promotionPackage.create({
      data: {
        name: name.trim(),
        type: type === "sewa" ? "sewa" : "jasa",
        durationDays: Number(durationDays) || 7,
        price: Number(price) || 35000,
        reachOptions: Array.isArray(reachOptions) ? reachOptions : ["around", "city"],
        placements: Array.isArray(placements) ? placements : ["katalog", "search"],
        priority: Number(priority) || 1,
        slotLimit: Number(slotLimit) || 4,
        benefits: Array.isArray(benefits) ? benefits : [],
        description: description || "",
        status: status || "active",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Paket promosi berhasil ditambahkan.",
      data: {
        ...newPackage,
        price: Number(newPackage.price),
      },
    }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/admin/promotions/packages error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Gagal membuat paket promosi." },
      { status: 500 }
    );
  }
}
