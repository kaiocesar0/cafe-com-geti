"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import {
  createItem,
  updateItem,
  type ItemActionState,
} from "@/actions/items";
import type { Item } from "@/db/schema";
import { itemKindLabels } from "@/lib/labels";
import { Button } from "@/components/ui/button";
import { FormSelect } from "@/components/form-select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const initialState: ItemActionState = {};

function ItemForm({ item, onDone }: { item?: Item; onDone?: () => void }) {
  const action = item ? updateItem.bind(null, item.id) : createItem;
  const [state, formAction, pending] = useActionState(action, initialState);

  useEffect(() => {
    if (state.error) toast.error(state.error);
    if (state.success) {
      toast.success(item ? "Item atualizado" : "Item criado");
      onDone?.();
    }
  }, [state, item, onDone]);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nome</Label>
        <Input
          id="name"
          name="name"
          defaultValue={item?.name ?? ""}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="unitLabel">Unidade</Label>
        <Input
          id="unitLabel"
          name="unitLabel"
          placeholder="pacote, litro, caixa..."
          defaultValue={item?.unitLabel ?? ""}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="kind">Tipo</Label>
        <FormSelect name="kind" defaultValue={item?.kind ?? "coffee"}>
          {Object.entries(itemKindLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </FormSelect>
      </div>
      <div className="space-y-2">
        <Label htmlFor="stock">Estoque agora é</Label>
        <Input
          id="stock"
          name="stock"
          type="number"
          min={0}
          defaultValue={item?.stock ?? 0}
          required
        />
      </div>
      <Button type="submit" disabled={pending}>
        {item ? "Salvar" : "Cadastrar"}
      </Button>
    </form>
  );
}

export function ItemsManager({ items }: { items: Item[] }) {
  return (
    <div className="space-y-8">
      <section className="rounded-lg border p-4">
        <h2 className="mb-4 text-lg font-medium">Novo item</h2>
        <ItemForm />
      </section>

      <section>
        <h2 className="mb-4 text-lg font-medium">Cadastrados</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Estoque</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.name}</TableCell>
                <TableCell>{itemKindLabels[item.kind]}</TableCell>
                <TableCell>
                  {item.stock} {item.unitLabel}
                </TableCell>
                <TableCell>
                  <details>
                    <summary className="cursor-pointer text-sm text-primary">
                      Editar
                    </summary>
                    <div className="mt-3 min-w-64">
                      <ItemForm item={item} />
                    </div>
                  </details>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>
    </div>
  );
}
