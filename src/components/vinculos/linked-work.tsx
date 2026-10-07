import Link from "next/link";
import { Section } from "@/components/layout/page-header";
import { StatusBadge } from "@/components/rotinas/status-badge";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { STATUS_MELHORIA, rotulo } from "@/lib/melhorias";
import { formatarData } from "@/lib/format";

/** Tarefas, melhorias e decisoes ligadas a um OKR ou KPI. No modelo
 * simplificado de OKR, isso e' o que o Doc. 2 chama de "iniciativas". */
export async function LinkedWork({
  coluna,
  id,
  titulo,
}: {
  coluna: "okr_id" | "kpi_id";
  id: string;
  titulo: string;
}) {
  const supabase = await createClient();
  const [{ data: tarefas }, { data: melhorias }, { data: decisoes }] = await Promise.all([
    supabase.from("tasks").select("id, titulo, status, prazo").eq(coluna, id).is("parent_task_id", null).order("prazo"),
    coluna === "okr_id"
      ? supabase.from("improvement_items").select("id, titulo, status").eq("okr_id", id)
      : Promise.resolve({ data: [] as { id: string; titulo: string; status: string }[] }),
    coluna === "okr_id"
      ? supabase.from("decisions").select("id, titulo, data").eq("okr_id", id)
      : Promise.resolve({ data: [] as { id: string; titulo: string; data: string }[] }),
  ]);

  const vazio = !tarefas?.length && !melhorias?.length && !decisoes?.length;
  const param = coluna === "okr_id" ? "okr" : "kpi";

  return (
    <Section
      title={titulo}
      actions={
        <Link href={`/rotinas/nova?${param}=${id}`} className="text-xs text-muted-foreground hover:text-foreground">
          + Nova tarefa vinculada
        </Link>
      }
    >
      {vazio && <p className="text-sm text-muted-foreground">Nada vinculado ainda.</p>}
      <ul className="flex flex-col gap-1.5">
        {(tarefas ?? []).map((t) => (
          <li key={t.id} className="flex items-center gap-2 text-sm">
            <span className="text-xs text-muted-foreground">Tarefa</span>
            <Link href={`/rotinas/${t.id}`} className="min-w-0 flex-1 truncate hover:underline">
              {t.titulo}
            </Link>
            <span className="text-xs text-muted-foreground">{formatarData(t.prazo)}</span>
            <StatusBadge status={t.status} />
          </li>
        ))}
        {(melhorias ?? []).map((m) => (
          <li key={m.id} className="flex items-center gap-2 text-sm">
            <span className="text-xs text-muted-foreground">Melhoria</span>
            <Link href={`/melhorias/${m.id}`} className="min-w-0 flex-1 truncate hover:underline">
              {m.titulo}
            </Link>
            <Badge variant="secondary">{rotulo(STATUS_MELHORIA, m.status)}</Badge>
          </li>
        ))}
        {(decisoes ?? []).map((d) => (
          <li key={d.id} className="flex items-center gap-2 text-sm">
            <span className="text-xs text-muted-foreground">Decisão</span>
            <Link href={`/decisoes/${d.id}`} className="min-w-0 flex-1 truncate hover:underline">
              {d.titulo}
            </Link>
            <span className="text-xs text-muted-foreground">{formatarData(d.data)}</span>
          </li>
        ))}
      </ul>
    </Section>
  );
}
