import type { ItemKind } from "@/db/schema";
import { Coffee, Droplets, Filter } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const itemKindIcons: Record<ItemKind, LucideIcon> = {
  coffee: Coffee,
  milk: Droplets,
  filter: Filter,
};

export function ItemKindIcon({
  kind,
  className,
}: {
  kind: ItemKind;
  className?: string;
}) {
  const Icon = itemKindIcons[kind];
  return <Icon className={className} aria-hidden />;
}
