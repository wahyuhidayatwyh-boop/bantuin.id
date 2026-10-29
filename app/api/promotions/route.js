import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/promotions
 * Mengambil seluruh promosi aktif, terbayar (PAID), dan belum kedaluwarsa dari PostgreSQL
 * Digunakan untuk:
 * - Etalase Beranda (PromotedSection)
 * - Carousel & Rekomendasi Katalog Jasa & Sewa
 * - Pencarian Navigasi & Hero
 */
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const targetTypeParam = searchParams.get("type") || searchParams.get("targetType");
    const placement = searchParams.get("placement") || "all";
    const now = new Date();

    // 1. Auto-expire promosi yang telah melewati batas waktu expiresAt
    await prisma.promotion.updateMany({
      where: {
        status: "active",
        expiresAt: { lt: now },
      },
      data: {
        status: "expired",
      },
    });

    // 2. Query promosi aktif dari database
    const targetType =
      targetTypeParam === "jasa"
        ? "service"
        : targetTypeParam === "sewa"
        ? "rental"
        : targetTypeParam;

    const promotions = await prisma.promotion.findMany({
      where: {
        status: "active",
        paymentStatus: "PAID",
        expiresAt: { gt: now },
        ...(targetType && targetType !== "all" ? { targetType } : {}),
      },
      include: {
        package: true,
        service: {
          select: {
            id: true,
            title: true,
            category: true,
            description: true,
            startingPrice: true,
            portfolioUrls: true,
            ratingAvg: true,
            ratingCount: true,
            completedOrders: true,
            locationType: true,
            address: true,
            packages: true,
            provider: {
              select: {
                id: true,
                fullName: true,
                partnerBusinessName: true,
                partnerAddress: true,
                avatarUrl: true,
                verificationStatus: true,
                ratingAvg: true,
                ratingCount: true,
              },
            },
          },
        },
        rental: {
          select: {
            id: true,
            title: true,
            category: true,
            description: true,
            dailyPrice: true,
            depositAmount: true,
            photoUrls: true,
            ratingAvg: true,
            ratingCount: true,
            pickupLocation: true,
            termsAndConditions: true,
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
            owner: {
              select: {
                id: true,
                fullName: true,
                partnerBusinessName: true,
                partnerAddress: true,
                avatarUrl: true,
                verificationStatus: true,
                ratingAvg: true,
                ratingCount: true,
              },
            },
          },
        },
        owner: {
          select: {
            id: true,
            fullName: true,
            partnerBusinessName: true,
            partnerAddress: true,
            avatarUrl: true,
            accountRole: true,
            ratingAvg: true,
            ratingCount: true,
          },
        },
      },
      orderBy: [
        { package: { priority: "desc" } },
        { createdAt: "desc" },
      ],
    });

    // 3. Formatkan ke schema seragam untuk frontend
    const formatted = promotions.map((p) => {
      const isService = p.targetType === "service";
      const isRental = p.targetType === "rental";
      const targetEntity = isService ? p.service : p.rental;
      const ownerEntity = p.owner;

      const targetTitle = targetEntity?.title || (isService ? "Layanan Jasa" : "Unit Sewa");
      const targetCategory = targetEntity?.category || (isService ? "Jasa" : "Sewa");
      const targetPrice = Number(
        isService
          ? p.service?.startingPrice || 0
          : p.rental?.dailyPrice || 0
      );
      const targetImage =
        (isService ? p.service?.portfolioUrls?.[0] : p.rental?.photoUrls?.[0]) ||
        "/logotab.png";
      const rawLocation =
        (isService ? p.service?.address : p.rental?.pickupLocation) ||
        ownerEntity?.partnerAddress ||
        "Kab. Banyumas";
      const targetLocation =
        rawLocation.toLowerCase().includes("banyumas") ||
        rawLocation.toLowerCase().includes("purwokerto") ||
        rawLocation.toLowerCase().includes("jakarta") ||
        rawLocation.toLowerCase().includes("bandung") ||
        rawLocation.toLowerCase().includes("surabaya")
          ? rawLocation
          : `${rawLocation}, Kab. Banyumas`;

      const resolvedOwnerName = isRental
        ? (p.rental?.owner?.partnerBusinessName || ownerEntity?.partnerBusinessName || ownerEntity?.fullName || "Mitra Rental")
        : (p.service?.provider?.partnerBusinessName || ownerEntity?.partnerBusinessName || ownerEntity?.fullName || "Mitra Jasa");

      const completedCount = isService
        ? Number(p.service?.completedOrders || 0)
        : Number(p.rental?._count?.bookings || 0);

      // Resolusi rating dan ulasan seragam antar card etalase
      const ratingVal = isService
        ? Number(p.service?.provider?.ratingAvg ?? targetEntity?.ratingAvg ?? ownerEntity?.ratingAvg ?? 5.0)
        : Number(p.rental?.owner?.ratingAvg ?? targetEntity?.ratingAvg ?? ownerEntity?.ratingAvg ?? 5.0);

      const reviewsVal = isService
        ? Math.max(Number(targetEntity?.ratingCount || 0), Number(p.service?.provider?.ratingCount || 0), Number(ownerEntity?.ratingCount || 0))
        : Math.max(Number(targetEntity?.ratingCount || 0), Number(p.rental?.owner?.ratingCount || 0), Number(ownerEntity?.ratingCount || 0));

      // Resolusi satuan tarif / unit dan estimasi durasi
      let resolvedUnit = isRental ? "/ hari" : "/ proyek";
      let resolvedDuration = "1-2 Hari Kerja";
      if (isRental && p.rental?.termsAndConditions) {
        try {
          const parsed = typeof p.rental.termsAndConditions === "string" ? JSON.parse(p.rental.termsAndConditions) : p.rental.termsAndConditions;
          if (parsed?.unit) resolvedUnit = parsed.unit;
        } catch (_) {}
      } else if (isService && Array.isArray(p.service?.packages) && p.service.packages.length > 0) {
        resolvedUnit = p.service.packages[0]?.unit || "/ proyek";
        resolvedDuration = p.service.packages[0]?.duration || "1-2 Hari Kerja";
      }

      return {
        id: p.id,
        promoId: p.id,
        targetId: p.targetId || p.serviceId || p.rentalId,
        targetType: p.targetType,
        targetTitle,
        title: targetTitle,
        targetCategory,
        category: targetCategory,
        targetPrice,
        price: targetPrice,
        unit: resolvedUnit,
        deliveryDuration: resolvedDuration,
        targetImage,
        image: targetImage,
        targetLocation,
        location: targetLocation,
        city: "Kab. Banyumas",
        ownerId: p.ownerId,
        ownerName: resolvedOwnerName,
        ownerAvatar: ownerEntity?.avatarUrl || "/logotab.png",
        ownerType: ownerEntity?.accountRole || (isService ? "provider" : "partner"),
        packageId: p.packageId,
        packageName: p.package?.name || "Promosi Unggulan",
        packageTitle: p.package?.name || "Promosi Unggulan",
        priority: p.package?.priority || 1,
        placements: p.package?.placements || ["landing", "katalog", "search"],
        rating: ratingVal,
        ratingAvg: ratingVal,
        reviewCount: reviewsVal,
        ratingCount: reviewsVal,
        completedCount,
        completedOrders: completedCount,
        completedRentals: completedCount,
        totalRentedCount: completedCount,
        status: p.status,
        paymentStatus: "paid",
        startDate: p.startsAt,
        endDate: p.expiresAt,
        amount: Number(p.amount),
        viewsCount: p.viewsCount || 0,
        clicksCount: p.clicksCount || 0,
        reachType: p.reachType,
        isPromoted: true,
        desc: targetEntity?.description || "",
        description: targetEntity?.description || "",
      };
    });

    // 4. Filter by placement if specified (e.g. landing page slot check)
    let filtered = formatted;
    if (placement !== "all") {
      filtered = formatted.filter((item) => {
        const allowed = item.placements || ["landing", "katalog", "search"];
        return allowed.includes(placement) || 
          ((placement === "jasa" || placement === "sewa") && allowed.includes("katalog"));
      });
    }

    return NextResponse.json({
      success: true,
      data: filtered,
      total: filtered.length,
    });
  } catch (err) {
    console.error("[GET /api/promotions error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Gagal memuat promosi aktif." },
      { status: 500 }
    );
  }
}
