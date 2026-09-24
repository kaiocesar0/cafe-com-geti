"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Coffee,
  History,
  LayoutDashboard,
  Package,
  PlusCircle,
  Users,
} from "lucide-react";
import {
  AdminSessionMenu,
  type HeaderSession,
} from "@/components/admin-session-menu";
import { MobileNavDrawer } from "@/components/mobile-nav-drawer";
import { ThemeToggle } from "@/components/theme-toggle";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/contribuir", label: "Contribuir", icon: PlusCircle },
  { href: "/historico", label: "Histórico", icon: History },
  { href: "/funcionarios", label: "Funcionários", icon: Users },
  { href: "/itens", label: "Itens", icon: Package },
] as const;

export function AppHeader({ session }: { session: HeaderSession | null }) {
  const currentPath = usePathname();
  const isMobile = useIsMobile();
  const showMobileMenu = isMobile !== false;

  return (
    <header className="sticky top-0 z-50 bg-header text-header-foreground shadow-md">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3 lg:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-lg bg-white/15">
            <Coffee className="size-5" aria-hidden />
          </div>
          <div className={cn(showMobileMenu ? "block" : "hidden sm:block")}>
            <p className="text-sm font-semibold leading-tight">Café com Geti</p>
            <p className="text-[11px] text-white/70">Estoque da copa</p>
          </div>
        </Link>

        {showMobileMenu ? (
          <div className="ml-auto flex items-center gap-2">
            <AdminSessionMenu session={session} />
            <ThemeToggle className="shrink-0 border-white/25 bg-white/10 text-white hover:bg-white/20" />
            <MobileNavDrawer links={links} />
          </div>
        ) : (
          <>
            <nav className="flex min-w-0 flex-1 justify-center">
              <div className="flex gap-1">
                {links.map((link) => {
                  const active = currentPath === link.href;
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors",
                        active
                          ? "bg-header-active text-white shadow-sm"
                          : "text-white/85 hover:bg-white/10 hover:text-white",
                      )}
                    >
                      <Icon className="size-4 shrink-0" aria-hidden />
                      {link.label}
                    </Link>
                  );
                })}
              </div>
            </nav>

            <div className="flex shrink-0 items-center gap-2">
              <AdminSessionMenu session={session} />
              <ThemeToggle className="shrink-0 border-white/25 bg-white/10 text-white hover:bg-white/20" />
            </div>
          </>
        )}
      </div>
    </header>
  );
}
