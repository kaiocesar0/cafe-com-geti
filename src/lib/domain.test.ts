import { describe, expect, it } from "vitest";
import { shouldNotifyStockCrossedOne } from "./notify";
import { isInQueue, pickNextInQueue, rankQueue } from "./rotation";

const maria = {
  id: "1",
  name: "Maria",
  preference: "coffee" as const,
  active: true,
  createdAt: new Date("2024-01-02"),
};

const joao = {
  id: "2",
  name: "João",
  preference: "coffee" as const,
  active: true,
  createdAt: new Date("2024-01-01"),
};

const leiteOnly = {
  id: "3",
  name: "Ana",
  preference: "milk" as const,
  active: true,
  createdAt: new Date("2024-01-03"),
};

const inativo = {
  id: "4",
  name: "Pedro",
  preference: "coffee" as const,
  active: false,
  createdAt: new Date("2023-01-01"),
};

const carla = {
  id: "5",
  name: "Carla",
  preference: "both" as const,
  active: true,
  createdAt: new Date("2024-01-04"),
};

describe("rankQueue", () => {
  it("ordena a fila completa por menor total contribuído", () => {
    const ranked = rankQueue([maria, joao, carla], "coffee", [
      { employeeId: "1", totalQuantity: 1, lastContributedAt: new Date("2024-06-01") },
      { employeeId: "2", totalQuantity: 3, lastContributedAt: new Date("2024-01-01") },
      { employeeId: "5", totalQuantity: 2, lastContributedAt: new Date("2024-03-01") },
    ]);
    expect(ranked.map((r) => r.employee.name)).toEqual([
      "Maria",
      "Carla",
      "João",
    ]);
    expect(ranked.map((r) => r.totalQuantity)).toEqual([1, 2, 3]);
  });

  it("desempata por quem está devendo há mais tempo e coloca nunca trouxe antes", () => {
    const ranked = rankQueue([maria, joao, carla], "coffee", [
      {
        employeeId: "1",
        totalQuantity: 1,
        lastContributedAt: new Date("2024-06-01"),
      },
      {
        employeeId: "2",
        totalQuantity: 1,
        lastContributedAt: new Date("2024-01-01"),
      },
    ]);
    expect(ranked.map((r) => r.employee.name)).toEqual([
      "Carla",
      "João",
      "Maria",
    ]);
    expect(ranked[0]?.lastContributedAt).toBeNull();
  });

  it("usa ordem de cadastro quando ninguém trouxe", () => {
    const ranked = rankQueue([maria, joao], "coffee", []);
    expect(ranked.map((r) => r.employee.name)).toEqual(["João", "Maria"]);
  });

  it("exclui quem só toma leite e quem está inativo da fila de café", () => {
    expect(isInQueue(leiteOnly, "coffee")).toBe(false);
    expect(isInQueue(inativo, "coffee")).toBe(false);
    const ranked = rankQueue([maria, leiteOnly, inativo], "coffee", [
      { employeeId: "3", totalQuantity: 0, lastContributedAt: null },
      { employeeId: "4", totalQuantity: 0, lastContributedAt: null },
    ]);
    expect(ranked.map((r) => r.employee.name)).toEqual(["Maria"]);
  });

  it("faz o próximo da vez ser o primeiro da fila ranqueada", () => {
    const summaries = [
      { employeeId: "1", totalQuantity: 1, lastContributedAt: new Date("2024-06-01") },
      { employeeId: "2", totalQuantity: 1, lastContributedAt: new Date("2024-01-01") },
      { employeeId: "5", totalQuantity: 0, lastContributedAt: null },
    ];
    const employees = [maria, joao, carla];
    const ranked = rankQueue(employees, "coffee", summaries);
    const next = pickNextInQueue(employees, "coffee", summaries);
    expect(next?.id).toBe(ranked[0]?.employee.id);
    expect(next?.name).toBe("Carla");
  });
});

describe("pickNextInQueue", () => {
  it("escolhe quem trouxe menos", () => {
    const next = pickNextInQueue([maria, joao], "coffee", [
      { employeeId: "1", totalQuantity: 1, lastContributedAt: new Date() },
      { employeeId: "2", totalQuantity: 2, lastContributedAt: new Date() },
    ]);
    expect(next?.name).toBe("Maria");
  });

  it("desempata por quem está devendo há mais tempo", () => {
    const next = pickNextInQueue([maria, joao], "coffee", [
      {
        employeeId: "1",
        totalQuantity: 1,
        lastContributedAt: new Date("2024-06-01"),
      },
      {
        employeeId: "2",
        totalQuantity: 1,
        lastContributedAt: new Date("2024-01-01"),
      },
    ]);
    expect(next?.name).toBe("João");
  });

  it("aceita datas como string ISO (retorno do Neon em SQL raw)", () => {
    const next = pickNextInQueue([maria, joao], "coffee", [
      {
        employeeId: "1",
        totalQuantity: 1,
        lastContributedAt: "2024-06-01T00:00:00.000Z",
      },
      {
        employeeId: "2",
        totalQuantity: 1,
        lastContributedAt: "2024-01-01T00:00:00.000Z",
      },
    ]);
    expect(next?.name).toBe("João");
  });

  it("usa ordem de cadastro se ninguém trouxe", () => {
    const next = pickNextInQueue([maria, joao], "coffee", []);
    expect(next?.name).toBe("João");
  });

  it("exclui quem só toma leite da fila de café", () => {
    expect(isInQueue(leiteOnly, "coffee")).toBe(false);
    const next = pickNextInQueue([maria, leiteOnly], "coffee", [
      { employeeId: "3", totalQuantity: 0, lastContributedAt: null },
    ]);
    expect(next?.name).toBe("Maria");
  });
});

describe("shouldNotifyStockCrossedOne", () => {
  it("notifica quando cruza 1 para baixo", () => {
    expect(shouldNotifyStockCrossedOne(2, 0)).toBe(true);
    expect(shouldNotifyStockCrossedOne(3, 1)).toBe(true);
    expect(shouldNotifyStockCrossedOne(5, 0)).toBe(true);
  });

  it("não notifica em outros casos", () => {
    expect(shouldNotifyStockCrossedOne(1, 0)).toBe(false);
    expect(shouldNotifyStockCrossedOne(5, 2)).toBe(false);
    expect(shouldNotifyStockCrossedOne(2, 2)).toBe(false);
  });
});
