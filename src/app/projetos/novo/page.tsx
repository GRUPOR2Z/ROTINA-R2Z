import { AppShell } from "@/components/layout/app-shell";
import { ErroBanner, PageHeader } from "@/components/layout/page-header";
import { ProjectFields } from "@/components/projetos/project-fields";
import { SubmitButton } from "@/components/ui/submit-button";
import { getAreasEMembros } from "@/lib/lookups";
import { getClientesAtivos } from "@/lib/clients-data";
import { opcoesAreas, opcoesMembros } from "@/lib/opcoes";
import { criarProjeto } from "../actions";

export default async function NovoProjetoPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string; cliente?: string }>;
}) {
  const { erro, cliente } = await searchParams;
  const { areas, membros } = await getAreasEMembros();
  const clientes = await getClientesAtivos();

  return (
    <AppShell>
      <div className="flex max-w-2xl flex-col gap-6">
        <PageHeader title="Novo projeto" back={{ href: "/projetos", label: "Projetos" }} />
        <ErroBanner erro={erro} />
        <form action={criarProjeto} className="flex flex-col gap-4">
          <ProjectFields
            areas={opcoesAreas(areas)}
            membros={opcoesMembros(membros)}
            clientes={clientes.map((c) => ({ value: c.id, label: c.nome }))}
            projeto={{ client_id: cliente ?? null }}
          />
          <SubmitButton className="mt-2 self-start" pendingText="Criando…">
            Criar projeto
          </SubmitButton>
        </form>
      </div>
    </AppShell>
  );
}
