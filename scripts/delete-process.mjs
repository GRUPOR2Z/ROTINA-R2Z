// Apaga um processo pelo id. Uso: node scripts/delete-process.mjs <id>
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

const [, , id] = process.argv;
if (!id) {
  console.error("Uso: node scripts/delete-process.mjs <id>");
  process.exit(1);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

const { error } = await supabase.from("processes").delete().eq("id", id);
console.log(error ? `Erro: ${error.message}` : `Processo ${id} removido.`);
