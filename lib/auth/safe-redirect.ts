/**
 * Solo permite continuar hacia rutas internas.
 * Sin esto, `?next=https://otro-sitio` convertía el login y el callback de auth
 * en una redirección abierta usable para phishing.
 */
export function safeInternalPath(candidate: string | null | undefined, fallback = "/dashboard") {
  if (!candidate) return fallback;
  const value = candidate.trim();
  if (!value.startsWith("/")) return fallback;
  if (value.startsWith("//") || value.startsWith("/\\")) return fallback;
  if (value.includes("://") || /[\u0000-\u001f]/.test(value)) return fallback;
  return value;
}
