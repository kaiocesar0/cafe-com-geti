"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { contributions, items } from "@/db/schema";
import {
  buildLowStockMessage,
  chatAlertEnvironmentLabel,
  notifyLowStock,
} from "@/lib/notify";
import {
  getNextPersonNamesForItem,
  maybeNotifyStockChange,
} from "@/lib/stock-service";
import { SIGN_IN_REQUIRED } from "@/lib/auth-messages";
import { currentWriter } from "@/lib/authorization";
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

export type ChatAlertPreview = {
  error?: string;
  message?: string;
  environment?: "produção" | "preview" | "local";
};

async function composeItemChatAlert(
  id: string,
): Promise<{ error: string } | { message: string }> {
  const db = getDb();
  const [item] = await db.select().from(items).where(eq(items.id, id));
  if (!item) return { error: "Item não encontrado" };

  const nextPeople = await getNextPersonNamesForItem(item.id, item.kind, 2);
  return { message: buildLowStockMessage(item.name, item.stock, nextPeople) };
}

export async function createItem(
  _prev: ItemActionState,
  formData: FormData,
): Promise<ItemActionState> {
  if (!(await currentWriter())) return { error: SIGN_IN_REQUIRED };

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
  if (!(await currentWriter())) return { error: SIGN_IN_REQUIRED };

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

  await maybeNotifyStockChange(id, previousStock, parsed.data.stock);

  revalidatePath("/itens");
  revalidatePath("/");
  return { success: true };
}

export async function deleteItem(id: string): Promise<ItemActionState> {
  if (!(await currentWriter())) return { error: SIGN_IN_REQUIRED };

  const db = getDb();
  const [current] = await db.select().from(items).where(eq(items.id, id));
  if (!current) return { error: "Item não encontrado" };

  await db.delete(contributions).where(eq(contributions.itemId, id));
  await db.delete(items).where(eq(items.id, id));

  revalidatePath("/itens");
  revalidatePath("/");
  revalidatePath("/contribuir");
  revalidatePath("/historico");
  return { success: true };
}

export async function previewItemChatAlert(id: string): Promise<ChatAlertPreview> {
  if (!(await currentWriter())) return { error: SIGN_IN_REQUIRED };

  const composed = await composeItemChatAlert(id);
  if ("error" in composed) return composed;

  return {
    message: composed.message,
    environment: chatAlertEnvironmentLabel(process.env.VERCEL_ENV),
  };
}

export async function sendItemChatAlert(id: string): Promise<ItemActionState> {
  if (!(await currentWriter())) return { error: SIGN_IN_REQUIRED };
  if (!process.env.GOOGLE_CHAT_WEBHOOK_URL) {
    return { error: "Webhook do Google Chat não configurado neste ambiente" };
  }

  const composed = await composeItemChatAlert(id);
  if ("error" in composed) return composed;

  try {
    const sent = await notifyLowStock(composed.message);
    if (sent?.error) return { error: sent.error };
  } catch (error) {
    console.error("Erro ao enviar aviso manual ao Google Chat:", error);
    return { error: "Falha ao enviar o aviso ao Google Chat" };
  }

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
  if (!(await currentWriter())) return { error: SIGN_IN_REQUIRED };

  const db = getDb();
  const [current] = await db.select().from(items).where(eq(items.id, id));
  if (!current) return { error: "Item não encontrado" };

  const newStock = current.stock + delta;
  if (newStock < 0) {
    return { error: "Estoque não pode ficar negativo" };
  }

  const previousStock = current.stock;
  await db.update(items).set({ stock: newStock }).where(eq(items.id, id));
  await maybeNotifyStockChange(id, previousStock, newStock);

  revalidatePath("/");
  revalidatePath("/itens");
  return { success: true };
}
