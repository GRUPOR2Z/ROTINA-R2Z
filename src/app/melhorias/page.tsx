import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/states/empty-state";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createClient } from "@/lib/supabase/server";
import { STATUS_MELHORIA, TIPOS_MELHORIA, pontuacaoMelhoria, quadranteMelhoria, rotulo } from "@/lib/melhorias";
import { nomeDe, rel } from "@/lib/format";
import { cn } from "@/lib/utils";

const ABERTOS = ["nova", "em_analise", "aprovada", "em_implementacao"];

export default async function MelhoriasPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("improvement_items")
    .select("id, tipo, titulo, status, prioridade, impacto, esforco, areas(nome), responsavel:profiles!improvement_items_responsavel_id_fkey(nome, email)")
    .order("criado_em", { ascending: false });

  if (status === "todas") {
    // sem filtro
  } else if (status) query = query.eq("status", status);
  else query = query.in("status", ABERTOS);

  const { data } = await query;
  // ordena por "ganho rapido" (impacto/esforco), sem nota no fim
  const itens = (data ?? []).sort(
    (a, b) => (pontuacaoMelhoria(b.impacto, b.esforco) ?? -1) - (pontuacaoMelhoria(a.impacto, a.esforco) ?? -1),
  );

  const filtros = [
    { value: undefined, label: "Abertas" },
    ...STATUS_MELHORIA.filter((s) => ["implementada", "descartada"].includes(s.value)),
    { value: "todas", label: "Todas" },
  ];

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Banco de melhorias"
          description="Problemas, ideias e oportunidades — ordenados por impacto ÷ esforço."
          actions={
            <Link href="/melhorias/nova" className={buttonVariants()}>
              Registrar melhoria
            </Link>
          }
        />

        <div className="flex flex-wrap gap-2">
          {filtros.map((f) => (
            <Link
              key={f.label}
              href={f.value ? `/melhorias?status=${f.value}` : "/melhorias"}
              className={cn(
                "rounded-full border px-3 py-1 text-sm",
                status === f.value ? "border-primary bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted",
              )}
            >
              {f.label}
            </Link>
          ))}
        </div>

        {itens.length === 0 ? (
          <EmptyState title="Nada por aqui" description="Registre um problema, ideia ou oportunidade de melhoria." />
        ) : (
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Melhoria</TableHead>
                  <TableHead>Área</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead>Impacto / esforço</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {itens.map((m) => {
                  const quadrante = quadranteMelhoria(m.impacto, m.esforco);
                  return (
                    <TableRow key={m.id}>
                      <TableCell>
                        <Link href={`/melhorias/${m.id}`} className="font-medium hover:underline">
                          {m.titulo}
                        </Link>
                        <span className="ml-2 text-xs text-muted-foreground">{rotulo(TIPOS_MELHORIA, m.tipo)}</span>
                        {m.prioridade === "alta" && <Badge variant="destructive" className="ml-2">Alta</Badge>}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{rel<{ nome: string }>(m.areas)?.nome ?? "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{nomeDe(rel(m.responsavel))}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {m.impacto && m.esforco ? `${m.impacto} / ${m.esforco}` : "—"}
                        {quadrante && <span className="ml-2 text-xs">{quadrante}</span>}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{rotulo(STATUS_MELHORIA, m.status)}</Badge>
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
