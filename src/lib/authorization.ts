import { and, eq, ne } from "drizzle-orm";
import { getCurrentSession, type SessionInfo } from "@/actions/auth";
import { getDb } from "@/db";
import { employees, type Employee } from "@/db/schema";

const WRITER_ROLES: ReadonlySet<SessionInfo["role"]> = new Set(["admin", "admin_geral"]);

/** Sessão válida de admin ou admin geral neste navegador, ou `null` para visitante. */
export async function currentWriter(): Promise<SessionInfo | null> {
  const session = await getCurrentSession();
  return session && WRITER_ROLES.has(session.role) ? session : null;
}

/** O alvo da matriz: quem é e como está hoje no banco. */
export type MatrixTarget = Pick<Employee, "id" | "role" | "active">;

export function isSelf(actor: SessionInfo, target: MatrixTarget): boolean {
  return target.id === actor.employeeId;
}

/** Só o admin geral mexe no acesso dos outros. */
export function isAdminGeral(actor: SessionInfo): boolean {
  return actor.role === "admin_geral";
}

/** Nome e preferência: no próprio cadastro sempre; no de outro admin, só o admin geral. */
export function canEditProfile(actor: SessionInfo, target: MatrixTarget): boolean {
  if (isSelf(actor, target)) return true;
  if (target.role === "funcionario") return true;
  return actor.role === "admin_geral";
}

/** Ativo: nunca no próprio cadastro; no de outro admin, só o admin geral. */
export function canSetActive(actor: SessionInfo, target: MatrixTarget): boolean {
  if (isSelf(actor, target)) return false;
  if (target.role === "funcionario") return true;
  return actor.role === "admin_geral";
}

/** Admin e admin geral entregam login para quem ainda está só na fila. */
export function canPromoteToAdmin(target: MatrixTarget): boolean {
  return target.role === "funcionario" && target.active;
}

/** Senha de outro admin sai sem a atual; a própria troca pede a senha atual, em outra tela. */
export function canResetPassword(actor: SessionInfo, target: MatrixTarget): boolean {
  return isAdminGeral(actor) && !isSelf(actor, target) && target.role !== "funcionario";
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
