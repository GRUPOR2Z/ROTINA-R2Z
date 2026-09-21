import { Badge } from "@/components/ui/badge";

const ROTULOS: Record<string, string> = {
  pendente: "Pendente",
  em_andamento: "Em andamento",
  concluida: "Concluída",
  bloqueada: "Bloqueada",
};

const VARIANTES: Record<string, "secondary" | "default" | "destructive" | "outline"> = {
  pendente: "secondary",
  em_andamento: "default",
  concluida: "outline",
  bloqueada: "destructive",
};

export function StatusBadge({ status }: { status: string }) {
  return <Badge variant={VARIANTES[status] ?? "secondary"}>{ROTULOS[status] ?? status}</Badge>;
}

export function estaAtrasada(prazo: string | null, status: string) {
  if (!prazo || status === "concluida") return false;
  return new Date(prazo) < new Date(new Date().toDateString());
}
