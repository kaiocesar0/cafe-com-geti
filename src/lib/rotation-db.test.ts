import { expect, it } from "vitest";
import { updateEmployee, setEmployeeActive } from "@/actions/employees";
import { getNextPersonNameForItem } from "@/lib/stock-service";
import {
  employeeForm,
  hire,
  mustEmployee,
  recordContribution,
  setCreatedAt,
  stockItem,
} from "@/test/fixtures";

it("menor total, desempate e ordem de cadastro valem para vigente e passada", async () => {
  const joao = await hire({ name: "João", preference: "coffee" });
  const maria = await hire({ name: "Maria", preference: "coffee" });
  await setCreatedAt(joao.id, "2024-01-01T00:00:00.000Z");
  await setCreatedAt(maria.id, "2024-06-01T00:00:00.000Z");
  const cafe = await stockItem({ name: "Café", kind: "coffee", stock: 10 });

  expect(await getNextPersonNameForItem(cafe.id, "coffee")).toBe("João");

  await recordContribution({
    employeeId: maria.id,
    itemId: cafe.id,
    quantity: 1,
    past: true,
    occurredAt: "2024-06-01",
  });
  await recordContribution({
    employeeId: joao.id,
    itemId: cafe.id,
    quantity: 2,
    past: true,
    occurredAt: "2024-01-01",
  });
  expect(await getNextPersonNameForItem(cafe.id, "coffee")).toBe("Maria");

  await recordContribution({
    employeeId: maria.id,
    itemId: cafe.id,
    quantity: 1,
    past: true,
    occurredAt: "2024-02-01",
  });
  expect(await getNextPersonNameForItem(cafe.id, "coffee")).toBe("João");
});

it("quem toma só leite não é o próximo do café nem do filtro, mesmo com total alto", async () => {
  const ana = await hire({ name: "Ana", preference: "milk" });
  await hire({ name: "Maria", preference: "coffee" });
  const cafe = await stockItem({ name: "Café", kind: "coffee", stock: 10 });
  const filtro = await stockItem({ name: "Filtro", kind: "filter", stock: 10 });

  await recordContribution({
    employeeId: ana.id,
    itemId: cafe.id,
    quantity: 5,
    past: true,
  });
  await recordContribution({
    employeeId: ana.id,
    itemId: filtro.id,
    quantity: 5,
    past: true,
  });

  expect(await getNextPersonNameForItem(cafe.id, "coffee")).toBe("Maria");
  expect(await getNextPersonNameForItem(filtro.id, "filter")).toBe("Maria");
});

it("inativar tira a pessoa de todas as filas", async () => {
  const maria = await hire({ name: "Maria", preference: "both" });
  const joao = await hire({ name: "João", preference: "coffee" });
  await setCreatedAt(maria.id, "2024-01-01T00:00:00.000Z");
  await setCreatedAt(joao.id, "2024-06-01T00:00:00.000Z");
  const cafe = await stockItem({ name: "Café", kind: "coffee", stock: 4 });
  const leite = await stockItem({ name: "Leite", kind: "milk", stock: 4 });

  expect(await getNextPersonNameForItem(cafe.id, "coffee")).toBe("Maria");
  expect(await getNextPersonNameForItem(leite.id, "milk")).toBe("Maria");

  expect(await setEmployeeActive(maria.id, false)).toEqual({ success: true });

  expect(await getNextPersonNameForItem(cafe.id, "coffee")).toBe("João");
  expect(await getNextPersonNameForItem(leite.id, "milk")).toBeNull();
});

it("atualizar nome e preferência persiste e a fila acompanha", async () => {
  const maria = await hire({ name: "Maria", preference: "coffee" });
  await hire({ name: "João", preference: "coffee" });
  const cafe = await stockItem({ name: "Café", kind: "coffee", stock: 4 });
  const leite = await stockItem({ name: "Leite", kind: "milk", stock: 4 });
  await setCreatedAt(maria.id, "2024-01-01T00:00:00.000Z");

  const result = await updateEmployee(
    maria.id,
    {},
    employeeForm({ name: "Maria Clara", preference: "milk" }),
  );

  expect(result).toEqual({ success: true });
  expect(await mustEmployee("Maria Clara")).toMatchObject({
    preference: "milk",
    active: true,
  });
  expect(await getNextPersonNameForItem(cafe.id, "coffee")).toBe("João");
  expect(await getNextPersonNameForItem(leite.id, "milk")).toBe("Maria Clara");
});
