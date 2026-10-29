import { NextResponse } from "next/server";

/**
 * GET /api/master/campuses
 * Task 80: Master daftar kampus terdaftar beserta koordinat latitude & longitude
 */
export async function GET() {
  const campuses = [
    {
      id: "ui-depok",
      name: "Universitas Indonesia (UI)",
      campus: "Kampus Depok",
      city: "Depok",
      latitude: -6.3627,
      longitude: 106.8271,
      isActive: true,
      safePointsCount: 14,
    },
    {
      id: "itb-ganesha",
      name: "Institut Teknologi Bandung (ITB)",
      campus: "Kampus Ganesha",
      city: "Bandung",
      latitude: -6.8915,
      longitude: 107.6107,
      isActive: true,
      safePointsCount: 9,
    },
    {
      id: "ugm-jogja",
      name: "Universitas Gadjah Mada (UGM)",
      campus: "Bulaksumur",
      city: "Yogyakarta",
      latitude: -7.7713,
      longitude: 110.3775,
      isActive: true,
      safePointsCount: 12,
    },
    {
      id: "unair-surabaya",
      name: "Universitas Airlangga (UNAIR)",
      campus: "Kampus B & C",
      city: "Surabaya",
      latitude: -7.2694,
      longitude: 112.7844,
      isActive: true,
      safePointsCount: 8,
    },
    {
      id: "ub-malang",
      name: "Universitas Brawijaya (UB)",
      campus: "Ketawanggede",
      city: "Malang",
      latitude: -7.9525,
      longitude: 112.6144,
      isActive: true,
      safePointsCount: 11,
    },
    {
      id: "undip-tembalang",
      name: "Universitas Diponegoro (UNDIP)",
      campus: "Tembalang",
      city: "Semarang",
      latitude: -7.0504,
      longitude: 110.4398,
      isActive: true,
      safePointsCount: 7,
    },
    {
      id: "its-sukolilo",
      name: "Institut Teknologi Sepuluh Nopember (ITS)",
      campus: "Sukolilo",
      city: "Surabaya",
      latitude: -7.2824,
      longitude: 112.7949,
      isActive: true,
      safePointsCount: 8,
    },
    {
      id: "unpad-jatinangor",
      name: "Universitas Padjadjaran (UNPAD)",
      campus: "Jatinangor",
      city: "Sumedang",
      latitude: -6.9263,
      longitude: 107.7747,
      isActive: true,
      safePointsCount: 10,
    },
    {
      id: "ipb-dramaga",
      name: "IPB University",
      campus: "Dramaga",
      city: "Bogor",
      latitude: -6.5599,
      longitude: 106.7247,
      isActive: true,
      safePointsCount: 9,
    },
  ];

  return NextResponse.json({
    success: true,
    data: campuses,
  });
}
