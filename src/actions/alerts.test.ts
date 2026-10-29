import { expect, it, vi } from "vitest";
import {
  adjustItemStock,
  listItems,
  previewItemChatAlert,
  sendItemChatAlert,
  updateItem,
} from "@/actions/items";
import { notifyLowStock } from "@/lib/notify";
import { SIGN_IN_REQUIRED } from "@/lib/auth-messages";
import { newBrowser } from "@/test/cookie-jar";
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
    "⚠️ Estoque baixo: Café (0 restante)\n🤑 Próximo da vez:\n1º Maria",
  );

  vi.mocked(notifyLowStock).mockClear();
  const leite = await stockItem({ name: "Leite", kind: "milk", stock: 3 });
  await hire({ name: "Ana", preference: "milk" });
  await adjustItemStock(leite.id, -2);
  expect(notifyLowStock).toHaveBeenCalledWith(
    "⚠️ Estoque baixo: Leite (1 restante)\n🤑 Próximo da vez:\n1º Ana",
  );

  vi.mocked(notifyLowStock).mockClear();
  const filtro = await stockItem({ name: "Filtro", kind: "filter", stock: 5 });
  await adjustItemStock(filtro.id, -5);
  expect(notifyLowStock).toHaveBeenCalledWith(
    "⚠️ Estoque baixo: Filtro (0 restante)\n🤑 Próximo da vez:\n1º Maria",
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
    "⚠️ Estoque baixo: Café (0 restante)\n🤑 Próximo da vez:\nninguém na fila",
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

it("se o envio falha, o estoque novo permanece", async () => {
  const cafe = await shelf("Café", 2);
  vi.mocked(notifyLowStock).mockRejectedValueOnce(new Error("falha de rede"));

  await expect(adjustItemStock(cafe.id, -2)).rejects.toThrow(/falha de rede/);

  expect((await listItems())[0]?.stock).toBe(0);
});
