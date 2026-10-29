import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth/jwt";
import { getSnapClient, getCoreApiClient, getMidtransConfig, mapMidtransStatus } from "@/lib/midtrans/client";

// Mapping legacy string slugs to deterministic seeded package UUIDs
const SLUG_TO_UUID = {
  "pkg-jasa-1d": "a0000001-0000-4000-8000-000000000001",
  "pkg-jasa-7d": "a0000001-0000-4000-8000-000000000002",
  "pkg-jasa-30d": "a0000001-0000-4000-8000-000000000003",
  "pkg-sewa-1d": "a0000002-0000-4000-8000-000000000001",
  "pkg-sewa-7d": "a0000002-0000-4000-8000-000000000002",
  "pkg-sewa-30d": "a0000002-0000-4000-8000-000000000003",
};

/**
 * POST /api/promotions/order
 * Membuat dan mengaktifkan pesanan promosi layanan/sewa langsung ke database PostgreSQL
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
      serviceId,
      rentalId,
      targetId,
      targetType = "service", // 'service' | 'rental' | 'store'
      packageId,
      reachType = "around",
      amount,
      paymentMethod = "qris",
    } = body;

    // 1. Resolve Package
    let resolvedPackageId = packageId;
    if (SLUG_TO_UUID[packageId]) {
      resolvedPackageId = SLUG_TO_UUID[packageId];
    }

    let dbPackage = null;
    if (resolvedPackageId) {
      try {
        dbPackage = await prisma.promotionPackage.findUnique({
          where: { id: resolvedPackageId },
        });
      } catch {
        // Fallback if not valid UUID
      }
    }

    if (!dbPackage) {
      // Find default active package by target type
      dbPackage = await prisma.promotionPackage.findFirst({
        where: {
          type: targetType === "rental" ? "sewa" : "jasa",
          status: "active",
        },
        orderBy: { priority: "asc" },
      });
    }

    // SEC-07: Enforce server-side package pricing and never allow client body to mark promotion as PAID
    const durationDays = dbPackage ? dbPackage.durationDays : 7;
    const finalAmount = Math.max(1000, Number(dbPackage ? dbPackage.price : 35000));
    const startsAt = new Date();
    const expiresAt = new Date(startsAt.getTime() + durationDays * 86400000);

    // 2. Resolve Service / Rental
    let validServiceId = null;
    let validRentalId = null;
    let validTargetId = null;

    const rawServiceId = serviceId || (targetType === "service" ? targetId : null);
    if (rawServiceId) {
      try {
        const foundService = await prisma.service.findFirst({
          where: { id: rawServiceId, providerId: userProfile.id },
        });
        if (foundService) {
          validServiceId = foundService.id;
          validTargetId = foundService.id;
        }
      } catch {
        // Fallback
      }
    }

    const rawRentalId = rentalId || (targetType === "rental" ? targetId : null);
    if (rawRentalId) {
      try {
        const foundRental = await prisma.rental.findFirst({
          where: { id: rawRentalId, ownerId: userProfile.id },
        });
        if (foundRental) {
          validRentalId = foundRental.id;
          validTargetId = foundRental.id;
        }
      } catch {
        // Fallback
      }
    }

    if (!validTargetId) {
      if (targetType === "store") {
        validTargetId = userProfile.id;
      } else if (targetType === "rental") {
        const anyRental = await prisma.rental.findFirst({ where: { ownerId: userProfile.id } });
        if (anyRental) {
          validRentalId = anyRental.id;
          validTargetId = anyRental.id;
        } else {
          validTargetId = userProfile.id;
        }
      } else {
        const anyService = await prisma.service.findFirst({ where: { providerId: userProfile.id } });
        if (anyService) {
          validServiceId = anyService.id;
          validTargetId = anyService.id;
        } else {
          validTargetId = userProfile.id;
        }
      }
    }

    // SEC-07: Client cannot bypass payment by sending isPaid: true
    const isInstant = false;
    const shortId = (validTargetId || userProfile.id).replace(/-/g, "").slice(0, 8);
    const midtransOrderId = `BTN-PRM-${shortId}-${Date.now().toString().slice(-6)}`;
    const promoItemTitle = `Promosi ${dbPackage?.name || "Unggulan"}`;

    let snapToken = null;
    let redirectUrl = null;

    // Hubungkan ke Midtrans Snap SDK resmi jika server key tersedia
    const midtransConfig = getMidtransConfig();
    if (midtransConfig.isConfigured && !isInstant) {
      try {
        const snap = getSnapClient();
        const snapResponse = await snap.createTransaction({
          transaction_details: {
            order_id: midtransOrderId,
            gross_amount: finalAmount,
          },
          customer_details: {
            first_name: userProfile.fullName || "Penyedia Bantuin",
            email: userProfile.email,
            phone: userProfile.phoneNumber || undefined,
          },
          item_details: [
            {
              id: `ITEM-${shortId}`,
              price: finalAmount,
              quantity: 1,
              name: promoItemTitle.slice(0, 50),
            },
          ],
          credit_card: {
            secure: true,
          },
        });

        if (snapResponse && snapResponse.token) {
          snapToken = snapResponse.token;
          redirectUrl = snapResponse.redirect_url;
        }
      } catch (snapErr) {
        console.warn("[Midtrans Promo Snap Creation Warning]:", snapErr?.message);
      }
    }

    const newPromotion = await prisma.promotion.create({
      data: {
        ownerId: userProfile.id,
        packageId: dbPackage?.id || null,
        targetType: targetType === "rental" ? "rental" : targetType === "store" ? "store" : "service",
        targetId: validTargetId,
        serviceId: validServiceId,
        rentalId: validRentalId,
        reachType: reachType === "all" ? "all" : reachType === "city" ? "city" : "around",
        status: isInstant ? "active" : "draft",
        amount: finalAmount,
        startsAt,
        expiresAt,
        paymentStatus: isInstant ? "PAID" : "PENDING",
        paidAt: isInstant ? new Date() : null,
        midtransOrderId,
        midtransSnapToken: snapToken,
      },
      include: {
        package: true,
        service: {
          select: {
            id: true,
            title: true,
            category: true,
            startingPrice: true,
            portfolioUrls: true,
          },
        },
        rental: {
          select: {
            id: true,
            title: true,
            category: true,
            dailyPrice: true,
          },
        },
        owner: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phoneNumber: true,
          },
        },
      },
    });

    // 4. Create Notification if already active
    if (isInstant) {
      try {
        await prisma.notification.create({
          data: {
            userId: userProfile.id,
            title: "Promosi Berhasil Diaktifkan!",
            message: `Layanan Anda kini aktif dipromosikan selama ${durationDays} hari hingga ${expiresAt.toLocaleDateString("id-ID")}.`,
            type: "order",
            isRead: false,
          },
        });
      } catch {}
    }

    return NextResponse.json({
      success: true,
      message: isInstant ? "Pesanan promosi berhasil diaktifkan." : "Tagihan pembayaran promosi berhasil dibuat.",
      data: {
        ...newPromotion,
        id: newPromotion.id,
        promotionId: newPromotion.id,
        orderId: midtransOrderId,
        midtransOrderId,
        snapToken,
        token: snapToken,
        redirectUrl,
        paymentUrl: redirectUrl,
        amount: Number(newPromotion.amount),
        packageName: newPromotion.package?.name || "Promosi Unggulan",
        targetTitle: newPromotion.service?.title || newPromotion.rental?.title || "Layanan Jasa",
        startDate: newPromotion.startsAt,
        endDate: newPromotion.expiresAt,
        paymentId: midtransOrderId,
      },
    }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/promotions/order error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Gagal membuat pesanan promosi." },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/promotions/order
 * Mengaktifkan pesanan promosi setelah verifikasi pembayaran berhasil
 */
export async function PATCH(req) {
  try {
    const authHeader = req.headers.get("authorization");
    let token = null;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7).trim();
    }
    if (!token) {
      return NextResponse.json({ success: false, error: "Akses ditolak. Silakan login." }, { status: 401 });
    }
    const decoded = verifyAccessToken(token);
    if (!decoded || (!decoded.id && !decoded.email)) {
      return NextResponse.json({ success: false, error: "Sesi otentikasi tidak valid." }, { status: 401 });
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
      return NextResponse.json({ success: false, error: "Profil tidak ditemukan." }, { status: 404 });
    }

    const body = await req.json().catch(() => ({}));
    const { promotionId, orderId } = body;

    let target = await prisma.promotion.findFirst({
      where: {
        OR: [
          ...(promotionId ? [{ id: promotionId }] : []),
          ...(orderId ? [{ midtransOrderId: orderId }] : []),
        ],
      },
      include: { package: true, service: true, rental: true },
    });

    if (!target) {
      return NextResponse.json({ success: false, error: "Pesanan promosi tidak ditemukan." }, { status: 404 });
    }

    // SEC-07: Validasi kepemilikan promosi atau hak Admin
    const isOwner = target.ownerId === userProfile.id;
    const isAdmin = Boolean(userProfile.isAdmin);
    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { success: false, error: "Akses ditolak. Anda bukan pemilik pesanan promosi ini." },
        { status: 403 }
      );
    }

    // SEC-07: Wajib verifikasi pelunasan resmi dari Midtrans Core API atau otorisasi Admin
    if (target.paymentStatus !== "PAID" && !isAdmin) {
      let verifiedSettled = false;
      const candidateOrderId = target.midtransOrderId || orderId;
      if (candidateOrderId && getMidtransConfig().isConfigured) {
        try {
          const core = getCoreApiClient();
          const statusRes = await core.transaction.status(candidateOrderId);
          if (statusRes) {
            const mapped = mapMidtransStatus(statusRes.transaction_status, statusRes.fraud_status);
            if (mapped.isSettled && Math.round(Number(statusRes.gross_amount)) >= Math.round(Number(target.amount))) {
              verifiedSettled = true;
            }
          }
        } catch {}
      }

      if (!verifiedSettled) {
        return NextResponse.json(
          {
            success: false,
            error: "Pembayaran promosi belum terverifikasi lunas di sistem pembayaran resmi. Promosi tidak dapat diaktifkan secara sepihak.",
          },
          { status: 403 }
        );
      }
    }

    const now = new Date();
    const durationDays = target.package?.durationDays || 7;
    const expiresAt = new Date(now.getTime() + durationDays * 86400000);

    const updated = await prisma.promotion.update({
      where: { id: target.id },
      data: {
        status: "active",
        paymentStatus: "PAID",
        paidAt: now,
        startsAt: now,
        expiresAt,
      },
    });

    await prisma.notification.create({
      data: {
        userId: userProfile.id,
        title: "Promosi Berhasil Diaktifkan!",
        message: `Iklan Anda kini aktif selama ${durationDays} hari hingga ${expiresAt.toLocaleDateString("id-ID")}.`,
        type: "order",
        isRead: false,
      },
    }).catch(() => null);

    return NextResponse.json({
      success: true,
      message: "Promosi berhasil diaktifkan.",
      data: updated,
    });
  } catch (err) {
    console.error("[PATCH /api/promotions/order error]:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

