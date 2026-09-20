import { AppShell } from "@/components/layout/app-shell";
import { EmptyState } from "@/components/states/empty-state";

export default function KPIsPage() {
  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">KPIs</h1>
        </div>
        <EmptyState title="Em construção" description="Cadastro de indicadores e histórico de valores chegam na Fase 3." />
      </div>
    </AppShell>
  );
}
