// Confere se uma coluna existe numa tabela.
// Uso: node scripts/check-column.mjs <tabela> <coluna>

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

const [, , tabela, coluna] = process.argv;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

const { error } = await supabase.from(tabela).select(coluna).limit(1);

console.log(error ? `FALTA — ${error.message}` : `OK — ${tabela}.${coluna} existe`);
