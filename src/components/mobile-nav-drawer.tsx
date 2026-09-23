"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { Menu, X, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type MobileNavLink = {
  href: string;
  label: string;
  icon: LucideIcon;
};

type MobileNavDrawerProps = {
  links: readonly MobileNavLink[];
};

export function MobileNavDrawer({ links }: MobileNavDrawerProps) {
  const [open, setOpen] = useState(false);
  const currentPath = usePathname();

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Trigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="border border-white/25 bg-white/10 text-white hover:bg-white/20"
            aria-label="Abrir menu"
          />
        }
      >
        <Menu className="size-5" />
      </DialogPrimitive.Trigger>

      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop
          className={cn(
            "fixed inset-0 z-50 bg-black/40",
            "data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0",
          )}
        />

        <DialogPrimitive.Popup
          className={cn(
            "fixed inset-y-0 right-0 z-50 flex w-[min(100%,18rem)] flex-col bg-primary text-primary-foreground shadow-2xl outline-none",
            "data-open:animate-in data-open:slide-in-from-right data-closed:animate-out data-closed:slide-out-to-right",
            "duration-300",
          )}
        >
          <div className="flex items-center justify-between border-b border-white/15 px-5 py-4">
            <DialogPrimitive.Title className="text-lg font-semibold">
              Menu
            </DialogPrimitive.Title>
            <DialogPrimitive.Close
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-primary-foreground hover:bg-white/10"
                  aria-label="Fechar menu"
                />
              }
            >
              <X className="size-5" />
            </DialogPrimitive.Close>
          </div>

          <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
            {links.map((link) => {
              const active = currentPath === link.href;
              const Icon = link.icon;

              return (
                <DialogPrimitive.Close
                  key={link.href}
                  render={
                    <Link
                      href={link.href}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-4 py-3 text-base font-medium transition-colors",
                        active
                          ? "bg-white/20 text-white"
                          : "text-white/90 hover:bg-white/10 hover:text-white",
                      )}
                    />
                  }
                >
                  <Icon className="size-5 shrink-0" aria-hidden />
                  {link.label}
                </DialogPrimitive.Close>
              );
            })}
          </nav>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
