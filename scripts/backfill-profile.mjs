// Cria o profile de um usuario que ja existe em auth.users mas ficou
// sem perfil (ex: trigger nao disparou). Uso:
//   node scripts/backfill-profile.mjs <email> [administrador|colaborador]

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

const [, , email, papel = "colaborador"] = process.argv;

if (!email) {
  console.error("Uso: node scripts/backfill-profile.mjs <email> [administrador|colaborador]");
  process.exit(1);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

const { data: users } = await supabase.auth.admin.listUsers();
const user = users.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());

if (!user) {
  console.error("Usuário não encontrado em auth.users:", email);
  process.exit(1);
}

const { data: existente } = await supabase
  .from("profiles")
  .select("id")
  .eq("id", user.id)
  .maybeSingle();

if (existente) {
  console.log("Já existe profile para esse usuário — nada a fazer.");
  process.exit(0);
}

const { data: role, error: roleError } = await supabase
  .from("roles")
  .select("id")
  .eq("nome", papel)
  .single();

if (roleError) {
  console.error(`Papel "${papel}" não encontrado:`, roleError.message);
  process.exit(1);
}

const { error } = await supabase.from("profiles").insert({
  id: user.id,
  email: user.email,
  nome: user.user_metadata?.nome ?? null,
  role_id: role.id,
});

if (error) {
  console.error("Erro ao criar profile:", error.message);
  process.exit(1);
}

console.log(`Profile criado para ${email} como ${papel}.`);
