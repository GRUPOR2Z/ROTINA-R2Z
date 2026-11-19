import Link from "next/link";
import { Check, FileDown, MessageSquareWarning } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SelectField } from "@/components/forms/select-field";
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
import { FORMATOS, REDES, STATUS_POST, infoStatus, rotuloRedeFormato } from "@/lib/conteudo";
import { CORES_TAREFA, infoCor } from "@/lib/task-colors";
import { atualizarEventoCalendario, criarEventoCalendario, excluirEventoCalendario } from "@/app/clientes/actions";
import { responderPost } from "@/app/portal/actions";

type Membro = { id: string; nome: string | null; email: string | null };

type Post = {
  id: string;
  titulo: string;
  tipo: string | null;
  data: string;
  horario: string | null;
  cor: string | null;
  rede: string | null;
  formato: string | null;
  status: string;
  responsavel_id: string | null;
  comentario_cliente: string | null;
  respondido_em: string | null;
};

/** Calendário de conteúdo do cliente (calendar_events por client_id).
 *  - modo "equipe": página interna do cliente, cria/edita/exclui posts;
 *  - modo "portal": o que o cliente vê, só leitura + aprovar/pedir ajuste
 *    nos posts "Aguardando aprovação".
 * Server Component: a navegação de mês é por link (?mes=AAAA-MM). */
export async function ClientCalendar({
  clientId,
  mes,
  membros = [],
  modo = "portal",
  aba = "conteudo",
}: {
  clientId: string;
  mes: string | undefined;
  membros?: Membro[];
  modo?: "equipe" | "portal";
  /** valor de ?tab= mantido nos links de mês */
  aba?: string;
}) {
  const editavel = modo === "equipe";
  const hoje = new Date();
  const mesParam = mes && /^\d{4}-\d{2}$/.test(mes) ? mes : paramDoMes(hoje.getFullYear(), hoje.getMonth() + 1);
  const [ano, mesNumero] = mesParam.split("-").map(Number);

  const dias = getMonthGrid(ano, mesNumero);
  const inicio = dateKey(dias[0]);
  const fim = dateKey(dias[dias.length - 1]);

  const supabase = await createClient();
  const { data } = await supabase
    .from("calendar_events")
    .select("id, titulo, tipo, data, horario, cor, rede, formato, status, responsavel_id, comentario_cliente, respondido_em")
    .eq("client_id", clientId)
    .gte("data", inicio)
    .lte("data", fim)
    .order("data")
    .order("horario", { ascending: true, nullsFirst: false })
    .order("titulo");
  const eventos = (data ?? []) as Post[];

  const porDia = new Map<string, Post[]>();
  for (const evento of eventos) {
    const lista = porDia.get(evento.data) ?? [];
    lista.push(evento);
    porDia.set(evento.data, lista);
  }

  const anterior = mesAnterior(ano, mesNumero);
  const proximo = proximoMes(ano, mesNumero);
  const mesAtualParam = paramDoMes(hoje.getFullYear(), hoje.getMonth() + 1);
  const hojeKey = dateKey(hoje);
  const linkMes = (param: string) => `?tab=${aba}&mes=${param}`;
  // lista abaixo da grade: só os posts do mês exibido
  const doMes = eventos.filter((e) => Number(e.data.slice(5, 7)) === mesNumero);
  const aguardando = doMes.filter((e) => e.status === "em_aprovacao").length;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-brand-900">
          {MESES[mesNumero - 1]} {ano}
        </h3>
        <div className="flex flex-wrap gap-2">
          <Link href={linkMes(paramDoMes(anterior.year, anterior.month))} className={buttonVariants({ variant: "outline", size: "sm" })}>
            ← Anterior
          </Link>
          <Link href={linkMes(mesAtualParam)} className={buttonVariants({ variant: "outline", size: "sm" })}>
            Hoje
          </Link>
          <Link href={linkMes(paramDoMes(proximo.year, proximo.month))} className={buttonVariants({ variant: "outline", size: "sm" })}>
            Próximo →
          </Link>
          <a
            href={`/portal/${clientId}/imprimir?mes=${mesParam}`}
            target="_blank"
            rel="noreferrer"
            className={buttonVariants({ size: "sm" })}
          >
            <FileDown size={14} /> Exportar PDF
          </a>
        </div>
      </div>

      {aguardando > 0 && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {modo === "portal"
            ? `${aguardando} ${aguardando === 1 ? "post aguarda" : "posts aguardam"} a sua aprovação — veja a lista abaixo.`
            : `${aguardando} ${aguardando === 1 ? "post aguarda" : "posts aguardam"} aprovação do cliente.`}
        </p>
      )}

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
                    const st = infoStatus(evento.status);
                    return (
                      <div
                        key={evento.id}
                        className={`rounded-md px-1.5 py-1 text-[11px] leading-tight ${st.chip}`}
                        title={[evento.titulo, meta, st.rotulo].filter(Boolean).join(" — ")}
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

      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
        {STATUS_POST.map((s) => (
          <span key={s.valor} className="inline-flex items-center gap-1.5">
            <span className={`size-2.5 rounded-full ${s.dot}`} /> {s.rotulo}
          </span>
        ))}
      </div>

      {editavel && (
        <details className="rounded-xl border border-border bg-card p-4">
          <summary className="cursor-pointer text-sm font-medium text-brand-900">+ Novo post no calendário</summary>
          <form action={criarEventoCalendario.bind(null, clientId)} className="mt-4 flex flex-col gap-3">
            <CamposPost prefixo="novo" membros={membros} />
            <SubmitButton size="sm" className="self-start" pendingText="Salvando…">
              Adicionar ao calendário
            </SubmitButton>
          </form>
        </details>
      )}

      <section className="flex flex-col gap-2">
        <h4 className="text-sm font-semibold text-brand-900">
          Posts de {MESES[mesNumero - 1].toLowerCase()}{" "}
          {doMes.length > 0 && <span className="font-normal text-muted-foreground">({doMes.length})</span>}
        </h4>
        {doMes.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border bg-card p-4 text-sm text-muted-foreground">
            Nenhum post programado para este mês.
          </p>
        ) : (
          <div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
            {doMes.map((evento) => (
              <LinhaPost key={evento.id} evento={evento} clientId={clientId} modo={modo} membros={membros} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function LinhaPost({
  evento,
  clientId,
  modo,
  membros,
}: {
  evento: Post;
  clientId: string;
  modo: "equipe" | "portal";
  membros: Membro[];
}) {
  const data = new Date(`${evento.data}T00:00:00`);
  const meta = rotuloRedeFormato(evento.rede, evento.formato);
  const st = infoStatus(evento.status);

  return (
    <div className="flex flex-col gap-3 p-3 text-sm">
      <div className="flex items-start gap-4">
        <div className="w-12 shrink-0 text-center">
          <p className="text-lg leading-none font-semibold text-brand-900">{data.getDate()}</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground uppercase">
            {data.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "")}
          </p>
        </div>
        <span className={`mt-0.5 h-9 w-1 shrink-0 rounded-full ${evento.cor ? (infoCor(evento.cor)?.dot ?? st.dot) : st.dot}`} />
        <div className="min-w-0 flex-1">
          <p className="font-medium text-foreground">{evento.titulo}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {[evento.horario?.slice(0, 5), meta, evento.tipo].filter(Boolean).join(" · ") || "Dia inteiro"}
          </p>
        </div>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${st.chip}`}>{st.rotulo}</span>
      </div>

      {evento.comentario_cliente && (
        <p className="ml-16 flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-900">
          <MessageSquareWarning size={14} className="mt-0.5 shrink-0" />
          <span>
            <span className="font-medium">Comentário do cliente:</span> {evento.comentario_cliente}
          </span>
        </p>
      )}

      {evento.status === "em_aprovacao" && (
        <div className="ml-16 flex flex-col gap-2 rounded-lg border border-amber-200 bg-amber-50/60 p-3">
          <form action={responderPost.bind(null, evento.id, clientId, true)}>
            <SubmitButton size="sm" pendingText="Aprovando…">
              <Check size={14} /> Aprovar
            </SubmitButton>
          </form>
          <form action={responderPost.bind(null, evento.id, clientId, false)} className="flex flex-col gap-2 sm:flex-row sm:items-start">
            <Textarea
              name="comentario"
              required
              rows={1}
              placeholder="Ou descreva o ajuste que você quer…"
              className="min-h-9 flex-1 bg-white text-sm"
            />
            <SubmitButton size="sm" variant="outline" pendingText="Enviando…">
              Pedir ajuste
            </SubmitButton>
          </form>
        </div>
      )}

      {modo === "equipe" && (
        <div className="ml-16 flex items-center gap-1">
          <details className="group flex-1">
            <summary className="inline-flex cursor-pointer items-center rounded-md px-2 py-1 text-xs font-medium text-brand-700 hover:bg-brand-50">
              Editar
            </summary>
            <form
              action={atualizarEventoCalendario.bind(null, evento.id, clientId)}
              className="mt-2 flex flex-col gap-3 rounded-lg border border-border p-3"
            >
              <CamposPost prefixo={evento.id} membros={membros} post={evento} />
              <SubmitButton size="sm" className="self-start" pendingText="Salvando…">
                Salvar alterações
              </SubmitButton>
            </form>
          </details>
          <form action={excluirEventoCalendario.bind(null, evento.id, clientId)} className="self-start">
            <Button type="submit" size="sm" variant="ghost" className="h-7 text-xs text-destructive">
              Excluir
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}

/** Campos do post, usados ao criar e ao editar. */
function CamposPost({ prefixo, membros, post }: { prefixo: string; membros: Membro[]; post?: Post }) {
  const id = (campo: string) => `${campo}-${prefixo}`;
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="flex flex-col gap-1.5 sm:col-span-2">
        <Label htmlFor={id("titulo")}>Tema do conteúdo</Label>
        <Input
          id={id("titulo")}
          name="titulo"
          required
          defaultValue={post?.titulo}
          placeholder="ex: 3 erros ao escolher um plano de saúde"
        />
      </div>
      <SelectField
        name="rede"
        label="Rede social"
        options={REDES.map((r) => ({ value: r.valor, label: r.rotulo }))}
        defaultValue={post?.rede}
        emptyLabel="—"
        className="flex flex-col gap-1.5"
      />
      <SelectField
        name="formato"
        label="Formato"
        options={FORMATOS.map((f) => ({ value: f.valor, label: f.rotulo }))}
        defaultValue={post?.formato}
        emptyLabel="—"
        className="flex flex-col gap-1.5"
      />
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={id("data")}>Data de postagem</Label>
        <Input id={id("data")} name="data" type="date" required defaultValue={post?.data} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={id("horario")}>Horário (opcional)</Label>
        <Input id={id("horario")} name="horario" type="time" defaultValue={post?.horario?.slice(0, 5) ?? undefined} />
      </div>
      <SelectField
        name="status"
        label="Status"
        options={STATUS_POST.map((s) => ({ value: s.valor, label: s.rotulo }))}
        defaultValue={post?.status ?? "planejado"}
        className="flex flex-col gap-1.5"
      />
      <SelectField
        name="responsavel_id"
        label="Responsável (interno)"
        options={membros.map((m) => ({ value: m.id, label: m.nome || m.email || "—" }))}
        defaultValue={post?.responsavel_id}
        emptyLabel="Ninguém"
        className="flex flex-col gap-1.5"
      />
      <SelectField
        name="cor"
        label="Cor da marcação (opcional)"
        options={CORES_TAREFA.map((c) => ({ value: c.key, label: c.label }))}
        defaultValue={post?.cor}
        emptyLabel="Pela cor do status"
        className="flex flex-col gap-1.5"
      />
    </div>
  );
}
