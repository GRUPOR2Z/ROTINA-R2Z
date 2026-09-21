import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { EmptyState } from "@/components/states/empty-state";
import { FarolBadge } from "@/components/kpis/farol-badge";
import { buttonVariants } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { calcularFarol, type DirecaoKpi } from "@/lib/kpi-status";

export default async function KPIsPage() {
  const supabase = await createClient();

  const { data: kpis } = await supabase
    .from("kpis")
    .select("id, nome, unidade, meta, direcao, limiar_atencao, limiar_critico, areas(nome)")
    .eq("ativo", true)
    .order("nome");

  const idsKpis = (kpis ?? []).map((k) => k.id);
  const { data: valores } = idsKpis.length
    ? await supabase
        .from("kpi_values")
        .select("kpi_id, valor, referencia_periodo")
        .in("kpi_id", idsKpis)
        .order("referencia_periodo", { ascending: false })
    : { data: [] as { kpi_id: string; valor: number; referencia_periodo: string }[] };

  const ultimoValorPorKpi = new Map<string, number>();
  for (const v of valores ?? []) {
    if (!ultimoValorPorKpi.has(v.kpi_id)) ultimoValorPorKpi.set(v.kpi_id, v.valor);
  }

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">KPIs</h1>
            <p className="text-sm text-muted-foreground">Indicadores com definição, meta e histórico.</p>
          </div>
          <Link href="/kpis/novo" className={buttonVariants()}>
            Novo KPI
          </Link>
        </div>

        {!kpis || kpis.length === 0 ? (
          <EmptyState
            title="Nenhum KPI cadastrado"
            description="Cadastre o primeiro indicador — mesmo sem valor ainda, a estrutura já fica pronta."
          />
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4">
            {kpis.map((k) => {
              const area = (k.areas as unknown as { nome: string } | null)?.nome;
              const valorAtual = ultimoValorPorKpi.get(k.id) ?? null;
              const farol = calcularFarol(
                valorAtual,
                k.limiar_atencao,
                k.limiar_critico,
                k.direcao as DirecaoKpi,
              );

              return (
                <Link
                  key={k.id}
                  href={`/kpis/${k.id}`}
                  className="flex flex-col gap-2 rounded-lg border bg-card p-4 transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="min-w-0 flex-1 truncate text-sm font-medium" title={k.nome}>
                      {k.nome}
                    </h3>
                    <FarolBadge farol={farol} />
                  </div>
                  <p className="text-2xl font-semibold tabular-nums">
                    {valorAtual !== null ? valorAtual.toLocaleString("pt-BR") : "—"}
                    {k.unidade && valorAtual !== null && (
                      <span className="ml-1 text-sm font-normal text-muted-foreground">{k.unidade}</span>
                    )}
                  </p>
                  <div className="flex flex-wrap gap-1.5 text-xs text-muted-foreground">
                    {area && <span>{area}</span>}
                    {k.meta !== null && (
                      <span>
                        {area && "· "}Meta: {k.meta.toLocaleString("pt-BR")}
                        {k.unidade}
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
