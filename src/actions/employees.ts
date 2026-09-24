"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { employees, type AccountEmployee, type PublicEmployee } from "@/db/schema";
import { SIGN_IN_REQUIRED } from "@/lib/auth-messages";
import { currentWriter } from "@/lib/authorization";
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
  await db.update(employees).set(parsed.data).where(eq(employees.id, id));
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
  if (!(await currentWriter())) return { error: SIGN_IN_REQUIRED };

  const db = getDb();
  const [current] = await db.select().from(employees).where(eq(employees.id, id));
  if (!current) return { error: "Funcionário não encontrado" };

  await db.update(employees).set({ active }).where(eq(employees.id, id));
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
