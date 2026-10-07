import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/states/empty-state";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/server";
import { limparTermoBusca } from "@/lib/busca";

type Resultado = { href: string; titulo: string; detalhe?: string | null };

export default async function BuscaPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const termo = limparTermoBusca(q);
  const supabase = await createClient();

  let grupos: { nome: string; itens: Resultado[] }[] = [];

  if (termo) {
    const like = `%${termo}%`;
    const [tarefas, processos, projetos, decisoes, reunioes, melhorias, kpis, okrs, clientes] = await Promise.all([
      supabase.from("tasks").select("id, titulo, descricao").or(`titulo.ilike.${like},descricao.ilike.${like}`).limit(10),
      supabase
        .from("processes")
        .select("id, titulo, objetivo")
        .or(`titulo.ilike.${like},objetivo.ilike.${like},passo_a_passo.ilike.${like}`)
        .limit(10),
      supabase.from("projects").select("id, nome, descricao").or(`nome.ilike.${like},descricao.ilike.${like}`).limit(10),
      supabase
        .from("decisions")
        .select("id, titulo, decisao")
        .or(`titulo.ilike.${like},decisao.ilike.${like},contexto.ilike.${like}`)
        .limit(10),
      supabase.from("meetings").select("id, titulo, data").or(`titulo.ilike.${like},pauta.ilike.${like},notas.ilike.${like}`).limit(10),
      supabase.from("improvement_items").select("id, titulo, descricao").or(`titulo.ilike.${like},descricao.ilike.${like}`).limit(10),
      supabase.from("kpis").select("id, nome, descricao").or(`nome.ilike.${like},descricao.ilike.${like}`).limit(10),
      supabase.from("okrs").select("id, titulo, descricao").or(`titulo.ilike.${like},descricao.ilike.${like}`).limit(10),
      supabase.from("clients").select("id, nome").ilike("nome", like).limit(10),
    ]);

    grupos = [
      { nome: "Tarefas", itens: (tarefas.data ?? []).map((t) => ({ href: `/rotinas/${t.id}`, titulo: t.titulo, detalhe: t.descricao })) },
      { nome: "Processos", itens: (processos.data ?? []).map((p) => ({ href: `/processos/${p.id}`, titulo: p.titulo, detalhe: p.objetivo })) },
      { nome: "Projetos", itens: (projetos.data ?? []).map((p) => ({ href: `/projetos/${p.id}`, titulo: p.nome, detalhe: p.descricao })) },
      { nome: "Decisões", itens: (decisoes.data ?? []).map((d) => ({ href: `/decisoes/${d.id}`, titulo: d.titulo, detalhe: d.decisao })) },
      { nome: "Reuniões", itens: (reunioes.data ?? []).map((r) => ({ href: `/reunioes/${r.id}`, titulo: r.titulo, detalhe: r.data })) },
      { nome: "Melhorias", itens: (melhorias.data ?? []).map((m) => ({ href: `/melhorias/${m.id}`, titulo: m.titulo, detalhe: m.descricao })) },
      { nome: "KPIs", itens: (kpis.data ?? []).map((k) => ({ href: `/kpis/${k.id}`, titulo: k.nome, detalhe: k.descricao })) },
      { nome: "OKRs", itens: (okrs.data ?? []).map((o) => ({ href: `/okrs/${o.id}`, titulo: o.titulo, detalhe: o.descricao })) },
      { nome: "Clientes", itens: (clientes.data ?? []).map((c) => ({ href: `/clientes/${c.id}`, titulo: c.nome })) },
    ].filter((g) => g.itens.length > 0);
  }

  const total = grupos.reduce((n, g) => n + g.itens.length, 0);

  return (
    <AppShell>
      <div className="flex max-w-3xl flex-col gap-6">
        <PageHeader title="Busca" description="Tarefas, processos, projetos, decisões, reuniões, melhorias, KPIs, OKRs e clientes." />

        <form>
          <Input name="q" defaultValue={q} placeholder="O que você procura?" autoFocus aria-label="Buscar" />
        </form>

        {!termo ? (
          <p className="text-sm text-muted-foreground">Digite pelo menos 2 caracteres.</p>
        ) : total === 0 ? (
          <EmptyState title="Nada encontrado" description={`Nenhum resultado para "${termo}".`} />
        ) : (
          grupos.map((g) => (
            <section key={g.nome} className="flex flex-col gap-2">
              <h2 className="text-sm font-semibold text-muted-foreground">
                {g.nome} ({g.itens.length})
              </h2>
              <ul className="flex flex-col divide-y rounded-lg border">
                {g.itens.map((i) => (
                  <li key={i.href}>
                    <Link href={i.href} className="flex flex-col px-3 py-2 hover:bg-muted/40">
                      <span className="text-sm font-medium">{i.titulo}</span>
                      {i.detalhe && <span className="line-clamp-1 text-xs text-muted-foreground">{i.detalhe}</span>}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))
        )}
      </div>
    </AppShell>
  );
}
