import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader, Section } from "@/components/layout/page-header";
import { ProjectFields } from "@/components/projetos/project-fields";
import { BarraAndamento, PrazoProjeto, ProjectStatusBadge } from "@/components/projetos/status-badge";
import { ClientTasksBoard } from "@/components/clientes/tasks-board";
import { SelectField } from "@/components/forms/select-field";
import { Attachments } from "@/components/documents/attachments";
import { History } from "@/components/audit/history";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/server";
import { getAreasEMembros } from "@/lib/lookups";
import { getClientesAtivos } from "@/lib/clients-data";
import { opcoesAreas, opcoesMembros } from "@/lib/opcoes";
import { calcularAndamento } from "@/lib/projetos";
import { formatarData, nomeDe, rel } from "@/lib/format";
import {
  adicionarEntrega,
  adicionarMembro,
  alternarEntrega,
  atualizarProjeto,
  desvincularProcesso,
  excluirProjeto,
  removerEntrega,
  removerMembro,
  vincularProcesso,
} from "../actions";

export default async function ProjetoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: projeto } = await supabase.from("projects").select("*").eq("id", id).maybeSingle();
  if (!projeto) notFound();

  const [{ areas, membros }, clientes, tarefasR, entregasR, equipeR, processosR, todosProcessosR] = await Promise.all([
    getAreasEMembros(),
    getClientesAtivos(),
    supabase
      .from("tasks")
      .select("id, titulo, status, prazo, horario, cor")
      .eq("project_id", id)
      .is("parent_task_id", null)
      .order("prazo", { ascending: true, nullsFirst: false }),
    supabase.from("project_deliverables").select("id, descricao, prazo, concluido").eq("project_id", id).order("criado_em"),
    supabase.from("project_members").select("id, papel, profiles(id, nome, email)").eq("project_id", id).order("criado_em"),
    supabase.from("project_processes").select("id, processes(id, titulo, status)").eq("project_id", id),
    supabase.from("processes").select("id, titulo").neq("status", "arquivado").order("titulo"),
  ]);

  const tarefas = tarefasR.data ?? [];
  const entregas = entregasR.data ?? [];
  const equipe = equipeR.data ?? [];
  const processos = processosR.data ?? [];
  const andamento = calcularAndamento(tarefas, entregas);
  const bloqueadas = tarefas.filter((t) => t.status === "bloqueada").length;
  const cliente = clientes.find((c) => c.id === projeto.client_id);
  const caminho = `/projetos/${id}`;

  return (
    <AppShell>
      <div className="flex max-w-4xl flex-col gap-8">
        <PageHeader
          title={projeto.nome}
          back={{ href: "/projetos", label: "Projetos" }}
          actions={<ProjectStatusBadge status={projeto.status} />}
        >
          <p className="text-sm text-muted-foreground">
            {formatarData(projeto.data_inicio)} → {formatarData(projeto.prazo, { ano: true })}{" "}
            <PrazoProjeto prazo={projeto.prazo} status={projeto.status} />
            {cliente && (
              <>
                {" · "}
                <Link href={`/clientes/${cliente.id}`} className="hover:underline">
                  {cliente.nome}
                </Link>
              </>
            )}
          </p>
        </PageHeader>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="flex flex-col gap-2 rounded-lg border p-4 sm:col-span-2">
            <p className="text-sm font-medium text-muted-foreground">Andamento</p>
            <BarraAndamento valor={andamento} />
            <p className="text-xs text-muted-foreground">
              {tarefas.filter((t) => t.status === "concluida").length}/{tarefas.length} tarefas ·{" "}
              {entregas.filter((e) => e.concluido).length}/{entregas.length} entregas
            </p>
          </div>
          <div className="flex flex-col gap-1 rounded-lg border p-4">
            <p className="text-3xl font-semibold tabular-nums">{bloqueadas}</p>
            <p className={bloqueadas > 0 ? "text-sm text-destructive" : "text-sm text-muted-foreground"}>
              Tarefas bloqueadas
            </p>
          </div>
        </div>

        {projeto.riscos && (
          <Section title="Riscos">
            <p className="whitespace-pre-wrap rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-sm">{projeto.riscos}</p>
          </Section>
        )}

        <Section
          title="Tarefas"
          actions={
            <Link href={`/rotinas/nova?projeto=${id}`} className="text-xs text-muted-foreground hover:text-foreground">
              + Tarefa completa
            </Link>
          }
        >
          <ClientTasksBoard vinculo={{ projectId: id }} tarefas={tarefas} />
        </Section>

        <Section title="Checklist de entrega">
          {entregas.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma entrega cadastrada.</p>}
          {entregas.length > 0 && (
            <ul className="flex flex-col divide-y rounded-lg border">
              {entregas.map((e) => (
                <li key={e.id} className="flex items-center gap-3 px-3 py-2 text-sm">
                  <form action={alternarEntrega.bind(null, id, e.id, !e.concluido)}>
                    <button
                      type="submit"
                      aria-label={e.concluido ? "Marcar como pendente" : "Marcar como entregue"}
                      className={`flex h-4 w-4 items-center justify-center rounded border text-[10px] ${e.concluido ? "border-primary bg-primary text-primary-foreground" : ""}`}
                    >
                      {e.concluido && "✓"}
                    </button>
                  </form>
                  <span className={`flex-1 ${e.concluido ? "text-muted-foreground line-through" : ""}`}>{e.descricao}</span>
                  {e.prazo && <span className="text-xs text-muted-foreground">{formatarData(e.prazo)}</span>}
                  <form action={removerEntrega.bind(null, id, e.id)}>
                    <Button type="submit" variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground" aria-label="Remover entrega">
                      ×
                    </Button>
                  </form>
                </li>
              ))}
            </ul>
          )}
          <form action={adicionarEntrega.bind(null, id)} className="flex flex-col gap-2 sm:flex-row">
            <Input name="descricao" placeholder="Nova entrega" className="flex-1 text-sm" required />
            <Input name="prazo" type="date" className="text-sm sm:w-40" aria-label="Prazo da entrega" />
            <Button type="submit" size="sm" variant="outline">
              Adicionar
            </Button>
          </form>
        </Section>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <Section title="Equipe">
            <ul className="flex flex-col gap-1">
              {equipe.map((m) => {
                const p = rel<{ id: string; nome: string | null; email: string | null }>(m.profiles);
                return (
                  <li key={m.id} className="flex items-center gap-2 text-sm">
                    <Link href={`/equipe/${p?.id}`} className="flex-1 hover:underline">
                      {nomeDe(p)}
                    </Link>
                    {m.papel && <span className="text-xs text-muted-foreground">{m.papel}</span>}
                    <form action={removerMembro.bind(null, id, m.id)}>
                      <Button type="submit" variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground" aria-label="Remover da equipe">
                        ×
                      </Button>
                    </form>
                  </li>
                );
              })}
            </ul>
            <form action={adicionarMembro.bind(null, id)} className="flex flex-col gap-2">
              <SelectField name="profile_id" options={opcoesMembros(membros)} placeholder="Adicionar pessoa" />
              <div className="flex gap-2">
                <Input name="papel" placeholder="Papel (opcional)" className="flex-1 text-sm" />
                <Button type="submit" size="sm" variant="outline">
                  Adicionar
                </Button>
              </div>
            </form>
          </Section>

          <Section title="Processos relacionados">
            <ul className="flex flex-col gap-1">
              {processos.map((v) => {
                const p = rel<{ id: string; titulo: string; status: string }>(v.processes);
                return (
                  <li key={v.id} className="flex items-center gap-2 text-sm">
                    <Link href={`/processos/${p?.id}`} className="flex-1 hover:underline">
                      {p?.titulo}
                    </Link>
                    <form action={desvincularProcesso.bind(null, id, v.id)}>
                      <Button type="submit" variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground" aria-label="Desvincular processo">
                        ×
                      </Button>
                    </form>
                  </li>
                );
              })}
              {processos.length === 0 && <li className="text-sm text-muted-foreground">Nenhum processo vinculado.</li>}
            </ul>
            <form action={vincularProcesso.bind(null, id)} className="flex gap-2">
              <SelectField
                name="process_id"
                options={(todosProcessosR.data ?? []).map((p) => ({ value: p.id, label: p.titulo }))}
                placeholder="Vincular processo"
                className="flex-1"
              />
              <Button type="submit" size="sm" variant="outline">
                Vincular
              </Button>
            </form>
          </Section>
        </div>

        <Section title="Detalhes">
          <form action={atualizarProjeto.bind(null, id)} className="flex flex-col gap-4 rounded-lg border p-4">
            <ProjectFields
              areas={opcoesAreas(areas)}
              membros={opcoesMembros(membros)}
              clientes={clientes.map((c) => ({ value: c.id, label: c.nome }))}
              projeto={projeto}
            />
            <Button type="submit" size="sm" className="self-start">
              Salvar alterações
            </Button>
          </form>
        </Section>

        <Section title="Anexos e evidências">
          <Attachments entidade="project" entidadeId={id} caminhoPagina={caminho} />
        </Section>

        <Section title="Histórico de alterações">
          <History tabela="projects" registroId={id} />
        </Section>

        <form action={excluirProjeto.bind(null, id)} className="border-t pt-4">
          <Button type="submit" variant="ghost" size="sm" className="text-destructive">
            Excluir projeto
          </Button>
        </form>
      </div>
    </AppShell>
  );
}
