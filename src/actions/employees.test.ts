import { expect, it } from "vitest";
import { listEmployees } from "@/actions/employees";
import { hire } from "@/test/fixtures";

it("grava e lê de volta um funcionário", async () => {
  await hire({ name: "Maria", preference: "coffee" });

  const names = (await listEmployees()).map((row) => row.name);
  expect(names).toEqual(["Maria"]);
});
