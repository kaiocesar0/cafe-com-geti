import { expect, it } from "vitest";
import { listContributions, deleteContribution, updateContribution } from "@/actions/contributions";
import { adjustItemStock, listItems } from "@/actions/items";
import { notifyLowStock } from "@/lib/notify";
import {
  getContributionSummariesForItem,
  getNextPersonNameForItem,
} from "@/lib/stock-service";
import {
  contributionForm,
  hire,
  recordContribution,
  stockItem,
} from "@/test/fixtures";

it("contribuição vigente aumenta estoque e total; passada só o total", async () => {
  const maria = await hire({ name: "Maria", preference: "coffee" });
  const cafe = await stockItem({ name: "Café", kind: "coffee", stock: 4 });

  await recordContribution({
    employeeId: maria.id,
    itemId: cafe.id,
    quantity: 2,
  });
  await recordContribution({
    employeeId: maria.id,
    itemId: cafe.id,
    quantity: 3,
    past: true,
    occurredAt: "2024-01-15",
  });

  const [item] = await listItems();
  expect(item?.stock).toBe(6);
  expect(await getContributionSummariesForItem(cafe.id)).toEqual([
    expect.objectContaining({ employeeId: maria.id, totalQuantity: 5 }),
  ]);
  expect(notifyLowStock).not.toHaveBeenCalled();
});

it("funcionário fora da fila registra e a quantidade entra no total", async () => {
  const ana = await hire({ name: "Ana", preference: "milk" });
  const maria = await hire({ name: "Maria", preference: "coffee" });
  const cafe = await stockItem({ name: "Café", kind: "coffee", stock: 4 });

  await recordContribution({
    employeeId: ana.id,
    itemId: cafe.id,
    quantity: 2,
  });

  expect(await getContributionSummariesForItem(cafe.id)).toEqual([
    expect.objectContaining({ employeeId: ana.id, totalQuantity: 2 }),
  ]);
  expect(await getNextPersonNameForItem(cafe.id, "coffee")).toBe(maria.name);
});

it("excluir vigente desfaz o estoque e excluir passada não mexe na prateleira", async () => {
  const maria = await hire({ name: "Maria", preference: "coffee" });
  const cafe = await stockItem({ name: "Café", kind: "coffee", stock: 7 });

  await recordContribution({
    employeeId: maria.id,
    itemId: cafe.id,
    quantity: 2,
  });
  const vigente = (await listContributions())[0];
  if (!vigente) throw new Error("contribuição vigente não encontrada");

  await deleteContribution(vigente.id);
  expect((await listItems())[0]?.stock).toBe(7);
  expect(await listContributions()).toEqual([]);
  expect(await getContributionSummariesForItem(cafe.id)).toEqual([]);

  await recordContribution({
    employeeId: maria.id,
    itemId: cafe.id,
    quantity: 2,
    past: true,
  });
  const passada = (await listContributions())[0];
  if (!passada) throw new Error("contribuição passada não encontrada");

  await deleteContribution(passada.id);
  expect((await listItems())[0]?.stock).toBe(7);
  expect(await getContributionSummariesForItem(cafe.id)).toEqual([]);
});

it("recusa exclusão que deixaria o estoque negativo e mantém a contribuição", async () => {
  const maria = await hire({ name: "Maria", preference: "coffee" });
  const cafe = await stockItem({ name: "Café", kind: "coffee", stock: 2 });
  await recordContribution({
    employeeId: maria.id,
    itemId: cafe.id,
    quantity: 2,
  });
  await adjustItemStock(cafe.id, -4);

  const [row] = await listContributions();
  if (!row) throw new Error("contribuição não encontrada");

  const result = await deleteContribution(row.id);
  expect(result.error).toMatch(/negativo/);
  expect(await listContributions()).toHaveLength(1);
  expect((await listItems())[0]?.stock).toBe(0);
});

it("não troca vigente por passada", async () => {
  const maria = await hire({ name: "Maria", preference: "coffee" });
  const cafe = await stockItem({ name: "Café", kind: "coffee", stock: 4 });
  await recordContribution({
    employeeId: maria.id,
    itemId: cafe.id,
    quantity: 2,
  });
  const [row] = await listContributions();
  if (!row) throw new Error("contribuição não encontrada");

  const result = await updateContribution(
    row.id,
    {},
    contributionForm({
      employeeId: maria.id,
      itemId: cafe.id,
      quantity: 2,
      occurredAt: "2024-03-01",
      affectsStock: false,
    }),
  );

  expect(result.error).toMatch(/vigente e passada/);
  expect((await listContributions())[0]?.affectsStock).toBe(true);
  expect((await listItems())[0]?.stock).toBe(6);
});

it("não troca passada por vigente", async () => {
  const maria = await hire({ name: "Maria", preference: "coffee" });
  const cafe = await stockItem({ name: "Café", kind: "coffee", stock: 4 });
  await recordContribution({
    employeeId: maria.id,
    itemId: cafe.id,
    quantity: 2,
    past: true,
  });
  const [row] = await listContributions();
  if (!row) throw new Error("contribuição não encontrada");

  const result = await updateContribution(
    row.id,
    {},
    contributionForm({
      employeeId: maria.id,
      itemId: cafe.id,
      quantity: 2,
      occurredAt: "2024-03-01",
      affectsStock: true,
    }),
  );

  expect(result.error).toMatch(/vigente e passada/);
  expect((await listContributions())[0]?.affectsStock).toBe(false);
  expect((await listItems())[0]?.stock).toBe(4);
});

it("trocar o item na edição vigente move a quantidade", async () => {
  const maria = await hire({ name: "Maria", preference: "coffee" });
  const cafe = await stockItem({ name: "Café", kind: "coffee", stock: 4 });
  const filtro = await stockItem({ name: "Filtro", kind: "filter", stock: 1 });
  await recordContribution({
    employeeId: maria.id,
    itemId: cafe.id,
    quantity: 2,
  });
  const [row] = await listContributions();
  if (!row) throw new Error("contribuição não encontrada");

  const result = await updateContribution(
    row.id,
    {},
    contributionForm({
      employeeId: maria.id,
      itemId: filtro.id,
      quantity: 2,
      occurredAt: "2024-03-01",
      affectsStock: true,
    }),
  );

  expect(result).toEqual({ success: true });
  const items = await listItems();
  expect(items.find((item) => item.name === "Café")?.stock).toBe(4);
  expect(items.find((item) => item.name === "Filtro")?.stock).toBe(3);
  expect(await getContributionSummariesForItem(cafe.id)).toEqual([]);
  expect(await getContributionSummariesForItem(filtro.id)).toEqual([
    expect.objectContaining({ employeeId: maria.id, totalQuantity: 2 }),
  ]);
});

it("recusa edição que deixaria o estoque negativo", async () => {
  const maria = await hire({ name: "Maria", preference: "coffee" });
  const cafe = await stockItem({ name: "Café", kind: "coffee", stock: 2 });
  await recordContribution({
    employeeId: maria.id,
    itemId: cafe.id,
    quantity: 2,
  });
  await adjustItemStock(cafe.id, -4);
  const [row] = await listContributions();
  if (!row) throw new Error("contribuição não encontrada");

  const result = await updateContribution(
    row.id,
    {},
    contributionForm({
      employeeId: maria.id,
      itemId: cafe.id,
      quantity: 3,
      occurredAt: "2024-03-01",
      affectsStock: true,
    }),
  );

  expect(result.error).toMatch(/negativo/);
  expect((await listContributions())[0]?.quantity).toBe(2);
  expect((await listItems())[0]?.stock).toBe(0);
});
