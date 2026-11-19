import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { MonthNav } from "@/components/layout/month-nav";
import { semanasDoMes } from "@/components/clientes/calendar";
import { SelectField } from "@/components/forms/select-field";
import { Button, buttonVariants } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { getClientesAtivos } from "@/lib/clients-data";
import { DIAS_SEMANA, MESES, dateKey, getMonthGrid, mesAnterior, paramDoMes, proximoMes } from "@/lib/calendar";
import { STATUS_POST, alertaStatus, corDoFormato, infoStatus, rotuloRedeFormato } from "@/lib/conteudo";

type Post = {
  id: string;
  titulo: string;
  data: string;
  horario: string | null;
  rede: string | null;
  formato: string | null;
  status: string;
  client_id: string;
  clients: { nome: string } | null;
};

/** Visão geral do conteúdo: os posts de todos os clientes num calendário
 * só, com filtro por cliente e status. Cada post leva para a página do
 * cliente, onde é editado. */
export default async function ConteudoPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string; cliente?: string; status?: string }>;
}) {
  const { mes, cliente, status } = await searchParams;
  const hoje = new Date();
  const mesParam = mes && /^\d{4}-\d{2}$/.test(mes) ? mes : paramDoMes(hoje.getFullYear(), hoje.getMonth() + 1);
  const [ano, mesNumero] = mesParam.split("-").map(Number);
  const dias = semanasDoMes(getMonthGrid(ano, mesNumero), mesNumero);

  const supabase = await createClient();
  let query = supabase
    .from("calendar_events")
    .select("id, titulo, data, horario, rede, formato, status, client_id, clients(nome)")
    .gte("data", dateKey(dias[0]))
    .lte("data", dateKey(dias[dias.length - 1]))
    .order("data")
    .order("horario", { ascending: true, nullsFirst: false });
  if (cliente) query = query.eq("client_id", cliente);
  if (status) query = query.eq("status", status);

  const [{ data }, clientes] = await Promise.all([query, getClientesAtivos()]);
  const posts = (data ?? []) as unknown as Post[];

  const porDia = new Map<string, Post[]>();
  for (const p of posts) porDia.set(p.data, [...(porDia.get(p.data) ?? []), p]);
  const doMes = posts.filter((p) => Number(p.data.slice(5, 7)) === mesNumero);
  const contagem = new Map<string, number>();
  for (const p of doMes) contagem.set(p.status, (contagem.get(p.status) ?? 0) + 1);

  const filtros = new URLSearchParams({ ...(cliente ? { cliente } : {}), ...(status ? { status } : {}) });
  const linkMes = (param: string) => `?${new URLSearchParams({ ...Object.fromEntries(filtros), mes: param })}`;
  const anterior = mesAnterior(ano, mesNumero);
  const proximo = proximoMes(ano, mesNumero);
  const hojeKey = dateKey(hoje);

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Conteúdo"
          description="Calendário de conteúdo de todos os clientes. Para criar ou editar um post, abra o cliente."
        />

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {STATUS_POST.map((s) => (
            <Link
              key={s.valor}
              href={`?${new URLSearchParams({ ...(cliente ? { cliente } : {}), status: s.valor, mes: mesParam })}`}
              className={`rounded-xl border bg-card p-3 transition hover:border-brand-300 ${status === s.valor ? "border-brand-600 ring-2 ring-brand-600/15" : "border-border"}`}
            >
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className={`size-2 rounded-full ${s.dot}`} /> {s.rotulo}
              </p>
              <p className="mt-1 text-2xl font-semibold text-brand-900 tabular-nums">{contagem.get(s.valor) ?? 0}</p>
            </Link>
          ))}
        </div>

        <form className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card p-3">
          <input type="hidden" name="mes" value={mesParam} />
          <SelectField
            name="cliente"
            label="Cliente"
            options={clientes.map((c) => ({ value: c.id, label: c.nome }))}
            defaultValue={cliente}
            emptyLabel="Todos os clientes"
            className="flex w-56 flex-col gap-1.5"
          />
          <SelectField
            name="status"
            label="Status"
            options={STATUS_POST.map((s) => ({ value: s.valor, label: s.rotulo }))}
            defaultValue={status}
            emptyLabel="Todos"
            className="flex w-56 flex-col gap-1.5"
          />
          <Button type="submit" size="sm">
            Filtrar
          </Button>
          {(cliente || status) && (
            <Link href={`?mes=${mesParam}`} className={buttonVariants({ variant: "ghost", size: "sm" })}>
              Limpar
            </Link>
          )}
        </form>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-brand-900">
            {MESES[mesNumero - 1]} {ano}{" "}
            <span className="text-sm font-normal text-muted-foreground">· {doMes.length} posts</span>
          </h2>
          <MonthNav
            anterior={linkMes(paramDoMes(anterior.year, anterior.month))}
            hoje={linkMes(paramDoMes(hoje.getFullYear(), hoje.getMonth() + 1))}
            proximo={linkMes(paramDoMes(proximo.year, proximo.month))}
          />
        </div>

        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <div className="grid min-w-[840px] grid-cols-7 gap-px bg-border text-sm">
            {DIAS_SEMANA.map((d) => (
              <div key={d} className="bg-brand-50 px-2 py-2 text-center text-xs font-medium text-brand-700">
                {d}
              </div>
            ))}
            {dias.map((dia) => {
              const key = dateKey(dia);
              const lista = porDia.get(key) ?? [];
              return (
                <div key={key} className={`flex min-h-[120px] flex-col gap-1 bg-card p-1.5 ${dia.getMonth() + 1 === mesNumero ? "" : "opacity-40"}`}>
                  <span
                    className={
                      key === hojeKey
                        ? "flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground"
                        : "px-0.5 text-xs text-muted-foreground"
                    }
                  >
                    {dia.getDate()}
                  </span>
                  {lista.slice(0, 4).map((p) => (
                    <Link
                      key={p.id}
                      href={`/clientes/${p.client_id}?tab=conteudo&mes=${p.data.slice(0, 7)}`}
                      title={[p.clients?.nome, p.titulo, rotuloRedeFormato(p.rede, p.formato), infoStatus(p.status).rotulo].filter(Boolean).join(" — ")}
                      className={`block rounded-md px-1.5 py-1 text-[11px] leading-tight transition hover:brightness-95 ${corDoFormato(p.formato).chip}`}
                    >
                      <p className="flex items-center gap-1 truncate font-semibold">
                        {alertaStatus(p.status) && <span className={`size-1.5 shrink-0 rounded-full ${alertaStatus(p.status)!.dot}`} />}
                        <span className="truncate">{p.clients?.nome}</span>
                      </p>
                      <p className="truncate">{p.titulo}</p>
                    </Link>
                  ))}
                  {lista.length > 4 && <span className="px-0.5 text-[11px] text-muted-foreground">+{lista.length - 4} mais</span>}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
