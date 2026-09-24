import { eq } from "drizzle-orm";
import { expect, it } from "vitest";
import { createFirstAdminGeral } from "@/actions/accounts";
import { listEmployees } from "@/actions/employees";
import { getDb } from "@/db";
import { employees } from "@/db/schema";
import { hire, hireAdmin, openAdminSession } from "@/test/fixtures";

it("grava e lê de volta um funcionário", async () => {
  await openAdminSession();
  await hire({ name: "Maria", preference: "coffee" });

  const names = (await listEmployees()).map((row) => row.name);
  expect(names).toEqual(["Admin da suíte", "Maria"]);
});

it("quem já estava gravado é funcionário, sem username e sem senha", async () => {
  await openAdminSession();
  const maria = await hire({ name: "Maria", preference: "coffee" });

  const [row] = await getDb().select().from(employees).where(eq(employees.id, maria.id));
  expect(row).toMatchObject({ role: "funcionario", username: null, passwordHash: null });
});

it("vários funcionários sem username convivem", async () => {
  await hireAdmin({ name: "Maria", preference: "coffee" });
  await hire({ name: "João", preference: "milk" });

  expect(await listEmployees()).toHaveLength(2);
});

it("a listagem não traz o hash de senha", async () => {
  await createFirstAdminGeral({
    name: "Kaio",
    preference: "coffee",
    username: "kaio",
    password: "cafe-forte-2024",
  });

  for (const row of await listEmployees()) {
    expect(row).not.toHaveProperty("passwordHash");
  }
});
