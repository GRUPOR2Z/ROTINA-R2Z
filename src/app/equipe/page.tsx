import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { EmptyState } from "@/components/states/empty-state";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Section } from "@/components/layout/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createClient } from "@/lib/supabase/server";
import { calcularCarga, dependenciasDeUmaPessoa, mediaAbertas, sobrecarregado } from "@/lib/equipe";

function iniciais(nome: string | null, email: string | null) {
  const base = nome?.trim() || email || "?";
  return base.slice(0, 2).toUpperCase();
}

export default async function EquipePage() {
  const supabase = await createClient();

  const [{ data: membros }, { data: tarefas }, { data: processos }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, nome, email, cargo, areas(nome), roles(nome), member_tags(id, tag)")
      .eq("ativo", true)
      .order("nome"),
    supabase.from("tasks").select("responsavel_id, status, prazo, concluida_em").is("parent_task_id", null),
    supabase.from("processes").select("id, titulo, status, critico, responsavel_id, substituto_id"),
  ]);

  const cargas = calcularCarga(tarefas ?? []);
  const media = mediaAbertas(cargas);
  const dependencias = dependenciasDeUmaPessoa(processos ?? []);
  const nomePorId = new Map((membros ?? []).map((m) => [m.id, m.nome || m.email || "—"]));
  const maiorCarga = Math.max(1, ...[...cargas.values()].map((c) => c.abertas));

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Equipe</h1>
          <p className="text-sm text-muted-foreground">
            Clique em uma pessoa para ver rotina, competências e resultados.
          </p>
        </div>

        {!membros || membros.length === 0 ? (
          <EmptyState
            title="Ninguém cadastrado ainda"
            description="Os perfis aparecem aqui assim que fizerem o primeiro login."
          />
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4">
            {membros.map((m) => {
              const area = (m.areas as unknown as { nome: string } | null)?.nome;
              const papel = (m.roles as unknown as { nome: string } | null)?.nome;
              const tags = (m.member_tags ?? []) as { id: string; tag: string }[];

              return (
                <Link
                  key={m.id}
                  href={`/equipe/${m.id}`}
                  className="flex flex-col gap-3 rounded-lg border bg-card p-4 transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>{iniciais(m.nome, m.email)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {m.nome || m.email}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {m.cargo || papel || "—"}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {area && (
                      <Badge variant="secondary" className="text-[11px]">
                        {area}
                      </Badge>
                    )}
                    {tags.slice(0, 3).map((t) => (
                      <Badge key={t.id} variant="outline" className="text-[11px]">
                        {t.tag}
                      </Badge>
                    ))}
                    {tags.length > 3 && (
                      <Badge variant="outline" className="text-[11px]">
                        +{tags.length - 3}
                      </Badge>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {membros && membros.length > 0 && (
          <Section title="Carga de trabalho">
            <p className="-mt-2 text-xs text-muted-foreground">
              Tarefas abertas por pessoa (média {media.toFixed(1)}). Destaque = bem acima da média.
            </p>
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pessoa</TableHead>
                    <TableHead className="w-1/3">Abertas</TableHead>
                    <TableHead>Atrasadas</TableHead>
                    <TableHead>Bloqueadas</TableHead>
                    <TableHead>Concluídas (30 dias)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {membros.map((m) => {
                    const c = cargas.get(m.id) ?? { abertas: 0, atrasadas: 0, bloqueadas: 0, concluidas30d: 0 };
                    const alto = sobrecarregado(c, media);
                    return (
                      <TableRow key={m.id}>
                        <TableCell>
                          <Link href={`/equipe/${m.id}`} className="font-medium hover:underline">
                            {m.nome || m.email}
                          </Link>
                          {alto && <Badge variant="destructive" className="ml-2">Sobrecarga</Badge>}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                              <div
                                className={`h-full rounded-full ${alto ? "bg-destructive" : "bg-primary"}`}
                                style={{ width: `${(c.abertas / maiorCarga) * 100}%` }}
                              />
                            </div>
                            <span className="w-6 text-right tabular-nums">{c.abertas}</span>
                          </div>
                        </TableCell>
                        <TableCell className={c.atrasadas > 0 ? "text-destructive" : "text-muted-foreground"}>{c.atrasadas}</TableCell>
                        <TableCell className="text-muted-foreground">{c.bloqueadas}</TableCell>
                        <TableCell className="text-muted-foreground">{c.concluidas30d}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </Section>
        )}

        <Section title="Dependência de uma pessoa só">
          <p className="-mt-2 text-xs text-muted-foreground">
            Processos ativos sem substituto definido. Defina um substituto na página do processo.
          </p>
          {dependencias.size === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma dependência encontrada — todos os processos ativos têm substituto.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {[...dependencias.entries()].map(([pessoaId, d]) => (
                <li key={pessoaId} className="rounded-lg border p-3 text-sm">
                  <p className="font-medium">
                    {nomePorId.get(pessoaId) ?? "—"}{" "}
                    <span className="font-normal text-muted-foreground">
                      — {d.semSubstituto.length} processo(s) sem substituto
                      {d.criticos > 0 && <span className="text-destructive"> ({d.criticos} crítico(s))</span>}
                    </span>
                  </p>
                  <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
                    {d.semSubstituto.map((p) => (
                      <Link key={p.id} href={`/processos/${p.id}`} className={`text-xs hover:underline ${p.critico ? "text-destructive" : "text-muted-foreground"}`}>
                        {p.titulo}
                      </Link>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>
    </AppShell>
  );
}
