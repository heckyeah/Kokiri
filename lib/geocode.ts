/**
 * Geocode an address using OpenStreetMap Nominatim.
 * Usage policy: https://operations.osmfoundation.org/policies/nominatim/
 * - Provide a valid User-Agent.
 * - Max 1 request per second (we enforce delay when geocoding multiple).
 */

const NOMINATIM_BASE = "https://nominatim.openstreetmap.org/search";
/** ASCII-only for fetch headers (ISO-8859-1); display name stays "Kōkiri" in UI */
const USER_AGENT = "Kokiri/1.0 (Kokiri member map)";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function geocodeAddress(
  address: string
): Promise<{ lat: number; lng: number } | null> {
  const trimmed = address?.trim();
  if (!trimmed) return null;

  const url = `${NOMINATIM_BASE}?q=${encodeURIComponent(trimmed)}&format=json&limit=1`;
  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT },
    next: { revalidate: 3600 },
  });
  if (!res.ok) return null;
  const data = await res.json();
  if (!Array.isArray(data) || data.length === 0) return null;
  const first = data[0];
  const lat = Number(first.lat);
  const lon = Number(first.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  return { lat, lng: lon };
}

/**
 * Geocode multiple addresses sequentially (1 request per second per Nominatim policy).
 * Returns array of same length; null where geocode failed or address missing.
 */
export async function geocodeAddresses(
  addresses: (string | null | undefined)[]
): Promise<Array<{ lat: number; lng: number } | null>> {
  const results: Array<{ lat: number; lng: number } | null> = [];
  for (let i = 0; i < addresses.length; i++) {
    const addr = addresses[i];
    if (!addr?.trim()) {
      results.push(null);
      continue;
    }
    const result = await geocodeAddress(addr);
    results.push(result);
    if (i < addresses.length - 1) await sleep(1100);
  }
  return results;
}
