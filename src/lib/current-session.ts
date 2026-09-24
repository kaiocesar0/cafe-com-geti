import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { getDb } from "@/db";
import { employees, sessions, type EmployeeRole } from "@/db/schema";
import { now } from "@/lib/clock";
import {
  createSessionToken,
  hashSessionToken,
  SESSION_COOKIE_NAME,
  SESSION_TTL_MS,
  sessionCookie,
} from "@/lib/session";

export type SessionInfo = {
  employeeId: string;
  name: string;
  username: string;
  role: EmployeeRole;
  expiresAt: Date;
};

type CookieJar = Awaited<ReturnType<typeof cookies>>;

type FoundSession = {
  sessionId: string;
  expiresAt: Date;
  employeeId: string;
  name: string;
  username: string | null;
  role: EmployeeRole;
  active: boolean;
};

function toSessionInfo(found: FoundSession, expiresAt: Date): SessionInfo {
  return {
    employeeId: found.employeeId,
    name: found.name,
    username: found.username!,
    role: found.role,
    expiresAt,
  };
}

async function lookupSession(token: string): Promise<FoundSession | undefined> {
  const [found] = await getDb()
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

  return found;
}

function isDead(found: FoundSession, moment: Date): boolean {
  return (
    found.expiresAt.getTime() <= moment.getTime() ||
    !found.active ||
    found.role === "funcionario"
  );
}

/** Grava o cookie; devolve false quando a resposta não permite (render de RSC). */
function trySetSessionCookie(jar: CookieJar, token: string, expiresAt: Date): boolean {
  try {
    jar.set(sessionCookie(token, expiresAt));
    return true;
  } catch {
    return false;
  }
}

/**
 * Valida o token e, quando o cookie pode ser gravado, empurra o vencimento no banco e
 * no cookie juntos. Em RSC o `cookies().set` falha: o banco não avança sozinho — o
 * `proxy` renova os dois antes do render nas navegações.
 */
export async function getCurrentSession(): Promise<SessionInfo | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const found = await lookupSession(token);
  if (!found) {
    try {
      jar.delete(SESSION_COOKIE_NAME);
    } catch {
      // delete também exige Server Function / Route Handler / Proxy
    }
    return null;
  }

  const moment = now();
  const db = getDb();

  if (isDead(found, moment)) {
    await db.delete(sessions).where(eq(sessions.id, found.sessionId));
    try {
      jar.delete(SESSION_COOKIE_NAME);
    } catch {
      // idem
    }
    return null;
  }

  const expiresAt = new Date(moment.getTime() + SESSION_TTL_MS);
  if (!trySetSessionCookie(jar, token, expiresAt)) {
    // Cookie e banco ficam no vencimento já gravado; o proxy cobre a navegação.
    return toSessionInfo(found, found.expiresAt);
  }

  await db.update(sessions).set({ expiresAt }).where(eq(sessions.id, found.sessionId));
  return toSessionInfo(found, expiresAt);
}

/**
 * Renova sessão a partir do token cru (Proxy): atualiza o banco e devolve o cookie a
 * gravar na resposta, onde `Set-Cookie` é permitido.
 */
export async function slideSessionForProxy(
  token: string,
): Promise<
  | { ok: true; cookie: ReturnType<typeof sessionCookie> }
  | { ok: false; clear: true }
  | { ok: false; clear: false }
> {
  const found = await lookupSession(token);
  if (!found) return { ok: false, clear: true };

  const moment = now();
  const db = getDb();

  if (isDead(found, moment)) {
    await db.delete(sessions).where(eq(sessions.id, found.sessionId));
    return { ok: false, clear: true };
  }

  const expiresAt = new Date(moment.getTime() + SESSION_TTL_MS);
  await db.update(sessions).set({ expiresAt }).where(eq(sessions.id, found.sessionId));
  return { ok: true, cookie: sessionCookie(token, expiresAt) };
}

/** Abre sessão no banco e grava o cookie (login / Server Action). */
export async function openSession(employeeId: string): Promise<Date> {
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

export async function logoutCurrentSession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE_NAME)?.value;
  jar.delete(SESSION_COOKIE_NAME);
  if (!token) return;

  await getDb().delete(sessions).where(eq(sessions.tokenHash, hashSessionToken(token)));
}
