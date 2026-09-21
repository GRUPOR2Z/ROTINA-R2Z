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

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

const { data: processos } = await supabase
  .from("processes")
  .select("id, titulo, status, versao_publicada_id, criado_em");
console.log("--- processes ---");
console.table(processos);

const { data: versoes } = await supabase
  .from("process_versions")
  .select("id, process_id, numero_versao, publicado_em");
console.log("--- process_versions ---");
console.table(versoes);
