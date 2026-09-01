import { listEmployees } from "@/actions/employees";
import { EmployeesManager } from "@/components/employees-manager";

export const dynamic = "force-dynamic";

export default async function FuncionariosPage() {
  const employees = await listEmployees();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Funcionários</h2>
        <p className="text-muted-foreground">
          Preferência de consumo e participação no rodízio
        </p>
      </div>
      <EmployeesManager employees={employees} />
    </div>
  );
}
