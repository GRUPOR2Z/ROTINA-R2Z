// Cria um usuário direto no Supabase (sem passar pelo /signup), com
// senha temporária, e-mail já confirmado e, opcionalmente, já como
// administrador. Requer SUPABASE_SERVICE_ROLE_KEY em .env.local.
//
// Uso:
//   node scripts/create-user.mjs email@exemplo.com
//   node scripts/create-user.mjs email@exemplo.com --admin

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

const [, , email, flag] = process.argv;

if (!email) {
  console.error("Uso: node scripts/create-user.mjs <email> [--admin]");
  process.exit(1);
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error("SUPABASE_SERVICE_ROLE_KEY não encontrada em .env.local");
  process.exit(1);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

const senhaTemporaria = Math.random().toString(36).slice(2, 8) + "R2z!" + Math.floor(Math.random() * 100);

const { data, error } = await supabase.auth.admin.createUser({
  email,
  password: senhaTemporaria,
  email_confirm: true,
});

if (error) {
  console.error("Erro ao criar usuário:", error.message);
  process.exit(1);
}

console.log("Usuário criado:", email);
console.log("ID:", data.user.id);
console.log("Senha temporária:", senhaTemporaria);

if (flag === "--admin") {
  await new Promise((resolve) => setTimeout(resolve, 1200)); // aguarda o trigger criar o profile

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
    .eq("id", data.user.id);

  if (updateError) {
    console.error("Erro ao promover a administrador:", updateError.message);
    process.exit(1);
  }

  console.log("Promovido a administrador.");
}
