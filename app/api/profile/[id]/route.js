import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedContext } from "@/lib/auth/session";
import { 
  INITIAL_USER, 
  INITIAL_HELPERS, 
  INITIAL_SERVICES, 
  INITIAL_RENTALS, 
  INITIAL_REQUESTS 
} from "@/lib/mock/mockData";
import { getAllProviders, getProviderById } from "@/lib/mock/providersData";
import { getAllMitraStores, getMitraStoreById } from "@/lib/mock/mitraData";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(req, { params }) {
  try {
    const rawId = (await params)?.id;
    if (!rawId) {
      return NextResponse.json({ success: false, error: "ID profil wajib diberikan." }, { status: 400 });
    }

    const id = decodeURIComponent(rawId).trim();

    // 1. Coba cari di PostgreSQL via Prisma
    let dbProfile = null;
    if (UUID_REGEX.test(id)) {
      try {
        dbProfile = await prisma.profile.findUnique({
          where: { id },
          include: {
            services: {
              orderBy: { createdAt: "desc" },
            },
            rentals: {
              orderBy: { createdAt: "desc" },
            },
            requestsCreated: {
              where: {
                status: { in: ["published", "has_offers"] },
                selectedHelperId: null,
              },
              orderBy: { createdAt: "desc" },
              take: 10,
            },
            requestsHelped: {
              where: { status: { in: ["in_progress", "completed"] } },
              orderBy: { createdAt: "desc" },
              take: 10,
            },
            reviewsReceived: {
              include: {
                reviewer: {
                  select: { id: true, fullName: true, avatarUrl: true, campusName: true },
                },
              },
              orderBy: { createdAt: "desc" },
              take: 15,
            },
          },
        });
      } catch (err) {
        console.warn("Prisma profile lookup by UUID warning:", err.message);
      }
    }

    if (!dbProfile) {
      // Coba cari by email jika formatnya email
      if (id.includes("@")) {
        try {
          dbProfile = await prisma.profile.findFirst({
            where: { email: { equals: id, mode: "insensitive" } },
            include: {
              services: { orderBy: { createdAt: "desc" } },
              rentals: { orderBy: { createdAt: "desc" } },
              requestsCreated: {
                where: {
                  status: { in: ["published", "has_offers"] },
                  selectedHelperId: null,
                },
                orderBy: { createdAt: "desc" },
                take: 10,
              },
              requestsHelped: { orderBy: { createdAt: "desc" }, take: 10 },
              reviewsReceived: {
                include: { reviewer: { select: { id: true, fullName: true, avatarUrl: true, campusName: true } } },
                orderBy: { createdAt: "desc" },
                take: 15,
              },
            },
          });
        } catch (err) {
          console.warn("Prisma profile lookup by email warning:", err.message);
        }
      }
    }

    // Coba cari by nama lengkap (misal klik dari kartu dengan nama)
    if (!dbProfile) {
      try {
        dbProfile = await prisma.profile.findFirst({
          where: { fullName: { equals: id, mode: "insensitive" } },
          include: {
            services: { orderBy: { createdAt: "desc" } },
            rentals: { orderBy: { createdAt: "desc" } },
            requestsCreated: {
              where: {
                status: { in: ["published", "has_offers"] },
                selectedHelperId: null,
              },
              orderBy: { createdAt: "desc" },
              take: 10,
            },
            requestsHelped: { orderBy: { createdAt: "desc" }, take: 10 },
            reviewsReceived: {
              include: { reviewer: { select: { id: true, fullName: true, avatarUrl: true, campusName: true } } },
              orderBy: { createdAt: "desc" },
              take: 15,
            },
          },
        });
      } catch (err) {
        console.warn("Prisma profile lookup by fullName warning:", err.message);
      }
    }

    // Jika ditemukan di database
    if (dbProfile) {
      // Look up transaction names for reviews
      const transactionIds = (dbProfile.reviewsReceived || []).map((r) => r.transactionId).filter(Boolean);
      let orderMap = new Map();
      if (transactionIds.length > 0) {
        try {
          const orderRooms = await prisma.orderRoom.findMany({
            where: { id: { in: transactionIds } },
            include: { request: { select: { title: true } } },
          });
          orderMap = new Map(orderRooms.map((o) => [o.id, o.request?.title || o.orderTitle || "Layanan Jasa"]));
        } catch (_) {}
      }

      const formattedReviews = (dbProfile.reviewsReceived || []).map((rv) => {
        const orderTitle = orderMap.get(rv.transactionId) || "Layanan Jasa";
        const cleanPkgName = orderTitle.replace(/^Pemesanan Jasa:\s*/i, "").trim() || "Layanan Jasa";
        const reviewerName = rv.reviewer?.fullName || "Pelanggan Terverifikasi";
        const reviewerAvatar = rv.reviewer?.avatarUrl || null;
        const dateFormatted = rv.createdAt
          ? new Date(rv.createdAt).toLocaleDateString("id-ID", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })
          : "Baru saja";

        return {
          id: rv.id,
          userName: reviewerName,
          userAvatar: reviewerAvatar,
          reviewerName,
          reviewerAvatar,
          rating: Number(rv.rating || 5),
          comment: rv.comment || "Layanan memuaskan!",
          packageName: cleanPkgName,
          serviceTitle: cleanPkgName,
          date: dateFormatted,
          tags: rv.tags || [],
          createdAt: rv.createdAt,
          reviewer: {
            id: rv.reviewer?.id,
            fullName: reviewerName,
            avatarUrl: reviewerAvatar,
            campusName: rv.reviewer?.campusName,
          },
        };
      });

      // Hitung real completed orders
      let completedOrderRoomsCount = 0;
      try {
        completedOrderRoomsCount = await prisma.orderRoom.count({
          where: { helperId: dbProfile.id, orderStatus: "completed" },
        });
      } catch (_) {}

      const realCompletedJobs = Math.max(
        completedOrderRoomsCount,
        Number(dbProfile.completedHelpsCount || 0),
        (dbProfile.services || []).reduce((sum, s) => sum + (s.completedOrders || 0), 0)
      );

      const realRatingAvg = dbProfile.ratingAvg !== null && dbProfile.ratingAvg !== undefined
        ? Number(dbProfile.ratingAvg)
        : (formattedReviews.length > 0
            ? Number((formattedReviews.reduce((sum, r) => sum + r.rating, 0) / formattedReviews.length).toFixed(1))
            : 0);

      const realRatingCount = Math.max(Number(dbProfile.ratingCount || 0), formattedReviews.length);

      const auth = await getAuthenticatedContext(req);
      const viewer = auth?.profile || null;
      const isSelfOrAdmin = Boolean(viewer && (viewer.id === dbProfile.id || viewer.isAdmin));

      const formattedProfile = {
        id: dbProfile.id,
        fullName: dbProfile.fullName || "Pengguna Bantuin",
        ...(isSelfOrAdmin
          ? {
              email: dbProfile.email,
              phoneNumber: dbProfile.phoneNumber || null,
            }
          : {}),
        avatarUrl: dbProfile.avatarUrl || null,
        bio: dbProfile.bio || "",
        campusName: dbProfile.campusName || "",
        accountRole: dbProfile.accountRole || (dbProfile.isPartner ? "partner" : "user"),
        isPartner: dbProfile.isPartner || false,
        partnerBusinessName: dbProfile.partnerBusinessName || "",
        brandTitle: dbProfile.partnerBusinessName || "",
        partnerAddress: dbProfile.partnerAddress || null,
        bannerUrl: dbProfile.bannerUrl || null,
        coverBanner: dbProfile.bannerUrl || null,
        portfolioPhotos: Array.isArray(dbProfile.portfolioPhotos) ? dbProfile.portfolioPhotos : [],
        packages: Array.isArray(dbProfile.packages) ? dbProfile.packages : [],
        skills: Array.isArray(dbProfile.skills) ? dbProfile.skills : [],
        verificationStatus: dbProfile.verificationStatus || "verified",
        ratingAvg: realRatingAvg,
        ratingCount: realRatingCount,
        completedHelpsCount: realCompletedJobs,
        completedJobs: realCompletedJobs,
        reliabilityScore: dbProfile.reliabilityScore || 99,
        responseTimeMinutes: dbProfile.responseTimeMinutes || 10,
        joinedAt: dbProfile.createdAt ? new Date(dbProfile.createdAt).toLocaleDateString("id-ID", { month: "long", year: "numeric" }) : "Januari 2026",
        services: (dbProfile.services || []).map((s) => ({
          id: s.id,
          title: s.title,
          description: s.description || "",
          category: s.category,
          price: Number(s.startingPrice || 0),
          startingPrice: Number(s.startingPrice || 0),
          ratingAvg: Number(s.ratingAvg !== undefined && s.ratingAvg !== null ? s.ratingAvg : realRatingAvg),
          ratingCount: s.ratingCount || 0,
          completedOrders: s.completedOrders || 0,
          portfolioUrls: s.portfolioUrls || [],
          imageUrl: s.portfolioUrls?.[0] || null,
          coverImage: s.portfolioUrls?.[0] || null,
          tags: s.tags || [],
        })),
        rentals: (dbProfile.rentals || []).map((r) => ({
          id: r.id,
          title: r.title,
          category: r.category,
          dailyPrice: Number(r.dailyPrice || 0),
          pricePerDay: Number(r.dailyPrice || 0),
          depositAmount: Number(r.depositAmount || 0),
          ratingAvg: Number(r.ratingAvg || 5.0),
          ratingCount: r.ratingCount || 0,
          photoUrl: r.photoUrls?.[0] || "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&auto=format&fit=crop&q=80",
          pickupLocation: r.pickupLocation,
        })),
        requests: (dbProfile.requestsCreated || []).map((rq) => ({
          id: rq.id,
          title: rq.title,
          category: rq.category,
          mode: rq.mode,
          rewardAmount: Number(rq.rewardAmount || 0),
          status: rq.status,
          locationName: rq.locationName,
          deadline: rq.deadline,
          selectedHelperId: rq.selectedHelperId || null,
        })),
        helpedRequests: (dbProfile.requestsHelped || []).map((rq) => ({
          id: rq.id,
          title: rq.title,
          category: rq.category,
          mode: rq.mode,
          rewardAmount: Number(rq.rewardAmount || 0),
          status: rq.status,
          locationName: rq.locationName,
          deadline: rq.deadline,
        })),
        reviews: formattedReviews,
      };

      return NextResponse.json({ success: true, profile: formattedProfile });
    }

    // 2. Jika tidak ada di DB, cari di Mock Data (Jasa, Sewa, Helper, atau User)
    // A. Mock Provider dari providersData
    const mockProvider = getProviderById(id);
    if (mockProvider) {
      const mockServices = (INITIAL_SERVICES || []).filter(
        (s) => s.providerId === mockProvider.id || s.providerName === mockProvider.name || s.id === mockProvider.id
      );

      return NextResponse.json({
        success: true,
        profile: {
          id: mockProvider.id,
          fullName: mockProvider.name,
          email: `${mockProvider.id}@bantuinaja.id`,
          avatarUrl: mockProvider.avatar,
          coverBanner: mockProvider.coverBanner || null,
          bio: mockProvider.bio || mockProvider.brandTitle || "Penyedia Jasa Terverifikasi di platform Bantuin.id.",
          campusName: mockProvider.city || mockProvider.location || "Jakarta Selatan",
          accountRole: "provider",
          isPartner: true,
          verificationStatus: "verified",
          ratingAvg: mockProvider.rating || 4.95,
          ratingCount: mockProvider.reviewsCount || 42,
          completedHelpsCount: mockProvider.completedJobs || 58,
          reliabilityScore: 99,
          responseTimeMinutes: 10,
          joinedAt: mockProvider.joinedYear || "2024",
          services: mockServices.length > 0 ? mockServices : [
            {
              id: `srv-${mockProvider.id}`,
              title: mockProvider.brandTitle || "Layanan Profesional Terverifikasi",
              category: mockProvider.category || "Jasa Profesional",
              price: 150000,
              startingPrice: 150000,
              ratingAvg: mockProvider.rating || 4.95,
              ratingCount: mockProvider.reviewsCount || 42,
              completedOrders: mockProvider.completedJobs || 58,
              coverImage: mockProvider.avatar || "/logotab.png",
              tags: mockProvider.specialties || ["Profesional", "Cepat", "Terpercaya"],
            }
          ],
          rentals: [],
          requests: [],
          reviews: (mockProvider.reviews || []).map((r, i) => ({
            id: `rev-${i}`,
            reviewerName: r.clientName || r.reviewerName || "Klien Bantuin",
            reviewerAvatar: r.clientAvatar || null,
            rating: r.rating || 5,
            comment: r.comment || "Pelayanan sangat profesional, cepat, dan memuaskan!",
            tags: r.tags || ["Cepat", "Ramah"],
            createdAt: r.date || "1 minggu lalu",
          })),
        },
      });
    }

    // B. Mock Mitra Sewa dari mitraData
    const mockMitra = getMitraStoreById(id);
    if (mockMitra) {
      const mockRentals = (INITIAL_RENTALS || []).filter(
        (r) => r.owner?.id === mockMitra.id || r.ownerName === mockMitra.name || r.id === mockMitra.id
      );

      return NextResponse.json({
        success: true,
        profile: {
          id: mockMitra.id,
          fullName: mockMitra.name,
          email: `${mockMitra.id}@bantuinaja.id`,
          avatarUrl: mockMitra.avatar,
          coverBanner: mockMitra.coverImage || null,
          bio: mockMitra.description || "Mitra Resmi Rental Alat & Perlengkapan Terverifikasi Bantuin.id.",
          campusName: mockMitra.address || mockMitra.city || "Depok, Jawa Barat",
          accountRole: "partner",
          isPartner: true,
          partnerBusinessName: mockMitra.name,
          partnerAddress: mockMitra.address,
          verificationStatus: "verified",
          ratingAvg: mockMitra.rating || 4.96,
          ratingCount: mockMitra.reviewsCount || 68,
          completedHelpsCount: mockMitra.completedRentals || 120,
          reliabilityScore: 100,
          responseTimeMinutes: 5,
          joinedAt: mockMitra.joinedYear || "2024",
          services: [],
          rentals: mockRentals.length > 0 ? mockRentals : (mockMitra.products || []).map((p) => ({
            id: p.id,
            title: p.name || p.title,
            category: p.category || "Elektronik & Alat",
            dailyPrice: p.pricePerDay || p.dailyPrice || 100000,
            pricePerDay: p.pricePerDay || p.dailyPrice || 100000,
            depositAmount: p.depositAmount || 150000,
            ratingAvg: p.rating || 5.0,
            ratingCount: 15,
            photoUrl: p.photoUrl || p.photos?.[0] || mockMitra.avatar,
            pickupLocation: mockMitra.address,
          })),
          requests: [],
          reviews: (mockMitra.reviews || []).map((r, i) => ({
            id: `rev-mitra-${i}`,
            reviewerName: r.renterName || r.reviewerName || "Penyewa Bantuin",
            reviewerAvatar: r.renterAvatar || null,
            rating: r.rating || 5,
            comment: r.comment || "Alat sangat bersih, baterai terisi penuh, dan pemilik sangat ramah!",
            tags: ["Peralatan Bagus", "Tepat Waktu"],
            createdAt: r.date || "Baru saja",
          })),
        },
      });
    }

    // C. Mock Helper dari INITIAL_HELPERS
    const mockHelper = (INITIAL_HELPERS || []).find((h) => h.id === id || h.name?.toLowerCase() === id.toLowerCase());
    if (mockHelper) {
      return NextResponse.json({
        success: true,
        profile: {
          id: mockHelper.id,
          fullName: mockHelper.name,
          email: `${mockHelper.id}@bantuinaja.id`,
          avatarUrl: mockHelper.avatar,
          bio: mockHelper.bio || "Helper aktif siap membantu tugas harian, antar barang, dan kebutuhan kampus.",
          campusName: mockHelper.campus || "Banjarmasin Tengah",
          accountRole: "helper",
          isPartner: false,
          verificationStatus: "verified",
          ratingAvg: mockHelper.rating || 4.9,
          ratingCount: mockHelper.completedHelps || 24,
          completedHelpsCount: mockHelper.completedHelps || 24,
          reliabilityScore: mockHelper.reliability || 98,
          responseTimeMinutes: 10,
          joinedAt: "Januari 2025",
          services: [],
          rentals: [],
          requests: [],
          reviews: [
            {
              id: "rev-h-1",
              reviewerName: "Siti Rahmawati",
              reviewerAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80",
              rating: 5,
              comment: "Helper sangat cepat dan amanah, barang sampai tanpa lecet sedikitpun!",
              tags: ["Cepat", "Amanah"],
              createdAt: "2 hari lalu",
            }
          ],
        },
      });
    }

    // D. Mock Current User
    if (id === INITIAL_USER.id || id === "current-user" || id === "user-current-01") {
      return NextResponse.json({
        success: true,
        profile: {
          id: INITIAL_USER.id,
          fullName: INITIAL_USER.fullName,
          email: INITIAL_USER.email,
          avatarUrl: INITIAL_USER.avatarUrl,
          bio: INITIAL_USER.bio,
          campusName: INITIAL_USER.campusName,
          accountRole: INITIAL_USER.role || "user",
          isPartner: INITIAL_USER.isPartner,
          verificationStatus: "verified",
          ratingAvg: INITIAL_USER.ratingAvg,
          ratingCount: INITIAL_USER.ratingCount,
          completedHelpsCount: INITIAL_USER.completedHelpsCount,
          reliabilityScore: INITIAL_USER.reliabilityScore,
          responseTimeMinutes: INITIAL_USER.responseTimeMinutes,
          joinedAt: "Januari 2025",
          services: [],
          rentals: [],
          requests: [],
          reviews: [],
        },
      });
    }

    // E. Fallback generic profile (agar tidak 404 ketika user mengklik nama/id apapun)
    const displayName = id.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    return NextResponse.json({
      success: true,
      profile: {
        id: id,
        fullName: displayName || "Pengguna Bantuin",
        email: `${id}@bantuinaja.id`,
        avatarUrl: null,
        bio: `Pengguna aktif terverifikasi di komunitas Bantuin.id.`,
        campusName: "Banjarmasin, Kalimantan Selatan",
        accountRole: "user",
        isPartner: false,
        verificationStatus: "verified",
        ratingAvg: 4.95,
        ratingCount: 18,
        completedHelpsCount: 22,
        reliabilityScore: 98,
        responseTimeMinutes: 15,
        joinedAt: "2025",
        services: [],
        rentals: [],
        requests: [],
        reviews: [
          {
            id: `rev-fallback-${id}`,
            reviewerName: "Budi Santoso",
            reviewerAvatar: null,
            rating: 5,
            comment: "Orangnya komunikatif, tepat waktu, dan sangat membantu!",
            tags: ["Tepat Waktu", "Komunikatif"],
            createdAt: "3 hari lalu",
          }
        ],
      },
    });
  } catch (error) {
    console.error("GET /api/profile/[id] Error:", error);
    return NextResponse.json({ success: false, error: "Gagal memuat profil pengguna." }, { status: 500 });
  }
}
