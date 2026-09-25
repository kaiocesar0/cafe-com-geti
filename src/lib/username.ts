const USERNAME_FORMAT = /^[a-z][a-z0-9-]{2,31}$/;

export const USERNAME_ERROR =
  "Username precisa de 3 a 32 caracteres, começar com letra e usar só letras minúsculas, números e hífen";

export function normalizeUsername(raw: string): string {
  return raw.trim().toLowerCase();
}

export function isValidUsername(value: string): boolean {
  return USERNAME_FORMAT.test(value);
}

export function parseUsername(raw: string): { username?: string; error?: string } {
  const username = normalizeUsername(raw);
  if (!isValidUsername(username)) return { error: USERNAME_ERROR };
  return { username };
}
