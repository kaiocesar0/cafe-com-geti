"use server";

import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { getDb } from "@/db";
import { employees, sessions, type EmployeeRole } from "@/db/schema";
import { INVALID_CREDENTIALS } from "@/lib/auth-messages";
import { now } from "@/lib/clock";
import { verifyPassword } from "@/lib/password";
import {
  createSessionToken,
  hashSessionToken,
  SESSION_COOKIE_NAME,
  SESSION_TTL_MS,
  sessionCookie,
} from "@/lib/session";
import { normalizeUsername } from "@/lib/username";

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
  if (!username || !input.password) return { error: INVALID_CREDENTIALS };

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

  if (!account?.passwordHash) return { error: INVALID_CREDENTIALS };
  if (!account.active) return { error: INVALID_CREDENTIALS };
  if (account.role === "funcionario") return { error: INVALID_CREDENTIALS };
  if (!(await verifyPassword(account.passwordHash, input.password))) {
    return { error: INVALID_CREDENTIALS };
  }

  const expiresAt = await openSession(account.id);

  return {
    session: {
      employeeId: account.id,
      name: account.name,
      username: account.username!,
      role: account.role,
      expiresAt,
    },
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
