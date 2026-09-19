import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Etiqueta + ayuda + error, atados con aria-describedby para que un lector de
 * pantalla anuncie el fallo del campo en vez de dejarlo solo como color.
 */
export function Field({
  children,
  className,
  description,
  error,
  htmlFor,
  label,
  optional,
}: {
  children: (props: { "aria-describedby"?: string; "aria-invalid"?: boolean; id: string }) => ReactNode;
  className?: string;
  description?: string;
  error?: string;
  htmlFor: string;
  label: string;
  optional?: boolean;
}) {
  const describedBy = [description ? `${htmlFor}-hint` : null, error ? `${htmlFor}-error` : null]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={cn("space-y-1.5", className)}>
      <label className="flex items-baseline gap-2 text-sm font-semibold text-foreground" htmlFor={htmlFor}>
        {label}
        {optional && <span className="text-xs font-normal text-muted-foreground">opcional</span>}
      </label>
      {children({
        "aria-describedby": describedBy || undefined,
        "aria-invalid": error ? true : undefined,
        id: htmlFor,
      })}
      {description && (
        <p className="text-xs leading-5 text-muted-foreground" id={`${htmlFor}-hint`}>
          {description}
        </p>
      )}
      {error && (
        <p className="text-xs font-semibold leading-5 text-danger" id={`${htmlFor}-error`}>
          {error}
        </p>
      )}
    </div>
  );
}
