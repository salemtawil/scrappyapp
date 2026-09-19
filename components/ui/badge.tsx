import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type BadgeTone = "neutral" | "brand" | "live" | "warning" | "danger";

const tones: Record<BadgeTone, string> = {
  brand: "border-brand/25 bg-brand-soft text-brand-strong",
  danger: "border-danger/30 bg-danger-soft text-danger",
  live: "border-brand-strong/30 bg-brand-strong text-white",
  neutral: "border-line bg-surface-muted text-muted-foreground",
  warning: "border-warning/30 bg-warning-soft text-warning",
};

export function Badge({
  className,
  tone = "brand",
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
