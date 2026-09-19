import { expect, test } from "@playwright/test";

const DEMO_ROOM = "/r/PADEL8";

test.describe("Sala pública", () => {
  test("muestra la competición sin controles de administración", async ({ page }) => {
    await page.goto(DEMO_ROOM);

    await expect(page.getByRole("heading", { level: 1 })).toContainText("Americano");
    await expect(page.getByText("Vista pública, solo lectura")).toBeVisible();
    await expect(page.getByRole("button", { name: /Guardar marcador/ })).toHaveCount(0);
    await expect(page.locator('input[name="sideAScore"]')).toHaveCount(0);
  });

  test("permite cambiar de ronda y conserva la clasificación", async ({ page }) => {
    await page.goto(DEMO_ROOM);

    const tabs = page.getByRole("tab");
    await expect(tabs).toHaveCount(3);
    // Se abre en la ronda activa, no siempre en la primera.
    await expect(page.getByRole("tab", { selected: true })).toContainText("Ronda 2");

    await page.getByRole("tab", { name: /Ronda 3/ }).click();
    await expect(page.getByRole("tab", { selected: true })).toContainText("Ronda 3");
    await expect(page.getByRole("tabpanel").filter({ hasText: "Pista 1" })).toBeVisible();

    await expect(page.getByRole("heading", { name: "Clasificación" })).toBeVisible();
  });

  test("la pantalla grande resume la ronda en curso", async ({ page }) => {
    await page.goto(`${DEMO_ROOM}/display`);
    await expect(page.getByText("En vivo")).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: /Ronda/ })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: "Clasificación" })).toBeVisible();
  });

  test("un código inexistente devuelve 404 en vez de un error del servidor", async ({ page }) => {
    const response = await page.goto("/r/NOEXISTE");
    expect(response?.status()).toBe(404);
  });
});

test.describe("Portada", () => {
  test("explica el error cuando el código no existe, sin perder la página", async ({ page }) => {
    await page.goto("/");
    await page.getByLabel("Entrar con código").fill("ZZZZZZ");
    await page.getByRole("button", { name: "Entrar a la sala" }).click();

    await expect(page.getByText(/No encontramos ninguna sala/)).toBeVisible();
    await expect(page).toHaveURL("/");
  });

  test("valida el formato del código antes de consultar", async ({ page }) => {
    await page.goto("/");
    await page.getByLabel("Entrar con código").fill("a b");
    await page.getByRole("button", { name: "Entrar a la sala" }).click();
    await expect(page.getByText(/letras, números y guiones/)).toBeVisible();
  });
});

test.describe("Móvil", () => {
  test.use({ hasTouch: true, viewport: { width: 390, height: 844 } });

  test("no hay desbordamiento horizontal y la barra inferior es alcanzable", async ({ page }) => {
    for (const path of ["/", "/dashboard", "/players", DEMO_ROOM]) {
      await page.goto(path);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, `desbordamiento horizontal en ${path}`).toBeLessThanOrEqual(1);
    }

    await page.goto("/dashboard");
    const nav = page.getByRole("navigation", { name: "Secciones" });
    await expect(nav).toBeVisible();
    const box = await nav.getByRole("link", { name: "Panel" }).boundingBox();
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
  });
});

test.describe("Accesibilidad básica", () => {
  test("hay enlace para saltar al contenido y un solo h1 por página", async ({ page }) => {
    await page.goto("/dashboard");

    await page.keyboard.press("Tab");
    const skip = page.getByRole("link", { name: "Saltar al contenido" });
    await expect(skip).toBeFocused();

    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  });

  test("los campos con error se anuncian junto al campo", async ({ page }) => {
    await page.goto("/");
    const input = page.getByLabel("Entrar con código");
    await input.fill("a b");
    await page.getByRole("button", { name: "Entrar a la sala" }).click();

    await expect(input).toHaveAttribute("aria-invalid", "true");
    const describedBy = await input.getAttribute("aria-describedby");
    expect(describedBy).toContain("code-error");
  });
});
