import { listItems } from "@/actions/items";
import { ItemsManager } from "@/components/items-manager";
import { PageHeader } from "@/components/page-header";
import { currentWriter } from "@/lib/authorization";

export const dynamic = "force-dynamic";

export default async function ItensPage() {
  const canWrite = (await currentWriter()) !== null;
  const items = await listItems();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Itens"
        description="Cadastro e contagem física de estoque"
      />
      <ItemsManager items={items} canWrite={canWrite} />
    </div>
  );
}
