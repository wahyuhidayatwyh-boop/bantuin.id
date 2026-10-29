import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Endpoint publik hanya mengembalikan konten yang telah diaktifkan admin.
export async function GET() {
  try {
    const [reviews, partners] = await Promise.all([
      prisma.landingReview.findMany({ where: { isActive: true }, orderBy: { createdAt: "desc" } }),
      prisma.landingPartnerLogo.findMany({ where: { isActive: true }, orderBy: { createdAt: "desc" } }),
    ]);
    return NextResponse.json({ success: true, data: { reviews, partners } });
  } catch (error) { return NextResponse.json({ success: false, error: error.message || "Gagal memuat konten beranda." }, { status: 500 }); }
}
