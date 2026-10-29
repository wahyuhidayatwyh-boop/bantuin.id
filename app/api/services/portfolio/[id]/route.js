import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth/jwt";

/**
 * DELETE /api/services/portfolio/[id]
 * Task 67: Menghapus karya portofolio provider dari layanan jasa
 * 
 * Rules:
 * 1. Strict JWT Authentication & Ownership check.
 * 2. Parameter 'url' via searchParams or request body specifies which URL to delete.
 */
export async function DELETE(req, { params }) {
  try {
    const { id: serviceId } = await params;

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

    // 2. Query Service
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

    // 3. Resolve Target URL
    const { searchParams } = new URL(req.url);
    let targetUrl = searchParams.get("url");

    if (!targetUrl) {
      const body = await req.json().catch(() => ({}));
      targetUrl = body.url;
    }

    if (!targetUrl) {
      return NextResponse.json(
        { success: false, error: "Parameter 'url' dari portofolio yang ingin dihapus wajib disertakan." },
        { status: 400 }
      );
    }

    // 4. Remove URL
    const currentUrls = Array.isArray(service.portfolioUrls) ? service.portfolioUrls : [];
    const filteredUrls = currentUrls.filter((u) => u !== targetUrl.trim());

    const updated = await prisma.service.update({
      where: { id: serviceId },
      data: { portfolioUrls: filteredUrls },
    });

    return NextResponse.json({
      success: true,
      message: "Portofolio berhasil dihapus dari layanan jasa.",
      data: {
        serviceId: updated.id,
        portfolioUrls: updated.portfolioUrls,
      },
    });
  } catch (err) {
    console.error("[DELETE /api/services/portfolio/[id] error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Gagal menghapus portofolio." },
      { status: 500 }
    );
  }
}
