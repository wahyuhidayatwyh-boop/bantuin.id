import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth/jwt";
import { extractBearerToken } from "@/lib/auth/session";

async function getAuthProfile(req) {
  const token = extractBearerToken(req);
  if (!token) return null;

  const decoded = verifyAccessToken(token);
  if (!decoded || (!decoded.id && !decoded.email)) return null;

  return await prisma.profile.findFirst({
    where: {
      OR: [
        ...(decoded.id ? [{ id: decoded.id }] : []),
        ...(decoded.email ? [{ email: decoded.email.toLowerCase() }] : []),
      ],
    },
  });
}

/**
 * GET /api/mitra/gallery/[id]
 * Mengambil detail foto showcase dari galeri profil mitra
 */
export async function GET(req, { params }) {
  try {
    const { id } = await params;
    const userProfile = await getAuthProfile(req);
    if (!userProfile) {
      return NextResponse.json(
        { success: false, error: "Akses ditolak. Silakan login terlebih dahulu." },
        { status: 401 }
      );
    }

    const photos = Array.isArray(userProfile.portfolioPhotos) ? userProfile.portfolioPhotos : [];
    const item = photos.find((p, idx) => p.id === id || String(idx) === String(id));

    if (!item) {
      return NextResponse.json(
        { success: false, error: "Foto galeri tidak ditemukan." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: item,
    });
  } catch (err) {
    console.error("[GET /api/mitra/gallery/[id] error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Gagal mengambil foto galeri." },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/mitra/gallery/[id]
 * Memperbarui data foto showcase dari galeri profil mitra
 */
export async function PATCH(req, { params }) {
  try {
    const { id } = await params;
    const userProfile = await getAuthProfile(req);
    if (!userProfile) {
      return NextResponse.json(
        { success: false, error: "Akses ditolak. Silakan login terlebih dahulu." },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { title, category, description, url, photoUrl } = body;
    const targetUrl = url || photoUrl;

    const photos = Array.isArray(userProfile.portfolioPhotos) ? userProfile.portfolioPhotos : [];
    const itemIndex = photos.findIndex((p, idx) => p.id === id || String(idx) === String(id));

    if (itemIndex === -1) {
      return NextResponse.json(
        { success: false, error: "Foto galeri tidak ditemukan." },
        { status: 404 }
      );
    }

    const updatedItem = {
      ...photos[itemIndex],
      ...(title !== undefined ? { title: title.trim() } : {}),
      ...(category !== undefined ? { category: category.trim() } : {}),
      ...(description !== undefined ? { description: description.trim() } : {}),
      ...(targetUrl !== undefined ? { url: targetUrl.trim() } : {}),
      updatedAt: new Date().toISOString(),
    };

    const nextPhotos = [...photos];
    nextPhotos[itemIndex] = updatedItem;

    await prisma.profile.update({
      where: { id: userProfile.id },
      data: { portfolioPhotos: nextPhotos },
    });

    return NextResponse.json({
      success: true,
      message: "Data foto galeri berhasil diperbarui.",
      data: updatedItem,
    });
  } catch (err) {
    console.error("[PATCH /api/mitra/gallery/[id] error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Gagal memperbarui foto galeri." },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/mitra/gallery/[id]
 * Task 74: Menghapus foto dari galeri showcase toko mitra / unit sewa
 */
export async function DELETE(req, { params }) {
  try {
    const { id } = await params;
    const userProfile = await getAuthProfile(req);
    if (!userProfile) {
      return NextResponse.json(
        { success: false, error: "Akses ditolak. Silakan login terlebih dahulu." },
        { status: 401 }
      );
    }

    // 1. Cek apakah ID merujuk pada Rental unit
    const rental = await prisma.rental.findUnique({
      where: { id },
    }).catch(() => null);

    if (rental) {
      if (rental.ownerId !== userProfile.id && !userProfile.isAdmin) {
        return NextResponse.json(
          { success: false, error: "Akses ditolak. Anda bukan pemilik dari unit sewa ini." },
          { status: 403 }
        );
      }

      const { searchParams } = new URL(req.url);
      let targetUrl = searchParams.get("url");

      if (!targetUrl) {
        const body = await req.json().catch(() => ({}));
        targetUrl = body.url;
      }

      const currentPhotos = Array.isArray(rental.photoUrls) ? rental.photoUrls : [];
      const filtered = targetUrl ? currentPhotos.filter((u) => u !== targetUrl.trim()) : currentPhotos.slice(1);

      const updated = await prisma.rental.update({
        where: { id },
        data: { photoUrls: filtered },
      });

      return NextResponse.json({
        success: true,
        message: "Foto berhasil dihapus dari unit sewa.",
        data: {
          rentalId: updated.id,
          photoUrls: updated.photoUrls,
        },
      });
    }

    // 2. Jika bukan Rental unit, cek di Profile.portfolioPhotos
    const photos = Array.isArray(userProfile.portfolioPhotos) ? userProfile.portfolioPhotos : [];
    const filteredPhotos = photos.filter((p, idx) => p.id !== id && String(idx) !== String(id));

    if (filteredPhotos.length === photos.length) {
      // Periksa juga jika ada parameter url
      const { searchParams } = new URL(req.url);
      const targetUrl = searchParams.get("url");
      if (targetUrl) {
        const filteredByUrl = photos.filter((p) => p.url !== targetUrl.trim());
        await prisma.profile.update({
          where: { id: userProfile.id },
          data: { portfolioPhotos: filteredByUrl },
        });
        return NextResponse.json({
          success: true,
          message: "Foto berhasil dihapus dari galeri showcase.",
          data: filteredByUrl,
        });
      }
    }

    await prisma.profile.update({
      where: { id: userProfile.id },
      data: { portfolioPhotos: filteredPhotos },
    });

    return NextResponse.json({
      success: true,
      message: "Foto showcase berhasil dihapus dari galeri toko mitra.",
      data: filteredPhotos,
    });
  } catch (err) {
    console.error("[DELETE /api/mitra/gallery/[id] error]:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Gagal menghapus foto galeri." },
      { status: 500 }
    );
  }
}
