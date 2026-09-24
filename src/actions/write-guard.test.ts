import { expect, it, vi } from "vitest";
import {
  createContribution,
  deleteContribution,
  listContributions,
  updateContribution,
} from "@/actions/contributions";
import {
  createEmployee,
  listEmployees,
  setEmployeeActive,
  updateEmployee,
} from "@/actions/employees";
import {
  adjustItemStock,
  createItem,
  deleteItem,
  listItems,
  updateItem,
} from "@/actions/items";
import { logout } from "@/actions/auth";
import { getDb } from "@/db";
import { contributions, employees, items, sessions } from "@/db/schema";
import { SIGN_IN_REQUIRED } from "@/lib/auth-messages";
import { notifyLowStock } from "@/lib/notify";
import { newBrowser } from "@/test/cookie-jar";
import {
  contributionForm,
  employeeForm,
  hire,
  hireAdmin,
  itemForm,
  recordContribution,
  stockItem,
} from "@/test/fixtures";

async function pantrySnapshot() {
  const db = getDb();
  return {
    employees: await db.select().from(employees),
    sessions: await db.select().from(sessions),
    items: await db.select().from(items),
    contributions: await db.select().from(contributions),
  };
}

async function stockedPantry() {
  const admin = await hireAdmin({ name: "Kaio", preference: "coffee", username: "kaio" });
  const maria = await hire({ name: "Maria", preference: "milk" });
  const cafe = await stockItem({ name: "Café", kind: "coffee", stock: 2 });
  await recordContribution({ employeeId: maria.id, itemId: cafe.id, quantity: 3 });
  const [contribution] = await listContributions();
  return { admin, maria, cafe, contribution: contribution! };
}

function writesOn(pantry: Awaited<ReturnType<typeof stockedPantry>>) {
  const { maria, cafe, contribution } = pantry;
  return {
    "criar funcionário": () =>
      createEmployee({}, employeeForm({ name: "Ana", preference: "both" })),
    "editar funcionário": () =>
      updateEmployee(maria.id, {}, employeeForm({ name: "Maria Silva", preference: "both" })),
    "inativar funcionário": () => setEmployeeActive(maria.id, false),
    "criar item": () => createItem({}, itemForm({ name: "Leite", kind: "milk", stock: 4 })),
    "editar item": () =>
      updateItem(cafe.id, {}, itemForm({ name: "Café torrado", kind: "coffee", stock: 5 })),
    contagem: () => updateItem(cafe.id, {}, itemForm({ name: "Café", kind: "coffee", stock: 0 })),
    "+1": () => adjustItemStock(cafe.id, 1),
    "−1": () => adjustItemStock(cafe.id, -1),
    contribuir: () =>
      createContribution(
        {},
        contributionForm({
          employeeId: maria.id,
          itemId: cafe.id,
          quantity: 1,
          occurredAt: "2024-03-02",
        }),
      ),
    "editar contribuição": () =>
      updateContribution(
        contribution.id,
        {},
        contributionForm({
          employeeId: maria.id,
          itemId: cafe.id,
          quantity: 1,
          occurredAt: "2024-03-01",
          affectsStock: true,
        }),
      ),
    "excluir contribuição": () => deleteContribution(contribution.id),
    "excluir item": () => deleteItem(cafe.id),
  };
}

it("sem sessão, as listagens de item, funcionário e contribuição funcionam", async () => {
  await stockedPantry();
  newBrowser();

  expect((await listItems()).map((item) => item.name)).toEqual(["Café"]);
  expect((await listEmployees()).map((row) => row.name)).toEqual(["Kaio", "Maria"]);
  expect(await listContributions()).toEqual([
    expect.objectContaining({ employeeName: "Maria", itemName: "Café", quantity: 3 }),
  ]);
});

it("sem sessão, a listagem de funcionário traz só nome, preferência e ativo, sem username, perfil nem hash", async () => {
  await stockedPantry();
  newBrowser();

  for (const row of await listEmployees()) {
    expect(row).not.toHaveProperty("username");
    expect(row).not.toHaveProperty("role");
    expect(row).not.toHaveProperty("passwordHash");
    expect(row).toMatchObject({
      name: expect.any(String),
      preference: expect.any(String),
      active: true,
    });
  }
});

it("sessão encerrada volta para a listagem pública", async () => {
  await stockedPantry();
  await logout();

  const [kaio] = await listEmployees();
  expect(kaio).not.toHaveProperty("username");
  expect(kaio).not.toHaveProperty("role");
});

it("com sessão de admin, a listagem traz username e perfil, sem hash", async () => {
  await stockedPantry();

  expect(await listEmployees()).toEqual([
    expect.objectContaining({ name: "Kaio", username: "kaio", role: "admin" }),
    expect.objectContaining({ name: "Maria", username: null, role: "funcionario" }),
  ]);
  for (const row of await listEmployees()) {
    expect(row).not.toHaveProperty("passwordHash");
  }
});

it("sem sessão, toda escrita é recusada e o banco não muda", async () => {
  const pantry = await stockedPantry();
  newBrowser();
  vi.mocked(notifyLowStock).mockClear();
  const before = await pantrySnapshot();

  for (const [name, write] of Object.entries(writesOn(pantry))) {
    expect({ name, result: await write() }).toEqual({ name, result: { error: SIGN_IN_REQUIRED } });
  }

  expect(await pantrySnapshot()).toEqual(before);
  expect(notifyLowStock).not.toHaveBeenCalled();
});

it("cookie de sessão encerrada não grava", async () => {
  const pantry = await stockedPantry();
  await logout();
  const before = await pantrySnapshot();

  expect(await writesOn(pantry)["+1"]()).toEqual({ error: SIGN_IN_REQUIRED });
  expect(await pantrySnapshot()).toEqual(before);
});

it.each(["admin", "admin_geral"] as const)("com sessão de %s, as escritas passam", async (role) => {
  const admin = await hireAdmin({ name: "Kaio", preference: "coffee", username: "kaio", role });
  const maria = await hire({ name: "Maria", preference: "milk" });
  expect(
    await updateEmployee(maria.id, {}, employeeForm({ name: "Maria Silva", preference: "both" })),
  ).toEqual({ success: true });
  expect(await setEmployeeActive(maria.id, false)).toEqual({ success: true });

  const cafe = await stockItem({ name: "Café", kind: "coffee", stock: 2 });
  expect(await adjustItemStock(cafe.id, 1)).toEqual({ success: true });
  expect(await adjustItemStock(cafe.id, -1)).toEqual({ success: true });
  expect(
    await updateItem(cafe.id, {}, itemForm({ name: "Café torrado", kind: "coffee", stock: 5 })),
  ).toEqual({ success: true });

  await recordContribution({ employeeId: admin.id, itemId: cafe.id, quantity: 2 });
  const [contribution] = await listContributions();
  expect(
    await updateContribution(
      contribution!.id,
      {},
      contributionForm({
        employeeId: admin.id,
        itemId: cafe.id,
        quantity: 3,
        occurredAt: "2024-03-01",
        affectsStock: true,
      }),
    ),
  ).toEqual({ success: true });
  expect((await listItems())[0]?.stock).toBe(8);
  expect(await deleteContribution(contribution!.id)).toEqual({ success: true });
  expect(await deleteItem(cafe.id)).toEqual({ success: true });

  expect(await listItems()).toEqual([]);
  expect(await listContributions()).toEqual([]);
  expect((await listEmployees()).find((row) => row.id === maria.id)).toMatchObject({
    name: "Maria Silva",
    preference: "both",
    active: false,
  });
});
