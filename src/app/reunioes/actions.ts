"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { lista, texto, textoOuNulo } from "@/lib/form";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

/** Substitui a lista de participantes (tabela de juncao) pela do form. */
async function salvarParticipantes(
  supabase: SupabaseServerClient,
  tabela: "meeting_participants" | "decision_participants",
  coluna: "meeting_id" | "decision_id",
  id: string,
  participantes: string[],
) {
  await supabase.from(tabela).delete().eq(coluna, id);
  if (participantes.length > 0) {
    await supabase.from(tabela).insert(participantes.map((profile_id) => ({ [coluna]: id, profile_id })));
  }
}

function lerReuniao(formData: FormData) {
  return {
    titulo: texto(formData, "titulo"),
    data: texto(formData, "data"),
    horario: textoOuNulo(formData, "horario"),
    area_id: textoOuNulo(formData, "area_id"),
    pauta: textoOuNulo(formData, "pauta"),
    notas: textoOuNulo(formData, "notas"),
  };
}

export async function criarReuniao(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const dados = lerReuniao(formData);
  if (!dados.titulo || !dados.data) redirect("/reunioes/nova?erro=Informe+título+e+data.");

  const { data, error } = await supabase
    .from("meetings")
    .insert({ ...dados, criado_por: user.id })
    .select("id")
    .single();
  if (error || !data) redirect("/reunioes/nova?erro=Não+foi+possível+registrar+a+reunião.");

  await salvarParticipantes(supabase, "meeting_participants", "meeting_id", data.id, lista(formData, "participantes"));

  revalidatePath("/reunioes");
  redirect(`/reunioes/${data.id}`);
}

export async function atualizarReuniao(meetingId: string, formData: FormData) {
  const dados = lerReuniao(formData);
  if (!dados.titulo || !dados.data) return;

  const supabase = await createClient();
  await supabase.from("meetings").update(dados).eq("id", meetingId);
  await salvarParticipantes(supabase, "meeting_participants", "meeting_id", meetingId, lista(formData, "participantes"));

  revalidatePath(`/reunioes/${meetingId}`);
  revalidatePath("/reunioes");
}

export async function excluirReuniao(meetingId: string) {
  const supabase = await createClient();
  await supabase.from("meetings").delete().eq("id", meetingId);
  revalidatePath("/reunioes");
  redirect("/reunioes");
}

export async function adicionarEncaminhamento(meetingId: string, formData: FormData) {
  const descricao = texto(formData, "descricao");
  if (!descricao) return;

  const supabase = await createClient();
  await supabase.from("meeting_action_items").insert({
    meeting_id: meetingId,
    descricao,
    responsavel_id: textoOuNulo(formData, "responsavel_id"),
    prazo: textoOuNulo(formData, "prazo"),
  });
  revalidatePath(`/reunioes/${meetingId}`);
}

export async function removerEncaminhamento(meetingId: string, itemId: string) {
  const supabase = await createClient();
  await supabase.from("meeting_action_items").delete().eq("id", itemId);
  revalidatePath(`/reunioes/${meetingId}`);
}

/** Doc. 2: "permitir transformar encaminhamentos em tarefas". Cria a
 * tarefa com os dados do encaminhamento e guarda o vinculo. */
export async function transformarEmTarefa(meetingId: string, itemId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const [{ data: item }, { data: reuniao }] = await Promise.all([
    supabase.from("meeting_action_items").select("descricao, responsavel_id, prazo, task_id").eq("id", itemId).maybeSingle(),
    supabase.from("meetings").select("titulo, data, area_id").eq("id", meetingId).maybeSingle(),
  ]);
  if (!item || item.task_id) return;

  const { data: tarefa } = await supabase
    .from("tasks")
    .insert({
      titulo: item.descricao,
      descricao: reuniao ? `Encaminhamento da reunião "${reuniao.titulo}" (${reuniao.data}).` : null,
      area_id: reuniao?.area_id ?? null,
      responsavel_id: item.responsavel_id ?? user.id,
      prazo: item.prazo,
      justificativa_sem_prazo: item.prazo ? null : "Encaminhamento de reunião sem prazo definido",
      prioridade: "media",
      criado_por: user.id,
    })
    .select("id")
    .single();

  if (tarefa) {
    await supabase.from("meeting_action_items").update({ task_id: tarefa.id }).eq("id", itemId);
  }
  revalidatePath(`/reunioes/${meetingId}`);
  revalidatePath("/rotinas");
}

// ---------------------------------------------------------------
// Decisoes
// ---------------------------------------------------------------

function lerDecisao(formData: FormData) {
  return {
    titulo: texto(formData, "titulo"),
    data: texto(formData, "data"),
    contexto: textoOuNulo(formData, "contexto"),
    decisao: texto(formData, "decisao"),
    motivo: textoOuNulo(formData, "motivo"),
    impacto_esperado: textoOuNulo(formData, "impacto_esperado"),
    responsavel_id: textoOuNulo(formData, "responsavel_id"),
    prazo: textoOuNulo(formData, "prazo"),
    area_id: textoOuNulo(formData, "area_id"),
    meeting_id: textoOuNulo(formData, "meeting_id"),
    process_id: textoOuNulo(formData, "process_id"),
    task_id: textoOuNulo(formData, "task_id"),
    okr_id: textoOuNulo(formData, "okr_id"),
  };
}

export async function criarDecisao(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const dados = lerDecisao(formData);
  if (!dados.titulo || !dados.decisao || !dados.data) {
    redirect("/decisoes/nova?erro=Título,+data+e+decisão+são+obrigatórios.");
  }

  const { data, error } = await supabase
    .from("decisions")
    .insert({ ...dados, criado_por: user.id })
    .select("id")
    .single();
  if (error || !data) redirect("/decisoes/nova?erro=Não+foi+possível+registrar+a+decisão.");

  await salvarParticipantes(supabase, "decision_participants", "decision_id", data.id, lista(formData, "participantes"));

  revalidatePath("/decisoes");
  if (dados.meeting_id) revalidatePath(`/reunioes/${dados.meeting_id}`);
  redirect(`/decisoes/${data.id}`);
}

export async function atualizarDecisao(decisionId: string, formData: FormData) {
  const dados = lerDecisao(formData);
  if (!dados.titulo || !dados.decisao || !dados.data) return;

  const supabase = await createClient();
  await supabase.from("decisions").update(dados).eq("id", decisionId);
  await salvarParticipantes(supabase, "decision_participants", "decision_id", decisionId, lista(formData, "participantes"));

  revalidatePath(`/decisoes/${decisionId}`);
  revalidatePath("/decisoes");
}

/** Decisao nao some: revogar mantem o registro (memoria organizacional). */
export async function alternarRevogacao(decisionId: string, revogar: boolean) {
  const supabase = await createClient();
  await supabase.from("decisions").update({ status: revogar ? "revogada" : "vigente" }).eq("id", decisionId);
  revalidatePath(`/decisoes/${decisionId}`);
  revalidatePath("/decisoes");
}

export async function excluirDecisao(decisionId: string) {
  const supabase = await createClient();
  await supabase.from("decisions").delete().eq("id", decisionId);
  revalidatePath("/decisoes");
  redirect("/decisoes");
}
