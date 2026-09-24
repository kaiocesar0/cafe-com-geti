import { createHash, randomBytes } from "node:crypto";

export const SESSION_COOKIE_NAME = "cafe_sessao";

export const SESSION_TTL_MS = 14 * 24 * 60 * 60 * 1000;

export function createSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

/** O banco guarda só o hash: o cookie é a única cópia do token. */
export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function sessionCookie(token: string, expiresAt: Date) {
  return {
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: true,
    sameSite: "lax" as const,
    path: "/",
    expires: expiresAt,
  };
}
