"use client";

import React, { useEffect, useRef, useState } from "react";
import { 
  getNavigationUrl, 
  calculateDistanceInMeters, 
  formatDistanceText 
} from "@/lib/services/gpsService";
import { Navigation, Compass, Crosshair, MapPin } from "lucide-react";

export default function MapComponent({ 
  center = [-6.3628, 106.8315], // Default UI Depok coordinates
  zoom = 15,
  points = [],
  userLocation = null,
  onSelectPoint = null,
  height = "380px",
  showRouteLine = true,
  interactive = true,
}) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [selectedPointState, setSelectedPointState] = useState(null);

  // Single target point if points has exactly 1 element
  const singleTargetPoint = points.length === 1 ? points[0] : selectedPointState;

  useEffect(() => {
    if (typeof window === "undefined" || !mapRef.current) return;

    // Dynamically load Leaflet in browser
    import("leaflet").then((L) => {
      // Fix leaflet default icon issues in bundler
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const hasUserLocation = Boolean(
        userLocation &&
        typeof userLocation.latitude === "number" &&
        typeof userLocation.longitude === "number" &&
        !isNaN(userLocation.latitude) &&
        !isNaN(userLocation.longitude)
      );

      const effectiveCenter = hasUserLocation
        ? [userLocation.latitude, userLocation.longitude]
        : center;

      if (!mapInstanceRef.current) {
        const map = L.map(mapRef.current, {
          zoomControl: interactive,
          dragging: interactive,
          scrollWheelZoom: interactive ? "center" : false,
        }).setView(effectiveCenter, zoom);
        
        // OpenStreetMap Tile Layer
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
        }).addTo(map);

        mapInstanceRef.current = map;
      }

      const map = mapInstanceRef.current;

      // Clear existing markers & layers (except tileLayer)
      map.eachLayer((layer) => {
        if (layer instanceof L.Marker || layer instanceof L.Circle || layer instanceof L.Polyline) {
          map.removeLayer(layer);
        }
      });

      const boundsCoordinates = [];

      // 1. Render User GPS Marker if available
      let userLat = null;
      let userLng = null;
      if (hasUserLocation) {
        userLat = Number(userLocation.latitude);
        userLng = Number(userLocation.longitude);
        boundsCoordinates.push([userLat, userLng]);

        const userGpsIcon = L.divIcon({
          className: "bantuin-live-gps-pin",
          html: `
            <div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;">
              <div style="position: absolute; width: 36px; height: 36px; border-radius: 50%; background: rgba(22, 131, 255, 0.28); animation: userGpsPulse 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
              <div style="position: absolute; width: 16px; height: 16px; border-radius: 50%; background: #1683FF; border: 3px solid #ffffff; box-shadow: 0 2px 8px rgba(0,0,0,0.35);"></div>
            </div>
          `,
          iconSize: [36, 36],
          iconAnchor: [18, 18],
        });

        const userMarker = L.marker([userLat, userLng], {
          icon: userGpsIcon,
          zIndexOffset: 1000,
        }).addTo(map);

        userMarker.bindPopup(`
          <div style="font-family: system-ui, -apple-system, sans-serif; padding: 6px 8px; min-width: 180px;">
            <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
              <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #1683FF;"></span>
              <strong style="font-size: 12px; color: #102A43;">Posisi GPS Anda</strong>
            </div>
            <div style="font-size: 11px; font-weight: 700; color: #1683FF; margin-bottom: 3px;">
              Akurasi Realtime Aktif
            </div>
            <div style="font-size: 10px; color: #61758A; line-height: 1.35;">
              ${userLocation.address || userLocation.shortLocation || `${userLat.toFixed(4)}, ${userLng.toFixed(4)}`}
            </div>
          </div>
        `);

        // Radius circle around user
        L.circle([userLat, userLng], {
          color: "#1683FF",
          fillColor: "#1683FF",
          fillOpacity: 0.08,
          weight: 1.5,
          radius: 350,
        }).addTo(map);
      }

      // 2. Render Point Markers (Bantuin, Sewa, Jasa, Safe Point)
      points.forEach((point) => {
        if (point.latitude && point.longitude) {
          const pLat = Number(point.latitude);
          const pLng = Number(point.longitude);
          boundsCoordinates.push([pLat, pLng]);

          // Color & vertical typing
          let pinColor = "#0284C7"; // Safe point sky blue
          let typeLabel = "Safe Point Resmi";
          let badgeBg = "#E0F2FE";
          let badgeText = "#0369A1";

          if (point.type === "request" || point.rewardAmount !== undefined) {
            pinColor = "#059669"; // Emerald
            typeLabel = "Permintaan Bantuan";
            badgeBg = "#D1FAE5";
            badgeText = "#047857";
          } else if (point.type === "rental" || point.dailyPrice !== undefined || point.pricePerDay !== undefined) {
            pinColor = "#1683FF"; // Brand Blue
            typeLabel = "Titik Pengambilan Sewa";
            badgeBg = "#DBEAFE";
            badgeText = "#1D4ED8";
          } else if (point.type === "service" || point.startingPrice !== undefined) {
            pinColor = "#7C3AED"; // Violet
            typeLabel = "Studio & Workshop Jasa";
            badgeBg = "#EDE9FE";
            badgeText = "#6D28D9";
          }

          const popupTitle = point.name || point.title || "Titik Tujuan";
          const popupAddress = point.address || point.location || point.locationName || "";

          // Subtitle / Price
          let priceText = "";
          if (point.rewardAmount !== undefined) {
            priceText = point.rewardAmount === 0 || point.isVoluntary 
              ? "Bantuan Sukarela" 
              : `Imbalan: Rp ${Number(point.rewardAmount).toLocaleString('id-ID')}`;
          } else if (point.dailyPrice !== undefined || point.pricePerDay !== undefined) {
            const pr = point.dailyPrice || point.pricePerDay;
            priceText = `Sewa: Rp ${Number(pr).toLocaleString('id-ID')} / hari`;
          } else if (point.startingPrice !== undefined || point.priceStartFrom !== undefined) {
            const pr = point.startingPrice || point.priceStartFrom;
            priceText = `Tarif Mulai: Rp ${Number(pr).toLocaleString('id-ID')}`;
          } else {
            priceText = point.operationalHours || "Titik Aman Transaksi";
          }

          // Distance from user GPS
          let distanceHtml = "";
          if (hasUserLocation) {
            const distMeters = calculateDistanceInMeters(userLat, userLng, pLat, pLng);
            const distFormatted = formatDistanceText(distMeters);
            if (distFormatted) {
              distanceHtml = `
                <div style="display: flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 700; color: #334155; margin-bottom: 6px;">
                  <span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: #1683FF;"></span>
                  <span>${distFormatted} dari posisi Anda</span>
                </div>
              `;
            }
          }

          // Direct navigation URL
          const navUrl = getNavigationUrl(pLat, pLng, userLat, userLng);

          // Custom pin icon with sharp teardrop styling
          const customPinIcon = L.divIcon({
            className: "bantuin-point-marker",
            html: `
              <div style="position: relative; width: 34px; height: 42px; display: flex; flex-direction: column; align-items: center; filter: drop-shadow(0 3px 6px rgba(0,0,0,0.3)); cursor: pointer;">
                <svg width="34" height="42" viewBox="0 0 34 42" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17 0C7.61116 0 0 7.61116 0 17C0 27.5 17 42 17 42C17 42 34 27.5 34 17C34 7.61116 26.3888 0 17 0Z" fill="${pinColor}"/>
                  <circle cx="17" cy="16" r="7.5" fill="#ffffff"/>
                  <circle cx="17" cy="16" r="4" fill="${pinColor}"/>
                </svg>
              </div>
            `,
            iconSize: [34, 42],
            iconAnchor: [17, 42],
            popupAnchor: [0, -38],
          });

          const customPopup = `
            <div style="font-family: system-ui, -apple-system, sans-serif; padding: 6px 8px; min-width: 220px; max-width: 260px;">
              <div style="display: inline-block; padding: 2px 7px; border-radius: 6px; background: ${badgeBg}; color: ${badgeText}; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.3px; margin-bottom: 6px;">
                ${typeLabel}
              </div>
              <strong style="font-size: 13px; font-weight: 800; color: #0F172A; display: block; line-height: 1.35; margin-bottom: 4px;">
                ${popupTitle}
              </strong>
              <div style="font-size: 12px; font-weight: 800; color: ${pinColor}; margin-bottom: 4px;">
                ${priceText}
              </div>
              <div style="font-size: 11px; color: #64748B; line-height: 1.35; margin-bottom: 6px;">
                ${popupAddress}
              </div>
              ${distanceHtml}
              <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #E2E8F0;">
                <a 
                  href="${navUrl}" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  style="display: flex; align-items: center; justify-content: center; gap: 6px; width: 100%; padding: 8px 12px; background: #1683FF; color: #ffffff; text-decoration: none; border-radius: 10px; font-size: 11px; font-weight: 700; box-shadow: 0 2px 6px rgba(22,131,255,0.3); text-align: center; box-sizing: border-box;"
                >
                  <span>Petunjuk Arah Google Maps</span>
                </a>
              </div>
            </div>
          `;

          const marker = L.marker([pLat, pLng], { icon: customPinIcon })
            .addTo(map)
            .bindPopup(customPopup);

          marker.on("click", () => {
            setSelectedPointState(point);
            if (onSelectPoint) {
              onSelectPoint(point);
            }
          });
        }
      });

      // 3. Draw Point-to-Point Dashed Route Line if single destination & user location available
      if (showRouteLine && hasUserLocation && points.length === 1) {
        const target = points[0];
        if (target.latitude && target.longitude) {
          const tLat = Number(target.latitude);
          const tLng = Number(target.longitude);

          L.polyline(
            [
              [userLat, userLng],
              [tLat, tLng]
            ],
            {
              color: "#1683FF",
              weight: 3.5,
              dashArray: "6, 8",
              opacity: 0.85,
            }
          ).addTo(map);
        }
      }

      // 4. Auto-fit bounds or center view
      if (boundsCoordinates.length > 1) {
        const bounds = L.latLngBounds(boundsCoordinates);
        map.fitBounds(bounds, { padding: [45, 45], maxZoom: 16 });
      } else if (hasUserLocation) {
        map.setView([userLocation.latitude, userLocation.longitude], zoom);
      } else if (points.length === 1 && points[0].latitude && points[0].longitude) {
        map.setView([points[0].latitude, points[0].longitude], zoom);
      } else {
        map.setView(center, zoom);
      }
    });

    return () => {
      // Cleanup on unmount
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [center, zoom, points, userLocation, showRouteLine, interactive]);

  // Actions to focus view
  const handleFocusUser = () => {
    if (mapInstanceRef.current && userLocation?.latitude && userLocation?.longitude) {
      mapInstanceRef.current.setView([userLocation.latitude, userLocation.longitude], 16);
    }
  };

  const handleFocusDestination = () => {
    if (mapInstanceRef.current && singleTargetPoint?.latitude && singleTargetPoint?.longitude) {
      mapInstanceRef.current.setView([singleTargetPoint.latitude, singleTargetPoint.longitude], 16);
    }
  };

  return (
    <div className="w-full relative rounded-2xl overflow-hidden border border-[#DCEAF7] shadow-inner bg-slate-100 group">
      <style>{`
        @keyframes userGpsPulse {
          0% { transform: scale(0.6); opacity: 1; }
          70% { transform: scale(1.6); opacity: 0.15; }
          100% { transform: scale(1.9); opacity: 0; }
        }
      `}</style>

      {/* Floating Direct Navigation Control Bar */}
      <div className="absolute top-3 right-3 z-[400] flex items-center gap-1.5 pointer-events-auto">
        {singleTargetPoint && singleTargetPoint.latitude && singleTargetPoint.longitude && (
          <a
            href={getNavigationUrl(
              singleTargetPoint.latitude,
              singleTargetPoint.longitude,
              userLocation?.latitude,
              userLocation?.longitude
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1683FF] hover:bg-[#0F6FE5] text-white text-[11px] font-bold shadow-md transition active:scale-95 border border-white/20"
            title="Buka Navigasi Rute Langsung ke Titik ini di Google Maps"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Navigasi Langsung</span>
            <span className="sm:hidden">Rute</span>
          </a>
        )}

        {userLocation && (
          <button
            type="button"
            onClick={handleFocusUser}
            className="p-1.5 rounded-xl bg-white/95 hover:bg-white text-slate-700 hover:text-[#1683FF] border border-slate-200 shadow-sm transition"
            title="Fokus ke Posisi GPS Saya"
          >
            <Crosshair className="w-4 h-4" />
          </button>
        )}

        {singleTargetPoint && (
          <button
            type="button"
            onClick={handleFocusDestination}
            className="p-1.5 rounded-xl bg-white/95 hover:bg-white text-slate-700 hover:text-emerald-600 border border-slate-200 shadow-sm transition"
            title="Fokus ke Titik Tujuan"
          >
            <MapPin className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Leaflet Mount */}
      <div ref={mapRef} style={{ height }} className="w-full" />
    </div>
  );
}
