"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

function lerDefinicao(formData: FormData) {
  const meta = String(formData.get("meta") ?? "").trim();
  const valorInicial = String(formData.get("valor_inicial") ?? "").trim();

  return {
    nome: String(formData.get("nome") ?? "").trim(),
    descricao: String(formData.get("descricao") ?? "").trim() || null,
    area_id: String(formData.get("area_id") ?? "") || null,
    responsavel_id: String(formData.get("responsavel_id") ?? "") || null,
    tipo_meta: String(formData.get("tipo_meta") ?? "unidade"),
    unidade: String(formData.get("unidade") ?? "").trim() || null,
    valor_inicial: valorInicial ? Number(valorInicial) : null,
    meta: meta ? Number(meta) : null,
  };
}

export async function criarKpi(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const definicao = lerDefinicao(formData);
  if (!definicao.nome) return;

  const { data, error } = await supabase
    .from("kpis")
    .insert({ ...definicao, criado_por: user.id })
    .select("id")
    .single();

  if (error || !data) return;

  revalidatePath("/kpis");
  redirect(`/kpis/${data.id}`);
}

export async function atualizarKpi(kpiId: string, formData: FormData) {
  const supabase = await createClient();
  const definicao = lerDefinicao(formData);
  if (!definicao.nome) return;

  await supabase.from("kpis").update(definicao).eq("id", kpiId);

  revalidatePath(`/kpis/${kpiId}`);
  revalidatePath("/kpis");
}

export async function registrarValor(kpiId: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const valor = String(formData.get("valor") ?? "").trim();
  const referenciaPeriodo = String(formData.get("referencia_periodo") ?? "").trim();
  const tipoValor = String(formData.get("tipo_valor") ?? "manual");

  if (!valor || !referenciaPeriodo) return;

  await supabase.from("kpi_values").insert({
    kpi_id: kpiId,
    valor: Number(valor),
    referencia_periodo: referenciaPeriodo,
    tipo_valor: tipoValor,
    criado_por: user.id,
  });

  revalidatePath(`/kpis/${kpiId}`);
  revalidatePath("/kpis");
}

export async function excluirValor(kpiId: string, valorId: string) {
  const supabase = await createClient();
  await supabase.from("kpi_values").delete().eq("id", valorId);
  revalidatePath(`/kpis/${kpiId}`);
  revalidatePath("/kpis");
}

export async function excluirKpi(kpiId: string) {
  const supabase = await createClient();
  await supabase.from("kpis").delete().eq("id", kpiId);
  revalidatePath("/kpis");
  redirect("/kpis");
}
