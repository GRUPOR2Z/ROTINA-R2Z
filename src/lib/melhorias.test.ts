import { describe, expect, it } from "vitest";
import { pontuacaoMelhoria, quadranteMelhoria } from "./melhorias";

describe("pontuacaoMelhoria", () => {
  it("impacto alto e esforco baixo pontua mais", () => {
    expect(pontuacaoMelhoria(5, 1)).toBe(5);
    expect(pontuacaoMelhoria(2, 4)).toBe(0.5);
  });

  it("sem nota nao pontua", () => {
    expect(pontuacaoMelhoria(null, 3)).toBeNull();
  });
});

describe("quadranteMelhoria", () => {
  it("classifica nos quatro quadrantes", () => {
    expect(quadranteMelhoria(5, 1)).toBe("Ganho rápido");
    expect(quadranteMelhoria(5, 5)).toBe("Projeto estratégico");
    expect(quadranteMelhoria(1, 1)).toBe("Ajuste simples");
    expect(quadranteMelhoria(1, 5)).toBe("Repensar");
  });
});
