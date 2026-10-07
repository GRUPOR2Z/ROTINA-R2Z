"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { numeroOuNulo, texto, textoOuNulo } from "@/lib/form";
import { STATUS_MELHORIA, TIPOS_MELHORIA } from "@/lib/melhorias";

function lerMelhoria(formData: FormData) {
  const tipo = texto(formData, "tipo");
  const status = texto(formData, "status");
  const prioridade = texto(formData, "prioridade");
  const nota = (k: string) => {
    const n = numeroOuNulo(formData, k);
    return n && n >= 1 && n <= 5 ? Math.round(n) : null;
  };
  return {
    titulo: texto(formData, "titulo"),
    descricao: textoOuNulo(formData, "descricao"),
    area_id: textoOuNulo(formData, "area_id"),
    responsavel_id: textoOuNulo(formData, "responsavel_id"),
    impacto: nota("impacto"),
    esforco: nota("esforco"),
    process_id: textoOuNulo(formData, "process_id"),
    ...(TIPOS_MELHORIA.some((t) => t.value === tipo) ? { tipo } : {}),
    ...(STATUS_MELHORIA.some((s) => s.value === status) ? { status } : {}),
    ...(["baixa", "media", "alta"].includes(prioridade) ? { prioridade } : {}),
  };
}

function revalidar(id?: string) {
  revalidatePath("/melhorias");
  if (id) revalidatePath(`/melhorias/${id}`);
}

export async function criarMelhoria(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const dados = lerMelhoria(formData);
  if (!dados.titulo) redirect("/melhorias/nova?erro=Informe+um+título.");

  const { data, error } = await supabase
    .from("improvement_items")
    .insert({ ...dados, autor_id: user.id })
    .select("id")
    .single();
  if (error || !data) redirect("/melhorias/nova?erro=Não+foi+possível+registrar.");

  revalidar();
  redirect(`/melhorias/${data.id}`);
}

export async function atualizarMelhoria(id: string, formData: FormData) {
  const dados = lerMelhoria(formData);
  if (!dados.titulo) return;

  const supabase = await createClient();
  await supabase
    .from("improvement_items")
    .update({
      ...dados,
      resultado: textoOuNulo(formData, "resultado"),
      ...(dados.status === "implementada" ? { implementada_em: new Date().toISOString() } : {}),
    })
    .eq("id", id);
  revalidar(id);
}

/** Melhoria aprovada -> tarefa (Doc. 2). */
export async function transformarMelhoriaEmTarefa(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: m } = await supabase
    .from("improvement_items")
    .select("titulo, descricao, area_id, responsavel_id, prioridade, process_id, okr_id, task_id")
    .eq("id", id)
    .maybeSingle();
  if (!m || m.task_id) return;

  const { data: tarefa } = await supabase
    .from("tasks")
    .insert({
      titulo: m.titulo,
      descricao: m.descricao,
      area_id: m.area_id,
      responsavel_id: m.responsavel_id ?? user.id,
      prioridade: m.prioridade,
      process_id: m.process_id,
      okr_id: m.okr_id,
      justificativa_sem_prazo: "Melhoria aprovada; definir prazo",
      criado_por: user.id,
    })
    .select("id")
    .single();

  if (tarefa) {
    await supabase
      .from("improvement_items")
      .update({ task_id: tarefa.id, status: "em_implementacao" })
      .eq("id", id);
  }
  revalidar(id);
  revalidatePath("/rotinas");
}

/** Melhoria aprovada -> iniciativa de OKR. No modelo simplificado
 * (OKR = entidade unica), iniciativa e' o vinculo melhoria -> OKR. */
export async function vincularMelhoriaAOkr(id: string, formData: FormData) {
  const okrId = textoOuNulo(formData, "okr_id");
  const supabase = await createClient();
  await supabase.from("improvement_items").update({ okr_id: okrId }).eq("id", id);
  revalidar(id);
  if (okrId) revalidatePath(`/okrs/${okrId}`);
}

export async function excluirMelhoria(id: string) {
  const supabase = await createClient();
  await supabase.from("improvement_items").delete().eq("id", id);
  revalidar();
  redirect("/melhorias");
}
