import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    let points = await prisma.bantuinPoint.findMany({
      orderBy: { name: "asc" },
    });

    // Jika tabel masih kosong, seed titik temu aman awal
    if (points.length === 0) {
      const initialPoints = [
        {
          name: "Gerbang Utama UI Depok (Pos Satpam)",
          category: "campus_gate",
          campus: "Universitas Indonesia",
          address: "Pondok Cina, Beji, Kota Depok, Jawa Barat",
          latitude: -6.3628,
          longitude: 106.8315,
          operationalHours: "06:00 - 22:00 WIB",
          isVerifiedSafe: true,
        },
        {
          name: "Perpustakaan Pusat UI (Crystal of Knowledge)",
          category: "library",
          campus: "Universitas Indonesia",
          address: "Kampus UI Depok, Beji, Kota Depok, Jawa Barat",
          latitude: -6.3648,
          longitude: 106.8286,
          operationalHours: "08:00 - 19:00 WIB",
          isVerifiedSafe: true,
        },
        {
          name: "Indomaret Point Stasiun UI",
          category: "minimarket",
          campus: "Universitas Indonesia",
          address: "Kawasan Stasiun KRL UI, Beji, Depok",
          latitude: -6.3611,
          longitude: 106.8319,
          operationalHours: "24 Jam",
          isVerifiedSafe: true,
        },
        {
          name: "Bantuin Hub Pasar Rebo / Condet",
          category: "partner_hub",
          campus: "Jakarta Timur",
          address: "Jl. Raya Condet No. 12, Pasar Rebo, Jakarta Timur",
          latitude: -6.3039,
          longitude: 106.8617,
          operationalHours: "07:00 - 21:00 WIB",
          isVerifiedSafe: true,
        },
        {
          name: "Gerbang Utama ULM Banjarmasin",
          category: "campus_gate",
          campus: "Universitas Lambung Mangkurat",
          address: "Jl. Brigjen H. Hasan Basri, Kayu Tangi, Banjarmasin Utara",
          latitude: -3.2987,
          longitude: 114.5862,
          operationalHours: "06:00 - 21:00 WIB",
          isVerifiedSafe: true,
        },
      ];

      for (const p of initialPoints) {
        await prisma.bantuinPoint.create({ data: p });
      }

      points = await prisma.bantuinPoint.findMany({
        orderBy: { name: "asc" },
      });
    }

    return NextResponse.json(
      {
        success: true,
        count: points.length,
        data: points,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      }
    );
  } catch (error) {
    console.error("GET /api/bantuin-points Error:", error);
    return NextResponse.json(
      { error: error.message || "Gagal mengambil daftar titik temu aman." },
      { status: 500 }
    );
  }
}
