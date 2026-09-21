// Promove um usuário já existente a administrador.
// Uso: node scripts/promote-admin.mjs email@exemplo.com

import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

function loadEnvLocal() {
  const raw = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
  for (const line of raw.split("\n")) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match) process.env[match[1]] ??= match[2].trim();
  }
}

loadEnvLocal();

const [, , email] = process.argv;

if (!email) {
  console.error("Uso: node scripts/promote-admin.mjs <email>");
  process.exit(1);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

const { data: profile, error: profileError } = await supabase
  .from("profiles")
  .select("id, nome, role_id, roles(nome)")
  .eq("email", email)
  .maybeSingle();

if (profileError || !profile) {
  console.error("Nenhum perfil encontrado com esse e-mail:", email);
  process.exit(1);
}

const papelAtual = profile.roles?.nome;
console.log("Perfil encontrado:", profile.nome || email, "— papel atual:", papelAtual);

if (papelAtual === "administrador") {
  console.log("Já é administrador, nada a fazer.");
  process.exit(0);
}

const { data: role, error: roleError } = await supabase
  .from("roles")
  .select("id")
  .eq("nome", "administrador")
  .single();

if (roleError) {
  console.error("Não achei o papel 'administrador':", roleError.message);
  process.exit(1);
}

const { error: updateError } = await supabase
  .from("profiles")
  .update({ role_id: role.id })
  .eq("id", profile.id);

if (updateError) {
  console.error("Erro ao promover:", updateError.message);
  process.exit(1);
}

console.log("Promovido a administrador:", email);
