import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ColorSelect } from "@/components/rotinas/color-select";
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
import { FORMATOS, REDES, rotuloRedeFormato } from "@/lib/conteudo";
import { infoCor } from "@/lib/task-colors";
import { criarEventoCalendario, excluirEventoCalendario } from "@/app/clientes/actions";

type Membro = { id: string; nome: string | null; email: string | null };

/** Calendário de conteúdo do cliente (calendar_events filtrado por
 * client_id). Usado em dois lugares:
 *  - na página interna do cliente (aba Conteúdo), com `editavel`;
 *  - no portal do cliente (/portal/[id]), só leitura.
 * Server Component: a navegação de mês é por link (?mes=AAAA-MM). */
export async function ClientCalendar({
  clientId,
  mes,
  membros = [],
  editavel = false,
  aba = "conteudo",
}: {
  clientId: string;
  mes: string | undefined;
  membros?: Membro[];
  editavel?: boolean;
  /** valor de ?tab= mantido nos links de mês */
  aba?: string;
}) {
  const hoje = new Date();
  const [ano, mesNumero] = (mes ?? paramDoMes(hoje.getFullYear(), hoje.getMonth() + 1))
    .split("-")
    .map(Number);

  const dias = getMonthGrid(ano, mesNumero);
  const inicio = dateKey(dias[0]);
  const fim = dateKey(dias[dias.length - 1]);

  const supabase = await createClient();
  const { data: eventos } = await supabase
    .from("calendar_events")
    .select("id, titulo, tipo, data, horario, cor, rede, formato")
    .eq("client_id", clientId)
    .gte("data", inicio)
    .lte("data", fim)
    .order("data")
    .order("horario", { ascending: true, nullsFirst: false })
    .order("titulo");

  const porDia = new Map<string, NonNullable<typeof eventos>>();
  for (const evento of eventos ?? []) {
    const lista = porDia.get(evento.data) ?? [];
    lista.push(evento);
    porDia.set(evento.data, lista);
  }

  const anterior = mesAnterior(ano, mesNumero);
  const proximo = proximoMes(ano, mesNumero);
  const mesAtualParam = paramDoMes(hoje.getFullYear(), hoje.getMonth() + 1);
  const hojeKey = dateKey(hoje);
  const linkMes = (param: string) => `?tab=${aba}&mes=${param}`;
  // lista abaixo da grade: só os posts do mês exibido (a grade mostra
  // também os dias de borda dos meses vizinhos)
  const doMes = (eventos ?? []).filter((e) => Number(e.data.slice(5, 7)) === mesNumero);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-brand-900">
          {MESES[mesNumero - 1]} {ano}
        </h3>
        <div className="flex gap-2">
          <Link href={linkMes(paramDoMes(anterior.year, anterior.month))} className={buttonVariants({ variant: "outline", size: "sm" })}>
            ← Anterior
          </Link>
          <Link href={linkMes(mesAtualParam)} className={buttonVariants({ variant: "outline", size: "sm" })}>
            Hoje
          </Link>
          <Link href={linkMes(paramDoMes(proximo.year, proximo.month))} className={buttonVariants({ variant: "outline", size: "sm" })}>
            Próximo →
          </Link>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <div className="grid min-w-[720px] grid-cols-7 gap-px bg-border text-sm">
          {DIAS_SEMANA.map((d) => (
            <div key={d} className="bg-brand-50 px-2 py-2 text-center text-xs font-medium text-brand-700">
              {d}
            </div>
          ))}

          {dias.map((dia) => {
            const key = dateKey(dia);
            const noMesAtual = dia.getMonth() + 1 === mesNumero;
            const ehHoje = key === hojeKey;
            const eventosDoDia = porDia.get(key) ?? [];

            return (
              <div key={key} className={`flex min-h-[104px] flex-col gap-1 bg-card p-1.5 ${noMesAtual ? "" : "opacity-40"}`}>
                <span
                  className={
                    ehHoje
                      ? "flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground"
                      : "px-0.5 text-xs text-muted-foreground"
                  }
                >
                  {dia.getDate()}
                </span>
                <div className="flex flex-col gap-1">
                  {eventosDoDia.slice(0, 3).map((evento) => {
                    const meta = rotuloRedeFormato(evento.rede, evento.formato);
                    return (
                      <div
                        key={evento.id}
                        className={`rounded-md px-1.5 py-1 text-[11px] leading-tight ${infoCor(evento.cor)?.chip ?? "bg-brand-100 text-brand-900"}`}
                        title={[evento.titulo, meta].filter(Boolean).join(" — ")}
                      >
                        <p className="truncate font-medium">
                          {evento.horario ? `${evento.horario.slice(0, 5)} · ` : ""}
                          {evento.titulo}
                        </p>
                        {meta && <p className="truncate opacity-75">{meta}</p>}
                      </div>
                    );
                  })}
                  {eventosDoDia.length > 3 && (
                    <span className="px-0.5 text-[11px] text-muted-foreground">+{eventosDoDia.length - 3} mais</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {editavel && (
        <details className="rounded-xl border border-border bg-card p-4">
          <summary className="cursor-pointer text-sm font-medium text-brand-900">+ Novo post no calendário</summary>
          <form action={criarEventoCalendario.bind(null, clientId)} className="mt-4 flex flex-col gap-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <Label htmlFor="titulo-evento">Tema do conteúdo</Label>
                <Input id="titulo-evento" name="titulo" required placeholder="ex: 3 erros ao escolher um plano de saúde" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="rede-evento">Rede social</Label>
                <Select name="rede">
                  <SelectTrigger id="rede-evento" className="w-full">
                    <SelectValue placeholder="Selecionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {REDES.map((r) => (
                      <SelectItem key={r.valor} value={r.valor}>
                        {r.rotulo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="formato-evento">Formato</Label>
                <Select name="formato">
                  <SelectTrigger id="formato-evento" className="w-full">
                    <SelectValue placeholder="Selecionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {FORMATOS.map((f) => (
                      <SelectItem key={f.valor} value={f.valor}>
                        {f.rotulo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="data-evento">Data de postagem</Label>
                <Input id="data-evento" name="data" type="date" required />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="horario-evento">Horário (opcional)</Label>
                <Input id="horario-evento" name="horario" type="time" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="cor-evento">Cor</Label>
                <ColorSelect />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="responsavel-evento">Responsável (interno)</Label>
                <Select name="responsavel_id">
                  <SelectTrigger id="responsavel-evento" className="w-full">
                    <SelectValue placeholder="Selecionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {membros.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.nome || m.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <SubmitButton size="sm" className="self-start" pendingText="Salvando…">
              Adicionar ao calendário
            </SubmitButton>
          </form>
        </details>
      )}

      <section className="flex flex-col gap-2">
        <h4 className="text-sm font-semibold text-brand-900">
          Posts de {MESES[mesNumero - 1].toLowerCase()} {doMes.length > 0 && <span className="font-normal text-muted-foreground">({doMes.length})</span>}
        </h4>
        {doMes.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border bg-card p-4 text-sm text-muted-foreground">
            Nenhum post programado para este mês.
          </p>
        ) : (
          <div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
            {doMes.map((evento) => {
              const data = new Date(`${evento.data}T00:00:00`);
              const meta = rotuloRedeFormato(evento.rede, evento.formato);
              return (
                <div key={evento.id} className="flex items-center gap-4 p-3 text-sm">
                  <div className="w-14 shrink-0 text-center">
                    <p className="text-lg leading-none font-semibold text-brand-900">{data.getDate()}</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground uppercase">
                      {data.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "")}
                    </p>
                  </div>
                  <span className={`h-9 w-1 shrink-0 rounded-full ${infoCor(evento.cor)?.dot ?? "bg-brand-300"}`} />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground">{evento.titulo}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {[evento.horario?.slice(0, 5), meta, evento.tipo].filter(Boolean).join(" · ") || "Dia inteiro"}
                    </p>
                  </div>
                  {editavel && (
                    <form action={excluirEventoCalendario.bind(null, evento.id, clientId)}>
                      <Button type="submit" size="sm" variant="ghost" className="text-destructive">
                        Excluir
                      </Button>
                    </form>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
