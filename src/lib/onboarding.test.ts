import { describe, expect, it } from "vitest";
import { prazoDaEtapa, progressoOnboarding } from "./onboarding";

describe("prazoDaEtapa", () => {
  it("soma os dias ao inicio", () => {
    expect(prazoDaEtapa("2026-10-01", 7)).toBe("2026-10-08");
  });

  it("sem prazo relativo, sem prazo", () => {
    expect(prazoDaEtapa("2026-10-01", null)).toBeNull();
  });
});

describe("progressoOnboarding", () => {
  it("calcula percentual", () => {
    expect(progressoOnboarding(4, 1)).toBe(25);
    expect(progressoOnboarding(3, 3)).toBe(100);
  });

  it("trilha vazia nao tem progresso", () => {
    expect(progressoOnboarding(0, 0)).toBeNull();
  });
});
