import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth/jwt";
import { extractBearerToken } from "@/lib/auth/session";

/**
 * GET /api/rentals/[id]
 * Task 19: Detail barang sewa, ketersediaan jadwal, & ketentuan
 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(req, { params }) {
  try {
    const { id } = await params;

    if (!id || !UUID_REGEX.test(id)) {
      return NextResponse.json(
        { success: false, error: "Barang sewa tidak ditemukan." },
        { status: 404 }
      );
    }

    const rental = await prisma.rental.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            fullName: true,
            phoneNumber: true,
            avatarUrl: true,
            campusName: true,
            isPartner: true,
            partnerBusinessName: true,
            partnerAddress: true,
            ratingAvg: true,
            ratingCount: true,
            verificationStatus: true,
          },
        },
        bookings: {
          where: {
            bookingStatus: {
              in: ["temp_locked", "confirmed_by_owner", "payment_held", "handed_over", "in_use"],
            },
          },
          select: {
            startDate: true,
            endDate: true,
            bookingStatus: true,
          },
        },
      },
    });

    if (!rental) {
      return NextResponse.json(
        { success: false, error: "Barang sewa tidak ditemukan." },
        { status: 404 }
      );
    }

    let parsedExtra = {};
    if (rental.termsAndConditions) {
      try {
        if (rental.termsAndConditions.trim().startsWith("{") || rental.termsAndConditions.trim().startsWith("[")) {
          parsedExtra = JSON.parse(rental.termsAndConditions);
        }
      } catch (_) {}
    }

    const ratingAvg = Number(rental.ratingAvg || rental.owner?.ratingAvg || 5.0);
    const ratingCount = Math.max(Number(rental.ratingCount || 0), Number(rental.owner?.ratingCount || 0));

    return NextResponse.json({
      success: true,
      data: {
        ...rental,
        unit: parsedExtra.unit || "/ hari",
        packages: parsedExtra.packages || [],
        pricingMode: parsedExtra.pricingMode || (parsedExtra.packages?.length ? "tiered" : "single"),
        tag: parsedExtra.tag || undefined,
        stockCount: parsedExtra.stockCount !== undefined ? Number(parsedExtra.stockCount) : 1,
        stockStatus: parsedExtra.stockStatus || (rental.isAvailable ? "Siap Sewa" : "Sedang Disewa"),
        includedItems: parsedExtra.includedItems || "",
        securityDeposit: parsedExtra.securityDeposit || "",
        dailyPrice: Number(rental.dailyPrice),
        depositAmount: Number(rental.depositAmount),
        ratingAvg,
        ratingCount,
        activeBookings: rental.bookings,
      },
    });
  } catch (err) {
    console.error("[GET /api/rentals/[id] error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Gagal mengambil detail barang sewa." },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/rentals/[id]
 * Task 57: Update / edit data barang sewa di katalog
 * 
 * Rules:
 * 1. Strict JWT Authentication & Anti-IDOR:
 *    - Only the rental owner or platform admin can edit the rental item.
 */
export async function PATCH(req, { params }) {
  try {
    const { id } = await params;

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

    // 2. Find Rental
    if (!id || !UUID_REGEX.test(id)) {
      return NextResponse.json(
        { success: false, error: "Barang sewa tidak ditemukan." },
        { status: 404 }
      );
    }

    const rental = await prisma.rental.findUnique({
      where: { id },
    });

    if (!rental) {
      return NextResponse.json(
        { success: false, error: "Barang sewa tidak ditemukan." },
        { status: 404 }
      );
    }

    if (rental.ownerId !== userProfile.id && !userProfile.isAdmin) {
      return NextResponse.json(
        { success: false, error: "Akses ditolak. Anda bukan pemilik dari barang sewa ini." },
        { status: 403 }
      );
    }

    // 3. Parse Body & Update
    const body = await req.json().catch(() => ({}));
    const updateData = {};

    if (body.title !== undefined) updateData.title = body.title.trim();
    if (body.category !== undefined) updateData.category = body.category.trim();
    if (body.description !== undefined) updateData.description = body.description.trim();
    if (body.dailyPrice !== undefined) updateData.dailyPrice = Number(body.dailyPrice);
    if (body.depositAmount !== undefined) updateData.depositAmount = Number(body.depositAmount);
    if (body.pickupLocation !== undefined) updateData.pickupLocation = body.pickupLocation.trim();
    // Sinkronisasi metadata termsAndConditions (stockStatus, stockCount, packages, tag, includedItems, dll)
    let parsedTerms = {};
    if (rental.termsAndConditions) {
      try {
        if (typeof rental.termsAndConditions === "string" && rental.termsAndConditions.trim().startsWith("{")) {
          parsedTerms = JSON.parse(rental.termsAndConditions);
        } else if (typeof rental.termsAndConditions === "object" && rental.termsAndConditions !== null) {
          parsedTerms = { ...rental.termsAndConditions };
        }
      } catch (_) {}
    }

    let shouldUpdateTerms = false;

    // 1. Ekstrak dari body.termsAndConditions jika dikirim (baik berupa JSON string maupun object)
    if (body.termsAndConditions !== undefined && body.termsAndConditions !== null) {
      shouldUpdateTerms = true;
      if (typeof body.termsAndConditions === "string") {
        const trimmed = body.termsAndConditions.trim();
        if (trimmed.startsWith("{")) {
          try {
            const parsedObj = JSON.parse(trimmed);
            parsedTerms = { ...parsedTerms, ...parsedObj };
          } catch (_) {}
        } else {
          parsedTerms.terms = trimmed;
        }
      } else if (typeof body.termsAndConditions === "object") {
        parsedTerms = { ...parsedTerms, ...body.termsAndConditions };
      }
    }

    // 2. Ekstrak packages & pricingMode
    if (body.packages !== undefined) {
      parsedTerms.packages = body.packages;
      shouldUpdateTerms = true;
    }
    if (body.pricingMode !== undefined) {
      parsedTerms.pricingMode = body.pricingMode;
      shouldUpdateTerms = true;
    }

    // 3. Ekstrak stockStatus & isAvailable
    if (body.stockStatus !== undefined) {
      parsedTerms.stockStatus = body.stockStatus;
      shouldUpdateTerms = true;
      if (body.isAvailable === undefined) {
        updateData.isAvailable = body.stockStatus === "Siap Sewa";
      }
    }

    if (body.isAvailable !== undefined) {
      updateData.isAvailable = Boolean(body.isAvailable);
      if (body.stockStatus === undefined) {
        parsedTerms.stockStatus = updateData.isAvailable ? "Siap Sewa" : "Sedang Disewa";
        shouldUpdateTerms = true;
      }
    } else if (parsedTerms.stockStatus !== undefined && updateData.isAvailable === undefined) {
      // Sinkronkan isAvailable dari stockStatus jika tidak dispesifikasikan eksplisit
      updateData.isAvailable = parsedTerms.stockStatus === "Siap Sewa";
    }

    // 4. Ekstrak stockCount (Jumlah Stok Unit Ready)
    if (body.stockCount !== undefined) {
      parsedTerms.stockCount = Math.max(1, Number(body.stockCount) || 1);
      shouldUpdateTerms = true;
    }

    // 5. Ekstrak tag (Highlight / Badge Tag)
    if (body.tag !== undefined) {
      parsedTerms.tag = body.tag ? String(body.tag).trim() : "";
      shouldUpdateTerms = true;
    }

    // 6. Ekstrak includedItems (Kelengkapan Bawaan Unit)
    if (body.includedItems !== undefined) {
      parsedTerms.includedItems = String(body.includedItems).trim();
      shouldUpdateTerms = true;
    } else if (body.includes !== undefined) {
      parsedTerms.includedItems = String(body.includes).trim();
      shouldUpdateTerms = true;
    }

    // 7. Ekstrak securityDeposit (Ketentuan Deposit / Jaminan)
    if (body.securityDeposit !== undefined) {
      parsedTerms.securityDeposit = String(body.securityDeposit).trim();
      shouldUpdateTerms = true;
    }

    // 8. Ekstrak unit (Satuan Sewa, e.g. / hari)
    if (body.unit !== undefined) {
      parsedTerms.unit = String(body.unit).trim();
      shouldUpdateTerms = true;
    }

    if (shouldUpdateTerms) {
      updateData.termsAndConditions = JSON.stringify(parsedTerms);
    }
    if (body.photoUrls !== undefined) {
      updateData.photoUrls = Array.isArray(body.photoUrls) ? body.photoUrls : [body.photoUrls];
    }
    if (body.latitude !== undefined) updateData.latitude = body.latitude ? parseFloat(body.latitude) : null;
    if (body.longitude !== undefined) updateData.longitude = body.longitude ? parseFloat(body.longitude) : null;

    const updatedRental = await prisma.rental.update({
      where: { id },
      data: updateData,
    });

    const patchRatingAvg = Number(updatedRental.ratingAvg || userProfile.ratingAvg || 5.0);
    const patchRatingCount = Math.max(Number(updatedRental.ratingCount || 0), Number(userProfile.ratingCount || 0));

    return NextResponse.json({
      success: true,
      message: "Data barang sewa berhasil diperbarui.",
      data: {
        ...updatedRental,
        unit: parsedTerms.unit || "/ hari",
        packages: parsedTerms.packages || [],
        pricingMode: parsedTerms.pricingMode || (parsedTerms.packages?.length ? "tiered" : "single"),
        tag: parsedTerms.tag || undefined,
        stockCount: parsedTerms.stockCount !== undefined ? Number(parsedTerms.stockCount) : 1,
        stockStatus: parsedTerms.stockStatus || (updatedRental.isAvailable ? "Siap Sewa" : "Sedang Disewa"),
        includedItems: parsedTerms.includedItems || "",
        securityDeposit: parsedTerms.securityDeposit || "",
        dailyPrice: Number(updatedRental.dailyPrice),
        depositAmount: Number(updatedRental.depositAmount),
        ratingAvg: patchRatingAvg,
        ratingCount: patchRatingCount,
      },
    });
  } catch (err) {
    console.error("[PATCH /api/rentals/[id] error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Gagal memperbarui barang sewa." },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/rentals/[id]
 * Task 58: Menghapus unit barang sewa dari katalog
 * 
 * Rules:
 * 1. Strict JWT Authentication & Anti-IDOR.
 * 2. Checks if there are active bookings in progress before allowing deletion.
 */
export async function DELETE(req, { params }) {
  try {
    const { id } = await params;

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

    // 2. Find Rental
    if (!id || !UUID_REGEX.test(id)) {
      return NextResponse.json(
        { success: false, error: "Barang sewa tidak ditemukan." },
        { status: 404 }
      );
    }

    const rental = await prisma.rental.findUnique({
      where: { id },
      include: {
        bookings: {
          where: {
            bookingStatus: {
              in: ["confirmed_by_owner", "payment_held", "handed_over", "in_use"],
            },
          },
        },
      },
    });

    if (!rental) {
      return NextResponse.json(
        { success: false, error: "Barang sewa tidak ditemukan." },
        { status: 404 }
      );
    }

    if (rental.ownerId !== userProfile.id && !userProfile.isAdmin) {
      return NextResponse.json(
        { success: false, error: "Akses ditolak. Anda bukan pemilik dari barang sewa ini." },
        { status: 403 }
      );
    }

    if (rental.bookings && rental.bookings.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Barang sewa tidak dapat dihapus karena masih memiliki pesanan sewa aktif yang sedang berjalan.",
        },
        { status: 400 }
      );
    }

    // 3. Delete Rental
    await prisma.rental.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Unit barang sewa berhasil dihapus dari katalog.",
    });
  } catch (err) {
    console.error("[DELETE /api/rentals/[id] error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Gagal menghapus barang sewa." },
      { status: 500 }
    );
  }
}
