import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  className,
}: {
  title: string;
  description?: string;
  className?: string;
}) {
  return (
    <header className={cn("space-y-1", className)}>
      <h2 className="text-3xl font-bold tracking-tight text-heading">
        {title}
      </h2>
      {description ? (
        <p className="text-base text-muted-foreground">{description}</p>
      ) : null}
    </header>
  );
}
