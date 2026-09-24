"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { employees, type Preference } from "@/db/schema";
import { NO_PERMISSION, SIGN_IN_REQUIRED } from "@/lib/auth-messages";
import { currentWriter, findEmployee, isLastActiveAdminGeral } from "@/lib/authorization";
import {
  canDemoteToFuncionario,
  canPromoteToAdmin,
  canPromoteToAdminGeral,
  canResetPassword,
} from "@/lib/role-matrix";
import { hashPassword, MIN_PASSWORD_LENGTH, PASSWORD_ERROR } from "@/lib/password";
import { deleteAllSessionsOf } from "@/lib/session-service";
import { parseUsername } from "@/lib/username";

export type CreateAccountResult = {
  error?: string;
  employeeId?: string;
};

export type AccountActionState = {
  error?: string;
  success?: boolean;
};

const USERNAME_TAKEN = "Username já está em uso";

export async function createFirstAdminGeral(input: {
  name: string;
  preference: Preference;
  username: string;
  password: string;
}): Promise<CreateAccountResult> {
  const name = input.name.trim();
  if (!name) return { error: "Nome é obrigatório" };

  const { username, error } = parseUsername(input.username);
  if (!username) return { error };

  if (input.password.length < MIN_PASSWORD_LENGTH) return { error: PASSWORD_ERROR };

  const db = getDb();
  const [taken] = await db
    .select({ id: employees.id })
    .from(employees)
    .where(eq(employees.username, username));
  if (taken) return { error: USERNAME_TAKEN };

  const passwordHash = await hashPassword(input.password);

  try {
    const [created] = await db
      .insert(employees)
      .values({
        name,
        preference: input.preference,
        active: true,
        role: "admin_geral",
        username,
        passwordHash,
      })
      .returning({ id: employees.id });
    return { employeeId: created.id };
  } catch (cause) {
    if (isUniqueViolation(cause)) return { error: USERNAME_TAKEN };
    throw cause;
  }
}

/** Funcionário ativo vira admin com username e senha inicial. Nunca vira admin geral aqui. */
export async function promoteToAdmin(input: {
  employeeId: string;
  username: string;
  password: string;
}): Promise<AccountActionState> {
  const actor = await currentWriter();
  if (!actor) return { error: SIGN_IN_REQUIRED };

  const target = await findEmployee(input.employeeId);
  if (!target || !canPromoteToAdmin(target)) return { error: NO_PERMISSION };

  const { username, error } = parseUsername(input.username);
  if (!username) return { error };
  if (input.password.length < MIN_PASSWORD_LENGTH) return { error: PASSWORD_ERROR };

  const passwordHash = await hashPassword(input.password);

  try {
    await getDb()
      .update(employees)
      .set({ role: "admin", username, passwordHash })
      .where(eq(employees.id, target.id));
  } catch (cause) {
    if (isUniqueViolation(cause)) return { error: USERNAME_TAKEN };
    throw cause;
  }

  revalidateAccounts();
  return { success: true };
}

/** Amplia o acesso de quem já entra: username e senha ficam como estão. */
export async function promoteToAdminGeral(employeeId: string): Promise<AccountActionState> {
  const actor = await currentWriter();
  if (!actor) return { error: SIGN_IN_REQUIRED };

  const target = await findEmployee(employeeId);
  if (!target || !canPromoteToAdminGeral(actor, target)) return { error: NO_PERMISSION };

  await getDb()
    .update(employees)
    .set({ role: "admin_geral" })
    .where(eq(employees.id, target.id));

  revalidateAccounts();
  return { success: true };
}

/** Tira o acesso: some username, hash e sessões. A pessoa segue na fila. */
export async function demoteToFuncionario(employeeId: string): Promise<AccountActionState> {
  const actor = await currentWriter();
  if (!actor) return { error: SIGN_IN_REQUIRED };

  const target = await findEmployee(employeeId);
  if (!target || !canDemoteToFuncionario(actor, target)) return { error: NO_PERMISSION };
  if (await isLastActiveAdminGeral(target)) return { error: NO_PERMISSION };

  const db = getDb();
  await db.batch([
    db
      .update(employees)
      .set({ role: "funcionario", username: null, passwordHash: null })
      .where(eq(employees.id, target.id)),
    deleteAllSessionsOf(db, target.id),
  ]);

  revalidateAccounts();
  return { success: true };
}

/** Admin geral grava a senha de outro sem saber a atual e derruba tudo que ela tem aberto. */
export async function resetEmployeePassword(input: {
  employeeId: string;
  newPassword: string;
}): Promise<AccountActionState> {
  const actor = await currentWriter();
  if (!actor) return { error: SIGN_IN_REQUIRED };

  const target = await findEmployee(input.employeeId);
  if (!target || !canResetPassword(actor, target)) return { error: NO_PERMISSION };
  if (input.newPassword.length < MIN_PASSWORD_LENGTH) return { error: PASSWORD_ERROR };

  const passwordHash = await hashPassword(input.newPassword);
  const db = getDb();
  await db.batch([
    db.update(employees).set({ passwordHash }).where(eq(employees.id, target.id)),
    deleteAllSessionsOf(db, target.id),
  ]);

  return { success: true };
}

function revalidateAccounts() {
  revalidatePath("/funcionarios");
  revalidatePath("/");
}

const UNIQUE_VIOLATION = "23505";

/** O driver embrulha o erro do Postgres, então o código de chave repetida vem aninhado. */
function isUniqueViolation(cause: unknown): boolean {
  for (let error = cause; error instanceof Error; error = error.cause) {
    if ((error as { code?: string }).code === UNIQUE_VIOLATION) return true;
  }
  return false;
}
