import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { buttonVariants } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import {
  DIAS_SEMANA,
  MESES,
  dateKey,
  getMonthGrid,
  mesAnterior,
  paramDoMes,
  proximoMes,
} from "@/lib/calendar";

function corDaTarefa(status: string) {
  if (status === "concluida") return "bg-muted text-muted-foreground line-through";
  if (status === "bloqueada") return "bg-destructive/10 text-destructive";
  return "bg-primary/10 text-primary";
}

export default async function CalendarioPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  const params = await searchParams;
  const hoje = new Date();

  const [anoParam, mesParam] = (params.mes ?? paramDoMes(hoje.getFullYear(), hoje.getMonth() + 1))
    .split("-")
    .map(Number);

  const dias = getMonthGrid(anoParam, mesParam);
  const inicio = dateKey(dias[0]);
  const fim = dateKey(dias[dias.length - 1]);

  const supabase = await createClient();
  const { data: tarefas } = await supabase
    .from("tasks")
    .select("id, titulo, status, prazo")
    .gte("prazo", inicio)
    .lte("prazo", fim)
    .order("titulo");

  const porDia = new Map<string, NonNullable<typeof tarefas>>();
  for (const t of tarefas ?? []) {
    if (!t.prazo) continue;
    const lista = porDia.get(t.prazo) ?? [];
    lista.push(t);
    porDia.set(t.prazo, lista);
  }

  const anterior = mesAnterior(anoParam, mesParam);
  const proximo = proximoMes(anoParam, mesParam);
  const mesAtualParam = paramDoMes(hoje.getFullYear(), hoje.getMonth() + 1);
  const hojeKey = dateKey(hoje);

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Rotinas</h1>
            <div className="mt-1 flex gap-4 text-sm">
              <Link href="/rotinas" className="text-muted-foreground hover:text-foreground">
                Lista
              </Link>
              <Link href="/rotinas/calendario" className="font-medium text-foreground">
                Calendário
              </Link>
            </div>
          </div>
          <Link href="/rotinas/nova" className={buttonVariants()}>
            Nova tarefa
          </Link>
        </div>

        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">
            {MESES[mesParam - 1]} {anoParam}
          </h2>
          <div className="flex gap-2">
            <Link
              href={`/rotinas/calendario?mes=${paramDoMes(anterior.year, anterior.month)}`}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              ← Anterior
            </Link>
            <Link
              href={`/rotinas/calendario?mes=${mesAtualParam}`}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              Hoje
            </Link>
            <Link
              href={`/rotinas/calendario?mes=${paramDoMes(proximo.year, proximo.month)}`}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              Próximo →
            </Link>
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className="grid min-w-[760px] grid-cols-7 gap-px overflow-hidden rounded-lg border bg-border text-sm">
            {DIAS_SEMANA.map((d) => (
              <div
                key={d}
                className="bg-muted/50 px-2 py-1.5 text-center text-xs font-medium text-muted-foreground"
              >
                {d}
              </div>
            ))}

            {dias.map((dia) => {
              const key = dateKey(dia);
              const noMesAtual = dia.getMonth() + 1 === mesParam;
              const ehHoje = key === hojeKey;
              const tarefasDoDia = porDia.get(key) ?? [];

              return (
                <div
                  key={key}
                  className={`flex min-h-[92px] flex-col gap-1 bg-background p-1.5 ${noMesAtual ? "" : "opacity-40"}`}
                >
                  <span
                    className={
                      ehHoje
                        ? "flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground"
                        : "text-xs text-muted-foreground"
                    }
                  >
                    {dia.getDate()}
                  </span>

                  <div className="flex flex-col gap-0.5">
                    {tarefasDoDia.slice(0, 3).map((t) => (
                      <Link
                        key={t.id}
                        href={`/rotinas/${t.id}`}
                        className={`truncate rounded px-1 py-0.5 text-[11px] hover:underline ${corDaTarefa(t.status)}`}
                      >
                        {t.titulo}
                      </Link>
                    ))}
                    {tarefasDoDia.length > 3 && (
                      <span className="text-[11px] text-muted-foreground">
                        +{tarefasDoDia.length - 3} mais
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
