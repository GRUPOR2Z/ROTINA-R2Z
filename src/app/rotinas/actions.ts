"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  proximaData,
  gerarProximasDatas,
  HORIZONTE_RECORRENCIA,
  type Frequencia,
} from "@/lib/calendar";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

type DadosTarefaBase = {
  titulo: string;
  descricao: string | null;
  area_id: string | null;
  responsavel_id: string | null;
  prioridade: string;
  horario: string | null;
  cor: string | null;
  criado_por: string;
};

async function criarOcorrencia(
  supabase: SupabaseServerClient,
  routineId: string,
  prazo: string,
  base: DadosTarefaBase,
) {
  const { data: novaTarefa } = await supabase
    .from("tasks")
    .insert({ ...base, prazo })
    .select("id")
    .single();

  if (novaTarefa) {
    await supabase
      .from("task_occurrences")
      .insert({ recurring_routine_id: routineId, task_id: novaTarefa.id, data_prevista: prazo });
  }
}

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
  const cor = String(formData.get("cor") ?? "") || null;
  const descricao = String(formData.get("descricao") ?? "").trim() || null;
  const frequencia = String(formData.get("frequencia") ?? "nenhuma") as Frequencia | "nenhuma";

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
      cor,
      criado_por: user.id,
    })
    .select("id")
    .single();

  if (error || !data) return;

  if (frequencia !== "nenhuma" && prazo) {
    const { data: rotina } = await supabase
      .from("recurring_routines")
      .insert({ frequencia, criado_por: user.id })
      .select("id")
      .single();

    if (rotina) {
      await supabase
        .from("task_occurrences")
        .insert({ recurring_routine_id: rotina.id, task_id: data.id, data_prevista: prazo });

      // pre-gera as proximas ocorrencias, tipo uma agenda de verdade --
      // nao so "a proxima depois que eu concluir esta".
      const base: DadosTarefaBase = {
        titulo,
        descricao,
        area_id: areaId,
        responsavel_id: responsavelId,
        prioridade,
        horario,
        cor,
        criado_por: user.id,
      };
      const proximasDatas = gerarProximasDatas(
        prazo,
        frequencia,
        HORIZONTE_RECORRENCIA[frequencia] - 1,
      );
      for (const dataFutura of proximasDatas) {
        await criarOcorrencia(supabase, rotina.id, dataFutura, base);
      }
    }
  }

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
  const cor = String(formData.get("cor") ?? "") || null;
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
      cor,
    })
    .eq("id", taskId);

  // cor e' da serie, nao so dessa ocorrencia -- propaga pra todas as
  // ocorrencias (passadas pendentes e futuras) da mesma rotina.
  const { data: ocorrencia } = await supabase
    .from("task_occurrences")
    .select("recurring_routine_id")
    .eq("task_id", taskId)
    .maybeSingle();

  if (ocorrencia) {
    const { data: irmas } = await supabase
      .from("task_occurrences")
      .select("task_id")
      .eq("recurring_routine_id", ocorrencia.recurring_routine_id);

    const idsIrmas = (irmas ?? []).map((o) => o.task_id).filter((id) => id !== taskId);
    if (idsIrmas.length > 0) {
      await supabase.from("tasks").update({ cor }).in("id", idsIrmas);
    }
    revalidatePath("/rotinas/calendario");
  }

  revalidatePath(`/rotinas/${taskId}`);
  revalidatePath("/rotinas");
}

export async function atualizarStatus(
  taskId: string,
  status: "pendente" | "em_andamento" | "concluida" | "bloqueada",
  bloqueioMotivo?: string,
) {
  const supabase = await createClient();

  const { data: tarefaAtual } = await supabase
    .from("tasks")
    .select("*")
    .eq("id", taskId)
    .single();

  await supabase
    .from("tasks")
    .update({
      status,
      concluida_em: status === "concluida" ? new Date().toISOString() : null,
      bloqueio_motivo: status === "bloqueada" ? bloqueioMotivo ?? null : null,
    })
    .eq("id", taskId);

  if (status === "concluida" && tarefaAtual?.prazo) {
    const { data: ocorrencia } = await supabase
      .from("task_occurrences")
      .select("recurring_routine_id")
      .eq("task_id", taskId)
      .maybeSingle();

    const rotina = ocorrencia
      ? (
          await supabase
            .from("recurring_routines")
            .select("frequencia, ativa")
            .eq("id", ocorrencia.recurring_routine_id)
            .maybeSingle()
        ).data
      : null;

    if (ocorrencia && rotina?.ativa) {
      // mantem a janela de ocorrencias futuras: gera mais uma depois
      // da mais distante ja existente, nao depois desta tarefa.
      const { data: maisDistante } = await supabase
        .from("task_occurrences")
        .select("data_prevista")
        .eq("recurring_routine_id", ocorrencia.recurring_routine_id)
        .order("data_prevista", { ascending: false })
        .limit(1)
        .maybeSingle();

      const baseData = maisDistante?.data_prevista ?? tarefaAtual.prazo;
      const proximoPrazo = proximaData(baseData, rotina.frequencia as Frequencia);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      await criarOcorrencia(supabase, ocorrencia.recurring_routine_id, proximoPrazo, {
        titulo: tarefaAtual.titulo,
        descricao: tarefaAtual.descricao,
        area_id: tarefaAtual.area_id,
        responsavel_id: tarefaAtual.responsavel_id,
        prioridade: tarefaAtual.prioridade,
        horario: tarefaAtual.horario,
        cor: tarefaAtual.cor,
        criado_por: user?.id ?? tarefaAtual.criado_por,
      });
    }
  }

  revalidatePath(`/rotinas/${taskId}`);
  revalidatePath("/rotinas");
  revalidatePath("/rotinas/calendario");
}

export async function pararRecorrencia(taskId: string) {
  const supabase = await createClient();

  const { data: ocorrencia } = await supabase
    .from("task_occurrences")
    .select("recurring_routine_id")
    .eq("task_id", taskId)
    .maybeSingle();

  if (ocorrencia) {
    await supabase
      .from("recurring_routines")
      .update({ ativa: false })
      .eq("id", ocorrencia.recurring_routine_id);
  }

  revalidatePath(`/rotinas/${taskId}`);
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
