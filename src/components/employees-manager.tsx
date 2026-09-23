"use client";

import { useActionState, useEffect, useTransition } from "react";
import { toast } from "sonner";
import {
  createEmployee,
  setEmployeeActive,
  updateEmployee,
  type EmployeeActionState,
} from "@/actions/employees";
import type { Employee } from "@/db/schema";
import { preferenceLabels } from "@/lib/labels";
import { formatDateTimeSaoPaulo } from "@/lib/timezone";
import { Button } from "@/components/ui/button";
import { FormSelect } from "@/components/form-select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SectionPanel } from "@/components/section-panel";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

const initialState: EmployeeActionState = {};

function EmployeeForm({
  employee,
  onDone,
}: {
  employee?: Employee;
  onDone?: () => void;
}) {
  const action = employee
    ? updateEmployee.bind(null, employee.id)
    : createEmployee;
  const [state, formAction, pending] = useActionState(action, initialState);

  useEffect(() => {
    if (state.error) toast.error(state.error);
    if (state.success) {
      toast.success(employee ? "Funcionário atualizado" : "Funcionário criado");
      onDone?.();
    }
  }, [state, employee, onDone]);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nome</Label>
        <Input
          id="name"
          name="name"
          defaultValue={employee?.name ?? ""}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="preference">Preferência</Label>
        <FormSelect
          name="preference"
          defaultValue={employee?.preference ?? "both"}
        >
          {Object.entries(preferenceLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </FormSelect>
      </div>
      <div className="flex items-center gap-2">
        <input
          id={employee ? `active-${employee.id}` : "active"}
          name="active"
          type="checkbox"
          defaultChecked={employee?.active ?? true}
          className="h-4 w-4 rounded border"
        />
        <Label htmlFor={employee ? `active-${employee.id}` : "active"}>
          Ativo no rodízio
        </Label>
      </div>
      <Button type="submit" disabled={pending}>
        {employee ? "Salvar" : "Cadastrar"}
      </Button>
    </form>
  );
}

export function EmployeesManager({ employees }: { employees: Employee[] }) {
  return (
    <div className="space-y-6">
      <SectionPanel title="Novo funcionário">
        <EmployeeForm />
      </SectionPanel>

      <SectionPanel
        title="Cadastrados"
        description={`${employees.length} funcionário(s)`}
      >
        <div className="overflow-x-auto rounded-lg border">
          <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Preferência</TableHead>
              <TableHead>Ativo</TableHead>
              <TableHead>Cadastro</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {employees.map((employee) => (
              <TableRow key={employee.id}>
                <TableCell>{employee.name}</TableCell>
                <TableCell>{preferenceLabels[employee.preference]}</TableCell>
                <TableCell>{employee.active ? "Sim" : "Não"}</TableCell>
                <TableCell>
                  {formatDateTimeSaoPaulo(employee.createdAt)}
                </TableCell>
                <TableCell>
                  <details>
                    <summary className="cursor-pointer text-sm text-primary">
                      Editar
                    </summary>
                    <div className="mt-3 min-w-64">
                      <EmployeeForm employee={employee} />
                    </div>
                  </details>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        </div>
      </SectionPanel>
    </div>
  );
}
