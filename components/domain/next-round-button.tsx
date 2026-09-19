"use client";

import { Sparkles } from "lucide-react";
import { useActionState } from "react";
import { generateNextRoundAction } from "@/app/competitions/actions";
import { Alert } from "@/components/ui/alert";
import { SubmitButton } from "@/components/ui/submit-button";
import { idleFormState } from "@/lib/validation/form-state";

export function NextRoundButton({
  competitionId,
  disabledReason,
  formatLabel,
}: {
  competitionId: string;
  disabledReason?: string;
  formatLabel: string;
}) {
  const [state, formAction] = useActionState(generateNextRoundAction, idleFormState);

  return (
    <form action={formAction} className="space-y-2">
      <input name="competitionId" type="hidden" value={competitionId} />
      <SubmitButton
        className="w-full"
        disabled={Boolean(disabledReason)}
        pendingLabel="Emparejando…"
        size="lg"
      >
        <Sparkles size={18} />
        Generar siguiente ronda
      </SubmitButton>
      {disabledReason ? (
        <p className="text-xs leading-5 text-muted-foreground">{disabledReason}</p>
      ) : (
        <p className="text-xs leading-5 text-muted-foreground">
          {formatLabel} empareja la siguiente ronda con la clasificación actual.
        </p>
      )}
      {state.status === "error" && state.message && <Alert tone="error">{state.message}</Alert>}
      {state.status === "success" && state.message && <Alert tone="success">{state.message}</Alert>}
    </form>
  );
}
