import { dateKey, parseDateKey, somarDias } from "@/lib/calendar";

/** Data em que o processo deveria ser revisado de novo, ou null se nao
 * tem frequencia de revisao (ou nunca foi revisado/publicado). */
export function proximaRevisao(ultimaRevisao: string | null, frequenciaDias: number | null) {
  if (!ultimaRevisao || !frequenciaDias || frequenciaDias <= 0) return null;
  return dateKey(somarDias(parseDateKey(ultimaRevisao), frequenciaDias));
}

export function revisaoVencida(ultimaRevisao: string | null, frequenciaDias: number | null, hoje = new Date()) {
  const proxima = proximaRevisao(ultimaRevisao, frequenciaDias);
  return proxima !== null && proxima < dateKey(hoje);
}
