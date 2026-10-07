"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { numeroOuNulo, texto, textoOuNulo } from "@/lib/form";
import { TIPOS_ETAPA } from "@/lib/onboarding";

function lerTrilha(formData: FormData) {
  return {
    nome: texto(formData, "nome"),
    descricao: textoOuNulo(formData, "descricao"),
    cargo: textoOuNulo(formData, "cargo"),
    area_id: textoOuNulo(formData, "area_id"),
  };
}

export async function criarTrilha(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const dados = lerTrilha(formData);
  if (!dados.nome) redirect("/onboarding/trilhas/nova?erro=Informe+o+nome+da+trilha.");

  const { data, error } = await supabase
    .from("onboarding_tracks")
    .insert({ ...dados, criado_por: user.id })
    .select("id")
    .single();
  // RLS so deixa gestor/admin criar -- o erro mais provavel e' esse
  if (error || !data) redirect("/onboarding/trilhas/nova?erro=Só+gestores+e+administradores+criam+trilhas.");

  revalidatePath("/onboarding");
  redirect(`/onboarding/trilhas/${data.id}`);
}

export async function atualizarTrilha(trackId: string, formData: FormData) {
  const dados = lerTrilha(formData);
  if (!dados.nome) return;
  const supabase = await createClient();
  await supabase
    .from("onboarding_tracks")
    .update({ ...dados, ativo: texto(formData, "ativo") !== "false" })
    .eq("id", trackId);
  revalidatePath(`/onboarding/trilhas/${trackId}`);
  revalidatePath("/onboarding");
}

export async function adicionarEtapa(trackId: string, formData: FormData) {
  const titulo = texto(formData, "titulo");
  if (!titulo) return;
  const tipo = texto(formData, "tipo");

  const supabase = await createClient();
  const { data: ultima } = await supabase
    .from("onboarding_steps")
    .select("ordem")
    .eq("track_id", trackId)
    .order("ordem", { ascending: false })
    .limit(1)
    .maybeSingle();

  await supabase.from("onboarding_steps").insert({
    track_id: trackId,
    ordem: (ultima?.ordem ?? 0) + 1,
    titulo,
    descricao: textoOuNulo(formData, "descricao"),
    tipo: TIPOS_ETAPA.some((t) => t.value === tipo) ? tipo : "leitura",
    process_id: textoOuNulo(formData, "process_id"),
    responsavel_id: textoOuNulo(formData, "responsavel_id"),
    prazo_dias: numeroOuNulo(formData, "prazo_dias"),
  });
  revalidatePath(`/onboarding/trilhas/${trackId}`);
}

export async function moverEtapa(trackId: string, stepId: string, direcao: -1 | 1) {
  const supabase = await createClient();
  const { data: etapas } = await supabase
    .from("onboarding_steps")
    .select("id, ordem")
    .eq("track_id", trackId)
    .order("ordem");
  if (!etapas) return;

  const i = etapas.findIndex((e) => e.id === stepId);
  const j = i + direcao;
  if (i < 0 || j < 0 || j >= etapas.length) return;

  // troca as duas posicoes; renumera pra nao depender de ordens unicas
  const reordenadas = [...etapas];
  [reordenadas[i], reordenadas[j]] = [reordenadas[j], reordenadas[i]];
  await Promise.all(
    reordenadas.map((e, idx) => supabase.from("onboarding_steps").update({ ordem: idx + 1 }).eq("id", e.id)),
  );
  revalidatePath(`/onboarding/trilhas/${trackId}`);
}

export async function removerEtapa(trackId: string, stepId: string) {
  const supabase = await createClient();
  await supabase.from("onboarding_steps").delete().eq("id", stepId);
  revalidatePath(`/onboarding/trilhas/${trackId}`);
}

export async function inscreverPessoa(trackId: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const profileId = textoOuNulo(formData, "profile_id");
  if (!profileId) return;

  const { data } = await supabase
    .from("onboarding_assignments")
    .insert({
      track_id: trackId,
      profile_id: profileId,
      mentor_id: textoOuNulo(formData, "mentor_id"),
      data_inicio: textoOuNulo(formData, "data_inicio") ?? undefined,
      prazo: textoOuNulo(formData, "prazo"),
      criado_por: user.id,
    })
    .select("id")
    .single();

  revalidatePath(`/onboarding/trilhas/${trackId}`);
  revalidatePath("/onboarding");
  if (data) redirect(`/onboarding/inscricoes/${data.id}`);
}

export async function alternarEtapaConcluida(assignmentId: string, stepId: string, concluir: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  if (concluir) {
    await supabase
      .from("onboarding_progress")
      .upsert({ assignment_id: assignmentId, step_id: stepId, concluido_por: user.id }, { onConflict: "assignment_id,step_id" });
  } else {
    await supabase.from("onboarding_progress").delete().eq("assignment_id", assignmentId).eq("step_id", stepId);
  }

  // concluido_em da inscricao e' mantido pelo trigger
  // atualizar_conclusao_onboarding (migration 0023)
  revalidatePath(`/onboarding/inscricoes/${assignmentId}`);
  revalidatePath("/onboarding");
}

export async function cancelarInscricao(assignmentId: string) {
  const supabase = await createClient();
  await supabase.from("onboarding_assignments").delete().eq("id", assignmentId);
  revalidatePath("/onboarding");
  redirect("/onboarding");
}
