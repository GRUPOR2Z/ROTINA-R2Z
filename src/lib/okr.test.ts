import { describe, expect, it } from "vitest";
import { calcularProgresso } from "./okr";

describe("calcularProgresso", () => {
  it("meta de subir: 0% no início, 100% no alvo", () => {
    expect(calcularProgresso(0, 0, 10)).toBe(0);
    expect(calcularProgresso(0, 10, 10)).toBe(100);
    expect(calcularProgresso(0, 5, 10)).toBe(50);
  });

  it("meta de descer: também funciona (reduzir de 100 pra 20)", () => {
    expect(calcularProgresso(100, 100, 20)).toBe(0);
    expect(calcularProgresso(100, 20, 20)).toBe(100);
    expect(calcularProgresso(100, 60, 20)).toBe(50);
  });

  it("passar do alvo satura em 100, não passa de 100", () => {
    expect(calcularProgresso(0, 15, 10)).toBe(100);
  });

  it("regredir abaixo do inicial satura em 0", () => {
    expect(calcularProgresso(0, -5, 10)).toBe(0);
  });

  it("alvo igual ao inicial: 100 só se já estiver lá", () => {
    expect(calcularProgresso(5, 5, 5)).toBe(100);
    expect(calcularProgresso(5, 3, 5)).toBe(0);
  });
});
