"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/current-profile";
import { cifrar, decifrar } from "@/lib/cripto";

export type Origem = "equipe" | "portal";

function voltar(clientId: string, origem: Origem, params: Record<string, string> = {}): never {
  const base = origem === "portal" ? `/portal/${clientId}` : `/clientes/${clientId}`;
  redirect(`${base}?${new URLSearchParams({ tab: "acessos", ...params }).toString()}`);
}

function revalidar(clientId: string) {
  revalidatePath(`/clientes/${clientId}`);
  revalidatePath(`/portal/${clientId}`);
}

/** Cria (id = null) ou edita uma conta do cliente. A senha é
 * criptografada antes de ir para o banco; editar sem digitar senha
 * mantém a que já estava. As permissões (equipe ou cliente com
 * "criar"/"editar" em Acessos) são conferidas pelo RLS. */
export async function salvarCredencial(clientId: string, id: string | null, origem: Origem, formData: FormData) {
  const perfil = await getCurrentProfile();
  if (!perfil) redirect("/login");

  const servico = String(formData.get("servico") ?? "").trim();
  if (!servico) voltar(clientId, origem, { erro_acesso_conta: "Informe o serviço (ex: Instagram)." });

  const senha = String(formData.get("senha") ?? "");
  let senhaCifrada: string | undefined;
  if (senha) {
    try {
      senhaCifrada = cifrar(senha);
    } catch {
      voltar(clientId, origem, { erro_acesso_conta: "A chave de criptografia não está configurada no servidor." });
    }
  }

  const dados = {
    servico,
    login: String(formData.get("login") ?? "").trim() || null,
    url: String(formData.get("url") ?? "").trim() || null,
    observacoes: String(formData.get("observacoes") ?? "").trim() || null,
    atualizado_por: perfil.id,
    ...(senhaCifrada ? { senha_cifrada: senhaCifrada } : {}),
  };

  const supabase = await createClient();
  const { error } = id
    ? await supabase.from("client_credentials").update(dados).eq("id", id).eq("client_id", clientId).select("id").single()
    : await supabase
        .from("client_credentials")
        .insert({ ...dados, client_id: clientId, criado_por: perfil.id })
        .select("id")
        .single();

  if (error) voltar(clientId, origem, { erro_acesso_conta: "Não foi possível salvar (sem permissão?)." });

  revalidar(clientId);
  voltar(clientId, origem);
}

export async function excluirCredencial(id: string, clientId: string, origem: Origem) {
  const supabase = await createClient();
  await supabase.from("client_credentials").delete().eq("id", id);
  revalidar(clientId);
  voltar(clientId, origem);
}

/** Devolve a senha legível só para quem enxerga a conta pelo RLS. */
export async function revelarSenha(id: string): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("client_credentials").select("senha_cifrada").eq("id", id).maybeSingle();
  if (!data?.senha_cifrada) return null;
  try {
    return decifrar(data.senha_cifrada);
  } catch {
    return null;
  }
}
