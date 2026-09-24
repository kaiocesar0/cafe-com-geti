import { and, eq, ne } from "drizzle-orm";
import { getCurrentSession, type SessionInfo } from "@/actions/auth";
import { getDb } from "@/db";
import { employees, type Employee } from "@/db/schema";
import type { MatrixTarget } from "@/lib/role-matrix";

const WRITER_ROLES: ReadonlySet<SessionInfo["role"]> = new Set(["admin", "admin_geral"]);

/** Sessão válida de admin ou admin geral neste navegador, ou `null` para visitante. */
export async function currentWriter(): Promise<SessionInfo | null> {
  const session = await getCurrentSession();
  return session && WRITER_ROLES.has(session.role) ? session : null;
}

/**
 * A copa não pode ficar sem quem administra os logins.
 *
 * Hoje quem chama já é admin geral ativo, então só o próprio cadastro chega aqui como último,
 * e "ninguém se rebaixa nem se inativa" barraria do mesmo jeito. A regra fica explícita para
 * a garantia sobreviver a quem afrouxar aquela.
 */
export async function isLastActiveAdminGeral(target: MatrixTarget): Promise<boolean> {
  if (target.role !== "admin_geral" || !target.active) return false;

  const [another] = await getDb()
    .select({ id: employees.id })
    .from(employees)
    .where(
      and(
        eq(employees.role, "admin_geral"),
        eq(employees.active, true),
        ne(employees.id, target.id),
      ),
    )
    .limit(1);

  return !another;
}

export async function findEmployee(id: string): Promise<Employee | undefined> {
  const [row] = await getDb().select().from(employees).where(eq(employees.id, id));
  return row;
}
