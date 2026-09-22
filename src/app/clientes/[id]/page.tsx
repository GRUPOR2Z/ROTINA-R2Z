import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { EmptyState } from "@/components/states/empty-state";
import { ClientTabs } from "@/components/clientes/tabs";
import { ClientPropertiesPanel } from "@/components/clientes/properties-panel";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getClienteComPropriedades } from "@/lib/clients-data";
import { getAreasEMembros } from "@/lib/lookups";
import {
  atualizarCliente,
  arquivarCliente,
  reabrirCliente,
  excluirCliente,
  enviarFotoCliente,
} from "../actions";

function iniciais(nome: string) {
  return nome.trim().slice(0, 2).toUpperCase();
}

export default async function ClientePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const { tab } = await searchParams;

  const dados = await getClienteComPropriedades(id);
  if (!dados) notFound();

  const { cliente, definicoes, valorPorDefinicao } = dados;
  const { membros } = await getAreasEMembros();

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
                <h1 className="text-2xl font-semibold tracking-tight">{cliente.nome}</h1>
                {cliente.tipo_cliente && (
                  <p className="text-sm text-muted-foreground">{cliente.tipo_cliente}</p>
                )}
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

        <section className="flex flex-col gap-4 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-muted-foreground">Sobre o cliente</h2>
            <Link
              href="/clientes/propriedades"
              className="text-xs text-muted-foreground underline hover:text-foreground"
            >
              Gerenciar propriedades
            </Link>
          </div>

          <form action={atualizarCliente.bind(null, cliente.id)} className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="nome">Nome</Label>
              <Input id="nome" name="nome" defaultValue={cliente.nome} required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="tipo_cliente">Tipo de cliente</Label>
              <Input
                id="tipo_cliente"
                name="tipo_cliente"
                defaultValue={cliente.tipo_cliente ?? ""}
                placeholder="ex: clínica, e-commerce"
              />
            </div>
            <div className="col-span-2">
              <SubmitButton size="sm" pendingText="Salvando…">
                Salvar dados básicos
              </SubmitButton>
            </div>
          </form>

          <ClientPropertiesPanel
            clientId={cliente.id}
            definicoes={definicoes}
            valorPorDefinicao={valorPorDefinicao}
            membros={membros}
          />
        </section>

        <ClientTabs
          abaInicial={tab ?? "conteudo"}
          conteudo={
            <EmptyState
              title="Calendário e anotações do cliente"
              description="Chega na Fase B: calendário mensal do cliente e seções de conteúdo (texto, links, checklists, indicadores)."
            />
          }
          tarefas={
            <EmptyState
              title="Controle de tarefas"
              description="Chega na Fase B: o Kanban da equipe, filtrado só pras tarefas deste cliente."
            />
          }
          processos={
            <EmptyState
              title="Processos vinculados"
              description="Chega na Fase C: processos da biblioteca central vinculados a este cliente, sem duplicar conteúdo."
            />
          }
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
