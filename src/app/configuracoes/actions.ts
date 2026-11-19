"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentProfile } from "@/lib/current-profile";
import { texto, textoOuNulo } from "@/lib/form";

// RLS ja barra quem nao e' admin; checar aqui tambem evita ida ao banco
// e deixa a regra explicita no codigo (Doc. 3 §6: validar no backend).
async function exigirAdmin() {
  const eu = await getCurrentProfile();
  return eu?.isAdmin ? eu : null;
}

export async function criarArea(formData: FormData) {
  if (!(await exigirAdmin())) return;
  const nome = texto(formData, "nome");
  if (!nome) return;

  const supabase = await createClient();
  await supabase.from("areas").insert({ nome, descricao: textoOuNulo(formData, "descricao") });
  revalidatePath("/configuracoes");
}

export async function atualizarArea(areaId: string, formData: FormData) {
  if (!(await exigirAdmin())) return;
  const nome = texto(formData, "nome");
  if (!nome) return;

  const supabase = await createClient();
  await supabase
    .from("areas")
    .update({ nome, descricao: textoOuNulo(formData, "descricao") })
    .eq("id", areaId);
  revalidatePath("/configuracoes");
}

/** Area nao e' excluida (tarefas/processos antigos apontam pra ela);
 * desativar so a tira dos selects. */
export async function alternarArea(areaId: string, ativo: boolean) {
  if (!(await exigirAdmin())) return;
  const supabase = await createClient();
  await supabase.from("areas").update({ ativo }).eq("id", areaId);
  revalidatePath("/configuracoes");
}

export async function atualizarMembro(profileId: string, formData: FormData) {
  const eu = await exigirAdmin();
  if (!eu) return;

  const roleId = textoOuNulo(formData, "role_id");
  const ativo = texto(formData, "ativo") !== "false";

  // nao deixa o admin se rebaixar/desativar sozinho e trancar o sistema
  const ehEuMesmo = profileId === eu.id;

  const supabase = await createClient();
  await supabase
    .from("profiles")
    .update({
      nome: textoOuNulo(formData, "nome"),
      cargo: textoOuNulo(formData, "cargo"),
      area_id: textoOuNulo(formData, "area_id"),
      ...(roleId && !ehEuMesmo ? { role_id: roleId } : {}),
      ...(ehEuMesmo ? {} : { ativo }),
    })
    .eq("id", profileId);

  revalidatePath("/configuracoes");
  revalidatePath("/equipe");
}

function voltarConfig(params: Record<string, string>): never {
  redirect(`/configuracoes?${new URLSearchParams(params).toString()}#equipe`);
}

/** Cadastro fechado: so administrador cria login para alguem da equipe,
 * ja com o papel certo. Usa a service_role (criar usuario no Auth). */
export async function convidarMembro(formData: FormData) {
  const eu = await exigirAdmin();
  if (!eu) voltarConfig({ erro: "Só administradores adicionam pessoas." });

  const nome = texto(formData, "nome");
  const email = texto(formData, "email").toLowerCase();
  const senha = String(formData.get("senha") ?? "");
  const roleId = textoOuNulo(formData, "role_id");
  const areaId = textoOuNulo(formData, "area_id");
  if (!nome || !email || !roleId) voltarConfig({ erro: "Preencha nome, e-mail e papel." });
  if (senha.length < 8) voltarConfig({ erro: "A senha provisória precisa ter pelo menos 8 caracteres." });

  const admin = createAdminClient();
  const { data: papel } = await admin.from("roles").select("nome").eq("id", roleId!).maybeSingle();
  if (!papel || papel.nome === "cliente") {
    voltarConfig({ erro: "Papel inválido. Acesso de cliente é criado na página do cliente." });
  }

  const { data: criado, error } = await admin.auth.admin.createUser({
    email,
    password: senha,
    email_confirm: true,
    user_metadata: { nome },
  });
  if (error || !criado.user) {
    voltarConfig({
      erro: error?.message.toLowerCase().includes("already")
        ? "Já existe um login com esse e-mail."
        : "Não foi possível criar o login. Tente novamente.",
    });
  }

  // o perfil nasce sem acesso (papel "cliente", migration 0028): aplica o
  // papel escolhido; se falhar, apaga o login para nao sobrar nada solto
  const { error: erroPerfil } = await admin
    .from("profiles")
    .update({ nome, role_id: roleId, area_id: areaId, cargo: textoOuNulo(formData, "cargo") })
    .eq("id", criado!.user!.id);
  if (erroPerfil) {
    await admin.auth.admin.deleteUser(criado!.user!.id);
    voltarConfig({ erro: "Não foi possível configurar o perfil. Nada foi criado." });
  }

  revalidatePath("/configuracoes");
  revalidatePath("/equipe");
  voltarConfig({ ok: `${nome} foi adicionado(a). Envie o e-mail e a senha provisória para a pessoa.` });
}
