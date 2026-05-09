import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    exclude: [
      // Standalone runner tests (use custom main(), not vitest describe/test)
      "tests/partner-offers.test.ts",
      "tests/price-normalization-unit.test.ts",
      // Playwright E2E tests (use @playwright/test, not vitest)
      "tests/api-contracts.test.ts",
    ],
    environment: "node",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname),
    },
  },
});
