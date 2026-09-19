import { z } from "zod";

export type FormStatus = "idle" | "error" | "success" | "confirm";

export interface FormState {
  status: FormStatus;
  /** Mensaje general; los errores de campo se muestran junto al campo. */
  message?: string;
  fieldErrors?: Record<string, string>;
  /** Datos extra que la UI necesita para resolver un conflicto o una confirmación. */
  details?: Record<string, string | number | boolean>;
}

export const idleFormState: FormState = { status: "idle" };

export function fieldErrorsFrom(error: z.ZodError): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    fieldErrors[key] ??= issue.message;
  }
  return fieldErrors;
}

export function errorState(message: string, fieldErrors?: Record<string, string>): FormState {
  return { fieldErrors, message, status: "error" };
}

export function successState(message?: string, details?: FormState["details"]): FormState {
  return { details, message, status: "success" };
}
