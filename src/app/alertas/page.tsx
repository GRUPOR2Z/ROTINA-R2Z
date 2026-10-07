import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader, Section, SubNav } from "@/components/layout/page-header";
import { EmptyState } from "@/components/states/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getAlertasDoUsuario } from "@/lib/alertas-data";
import { TIPOS_ALERTA, ordenarAlertas, rotuloTipoAlerta } from "@/lib/alertas";
import { getCurrentProfile } from "@/lib/current-profile";
import { formatarDataHora } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  arquivarAlerta,
  atualizarAlertasAgora,
  criarTarefaDoAlerta,
  marcarLido,
  marcarTodosLidos,
  salvarPreferencias,
} from "./actions";

const COR_SEVERIDADE: Record<string, string> = {
  critico: "border-l-destructive",
  atencao: "border-l-amber-500",
  info: "border-l-blue-400",
};

export default async function AlertasPage({ searchParams }: { searchParams: Promise<{ ver?: string; tipo?: string }> }) {
  const { ver, tipo } = await searchParams;
  const historico = ver === "historico";
  const eu = await getCurrentProfile();
  const { alertas, silenciados, erroGeracao } = await getAlertasDoUsuario({ incluirArquivados: historico });

  const filtrados = ordenarAlertas(
    alertas.filter((a) => (!tipo || a.tipo === tipo) && (!historico || a.arquivado_em || a.resolvido_em)),
  );
  const naoLidos = alertas.filter((a) => !a.lido_em).length;

  return (
    <AppShell>
      <div className="flex max-w-4xl flex-col gap-6">
        <PageHeader
          title="Central de alertas"
          description="Atrasos, prazos próximos, processos em revisão, KPIs desatualizados e falhas de integração."
          actions={
            <>
              {!historico && naoLidos > 0 && (
                <form action={marcarTodosLidos}>
                  <Button type="submit" size="sm" variant="outline">
                    Marcar todos como lidos
                  </Button>
                </form>
              )}
              {eu?.isAdmin && (
                <form action={atualizarAlertasAgora}>
                  <Button type="submit" size="sm" variant="ghost">
                    Recalcular agora
                  </Button>
                </form>
              )}
            </>
          }
        >
          <SubNav
            ativo={historico ? "/alertas?ver=historico" : "/alertas"}
            items={[
              { href: "/alertas", label: `Ativos${naoLidos && !historico ? ` (${naoLidos} não lidos)` : ""}` },
              { href: "/alertas?ver=historico", label: "Arquivados e resolvidos" },
            ]}
          />
        </PageHeader>

        {erroGeracao && (
          <p className="rounded-md border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-sm">
            Não foi possível recalcular os alertas agora — mostrando os últimos registrados.
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          <Link
            href={historico ? "/alertas?ver=historico" : "/alertas"}
            className={cn("rounded-full border px-3 py-1 text-xs", !tipo ? "border-primary bg-primary/10 text-primary" : "text-muted-foreground")}
          >
            Todos
          </Link>
          {TIPOS_ALERTA.filter((t) => !silenciados.includes(t.value)).map((t) => (
            <Link
              key={t.value}
              href={`/alertas?${historico ? "ver=historico&" : ""}tipo=${t.value}`}
              className={cn(
                "rounded-full border px-3 py-1 text-xs",
                tipo === t.value ? "border-primary bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted",
              )}
            >
              {t.label}
            </Link>
          ))}
        </div>

        {filtrados.length === 0 ? (
          <EmptyState
            title={historico ? "Nada no histórico" : "Nenhum alerta ativo"}
            description={historico ? "Alertas arquivados ou resolvidos aparecem aqui." : "Tudo em dia por aqui."}
          />
        ) : (
          <ul className="flex flex-col gap-2">
            {filtrados.map((a) => (
              <li
                key={a.id}
                className={cn(
                  "flex flex-col gap-2 rounded-lg border border-l-4 p-3 sm:flex-row sm:items-start",
                  COR_SEVERIDADE[a.severidade],
                  a.lido_em && "opacity-70",
                )}
              >
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {!a.lido_em && <span className="h-2 w-2 rounded-full bg-primary" aria-label="Não lido" />}
                    {a.link ? (
                      <Link href={a.link} className="font-medium hover:underline">
                        {a.titulo}
                      </Link>
                    ) : (
                      <span className="font-medium">{a.titulo}</span>
                    )}
                    {a.severidade === "critico" && <Badge variant="destructive">Crítico</Badge>}
                    {a.resolvido_em && <Badge variant="outline">Resolvido</Badge>}
                  </div>
                  {a.descricao && <p className="text-sm text-muted-foreground">{a.descricao}</p>}
                  <p className="text-xs text-muted-foreground">
                    {rotuloTipoAlerta(a.tipo)} · {formatarDataHora(a.criado_em)} · origem: {a.origem}
                    {!a.destinatario_id && " · alerta geral"}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-1">
                  {a.task_id ? (
                    <Link href={`/rotinas/${a.task_id}`} className="inline-flex h-7 items-center rounded-md px-2 text-xs text-primary hover:bg-muted">
                      Ver tarefa
                    </Link>
                  ) : (
                    !a.resolvido_em && (
                      <form action={criarTarefaDoAlerta.bind(null, a.id)}>
                        <Button type="submit" size="sm" variant="ghost" className="h-7 text-xs">
                          Criar tarefa
                        </Button>
                      </form>
                    )
                  )}
                  <form action={marcarLido.bind(null, a.id, !a.lido_em)}>
                    <Button type="submit" size="sm" variant="ghost" className="h-7 text-xs">
                      {a.lido_em ? "Marcar não lido" : "Marcar lido"}
                    </Button>
                  </form>
                  <form action={arquivarAlerta.bind(null, a.id, !a.arquivado_em)}>
                    <Button type="submit" size="sm" variant="ghost" className="h-7 text-xs">
                      {a.arquivado_em ? "Desarquivar" : "Arquivar"}
                    </Button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}

        <Section title="Preferências de notificação">
          <form action={salvarPreferencias} className="flex flex-col gap-3 rounded-lg border p-4">
            <p className="text-xs text-muted-foreground">Desmarque os tipos que você não quer ver. Alertas continuam registrados.</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {TIPOS_ALERTA.map((t) => (
                <label key={t.value} className="flex items-center gap-2 text-sm">
                  <input type="hidden" name="tipos_todos" value={t.value} />
                  <input
                    type="checkbox"
                    name="tipos_ativos"
                    value={t.value}
                    defaultChecked={!silenciados.includes(t.value)}
                    className="h-4 w-4"
                  />
                  {t.label}
                </label>
              ))}
            </div>
            <Button type="submit" size="sm" variant="outline" className="self-start">
              Salvar preferências
            </Button>
          </form>
        </Section>
      </div>
    </AppShell>
  );
}
