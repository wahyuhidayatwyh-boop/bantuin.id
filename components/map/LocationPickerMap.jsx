"use client";

import React, { useEffect, useRef, useState } from "react";
import { MapPin, Navigation, Crosshair, ZoomIn, ZoomOut } from "lucide-react";

export default function LocationPickerMap({
  latitude,
  longitude,
  onChange,
  onUseGps,
  isDetectingGPS = false,
  height = "280px",
}) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const [currentCoords, setCurrentCoords] = useState({
    latitude: latitude || -6.2241,
    longitude: longitude || 106.8294,
  });

  // Sync state if prop changes
  useEffect(() => {
    if (
      typeof latitude === "number" &&
      typeof longitude === "number" &&
      !isNaN(latitude) &&
      !isNaN(longitude)
    ) {
      setCurrentCoords({ latitude, longitude });
      if (mapInstanceRef.current && markerRef.current) {
        markerRef.current.setLatLng([latitude, longitude]);
        mapInstanceRef.current.setView([latitude, longitude], 16, { animate: true });
      }
    }
  }, [latitude, longitude]);

  useEffect(() => {
    if (typeof window === "undefined" || !mapRef.current) return;

    let isSubscribed = true;

    import("leaflet").then((L) => {
      if (!isSubscribed || !mapRef.current) return;

      // Fix default marker icon issues in Next.js bundler
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const startLat = typeof latitude === "number" && !isNaN(latitude) ? latitude : -6.2241;
      const startLng = typeof longitude === "number" && !isNaN(longitude) ? longitude : 106.8294;

      if (!mapInstanceRef.current) {
        const map = L.map(mapRef.current, {
          zoomControl: false,
          attributionControl: false,
          scrollWheelZoom: "center",
        }).setView([startLat, startLng], 16);

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
        }).addTo(map);

        // Custom High-Visibility Draggable Pin Icon
        const customPinIcon = L.divIcon({
          className: "bantuin-custom-pin",
          html: `
            <div style="position: relative; width: 38px; height: 48px; display: flex; flex-direction: column; align-items: center; cursor: grab;">
              <div style="width: 32px; height: 32px; border-radius: 50% 50% 50% 0; background: linear-gradient(135deg, #1683FF 0%, #0F6FE5 100%); transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(22,131,255,0.45); border: 2.5px solid #ffffff;">
                <div style="width: 10px; height: 10px; border-radius: 50%; background: #ffffff; transform: rotate(45deg);"></div>
              </div>
              <div style="width: 8px; height: 4px; border-radius: 50%; background: rgba(0,0,0,0.35); margin-top: -2px; filter: blur(1px);"></div>
            </div>
          `,
          iconSize: [38, 48],
          iconAnchor: [19, 46],
        });

        const marker = L.marker([startLat, startLng], {
          icon: customPinIcon,
          draggable: true,
          zIndexOffset: 1000,
        }).addTo(map);

        markerRef.current = marker;

        // Click on map moves pin directly to clicked point
        map.on("click", (e) => {
          const { lat, lng } = e.latlng;
          marker.setLatLng([lat, lng]);
          setCurrentCoords({ latitude: lat, longitude: lng });
          onChange?.({ latitude: lat, longitude: lng });
        });

        // Drag marker to exact spot
        marker.on("dragend", (e) => {
          const { lat, lng } = e.target.getLatLng();
          setCurrentCoords({ latitude: lat, longitude: lng });
          onChange?.({ latitude: lat, longitude: lng });
        });

        mapInstanceRef.current = map;
      }
    });

    return () => {
      isSubscribed = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  const handleZoomIn = () => {
    if (mapInstanceRef.current) mapInstanceRef.current.zoomIn();
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) mapInstanceRef.current.zoomOut();
  };

  const handleRecenter = () => {
    if (mapInstanceRef.current && currentCoords) {
      mapInstanceRef.current.setView([currentCoords.latitude, currentCoords.longitude], 17, { animate: true });
    }
  };

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-slate-200/90 shadow-sm bg-slate-100">
      {/* Map Canvas */}
      <div 
        ref={mapRef} 
        style={{ height, width: "100%" }} 
        className="z-0" 
      />

      {/* Top Banner Guide */}
      <div className="absolute top-2.5 left-2.5 right-2.5 z-10 pointer-events-none flex items-center justify-between gap-2">
        <div className="bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-2 text-xs font-semibold text-slate-800 pointer-events-auto">
          <MapPin className="w-3.5 h-3.5 text-[#1683FF] shrink-0" />
          <span className="text-[11px] truncate">
            Klik peta atau geser pin biru untuk set titik
          </span>
        </div>

        {onUseGps && (
          <button
            type="button"
            onClick={onUseGps}
            disabled={isDetectingGPS}
            className="bg-white/95 hover:bg-white text-[#1683FF] text-[11px] font-bold px-3 py-1.5 rounded-xl border border-blue-200 shadow-xs flex items-center gap-1.5 transition active:scale-95 pointer-events-auto shrink-0 cursor-pointer"
          >
            <Navigation className={`w-3 h-3 ${isDetectingGPS ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">GPS Saya</span>
          </button>
        )}
      </div>

      {/* Coordinates Display & Map Zoom Controls (Bottom) */}
      <div className="absolute bottom-2.5 left-2.5 right-2.5 z-10 flex items-center justify-between pointer-events-none">
        <div className="bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] font-mono font-medium text-white shadow-xs pointer-events-auto">
          {currentCoords.latitude.toFixed(5)}, {currentCoords.longitude.toFixed(5)}
        </div>

        <div className="flex items-center gap-1 pointer-events-auto bg-white/90 backdrop-blur-md p-1 rounded-xl border border-slate-200 shadow-xs">
          <button
            type="button"
            onClick={handleRecenter}
            title="Pusatkan ke Pin"
            className="w-7 h-7 flex items-center justify-center text-slate-600 hover:text-[#1683FF] hover:bg-slate-100 rounded-lg transition"
          >
            <Crosshair className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleZoomIn}
            title="Perbesar"
            className="w-7 h-7 flex items-center justify-center text-slate-600 hover:text-[#1683FF] hover:bg-slate-100 rounded-lg transition"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            title="Perkecil"
            className="w-7 h-7 flex items-center justify-center text-slate-600 hover:text-[#1683FF] hover:bg-slate-100 rounded-lg transition"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
