import { Plus_Jakarta_Sans, Newsreader } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/lib/context/AppContext";
import GuestActionGuard from "@/components/auth/GuestActionGuard";
import OAuthRedirectCatcher from "@/components/auth/OAuthRedirectCatcher";
import InactivityGuard from "@/components/auth/InactivityGuard";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
  display: "swap",
});

const newsreader = Newsreader({
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["400", "500", "600"],
  variable: "--font-serif",
  display: "swap",
});

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://bantuinaja.id"),
  title: "Bantuin — Platform Jasa, Bantuan, & Sewa Barang",
  description: "Temukan penyedia jasa, bantuan harian, dan sewa barang di sekitarmu. Dilengkapi sistem pembayaran resmi terverifikasi dan identitas resmi pengguna.",
  keywords: ["bantuin", "marketplace jasa", "bantuan harian", "sewa barang", "rental kamera", "payment gateway", "freelancer"],
  authors: [{ name: "Bantuin Team" }],
  icons: {
    icon: [
      { url: "/icon.png", type: "image/png" },
      { url: "/logotab.png", type: "image/png" },
    ],
    shortcut: "/icon.png",
    apple: "/apple-icon.png",
  },
  openGraph: {
    title: "Bantuin — Platform Jasa, Bantuan, & Sewa Barang",
    description: "Temukan penyedia jasa, bantuan harian, dan sewa barang di sekitarmu. Dilengkapi sistem pembayaran resmi terverifikasi dan identitas resmi pengguna.",
    url: "https://bantuinaja.id",
    siteName: "BantuinAja",
    images: [
      {
        url: "/logotab.png",
        width: 512,
        height: 512,
        alt: "BantuinAja Logo",
      },
    ],
    locale: "id_ID",
    type: "website",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="id" className={`${plusJakartaSans.variable} ${newsreader.variable} scroll-smooth`}>
      <head>
        <link rel="icon" href="/icon.png" sizes="any" />
        <link rel="icon" type="image/png" href="/logotab.png" />
        <link rel="apple-touch-icon" href="/apple-icon.png" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var p = window.location.pathname || '';
                  if (!p.startsWith('/auth/callback')) {
                    var s = window.location.search || '';
                    var h = window.location.hash || '';
                    var isOAuth = s.indexOf('code=') !== -1 ||
                                  h.indexOf('access_token=') !== -1 ||
                                  h.indexOf('refresh_token=') !== -1 ||
                                  s.indexOf('error=') !== -1 ||
                                  h.indexOf('error=') !== -1;
                    if (isOAuth) {
                      window.location.replace('/auth/callback' + s + h);
                    }
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-white text-[#102A43] antialiased selection:bg-[#EAF4FF] selection:text-[#1683FF]">
        <AppProvider>
          <OAuthRedirectCatcher />
          <InactivityGuard>
            <GuestActionGuard>{children}</GuestActionGuard>
          </InactivityGuard>
        </AppProvider>
      </body>
    </html>
  );
}
