"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/current-profile";

export type TipoMaterial = "processo" | "roteiro";

const ABA: Record<TipoMaterial, string> = { processo: "processos", roteiro: "roteiros" };
const LIMITE_PDF = 20 * 1024 * 1024; // 20 MB

function voltar(clientId: string, tipo: TipoMaterial, params: Record<string, string> = {}): never {
  const q = new URLSearchParams({ tab: ABA[tipo], ...params });
  redirect(`/clientes/${clientId}?${q.toString()}`);
}

/** "drive.google.com/..." vira "https://drive.google.com/..."; recusa o que nao for http(s). */
function normalizarLink(bruto: string) {
  const texto = bruto.trim();
  if (!texto) return null;
  const comProtocolo = /^https?:\/\//i.test(texto) ? texto : `https://${texto}`;
  try {
    const url = new URL(comProtocolo);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

/** Adiciona um processo (so link) ou roteiro (link e/ou PDF) ao cliente. */
export async function adicionarMaterial(clientId: string, tipo: TipoMaterial, formData: FormData) {
  const perfil = await getCurrentProfile();
  if (!perfil || perfil.papel === "cliente") voltar(clientId, tipo, { erro_material: "Sem permissão." });

  const titulo = String(formData.get("titulo") ?? "").trim();
  const descricao = String(formData.get("descricao") ?? "").trim() || null;
  const linkBruto = String(formData.get("url") ?? "");
  const url = normalizarLink(linkBruto);
  const arquivo = tipo === "roteiro" ? formData.get("arquivo") : null;
  const temArquivo = arquivo instanceof File && arquivo.size > 0;

  if (!titulo) voltar(clientId, tipo, { erro_material: "Dê um título." });
  if (linkBruto.trim() && !url) voltar(clientId, tipo, { erro_material: "Esse link não parece válido." });
  if (!url && !temArquivo) {
    voltar(clientId, tipo, {
      erro_material: tipo === "roteiro" ? "Cole um link ou escolha um PDF." : "Cole o link do processo.",
    });
  }

  const supabase = await createClient();
  let arquivoCaminho: string | null = null;
  let arquivoNome: string | null = null;

  if (temArquivo) {
    const pdf = arquivo as File;
    if (pdf.type !== "application/pdf" && !pdf.name.toLowerCase().endsWith(".pdf")) {
      voltar(clientId, tipo, { erro_material: "O arquivo precisa ser PDF." });
    }
    if (pdf.size > LIMITE_PDF) voltar(clientId, tipo, { erro_material: "O PDF passa de 20 MB." });

    arquivoNome = pdf.name;
    arquivoCaminho = `${clientId}/${randomUUID()}.pdf`;
    const { error } = await supabase.storage
      .from("client-files")
      .upload(arquivoCaminho, pdf, { contentType: "application/pdf" });
    if (error) voltar(clientId, tipo, { erro_material: "Não foi possível enviar o PDF. Tente de novo." });
  }

  const { error } = await supabase.from("client_materials").insert({
    client_id: clientId,
    tipo,
    titulo,
    descricao,
    url,
    arquivo_caminho: arquivoCaminho,
    arquivo_nome: arquivoNome,
    criado_por: perfil!.id,
  });
  if (error) {
    if (arquivoCaminho) await supabase.storage.from("client-files").remove([arquivoCaminho]);
    voltar(clientId, tipo, { erro_material: "Não foi possível salvar. Tente de novo." });
  }

  revalidatePath(`/clientes/${clientId}`);
  revalidatePath(`/portal/${clientId}`);
  voltar(clientId, tipo);
}

export async function excluirMaterial(id: string, clientId: string, tipo: TipoMaterial) {
  const supabase = await createClient();
  const { data: material } = await supabase
    .from("client_materials")
    .select("arquivo_caminho")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabase.from("client_materials").delete().eq("id", id);
  if (!error && material?.arquivo_caminho) {
    await supabase.storage.from("client-files").remove([material.arquivo_caminho]);
  }

  revalidatePath(`/clientes/${clientId}`);
  revalidatePath(`/portal/${clientId}`);
  voltar(clientId, tipo);
}
