import { listItems } from "@/actions/items";
import { ItemsManager } from "@/components/items-manager";

export const dynamic = "force-dynamic";

export default async function ItensPage() {
  const items = await listItems();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Itens</h2>
        <p className="text-muted-foreground">
          Cadastro e contagem física de estoque
        </p>
      </div>
      <ItemsManager items={items} />
    </div>
  );
}
