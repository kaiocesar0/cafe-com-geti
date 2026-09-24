import { expect, it, vi } from "vitest";
import { adjustItemStock, listItems, updateItem } from "@/actions/items";
import { notifyLowStock } from "@/lib/notify";
import { hire, hireAdmin, itemForm, stockItem } from "@/test/fixtures";

async function shelf(name: string, stock: number) {
  await hireAdmin({ name: "Maria", preference: "coffee" });
  return stockItem({ name, kind: "coffee", stock });
}

it("2→0, 3→1 e 5→0 mandam a mensagem com o próximo da vez, sem POST", async () => {
  const fetchMock = vi.spyOn(globalThis, "fetch");
  const cafe = await shelf("Café", 2);

  await adjustItemStock(cafe.id, -2);
  expect(notifyLowStock).toHaveBeenCalledWith(
    "⚠️ Estoque baixo: *Café* (0 restante)\nPróximo da vez: *Maria*",
  );

  vi.mocked(notifyLowStock).mockClear();
  const leite = await stockItem({ name: "Leite", kind: "milk", stock: 3 });
  await hire({ name: "Ana", preference: "milk" });
  await adjustItemStock(leite.id, -2);
  expect(notifyLowStock).toHaveBeenCalledWith(
    "⚠️ Estoque baixo: *Leite* (1 restante)\nPróximo da vez: *Ana*",
  );

  vi.mocked(notifyLowStock).mockClear();
  const filtro = await stockItem({ name: "Filtro", kind: "filter", stock: 5 });
  await adjustItemStock(filtro.id, -5);
  expect(notifyLowStock).toHaveBeenCalledWith(
    "⚠️ Estoque baixo: *Filtro* (0 restante)\nPróximo da vez: *Maria*",
  );
  const outsideNeon = fetchMock.mock.calls
    .map((call) => String(call[0]))
    .filter((url) => !url.includes("neon.tech"));
  expect(outsideNeon).toEqual([]);
  fetchMock.mockRestore();
});

it("avisa quando não há ninguém na fila", async () => {
  await hireAdmin({ name: "Ana", preference: "milk" });
  const cafe = await stockItem({ name: "Café", kind: "coffee", stock: 2 });

  await adjustItemStock(cafe.id, -2);

  expect(notifyLowStock).toHaveBeenCalledWith(
    "⚠️ Estoque baixo: *Café* (0 restante)\nPróximo da vez: ninguém na fila",
  );
});

it("1→0, 5→2 e estoque igual não alertam", async () => {
  const acabando = await shelf("Café", 1);
  await adjustItemStock(acabando.id, -1);

  const folgado = await stockItem({ name: "Leite", kind: "milk", stock: 5 });
  await adjustItemStock(folgado.id, -3);

  const filtro = await stockItem({ name: "Filtro", kind: "filter", stock: 4 });
  await updateItem(
    filtro.id,
    {},
    itemForm({ name: "Filtro", kind: "filter", stock: 4 }),
  );

  expect(notifyLowStock).not.toHaveBeenCalled();
  const stocks = Object.fromEntries(
    (await listItems()).map((item) => [item.name, item.stock]),
  );
  expect(stocks).toEqual({ Café: 0, Leite: 2, Filtro: 4 });
});

it("se o envio falha, o estoque novo permanece", async () => {
  const cafe = await shelf("Café", 2);
  vi.mocked(notifyLowStock).mockRejectedValueOnce(new Error("falha de rede"));

  await expect(adjustItemStock(cafe.id, -2)).rejects.toThrow(/falha de rede/);

  expect((await listItems())[0]?.stock).toBe(0);
});
