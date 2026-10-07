import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader, SubNav } from "@/components/layout/page-header";
import { buttonVariants } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import {
  DIAS_SEMANA,
  MESES,
  dateKey,
  getMonthGrid,
  getWeekDays,
  parseDateKey,
  somarDias,
} from "@/lib/calendar";
import { infoCor } from "@/lib/task-colors";
import { cn } from "@/lib/utils";

type Visao = "mes" | "semana" | "dia";

type TarefaCal = {
  id: string;
  titulo: string;
  status: string;
  prazo: string | null;
  horario: string | null;
  cor: string | null;
};

function corDaTarefa(status: string, cor: string | null) {
  const base = infoCor(cor)?.chip ?? "bg-primary/10 text-primary";
  if (status === "concluida") return `${base} line-through opacity-60`;
  if (status === "bloqueada") return `${base} ring-1 ring-inset ring-destructive`;
  return base;
}

function rotuloPeriodo(visao: Visao, ref: Date, dias: Date[]) {
  if (visao === "mes") return `${MESES[ref.getMonth()]} ${ref.getFullYear()}`;
  if (visao === "dia") {
    return ref.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
  }
  const ini = dias[0];
  const fim = dias[dias.length - 1];
  const fmt = (d: Date) => d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  return `${fmt(ini)} – ${fmt(fim)} ${fim.getFullYear()}`;
}

function navegar(visao: Visao, ref: Date, direcao: -1 | 1) {
  if (visao === "mes") return new Date(ref.getFullYear(), ref.getMonth() + direcao, 1);
  return somarDias(ref, visao === "semana" ? 7 * direcao : direcao);
}

export default async function CalendarioPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string; visao?: string; data?: string }>;
}) {
  const params = await searchParams;
  const hoje = new Date();
  const visao: Visao = params.visao === "semana" || params.visao === "dia" ? params.visao : "mes";

  // compatibilidade com links antigos (?mes=2026-10)
  let ref = hoje;
  if (params.data && /^\d{4}-\d{2}-\d{2}$/.test(params.data)) ref = parseDateKey(params.data);
  else if (params.mes && /^\d{4}-\d{2}$/.test(params.mes)) ref = parseDateKey(`${params.mes}-01`);

  const dias =
    visao === "mes" ? getMonthGrid(ref.getFullYear(), ref.getMonth() + 1) : visao === "semana" ? getWeekDays(ref) : [ref];

  const supabase = await createClient();
  const { data: tarefas } = await supabase
    .from("tasks")
    .select("id, titulo, status, prazo, horario, cor")
    .gte("prazo", dateKey(dias[0]))
    .lte("prazo", dateKey(dias[dias.length - 1]))
    .order("horario", { ascending: true, nullsFirst: false })
    .order("titulo");

  const porDia = new Map<string, TarefaCal[]>();
  for (const t of tarefas ?? []) {
    if (!t.prazo) continue;
    const lista = porDia.get(t.prazo) ?? [];
    lista.push(t);
    porDia.set(t.prazo, lista);
  }
  // com hora definida primeiro (ordenadas por horario), depois as de dia inteiro
  for (const lista of porDia.values()) {
    lista.sort((a, b) => {
      if (a.horario && b.horario) return a.horario.localeCompare(b.horario);
      if (a.horario) return -1;
      if (b.horario) return 1;
      return 0;
    });
  }

  const hojeKey = dateKey(hoje);
  const href = (v: Visao, d: Date) => `/rotinas/calendario?visao=${v}&data=${dateKey(d)}`;

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Rotinas"
          actions={
            <Link href="/rotinas/nova" className={buttonVariants()}>
              Nova tarefa
            </Link>
          }
        >
          <SubNav
            ativo="/rotinas/calendario"
            items={[
              { href: "/rotinas", label: "Lista" },
              { href: "/rotinas/calendario", label: "Calendário" },
            ]}
          />
        </PageHeader>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-medium first-letter:uppercase">{rotuloPeriodo(visao, ref, dias)}</h2>
          <div className="flex flex-wrap gap-2">
            <div className="flex overflow-hidden rounded-lg border">
              {(["dia", "semana", "mes"] as const).map((v) => (
                <Link
                  key={v}
                  href={href(v, ref)}
                  className={cn(
                    "px-3 py-1 text-sm",
                    v === visao ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted",
                  )}
                >
                  {v === "dia" ? "Dia" : v === "semana" ? "Semana" : "Mês"}
                </Link>
              ))}
            </div>
            <Link href={href(visao, navegar(visao, ref, -1))} className={buttonVariants({ variant: "outline", size: "sm" })}>
              ← Anterior
            </Link>
            <Link href={href(visao, hoje)} className={buttonVariants({ variant: "outline", size: "sm" })}>
              Hoje
            </Link>
            <Link href={href(visao, navegar(visao, ref, 1))} className={buttonVariants({ variant: "outline", size: "sm" })}>
              Próximo →
            </Link>
          </div>
        </div>

        {visao === "mes" && (
          <div className="overflow-x-auto">
            <div className="grid min-w-[760px] grid-cols-7 gap-px overflow-hidden rounded-lg border bg-border text-sm">
              {DIAS_SEMANA.map((d) => (
                <div key={d} className="bg-muted/50 px-2 py-1.5 text-center text-xs font-medium text-muted-foreground">
                  {d}
                </div>
              ))}

              {dias.map((dia) => {
                const key = dateKey(dia);
                const noMesAtual = dia.getMonth() === ref.getMonth();
                const tarefasDoDia = porDia.get(key) ?? [];

                return (
                  <div
                    key={key}
                    className={`flex min-h-[92px] flex-col gap-1 bg-background p-1.5 ${noMesAtual ? "" : "opacity-40"}`}
                  >
                    <Link
                      href={href("dia", dia)}
                      className={
                        key === hojeKey
                          ? "flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground"
                          : "text-xs text-muted-foreground hover:text-foreground"
                      }
                    >
                      {dia.getDate()}
                    </Link>

                    <div className="flex flex-col gap-0.5">
                      {tarefasDoDia.slice(0, 3).map((t) => (
                        <ChipTarefa key={t.id} tarefa={t} />
                      ))}
                      {tarefasDoDia.length > 3 && (
                        <Link href={href("dia", dia)} className="text-[11px] text-muted-foreground hover:underline">
                          +{tarefasDoDia.length - 3} mais
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {visao === "semana" && (
          <div className="overflow-x-auto">
            <div className="grid min-w-[760px] grid-cols-7 gap-px overflow-hidden rounded-lg border bg-border text-sm">
              {dias.map((dia) => {
                const key = dateKey(dia);
                const tarefasDoDia = porDia.get(key) ?? [];
                return (
                  <div key={key} className="flex min-h-[320px] flex-col gap-1 bg-background p-2">
                    <Link
                      href={href("dia", dia)}
                      className={cn(
                        "mb-1 flex items-baseline gap-1 text-xs hover:underline",
                        key === hojeKey ? "font-semibold text-primary" : "text-muted-foreground",
                      )}
                    >
                      {DIAS_SEMANA[dia.getDay()]} <span className="text-base">{dia.getDate()}</span>
                    </Link>
                    {tarefasDoDia.map((t) => (
                      <ChipTarefa key={t.id} tarefa={t} />
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {visao === "dia" && <ListaDoDia tarefas={porDia.get(dateKey(ref)) ?? []} />}
      </div>
    </AppShell>
  );
}

function ChipTarefa({ tarefa: t }: { tarefa: TarefaCal }) {
  return (
    <Link
      href={`/rotinas/${t.id}`}
      className={`truncate rounded px-1 py-0.5 text-[11px] hover:underline ${corDaTarefa(t.status, t.cor)}`}
    >
      {t.horario ? `${t.horario.slice(0, 5)} · ${t.titulo}` : t.titulo}
    </Link>
  );
}

function ListaDoDia({ tarefas }: { tarefas: TarefaCal[] }) {
  if (tarefas.length === 0) {
    return <p className="rounded-lg border border-dashed py-12 text-center text-sm text-muted-foreground">Nada agendado neste dia.</p>;
  }
  const comHora = tarefas.filter((t) => t.horario);
  const diaInteiro = tarefas.filter((t) => !t.horario);

  return (
    <div className="flex flex-col gap-4">
      {diaInteiro.length > 0 && (
        <div className="flex flex-col gap-1">
          <p className="text-xs font-medium text-muted-foreground">Dia inteiro</p>
          {diaInteiro.map((t) => (
            <Link key={t.id} href={`/rotinas/${t.id}`} className={`rounded-md px-3 py-2 text-sm hover:underline ${corDaTarefa(t.status, t.cor)}`}>
              {t.titulo}
            </Link>
          ))}
        </div>
      )}
      {comHora.length > 0 && (
        <ol className="flex flex-col gap-1 border-l pl-4">
          {comHora.map((t) => (
            <li key={t.id} className="flex items-center gap-3">
              <span className="w-12 shrink-0 text-xs tabular-nums text-muted-foreground">{t.horario!.slice(0, 5)}</span>
              <Link href={`/rotinas/${t.id}`} className={`flex-1 rounded-md px-3 py-2 text-sm hover:underline ${corDaTarefa(t.status, t.cor)}`}>
                {t.titulo}
              </Link>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
