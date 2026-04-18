"use client";

import { useEffect, useRef } from "react";

interface MapPoint {
  lat: number;
  lng: number;
  country: string;
  city: string;
  visits: number;
}

interface Props { points: MapPoint[] }

export default function VisitMap({ points }: Props) {
  const mapRef  = useRef<HTMLDivElement>(null);
  const initRef = useRef(false);

  useEffect(() => {
    if (!mapRef.current || initRef.current || points.length === 0) return;
    initRef.current = true;

    import("leaflet").then(L => {
      // Fix default marker icon paths broken by webpack
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const map = L.map(mapRef.current!).setView([20, 0], 2);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 18,
      }).addTo(map);

      const maxVisits = Math.max(...points.map(p => p.visits), 1);

      points.forEach(point => {
        const radius = 6 + (point.visits / maxVisits) * 20;
        const opacity = 0.5 + (point.visits / maxVisits) * 0.45;

        L.circleMarker([point.lat, point.lng], {
          radius,
          fillColor: "#2070B8",
          color: "#fff",
          weight: 1.5,
          opacity: 1,
          fillOpacity: opacity,
        })
          .addTo(map)
          .bindPopup(
            `<strong>${point.city || point.country}</strong><br/>${point.country}<br/>${point.visits} visit${point.visits !== 1 ? "s" : ""}`
          );
      });
    });
  }, [points]);

  if (points.length === 0) {
    return (
      <div style={{ height: 400, display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc", borderRadius: 12, border: "1px solid #e2e8f0", color: "#94a3b8", fontSize: 14 }}>
        No geographic data yet — visits with geolocation will appear here.
      </div>
    );
  }

  return (
    <>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <div ref={mapRef} style={{ height: 420, borderRadius: 12, overflow: "hidden", border: "1px solid #e2e8f0" }} />
    </>
  );
}
