import { NextResponse, type NextRequest } from "next/server";
import { slideSessionForProxy } from "@/lib/current-session";
import { SESSION_COOKIE_NAME } from "@/lib/session";

/**
 * Navegação de página passa por aqui antes do render de RSC, onde `cookies().set`
 * não grava. Renova banco e cookie juntos quando há sessão.
 */
export async function proxy(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return NextResponse.next();

  const result = await slideSessionForProxy(token);
  const response = NextResponse.next();

  if (result.ok) {
    response.cookies.set(result.cookie);
  } else if (result.clear) {
    response.cookies.delete(SESSION_COOKIE_NAME);
  }

  return response;
}

export const config = {
  matcher: [
    {
      // Páginas e Server Actions; sem estáticos. Só corre se o cookie de sessão existir.
      source: "/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)",
      has: [{ type: "cookie", key: "cafe_sessao" }],
    },
  ],
};
