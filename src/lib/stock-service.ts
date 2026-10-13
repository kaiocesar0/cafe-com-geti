import { eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import {
  contributions,
  employees,
  items,
  type ItemKind,
} from "@/db/schema";
import {
  buildLowStockMessage,
  notifyLowStock,
  shouldNotifyStockCrossedOne,
} from "@/lib/notify";
import {
  pickNextInQueue,
  pickNextNInQueue,
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

async function loadRotationEmployees(): Promise<RotationEmployee[]> {
  const db = getDb();
  return (await db
    .select({
      id: employees.id,
      name: employees.name,
      preference: employees.preference,
      active: employees.active,
      createdAt: employees.createdAt,
    })
    .from(employees)) as RotationEmployee[];
}

export async function getNextPersonNameForItem(
  itemId: string,
  kind: ItemKind,
): Promise<string | null> {
  const allEmployees = await loadRotationEmployees();
  const summaries = await getContributionSummariesForItem(itemId);
  const next = pickNextInQueue(allEmployees, kind, summaries);
  return next?.name ?? null;
}

export async function getNextPersonNamesForItem(
  itemId: string,
  kind: ItemKind,
  limit = 2,
): Promise<string[]> {
  const allEmployees = await loadRotationEmployees();
  const summaries = await getContributionSummariesForItem(itemId);
  return pickNextNInQueue(allEmployees, kind, summaries, limit).map(
    (e) => e.name,
  );
}

export async function maybeNotifyStockCrossed(
  itemId: string,
  previousStock: number,
  newStock: number,
): Promise<void> {
  if (!shouldNotifyStockCrossedOne(previousStock, newStock)) return;

  const db = getDb();
  const [item] = await db.select().from(items).where(eq(items.id, itemId));
  if (!item) return;

  const nextPeople = await getNextPersonNamesForItem(itemId, item.kind, 2);
  await notifyLowStock(
    buildLowStockMessage(item.name, newStock, nextPeople),
  );
}
