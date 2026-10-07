import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader, Section } from "@/components/layout/page-header";
import { BarraAndamento } from "@/components/projetos/status-badge";
import { EmptyState } from "@/components/states/empty-state";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/current-profile";
import { progressoOnboarding } from "@/lib/onboarding";
import { formatarData, nomeDe, rel } from "@/lib/format";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const eu = await getCurrentProfile();

  const [{ data: trilhas }, { data: inscricoes }, { data: progresso }] = await Promise.all([
    supabase
      .from("onboarding_tracks")
      .select("id, nome, cargo, ativo, areas(nome), onboarding_steps(id)")
      .order("nome"),
    supabase
      .from("onboarding_assignments")
      .select(
        "id, track_id, prazo, concluido_em, pessoa:profiles!onboarding_assignments_profile_id_fkey(id, nome, email), mentor:profiles!onboarding_assignments_mentor_id_fkey(nome, email), onboarding_tracks(nome)",
      )
      .order("concluido_em", { ascending: true, nullsFirst: true })
      .order("criado_em", { ascending: false }),
    supabase.from("onboarding_progress").select("assignment_id"),
  ]);

  const etapasPorTrilha = new Map((trilhas ?? []).map((t) => [t.id, (t.onboarding_steps ?? []).length]));
  const feitasPorInscricao = new Map<string, number>();
  for (const p of progresso ?? []) feitasPorInscricao.set(p.assignment_id, (feitasPorInscricao.get(p.assignment_id) ?? 0) + 1);

  const minhas = (inscricoes ?? []).filter((i) => rel<{ id: string }>(i.pessoa)?.id === eu?.id && !i.concluido_em);

  return (
    <AppShell>
      <div className="flex flex-col gap-8">
        <PageHeader
          title="Onboarding"
          description="Trilhas de capacitação por cargo, com processos, documentos e tarefas práticas."
          actions={
            <Link href="/onboarding/trilhas/nova" className={buttonVariants()}>
              Nova trilha
            </Link>
          }
        />

        {minhas.length > 0 && (
          <Section title="Minha trilha">
            {minhas.map((i) => (
              <Link key={i.id} href={`/onboarding/inscricoes/${i.id}`} className="flex flex-col gap-2 rounded-lg border border-primary/30 bg-primary/5 p-4 hover:bg-primary/10">
                <span className="font-medium">{rel<{ nome: string }>(i.onboarding_tracks)?.nome}</span>
                <BarraAndamento valor={progressoOnboarding(etapasPorTrilha.get(i.track_id) ?? 0, feitasPorInscricao.get(i.id) ?? 0)} />
              </Link>
            ))}
          </Section>
        )}

        <Section title="Pessoas em onboarding">
          {(inscricoes ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">Ninguém inscrito em uma trilha ainda.</p>
          ) : (
            <ul className="flex flex-col divide-y rounded-lg border">
              {inscricoes!.map((i) => (
                <li key={i.id}>
                  <Link href={`/onboarding/inscricoes/${i.id}`} className="grid grid-cols-1 gap-2 px-4 py-3 hover:bg-muted/40 sm:grid-cols-[1fr_1fr_10rem] sm:items-center">
                    <span>
                      <span className="font-medium">{nomeDe(rel(i.pessoa))}</span>
                      <span className="block text-xs text-muted-foreground">
                        {rel<{ nome: string }>(i.onboarding_tracks)?.nome} · mentor: {nomeDe(rel(i.mentor))}
                      </span>
                    </span>
                    <BarraAndamento valor={progressoOnboarding(etapasPorTrilha.get(i.track_id) ?? 0, feitasPorInscricao.get(i.id) ?? 0)} />
                    <span className="text-xs text-muted-foreground sm:text-right">
                      {i.concluido_em ? <Badge variant="outline">Concluído</Badge> : `prazo ${formatarData(i.prazo)}`}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title="Trilhas">
          {(trilhas ?? []).length === 0 ? (
            <EmptyState title="Nenhuma trilha criada" description="Crie uma trilha por cargo ou perfil — ex: Atendimento comercial." />
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4">
              {trilhas!.map((t) => (
                <Link key={t.id} href={`/onboarding/trilhas/${t.id}`} className={`flex flex-col gap-1 rounded-lg border p-4 hover:bg-muted/40 ${t.ativo ? "" : "opacity-60"}`}>
                  <span className="font-medium">{t.nome}</span>
                  <span className="text-xs text-muted-foreground">
                    {[t.cargo, rel<{ nome: string }>(t.areas)?.nome].filter(Boolean).join(" · ") || "—"}
                  </span>
                  <span className="text-xs text-muted-foreground">{(t.onboarding_steps ?? []).length} etapas</span>
                </Link>
              ))}
            </div>
          )}
        </Section>
      </div>
    </AppShell>
  );
}
