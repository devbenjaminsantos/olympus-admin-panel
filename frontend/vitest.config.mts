import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    clearMocks: true,
    environment: "jsdom",
    exclude: [...configDefaults.exclude, "e2e/**"],
    restoreMocks: true
  }
});
