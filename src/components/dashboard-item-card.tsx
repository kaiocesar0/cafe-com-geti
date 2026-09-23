"use client";

import { useTransition } from "react";
import Link from "next/link";
import { Clock } from "lucide-react";
import { toast } from "sonner";
import { adjustItemStock } from "@/actions/items";
import { itemKindLabels } from "@/lib/labels";
import { ItemKindIcon } from "@/lib/item-icons";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ItemKind } from "@/db/schema";
import { cn } from "@/lib/utils";
import { stockSemaphore } from "@/lib/rotation";

const semaphoreStyles = {
  ok: "bg-primary/10 text-primary border-primary/20",
  warning: "bg-amber-50 text-amber-900 border-amber-200",
  critical: "bg-red-50 text-red-800 border-red-200",
} as const;

const semaphoreLabels = {
  ok: "Em dia",
  warning: "Baixo",
  critical: "Crítico",
} as const;

export function DashboardItemCard({
  item,
  nextPerson,
}: {
  item: {
    id: string;
    name: string;
    unitLabel: string;
    kind: ItemKind;
    stock: number;
  };
  nextPerson: string | null;
}) {
  const [pending, startTransition] = useTransition();
  const semaphore = stockSemaphore(item.stock);

  function handleDelta(delta: number) {
    startTransition(async () => {
      const result = await adjustItemStock(item.id, delta);
      if (result.error) {
        toast.error(result.error);
      }
    });
  }

  return (
    <article className="rounded-2xl border border-border/80 bg-card p-5 shadow-[0_1px_3px_rgba(26,88,69,0.08)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <ItemKindIcon kind={item.kind} className="size-5" />
          </div>
          <div>
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">
                {itemKindLabels[item.kind]}
              </span>
              <Badge
                variant="outline"
                className={cn("text-[10px]", semaphoreStyles[semaphore])}
              >
                {semaphoreLabels[semaphore]}
              </Badge>
            </div>
            <h3 className="text-lg font-semibold text-heading">{item.name}</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              <span className="text-2xl font-bold text-heading">{item.stock}</span>{" "}
              {item.unitLabel} em estoque
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-amber-200/80 bg-amber-50/80 px-4 py-3 dark:border-amber-900/50 dark:bg-amber-950/30">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-amber-900/80 dark:text-amber-200/80">
          <Clock className="size-3.5" aria-hidden />
          Próximo da vez
        </div>
        <p className="mt-1 font-semibold text-heading">
          {nextPerson ?? "Ninguém na fila"}
        </p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={() => handleDelta(-1)}
        >
          −1
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={() => handleDelta(1)}
        >
          +1
        </Button>
        <Link
          href={`/contribuir?itemId=${item.id}`}
          className={cn(buttonVariants({ size: "sm" }))}
        >
          Contribuir
        </Link>
      </div>
    </article>
  );
}
