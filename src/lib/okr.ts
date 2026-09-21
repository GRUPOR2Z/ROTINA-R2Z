/** Progresso de 0 a 100, calculado pela distância percorrida entre o
 * valor inicial e o alvo — funciona igual pra metas de subir ou de
 * descer, mesma lógica do farol de KPI. */
export function calcularProgresso(valorInicial: number, valorAtual: number, valorAlvo: number): number {
  const distanciaTotal = valorAlvo - valorInicial;
  if (distanciaTotal === 0) return valorAtual === valorAlvo ? 100 : 0;

  const progresso = ((valorAtual - valorInicial) / distanciaTotal) * 100;
  return Math.max(0, Math.min(100, progresso));
}
