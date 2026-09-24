export type CookieAttributes = {
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: boolean | "lax" | "strict" | "none";
  path?: string;
  domain?: string;
  expires?: Date;
  maxAge?: number;
};

export type StoredCookie = CookieAttributes & { name: string; value: string };

/** Pote de cookies em memória com a mesma superfície que `cookies()` do Next usa. */
export class CookieJar {
  private jar = new Map<string, StoredCookie>();

  get(name: string) {
    const stored = this.jar.get(name);
    return stored ? { name: stored.name, value: stored.value } : undefined;
  }

  getAll(name?: string) {
    const all = [...this.jar.values()].map((stored) => ({
      name: stored.name,
      value: stored.value,
    }));
    return name ? all.filter((cookie) => cookie.name === name) : all;
  }

  has(name: string) {
    return this.jar.has(name);
  }

  set(first: string | StoredCookie, value?: string, options?: CookieAttributes) {
    const cookie =
      typeof first === "string"
        ? { ...options, name: first, value: value ?? "" }
        : { ...first };
    this.jar.set(cookie.name, cookie);
    return this;
  }

  delete(first: string | { name: string }) {
    this.jar.delete(typeof first === "string" ? first : first.name);
    return this;
  }

  toString() {
    return this.getAll()
      .map((cookie) => `${cookie.name}=${cookie.value}`)
      .join("; ");
  }

  /** Atributos gravados, para o teste conferir httpOnly, Secure, SameSite e vencimento. */
  attributes(name: string): StoredCookie | undefined {
    const stored = this.jar.get(name);
    return stored ? { ...stored } : undefined;
  }

  clear() {
    this.jar.clear();
  }
}

let activeJar = new CookieJar();

export function cookieJar(): CookieJar {
  return activeJar;
}

/** Troca para um pote novo, como se fosse outro navegador. */
export function newBrowser(): CookieJar {
  activeJar = new CookieJar();
  return activeJar;
}

/** Roda algo no pote informado e volta para o anterior. */
export async function inBrowser<T>(jar: CookieJar, run: () => Promise<T>): Promise<T> {
  const previous = activeJar;
  activeJar = jar;
  try {
    return await run();
  } finally {
    activeJar = previous;
  }
}

export function resetCookies() {
  activeJar = new CookieJar();
}
