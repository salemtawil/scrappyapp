"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import type { ComponentProps, ReactNode } from "react";

export function SubmitButton({
  children,
  pendingLabel = "Guardando…",
  ...props
}: ComponentProps<typeof Button> & { children: ReactNode; pendingLabel?: string }) {
  const { pending } = useFormStatus();

  return (
    <Button {...props} aria-busy={pending} disabled={pending || props.disabled} type="submit">
      {pending ? pendingLabel : children}
    </Button>
  );
}
