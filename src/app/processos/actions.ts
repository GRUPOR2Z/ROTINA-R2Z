"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const CAMPOS_CONTEUDO = [
  "titulo",
  "area_id",
  "responsavel_id",
  "objetivo",
  "pre_requisitos",
  "gatilho",
  "entradas",
  "passo_a_passo",
  "saidas",
  "criterios_conclusao",
] as const;

function lerConteudo(formData: FormData) {
  return {
    titulo: String(formData.get("titulo") ?? "").trim(),
    area_id: String(formData.get("area_id") ?? "") || null,
    responsavel_id: String(formData.get("responsavel_id") ?? "") || null,
    objetivo: String(formData.get("objetivo") ?? "").trim() || null,
    pre_requisitos: String(formData.get("pre_requisitos") ?? "").trim() || null,
    gatilho: String(formData.get("gatilho") ?? "").trim() || null,
    entradas: String(formData.get("entradas") ?? "").trim() || null,
    passo_a_passo: String(formData.get("passo_a_passo") ?? "").trim() || null,
    saidas: String(formData.get("saidas") ?? "").trim() || null,
    criterios_conclusao: String(formData.get("criterios_conclusao") ?? "").trim() || null,
  };
}

export async function criarProcesso(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const conteudo = lerConteudo(formData);
  if (!conteudo.titulo) return;

  const { data, error } = await supabase
    .from("processes")
    .insert({ ...conteudo, criado_por: user.id })
    .select("id")
    .single();

  if (error || !data) return;

  revalidatePath("/processos");
  redirect(`/processos/${data.id}`);
}

export async function atualizarProcesso(processId: string, formData: FormData) {
  const supabase = await createClient();
  const conteudo = lerConteudo(formData);
  if (!conteudo.titulo) return;

  const { data: atual } = await supabase
    .from("processes")
    .select("status")
    .eq("id", processId)
    .single();

  // editar um processo publicado o devolve a rascunho -- a versao
  // publicada (o snapshot) nunca muda sozinha.
  const novoStatus = atual?.status === "publicado" ? "rascunho" : atual?.status;

  await supabase
    .from("processes")
    .update({ ...conteudo, ...(novoStatus ? { status: novoStatus } : {}) })
    .eq("id", processId);

  revalidatePath(`/processos/${processId}`);
  revalidatePath("/processos");
}

export async function enviarParaRevisao(processId: string) {
  const supabase = await createClient();
  await supabase.from("processes").update({ status: "revisao" }).eq("id", processId);
  revalidatePath(`/processos/${processId}`);
  revalidatePath("/processos");
}

export async function publicarProcesso(processId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: processo } = await supabase
    .from("processes")
    .select(CAMPOS_CONTEUDO.join(","))
    .eq("id", processId)
    .single();

  if (!processo) return;

  const { data: ultimaVersao } = await supabase
    .from("process_versions")
    .select("numero_versao")
    .eq("process_id", processId)
    .order("numero_versao", { ascending: false })
    .limit(1)
    .maybeSingle();

  const proximoNumero = (ultimaVersao?.numero_versao ?? 0) + 1;

  const { data: versao, error } = await supabase
    .from("process_versions")
    .insert({
      process_id: processId,
      numero_versao: proximoNumero,
      snapshot: processo,
      publicado_por: user.id,
    })
    .select("id")
    .single();

  if (error || !versao) return;

  await supabase
    .from("processes")
    .update({ status: "publicado", versao_publicada_id: versao.id })
    .eq("id", processId);

  revalidatePath(`/processos/${processId}`);
  revalidatePath("/processos");
}

export async function arquivarProcesso(processId: string) {
  const supabase = await createClient();
  await supabase.from("processes").update({ status: "arquivado" }).eq("id", processId);
  revalidatePath(`/processos/${processId}`);
  revalidatePath("/processos");
}

export async function reabrirProcesso(processId: string) {
  const supabase = await createClient();
  await supabase.from("processes").update({ status: "rascunho" }).eq("id", processId);
  revalidatePath(`/processos/${processId}`);
  revalidatePath("/processos");
}

export async function excluirProcesso(processId: string) {
  const supabase = await createClient();
  await supabase.from("processes").delete().eq("id", processId);
  revalidatePath("/processos");
  redirect("/processos");
}
