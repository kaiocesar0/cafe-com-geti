import { listEmployees } from "@/actions/employees";
import { listContributions } from "@/actions/contributions";
import { listItems } from "@/actions/items";
import { HistoryManager } from "@/components/history-manager";
import { PageHeader } from "@/components/page-header";
import { SectionPanel } from "@/components/section-panel";

export const dynamic = "force-dynamic";

export default async function HistoricoPage() {
  const [contributions, employees, items] = await Promise.all([
    listContributions(),
    listEmployees(),
    listItems(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Histórico"
        description="Contribuições vigentes e passadas"
      />
      <SectionPanel title="Lançamentos" description="Filtre, edite ou exclua">
        <HistoryManager
          contributions={contributions}
          employees={employees}
          items={items}
        />
      </SectionPanel>
    </div>
  );
}
