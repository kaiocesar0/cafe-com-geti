import { afterEach, expect, it } from "vitest";
import { getCurrentSession, login, logout } from "@/actions/auth";
import { setEmployeeActive as setActiveAs } from "@/actions/employees";
import { getDb } from "@/db";
import { contributions, employees, items, sessions } from "@/db/schema";
import { INVALID_CREDENTIALS } from "@/lib/auth-messages";
import { slideSessionForProxy } from "@/lib/current-session";
import { hashSessionToken, SESSION_COOKIE_NAME, SESSION_TTL_MS } from "@/lib/session";
import { advanceDays, testNow } from "@/test/clock";
import { CookieJar, cookieJar, inBrowser, newBrowser } from "@/test/cookie-jar";
import { hireAdmin, hireAdminGeral } from "@/test/fixtures";

const suitePepper = process.env.AUTH_PEPPER;

afterEach(() => {
  process.env.AUTH_PEPPER = suitePepper;
});

const credentials = { username: "kaio", password: "cafe-forte-2024" };

function adminGeral() {
  return hireAdminGeral({ name: "Kaio", preference: "coffee", ...credentials });
}

/** Outra pessoa, em outro navegador, liga ou desliga a conta. */
function setEmployeeActive(id: string, active: boolean) {
  return inBrowser(new CookieJar(), async () => {
    await hireAdmin({
      name: `Outra admin geral ${active ? "liga" : "desliga"}`,
      preference: "milk",
      username: `outra-${active ? "liga" : "desliga"}`,
      role: "admin_geral",
    });
    const result = await setActiveAs(id, active);
    await logout();
    return result;
  });
}

function sessionRows() {
  return getDb().select().from(sessions);
}

function sessionCookie() {
  return cookieJar().attributes(SESSION_COOKIE_NAME);
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

it("login certo grava sessão no banco e cookie opaco httpOnly, Secure e SameSite=Lax", async () => {
  const account = await adminGeral();

  const result = await login({ username: "  KAIO  ", password: credentials.password });

  expect(result.error).toBeUndefined();
  expect(result.session).toMatchObject({
    employeeId: account.id,
    username: "kaio",
    role: "admin_geral",
  });

  const rows = await sessionRows();
  expect(rows).toHaveLength(1);
  expect(rows[0].employeeId).toBe(account.id);

  const cookie = sessionCookie()!;
  expect(cookie).toMatchObject({
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
  });
  expect(cookie.value).not.toContain(credentials.password);
  expect(cookie.value).not.toBe(rows[0].tokenHash);
  expect(hashSessionToken(cookie.value)).toBe(rows[0].tokenHash);
  expect(rows[0].expiresAt.getTime() - testNow().getTime()).toBeLessThanOrEqual(SESSION_TTL_MS);
  expect(rows[0].expiresAt.getTime() - testNow().getTime()).toBeGreaterThan(SESSION_TTL_MS - 5000);
  expect(cookie.expires!.getTime()).toBe(rows[0].expiresAt.getTime());
});

it("senha errada, username ausente e conta inativa devolvem credenciais inválidas", async () => {
  const account = await adminGeral();

  expect((await login({ ...credentials, password: "senha-errada" })).error).toBe(
    INVALID_CREDENTIALS,
  );
  expect((await login({ username: "fantasma", password: credentials.password })).error).toBe(
    INVALID_CREDENTIALS,
  );
  expect((await login({ username: "", password: credentials.password })).error).toBe(
    INVALID_CREDENTIALS,
  );

  await setEmployeeActive(account.id, false);
  expect((await login(credentials)).error).toBe(INVALID_CREDENTIALS);

  expect(await sessionRows()).toEqual([]);
  expect(sessionCookie()).toBeUndefined();
});

it("username ausente não grava linha de tentativa no banco", async () => {
  await adminGeral();
  const before = await pantrySnapshot();

  expect((await login({ username: "fantasma", password: "qualquer-senha" })).error).toBe(
    INVALID_CREDENTIALS,
  );
  expect((await login({ username: "KA", password: "qualquer-senha" })).error).toBe(
    INVALID_CREDENTIALS,
  );

  expect(await pantrySnapshot()).toEqual(before);
  expect(sessionCookie()).toBeUndefined();
});

it("conta reativada entra de novo com a mesma senha", async () => {
  const account = await adminGeral();
  await setEmployeeActive(account.id, false);
  await setEmployeeActive(account.id, true);

  expect((await login(credentials)).error).toBeUndefined();
  expect(await sessionRows()).toHaveLength(1);
});

it("sair apaga só a sessão daquele pote de cookies", async () => {
  const account = await adminGeral();

  const firstBrowser = cookieJar();
  await login(credentials);
  const secondBrowser = newBrowser();
  await login(credentials);
  expect(await sessionRows()).toHaveLength(2);

  await logout();

  expect(sessionCookie()).toBeUndefined();
  expect(await getCurrentSession()).toBeNull();
  expect(cookieJar()).toBe(secondBrowser);

  const remaining = await sessionRows();
  expect(remaining).toHaveLength(1);

  await inBrowser(firstBrowser, async () => {
    const current = await getCurrentSession();
    expect(current).toMatchObject({ employeeId: account.id, username: "kaio" });
    expect(hashSessionToken(firstBrowser.get(SESSION_COOKIE_NAME)!.value)).toBe(
      remaining[0].tokenHash,
    );
  });
});

it("sair sem sessão aberta não derruba sessão de ninguém", async () => {
  await adminGeral();
  const logged = cookieJar();
  await login(credentials);

  await inBrowser(newBrowser(), async () => {
    await logout();
  });

  expect(await sessionRows()).toHaveLength(1);
  await inBrowser(logged, async () => {
    expect(await getCurrentSession()).not.toBeNull();
  });
});

it("sessão vale 14 dias desde o último uso que a valida", async () => {
  await adminGeral();
  await login(credentials);
  const [opened] = await sessionRows();

  advanceDays(13);
  expect(await getCurrentSession()).not.toBeNull();

  const [renewed] = await sessionRows();
  expect(renewed.expiresAt.getTime()).toBeGreaterThan(opened.expiresAt.getTime());
  expect(renewed.expiresAt.getTime() - testNow().getTime()).toBeGreaterThan(
    SESSION_TTL_MS - 5000,
  );
  // Cookie e banco avançam juntos na validação que consegue gravar o cookie.
  expect(sessionCookie()!.expires!.getTime()).toBe(renewed.expiresAt.getTime());

  advanceDays(13);
  expect(await getCurrentSession()).not.toBeNull();
});

it("proxy renova cookie e banco juntos quando a sessão valida", async () => {
  await adminGeral();
  await login(credentials);
  const token = sessionCookie()!.value;
  const [opened] = await sessionRows();

  advanceDays(13);
  const result = await slideSessionForProxy(token);

  expect(result).toMatchObject({ ok: true });
  if (!result.ok) return;

  const [renewed] = await sessionRows();
  expect(renewed.expiresAt.getTime()).toBeGreaterThan(opened.expiresAt.getTime());
  expect(result.cookie.expires.getTime()).toBe(renewed.expiresAt.getTime());
  expect(result.cookie.expires.getTime() - testNow().getTime()).toBeGreaterThan(
    SESSION_TTL_MS - 5000,
  );
});

it("se cookies().set falha, o banco não avança o vencimento sozinho", async () => {
  await adminGeral();
  await login(credentials);
  const [opened] = await sessionRows();
  const cookieExpires = sessionCookie()!.expires!.getTime();

  advanceDays(13);

  const jar = cookieJar();
  const originalSet = jar.set.bind(jar);
  jar.set = (() => {
    throw new Error("Cookies can only be modified in a Server Action or Route Handler.");
  }) as typeof jar.set;

  try {
    expect(await getCurrentSession()).not.toBeNull();
  } finally {
    jar.set = originalSet;
  }

  const [unchanged] = await sessionRows();
  expect(unchanged.expiresAt.getTime()).toBe(opened.expiresAt.getTime());
  expect(sessionCookie()!.expires!.getTime()).toBe(cookieExpires);
});

it("sem AUTH_PEPPER o login falha controlado e não abre sessão", async () => {
  await adminGeral();
  delete process.env.AUTH_PEPPER;

  await expect(login(credentials)).resolves.toEqual({ error: INVALID_CREDENTIALS });
  expect(await sessionRows()).toEqual([]);
  expect(sessionCookie()).toBeUndefined();
});

it("relógio avançado além de 14 dias sem uso vence a sessão e limpa o cookie", async () => {
  await adminGeral();
  await login(credentials);

  advanceDays(15);

  expect(await getCurrentSession()).toBeNull();
  expect(await sessionRows()).toEqual([]);
  expect(sessionCookie()).toBeUndefined();
});

it("cookie inventado não abre sessão", async () => {
  await adminGeral();

  cookieJar().set({ name: SESSION_COOKIE_NAME, value: "token-inventado" });

  expect(await getCurrentSession()).toBeNull();
  expect(await sessionRows()).toEqual([]);
  expect(sessionCookie()).toBeUndefined();
});

it("sessão de conta inativada depois do login deixa de valer", async () => {
  const account = await adminGeral();
  await login(credentials);

  await setEmployeeActive(account.id, false);

  expect(await getCurrentSession()).toBeNull();
  expect(await sessionRows()).toEqual([]);
});
