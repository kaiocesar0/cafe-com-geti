import { listEmployees } from "@/actions/employees";
import { listItems } from "@/actions/items";
import { ContributionForm } from "@/components/contribution-form";
import { PageHeader } from "@/components/page-header";
import { SectionPanel } from "@/components/section-panel";
import { currentWriter } from "@/lib/authorization";

export const dynamic = "force-dynamic";

export default async function ContribuirPage({
  searchParams,
}: {
  searchParams: Promise<{ itemId?: string }>;
}) {
  const session = await currentWriter();
  const { itemId } = await searchParams;

  if (!session) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Contribuir"
          description="Registre o que foi trazido agora ou no passado"
        />
        <SectionPanel title="Só admin registra">
          <p className="text-sm text-muted-foreground">
            Visitantes consultam a copa; quem registra contribuição entra pelo
            botão <span className="font-medium text-foreground">Admin</span> no
            topo da página.
          </p>
        </SectionPanel>
      </div>
    );
  }

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
          defaultEmployeeId={session.employeeId}
        />
      </SectionPanel>
    </div>
  );
}
