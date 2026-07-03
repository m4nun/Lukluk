import { seedPetTypeProfiles } from "@/lib/pipeline/seed";

export async function GET() {
  // Only allow in development or with service role
  if (process.env.NODE_ENV !== "development") {
    return Response.json({ error: "Only available in development" }, { status: 403 });
  }

  const result = await seedPetTypeProfiles();

  return Response.json(result);
}
