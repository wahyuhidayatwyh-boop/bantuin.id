// Service Geolocation & Reverse Geocoding Realtime untuk Wilayah Indonesia
import { INDONESIA_REGION_DATA, PROVINCE_LIST } from "@/lib/data/indonesiaRegions";

/**
 * Meminta koordinat GPS dari perangkat pengguna
 */
export function getCurrentCoordinates() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Browser Anda tidak mendukung deteksi lokasi GPS."));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      (error) => {
        let msg = "Gagal mengambil titik GPS.";
        if (error.code === error.PERMISSION_DENIED) {
          msg = "Izin akses lokasi GPS ditolak di browser Anda. Silakan aktifkan izin lokasi di pengaturan browser.";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          msg = "Informasi lokasi GPS tidak tersedia dari perangkat Anda.";
        } else if (error.code === error.TIMEOUT) {
          msg = "Waktu permintaan sinyal GPS habis.";
        }
        reject(new Error(msg));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  });
}

/**
 * Reverse geocoding koordinat GPS ke Provinsi, Kota/Kabupaten, dan Kecamatan Indonesia
 */
export async function reverseGeocodeCoordinates(latitude, longitude) {
  try {
    // 1. Coba OpenStreetMap Nominatim
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1&accept-language=id`
    );

    if (res.ok) {
      const data = await res.json();
      const addr = data.address || {};

      // Ekstraksi akurat komponen alamat langsung dari data geocoding
      let realDistrict = 
        addr.suburb || 
        addr.district || 
        addr.subdistrict || 
        addr.quarter || 
        addr.neighbourhood || 
        addr.village || 
        "";
      realDistrict = realDistrict
        .replace(/^(Kecamatan|Kelurahan|Desa)\s+/i, "")
        .trim();

      let realCity = 
        addr.city || 
        addr.regency || 
        addr.county || 
        addr.municipality || 
        addr.town || 
        addr.city_district || 
        "";
      realCity = realCity
        .replace(/^Kota Administrasi\s+/i, "")
        .trim();

      let realProvince = addr.state || addr.province || addr.region || "";
      realProvince = realProvince.replace(/^Provinsi\s+/i, "").trim();
      if (/daerah khusus ibukota jakarta|jakarta raya/i.test(realProvince)) realProvince = "DKI Jakarta";
      if (/daerah istimewa yogyakarta|diy/i.test(realProvince)) realProvince = "DI Yogyakarta";

      // Formulasi nama lokasi ringkas & presisi untuk Navbar
      let shortLocation = "";
      if (realDistrict && realCity) {
        shortLocation = `${realDistrict}, ${realCity}`;
      } else if (realCity && realProvince) {
        shortLocation = `${realCity}, ${realProvince}`;
      } else if (realCity) {
        shortLocation = realCity;
      } else if (realProvince) {
        shortLocation = realProvince;
      } else {
        shortLocation = "Lokasi Terdeteksi";
      }

      const fullDisplay = data.display_name || shortLocation;

      return {
        latitude,
        longitude,
        province: realProvince,
        city: realCity,
        district: realDistrict,
        shortLocation,
        fullAddress: fullDisplay,
        raw: addr,
      };
    }
  } catch (err) {
    console.warn("Nominatim reverse geocode error, attempting fallback...", err);
  }

  // 2. Fallback via BigDataCloud Open Reverse Geocoding
  try {
    const bdcRes = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=id`
    );
    if (bdcRes.ok) {
      const bdcData = await bdcRes.json();
      let rawState = (bdcData.principalSubdivision || "").replace(/^Provinsi\s+/i, "").trim();
      let rawCity = (bdcData.city || "").replace(/^Kota Administrasi\s+/i, "").trim();
      let rawDistrict = (bdcData.locality || "").replace(/^(Kecamatan|Kelurahan|Desa)\s+/i, "").trim();

      if (/daerah khusus ibukota jakarta|jakarta raya/i.test(rawState)) rawState = "DKI Jakarta";
      if (/daerah istimewa yogyakarta|diy/i.test(rawState)) rawState = "DI Yogyakarta";

      const shortLocation = rawDistrict && rawCity 
        ? `${rawDistrict}, ${rawCity}` 
        : (rawCity ? `${rawCity}, ${rawState}` : (rawState || "Lokasi Terdeteksi"));

      return {
        latitude,
        longitude,
        province: rawState,
        city: rawCity,
        district: rawDistrict,
        shortLocation,
        fullAddress: `${rawDistrict ? rawDistrict + ", " : ""}${rawCity ? rawCity + ", " : ""}${rawState}, Indonesia`,
      };
    }
  } catch (e) {
    console.warn("BigDataCloud fallback failed:", e);
  }

  // 3. Fallback koordinat jika offline
  const fallbackShort = `Koordinat: ${latitude.toFixed(3)}, ${longitude.toFixed(3)}`;
  return {
    latitude,
    longitude,
    province: "",
    city: "",
    district: "",
    shortLocation: fallbackShort,
    fullAddress: `Koordinat GPS: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
  };
}

/**
 * Deteksi koordinat GPS aktif dan geocoding ke alamat lengkap
 */
export async function detectRealtimeLocation() {
  const coords = await getCurrentCoordinates();
  return reverseGeocodeCoordinates(coords.latitude, coords.longitude);
}

/**
 * Menghitung jarak lurus (Great Circle Distance) antara dua koordinat GPS
 * menggunakan Haversine Formula (dalam meter)
 */
export function calculateDistanceInMeters(lat1, lon1, lat2, lon2) {
  if (
    lat1 === undefined ||
    lat1 === null ||
    lon1 === undefined ||
    lon1 === null ||
    lat2 === undefined ||
    lat2 === null ||
    lon2 === undefined ||
    lon2 === null
  ) {
    return null;
  }
  const nLat1 = Number(lat1);
  const nLon1 = Number(lon1);
  const nLat2 = Number(lat2);
  const nLon2 = Number(lon2);
  if (isNaN(nLat1) || isNaN(nLon1) || isNaN(nLat2) || isNaN(nLon2)) {
    return null;
  }

  const toRad = (value) => (value * Math.PI) / 180;
  const R = 6371000; // Radius bumi dalam meter
  const dLat = toRad(nLat2 - nLat1);
  const dLon = toRad(nLon2 - nLon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(nLat1)) * Math.cos(toRad(nLat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Memformat meter menjadi teks ramah pengguna (contoh: "150 m" atau "2.4 km")
 */
export function formatDistanceText(meters) {
  if (meters === null || meters === undefined || isNaN(meters)) {
    return null;
  }
  const m = Number(meters);
  if (m < 1000) {
    return `${Math.max(10, Math.round(m))} m`;
  }
  const km = (m / 1000).toFixed(1);
  return `${km.replace(".0", "")} km`;
}

/**
 * Menghasilkan tautan rute / navigasi ke Google Maps
 */
export function getNavigationUrl(targetLat, targetLon, originLat, originLon) {
  if (originLat && originLon) {
    return `https://www.google.com/maps/dir/?api=1&origin=${originLat},${originLon}&destination=${targetLat},${targetLon}&travelmode=driving`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${targetLat},${targetLon}`;
}

/**
 * Daftar lokasi fallback jika browser memblokir izin GPS perangkat
 */
export const GPS_FALLBACK_PRESETS = [
  {
    id: "ui_depok",
    name: "Universitas Indonesia, Depok",
    city: "Kota Depok",
    district: "Beji",
    province: "Jawa Barat",
    shortLocation: "Beji, Kota Depok",
    latitude: -6.3628,
    longitude: 106.8315,
    fullAddress: "Kampus UI Depok, Beji, Kota Depok, Jawa Barat",
  },
  {
    id: "kuningan_jaksel",
    name: "Kuningan, Jakarta Selatan",
    city: "Jakarta Selatan",
    district: "Setiabudi",
    province: "DKI Jakarta",
    shortLocation: "Setiabudi, Jakarta Selatan",
    latitude: -6.2241,
    longitude: 106.8294,
    fullAddress: "Jl. HR Rasuna Said, Kuningan, Setiabudi, Jakarta Selatan",
  },
  {
    id: "sudirman_jakpus",
    name: "Sudirman (SCBD), Jakarta Pusat",
    city: "Jakarta Pusat",
    district: "Tanah Abang",
    province: "DKI Jakarta",
    shortLocation: "SCBD, Jakarta Pusat",
    latitude: -6.2146,
    longitude: 106.8186,
    fullAddress: "Sudirman Central Business District, Jakarta Pusat",
  },
  {
    id: "dago_bandung",
    name: "Dago, Bandung",
    city: "Kota Bandung",
    district: "Coblong",
    province: "Jawa Barat",
    shortLocation: "Coblong, Kota Bandung",
    latitude: -6.8915,
    longitude: 107.6107,
    fullAddress: "Jl. Ir. H. Juanda (Dago), Coblong, Kota Bandung",
  },
  {
    id: "lambung_mangkurat_bjm",
    name: "Lambung Mangkurat, Banjarmasin",
    city: "Kota Banjarmasin",
    district: "Banjarmasin Tengah",
    province: "Kalimantan Selatan",
    shortLocation: "Banjarmasin Tengah, Kota Banjarmasin",
    latitude: -3.3197,
    longitude: 114.5909,
    fullAddress: "Jl. Lambung Mangkurat, Banjarmasin Tengah, Kota Banjarmasin",
  },
  {
    id: "kulonprogo_yia",
    name: "Glagah, Kulon Progo",
    city: "Kulon Progo",
    district: "Temon",
    province: "DI Yogyakarta",
    shortLocation: "Glagah, Kulonprogo",
    latitude: -7.9044,
    longitude: 110.0543,
    fullAddress: "Glagah, Temon, Kulon Progo, D.I. Yogyakarta",
  },
  {
    id: "purwokerto_unsoed",
    name: "Universitas Jenderal Soedirman (Unsoed), Purwokerto",
    city: "Kabupaten Banyumas",
    district: "Purwokerto Utara",
    province: "Jawa Tengah",
    shortLocation: "Purwokerto, Kab. Banyumas",
    latitude: -7.4098,
    longitude: 109.2483,
    fullAddress: "Jl. Profesor DR. HR Boenyamin No. 708, Grendeng, Purwokerto Utara, Banyumas, Jawa Tengah",
  },
];

/**
 * Membersihkan dan menormalisasi nama kota / kabupaten
 */
export function normalizeCityName(cityName) {
  if (!cityName) return "";
  return cityName
    .toLowerCase()
    .replace(/^(kota|kabupaten|kab\.|adm\.|administrasi)\s+/gi, "")
    .replace(/[\s\-_]+/g, "")
    .trim();
}

/**
 * Mengekstrak nama kabupaten / kota dari teks lokasi atau objek GPS
 * Selalu memprioritaskan teks lokasi yang terpilih di Navigasi Utama
 */
export function extractKabupatenName(locationString, userRealLocation = null) {
  let str = String(
    locationString ||
    userRealLocation?.city ||
    userRealLocation?.shortLocation ||
    ""
  ).trim();

  // If str is a generic placeholder and userRealLocation has genuine data, prioritize real location
  if (/jakarta & sekitarnya|lokasi anda/i.test(str) && (userRealLocation?.shortLocation || userRealLocation?.city)) {
    str = String(userRealLocation.shortLocation || userRealLocation.city).trim();
  }

  if (!str) {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("bantuin_selected_location");
        if (saved) return extractKabupatenName(saved);
      } catch (e) {}
    }
    return "Kab. Banyumas";
  }

  // Pola kota / kabupaten populer
  if (/banyumas|purwokerto/i.test(str)) return "Kab. Banyumas";
  if (/kulon\s*progo/i.test(str)) return "Kulon Progo";
  if (/depok/i.test(str)) return "Kota Depok";
  if (/jakarta selatan|jaksel/i.test(str)) return "Jakarta Selatan";
  if (/jakarta pusat|jakpus/i.test(str)) return "Jakarta Pusat";
  if (/jakarta barat|jakbar/i.test(str)) return "Jakarta Barat";
  if (/jakarta timur|jaktim/i.test(str)) return "Jakarta Timur";
  if (/jakarta utara|jakut/i.test(str)) return "Jakarta Utara";
  if (/dki\s*jakarta|jakarta/i.test(str)) return "Jakarta Selatan";
  if (/banjarmasin/i.test(str)) return "Kota Banjarmasin";
  if (/banjarbaru/i.test(str)) return "Kota Banjarbaru";
  if (/bandung/i.test(str)) return "Kota Bandung";
  if (/bogor/i.test(str)) return "Kota Bogor";
  if (/bekasi/i.test(str)) return "Kota Bekasi";
  if (/tangerang selatan/i.test(str)) return "Kota Tangerang Selatan";
  if (/tangerang/i.test(str)) return "Kota Tangerang";
  if (/surabaya/i.test(str)) return "Kota Surabaya";
  if (/yogyakarta|jogja/i.test(str)) return "Kota Yogyakarta";
  if (/sleman/i.test(str)) return "Kab. Sleman";
  if (/bantul/i.test(str)) return "Kab. Bantul";
  if (/gunung\s*kidul/i.test(str)) return "Kab. Gunungkidul";
  if (/semarang/i.test(str)) return "Kota Semarang";
  if (/surakarta|solo/i.test(str)) return "Kota Surakarta";

  // Ambil bagian sebelum atau sesudah koma jika ada format "Kecamatan, Kota"
  const parts = str.split(",");
  if (parts.length >= 2) {
    return parts[parts.length - 1].trim();
  }
  return str;
}

/**
 * Mengecek apakah suatu item berada di kabupaten/kota yang sama dengan pengguna di Nav
 */
export function isItemInKabupaten(item, activeCityName, activeCoords = null, maxRadiusKm = 35) {
  if (!item) return false;

  const normActive = normalizeCityName(activeCityName);
  const itemCity = normalizeCityName(item.city);
  const itemAddress = (item.address || item.location || item.locationName || "").toLowerCase();
  const itemDistrict = (item.district || "").toLowerCase();
  const itemProvince = (item.province || "").toLowerCase();

  // Special match for Jakarta & Greater DKI (matches Jakarta Selatan, Jakarta Pusat, etc.)
  const isActiveJakarta = normActive.includes("jakarta") || normActive.includes("dki");
  const isItemJakarta =
    itemCity.includes("jakarta") ||
    itemAddress.includes("jakarta") ||
    itemDistrict.includes("kuningan") ||
    itemDistrict.includes("setiabudi") ||
    itemDistrict.includes("scbd") ||
    itemDistrict.includes("senayan") ||
    itemDistrict.includes("pancoran") ||
    itemProvince.includes("jakarta");

  if (isActiveJakarta) {
    return isItemJakarta;
  }
  if (isItemJakarta && !isActiveJakarta) {
    return false;
  }

  // Special match for Banyumas & Purwokerto
  const isActiveBanyumas = normActive.includes("banyumas") || normActive.includes("purwokerto");
  const isItemBanyumas =
    itemCity.includes("banyumas") ||
    itemCity.includes("purwokerto") ||
    itemAddress.includes("banyumas") ||
    itemAddress.includes("purwokerto") ||
    itemDistrict.includes("purwokerto") ||
    itemDistrict.includes("baturraden") ||
    itemDistrict.includes("sokaraja") ||
    itemDistrict.includes("kembaran") ||
    itemDistrict.includes("ajibarang");

  if (isActiveBanyumas) {
    return isItemBanyumas;
  }

  // If item is in Banyumas but active location is NOT Banyumas
  if (isItemBanyumas && !isActiveBanyumas) {
    return false;
  }

  // 1. Pencocokan tegas nama kabupaten / kota
  if (normActive && itemCity) {
    if (itemCity.includes(normActive) || normActive.includes(itemCity)) {
      return true;
    }
    // Jika kota berbeda (misal: nav Kulon Progo vs item Jakarta), jangan tampilkan
    return false;
  }

  // 2. Pencocokan jika nama kota di dalam teks alamat atau kecamatan
  if (normActive && (itemAddress || itemDistrict)) {
    const cleanAddress = (itemAddress + " " + itemDistrict).replace(/[\s\-_.]+/g, "");
    if (cleanAddress.includes(normActive)) {
      return true;
    }
  }

  // 3. Radius GPS jika tersedia koordinat kedua pihak
  if (
    activeCoords &&
    typeof activeCoords.latitude === "number" &&
    typeof activeCoords.longitude === "number" &&
    typeof item.latitude === "number" &&
    typeof item.longitude === "number"
  ) {
    const distMeters = calculateDistanceInMeters(
      activeCoords.latitude,
      activeCoords.longitude,
      item.latitude,
      item.longitude
    );
    return distMeters <= maxRadiusKm * 1000;
  }

  return false;
}




