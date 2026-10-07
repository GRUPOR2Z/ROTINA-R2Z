"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { texto, textoOuNulo } from "@/lib/form";
import { STATUS_PROJETO, type StatusProjeto } from "@/lib/projetos";

function lerProjeto(formData: FormData) {
  const status = texto(formData, "status");
  return {
    nome: texto(formData, "nome"),
    descricao: textoOuNulo(formData, "descricao"),
    area_id: textoOuNulo(formData, "area_id"),
    responsavel_id: textoOuNulo(formData, "responsavel_id"),
    client_id: textoOuNulo(formData, "client_id"),
    data_inicio: textoOuNulo(formData, "data_inicio"),
    prazo: textoOuNulo(formData, "prazo"),
    riscos: textoOuNulo(formData, "riscos"),
    ...(STATUS_PROJETO.some((s) => s.value === status) ? { status } : {}),
  };
}

function revalidar(projectId?: string) {
  revalidatePath("/projetos");
  if (projectId) revalidatePath(`/projetos/${projectId}`);
}

export async function criarProjeto(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const dados = lerProjeto(formData);
  if (!dados.nome) redirect("/projetos/novo?erro=Informe+o+nome+do+projeto.");

  const { data, error } = await supabase
    .from("projects")
    .insert({ ...dados, responsavel_id: dados.responsavel_id ?? user.id, criado_por: user.id })
    .select("id")
    .single();

  if (error || !data) redirect("/projetos/novo?erro=Não+foi+possível+criar+o+projeto.");

  // quem cria e o responsavel entram na equipe automaticamente
  const membros = [...new Set([user.id, dados.responsavel_id ?? user.id])];
  await supabase.from("project_members").insert(membros.map((profile_id) => ({ project_id: data.id, profile_id })));

  revalidar();
  redirect(`/projetos/${data.id}`);
}

export async function atualizarProjeto(projectId: string, formData: FormData) {
  const dados = lerProjeto(formData);
  if (!dados.nome) return;

  const supabase = await createClient();
  await supabase
    .from("projects")
    .update({
      ...dados,
      concluido_em: dados.status === "concluido" ? new Date().toISOString() : null,
    })
    .eq("id", projectId);
  revalidar(projectId);
}

/** Usado pelo Kanban de projetos (arrastar entre colunas). */
export async function mudarStatusProjeto(projectId: string, status: StatusProjeto) {
  if (!STATUS_PROJETO.some((s) => s.value === status)) return;
  const supabase = await createClient();
  await supabase
    .from("projects")
    .update({ status, concluido_em: status === "concluido" ? new Date().toISOString() : null })
    .eq("id", projectId);
  revalidar(projectId);
}

export async function excluirProjeto(projectId: string) {
  const supabase = await createClient();
  await supabase.from("projects").delete().eq("id", projectId);
  revalidar();
  redirect("/projetos");
}

export async function adicionarMembro(projectId: string, formData: FormData) {
  const profileId = textoOuNulo(formData, "profile_id");
  if (!profileId) return;
  const supabase = await createClient();
  await supabase
    .from("project_members")
    .upsert({ project_id: projectId, profile_id: profileId, papel: textoOuNulo(formData, "papel") }, { onConflict: "project_id,profile_id" });
  revalidar(projectId);
}

export async function removerMembro(projectId: string, memberId: string) {
  const supabase = await createClient();
  await supabase.from("project_members").delete().eq("id", memberId);
  revalidar(projectId);
}

export async function adicionarEntrega(projectId: string, formData: FormData) {
  const descricao = texto(formData, "descricao");
  if (!descricao) return;
  const supabase = await createClient();
  await supabase
    .from("project_deliverables")
    .insert({ project_id: projectId, descricao, prazo: textoOuNulo(formData, "prazo") });
  revalidar(projectId);
}

export async function alternarEntrega(projectId: string, entregaId: string, concluido: boolean) {
  const supabase = await createClient();
  await supabase
    .from("project_deliverables")
    .update({ concluido, concluido_em: concluido ? new Date().toISOString() : null })
    .eq("id", entregaId);
  revalidar(projectId);
}

export async function removerEntrega(projectId: string, entregaId: string) {
  const supabase = await createClient();
  await supabase.from("project_deliverables").delete().eq("id", entregaId);
  revalidar(projectId);
}

export async function vincularProcesso(projectId: string, formData: FormData) {
  const processId = textoOuNulo(formData, "process_id");
  if (!processId) return;
  const supabase = await createClient();
  await supabase
    .from("project_processes")
    .upsert({ project_id: projectId, process_id: processId }, { onConflict: "project_id,process_id" });
  revalidar(projectId);
}

export async function desvincularProcesso(projectId: string, vinculoId: string) {
  const supabase = await createClient();
  await supabase.from("project_processes").delete().eq("id", vinculoId);
  revalidar(projectId);
}
