import { hash, verify, type Algorithm } from "@node-rs/argon2";

const ARGON2ID: Algorithm = 2;

export const MIN_PASSWORD_LENGTH = 8;

export const PASSWORD_ERROR = `Senha precisa de pelo menos ${MIN_PASSWORD_LENGTH} caracteres`;

function requirePepper(): Uint8Array {
  const pepper = process.env.AUTH_PEPPER;
  if (!pepper) {
    throw new Error(
      "AUTH_PEPPER não configurado. Sem o pepper não se grava nem se confere senha.",
    );
  }
  return new TextEncoder().encode(pepper);
}

export async function hashPassword(password: string): Promise<string> {
  return hash(password, {
    algorithm: ARGON2ID,
    secret: requirePepper(),
  });
}

export async function verifyPassword(
  passwordHash: string,
  password: string,
): Promise<boolean> {
  const secret = requirePepper();
  try {
    return await verify(passwordHash, password, {
      algorithm: ARGON2ID,
      secret,
    });
  } catch {
    return false;
  }
}
