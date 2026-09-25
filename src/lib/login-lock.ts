import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export const LOGIN_MAX_FAILURES = 5;

export const LOGIN_LOCK_MS = 15 * 60 * 1000;

// Teto que os navegadores aceitam para vencimento de cookie.
const COUNTING_COOKIE_TTL_MS = 400 * 24 * 60 * 60 * 1000;

const COOKIE_PREFIX = "cafe_trava_";

export type LoginLockState = {
  failures: number;
  lockedUntil: number;
};

type Payload = { u: string; f: number; l: number };

const EMPTY: LoginLockState = { failures: 0, lockedUntil: 0 };

function signingKey(): Buffer {
  const pepper = process.env.AUTH_PEPPER;
  if (!pepper) {
    throw new Error("AUTH_PEPPER não configurado. Sem o pepper a trava de login não assina.");
  }
  return createHash("sha256").update(`cafe-trava-login:${pepper}`).digest();
}

function sign(payload: string): string {
  return createHmac("sha256", signingKey()).update(payload).digest("base64url");
}

/** Nome por username, sem expor o username no navegador. */
export function loginLockCookieName(username: string): string {
  const digest = createHash("sha256").update(username).digest("hex").slice(0, 16);
  return `${COOKIE_PREFIX}${digest}`;
}

/**
 * Sem cookie, o contador começa do zero. Cookie que não confere com a assinatura ou com o
 * username é tratado como travado a partir de agora: adulterar nunca vale mais que apagar.
 */
export function readLoginLock(
  username: string,
  value: string | undefined,
  moment: Date,
): LoginLockState {
  if (value === undefined) return EMPTY;

  const state = verify(username, value) ?? {
    failures: LOGIN_MAX_FAILURES,
    lockedUntil: moment.getTime() + LOGIN_LOCK_MS,
  };

  if (state.lockedUntil && state.lockedUntil <= moment.getTime()) return EMPTY;
  return state;
}

export function isLoginLocked(state: LoginLockState, moment: Date): boolean {
  return state.lockedUntil > moment.getTime();
}

export function registerLoginFailure(state: LoginLockState, moment: Date): LoginLockState {
  if (isLoginLocked(state, moment)) return state;
  const failures = state.failures + 1;
  return {
    failures,
    lockedUntil: failures >= LOGIN_MAX_FAILURES ? moment.getTime() + LOGIN_LOCK_MS : 0,
  };
}

export function loginLockCookie(username: string, state: LoginLockState, moment: Date) {
  const payload = Buffer.from(
    JSON.stringify({ u: username, f: state.failures, l: state.lockedUntil } satisfies Payload),
  ).toString("base64url");

  return {
    name: loginLockCookieName(username),
    value: `${payload}.${sign(payload)}`,
    httpOnly: true,
    secure: true,
    sameSite: "lax" as const,
    path: "/",
    expires: new Date(state.lockedUntil || moment.getTime() + COUNTING_COOKIE_TTL_MS),
  };
}

function verify(username: string, value: string): LoginLockState | null {
  const [payload, signature, extra] = value.split(".");
  if (!payload || !signature || extra !== undefined) return null;

  const expected = Buffer.from(sign(payload));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;

  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString()) as Payload;
    if (parsed.u !== username) return null;
    if (!Number.isInteger(parsed.f) || parsed.f < 0) return null;
    if (!Number.isFinite(parsed.l) || parsed.l < 0) return null;
    return { failures: parsed.f, lockedUntil: parsed.l };
  } catch {
    return null;
  }
}
