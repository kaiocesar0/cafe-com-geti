import { eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import {
  contributions,
  employees,
  items,
  type ItemKind,
} from "@/db/schema";
import {
  buildStockAlertMessage,
  normalizeAppUrl,
  notifyStockAlert,
  stockAlertKind,
} from "@/lib/notify";
import {
  pickNextInQueue,
  type ContributionSummary,
  type RotationEmployee,
} from "@/lib/rotation";

export async function getContributionSummariesForItem(
  itemId: string,
): Promise<ContributionSummary[]> {
  const db = getDb();
  const rows = await db
    .select({
      employeeId: contributions.employeeId,
      totalQuantity: sql<number>`coalesce(sum(${contributions.quantity}), 0)`.mapWith(
        Number,
      ),
      lastContributedAt: sql<Date | string | null>`max(${contributions.occurredAt})`,
    })
    .from(contributions)
    .where(eq(contributions.itemId, itemId))
    .groupBy(contributions.employeeId);

  return rows.map((row) => ({
    employeeId: row.employeeId,
    totalQuantity: row.totalQuantity,
    lastContributedAt:
      row.lastContributedAt == null
        ? null
        : row.lastContributedAt instanceof Date
          ? row.lastContributedAt
          : new Date(row.lastContributedAt),
  }));
}

export async function getNextPersonNameForItem(
  itemId: string,
  kind: ItemKind,
): Promise<string | null> {
  const db = getDb();
  const allEmployees = await db
    .select({
      id: employees.id,
      name: employees.name,
      preference: employees.preference,
      active: employees.active,
      createdAt: employees.createdAt,
    })
    .from(employees);
  const summaries = await getContributionSummariesForItem(itemId);
  const next = pickNextInQueue(
    allEmployees as RotationEmployee[],
    kind,
    summaries,
  );
  return next?.name ?? null;
}

export async function maybeNotifyStockChange(
  itemId: string,
  previousStock: number,
  newStock: number,
): Promise<void> {
  const kind = stockAlertKind(previousStock, newStock);
  if (!kind) return;

  const db = getDb();
  const [item] = await db.select().from(items).where(eq(items.id, itemId));
  if (!item) return;

  const nextPerson =
    kind === "restocked"
      ? null
      : await getNextPersonNameForItem(itemId, item.kind);

  const appUrl = normalizeAppUrl(process.env.APP_URL);
  if (!appUrl) {
    console.warn("APP_URL não configurada; alerta sem link");
  }

  try {
    await notifyStockAlert(
      buildStockAlertMessage({
        kind,
        itemName: item.name,
        newStock,
        unitLabel: item.unitLabel,
        nextPerson,
        appUrl,
      }),
    );
  } catch (error) {
    console.error("Erro ao enviar alerta Google Chat:", error);
  }
}
