import { AppShell } from "@/components/layout/app-shell";
import { EmptyState } from "@/components/states/empty-state";

export default function RotinasPage() {
  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Rotinas</h1>
        </div>
        <EmptyState title="Em construção" description="Tarefas e rotinas recorrentes chegam na Fase 2." />
      </div>
    </AppShell>
  );
}
