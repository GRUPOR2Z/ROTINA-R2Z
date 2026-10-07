export const TIPOS_MELHORIA = [
  { value: "problema", label: "Problema" },
  { value: "ideia", label: "Ideia" },
  { value: "oportunidade", label: "Oportunidade" },
] as const;

export const STATUS_MELHORIA = [
  { value: "nova", label: "Nova" },
  { value: "em_analise", label: "Em análise" },
  { value: "aprovada", label: "Aprovada" },
  { value: "em_implementacao", label: "Em implementação" },
  { value: "implementada", label: "Implementada" },
  { value: "descartada", label: "Descartada" },
] as const;

export function rotulo(lista: readonly { value: string; label: string }[], valor: string) {
  return lista.find((x) => x.value === valor)?.label ?? valor;
}

/** Prioriza "ganho rapido": impacto alto com esforco baixo primeiro.
 * Escala 1-5 nos dois; sem nota, fica no fim (null). */
export function pontuacaoMelhoria(impacto: number | null, esforco: number | null) {
  if (!impacto || !esforco) return null;
  return Math.round((impacto / esforco) * 10) / 10;
}

export function quadranteMelhoria(impacto: number | null, esforco: number | null) {
  if (!impacto || !esforco) return null;
  const alto = impacto >= 3;
  const facil = esforco <= 2;
  if (alto && facil) return "Ganho rápido";
  if (alto) return "Projeto estratégico";
  if (facil) return "Ajuste simples";
  return "Repensar";
}
