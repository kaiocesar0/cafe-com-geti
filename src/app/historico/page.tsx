import { listEmployees } from "@/actions/employees";
import { listContributions } from "@/actions/contributions";
import { listItems } from "@/actions/items";
import { HistoryManager } from "@/components/history-manager";
import { PageHeader } from "@/components/page-header";
import { SectionPanel } from "@/components/section-panel";
import { currentWriter } from "@/lib/authorization";

export const dynamic = "force-dynamic";

export default async function HistoricoPage() {
  const canWrite = (await currentWriter()) !== null;
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
      <SectionPanel
        title="Lançamentos"
        description={canWrite ? "Filtre, edite ou exclua" : "Filtre e consulte"}
      >
        <HistoryManager
          contributions={contributions}
          employees={employees}
          items={items}
          canWrite={canWrite}
        />
      </SectionPanel>
    </div>
  );
}
