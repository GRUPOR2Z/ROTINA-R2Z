import { dateKey } from "@/lib/calendar";

export const STATUS_PROJETO = [
  { value: "planejamento", label: "Planejamento", dot: "bg-slate-400" },
  { value: "em_andamento", label: "Em andamento", dot: "bg-blue-500" },
  { value: "pausado", label: "Pausado", dot: "bg-amber-500" },
  { value: "concluido", label: "Concluído", dot: "bg-emerald-500" },
  { value: "cancelado", label: "Cancelado", dot: "bg-muted-foreground/40" },
] as const;

export type StatusProjeto = (typeof STATUS_PROJETO)[number]["value"];

export function rotuloStatusProjeto(status: string) {
  return STATUS_PROJETO.find((s) => s.value === status)?.label ?? status;
}

/** Andamento = media de tarefas e entregas concluidas (o que existir).
 * Sem nada cadastrado, nao inventa numero: devolve null. */
export function calcularAndamento(
  tarefas: { status: string }[],
  entregas: { concluido: boolean }[],
) {
  const partes: number[] = [];
  if (tarefas.length > 0) partes.push(tarefas.filter((t) => t.status === "concluida").length / tarefas.length);
  if (entregas.length > 0) partes.push(entregas.filter((e) => e.concluido).length / entregas.length);
  if (partes.length === 0) return null;
  return Math.round((partes.reduce((a, b) => a + b, 0) / partes.length) * 100);
}

export type SituacaoPrazo = "sem_prazo" | "no_prazo" | "proximo" | "atrasado" | "entregue";

/** Cumprimento de prazo do projeto (Doc. 2: "exibir andamento e
 * cumprimento de prazos"). "proximo" = vence em ate 7 dias. */
export function situacaoPrazo(prazo: string | null, status: string, hoje = new Date()): SituacaoPrazo {
  if (status === "concluido") return "entregue";
  if (!prazo) return "sem_prazo";
  const hojeKey = dateKey(hoje);
  if (prazo < hojeKey) return "atrasado";
  const limite = dateKey(new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + 7));
  return prazo <= limite ? "proximo" : "no_prazo";
}
