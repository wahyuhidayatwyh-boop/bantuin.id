import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth/jwt";

/**
 * POST /api/services/packages
 * Task 68: Membuat & kelola paket bundling borongan jasa oleh Provider
 * 
 * Rules:
 * 1. Strict JWT Authentication.
 * 2. Provider must own the specified serviceId.
 * 3. Appends package bundle structure to service tags / metadata.
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
    const { serviceId, packageName, price, durationDays = 1, description = "" } = body;

    if (!serviceId || !packageName || !price) {
      return NextResponse.json(
        { success: false, error: "Field 'serviceId', 'packageName', dan 'price' wajib diisi." },
        { status: 400 }
      );
    }

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

    const packageTag = `pkg:${packageName.trim().toLowerCase().replace(/\s+/g, "-")}:${price}:${durationDays}`;
    const currentTags = Array.isArray(service.tags) ? service.tags : [];
    if (!currentTags.includes(packageTag)) {
      currentTags.push(packageTag);
    }

    const updated = await prisma.service.update({
      where: { id: serviceId },
      data: { tags: currentTags },
    });

    return NextResponse.json({
      success: true,
      message: `Paket bundling '${packageName}' seharga Rp ${Number(price).toLocaleString("id-ID")} berhasil disimpan.`,
      data: {
        serviceId: updated.id,
        packageName,
        price: Number(price),
        durationDays,
        description,
        tags: updated.tags,
      },
    });
  } catch (err) {
    console.error("[POST /api/services/packages error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Gagal membuat paket jasa." },
      { status: 500 }
    );
  }
}
