"use client";

import { Building2 } from "lucide-react";
import { useActionState } from "react";
import { createClubAction } from "@/app/clubs/actions";
import { Alert } from "@/components/ui/alert";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { idleFormState } from "@/lib/validation/form-state";

export function CreateClubForm() {
  const [state, formAction] = useActionState(createClubAction, idleFormState);

  return (
    <form action={formAction} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
      <Field error={state.fieldErrors?.name} htmlFor="clubName" label="Nombre">
        {(props) => <Input {...props} autoComplete="organization" name="name" placeholder="Club Compinche" />}
      </Field>
      <Field error={state.fieldErrors?.city} htmlFor="clubCity" label="Ciudad" optional>
        {(props) => <Input {...props} name="city" placeholder="Caracas" />}
      </Field>
      <SubmitButton className="w-full sm:w-auto" pendingLabel="Creando…">
        <Building2 size={16} />
        Crear
      </SubmitButton>
      {state.status === "error" && state.message && (
        <div className="sm:col-span-3">
          <Alert tone="error">{state.message}</Alert>
        </div>
      )}
    </form>
  );
}
