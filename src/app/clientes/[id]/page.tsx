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
import { SubmitButton } from "@/components/ui/submit-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase/server";
import {
  getClienteComPropriedades,
  getProcessosDoCliente,
  getProcessosParaVincular,
} from "@/lib/clients-data";
import { getAreasEMembros } from "@/lib/lookups";
import { getCurrentProfile } from "@/lib/current-profile";
import { arquivarCliente, reabrirCliente, excluirCliente, enviarFotoCliente } from "../actions";
import { ClientAccessSection } from "@/components/clientes/access-section";
import { ExternalLink } from "lucide-react";

function iniciais(nome: string) {
  return nome.trim().slice(0, 2).toUpperCase();
}

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
      <div className="flex max-w-4xl flex-col gap-8">
        <div>
          <Link href="/clientes" className="text-sm text-muted-foreground hover:text-foreground">
            ← Clientes
          </Link>

          <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                {cliente.avatar_url && <AvatarImage src={cliente.avatar_url} alt={cliente.nome} />}
                <AvatarFallback className="text-xl">{iniciais(cliente.nome)}</AvatarFallback>
              </Avatar>
              <div>
                <ClientNameEditor clientId={cliente.id} nomeInicial={cliente.nome} />
                <form action={enviarFotoCliente.bind(null, cliente.id)} className="mt-2 flex items-center gap-2">
                  <input
                    name="foto"
                    type="file"
                    accept="image/*"
                    required
                    className="text-xs text-muted-foreground file:mr-2 file:rounded file:border-0 file:bg-muted file:px-2 file:py-1 file:text-xs"
                  />
                  <SubmitButton size="sm" variant="outline" pendingText="Enviando…">
                    {cliente.avatar_url ? "Trocar foto" : "Adicionar foto"}
                  </SubmitButton>
                </form>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
            <Link href={`/portal/${cliente.id}`} className={buttonVariants({ size: "sm", variant: "outline" })}>
              <ExternalLink size={14} /> Ver como cliente
            </Link>
            {!cliente.arquivado ? (
              <form action={arquivarCliente.bind(null, cliente.id)}>
                <Button type="submit" size="sm" variant="outline">
                  Arquivar
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
        </div>

        <section className="flex flex-col gap-2">
          <h2 className="text-xs font-medium text-muted-foreground">Propriedades</h2>
          <ClientPropertiesPanel
            clientId={cliente.id}
            tipoCliente={cliente.tipo_cliente}
            definicoes={definicoes}
            valorPorDefinicao={valorPorDefinicao}
            membros={membros}
            podeAdministrar={perfil?.isAdmin ?? false}
          />
        </section>

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

        <form action={excluirCliente.bind(null, cliente.id)} className="border-t pt-4">
          <Button type="submit" variant="ghost" size="sm" className="text-destructive">
            Excluir cliente
          </Button>
        </form>
      </div>
    </AppShell>
  );
}
