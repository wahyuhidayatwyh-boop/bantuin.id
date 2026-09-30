import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const q = searchParams.get("q");
    const sort = searchParams.get("sort") || "terbaru";
    const requesterId = searchParams.get("requesterId");
    const mode = searchParams.get("mode");

    const where = {};

    // Filter status: tampilkan yang aktif (published, has_offers, helper_selected, in_progress, awaiting_confirmation)
    if (requesterId) {
      where.requesterId = requesterId;
    } else {
      where.status = { in: ["published", "has_offers", "helper_selected", "in_progress", "awaiting_confirmation"] };
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

    let requests = await prisma.request.findMany({
      where,
      orderBy,
      include: {
        requester: {
          select: {
            id: true,
            fullName: true,
            email: true,
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
            phoneNumber: true,
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

    // Jika database masih benar-benar kosong dan query tanpa filter khusus, auto-seed beberapa data awal
    if (requests.length === 0 && (!category || category === "Semua") && !q && !requesterId) {
      try {
        // Buat atau ambil profile pemohon contoh yang spesifik
        let sarahProfile = await prisma.profile.findUnique({
          where: { email: "sarah.kusuma@ui.ac.id" },
        });
        if (!sarahProfile) {
          sarahProfile = await prisma.profile.create({
            data: {
              email: "sarah.kusuma@ui.ac.id",
              fullName: "Sarah Kusuma",
              campusName: "Pasar Rebo, Jakarta Timur",
              accountRole: "user",
              ratingAvg: 4.95,
              ratingCount: 18,
              completedHelpsCount: 24,
              verificationStatus: "verified",
              avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80",
            },
          });
        }

        let dimasProfile = await prisma.profile.findUnique({
          where: { email: "dimas.pratama@univ.ac.id" },
        });
        if (!dimasProfile) {
          dimasProfile = await prisma.profile.create({
            data: {
              email: "dimas.pratama@univ.ac.id",
              fullName: "Dimas Pratama",
              campusName: "Rawamangun, Jakarta Timur",
              accountRole: "user",
              ratingAvg: 4.88,
              ratingCount: 12,
              completedHelpsCount: 15,
              verificationStatus: "verified",
              avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80",
            },
          });
        }

        let lindaProfile = await prisma.profile.findUnique({
          where: { email: "linda.rahma@mail.com" },
        });
        if (!lindaProfile) {
          lindaProfile = await prisma.profile.create({
            data: {
              email: "linda.rahma@mail.com",
              fullName: "Linda Rahmawati",
              campusName: "Jatinegara, Jakarta Timur",
              accountRole: "user",
              ratingAvg: 5.0,
              ratingCount: 9,
              completedHelpsCount: 10,
              verificationStatus: "verified",
              avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80",
            },
          });
        }

        const sampleSeedData = [
          {
            requesterId: sarahProfile.id,
            title: "Ambil Dokumen Akta Notaris & Pengesahan di Kuningan",
            description: "Tolong ambilkan map dokumen pengesahan notaris di Gedung Menara Kuningan Lantai 8 dan antarkan ke kantor kami. Dokumen sudah disegel rapi, helper hanya perlu tanda terima dan antarkan tepat waktu.",
            category: "Ambil Dokumen",
            mode: "offline",
            locationName: "Gedung Menara Kuningan, Setiabudi, Jakarta Selatan",
            latitude: -6.2241,
            longitude: 106.8294,
            deadline: new Date(Date.now() + 6 * 3600 * 1000),
            rewardAmount: 35000,
            status: "published",
            attachments: ["https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=400&q=80"],
          },
          {
            requesterId: dimasProfile.id,
            title: "Print & Jilid Proposal Tender 120 Halaman Hardcover",
            description: "Butuh print proposal proyek 120 halaman bolak-balik warna jilid hardcover biru donker emas dan antar ke ruang rapat sebelum jam makan siang.",
            category: "Print & Fotokopi",
            mode: "offline",
            locationName: "Percetakan Prima, Rawamangun, Jakarta Timur",
            latitude: -6.1953,
            longitude: 106.8824,
            deadline: new Date(Date.now() + 12 * 3600 * 1000),
            rewardAmount: 60000,
            status: "published",
            attachments: ["https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=400&q=80"],
          },
          {
            requesterId: lindaProfile.id,
            title: "Antar Titip Paket Baju & Perlengkapan ke Laundry Kilat",
            description: "Minta tolong ambil 2 kantong pakaian di lobi apartemen dan antarkan ke laundry express terdekat, kirimkan foto struk timbangan di chat.",
            category: "Antar Barang",
            mode: "offline",
            locationName: "Apartemen Bassura City, Jatinegara, Jakarta Timur",
            latitude: -6.2246,
            longitude: 106.8741,
            deadline: new Date(Date.now() + 18 * 3600 * 1000),
            rewardAmount: 25000,
            status: "published",
            attachments: ["https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?auto=format&fit=crop&w=400&q=80"],
          },
        ];

        for (const s of sampleSeedData) {
          await prisma.request.create({ data: s });
        }

        requests = await prisma.request.findMany({
          where,
          orderBy,
          include: {
            requester: {
              select: {
                id: true,
                fullName: true,
                email: true,
                avatarUrl: true,
                campusName: true,
                ratingAvg: true,
                completedHelpsCount: true,
                verificationStatus: true,
              },
            },
            offers: {
              select: {
                id: true,
                status: true,
                proposedPrice: true,
              },
            },
            bantuinPoint: true,
          },
        });
      } catch (seedErr) {
        console.warn("Auto-seed initial requests error:", seedErr);
      }
    }

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
    const body = await req.json();
    const {
      requesterId,
      userEmail,
      userName,
      userAvatar,
      userCampus,
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

    // Resolusi Profile Pengguna yang Sedang Login
    let validRequesterId = null;

    // 1. Coba cari profile berdasarkan requesterId (jika valid UUID / ID)
    if (requesterId) {
      const pById = await prisma.profile.findUnique({
        where: { id: requesterId },
      });
      if (pById) {
        validRequesterId = pById.id;
        // Update avatar/nama jika dikirim
        if (userName && pById.fullName !== userName) {
          await prisma.profile.update({
            where: { id: pById.id },
            data: {
              fullName: userName,
              avatarUrl: userAvatar || pById.avatarUrl,
              campusName: userCampus || pById.campusName,
            },
          });
        }
      }
    }

    // 2. Jika belum ketemu, cari berdasarkan email login
    if (!validRequesterId && userEmail) {
      const pByEmail = await prisma.profile.findUnique({
        where: { email: userEmail.toLowerCase() },
      });
      if (pByEmail) {
        validRequesterId = pByEmail.id;
        if (userName && pByEmail.fullName !== userName) {
          await prisma.profile.update({
            where: { id: pByEmail.id },
            data: {
              fullName: userName,
              avatarUrl: userAvatar || pByEmail.avatarUrl,
              campusName: userCampus || pByEmail.campusName,
            },
          });
        }
      }
    }

    // 3. Jika akun belum terdaftar di Neon DB, buat profile untuk akun login saat ini
    if (!validRequesterId) {
      const defaultEmail = userEmail ? userEmail.toLowerCase() : `user.${Date.now()}@bantuin.id`;
      const newProfile = await prisma.profile.create({
        data: {
          email: defaultEmail,
          fullName: userName || "Fauzi",
          avatarUrl: userAvatar && !userAvatar.includes("images.unsplash.com") ? userAvatar : null,
          campusName: userCampus || "Pasar Rebo, Jakarta Timur",
          accountRole: "user",
          ratingAvg: 5.0,
          ratingCount: 1,
          completedHelpsCount: 0,
          verificationStatus: "verified",
        },
      });
      validRequesterId = newProfile.id;
    }

    // Format deadline
    const validDeadline = deadline ? new Date(deadline) : new Date(Date.now() + 24 * 3600 * 1000);

    const newRequest = await prisma.request.create({
      data: {
        requesterId: validRequesterId,
        title: title.trim(),
        description: description.trim(),
        category: category || "Ambil Dokumen",
        mode: mode === "online" ? "online" : "offline",
        locationName: locationName || "Lokasi Pengguna",
        latitude: latitude ? Number(latitude) : null,
        longitude: longitude ? Number(longitude) : null,
        bantuinPointId: bantuinPointId || null,
        isPublicLocation: Boolean(isPublicLocation),
        deadline: validDeadline,
        rewardAmount: rewardAmount ? Number(rewardAmount) : 0,
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
