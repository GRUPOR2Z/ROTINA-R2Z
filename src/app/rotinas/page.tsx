import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { EmptyState } from "@/components/states/empty-state";
import { FilterBar } from "@/components/rotinas/filter-bar";
import { StatusBadge, estaAtrasada } from "@/components/rotinas/status-badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createClient } from "@/lib/supabase/server";
import { getAreasEMembros } from "@/lib/lookups";
import { getClientesAtivos } from "@/lib/clients-data";
import { filtrarProximasPendentes } from "@/lib/rotinas";
import { infoCor } from "@/lib/task-colors";

export default async function RotinasPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; area?: string; responsavel?: string; cliente?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const { areas, membros } = await getAreasEMembros();
  const clientes = await getClientesAtivos();

  let query = supabase
    .from("tasks")
    .select(
      "id, titulo, status, prioridade, prazo, horario, cor, areas(nome), clients(nome), profiles!tasks_responsavel_id_fkey(nome, email)",
    )
    .order("prazo", { ascending: true, nullsFirst: false })
    .order("criado_em", { ascending: false });

  if (params.status) query = query.eq("status", params.status);
  if (params.area) query = query.eq("area_id", params.area);
  if (params.responsavel) query = query.eq("responsavel_id", params.responsavel);
  if (params.cliente) query = query.eq("client_id", params.cliente);

  const { data: todasTarefas } = await query;

  const idsCarregados = (todasTarefas ?? []).map((t) => t.id);
  const { data: ocorrencias } = idsCarregados.length
    ? await supabase
        .from("task_occurrences")
        .select("task_id, recurring_routine_id")
        .in("task_id", idsCarregados)
    : { data: [] as { task_id: string; recurring_routine_id: string }[] };

  const rotinaPorTarefa = new Map((ocorrencias ?? []).map((o) => [o.task_id, o.recurring_routine_id]));
  const tarefas = filtrarProximasPendentes(todasTarefas ?? [], rotinaPorTarefa);

  // conta TODAS as ocorrencias de cada rotina, nao so as que passaram
  // pelo filtro de status/area/responsavel acima.
  const idsRotinas = [...new Set((ocorrencias ?? []).map((o) => o.recurring_routine_id))];
  const { data: todasOcorrenciasDasRotinas } = idsRotinas.length
    ? await supabase.from("task_occurrences").select("recurring_routine_id").in("recurring_routine_id", idsRotinas)
    : { data: [] as { recurring_routine_id: string }[] };

  const contagemPorRotina = new Map<string, number>();
  for (const o of todasOcorrenciasDasRotinas ?? []) {
    contagemPorRotina.set(o.recurring_routine_id, (contagemPorRotina.get(o.recurring_routine_id) ?? 0) + 1);
  }

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Rotinas</h1>
            <div className="mt-1 flex gap-4 text-sm">
              <Link href="/rotinas" className="font-medium text-foreground">
                Lista
              </Link>
              <Link href="/rotinas/calendario" className="text-muted-foreground hover:text-foreground">
                Calendário
              </Link>
            </div>
          </div>
          <Link href="/rotinas/nova" className={buttonVariants()}>
            Nova tarefa
          </Link>
        </div>

        <FilterBar areas={areas} membros={membros} clientes={clientes} />

        {!tarefas || tarefas.length === 0 ? (
          <EmptyState
            title="Nenhuma tarefa encontrada"
            description="Crie uma tarefa ou ajuste os filtros acima."
          />
        ) : (
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tarefa</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Área</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead>Prazo</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tarefas.map((t) => {
                  const area = (t.areas as unknown as { nome: string } | null)?.nome;
                  const cliente = (t.clients as unknown as { nome: string } | null)?.nome;
                  const responsavel = (
                    t.profiles as unknown as { nome: string | null; email: string | null } | null
                  );
                  const atrasada = estaAtrasada(t.prazo, t.status);
                  const rotinaId = rotinaPorTarefa.get(t.id);

                  return (
                    <TableRow key={t.id}>
                      <TableCell>
                        <Link
                          href={`/rotinas/${t.id}`}
                          className="inline-flex items-center font-medium hover:underline"
                        >
                          {t.cor && (
                            <span
                              className={`mr-1.5 inline-block h-2 w-2 shrink-0 rounded-full ${infoCor(t.cor)?.dot}`}
                              title="Cor da tarefa"
                            />
                          )}
                          {rotinaId && (
                            <span className="mr-1 text-muted-foreground" title="Tarefa recorrente">
                              ↻
                            </span>
                          )}
                          {t.titulo}
                          {rotinaId && (
                            <span className="ml-1 font-normal text-muted-foreground">
                              ({contagemPorRotina.get(rotinaId)})
                            </span>
                          )}
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{cliente || "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{area || "—"}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {responsavel?.nome || responsavel?.email || "—"}
                      </TableCell>
                      <TableCell className={atrasada ? "font-medium text-destructive" : "text-muted-foreground"}>
                        {t.prazo
                          ? new Date(t.prazo).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })
                          : "—"}
                        {t.horario && ` · ${t.horario.slice(0, 5)}`}
                        {atrasada && " · atrasada"}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={t.status} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </AppShell>
  );
}
