import Link from "next/link";
import { Users } from "lucide-react";
import { SectionPanel } from "@/components/section-panel";
import { buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { RankedQueueEntry } from "@/lib/rotation";
import { formatDateSaoPaulo } from "@/lib/timezone";
import { cn } from "@/lib/utils";

function formatLastContribution(value: Date | string | null): string {
  if (value === null) return "Nunca";
  const date = value instanceof Date ? value : new Date(value);
  return formatDateSaoPaulo(date);
}

export function DashboardContributionQueue({
  items,
  selectedItemId,
  unitLabel,
  queue,
}: {
  items: { id: string; name: string }[];
  selectedItemId: string;
  unitLabel: string;
  queue: RankedQueueEntry[];
}) {
  return (
    <SectionPanel
      title="Fila de contribuição"
      description="Ordenado por: menos quantidade neste item; empate: mais tempo sem trazer"
      icon={<Users className="size-5" />}
    >
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Item da fila">
          {items.map((item) => {
            const selected = item.id === selectedItemId;
            return (
              <Link
                key={item.id}
                href={`/?item=${item.id}`}
                role="tab"
                aria-selected={selected}
                className={cn(
                  buttonVariants({
                    variant: selected ? "default" : "outline",
                    size: "sm",
                  }),
                )}
              >
                {item.name}
              </Link>
            );
          })}
        </div>

        {queue.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground">
            Ninguém na fila deste item
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Última contribuição</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {queue.map((entry, index) => (
                <TableRow
                  key={entry.employee.id}
                  className={cn(
                    index === 0 &&
                      "border-l-2 border-l-primary bg-primary/5 hover:bg-primary/10",
                  )}
                >
                  <TableCell className="font-medium tabular-nums">
                    {index + 1}
                  </TableCell>
                  <TableCell>{entry.employee.name}</TableCell>
                  <TableCell>
                    {entry.totalQuantity} {unitLabel}
                  </TableCell>
                  <TableCell>
                    {formatLastContribution(entry.lastContributedAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </SectionPanel>
  );
}
