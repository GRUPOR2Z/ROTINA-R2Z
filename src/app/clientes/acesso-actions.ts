"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentProfile } from "@/lib/current-profile";

/** Mostra/esconde um processo vinculado no portal do cliente. */
export async function alternarVisibilidadeProcesso(vinculoId: string, clientId: string, visivel: boolean) {
  const supabase = await createClient();
  await supabase.from("process_clients").update({ visivel_ao_cliente: visivel }).eq("id", vinculoId);
  revalidatePath(`/clientes/${clientId}`);
}

function voltar(clientId: string, params: Record<string, string>): never {
  const q = new URLSearchParams(params).toString();
  redirect(`/clientes/${clientId}?${q}#acesso`);
}

/** Cria o login do cliente (papel "cliente") e o liga a este cliente.
 * Usa a service_role (criar usuario no Auth), entao confere antes que
 * quem pediu e' administrador. */
export async function criarAcessoCliente(clientId: string, formData: FormData) {
  const perfil = await getCurrentProfile();
  if (!perfil?.isAdmin) voltar(clientId, { erro_acesso: "Só administradores criam acesso de cliente." });

  const nome = String(formData.get("nome") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const senha = String(formData.get("senha") ?? "");
  if (!nome || !email) voltar(clientId, { erro_acesso: "Preencha nome e e-mail." });
  if (senha.length < 8) voltar(clientId, { erro_acesso: "A senha precisa ter pelo menos 8 caracteres." });

  const admin = createAdminClient();
  const { data: papel } = await admin.from("roles").select("id").eq("nome", "cliente").single();
  if (!papel) voltar(clientId, { erro_acesso: "Papel 'cliente' não existe no banco (migration 0026)." });

  const { data: criado, error } = await admin.auth.admin.createUser({
    email,
    password: senha,
    email_confirm: true,
    user_metadata: { nome },
  });
  if (error || !criado.user) {
    const jaExiste = error?.message.toLowerCase().includes("already");
    voltar(clientId, {
      erro_acesso: jaExiste
        ? "Já existe um login com esse e-mail. Use outro e-mail para o cliente."
        : "Não foi possível criar o login. Tente novamente.",
    });
    return;
  }

  // o trigger handle_new_user cria o perfil como "colaborador": troca
  // para "cliente" antes de ligar ao cliente
  const userId = criado.user.id;
  const { error: erroPerfil } = await admin
    .from("profiles")
    .update({ role_id: papel!.id, nome, cargo: "Cliente" })
    .eq("id", userId);
  const { error: erroVinculo } = erroPerfil
    ? { error: erroPerfil }
    : await admin.from("client_members").insert({ client_id: clientId, profile_id: userId, criado_por: perfil!.id });

  if (erroPerfil || erroVinculo) {
    // nao deixa um login "colaborador" solto (veria tudo): desfaz
    await admin.auth.admin.deleteUser(userId);
    voltar(clientId, { erro_acesso: "Não foi possível configurar o acesso. Nada foi criado." });
  }

  revalidatePath(`/clientes/${clientId}`);
  voltar(clientId, { acesso: "criado" });
}

/** Tira o acesso deste cliente. Se o login nao estiver ligado a mais
 * nenhum cliente, ele e' apagado do Auth (perfil sai em cascata). */
export async function removerAcessoCliente(clientId: string, profileId: string) {
  const perfil = await getCurrentProfile();
  if (!perfil?.isAdmin) voltar(clientId, { erro_acesso: "Só administradores removem acesso de cliente." });

  const admin = createAdminClient();
  await admin.from("client_members").delete().eq("client_id", clientId).eq("profile_id", profileId);

  const [{ count }, { data: alvo }] = await Promise.all([
    admin.from("client_members").select("client_id", { count: "exact", head: true }).eq("profile_id", profileId),
    admin.from("profiles").select("roles(nome)").eq("id", profileId).maybeSingle(),
  ]);
  const papelAlvo = (alvo?.roles as unknown as { nome: string } | null)?.nome;
  if ((count ?? 0) === 0 && papelAlvo === "cliente") {
    await admin.auth.admin.deleteUser(profileId);
  }

  revalidatePath(`/clientes/${clientId}`);
  voltar(clientId, { acesso: "removido" });
}
