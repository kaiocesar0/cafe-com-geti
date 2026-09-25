import type { Employee, EmployeeRole } from "@/db/schema";

/** Quem chamou: o que a sessão precisa expor para a matriz, na tela ou no servidor. */
export type MatrixActor = { employeeId: string; role: EmployeeRole };

/** O alvo da matriz: quem é e como está hoje no banco. */
export type MatrixTarget = Pick<Employee, "id" | "role" | "active">;

export function isSelf(actor: MatrixActor, target: MatrixTarget): boolean {
  return target.id === actor.employeeId;
}

/** Só o admin geral mexe no acesso dos outros. */
export function isAdminGeral(actor: MatrixActor): boolean {
  return actor.role === "admin_geral";
}

/** Nome e preferência: no próprio cadastro sempre; no de outro admin, só o admin geral. */
export function canEditProfile(actor: MatrixActor, target: MatrixTarget): boolean {
  if (isSelf(actor, target)) return true;
  if (target.role === "funcionario") return true;
  return actor.role === "admin_geral";
}

/** Ativo: nunca no próprio cadastro; no de outro admin, só o admin geral. */
export function canSetActive(actor: MatrixActor, target: MatrixTarget): boolean {
  if (isSelf(actor, target)) return false;
  if (target.role === "funcionario") return true;
  return actor.role === "admin_geral";
}

/** Admin e admin geral entregam login para quem ainda está só na fila. */
export function canPromoteToAdmin(target: MatrixTarget): boolean {
  return target.role === "funcionario" && target.active;
}

/** Amplia o acesso de quem já entra; funcionário passa antes por admin. */
export function canPromoteToAdminGeral(actor: MatrixActor, target: MatrixTarget): boolean {
  return isAdminGeral(actor) && target.role === "admin";
}

/** Senha de outro admin sai sem a atual; a própria troca pede a senha atual, em outra tela. */
export function canResetPassword(actor: MatrixActor, target: MatrixTarget): boolean {
  return isAdminGeral(actor) && !isSelf(actor, target) && target.role !== "funcionario";
}

/** Rebaixa a funcionário: só admin geral, nunca a si. O último admin geral ativo fica fora na chamada. */
export function canDemoteToFuncionario(actor: MatrixActor, target: MatrixTarget): boolean {
  return isAdminGeral(actor) && !isSelf(actor, target) && target.role !== "funcionario";
}

/**
 * A mesma garantia que o servidor busca no banco, aqui sobre a lista que a tela já tem.
 * Serve para esconder o botão; quem recusa de verdade continua sendo a operação.
 */
export function isLastActiveAdminGeralAmong(
  everyone: readonly MatrixTarget[],
  target: MatrixTarget,
): boolean {
  if (target.role !== "admin_geral" || !target.active) return false;
  return !everyone.some(
    (other) => other.id !== target.id && other.role === "admin_geral" && other.active,
  );
}
