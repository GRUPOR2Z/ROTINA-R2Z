"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { normalizarValorFormulario, type TipoCampoPropriedade } from "@/lib/client-properties";

export async function criarCliente(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const nome = String(formData.get("nome") ?? "").trim();
  if (!nome) return;

  const tipoCliente = String(formData.get("tipo_cliente") ?? "").trim() || null;

  const { data, error } = await supabase
    .from("clients")
    .insert({ nome, tipo_cliente: tipoCliente, criado_por: user.id })
    .select("id")
    .single();

  if (error || !data) return;

  revalidatePath("/clientes");
  redirect(`/clientes/${data.id}`);
}

/** Nome edita direto no título (H1) da página do cliente, sem form
 * separado -- clica, digita, sai do campo e salva. */
export async function atualizarNomeCliente(clientId: string, nome: string) {
  const nomeLimpo = nome.trim();
  if (!nomeLimpo) return;

  const supabase = await createClient();
  await supabase.from("clients").update({ nome: nomeLimpo }).eq("id", clientId);

  revalidatePath(`/clientes/${clientId}`);
  revalidatePath("/clientes");
}

/** Mesma ideia pro "Tipo de cliente" -- vira mais uma linha da lista
 * de propriedades, mesmo sendo uma coluna fixa (não genérica). */
export async function atualizarTipoCliente(clientId: string, tipoCliente: string) {
  const supabase = await createClient();
  await supabase
    .from("clients")
    .update({ tipo_cliente: tipoCliente.trim() || null })
    .eq("id", clientId);

  revalidatePath(`/clientes/${clientId}`);
  revalidatePath("/clientes");
}

export async function arquivarCliente(clientId: string) {
  const supabase = await createClient();
  await supabase.from("clients").update({ arquivado: true }).eq("id", clientId);
  revalidatePath(`/clientes/${clientId}`);
  revalidatePath("/clientes");
}

export async function reabrirCliente(clientId: string) {
  const supabase = await createClient();
  await supabase.from("clients").update({ arquivado: false }).eq("id", clientId);
  revalidatePath(`/clientes/${clientId}`);
  revalidatePath("/clientes");
}

export async function excluirCliente(clientId: string) {
  const supabase = await createClient();
  await supabase.from("clients").delete().eq("id", clientId);
  revalidatePath("/clientes");
  redirect("/clientes");
}

/** Sobe a foto pro bucket `client-avatars` (publico, mesma
 * transparencia do resto do app) e grava a URL publica em
 * `clients.avatar_url`. Nome do arquivo leva timestamp pra nao colidir
 * com upload anterior e pra invalidar cache de CDN sozinho. */
export async function enviarFotoCliente(clientId: string, formData: FormData) {
  const supabase = await createClient();

  const arquivo = formData.get("foto");
  if (!(arquivo instanceof File) || arquivo.size === 0) return;

  const extensao = arquivo.name.split(".").pop()?.toLowerCase() || "jpg";
  const caminho = `${clientId}/${Date.now()}.${extensao}`;

  const { error: erroUpload } = await supabase.storage
    .from("client-avatars")
    .upload(caminho, arquivo, { upsert: true });
  if (erroUpload) return;

  const {
    data: { publicUrl },
  } = supabase.storage.from("client-avatars").getPublicUrl(caminho);

  await supabase.from("clients").update({ avatar_url: publicUrl }).eq("id", clientId);

  revalidatePath(`/clientes/${clientId}`);
  revalidatePath("/clientes");
}

/** Salva uma propriedade por vez -- cada campo da lista tipo Notion
 * chama isso sozinho ao mudar (blur, seleção, checkbox), sem botão de
 * salvar geral. `bruto` já vem no formato que `normalizarValorFormulario`
 * espera (string, lista de strings pro multi_select, ou null). */
export async function salvarPropriedadeUnica(
  clientId: string,
  definitionId: string,
  tipoCampo: TipoCampoPropriedade,
  bruto: string | string[] | null,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const valor = normalizarValorFormulario(tipoCampo, bruto);

  if (valor === null) {
    await supabase
      .from("client_property_values")
      .delete()
      .eq("client_id", clientId)
      .eq("property_definition_id", definitionId);
  } else {
    await supabase
      .from("client_property_values")
      .upsert(
        { client_id: clientId, property_definition_id: definitionId, valor, atualizado_por: user.id },
        { onConflict: "client_id,property_definition_id" },
      );
  }

  revalidatePath(`/clientes/${clientId}`);
}

/** Evento da aba Conteudo. `horario` vazio = evento de dia inteiro,
 * mesma convenção de `tasks.horario`. */
export async function criarEventoCalendario(clientId: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const titulo = String(formData.get("titulo") ?? "").trim();
  const data = String(formData.get("data") ?? "");
  if (!titulo || !data) return;

  const tipo = String(formData.get("tipo") ?? "").trim() || null;
  const horario = String(formData.get("horario") ?? "") || null;
  const cor = String(formData.get("cor") ?? "") || null;
  const responsavelId = String(formData.get("responsavel_id") ?? "") || null;

  await supabase.from("calendar_events").insert({
    client_id: clientId,
    titulo,
    tipo,
    data,
    horario,
    cor,
    responsavel_id: responsavelId,
    criado_por: user.id,
  });

  revalidatePath(`/clientes/${clientId}`);
}

export async function excluirEventoCalendario(eventId: string, clientId: string) {
  const supabase = await createClient();
  await supabase.from("calendar_events").delete().eq("id", eventId);
  revalidatePath(`/clientes/${clientId}`);
}
