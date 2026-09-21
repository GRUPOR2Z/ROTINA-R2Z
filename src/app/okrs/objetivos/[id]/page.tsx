import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { ProgressBar } from "@/components/okrs/progress-bar";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/server";
import { calcularProgresso } from "@/lib/okr";
import {
  criarKeyResult,
  atualizarValorKeyResult,
  excluirKeyResult,
  excluirObjetivo,
} from "../../actions";

function formatarData(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

export default async function ObjetivoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: objetivo } = await supabase
    .from("objectives")
    .select("*, areas(nome), profiles(nome, email), okr_cycles(id, nome)")
    .eq("id", id)
    .maybeSingle();

  if (!objetivo) notFound();

  const { data: keyResults } = await supabase
    .from("key_results")
    .select("*")
    .eq("objective_id", id)
    .order("criado_em");

  type AtualizacaoKR = {
    id: string;
    key_result_id: string;
    valor_novo: number;
    comentario: string | null;
    criado_em: string;
    profiles: { nome: string | null; email: string | null } | null;
  };

  const idsKR = (keyResults ?? []).map((kr) => kr.id);
  const { data: updatesBrutos } = idsKR.length
    ? await supabase
        .from("key_result_updates")
        .select("id, key_result_id, valor_novo, comentario, criado_em, profiles(nome, email)")
        .in("key_result_id", idsKR)
        .order("criado_em", { ascending: false })
    : { data: [] };

  const updates = (updatesBrutos ?? []) as unknown as AtualizacaoKR[];

  const updatesPorKR = new Map<string, AtualizacaoKR[]>();
  for (const u of updates) {
    const lista = updatesPorKR.get(u.key_result_id) ?? [];
    lista.push(u);
    updatesPorKR.set(u.key_result_id, lista);
  }

  const area = (objetivo.areas as unknown as { nome: string } | null)?.nome;
  const responsavel = objetivo.profiles as unknown as { nome: string | null; email: string | null } | null;
  const ciclo = objetivo.okr_cycles as unknown as { id: string; nome: string } | null;

  return (
    <AppShell>
      <div className="flex max-w-2xl flex-col gap-8">
        <div>
          {ciclo && (
            <Link href={`/okrs/${ciclo.id}`} className="text-sm text-muted-foreground hover:text-foreground">
              ← {ciclo.nome}
            </Link>
          )}
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">{objetivo.titulo}</h1>
          {objetivo.descricao && <p className="mt-1 text-sm text-muted-foreground">{objetivo.descricao}</p>}
          <div className="mt-2 flex flex-wrap gap-1.5 text-xs text-muted-foreground">
            {area && <span>{area}</span>}
            {responsavel && <span>{area && "· "}{responsavel.nome || responsavel.email}</span>}
          </div>
        </div>

        <section className="flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-muted-foreground">Resultados-chave</h2>

          {(!keyResults || keyResults.length === 0) && (
            <p className="text-sm text-muted-foreground">Nenhum resultado-chave ainda.</p>
          )}

          {keyResults?.map((kr) => {
            const progresso = calcularProgresso(kr.valor_inicial, kr.valor_atual, kr.valor_alvo);
            const historico = updatesPorKR.get(kr.id) ?? [];

            return (
              <div key={kr.id} className="flex flex-col gap-3 rounded-lg border p-4">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-medium">{kr.titulo}</h3>
                  <form action={excluirKeyResult.bind(null, objetivo.id, kr.id)}>
                    <Button type="submit" variant="ghost" size="sm" className="h-6 px-2 text-muted-foreground">
                      Excluir
                    </Button>
                  </form>
                </div>

                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="tabular-nums">
                    {kr.valor_atual.toLocaleString("pt-BR")}
                    {kr.unidade && ` ${kr.unidade}`}
                  </span>
                  <span>→</span>
                  <span className="tabular-nums">
                    {kr.valor_alvo.toLocaleString("pt-BR")}
                    {kr.unidade && ` ${kr.unidade}`}
                  </span>
                  <span className="ml-auto tabular-nums">{Math.round(progresso)}%</span>
                </div>
                <ProgressBar progresso={progresso} />

                <form
                  action={atualizarValorKeyResult.bind(null, objetivo.id, kr.id)}
                  className="flex flex-wrap items-end gap-2"
                >
                  <div className="flex flex-col gap-1">
                    <Label htmlFor={`valor_novo_${kr.id}`} className="text-xs">
                      Novo valor
                    </Label>
                    <Input
                      id={`valor_novo_${kr.id}`}
                      name="valor_novo"
                      type="number"
                      step="any"
                      required
                      className="h-8 w-28 text-sm"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label htmlFor={`comentario_${kr.id}`} className="text-xs">
                      Justificativa (opcional)
                    </Label>
                    <Input
                      id={`comentario_${kr.id}`}
                      name="comentario"
                      className="h-8 w-56 text-sm"
                    />
                  </div>
                  <SubmitButton size="sm" pendingText="Salvando…">
                    Atualizar
                  </SubmitButton>
                </form>

                {historico.length > 0 && (
                  <details className="text-xs text-muted-foreground">
                    <summary className="cursor-pointer">Histórico ({historico.length})</summary>
                    <div className="mt-2 flex flex-col gap-1">
                      {historico.map((u) => {
                        const autor = u.profiles;
                        return (
                          <p key={u.id}>
                            {formatarData(u.criado_em)} — {u.valor_novo.toLocaleString("pt-BR")}
                            {kr.unidade && ` ${kr.unidade}`} por {autor?.nome || autor?.email || "—"}
                            {u.comentario && `: ${u.comentario}`}
                          </p>
                        );
                      })}
                    </div>
                  </details>
                )}
              </div>
            );
          })}

          <form
            action={criarKeyResult.bind(null, objetivo.id)}
            className="flex flex-wrap items-end gap-2 rounded-lg border border-dashed p-3"
          >
            <div className="flex flex-col gap-1">
              <Label htmlFor="titulo" className="text-xs">
                Novo resultado-chave
              </Label>
              <Input id="titulo" name="titulo" required className="h-8 w-48 text-sm" />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="valor_inicial" className="text-xs">
                De
              </Label>
              <Input id="valor_inicial" name="valor_inicial" type="number" step="any" className="h-8 w-24 text-sm" />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="valor_alvo" className="text-xs">
                Para
              </Label>
              <Input id="valor_alvo" name="valor_alvo" type="number" step="any" required className="h-8 w-24 text-sm" />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="unidade" className="text-xs">
                Unidade
              </Label>
              <Input id="unidade" name="unidade" className="h-8 w-24 text-sm" />
            </div>
            <SubmitButton size="sm" variant="outline" pendingText="Criando…">
              Adicionar
            </SubmitButton>
          </form>
        </section>

        <form action={excluirObjetivo.bind(null, ciclo?.id ?? "", objetivo.id)} className="border-t pt-4">
          <Button type="submit" variant="ghost" size="sm" className="text-destructive">
            Excluir objetivo
          </Button>
        </form>
      </div>
    </AppShell>
  );
}
