// Define/redefine a senha de um usuário já existente.
// Uso: node scripts/set-password.mjs email@exemplo.com "NovaSenha123!"

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

const [, , email, novaSenha] = process.argv;

if (!email || !novaSenha) {
  console.error('Uso: node scripts/set-password.mjs <email> "<nova senha>"');
  process.exit(1);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

const { data: lista, error: listError } = await supabase.auth.admin.listUsers();

if (listError) {
  console.error("Erro ao listar usuários:", listError.message);
  process.exit(1);
}

const usuario = lista.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());

if (!usuario) {
  console.error("Nenhum usuário encontrado com esse e-mail:", email);
  process.exit(1);
}

const { error } = await supabase.auth.admin.updateUserById(usuario.id, {
  password: novaSenha,
});

if (error) {
  console.error("Erro ao definir senha:", error.message);
  process.exit(1);
}

console.log("Senha atualizada para:", email);
