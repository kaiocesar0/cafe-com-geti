"use server";

import { and, eq, ne } from "drizzle-orm";
import { cookies } from "next/headers";
import { getDb } from "@/db";
import { employees, sessions, type EmployeeRole } from "@/db/schema";
import {
  INVALID_CREDENTIALS,
  SIGN_IN_REQUIRED,
  WRONG_CURRENT_PASSWORD,
} from "@/lib/auth-messages";
import { now } from "@/lib/clock";
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
import {
  createSessionToken,
  hashSessionToken,
  SESSION_COOKIE_NAME,
  SESSION_TTL_MS,
  sessionCookie,
} from "@/lib/session";
import { isValidUsername, normalizeUsername } from "@/lib/username";

export type SessionInfo = {
  employeeId: string;
  name: string;
  username: string;
  role: EmployeeRole;
  expiresAt: Date;
};

export type LoginResult = {
  error?: string;
  session?: SessionInfo;
};

export async function login(input: {
  username: string;
  password: string;
}): Promise<LoginResult> {
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

  const session = await checkCredentials(username, input.password);
  if (!session) {
    jar.set(loginLockCookie(username, registerLoginFailure(lock, moment), moment));
    return { error: INVALID_CREDENTIALS };
  }

  jar.delete(lockCookieName);
  return { session };
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
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE_NAME)?.value;
  jar.delete(SESSION_COOKIE_NAME);
  if (!token) return;

  await getDb().delete(sessions).where(eq(sessions.tokenHash, hashSessionToken(token)));
}

/** Valida o cookie deste navegador e empurra o vencimento para 14 dias à frente. */
export async function getCurrentSession(): Promise<SessionInfo | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const db = getDb();
  const [found] = await db
    .select({
      sessionId: sessions.id,
      expiresAt: sessions.expiresAt,
      employeeId: employees.id,
      name: employees.name,
      username: employees.username,
      role: employees.role,
      active: employees.active,
    })
    .from(sessions)
    .innerJoin(employees, eq(employees.id, sessions.employeeId))
    .where(eq(sessions.tokenHash, hashSessionToken(token)));

  if (!found) {
    jar.delete(SESSION_COOKIE_NAME);
    return null;
  }

  const moment = now();
  const dead =
    found.expiresAt.getTime() <= moment.getTime() ||
    !found.active ||
    found.role === "funcionario";

  if (dead) {
    await db.delete(sessions).where(eq(sessions.id, found.sessionId));
    jar.delete(SESSION_COOKIE_NAME);
    return null;
  }

  const expiresAt = new Date(moment.getTime() + SESSION_TTL_MS);
  await db.update(sessions).set({ expiresAt }).where(eq(sessions.id, found.sessionId));
  refreshCookie(jar, token, expiresAt);

  return {
    employeeId: found.employeeId,
    name: found.name,
    username: found.username!,
    role: found.role,
    expiresAt,
  };
}

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

async function openSession(employeeId: string): Promise<Date> {
  const db = getDb();
  const jar = await cookies();

  const previous = jar.get(SESSION_COOKIE_NAME)?.value;
  if (previous) {
    await db.delete(sessions).where(eq(sessions.tokenHash, hashSessionToken(previous)));
  }

  const token = createSessionToken();
  const moment = now();
  const expiresAt = new Date(moment.getTime() + SESSION_TTL_MS);

  await db.insert(sessions).values({
    employeeId,
    tokenHash: hashSessionToken(token),
    createdAt: moment,
    expiresAt,
  });

  jar.set(sessionCookie(token, expiresAt));
  return expiresAt;
}

// A linha no banco já manda no vencimento; o cookie só acompanha quando a resposta
// permite gravar cookie, o que não acontece durante render de Server Component.
function refreshCookie(
  jar: Awaited<ReturnType<typeof cookies>>,
  token: string,
  expiresAt: Date,
) {
  try {
    jar.set(sessionCookie(token, expiresAt));
  } catch {
    // leitura em render: o cookie do navegador continua com o vencimento anterior
  }
}
