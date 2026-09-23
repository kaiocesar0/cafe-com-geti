import { getDb } from "@/db";
import { contributions, employees, items } from "@/db/schema";

export async function emptyPantry() {
  const db = getDb();
  await db.delete(contributions);
  await db.delete(items);
  await db.delete(employees);
}
