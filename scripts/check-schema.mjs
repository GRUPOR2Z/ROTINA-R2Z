// Confere se as tabelas esperadas existem e estao acessiveis.
// Uso: node scripts/check-schema.mjs

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

const tabelas = [
  "profiles",
  "roles",
  "areas",
  "integration_logs",
  "member_tags",
  "member_notes",
  "tasks",
  "task_checklist_items",
  "task_comments",
  "recurring_routines",
  "task_occurrences",
  "processes",
  "process_versions",
  "kpis",
  "kpi_values",
  "okrs",
  "okr_values",
];

for (const tabela of tabelas) {
  const { count, error } = await supabase.from(tabela).select("*", { count: "exact", head: true });
  console.log(error ? `${tabela}: ERRO — ${error.message}` : `${tabela}: OK (${count} linhas)`);
}
