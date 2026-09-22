import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { EmptyState } from "@/components/states/empty-state";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { getBadgesPorCliente } from "@/lib/clients-data";

function iniciais(nome: string) {
  return nome.trim().slice(0, 2).toUpperCase();
}

export default async function ClientesPage() {
  const supabase = await createClient();
  const [{ data: clientes }, badgesPorCliente] = await Promise.all([
    supabase
      .from("clients")
      .select("id, nome, tipo_cliente, avatar_url")
      .eq("arquivado", false)
      .order("nome"),
    getBadgesPorCliente(),
  ]);

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Clientes</h1>
            <p className="text-sm text-muted-foreground">
              Cada cliente com seu próprio espaço: propriedades, calendário, tarefas e processos.
            </p>
          </div>
          <Link href="/clientes/novo" className={buttonVariants()}>
            Novo cliente
          </Link>
        </div>

        {!clientes || clientes.length === 0 ? (
          <EmptyState
            title="Nenhum cliente cadastrado"
            description="Crie o primeiro cliente pra começar a organizar propriedades, tarefas e processos por conta."
            action={
              <Link href="/clientes/novo" className={buttonVariants({ variant: "outline" })}>
                Novo cliente
              </Link>
            }
          />
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4">
            {clientes.map((c) => {
              const badges = badgesPorCliente.get(c.id) ?? [];

              return (
                <Link
                  key={c.id}
                  href={`/clientes/${c.id}`}
                  className="group flex flex-col overflow-hidden rounded-xl border bg-card transition-shadow hover:shadow-md"
                >
                  <div className="h-32 w-full overflow-hidden bg-muted">
                    {c.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element -- capa vem do Storage, sem otimizacao do next/image por enquanto
                      <img
                        src={c.avatar_url}
                        alt={c.nome}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-2xl font-semibold text-muted-foreground/30">
                        {iniciais(c.nome)}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5 p-3">
                    <p className="truncate text-sm font-medium" title={c.nome}>
                      {c.nome}
                    </p>
                    {c.tipo_cliente && <p className="text-xs text-muted-foreground">{c.tipo_cliente}</p>}
                    {badges.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {badges.map((badge, i) => (
                          <Badge key={i} variant="secondary">
                            {badge}
                          </Badge>
                        ))}
                      </div>
                    )}
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
