import { defineConfig, devices } from "@playwright/test";

// Permite apuntar a un Chromium ya instalado (CI o contenedores sin descarga de navegadores).
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_PATH || undefined;

export default defineConfig({
  testDir: "./tests/e2e",
  webServer: {
    command: "pnpm exec next dev -p 3107",
    url: "http://127.0.0.1:3107",
    reuseExistingServer: true,
    timeout: 120_000,
  },
  use: {
    baseURL: "http://127.0.0.1:3107",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        launchOptions: executablePath ? { executablePath } : {},
      },
    },
  ],
});
