import { AppShell } from "@/components/layout/app-shell";
import { ErroBanner, PageHeader } from "@/components/layout/page-header";
import { MeetingFields } from "@/components/decisoes/fields";
import { SubmitButton } from "@/components/ui/submit-button";
import { getAreasEMembros } from "@/lib/lookups";
import { opcoesAreas } from "@/lib/opcoes";
import { criarReuniao } from "../actions";

export default async function NovaReuniaoPage({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  const { erro } = await searchParams;
  const { areas, membros } = await getAreasEMembros();

  return (
    <AppShell>
      <div className="flex max-w-2xl flex-col gap-6">
        <PageHeader title="Nova reunião" back={{ href: "/reunioes", label: "Reuniões" }} />
        <ErroBanner erro={erro} />
        <form action={criarReuniao} className="flex flex-col gap-4">
          <MeetingFields areas={opcoesAreas(areas)} membros={membros} />
          <SubmitButton className="mt-2 self-start" pendingText="Salvando…">
            Registrar reunião
          </SubmitButton>
        </form>
      </div>
    </AppShell>
  );
}
