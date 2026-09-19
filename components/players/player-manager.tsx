"use client";

import { Pencil, Search, Trash2, UserPlus } from "lucide-react";
import { useActionState, useState } from "react";
import { addPlayerAction, deletePlayerAction, updatePlayerAction } from "@/app/players/actions";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { getPlayerLevelLabel, playerLevels } from "@/lib/players/levels";
import type { PlayerListItem } from "@/lib/players/queries";
import { idleFormState } from "@/lib/validation/form-state";

export function PlayerManager({
  canManage,
  players,
}: {
  canManage: boolean;
  players: PlayerListItem[];
}) {
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const filtered = players.filter((player) =>
    player.displayName.toLowerCase().includes(query.trim().toLowerCase()),
  );

  return (
    <div className="space-y-5">
      {canManage && <AddPlayerForm />}

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Jugadores ({players.length})</CardTitle>
          <div className="relative w-full sm:w-64">
            <Search
              aria-hidden
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              size={16}
            />
            <Input
              aria-label="Buscar jugador"
              className="pl-9"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar jugador"
              type="search"
              value={query}
            />
          </div>
        </CardHeader>
        <CardContent>
          {players.length === 0 ? (
            <EmptyState
              description="Añade a quienes juegan habitualmente y podrás montar un Americano en menos de un minuto."
              title="Todavía no hay jugadores"
            />
          ) : filtered.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Ningún jugador coincide con “{query}”.
            </p>
          ) : (
            <ul className="divide-y divide-[color:var(--border)]">
              {filtered.map((player) => (
                <li className="py-3" key={player.id}>
                  {editing === player.id ? (
                    <EditPlayerForm onDone={() => setEditing(null)} player={player} />
                  ) : (
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-foreground">{player.displayName}</p>
                        <p className="text-sm text-muted-foreground">{getPlayerLevelLabel(player.rating)}</p>
                      </div>
                      {canManage && (
                        <div className="flex shrink-0 gap-2">
                          <Button
                            aria-label={`Editar ${player.displayName}`}
                            onClick={() => setEditing(player.id)}
                            variant="secondary"
                          >
                            <Pencil size={16} />
                            <span className="hidden sm:inline">Editar</span>
                          </Button>
                          <DeletePlayerForm player={player} />
                        </div>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function AddPlayerForm() {
  const [state, formAction] = useActionState(addPlayerAction, idleFormState);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Añadir jugador</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="grid gap-3 sm:grid-cols-[1fr_200px_auto] sm:items-end" key={state.status === "success" ? state.message : "form"}>
          <Field error={state.fieldErrors?.displayName} htmlFor="displayName" label="Nombre">
            {(props) => <Input {...props} autoComplete="off" name="displayName" placeholder="Nombre y apellido" />}
          </Field>
          <Field error={state.fieldErrors?.rating} htmlFor="rating" label="Nivel">
            {(props) => (
              <Select {...props} defaultValue="0" name="rating">
                {playerLevels.map((level) => (
                  <option key={level.value} value={level.value}>
                    {level.label}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <SubmitButton className="w-full sm:w-auto" pendingLabel="Añadiendo…">
            <UserPlus size={16} />
            Añadir
          </SubmitButton>
          {state.status === "error" && state.message && (
            <div className="sm:col-span-3">
              <Alert tone="error">{state.message}</Alert>
            </div>
          )}
          {state.status === "success" && state.message && (
            <div className="sm:col-span-3">
              <Alert tone="success">{state.message}</Alert>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}

function EditPlayerForm({ onDone, player }: { onDone: () => void; player: PlayerListItem }) {
  const [state, formAction] = useActionState(updatePlayerAction, idleFormState);

  return (
    <form action={formAction} className="grid gap-3 sm:grid-cols-[1fr_180px_auto_auto] sm:items-end">
      <input name="id" type="hidden" value={player.id} />
      <Field error={state.fieldErrors?.displayName} htmlFor={`name-${player.id}`} label="Nombre">
        {(props) => <Input {...props} defaultValue={player.displayName} name="displayName" />}
      </Field>
      <Field error={state.fieldErrors?.rating} htmlFor={`rating-${player.id}`} label="Nivel">
        {(props) => (
          <Select {...props} defaultValue={String(player.rating ?? 0)} name="rating">
            {playerLevels.map((level) => (
              <option key={level.value} value={level.value}>
                {level.label}
              </option>
            ))}
          </Select>
        )}
      </Field>
      <SubmitButton>Guardar</SubmitButton>
      <Button onClick={onDone} variant="ghost">
        Cancelar
      </Button>
      {state.status === "error" && state.message && (
        <div className="sm:col-span-4">
          <Alert tone="error">{state.message}</Alert>
        </div>
      )}
    </form>
  );
}

function DeletePlayerForm({ player }: { player: PlayerListItem }) {
  const [state, formAction] = useActionState(deletePlayerAction, idleFormState);
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <Button
        aria-label={`Borrar ${player.displayName}`}
        onClick={() => setConfirming(true)}
        variant="secondary"
      >
        <Trash2 size={16} />
        <span className="hidden sm:inline">Borrar</span>
      </Button>
    );
  }

  return (
    <form action={formAction} className="flex items-center gap-2">
      <input name="id" type="hidden" value={player.id} />
      <span className="text-sm text-muted-foreground">¿Seguro?</span>
      <SubmitButton pendingLabel="Borrando…" variant="danger">
        Sí
      </SubmitButton>
      <Button onClick={() => setConfirming(false)} variant="ghost">
        No
      </Button>
      {state.status === "error" && state.message && (
        <span className="text-xs text-danger">{state.message}</span>
      )}
    </form>
  );
}
