import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { expect, it } from "vitest";
import {
  demoteToFuncionario,
  promoteToAdmin,
  promoteToAdminGeral,
  resetEmployeePassword,
} from "@/actions/accounts";
import { getCurrentSession, login } from "@/actions/auth";
import { setEmployeeActive, updateEmployee } from "@/actions/employees";
import { getDb } from "@/db";
import { contributions, employees, items, sessions, type Preference } from "@/db/schema";
import { INVALID_CREDENTIALS, NO_PERMISSION, SIGN_IN_REQUIRED } from "@/lib/auth-messages";
import { isLastActiveAdminGeral } from "@/lib/authorization";
import { PASSWORD_ERROR, verifyPassword } from "@/lib/password";
import { getNextPersonNameForItem } from "@/lib/stock-service";
import { USERNAME_ERROR } from "@/lib/username";
import { CookieJar, inBrowser, newBrowser } from "@/test/cookie-jar";
import {
  ADMIN_PASSWORD,
  employeeForm,
  hire,
  hireAdmin,
  signIn,
  stockItem,
} from "@/test/fixtures";

const USERNAME_TAKEN = "Username já está em uso";
const EMPLOYEE_NOT_FOUND = "Funcionário não encontrado";

function inNewBrowser<T>(run: () => Promise<T>) {
  return inBrowser(new CookieJar(), run);
}

/** Outra conta de admin, já logada no navegador dela, sem mexer na sessão deste teste. */
async function hireAdminElsewhere(input: {
  name: string;
  preference?: Preference;
  username: string;
  role?: "admin" | "admin_geral";
}) {
  const browser = new CookieJar();
  const account = await inBrowser(browser, () =>
    hireAdmin({ preference: "coffee", ...input }),
  );
  return { ...account, browser };
}

async function rowOf(id: string) {
  const [row] = await getDb().select().from(employees).where(eq(employees.id, id));
  if (!row) throw new Error(`Funcionário ${id} não está no banco`);
  return row;
}

function sessionsOf(id: string) {
  return getDb().select().from(sessions).where(eq(sessions.employeeId, id));
}

/**
 * Ordem fixa para comparar, e sem o vencimento da sessão: toda ação autenticada valida a
 * sessão de quem chamou e empurra esse vencimento, o que não é a matriz mexendo no banco.
 */
async function pantrySnapshot() {
  const db = getDb();
  const openSessions = await db.select().from(sessions).orderBy(sessions.tokenHash);
  return {
    employees: await db.select().from(employees).orderBy(employees.createdAt),
    sessions: openSessions.map((session) => ({
      id: session.id,
      employeeId: session.employeeId,
      tokenHash: session.tokenHash,
      createdAt: session.createdAt,
    })),
    items: await db.select().from(items).orderBy(items.name),
    contributions: await db.select().from(contributions).orderBy(contributions.occurredAt),
  };
}

it("admin promove funcionário ativo e a pessoa entra com a senha inicial", async () => {
  await hireAdmin({ name: "Kaio", preference: "coffee", username: "kaio" });
  const maria = await hire({ name: "Maria", preference: "milk" });

  expect(
    await promoteToAdmin({
      employeeId: maria.id,
      username: "  Maria  ",
      password: "senha-da-maria",
    }),
  ).toEqual({ success: true });

  const row = await rowOf(maria.id);
  expect(row).toMatchObject({
    role: "admin",
    username: "maria",
    name: "Maria",
    preference: "milk",
    active: true,
  });
  expect(await verifyPassword(row.passwordHash!, "senha-da-maria")).toBe(true);

  await inNewBrowser(async () => {
    const result = await login({ username: "maria", password: "senha-da-maria" });
    expect(result.session).toMatchObject({ username: "maria", role: "admin" });
  });
});

it("funcionário inativo não vira admin", async () => {
  await hireAdmin({ name: "Kaio", preference: "coffee", username: "kaio" });
  const bia = await hire({ name: "Bia", preference: "milk", active: false });
  const before = await pantrySnapshot();

  expect(
    await promoteToAdmin({
      employeeId: bia.id,
      username: "bia",
      password: "senha-da-bia",
    }),
  ).toEqual({ error: NO_PERMISSION });

  expect(await pantrySnapshot()).toEqual(before);
});

it("promoção recusa username fora do formato, senha curta e username já usado", async () => {
  await hireAdmin({ name: "Kaio", preference: "coffee", username: "kaio" });
  const maria = await hire({ name: "Maria", preference: "milk" });
  const before = await pantrySnapshot();

  expect(
    (await promoteToAdmin({ employeeId: maria.id, username: "ma", password: "senha-da-maria" }))
      .error,
  ).toBe(USERNAME_ERROR);
  expect(
    (await promoteToAdmin({ employeeId: maria.id, username: "maria", password: "curta12" }))
      .error,
  ).toBe(PASSWORD_ERROR);
  expect(
    (await promoteToAdmin({ employeeId: maria.id, username: "KAIO", password: "senha-da-maria" }))
      .error,
  ).toBe(USERNAME_TAKEN);

  expect(await pantrySnapshot()).toEqual(before);
});

it("funcionário não vira admin geral direto: primeiro vira admin", async () => {
  await hireAdmin({
    name: "Geral",
    preference: "coffee",
    username: "geral",
    role: "admin_geral",
  });
  const maria = await hire({ name: "Maria", preference: "milk" });

  expect(await promoteToAdminGeral(maria.id)).toEqual({ error: NO_PERMISSION });
  expect(await rowOf(maria.id)).toMatchObject({ role: "funcionario", username: null });

  await promoteToAdmin({
    employeeId: maria.id,
    username: "maria",
    password: "senha-da-maria",
  });
  expect(await promoteToAdminGeral(maria.id)).toEqual({ success: true });
  expect(await rowOf(maria.id)).toMatchObject({ role: "admin_geral", username: "maria" });
});

it("admin não edita, não inativa, não rebaixa nem troca a senha de outro admin", async () => {
  await hireAdmin({ name: "Kaio", preference: "coffee", username: "kaio" });
  const bia = await hireAdminElsewhere({ name: "Bia", preference: "milk", username: "bia" });
  const geral = await hireAdminElsewhere({
    name: "Geral",
    username: "geral",
    role: "admin_geral",
  });
  const before = await pantrySnapshot();

  for (const alvo of [bia, geral]) {
    expect(
      await updateEmployee(alvo.id, {}, employeeForm({ name: "Outro nome", preference: "both" })),
    ).toEqual({ error: NO_PERMISSION });
    expect(await setEmployeeActive(alvo.id, false)).toEqual({ error: NO_PERMISSION });
    expect(await demoteToFuncionario(alvo.id)).toEqual({ error: NO_PERMISSION });
    expect(await promoteToAdminGeral(alvo.id)).toEqual({ error: NO_PERMISSION });
    expect(
      await resetEmployeePassword({ employeeId: alvo.id, newPassword: "senha-nova-2024" }),
    ).toEqual({ error: NO_PERMISSION });
  }

  expect(await pantrySnapshot()).toEqual(before);
});

it("admin muda o próprio nome e preferência, e não muda o próprio ativo, perfil nem username", async () => {
  const kaio = await hireAdmin({ name: "Kaio", preference: "coffee", username: "kaio" });

  expect(
    await updateEmployee(kaio.id, {}, employeeForm({ name: "Kaio Silva", preference: "both" })),
  ).toEqual({ success: true });
  expect(await rowOf(kaio.id)).toMatchObject({
    name: "Kaio Silva",
    preference: "both",
    active: true,
    role: "admin",
    username: "kaio",
  });

  expect(
    await updateEmployee(
      kaio.id,
      {},
      employeeForm({ name: "Kaio Silva", preference: "both", active: false }),
    ),
  ).toEqual({ error: NO_PERMISSION });
  expect(await setEmployeeActive(kaio.id, false)).toEqual({ error: NO_PERMISSION });
  expect(await demoteToFuncionario(kaio.id)).toEqual({ error: NO_PERMISSION });
  expect(await promoteToAdminGeral(kaio.id)).toEqual({ error: NO_PERMISSION });

  expect(await rowOf(kaio.id)).toMatchObject({
    active: true,
    role: "admin",
    username: "kaio",
  });
});

it("username e perfil não entram pelo formulário de funcionário", async () => {
  const kaio = await hireAdmin({ name: "Kaio", preference: "coffee", username: "kaio" });
  const form = employeeForm({ name: "Kaio", preference: "coffee" });
  form.set("username", "kaio-chefe");
  form.set("role", "admin_geral");

  expect(await updateEmployee(kaio.id, {}, form)).toEqual({ success: true });

  expect(await rowOf(kaio.id)).toMatchObject({ username: "kaio", role: "admin" });
});

it("admin geral altera nome, preferência e ativo de outro admin e de outro admin geral", async () => {
  await hireAdmin({
    name: "Geral",
    preference: "coffee",
    username: "geral",
    role: "admin_geral",
  });
  const bia = await hireAdminElsewhere({ name: "Bia", preference: "milk", username: "bia" });
  const outra = await hireAdminElsewhere({
    name: "Outra",
    username: "outra",
    role: "admin_geral",
  });

  expect(
    await updateEmployee(bia.id, {}, employeeForm({ name: "Bia Souza", preference: "both" })),
  ).toEqual({ success: true });
  expect(await rowOf(bia.id)).toMatchObject({
    name: "Bia Souza",
    preference: "both",
    role: "admin",
    username: "bia",
  });

  expect(await setEmployeeActive(outra.id, false)).toEqual({ success: true });
  expect(await rowOf(outra.id)).toMatchObject({
    active: false,
    role: "admin_geral",
    username: "outra",
  });
});

it("admin geral rebaixa outro admin: apaga username, hash e sessões", async () => {
  await hireAdmin({
    name: "Geral",
    preference: "coffee",
    username: "geral",
    role: "admin_geral",
  });
  const bia = await hireAdminElsewhere({ name: "Bia", preference: "milk", username: "bia" });

  expect(await demoteToFuncionario(bia.id)).toEqual({ success: true });

  expect(await rowOf(bia.id)).toMatchObject({
    role: "funcionario",
    username: null,
    passwordHash: null,
    name: "Bia",
    preference: "milk",
    active: true,
  });
  expect(await sessionsOf(bia.id)).toEqual([]);
  await inBrowser(bia.browser, async () => {
    expect(await getCurrentSession()).toBeNull();
  });
  await inNewBrowser(async () => {
    expect((await login({ username: "bia", password: ADMIN_PASSWORD })).error).toBe(
      INVALID_CREDENTIALS,
    );
  });
});

it("admin geral rebaixa outro admin geral", async () => {
  await hireAdmin({
    name: "Geral",
    preference: "coffee",
    username: "geral",
    role: "admin_geral",
  });
  const outra = await hireAdminElsewhere({
    name: "Outra",
    username: "outra",
    role: "admin_geral",
  });

  expect(await demoteToFuncionario(outra.id)).toEqual({ success: true });

  expect(await rowOf(outra.id)).toMatchObject({
    role: "funcionario",
    username: null,
    passwordHash: null,
  });
  expect(await sessionsOf(outra.id)).toEqual([]);
});

it("admin geral promove admin a admin geral sem mexer em username, senha nem sessão", async () => {
  await hireAdmin({
    name: "Geral",
    preference: "coffee",
    username: "geral",
    role: "admin_geral",
  });
  const bia = await hireAdminElsewhere({ name: "Bia", preference: "milk", username: "bia" });
  const before = await rowOf(bia.id);

  expect(await promoteToAdminGeral(bia.id)).toEqual({ success: true });

  expect(await rowOf(bia.id)).toEqual({ ...before, role: "admin_geral" });
  await inBrowser(bia.browser, async () => {
    expect(await getCurrentSession()).toMatchObject({
      employeeId: bia.id,
      role: "admin_geral",
    });
  });
  await inNewBrowser(async () => {
    expect((await login({ username: "bia", password: ADMIN_PASSWORD })).error).toBeUndefined();
  });
});

it("admin geral troca a senha de outro sem a atual e derruba todas as sessões dessa pessoa", async () => {
  const geral = await hireAdmin({
    name: "Geral",
    preference: "coffee",
    username: "geral",
    role: "admin_geral",
  });
  const bia = await hireAdminElsewhere({ name: "Bia", preference: "milk", username: "bia" });
  await inNewBrowser(() => signIn({ username: "bia", password: ADMIN_PASSWORD }));
  expect(await sessionsOf(bia.id)).toHaveLength(2);

  expect(
    await resetEmployeePassword({ employeeId: bia.id, newPassword: "senha-nova-2024" }),
  ).toEqual({ success: true });

  expect(await sessionsOf(bia.id)).toEqual([]);
  expect(await sessionsOf(geral.id)).toHaveLength(1);
  expect(await rowOf(bia.id)).toMatchObject({ username: "bia", role: "admin", active: true });

  await inNewBrowser(async () => {
    expect((await login({ username: "bia", password: ADMIN_PASSWORD })).error).toBe(
      INVALID_CREDENTIALS,
    );
  });
  await inNewBrowser(async () => {
    expect((await login({ username: "bia", password: "senha-nova-2024" })).session).toMatchObject({
      username: "bia",
    });
  });
});

it("troca de senha de outro recusa senha curta e não derruba a sessão dessa pessoa", async () => {
  await hireAdmin({
    name: "Geral",
    preference: "coffee",
    username: "geral",
    role: "admin_geral",
  });
  const bia = await hireAdminElsewhere({ name: "Bia", preference: "milk", username: "bia" });
  const before = await rowOf(bia.id);

  expect(
    await resetEmployeePassword({ employeeId: bia.id, newPassword: "curta12" }),
  ).toEqual({ error: PASSWORD_ERROR });

  expect(await rowOf(bia.id)).toEqual(before);
  expect(await sessionsOf(bia.id)).toHaveLength(1);
});

it("admin geral não troca a própria senha por essa operação", async () => {
  const geral = await hireAdmin({
    name: "Geral",
    preference: "coffee",
    username: "geral",
    role: "admin_geral",
  });
  const before = await pantrySnapshot();

  expect(
    await resetEmployeePassword({ employeeId: geral.id, newPassword: "senha-nova-2024" }),
  ).toEqual({ error: NO_PERMISSION });

  expect(await pantrySnapshot()).toEqual(before);
});

it("admin geral não se rebaixa nem se inativa", async () => {
  const geral = await hireAdmin({
    name: "Geral",
    preference: "coffee",
    username: "geral",
    role: "admin_geral",
  });
  await hireAdminElsewhere({ name: "Outra", username: "outra", role: "admin_geral" });
  const before = await pantrySnapshot();

  expect(await demoteToFuncionario(geral.id)).toEqual({ error: NO_PERMISSION });
  expect(await setEmployeeActive(geral.id, false)).toEqual({ error: NO_PERMISSION });
  expect(
    await updateEmployee(
      geral.id,
      {},
      employeeForm({ name: "Geral", preference: "coffee", active: false }),
    ),
  ).toEqual({ error: NO_PERMISSION });

  expect(await pantrySnapshot()).toEqual(before);
});

it("quem é o último admin geral ativo sai do cadastro, não de quem está logado", async () => {
  const geral = await hireAdmin({
    name: "Geral",
    preference: "coffee",
    username: "geral",
    role: "admin_geral",
  });
  const bia = await hireAdminElsewhere({ name: "Bia", preference: "milk", username: "bia" });

  expect(await isLastActiveAdminGeral(await rowOf(geral.id))).toBe(true);
  expect(await isLastActiveAdminGeral(await rowOf(bia.id))).toBe(false);

  const outra = await hireAdminElsewhere({
    name: "Outra",
    username: "outra",
    role: "admin_geral",
  });
  expect(await isLastActiveAdminGeral(await rowOf(geral.id))).toBe(false);
  expect(await isLastActiveAdminGeral(await rowOf(outra.id))).toBe(false);

  await setEmployeeActive(outra.id, false);
  expect(await isLastActiveAdminGeral(await rowOf(geral.id))).toBe(true);
  expect(await isLastActiveAdminGeral(await rowOf(outra.id))).toBe(false);
});

it("o último admin geral ativo não é rebaixado nem inativado", async () => {
  const geral = await hireAdmin({
    name: "Geral",
    preference: "coffee",
    username: "geral",
    role: "admin_geral",
  });
  const outra = await hireAdminElsewhere({
    name: "Outra",
    username: "outra",
    role: "admin_geral",
  });

  expect(await setEmployeeActive(outra.id, false)).toEqual({ success: true });

  expect(await demoteToFuncionario(geral.id)).toEqual({ error: NO_PERMISSION });
  expect(await setEmployeeActive(geral.id, false)).toEqual({ error: NO_PERMISSION });
  expect(await rowOf(geral.id)).toMatchObject({ role: "admin_geral", active: true });
});

it("inativar admin apaga as sessões e bloqueia o login; reativar entra com a senha antiga", async () => {
  await hireAdmin({
    name: "Geral",
    preference: "coffee",
    username: "geral",
    role: "admin_geral",
  });
  const bia = await hireAdminElsewhere({ name: "Bia", preference: "milk", username: "bia" });
  expect(await sessionsOf(bia.id)).toHaveLength(1);

  expect(await setEmployeeActive(bia.id, false)).toEqual({ success: true });

  expect(await sessionsOf(bia.id)).toEqual([]);
  await inBrowser(bia.browser, async () => {
    expect(await getCurrentSession()).toBeNull();
  });
  await inNewBrowser(async () => {
    expect((await login({ username: "bia", password: ADMIN_PASSWORD })).error).toBe(
      INVALID_CREDENTIALS,
    );
  });

  expect(await setEmployeeActive(bia.id, true)).toEqual({ success: true });
  expect(await sessionsOf(bia.id)).toEqual([]);

  await inNewBrowser(async () => {
    expect((await login({ username: "bia", password: ADMIN_PASSWORD })).session).toMatchObject({
      username: "bia",
      role: "admin",
    });
  });
  expect(await sessionsOf(bia.id)).toHaveLength(1);
});

it("inativar pelo formulário também apaga as sessões", async () => {
  await hireAdmin({
    name: "Geral",
    preference: "coffee",
    username: "geral",
    role: "admin_geral",
  });
  const bia = await hireAdminElsewhere({ name: "Bia", preference: "milk", username: "bia" });

  expect(
    await updateEmployee(
      bia.id,
      {},
      employeeForm({ name: "Bia", preference: "milk", active: false }),
    ),
  ).toEqual({ success: true });

  expect(await sessionsOf(bia.id)).toEqual([]);
});

it("ação autenticada fora da matriz devolve Sem permissão e o banco não muda", async () => {
  await hireAdmin({ name: "Kaio", preference: "coffee", username: "kaio" });
  const maria = await hire({ name: "Maria", preference: "milk" });
  const geral = await hireAdminElsewhere({
    name: "Geral",
    username: "geral",
    role: "admin_geral",
  });
  const before = await pantrySnapshot();

  const foraDaMatriz = {
    "admin promove funcionário a admin geral": () => promoteToAdminGeral(maria.id),
    "admin rebaixa admin geral": () => demoteToFuncionario(geral.id),
    "admin rebaixa quem já é funcionário": () => demoteToFuncionario(maria.id),
    "admin troca a senha de outro": () =>
      resetEmployeePassword({ employeeId: geral.id, newPassword: "senha-nova-2024" }),
    "admin edita admin geral": () =>
      updateEmployee(geral.id, {}, employeeForm({ name: "Outro", preference: "both" })),
    "admin inativa admin geral": () => setEmployeeActive(geral.id, false),
    "promover quem não existe": () =>
      promoteToAdmin({ employeeId: randomUUID(), username: "novo", password: "senha-do-novo" }),
    "rebaixar quem não existe": () => demoteToFuncionario(randomUUID()),
  };

  for (const [nome, acao] of Object.entries(foraDaMatriz)) {
    expect({ nome, resultado: await acao() }).toEqual({
      nome,
      resultado: { error: NO_PERMISSION },
    });
  }

  expect(await pantrySnapshot()).toEqual(before);
});

it("admin geral também esbarra na matriz quando o alvo é funcionário", async () => {
  await hireAdmin({
    name: "Geral",
    preference: "coffee",
    username: "geral",
    role: "admin_geral",
  });
  const maria = await hire({ name: "Maria", preference: "milk" });
  const before = await pantrySnapshot();

  expect(await demoteToFuncionario(maria.id)).toEqual({ error: NO_PERMISSION });
  expect(await promoteToAdminGeral(maria.id)).toEqual({ error: NO_PERMISSION });
  expect(
    await resetEmployeePassword({ employeeId: maria.id, newPassword: "senha-nova-2024" }),
  ).toEqual({ error: NO_PERMISSION });

  expect(await pantrySnapshot()).toEqual(before);
});

it("editar e inativar quem não existe avisa que o funcionário sumiu", async () => {
  await hireAdmin({ name: "Kaio", preference: "coffee", username: "kaio" });
  const sumido = randomUUID();

  expect(
    await updateEmployee(sumido, {}, employeeForm({ name: "Fantasma", preference: "both" })),
  ).toEqual({ error: EMPLOYEE_NOT_FOUND });
  expect(await setEmployeeActive(sumido, false)).toEqual({ error: EMPLOYEE_NOT_FOUND });
});

it("sem sessão, promover, rebaixar e trocar a senha de outro são recusados", async () => {
  await hireAdmin({
    name: "Geral",
    preference: "coffee",
    username: "geral",
    role: "admin_geral",
  });
  const maria = await hire({ name: "Maria", preference: "milk" });
  const bia = await hireAdminElsewhere({ name: "Bia", preference: "milk", username: "bia" });
  newBrowser();
  const before = await pantrySnapshot();

  expect(
    await promoteToAdmin({
      employeeId: maria.id,
      username: "maria",
      password: "senha-da-maria",
    }),
  ).toEqual({ error: SIGN_IN_REQUIRED });
  expect(await promoteToAdminGeral(bia.id)).toEqual({ error: SIGN_IN_REQUIRED });
  expect(await demoteToFuncionario(bia.id)).toEqual({ error: SIGN_IN_REQUIRED });
  expect(
    await resetEmployeePassword({ employeeId: bia.id, newPassword: "senha-nova-2024" }),
  ).toEqual({ error: SIGN_IN_REQUIRED });

  expect(await pantrySnapshot()).toEqual(before);
});

it("promover e rebaixar não tiram da fila nem mudam a preferência", async () => {
  await hireAdmin({
    name: "Geral",
    preference: "milk",
    username: "geral",
    role: "admin_geral",
  });
  const maria = await hire({ name: "Maria", preference: "coffee" });
  const cafe = await stockItem({ name: "Café", kind: "coffee", stock: 10 });

  expect(await getNextPersonNameForItem(cafe.id, "coffee")).toBe("Maria");

  await promoteToAdmin({
    employeeId: maria.id,
    username: "maria",
    password: "senha-da-maria",
  });
  expect(await getNextPersonNameForItem(cafe.id, "coffee")).toBe("Maria");
  expect(await rowOf(maria.id)).toMatchObject({ preference: "coffee", active: true });

  await promoteToAdminGeral(maria.id);
  expect(await getNextPersonNameForItem(cafe.id, "coffee")).toBe("Maria");

  await demoteToFuncionario(maria.id);
  expect(await getNextPersonNameForItem(cafe.id, "coffee")).toBe("Maria");
  expect(await rowOf(maria.id)).toMatchObject({
    preference: "coffee",
    active: true,
    role: "funcionario",
  });
});
