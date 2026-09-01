import { listEmployees } from "@/actions/employees";
import { listContributions } from "@/actions/contributions";
import { listItems } from "@/actions/items";
import { HistoryManager } from "@/components/history-manager";

export const dynamic = "force-dynamic";

export default async function HistoricoPage() {
  const [contributions, employees, items] = await Promise.all([
    listContributions(),
    listEmployees(),
    listItems(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Histórico</h2>
        <p className="text-muted-foreground">
          Contribuições vigentes e passadas
        </p>
      </div>
      <HistoryManager
        contributions={contributions}
        employees={employees}
        items={items}
      />
    </div>
  );
}
