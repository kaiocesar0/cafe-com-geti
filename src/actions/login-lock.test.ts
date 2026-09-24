import { expect, it } from "vitest";
import { getCurrentSession, login } from "@/actions/auth";
import { setEmployeeActive } from "@/actions/employees";
import { getDb } from "@/db";
import { contributions, employees, items, sessions } from "@/db/schema";
import { INVALID_CREDENTIALS } from "@/lib/auth-messages";
import { LOGIN_LOCK_MS, loginLockCookieName } from "@/lib/login-lock";
import { advanceClock, advanceDays } from "@/test/clock";
import { cookieJar, inBrowser, newBrowser } from "@/test/cookie-jar";
import { hireAdminGeral } from "@/test/fixtures";

const kaio = { username: "kaio", password: "cafe-forte-2024" };
const bia = { username: "bia", password: "cha-verde-2024" };

async function accounts() {
  await hireAdminGeral({ name: "Kaio", ...kaio });
  await hireAdminGeral({ name: "Bia", preference: "milk", ...bia });
}

async function fail(username: string, times = 1) {
  for (let i = 0; i < times; i++) {
    expect((await login({ username, password: "senha-errada" })).error).toBe(
      INVALID_CREDENTIALS,
    );
  }
}

function lockCookie(username: string) {
  return cookieJar().attributes(loginLockCookieName(username));
}

async function pantrySnapshot() {
  const db = getDb();
  return {
    employees: await db.select().from(employees),
    sessions: await db.select().from(sessions),
    items: await db.select().from(items),
    contributions: await db.select().from(contributions),
  };
}

it("cinco erros seguidos travam o username neste pote, inclusive com a senha certa", async () => {
  await accounts();

  await fail("kaio", 5);

  const result = await login(kaio);
  expect(result.error).toBe(INVALID_CREDENTIALS);
  expect(result.session).toBeUndefined();
  expect(await getDb().select().from(sessions)).toEqual([]);
});

it("quatro erros ainda deixam entrar com a senha certa", async () => {
  await accounts();

  await fail("kaio", 4);

  expect((await login(kaio)).error).toBeUndefined();
});

it("cookie da trava é httpOnly, Secure, SameSite=Lax e não revela o contador em claro", async () => {
  await accounts();
  await fail("kaio");

  const cookie = lockCookie("kaio")!;
  expect(cookie).toMatchObject({ httpOnly: true, secure: true, sameSite: "lax", path: "/" });
  expect(cookie.name).not.toContain("kaio");
});

it("outro pote entra com o mesmo username enquanto o primeiro está travado", async () => {
  await accounts();
  const locked = cookieJar();
  await fail("kaio", 5);

  await inBrowser(newBrowser(), async () => {
    expect((await login(kaio)).error).toBeUndefined();
  });

  await inBrowser(locked, async () => {
    expect((await login(kaio)).error).toBe(INVALID_CREDENTIALS);
  });
});

it("outro username no mesmo pote não trava junto", async () => {
  await accounts();
  await fail("kaio", 5);

  expect((await login(bia)).error).toBeUndefined();
  expect((await login(kaio)).error).toBe(INVALID_CREDENTIALS);
});

it("acerto zera o contador deste pote nesse username", async () => {
  await accounts();
  await fail("kaio", 4);
  expect((await login(kaio)).error).toBeUndefined();

  await fail("kaio", 4);
  expect((await login(kaio)).error).toBeUndefined();
  expect(lockCookie("kaio")).toBeUndefined();
});

it("apagar o cookie zera a trava", async () => {
  await accounts();
  await fail("kaio", 5);

  cookieJar().delete(loginLockCookieName("kaio"));

  expect((await login(kaio)).error).toBeUndefined();
});

it("cookie adulterado não zera a trava", async () => {
  await accounts();
  await fail("kaio", 5);
  const name = loginLockCookieName("kaio");
  const original = cookieJar().get(name)!.value;

  const [payload, signature] = original.split(".");
  const forged = Buffer.from(
    JSON.stringify({ ...JSON.parse(Buffer.from(payload, "base64url").toString()), f: 0, l: 0 }),
  ).toString("base64url");
  cookieJar().set({ name, value: `${forged}.${signature}` });
  expect((await login(kaio)).error).toBe(INVALID_CREDENTIALS);

  cookieJar().set({ name, value: "lixo" });
  expect((await login(kaio)).error).toBe(INVALID_CREDENTIALS);
});

it("cookie de outro username copiado para este não zera a trava", async () => {
  await accounts();
  await fail("bia");
  const biaValue = cookieJar().get(loginLockCookieName("bia"))!.value;
  await fail("kaio", 5);

  cookieJar().set({ name: loginLockCookieName("kaio"), value: biaValue });

  expect((await login(kaio)).error).toBe(INVALID_CREDENTIALS);
});

it("contador não expira sozinho antes da quinta falha", async () => {
  await accounts();
  await fail("kaio", 4);

  advanceDays(30);
  await fail("kaio");

  expect((await login(kaio)).error).toBe(INVALID_CREDENTIALS);
});

it("ao fim dos 15 minutos a trava some e o contador recomeça", async () => {
  await accounts();
  await fail("kaio", 5);

  advanceClock(LOGIN_LOCK_MS - 1000);
  expect((await login(kaio)).error).toBe(INVALID_CREDENTIALS);

  advanceClock(1000);
  await fail("kaio", 4);
  expect((await login(kaio)).error).toBeUndefined();
});

it("tentar durante a trava não empurra o fim dela", async () => {
  await accounts();
  await fail("kaio", 5);

  advanceClock(LOGIN_LOCK_MS / 2);
  await fail("kaio", 3);

  advanceClock(LOGIN_LOCK_MS / 2);
  expect((await login(kaio)).error).toBeUndefined();
});

it("conta inativa também conta erro e trava", async () => {
  const kaioAccount = await hireAdminGeral({ name: "Kaio", ...kaio });
  await setEmployeeActive(kaioAccount.id, false);
  await login(kaio);
  await fail("kaio", 4);

  await setEmployeeActive(kaioAccount.id, true);

  expect((await login(kaio)).error).toBe(INVALID_CREDENTIALS);
});

it("username inexistente não grava nada no banco e responde credenciais inválidas", async () => {
  await accounts();
  const before = await pantrySnapshot();

  await fail("fantasma", 6);

  expect(await pantrySnapshot()).toEqual(before);
});

it("sessão já aberta não cai por causa da trava", async () => {
  const account = await hireAdminGeral({ name: "Kaio", ...kaio });
  await login(kaio);

  await fail("kaio", 6);

  expect(await getCurrentSession()).toMatchObject({ employeeId: account.id });
  expect(await getDb().select().from(sessions)).toHaveLength(1);
});
