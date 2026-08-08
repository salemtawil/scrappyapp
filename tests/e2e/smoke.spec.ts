import { expect, test } from "@playwright/test";

test("public room has no admin scoring controls", async ({ page }) => {
  await page.goto("/r/PADEL8");
  await expect(page.getByText("Vista publica")).toBeVisible();
  await expect(page.getByText("Guardar marcador")).toHaveCount(0);
});
