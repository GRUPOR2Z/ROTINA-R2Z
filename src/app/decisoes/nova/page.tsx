import { AppShell } from "@/components/layout/app-shell";
import { ErroBanner, PageHeader } from "@/components/layout/page-header";
import { DecisionFields } from "@/components/decisoes/fields";
import { SubmitButton } from "@/components/ui/submit-button";
import { getAreasEMembros, getReunioesRecentes, getVinculosTarefa } from "@/lib/lookups";
import { opcoesAreas } from "@/lib/opcoes";
import { criarDecisao } from "@/app/reunioes/actions";

export default async function NovaDecisaoPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string; reuniao?: string; processo?: string; tarefa?: string }>;
}) {
  const { erro, reuniao, processo, tarefa } = await searchParams;
  const [{ areas, membros }, reunioes, vinculos] = await Promise.all([
    getAreasEMembros(),
    getReunioesRecentes(),
    getVinculosTarefa(),
  ]);

  return (
    <AppShell>
      <div className="flex max-w-2xl flex-col gap-6">
        <PageHeader title="Registrar decisão" back={{ href: "/decisoes", label: "Decisões" }} />
        <ErroBanner erro={erro} />
        <form action={criarDecisao} className="flex flex-col gap-4">
          <DecisionFields
            areas={opcoesAreas(areas)}
            membros={membros}
            reunioes={reunioes}
            processos={vinculos.processos}
            okrs={vinculos.okrs}
            decisao={{ meeting_id: reuniao ?? null, process_id: processo ?? null, task_id: tarefa ?? null }}
          />
          <SubmitButton className="mt-2 self-start" pendingText="Salvando…">
            Registrar decisão
          </SubmitButton>
        </form>
      </div>
    </AppShell>
  );
}
