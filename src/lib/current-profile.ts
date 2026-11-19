import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/supabase/auth";

/** Perfil de quem esta logado. cache(): o menu lateral e a pagina
 * compartilham a mesma consulta dentro de uma requisicao. */
export const getCurrentProfile = cache(async () => {
  const user = await getAuthUser();
  if (!user) return null;

  const supabase = await createClient();
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
    isGestorOuAdmin: roleNome === "administrador" || roleNome === "gestor",
    papel: roleNome ?? null,
  };
});
