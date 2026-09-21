import { Badge } from "@/components/ui/badge";
import type { FarolKpi } from "@/lib/kpi-status";

const ROTULOS: Record<FarolKpi, string> = {
  ok: "Ok",
  atencao: "Atenção",
  critico: "Crítico",
  sem_dados: "Sem dados",
};

const CLASSES: Record<FarolKpi, string> = {
  ok: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300",
  atencao: "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300",
  critico: "bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300",
  sem_dados: "bg-muted text-muted-foreground",
};

export function FarolBadge({ farol }: { farol: FarolKpi }) {
  return <Badge className={CLASSES[farol]}>{ROTULOS[farol]}</Badge>;
}
