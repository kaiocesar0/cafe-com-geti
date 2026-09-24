import { expect, it } from "vitest";
import { changeOwnPassword, getCurrentSession, login } from "@/actions/auth";
import { getDb } from "@/db";
import { employees, sessions } from "@/db/schema";
import {
  INVALID_CREDENTIALS,
  SIGN_IN_REQUIRED,
  WRONG_CURRENT_PASSWORD,
} from "@/lib/auth-messages";
import { isLoginLocked, loginLockCookieName, readLoginLock } from "@/lib/login-lock";
import { PASSWORD_ERROR } from "@/lib/password";
import { hashSessionToken, SESSION_COOKIE_NAME } from "@/lib/session";
import { testNow } from "@/test/clock";
import { cookieJar, inBrowser, newBrowser } from "@/test/cookie-jar";
import { hire, hireAdminGeral, signIn } from "@/test/fixtures";

const credentials = { username: "kaio", password: "cafe-forte-2024" };
const newPassword = "cafe-mais-forte-2025";

function adminGeral() {
  return hireAdminGeral({ name: "Kaio", preference: "coffee", ...credentials });
}

async function snapshot() {
  const db = getDb();
  const sessionRows = await db
    .select({ id: sessions.id, employeeId: sessions.employeeId, tokenHash: sessions.tokenHash })
    .from(sessions);
  return {
    employees: await db.select().from(employees),
    sessions: sessionRows.sort((a, b) => a.id.localeCompare(b.id)),
  };
}

it("troca exige a senha atual e a nova com pelo menos 8 caracteres", async () => {
  await adminGeral();
  await signIn(credentials);
  const before = await snapshot();

  expect(
    await changeOwnPassword({ currentPassword: credentials.password, newPassword: "curta" }),
  ).toEqual({ error: PASSWORD_ERROR });
  expect(await changeOwnPassword({ currentPassword: "", newPassword })).toEqual({
    error: WRONG_CURRENT_PASSWORD,
  });

  expect(await snapshot()).toEqual(before);
});

it("sem sessão a troca é recusada e nada muda", async () => {
  await adminGeral();
  const logged = cookieJar();
  await signIn(credentials);
  const before = await snapshot();

  await inBrowser(newBrowser(), async () => {
    expect(
      await changeOwnPassword({ currentPassword: credentials.password, newPassword }),
    ).toEqual({ error: SIGN_IN_REQUIRED });
  });

  expect(await snapshot()).toEqual(before);
  await inBrowser(logged, async () => {
    expect(await getCurrentSession()).not.toBeNull();
  });
});

it("troca mantém a sessão deste pote e mata as outras da mesma pessoa", async () => {
  const account = await adminGeral();
  const other = await hireAdminGeral({
    name: "Geti",
    username: "geti",
    password: "outra-senha-boa",
  });

  const otherBrowser = newBrowser();
  await signIn(credentials);
  const otherPersonBrowser = newBrowser();
  await signIn({ username: "geti", password: "outra-senha-boa" });
  const thisBrowser = newBrowser();
  await signIn(credentials);

  expect(
    await changeOwnPassword({ currentPassword: credentials.password, newPassword }),
  ).toEqual({});

  const rows = await getDb().select().from(sessions);
  expect(rows.map((row) => row.employeeId).sort()).toEqual([account.id, other.id].sort());
  const mine = rows.find((row) => row.employeeId === account.id)!;
  expect(mine.tokenHash).toBe(hashSessionToken(thisBrowser.get(SESSION_COOKIE_NAME)!.value));

  expect(await getCurrentSession()).toMatchObject({ employeeId: account.id });
  await inBrowser(otherBrowser, async () => {
    expect(await getCurrentSession()).toBeNull();
  });
  await inBrowser(otherPersonBrowser, async () => {
    expect(await getCurrentSession()).toMatchObject({ employeeId: other.id });
  });
});

it("senha nova passa a valer no próximo login e a antiga deixa de valer", async () => {
  await adminGeral();
  await signIn(credentials);

  expect(
    await changeOwnPassword({ currentPassword: credentials.password, newPassword }),
  ).toEqual({});

  await inBrowser(newBrowser(), async () => {
    expect((await login(credentials)).error).toBeDefined();
    expect((await login({ username: "kaio", password: newPassword })).error).toBeUndefined();
  });
});

it("senha atual errada falha e o banco e as sessões não mudam", async () => {
  await adminGeral();
  const elsewhere = cookieJar();
  await signIn(credentials);
  newBrowser();
  await signIn(credentials);
  const before = await snapshot();

  expect(
    await changeOwnPassword({ currentPassword: "senha-errada", newPassword }),
  ).toEqual({ error: WRONG_CURRENT_PASSWORD });

  expect(await snapshot()).toEqual(before);
  await inBrowser(elsewhere, async () => {
    expect(await getCurrentSession()).not.toBeNull();
  });
  expect((await login(credentials)).error).toBeUndefined();
});

function lockIn(username: string) {
  const value = cookieJar().get(loginLockCookieName(username))?.value;
  return readLoginLock(username, value, testNow());
}

async function failLogin(username: string, times: number) {
  for (let i = 0; i < times; i++) {
    expect((await login({ username, password: "senha-errada" })).error).toBe(
      INVALID_CREDENTIALS,
    );
  }
}

it("acerto na troca zera a trava deste navegador nesse username", async () => {
  await adminGeral();
  await hireAdminGeral({ name: "Bia", username: "bia", password: "cha-verde-2024" });
  await signIn(credentials);
  await failLogin("kaio", 5);
  await failLogin("bia", 2);
  expect(isLoginLocked(lockIn("kaio"), testNow())).toBe(true);

  expect(
    await changeOwnPassword({ currentPassword: credentials.password, newPassword }),
  ).toEqual({});

  expect(cookieJar().get(loginLockCookieName("kaio"))).toBeUndefined();
  expect(lockIn("bia").failures).toBe(2);
  expect((await login({ username: "kaio", password: newPassword })).error).toBeUndefined();
});

it("senha atual errada na troca não zera a trava", async () => {
  await adminGeral();
  await signIn(credentials);
  await failLogin("kaio", 5);

  await changeOwnPassword({ currentPassword: "senha-errada", newPassword });

  expect(isLoginLocked(lockIn("kaio"), testNow())).toBe(true);
});

it("funcionário sem senha não tem troca de senha", async () => {
  await adminGeral();
  await signIn(credentials);
  await hire({ name: "Ana", preference: "coffee" });
  newBrowser();
  const before = await snapshot();

  expect(
    await changeOwnPassword({ currentPassword: "qualquer-coisa", newPassword }),
  ).toEqual({ error: SIGN_IN_REQUIRED });
  expect(await snapshot()).toEqual(before);
});
