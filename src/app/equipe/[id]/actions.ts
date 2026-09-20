"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function adicionarTag(profileId: string, formData: FormData) {
  const tag = String(formData.get("tag") ?? "").trim();
  if (!tag) return;

  const supabase = await createClient();
  await supabase.from("member_tags").insert({ profile_id: profileId, tag });

  revalidatePath(`/equipe/${profileId}`);
}

export async function removerTag(profileId: string, tagId: string) {
  const supabase = await createClient();
  await supabase.from("member_tags").delete().eq("id", tagId);

  revalidatePath(`/equipe/${profileId}`);
}

export async function adicionarNota(profileId: string, formData: FormData) {
  const tipo = String(formData.get("tipo") ?? "");
  const texto = String(formData.get("texto") ?? "").trim();
  if (!texto || (tipo !== "resultado" && tipo !== "falha")) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("member_notes")
    .insert({ profile_id: profileId, tipo, texto, autor_id: user.id });

  revalidatePath(`/equipe/${profileId}`);
}
