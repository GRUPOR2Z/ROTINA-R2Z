import { describe, expect, it } from "vitest";
import { filtrarProximasPendentes } from "./rotinas";

describe("filtrarProximasPendentes", () => {
  it("mantém só a ocorrência pendente mais próxima de uma rotina", () => {
    const tarefas = [
      { id: "a", status: "pendente", prazo: "2026-09-23" },
      { id: "b", status: "pendente", prazo: "2026-09-24" },
      { id: "c", status: "pendente", prazo: "2026-09-25" },
    ];
    const rotina = new Map([
      ["a", "rotina-1"],
      ["b", "rotina-1"],
      ["c", "rotina-1"],
    ]);

    expect(filtrarProximasPendentes(tarefas, rotina).map((t) => t.id)).toEqual(["a"]);
  });

  it("sempre mantém tarefas em andamento, bloqueadas ou concluídas", () => {
    const tarefas = [
      { id: "a", status: "em_andamento", prazo: "2026-09-22" },
      { id: "b", status: "pendente", prazo: "2026-09-23" },
      { id: "c", status: "pendente", prazo: "2026-09-24" },
    ];
    const rotina = new Map([
      ["a", "rotina-1"],
      ["b", "rotina-1"],
      ["c", "rotina-1"],
    ]);

    expect(filtrarProximasPendentes(tarefas, rotina).map((t) => t.id)).toEqual(["a", "b"]);
  });

  it("não mexe em tarefas sem rotina", () => {
    const tarefas = [
      { id: "a", status: "pendente", prazo: "2026-09-23" },
      { id: "b", status: "pendente", prazo: "2026-09-24" },
    ];
    const rotina = new Map<string, string>();

    expect(filtrarProximasPendentes(tarefas, rotina).map((t) => t.id)).toEqual(["a", "b"]);
  });

  it("trata rotinas diferentes de forma independente", () => {
    const tarefas = [
      { id: "a1", status: "pendente", prazo: "2026-09-23" },
      { id: "a2", status: "pendente", prazo: "2026-09-24" },
      { id: "b1", status: "pendente", prazo: "2026-09-20" },
      { id: "b2", status: "pendente", prazo: "2026-09-21" },
    ];
    const rotina = new Map([
      ["a1", "rotina-a"],
      ["a2", "rotina-a"],
      ["b1", "rotina-b"],
      ["b2", "rotina-b"],
    ]);

    expect(filtrarProximasPendentes(tarefas, rotina).map((t) => t.id)).toEqual(["a1", "b1"]);
  });
});
