import { describe, it, expect } from "vitest";
import {
  haversineKm,
  parseHttpStatus,
  buildOverpassQuery,
  parseOverpassResult,
  defaultMapConfig,
  type MapSearchConfig,
} from "@/lib/agent/map-places";

// ── haversineKm ──

describe("haversineKm", () => {
  it("returns 0 for same point", () => {
    expect(haversineKm(13.75, 100.50, 13.75, 100.50)).toBe(0);
  });

  it("returns ~1.1 km for 0.01° lat shift at equator", () => {
    const dist = haversineKm(0, 0, 0.01, 0);
    expect(dist).toBeGreaterThan(1.1);
    expect(dist).toBeLessThan(1.2);
  });

  it("is symmetric", () => {
    const a = haversineKm(13.75, 100.50, 18.79, 98.98);
    const b = haversineKm(18.79, 98.98, 13.75, 100.50);
    expect(a).toBe(b);
  });

  it("Bangkok → Chiang Mai ≈ 585 km", () => {
    const dist = haversineKm(13.7563, 100.5018, 18.7883, 98.9853);
    expect(dist).toBeGreaterThan(580);
    expect(dist).toBeLessThan(590);
  });
});

// ── parseHttpStatus ──

describe("parseHttpStatus", () => {
  it("extracts status from error message", () => {
    expect(parseHttpStatus("Overpass API failed: HTTP 504")).toBe(504);
    expect(parseHttpStatus("Geocoding failed: HTTP 429")).toBe(429);
  });

  it("returns 0 for non-HTTP messages", () => {
    expect(parseHttpStatus("Network error")).toBe(0);
    expect(parseHttpStatus("")).toBe(0);
  });
});

// ── buildOverpassQuery ──

describe("buildOverpassQuery", () => {
  it("produces valid Overpass QL for default config", () => {
    const q = buildOverpassQuery(13.75, 100.5, defaultMapConfig);
    expect(q).toContain("[out:json][timeout:25]");
    expect(q).toContain("out center 30");
    expect(q).toContain("around:8000");
    expect(q).toContain('["shop"="pet"]');
    expect(q).toContain('["amenity"="veterinary"]');
  });

  it("uses custom radius and max results", () => {
    const config: MapSearchConfig = { ...defaultMapConfig, searchRadiusM: 2000, maxResults: 10 };
    const q = buildOverpassQuery(13.75, 100.5, config);
    expect(q).toContain("around:2000");
    expect(q).toContain("out center 10");
  });
});

// ── parseOverpassResult ──

describe("parseOverpassResult", () => {
  const center = { lat: 13.75, lng: 100.5 };

  it("returns empty array for empty input", () => {
    expect(parseOverpassResult([], center.lat, center.lng, defaultMapConfig)).toEqual([]);
  });

  it("parses a node with name and coords", () => {
    const result = parseOverpassResult(
      [{ id: 1, type: "node", lat: 13.751, lon: 100.502, tags: { name: "Test Shop", shop: "pet" } }],
      center.lat, center.lng, defaultMapConfig,
    );
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Test Shop");
    expect(result[0].category).toBe("Pet Shop");
    expect(result[0].distance_km).toBeGreaterThan(0);
  });

  it("uses center coords from way elements", () => {
    const result = parseOverpassResult(
      [{ id: 2, type: "way", center: { lat: 13.76, lon: 100.51 }, tags: { name: "Way Shop", shop: "pet" } }],
      center.lat, center.lng, defaultMapConfig,
    );
    expect(result).toHaveLength(1);
    expect(result[0].lat).toBe(13.76);
  });

  it("skips elements without coordinates", () => {
    const result = parseOverpassResult(
      [{ id: 3, type: "node", tags: { name: "No Coords", shop: "pet" } }],
      center.lat, center.lng, defaultMapConfig,
    );
    expect(result).toEqual([]);
  });

  it("skips elements without a name", () => {
    const result = parseOverpassResult(
      [{ id: 4, type: "node", lat: 13.75, lon: 100.5, tags: { shop: "pet" } }],
      center.lat, center.lng, defaultMapConfig,
    );
    expect(result).toEqual([]);
  });

  it("deduplicates by name + coords", () => {
    const result = parseOverpassResult(
      [
        { id: 5, type: "node", lat: 13.7510, lon: 100.5020, tags: { name: "Same", shop: "pet" } },
        { id: 6, type: "node", lat: 13.75104, lon: 100.50204, tags: { name: "Same", shop: "pet" } },
      ],
      center.lat, center.lng, defaultMapConfig,
    );
    expect(result).toHaveLength(1);
  });

  it("classifies categories correctly", () => {
    const elements = [
      { id: 10, type: "node" as const, lat: 13.75, lon: 100.5, tags: { name: "V", amenity: "veterinary" } },
      { id: 11, type: "node" as const, lat: 13.75, lon: 100.5, tags: { name: "G", shop: "pet_grooming" } },
      { id: 12, type: "node" as const, lat: 13.75, lon: 100.5, tags: { name: "D", leisure: "dog_park" } },
      { id: 13, type: "node" as const, lat: 13.75, lon: 100.5, tags: { name: "B", amenity: "animal_boarding" } },
      { id: 14, type: "node" as const, lat: 13.75, lon: 100.5, tags: { name: "X", something: "else" } },
    ];
    const result = parseOverpassResult(elements, center.lat, center.lng, defaultMapConfig);
    const cats = result.map(r => r.category);
    expect(cats).toContain("Veterinary Clinic");
    expect(cats).toContain("Pet Grooming");
    expect(cats).toContain("Dog Park");
    expect(cats).toContain("Pet Boarding");
    expect(cats).toContain("Pet Service");
    expect(result).toHaveLength(5);
  });

  it("respects maxResults", () => {
    const config: MapSearchConfig = { ...defaultMapConfig, maxResults: 2 };
    const elements = Array.from({ length: 10 }, (_, i) => ({
      id: i, type: "node" as const, lat: 13.75 + i * 0.01, lon: 100.5 + i * 0.01,
      tags: { name: `Place ${i}`, shop: "pet" },
    }));
    expect(parseOverpassResult(elements, center.lat, center.lng, config)).toHaveLength(2);
  });
});
