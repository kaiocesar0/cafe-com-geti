"use server";

import { and, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { contributions, employees, items } from "@/db/schema";
import { parseDateInSaoPaulo, todayInSaoPaulo } from "@/lib/timezone";
import { maybeNotifyStockCrossed } from "@/lib/stock-service";
import { z } from "zod";

const contributionSchema = z.object({
  employeeId: z.string().uuid(),
  itemId: z.string().uuid(),
  quantity: z.coerce.number().int().min(1, "Quantidade mínima é 1"),
  occurredAt: z.string().min(1),
  affectsStock: z.boolean(),
});

export type ContributionActionState = {
  error?: string;
  success?: boolean;
};

export async function createContribution(
  _prev: ContributionActionState,
  formData: FormData,
): Promise<ContributionActionState> {
  const kind = formData.get("kind");
  const affectsStock = kind !== "past";

  const parsed = contributionSchema.safeParse({
    employeeId: formData.get("employeeId"),
    itemId: formData.get("itemId"),
    quantity: formData.get("quantity"),
    occurredAt: formData.get("occurredAt") || todayInSaoPaulo(),
    affectsStock,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const db = getDb();
  const [item] = await db
    .select()
    .from(items)
    .where(eq(items.id, parsed.data.itemId));
  if (!item) return { error: "Item não encontrado" };

  const previousStock = item.stock;
  const occurredAt = parseDateInSaoPaulo(parsed.data.occurredAt);

  await db.insert(contributions).values({
    employeeId: parsed.data.employeeId,
    itemId: parsed.data.itemId,
    quantity: parsed.data.quantity,
    occurredAt,
    affectsStock: parsed.data.affectsStock,
  });

  if (parsed.data.affectsStock) {
    const newStock = previousStock + parsed.data.quantity;
    await db
      .update(items)
      .set({ stock: newStock })
      .where(eq(items.id, parsed.data.itemId));
    await maybeNotifyStockCrossed(
      parsed.data.itemId,
      previousStock,
      newStock,
    );
  }

  revalidatePath("/");
  revalidatePath("/contribuir");
  revalidatePath("/historico");
  return { success: true };
}

export async function listContributions(filters?: {
  employeeId?: string;
  itemId?: string;
}) {
  const db = getDb();
  const conditions = [];
  if (filters?.employeeId) {
    conditions.push(eq(contributions.employeeId, filters.employeeId));
  }
  if (filters?.itemId) {
    conditions.push(eq(contributions.itemId, filters.itemId));
  }

  const query = db
    .select({
      id: contributions.id,
      quantity: contributions.quantity,
      occurredAt: contributions.occurredAt,
      affectsStock: contributions.affectsStock,
      employeeId: contributions.employeeId,
      employeeName: employees.name,
      itemId: contributions.itemId,
      itemName: items.name,
    })
    .from(contributions)
    .innerJoin(employees, eq(contributions.employeeId, employees.id))
    .innerJoin(items, eq(contributions.itemId, items.id))
    .orderBy(desc(contributions.occurredAt));

  if (conditions.length > 0) {
    return query.where(and(...conditions));
  }
  return query;
}

export async function deleteContribution(
  id: string,
): Promise<ContributionActionState> {
  const db = getDb();
  const [row] = await db
    .select({
      contribution: contributions,
      item: items,
    })
    .from(contributions)
    .innerJoin(items, eq(contributions.itemId, items.id))
    .where(eq(contributions.id, id));

  if (!row) return { error: "Contribuição não encontrada" };

  const previousStock = row.item.stock;
  let newStock = previousStock;

  if (row.contribution.affectsStock) {
    newStock = previousStock - row.contribution.quantity;
    if (newStock < 0) {
      return { error: "Exclusão deixaria estoque negativo" };
    }
    await db
      .update(items)
      .set({ stock: newStock })
      .where(eq(items.id, row.item.id));
  }

  await db.delete(contributions).where(eq(contributions.id, id));

  if (row.contribution.affectsStock) {
    await maybeNotifyStockCrossed(row.item.id, previousStock, newStock);
  }

  revalidatePath("/");
  revalidatePath("/historico");
  revalidatePath("/contribuir");
  return { success: true };
}

export async function updateContribution(
  id: string,
  _prev: ContributionActionState,
  formData: FormData,
): Promise<ContributionActionState> {
  const parsed = contributionSchema.safeParse({
    employeeId: formData.get("employeeId"),
    itemId: formData.get("itemId"),
    quantity: formData.get("quantity"),
    occurredAt: formData.get("occurredAt"),
    affectsStock: formData.get("affectsStock") === "true",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const db = getDb();
  const [existing] = await db
    .select({
      contribution: contributions,
      item: items,
    })
    .from(contributions)
    .innerJoin(items, eq(contributions.itemId, items.id))
    .where(eq(contributions.id, id));

  if (!existing) return { error: "Contribuição não encontrada" };

  if (existing.contribution.affectsStock !== parsed.data.affectsStock) {
    return {
      error: "Não é permitido trocar entre contribuição vigente e passada",
    };
  }

  const occurredAt = parseDateInSaoPaulo(parsed.data.occurredAt);
  const old = existing.contribution;
  const oldItemId = old.itemId;
  const newItemId = parsed.data.itemId;

  const [oldItem] = await db
    .select()
    .from(items)
    .where(eq(items.id, oldItemId));
  const [newItem] =
    oldItemId === newItemId
      ? [oldItem]
      : await db.select().from(items).where(eq(items.id, newItemId));

  if (!oldItem || !newItem) return { error: "Item não encontrado" };

  if (old.affectsStock) {
    const stockWithoutOld =
      oldItemId === newItemId
        ? oldItem.stock - old.quantity
        : oldItem.stock - old.quantity;
    if (stockWithoutOld < 0) {
      return { error: "Edição deixaria estoque negativo" };
    }

    const finalStock =
      oldItemId === newItemId
        ? stockWithoutOld + parsed.data.quantity
        : newItem.stock + parsed.data.quantity;

    if (oldItemId !== newItemId) {
      await db
        .update(items)
        .set({ stock: stockWithoutOld })
        .where(eq(items.id, oldItemId));
      await db
        .update(items)
        .set({ stock: finalStock })
        .where(eq(items.id, newItemId));
      await maybeNotifyStockCrossed(oldItemId, oldItem.stock, stockWithoutOld);
      await maybeNotifyStockCrossed(newItemId, newItem.stock, finalStock);
    } else {
      await db
        .update(items)
        .set({ stock: finalStock })
        .where(eq(items.id, oldItemId));
      await maybeNotifyStockCrossed(oldItemId, oldItem.stock, finalStock);
    }
  }

  await db
    .update(contributions)
    .set({
      employeeId: parsed.data.employeeId,
      itemId: parsed.data.itemId,
      quantity: parsed.data.quantity,
      occurredAt,
    })
    .where(eq(contributions.id, id));

  revalidatePath("/");
  revalidatePath("/historico");
  revalidatePath("/contribuir");
  return { success: true };
}
