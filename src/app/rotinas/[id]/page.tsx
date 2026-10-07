import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { StatusBadge, estaAtrasada } from "@/components/rotinas/status-badge";
import { StatusActions } from "@/components/rotinas/status-actions";
import { Checklist } from "@/components/rotinas/checklist";
import { Comments } from "@/components/rotinas/comments";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ColorSelect } from "@/components/rotinas/color-select";
import { SelectField } from "@/components/forms/select-field";
import { opcoesMembros } from "@/lib/opcoes";
import { ErroBanner, Section } from "@/components/layout/page-header";
import { Attachments } from "@/components/documents/attachments";
import { History } from "@/components/audit/history";
import { createClient } from "@/lib/supabase/server";
import { getAreasEMembros, getVinculosTarefa } from "@/lib/lookups";
import { getClientesAtivos } from "@/lib/clients-data";
import { formatarData, nomeDe, rel } from "@/lib/format";
import { atualizarTarefa, criarSubtarefa, excluirTarefa, pararRecorrencia } from "../actions";

const ROTULO_FREQUENCIA: Record<string, string> = {
  diaria: "todo dia",
  semanal: "toda semana",
  mensal: "todo mês",
};

export default async function TarefaPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ erro?: string }>;
}) {
  const { id } = await params;
  const { erro } = await searchParams;
  const supabase = await createClient();
  const { areas, membros } = await getAreasEMembros();
  const clientes = await getClientesAtivos();
  const vinculos = await getVinculosTarefa();

  const { data: tarefa } = await supabase
    .from("tasks")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!tarefa) notFound();

  const clienteVinculado = tarefa.client_id
    ? clientes.find((c) => c.id === tarefa.client_id)
    : null;

  const [{ data: checklistItens }, { data: comentarios }, { data: subtarefas }, { data: mae }] = await Promise.all([
    supabase
      .from("task_checklist_items")
      .select("id, descricao, concluido")
      .eq("task_id", id)
      .order("criado_em"),
    supabase
      .from("task_comments")
      .select("id, texto, criado_em, profiles(nome, email)")
      .eq("task_id", id)
      .order("criado_em", { ascending: false }),
    supabase
      .from("tasks")
      .select("id, titulo, status, prazo, profiles!tasks_responsavel_id_fkey(nome, email)")
      .eq("parent_task_id", id)
      .order("criado_em"),
    tarefa.parent_task_id
      ? supabase.from("tasks").select("id, titulo").eq("id", tarefa.parent_task_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const { data: ocorrencia } = await supabase
    .from("task_occurrences")
    .select("recurring_routine_id, recurring_routines(frequencia, ativa)")
    .eq("task_id", id)
    .maybeSingle();

  const rotina = ocorrencia?.recurring_routines as unknown as
    | { frequencia: string; ativa: boolean }
    | null;

  const atrasada = estaAtrasada(tarefa.prazo, tarefa.status);

  return (
    <AppShell>
      <div className="flex max-w-3xl flex-col gap-8">
        <div>
          {mae ? (
            <Link href={`/rotinas/${mae.id}`} className="text-sm text-muted-foreground hover:text-foreground">
              ← Subtarefa de {mae.titulo}
            </Link>
          ) : clienteVinculado ? (
            <Link
              href={`/clientes/${clienteVinculado.id}?tab=tarefas`}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              ← {clienteVinculado.nome}
            </Link>
          ) : (
            <Link href="/rotinas" className="text-sm text-muted-foreground hover:text-foreground">
              ← Rotinas
            </Link>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">{tarefa.titulo}</h1>
            <StatusBadge status={tarefa.status} />
            {atrasada && (
              <span className="text-sm font-medium text-destructive">atrasada</span>
            )}
          </div>
          {tarefa.status === "bloqueada" && tarefa.bloqueio_motivo && (
            <p className="mt-1 text-sm text-destructive">
              Bloqueada: {tarefa.bloqueio_motivo}
            </p>
          )}
          {rotina?.ativa && (
            <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
              <span>↻ Repete {ROTULO_FREQUENCIA[rotina.frequencia]}</span>
              <form action={pararRecorrencia.bind(null, tarefa.id)}>
                <Button type="submit" variant="link" size="sm" className="h-auto p-0 text-sm">
                  Parar recorrência
                </Button>
              </form>
            </div>
          )}
          {rotina && !rotina.ativa && (
            <p className="mt-1 text-sm text-muted-foreground">
              ↻ Repetia {ROTULO_FREQUENCIA[rotina.frequencia]} — recorrência parada
            </p>
          )}
        </div>

        <ErroBanner erro={erro} />

        <StatusActions taskId={tarefa.id} status={tarefa.status} />

        <section className="flex flex-col gap-4 rounded-lg border p-4">
          <h2 className="text-sm font-semibold text-muted-foreground">Detalhes</h2>
          <form action={atualizarTarefa.bind(null, tarefa.id)} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="titulo">Título</Label>
              <Input id="titulo" name="titulo" defaultValue={tarefa.titulo} required />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                name="descricao"
                defaultValue={tarefa.descricao ?? ""}
                className="min-h-20"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="area_id">Área</Label>
                <Select name="area_id" defaultValue={tarefa.area_id ?? undefined}>
                  <SelectTrigger id="area_id" className="w-full">
                    <SelectValue placeholder="Selecionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {areas.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="responsavel_id">Responsável</Label>
                <Select name="responsavel_id" defaultValue={tarefa.responsavel_id ?? undefined}>
                  <SelectTrigger id="responsavel_id" className="w-full">
                    <SelectValue placeholder="Selecionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {membros.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.nome || m.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="prioridade">Prioridade</Label>
                <Select name="prioridade" defaultValue={tarefa.prioridade}>
                  <SelectTrigger id="prioridade" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baixa">Baixa</SelectItem>
                    <SelectItem value="media">Média</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="prazo">Prazo</Label>
                <Input id="prazo" name="prazo" type="date" defaultValue={tarefa.prazo ?? ""} />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="horario">Horário (opcional)</Label>
                <Input
                  id="horario"
                  name="horario"
                  type="time"
                  defaultValue={tarefa.horario ? tarefa.horario.slice(0, 5) : ""}
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="cor">Cor</Label>
                <ColorSelect defaultValue={tarefa.cor ?? undefined} />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="client_id">Cliente</Label>
                <Select name="client_id" defaultValue={tarefa.client_id ?? undefined}>
                  <SelectTrigger id="client_id" className="w-full">
                    <SelectValue placeholder="Nenhum" />
                  </SelectTrigger>
                  <SelectContent>
                    {clientes.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="justificativa_sem_prazo">Justificativa sem prazo</Label>
                <Input
                  id="justificativa_sem_prazo"
                  name="justificativa_sem_prazo"
                  defaultValue={tarefa.justificativa_sem_prazo ?? ""}
                  placeholder="Só se não houver prazo"
                />
              </div>

              <SelectField name="project_id" label="Projeto" options={vinculos.projetos} defaultValue={tarefa.project_id} emptyLabel="Nenhum" placeholder="Nenhum" />
              <SelectField name="process_id" label="Processo" options={vinculos.processos} defaultValue={tarefa.process_id} emptyLabel="Nenhum" placeholder="Nenhum" />
              <SelectField name="kpi_id" label="KPI" options={vinculos.kpis} defaultValue={tarefa.kpi_id} emptyLabel="Nenhum" placeholder="Nenhum" />
              <SelectField name="okr_id" label="OKR / iniciativa" options={vinculos.okrs} defaultValue={tarefa.okr_id} emptyLabel="Nenhum" placeholder="Nenhum" />
            </div>

            <Button type="submit" size="sm" className="self-start">
              Salvar alterações
            </Button>
          </form>
        </section>

        {!tarefa.parent_task_id && (
          <Section title="Subtarefas">
            {(subtarefas ?? []).length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhuma subtarefa.</p>
            )}
            {(subtarefas ?? []).length > 0 && (
              <ul className="flex flex-col divide-y rounded-lg border">
                {subtarefas!.map((s) => (
                  <li key={s.id} className="flex items-center gap-3 px-3 py-2 text-sm">
                    <Link href={`/rotinas/${s.id}`} className="min-w-0 flex-1 truncate font-medium hover:underline">
                      {s.titulo}
                    </Link>
                    <span className="hidden text-xs text-muted-foreground sm:inline">
                      {nomeDe(rel(s.profiles))} · {formatarData(s.prazo)}
                    </span>
                    <StatusBadge status={s.status} />
                  </li>
                ))}
              </ul>
            )}
            <form action={criarSubtarefa.bind(null, tarefa.id)} className="flex flex-col gap-2 sm:flex-row">
              <Input name="titulo" placeholder="Nova subtarefa" className="flex-1 text-sm" required />
              <SelectField
                name="responsavel_id"
                options={opcoesMembros(membros)}
                placeholder="Responsável da tarefa"
                className="sm:w-52"
              />
              <Button type="submit" size="sm" variant="outline">
                Adicionar
              </Button>
            </form>
          </Section>
        )}

        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-muted-foreground">Checklist</h2>
          <Checklist taskId={tarefa.id} itens={checklistItens ?? []} />
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-muted-foreground">Comentários</h2>
          <Comments
            taskId={tarefa.id}
            comentarios={
              (comentarios ?? []) as unknown as {
                id: string;
                texto: string;
                criado_em: string;
                profiles: { nome: string | null; email: string | null } | null;
              }[]
            }
          />
        </section>

        <Section title="Anexos e evidências">
          <Attachments entidade="task" entidadeId={tarefa.id} caminhoPagina={`/rotinas/${tarefa.id}`} />
        </Section>

        <Section title="Histórico de alterações">
          <History tabela="tasks" registroId={tarefa.id} />
        </Section>

        <form action={excluirTarefa.bind(null, tarefa.id)} className="border-t pt-4">
          <Button type="submit" variant="ghost" size="sm" className="text-destructive">
            Excluir tarefa
          </Button>
        </form>
      </div>
    </AppShell>
  );
}
