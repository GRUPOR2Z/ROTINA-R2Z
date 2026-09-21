// Preenche o horizonte de ocorrencias futuras para rotinas que ja
// existiam antes da pre-geracao em lote. Uso: node scripts/backfill-recorrencias.mjs

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

const HORIZONTE = { diaria: 14, semanal: 8, mensal: 6 };

function pad(n) {
  return String(n).padStart(2, "0");
}

function dateKey(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function proximaData(prazo, frequencia) {
  const d = new Date(`${prazo}T00:00:00`);
  if (frequencia === "diaria") d.setDate(d.getDate() + 1);
  if (frequencia === "semanal") d.setDate(d.getDate() + 7);
  if (frequencia === "mensal") d.setMonth(d.getMonth() + 1);
  return dateKey(d);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

const { data: rotinas } = await supabase
  .from("recurring_routines")
  .select("id, frequencia")
  .eq("ativa", true);

for (const rotina of rotinas ?? []) {
  const { data: ocorrencias } = await supabase
    .from("task_occurrences")
    .select("data_prevista, task_id")
    .eq("recurring_routine_id", rotina.id)
    .order("data_prevista", { ascending: false });

  if (!ocorrencias || ocorrencias.length === 0) continue;

  const faltam = HORIZONTE[rotina.frequencia] - ocorrencias.length;
  if (faltam <= 0) {
    console.log(`Rotina ${rotina.id}: já tem ${ocorrencias.length} ocorrências, nada a fazer.`);
    continue;
  }

  const { data: tarefaBase } = await supabase
    .from("tasks")
    .select("titulo, descricao, area_id, responsavel_id, prioridade, horario, criado_por")
    .eq("id", ocorrencias[0].task_id)
    .single();

  let prazoAtual = ocorrencias[0].data_prevista;
  for (let i = 0; i < faltam; i++) {
    prazoAtual = proximaData(prazoAtual, rotina.frequencia);
    const { data: novaTarefa } = await supabase
      .from("tasks")
      .insert({ ...tarefaBase, prazo: prazoAtual })
      .select("id")
      .single();

    if (novaTarefa) {
      await supabase
        .from("task_occurrences")
        .insert({ recurring_routine_id: rotina.id, task_id: novaTarefa.id, data_prevista: prazoAtual });
    }
  }

  console.log(`Rotina ${rotina.id}: gerei mais ${faltam} ocorrência(s), até ${prazoAtual}.`);
}
