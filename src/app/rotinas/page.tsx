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

export default async function RotinasPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; area?: string; responsavel?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const { areas, membros } = await getAreasEMembros();

  let query = supabase
    .from("tasks")
    .select(
      "id, titulo, status, prioridade, prazo, horario, areas(nome), profiles!tasks_responsavel_id_fkey(nome, email)",
    )
    .order("prazo", { ascending: true, nullsFirst: false })
    .order("criado_em", { ascending: false });

  if (params.status) query = query.eq("status", params.status);
  if (params.area) query = query.eq("area_id", params.area);
  if (params.responsavel) query = query.eq("responsavel_id", params.responsavel);

  const { data: tarefas } = await query;

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

        <FilterBar areas={areas} membros={membros} />

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
                  <TableHead>Área</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead>Prazo</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tarefas.map((t) => {
                  const area = (t.areas as unknown as { nome: string } | null)?.nome;
                  const responsavel = (
                    t.profiles as unknown as { nome: string | null; email: string | null } | null
                  );
                  const atrasada = estaAtrasada(t.prazo, t.status);

                  return (
                    <TableRow key={t.id}>
                      <TableCell>
                        <Link href={`/rotinas/${t.id}`} className="font-medium hover:underline">
                          {t.titulo}
                        </Link>
                      </TableCell>
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
