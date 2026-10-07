"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { lista } from "@/lib/form";

function revalidar() {
  revalidatePath("/alertas");
  revalidatePath("/", "layout"); // contador da barra lateral
}

export async function marcarLido(alertId: string, lido: boolean) {
  const supabase = await createClient();
  await supabase.from("alerts").update({ lido_em: lido ? new Date().toISOString() : null }).eq("id", alertId);
  revalidar();
}

export async function marcarTodosLidos() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  await supabase
    .from("alerts")
    .update({ lido_em: new Date().toISOString() })
    .eq("destinatario_id", user.id)
    .is("lido_em", null);
  revalidar();
}

export async function arquivarAlerta(alertId: string, arquivar: boolean) {
  const supabase = await createClient();
  await supabase
    .from("alerts")
    .update({
      arquivado_em: arquivar ? new Date().toISOString() : null,
      ...(arquivar ? { lido_em: new Date().toISOString() } : {}),
    })
    .eq("id", alertId);
  revalidar();
}

/** Doc. 2: "relacionar alertas a tarefas". Alertas de tarefa ja nascem
 * ligados; os outros (KPI, processo, integracao) viram uma tarefa nova. */
export async function criarTarefaDoAlerta(alertId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: alerta } = await supabase
    .from("alerts")
    .select("titulo, descricao, link, entidade, entidade_id, destinatario_id, task_id, severidade")
    .eq("id", alertId)
    .maybeSingle();
  if (!alerta || alerta.task_id) return;

  const { data: tarefa } = await supabase
    .from("tasks")
    .insert({
      titulo: `Tratar: ${alerta.titulo}`,
      descricao: [alerta.descricao, alerta.link ? `Origem: ${alerta.link}` : null].filter(Boolean).join("\n"),
      responsavel_id: alerta.destinatario_id ?? user.id,
      prioridade: alerta.severidade === "critico" ? "alta" : "media",
      process_id: alerta.entidade === "process" ? alerta.entidade_id : null,
      kpi_id: alerta.entidade === "kpi" ? alerta.entidade_id : null,
      justificativa_sem_prazo: "Criada a partir de um alerta; definir prazo",
      criado_por: user.id,
    })
    .select("id")
    .single();

  if (tarefa) await supabase.from("alerts").update({ task_id: tarefa.id, lido_em: new Date().toISOString() }).eq("id", alertId);
  revalidar();
  revalidatePath("/rotinas");
}

export async function salvarPreferencias(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  // o form manda os tipos ATIVOS; silenciados = o resto
  const ativos = new Set(lista(formData, "tipos_ativos"));
  const todos = lista(formData, "tipos_todos");
  await supabase.from("alert_preferences").upsert({
    profile_id: user.id,
    tipos_silenciados: todos.filter((t) => !ativos.has(t)),
    atualizado_em: new Date().toISOString(),
  });
  revalidar();
}

export async function atualizarAlertasAgora() {
  const supabase = await createClient();
  await supabase.rpc("gerar_alertas", { p_forcar: true });
  revalidar();
}
