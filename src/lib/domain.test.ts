import { describe, expect, it } from "vitest";
import { shouldNotifyStockCrossedOne } from "./notify";
import { isInQueue, pickNextInQueue } from "./rotation";

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
