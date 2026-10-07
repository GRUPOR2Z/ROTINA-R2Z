import { describe, expect, it } from "vitest";
import { calcularAndamento, situacaoPrazo } from "./projetos";

describe("calcularAndamento", () => {
  it("sem tarefas nem entregas nao inventa numero", () => {
    expect(calcularAndamento([], [])).toBeNull();
  });

  it("usa so tarefas quando nao ha entregas", () => {
    expect(calcularAndamento([{ status: "concluida" }, { status: "pendente" }], [])).toBe(50);
  });

  it("faz a media entre tarefas e entregas", () => {
    expect(
      calcularAndamento(
        [{ status: "concluida" }, { status: "concluida" }],
        [{ concluido: false }, { concluido: false }],
      ),
    ).toBe(50);
  });
});

describe("situacaoPrazo", () => {
  const hoje = new Date(2026, 9, 7);

  it("concluido conta como entregue mesmo atrasado", () => {
    expect(situacaoPrazo("2026-01-01", "concluido", hoje)).toBe("entregue");
  });

  it("classifica atrasado, proximo e no prazo", () => {
    expect(situacaoPrazo("2026-10-06", "em_andamento", hoje)).toBe("atrasado");
    expect(situacaoPrazo("2026-10-10", "em_andamento", hoje)).toBe("proximo");
    expect(situacaoPrazo("2026-12-01", "em_andamento", hoje)).toBe("no_prazo");
    expect(situacaoPrazo(null, "em_andamento", hoje)).toBe("sem_prazo");
  });
});
