import { eq } from "drizzle-orm";
import { afterEach, expect, it } from "vitest";
import { createFirstAdminGeral } from "@/actions/accounts";
import { listEmployees } from "@/actions/employees";
import { getDb } from "@/db";
import { employees } from "@/db/schema";
import { verifyPassword } from "@/lib/password";

const pepper = process.env.AUTH_PEPPER;

afterEach(() => {
  process.env.AUTH_PEPPER = pepper;
});

const firstAdmin = {
  name: "Kaio",
  preference: "coffee",
  username: "kaio",
  password: "cafe-forte-2024",
} as const;

async function rowByUsername(username: string) {
  const [row] = await getDb()
    .select()
    .from(employees)
    .where(eq(employees.username, username));
  return row;
}

it("grava o primeiro admin geral com nome, preferência, username e senha", async () => {
  const result = await createFirstAdminGeral({ ...firstAdmin, username: "  Kaio  " });

  expect(result.error).toBeUndefined();

  const row = await rowByUsername("kaio");
  expect(row).toMatchObject({
    name: "Kaio",
    preference: "coffee",
    role: "admin_geral",
    active: true,
    username: "kaio",
  });
  expect(await verifyPassword(row.passwordHash!, "cafe-forte-2024")).toBe(true);
});

it("não devolve o hash de senha", async () => {
  const result = await createFirstAdminGeral(firstAdmin);

  expect(JSON.stringify(result)).not.toContain("argon2");
  expect(result).not.toHaveProperty("passwordHash");
});

it("recusa username já usado sem sobrescrever", async () => {
  await createFirstAdminGeral(firstAdmin);
  const before = await rowByUsername("kaio");

  const again = await createFirstAdminGeral({
    name: "Outra Pessoa",
    preference: "milk",
    username: "KAIO",
    password: "outra-senha-2024",
  });

  expect(again.error).toBe("Username já está em uso");
  expect(await rowByUsername("kaio")).toEqual(before);
  expect(await listEmployees()).toHaveLength(1);
});

it("recusa username fora do formato, senha curta e nome vazio sem gravar", async () => {
  expect((await createFirstAdminGeral({ ...firstAdmin, username: "ka" })).error).toBeTruthy();
  expect(
    (await createFirstAdminGeral({ ...firstAdmin, username: "1kaio" })).error,
  ).toBeTruthy();
  expect((await createFirstAdminGeral({ ...firstAdmin, password: "curta12" })).error).toBeTruthy();
  expect((await createFirstAdminGeral({ ...firstAdmin, name: "   " })).error).toBeTruthy();

  expect(await listEmployees()).toEqual([]);
});

it("falha sem pepper e não grava", async () => {
  delete process.env.AUTH_PEPPER;

  await expect(createFirstAdminGeral(firstAdmin)).rejects.toThrow(/AUTH_PEPPER/);

  process.env.AUTH_PEPPER = pepper;
  expect(await listEmployees()).toEqual([]);
});
