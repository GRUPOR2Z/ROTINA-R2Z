import { describe, expect, it } from "vitest";
import { calcularFarolPorMeta } from "./kpi-status";

describe("calcularFarolPorMeta", () => {
  it("meta atingida ou superada é ok (meta de subir: 2 → 4)", () => {
    expect(calcularFarolPorMeta(4, 2, 4)).toBe("ok");
    expect(calcularFarolPorMeta(5, 2, 4)).toBe("ok");
  });

  it("metade do caminho é atenção (2 → 4, valor atual 3)", () => {
    expect(calcularFarolPorMeta(3, 2, 4)).toBe("atencao");
  });

  it("menos da metade do caminho é crítico (2 → 4, valor atual 2.2)", () => {
    expect(calcularFarolPorMeta(2.2, 2, 4)).toBe("critico");
  });

  it("funciona igual pra meta de descer (churn 10% → 2%)", () => {
    expect(calcularFarolPorMeta(2, 10, 2)).toBe("ok"); // chegou na meta
    expect(calcularFarolPorMeta(6, 10, 2)).toBe("atencao"); // meio caminho
    expect(calcularFarolPorMeta(9, 10, 2)).toBe("critico"); // quase não andou
  });

  it("sem valor registrado ainda retorna sem_dados", () => {
    expect(calcularFarolPorMeta(null, 2, 4)).toBe("sem_dados");
  });

  it("sem meta ou valor inicial definidos retorna sem_dados", () => {
    expect(calcularFarolPorMeta(3, null, 4)).toBe("sem_dados");
    expect(calcularFarolPorMeta(3, 2, null)).toBe("sem_dados");
  });

  it("meta igual ao valor inicial: ok só se já estiver exatamente na meta", () => {
    expect(calcularFarolPorMeta(5, 5, 5)).toBe("ok");
    expect(calcularFarolPorMeta(4, 5, 5)).toBe("atencao");
  });
});
