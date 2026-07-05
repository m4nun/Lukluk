import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();

  const { data: pets, error } = await supabase
    .from("pet_type_profiles")
    .select("id, name, species")
    .order("name");

  if (error) {
    return Response.json({ error: "Failed to load pet types" }, { status: 500 });
  }

  return Response.json(pets || []);
}
