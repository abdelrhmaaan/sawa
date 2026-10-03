import { defineConfig } from "@playwright/test";

// E2E smoke tests run against the shared dev environment (Vite dev server
// proxying to Django). Workers are forced to 1 because all tests share the
// same dev database.
export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report", open: "never" }],
  ],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:5180",
    headless: true,
    trace: "retain-on-failure",
  },
});
