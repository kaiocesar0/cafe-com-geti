import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { sessions } from "@/db/schema";

type Db = ReturnType<typeof getDb>;

/** Consulta pronta para entrar num `batch`: derruba o que a pessoa tem aberto em qualquer navegador. */
export function deleteAllSessionsOf(db: Db, employeeId: string) {
  return db.delete(sessions).where(eq(sessions.employeeId, employeeId));
}
