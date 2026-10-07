import { AppShell } from "@/components/layout/app-shell";
import { ErroBanner, PageHeader } from "@/components/layout/page-header";
import { ImprovementFields } from "@/components/melhorias/fields";
import { SubmitButton } from "@/components/ui/submit-button";
import { getAreasEMembros, getVinculosTarefa } from "@/lib/lookups";
import { opcoesAreas, opcoesMembros } from "@/lib/opcoes";
import { criarMelhoria } from "../actions";

export default async function NovaMelhoriaPage({ searchParams }: { searchParams: Promise<{ erro?: string; processo?: string }> }) {
  const { erro, processo } = await searchParams;
  const [{ areas, membros }, vinculos] = await Promise.all([getAreasEMembros(), getVinculosTarefa()]);

  return (
    <AppShell>
      <div className="flex max-w-2xl flex-col gap-6">
        <PageHeader
          title="Registrar melhoria"
          back={{ href: "/melhorias", label: "Melhorias" }}
          description="Qualquer pessoa pode registrar — gestores avaliam e aprovam."
        />
        <ErroBanner erro={erro} />
        <form action={criarMelhoria} className="flex flex-col gap-4">
          <ImprovementFields
            areas={opcoesAreas(areas)}
            membros={opcoesMembros(membros)}
            processos={vinculos.processos}
            melhoria={{ process_id: processo ?? null }}
          />
          <SubmitButton className="mt-2 self-start" pendingText="Salvando…">
            Registrar
          </SubmitButton>
        </form>
      </div>
    </AppShell>
  );
}
