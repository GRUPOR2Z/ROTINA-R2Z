import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { EmptyState } from "@/components/states/empty-state";
import { ProgressBar } from "@/components/okrs/progress-bar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { calcularProgresso } from "@/lib/okr";
import { encerrarCiclo, excluirCiclo } from "../actions";

function formatarData(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

export default async function CicloPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: ciclo } = await supabase.from("okr_cycles").select("*").eq("id", id).maybeSingle();
  if (!ciclo) notFound();

  const { data: objetivos } = await supabase
    .from("objectives")
    .select("id, titulo, areas(nome), profiles(nome, email), key_results(valor_inicial, valor_atual, valor_alvo)")
    .eq("okr_cycle_id", id)
    .order("criado_em");

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <div>
          <Link href="/okrs" className="text-sm text-muted-foreground hover:text-foreground">
            ← OKRs
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">{ciclo.nome}</h1>
            {ciclo.status === "encerrado" && <Badge variant="secondary">Encerrado</Badge>}
          </div>
          <p className="text-sm text-muted-foreground">
            {formatarData(ciclo.data_inicio)} – {formatarData(ciclo.data_fim)}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link href={`/okrs/${ciclo.id}/objetivos/novo`} className={buttonVariants()}>
            Novo objetivo
          </Link>
          {ciclo.status !== "encerrado" && (
            <form action={encerrarCiclo.bind(null, ciclo.id)}>
              <Button type="submit" variant="outline" size="sm">
                Encerrar ciclo
              </Button>
            </form>
          )}
          <form action={excluirCiclo.bind(null, ciclo.id)}>
            <Button type="submit" variant="ghost" size="sm" className="text-destructive">
              Excluir ciclo
            </Button>
          </form>
        </div>

        {!objetivos || objetivos.length === 0 ? (
          <EmptyState
            title="Nenhum objetivo neste ciclo"
            description="Crie o primeiro objetivo e seus resultados-chave."
          />
        ) : (
          <div className="flex flex-col gap-3">
            {objetivos.map((o) => {
              const area = (o.areas as unknown as { nome: string } | null)?.nome;
              const responsavel = o.profiles as unknown as { nome: string | null; email: string | null } | null;
              const krs = (o.key_results ?? []) as unknown as {
                valor_inicial: number;
                valor_atual: number;
                valor_alvo: number;
              }[];
              const progressos = krs.map((kr) => calcularProgresso(kr.valor_inicial, kr.valor_atual, kr.valor_alvo));
              const progressoMedio =
                progressos.length > 0 ? progressos.reduce((a, b) => a + b, 0) / progressos.length : 0;

              return (
                <Link
                  key={o.id}
                  href={`/okrs/objetivos/${o.id}`}
                  className="flex flex-col gap-2 rounded-lg border bg-card p-4 transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-medium">{o.titulo}</h3>
                    <span className="text-xs tabular-nums text-muted-foreground">
                      {Math.round(progressoMedio)}%
                    </span>
                  </div>
                  <ProgressBar progresso={progressoMedio} />
                  <div className="flex flex-wrap gap-1.5 text-xs text-muted-foreground">
                    {area && <span>{area}</span>}
                    {responsavel && <span>{area && "· "}{responsavel.nome || responsavel.email}</span>}
                    <span>{area || responsavel ? "· " : ""}{krs.length} resultado{krs.length === 1 ? "" : "s"}-chave</span>
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
