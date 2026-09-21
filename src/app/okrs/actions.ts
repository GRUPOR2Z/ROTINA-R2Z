"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

function lerDefinicao(formData: FormData) {
  const meta = String(formData.get("meta") ?? "").trim();
  const valorInicial = String(formData.get("valor_inicial") ?? "").trim();
  const prazo = String(formData.get("prazo") ?? "").trim();

  return {
    titulo: String(formData.get("titulo") ?? "").trim(),
    descricao: String(formData.get("descricao") ?? "").trim() || null,
    area_id: String(formData.get("area_id") ?? "") || null,
    responsavel_id: String(formData.get("responsavel_id") ?? "") || null,
    tipo_meta: String(formData.get("tipo_meta") ?? "unidade"),
    unidade: String(formData.get("unidade") ?? "").trim() || null,
    valor_inicial: valorInicial ? Number(valorInicial) : null,
    meta: meta ? Number(meta) : 0,
    prazo: prazo || null,
  };
}

export async function criarOkr(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const definicao = lerDefinicao(formData);
  if (!definicao.titulo) return;

  const { data, error } = await supabase
    .from("okrs")
    .insert({ ...definicao, criado_por: user.id })
    .select("id")
    .single();

  if (error || !data) return;

  revalidatePath("/okrs");
  redirect(`/okrs/${data.id}`);
}

export async function atualizarOkr(okrId: string, formData: FormData) {
  const supabase = await createClient();
  const definicao = lerDefinicao(formData);
  if (!definicao.titulo) return;

  await supabase.from("okrs").update(definicao).eq("id", okrId);

  revalidatePath(`/okrs/${okrId}`);
  revalidatePath("/okrs");
}

export async function registrarValor(okrId: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const valor = String(formData.get("valor") ?? "").trim();
  const referenciaPeriodo = String(formData.get("referencia_periodo") ?? "").trim();
  const comentario = String(formData.get("comentario") ?? "").trim() || null;

  if (!valor || !referenciaPeriodo) return;

  await supabase.from("okr_values").insert({
    okr_id: okrId,
    valor: Number(valor),
    referencia_periodo: referenciaPeriodo,
    comentario,
    criado_por: user.id,
  });

  revalidatePath(`/okrs/${okrId}`);
  revalidatePath("/okrs");
}

export async function excluirValor(okrId: string, valorId: string) {
  const supabase = await createClient();
  await supabase.from("okr_values").delete().eq("id", valorId);
  revalidatePath(`/okrs/${okrId}`);
  revalidatePath("/okrs");
}

export async function excluirOkr(okrId: string) {
  const supabase = await createClient();
  await supabase.from("okrs").delete().eq("id", okrId);
  revalidatePath("/okrs");
  redirect("/okrs");
}
