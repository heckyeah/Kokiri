"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const MapInner = dynamic(() => import("./UserMapInner"), { ssr: false });

import { KENNEDY_BAY_CENTER } from "@/lib/mapConstants";

const GEOLOCATION_OPTIONS: PositionOptions = {
  timeout: 15000,
  maximumAge: 60000,
  enableHighAccuracy: false, // false = faster, often works via network/cell; true can timeout indoors
};

/** ASCII-only for fetch headers (ISO-8859-1); display name stays "Kōkiri" in UI */
const NOMINATIM_USER_AGENT = "Kokiri/1.0 (Kokiri member map)";

async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`;
  const res = await fetch(url, { headers: { "User-Agent": NOMINATIM_USER_AGENT } });
  if (!res.ok) return null;
  const data = (await res.json()) as { display_name?: string };
  return typeof data?.display_name === "string" ? data.display_name : null;
}

function useReverseGeocode(position: [number, number] | null) {
  const [address, setAddress] = useState<string | null>(null);
  useEffect(() => {
    if (!position) {
      setAddress(null);
      return;
    }
    let cancelled = false;
    const t = setTimeout(() => {
      reverseGeocode(position[0], position[1]).then((addr) => {
        if (!cancelled && addr) setAddress(addr);
      });
    }, 500);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [position?.[0], position?.[1]]);
  return address;
}

interface UserMapProps {
  fullScreen?: boolean;
}

export function UserMap({ fullScreen }: UserMapProps = {}) {
  const [position, setPosition] = useState<[number, number] | null>(null);
  const address = useReverseGeocode(position);
  const [locationMessage, setLocationMessage] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);

  const coordinatesStr = position ? `${position[0].toFixed(6)}, ${position[1].toFixed(6)}` : "";

  useEffect(() => {
    const t = setTimeout(() => setMapReady(true), 0);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!navigator?.geolocation) {
      setLocationMessage("Location not supported — showing Kennedy Bay area.");
      return;
    }

    function onSuccess(pos: GeolocationPosition) {
      setPosition([pos.coords.latitude, pos.coords.longitude]);
      setLocationMessage(null);
    }

    function onError(err: GeolocationPositionError) {
      const isDenied = err.code === err.PERMISSION_DENIED;
      const isTimeout = err.code === err.TIMEOUT_OUT;
      if (isDenied) {
        setLocationMessage("Location access denied. Allow it in your browser to see your position.");
      } else if (isTimeout) {
        setLocationMessage("Location took too long. Showing Kennedy Bay — try again or allow location.");
      } else {
        setLocationMessage("Couldn’t get your location — showing Kennedy Bay area.");
      }
    }

    // First try: fast options (network/cell, often works indoors)
    navigator.geolocation.getCurrentPosition(onSuccess, (err) => {
      const isDenied = err.code === err.PERMISSION_DENIED;
      if (isDenied) {
        onError(err);
        return;
      }
      // Retry once with high accuracy (e.g. timeout or unavailable)
      navigator.geolocation.getCurrentPosition(
        onSuccess,
        onError,
        { timeout: 10000, maximumAge: 0, enableHighAccuracy: true }
      );
    }, GEOLOCATION_OPTIONS);

    // Keep updating position if we get one (e.g. user moves or late fix)
    let watchId: number | null = null;
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        setPosition([pos.coords.latitude, pos.coords.longitude]);
        setLocationMessage(null);
      },
      () => { /* ignore watch errors; we already have a position or message */ },
      { ...GEOLOCATION_OPTIONS, maximumAge: 10000 }
    );
    watchId = id;
    return () => {
      if (watchId != null) navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  return (
    <div
      className={
        fullScreen
          ? "w-full h-full relative overflow-hidden bg-slate-200"
          : "w-full h-full min-h-[280px] relative rounded-lg overflow-hidden bg-slate-200"
      }
      style={fullScreen ? undefined : { minHeight: "280px" }}
    >
      {mapReady && (
        <MapInner
          key="user-map"
          center={position ?? KENNEDY_BAY_CENTER}
          position={position}
          address={address}
          coordinatesStr={coordinatesStr || undefined}
        />
      )}
      {locationMessage && (
        <div className="absolute bottom-2 left-2 right-2 bg-slate-800/90 text-slate-100 text-sm p-2.5 rounded shadow">
          {locationMessage}
        </div>
      )}
    </div>
  );
}
