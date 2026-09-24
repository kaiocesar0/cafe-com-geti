import { getCurrentSession, type SessionInfo } from "@/actions/auth";

const WRITER_ROLES: ReadonlySet<SessionInfo["role"]> = new Set(["admin", "admin_geral"]);

/** Sessão válida de admin ou admin geral neste navegador, ou `null` para visitante. */
export async function currentWriter(): Promise<SessionInfo | null> {
  const session = await getCurrentSession();
  return session && WRITER_ROLES.has(session.role) ? session : null;
}
