import { expect, it, vi } from "vitest";
import {
  adjustItemStock,
  createItem,
  listItems,
  updateItem,
} from "@/actions/items";
import { notifyStockAlert } from "@/lib/notify";
import { hire, hireAdmin, itemForm, stockItem } from "@/test/fixtures";

const APP = "https://cafe-com-geti.vercel.app";

async function shelf(name: string, stock: number) {
  await hireAdmin({ name: "Maria", preference: "coffee" });
  return stockItem({ name, kind: "coffee", stock });
}

it("3→1 avisa estoque baixo; 2→0 e 5→0 avisam acabou; sem POST", async () => {
  process.env.APP_URL = `${APP}/`;
  const fetchMock = vi.spyOn(globalThis, "fetch");
  const cafe = await shelf("Café", 3);

  await adjustItemStock(cafe.id, -2);
  expect(notifyStockAlert).toHaveBeenCalledWith(
    `⚠️ Estoque baixo: *Café* (1 pacote)\nPróximo da vez: *Maria*\n${APP}`,
  );

  vi.mocked(notifyStockAlert).mockClear();
  const leite = await stockItem({ name: "Leite", kind: "milk", stock: 2 });
  await hire({ name: "Ana", preference: "milk" });
  await adjustItemStock(leite.id, -2);
  expect(notifyStockAlert).toHaveBeenCalledWith(
    `⚠️ Acabou: *Leite*\nPróximo da vez: *Ana*\n${APP}`,
  );

  vi.mocked(notifyStockAlert).mockClear();
  const filtro = await stockItem({ name: "Filtro", kind: "filter", stock: 5 });
  await adjustItemStock(filtro.id, -5);
  expect(notifyStockAlert).toHaveBeenCalledWith(
    `⚠️ Acabou: *Filtro*\nPróximo da vez: *Maria*\n${APP}`,
  );
  const outsideNeon = fetchMock.mock.calls
    .map((call) => String(call[0]))
    .filter((url) => !url.includes("neon.tech"));
  expect(outsideNeon).toEqual([]);
  fetchMock.mockRestore();
  delete process.env.APP_URL;
});

it("1→0 avisa que acabou; fila vazia usa ninguém na fila", async () => {
  process.env.APP_URL = APP;
  await hireAdmin({ name: "Ana", preference: "milk" });
  const cafe = await stockItem({ name: "Café", kind: "coffee", stock: 1 });

  await adjustItemStock(cafe.id, -1);

  expect(notifyStockAlert).toHaveBeenCalledWith(
    `⚠️ Acabou: *Café*\nPróximo da vez: ninguém na fila\n${APP}`,
  );
  delete process.env.APP_URL;
});

it("0→4 e 1→4 avisam reposição sem próximo da vez", async () => {
  process.env.APP_URL = APP;
  await hireAdmin({ name: "Maria", preference: "coffee" });
  const vazio = await stockItem({ name: "Café", kind: "coffee", stock: 0 });
  await adjustItemStock(vazio.id, 4);
  expect(notifyStockAlert).toHaveBeenCalledWith(
    `*Café*: estoque agora é 4 pacotes\n${APP}`,
  );

  vi.mocked(notifyStockAlert).mockClear();
  const um = await stockItem({ name: "Leite", kind: "milk", stock: 1 });
  await adjustItemStock(um.id, 3);
  expect(notifyStockAlert).toHaveBeenCalledWith(
    `*Leite*: estoque agora é 4 pacotes\n${APP}`,
  );
  delete process.env.APP_URL;
});

it("5→2 e estoque igual não alertam", async () => {
  const folgado = await shelf("Café", 5);
  await adjustItemStock(folgado.id, -3);

  const filtro = await stockItem({ name: "Filtro", kind: "filter", stock: 4 });
  await updateItem(
    filtro.id,
    {},
    itemForm({ name: "Filtro", kind: "filter", stock: 4 }),
  );

  expect(notifyStockAlert).not.toHaveBeenCalled();
  const stocks = Object.fromEntries(
    (await listItems()).map((item) => [item.name, item.stock]),
  );
  expect(stocks).toEqual({ Café: 2, Filtro: 4 });
});

it("criar item com estoque 0 ou 1 não alerta", async () => {
  await hireAdmin({ name: "Maria", preference: "coffee" });
  await createItem(
    {},
    itemForm({ name: "Café", kind: "coffee", stock: 0 }),
  );
  await createItem(
    {},
    itemForm({ name: "Leite", kind: "milk", stock: 1 }),
  );
  expect(notifyStockAlert).not.toHaveBeenCalled();
});

it("APP_URL ausente: aviso sai sem link; save ok", async () => {
  delete process.env.APP_URL;
  const cafe = await shelf("Café", 2);
  await adjustItemStock(cafe.id, -2);
  expect(notifyStockAlert).toHaveBeenCalledWith(
    "⚠️ Acabou: *Café*\nPróximo da vez: *Maria*",
  );
  expect((await listItems())[0]?.stock).toBe(0);
});

it("se o envio falha, o estoque novo permanece e a action não quebra", async () => {
  const cafe = await shelf("Café", 2);
  vi.mocked(notifyStockAlert).mockRejectedValueOnce(new Error("falha de rede"));

  await expect(adjustItemStock(cafe.id, -2)).resolves.toEqual({
    success: true,
  });

  expect((await listItems())[0]?.stock).toBe(0);
});
