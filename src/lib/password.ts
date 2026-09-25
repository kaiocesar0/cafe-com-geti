import { hash, verify, type Algorithm, type Options } from "@node-rs/argon2";

const ARGON2ID: Algorithm = 2;

export const MIN_PASSWORD_LENGTH = 8;

export const PASSWORD_ERROR = `Senha precisa de pelo menos ${MIN_PASSWORD_LENGTH} caracteres`;

/**
 * Em produção: defaults do @node-rs/argon2 (~19 MiB, 2 passes) — caros de propósito.
 * No Vitest (`VITEST` é setado pelo runner): custo mínimo para a suíte não gastar
 * minutos em hash; o algoritmo, o pepper e o salt por hash continuam iguais.
 */
const SUITE_HASH_COST = {
  memoryCost: 8,
  timeCost: 1,
  parallelism: 1,
} as const;

function requirePepper(): Uint8Array {
  const pepper = process.env.AUTH_PEPPER;
  if (!pepper) {
    throw new Error(
      "AUTH_PEPPER não configurado. Sem o pepper não se grava nem se confere senha.",
    );
  }
  return new TextEncoder().encode(pepper);
}

function hashOptions(): Options {
  const secret = requirePepper();
  if (process.env.VITEST) {
    return { algorithm: ARGON2ID, secret, ...SUITE_HASH_COST };
  }
  return { algorithm: ARGON2ID, secret };
}

export async function hashPassword(password: string): Promise<string> {
  return hash(password, hashOptions());
}

export async function verifyPassword(
  passwordHash: string,
  password: string,
): Promise<boolean> {
  const secret = requirePepper();
  try {
    // Parâmetros de custo vêm do próprio hash; só o pepper precisa ir na verify.
    return await verify(passwordHash, password, {
      algorithm: ARGON2ID,
      secret,
    });
  } catch {
    return false;
  }
}
