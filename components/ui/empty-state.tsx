import type { ReactNode } from "react";

export function EmptyState({
  action,
  description,
  title,
}: {
  action?: ReactNode;
  description: string;
  title: string;
}) {
  return (
    <div className="rounded-lg border border-dashed border-line bg-surface-muted/60 px-4 py-8 text-center">
      <p className="font-semibold text-foreground">{title}</p>
      <p className="mx-auto mt-1 max-w-sm text-sm leading-6 text-muted-foreground">{description}</p>
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}
