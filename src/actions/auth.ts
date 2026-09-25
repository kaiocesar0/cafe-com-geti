"use server";

import { and, eq, ne } from "drizzle-orm";
import { cookies } from "next/headers";
import { getDb } from "@/db";
import { employees, sessions } from "@/db/schema";
import {
  INVALID_CREDENTIALS,
  SIGN_IN_REQUIRED,
  WRONG_CURRENT_PASSWORD,
} from "@/lib/auth-messages";
import { now } from "@/lib/clock";
import {
  getCurrentSession,
  logoutCurrentSession,
  openSession,
  type SessionInfo,
} from "@/lib/current-session";
import {
  isLoginLocked,
  loginLockCookie,
  loginLockCookieName,
  readLoginLock,
  registerLoginFailure,
} from "@/lib/login-lock";
import {
  hashPassword,
  MIN_PASSWORD_LENGTH,
  PASSWORD_ERROR,
  verifyPassword,
} from "@/lib/password";
import { hashSessionToken, SESSION_COOKIE_NAME } from "@/lib/session";
import { isValidUsername, normalizeUsername } from "@/lib/username";

export type { SessionInfo };

export type LoginResult = {
  error?: string;
  session?: SessionInfo;
};

function missingAuthPepper(): boolean {
  return !process.env.AUTH_PEPPER;
}

export async function login(input: {
  username: string;
  password: string;
}): Promise<LoginResult> {
  // Sem pepper o login falha de forma controlada (não 500 por throw no Argon2/HMAC).
  if (missingAuthPepper()) return { error: INVALID_CREDENTIALS };

  const username = normalizeUsername(input.username ?? "");
  if (!isValidUsername(username) || !input.password) return { error: INVALID_CREDENTIALS };

  const jar = await cookies();
  const moment = now();
  const lockCookieName = loginLockCookieName(username);
  const lock = readLoginLock(username, jar.get(lockCookieName)?.value, moment);

  if (isLoginLocked(lock, moment)) {
    jar.set(loginLockCookie(username, lock, moment));
    return { error: INVALID_CREDENTIALS };
  }

  let session: SessionInfo | null;
  try {
    session = await checkCredentials(username, input.password);
  } catch (error) {
    if (isPepperConfigError(error)) return { error: INVALID_CREDENTIALS };
    throw error;
  }

  if (!session) {
    jar.set(loginLockCookie(username, registerLoginFailure(lock, moment), moment));
    return { error: INVALID_CREDENTIALS };
  }

  jar.delete(lockCookieName);
  return { session };
}

function isPepperConfigError(error: unknown): boolean {
  return error instanceof Error && /AUTH_PEPPER/.test(error.message);
}

async function checkCredentials(
  username: string,
  password: string,
): Promise<SessionInfo | null> {
  const [account] = await getDb()
    .select({
      id: employees.id,
      name: employees.name,
      username: employees.username,
      role: employees.role,
      active: employees.active,
      passwordHash: employees.passwordHash,
    })
    .from(employees)
    .where(eq(employees.username, username));

  if (!account?.passwordHash) return null;
  if (!account.active) return null;
  if (account.role === "funcionario") return null;
  if (!(await verifyPassword(account.passwordHash, password))) return null;

  const expiresAt = await openSession(account.id);

  return {
    employeeId: account.id,
    name: account.name,
    username: account.username!,
    role: account.role,
    expiresAt,
  };
}

export async function logout(): Promise<void> {
  await logoutCurrentSession();
}

/** Valida o cookie deste navegador e empurra o vencimento para 14 dias à frente. */
export { getCurrentSession };

export type ChangePasswordResult = {
  error?: string;
};

/** Mantém a sessão deste navegador e derruba as outras da mesma pessoa. */
export async function changeOwnPassword(input: {
  currentPassword: string;
  newPassword: string;
}): Promise<ChangePasswordResult> {
  const session = await getCurrentSession();
  if (!session) return { error: SIGN_IN_REQUIRED };

  const newPassword = input.newPassword ?? "";
  if (newPassword.length < MIN_PASSWORD_LENGTH) return { error: PASSWORD_ERROR };

  const db = getDb();
  const [account] = await db
    .select({ passwordHash: employees.passwordHash })
    .from(employees)
    .where(eq(employees.id, session.employeeId));

  if (!account?.passwordHash || !input.currentPassword) {
    return { error: WRONG_CURRENT_PASSWORD };
  }
  if (!(await verifyPassword(account.passwordHash, input.currentPassword))) {
    return { error: WRONG_CURRENT_PASSWORD };
  }

  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE_NAME)!.value;
  const passwordHash = await hashPassword(newPassword);

  await db.batch([
    db.update(employees).set({ passwordHash }).where(eq(employees.id, session.employeeId)),
    db
      .delete(sessions)
      .where(
        and(
          eq(sessions.employeeId, session.employeeId),
          ne(sessions.tokenHash, hashSessionToken(token)),
        ),
      ),
  ]);

  jar.delete(loginLockCookieName(session.username));
  return {};
}
