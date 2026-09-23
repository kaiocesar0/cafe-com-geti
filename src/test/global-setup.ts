import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { migrate } from "drizzle-orm/neon-http/migrator";
import { loadTestDatabaseUrl } from "./resolve-test-database-url";

export default async function setup() {
  const databaseUrl = loadTestDatabaseUrl();
  const sql = neon(databaseUrl);

  await sql`drop schema if exists public cascade`;
  await sql`drop schema if exists drizzle cascade`;
  await sql`create schema public`;

  await migrate(drizzle(sql), { migrationsFolder: "./drizzle" });
}
