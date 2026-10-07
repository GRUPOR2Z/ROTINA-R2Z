"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { booleano, texto } from "@/lib/form";
import { validarArquivo, type EntidadeDocumento } from "@/lib/documents";

export async function anexarDocumento(
  entidade: EntidadeDocumento,
  entidadeId: string,
  caminhoPagina: string,
  formData: FormData,
): Promise<{ erro?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { erro: "Sessão expirada." };

  const ehEvidencia = booleano(formData, "eh_evidencia");
  const url = texto(formData, "url");
  const arquivo = formData.get("arquivo");

  if (arquivo instanceof File && arquivo.size > 0) {
    const problema = validarArquivo(arquivo);
    if (problema) return { erro: problema };

    const nomeSeguro = arquivo.name.replace(/[^\w.\-]+/g, "_");
    const caminho = `${entidade}/${entidadeId}/${crypto.randomUUID()}-${nomeSeguro}`;

    const { error: erroUpload } = await supabase.storage
      .from("documents")
      .upload(caminho, arquivo, { contentType: arquivo.type || undefined });
    if (erroUpload) return { erro: "Não foi possível enviar o arquivo." };

    const { error } = await supabase.from("documents").insert({
      entidade,
      entidade_id: entidadeId,
      nome: arquivo.name,
      caminho,
      tipo_mime: arquivo.type || null,
      tamanho_bytes: arquivo.size,
      eh_evidencia: ehEvidencia,
      enviado_por: user.id,
    });
    if (error) {
      await supabase.storage.from("documents").remove([caminho]);
      return { erro: "Não foi possível registrar o anexo." };
    }
  } else if (url) {
    if (!/^https?:\/\//i.test(url)) return { erro: "O link precisa começar com http:// ou https://." };
    const { error } = await supabase.from("documents").insert({
      entidade,
      entidade_id: entidadeId,
      nome: texto(formData, "nome") || url,
      url,
      eh_evidencia: ehEvidencia,
      enviado_por: user.id,
    });
    if (error) return { erro: "Não foi possível salvar o link." };
  } else {
    return { erro: "Escolha um arquivo ou informe um link." };
  }

  revalidatePath(caminhoPagina);
  return {};
}

export async function excluirDocumento(documentId: string, caminhoPagina: string) {
  const supabase = await createClient();
  const { data: doc } = await supabase
    .from("documents")
    .select("caminho")
    .eq("id", documentId)
    .maybeSingle();

  const { error } = await supabase.from("documents").delete().eq("id", documentId);
  if (!error && doc?.caminho) {
    await supabase.storage.from("documents").remove([doc.caminho]);
  }
  revalidatePath(caminhoPagina);
}
