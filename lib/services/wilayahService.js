// SERVICE DATA WILAYAH INDONESIA LENGKAP 38 PROVINSI & 514 KABUPATEN/KOTA
// Mendukung OpenAPI 'apiindonesia.id', endpoint terbuka BPS/Kemendagri, serta Offline Dataset Instan

import { INDONESIA_REGION_DATA, PROVINCE_LIST } from "@/lib/data/indonesiaRegions";

const API_INDONESIA_BASE = "https://use.apiindonesia.id/api/v1/wilayah";
const EMSIFA_BASE = "https://emsifa.github.io/api-wilayah-indonesia/api";

// Cache in-memory
const cache = {
  provinces: null,
  regencies: {},
  districts: {},
};

/**
 * Mendapatkan Daftar 38 Provinsi
 */
export async function getProvinces(apiKey = null) {
  if (cache.provinces && cache.provinces.length > 0) return cache.provinces;

  // 1. Coba lewat API Indonesia (jika ada API Key)
  if (apiKey || process.env.NEXT_PUBLIC_API_INDONESIA_KEY) {
    try {
      const key = apiKey || process.env.NEXT_PUBLIC_API_INDONESIA_KEY;
      const res = await fetch(`${API_INDONESIA_BASE}/provinsi?per_page=100`, {
        headers: { "x-api-key": key },
      });
      if (res.ok) {
        const json = await res.json();
        if (json.data && json.data.length > 0) {
          const list = json.data.map((p) => ({
            id: p.id || p.code,
            name: p.alt_name || p.name,
          }));
          cache.provinces = list;
          return list;
        }
      }
    } catch (e) {
      console.warn("API Indonesia (apiindonesia.id) fetch failed, switching to backup...", e);
    }
  }

  // 2. Coba lewat Open API Wilayah BPS / Kemendagri
  try {
    const res = await fetch(`${EMSIFA_BASE}/provinces.json`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        cache.provinces = data;
        return data;
      }
    }
  } catch (err) {
    console.warn("Open API Wilayah network issue, using instant standalone dataset.");
  }

  // 3. Fallback Instan (Offline Standalone Dataset 38 Provinsi)
  const fallbackList = PROVINCE_LIST.map((name, idx) => ({
    id: String(idx + 1),
    name: name,
  }));
  cache.provinces = fallbackList;
  return fallbackList;
}

/**
 * Mendapatkan Daftar Kabupaten/Kota berdasarkan ID atau Nama Provinsi
 */
export async function getRegencies(provinceIdOrName, apiKey = null) {
  if (!provinceIdOrName) return [];
  if (cache.regencies[provinceIdOrName]) return cache.regencies[provinceIdOrName];

  // 1. Coba lewat API Indonesia (jika ada API Key)
  if (apiKey || process.env.NEXT_PUBLIC_API_INDONESIA_KEY) {
    try {
      const key = apiKey || process.env.NEXT_PUBLIC_API_INDONESIA_KEY;
      const res = await fetch(`${API_INDONESIA_BASE}/kabupaten?provinsi_id=${provinceIdOrName}&per_page=100`, {
        headers: { "x-api-key": key },
      });
      if (res.ok) {
        const json = await res.json();
        if (json.data && json.data.length > 0) {
          const list = json.data.map((r) => ({
            id: r.id || r.code,
            name: r.alt_name || r.name,
          }));
          cache.regencies[provinceIdOrName] = list;
          return list;
        }
      }
    } catch (e) {
      console.warn("API Indonesia getRegencies failed:", e);
    }
  }

  // 2. Coba lewat Open API Wilayah
  if (!isNaN(provinceIdOrName)) {
    try {
      const res = await fetch(`${EMSIFA_BASE}/regencies/${provinceIdOrName}.json`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          cache.regencies[provinceIdOrName] = data;
          return data;
        }
      }
    } catch (e) {
      // ignore
    }
  }

  // 3. Fallback Instan Dataset
  const provData = INDONESIA_REGION_DATA[provinceIdOrName] || INDONESIA_REGION_DATA["Kalimantan Selatan"] || {};
  const cityNames = Object.keys(provData);
  const fallback = cityNames.map((cName, idx) => ({
    id: `${provinceIdOrName}-${idx}`,
    name: cName,
  }));
  cache.regencies[provinceIdOrName] = fallback;
  return fallback;
}

/**
 * Mendapatkan Daftar Kecamatan berdasarkan ID atau Nama Kabupaten
 */
export async function getDistricts(regencyIdOrName, provinceName = null, apiKey = null) {
  if (!regencyIdOrName) return [];
  if (cache.districts[regencyIdOrName]) return cache.districts[regencyIdOrName];

  // 1. Coba lewat API Indonesia (jika ada API Key)
  if (apiKey || process.env.NEXT_PUBLIC_API_INDONESIA_KEY) {
    try {
      const key = apiKey || process.env.NEXT_PUBLIC_API_INDONESIA_KEY;
      const res = await fetch(`${API_INDONESIA_BASE}/kecamatan?kabupaten_id=${regencyIdOrName}&per_page=100`, {
        headers: { "x-api-key": key },
      });
      if (res.ok) {
        const json = await res.json();
        if (json.data && json.data.length > 0) {
          const list = json.data.map((d) => ({
            id: d.id || d.code,
            name: d.alt_name || d.name,
          }));
          cache.districts[regencyIdOrName] = list;
          return list;
        }
      }
    } catch (e) {
      console.warn("API Indonesia getDistricts failed:", e);
    }
  }

  // 2. Coba lewat Open API Wilayah
  if (!isNaN(regencyIdOrName)) {
    try {
      const res = await fetch(`${EMSIFA_BASE}/districts/${regencyIdOrName}.json`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          cache.districts[regencyIdOrName] = data;
          return data;
        }
      }
    } catch (e) {
      // ignore
    }
  }

  // 3. Fallback Instan Dataset
  const provData = INDONESIA_REGION_DATA[provinceName] || INDONESIA_REGION_DATA["Kalimantan Selatan"] || {};
  const districtNames = provData[regencyIdOrName] || [];
  const fallback = districtNames.map((dName, idx) => ({
    id: `${regencyIdOrName}-${idx}`,
    name: dName,
  }));
  cache.districts[regencyIdOrName] = fallback;
  return fallback;
}
