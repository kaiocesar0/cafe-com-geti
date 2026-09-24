import { createInterface } from "node:readline";
import { Writable } from "node:stream";
import { config } from "dotenv";
import { createFirstAdminGeral } from "@/actions/accounts";
import { preferenceEnum, type Preference } from "@/db/schema";

config({ path: ".env.local" });
config();

let hideInput = false;

const output = new Writable({
  write(chunk, _encoding, callback) {
    if (!hideInput) process.stdout.write(chunk as Buffer);
    callback();
  },
});

const rl = createInterface({
  input: process.stdin,
  output,
  terminal: Boolean(process.stdin.isTTY),
});
const lines = rl[Symbol.asyncIterator]();

async function ask(query: string, secret = false): Promise<string> {
  process.stdout.write(query);
  hideInput = secret;
  const { value, done } = await lines.next();
  hideInput = false;
  if (secret) process.stdout.write("\n");
  if (done || value === undefined) {
    throw new Error("Entrada encerrada antes de completar os dados.");
  }
  return secret ? value.replace(/\r$/, "") : value.trim();
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL ausente. Rode `npx neon deploy` antes.");
  }
  if (!process.env.AUTH_PEPPER) {
    throw new Error("AUTH_PEPPER ausente no .env.local. Sem o pepper não se grava senha.");
  }

  const name = await ask("Nome: ");
  const preference = await ask(`Preferência (${preferenceEnum.enumValues.join(" | ")}): `);
  const username = await ask("Username: ");
  const password = await ask("Senha: ", true);

  if (!preferenceEnum.enumValues.includes(preference as Preference)) {
    throw new Error(`Preferência inválida: ${preference}`);
  }

  const result = await createFirstAdminGeral({
    name,
    preference: preference as Preference,
    username,
    password,
  });

  if (result.error) throw new Error(result.error);
  console.log(`Admin geral criado: ${name}`);
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => rl.close());
