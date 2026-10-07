import { dateKey, parseDateKey, somarDias } from "@/lib/calendar";

export const TIPOS_ETAPA = [
  { value: "leitura", label: "Ler processo" },
  { value: "documento", label: "Ler documento" },
  { value: "pratica", label: "Tarefa prática" },
  { value: "conversa", label: "Conversa / acompanhamento" },
] as const;

export function rotuloTipoEtapa(tipo: string) {
  return TIPOS_ETAPA.find((t) => t.value === tipo)?.label ?? tipo;
}

/** Prazo absoluto de uma etapa = inicio da pessoa + prazo_dias. */
export function prazoDaEtapa(dataInicio: string, prazoDias: number | null) {
  if (prazoDias == null) return null;
  return dateKey(somarDias(parseDateKey(dataInicio), prazoDias));
}

export function progressoOnboarding(totalEtapas: number, concluidas: number) {
  if (totalEtapas === 0) return null;
  return Math.round((Math.min(concluidas, totalEtapas) / totalEtapas) * 100);
}
