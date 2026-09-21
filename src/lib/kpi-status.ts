export type DirecaoKpi = "maior_melhor" | "menor_melhor";
export type FarolKpi = "ok" | "atencao" | "critico" | "sem_dados";

export function calcularFarol(
  valor: number | null,
  limiarAtencao: number | null,
  limiarCritico: number | null,
  direcao: DirecaoKpi,
): FarolKpi {
  if (valor === null || (limiarAtencao === null && limiarCritico === null)) {
    return "sem_dados";
  }

  if (direcao === "maior_melhor") {
    if (limiarCritico !== null && valor <= limiarCritico) return "critico";
    if (limiarAtencao !== null && valor <= limiarAtencao) return "atencao";
    return "ok";
  }

  // menor_melhor: valor alto e' ruim
  if (limiarCritico !== null && valor >= limiarCritico) return "critico";
  if (limiarAtencao !== null && valor >= limiarAtencao) return "atencao";
  return "ok";
}
