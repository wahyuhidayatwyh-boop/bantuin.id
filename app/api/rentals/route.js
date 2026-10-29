import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth/jwt";
import { extractBearerToken } from "@/lib/auth/session";

/**
 * GET /api/rentals
 * Task 17: Mengambil katalog barang & perlengkapan sewa dengan filter
 * 
 * Query Params:
 * - category: 'Kamera & Lensa', 'Laptop & Gadget', dll.
 * - search: Keyword pencarian title / deskripsi
 * - campus: Filter berdasarkan nama kampus pemilik
 * - minPrice, maxPrice: Range harga sewa per hari
 * - isAvailable: 'true' | 'false' (default true untuk publik)
 * - sort: 'cheapest', 'highest_price', 'rating', 'newest'
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
    const isAvailable = searchParams.get("isAvailable");
    const sort = searchParams.get("sort") || "newest";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const skip = (page - 1) * limit;

    const where = {};

    // Filter availability
    if (isAvailable !== null && isAvailable !== undefined && isAvailable !== "") {
      where.isAvailable = isAvailable === "true";
    }

    // Filter category
    if (category && category !== "all" && category !== "Semua") {
      where.category = { contains: category, mode: "insensitive" };
    }

    // Filter search keyword
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { pickupLocation: { contains: search, mode: "insensitive" } },
      ];
    }

    // Filter price range
    if (minPrice || maxPrice) {
      where.dailyPrice = {};
      if (minPrice) where.dailyPrice.gte = Number(minPrice);
      if (maxPrice) where.dailyPrice.lte = Number(maxPrice);
    }

    // Filter by owner
    const ownerId = searchParams.get("ownerId");
    if (ownerId) {
      where.ownerId = ownerId;
    }

    where.owner = {
      ...(where.owner || {}),
      verificationStatus: { not: "suspended" },
    };

    // Filter campus via owner relation
    if (campus) {
      where.owner.campusName = { contains: campus, mode: "insensitive" };
    }

    // Sorting
    let orderBy = { createdAt: "desc" };
    if (sort === "cheapest") orderBy = { dailyPrice: "asc" };
    if (sort === "highest_price") orderBy = { dailyPrice: "desc" };
    if (sort === "rating") orderBy = { ratingAvg: "desc" };

    const [total, rentals] = await Promise.all([
      prisma.rental.count({ where }),
      prisma.rental.findMany({
        where,
        include: {
          owner: {
            select: {
              id: true,
              fullName: true,
              avatarUrl: true,
              campusName: true,
              isPartner: true,
              partnerBusinessName: true,
              verificationStatus: true,
              ratingAvg: true,
              ratingCount: true,
            },
          },
          _count: {
            select: {
              bookings: {
                where: {
                  bookingStatus: {
                    in: ["payment_held", "confirmed_by_owner", "handed_over", "in_use", "returned", "verified_settled"],
                  },
                },
              },
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

    // Format output with isPromoted flag and packages extraction
    const formattedRentals = rentals.map((r) => {
      let parsedExtra = {};
      if (r.termsAndConditions) {
        try {
          if (r.termsAndConditions.trim().startsWith("{") || r.termsAndConditions.trim().startsWith("[")) {
            parsedExtra = JSON.parse(r.termsAndConditions);
          }
        } catch (_) {}
      }
      return {
        ...r,
        packages: parsedExtra.packages || [],
        pricingMode: parsedExtra.pricingMode || (parsedExtra.packages?.length ? "tiered" : "single"),
        tag: parsedExtra.tag || undefined,
        stockCount: parsedExtra.stockCount !== undefined ? Number(parsedExtra.stockCount) : 1,
        stockStatus: parsedExtra.stockStatus || (r.isAvailable ? "Siap Sewa" : "Sedang Disewa"),
        includedItems: parsedExtra.includedItems || "",
        securityDeposit: parsedExtra.securityDeposit || "",
        unit: parsedExtra.unit || "/ hari",
        isPromoted: r.promotions && r.promotions.length > 0,
        dailyPrice: Number(r.dailyPrice),
        depositAmount: Number(r.depositAmount),
        ratingAvg: Number(r.ratingAvg || r.owner?.ratingAvg || 5.0),
        ratingCount: Math.max(Number(r.ratingCount || 0), Number(r.owner?.ratingCount || 0)),
        totalRentedCount: Number(r._count?.bookings || 0),
        completedRentals: Number(r._count?.bookings || 0),
        ownerName: r.owner?.partnerBusinessName || r.owner?.fullName || "Mitra Sewa",
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        rentals: formattedRentals,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (err) {
    console.error("[GET /api/rentals error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Gagal mengambil katalog sewa." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/rentals
 * Task 18: Menambahkan unit alat/barang sewa baru oleh Mitra atau Mahasiswa
 * 
 * Rules:
 * 1. Strict JWT Authentication.
 * 2. Validates title, category, dailyPrice, pickupLocation.
 * 3. Saves item to database with initial availability true.
 */
export async function POST(req) {
  try {
    // 1. Auth check
    const token = extractBearerToken(req);

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
        { success: false, error: "Akun Anda sedang ditangguhkan oleh Administrator Bantuin. Anda tidak dapat menambahkan barang sewa baru." },
        { status: 403 }
      );
    }

    // 2. Parse Body
    const body = await req.json().catch(() => ({}));
    const {
      title,
      category,
      description,
      dailyPrice,
      depositAmount = 0,
      photoUrls = [],
      termsAndConditions,
      pickupLocation,
      latitude,
      longitude,
    } = body;

    if (!title || !category || !dailyPrice || !pickupLocation) {
      return NextResponse.json(
        {
          success: false,
          error: "Field 'title', 'category', 'dailyPrice', dan 'pickupLocation' wajib diisi.",
        },
        { status: 400 }
      );
    }

    const priceNum = Number(dailyPrice);
    const depositNum = Number(depositAmount);

    if (isNaN(priceNum) || priceNum <= 0) {
      return NextResponse.json(
        { success: false, error: "Harga sewa per hari harus lebih besar dari 0." },
        { status: 400 }
      );
    }

    const photos = Array.isArray(photoUrls) ? photoUrls : photoUrls ? [photoUrls] : [];

    // Siapkan termsAndConditions metadata (packages, stockCount, stockStatus, tag, includedItems, securityDeposit)
    let initialTerms = {};
    if (termsAndConditions) {
      if (typeof termsAndConditions === "string") {
        const trimmed = termsAndConditions.trim();
        if (trimmed.startsWith("{")) {
          try {
            initialTerms = JSON.parse(trimmed);
          } catch (_) {}
        } else {
          initialTerms.terms = trimmed;
        }
      } else if (typeof termsAndConditions === "object" && termsAndConditions !== null) {
        initialTerms = { ...termsAndConditions };
      }
    }

    if (body.packages !== undefined) initialTerms.packages = body.packages;
    if (body.pricingMode !== undefined) initialTerms.pricingMode = body.pricingMode;
    if (body.stockCount !== undefined) initialTerms.stockCount = Math.max(1, Number(body.stockCount) || 1);
    if (body.stockStatus !== undefined) initialTerms.stockStatus = body.stockStatus;
    if (body.tag !== undefined) initialTerms.tag = String(body.tag).trim();
    if (body.includedItems !== undefined) initialTerms.includedItems = String(body.includedItems).trim();
    else if (body.includes !== undefined) initialTerms.includedItems = String(body.includes).trim();
    if (body.securityDeposit !== undefined) initialTerms.securityDeposit = String(body.securityDeposit).trim();

    const termsString = Object.keys(initialTerms).length > 0 ? JSON.stringify(initialTerms) : null;
    const initialAvailability = initialTerms.stockStatus ? initialTerms.stockStatus === "Siap Sewa" : (body.isAvailable !== undefined ? Boolean(body.isAvailable) : true);

    // 3. Create Rental in DB
    const newRental = await prisma.rental.create({
      data: {
        ownerId: userProfile.id,
        title: title.trim(),
        category: category.trim(),
        description: description ? description.trim() : "",
        dailyPrice: priceNum,
        depositAmount: depositNum >= 0 ? depositNum : 0,
        photoUrls: photos,
        termsAndConditions: termsString,
        pickupLocation: pickupLocation.trim(),
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        isAvailable: initialAvailability,
        isVerifiedItem: userProfile.isPartner || userProfile.isAdmin,
      },
      include: {
        owner: {
          select: {
            id: true,
            fullName: true,
            isPartner: true,
            partnerBusinessName: true,
            avatarUrl: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Unit barang sewa berhasil didaftarkan ke katalog.",
        data: newRental,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[POST /api/rentals error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Gagal menambahkan barang sewa." },
      { status: 500 }
    );
  }
}
