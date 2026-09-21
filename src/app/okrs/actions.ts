"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function criarCiclo(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const nome = String(formData.get("nome") ?? "").trim();
  const tipo = String(formData.get("tipo") ?? "trimestral");
  const dataInicio = String(formData.get("data_inicio") ?? "");
  const dataFim = String(formData.get("data_fim") ?? "");

  if (!nome || !dataInicio || !dataFim) return;

  const { data, error } = await supabase
    .from("okr_cycles")
    .insert({ nome, tipo, data_inicio: dataInicio, data_fim: dataFim, criado_por: user.id })
    .select("id")
    .single();

  if (error || !data) return;

  revalidatePath("/okrs");
  redirect(`/okrs/${data.id}`);
}

export async function encerrarCiclo(cycleId: string) {
  const supabase = await createClient();
  await supabase.from("okr_cycles").update({ status: "encerrado" }).eq("id", cycleId);
  revalidatePath(`/okrs/${cycleId}`);
  revalidatePath("/okrs");
}

export async function excluirCiclo(cycleId: string) {
  const supabase = await createClient();
  await supabase.from("okr_cycles").delete().eq("id", cycleId);
  revalidatePath("/okrs");
  redirect("/okrs");
}

export async function criarObjetivo(cycleId: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const titulo = String(formData.get("titulo") ?? "").trim();
  if (!titulo) return;

  const areaId = String(formData.get("area_id") ?? "") || null;
  const responsavelId = String(formData.get("responsavel_id") ?? "") || null;
  const descricao = String(formData.get("descricao") ?? "").trim() || null;

  const { data, error } = await supabase
    .from("objectives")
    .insert({
      okr_cycle_id: cycleId,
      titulo,
      descricao,
      area_id: areaId,
      responsavel_id: responsavelId,
      criado_por: user.id,
    })
    .select("id")
    .single();

  if (error || !data) return;

  revalidatePath(`/okrs/${cycleId}`);
  redirect(`/okrs/objetivos/${data.id}`);
}

export async function excluirObjetivo(cycleId: string, objectiveId: string) {
  const supabase = await createClient();
  await supabase.from("objectives").delete().eq("id", objectiveId);
  revalidatePath(`/okrs/${cycleId}`);
  redirect(`/okrs/${cycleId}`);
}

export async function criarKeyResult(objectiveId: string, formData: FormData) {
  const supabase = await createClient();

  const titulo = String(formData.get("titulo") ?? "").trim();
  const valorAlvo = String(formData.get("valor_alvo") ?? "").trim();
  if (!titulo || !valorAlvo) return;

  const valorInicial = String(formData.get("valor_inicial") ?? "0").trim();
  const unidade = String(formData.get("unidade") ?? "").trim() || null;

  await supabase.from("key_results").insert({
    objective_id: objectiveId,
    titulo,
    unidade,
    valor_inicial: Number(valorInicial || 0),
    valor_atual: Number(valorInicial || 0),
    valor_alvo: Number(valorAlvo),
  });

  revalidatePath(`/okrs/objetivos/${objectiveId}`);
}

export async function atualizarValorKeyResult(
  objectiveId: string,
  keyResultId: string,
  formData: FormData,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const valorNovo = String(formData.get("valor_novo") ?? "").trim();
  const comentario = String(formData.get("comentario") ?? "").trim() || null;
  if (!valorNovo) return;

  await supabase
    .from("key_result_updates")
    .insert({ key_result_id: keyResultId, valor_novo: Number(valorNovo), comentario, autor_id: user.id });

  await supabase.from("key_results").update({ valor_atual: Number(valorNovo) }).eq("id", keyResultId);

  revalidatePath(`/okrs/objetivos/${objectiveId}`);
}

export async function excluirKeyResult(objectiveId: string, keyResultId: string) {
  const supabase = await createClient();
  await supabase.from("key_results").delete().eq("id", keyResultId);
  revalidatePath(`/okrs/objetivos/${objectiveId}`);
}
