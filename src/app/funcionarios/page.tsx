import { listEmployees } from "@/actions/employees";
import { EmployeesManager } from "@/components/employees-manager";
import { PageHeader } from "@/components/page-header";
import { currentWriter } from "@/lib/authorization";

export const dynamic = "force-dynamic";

export default async function FuncionariosPage() {
  const session = await currentWriter();
  const employees = await listEmployees();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Funcionários"
        description="Preferência de consumo e participação no rodízio"
      />
      <EmployeesManager
        employees={employees}
        session={
          session && {
            employeeId: session.employeeId,
            role: session.role,
          }
        }
      />
    </div>
  );
}
