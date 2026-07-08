/**
 * Types for structured tool results that render inline in agent chat.
 * These bridge the server (tool output → SSE) and client (SSE → React component).
 */

import { z } from "zod";

/** A single place marker on the map. */
export interface MapPlace {
  name: string;
  lat: number;
  lng: number;
  category: string;
  address?: string;
  distance_km?: number;
}

/** Shared schema for the SSE payload crossing the server↔client seam. */
export const mapDataSchema = z.object({
  places: z.array(z.object({
    name: z.string(),
    lat: z.number(),
    lng: z.number(),
    category: z.string(),
    address: z.string().optional(),
    distance_km: z.number().optional(),
  })),
  center: z.object({ lat: z.number(), lng: z.number() }),
  zoom: z.number(),
});

export type MapData = z.infer<typeof mapDataSchema>;

/** Discriminated union for renderable tool results. */
export type ToolResultRender =
  | { renderType: "map"; data: MapData }
  | { renderType: "generic"; data: Record<string, unknown> };

/** String literal set of tool names that produce structured render data. */
export type RenderToolName = "search_pet_places";

export function extractToolResults(
  steps: { type: string; toolName?: string; content: string }[] | undefined,
): ToolResultRender[] {
  const renders: ToolResultRender[] = [];
  for (const step of steps ?? []) {
    if (step.type === "tool_result" && step.toolName === "search_pet_places") {
      try {
        const parsed = mapDataSchema.safeParse(JSON.parse(step.content));
        if (parsed.success) {
          renders.push({ renderType: "map", data: parsed.data });
        }
      } catch {
        // content is not valid JSON (e.g. "NO LOCATION FOUND" text) — skip
      }
    }
  }
  return renders;
}