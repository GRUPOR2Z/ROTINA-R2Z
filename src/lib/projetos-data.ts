import { createClient } from "@/lib/supabase/server";
import { calcularAndamento } from "@/lib/projetos";

/** Andamento (%) de varios projetos de uma vez: 2 queries no total, em
 * vez de 2 por projeto. */
export async function getAndamentoProjetos(ids: string[]) {
  const resultado = new Map<string, number | null>();
  if (ids.length === 0) return resultado;

  const supabase = await createClient();
  const [{ data: tarefas }, { data: entregas }] = await Promise.all([
    supabase.from("tasks").select("project_id, status").in("project_id", ids).is("parent_task_id", null),
    supabase.from("project_deliverables").select("project_id, concluido").in("project_id", ids),
  ]);

  for (const id of ids) {
    resultado.set(
      id,
      calcularAndamento(
        (tarefas ?? []).filter((t) => t.project_id === id),
        (entregas ?? []).filter((e) => e.project_id === id),
      ),
    );
  }
  return resultado;
}
