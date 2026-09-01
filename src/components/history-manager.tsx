"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  deleteContribution,
  listContributions,
  updateContribution,
  type ContributionActionState,
} from "@/actions/contributions";
import type { Employee, Item } from "@/db/schema";
import { formatDateSaoPaulo } from "@/lib/timezone";
import { Button } from "@/components/ui/button";
import { FormSelect } from "@/components/form-select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type ContributionRow = Awaited<ReturnType<typeof listContributions>>[number];

const initialState: ContributionActionState = {};

function EditContributionForm({
  row,
  employees,
  items,
}: {
  row: ContributionRow;
  employees: Employee[];
  items: Item[];
}) {
  const action = updateContribution.bind(null, row.id);
  const [state, formAction, pending] = useActionState(action, initialState);

  useEffect(() => {
    if (state.error) toast.error(state.error);
    if (state.success) toast.success("Contribuição atualizada");
  }, [state]);

  const dateValue = row.occurredAt.toISOString().slice(0, 10);

  return (
    <form action={formAction} className="space-y-3">
      <input
        type="hidden"
        name="affectsStock"
        value={row.affectsStock ? "true" : "false"}
      />
      <div className="space-y-2">
        <Label>Funcionário</Label>
        <FormSelect name="employeeId" defaultValue={row.employeeId}>
          {employees.map((employee) => (
            <option key={employee.id} value={employee.id}>
              {employee.name}
            </option>
          ))}
        </FormSelect>
      </div>
      <div className="space-y-2">
        <Label>Item</Label>
        <FormSelect name="itemId" defaultValue={row.itemId}>
          {items.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </FormSelect>
      </div>
      <div className="space-y-2">
        <Label>Quantidade</Label>
        <Input
          name="quantity"
          type="number"
          min={1}
          defaultValue={row.quantity}
        />
      </div>
      <div className="space-y-2">
        <Label>Data</Label>
        <Input name="occurredAt" type="date" defaultValue={dateValue} />
      </div>
      <Button type="submit" size="sm" disabled={pending}>
        Salvar edição
      </Button>
    </form>
  );
}

export function HistoryManager({
  contributions,
  employees,
  items,
}: {
  contributions: ContributionRow[];
  employees: Employee[];
  items: Item[];
}) {
  const [employeeFilter, setEmployeeFilter] = useState("all");
  const [itemFilter, setItemFilter] = useState("all");
  const [pending, startTransition] = useTransition();

  const filtered = contributions.filter((row) => {
    if (employeeFilter !== "all" && row.employeeId !== employeeFilter) {
      return false;
    }
    if (itemFilter !== "all" && row.itemId !== itemFilter) {
      return false;
    }
    return true;
  });

  function handleDelete(id: string) {
    if (!confirm("Excluir esta contribuição?")) return;
    startTransition(async () => {
      const result = await deleteContribution(id);
      if (result.error) toast.error(result.error);
      else toast.success("Contribuição excluída");
    });
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Filtrar por funcionário</Label>
          <Select
            value={employeeFilter}
            onValueChange={(value) => setEmployeeFilter(value ?? "all")}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {employees.map((employee) => (
                <SelectItem key={employee.id} value={employee.id}>
                  {employee.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Filtrar por item</Label>
          <Select
            value={itemFilter}
            onValueChange={(value) => setItemFilter(value ?? "all")}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {items.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data</TableHead>
            <TableHead>Funcionário</TableHead>
            <TableHead>Item</TableHead>
            <TableHead>Qtd</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((row) => (
            <TableRow key={row.id}>
              <TableCell>{formatDateSaoPaulo(row.occurredAt)}</TableCell>
              <TableCell>{row.employeeName}</TableCell>
              <TableCell>{row.itemName}</TableCell>
              <TableCell>{row.quantity}</TableCell>
              <TableCell>
                {row.affectsStock ? "Vigente" : "Passada"}
              </TableCell>
              <TableCell className="space-x-2">
                <details>
                  <summary className="cursor-pointer text-sm text-primary">
                    Editar
                  </summary>
                  <div className="mt-3 min-w-64">
                    <EditContributionForm
                      row={row}
                      employees={employees}
                      items={items}
                    />
                  </div>
                </details>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={pending}
                  onClick={() => handleDelete(row.id)}
                >
                  Excluir
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
