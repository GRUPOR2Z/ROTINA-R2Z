// Sincroniza a cor entre todas as ocorrencias de cada rotina, usando a
// cor de qualquer ocorrencia que ja tenha uma definida (correcao
// pontual para series criadas antes da propagacao automatica).
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

const { data: rotinas } = await supabase.from("recurring_routines").select("id");

for (const rotina of rotinas ?? []) {
  const { data: ocorrencias } = await supabase
    .from("task_occurrences")
    .select("task_id")
    .eq("recurring_routine_id", rotina.id);

  const taskIds = (ocorrencias ?? []).map((o) => o.task_id);
  if (taskIds.length === 0) continue;

  const { data: tarefas } = await supabase.from("tasks").select("id, cor").in("id", taskIds);
  const comCor = tarefas?.find((t) => t.cor);
  if (!comCor) continue;

  const idsSemCor = tarefas.filter((t) => t.cor !== comCor.cor).map((t) => t.id);
  if (idsSemCor.length === 0) continue;

  await supabase.from("tasks").update({ cor: comCor.cor }).in("id", idsSemCor);
  console.log(`Rotina ${rotina.id}: ${idsSemCor.length} tarefa(s) atualizadas para cor "${comCor.cor}".`);
}
