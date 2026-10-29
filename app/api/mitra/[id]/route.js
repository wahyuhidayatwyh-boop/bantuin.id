import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getMitraStoreById, getAllMitraStores } from "@/lib/mock/mitraData";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * GET /api/mitra/[id]
 * Task 71: Profil publik toko mitra rental, jam operasional, galeri, & katalog lengkap (/mitra/[id])
 */
export async function GET(req, { params }) {
  try {
    const rawId = (await params)?.id;
    if (!rawId) {
      return NextResponse.json({ success: false, error: "ID toko mitra wajib diberikan." }, { status: 400 });
    }

    const id = decodeURIComponent(rawId).trim();

    // 1. Query Mitra Profile dari database
    let profile = null;

    if (UUID_REGEX.test(id)) {
      try {
        profile = await prisma.profile.findUnique({
          where: { id },
          select: {
            id: true,
            fullName: true,
            email: true,
            phoneNumber: true,
            avatarUrl: true,
            bio: true,
            campusName: true,
            accountRole: true,
            isPartner: true,
            partnerBusinessName: true,
            partnerAddress: true,
            isAcceptingRentals: true,
            requirePhysicalId: true,
            securityDepositPolicy: true,
            bannerUrl: true,
            portfolioPhotos: true,
            verificationStatus: true,
            ratingAvg: true,
            ratingCount: true,
            completedHelpsCount: true,
            reliabilityScore: true,
            responseTimeMinutes: true,
            createdAt: true,
          },
        });
      } catch (err) {
        console.warn("Prisma profile lookup by UUID in mitra route error:", err.message);
      }
    }

    // Jika belum ketemu atau bukan UUID, cari berdasarkan fullName, partnerBusinessName, atau email (mendukung format slug dengan tanda hubung)
    if (!profile) {
      try {
        const decodedName = id.replace(/-/g, " ");
        profile = await prisma.profile.findFirst({
          where: {
            OR: [
              { fullName: { equals: id, mode: "insensitive" } },
              { partnerBusinessName: { equals: id, mode: "insensitive" } },
              { email: { equals: id, mode: "insensitive" } },
              { fullName: { equals: decodedName, mode: "insensitive" } },
              { partnerBusinessName: { equals: decodedName, mode: "insensitive" } },
            ],
          },
          select: {
            id: true,
            fullName: true,
            email: true,
            phoneNumber: true,
            avatarUrl: true,
            bio: true,
            campusName: true,
            accountRole: true,
            isPartner: true,
            partnerBusinessName: true,
            partnerAddress: true,
            isAcceptingRentals: true,
            requirePhysicalId: true,
            securityDepositPolicy: true,
            bannerUrl: true,
            portfolioPhotos: true,
            verificationStatus: true,
            ratingAvg: true,
            ratingCount: true,
            completedHelpsCount: true,
            reliabilityScore: true,
            responseTimeMinutes: true,
            createdAt: true,
          },
        });
      } catch (err) {
        console.warn("Prisma profile lookup by name in mitra route error:", err.message);
      }
    }

    // Jika ditemukan di database
    if (profile) {
      // 2. Fetch Catalog of Rentals
      let rentals = [];
      try {
        rentals = await prisma.rental.findMany({
          where: { ownerId: profile.id },
          orderBy: { createdAt: "desc" },
        });
      } catch (rErr) {
        console.warn("Prisma rental fetch warning:", rErr.message);
      }

      // 3. Fetch Reviews Received
      let reviews = [];
      try {
        reviews = await prisma.review.findMany({
          where: {
            revieweeId: profile.id,
            transactionType: "rental",
          },
          include: {
            reviewer: {
              select: {
                id: true,
                fullName: true,
                avatarUrl: true,
                campusName: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 20,
        });
      } catch (revErr) {
        console.warn("Prisma review fetch warning:", revErr.message);
      }

      const totalCompletedOrders = Number(profile.completedHelpsCount || 0);

      const formattedPortfolioPhotos = Array.isArray(profile.portfolioPhotos)
        ? profile.portfolioPhotos
        : (profile.portfolioPhotos && typeof profile.portfolioPhotos === "object"
          ? [profile.portfolioPhotos]
          : []);

      return NextResponse.json({
        success: true,
        data: {
          store: {
            ...profile,
            id: profile.id,
            name: profile.partnerBusinessName || profile.fullName || "Toko Mitra",
            businessName: profile.partnerBusinessName || profile.fullName || "Toko Mitra",
            tagline: profile.bio || "Penyedia Rental Resmi Bantuin",
            address: profile.partnerAddress || profile.campusName || "Indonesia",
            category: "Rental & Sewa",
            badge: profile.verificationStatus === "verified" ? "Mitra Rental Terverifikasi" : (profile.verificationStatus === "pending_review" ? "Menunggu Verifikasi" : "Mitra Rental"),
            avatar: profile.avatarUrl,
            coverImage: profile.bannerUrl,
            rating: Number(profile.ratingAvg || 5.0),
            ratingAvg: Number(profile.ratingAvg || 5.0),
            reviewsCount: Number(profile.ratingCount || reviews.length || 0),
            reviewCount: Number(profile.ratingCount || reviews.length || 0),
            reliabilityScore: profile.reliabilityScore || 100,
            completedOrders: totalCompletedOrders,
            responseTime: `${profile.responseTimeMinutes || 15} Menit`,
            joinedYear: profile.createdAt ? new Date(profile.createdAt).getFullYear() : 2026,
            operationalHours: "Setiap Hari, 08:00 - 21:00 WIB",
            securityDepositPolicy: profile.securityDepositPolicy || "Wajib menunjukkan identitas fisik (KTP/KTM) dan menyelesaikan pembayaran escrow Bantuin sebelum serah terima unit.",
            portfolioPhotos: formattedPortfolioPhotos,
            gallery: formattedPortfolioPhotos,
          },
          rentals: rentals.map((r) => ({
            ...r,
            dailyPrice: Number(r.dailyPrice || 0),
            depositAmount: Number(r.depositAmount || 0),
            ratingAvg: Number(r.ratingAvg || 5.0),
            ratingCount: Number(r.ratingCount || 0),
            isAvailable: Boolean(r.isAvailable),
          })),
          reviews: reviews.map((rev) => ({
            id: rev.id,
            rating: rev.rating,
            comment: rev.comment,
            createdAt: rev.createdAt,
            date: new Date(rev.createdAt).toLocaleDateString("id-ID"),
            rentalTitle: rev.rentalTitle || rev.orderTitle || "Unit Sewa",
            item: rev.rentalTitle || rev.orderTitle || "Unit Sewa",
            userName: rev.reviewer?.fullName || "Pelanggan Bantuin",
            userAvatar: rev.reviewer?.avatarUrl || "/logotab.png",
            avatar: rev.reviewer?.avatarUrl || "/logotab.png",
            reviewer: rev.reviewer,
          })),
          stats: {
            totalCatalogItems: rentals.length,
            availableItems: rentals.filter((r) => r.isAvailable).length,
            totalReviews: reviews.length,
          },
        },
      });
    }

    // 2. Fallback jika tidak ada di DB, cari di Mock Data mitraData
    const mockStore = getMitraStoreById(id) || getAllMitraStores().find(s => s.name?.toLowerCase() === id.toLowerCase() || s.id?.toLowerCase() === id.toLowerCase());
    if (mockStore) {
      return NextResponse.json({
        success: true,
        data: {
          store: {
            id: mockStore.id,
            fullName: mockStore.name,
            partnerBusinessName: mockStore.name,
            name: mockStore.name,
            businessName: mockStore.name,
            tagline: mockStore.tagline || mockStore.description || "Penyedia Rental Resmi Bantuin",
            category: mockStore.category || "Rental & Sewa",
            badge: mockStore.badge || "Mitra Rental Terverifikasi",
            avatarUrl: mockStore.avatar,
            avatar: mockStore.avatar,
            bannerUrl: mockStore.coverImage,
            coverImage: mockStore.coverImage,
            address: mockStore.address || "Indonesia",
            partnerAddress: mockStore.address,
            verificationStatus: "verified",
            rating: mockStore.rating || 5.0,
            ratingAvg: mockStore.rating || 5.0,
            reviewsCount: mockStore.reviewsCount || (mockStore.reviews ? mockStore.reviews.length : 0),
            reviewCount: mockStore.reviewsCount || (mockStore.reviews ? mockStore.reviews.length : 0),
            reliabilityScore: mockStore.reliabilityScore || 100,
            completedOrders: mockStore.completedRentals || 50,
            responseTime: mockStore.responseTime || "15 Menit",
            joinedYear: mockStore.joinedYear || 2024,
            operationalHours: mockStore.operationalHours || "Setiap Hari, 08:00 - 21:00 WIB",
            securityDepositPolicy: mockStore.securityDepositPolicy || "Wajib menunjukkan identitas fisik (KTP/KTM) dan menyelesaikan pembayaran escrow Bantuin sebelum serah terima unit.",
          },
          rentals: (mockStore.products || mockStore.catalog || []).map((p) => ({
            id: p.id,
            ownerId: mockStore.id,
            title: p.name || p.title,
            category: p.category || "Rental & Sewa",
            dailyPrice: Number(p.price || p.dailyPrice || p.pricePerDay || 0),
            depositAmount: Number(p.depositAmount || 0),
            photoUrls: p.photos || (p.photoUrl ? [p.photoUrl] : (p.image ? [p.image] : [])),
            isAvailable: p.stockStatus === "Siap Sewa" || p.isAvailable !== false,
            ratingAvg: Number(p.rating || 5.0),
            ratingCount: Number(p.reviews || 0),
            description: p.desc || p.description || "",
            pickupLocation: mockStore.address || "Indonesia",
          })),
          reviews: (mockStore.reviews || []).map((rev) => ({
            id: rev.id,
            reviewer: {
              fullName: rev.userName || rev.renterName || "Pelanggan Bantuin",
              avatarUrl: rev.avatar || rev.userAvatar || null,
            },
            rating: rev.rating || 5,
            comment: rev.comment || "Unit sangat memuaskan!",
            createdAt: rev.date || new Date().toISOString(),
          })),
          stats: {
            totalCatalogItems: (mockStore.products || mockStore.catalog || []).length,
            availableItems: (mockStore.products || mockStore.catalog || []).length,
            totalReviews: (mockStore.reviews || []).length,
          },
        },
      });
    }

    return NextResponse.json(
      { success: false, error: "Toko mitra rental tidak ditemukan." },
      { status: 404 }
    );
  } catch (err) {
    console.error("[GET /api/mitra/[id] error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Gagal mengambil profil toko mitra." },
      { status: 500 }
    );
  }
}
