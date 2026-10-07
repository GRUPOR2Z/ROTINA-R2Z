"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/current-profile";
import { texto, textoOuNulo } from "@/lib/form";

// RLS ja barra quem nao e' admin; checar aqui tambem evita ida ao banco
// e deixa a regra explicita no codigo (Doc. 3 §6: validar no backend).
async function exigirAdmin() {
  const eu = await getCurrentProfile();
  return eu?.isAdmin ? eu : null;
}

export async function criarArea(formData: FormData) {
  if (!(await exigirAdmin())) return;
  const nome = texto(formData, "nome");
  if (!nome) return;

  const supabase = await createClient();
  await supabase.from("areas").insert({ nome, descricao: textoOuNulo(formData, "descricao") });
  revalidatePath("/configuracoes");
}

export async function atualizarArea(areaId: string, formData: FormData) {
  if (!(await exigirAdmin())) return;
  const nome = texto(formData, "nome");
  if (!nome) return;

  const supabase = await createClient();
  await supabase
    .from("areas")
    .update({ nome, descricao: textoOuNulo(formData, "descricao") })
    .eq("id", areaId);
  revalidatePath("/configuracoes");
}

/** Area nao e' excluida (tarefas/processos antigos apontam pra ela);
 * desativar so a tira dos selects. */
export async function alternarArea(areaId: string, ativo: boolean) {
  if (!(await exigirAdmin())) return;
  const supabase = await createClient();
  await supabase.from("areas").update({ ativo }).eq("id", areaId);
  revalidatePath("/configuracoes");
}

export async function atualizarMembro(profileId: string, formData: FormData) {
  const eu = await exigirAdmin();
  if (!eu) return;

  const roleId = textoOuNulo(formData, "role_id");
  const ativo = texto(formData, "ativo") !== "false";

  // nao deixa o admin se rebaixar/desativar sozinho e trancar o sistema
  const ehEuMesmo = profileId === eu.id;

  const supabase = await createClient();
  await supabase
    .from("profiles")
    .update({
      nome: textoOuNulo(formData, "nome"),
      cargo: textoOuNulo(formData, "cargo"),
      area_id: textoOuNulo(formData, "area_id"),
      ...(roleId && !ehEuMesmo ? { role_id: roleId } : {}),
      ...(ehEuMesmo ? {} : { ativo }),
    })
    .eq("id", profileId);

  revalidatePath("/configuracoes");
  revalidatePath("/equipe");
}
