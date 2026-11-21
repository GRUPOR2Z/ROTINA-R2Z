import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CalendarDays, FileText, KeyRound, ListChecks, Workflow, type LucideIcon } from "lucide-react";
import { PortalShell } from "@/components/portal/portal-shell";
import { ClientCalendar } from "@/components/clientes/calendar";
import { ClientMaterials } from "@/components/clientes/materials-tab";
import { ClientCredentials } from "@/components/clientes/credentials-tab";
import { ClientTasksBoard } from "@/components/clientes/tasks-board";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getCurrentProfile } from "@/lib/current-profile";
import { createClient } from "@/lib/supabase/server";
import { SO_LEITURA, normalizarPermissoes, pode, type Modulo } from "@/lib/permissoes-cliente";
import { cn } from "@/lib/utils";

const ABAS: { valor: string; modulo: Modulo; rotulo: string; icone: LucideIcon }[] = [
  { valor: "calendario", modulo: "calendario", rotulo: "Calendário de conteúdo", icone: CalendarDays },
  { valor: "tarefas", modulo: "tarefas", rotulo: "Tarefas", icone: ListChecks },
  { valor: "processos", modulo: "processos", rotulo: "Processos", icone: Workflow },
  { valor: "roteiros", modulo: "roteiros", rotulo: "Roteiros", icone: FileText },
  { valor: "acessos", modulo: "acessos", rotulo: "Acessos", icone: KeyRound },
];

/** A área do cliente no hub. Cada login de cliente vê, cria e edita só o
 * que a equipe liberou (client_members.permissoes); o RLS confere tudo no
 * banco. A equipe abre esta página como pré-visualização, só leitura. */
export default async function PortalClientePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string; mes?: string; erro_material?: string; erro_acesso_conta?: string }>;
}) {
  const { id } = await params;
  const { tab, mes, erro_material, erro_acesso_conta } = await searchParams;

  const perfil = await getCurrentProfile();
  if (!perfil) redirect("/login");
  const ehCliente = perfil.papel === "cliente";

  const supabase = await createClient();
  const [{ data: cliente }, { data: vinculo }] = await Promise.all([
    supabase.from("clients").select("id, nome, avatar_url").eq("id", id).maybeSingle(),
    ehCliente
      ? supabase.from("client_members").select("permissoes").eq("client_id", id).eq("profile_id", perfil.id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);
  if (!cliente) notFound();

  const permissoes = ehCliente ? normalizarPermissoes(vinculo?.permissoes) : SO_LEITURA;
  const abas = ABAS.filter((a) => pode(permissoes, a.modulo, "ver"));
  const atual = abas.find((a) => a.valor === tab) ?? abas[0];
  const p = (acao: "criar" | "editar") => (atual ? ehCliente && pode(permissoes, atual.modulo, acao) : false);

  const { data: tarefas } =
    atual?.valor === "tarefas"
      ? await supabase
          .from("tasks")
          .select("id, titulo, status, prazo, horario, cor")
          .eq("client_id", cliente.id)
          .is("parent_task_id", null)
          .order("prazo", { ascending: true, nullsFirst: false })
      : { data: null };

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
            <p className="text-sm text-muted-foreground">Acompanhe o trabalho da sua conta com o Grupo R2Z.</p>
          </div>
        </div>

        {!atual ? (
          <p className="rounded-xl border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
            Seu acesso ainda não tem nenhuma área liberada. Fale com a equipe do Grupo R2Z.
          </p>
        ) : (
          <>
            <nav className="flex flex-wrap gap-1 border-b border-border">
              {abas.map(({ valor, rotulo, icone: Icone }) => (
                <Link
                  key={valor}
                  href={`?tab=${valor}`}
                  className={cn(
                    "-mb-px inline-flex items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors",
                    atual.valor === valor
                      ? "border-brand-700 text-brand-900"
                      : "border-transparent text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Icone size={16} />
                  {rotulo}
                </Link>
              ))}
            </nav>

            {atual.valor === "calendario" && (
              <ClientCalendar
                clientId={cliente.id}
                mes={mes}
                aba="calendario"
                podeCriar={p("criar")}
                podeEditar={p("editar")}
                podeExcluir={false}
              />
            )}
            {atual.valor === "tarefas" && (
              <ClientTasksBoard
                vinculo={{ clientId: cliente.id }}
                tarefas={tarefas ?? []}
                podeCriar={p("criar")}
                podeMover={p("editar")}
                abrirAoClicar={false}
              />
            )}
            {atual.valor === "processos" && (
              <ClientMaterials clientId={cliente.id} tipo="processo" podeCriar={p("criar")} origem="portal" erro={erro_material} />
            )}
            {atual.valor === "roteiros" && (
              <ClientMaterials clientId={cliente.id} tipo="roteiro" podeCriar={p("criar")} origem="portal" erro={erro_material} />
            )}
            {atual.valor === "acessos" && (
              <ClientCredentials
                clientId={cliente.id}
                origem="portal"
                podeCriar={p("criar")}
                podeEditar={p("editar")}
                podeExcluir={false}
                erro={erro_acesso_conta}
              />
            )}
          </>
        )}
      </div>
    </PortalShell>
  );
}
