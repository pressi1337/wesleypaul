"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";

interface MapPoint {
  lat: number;
  lng: number;
  country: string;
  city: string;
  visits: number;
}

interface Props { points: MapPoint[] }

export default function VisitMap({ points }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current || points.length === 0) return;
    if (mapRef.current) return; // already initialised

    import("leaflet").then(L => {
      if (!containerRef.current || mapRef.current) return;

      // Fix webpack-broken default marker paths
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const map = L.map(containerRef.current!, {
        worldCopyJump:        false,
        maxBounds:            [[-90, -180], [90, 180]],
        maxBoundsViscosity:   1.0,
      }).setView([20, 0], 2);
      mapRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 18,
        noWrap:  true,
      }).addTo(map);

      const maxVisits = Math.max(...points.map(p => p.visits), 1);

      points.forEach(point => {
        const radius  = 6 + (point.visits / maxVisits) * 20;
        const opacity = 0.5 + (point.visits / maxVisits) * 0.45;

        L.circleMarker([point.lat, point.lng], {
          radius, fillColor: "#2070B8", color: "#fff",
          weight: 1.5, opacity: 1, fillOpacity: opacity,
        })
          .addTo(map)
          .bindPopup(
            `<strong>${point.city || point.country}</strong><br/>
             ${point.country}<br/>
             ${point.visits} visit${point.visits !== 1 ? "s" : ""}`
          );
      });

      // Recalculate tile layout after the container is fully painted
      setTimeout(() => map.invalidateSize(), 150);
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  // Re-run only when the points array reference changes (data reload)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [points]);

  if (points.length === 0) {
    return (
      <div style={{ height: 400, display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc", borderRadius: 12, border: "1px solid #e2e8f0", color: "#94a3b8", fontSize: 14 }}>
        No geographic data yet — visits with geolocation will appear here.
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{ height: 420, borderRadius: 12, overflow: "hidden", border: "1px solid #e2e8f0" }}
    />
  );
}
