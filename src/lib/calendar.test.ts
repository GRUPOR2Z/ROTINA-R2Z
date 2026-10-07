import { describe, expect, it } from "vitest";
import { dateKey, proximaData, gerarProximasDatas, getWeekDays, somarDias, parseDateKey } from "./calendar";

describe("proximaData", () => {
  it("avança um dia na frequência diária", () => {
    expect(proximaData("2026-09-20", "diaria")).toBe("2026-09-21");
  });

  it("avança sete dias na frequência semanal", () => {
    expect(proximaData("2026-09-20", "semanal")).toBe("2026-09-27");
  });

  it("avança um mês na frequência mensal", () => {
    expect(proximaData("2026-09-20", "mensal")).toBe("2026-10-20");
  });

  it("vira o ano corretamente (dezembro -> janeiro)", () => {
    expect(proximaData("2026-12-31", "diaria")).toBe("2027-01-01");
  });

  it("lida com mês mais curto (31 de janeiro + 1 mês)", () => {
    // JS normaliza 31/fev para 03/mar (fevereiro/2027 tem 28 dias)
    expect(proximaData("2027-01-31", "mensal")).toBe("2027-03-03");
  });
});

describe("gerarProximasDatas", () => {
  it("gera N datas seguintes, sem incluir a inicial", () => {
    expect(gerarProximasDatas("2026-09-20", "semanal", 3)).toEqual([
      "2026-09-27",
      "2026-10-04",
      "2026-10-11",
    ]);
  });

  it("retorna vazio quando quantidade é 0", () => {
    expect(gerarProximasDatas("2026-09-20", "diaria", 0)).toEqual([]);
  });
});

describe("dateKey", () => {
  it("formata a data local sem conversão UTC", () => {
    expect(dateKey(new Date(2026, 8, 5))).toBe("2026-09-05");
  });
});


describe("getWeekDays", () => {
  it("começa no domingo e tem 7 dias", () => {
    const dias = getWeekDays(parseDateKey("2026-10-07")); // quarta
    expect(dias).toHaveLength(7);
    expect(dateKey(dias[0])).toBe("2026-10-04");
    expect(dateKey(dias[6])).toBe("2026-10-10");
  });

  it("atravessa a virada de mes", () => {
    const dias = getWeekDays(parseDateKey("2026-10-01"));
    expect(dateKey(dias[0])).toBe("2026-09-27");
  });
});

describe("somarDias", () => {
  it("soma e subtrai dias", () => {
    expect(dateKey(somarDias(parseDateKey("2026-12-31"), 1))).toBe("2027-01-01");
    expect(dateKey(somarDias(parseDateKey("2026-03-01"), -1))).toBe("2026-02-28");
  });
});
