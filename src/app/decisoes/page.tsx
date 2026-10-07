import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { DiarioNav } from "@/components/decisoes/fields";
import { EmptyState } from "@/components/states/empty-state";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/server";
import { formatarData, nomeDe, rel } from "@/lib/format";
import { limparTermoBusca } from "@/lib/busca";

export default async function DecisoesPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("decisions")
    .select("id, titulo, data, decisao, status, areas(nome), profiles!decisions_responsavel_id_fkey(nome, email)")
    .order("data", { ascending: false })
    .limit(100);

  // busca simples em titulo/decisao/contexto -- "encontrar decisoes antigas"
  // e' um dos problemas do Doc. 1
  const termo = limparTermoBusca(q);
  if (termo) query = query.or(`titulo.ilike.%${termo}%,decisao.ilike.%${termo}%,contexto.ilike.%${termo}%`);

  const { data: decisoes } = await query;

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Diário"
          description="Decisões: o que foi decidido, por quê e por quem."
          actions={
            <Link href="/decisoes/nova" className={buttonVariants()}>
              Registrar decisão
            </Link>
          }
        >
          <DiarioNav ativo="/decisoes" />
        </PageHeader>

        <form className="max-w-sm">
          <Input name="q" defaultValue={q} placeholder="Buscar decisões…" className="text-sm" aria-label="Buscar decisões" />
        </form>

        {!decisoes || decisoes.length === 0 ? (
          <EmptyState
            title={termo ? "Nenhuma decisão encontrada" : "Nenhuma decisão registrada"}
            description={termo ? "Tente outro termo." : "Registre decisões para preservar a memória do Grupo R2Z."}
          />
        ) : (
          <ul className="flex flex-col divide-y rounded-lg border">
            {decisoes.map((d) => (
              <li key={d.id}>
                <Link href={`/decisoes/${d.id}`} className="flex flex-col gap-1 px-4 py-3 hover:bg-muted/40">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-sm tabular-nums text-muted-foreground">{formatarData(d.data, { ano: true })}</span>
                    <span className="font-medium">{d.titulo}</span>
                    {d.status === "revogada" && <Badge variant="outline">Revogada</Badge>}
                  </span>
                  <span className="line-clamp-2 text-sm text-muted-foreground">{d.decisao}</span>
                  <span className="text-xs text-muted-foreground">
                    {nomeDe(rel(d.profiles))}
                    {rel<{ nome: string }>(d.areas)?.nome ? ` · ${rel<{ nome: string }>(d.areas)!.nome}` : ""}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  );
}
