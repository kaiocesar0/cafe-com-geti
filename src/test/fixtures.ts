import { eq } from "drizzle-orm";
import { createEmployee, listEmployees } from "@/actions/employees";
import { createItem, listItems } from "@/actions/items";
import { createContribution } from "@/actions/contributions";
import { getDb } from "@/db";
import { employees, type ItemKind, type Preference } from "@/db/schema";

export function employeeForm(input: {
  name: string;
  preference: Preference;
  active?: boolean;
}) {
  const form = new FormData();
  form.set("name", input.name);
  form.set("preference", input.preference);
  if (input.active !== false) form.set("active", "on");
  return form;
}

export function itemForm(input: {
  name: string;
  unitLabel?: string;
  kind: ItemKind;
  stock: number;
}) {
  const form = new FormData();
  form.set("name", input.name);
  form.set("unitLabel", input.unitLabel ?? "pacote");
  form.set("kind", input.kind);
  form.set("stock", String(input.stock));
  return form;
}

export function contributionForm(input: {
  employeeId: string;
  itemId: string;
  quantity: number;
  occurredAt: string;
  past?: boolean;
  affectsStock?: boolean;
}) {
  const form = new FormData();
  form.set("employeeId", input.employeeId);
  form.set("itemId", input.itemId);
  form.set("quantity", String(input.quantity));
  form.set("occurredAt", input.occurredAt);
  if (input.past) form.set("kind", "past");
  if (input.affectsStock !== undefined) {
    form.set("affectsStock", input.affectsStock ? "true" : "false");
  }
  return form;
}

export async function hire(input: {
  name: string;
  preference: Preference;
  active?: boolean;
}) {
  const result = await createEmployee({}, employeeForm(input));
  if (result.error) throw new Error(result.error);
  return mustEmployee(input.name);
}

export async function stockItem(input: {
  name: string;
  unitLabel?: string;
  kind: ItemKind;
  stock: number;
}) {
  const result = await createItem({}, itemForm(input));
  if (result.error) throw new Error(result.error);
  return mustItem(input.name);
}

export async function recordContribution(input: {
  employeeId: string;
  itemId: string;
  quantity: number;
  occurredAt?: string;
  past?: boolean;
}) {
  const result = await createContribution(
    {},
    contributionForm({
      occurredAt: "2024-03-01",
      ...input,
    }),
  );
  if (result.error) throw new Error(result.error);
  return result;
}

export async function setCreatedAt(id: string, iso: string) {
  await getDb()
    .update(employees)
    .set({ createdAt: new Date(iso) })
    .where(eq(employees.id, id));
}

export async function mustEmployee(name: string) {
  const found = (await listEmployees()).find((row) => row.name === name);
  if (!found) throw new Error(`Funcionário ${name} não encontrado`);
  return found;
}

export async function mustItem(name: string) {
  const found = (await listItems()).find((row) => row.name === name);
  if (!found) throw new Error(`Item ${name} não encontrado`);
  return found;
}
