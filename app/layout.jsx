import { Plus_Jakarta_Sans, Newsreader } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/lib/context/AppContext";

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
  title: "Bantuin — Platform Bantuan, Jasa, & Sewa Komunitas Kampus",
  description: "Temukan orang, jasa, dan barang yang kamu butuhkan di sekitarmu. Platform hyper-local aman dengan escrow Xendit dan safe meet-up Bantuin Point.",
  keywords: ["bantuin", "errand kampus", "sewa kamera", "jasa mahasiswa", "print tugas", "escrow xendit", "universitas indonesia"],
  authors: [{ name: "Bantuin Team" }],
};

export default function RootLayout({ children }) {
  return (
    <html lang="id" className={`${plusJakartaSans.variable} ${newsreader.variable} scroll-smooth`}>
      <head>
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
      </head>
      <body className="min-h-screen bg-white text-[#102A43] antialiased selection:bg-[#EAF4FF] selection:text-[#1683FF]">
        <AppProvider>
          {children}
        </AppProvider>
      </body>
    </html>
  );
}
