import { describe, expect, it } from "vitest";
import { safeInternalPath } from "@/lib/auth/safe-redirect";

describe("Redirecciones de autenticación", () => {
  it("acepta rutas internas", () => {
    expect(safeInternalPath("/competitions/new")).toBe("/competitions/new");
    expect(safeInternalPath("/r/PADEL8?x=1")).toBe("/r/PADEL8?x=1");
  });

  it("rechaza destinos externos y protocolos raros", () => {
    for (const candidate of [
      "https://phishing.example",
      "//phishing.example",
      "/\\phishing.example",
      "javascript:alert(1)",
      "http://localhost:3000/evil",
      "",
      null,
      undefined,
    ]) {
      expect(safeInternalPath(candidate)).toBe("/dashboard");
    }
  });

  it("permite elegir otro destino por defecto", () => {
    expect(safeInternalPath(null, "/")).toBe("/");
  });
});
