export type FarolKpi = "ok" | "atencao" | "critico" | "sem_dados";

/**
 * Farol calculado pela distância percorrida entre o valor inicial e a
 * meta — não precisa que ninguém defina limiares nem direção "maior é
 * melhor". Funciona igual pra metas de subir (2 → 4) ou de descer
 * (10% → 2%), porque divide pela distância total (que já vem com o
 * sinal certo).
 */
export function calcularFarolPorMeta(
  valorAtual: number | null,
  valorInicial: number | null,
  meta: number | null,
): FarolKpi {
  if (valorAtual === null || valorInicial === null || meta === null) {
    return "sem_dados";
  }

  const distanciaTotal = meta - valorInicial;
  if (distanciaTotal === 0) {
    return valorAtual === meta ? "ok" : "atencao";
  }

  const progresso = (valorAtual - valorInicial) / distanciaTotal;

  if (progresso >= 1) return "ok";
  if (progresso >= 0.5) return "atencao";
  return "critico";
}

// mesma tolerancia usada em gerar_alertas() (migration 0024)
const TOLERANCIA_DIAS: Record<string, number> = { diaria: 2, semanal: 9, mensal: 35, trimestral: 100 };

/** Ate quando o ultimo valor do KPI vale, pela periodicidade (Doc. 2:
 * "exibir a validade e a data da ultima atualizacao"). */
export function validadeKpi(ultimaReferencia: string | null, periodicidade: string, hoje = new Date()) {
  if (!ultimaReferencia) return { validoAte: null, desatualizado: true };
  const d = new Date(`${ultimaReferencia}T00:00:00`);
  d.setDate(d.getDate() + (TOLERANCIA_DIAS[periodicidade] ?? 35));
  const validoAte = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const hojeKey = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}-${String(hoje.getDate()).padStart(2, "0")}`;
  return { validoAte, desatualizado: validoAte < hojeKey };
}
