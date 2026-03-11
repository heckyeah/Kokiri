"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";

if (typeof window !== "undefined") {
  delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  });
}

function escapeHtml(s: string): string {
  const div = typeof document !== "undefined" ? document.createElement("div") : null;
  if (div) {
    div.textContent = s;
    return div.innerHTML;
  }
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
}

export default function UserMapInner({
  center,
  position,
  address,
  coordinatesStr,
}: {
  center: [number, number];
  position: [number, number] | null;
  address?: string | null;
  coordinatesStr?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || mapRef.current) return;

    const map = L.map(container).setView(center, 14);
    mapRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    const t = setTimeout(() => map.invalidateSize(), 100);

    return () => {
      clearTimeout(t);
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.setView(center, map.getZoom());
  }, [center]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (markerRef.current) {
      markerRef.current.remove();
      markerRef.current = null;
    }

    if (position) {
      const marker = L.marker(position).addTo(map);
      map.setView(position, map.getZoom());
      const coords = coordinatesStr ?? `${position[0].toFixed(6)}, ${position[1].toFixed(6)}`;
      const copyCoords = `navigator.clipboard.writeText(this.dataset.coords).then(()=>{const b=this;b.textContent='Copied!';setTimeout(()=>{b.textContent='Copy'},2000)})`;
      const addressHtml = address ? `<p class="text-slate-600 text-xs mb-1.5">${escapeHtml(address)}</p>` : "";
      const popupHtml =
        `<div class="text-sm min-w-[200px]"><p class="font-medium text-slate-700 mb-1">Your location</p>${addressHtml}<div class="flex items-center gap-2"><p class="text-slate-500 text-xs font-mono flex-1 min-w-0 truncate">${escapeHtml(coords)}</p><button type="button" data-coords="${escapeHtml(coords)}" onclick="${copyCoords}" class="shrink-0 rounded bg-slate-200 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-300">Copy</button></div></div>`;
      marker.bindPopup(popupHtml);
      markerRef.current = marker;
    }
  }, [position, address, coordinatesStr]);

  return <div ref={containerRef} className="h-full w-full" />;
}
