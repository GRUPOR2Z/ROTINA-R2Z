"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function criarTarefa(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const titulo = String(formData.get("titulo") ?? "").trim();
  if (!titulo) return;

  const areaId = String(formData.get("area_id") ?? "") || null;
  const responsavelId = String(formData.get("responsavel_id") ?? "") || user.id;
  const prioridade = String(formData.get("prioridade") ?? "media");
  const prazo = String(formData.get("prazo") ?? "") || null;
  const horario = String(formData.get("horario") ?? "") || null;
  const descricao = String(formData.get("descricao") ?? "").trim() || null;

  const { data, error } = await supabase
    .from("tasks")
    .insert({
      titulo,
      descricao,
      area_id: areaId,
      responsavel_id: responsavelId,
      prioridade,
      prazo,
      horario,
      criado_por: user.id,
    })
    .select("id")
    .single();

  if (error || !data) return;

  revalidatePath("/rotinas");
  redirect(`/rotinas/${data.id}`);
}

export async function atualizarTarefa(taskId: string, formData: FormData) {
  const supabase = await createClient();

  const titulo = String(formData.get("titulo") ?? "").trim();
  if (!titulo) return;

  const areaId = String(formData.get("area_id") ?? "") || null;
  const responsavelId = String(formData.get("responsavel_id") ?? "") || null;
  const prioridade = String(formData.get("prioridade") ?? "media");
  const prazo = String(formData.get("prazo") ?? "") || null;
  const horario = String(formData.get("horario") ?? "") || null;
  const descricao = String(formData.get("descricao") ?? "").trim() || null;

  await supabase
    .from("tasks")
    .update({
      titulo,
      descricao,
      area_id: areaId,
      responsavel_id: responsavelId,
      prioridade,
      prazo,
      horario,
    })
    .eq("id", taskId);

  revalidatePath(`/rotinas/${taskId}`);
  revalidatePath("/rotinas");
}

export async function atualizarStatus(
  taskId: string,
  status: "pendente" | "em_andamento" | "concluida" | "bloqueada",
  bloqueioMotivo?: string,
) {
  const supabase = await createClient();

  await supabase
    .from("tasks")
    .update({
      status,
      concluida_em: status === "concluida" ? new Date().toISOString() : null,
      bloqueio_motivo: status === "bloqueada" ? bloqueioMotivo ?? null : null,
    })
    .eq("id", taskId);

  revalidatePath(`/rotinas/${taskId}`);
  revalidatePath("/rotinas");
}

export async function excluirTarefa(taskId: string) {
  const supabase = await createClient();
  await supabase.from("tasks").delete().eq("id", taskId);
  revalidatePath("/rotinas");
  redirect("/rotinas");
}

export async function adicionarChecklistItem(taskId: string, formData: FormData) {
  const descricao = String(formData.get("descricao") ?? "").trim();
  if (!descricao) return;

  const supabase = await createClient();
  await supabase.from("task_checklist_items").insert({ task_id: taskId, descricao });
  revalidatePath(`/rotinas/${taskId}`);
}

export async function alternarChecklistItem(taskId: string, itemId: string, concluido: boolean) {
  const supabase = await createClient();
  await supabase.from("task_checklist_items").update({ concluido }).eq("id", itemId);
  revalidatePath(`/rotinas/${taskId}`);
}

export async function adicionarComentario(taskId: string, formData: FormData) {
  const texto = String(formData.get("texto") ?? "").trim();
  if (!texto) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("task_comments")
    .insert({ task_id: taskId, autor_id: user.id, texto });

  revalidatePath(`/rotinas/${taskId}`);
}
