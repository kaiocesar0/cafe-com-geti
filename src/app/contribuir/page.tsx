import { listEmployees } from "@/actions/employees";
import { listItems } from "@/actions/items";
import { ContributionForm } from "@/components/contribution-form";
import { PageHeader } from "@/components/page-header";
import { SectionPanel } from "@/components/section-panel";

export const dynamic = "force-dynamic";

export default async function ContribuirPage({
  searchParams,
}: {
  searchParams: Promise<{ itemId?: string }>;
}) {
  const { itemId } = await searchParams;
  const [employees, items] = await Promise.all([listEmployees(), listItems()]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contribuir"
        description="Registre o que foi trazido agora ou no passado"
      />
      <SectionPanel
        title="Novo lançamento"
        description="Vigente atualiza a prateleira; passada só entra no ranking"
      >
        <ContributionForm
          employees={employees}
          items={items}
          defaultItemId={itemId}
        />
      </SectionPanel>
    </div>
  );
}
