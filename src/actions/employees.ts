"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { employees } from "@/db/schema";
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

export async function listEmployees() {
  const db = getDb();
  return db.select().from(employees).orderBy(employees.createdAt);
}
