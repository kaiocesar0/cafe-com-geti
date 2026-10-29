import { config } from "dotenv";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Alerta manual no Google Chat a partir do banco + webhook da env escolhida.
 *
 * Ex.:
 *   npm run chat:notify -- --env prod --item Leite
 *   npm run chat:notify -- --env prod --item Leite --dry-run
 *   npm run chat:notify -- --env hml --item Café --limit 2
 *
 * Arquivo: `.env.prod`, `.env.hml`, `.env.local` (default se omitir --env).
 * Precisa de DATABASE_URL e GOOGLE_CHAT_WEBHOOK_URL nesse arquivo.
 */

function usage(): never {
  console.error(`Uso:
  npm run chat:notify -- --env prod --item Leite
  npm run chat:notify -- --env prod --item Leite --dry-run
  npm run chat:notify -- --env hml --item Café --limit 2

--env     carrega .env.<nome> (default: local → .env.local)
--item    nome do item no banco (obrigatório)
--limit   quantos próximos listar (default: 2)
--dry-run só monta a mensagem, não envia`);
  process.exit(1);
}

function arg(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  if (i === -1) return undefined;
  return process.argv[i + 1];
}

function has(flag: string): boolean {
  return process.argv.includes(flag);
}

function envFileFor(name: string): string {
  return name === "local" ? ".env.local" : `.env.${name}`;
}

async function main() {
  if (has("--help") || has("-h")) usage();

  const envName = arg("--env") ?? "local";
  const envFile = envFileFor(envName);
  const envPath = resolve(process.cwd(), envFile);

  if (!existsSync(envPath)) {
    throw new Error(
      `Arquivo ${envFile} não encontrado. Crie com DATABASE_URL e GOOGLE_CHAT_WEBHOOK_URL.`,
    );
  }

  config({ path: envPath, override: true });

  const itemName = arg("--item");
  if (!itemName) usage();

  const limitRaw = arg("--limit");
  const limit = limitRaw === undefined ? 2 : Number(limitRaw);
  if (!Number.isInteger(limit) || limit < 1) {
    throw new Error(`--limit inválido: ${limitRaw}`);
  }

  if (!process.env.DATABASE_URL) {
    throw new Error(`DATABASE_URL ausente em ${envFile}`);
  }

  // Importa depois do dotenv para o getDb() ver a URL certa
  const { sql } = await import("drizzle-orm");
  const { getDb } = await import("@/db");
  const { items } = await import("@/db/schema");
  const { getNextPersonNamesForItem } = await import("@/lib/stock-service");
  const { buildLowStockMessage } = await import("@/lib/notify");

  const db = getDb();
  const matches = await db
    .select()
    .from(items)
    .where(sql`lower(${items.name}) = lower(${itemName})`);

  if (matches.length === 0) {
    throw new Error(`Item não encontrado em ${envName}: "${itemName}"`);
  }
  if (matches.length > 1) {
    throw new Error(
      `Vários itens com nome "${itemName}": ${matches.map((i) => i.id).join(", ")}`,
    );
  }

  const item = matches[0]!;
  const nextPeople = await getNextPersonNamesForItem(item.id, item.kind, limit);
  const message = buildLowStockMessage(item.name, item.stock, nextPeople);

  console.log(`[${envName}] ${envFile}`);
  console.log(`Item: ${item.name} | estoque: ${item.stock} | kind: ${item.kind}`);
  console.log("---");
  console.log(message);
  console.log("---");

  if (has("--dry-run")) {
    console.log("(--dry-run) nada enviado.");
    return;
  }

  const url = process.env.GOOGLE_CHAT_WEBHOOK_URL;
  if (!url) {
    throw new Error(`GOOGLE_CHAT_WEBHOOK_URL ausente em ${envFile}`);
  }

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: message }),
  });

  if (!response.ok) {
    throw new Error(
      `Webhook falhou: HTTP ${response.status}\n${await response.text()}`,
    );
  }

  console.log("OK — enviado ao Google Chat.");
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
