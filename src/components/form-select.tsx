import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function FormSelect({
  name,
  defaultValue,
  required,
  children,
  className,
}: {
  name: string;
  defaultValue?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <select
      name={name}
      defaultValue={defaultValue}
      required={required}
      className={cn(
        "border-input bg-background ring-offset-background focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs focus-visible:ring-2 focus-visible:outline-none",
        className,
      )}
    >
      {children}
    </select>
  );
}
