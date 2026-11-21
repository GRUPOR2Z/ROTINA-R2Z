import { Check, ChevronRight, FileDown, FileText, MessageSquareWarning, Pencil, Trash2 } from "lucide-react";
import { PostDialogs, PostTrigger, type PostDetalhe } from "@/components/clientes/post-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect } from "@/components/forms/native-select";
import { MonthNav } from "@/components/layout/month-nav";
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
import {
  FORMATOS,
  LEGENDA_FORMATOS,
  REDES,
  STATUS_POST,
  alertaStatus,
  corDoFormato,
  infoStatus,
  rotuloRedeFormato,
} from "@/lib/conteudo";
import { atualizarEventoCalendario, criarEventoCalendario, excluirEventoCalendario } from "@/app/clientes/actions";
import { responderPost } from "@/app/portal/actions";

type Membro = { id: string; nome: string | null; email: string | null };

/** Corta da grade as semanas que só têm dias do mês vizinho. */
export function semanasDoMes(dias: Date[], mes: number) {
  const out: Date[] = [];
  for (let i = 0; i < dias.length; i += 7) {
    const semana = dias.slice(i, i + 7);
    if (semana.some((d) => d.getMonth() + 1 === mes)) out.push(...semana);
  }
  return out;
}

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
  roteiro: string | null;
};

function quando(post: Post) {
  const data = new Date(`${post.data}T00:00:00`).toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  return post.horario ? `${data} · ${post.horario.slice(0, 5)}` : data;
}

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

  // só as semanas que têm dias do mês (a grade fixa tem 6 linhas)
  const dias = semanasDoMes(getMonthGrid(ano, mesNumero), mesNumero);
  const inicio = dateKey(dias[0]);
  const fim = dateKey(dias[dias.length - 1]);

  const supabase = await createClient();
  const { data } = await supabase
    .from("calendar_events")
    .select("id, titulo, tipo, data, horario, cor, rede, formato, status, responsavel_id, comentario_cliente, respondido_em, roteiro")
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

  // dados da janela de cada post (inclui os dias de borda da grade)
  const nomeMembro = new Map(membros.map((m) => [m.id, m.nome || m.email]));
  const detalhes: PostDetalhe[] = eventos.map((e) => {
    const st = infoStatus(e.status);
    return {
      id: e.id,
      titulo: e.titulo,
      quando: quando(e),
      meta: [rotuloRedeFormato(e.rede, e.formato), e.tipo].filter(Boolean).join(" · ") || null,
      statusRotulo: st.rotulo,
      statusChip: st.chip,
      roteiro: e.roteiro,
      comentarioCliente: e.comentario_cliente,
      responsavel: editavel && e.responsavel_id ? (nomeMembro.get(e.responsavel_id) ?? null) : null,
    };
  });
  const extras: Record<string, React.ReactNode> = Object.fromEntries(
    eventos.map((e) => [
      e.id,
      editavel ? (
        <EdicaoPost key={e.id} evento={e} clientId={clientId} membros={membros} />
      ) : e.status === "em_aprovacao" ? (
        <RespostaCliente key={e.id} evento={e} clientId={clientId} />
      ) : null,
    ]),
  );

  return (
    <PostDialogs posts={detalhes} extras={extras}>
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-brand-900">
          {MESES[mesNumero - 1]} {ano}
        </h3>
        <div className="flex flex-wrap items-center gap-2">
          <MonthNav
            anterior={linkMes(paramDoMes(anterior.year, anterior.month))}
            hoje={linkMes(mesAtualParam)}
            proximo={linkMes(paramDoMes(proximo.year, proximo.month))}
          />
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
            ? `${aguardando} ${aguardando === 1 ? "post aguarda" : "posts aguardam"} a sua aprovação — clique no post para revisar.`
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
                    const alerta = alertaStatus(evento.status);
                    return (
                      <PostTrigger
                        key={evento.id}
                        id={evento.id}
                        className={`w-full cursor-pointer rounded-md px-1.5 py-1 text-left text-[11px] leading-tight transition hover:brightness-95 hover:ring-1 hover:ring-brand-600/30 ${corDoFormato(evento.formato).chip}`}
                        title={[evento.titulo, meta, st.rotulo].filter(Boolean).join(" — ")}
                      >
                        <span className="flex items-center gap-1">
                          {alerta && <span className={`size-1.5 shrink-0 rounded-full ${alerta.dot}`} aria-label={alerta.rotulo} />}
                          <span className="truncate font-medium">
                            {evento.horario ? `${evento.horario.slice(0, 5)} · ` : ""}
                            {evento.titulo}
                          </span>
                          {evento.roteiro && <FileText size={10} className="shrink-0 opacity-60" aria-label="Tem roteiro" />}
                        </span>
                        {meta && <span className="block truncate opacity-75">{meta}</span>}
                      </PostTrigger>
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
        {LEGENDA_FORMATOS.map((f) => (
          <span key={f.valor} className="inline-flex items-center gap-1.5">
            <span className={`size-2.5 rounded-full ${f.dot}`} /> {f.rotulo}
          </span>
        ))}
        <span className="inline-flex items-center gap-1.5 border-l border-border pl-4">
          <span className="size-1.5 rounded-full bg-amber-500" /> aguardando aprovação
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-red-500" /> ajustes pedidos
        </span>
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
              <LinhaPost key={evento.id} evento={evento} modo={modo} />
            ))}
          </div>
        )}
      </section>
    </div>
    </PostDialogs>
  );
}

function LinhaPost({ evento, modo }: { evento: Post; modo: "equipe" | "portal" }) {
  const data = new Date(`${evento.data}T00:00:00`);
  const meta = rotuloRedeFormato(evento.rede, evento.formato);
  const st = infoStatus(evento.status);
  const aguardaCliente = evento.status === "em_aprovacao";

  return (
    <PostTrigger
      id={evento.id}
      className="flex w-full cursor-pointer items-start gap-4 p-3 text-left text-sm transition hover:bg-brand-50/60"
    >
      <span className="w-12 shrink-0 text-center">
        <span className="block text-lg leading-none font-semibold text-brand-900">{data.getDate()}</span>
        <span className="mt-0.5 block text-[11px] text-muted-foreground uppercase">
          {data.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "")}
        </span>
      </span>
      <span className={`mt-0.5 h-9 w-1 shrink-0 rounded-full ${corDoFormato(evento.formato).dot}`} />
      <span className="min-w-0 flex-1">
        <span className="block font-medium text-foreground">{evento.titulo}</span>
        <span className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
          <span>{[evento.horario?.slice(0, 5), meta, evento.tipo].filter(Boolean).join(" · ") || "Dia inteiro"}</span>
          {evento.roteiro && (
            <span className="inline-flex items-center gap-1 text-brand-700">
              <FileText size={12} /> roteiro
            </span>
          )}
          {evento.comentario_cliente && (
            <span className="inline-flex items-center gap-1 text-red-700">
              <MessageSquareWarning size={12} /> comentário do cliente
            </span>
          )}
        </span>
        {aguardaCliente && modo === "portal" && (
          <span className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-amber-100 px-2 py-1 text-xs font-medium text-amber-900">
            Clique para revisar e aprovar
          </span>
        )}
      </span>
      <span className="flex shrink-0 items-center gap-2">
        <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${st.chip}`}>{st.rotulo}</span>
        <ChevronRight size={16} className="text-muted-foreground" />
      </span>
    </PostTrigger>
  );
}

/** Dentro da janela do post (equipe): editar e excluir. */
function EdicaoPost({ evento, clientId, membros }: { evento: Post; clientId: string; membros: Membro[] }) {
  return (
    <section className="flex flex-col gap-3 border-t border-border pt-4">
      <details className="group" open={!evento.roteiro}>
        <summary className="inline-flex cursor-pointer items-center gap-1.5 text-sm font-medium text-brand-700 hover:text-brand-900">
          <Pencil size={14} /> {evento.roteiro ? "Editar post e roteiro" : "Editar post e escrever o roteiro"}
        </summary>
        <form action={atualizarEventoCalendario.bind(null, evento.id, clientId)} className="mt-3 flex flex-col gap-3">
          <CamposPost prefixo={evento.id} membros={membros} post={evento} />
          <SubmitButton size="sm" className="self-start" pendingText="Salvando…">
            Salvar alterações
          </SubmitButton>
        </form>
      </details>
      <form action={excluirEventoCalendario.bind(null, evento.id, clientId)} className="self-end">
        <Button type="submit" size="sm" variant="ghost" className="text-destructive">
          <Trash2 size={14} /> Excluir post
        </Button>
      </form>
    </section>
  );
}

/** Dentro da janela do post (portal): o cliente aprova ou pede ajuste. */
function RespostaCliente({ evento, clientId }: { evento: Post; clientId: string }) {
  return (
    <section className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50/70 p-4">
      <p className="text-sm font-medium text-amber-950">Este post aguarda a sua aprovação.</p>
      <form action={responderPost.bind(null, evento.id, clientId, true)}>
        <SubmitButton size="sm" pendingText="Aprovando…">
          <Check size={14} /> Aprovar
        </SubmitButton>
      </form>
      <form action={responderPost.bind(null, evento.id, clientId, false)} className="flex flex-col gap-2">
        <Textarea
          name="comentario"
          required
          rows={3}
          placeholder="Ou descreva o ajuste que você quer…"
          className="bg-white text-sm"
        />
        <SubmitButton size="sm" variant="outline" className="self-start" pendingText="Enviando…">
          Pedir ajuste
        </SubmitButton>
      </form>
    </section>
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
      <NativeSelect
        id={id("rede")}
        name="rede"
        label="Rede social"
        options={REDES.map((r) => ({ value: r.valor, label: r.rotulo }))}
        defaultValue={post?.rede}
        emptyLabel="—"
      />
      <NativeSelect
        id={id("formato")}
        name="formato"
        label="Formato (define a cor no calendário)"
        options={FORMATOS.map((f) => ({ value: f.valor, label: f.rotulo }))}
        defaultValue={post?.formato}
        emptyLabel="—"
      />
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={id("data")}>Data de postagem</Label>
        <Input id={id("data")} name="data" type="date" required defaultValue={post?.data} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={id("horario")}>Horário (opcional)</Label>
        <Input id={id("horario")} name="horario" type="time" defaultValue={post?.horario?.slice(0, 5) ?? undefined} />
      </div>
      <NativeSelect
        id={id("status")}
        name="status"
        label="Status"
        options={STATUS_POST.map((s) => ({ value: s.valor, label: s.rotulo }))}
        defaultValue={post?.status ?? "planejado"}
      />
      <NativeSelect
        id={id("responsavel")}
        name="responsavel_id"
        label="Responsável (interno)"
        options={membros.map((m) => ({ value: m.id, label: m.nome || m.email || "—" }))}
        defaultValue={post?.responsavel_id}
        emptyLabel="Ninguém"
      />
      <div className="flex flex-col gap-1.5 sm:col-span-2">
        <Label htmlFor={id("roteiro")}>Roteiro</Label>
        <Textarea
          id={id("roteiro")}
          name="roteiro"
          rows={8}
          defaultValue={post?.roteiro ?? ""}
          placeholder="Texto do roteiro. Não aparece na grade: só quando alguém clica no post."
          className="text-sm leading-relaxed"
        />
      </div>
    </div>
  );
}
