"use client";

import { useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { adjustItemStock } from "@/actions/items";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ItemKind } from "@/db/schema";
import { cn } from "@/lib/utils";
import { stockSemaphore } from "@/lib/rotation";

const semaphoreStyles = {
  ok: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
  warning: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
  critical: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200",
} as const;

const semaphoreLabels = {
  ok: "OK",
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
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-2">
        <div>
          <CardTitle>{item.name}</CardTitle>
          <CardDescription>
            {item.stock} {item.unitLabel}
          </CardDescription>
        </div>
        <Badge className={semaphoreStyles[semaphore]}>
          {semaphoreLabels[semaphore]}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-md border bg-muted/40 p-3">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Próximo da vez
          </p>
          <p className="font-medium">
            {nextPerson ?? "Ninguém na fila"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
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
      </CardContent>
    </Card>
  );
}
