import { config } from "dotenv";
import { readFileSync, existsSync } from "node:fs";
import { createFirstAdminGeral } from "@/actions/accounts";
import { emptyPantry } from "@/test/empty-pantry";

config({ path: ".env.local" });
config();

/** Conta seed após o wipe. Senha ≥ 8 (regra do app); "1234" é rejeitado. */
const SEED = {
  name: "Kaio Cabral",
  username: "kaiocabral",
  preference: "coffee" as const,
  password: "12345678",
};

function linkedNeonBranch(): string | undefined {
  if (process.env.NEON_BRANCH?.trim()) return process.env.NEON_BRANCH.trim();
  const neonFile = ".neon";
  if (!existsSync(neonFile)) return undefined;
  try {
    const parsed = JSON.parse(readFileSync(neonFile, "utf8")) as { branch?: string };
    return parsed.branch;
  } catch {
    return undefined;
  }
}

function assertSafeTarget() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL ausente. Rode `npx neon checkout hml` / `npx neon deploy`.");
  }
  if (!process.env.AUTH_PEPPER) {
    throw new Error("AUTH_PEPPER ausente no .env.local. Sem o pepper não se grava senha.");
  }

  const branch = linkedNeonBranch();
  if (branch === "production") {
    throw new Error(
      "Recusa: branch production. Este comando só zera hml/dev (ajuste DATABASE_URL / NEON_BRANCH).",
    );
  }
}

async function main() {
  assertSafeTarget();

  const branch = linkedNeonBranch() ?? "(desconhecida)";
  console.log(`Zerando banco (branch: ${branch})…`);
  await emptyPantry();

  const result = await createFirstAdminGeral(SEED);
  if (result.error) throw new Error(result.error);

  console.log(
    `Pronto. Admin geral: ${SEED.name} / ${SEED.username} (preferência ${SEED.preference})`,
  );
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
