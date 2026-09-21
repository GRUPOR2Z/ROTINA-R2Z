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
