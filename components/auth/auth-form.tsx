"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { AuthActionState } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type AuthFormProps = {
  action: (state: AuthActionState, formData: FormData) => Promise<AuthActionState>;
  mode: "login" | "sign-up";
  next: string;
};

const initialState: AuthActionState = {};

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <Button className="w-full" disabled={pending} type="submit">
      {pending ? "Procesando..." : label}
    </Button>
  );
}

export function AuthForm({ action, mode, next }: AuthFormProps) {
  const [state, formAction] = useActionState(action, initialState);
  const isLogin = mode === "login";

  return (
    <form action={formAction} className="space-y-4">
      <input name="next" type="hidden" value={next} />
      {!isLogin && (
        <label className="block space-y-1 text-sm font-medium text-emerald-950">
          Nombre visible
          <Input autoComplete="name" name="displayName" placeholder="Nombre visible" required />
        </label>
      )}
      <label className="block space-y-1 text-sm font-medium text-emerald-950">
        Correo
        <Input autoComplete="email" name="email" placeholder="correo@club.com" required type="email" />
      </label>
      <label className="block space-y-1 text-sm font-medium text-emerald-950">
        Contrasena
        <Input autoComplete={isLogin ? "current-password" : "new-password"} name="password" required type="password" />
      </label>
      {state.message && (
        <p
          className={
            state.success
              ? "rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800"
              : "rounded-md bg-red-50 px-3 py-2 text-sm text-red-700"
          }
        >
          {state.message}
        </p>
      )}
      <SubmitButton label={isLogin ? "Entrar" : "Crear cuenta"} />
      <p className="text-center text-sm text-slate-600">
        {isLogin ? "Sin cuenta?" : "Ya tienes cuenta?"}{" "}
        <Link className="font-semibold text-emerald-700" href={isLogin ? "/auth/sign-up" : "/auth/login"}>
          {isLogin ? "Crear cuenta" : "Entrar"}
        </Link>
      </p>
    </form>
  );
}
