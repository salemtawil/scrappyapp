import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "md" | "lg";

/** Altura mínima de 44 px: objetivo táctil usable con una mano y con guantes de frío. */
const sizes: Record<ButtonSize, string> = {
  md: "h-11 px-4 text-sm",
  lg: "h-13 px-5 text-base",
};

export function Button({
  className,
  size = "md",
  variant = "primary",
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { size?: ButtonSize; variant?: ButtonVariant }) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors disabled:pointer-events-none disabled:opacity-55",
        sizes[size],
        variant === "primary" && "bg-brand text-white hover:bg-brand-strong",
        variant === "secondary" && "border border-line bg-surface text-foreground hover:bg-surface-muted",
        variant === "ghost" && "text-foreground hover:bg-surface-muted",
        variant === "danger" && "bg-danger text-white hover:brightness-90",
        className,
      )}
      type={type}
      {...props}
    />
  );
}
