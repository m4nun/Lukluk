/**
 * Types for structured tool results that render inline in agent chat.
 * These bridge the server (tool output → SSE) and client (SSE → React component).
 */

/** A single place marker on the map. */
export interface MapPlace {
  name: string;
  lat: number;
  lng: number;
  category: string;
  address?: string;
  distance_km?: number;
}

/** Discriminated union for renderable tool results. */
export type ToolResultRender =
  | { renderType: "map"; data: { places: MapPlace[]; center: { lat: number; lng: number }; zoom: number } }
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
        const parsed: unknown = JSON.parse(step.content);
        if (
          parsed &&
          typeof parsed === "object" &&
          "places" in parsed &&
          "center" in parsed
        ) {
          renders.push({
            renderType: "map",
            data: parsed as {
              places: MapPlace[];
              center: { lat: number; lng: number };
              zoom: number;
            },
          });
        }
      } catch {
      }
    }
  }
  return renders;
}