import { describe, expect, it } from "vitest";
import {
  buildStockAlertMessage,
  formatUnitLabel,
  normalizeAppUrl,
  stockAlertKind,
} from "./notify";
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

describe("stockAlertKind", () => {
  it("estoque baixo ao chegar em 1 vindo de cima", () => {
    expect(stockAlertKind(3, 1)).toBe("low");
    expect(stockAlertKind(2, 1)).toBe("low");
  });

  it("acabou ao chegar em 0 (pulo ou 1→0)", () => {
    expect(stockAlertKind(2, 0)).toBe("empty");
    expect(stockAlertKind(5, 0)).toBe("empty");
    expect(stockAlertKind(1, 0)).toBe("empty");
  });

  it("reposição ao sair de 0 ou 1 para cima", () => {
    expect(stockAlertKind(0, 1)).toBe("restocked");
    expect(stockAlertKind(0, 4)).toBe("restocked");
    expect(stockAlertKind(1, 4)).toBe("restocked");
  });

  it("silêncio acima de 1 ou estoque igual", () => {
    expect(stockAlertKind(5, 2)).toBe(null);
    expect(stockAlertKind(3, 6)).toBe(null);
    expect(stockAlertKind(2, 2)).toBe(null);
    expect(stockAlertKind(0, 0)).toBe(null);
    expect(stockAlertKind(1, 1)).toBe(null);
  });
});

describe("formatUnitLabel", () => {
  it("cola s quando a quantidade não é 1", () => {
    expect(formatUnitLabel(1, "pacote")).toBe("pacote");
    expect(formatUnitLabel(4, "pacote")).toBe("pacotes");
    expect(formatUnitLabel(0, "pacote")).toBe("pacotes");
  });
});

describe("normalizeAppUrl", () => {
  it("remove barra final e trata vazio", () => {
    expect(normalizeAppUrl("https://cafe-com-geti.vercel.app/")).toBe(
      "https://cafe-com-geti.vercel.app",
    );
    expect(normalizeAppUrl("  https://x.app  ")).toBe("https://x.app");
    expect(normalizeAppUrl(undefined)).toBe(null);
    expect(normalizeAppUrl("")).toBe(null);
  });
});

describe("buildStockAlertMessage", () => {
  const appUrl = "https://cafe-com-geti.vercel.app";

  it("estoque baixo com próximo e link", () => {
    expect(
      buildStockAlertMessage({
        kind: "low",
        itemName: "Café",
        newStock: 1,
        unitLabel: "pacote",
        nextPerson: "Maria",
        appUrl,
      }),
    ).toBe(
      "⚠️ Estoque baixo: *Café* (1 pacote)\nPróximo da vez: *Maria*\nhttps://cafe-com-geti.vercel.app",
    );
  });

  it("acabou sem próximo e sem link", () => {
    expect(
      buildStockAlertMessage({
        kind: "empty",
        itemName: "Café",
        newStock: 0,
        unitLabel: "pacote",
        nextPerson: null,
        appUrl: null,
      }),
    ).toBe("⚠️ Acabou: *Café*\nPróximo da vez: ninguém na fila");
  });

  it("reposição com plural e link, sem próximo", () => {
    expect(
      buildStockAlertMessage({
        kind: "restocked",
        itemName: "Café",
        newStock: 4,
        unitLabel: "pacote",
        nextPerson: "Maria",
        appUrl,
      }),
    ).toBe(
      "*Café*: estoque agora é 4 pacotes\nhttps://cafe-com-geti.vercel.app",
    );
  });
});
