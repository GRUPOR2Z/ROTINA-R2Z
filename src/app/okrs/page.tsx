import { AppShell } from "@/components/layout/app-shell";
import { EmptyState } from "@/components/states/empty-state";

export default function OKRsPage() {
  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">OKRs</h1>
        </div>
        <EmptyState title="Em construção" description="Ciclos, objetivos e resultados-chave chegam na Fase 3." />
      </div>
    </AppShell>
  );
}
