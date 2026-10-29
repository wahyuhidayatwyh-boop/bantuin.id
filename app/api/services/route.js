import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth/jwt";

/**
 * GET /api/services
 * Task 22: Mengambil direktori listing keahlian jasa mahasiswa dengan filter
 * 
 * Query Params:
 * - category: 'Desain Grafis', 'Web & Pemrograman', 'Penerjemahan & Tulisan', dll.
 * - search: Keyword pencarian judul atau deskripsi jasa
 * - campus: Filter berdasarkan nama kampus penyedia
 * - minPrice, maxPrice: Range harga mulai
 * - sort: 'cheapest', 'highest_price', 'rating', 'orders', 'newest'
 * - page, limit: Pagination
 */
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const campus = searchParams.get("campus");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const sort = searchParams.get("sort") || "newest";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const skip = (page - 1) * limit;

    const where = {};

    if (category && category !== "all" && category !== "Semua") {
      where.category = { contains: category, mode: "insensitive" };
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { tags: { has: search } },
      ];
    }

    if (minPrice || maxPrice) {
      where.startingPrice = {};
      if (minPrice) where.startingPrice.gte = Number(minPrice);
      if (maxPrice) where.startingPrice.lte = Number(maxPrice);
    }

    where.provider = {
      ...(where.provider || {}),
      verificationStatus: { not: "suspended" },
    };

    if (campus) {
      where.provider.campusName = { contains: campus, mode: "insensitive" };
    }

    let orderBy = { createdAt: "desc" };
    if (sort === "cheapest") orderBy = { startingPrice: "asc" };
    if (sort === "highest_price") orderBy = { startingPrice: "desc" };
    if (sort === "rating") orderBy = { ratingAvg: "desc" };
    if (sort === "orders") orderBy = { completedOrders: "desc" };

    const [total, services] = await Promise.all([
      prisma.service.count({ where }),
      prisma.service.findMany({
        where,
        include: {
          provider: {
            select: {
              id: true,
              fullName: true,
              avatarUrl: true,
              campusName: true,
              ratingAvg: true,
              ratingCount: true,
              completedHelpsCount: true,
              verificationStatus: true,
            },
          },
          promotions: {
            where: {
              status: "active",
              expiresAt: { gt: new Date() },
            },
            select: {
              id: true,
              reachType: true,
              packageId: true,
            },
            take: 1,
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
    ]);

    const formatted = services.map((s) => {
      let parsedPackages = [];
      if (s.packages) {
        try {
          if (Array.isArray(s.packages)) parsedPackages = s.packages;
          else if (typeof s.packages === "string" && s.packages.trim().startsWith("[")) parsedPackages = JSON.parse(s.packages);
        } catch (_) {}
      }
      const firstPkg = parsedPackages[0] || {};
      const ratingAvg = Number(s.ratingAvg || s.provider?.ratingAvg || 0);
      const ratingCount = Math.max(Number(s.ratingCount || 0), Number(s.provider?.ratingCount || 0));

      return {
        ...s,
        unit: firstPkg.unit || "/ proyek",
        deliveryDuration: firstPkg.duration || "1-2 Hari Kerja",
        isPromoted: s.promotions && s.promotions.length > 0,
        startingPrice: Number(s.startingPrice),
        ratingAvg,
        ratingCount,
        completedOrders: Number(s.completedOrders || 0),
        provider: {
          ...s.provider,
          ratingAvg: Number(s.provider?.ratingAvg || ratingAvg),
          ratingCount: Math.max(Number(s.provider?.ratingCount || 0), ratingCount),
          completedJobs: Number(s.provider?.completedHelpsCount || 0),
        },
        locationType: s.locationType || "hybrid",
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        services: formatted,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (err) {
    console.error("[GET /api/services error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Gagal mengambil direktori jasa." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/services
 * Task 23: Pembuatan listing penawaran jasa baru oleh Provider
 * 
 * Rules:
 * 1. Strict JWT Authentication.
 * 2. Validates title, category, startingPrice.
 * 3. Saves service to database.
 */
export async function POST(req) {
  try {
    // 1. Auth check
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

    const userProfile = await prisma.profile.findFirst({
      where: {
        OR: [
          ...(decoded.id ? [{ id: decoded.id }] : []),
          ...(decoded.email ? [{ email: decoded.email.toLowerCase() }] : []),
        ],
      },
    });

    if (!userProfile) {
      return NextResponse.json(
        { success: false, error: "Profil akun tidak ditemukan." },
        { status: 404 }
      );
    }

    if (userProfile.verificationStatus === "suspended") {
      return NextResponse.json(
        { success: false, error: "Akun Anda sedang ditangguhkan oleh Administrator Bantuin. Anda tidak dapat membuat listing jasa baru." },
        { status: 403 }
      );
    }

    // 2. Parse Body
    const body = await req.json().catch(() => ({}));
    const {
      title,
      category,
      description,
      startingPrice,
      packages = [],
      portfolioUrls = [],
      tags = [],
      locationType,
      latitude,
      longitude,
      address,
    } = body;

    const packagesList = Array.isArray(packages) ? packages : [];
    let priceNum = Number(startingPrice);
    if (packagesList.length > 0) {
      const validPrices = packagesList.map((p) => Number(p.price)).filter((p) => !isNaN(p) && p > 0);
      if (validPrices.length > 0) {
        priceNum = Math.min(...validPrices);
      }
    }

    if (!title || !category || (!priceNum && isNaN(priceNum))) {
      return NextResponse.json(
        { success: false, error: "Field 'title', 'category', dan tarif layanan wajib diisi." },
        { status: 400 }
      );
    }

    if (isNaN(priceNum) || priceNum <= 0) {
      return NextResponse.json(
        { success: false, error: "Harga layanan harus berupa angka lebih besar dari Rp 0." },
        { status: 400 }
      );
    }

    const portfolios = Array.isArray(portfolioUrls) ? portfolioUrls : portfolioUrls ? [portfolioUrls] : [];
    const tagList = Array.isArray(tags) ? tags : [];

    // 3. Create Service
    const service = await prisma.service.create({
      data: {
        providerId: userProfile.id,
        title: title.trim(),
        category: category.trim(),
        description: description ? description.trim() : "",
        startingPrice: priceNum,
        packages: packagesList,
        portfolioUrls: portfolios,
        tags: tagList,
        locationType: locationType ? String(locationType).trim() : "hybrid",
        latitude: latitude !== undefined && latitude !== null && !isNaN(Number(latitude)) ? Number(latitude) : null,
        longitude: longitude !== undefined && longitude !== null && !isNaN(Number(longitude)) ? Number(longitude) : null,
        address: address ? String(address).trim() : null,
      },
      include: {
        provider: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
            campusName: true,
            ratingAvg: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Listing jasa berhasil dipublikasikan.",
        data: service,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[POST /api/services error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Gagal membuat penawaran jasa." },
      { status: 500 }
    );
  }
}
