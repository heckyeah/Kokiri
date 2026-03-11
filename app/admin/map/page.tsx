import Link from "next/link";
import { redirect } from "next/navigation";
import { serverClient } from "@/lib/sanity";
import {
  ALERT_BY_ID_QUERY,
  NEED_HELP_RESPONSES_FOR_ALERT_QUERY,
} from "@/lib/queries";
import { geocodeAddresses } from "@/lib/geocode";
import { AdminMap } from "@/components/map/AdminMap";
import type { NeedHelpMarker } from "@/components/map/AdminMap";
import { NeedHelpNoLocationPanel } from "./NeedHelpNoLocationPanel";

export default async function AdminAlertMapPage({
  searchParams,
}: {
  searchParams: Promise<{ alertId?: string }>;
}) {
  const { alertId } = await searchParams;
  if (!alertId) redirect("/admin/members");

  const [alert, responses] = await Promise.all([
    serverClient.fetch<{ _id: string; title: string; subtitle?: string | null; createdAt?: string | null } | null>(
      ALERT_BY_ID_QUERY,
      { alertId }
    ),
    serverClient.fetch<NeedHelpMarker[]>(NEED_HELP_RESPONSES_FOR_ALERT_QUERY, {
      alertId,
    }),
  ]);

  if (!alert) redirect("/admin/members");

  const toNum = (v: unknown): number | null =>
    v == null ? null : typeof v === "number" && Number.isFinite(v) ? v : Number(v);

  const markersWithPosition: NeedHelpMarker[] = (responses ?? [])
    .map((r) => {
      const lat = toNum(r.lat);
      const lng = toNum(r.lng);
      if (lat == null || lng == null || !Number.isFinite(lat) || !Number.isFinite(lng))
        return null;
      return { ...r, lat, lng };
    })
    .filter((r): r is NeedHelpMarker => r != null);

  const withoutPositionRaw = (responses ?? []).filter((r) => {
    const lat = toNum(r.lat);
    const lng = toNum(r.lng);
    return lat == null || lng == null || !Number.isFinite(lat) || !Number.isFinite(lng);
  });

  const addressesToGeocode = withoutPositionRaw.map(
    (r) => r.member?.address?.trim() || null
  );
  const geocoded = await geocodeAddresses(addressesToGeocode);

  const fromAddressMarkers: NeedHelpMarker[] = withoutPositionRaw
    .map((r, i) => {
      const coord = geocoded[i];
      if (!coord) return null;
      return { ...r, lat: coord.lat, lng: coord.lng, fromAddress: true };
    })
    .filter((m): m is NeedHelpMarker => m != null);

  const markersWithPositionIncludingAddress = [...markersWithPosition, ...fromAddressMarkers];
  const withoutPosition = withoutPositionRaw.filter((_, i) => !geocoded[i]);

  return (
    <div className="fixed inset-0 flex flex-col bg-slate-900">
      <div className="absolute inset-0 z-0">
        <AdminMap markers={markersWithPositionIncludingAddress} fullScreen />
      </div>

      <div className="relative z-10 flex items-start justify-between gap-4 p-4 pointer-events-none">
        <div className="pointer-events-auto rounded-lg bg-white/95 backdrop-blur shadow-lg border border-slate-200 p-3 max-w-sm">
          <Link
            href="/admin/members"
            className="text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            ← Back to members
          </Link>
          <h1 className="mt-1 text-lg font-semibold text-slate-900 truncate">
            {alert.title}
          </h1>
          <p className="text-xs text-slate-500">
            People who need help
            {markersWithPositionIncludingAddress.length > 0 && (
              <> · {markersWithPositionIncludingAddress.length} on map</>
            )}
          </p>
        </div>
      </div>

      <NeedHelpNoLocationPanel items={withoutPosition} />

      {markersWithPositionIncludingAddress.length === 0 && withoutPosition.length === 0 && (
        <div className="absolute bottom-4 left-4 right-4 z-10 pointer-events-none flex justify-center">
          <p className="pointer-events-auto rounded-lg bg-white/95 backdrop-blur shadow border border-slate-200 px-4 py-2 text-sm text-slate-600">
            No one has reported needing help for this alert yet.
          </p>
        </div>
      )}
    </div>
  );
}
