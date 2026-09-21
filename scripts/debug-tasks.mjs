// Debug: lista tarefas recentes com status, prazo e dados de recorrencia.
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

const { data: tasks, error } = await supabase
  .from("tasks")
  .select("id, titulo, status, prazo, horario, criado_em")
  .order("criado_em", { ascending: false })
  .limit(10);

if (error) {
  console.error(error.message);
  process.exit(1);
}

console.log("--- tasks recentes ---");
console.table(tasks);

const { data: occurrences } = await supabase
  .from("task_occurrences")
  .select("id, task_id, recurring_routine_id, data_prevista, gerada_em");

console.log("--- task_occurrences ---");
console.table(occurrences);

const { data: routines } = await supabase
  .from("recurring_routines")
  .select("id, frequencia, ativa, criado_em");

console.log("--- recurring_routines ---");
console.table(routines);
