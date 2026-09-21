import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { EmptyState } from "@/components/states/empty-state";
import { FarolBadge } from "@/components/kpis/farol-badge";
import { ProgressBar } from "@/components/okrs/progress-bar";
import { buttonVariants } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { calcularFarolPorMeta } from "@/lib/kpi-status";
import { calcularProgresso } from "@/lib/okr";

function formatarPrazo(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

export default async function OKRsPage() {
  const supabase = await createClient();

  const { data: okrs } = await supabase
    .from("okrs")
    .select("id, titulo, unidade, tipo_meta, valor_inicial, meta, prazo, areas(nome)")
    .eq("ativo", true)
    .order("titulo");

  const idsOkrs = (okrs ?? []).map((o) => o.id);
  const { data: valores } = idsOkrs.length
    ? await supabase
        .from("okr_values")
        .select("okr_id, valor, referencia_periodo")
        .in("okr_id", idsOkrs)
        .order("referencia_periodo", { ascending: false })
    : { data: [] as { okr_id: string; valor: number; referencia_periodo: string }[] };

  const ultimoValorPorOkr = new Map<string, number>();
  for (const v of valores ?? []) {
    if (!ultimoValorPorOkr.has(v.okr_id)) ultimoValorPorOkr.set(v.okr_id, v.valor);
  }

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">OKRs</h1>
            <p className="text-sm text-muted-foreground">Objetivos com meta e histórico de progresso.</p>
          </div>
          <Link href="/okrs/novo" className={buttonVariants()}>
            Novo OKR
          </Link>
        </div>

        {!okrs || okrs.length === 0 ? (
          <EmptyState
            title="Nenhum OKR cadastrado"
            description="Cadastre o primeiro objetivo — título, de onde parte e onde quer chegar."
          />
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4">
            {okrs.map((o) => {
              const area = (o.areas as unknown as { nome: string } | null)?.nome;
              const valorAtual = ultimoValorPorOkr.get(o.id) ?? null;
              const farol = calcularFarolPorMeta(valorAtual, o.valor_inicial, o.meta);
              const progresso =
                valorAtual !== null && o.valor_inicial !== null
                  ? calcularProgresso(o.valor_inicial, valorAtual, o.meta)
                  : 0;
              const sufixo = o.tipo_meta === "percentual" ? "%" : o.unidade ? ` ${o.unidade}` : "";

              return (
                <Link
                  key={o.id}
                  href={`/okrs/${o.id}`}
                  className="flex flex-col gap-2 rounded-lg border bg-card p-4 transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="min-w-0 flex-1 truncate text-sm font-medium" title={o.titulo}>
                      {o.titulo}
                    </h3>
                    <FarolBadge farol={farol} />
                  </div>
                  <p className="text-2xl font-semibold tabular-nums">
                    {valorAtual !== null ? valorAtual.toLocaleString("pt-BR") : "—"}
                    {valorAtual !== null && (
                      <span className="ml-1 text-sm font-normal text-muted-foreground">{sufixo}</span>
                    )}
                  </p>
                  <ProgressBar progresso={progresso} />
                  <div className="flex flex-wrap gap-1.5 text-xs text-muted-foreground">
                    {area && <span>{area}</span>}
                    <span>
                      {area && "· "}Meta: {o.meta.toLocaleString("pt-BR")}
                      {sufixo}
                    </span>
                    {o.prazo && <span>· até {formatarPrazo(o.prazo)}</span>}
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
