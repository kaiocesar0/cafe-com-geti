"use server";

import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { employees, type Preference } from "@/db/schema";
import { hashPassword, MIN_PASSWORD_LENGTH, PASSWORD_ERROR } from "@/lib/password";
import { parseUsername } from "@/lib/username";

export type CreateAccountResult = {
  error?: string;
  employeeId?: string;
};

const USERNAME_TAKEN = "Username já está em uso";

export async function createFirstAdminGeral(input: {
  name: string;
  preference: Preference;
  username: string;
  password: string;
}): Promise<CreateAccountResult> {
  const name = input.name.trim();
  if (!name) return { error: "Nome é obrigatório" };

  const { username, error } = parseUsername(input.username);
  if (!username) return { error };

  if (input.password.length < MIN_PASSWORD_LENGTH) return { error: PASSWORD_ERROR };

  const db = getDb();
  const [taken] = await db
    .select({ id: employees.id })
    .from(employees)
    .where(eq(employees.username, username));
  if (taken) return { error: USERNAME_TAKEN };

  const passwordHash = await hashPassword(input.password);

  try {
    const [created] = await db
      .insert(employees)
      .values({
        name,
        preference: input.preference,
        active: true,
        role: "admin_geral",
        username,
        passwordHash,
      })
      .returning({ id: employees.id });
    return { employeeId: created.id };
  } catch (cause) {
    if (isUniqueViolation(cause)) return { error: USERNAME_TAKEN };
    throw cause;
  }
}

function isUniqueViolation(cause: unknown): boolean {
  return (
    typeof cause === "object" &&
    cause !== null &&
    "code" in cause &&
    (cause as { code?: string }).code === "23505"
  );
}
