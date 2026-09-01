import { listItems } from "@/actions/items";
import { ItemsManager } from "@/components/items-manager";
import { PageHeader } from "@/components/page-header";

export const dynamic = "force-dynamic";

export default async function ItensPage() {
  const items = await listItems();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Itens"
        description="Cadastro e contagem física de estoque"
      />
      <ItemsManager items={items} />
    </div>
  );
}
