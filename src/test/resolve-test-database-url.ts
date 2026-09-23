import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { parse } from "dotenv";

export function resolveTestDatabaseUrl(sources: {
  testEnv: string | null;
  appEnvFiles: Array<string | null>;
}): string {
  if (sources.testEnv === null) {
    throw new Error(
      "DATABASE_URL ausente em .env.test. A suíte não migra nem apaga linhas.",
    );
  }

  const testUrl = parse(sources.testEnv).DATABASE_URL?.trim();
  if (!testUrl) {
    throw new Error(
      "DATABASE_URL ausente em .env.test. A suíte não migra nem apaga linhas.",
    );
  }

  for (const contents of sources.appEnvFiles) {
    if (!contents) continue;
    const appUrl = parse(contents).DATABASE_URL?.trim();
    if (appUrl && appUrl === testUrl) {
      throw new Error(
        "DATABASE_URL de .env.test é igual à do app. A suíte não migra nem apaga linhas.",
      );
    }
  }

  return testUrl;
}

export function loadTestDatabaseUrl(cwd = process.cwd()): string {
  const read = (name: string) => {
    const file = path.join(cwd, name);
    if (!existsSync(file)) return null;
    return readFileSync(file, "utf8");
  };

  return resolveTestDatabaseUrl({
    testEnv: read(".env.test"),
    appEnvFiles: [read(".env"), read(".env.local")],
  });
}
