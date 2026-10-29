import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth/jwt";
import { extractBearerToken } from "@/lib/auth/session";

/**
 * POST /api/mitra/gallery
 * Task 73: Menambahkan foto unit ke galeri showcase toko mitra
 */
export async function POST(req) {
  try {
    // 1. Auth check
    const token = extractBearerToken(req);

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
    const rawPhotoUrl = body.photoUrl || body.url;
    const photoUrl = typeof rawPhotoUrl === "string" ? rawPhotoUrl.trim() : "";
    const rentalId = body.rentalId;
    const caption = body.caption || body.title;

    if (!photoUrl) {
      return NextResponse.json(
        { success: false, error: "Parameter 'photoUrl' (atau 'url') wajib disertakan." },
        { status: 400 }
      );
    }

    // If attached to a specific rental unit
    if (rentalId) {
      const rental = await prisma.rental.findUnique({
        where: { id: rentalId },
      });

      if (!rental) {
        return NextResponse.json(
          { success: false, error: "Barang sewa tidak ditemukan." },
          { status: 404 }
        );
      }

      if (rental.ownerId !== userProfile.id && !userProfile.isAdmin) {
        return NextResponse.json(
          { success: false, error: "Akses ditolak. Anda bukan pemilik dari unit sewa ini." },
          { status: 403 }
        );
      }

      const currentPhotos = Array.isArray(rental.photoUrls) ? rental.photoUrls : [];
      if (!currentPhotos.includes(photoUrl.trim())) {
        currentPhotos.push(photoUrl.trim());
      }

      const updated = await prisma.rental.update({
        where: { id: rentalId },
        data: { photoUrls: currentPhotos },
      });

      return NextResponse.json({
        success: true,
        message: "Foto berhasil ditambahkan ke unit sewa.",
        data: {
          rentalId: updated.id,
          photoUrls: updated.photoUrls,
        },
      });
    }

    // Otherwise record in store showcase in Profile.portfolioPhotos
    const currentPhotos = Array.isArray(userProfile.portfolioPhotos) ? userProfile.portfolioPhotos : [];
    const newShowcaseItem = {
      id: body.id || `gal-${Date.now()}`,
      title: (caption || body.title || "Showcase Gear").trim(),
      category: body.category || "Kamera & Rig",
      url: photoUrl.trim(),
      description: (body.description || "Dokumentasi unit perlengkapan rental siap pakai.").trim(),
      createdAt: new Date().toISOString(),
    };

    const updatedPortfolio = [newShowcaseItem, ...currentPhotos];
    await prisma.profile.update({
      where: { id: userProfile.id },
      data: { portfolioPhotos: updatedPortfolio },
    });

    return NextResponse.json({
      success: true,
      message: "Foto berhasil diunggah ke showcase galeri toko mitra.",
      data: newShowcaseItem,
    });
  } catch (err) {
    console.error("[POST /api/mitra/gallery error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Gagal menambahkan foto galeri." },
      { status: 500 }
    );
  }
}

/**
 * GET /api/mitra/gallery
 * Mengambil daftar foto showcase gear milik mitra toko dari database
 */
export async function GET(req) {
  try {
    const token = extractBearerToken(req);

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
      select: { id: true, portfolioPhotos: true },
    });

    if (!userProfile) {
      return NextResponse.json(
        { success: false, error: "Profil akun tidak ditemukan." },
        { status: 404 }
      );
    }

    const photos = Array.isArray(userProfile.portfolioPhotos) ? userProfile.portfolioPhotos : [];

    return NextResponse.json({
      success: true,
      data: photos,
    });
  } catch (err) {
    console.error("[GET /api/mitra/gallery error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Gagal mengambil galeri foto." },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/mitra/gallery
 * Menghapus foto showcase dari galeri profil mitra
 */
export async function DELETE(req) {
  try {
    const token = extractBearerToken(req);

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
      select: { id: true, portfolioPhotos: true },
    });

    if (!userProfile) {
      return NextResponse.json(
        { success: false, error: "Profil akun tidak ditemukan." },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(req.url);
    const body = await req.json().catch(() => ({}));
    const id = searchParams.get("id") || body?.id;
    const url = searchParams.get("url") || body?.url;

    const currentPhotos = Array.isArray(userProfile.portfolioPhotos) ? userProfile.portfolioPhotos : [];
    const filtered = currentPhotos.filter((p) => {
      if (id && p.id === id) return false;
      if (url && p.url === url) return false;
      return true;
    });

    await prisma.profile.update({
      where: { id: userProfile.id },
      data: { portfolioPhotos: filtered },
    });

    return NextResponse.json({
      success: true,
      message: "Foto showcase berhasil dihapus dari galeri.",
      data: filtered,
    });
  } catch (err) {
    console.error("[DELETE /api/mitra/gallery error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Gagal menghapus foto galeri." },
      { status: 500 }
    );
  }
}
