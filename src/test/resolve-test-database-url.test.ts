import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  loadTestDatabaseUrl,
  resolveTestDatabaseUrl,
} from "./resolve-test-database-url";

const testUrl = "postgres://test-branch/cafe";
const appUrl = "postgres://hml/cafe";

describe("resolveTestDatabaseUrl", () => {
  it("falha antes de migrar quando .env.test não existe", () => {
    expect(() =>
      resolveTestDatabaseUrl({ testEnv: null, appEnvFiles: [null, null] }),
    ).toThrow(/\.env\.test/);
  });

  it("falha quando .env.test não declara DATABASE_URL", () => {
    expect(() =>
      resolveTestDatabaseUrl({
        testEnv: "OTHER=1\n",
        appEnvFiles: [null, null],
      }),
    ).toThrow(/DATABASE_URL/);
  });

  it("falha quando a URL de teste é a mesma do app", () => {
    expect(() =>
      resolveTestDatabaseUrl({
        testEnv: `DATABASE_URL=${appUrl}\n`,
        appEnvFiles: [null, `DATABASE_URL=${appUrl}\n`],
      }),
    ).toThrow(/igual/);
  });

  it("devolve a URL de .env.test quando ela difere da do app", () => {
    expect(
      resolveTestDatabaseUrl({
        testEnv: `DATABASE_URL=${testUrl}\n`,
        appEnvFiles: [
          `DATABASE_URL=${appUrl}\n`,
          `DATABASE_URL=${appUrl}\n`,
        ],
      }),
    ).toBe(testUrl);
  });
});

describe("loadTestDatabaseUrl", () => {
  it("lê DATABASE_URL só de .env.test", () => {
    const dir = mkdtempSync(path.join(tmpdir(), "cafe-test-"));
    writeFileSync(path.join(dir, ".env.local"), `DATABASE_URL=${appUrl}\n`);
    writeFileSync(path.join(dir, ".env"), `DATABASE_URL=${appUrl}\n`);
    writeFileSync(path.join(dir, ".env.test"), `DATABASE_URL=${testUrl}\n`);

    expect(loadTestDatabaseUrl(dir)).toBe(testUrl);
  });

  it("falha quando .env.test não está no diretório, mesmo com a URL do app ao lado", () => {
    const dir = mkdtempSync(path.join(tmpdir(), "cafe-test-"));
    writeFileSync(path.join(dir, ".env.local"), `DATABASE_URL=${appUrl}\n`);

    expect(() => loadTestDatabaseUrl(dir)).toThrow(/\.env\.test/);
  });
});
