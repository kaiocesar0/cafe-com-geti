"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { items } from "@/db/schema";
import { maybeNotifyStockCrossed } from "@/lib/stock-service";
import { z } from "zod";

const itemSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  unitLabel: z.string().min(1, "Unidade é obrigatória"),
  kind: z.enum(["coffee", "milk", "filter"]),
  stock: z.coerce.number().int().min(0, "Estoque não pode ser negativo"),
});

export type ItemActionState = {
  error?: string;
  success?: boolean;
};

export async function createItem(
  _prev: ItemActionState,
  formData: FormData,
): Promise<ItemActionState> {
  const parsed = itemSchema.safeParse({
    name: formData.get("name"),
    unitLabel: formData.get("unitLabel"),
    kind: formData.get("kind"),
    stock: formData.get("stock"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const db = getDb();
  await db.insert(items).values(parsed.data);
  revalidatePath("/itens");
  revalidatePath("/");
  return { success: true };
}

export async function updateItem(
  id: string,
  _prev: ItemActionState,
  formData: FormData,
): Promise<ItemActionState> {
  const parsed = itemSchema.safeParse({
    name: formData.get("name"),
    unitLabel: formData.get("unitLabel"),
    kind: formData.get("kind"),
    stock: formData.get("stock"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const db = getDb();
  const [current] = await db.select().from(items).where(eq(items.id, id));
  if (!current) return { error: "Item não encontrado" };

  const previousStock = current.stock;
  await db
    .update(items)
    .set({
      name: parsed.data.name,
      unitLabel: parsed.data.unitLabel,
      kind: parsed.data.kind,
      stock: parsed.data.stock,
    })
    .where(eq(items.id, id));

  await maybeNotifyStockCrossed(id, previousStock, parsed.data.stock);

  revalidatePath("/itens");
  revalidatePath("/");
  return { success: true };
}

export async function listItems() {
  const db = getDb();
  return db.select().from(items).orderBy(items.name);
}

export async function adjustItemStock(
  id: string,
  delta: number,
): Promise<ItemActionState> {
  const db = getDb();
  const [current] = await db.select().from(items).where(eq(items.id, id));
  if (!current) return { error: "Item não encontrado" };

  const newStock = current.stock + delta;
  if (newStock < 0) {
    return { error: "Estoque não pode ficar negativo" };
  }

  const previousStock = current.stock;
  await db.update(items).set({ stock: newStock }).where(eq(items.id, id));
  await maybeNotifyStockCrossed(id, previousStock, newStock);

  revalidatePath("/");
  revalidatePath("/itens");
  return { success: true };
}
