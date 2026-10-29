import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth/jwt";
import { getSnapClient } from "@/lib/midtrans/client";

/**
 * POST /api/promotions/boost
 * Task 38: Pembelian paket sorotan promosi (Boost Listing) via Midtrans Snap
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

    const body = await req.json().catch(() => ({}));
    const {
      targetType = "service", // 'service', 'rental', 'store'
      targetId,
      packageId,
      reachType = "around",
    } = body;

    // Resolve Price and Package
    let packageName = "Promosi Unggulan";
    let durationDays = 7;
    let price = 35000;

    if (packageId) {
      const dbPackage = await prisma.promotionPackage.findUnique({
        where: { id: packageId },
      });
      if (dbPackage) {
        packageName = dbPackage.name;
        durationDays = dbPackage.durationDays;
        price = Number(dbPackage.price);
      }
    }

    const generatedOrderId = `PROMO-${userProfile.id.slice(0, 6)}-${Date.now().toString().slice(-6)}`;
    let snapToken = null;
    let redirectUrl = null;

    try {
      const snap = getSnapClient();
      const snapRes = await snap.createTransaction({
        transaction_details: {
          order_id: generatedOrderId,
          gross_amount: Math.round(price),
        },
        customer_details: {
          first_name: userProfile.fullName,
          email: userProfile.email,
          phone: userProfile.phoneNumber || "081234567890",
        },
        item_details: [
          {
            id: `PKG-${packageId || "standard"}`,
            price: Math.round(price),
            quantity: 1,
            name: packageName.slice(0, 50),
          },
        ],
      });
      snapToken = snapRes.token;
      redirectUrl = snapRes.redirect_url;
    } catch (snapErr) {
      console.warn("[promotions boost] Midtrans Snap warning:", snapErr.message);
    }

    // SEC-07: Validate target ownership before creating a boost promotion
    if (targetId && targetType === "service") {
      const ownedService = await prisma.service.findFirst({
        where: { id: targetId, providerId: userProfile.id },
      }).catch(() => null);
      if (!ownedService && !userProfile.isAdmin) {
        return NextResponse.json(
          { success: false, error: "Akses ditolak. Layanan jasa bukan milik akun Anda." },
          { status: 403 }
        );
      }
    } else if (targetId && targetType === "rental") {
      const ownedRental = await prisma.rental.findFirst({
        where: { id: targetId, ownerId: userProfile.id },
      }).catch(() => null);
      if (!ownedRental && !userProfile.isAdmin) {
        return NextResponse.json(
          { success: false, error: "Akses ditolak. Unit sewa bukan milik akun Anda." },
          { status: 403 }
        );
      }
    }

    const startsAt = new Date();
    const expiresAt = new Date(startsAt.getTime() + Math.max(1, Number(durationDays) || 7) * 86400000);

    // Create Promotion record
    const newPromo = await prisma.promotion.create({
      data: {
        ownerId: userProfile.id,
        targetType: targetType === "rental" ? "rental" : targetType === "store" ? "store" : "service",
        targetId: targetId || null,
        serviceId: targetType === "service" ? targetId : null,
        rentalId: targetType === "rental" ? targetId : null,
        packageId: packageId || null,
        reachType: reachType === "all" ? "all" : reachType === "city" ? "city" : "around",
        status: "draft",
        amount: price,
        startsAt,
        expiresAt,
        midtransOrderId: generatedOrderId,
        midtransSnapToken: snapToken,
        paymentStatus: "UNPAID",
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Invoice promosi berhasil dibuat. Silakan selesaikan pembayaran.",
        data: {
          promotion: newPromo,
          snapToken,
          redirectUrl,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[POST /api/promotions/boost error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Gagal membuat invoice promosi." },
      { status: 500 }
    );
  }
}
