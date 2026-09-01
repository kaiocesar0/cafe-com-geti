import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function SectionPanel({
  title,
  description,
  children,
  className,
  icon,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  icon?: ReactNode;
}) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-2xl border border-border/80 bg-card shadow-[0_1px_3px_rgba(26,88,69,0.08)]",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3 border-b border-border/60 px-5 py-4">
        <div className="flex items-start gap-3">
          {icon ? (
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              {icon}
            </div>
          ) : null}
          <div>
            <h3 className="text-base font-semibold text-heading">{title}</h3>
            {description ? (
              <p className="mt-0.5 text-sm text-muted-foreground">
                {description}
              </p>
            ) : null}
          </div>
        </div>
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}
