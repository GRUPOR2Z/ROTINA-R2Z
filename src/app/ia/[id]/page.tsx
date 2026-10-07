import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader, Section } from "@/components/layout/page-header";
import { SelectField } from "@/components/forms/select-field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/server";
import { getVinculosTarefa } from "@/lib/lookups";
import { CATEGORIAS_ACHADO, agruparAchados, resumoValidacao } from "@/lib/ia";
import { formatarData, formatarDataHora, nomeDe, rel } from "@/lib/format";
import { cn } from "@/lib/utils";
import { comentarAchado, criarTarefaDoAchado, relacionarAchado, validarAchado } from "../actions";

type Fonte = string | { fonte?: string; registros?: number; sincronizado_em?: string };

function descreverFonte(f: Fonte) {
  if (typeof f === "string") return f;
  return [f.fonte, f.registros != null ? `${f.registros} registros` : null, f.sincronizado_em ? `sync ${formatarDataHora(f.sincronizado_em)}` : null]
    .filter(Boolean)
    .join(" · ");
}

export default async function RelatorioIAPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: relatorio } = await supabase.from("ai_reports").select("*").eq("id", id).maybeSingle();
  if (!relatorio) notFound();

  const [{ data: achados }, vinculos] = await Promise.all([
    supabase
      .from("ai_findings")
      .select(
        "id, tipo, categoria, prioridade, titulo, descricao, evidencias, validacao, validado_em, task_id, kpi_id, okr_id, process_id, validador:profiles!ai_findings_validado_por_fkey(nome, email), ai_finding_comments(id, texto, criado_em, profiles(nome, email))",
      )
      .eq("report_id", id)
      .order("criado_em"),
    getVinculosTarefa(),
  ]);

  const grupos = agruparAchados(achados ?? []);
  const resumo = resumoValidacao(achados ?? []);
  const fontes = (Array.isArray(relatorio.fontes) ? relatorio.fontes : []) as Fonte[];

  return (
    <AppShell>
      <div className="flex max-w-4xl flex-col gap-8">
        <PageHeader
          title={relatorio.titulo}
          back={{ href: "/ia", label: "Grupo R2Z IA" }}
          description={`Período ${formatarData(relatorio.periodo_inicio)} – ${formatarData(relatorio.periodo_fim, { ano: true })} · gerado em ${formatarDataHora(relatorio.gerado_em)}${relatorio.modelo ? ` · ${relatorio.modelo}` : ""}`}
        />

        {relatorio.dados_insuficientes && (
          <p className="rounded-md border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-sm">
            A IA indicou que os dados deste período foram insuficientes para conclusões firmes.
          </p>
        )}

        <div className="flex flex-col gap-3 rounded-lg border p-4">
          {relatorio.resumo && <p className="whitespace-pre-wrap text-sm">{relatorio.resumo}</p>}
          <p className="text-xs text-muted-foreground">
            Fontes: {fontes.length ? fontes.map(descreverFonte).join(" | ") : "não informadas"}
          </p>
          <p className="text-xs text-muted-foreground">
            {resumo.pendentes} pendentes · {resumo.validados} validados · {resumo.rejeitados} rejeitados
          </p>
        </div>

        {grupos.map((g) => (
          <Section key={g.value} title={`${g.label} (${g.itens.length})`}>
            <p className="-mt-2 text-xs text-muted-foreground">{g.descricao}</p>
            {g.itens.length === 0 && <p className="text-sm text-muted-foreground">Nenhum.</p>}
            {g.itens.map((a) => {
              const comentarios = (a.ai_finding_comments ?? []) as {
                id: string;
                texto: string;
                criado_em: string;
                profiles: unknown;
              }[];
              return (
                <div
                  key={a.id}
                  className={cn(
                    "flex flex-col gap-3 rounded-lg border p-4",
                    a.validacao === "rejeitado" && "opacity-60",
                    a.validacao === "validado" && "border-emerald-500/40",
                  )}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{a.titulo}</span>
                    {a.prioridade === "alta" && <Badge variant="destructive">Alta</Badge>}
                    {a.categoria && <Badge variant="outline">{CATEGORIAS_ACHADO[a.categoria] ?? a.categoria}</Badge>}
                    <Badge variant={a.validacao === "pendente" ? "secondary" : "outline"}>
                      {a.validacao === "pendente" ? "Aguardando validação" : a.validacao === "validado" ? "Validado" : "Rejeitado"}
                    </Badge>
                  </div>
                  {a.descricao && <p className="whitespace-pre-wrap text-sm">{a.descricao}</p>}
                  {a.evidencias && (
                    <p className="whitespace-pre-wrap rounded bg-muted/50 p-2 text-xs text-muted-foreground">
                      <span className="font-medium">Evidências: </span>
                      {a.evidencias}
                    </p>
                  )}
                  {a.validacao !== "pendente" && (
                    <p className="text-xs text-muted-foreground">
                      {a.validacao === "validado" ? "Validado" : "Rejeitado"} por {nomeDe(rel(a.validador))} em {formatarDataHora(a.validado_em)}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {a.validacao !== "validado" && (
                      <form action={validarAchado.bind(null, id, a.id, "validado")}>
                        <Button type="submit" size="sm" variant="outline" className="h-7 text-xs">
                          Validar
                        </Button>
                      </form>
                    )}
                    {a.validacao !== "rejeitado" && (
                      <form action={validarAchado.bind(null, id, a.id, "rejeitado")}>
                        <Button type="submit" size="sm" variant="ghost" className="h-7 text-xs">
                          Rejeitar
                        </Button>
                      </form>
                    )}
                    {a.validacao !== "pendente" && (
                      <form action={validarAchado.bind(null, id, a.id, "pendente")}>
                        <Button type="submit" size="sm" variant="ghost" className="h-7 text-xs">
                          Voltar para pendente
                        </Button>
                      </form>
                    )}
                    {a.task_id ? (
                      <Link href={`/rotinas/${a.task_id}`} className="inline-flex h-7 items-center px-2 text-xs text-primary hover:underline">
                        Ver tarefa
                      </Link>
                    ) : (
                      a.validacao === "validado" && (
                        <form action={criarTarefaDoAchado.bind(null, id, a.id)}>
                          <Button type="submit" size="sm" variant="outline" className="h-7 text-xs">
                            Criar tarefa
                          </Button>
                        </form>
                      )
                    )}
                  </div>

                  <details className="text-sm">
                    <summary className="cursor-pointer text-xs text-muted-foreground">
                      Relacionar e comentar ({comentarios.length} comentários)
                    </summary>
                    <div className="mt-3 flex flex-col gap-3">
                      <form action={relacionarAchado.bind(null, id, a.id)} className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_1fr_auto]">
                        <SelectField name="kpi_id" options={vinculos.kpis} defaultValue={a.kpi_id} emptyLabel="Sem KPI" placeholder="KPI" className="" />
                        <SelectField name="okr_id" options={vinculos.okrs} defaultValue={a.okr_id} emptyLabel="Sem OKR" placeholder="OKR" className="" />
                        <SelectField name="process_id" options={vinculos.processos} defaultValue={a.process_id} emptyLabel="Sem processo" placeholder="Processo" className="" />
                        <Button type="submit" size="sm" variant="outline">
                          Salvar
                        </Button>
                      </form>
                      {comentarios.map((c) => (
                        <p key={c.id} className="text-sm">
                          <span className="font-medium">{nomeDe(rel(c.profiles))}</span>{" "}
                          <span className="text-xs text-muted-foreground">{formatarDataHora(c.criado_em)}</span>
                          <br />
                          {c.texto}
                        </p>
                      ))}
                      <form action={comentarAchado.bind(null, id, a.id)} className="flex gap-2">
                        <Input name="texto" placeholder="Comentar…" className="flex-1 text-sm" required />
                        <Button type="submit" size="sm" variant="outline">
                          Comentar
                        </Button>
                      </form>
                    </div>
                  </details>
                </div>
              );
            })}
          </Section>
        ))}
      </div>
    </AppShell>
  );
}
