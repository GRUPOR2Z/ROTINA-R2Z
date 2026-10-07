import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { BarraAndamento } from "@/components/projetos/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { prazoDaEtapa, progressoOnboarding, rotuloTipoEtapa } from "@/lib/onboarding";
import { dateKey } from "@/lib/calendar";
import { formatarData, nomeDe, rel } from "@/lib/format";
import { alternarEtapaConcluida, cancelarInscricao } from "../../actions";

export default async function InscricaoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: inscricao } = await supabase
    .from("onboarding_assignments")
    .select(
      "*, pessoa:profiles!onboarding_assignments_profile_id_fkey(nome, email), mentor:profiles!onboarding_assignments_mentor_id_fkey(nome, email), onboarding_tracks(id, nome)",
    )
    .eq("id", id)
    .maybeSingle();
  if (!inscricao) notFound();

  const [{ data: etapas }, { data: progresso }] = await Promise.all([
    supabase
      .from("onboarding_steps")
      .select("id, titulo, descricao, tipo, prazo_dias, processes(id, titulo)")
      .eq("track_id", inscricao.track_id)
      .order("ordem"),
    supabase.from("onboarding_progress").select("step_id, concluido_em, profiles(nome, email)").eq("assignment_id", id),
  ]);

  const feitas = new Map((progresso ?? []).map((p) => [p.step_id, p]));
  const trilha = rel<{ id: string; nome: string }>(inscricao.onboarding_tracks);
  const hoje = dateKey(new Date());
  const pct = progressoOnboarding((etapas ?? []).length, feitas.size);

  return (
    <AppShell>
      <div className="flex max-w-3xl flex-col gap-6">
        <PageHeader
          title={`${nomeDe(rel(inscricao.pessoa))} — ${trilha?.nome ?? "Onboarding"}`}
          back={{ href: "/onboarding", label: "Onboarding" }}
          description={`Início ${formatarData(inscricao.data_inicio, { ano: true })} · prazo ${formatarData(inscricao.prazo, { ano: true })} · mentor: ${nomeDe(rel(inscricao.mentor))}`}
          actions={inscricao.concluido_em ? <Badge>Concluído</Badge> : undefined}
        />

        <BarraAndamento valor={pct} />

        <ol className="flex flex-col gap-2">
          {(etapas ?? []).map((e, idx) => {
            const feita = feitas.get(e.id);
            const prazo = prazoDaEtapa(inscricao.data_inicio, e.prazo_dias);
            const atrasada = !feita && prazo !== null && prazo < hoje;
            const processo = rel<{ id: string; titulo: string }>(e.processes);
            return (
              <li key={e.id} className={`flex gap-3 rounded-lg border p-3 ${feita ? "bg-muted/30" : ""}`}>
                <form action={alternarEtapaConcluida.bind(null, id, e.id, !feita)}>
                  <button
                    type="submit"
                    aria-label={feita ? "Desmarcar etapa" : "Marcar etapa como concluída"}
                    className={`mt-0.5 flex h-5 w-5 items-center justify-center rounded border text-xs ${feita ? "border-primary bg-primary text-primary-foreground" : ""}`}
                  >
                    {feita ? "✓" : idx + 1}
                  </button>
                </form>
                <div className="flex min-w-0 flex-1 flex-col gap-1 text-sm">
                  <span className={feita ? "font-medium text-muted-foreground line-through" : "font-medium"}>{e.titulo}</span>
                  <span className="text-xs text-muted-foreground">
                    {rotuloTipoEtapa(e.tipo)}
                    {prazo && <span className={atrasada ? "text-destructive" : ""}> · até {formatarData(prazo)}</span>}
                    {feita && ` · concluída por ${nomeDe(rel(feita.profiles))} em ${formatarData(feita.concluido_em)}`}
                  </span>
                  {e.descricao && <p className="whitespace-pre-wrap text-muted-foreground">{e.descricao}</p>}
                  {processo && (
                    <Link href={`/processos/${processo.id}`} className="text-xs text-primary hover:underline">
                      Abrir processo: {processo.titulo}
                    </Link>
                  )}
                </div>
              </li>
            );
          })}
        </ol>

        <form action={cancelarInscricao.bind(null, id)} className="border-t pt-4">
          <Button type="submit" variant="ghost" size="sm" className="text-destructive">
            Cancelar inscrição
          </Button>
        </form>
      </div>
    </AppShell>
  );
}
