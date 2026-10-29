import { expect, it, vi } from "vitest";
import {
  adjustItemStock,
  createItem,
  listItems,
  previewItemChatAlert,
  sendItemChatAlert,
  updateItem,
} from "@/actions/items";
import { notifyLowStock, notifyStockAlert } from "@/lib/notify";
import { SIGN_IN_REQUIRED } from "@/lib/auth-messages";
import { newBrowser } from "@/test/cookie-jar";
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

it("o preview mostra a mensagem e o ambiente sem enviar", async () => {
  const previousEnv = process.env.VERCEL_ENV;
  process.env.VERCEL_ENV = "preview";
  process.env.GOOGLE_CHAT_WEBHOOK_URL = "https://chat.example/preview";
  await hireAdmin({ name: "Maria", preference: "coffee" });
  await hire({ name: "João", preference: "coffee" });
  const cafe = await stockItem({ name: "Café", kind: "coffee", stock: 3 });

  const preview = await previewItemChatAlert(cafe.id);

  expect(preview).toEqual({
    environment: "preview",
    message:
      "⚠️ Estoque baixo: Café (3 restante)\n🤑 Próximo da vez:\n1º Maria;\n2º João",
  });
  expect(notifyLowStock).not.toHaveBeenCalled();
  expect((await listItems())[0]?.stock).toBe(3);
  delete process.env.GOOGLE_CHAT_WEBHOOK_URL;
  if (previousEnv === undefined) delete process.env.VERCEL_ENV;
  else process.env.VERCEL_ENV = previousEnv;
});

it("sem sessão, o preview não monta a mensagem", async () => {
  process.env.GOOGLE_CHAT_WEBHOOK_URL = "https://chat.example/preview";
  await hireAdmin({ name: "Maria", preference: "coffee" });
  const cafe = await stockItem({ name: "Café", kind: "coffee", stock: 3 });
  newBrowser();

  expect(await previewItemChatAlert(cafe.id)).toEqual({ error: SIGN_IN_REQUIRED });
  expect(notifyLowStock).not.toHaveBeenCalled();
  delete process.env.GOOGLE_CHAT_WEBHOOK_URL;
});

it("o botão manda o aviso daquele item, com os 2 próximos, sem mudar o estoque", async () => {
  process.env.GOOGLE_CHAT_WEBHOOK_URL = "https://chat.example/preview";
  await hireAdmin({ name: "Maria", preference: "coffee" });
  await hire({ name: "João", preference: "coffee" });
  await hire({ name: "Ana", preference: "milk" });
  const leite = await stockItem({ name: "Leite", kind: "milk", stock: 4 });
  const cafe = await stockItem({ name: "Café", kind: "coffee", stock: 3 });

  const result = await sendItemChatAlert(cafe.id);

  expect(result).toEqual({ success: true });
  expect(notifyLowStock).toHaveBeenCalledTimes(1);
  expect(notifyLowStock).toHaveBeenCalledWith(
    "⚠️ Estoque baixo: Café (3 restante)\n🤑 Próximo da vez:\n1º Maria;\n2º João",
  );
  expect((await listItems()).find((item) => item.id === cafe.id)?.stock).toBe(3);
  expect((await listItems()).find((item) => item.id === leite.id)?.stock).toBe(4);

  vi.mocked(notifyLowStock).mockClear();
  expect(await sendItemChatAlert(leite.id)).toEqual({ success: true });
  expect(notifyLowStock).toHaveBeenCalledWith(
    "⚠️ Estoque baixo: Leite (4 restante)\n🤑 Próximo da vez:\n1º Ana",
  );
  delete process.env.GOOGLE_CHAT_WEBHOOK_URL;
});

it("sem webhook neste ambiente, o botão não envia", async () => {
  delete process.env.GOOGLE_CHAT_WEBHOOK_URL;
  await hireAdmin({ name: "Maria", preference: "coffee" });
  const cafe = await stockItem({ name: "Café", kind: "coffee", stock: 3 });

  expect(await sendItemChatAlert(cafe.id)).toEqual({
    error: "Webhook do Google Chat não configurado neste ambiente",
  });
  expect(notifyLowStock).not.toHaveBeenCalled();
});

it("sem sessão, o botão não envia", async () => {
  process.env.GOOGLE_CHAT_WEBHOOK_URL = "https://chat.example/preview";
  await hireAdmin({ name: "Maria", preference: "coffee" });
  const cafe = await stockItem({ name: "Café", kind: "coffee", stock: 3 });
  newBrowser();

  expect(await sendItemChatAlert(cafe.id)).toEqual({ error: SIGN_IN_REQUIRED });
  expect(notifyLowStock).not.toHaveBeenCalled();
  delete process.env.GOOGLE_CHAT_WEBHOOK_URL;
});

it("se o chat falha, o botão devolve o erro e o estoque fica igual", async () => {
  process.env.GOOGLE_CHAT_WEBHOOK_URL = "https://chat.example/preview";
  await hireAdmin({ name: "Maria", preference: "coffee" });
  const cafe = await stockItem({ name: "Café", kind: "coffee", stock: 3 });
  vi.mocked(notifyLowStock).mockRejectedValueOnce(new Error("falha de rede"));

  expect(await sendItemChatAlert(cafe.id)).toEqual({
    error: "Falha ao enviar o aviso ao Google Chat",
  });
  expect((await listItems())[0]?.stock).toBe(3);
  delete process.env.GOOGLE_CHAT_WEBHOOK_URL;
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
