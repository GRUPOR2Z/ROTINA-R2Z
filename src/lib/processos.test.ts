import { describe, expect, it } from "vitest";
import { proximaRevisao, revisaoVencida } from "./processos";

describe("proximaRevisao", () => {
  it("soma a frequencia a ultima revisao", () => {
    expect(proximaRevisao("2026-01-10", 30)).toBe("2026-02-09");
  });

  it("sem frequencia ou sem revisao, nao ha proxima", () => {
    expect(proximaRevisao(null, 30)).toBeNull();
    expect(proximaRevisao("2026-01-10", null)).toBeNull();
  });
});

describe("revisaoVencida", () => {
  const hoje = new Date(2026, 9, 6); // 06/10/2026

  it("vencida quando a proxima revisao ja passou", () => {
    expect(revisaoVencida("2026-08-01", 30, hoje)).toBe(true);
  });

  it("em dia quando ainda nao chegou", () => {
    expect(revisaoVencida("2026-10-01", 30, hoje)).toBe(false);
  });
});
