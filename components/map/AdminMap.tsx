"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { KENNEDY_BAY_CENTER } from "@/lib/mapConstants";

const AdminMapInner = dynamic(() => import("./AdminMapInner"), { ssr: false });

export interface NeedHelpMarker {
  _id: string;
  lat: number;
  lng: number;
  member?: { _id: string; fullName?: string; phone?: string; address?: string; medicalConditions?: string };
  /** True when lat/lng came from geocoding the member's registered address */
  fromAddress?: boolean;
}

interface AdminMapProps {
  markers: NeedHelpMarker[];
  fullScreen?: boolean;
}

export function AdminMap({ markers, fullScreen }: AdminMapProps) {
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMapReady(true), 0);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!navigator?.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setPosition([pos.coords.latitude, pos.coords.longitude]),
      () => {},
      { enableHighAccuracy: true }
    );
  }, []);

  const center = position ?? (markers.length ? [markers[0].lat, markers[0].lng] : KENNEDY_BAY_CENTER);

  return (
    <div
      className={
        fullScreen
          ? "w-full h-full relative overflow-hidden bg-slate-200"
          : "w-full h-full min-h-[280px] relative rounded-lg overflow-hidden bg-slate-200"
      }
    >
      {mapReady && (
        <AdminMapInner center={center} markers={markers} adminPosition={position} />
      )}
    </div>
  );
}
