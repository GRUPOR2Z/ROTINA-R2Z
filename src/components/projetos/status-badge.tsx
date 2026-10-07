import { STATUS_PROJETO, situacaoPrazo, type SituacaoPrazo } from "@/lib/projetos";
import { cn } from "@/lib/utils";

export function ProjectStatusBadge({ status }: { status: string }) {
  const s = STATUS_PROJETO.find((x) => x.value === status);
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium">
      <span className={cn("h-1.5 w-1.5 rounded-full", s?.dot ?? "bg-slate-400")} />
      {s?.label ?? status}
    </span>
  );
}

const PRAZO: Record<SituacaoPrazo, { label: string; cls: string } | null> = {
  sem_prazo: null,
  no_prazo: { label: "No prazo", cls: "text-muted-foreground" },
  proximo: { label: "Prazo próximo", cls: "text-amber-600 dark:text-amber-400" },
  atrasado: { label: "Atrasado", cls: "text-destructive" },
  entregue: { label: "Entregue", cls: "text-emerald-600 dark:text-emerald-400" },
};

export function PrazoProjeto({ prazo, status }: { prazo: string | null; status: string }) {
  const info = PRAZO[situacaoPrazo(prazo, status)];
  if (!info) return null;
  return <span className={cn("text-xs font-medium", info.cls)}>{info.label}</span>;
}

export function BarraAndamento({ valor }: { valor: number | null }) {
  if (valor === null) return <span className="text-xs text-muted-foreground">Sem tarefas ou entregas</span>;
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary" style={{ width: `${valor}%` }} />
      </div>
      <span className="w-9 text-right text-xs tabular-nums text-muted-foreground">{valor}%</span>
    </div>
  );
}
