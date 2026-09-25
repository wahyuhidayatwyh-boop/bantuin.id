/**
 * locationService.js
 * Single source of truth & abstraction for Location, Distance & GPS
 * Complies with Section R, S, T, U, V, W, X of requirements.
 *
 * CRITICAL RULES:
 * 1. NO dummy coordinates or hardcoded "Jakarta Selatan" fallback.
 * 2. If geolocation fails, returns null / error; UI displays "Lokasi belum tersedia" or "Atur lokasi untuk melihat jarak".
 * 3. Distance is strictly calculated via Haversine from genuine coordinates. Online service returns "Online".
 * 4. Coordinate is the source of truth.
 */

export const LocationErrorCode = {
  NOT_SUPPORTED: "NOT_SUPPORTED",
  PERMISSION_DENIED: "PERMISSION_DENIED",
  POSITION_UNAVAILABLE: "POSITION_UNAVAILABLE",
  TIMEOUT: "TIMEOUT",
  UNKNOWN: "UNKNOWN",
};

/**
 * ─── Location Data Models (Requirement T) ──────────────────────────────────
 */
export function createCurrentLocation({ latitude, longitude, accuracy }) {
  if (typeof latitude !== "number" || typeof longitude !== "number") return null;
  return {
    latitude,
    longitude,
    accuracy: accuracy || 0,
    source: "gps",
    timestamp: new Date().toISOString(),
  };
}

export function createMeetingLocation({ latitude, longitude, address }) {
  if (typeof latitude !== "number" || typeof longitude !== "number") return null;
  return {
    latitude,
    longitude,
    address: address || "Alamat tidak tersedia",
    source: "map",
    timestamp: new Date().toISOString(),
  };
}

export function createServiceLocation({ latitude, longitude, address, city, district, province }) {
  return {
    latitude: typeof latitude === "number" ? latitude : null,
    longitude: typeof longitude === "number" ? longitude : null,
    address: address || "",
    city: city || "",
    district: district || "",
    province: province || "",
    isOnline: !latitude && !longitude,
  };
}

export function createSelectedArea({ id, name, city, province }) {
  return {
    id: id || "all",
    name: name || "Seluruh Wilayah",
    city: city || "",
    province: province || "",
  };
}

/**
 * ─── Geolocation & Geocoding ────────────────────────────────────────────────
 */
export const locationService = {
  /**
   * Mengambil lokasi GPS aktif dari browser pengguna (Requirement S)
   * Menggunakan navigator.geolocation dengan enableHighAccuracy: true
   * @returns {Promise<{ latitude: number, longitude: number, accuracy: number, source: "gps" }>}
   */
  async getCurrentLocation() {
    return new Promise((resolve, reject) => {
      if (typeof window === "undefined" || !navigator.geolocation) {
        const err = new Error("Browser Anda tidak mendukung deteksi lokasi GPS.");
        err.code = LocationErrorCode.NOT_SUPPORTED;
        return reject(err);
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = createCurrentLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          });
          resolve(loc);
        },
        (error) => {
          let code = LocationErrorCode.UNKNOWN;
          let msg = "Gagal mengambil titik GPS.";

          if (error.code === error.PERMISSION_DENIED) {
            code = LocationErrorCode.PERMISSION_DENIED;
            msg = "Izin akses lokasi GPS ditolak di browser Anda. Silakan aktifkan izin lokasi di pengaturan browser.";
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            code = LocationErrorCode.POSITION_UNAVAILABLE;
            msg = "Informasi lokasi GPS tidak tersedia dari perangkat Anda.";
          } else if (error.code === error.TIMEOUT) {
            code = LocationErrorCode.TIMEOUT;
            msg = "Waktu permintaan sinyal GPS habis. Silakan coba lagi.";
          }

          const err = new Error(msg);
          err.code = code;
          reject(err);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  },

  /**
   * Reverse geocoding koordinat GPS ke Alamat (Requirement U)
   * Coordinate adalah source of truth. Jika reverse geocoding gagal, tetap return koordinat
   * dengan fallback address "Alamat tidak tersedia".
   */
  async reverseGeocode(latitude, longitude) {
    if (typeof latitude !== "number" || typeof longitude !== "number") {
      throw new Error("Koordinat latitude dan longitude tidak valid");
    }

    try {
      // 1. OpenStreetMap Nominatim
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1&accept-language=id`
      );

      if (res.ok) {
        const data = await res.json();
        const addr = data.address || {};

        let district =
          addr.suburb ||
          addr.district ||
          addr.subdistrict ||
          addr.quarter ||
          addr.neighbourhood ||
          addr.village ||
          "";
        district = district.replace(/^(Kecamatan|Kelurahan|Desa)\s+/i, "").trim();

        let city =
          addr.city ||
          addr.regency ||
          addr.county ||
          addr.municipality ||
          addr.town ||
          addr.city_district ||
          "";
        city = city.replace(/^Kota Administrasi\s+/i, "").trim();

        let province = addr.state || addr.province || addr.region || "";
        province = province.replace(/^Provinsi\s+/i, "").trim();
        if (/daerah khusus ibukota jakarta|jakarta raya/i.test(province)) province = "DKI Jakarta";
        if (/daerah istimewa yogyakarta|diy/i.test(province)) province = "DI Yogyakarta";

        let shortLocation = "";
        if (district && city) {
          shortLocation = `${district}, ${city}`;
        } else if (city && province) {
          shortLocation = `${city}, ${province}`;
        } else if (city) {
          shortLocation = city;
        } else if (province) {
          shortLocation = province;
        } else {
          shortLocation = "Lokasi Terdeteksi";
        }

        return {
          latitude,
          longitude,
          province,
          city,
          district,
          shortLocation,
          fullAddress: data.display_name || shortLocation,
        };
      }
    } catch (e) {
      console.warn("Nominatim reverse geocode failed, trying secondary fallback:", e);
    }

    // 2. Secondary fallback via BigDataCloud
    try {
      const bdcRes = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=id`
      );
      if (bdcRes.ok) {
        const bdcData = await bdcRes.json();
        let state = (bdcData.principalSubdivision || "").replace(/^Provinsi\s+/i, "").trim();
        let city = (bdcData.city || "").replace(/^Kota Administrasi\s+/i, "").trim();
        let district = (bdcData.locality || "").replace(/^(Kecamatan|Kelurahan|Desa)\s+/i, "").trim();

        if (/daerah khusus ibukota jakarta|jakarta raya/i.test(state)) state = "DKI Jakarta";
        if (/daerah istimewa yogyakarta|diy/i.test(state)) state = "DI Yogyakarta";

        const shortLocation = district && city ? `${district}, ${city}` : (city || state || "Lokasi Terdeteksi");

        return {
          latitude,
          longitude,
          province: state,
          city,
          district,
          shortLocation,
          fullAddress: `${district ? district + ", " : ""}${city ? city + ", " : ""}${state}`,
        };
      }
    } catch (e) {
      console.warn("BigDataCloud reverse geocode failed:", e);
    }

    // 3. Coordinate remains source of truth, representation indicates unavailable address
    return {
      latitude,
      longitude,
      province: "",
      city: "",
      district: "",
      shortLocation: "Alamat tidak tersedia",
      fullAddress: `Koordinat: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
    };
  },

  /**
   * Menghitung jarak lurus menggunakan Haversine Formula (Requirement V)
   * TIDAK BOLEH MENGHASILKAN JARAK PALSU.
   * Jika item online: return "Online"
   * Jika koordinat tidak lengkap: return null
   * @param {{ latitude: number, longitude: number } | number} origin
   * @param {{ latitude: number, longitude: number } | number} destination
   * @returns {number | null} jarak dalam meter
   */
  calculateDistance(origin, destination, lat2Param, lon2Param) {
    let lat1, lon1, lat2, lon2;

    if (typeof origin === "object" && origin !== null) {
      lat1 = origin.latitude;
      lon1 = origin.longitude;
    } else {
      lat1 = origin;
      lon1 = destination;
    }

    if (typeof destination === "object" && destination !== null) {
      lat2 = destination.latitude;
      lon2 = destination.longitude;
    } else {
      lat2 = lat2Param;
      lon2 = lon2Param;
    }

    if (
      lat1 === undefined || lat1 === null ||
      lon1 === undefined || lon1 === null ||
      lat2 === undefined || lat2 === null ||
      lon2 === undefined || lon2 === null
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
  },

  /**
   * Format meter menjadi teks ramah pengguna (Requirement V)
   * @param {number|null} meters
   * @param {boolean} isOnlineService
   * @returns {string} Contoh: "450 m", "2.4 km", "Online", atau "Atur lokasi untuk melihat jarak"
   */
  formatDistance(meters, isOnlineService = false) {
    if (isOnlineService) return "Online";
    if (meters === null || meters === undefined || isNaN(meters)) {
      return "Atur lokasi untuk melihat jarak";
    }

    const m = Number(meters);
    if (m < 1000) {
      return `${Math.max(10, Math.round(m))} m`;
    }
    const km = (m / 1000).toFixed(1);
    return `${km.replace(".0", "")} km`;
  },

  /**
   * Membuka tautan navigasi Google Maps (Requirement W)
   * Destination coordinate = target
   * Origin coordinate = user's genuine current location
   */
  openNavigation(targetLat, targetLon, originLat = null, originLon = null) {
    if (originLat && originLon) {
      return `https://www.google.com/maps/dir/?api=1&origin=${originLat},${originLon}&destination=${targetLat},${targetLon}&travelmode=driving`;
    }
    return `https://www.google.com/maps/search/?api=1&query=${targetLat},${targetLon}`;
  },
};
