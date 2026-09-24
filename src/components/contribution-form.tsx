"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import {
  createContribution,
  type ContributionActionState,
} from "@/actions/contributions";
import type { Item, PublicEmployee } from "@/db/schema";
import { todayInSaoPaulo } from "@/lib/timezone";
import { Button } from "@/components/ui/button";
import { FormSelect } from "@/components/form-select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: ContributionActionState = {};

export function ContributionForm({
  employees,
  items,
  defaultItemId,
  defaultEmployeeId,
}: {
  employees: PublicEmployee[];
  items: Item[];
  defaultItemId?: string;
  defaultEmployeeId?: string;
}) {
  const [state, formAction, pending] = useActionState(
    createContribution,
    initialState,
  );

  useEffect(() => {
    if (state.error) toast.error(state.error);
    if (state.success) toast.success("Contribuição registrada");
  }, [state]);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label>Tipo de lançamento</Label>
        <FormSelect name="kind" defaultValue="current">
          <option value="current">Vigente (sobe estoque)</option>
          <option value="past">
            Passada (só ranking, não mexe na prateleira)
          </option>
        </FormSelect>
      </div>

      <div className="space-y-2">
        <Label htmlFor="employeeId">Funcionário</Label>
        <FormSelect
          name="employeeId"
          required
          defaultValue={defaultEmployeeId ?? ""}
        >
          <option value="" disabled>
            Selecione
          </option>
          {employees.map((employee) => (
            <option key={employee.id} value={employee.id}>
              {employee.name}
            </option>
          ))}
        </FormSelect>
      </div>

      <div className="space-y-2">
        <Label htmlFor="itemId">Item</Label>
        <FormSelect name="itemId" defaultValue={defaultItemId ?? ""} required>
          <option value="" disabled={!defaultItemId}>
            Selecione
          </option>
          {items.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </FormSelect>
      </div>

      <div className="space-y-2">
        <Label htmlFor="quantity">Quantidade</Label>
        <Input
          id="quantity"
          name="quantity"
          type="number"
          min={1}
          defaultValue={1}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="occurredAt">Data</Label>
        <Input
          id="occurredAt"
          name="occurredAt"
          type="date"
          defaultValue={todayInSaoPaulo()}
          required
        />
      </div>

      <Button type="submit" disabled={pending}>
        Registrar
      </Button>
    </form>
  );
}
