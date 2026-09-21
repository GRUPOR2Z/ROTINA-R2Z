import { createClient } from "@/lib/supabase/server";

export async function getAreasEMembros() {
  const supabase = await createClient();

  const [{ data: areas }, { data: membros }] = await Promise.all([
    supabase.from("areas").select("id, nome").eq("ativo", true).order("nome"),
    supabase.from("profiles").select("id, nome, email").eq("ativo", true).order("nome"),
  ]);

  return {
    areas: areas ?? [],
    membros: membros ?? [],
  };
}
