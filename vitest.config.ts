import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "server-only": path.resolve(__dirname, "tests/stubs/server-only.ts"),
    },
  },
  test: {
    include: ["src/modules/**/*.test.ts", "src/app/api/**/*.test.ts"],
    setupFiles: ["src/modules/test-helpers/setup.ts"],
  },
});
