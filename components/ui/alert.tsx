import { AlertTriangle, CheckCircle2, CircleAlert, Info } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type AlertTone = "info" | "success" | "warning" | "error";

const tones: Record<AlertTone, { className: string; icon: ReactNode }> = {
  error: { className: "border-danger/30 bg-danger-soft text-danger", icon: <CircleAlert size={18} /> },
  info: { className: "border-info/20 bg-info-soft text-info", icon: <Info size={18} /> },
  success: { className: "border-brand/25 bg-brand-soft text-brand-strong", icon: <CheckCircle2 size={18} /> },
  warning: { className: "border-warning/30 bg-warning-soft text-warning", icon: <AlertTriangle size={18} /> },
};

export function Alert({
  children,
  className,
  title,
  tone = "info",
}: {
  children?: ReactNode;
  className?: string;
  title?: string;
  tone?: AlertTone;
}) {
  const isLive = tone === "error" || tone === "warning";

  return (
    <div
      className={cn("flex gap-3 rounded-lg border px-3 py-3 text-sm", tones[tone].className, className)}
      role={isLive ? "alert" : "status"}
    >
      <span aria-hidden className="mt-0.5 shrink-0">
        {tones[tone].icon}
      </span>
      <div className="min-w-0 space-y-1">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className="leading-6">{children}</div>}
      </div>
    </div>
  );
}
