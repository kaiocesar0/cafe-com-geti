"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  deleteContribution,
  listContributions,
  updateContribution,
  type ContributionActionState,
} from "@/actions/contributions";
import type { Item, PublicEmployee } from "@/db/schema";
import { formatDateSaoPaulo } from "@/lib/timezone";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { FormDialog } from "@/components/form-dialog";
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
  onDone,
}: {
  row: ContributionRow;
  employees: PublicEmployee[];
  items: Item[];
  onDone?: () => void;
}) {
  const action = updateContribution.bind(null, row.id);
  const [state, formAction, pending] = useActionState(action, initialState);

  useEffect(() => {
    if (state.error) toast.error(state.error);
    if (state.success) {
      toast.success("Contribuição atualizada");
      onDone?.();
    }
  }, [state, onDone]);

  const dateValue =
    row.occurredAt instanceof Date
      ? row.occurredAt.toISOString().slice(0, 10)
      : String(row.occurredAt).slice(0, 10);

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
      <Button type="submit" disabled={pending}>
        Salvar edição
      </Button>
    </form>
  );
}

export function HistoryManager({
  contributions,
  employees,
  items,
  canWrite,
}: {
  contributions: ContributionRow[];
  employees: PublicEmployee[];
  items: Item[];
  canWrite: boolean;
}) {
  const [employeeFilter, setEmployeeFilter] = useState("all");
  const [itemFilter, setItemFilter] = useState("all");

  const filtered = contributions.filter((row) => {
    if (employeeFilter !== "all" && row.employeeId !== employeeFilter) {
      return false;
    }
    if (itemFilter !== "all" && row.itemId !== itemFilter) {
      return false;
    }
    return true;
  });

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
            {canWrite ? <TableHead /> : null}
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
              {canWrite ? (
                <TableCell>
                  <div className="flex flex-wrap items-center gap-2">
                    <FormDialog
                      trigger={
                        <Button type="button" variant="outline" size="sm">
                          Editar
                        </Button>
                      }
                      title="Editar contribuição"
                      description={`${row.employeeName} · ${row.itemName}`}
                    >
                      {({ close }) => (
                        <EditContributionForm
                          row={row}
                          employees={employees}
                          items={items}
                          onDone={close}
                        />
                      )}
                    </FormDialog>
                    <ConfirmDialog
                      trigger={
                        <Button type="button" variant="destructive" size="sm">
                          Excluir
                        </Button>
                      }
                      title="Excluir contribuição"
                      description={`Excluir o registro de ${row.employeeName} (${row.quantity}× ${row.itemName})? Esta ação não pode ser desfeita.`}
                      confirmLabel="Excluir"
                      onConfirm={async () => {
                        const result = await deleteContribution(row.id);
                        if (result.error) {
                          toast.error(result.error);
                          return false;
                        }
                        toast.success("Contribuição excluída");
                        return true;
                      }}
                    />
                  </div>
                </TableCell>
              ) : null}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
