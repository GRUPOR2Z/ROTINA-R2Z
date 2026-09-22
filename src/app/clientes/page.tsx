import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { EmptyState } from "@/components/states/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase/server";

function iniciais(nome: string) {
  return nome.trim().slice(0, 2).toUpperCase();
}

export default async function ClientesPage() {
  const supabase = await createClient();
  const { data: clientes } = await supabase
    .from("clients")
    .select("id, nome, tipo_cliente")
    .eq("arquivado", false)
    .order("nome");

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
            {clientes.map((c) => (
              <Link
                key={c.id}
                href={`/clientes/${c.id}`}
                className="flex flex-col items-center gap-2 rounded-lg border bg-card p-4 text-center transition-colors hover:bg-muted/50"
              >
                <Avatar className="h-10 w-10">
                  <AvatarFallback>{iniciais(c.nome)}</AvatarFallback>
                </Avatar>
                <p className="w-full truncate text-sm font-medium" title={c.nome}>
                  {c.nome}
                </p>
                {c.tipo_cliente && <p className="text-xs text-muted-foreground">{c.tipo_cliente}</p>}
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
