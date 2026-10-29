import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth/jwt";

async function verifyAdminAuth(req) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { error: "Akses ditolak. Token tidak disediakan.", status: 401 };
  }
  const token = authHeader.substring(7).trim();
  const decoded = verifyAccessToken(token);
  if (!decoded || (!decoded.id && !decoded.email)) {
    return { error: "Sesi tidak valid atau telah berakhir.", status: 401 };
  }

  const profile = await prisma.profile.findFirst({
    where: {
      OR: [
        ...(decoded.id ? [{ id: decoded.id }] : []),
        ...(decoded.email ? [{ email: decoded.email.toLowerCase() }] : []),
      ],
    },
  });

  if (!profile || !profile.isAdmin) {
    return { error: "Akses ditolak. Hanya Administrator yang dapat mengelola master Bantuin Point.", status: 403 };
  }

  return { profile };
}

/**
 * GET /api/admin/bantuin-points
 * Ambil seluruh daftar Bantuin Point untuk manajemen admin
 */
export async function GET(req) {
  try {
    const authResult = await verifyAdminAuth(req);
    if (authResult.error) {
      return NextResponse.json({ success: false, error: authResult.error }, { status: authResult.status });
    }

    const { searchParams } = new URL(req.url);
    const campus = searchParams.get("campus");
    const search = searchParams.get("search");

    const where = {};
    if (campus) where.campus = { contains: campus, mode: "insensitive" };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { address: { contains: search, mode: "insensitive" } },
        { campus: { contains: search, mode: "insensitive" } },
      ];
    }

    const points = await prisma.bantuinPoint.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: points,
      total: points.length,
    });
  } catch (error) {
    console.error("GET /api/admin/bantuin-points Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Gagal mengambil data Bantuin Point." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/bantuin-points
 * Task 79: Admin menambah / mengubah master titik temu kampus (Bantuin Point)
 */
export async function POST(req) {
  try {
    const authResult = await verifyAdminAuth(req);
    if (authResult.error) {
      return NextResponse.json({ success: false, error: authResult.error }, { status: authResult.status });
    }
    const admin = authResult.profile;

    const body = await req.json().catch(() => ({}));
    const {
      id,
      name,
      category = "campus_gate",
      campus,
      address,
      latitude,
      longitude,
      operationalHours = "24 Jam",
      isVerifiedSafe = true,
    } = body;

    if (!name || !name.trim() || !campus || !campus.trim() || !address || !address.trim()) {
      return NextResponse.json(
        { success: false, error: "Nama titik temu, nama kampus, dan alamat fisik wajib diisi." },
        { status: 400 }
      );
    }

    const lat = latitude !== undefined && latitude !== null ? parseFloat(latitude) : 0;
    const lng = longitude !== undefined && longitude !== null ? parseFloat(longitude) : 0;

    let point;
    let actionType = "created";

    if (id) {
      // Update existing point
      const existing = await prisma.bantuinPoint.findUnique({ where: { id } });
      if (!existing) {
        return NextResponse.json(
          { success: false, error: "Bantuin Point yang akan diupdate tidak ditemukan." },
          { status: 404 }
        );
      }

      point = await prisma.bantuinPoint.update({
        where: { id },
        data: {
          name: name.trim(),
          category,
          campus: campus.trim(),
          address: address.trim(),
          latitude: lat,
          longitude: lng,
          operationalHours,
          isVerifiedSafe: Boolean(isVerifiedSafe),
        },
      });
      actionType = "updated";
    } else {
      // Create new point
      point = await prisma.bantuinPoint.create({
        data: {
          name: name.trim(),
          category,
          campus: campus.trim(),
          address: address.trim(),
          latitude: lat,
          longitude: lng,
          operationalHours,
          isVerifiedSafe: Boolean(isVerifiedSafe),
        },
      });
    }

    // Log admin action
    await prisma.auditLog.create({
      data: {
        actorId: admin.id,
        actorEmail: admin.email,
        action: `bantuin_point.${actionType}`,
        targetEntity: "bantuin_points",
        targetId: point.id,
        payload: {
          pointId: point.id,
          name: point.name,
          campus: point.campus,
          adminEmail: admin.email,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: `Bantuin Point berhasil ${actionType === "created" ? "ditambahkan" : "diperbarui"}.`,
      data: point,
    });
  } catch (error) {
    console.error("POST /api/admin/bantuin-points Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Gagal menyimpan Bantuin Point." },
      { status: 500 }
    );
  }
}
