"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import type { SessionInfo } from "@/actions/auth";
import { getDb } from "@/db";
import {
  employees,
  type AccountEmployee,
  type Preference,
  type PublicEmployee,
} from "@/db/schema";
import { NO_PERMISSION, SIGN_IN_REQUIRED } from "@/lib/auth-messages";
import { currentWriter, findEmployee, isLastActiveAdminGeral } from "@/lib/authorization";
import { canEditProfile, canSetActive, type MatrixTarget } from "@/lib/role-matrix";
import { deleteAllSessionsOf } from "@/lib/session-service";
import { z } from "zod";

const employeeSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  preference: z.enum(["coffee", "milk", "both"]),
  active: z.boolean(),
});

export type EmployeeActionState = {
  error?: string;
  success?: boolean;
};

const EMPLOYEE_NOT_FOUND = "Funcionário não encontrado";

/**
 * A matriz em uma passada: `null` libera a gravação, string é o motivo que volta para a tela.
 * Perfil e username não saem daqui; quem mexe neles são as operações de promover e rebaixar.
 */
async function denyEmployeeWrite(
  actor: SessionInfo,
  target: MatrixTarget,
  nextActive: boolean,
): Promise<string | null> {
  if (!canEditProfile(actor, target)) return NO_PERMISSION;
  if (nextActive === target.active) return null;
  if (!nextActive && (await isLastActiveAdminGeral(target))) return NO_PERMISSION;
  if (!canSetActive(actor, target)) return NO_PERMISSION;
  return null;
}

/** Quem perde o acesso perde junto o que tem aberto em qualquer navegador. */
async function applyEmployeeChange(
  target: MatrixTarget,
  change: { name?: string; preference?: Preference; active: boolean },
) {
  const db = getDb();
  const update = db.update(employees).set(change).where(eq(employees.id, target.id));

  if (target.active && !change.active) {
    await db.batch([update, deleteAllSessionsOf(db, target.id)]);
    return;
  }
  await update;
}

export async function createEmployee(
  _prev: EmployeeActionState,
  formData: FormData,
): Promise<EmployeeActionState> {
  if (!(await currentWriter())) return { error: SIGN_IN_REQUIRED };

  const parsed = employeeSchema.safeParse({
    name: formData.get("name"),
    preference: formData.get("preference"),
    active: formData.get("active") === "on",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const db = getDb();
  await db.insert(employees).values(parsed.data);
  revalidatePath("/funcionarios");
  revalidatePath("/");
  return { success: true };
}

export async function updateEmployee(
  id: string,
  _prev: EmployeeActionState,
  formData: FormData,
): Promise<EmployeeActionState> {
  const actor = await currentWriter();
  if (!actor) return { error: SIGN_IN_REQUIRED };

  const parsed = employeeSchema.safeParse({
    name: formData.get("name"),
    preference: formData.get("preference"),
    active: formData.get("active") === "on",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const target = await findEmployee(id);
  if (!target) return { error: EMPLOYEE_NOT_FOUND };

  const denial = await denyEmployeeWrite(actor, target, parsed.data.active);
  if (denial) return { error: denial };

  await applyEmployeeChange(target, parsed.data);
  revalidatePath("/funcionarios");
  revalidatePath("/");
  revalidatePath("/contribuir");
  revalidatePath("/historico");
  return { success: true };
}

export async function setEmployeeActive(
  id: string,
  active: boolean,
): Promise<EmployeeActionState> {
  const actor = await currentWriter();
  if (!actor) return { error: SIGN_IN_REQUIRED };

  const target = await findEmployee(id);
  if (!target) return { error: EMPLOYEE_NOT_FOUND };

  const denial = await denyEmployeeWrite(actor, target, active);
  if (denial) return { error: denial };

  await applyEmployeeChange(target, { active });
  revalidatePath("/funcionarios");
  revalidatePath("/");
  revalidatePath("/contribuir");
  revalidatePath("/historico");
  return { success: true };
}

const publicColumns = {
  id: employees.id,
  name: employees.name,
  preference: employees.preference,
  active: employees.active,
  createdAt: employees.createdAt,
};

/** Visitante recebe só o público; username e perfil só com sessão de admin ou admin geral. */
export async function listEmployees(): Promise<PublicEmployee[] | AccountEmployee[]> {
  const db = getDb();
  if (!(await currentWriter())) {
    return db.select(publicColumns).from(employees).orderBy(employees.createdAt);
  }
  return db
    .select({ ...publicColumns, role: employees.role, username: employees.username })
    .from(employees)
    .orderBy(employees.createdAt);
}
