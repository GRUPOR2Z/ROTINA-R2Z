import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { EmptyState } from "@/components/states/empty-state";
import { StatTile } from "@/components/dashboard/stat-tile";
import { StatusBarChart } from "@/components/dashboard/bar-chart";
import { FarolBadge } from "@/components/kpis/farol-badge";
import { createClient } from "@/lib/supabase/server";
import { estaAtrasada } from "@/components/rotinas/status-badge";
import { calcularFarolPorMeta, type FarolKpi } from "@/lib/kpi-status";
import { DashboardFilterBar } from "@/components/dashboard/filter-bar";
import { opcoesAreas, opcoesMembros } from "@/lib/opcoes";
import { getAreasEMembros } from "@/lib/lookups";
import { intervaloDoPeriodo } from "@/lib/periodo";
import { getCurrentProfile } from "@/lib/current-profile";
import { getAlertasDoUsuario } from "@/lib/alertas-data";
import { ordenarAlertas } from "@/lib/alertas";
import { getAndamentoProjetos } from "@/lib/projetos-data";
import { BarraAndamento, PrazoProjeto } from "@/components/projetos/status-badge";
import { Badge } from "@/components/ui/badge";

function formatarDataHora(d: Date) {
  return d.toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

function formatarData(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string; area?: string; responsavel?: string }>;
}) {
  const filtros = await searchParams;
  const supabase = await createClient();
  const agora = new Date();
  const { areas, membros } = await getAreasEMembros();
  const intervalo = intervaloDoPeriodo(filtros.periodo, agora);

  let qTarefas = supabase.from("tasks").select("id, titulo, status, prazo, horario");
  let qKpis = supabase.from("kpis").select("id, nome, valor_inicial, meta, tipo_meta, unidade").eq("ativo", true);
  let qOkrs = supabase.from("okrs").select("id, titulo, valor_inicial, meta, tipo_meta, unidade").eq("ativo", true);

  if (filtros.area) {
    qTarefas = qTarefas.eq("area_id", filtros.area);
    qKpis = qKpis.eq("area_id", filtros.area);
    qOkrs = qOkrs.eq("area_id", filtros.area);
  }
  if (filtros.responsavel) {
    qTarefas = qTarefas.eq("responsavel_id", filtros.responsavel);
    qKpis = qKpis.eq("responsavel_id", filtros.responsavel);
    qOkrs = qOkrs.eq("responsavel_id", filtros.responsavel);
  }
  if (intervalo) qTarefas = qTarefas.gte("prazo", intervalo.inicio).lte("prazo", intervalo.fim);

  let qProjetos = supabase
    .from("projects")
    .select("id, nome, status, prazo")
    .in("status", ["planejamento", "em_andamento", "pausado"])
    .order("prazo", { ascending: true, nullsFirst: false })
    .limit(6);
  if (filtros.area) qProjetos = qProjetos.eq("area_id", filtros.area);
  if (filtros.responsavel) qProjetos = qProjetos.eq("responsavel_id", filtros.responsavel);

  const eu = await getCurrentProfile();
  const [{ data: tasks }, { data: kpis }, { data: okrs }, { data: projetos }, { alertas }, { data: ultimoRelatorio }] =
    await Promise.all([
      qTarefas,
      qKpis,
      qOkrs,
      qProjetos,
      getAlertasDoUsuario({ limite: 50 }),
      eu?.isGestorOuAdmin
        ? supabase
            .from("ai_reports")
            .select("id, titulo, resumo, gerado_em, dados_insuficientes, ai_findings(validacao)")
            .order("gerado_em", { ascending: false })
            .limit(1)
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ]);
  const andamentoProjetos = await getAndamentoProjetos((projetos ?? []).map((p) => p.id));
  const alertasPrincipais = ordenarAlertas(alertas.filter((a) => !a.lido_em)).slice(0, 5);

  // --- tarefas ---
  const todasTarefas = tasks ?? [];
  const contagemStatus = {
    pendente: todasTarefas.filter((t) => t.status === "pendente").length,
    em_andamento: todasTarefas.filter((t) => t.status === "em_andamento").length,
    concluida: todasTarefas.filter((t) => t.status === "concluida").length,
    bloqueada: todasTarefas.filter((t) => t.status === "bloqueada").length,
  };
  const atrasadas = todasTarefas.filter((t) => estaAtrasada(t.prazo, t.status)).length;

  const proximasTarefas = todasTarefas
    .filter((t) => t.status !== "concluida" && t.prazo)
    .sort((a, b) => (a.prazo! < b.prazo! ? -1 : a.prazo! > b.prazo! ? 1 : 0))
    .slice(0, 6);

  // --- kpis: farol de cada um, a partir do ultimo valor ---
  const idsKpis = (kpis ?? []).map((k) => k.id);
  const { data: valoresKpi } = idsKpis.length
    ? await supabase
        .from("kpi_values")
        .select("kpi_id, valor, referencia_periodo")
        .in("kpi_id", idsKpis)
        .order("referencia_periodo", { ascending: false })
    : { data: [] as { kpi_id: string; valor: number; referencia_periodo: string }[] };

  const ultimoValorPorKpi = new Map<string, number>();
  for (const v of valoresKpi ?? []) {
    if (!ultimoValorPorKpi.has(v.kpi_id)) ultimoValorPorKpi.set(v.kpi_id, v.valor);
  }

  const kpisComFarol = (kpis ?? []).map((k) => ({
    ...k,
    farol: calcularFarolPorMeta(ultimoValorPorKpi.get(k.id) ?? null, k.valor_inicial, k.meta),
  }));

  const resumoFarolKpi = contarFarol(kpisComFarol.map((k) => k.farol));
  const kpisPreocupantes = kpisComFarol.filter((k) => k.farol === "atencao" || k.farol === "critico");

  // --- okrs: mesma logica ---
  const idsOkrs = (okrs ?? []).map((o) => o.id);
  const { data: valoresOkr } = idsOkrs.length
    ? await supabase
        .from("okr_values")
        .select("okr_id, valor, referencia_periodo")
        .in("okr_id", idsOkrs)
        .order("referencia_periodo", { ascending: false })
    : { data: [] as { okr_id: string; valor: number; referencia_periodo: string }[] };

  const ultimoValorPorOkr = new Map<string, number>();
  for (const v of valoresOkr ?? []) {
    if (!ultimoValorPorOkr.has(v.okr_id)) ultimoValorPorOkr.set(v.okr_id, v.valor);
  }

  const okrsComFarol = (okrs ?? []).map((o) => ({
    ...o,
    farol: calcularFarolPorMeta(ultimoValorPorOkr.get(o.id) ?? null, o.valor_inicial, o.meta),
  }));

  const resumoFarolOkr = contarFarol(okrsComFarol.map((o) => o.farol));

  const semNadaAinda = todasTarefas.length === 0 && (kpis ?? []).length === 0 && (okrs ?? []).length === 0;

  return (
    <AppShell>
      <div className="flex flex-col gap-8">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
            <p className="text-sm text-muted-foreground">Visão geral de tarefas, KPIs e OKRs.</p>
          </div>
          <p className="text-xs text-muted-foreground">Atualizado em {formatarDataHora(agora)}</p>
        </div>

        <DashboardFilterBar areas={opcoesAreas(areas)} membros={opcoesMembros(membros)} />

        {semNadaAinda ? (
          <EmptyState
            title="Ainda não há dados para mostrar"
            description="Crie tarefas, KPIs ou OKRs — o dashboard aparece sozinho a partir deles."
          />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <StatTile label="Pendentes" value={contagemStatus.pendente} href="/rotinas?status=pendente" />
              <StatTile
                label="Em andamento"
                value={contagemStatus.em_andamento}
                href="/rotinas?status=em_andamento"
              />
              <StatTile label="Atrasadas" value={atrasadas} tone="critical" href="/rotinas" />
              <StatTile label="Bloqueadas" value={contagemStatus.bloqueada} tone="critical" href="/rotinas?status=bloqueada" />
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <section className="flex flex-col gap-3 rounded-lg border p-4">
                <h2 className="text-sm font-semibold text-muted-foreground">Tarefas por status</h2>
                {todasTarefas.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhuma tarefa cadastrada ainda.</p>
                ) : (
                  <StatusBarChart
                    items={[
                      { label: "Pendente", value: contagemStatus.pendente, colorClass: "bg-slate-400" },
                      { label: "Em andamento", value: contagemStatus.em_andamento, colorClass: "bg-blue-500" },
                      { label: "Concluída", value: contagemStatus.concluida, colorClass: "bg-emerald-500" },
                      { label: "Bloqueada", value: contagemStatus.bloqueada, colorClass: "bg-red-500" },
                    ]}
                  />
                )}
              </section>

              <section className="flex flex-col gap-3 rounded-lg border p-4">
                <h2 className="text-sm font-semibold text-muted-foreground">Próximos prazos</h2>
                {proximasTarefas.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nada agendado.</p>
                ) : (
                  <ul className="flex flex-col gap-1.5">
                    {proximasTarefas.map((t) => (
                      <li key={t.id}>
                        <Link
                          href={`/rotinas/${t.id}`}
                          className="flex items-center justify-between gap-2 text-sm hover:underline"
                        >
                          <span className="min-w-0 flex-1 truncate">{t.titulo}</span>
                          <span className="shrink-0 text-xs text-muted-foreground">
                            {formatarData(t.prazo!)}
                            {t.horario && ` · ${t.horario.slice(0, 5)}`}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <section className="flex flex-col gap-3 rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-muted-foreground">KPIs</h2>
                  <Link href="/kpis" className="text-xs text-muted-foreground hover:text-foreground">
                    Ver todos →
                  </Link>
                </div>
                {kpisComFarol.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum KPI cadastrado ainda.</p>
                ) : (
                  <>
                    <FarolResumo resumo={resumoFarolKpi} />
                    {kpisPreocupantes.length > 0 && (
                      <ul className="mt-1 flex flex-col gap-1.5 border-t pt-3">
                        {kpisPreocupantes.slice(0, 5).map((k) => (
                          <li key={k.id}>
                            <Link
                              href={`/kpis/${k.id}`}
                              className="flex items-center justify-between gap-2 text-sm hover:underline"
                            >
                              <span className="min-w-0 flex-1 truncate">{k.nome}</span>
                              <FarolBadge farol={k.farol} />
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                )}
              </section>

              <section className="flex flex-col gap-3 rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-muted-foreground">OKRs</h2>
                  <Link href="/okrs" className="text-xs text-muted-foreground hover:text-foreground">
                    Ver todos →
                  </Link>
                </div>
                {okrsComFarol.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum OKR cadastrado ainda.</p>
                ) : (
                  <FarolResumo resumo={resumoFarolOkr} />
                )}
              </section>
            </div>
          </>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <section className="flex flex-col gap-3 rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-muted-foreground">Alertas</h2>
              <Link href="/alertas" className="text-xs text-muted-foreground hover:text-foreground">
                Central de alertas →
              </Link>
            </div>
            {alertasPrincipais.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum alerta não lido.</p>
            ) : (
              <ul className="flex flex-col gap-1.5">
                {alertasPrincipais.map((a) => (
                  <li key={a.id} className="flex items-center gap-2 text-sm">
                    <span
                      className={`h-2 w-2 shrink-0 rounded-full ${
                        a.severidade === "critico" ? "bg-red-500" : a.severidade === "atencao" ? "bg-amber-500" : "bg-blue-400"
                      }`}
                    />
                    <Link href={a.link ?? "/alertas"} className="min-w-0 flex-1 truncate hover:underline">
                      {a.titulo}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="flex flex-col gap-3 rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-muted-foreground">Projetos ativos</h2>
              <Link href="/projetos" className="text-xs text-muted-foreground hover:text-foreground">
                Ver todos →
              </Link>
            </div>
            {(projetos ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum projeto ativo.</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {projetos!.map((p) => (
                  <li key={p.id} className="flex flex-col gap-1">
                    <Link href={`/projetos/${p.id}`} className="flex items-center justify-between gap-2 text-sm hover:underline">
                      <span className="truncate">{p.nome}</span>
                      <PrazoProjeto prazo={p.prazo} status={p.status} />
                    </Link>
                    <BarraAndamento valor={andamentoProjetos.get(p.id) ?? null} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {eu?.isGestorOuAdmin && (
          <section className="flex flex-col gap-3 rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-muted-foreground">Última análise da Grupo R2Z IA</h2>
              <Link href="/ia" className="text-xs text-muted-foreground hover:text-foreground">
                Ver relatórios →
              </Link>
            </div>
            {!ultimoRelatorio ? (
              <p className="text-sm text-muted-foreground">
                Nenhum relatório ainda — eles chegam quando a integração com o n8n for ligada.
              </p>
            ) : (
              <Link href={`/ia/${ultimoRelatorio.id}`} className="flex flex-col gap-1 hover:underline">
                <span className="flex flex-wrap items-center gap-2 text-sm font-medium">
                  {ultimoRelatorio.titulo}
                  {ultimoRelatorio.dados_insuficientes && <Badge variant="outline">Dados insuficientes</Badge>}
                  {(ultimoRelatorio.ai_findings ?? []).some((f: { validacao: string }) => f.validacao === "pendente") && (
                    <Badge>Achados para validar</Badge>
                  )}
                </span>
                {ultimoRelatorio.resumo && (
                  <span className="line-clamp-2 text-sm text-muted-foreground">{ultimoRelatorio.resumo}</span>
                )}
                <span className="text-xs text-muted-foreground">Gerado em {formatarDataHora(new Date(ultimoRelatorio.gerado_em))}</span>
              </Link>
            )}
          </section>
        )}
      </div>
    </AppShell>
  );
}

function contarFarol(faroes: FarolKpi[]) {
  return {
    ok: faroes.filter((f) => f === "ok").length,
    atencao: faroes.filter((f) => f === "atencao").length,
    critico: faroes.filter((f) => f === "critico").length,
    sem_dados: faroes.filter((f) => f === "sem_dados").length,
  };
}

function FarolResumo({ resumo }: { resumo: Record<string, number> }) {
  return (
    <div className="flex gap-4 text-sm">
      <span className="flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full bg-emerald-500" /> {resumo.ok} ok
      </span>
      <span className="flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full bg-amber-500" /> {resumo.atencao} atenção
      </span>
      <span className="flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full bg-red-500" /> {resumo.critico} crítico
      </span>
      {resumo.sem_dados > 0 && (
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <span className="h-2 w-2 rounded-full bg-slate-300" /> {resumo.sem_dados} sem dados
        </span>
      )}
    </div>
  );
}
