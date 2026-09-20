import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { EmptyState } from "@/components/states/empty-state";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AddTagForm } from "@/components/team/add-tag-form";
import { AddNoteForm } from "@/components/team/add-note-form";
import { createClient } from "@/lib/supabase/server";
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

  const { data: notas } = await supabase
    .from("member_notes")
    .select("id, tipo, texto, criado_em")
    .eq("profile_id", id)
    .order("criado_em", { ascending: false });

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

        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-muted-foreground">Rotina</h2>
          <EmptyState
            title="Sem tarefas ainda"
            description="A rotina desta pessoa aparece aqui quando o módulo de Tarefas (Fase 2) estiver no ar."
          />
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-muted-foreground">
            Resultados &amp; falhas
          </h2>
          <EmptyState
            title="Painel calculado ainda não disponível"
            description="Taxa de conclusão e atrasos dependem das tarefas (Fase 2) — nada é simulado até lá."
          />

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
