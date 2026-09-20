import { createClient } from "@/lib/supabase/server";

export async function getCurrentProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, nome, email, cargo, area_id, roles(nome)")
    .eq("id", user.id)
    .maybeSingle();

  const roleNome = (profile?.roles as unknown as { nome: string } | null)?.nome;

  return {
    id: user.id,
    nome: profile?.nome ?? null,
    email: profile?.email ?? user.email ?? null,
    cargo: profile?.cargo ?? null,
    isAdmin: roleNome === "administrador",
  };
}
