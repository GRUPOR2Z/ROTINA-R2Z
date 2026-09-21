import { Badge } from "@/components/ui/badge";

const ROTULOS: Record<string, string> = {
  rascunho: "Rascunho",
  revisao: "Em revisão",
  publicado: "Publicado",
  arquivado: "Arquivado",
};

const VARIANTES: Record<string, "secondary" | "default" | "destructive" | "outline"> = {
  rascunho: "secondary",
  revisao: "default",
  publicado: "outline",
  arquivado: "destructive",
};

export function ProcessStatusBadge({ status }: { status: string }) {
  return <Badge variant={VARIANTES[status] ?? "secondary"}>{ROTULOS[status] ?? status}</Badge>;
}
