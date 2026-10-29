/**
 * Bantuin Mock Data Store
 * Broad Indonesian Community, Public, Urban, Professional & Household Context
 */

export const INITIAL_USER = {
  id: "user-current-01",
  email: "rian.prasetya@gmail.com",
  fullName: "Rian Prasetya",
  campusName: "Banjarmasin Tengah, Kota Banjarmasin, Kalimantan Selatan",
  faculty: "Penyedia Jasa & Komunitas",
  phoneNumber: "081298765432",
  avatarUrl: null,
  bio: "Pegiat kreatif & tech enthusiast. Siap membantu kebutuhan dokumen, errand, dan jasa profesional.",
  verificationStatus: "unverified",
  idCardUrl: null,
  isPartner: false,
  isAdmin: true,
  role: "admin", // canonical role: "user" | "provider" | "partner" | "admin"
  roleLabel: "Admin",
  ratingAvg: 4.95,
  ratingCount: 34,
  completedHelpsCount: 28,
  reliabilityScore: 98,
  responseTimeMinutes: 10,
};

export const BANTUIN_POINTS = [
  {
    id: "bp-1",
    name: "Indomaret Point Margonda Raya (24 Jam)",
    category: "minimarket",
    campus: "Beji, Depok",
    address: "Jl. Margonda Raya No. 52, Beji, Kota Depok",
    latitude: -6.3685,
    longitude: 106.8332,
    isVerifiedSafe: true,
    operationalHours: "24 Jam (Parkir Luas, CCTV Aktif & Terang)",
  },
  {
    id: "bp-2",
    name: "Pos Keamanan Terpadu SCBD Lot 8",
    category: "transit_hub",
    campus: "Kebayoran Baru, Jakarta Selatan",
    address: "Kawasan SCBD Lot 8, Jl. Jend. Sudirman Kav. 52-53",
    latitude: -6.2255,
    longitude: 106.8097,
    isVerifiedSafe: true,
    operationalHours: "24 Jam (Aman & Satpam Berjaga)",
  },
  {
    id: "bp-3",
    name: "Indomaret Fresh Rasuna Said Kuningan",
    category: "minimarket",
    campus: "Setiabudi, Jakarta Selatan",
    address: "Jl. HR Rasuna Said Kav. C-22, Kuningan, Jakarta Selatan",
    latitude: -6.2248,
    longitude: 106.8302,
    isVerifiedSafe: true,
    operationalHours: "24 Jam",
  },
  {
    id: "bp-4",
    name: "Indomaret Point Lambung Mangkurat (24 Jam)",
    category: "minimarket",
    campus: "Banjarmasin Tengah",
    address: "Jl. Lambung Mangkurat No. 45, Banjarmasin",
    latitude: -3.3197,
    longitude: 114.5909,
    isVerifiedSafe: true,
    operationalHours: "24 Jam (Parkir Luas & Terpantau CCTV)",
  },
  {
    id: "bp-5",
    name: "Pos Terpadu Titik Nol KM Siring Menara Pandang",
    category: "transit_hub",
    campus: "Banjarmasin",
    address: "Area Siring Menara Pandang, Jl. Jend. Sudirman",
    latitude: -3.3181,
    longitude: 114.5934,
    isVerifiedSafe: true,
    operationalHours: "06:00 - 23:00 WITA",
  }
];

export const INITIAL_REQUESTS = [];

export const INITIAL_RENTALS = [];

export const INITIAL_SERVICES = [];

export const INITIAL_HELPERS = [];
export const INITIAL_PARTNERS = [];

export const INITIAL_ORDER_ROOMS = [];
export const INITIAL_ORDER_ROOM = null;
