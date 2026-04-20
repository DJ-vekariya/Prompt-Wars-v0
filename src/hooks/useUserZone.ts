import { useCallback, useEffect, useState } from "react";
import { zones } from "@/lib/mock-data";

const STORAGE_KEY = "user-zone-id";
const AUTO_KEY = "user-zone-auto";
const DEFAULT_ZONE_ID = "zone-gate-2";

// Optional venue bounding box (top-left and bottom-right lat/lng) read from env.
// If not provided, we fall back to projecting the user position into the venue
// center, which yields a reasonable nearest-zone in demo mode.
const VENUE = {
  latTL: Number(import.meta.env.VITE_VENUE_LAT_TL),
  lngTL: Number(import.meta.env.VITE_VENUE_LNG_TL),
  latBR: Number(import.meta.env.VITE_VENUE_LAT_BR),
  lngBR: Number(import.meta.env.VITE_VENUE_LNG_BR),
};
const HAS_VENUE_BBOX =
  Number.isFinite(VENUE.latTL) &&
  Number.isFinite(VENUE.lngTL) &&
  Number.isFinite(VENUE.latBR) &&
  Number.isFinite(VENUE.lngBR);

export interface UserZone {
  id: string;
  name: string;
}

function resolveZone(id: string | null): UserZone {
  const zoneId = id || DEFAULT_ZONE_ID;
  const zone = zones.find((z) => z.id === zoneId) ?? zones.find((z) => z.id === DEFAULT_ZONE_ID)!;
  return { id: zone.id, name: zone.name };
}

function projectLatLngToVenue(lat: number, lng: number): { x: number; y: number } {
  if (HAS_VENUE_BBOX) {
    const x = ((lng - VENUE.lngTL) / (VENUE.lngBR - VENUE.lngTL)) * 800;
    const y = ((lat - VENUE.latTL) / (VENUE.latBR - VENUE.latTL)) * 720;
    return { x, y };
  }
  // No bbox configured → assume user is at venue center (best-effort demo).
  return { x: 400, y: 360 };
}

function findNearestZoneId(x: number, y: number): string {
  let bestId = DEFAULT_ZONE_ID;
  let bestDist = Infinity;
  for (const z of zones) {
    const dx = z.cx - x;
    const dy = z.cy - y;
    const d = dx * dx + dy * dy;
    if (d < bestDist) {
      bestDist = d;
      bestId = z.id;
    }
  }
  return bestId;
}

export function useUserZone() {
  const [zone, setZoneState] = useState<UserZone>(() =>
    resolveZone(typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null),
  );
  const [autoDetect, setAutoDetectState] = useState<boolean>(() =>
    typeof window !== "undefined" ? localStorage.getItem(AUTO_KEY) === "1" : false,
  );
  const [isDetecting, setIsDetecting] = useState(false);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setZoneState(resolveZone(e.newValue));
      if (e.key === AUTO_KEY) setAutoDetectState(e.newValue === "1");
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const setZone = useCallback((id: string) => {
    localStorage.setItem(STORAGE_KEY, id);
    localStorage.setItem(AUTO_KEY, "0");
    setAutoDetectState(false);
    setZoneState(resolveZone(id));
  }, []);

  const detectNearestZone = useCallback(async (): Promise<UserZone> => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      throw new Error("Geolocation not supported on this device");
    }
    setIsDetecting(true);
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 8000,
          maximumAge: 30_000,
        });
      });
      const { x, y } = projectLatLngToVenue(pos.coords.latitude, pos.coords.longitude);
      const id = findNearestZoneId(x, y);
      const next = resolveZone(id);
      localStorage.setItem(STORAGE_KEY, id);
      localStorage.setItem(AUTO_KEY, "1");
      setAutoDetectState(true);
      setZoneState(next);
      return next;
    } finally {
      setIsDetecting(false);
    }
  }, []);

  // Silent re-detect on mount when auto-detect is enabled
  useEffect(() => {
    if (!autoDetect) return;
    detectNearestZone().catch(() => {
      /* keep last known zone on failure */
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { zone, setZone, allZones: zones, detectNearestZone, autoDetect, isDetecting };
}
