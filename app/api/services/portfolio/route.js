import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth/jwt";

/**
 * POST /api/services/portfolio
 * Task 66: Menambahkan karya portofolio baru oleh Provider
 * 
 * Rules:
 * 1. Strict JWT Authentication.
 * 2. Provider must own the specified serviceId.
 * 3. Appends portfolioUrl to service's portfolioUrls array.
 */
export async function POST(req) {
  try {
    // 1. Auth check
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

    // 2. Parse Body
    const body = await req.json().catch(() => ({}));
    const { serviceId, portfolioUrl } = body;

    if (!serviceId || !portfolioUrl) {
      return NextResponse.json(
        { success: false, error: "Parameter 'serviceId' dan 'portfolioUrl' wajib disertakan." },
        { status: 400 }
      );
    }

    // 3. Find Service
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
    });

    if (!service) {
      return NextResponse.json(
        { success: false, error: "Layanan jasa tidak ditemukan." },
        { status: 404 }
      );
    }

    if (service.providerId !== userProfile.id && !userProfile.isAdmin) {
      return NextResponse.json(
        { success: false, error: "Akses ditolak. Anda bukan pemilik dari layanan jasa ini." },
        { status: 403 }
      );
    }

    // 4. Append URL if not already present
    const currentUrls = Array.isArray(service.portfolioUrls) ? service.portfolioUrls : [];
    if (!currentUrls.includes(portfolioUrl.trim())) {
      currentUrls.push(portfolioUrl.trim());
    }

    const updated = await prisma.service.update({
      where: { id: serviceId },
      data: { portfolioUrls: currentUrls },
    });

    return NextResponse.json({
      success: true,
      message: "Karya portofolio berhasil ditambahkan.",
      data: {
        serviceId: updated.id,
        portfolioUrls: updated.portfolioUrls,
      },
    });
  } catch (err) {
    console.error("[POST /api/services/portfolio error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Gagal menambahkan portofolio." },
      { status: 500 }
    );
  }
}
