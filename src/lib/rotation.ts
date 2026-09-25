import type { ItemKind, Preference } from "@/db/schema";

export interface RotationEmployee {
  id: string;
  name: string;
  preference: Preference;
  active: boolean;
  /** Drivers (ex.: Neon) podem devolver string ISO em vez de Date. */
  createdAt: Date | string;
}

export interface ContributionSummary {
  employeeId: string;
  totalQuantity: number;
  /** Drivers (ex.: Neon) podem devolver string ISO em vez de Date. */
  lastContributedAt: Date | string | null;
}

function toEpochMs(value: Date | string): number {
  return value instanceof Date ? value.getTime() : new Date(value).getTime();
}

export function isInQueue(
  employee: Pick<RotationEmployee, "active" | "preference">,
  kind: ItemKind,
): boolean {
  if (!employee.active) return false;
  if (kind === "milk") {
    return employee.preference === "milk" || employee.preference === "both";
  }
  return employee.preference === "coffee" || employee.preference === "both";
}

export interface RankedQueueEntry {
  employee: RotationEmployee;
  totalQuantity: number;
  lastContributedAt: Date | string | null;
}

export function rankQueue(
  employees: RotationEmployee[],
  kind: ItemKind,
  summaries: ContributionSummary[],
): RankedQueueEntry[] {
  const ranked = employees
    .filter((e) => isInQueue(e, kind))
    .map((employee) => {
      const summary = summaries.find((s) => s.employeeId === employee.id);
      return {
        employee,
        totalQuantity: summary?.totalQuantity ?? 0,
        lastContributedAt: summary?.lastContributedAt ?? null,
      };
    });

  ranked.sort((a, b) => {
    if (a.totalQuantity !== b.totalQuantity) {
      return a.totalQuantity - b.totalQuantity;
    }
    if (a.lastContributedAt === null && b.lastContributedAt === null) {
      return toEpochMs(a.employee.createdAt) - toEpochMs(b.employee.createdAt);
    }
    if (a.lastContributedAt === null) return -1;
    if (b.lastContributedAt === null) return 1;
    return toEpochMs(a.lastContributedAt) - toEpochMs(b.lastContributedAt);
  });

  return ranked;
}

export function pickNextInQueue(
  employees: RotationEmployee[],
  kind: ItemKind,
  summaries: ContributionSummary[],
): RotationEmployee | null {
  return rankQueue(employees, kind, summaries)[0]?.employee ?? null;
}

export function stockSemaphore(stock: number): "ok" | "warning" | "critical" {
  if (stock > 1) return "ok";
  if (stock === 1) return "warning";
  return "critical";
}
