import { AppShell } from "@/components/layout/app-shell";
import { EmptyState } from "@/components/states/empty-state";

export default function ConfiguraesPage() {
  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Configurações</h1>
        </div>
        <EmptyState title="Em construção" description="Gestão de usuários e permissões — próximo item do backlog da Fase 1." />
      </div>
    </AppShell>
  );
}
