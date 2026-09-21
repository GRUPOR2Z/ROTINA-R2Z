import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { EmptyState } from "@/components/states/empty-state";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

function formatarData(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

export default async function OKRsPage() {
  const supabase = await createClient();

  const { data: ciclos } = await supabase
    .from("okr_cycles")
    .select("id, nome, tipo, status, data_inicio, data_fim, objectives(count)")
    .order("data_inicio", { ascending: false });

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">OKRs</h1>
            <p className="text-sm text-muted-foreground">Ciclos, objetivos e resultados-chave.</p>
          </div>
          <Link href="/okrs/novo" className={buttonVariants()}>
            Novo ciclo
          </Link>
        </div>

        {!ciclos || ciclos.length === 0 ? (
          <EmptyState
            title="Nenhum ciclo cadastrado"
            description="Crie um ciclo (trimestral, semestral...) para começar a organizar objetivos."
          />
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4">
            {ciclos.map((c) => {
              const quantidadeObjetivos = (c.objectives as unknown as { count: number }[])[0]?.count ?? 0;
              return (
                <Link
                  key={c.id}
                  href={`/okrs/${c.id}`}
                  className="flex flex-col gap-2 rounded-lg border bg-card p-4 transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-medium">{c.nome}</h3>
                    {c.status === "encerrado" && <Badge variant="secondary">Encerrado</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatarData(c.data_inicio)} – {formatarData(c.data_fim)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {quantidadeObjetivos} objetivo{quantidadeObjetivos === 1 ? "" : "s"}
                  </p>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
