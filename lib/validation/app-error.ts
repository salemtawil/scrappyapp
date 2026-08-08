export type AppErrorCode =
  | "validation"
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "conflict"
  | "stale_version"
  | "invalid_competition_state"
  | "engine_error";

export class AppError extends Error {
  constructor(
    public readonly code: AppErrorCode,
    message: string,
    public readonly status = 400,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function staleVersionError() {
  return new AppError(
    "stale_version",
    "El marcador cambió en otro dispositivo.",
    409,
  );
}
