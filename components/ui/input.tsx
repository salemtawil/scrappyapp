import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-md border border-emerald-950/15 bg-white px-3 text-sm text-emerald-950 shadow-sm placeholder:text-slate-400 focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/15",
        className,
      )}
      {...props}
    />
  );
}
