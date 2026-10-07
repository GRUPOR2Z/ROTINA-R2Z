import { dateKey, getWeekDays, somarDias } from "@/lib/calendar";

export const PERIODOS = [
  { value: "semana", label: "Esta semana" },
  { value: "mes", label: "Este mês" },
  { value: "30d", label: "Últimos 30 dias" },
  { value: "proximos30", label: "Próximos 30 dias" },
] as const;

export type Periodo = (typeof PERIODOS)[number]["value"];

/** Intervalo [inicio, fim] (YYYY-MM-DD, inclusivo) do periodo, ou null
 * pra "todo o periodo". */
export function intervaloDoPeriodo(periodo: string | undefined, hoje = new Date()) {
  switch (periodo) {
    case "semana": {
      const dias = getWeekDays(hoje);
      return { inicio: dateKey(dias[0]), fim: dateKey(dias[6]) };
    }
    case "mes": {
      const inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      const fim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
      return { inicio: dateKey(inicio), fim: dateKey(fim) };
    }
    case "30d":
      return { inicio: dateKey(somarDias(hoje, -30)), fim: dateKey(hoje) };
    case "proximos30":
      return { inicio: dateKey(hoje), fim: dateKey(somarDias(hoje, 30)) };
    default:
      return null;
  }
}
