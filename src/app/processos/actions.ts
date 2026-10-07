"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { exportarProcessoParaGoogleDocs } from "@/lib/google-docs";
import { extrairTextoDeArquivo } from "@/lib/extract-text";
import { booleano, numeroOuNulo, texto, textoOuNulo } from "@/lib/form";
import { dateKey } from "@/lib/calendar";

const CAMPOS_CONTEUDO = [
  "titulo",
  "area_id",
  "responsavel_id",
  "objetivo",
  "pre_requisitos",
  "gatilho",
  "entradas",
  "passo_a_passo",
  "saidas",
  "criterios_conclusao",
  "problemas_comuns",
  "links",
  "substituto_id",
  "frequencia_revisao_dias",
  "critico",
] as const;

function lerConteudo(formData: FormData) {
  return {
    titulo: String(formData.get("titulo") ?? "").trim(),
    area_id: String(formData.get("area_id") ?? "") || null,
    responsavel_id: String(formData.get("responsavel_id") ?? "") || null,
    objetivo: String(formData.get("objetivo") ?? "").trim() || null,
    pre_requisitos: String(formData.get("pre_requisitos") ?? "").trim() || null,
    gatilho: String(formData.get("gatilho") ?? "").trim() || null,
    entradas: String(formData.get("entradas") ?? "").trim() || null,
    passo_a_passo: String(formData.get("passo_a_passo") ?? "").trim() || null,
    saidas: String(formData.get("saidas") ?? "").trim() || null,
    criterios_conclusao: String(formData.get("criterios_conclusao") ?? "").trim() || null,
    problemas_comuns: textoOuNulo(formData, "problemas_comuns"),
    links: textoOuNulo(formData, "links"),
    substituto_id: textoOuNulo(formData, "substituto_id"),
    frequencia_revisao_dias: numeroOuNulo(formData, "frequencia_revisao_dias"),
    critico: booleano(formData, "critico"),
  };
}

export async function criarProcesso(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const conteudo = lerConteudo(formData);
  if (!conteudo.titulo) return;

  const { data, error } = await supabase
    .from("processes")
    .insert({ ...conteudo, criado_por: user.id })
    .select("id")
    .single();

  if (error || !data) return;

  revalidatePath("/processos");
  redirect(`/processos/${data.id}`);
}

export async function importarProcesso(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const arquivo = formData.get("arquivo");
  if (!(arquivo instanceof File) || arquivo.size === 0) {
    redirect("/processos/importar?erro=Selecione+um+arquivo+.docx+ou+.pdf.");
  }

  const nomeSemExtensao = arquivo.name.replace(/\.[^/.]+$/, "");
  const areaId = String(formData.get("area_id") ?? "") || null;
  const responsavelId = String(formData.get("responsavel_id") ?? "") || null;

  let textoExtraido: string;
  try {
    const buffer = Buffer.from(await arquivo.arrayBuffer());
    textoExtraido = await extrairTextoDeArquivo(buffer, arquivo.name);
  } catch (erro) {
    const mensagem = erro instanceof Error ? erro.message : "Não foi possível ler o arquivo.";
    redirect(`/processos/importar?erro=${encodeURIComponent(mensagem)}`);
  }

  if (!textoExtraido) {
    redirect("/processos/importar?erro=O+arquivo+não+tinha+texto+para+extrair.");
  }

  const { data, error } = await supabase
    .from("processes")
    .insert({
      titulo: nomeSemExtensao || "Processo importado",
      area_id: areaId,
      responsavel_id: responsavelId,
      passo_a_passo: textoExtraido,
      criado_por: user.id,
    })
    .select("id")
    .single();

  if (error || !data) {
    redirect("/processos/importar?erro=Não+foi+possível+salvar+o+processo.");
  }

  revalidatePath("/processos");
  redirect(`/processos/${data.id}`);
}

export async function atualizarProcesso(processId: string, formData: FormData) {
  const supabase = await createClient();
  const conteudo = lerConteudo(formData);
  if (!conteudo.titulo) return;

  const { data: atual } = await supabase
    .from("processes")
    .select("status")
    .eq("id", processId)
    .single();

  // editar um processo publicado o devolve a rascunho -- a versao
  // publicada (o snapshot) nunca muda sozinha.
  const novoStatus = atual?.status === "publicado" ? "rascunho" : atual?.status;

  await supabase
    .from("processes")
    .update({ ...conteudo, ...(novoStatus ? { status: novoStatus } : {}) })
    .eq("id", processId);

  revalidatePath(`/processos/${processId}`);
  revalidatePath("/processos");
}

export async function enviarParaRevisao(processId: string) {
  const supabase = await createClient();
  await supabase.from("processes").update({ status: "revisao" }).eq("id", processId);
  revalidatePath(`/processos/${processId}`);
  revalidatePath("/processos");
}

export async function publicarProcesso(processId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: processo } = await supabase
    .from("processes")
    .select(CAMPOS_CONTEUDO.join(","))
    .eq("id", processId)
    .single();

  if (!processo) return;

  const { data: ultimaVersao } = await supabase
    .from("process_versions")
    .select("numero_versao")
    .eq("process_id", processId)
    .order("numero_versao", { ascending: false })
    .limit(1)
    .maybeSingle();

  const proximoNumero = (ultimaVersao?.numero_versao ?? 0) + 1;

  const { data: versao, error } = await supabase
    .from("process_versions")
    .insert({
      process_id: processId,
      numero_versao: proximoNumero,
      snapshot: processo,
      publicado_por: user.id,
    })
    .select("id")
    .single();

  if (error || !versao) return;

  await supabase
    .from("processes")
    .update({ status: "publicado", versao_publicada_id: versao.id, ultima_revisao_em: dateKey(new Date()) })
    .eq("id", processId);

  revalidatePath(`/processos/${processId}`);
  revalidatePath("/processos");
}

export async function arquivarProcesso(processId: string) {
  const supabase = await createClient();
  await supabase.from("processes").update({ status: "arquivado" }).eq("id", processId);
  revalidatePath(`/processos/${processId}`);
  revalidatePath("/processos");
}

export async function reabrirProcesso(processId: string) {
  const supabase = await createClient();
  await supabase.from("processes").update({ status: "rascunho" }).eq("id", processId);
  revalidatePath(`/processos/${processId}`);
  revalidatePath("/processos");
}

export async function exportarParaGoogleDocs(processId: string) {
  const supabase = await createClient();

  const { data: processo } = await supabase
    .from("processes")
    .select(`${CAMPOS_CONTEUDO.join(",")}, google_doc_url`)
    .eq("id", processId)
    .single<{
      titulo: string;
      objetivo: string | null;
      pre_requisitos: string | null;
      gatilho: string | null;
      entradas: string | null;
      passo_a_passo: string | null;
      saidas: string | null;
      criterios_conclusao: string | null;
      google_doc_url: string | null;
    }>();

  if (!processo) return;

  const url = await exportarProcessoParaGoogleDocs(processo, processo.google_doc_url);

  await supabase.from("processes").update({ google_doc_url: url }).eq("id", processId);

  revalidatePath(`/processos/${processId}`);
}

export async function excluirProcesso(processId: string) {
  const supabase = await createClient();
  await supabase.from("processes").delete().eq("id", processId);
  revalidatePath("/processos");
  redirect("/processos");
}

/** Revisao periodica sem mudanca de conteudo: so registra a data. */
export async function marcarComoRevisado(processId: string) {
  const supabase = await createClient();
  await supabase.from("processes").update({ ultima_revisao_em: dateKey(new Date()) }).eq("id", processId);
  revalidatePath(`/processos/${processId}`);
  revalidatePath("/processos");
}

/** Sugestao de alteracao: fica registrada a parte e NUNCA altera a
 * versao publicada -- quem cuida do processo decide se incorpora. */
export async function sugerirAlteracao(processId: string, formData: FormData) {
  const textoSugestao = texto(formData, "texto");
  if (!textoSugestao) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("process_suggestions").insert({ process_id: processId, autor_id: user.id, texto: textoSugestao });
  revalidatePath(`/processos/${processId}`);
}

export async function responderSugestao(
  processId: string,
  sugestaoId: string,
  status: "aceita" | "recusada",
  formData: FormData,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("process_suggestions")
    .update({
      status,
      resposta: textoOuNulo(formData, "resposta"),
      respondido_por: user.id,
      respondido_em: new Date().toISOString(),
    })
    .eq("id", sugestaoId);
  revalidatePath(`/processos/${processId}`);
}
