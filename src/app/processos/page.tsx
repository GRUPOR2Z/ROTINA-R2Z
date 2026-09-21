import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { EmptyState } from "@/components/states/empty-state";
import { ProcessFilterBar } from "@/components/processos/filter-bar";
import { ProcessStatusBadge } from "@/components/processos/status-badge";
import { buttonVariants } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { getAreasEMembros } from "@/lib/lookups";

export default async function ProcessosPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; area?: string; busca?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const { areas } = await getAreasEMembros();

  let query = supabase
    .from("processes")
    .select("id, titulo, status, objetivo, areas(nome), profiles!processes_responsavel_id_fkey(nome, email)")
    .order("atualizado_em", { ascending: false });

  if (params.status) query = query.eq("status", params.status);
  if (params.area) query = query.eq("area_id", params.area);
  if (params.busca) query = query.ilike("titulo", `%${params.busca}%`);

  const { data: processos } = await query;

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Processos</h1>
            <p className="text-sm text-muted-foreground">
              Como as coisas são feitas — documentado, versionado, sempre consultável.
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/processos/importar" className={buttonVariants({ variant: "outline" })}>
              Importar arquivo
            </Link>
            <Link href="/processos/novo" className={buttonVariants()}>
              Novo processo
            </Link>
          </div>
        </div>

        <ProcessFilterBar areas={areas} />

        {!processos || processos.length === 0 ? (
          <EmptyState
            title="Nenhum processo encontrado"
            description="Crie um processo ou ajuste os filtros acima."
          />
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4">
            {processos.map((p) => {
              const area = (p.areas as unknown as { nome: string } | null)?.nome;
              const responsavel = (
                p.profiles as unknown as { nome: string | null; email: string | null } | null
              );

              return (
                <Link
                  key={p.id}
                  href={`/processos/${p.id}`}
                  className="flex flex-col gap-2 rounded-lg border bg-card p-4 transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-medium">{p.titulo}</h3>
                    <ProcessStatusBadge status={p.status} />
                  </div>
                  {p.objetivo && (
                    <p className="line-clamp-2 text-xs text-muted-foreground">{p.objetivo}</p>
                  )}
                  <div className="mt-1 flex flex-wrap gap-1.5 text-xs text-muted-foreground">
                    {area && <span>{area}</span>}
                    {area && responsavel && <span>·</span>}
                    {responsavel && <span>{responsavel.nome || responsavel.email}</span>}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
