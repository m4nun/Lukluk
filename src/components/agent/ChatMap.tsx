"use client";

import { useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { MapIcon } from "lucide-react";
import type { MapPlace } from "@/lib/agent/tool-results";

interface ChatMapProps {
  places: MapPlace[];
  center: { lat: number; lng: number };
  zoom: number;
}

const CATEGORY_COLORS: Record<string, string> = {
  "Pet Shop": "#f59e0b",
  "Veterinary Clinic": "#ef4444",
  "Pet Boarding": "#8b5cf6",
  "Dog Park": "#10b981",
  "Pet Grooming": "#3b82f6",
  "Pet Service": "#6b7280",
};

function createDivIcon(color: string): L.DivIcon {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="${color}" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.659-2.331a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.382V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z"/><path d="M7 11h.01"/><path d="M11 13h.01"/><path d="M14 9h.01"/><path d="M17 11h.01"/><path d="M7 15h.01"/><path d="M10 18h.01"/>
    </svg>`;
  return L.divIcon({
    html: svg,
    className: "lukluk-map-marker",
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  });
}

/**
 * Center "search area" pin — intentionally distinct shape and elevated z-index
 * so it stays visible even when a category place shares identical coordinates.
 * Do not merge with `createDivIcon`; the visual separation is load-bearing.
 */
function createCenterIcon(): L.DivIcon {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 32 40" fill="none">
      <path d="M16 38s13-12.5 13-22a13 13 0 1 0-26 0c0 9.5 13 22 13 22z" fill="#f97316" stroke="white" stroke-width="2.5" stroke-linejoin="round"/>
      <circle cx="16" cy="16" r="5" fill="white"/>
      <circle cx="16" cy="16" r="2.5" fill="#f97316"/>
    </svg>`;
  return L.divIcon({
    html: svg,
    className: "lukluk-map-marker lukluk-map-marker--center",
    iconSize: [32, 40],
    // Pin tip (not icon center) must align with the coordinate.
    iconAnchor: [16, 40],
    popupAnchor: [0, -36],
  });
}

export default function ChatMap({ places, center, zoom }: ChatMapProps) {
  const centerLatLng = useMemo<L.LatLngExpression>(
    () => [center.lat, center.lng],
    [center.lat, center.lng]
  );

  return (
    <div className="my-3 overflow-hidden rounded-xl border border-border bg-muted/30">
      <div className="flex items-center gap-2 border-b border-border px-3 py-2">
        <MapIcon className="size-4 text-primary" />
        <span className="text-sm font-medium">
          {places.length} {places.length === 1 ? "place" : "places"} found near you
        </span>
      </div>
      <MapContainer
        center={centerLatLng}
        zoom={zoom}
        scrollWheelZoom={false}
        touchZoom
        doubleClickZoom
        dragging
        style={{ height: "320px", width: "100%" }}
        attributionControl
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
        <Marker
          position={centerLatLng}
          icon={createCenterIcon()}
          zIndexOffset={1000}
        >
          <Popup>Your search area</Popup>
        </Marker>
        {places.map((place, i) => (
          <Marker
            key={`${place.name}-${i}`}
            position={[place.lat, place.lng]}
            icon={createDivIcon(CATEGORY_COLORS[place.category] ?? "#6b7280")}
          >
            <Popup>
              <div className="min-w-[180px]">
                <div className="mb-1 font-semibold text-gray-900">{place.name}</div>
                <div className="mb-1 text-xs text-gray-500">{place.category}</div>
                {place.address && (
                  <div className="text-xs text-gray-600">{place.address}</div>
                )}
                {place.distance_km != null && (
                  <div className="mt-1 text-xs text-gray-400">
                    {place.distance_km} km from center
                  </div>
                )}
                <a
                  href={`https://www.openstreetmap.org/?mlat=${place.lat}&mlon=${place.lng}#map=18/${place.lat}/${place.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-block text-xs font-medium text-blue-600 hover:underline"
                >
                  Open in OpenStreetMap →
                </a>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      <div className="max-h-48 space-y-1.5 overflow-y-auto border-t border-border p-3">
        {places.map((place, i) => (
          <div
            key={`${place.name}-list-${i}`}
            className="flex items-start gap-2 rounded-lg px-2 py-1.5 hover:bg-muted/50"
          >
            <div
              className="mt-1 size-3 shrink-0 rounded-full"
              style={{ backgroundColor: CATEGORY_COLORS[place.category] ?? "#6b7280" }}
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-sm font-medium">{place.name}</span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {place.distance_km != null ? `${place.distance_km} km` : ""}
                </span>
              </div>
              <div className="truncate text-xs text-muted-foreground">{place.category}</div>
              {place.address && (
                <div className="truncate text-xs text-muted-foreground/70">{place.address}</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}