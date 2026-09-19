"use client";

import { LogIn } from "lucide-react";
import { useActionState } from "react";
import { joinByCodeAction } from "@/app/join/actions";
import { Alert } from "@/components/ui/alert";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { idleFormState } from "@/lib/validation/form-state";

export function JoinForm() {
  const [state, formAction] = useActionState(joinByCodeAction, idleFormState);

  return (
    <form action={formAction} className="rounded-xl border border-line bg-surface p-3 shadow-sm">
      <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
        <Field
          error={state.fieldErrors?.code}
          htmlFor="code"
          label="Entrar con código"
          description="El código que comparte quien organiza, o el de una organización."
        >
          {(props) => (
            <Input
              {...props}
              autoCapitalize="characters"
              autoComplete="off"
              name="code"
              placeholder="PADEL8"
            />
          )}
        </Field>
        {/* No se llama solo "Entrar": la cabecera ya tiene un "Entrar" de sesión
            y dos botones con el mismo nombre accesible confunden en pantalla y con lector. */}
        <SubmitButton className="w-full sm:w-auto" pendingLabel="Buscando…">
          <LogIn size={16} />
          Entrar a la sala
        </SubmitButton>
      </div>
      {state.status === "error" && state.message && (
        <div className="mt-3">
          <Alert tone="error">{state.message}</Alert>
        </div>
      )}
    </form>
  );
}
