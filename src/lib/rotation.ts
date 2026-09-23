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

export function pickNextInQueue(
  employees: RotationEmployee[],
  kind: ItemKind,
  summaries: ContributionSummary[],
): RotationEmployee | null {
  const queue = employees.filter((e) => isInQueue(e, kind));
  if (queue.length === 0) return null;

  const ranked = queue.map((employee) => {
    const summary = summaries.find((s) => s.employeeId === employee.id);
    return {
      employee,
      total: summary?.totalQuantity ?? 0,
      lastAt: summary?.lastContributedAt ?? null,
    };
  });

  const minTotal = Math.min(...ranked.map((r) => r.total));
  const candidates = ranked.filter((r) => r.total === minTotal);

  candidates.sort((a, b) => {
    if (a.lastAt === null && b.lastAt === null) {
      return toEpochMs(a.employee.createdAt) - toEpochMs(b.employee.createdAt);
    }
    if (a.lastAt === null) return -1;
    if (b.lastAt === null) return 1;
    return toEpochMs(a.lastAt) - toEpochMs(b.lastAt);
  });

  return candidates[0]?.employee ?? null;
}

export function stockSemaphore(stock: number): "ok" | "warning" | "critical" {
  if (stock > 1) return "ok";
  if (stock === 1) return "warning";
  return "critical";
}
