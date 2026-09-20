import { AppShell } from "@/components/layout/app-shell";
import { EmptyState } from "@/components/states/empty-state";

export default function ProcessosPage() {
  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Processos</h1>
        </div>
        <EmptyState title="Em construção" description="A biblioteca de processos, com versionamento, chega na Fase 2." />
      </div>
    </AppShell>
  );
}
