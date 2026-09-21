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
import { createClient } from "@/lib/supabase/server";
import { getAreasEMembros } from "@/lib/lookups";
import { atualizarTarefa, excluirTarefa } from "../actions";

export default async function TarefaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { areas, membros } = await getAreasEMembros();

  const { data: tarefa } = await supabase
    .from("tasks")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!tarefa) notFound();

  const [{ data: checklistItens }, { data: comentarios }] = await Promise.all([
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
  ]);

  const atrasada = estaAtrasada(tarefa.prazo, tarefa.status);

  return (
    <AppShell>
      <div className="flex max-w-3xl flex-col gap-8">
        <div>
          <Link href="/rotinas" className="text-sm text-muted-foreground hover:text-foreground">
            ← Rotinas
          </Link>
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
        </div>

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
            </div>

            <Button type="submit" size="sm" className="self-start">
              Salvar alterações
            </Button>
          </form>
        </section>

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

        <form action={excluirTarefa.bind(null, tarefa.id)} className="border-t pt-4">
          <Button type="submit" variant="ghost" size="sm" className="text-destructive">
            Excluir tarefa
          </Button>
        </form>
      </div>
    </AppShell>
  );
}
