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
      lastContributedAt: sql<Date | null>`max(${contributions.occurredAt})`,
    })
    .from(contributions)
    .where(eq(contributions.itemId, itemId))
    .groupBy(contributions.employeeId);

  return rows.map((row) => ({
    employeeId: row.employeeId,
    totalQuantity: row.totalQuantity,
    lastContributedAt: row.lastContributedAt,
  }));
}

export async function getNextPersonNameForItem(
  itemId: string,
  kind: ItemKind,
): Promise<string | null> {
  const db = getDb();
  const allEmployees = await db.select().from(employees);
  const summaries = await getContributionSummariesForItem(itemId);
  const next = pickNextInQueue(
    allEmployees as RotationEmployee[],
    kind,
    summaries,
  );
  return next?.name ?? null;
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

  const nextPerson = await getNextPersonNameForItem(itemId, item.kind);
  await notifyLowStock(
    buildLowStockMessage(item.name, newStock, nextPerson),
  );
}
