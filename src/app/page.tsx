import { listEmployees } from "@/actions/employees";
import { listItems } from "@/actions/items";
import { DashboardItemCard } from "@/components/dashboard-item-card";
import { getContributionSummariesForItem } from "@/lib/stock-service";
import { pickNextInQueue, type RotationEmployee } from "@/lib/rotation";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [items, employees] = await Promise.all([listItems(), listEmployees()]);

  const cards = await Promise.all(
    items.map(async (item) => {
      const summaries = await getContributionSummariesForItem(item.id);
      const next = pickNextInQueue(
        employees as RotationEmployee[],
        item.kind,
        summaries,
      );
      return {
        item,
        nextPerson: next?.name ?? null,
      };
    }),
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Dashboard</h2>
        <p className="text-muted-foreground">
          Estoque atual e próximo da vez por item
        </p>
      </div>

      {cards.length === 0 ? (
        <p className="rounded-lg border border-dashed p-6 text-center text-muted-foreground">
          Nenhum item cadastrado. Comece em{" "}
          <a href="/itens" className="text-primary underline">
            Itens
          </a>
          .
        </p>
      ) : (
        <div className="grid gap-4">
          {cards.map(({ item, nextPerson }) => (
            <DashboardItemCard
              key={item.id}
              item={item}
              nextPerson={nextPerson}
            />
          ))}
        </div>
      )}
    </div>
  );
}
