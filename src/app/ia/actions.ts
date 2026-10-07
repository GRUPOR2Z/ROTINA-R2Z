"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { texto, textoOuNulo } from "@/lib/form";

/** So mexe em validacao -- o conteudo gerado pela IA nunca e'
 * reescrito pelo app (fica como a IA entregou, pra auditoria). */
export async function validarAchado(reportId: string, findingId: string, validacao: "validado" | "rejeitado" | "pendente") {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("ai_findings")
    .update({
      validacao,
      validado_por: validacao === "pendente" ? null : user.id,
      validado_em: validacao === "pendente" ? null : new Date().toISOString(),
    })
    .eq("id", findingId);
  revalidatePath(`/ia/${reportId}`);
  revalidatePath("/ia");
}

export async function comentarAchado(reportId: string, findingId: string, formData: FormData) {
  const comentario = texto(formData, "texto");
  if (!comentario) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("ai_finding_comments").insert({ finding_id: findingId, autor_id: user.id, texto: comentario });
  revalidatePath(`/ia/${reportId}`);
}

export async function relacionarAchado(reportId: string, findingId: string, formData: FormData) {
  const supabase = await createClient();
  await supabase
    .from("ai_findings")
    .update({
      kpi_id: textoOuNulo(formData, "kpi_id"),
      okr_id: textoOuNulo(formData, "okr_id"),
      process_id: textoOuNulo(formData, "process_id"),
    })
    .eq("id", findingId);
  revalidatePath(`/ia/${reportId}`);
}

/** Recomendacao validada -> tarefa. A IA sugere; quem cria e' a pessoa. */
export async function criarTarefaDoAchado(reportId: string, findingId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: a } = await supabase
    .from("ai_findings")
    .select("titulo, descricao, prioridade, kpi_id, okr_id, process_id, task_id")
    .eq("id", findingId)
    .maybeSingle();
  if (!a || a.task_id) return;

  const { data: tarefa } = await supabase
    .from("tasks")
    .insert({
      titulo: a.titulo,
      descricao: [a.descricao, "Origem: recomendação da Grupo R2Z IA, validada por uma pessoa."].filter(Boolean).join("\n\n"),
      prioridade: a.prioridade,
      responsavel_id: user.id,
      kpi_id: a.kpi_id,
      okr_id: a.okr_id,
      process_id: a.process_id,
      justificativa_sem_prazo: "Criada a partir de achado da IA; definir prazo",
      criado_por: user.id,
    })
    .select("id")
    .single();

  if (tarefa) await supabase.from("ai_findings").update({ task_id: tarefa.id }).eq("id", findingId);
  revalidatePath(`/ia/${reportId}`);
  revalidatePath("/rotinas");
}
