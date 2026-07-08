/**
 * Server-side utilities for finding pet-related places near a location.
 * Uses OpenStreetMap Nominatim (geocoding) + Overpass API (place search).
 * No API key required — both are free public services.
 */

import type { MapPlace } from "./tool-results";

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
}

interface OverpassElement {
  id: number;
  type: "node" | "way" | "relation";
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

const PET_PLACE_CATEGORIES: Record<string, { overpassFilter: string; label: string }> = {
  pet_shop: { overpassFilter: '["shop"="pet"]', label: "Pet Shop" },
  veterinary: { overpassFilter: '["amenity"="veterinary"]', label: "Veterinary Clinic" },
  animal_boarding: { overpassFilter: '["amenity"="animal_boarding"]', label: "Pet Boarding" },
  dog_park: { overpassFilter: '["leisure"="dog_park"]', label: "Dog Park" },
  pet_grooming: { overpassFilter: '["shop"="pet_grooming"]', label: "Pet Grooming" },
};

export interface MapSearchConfig {
  searchRadiusM: number;
  maxResults: number;
  nominatimBase: string;
  overpassMirrors: readonly string[];
  overpassMaxAttempts: number;
  overpassBaseDelayMs: number;
  transientHttpStatuses: Set<number>;
}

export const defaultMapConfig: MapSearchConfig = {
  searchRadiusM: 8000,
  maxResults: 30,
  nominatimBase: "https://nominatim.openstreetmap.org",
  // Public Overpass instances are flaky (504/429 under load). Try in order.
  overpassMirrors: [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
    "https://overpass.private.coffee/api/interpreter",
  ],
  overpassMaxAttempts: 2,
  overpassBaseDelayMs: 500,
  transientHttpStatuses: new Set([408, 425, 429, 500, 502, 503, 504]),
};

async function geocode(location: string, config: MapSearchConfig): Promise<{ lat: number; lng: number; displayName: string } | null> {
  // Nominatim has zero fuzzy matching — a single-character typo returns
  // nothing. Try with country filter first, then a wider net.
  for (const countryFilter of [`countrycodes=th`, ``]) {
    const url = `${config.nominatimBase}/search?q=${encodeURIComponent(location)}&format=json&limit=1${countryFilter ? `&${countryFilter}` : ""}`;
    for (let attempt = 1; attempt <= config.overpassMaxAttempts; attempt++) {
      try {
        const res = await fetch(url, {
          headers: {
            "User-Agent": "Lukluk/1.0 (https://github.com/m4nun/Lukluk)",
            "Accept-Language": "en",
          },
        });
        if (res.ok) {
          const data = (await res.json()) as NominatimResult[];
          if (data.length) {
            return {
              lat: parseFloat(data[0].lat),
              lng: parseFloat(data[0].lon),
              displayName: data[0].display_name,
            };
          }
        }
        if (!config.transientHttpStatuses.has(res.status)) break;
      } catch (e) {
        const err = e instanceof Error ? e : new Error(String(e));
        if (!config.transientHttpStatuses.has(parseHttpStatus(err.message))) break;
      }
      if (attempt < config.overpassMaxAttempts) {
        const delay = config.overpassBaseDelayMs * Math.pow(2, attempt - 1) * (0.5 + Math.random());
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }
  return null;
}

export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function buildOverpassQuery(lat: number, lng: number, config: MapSearchConfig): string {
  const filters = Object.values(PET_PLACE_CATEGORIES)
    .map((c) => c.overpassFilter)
    .map((f) => `node${f}(around:${config.searchRadiusM},${lat},${lng});\nway${f}(around:${config.searchRadiusM},${lat},${lng});`)
    .join("\n");
  return `[out:json][timeout:25];\n(\n${filters}\n);\nout center ${config.maxResults};`;
}

async function fetchOverpassWithFallback(
  query: string,
  config: MapSearchConfig,
): Promise<{ elements: OverpassElement[] }> {
  let lastError: Error | null = null;
  for (const mirror of config.overpassMirrors) {
    for (let attempt = 1; attempt <= config.overpassMaxAttempts; attempt++) {
      try {
        const res = await fetch(mirror, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "User-Agent": "Lukluk/1.0 (https://github.com/m4nun/Lukluk)",
          },
          body: new URLSearchParams({ data: query }).toString(),
        });
        if (res.ok) {
          return (await res.json()) as { elements: OverpassElement[] };
        }
        if (!config.transientHttpStatuses.has(res.status)) {
          throw new Error(`Overpass API failed: HTTP ${res.status}`);
        }
        lastError = new Error(`Overpass API failed: HTTP ${res.status}`);
      } catch (e) {
        lastError = e instanceof Error ? e : new Error(String(e));
        if (!config.transientHttpStatuses.has(parseHttpStatus(lastError.message))) {
          throw lastError;
        }
      }
      if (attempt < config.overpassMaxAttempts) {
        const delay = config.overpassBaseDelayMs * Math.pow(2, attempt - 1) * (0.5 + Math.random());
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }
  throw lastError ?? new Error("Overpass API: all mirrors failed");
}

export function parseHttpStatus(message: string): number {
  const m = /HTTP (\d{3})/.exec(message);
  return m ? Number(m[1]) : 0;
}

export function parseOverpassResult(
  elements: OverpassElement[],
  centerLat: number,
  centerLng: number,
  config: MapSearchConfig,
): MapPlace[] {
  const seen = new Set<string>();
  const places: MapPlace[] = [];

  for (const el of elements) {
    const lat = el.lat ?? el.center?.lat;
    const lng = el.lon ?? el.center?.lon;
    if (lat == null || lng == null) continue;

    const tags = el.tags ?? {};
    const name = tags.name || tags["name:en"] || tags["name:th"];
    if (!name) continue;

    const dedupKey = `${name}@${lat.toFixed(4)},${lng.toFixed(4)}`;
    if (seen.has(dedupKey)) continue;
    seen.add(dedupKey);

    let category = "Pet Service";
    for (const [key, val] of Object.entries(PET_PLACE_CATEGORIES)) {
      if (tags.shop === "pet" && key === "pet_shop") { category = val.label; break; }
      if (tags.amenity === "veterinary" && key === "veterinary") { category = val.label; break; }
      if (tags.amenity === "animal_boarding" && key === "animal_boarding") { category = val.label; break; }
      if (tags.leisure === "dog_park" && key === "dog_park") { category = val.label; break; }
      if (tags.shop === "pet_grooming" && key === "pet_grooming") { category = val.label; break; }
    }

    const addressParts = [
      tags["addr:housenumber"],
      tags["addr:street"],
      tags["addr:suburb"],
      tags["addr:city"],
    ].filter(Boolean);
    const address = addressParts.length > 0 ? addressParts.join(" ") : undefined;

    places.push({
      name,
      lat,
      lng,
      category,
      address,
      distance_km: Math.round(haversineKm(centerLat, centerLng, lat, lng) * 10) / 10,
    });
  }

  return places.sort((a, b) => (a.distance_km ?? 0) - (b.distance_km ?? 0)).slice(0, config.maxResults);
}

/**
 * Find pet-related places (shops, vets, boarding, dog parks, grooming) near a location.
 * @param location A place name string (e.g., "Bangkok", "Sukhumvit, Bangkok")
 * @returns Structured result with places + map center/zoom, or null if geocoding fails.
 */
export async function findPetPlaces(
  location: string,
  config: MapSearchConfig = defaultMapConfig,
): Promise<{
  places: MapPlace[];
  center: { lat: number; lng: number };
  zoom: number;
} | null> {
  const geo = await geocode(location, config);
  if (!geo) return null;

  const query = buildOverpassQuery(geo.lat, geo.lng, config);
  const data = await fetchOverpassWithFallback(query, config);
  const places = parseOverpassResult(data.elements ?? [], geo.lat, geo.lng, config);

  const zoom = places.length > 0 ? 13 : 12;

  return {
    places,
    center: { lat: geo.lat, lng: geo.lng },
    zoom,
  };
}