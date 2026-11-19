import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { ClientTabs } from "@/components/clientes/tabs";
import { ClientPropertiesPanel } from "@/components/clientes/properties-panel";
import { ClientNameEditor } from "@/components/clientes/client-name-editor";
import { ClientTasksBoard } from "@/components/clientes/tasks-board";
import { ClientCalendar } from "@/components/clientes/calendar";
import { ClientProcessesTab } from "@/components/clientes/processes-tab";
import { Button, buttonVariants } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import {
  getClienteComPropriedades,
  getProcessosDoCliente,
  getProcessosParaVincular,
} from "@/lib/clients-data";
import { getAreasEMembros } from "@/lib/lookups";
import { getCurrentProfile } from "@/lib/current-profile";
import { arquivarCliente, reabrirCliente, excluirCliente } from "../actions";
import { ClientAccessSection } from "@/components/clientes/access-section";
import { Archive, ArrowLeft, ExternalLink } from "lucide-react";
import { AvatarUpload } from "@/components/clientes/avatar-upload";

export default async function ClientePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string; mes?: string; acesso?: string; erro_acesso?: string }>;
}) {
  const { id } = await params;
  const { tab, mes, acesso, erro_acesso } = await searchParams;

  const dados = await getClienteComPropriedades(id);
  if (!dados) notFound();

  const { cliente, definicoes, valorPorDefinicao } = dados;
  const { membros } = await getAreasEMembros();
  const perfil = await getCurrentProfile();

  const supabase = await createClient();
  const [{ data: tarefas }, processosVinculados, processosDisponiveis, { data: acessos }] = await Promise.all([
    supabase
      .from("tasks")
      .select("id, titulo, status, prazo, horario, cor")
      .eq("client_id", id)
      .order("prazo", { ascending: true, nullsFirst: false }),
    getProcessosDoCliente(id),
    getProcessosParaVincular(id),
    supabase
      .from("client_members")
      .select("profile_id, criado_em, profiles!client_members_profile_id_fkey(nome, email)")
      .eq("client_id", id)
      .order("criado_em"),
  ]);

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <Link href="/clientes" className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft size={14} /> Clientes
        </Link>

        <header className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="h-20 bg-brand-900 bg-[radial-gradient(circle_at_85%_-20%,rgba(159,224,195,0.25),transparent_55%)]" />
          <div className="flex flex-wrap items-end justify-between gap-4 px-6 pb-5">
            <div className="flex min-w-0 items-end gap-4">
              <div className="-mt-10 shrink-0">
                <AvatarUpload clientId={cliente.id} nome={cliente.nome} url={cliente.avatar_url} />
              </div>
              <div className="min-w-0 pt-3">
                <ClientNameEditor clientId={cliente.id} nomeInicial={cliente.nome} />
                <p className="mt-0.5 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  {cliente.tipo_cliente ? <span className="capitalize">{cliente.tipo_cliente}</span> : <span>Sem tipo definido</span>}
                  {cliente.arquivado && (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">Arquivado</span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pb-1">
              <Link href={`/portal/${cliente.id}`} className={buttonVariants({ size: "sm", variant: "outline" })}>
                <ExternalLink size={14} /> Ver como cliente
              </Link>
              {!cliente.arquivado ? (
                <form action={arquivarCliente.bind(null, cliente.id)}>
                  <Button type="submit" size="sm" variant="ghost" className="text-muted-foreground">
                    <Archive size={14} /> Arquivar
                  </Button>
                </form>
              ) : (
                <form action={reabrirCliente.bind(null, cliente.id)}>
                  <Button type="submit" size="sm" variant="outline">
                    Reabrir
                  </Button>
                </form>
              )}
            </div>
          </div>
        </header>

        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="min-w-0 rounded-xl border border-border bg-card p-4 sm:p-5">
            <ClientTabs
              abaInicial={tab ?? "conteudo"}
              conteudo={<ClientCalendar clientId={cliente.id} mes={mes} membros={membros} modo="equipe" />}
              tarefas={
                <div className="flex flex-col gap-4">
                  <div className="flex justify-end">
                    <Link href={`/rotinas/nova?cliente=${cliente.id}`} className={buttonVariants({ size: "sm" })}>
                      Nova tarefa
                    </Link>
                  </div>
                  <ClientTasksBoard vinculo={{ clientId: cliente.id }} tarefas={tarefas ?? []} />
                </div>
              }
              processos={
                <ClientProcessesTab
                  clientId={cliente.id}
                  vinculados={processosVinculados}
                  disponiveis={processosDisponiveis}
                />
              }
            />
          </div>

          <aside className="flex min-w-0 flex-col gap-6">
            <section className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4">
              <h2 className="text-sm font-semibold text-brand-900">Propriedades</h2>
              <ClientPropertiesPanel
                clientId={cliente.id}
                tipoCliente={cliente.tipo_cliente}
                definicoes={definicoes}
                valorPorDefinicao={valorPorDefinicao}
                membros={membros}
                podeAdministrar={perfil?.isAdmin ?? false}
              />
            </section>

            <ClientAccessSection
              clientId={cliente.id}
              acessos={(acessos ?? []).map((a) => {
                const p = a.profiles as unknown as { nome: string | null; email: string | null } | null;
                return { profileId: a.profile_id, nome: p?.nome ?? null, email: p?.email ?? null };
              })}
              podeAdministrar={perfil?.isAdmin ?? false}
              aviso={acesso === "criado" ? "Acesso criado. Envie o e-mail e a senha ao cliente." : acesso === "removido" ? "Acesso removido." : undefined}
              erro={erro_acesso}
            />
          </aside>
        </div>

        <form action={excluirCliente.bind(null, cliente.id)} className="border-t pt-4">
          <Button type="submit" variant="ghost" size="sm" className="text-destructive">
            Excluir cliente
          </Button>
        </form>
      </div>
    </AppShell>
  );
}
