import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedContext, requireAuth } from "@/lib/auth/session";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const q = searchParams.get("q");
    const sort = searchParams.get("sort") || "terbaru";
    const requesterId = searchParams.get("requesterId");
    const mode = searchParams.get("mode");

    const auth = await getAuthenticatedContext(req);
    const viewer = auth?.profile || null;

    const where = {};

    // Filter status: Hanya pemilik (requesterId === viewer.id) atau admin yang boleh melihat semua status milik pemohon.
    // Untuk publik, HANYA tampilkan tugas yang masih mencari penolong dan belum diambil/dibayar.
    if (requesterId) {
      where.requesterId = requesterId;
      const isSelfOrAdmin = Boolean(viewer && (viewer.id === requesterId || viewer.isAdmin));
      if (!isSelfOrAdmin) {
        where.status = { in: ["published", "has_offers"] };
        where.selectedHelperId = null;
        where.requester = { verificationStatus: { not: "suspended" } };
      }
    } else {
      where.status = { in: ["published", "has_offers"] };
      where.selectedHelperId = null;
      where.requester = { verificationStatus: { not: "suspended" } };
    }

    // Filter Kategori
    if (category && category !== "Semua") {
      where.category = { equals: category, mode: "insensitive" };
    }

    // Filter Mode
    if (mode && mode !== "all") {
      where.mode = mode;
    }

    // Filter Pencarian Teks
    if (q && q.trim()) {
      where.OR = [
        { title: { contains: q.trim(), mode: "insensitive" } },
        { description: { contains: q.trim(), mode: "insensitive" } },
        { locationName: { contains: q.trim(), mode: "insensitive" } },
      ];
    }

    // Pengurutan (Sorting)
    let orderBy = { createdAt: "desc" };
    if (sort === "imbalan_tinggi") {
      orderBy = { rewardAmount: "desc" };
    } else if (sort === "imbalan_rendah") {
      orderBy = { rewardAmount: "asc" };
    } else if (sort === "deadline") {
      orderBy = { deadline: "asc" };
    }

    const requests = await prisma.request.findMany({
      where,
      orderBy,
      include: {
        requester: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
            campusName: true,
            ratingAvg: true,
            completedHelpsCount: true,
            verificationStatus: true,
          },
        },
        selectedHelper: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
          },
        },
        offers: {
          select: {
            id: true,
            status: true,
            proposedPrice: true,
            helperId: true,
            helper: {
              select: {
                id: true,
                fullName: true,
                avatarUrl: true,
              },
            },
          },
        },
        bantuinPoint: true,
      },
    });

    // Format output data agar serasi dengan UI frontend
    const formatted = requests.map((item) => {
      return {
        id: item.id,
        requesterId: item.requesterId,
        userName: item.requester?.fullName || "Pengguna Bantuin",
        userRole: item.requester?.campusName || "Pengguna Umum",
        userAvatar: item.requester?.avatarUrl && !item.requester.avatarUrl.includes("images.unsplash.com") ? item.requester.avatarUrl : null,
        userRating: Number(item.requester?.ratingAvg) || 5.0,
        userVerified: item.requester?.verificationStatus === "verified",
        title: item.title,
        description: item.description,
        category: item.category,
        mode: item.mode,
        location: item.locationName,
        locationName: item.locationName,
        latitude: item.latitude,
        longitude: item.longitude,
        bantuinPointId: item.bantuinPointId,
        bantuinPointName: item.bantuinPoint?.name || null,
        isPublicLocation: item.isPublicLocation,
        deadline: item.deadline,
        reward: Number(item.rewardAmount),
        rewardAmount: Number(item.rewardAmount),
        isVoluntary: item.isVoluntary,
        status: item.status,
        selectedHelperId: item.selectedHelperId,
        selectedHelper: item.selectedHelper || null,
        photos: item.attachments || [],
        attachments: item.attachments || [],
        applicantsCount: item.offers?.length || 0,
        offers: item.offers || [],
        createdAt: item.createdAt,
      };
    });

    return NextResponse.json({
      success: true,
      count: formatted.length,
      data: formatted,
    });
  } catch (error) {
    console.error("GET /api/requests Error:", error);
    return NextResponse.json(
      { error: error.message || "Gagal mengambil daftar permintaan bantuan." },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    // Wajib autentikasi JWT & tolak akun suspended (SEC-02 / SEC-03 hardening)
    const auth = await requireAuth(req);
    if (auth.errorResponse) return auth.errorResponse;
    const requesterProfile = auth.profile;

    const body = await req.json();
    const {
      title,
      description,
      category,
      mode = "offline",
      locationName,
      latitude,
      longitude,
      bantuinPointId,
      isPublicLocation = true,
      deadline,
      rewardAmount,
      isVoluntary = false,
      attachments = [],
    } = body;

    if (!title || !title.trim()) {
      return NextResponse.json(
        { error: "Judul kebutuhan tugas wajib diisi." },
        { status: 400 }
      );
    }

    if (!description || !description.trim()) {
      return NextResponse.json(
        { error: "Deskripsi & rincian tugas wajib diisi." },
        { status: 400 }
      );
    }

    const parsedReward = rewardAmount !== undefined && rewardAmount !== null ? Number(rewardAmount) : 0;
    if (Number.isNaN(parsedReward) || parsedReward < 0) {
      return NextResponse.json(
        { error: "Nominal imbalan tidak valid." },
        { status: 400 }
      );
    }

    // Format deadline
    const validDeadline = deadline ? new Date(deadline) : new Date(Date.now() + 24 * 3600 * 1000);

    const newRequest = await prisma.request.create({
      data: {
        requesterId: requesterProfile.id,
        title: title.trim(),
        description: description.trim(),
        category: category || "Kebutuhan Harian & Belanja",
        mode: mode === "online" ? "online" : "offline",
        locationName: locationName || "Lokasi Pengguna",
        latitude: latitude ? Number(latitude) : null,
        longitude: longitude ? Number(longitude) : null,
        bantuinPointId: bantuinPointId || null,
        isPublicLocation: Boolean(isPublicLocation),
        deadline: validDeadline,
        rewardAmount: parsedReward,
        isVoluntary: Boolean(isVoluntary),
        status: "published",
        attachments: Array.isArray(attachments) ? attachments : [],
      },
      include: {
        requester: {
          select: {
            id: true,
            fullName: true,
            email: true,
            avatarUrl: true,
            campusName: true,
            ratingAvg: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Permintaan bantuan berhasil dipublikasikan.",
      data: {
        id: newRequest.id,
        requesterId: newRequest.requesterId,
        title: newRequest.title,
        description: newRequest.description,
        category: newRequest.category,
        mode: newRequest.mode,
        locationName: newRequest.locationName,
        latitude: newRequest.latitude,
        longitude: newRequest.longitude,
        deadline: newRequest.deadline,
        rewardAmount: Number(newRequest.rewardAmount),
        status: newRequest.status,
        attachments: newRequest.attachments,
        createdAt: newRequest.createdAt,
      },
    });
  } catch (error) {
    console.error("POST /api/requests Error:", error);
    return NextResponse.json(
      { error: error.message || "Gagal mempublikasikan permintaan bantuan." },
      { status: 500 }
    );
  }
}
