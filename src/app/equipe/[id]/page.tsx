import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { EmptyState } from "@/components/states/empty-state";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AddTagForm } from "@/components/team/add-tag-form";
import { AddNoteForm } from "@/components/team/add-note-form";
import { StatTile } from "@/components/dashboard/stat-tile";
import { StatusBadge, estaAtrasada } from "@/components/rotinas/status-badge";
import { createClient } from "@/lib/supabase/server";
import { calcularCarga } from "@/lib/equipe";
import { dateKey } from "@/lib/calendar";
import { formatarData as formatarDataCurta, rel } from "@/lib/format";
import { getCurrentProfile } from "@/lib/current-profile";
import { adicionarTag, removerTag, adicionarNota } from "./actions";

function iniciais(nome: string | null, email: string | null) {
  const base = nome?.trim() || email || "?";
  return base.slice(0, 2).toUpperCase();
}

function formatarData(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default async function PerfilMembroPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const eu = await getCurrentProfile();

  const { data: membro } = await supabase
    .from("profiles")
    .select("id, nome, email, cargo, areas(nome), roles(nome), member_tags(id, tag)")
    .eq("id", id)
    .maybeSingle();

  if (!membro) notFound();

  const [{ data: notas }, { data: tarefas }, { data: projetos }, { data: processos }] = await Promise.all([
    supabase
      .from("member_notes")
      .select("id, tipo, texto, criado_em")
      .eq("profile_id", id)
      .order("criado_em", { ascending: false }),
    supabase
      .from("tasks")
      .select("id, titulo, status, prazo, concluida_em, responsavel_id")
      .eq("responsavel_id", id)
      .is("parent_task_id", null)
      .order("prazo", { ascending: true, nullsFirst: false }),
    supabase
      .from("project_members")
      .select("papel, projects(id, nome, status, prazo)")
      .eq("profile_id", id),
    supabase
      .from("processes")
      .select("id, titulo, status, critico, responsavel_id, substituto_id")
      .or(`responsavel_id.eq.${id},substituto_id.eq.${id}`)
      .neq("status", "arquivado")
      .order("titulo"),
  ]);

  const carga = calcularCarga(tarefas ?? []).get(id) ?? { abertas: 0, atrasadas: 0, bloqueadas: 0, concluidas30d: 0 };
  const abertas = (tarefas ?? []).filter((t) => t.status !== "concluida");
  const totalComPrazoVencido = (tarefas ?? []).filter((t) => t.prazo && t.prazo < dateKey(new Date())).length;
  const concluidasNoPrazo = (tarefas ?? []).filter(
    (t) => t.status === "concluida" && t.prazo && t.concluida_em && t.concluida_em.slice(0, 10) <= t.prazo,
  ).length;
  const projetosAtivos = (projetos ?? [])
    .map((p) => ({ papel: p.papel, projeto: rel<{ id: string; nome: string; status: string; prazo: string | null }>(p.projects) }))
    .filter((p) => p.projeto && !["concluido", "cancelado"].includes(p.projeto.status));

  const area = (membro.areas as unknown as { nome: string } | null)?.nome;
  const papel = (membro.roles as unknown as { nome: string } | null)?.nome;
  const tags = (membro.member_tags ?? []) as { id: string; tag: string }[];
  const podeEditarTags = eu?.isAdmin || eu?.id === membro.id;
  const podeRegistrarNota = Boolean(eu?.isAdmin);

  return (
    <AppShell>
      <div className="flex flex-col gap-8">
        <div className="flex items-center justify-between">
          <Link href="/equipe" className="text-sm text-muted-foreground hover:text-foreground">
            ← Equipe
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarFallback className="text-lg">
              {iniciais(membro.nome, membro.email)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {membro.nome || membro.email}
            </h1>
            <p className="text-sm text-muted-foreground">
              {membro.cargo || papel || "—"}
              {area ? ` · ${area}` : ""}
            </p>
          </div>
        </div>

        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-muted-foreground">Competências</h2>
          <div className="flex flex-wrap items-center gap-2">
            {tags.length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhuma competência registrada.</p>
            )}
            {tags.map((t) => (
              <span key={t.id} className="inline-flex items-center gap-1">
                <Badge variant="outline">{t.tag}</Badge>
                {podeEditarTags && (
                  <form action={removerTag.bind(null, membro.id, t.id)}>
                    <Button
                      type="submit"
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 text-muted-foreground"
                      aria-label={`Remover competência ${t.tag}`}
                    >
                      ×
                    </Button>
                  </form>
                )}
              </span>
            ))}
          </div>
          {podeEditarTags && <AddTagForm action={adicionarTag.bind(null, membro.id)} />}
        </section>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatTile label="Tarefas abertas" value={carga.abertas} href={`/rotinas?responsavel=${id}`} />
          <StatTile label="Atrasadas" value={carga.atrasadas} tone="critical" />
          <StatTile label="Bloqueadas" value={carga.bloqueadas} tone="critical" />
          <StatTile label="Concluídas (30 dias)" value={carga.concluidas30d} />
        </div>

        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-muted-foreground">Rotina</h2>
          {abertas.length === 0 ? (
            <EmptyState title="Nenhuma tarefa aberta" description="As tarefas sob responsabilidade desta pessoa aparecem aqui." />
          ) : (
            <ul className="flex flex-col divide-y rounded-lg border">
              {abertas.slice(0, 15).map((t) => (
                <li key={t.id} className="flex items-center gap-3 px-3 py-2 text-sm">
                  <Link href={`/rotinas/${t.id}`} className="min-w-0 flex-1 truncate hover:underline">
                    {t.titulo}
                  </Link>
                  <span className={`text-xs ${estaAtrasada(t.prazo, t.status) ? "text-destructive" : "text-muted-foreground"}`}>
                    {formatarDataCurta(t.prazo)}
                  </span>
                  <StatusBadge status={t.status} />
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <section className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold text-muted-foreground">Projetos ativos</h2>
            {projetosAtivos.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum projeto ativo.</p>
            ) : (
              <ul className="flex flex-col gap-1">
                {projetosAtivos.map(({ papel, projeto }) => (
                  <li key={projeto!.id} className="flex justify-between gap-2 text-sm">
                    <Link href={`/projetos/${projeto!.id}`} className="truncate hover:underline">
                      {projeto!.nome}
                    </Link>
                    <span className="shrink-0 text-xs text-muted-foreground">{papel || formatarDataCurta(projeto!.prazo)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold text-muted-foreground">Processos</h2>
            {(processos ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">Não é responsável nem substituto de nenhum processo.</p>
            ) : (
              <ul className="flex flex-col gap-1">
                {processos!.map((p) => (
                  <li key={p.id} className="flex justify-between gap-2 text-sm">
                    <Link href={`/processos/${p.id}`} className="truncate hover:underline">
                      {p.titulo}
                    </Link>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {p.responsavel_id === id ? "responsável" : "substituto"}
                      {p.responsavel_id === id && !p.substituto_id && (
                        <span className={p.critico ? "text-destructive" : ""}> · sem substituto</span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-muted-foreground">
            Resultados &amp; falhas
          </h2>
          <p className="text-sm text-muted-foreground">
            {concluidasNoPrazo} tarefa(s) concluída(s) dentro do prazo · {totalComPrazoVencido} com prazo já vencido no total
            (concluídas ou não). Calculado a partir das tarefas reais.
          </p>

          <div className="flex flex-col gap-2">
            {(!notas || notas.length === 0) && (
              <p className="text-sm text-muted-foreground">Nenhum registro manual ainda.</p>
            )}
            {notas?.map((n) => (
              <div key={n.id} className="rounded-lg border p-3">
                <div className="mb-1 flex items-center gap-2">
                  <Badge variant={n.tipo === "falha" ? "destructive" : "default"}>
                    {n.tipo === "falha" ? "Falha" : "Resultado"}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatarData(n.criado_em)}
                  </span>
                </div>
                <p className="text-sm">{n.texto}</p>
              </div>
            ))}
          </div>

          {podeRegistrarNota && <AddNoteForm action={adicionarNota.bind(null, membro.id)} />}
        </section>
      </div>
    </AppShell>
  );
}
