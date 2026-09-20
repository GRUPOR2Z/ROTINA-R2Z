import { AppShell } from "@/components/layout/app-shell";
import { EmptyState } from "@/components/states/empty-state";

export default function DashboardPage() {
  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Visão geral de tarefas, rotinas e indicadores.
          </p>
        </div>
        <EmptyState
          title="Ainda não há dados para mostrar"
          description="Tarefas, KPIs e OKRs aparecem aqui assim que os módulos das Fases 2 e 3 estiverem no ar."
        />
      </div>
    </AppShell>
  );
}
