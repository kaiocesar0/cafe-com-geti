import { Package } from "lucide-react";
import { listEmployees } from "@/actions/employees";
import { listItems } from "@/actions/items";
import { DashboardContributionQueue } from "@/components/dashboard-contribution-queue";
import { DashboardItemCard } from "@/components/dashboard-item-card";
import { DashboardKpis } from "@/components/dashboard-kpis";
import { PageHeader } from "@/components/page-header";
import { SectionPanel } from "@/components/section-panel";
import { currentWriter } from "@/lib/authorization";
import { getContributionSummariesForItem } from "@/lib/stock-service";
import {
  pickNextInQueue,
  rankQueue,
  type RotationEmployee,
} from "@/lib/rotation";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ item?: string }>;
}) {
  const canWrite = (await currentWriter()) !== null;
  const { item: itemParam } = await searchParams;
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
        summaries,
        nextPerson: next?.name ?? null,
      };
    }),
  );

  const selectedItem =
    items.find((item) => item.id === itemParam) ?? items[0] ?? null;

  const selectedSummaries =
    cards.find((card) => card.item.id === selectedItem?.id)?.summaries ?? [];

  const selectedQueue = selectedItem
    ? rankQueue(
        employees as RotationEmployee[],
        selectedItem.kind,
        selectedSummaries,
      )
    : [];

  const lowStockCount = items.filter((item) => item.stock <= 1).length;
  const criticalCount = items.filter((item) => item.stock === 0).length;
  const activeEmployees = employees.filter((e) => e.active).length;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        description="Estoque atual e próximo da vez por item"
      />

      <DashboardKpis
        itemCount={items.length}
        lowStockCount={lowStockCount}
        criticalCount={criticalCount}
        activeEmployees={activeEmployees}
      />

      {cards.length === 0 ? (
        <SectionPanel title="Nenhum item cadastrado">
          <p className="text-center text-sm text-muted-foreground">
            Cadastre os produtos da copa para começar.{" "}
            <a href="/itens" className="font-medium text-primary underline">
              Ir para Itens
            </a>
          </p>
        </SectionPanel>
      ) : (
        <>
          <SectionPanel
            title="Itens em estoque"
            description="Últimas informações da copa"
            icon={<Package className="size-5" />}
          >
            <div className="grid gap-4 lg:grid-cols-2">
              {cards.map(({ item, nextPerson }) => (
                <DashboardItemCard
                  key={item.id}
                  item={item}
                  nextPerson={nextPerson}
                  canWrite={canWrite}
                />
              ))}
            </div>
          </SectionPanel>

          {selectedItem ? (
            <DashboardContributionQueue
              items={items.map((item) => ({ id: item.id, name: item.name }))}
              selectedItemId={selectedItem.id}
              unitLabel={selectedItem.unitLabel}
              queue={selectedQueue}
            />
          ) : null}
        </>
      )}
    </div>
  );
}
