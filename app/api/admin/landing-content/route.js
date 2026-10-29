import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth/jwt";

async function requireAdmin(req) {
  const header = req.headers.get("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7).trim() : null;
  const decoded = token && verifyAccessToken(token);
  if (!decoded) return { error: "Sesi admin tidak valid.", status: 401 };
  const profile = await prisma.profile.findFirst({ where: { OR: [ ...(decoded.id ? [{ id: decoded.id }] : []), ...(decoded.email ? [{ email: decoded.email.toLowerCase() }] : []) ] } });
  if (!profile || !profile.isAdmin) return { error: "Akses khusus administrator.", status: 403 };
  return { profile };
}

export async function GET(req) {
  try {
    const auth = await requireAdmin(req);
    if (auth.error) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    const [reviews, partners] = await Promise.all([
      prisma.landingReview.findMany({ orderBy: { createdAt: "desc" } }),
      prisma.landingPartnerLogo.findMany({ orderBy: { createdAt: "desc" } }),
    ]);
    return NextResponse.json({ success: true, data: { reviews, partners } });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message || "Gagal memuat konten beranda." }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const auth = await requireAdmin(req);
    if (auth.error) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    const body = await req.json().catch(() => ({}));
    const isReview = body.type === "review";
    if (!body.name?.trim() || (isReview && !body.quote?.trim())) return NextResponse.json({ success: false, error: "Nama dan isi ulasan wajib diisi." }, { status: 400 });
    const data = isReview
      ? await prisma.landingReview.create({ data: { name: body.name.trim(), company: body.company?.trim() || null, quote: body.quote.trim(), avatarUrl: body.avatarUrl?.trim() || null, isActive: body.isActive !== false, createdById: auth.profile.id } })
      : await prisma.landingPartnerLogo.create({ data: { name: body.name.trim(), logoUrl: body.logoUrl?.trim() || null, isActive: body.isActive !== false, createdById: auth.profile.id } });
    await prisma.auditLog.create({ data: { actorId: auth.profile.id, actorEmail: auth.profile.email, action: isReview ? "landing_review.created" : "landing_partner.created", targetEntity: isReview ? "landing_reviews" : "landing_partner_logos", targetId: data.id } });
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message || "Gagal menyimpan konten beranda." }, { status: 500 });
  }
}
