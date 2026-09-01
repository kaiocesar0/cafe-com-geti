import { listEmployees } from "@/actions/employees";
import { listItems } from "@/actions/items";
import { ContributionForm } from "@/components/contribution-form";

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
      <div>
        <h2 className="text-2xl font-semibold">Contribuir</h2>
        <p className="text-muted-foreground">
          Registre o que foi trazido agora ou no passado
        </p>
      </div>
      <ContributionForm
        employees={employees}
        items={items}
        defaultItemId={itemId}
      />
    </div>
  );
}
