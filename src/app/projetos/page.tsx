import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader, SubNav } from "@/components/layout/page-header";
import { EmptyState } from "@/components/states/empty-state";
import { ProjectsBoard } from "@/components/projetos/projects-board";
import { BarraAndamento, PrazoProjeto, ProjectStatusBadge } from "@/components/projetos/status-badge";
import { buttonVariants } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createClient } from "@/lib/supabase/server";
import { getAndamentoProjetos } from "@/lib/projetos-data";
import { formatarData, nomeDe, rel } from "@/lib/format";

export default async function ProjetosPage({
  searchParams,
}: {
  searchParams: Promise<{ visao?: string }>;
}) {
  const { visao } = await searchParams;
  const kanban = visao === "kanban";
  const supabase = await createClient();

  const { data: projetos } = await supabase
    .from("projects")
    .select("id, nome, status, prazo, areas(nome), clients(nome), profiles!projects_responsavel_id_fkey(nome, email)")
    .order("prazo", { ascending: true, nullsFirst: false })
    .order("criado_em", { ascending: false });

  const lista = projetos ?? [];
  const andamento = await getAndamentoProjetos(lista.map((p) => p.id));

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Projetos"
          description="Projetos e entregas, com equipe, prazos e andamento."
          actions={
            <Link href="/projetos/novo" className={buttonVariants()}>
              Novo projeto
            </Link>
          }
        >
          <SubNav
            ativo={kanban ? "/projetos?visao=kanban" : "/projetos"}
            items={[
              { href: "/projetos", label: "Lista" },
              { href: "/projetos?visao=kanban", label: "Kanban" },
            ]}
          />
        </PageHeader>

        {lista.length === 0 ? (
          <EmptyState title="Nenhum projeto ainda" description="Crie um projeto para organizar tarefas, entregas e equipe." />
        ) : kanban ? (
          <ProjectsBoard
            projetos={lista.map((p) => ({
              id: p.id,
              nome: p.nome,
              status: p.status,
              prazo: p.prazo,
              responsavel: nomeDe(rel(p.profiles)),
              andamento: andamento.get(p.id) ?? null,
            }))}
          />
        ) : (
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Projeto</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead>Área</TableHead>
                  <TableHead>Prazo</TableHead>
                  <TableHead className="w-40">Andamento</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lista.map((p) => {
                  const cliente = rel<{ nome: string }>(p.clients)?.nome;
                  return (
                    <TableRow key={p.id}>
                      <TableCell>
                        <Link href={`/projetos/${p.id}`} className="font-medium hover:underline">
                          {p.nome}
                        </Link>
                        {cliente && <span className="ml-2 text-xs text-muted-foreground">{cliente}</span>}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{nomeDe(rel(p.profiles))}</TableCell>
                      <TableCell className="text-muted-foreground">{rel<{ nome: string }>(p.areas)?.nome ?? "—"}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-muted-foreground">{formatarData(p.prazo)}</span>
                          <PrazoProjeto prazo={p.prazo} status={p.status} />
                        </div>
                      </TableCell>
                      <TableCell>
                        <BarraAndamento valor={andamento.get(p.id) ?? null} />
                      </TableCell>
                      <TableCell>
                        <ProjectStatusBadge status={p.status} />
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
