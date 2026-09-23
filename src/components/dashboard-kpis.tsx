import type { ReactNode } from "react";
import { AlertTriangle, Package, Users } from "lucide-react";
import { cn } from "@/lib/utils";

type KpiCardProps = {
  label: string;
  value: number | string;
  hint?: string;
  icon: ReactNode;
  iconClassName?: string;
  badge?: string;
  badgeClassName?: string;
  highlighted?: boolean;
};

function KpiCard({
  label,
  value,
  hint,
  icon,
  iconClassName,
  badge,
  badgeClassName,
  highlighted,
}: KpiCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border bg-card p-4 shadow-[0_1px_3px_rgba(26,88,69,0.08)]",
        highlighted ? "border-primary/40 ring-1 ring-primary/20" : "border-border/80",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div
          className={cn(
            "flex size-10 items-center justify-center rounded-xl",
            iconClassName,
          )}
        >
          {icon}
        </div>
        {badge ? (
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
              badgeClassName,
            )}
          >
            {badge}
          </span>
        ) : null}
      </div>
      <p className="mt-3 text-sm text-muted-foreground">{label}</p>
      <p className="text-3xl font-bold text-heading">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function DashboardKpis({
  itemCount,
  lowStockCount,
  criticalCount,
  activeEmployees,
}: {
  itemCount: number;
  lowStockCount: number;
  criticalCount: number;
  activeEmployees: number;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <KpiCard
        label="Itens cadastrados"
        value={itemCount}
        hint="Produtos na copa"
        icon={<Package className="size-5" />}
        iconClassName="bg-primary/15 text-primary"
        badge="Total"
        badgeClassName="bg-primary text-primary-foreground"
        highlighted
      />
      <KpiCard
        label="Estoque baixo"
        value={lowStockCount}
        hint="Itens com ≤ 1 unidade"
        icon={<AlertTriangle className="size-5" />}
        iconClassName="bg-amber-100 text-amber-800"
        badge="Atenção"
        badgeClassName="bg-amber-100 text-amber-900"
      />
      <KpiCard
        label="Sem estoque"
        value={criticalCount}
        hint="Precisa repor agora"
        icon={<AlertTriangle className="size-5" />}
        iconClassName="bg-red-100 text-red-700"
        badge="Crítico"
        badgeClassName="bg-red-100 text-red-800"
      />
      <KpiCard
        label="Funcionários ativos"
        value={activeEmployees}
        hint="No rodízio"
        icon={<Users className="size-5" />}
        iconClassName="bg-[#66898c]/20 text-[#66898c]"
        badge="Equipe"
        badgeClassName="bg-secondary text-secondary-foreground"
      />
    </div>
  );
}
