"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import type { NeedHelpMarker } from "./AdminMap";

if (typeof window !== "undefined") {
  delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const redIcon =
  typeof window !== "undefined"
    ? new L.Icon({
        iconUrl:
          "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
        shadowUrl:
          "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      })
    : null;

interface AdminMapInnerProps {
  center: [number, number];
  markers: NeedHelpMarker[];
  adminPosition: [number, number] | null;
}

export default function AdminMapInner({
  center,
  markers,
  adminPosition,
}: AdminMapInnerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || mapRef.current) return;

    const map = L.map(container).setView(center, 12);
    mapRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    const timeoutId = setTimeout(() => {
      map.invalidateSize();
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      map.remove();
      mapRef.current = null;
      markersRef.current = [];
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

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    if (adminPosition) {
      const adminMarker = L.marker(adminPosition).addTo(map);
      adminMarker.bindPopup("Your location");
      markersRef.current.push(adminMarker);
    }

    markers.forEach((m) => {
      const marker = L.marker([m.lat, m.lng], redIcon ?? undefined).addTo(map);
      const name = m.member?.fullName ?? "Unknown";
      const phone = m.member?.phone ? `<p>${escapeHtml(m.member.phone)}</p>` : "";
      const address = m.member?.address
        ? `<p class="text-slate-600">${escapeHtml(m.member.address)}</p>`
        : "";
      const medical = m.member?.medicalConditions?.trim()
        ? `<p class="text-amber-700 text-xs mt-1"><strong>Medical:</strong> ${escapeHtml(m.member.medicalConditions)}</p>`
        : "";
      const locationSourceNote = m.fromAddress
        ? '<p class="text-xs text-slate-500 italic mt-1">Location from registered address (not from device)</p>'
        : '<p class="text-xs text-emerald-600 italic mt-1">Location from their device</p>';
      const coords = `${m.lat.toFixed(6)}, ${m.lng.toFixed(6)}`;
      const copyCoords = `navigator.clipboard.writeText(this.dataset.coords).then(()=>{const b=this;b.textContent='Copied!';setTimeout(()=>{b.textContent='Copy'},2000)})`;
      marker.bindPopup(
        `<div class="text-sm min-w-[180px]"><p class="font-medium">${escapeHtml(name)}</p>${phone}${address}${medical}${locationSourceNote}<p class="text-slate-500 text-xs font-mono mt-1.5">${coords}</p><button type="button" data-coords="${coords}" onclick="${copyCoords}" class="mt-2 rounded bg-slate-200 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-300">Copy</button></div>`
      );
      markersRef.current.push(marker);
    });
  }, [adminPosition, markers]);

  return <div ref={containerRef} className="h-full w-full" />;
}
