import { AppShell } from "@/components/layout/app-shell";
import { ErroBanner, PageHeader } from "@/components/layout/page-header";
import { SelectField } from "@/components/forms/select-field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/components/ui/submit-button";
import { getAreasEMembros } from "@/lib/lookups";
import { opcoesAreas } from "@/lib/opcoes";
import { criarTrilha } from "../../actions";

export default async function NovaTrilhaPage({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  const { erro } = await searchParams;
  const { areas } = await getAreasEMembros();

  return (
    <AppShell>
      <div className="flex max-w-xl flex-col gap-6">
        <PageHeader title="Nova trilha" back={{ href: "/onboarding", label: "Onboarding" }} description="Depois de criar, adicione as etapas." />
        <ErroBanner erro={erro} />
        <form action={criarTrilha} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="nome">Nome</Label>
            <Input id="nome" name="nome" required placeholder="ex: Atendimento comercial — primeiros 30 dias" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="cargo">Cargo / perfil</Label>
              <Input id="cargo" name="cargo" />
            </div>
            <SelectField name="area_id" label="Área" options={opcoesAreas(areas)} emptyLabel="Sem área" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea id="descricao" name="descricao" />
          </div>
          <SubmitButton className="self-start" pendingText="Criando…">
            Criar trilha
          </SubmitButton>
        </form>
      </div>
    </AppShell>
  );
}
