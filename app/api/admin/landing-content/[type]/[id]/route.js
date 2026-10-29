import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/auth/jwt";

async function requireAdmin(req) {
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const decoded = token && verifyAccessToken(token);
  const profile = decoded && await prisma.profile.findFirst({ where: { OR: [ ...(decoded.id ? [{ id: decoded.id }] : []), ...(decoded.email ? [{ email: decoded.email.toLowerCase() }] : []) ] } });
  return profile && profile.isAdmin ? { profile } : { error: "Akses khusus administrator.", status: 403 };
}
const modelFor = (type) => type === "review" ? prisma.landingReview : type === "partner" ? prisma.landingPartnerLogo : null;

export async function PATCH(req, { params }) {
  try {
    const auth = await requireAdmin(req); if (auth.error) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    const { type, id } = await params; const model = modelFor(type); if (!model) return NextResponse.json({ success: false, error: "Jenis konten tidak valid." }, { status: 400 });
    const body = await req.json().catch(() => ({}));
    const data = type === "review" ? { ...(body.name !== undefined ? { name: body.name.trim() } : {}), ...(body.company !== undefined ? { company: body.company?.trim() || null } : {}), ...(body.quote !== undefined ? { quote: body.quote.trim() } : {}), ...(body.avatarUrl !== undefined ? { avatarUrl: body.avatarUrl?.trim() || null } : {}), ...(body.isActive !== undefined ? { isActive: Boolean(body.isActive) } : {}) } : { ...(body.name !== undefined ? { name: body.name.trim() } : {}), ...(body.logoUrl !== undefined ? { logoUrl: body.logoUrl?.trim() || null } : {}), ...(body.isActive !== undefined ? { isActive: Boolean(body.isActive) } : {}) };
    const updated = await model.update({ where: { id }, data });
    return NextResponse.json({ success: true, data: updated });
  } catch (error) { return NextResponse.json({ success: false, error: error.message || "Gagal memperbarui konten." }, { status: 500 }); }
}
export async function DELETE(req, { params }) {
  try {
    const auth = await requireAdmin(req); if (auth.error) return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    const { type, id } = await params; const model = modelFor(type); if (!model) return NextResponse.json({ success: false, error: "Jenis konten tidak valid." }, { status: 400 });
    await model.delete({ where: { id } }); return NextResponse.json({ success: true });
  } catch (error) { return NextResponse.json({ success: false, error: error.message || "Gagal menghapus konten." }, { status: 500 }); }
}
