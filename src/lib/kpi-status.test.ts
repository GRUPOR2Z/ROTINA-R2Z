import { describe, expect, it } from "vitest";
import { calcularFarol } from "./kpi-status";

describe("calcularFarol", () => {
  it("maior_melhor: valor abaixo do critico é crítico", () => {
    expect(calcularFarol(50, 80, 60, "maior_melhor")).toBe("critico");
  });

  it("maior_melhor: valor entre os limiares é atenção", () => {
    expect(calcularFarol(70, 80, 60, "maior_melhor")).toBe("atencao");
  });

  it("maior_melhor: valor acima do limiar de atenção é ok", () => {
    expect(calcularFarol(90, 80, 60, "maior_melhor")).toBe("ok");
  });

  it("menor_melhor: valor acima do crítico é crítico", () => {
    expect(calcularFarol(15, 5, 10, "menor_melhor")).toBe("critico");
  });

  it("menor_melhor: valor abaixo do limiar de atenção é ok", () => {
    expect(calcularFarol(2, 5, 10, "menor_melhor")).toBe("ok");
  });

  it("sem valor registrado retorna sem_dados", () => {
    expect(calcularFarol(null, 80, 60, "maior_melhor")).toBe("sem_dados");
  });

  it("sem limiares definidos retorna sem_dados mesmo com valor", () => {
    expect(calcularFarol(50, null, null, "maior_melhor")).toBe("sem_dados");
  });
});
