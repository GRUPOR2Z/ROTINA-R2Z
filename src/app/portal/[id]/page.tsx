import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CalendarDays, ChevronRight, Workflow } from "lucide-react";
import { PortalShell } from "@/components/portal/portal-shell";
import { ClientCalendar } from "@/components/clientes/calendar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getCurrentProfile } from "@/lib/current-profile";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

const ABAS = [
  { valor: "calendario", rotulo: "Calendário de conteúdo", icone: CalendarDays },
  { valor: "processos", rotulo: "Processos", icone: Workflow },
] as const;

/** A "aba" do cliente no hub: calendario de conteudo e processos
 * visiveis, so leitura. O RLS (migration 0026) garante que um login de
 * cliente so enxerga o proprio cliente. */
export default async function PortalClientePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string; mes?: string }>;
}) {
  const { id } = await params;
  const { tab, mes } = await searchParams;
  const aba = tab === "processos" ? "processos" : "calendario";

  const perfil = await getCurrentProfile();
  if (!perfil) redirect("/login");

  const supabase = await createClient();
  const [{ data: cliente }, { data: vinculos }] = await Promise.all([
    supabase.from("clients").select("id, nome, avatar_url").eq("id", id).maybeSingle(),
    // a equipe ve todos os vinculos pelo RLS; o filtro deixa a
    // pre-visualizacao igual ao que o cliente ve
    supabase
      .from("process_clients")
      .select("id, processes(id, titulo, objetivo)")
      .eq("client_id", id)
      .eq("visivel_ao_cliente", true)
      .order("vinculado_em", { ascending: false }),
  ]);
  if (!cliente) notFound();

  const processos = (vinculos ?? [])
    .map((v) => v.processes as unknown as { id: string; titulo: string; objetivo: string | null } | null)
    .filter((p): p is { id: string; titulo: string; objetivo: string | null } => p != null);

  return (
    <PortalShell clienteNome={cliente.nome} voltarInterno={`/clientes/${cliente.id}`}>
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <Avatar className="h-14 w-14">
            {cliente.avatar_url && <AvatarImage src={cliente.avatar_url} alt={cliente.nome} />}
            <AvatarFallback className="bg-brand-100 text-brand-800">{cliente.nome.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-semibold">{cliente.nome}</h1>
            <p className="text-sm text-muted-foreground">Acompanhe o planejamento de conteúdo e os processos da sua conta.</p>
          </div>
        </div>

        <nav className="flex gap-1 border-b border-border">
          {ABAS.map(({ valor, rotulo, icone: Icone }) => (
            <Link
              key={valor}
              href={`?tab=${valor}`}
              className={cn(
                "-mb-px inline-flex items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors",
                aba === valor
                  ? "border-brand-700 text-brand-900"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              <Icone size={16} />
              {rotulo}
            </Link>
          ))}
        </nav>

        {aba === "calendario" ? (
          <ClientCalendar clientId={cliente.id} mes={mes} aba="calendario" />
        ) : processos.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
            Nenhum processo disponível ainda.
          </p>
        ) : (
          <div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
            {processos.map((p) => (
              <Link
                key={p.id}
                href={`/portal/${cliente.id}/processos/${p.id}`}
                className="flex items-center gap-4 p-4 transition hover:bg-brand-50"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-brand-700">
                  <Workflow size={16} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-brand-900">{p.titulo}</p>
                  {p.objetivo && <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">{p.objetivo}</p>}
                </div>
                <ChevronRight size={16} className="text-muted-foreground" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </PortalShell>
  );
}
