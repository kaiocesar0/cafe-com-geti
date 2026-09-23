import { expect, it } from "vitest";
import {
  adjustItemStock,
  deleteItem,
  listItems,
  updateItem,
} from "@/actions/items";
import { listContributions } from "@/actions/contributions";
import { notifyLowStock } from "@/lib/notify";
import { getContributionSummariesForItem } from "@/lib/stock-service";
import { hire, itemForm, recordContribution, stockItem } from "@/test/fixtures";

it("contagem define o estoque e não altera o total; cruzar 1 alerta", async () => {
  const maria = await hire({ name: "Maria", preference: "coffee" });
  const cafe = await stockItem({ name: "Café", kind: "coffee", stock: 5 });
  await recordContribution({
    employeeId: maria.id,
    itemId: cafe.id,
    quantity: 3,
    past: true,
  });

  const result = await updateItem(
    cafe.id,
    {},
    itemForm({ name: "Café", kind: "coffee", stock: 1 }),
  );

  expect(result).toEqual({ success: true });
  expect((await listItems())[0]?.stock).toBe(1);
  expect(await getContributionSummariesForItem(cafe.id)).toEqual([
    expect.objectContaining({ totalQuantity: 3 }),
  ]);
  expect(notifyLowStock).toHaveBeenCalledWith(
    "⚠️ Estoque baixo: *Café* (1 restante)\nPróximo da vez: *Maria*",
  );
});

it("+1 sobe a prateleira e −1 que ficaria negativo é recusado", async () => {
  const cafe = await stockItem({ name: "Café", kind: "coffee", stock: 0 });

  expect(await adjustItemStock(cafe.id, 1)).toEqual({ success: true });
  expect((await listItems())[0]?.stock).toBe(1);

  const refused = await adjustItemStock(cafe.id, -2);
  expect(refused.error).toMatch(/negativo/);
  expect((await listItems())[0]?.stock).toBe(1);
  expect(notifyLowStock).not.toHaveBeenCalled();
});

it("−1 que cruza 1 alerta e não mexe no total", async () => {
  const maria = await hire({ name: "Maria", preference: "coffee" });
  const cafe = await stockItem({ name: "Café", kind: "coffee", stock: 2 });
  await recordContribution({
    employeeId: maria.id,
    itemId: cafe.id,
    quantity: 4,
    past: true,
  });

  await adjustItemStock(cafe.id, -1);

  expect((await listItems())[0]?.stock).toBe(1);
  expect(await getContributionSummariesForItem(cafe.id)).toEqual([
    expect.objectContaining({ totalQuantity: 4 }),
  ]);
  expect(notifyLowStock).toHaveBeenCalledOnce();
});

it("criar e editar item persiste nome, unidade, tipo e estoque", async () => {
  const cafe = await stockItem({
    name: "Café",
    kind: "coffee",
    stock: 5,
    unitLabel: "pacote",
  });

  const result = await updateItem(
    cafe.id,
    {},
    itemForm({
      name: "Café torrado",
      unitLabel: "caixa",
      kind: "filter",
      stock: 3,
    }),
  );

  expect(result).toEqual({ success: true });
  expect(await listItems()).toEqual([
    expect.objectContaining({
      name: "Café torrado",
      unitLabel: "caixa",
      kind: "filter",
      stock: 3,
    }),
  ]);
  expect(notifyLowStock).not.toHaveBeenCalled();
});

it("apagar item apaga as contribuições e não alerta", async () => {
  const maria = await hire({ name: "Maria", preference: "coffee" });
  const cafe = await stockItem({ name: "Café", kind: "coffee", stock: 5 });
  await recordContribution({
    employeeId: maria.id,
    itemId: cafe.id,
    quantity: 2,
  });

  const result = await deleteItem(cafe.id);

  expect(result).toEqual({ success: true });
  expect(await listItems()).toEqual([]);
  expect(await listContributions()).toEqual([]);
  expect(notifyLowStock).not.toHaveBeenCalled();
});
