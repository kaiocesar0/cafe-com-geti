import { afterEach, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/password";

const pepper = process.env.AUTH_PEPPER;

afterEach(() => {
  process.env.AUTH_PEPPER = pepper;
});

it("gera hash Argon2id que confere a senha certa e recusa a errada", async () => {
  const hash = await hashPassword("cafe-forte-2024");

  expect(hash.startsWith("$argon2id$")).toBe(true);
  expect(hash).not.toContain("cafe-forte-2024");
  expect(await verifyPassword(hash, "cafe-forte-2024")).toBe(true);
  expect(await verifyPassword(hash, "cafe-fraco-2024")).toBe(false);
});

it("usa salt próprio por hash", async () => {
  const first = await hashPassword("cafe-forte-2024");
  const second = await hashPassword("cafe-forte-2024");

  expect(first).not.toBe(second);
  expect(await verifyPassword(second, "cafe-forte-2024")).toBe(true);
});

it("mistura o pepper do ambiente: outro pepper não confere o mesmo hash", async () => {
  const hash = await hashPassword("cafe-forte-2024");

  process.env.AUTH_PEPPER = "outro-pepper";

  expect(await verifyPassword(hash, "cafe-forte-2024")).toBe(false);
});

it("falha ao gravar e ao conferir senha sem pepper", async () => {
  const hash = await hashPassword("cafe-forte-2024");

  delete process.env.AUTH_PEPPER;

  await expect(hashPassword("cafe-forte-2024")).rejects.toThrow(/AUTH_PEPPER/);
  await expect(verifyPassword(hash, "cafe-forte-2024")).rejects.toThrow(/AUTH_PEPPER/);

  process.env.AUTH_PEPPER = "";

  await expect(hashPassword("cafe-forte-2024")).rejects.toThrow(/AUTH_PEPPER/);
});
