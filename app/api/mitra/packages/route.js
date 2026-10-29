import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth/jwt";
import { extractBearerToken } from "@/lib/auth/session";

/**
 * POST /api/mitra/packages
 * Task 75: Menambahkan & mengelola paket bundling sewa toko mitra
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

    // 2. Parse Body
    const body = await req.json().catch(() => ({}));
    const {
      title,
      category = "Paket Bundling Sewa",
      description,
      dailyPrice,
      depositAmount = 0,
      pickupLocation = userProfile.partnerAddress || "Alamat Toko Mitra",
      photoUrls = [],
      termsAndConditions,
    } = body;

    if (!title || !dailyPrice) {
      return NextResponse.json(
        { success: false, error: "Field 'title' dan 'dailyPrice' wajib diisi untuk paket bundling." },
        { status: 400 }
      );
    }

    const price = Number(dailyPrice);
    if (isNaN(price) || price <= 0) {
      return NextResponse.json(
        { success: false, error: "Harga paket bundling harus lebih besar dari Rp 0." },
        { status: 400 }
      );
    }

    const photos = Array.isArray(photoUrls) ? photoUrls : photoUrls ? [photoUrls] : [];

    // 3. Create Package as a verified Rental Unit
    const newPackage = await prisma.rental.create({
      data: {
        ownerId: userProfile.id,
        title: title.trim(),
        category: category.trim(),
        description: description ? description.trim() : "Paket bundling hemat sewa toko mitra",
        dailyPrice: price,
        depositAmount: Number(depositAmount) || 0,
        pickupLocation: pickupLocation.trim(),
        photoUrls: photos,
        termsAndConditions: termsAndConditions ? termsAndConditions.trim() : null,
        isAvailable: true,
        isVerifiedItem: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Paket bundling sewa toko mitra berhasil ditambahkan.",
        data: newPackage,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[POST /api/mitra/packages error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Gagal membuat paket bundling sewa." },
      { status: 500 }
    );
  }
}
