import { describe, expect, it } from "vitest";
import { agruparAchados, resumoValidacao } from "./ia";

const achados = [
  { id: "r1", tipo: "recomendacao", prioridade: "baixa", validacao: "pendente" },
  { id: "f1", tipo: "fato", prioridade: "media", validacao: "validado" },
  { id: "r2", tipo: "recomendacao", prioridade: "alta", validacao: "rejeitado" },
];

describe("agruparAchados", () => {
  it("separa por tipo na ordem fato, hipotese, problema, recomendacao", () => {
    const grupos = agruparAchados(achados);
    expect(grupos.map((g) => g.value)).toEqual(["fato", "hipotese", "problema", "recomendacao"]);
    expect(grupos[0].itens.map((a) => a.id)).toEqual(["f1"]);
    expect(grupos[1].itens).toHaveLength(0);
  });

  it("ordena por prioridade dentro do grupo", () => {
    const recomendacoes = agruparAchados(achados)[3].itens;
    expect(recomendacoes.map((a) => a.id)).toEqual(["r2", "r1"]);
  });
});

describe("resumoValidacao", () => {
  it("conta por estado de validacao", () => {
    expect(resumoValidacao(achados)).toEqual({ pendentes: 1, validados: 1, rejeitados: 1 });
  });
});
