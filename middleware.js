import { NextResponse } from "next/server";

/**
 * Next.js Middleware
 * Menangani redirect callback OAuth Supabase (Google) secara instan di level server (Edge/Server).
 * Mencegah beranda sempat me-render sekilas (flicker) sebelum diarahkan ke /auth/callback.
 */
export function middleware(request) {
  const { pathname, searchParams, search } = request.nextUrl;

  // 1. Wajib HTTPS di lingkungan production
  const proto = request.headers.get("x-forwarded-proto");
  const host = request.headers.get("host") || "";
  if (proto === "http" && !host.includes("localhost") && !host.includes("127.0.0.1")) {
    const httpsUrl = new URL(request.url);
    httpsUrl.protocol = "https:";
    return NextResponse.redirect(httpsUrl, 301);
  }

  // 2. Tangkap callback jika Supabase mengarahkan ke "/" atau halaman selain "/auth/callback"
  if (!pathname.startsWith("/auth/callback")) {
    const hasCode = searchParams.has("code");
    const hasError = searchParams.has("error") || searchParams.has("error_description");

    if (hasCode || hasError) {
      const callbackUrl = new URL(`/auth/callback${search}`, request.url);
      return NextResponse.redirect(callbackUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Berlaku untuk semua path kecuali:
     * - api routes
     * - _next/static, _next/image
     * - aset statis (favicon.ico, svg, png, dll)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
