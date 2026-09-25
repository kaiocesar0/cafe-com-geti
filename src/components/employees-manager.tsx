"use client";

import {
  useActionState,
  useEffect,
  useState,
  useTransition,
  type FormEvent,
  type ReactElement,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  demoteToFuncionario,
  promoteToAdmin,
  promoteToAdminGeral,
  resetEmployeePassword,
} from "@/actions/accounts";
import {
  createEmployee,
  updateEmployee,
  type EmployeeActionState,
} from "@/actions/employees";
import type { AccountEmployee, PublicEmployee } from "@/db/schema";
import { preferenceLabels, roleLabels } from "@/lib/labels";
import {
  canDemoteToFuncionario,
  canEditProfile,
  canPromoteToAdmin,
  canPromoteToAdminGeral,
  canResetPassword,
  canSetActive,
  isLastActiveAdminGeralAmong,
  type MatrixActor,
} from "@/lib/role-matrix";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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

const initialState: EmployeeActionState = {};

function isAccountEmployee(
  employee: PublicEmployee | AccountEmployee,
): employee is AccountEmployee {
  return "role" in employee;
}

function EmployeeForm({
  employee,
  allowActive,
  onDone,
}: {
  employee?: PublicEmployee;
  allowActive: boolean;
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
      {allowActive ? (
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
      ) : employee?.active ? (
        <input type="hidden" name="active" value="on" />
      ) : null}
      <Button type="submit" disabled={pending}>
        {employee ? "Salvar" : "Cadastrar"}
      </Button>
    </form>
  );
}

function CredentialDialog({
  trigger,
  title,
  description,
  submitLabel,
  onSubmit,
  children,
}: {
  trigger: ReactElement;
  title: string;
  description: string;
  submitLabel: string;
  onSubmit: (fields: Record<string, string>) => Promise<string | null>;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const fields = Object.fromEntries(
      Array.from(new FormData(form), ([name, value]) => [name, String(value)]),
    );

    startTransition(async () => {
      const failure = await onSubmit(fields);
      setError(failure);
      if (!failure) {
        form.reset();
        setOpen(false);
      }
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setError(null);
        setOpen(next);
      }}
    >
      <DialogTrigger render={trigger} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {children}
          {error ? (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          ) : null}
          <Button type="submit" disabled={pending} className="w-full">
            {submitLabel}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AccountActions({
  employee,
  actor,
  everyone,
}: {
  employee: AccountEmployee;
  actor: MatrixActor;
  everyone: AccountEmployee[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const showPromote = canPromoteToAdmin(employee);
  const showPromoteGeral = canPromoteToAdminGeral(actor, employee);
  const showDemote =
    canDemoteToFuncionario(actor, employee) &&
    !isLastActiveAdminGeralAmong(everyone, employee);
  const showReset = canResetPassword(actor, employee);

  if (!showPromote && !showPromoteGeral && !showDemote && !showReset) {
    return null;
  }

  function afterSuccess(message: string) {
    toast.success(message);
    router.refresh();
  }

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {showPromote ? (
        <CredentialDialog
          trigger={
            <Button type="button" size="sm" variant="outline">
              Promover a admin
            </Button>
          }
          title="Promover a admin"
          description="Username e senha inicial. Entregue fora do app."
          submitLabel="Promover"
          onSubmit={async (fields) => {
            const result = await promoteToAdmin({
              employeeId: employee.id,
              username: fields.username ?? "",
              password: fields.password ?? "",
            });
            if (result.error) return result.error;
            afterSuccess("Promovido a admin");
            return null;
          }}
        >
          <div className="space-y-2">
            <Label htmlFor={`promote-user-${employee.id}`}>Username</Label>
            <Input
              id={`promote-user-${employee.id}`}
              name="username"
              autoComplete="off"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`promote-pass-${employee.id}`}>Senha inicial</Label>
            <Input
              id={`promote-pass-${employee.id}`}
              name="password"
              type="password"
              autoComplete="new-password"
              required
            />
          </div>
        </CredentialDialog>
      ) : null}

      {showPromoteGeral ? (
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const result = await promoteToAdminGeral(employee.id);
              if (result.error) toast.error(result.error);
              else afterSuccess("Promovido a admin geral");
            })
          }
        >
          Promover a admin geral
        </Button>
      ) : null}

      {showDemote ? (
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={() => {
            if (!confirm(`Rebaixar ${employee.name} a funcionário?`)) return;
            startTransition(async () => {
              const result = await demoteToFuncionario(employee.id);
              if (result.error) toast.error(result.error);
              else afterSuccess("Rebaixado a funcionário");
            });
          }}
        >
          Rebaixar
        </Button>
      ) : null}

      {showReset ? (
        <CredentialDialog
          trigger={
            <Button type="button" size="sm" variant="outline">
              Trocar senha
            </Button>
          }
          title={`Trocar senha de ${employee.username}`}
          description="Não pede a senha atual. Todas as sessões dessa pessoa caem."
          submitLabel="Gravar senha"
          onSubmit={async (fields) => {
            const result = await resetEmployeePassword({
              employeeId: employee.id,
              newPassword: fields.newPassword ?? "",
            });
            if (result.error) return result.error;
            afterSuccess("Senha trocada");
            return null;
          }}
        >
          <div className="space-y-2">
            <Label htmlFor={`reset-pass-${employee.id}`}>Nova senha</Label>
            <Input
              id={`reset-pass-${employee.id}`}
              name="newPassword"
              type="password"
              autoComplete="new-password"
              required
            />
          </div>
        </CredentialDialog>
      ) : null}
    </div>
  );
}

export function EmployeesManager({
  employees,
  session,
}: {
  employees: PublicEmployee[] | AccountEmployee[];
  session: MatrixActor | null;
}) {
  const accounts = session
    ? (employees as AccountEmployee[])
    : null;

  return (
    <div className="space-y-6">
      {session ? (
        <SectionPanel title="Novo funcionário">
          <EmployeeForm allowActive />
        </SectionPanel>
      ) : null}

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
                {session ? (
                  <>
                    <TableHead>Username</TableHead>
                    <TableHead>Perfil</TableHead>
                    <TableHead />
                  </>
                ) : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map((employee) => {
                const account = isAccountEmployee(employee) ? employee : null;
                const canEdit =
                  session !== null &&
                  account !== null &&
                  canEditProfile(session, account);
                const allowActive =
                  session !== null &&
                  account !== null &&
                  canSetActive(session, account);

                return (
                  <TableRow key={employee.id}>
                    <TableCell>{employee.name}</TableCell>
                    <TableCell>
                      {preferenceLabels[employee.preference]}
                    </TableCell>
                    <TableCell>{employee.active ? "Sim" : "Não"}</TableCell>
                    {session && account ? (
                      <>
                        <TableCell>{account.username ?? "—"}</TableCell>
                        <TableCell>{roleLabels[account.role]}</TableCell>
                        <TableCell>
                          {canEdit ? (
                            <details>
                              <summary className="cursor-pointer text-sm text-primary">
                                Editar
                              </summary>
                              <div className="mt-3 min-w-64">
                                <EmployeeForm
                                  employee={employee}
                                  allowActive={allowActive}
                                />
                                <AccountActions
                                  employee={account}
                                  actor={session}
                                  everyone={accounts!}
                                />
                              </div>
                            </details>
                          ) : accounts ? (
                            <AccountActions
                              employee={account}
                              actor={session}
                              everyone={accounts}
                            />
                          ) : null}
                        </TableCell>
                      </>
                    ) : null}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </SectionPanel>
    </div>
  );
}
