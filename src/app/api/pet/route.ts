import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();

  const { data: pets, error } = await supabase
    .from("pet_type_profiles")
    .select("id, name, species, breed_or_category, mbti_label")
    .order("name");

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json(pets || []);
}
