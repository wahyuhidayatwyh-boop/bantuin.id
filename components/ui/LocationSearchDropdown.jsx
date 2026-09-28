"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { INDONESIA_REGION_DATA } from "@/lib/data/indonesiaRegions";
import { 
  MapPin, 
  Search, 
  ChevronDown, 
  X, 
  Check, 
  Compass, 
  Loader2, 
  Building 
} from "lucide-react";

// Pre-compute flattened locations list for ultra fast search
function generateFlattenedLocations() {
  const list = [];
  const popularCitiesSet = new Set();

  for (const [province, citiesObj] of Object.entries(INDONESIA_REGION_DATA)) {
    for (const [cityName, districts] of Object.entries(citiesObj)) {
      // Add Kota/Kabupaten itself as a primary option
      list.push({
        id: `${cityName}-${province}`,
        title: cityName,
        subtitle: province,
        fullLabel: `${cityName}, ${province}`,
        city: cityName,
        province: province,
        district: "",
        isCityOnly: true,
      });

      popularCitiesSet.add(cityName);

      // Add each district/kecamatan
      if (Array.isArray(districts)) {
        for (const dist of districts) {
          list.push({
            id: `${dist}-${cityName}-${province}`,
            title: `${dist}, ${cityName}`,
            subtitle: province,
            fullLabel: `${dist}, ${cityName}`,
            city: cityName,
            province: province,
            district: dist,
            isCityOnly: false,
          });
        }
      }
    }
  }

  return list;
}

const ALL_LOCATIONS = generateFlattenedLocations();

const POPULAR_PRESETS = [
  "Kota Bekasi",
  "Jakarta Selatan",
  "Kota Bandung",
  "Kota Depok",
  "Kota Surabaya",
  "Kota Yogyakarta",
  "Kota Tangerang",
  "Kota Semarang",
  "Kota Banjarmasin",
  "Kota Medan",
  "Kota Makassar",
  "Kota Malang",
];

export default function LocationSearchDropdown({
  value,
  onChange,
  onDetectGPS,
  isDetectingGPS = false,
  placeholder = "Cari kota atau kecamatan...",
  required = false,
  error = "",
  className = "",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  // Filtered locations
  const filteredList = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      // Default initial display: curated prominent cities & districts
      return ALL_LOCATIONS.filter((item) => 
        item.isCityOnly || POPULAR_PRESETS.some((p) => item.city.includes(p))
      ).slice(0, 40);
    }

    return ALL_LOCATIONS.filter((item) => {
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchSub = item.subtitle.toLowerCase().includes(q);
      const matchCity = item.city.toLowerCase().includes(q);
      const matchDist = item.district ? item.district.toLowerCase().includes(q) : false;
      return matchTitle || matchSub || matchCity || matchDist;
    }).slice(0, 50);
  }, [searchQuery]);

  // Handle click outside to close
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Autofocus search input when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery("");
    }
  }, [isOpen]);

  const handleSelect = (selectedLabel) => {
    onChange?.(selectedLabel);
    setIsOpen(false);
    setSearchQuery("");
  };

  const handleGPSClick = async () => {
    if (onDetectGPS) {
      const loc = await onDetectGPS();
      if (loc) {
        if (typeof loc === "string") {
          onChange?.(loc);
        } else if (loc.city) {
          onChange?.(loc.city);
        } else if (loc.shortLocation) {
          onChange?.(loc.shortLocation);
        }
        setIsOpen(false);
      }
    }
  };

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      {/* Trigger Button / Input Display */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between text-left px-4 py-2.5 rounded-xl border bg-white transition cursor-pointer text-xs sm:text-sm ${
          isOpen
            ? "border-[#1683FF] ring-2 ring-[#1683FF]/10 shadow-xs"
            : error
            ? "border-rose-400 bg-rose-50/20"
            : "border-slate-200 hover:border-slate-300"
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <MapPin className={`w-4 h-4 shrink-0 transition ${value ? "text-[#1683FF]" : "text-slate-400"}`} />
          <span className={`truncate font-medium ${value ? "text-slate-900 font-semibold" : "text-slate-400"}`}>
            {value || placeholder}
          </span>
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 ml-2 transition-transform duration-200 ${isOpen ? "rotate-180 text-[#1683FF]" : ""}`} />
      </button>

      {/* Dropdown Floating Panel */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 top-full mt-1.5 bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          
          {/* Search Bar Header */}
          <div className="p-3 border-b border-slate-100 bg-slate-50/60">
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ketik nama kota, kabupaten, atau kecamatan..."
                className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-[#1683FF] focus:ring-1 focus:ring-[#1683FF]/20"
                onKeyDown={(e) => {
                  if (e.key === "Escape") setIsOpen(false);
                  if (e.key === "Enter" && filteredList.length > 0) {
                    e.preventDefault();
                    handleSelect(filteredList[0].fullLabel);
                  }
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 text-slate-400 hover:text-slate-600 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Quick Filter Chips (Popular Indonesian Cities) */}
            {!searchQuery && (
              <div className="flex items-center gap-1.5 pt-2.5 overflow-x-auto no-scrollbar pb-0.5">
                <span className="text-[10px] font-bold text-slate-400 shrink-0 uppercase tracking-wider">
                  Populer:
                </span>
                {POPULAR_PRESETS.slice(0, 6).map((pop) => (
                  <button
                    key={pop}
                    type="button"
                    onClick={() => setSearchQuery(pop.replace("Kota ", ""))}
                    className="text-[10px] px-2 py-0.5 rounded-md bg-white border border-slate-200 hover:border-[#1683FF] hover:text-[#1683FF] text-slate-600 font-medium whitespace-nowrap transition cursor-pointer shrink-0"
                  >
                    {pop.replace("Kota ", "")}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* GPS Detection Action Button */}
          {onDetectGPS && (
            <div className="px-3 py-2 border-b border-slate-100 bg-blue-50/40">
              <button
                type="button"
                onClick={handleGPSClick}
                disabled={isDetectingGPS}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-white hover:bg-blue-50 text-[#1683FF] border border-blue-200/80 transition text-xs font-bold cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  {isDetectingGPS ? (
                    <Loader2 className="w-4 h-4 animate-spin text-[#1683FF]" />
                  ) : (
                    <Compass className="w-4 h-4 text-[#1683FF]" />
                  )}
                  <span>{isDetectingGPS ? "Mendeteksi Lokasi GPS..." : "Gunakan Lokasi GPS Saya Saat Ini"}</span>
                </div>
                <span className="text-[10px] font-semibold text-blue-600 bg-blue-100/70 px-2 py-0.5 rounded-md">
                  Akurat
                </span>
              </button>
            </div>
          )}

          {/* Results List */}
          <div className="max-h-64 overflow-y-auto divide-y divide-slate-50 p-1">
            {filteredList.length > 0 ? (
              filteredList.map((item) => {
                const isSelected = value === item.fullLabel;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelect(item.fullLabel)}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition cursor-pointer text-xs ${
                      isSelected
                        ? "bg-blue-50/80 text-[#1683FF] font-bold"
                        : "hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                        isSelected 
                          ? "bg-[#1683FF] text-white" 
                          : item.isCityOnly 
                          ? "bg-slate-100 text-slate-500" 
                          : "bg-blue-50 text-[#1683FF]"
                      }`}>
                        {item.isCityOnly ? <Building className="w-3.5 h-3.5" /> : <MapPin className="w-3.5 h-3.5" />}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-900 truncate leading-snug">
                          {item.title}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate mt-0.5">
                          {item.subtitle}
                        </div>
                      </div>
                    </div>

                    {isSelected && (
                      <Check className="w-4 h-4 text-[#1683FF] shrink-0 ml-2" />
                    )}
                  </button>
                );
              })
            ) : (
              <div className="p-6 text-center text-xs text-slate-400">
                <MapPin className="w-6 h-6 mx-auto mb-1 text-slate-300" />
                <p className="font-medium text-slate-600">Lokasi &ldquo;{searchQuery}&rdquo; tidak ditemukan</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Coba cari dengan nama kota atau provinsi lain</p>
                <button
                  type="button"
                  onClick={() => handleSelect(searchQuery)}
                  className="mt-3 inline-block px-3 py-1.5 bg-blue-50 text-[#1683FF] rounded-lg font-bold text-[11px] hover:bg-blue-100 transition"
                >
                  Gunakan &ldquo;{searchQuery}&rdquo; sebagai kustom
                </button>
              </div>
            )}
          </div>

          {/* Footer Info */}
          <div className="px-3 py-2 bg-slate-50 border-t border-slate-100 text-[10px] text-slate-400 flex items-center justify-between">
            <span>Data Wilayah Resmi Indonesia (38 Provinsi)</span>
            <span>{filteredList.length} Lokasi Tersedia</span>
          </div>
        </div>
      )}
    </div>
  );
}
