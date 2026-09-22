import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { criarEventoCalendario, excluirEventoCalendario } from "@/app/clientes/actions";

type Membro = { id: string; nome: string | null; email: string | null };

/** Calendario mensal da aba Conteudo -- mesma grade/navegacao de
 * `/rotinas/calendario`, só que sobre `calendar_events` filtrado por
 * `client_id` em vez de `tasks`. Server Component: a navegação de mês
 * é feita por link (recarrega a página), a troca de aba continua sem
 * perder estado porque só a URL muda, não o componente `ClientTabs`. */
export async function ClientCalendar({
  clientId,
  mes,
  membros,
}: {
  clientId: string;
  mes: string | undefined;
  membros: Membro[];
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
    .select("id, titulo, tipo, data, horario")
    .eq("client_id", clientId)
    .gte("data", inicio)
    .lte("data", fim)
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
  const linkMes = (param: string) => `?tab=conteudo&mes=${param}`;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">
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

      <div className="overflow-x-auto">
        <div className="grid min-w-[640px] grid-cols-7 gap-px overflow-hidden rounded-lg border bg-border text-sm">
          {DIAS_SEMANA.map((d) => (
            <div key={d} className="bg-muted/50 px-2 py-1.5 text-center text-xs font-medium text-muted-foreground">
              {d}
            </div>
          ))}

          {dias.map((dia) => {
            const key = dateKey(dia);
            const noMesAtual = dia.getMonth() + 1 === mesNumero;
            const ehHoje = key === hojeKey;
            const eventosDoDia = porDia.get(key) ?? [];

            return (
              <div key={key} className={`flex min-h-[80px] flex-col gap-1 bg-background p-1.5 ${noMesAtual ? "" : "opacity-40"}`}>
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
                  {eventosDoDia.slice(0, 3).map((evento) => (
                    <span
                      key={evento.id}
                      className="truncate rounded bg-primary/10 px-1 py-0.5 text-[11px] text-primary"
                      title={evento.titulo}
                    >
                      {evento.horario ? `${evento.horario.slice(0, 5)} · ${evento.titulo}` : evento.titulo}
                    </span>
                  ))}
                  {eventosDoDia.length > 3 && (
                    <span className="text-[11px] text-muted-foreground">+{eventosDoDia.length - 3} mais</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <details className="rounded-lg border p-3">
        <summary className="cursor-pointer text-sm font-medium">Novo evento</summary>
        <form action={criarEventoCalendario.bind(null, clientId)} className="mt-3 flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="titulo-evento">Título</Label>
              <Input id="titulo-evento" name="titulo" required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="tipo-evento">Tipo</Label>
              <Input id="tipo-evento" name="tipo" placeholder="ex: gravação, reunião" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="data-evento">Data</Label>
              <Input id="data-evento" name="data" type="date" required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="horario-evento">Horário (opcional)</Label>
              <Input id="horario-evento" name="horario" type="time" />
            </div>
            <div className="col-span-2 flex flex-col gap-1.5">
              <Label htmlFor="responsavel-evento">Responsável</Label>
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
          <SubmitButton size="sm" className="self-start" pendingText="Criando…">
            Criar evento
          </SubmitButton>
        </form>
      </details>

      {(eventos ?? []).length > 0 && (
        <div className="flex flex-col gap-2">
          <h4 className="text-sm font-semibold text-muted-foreground">Eventos deste mês</h4>
          {(eventos ?? []).map((evento) => (
            <div key={evento.id} className="flex items-center justify-between gap-3 rounded-md border p-2 text-sm">
              <span>
                {new Date(`${evento.data}T00:00:00`).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                {evento.horario && ` · ${evento.horario.slice(0, 5)}`} — {evento.titulo}
                {evento.tipo && <span className="ml-1 text-muted-foreground">({evento.tipo})</span>}
              </span>
              <form action={excluirEventoCalendario.bind(null, evento.id, clientId)}>
                <Button type="submit" size="sm" variant="ghost" className="text-destructive">
                  Excluir
                </Button>
              </form>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
