import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      // `server-only` throws outside the React Server bundler; tests run server code directly.
      "server-only": fileURLToPath(new URL("./tests/server-only-stub.ts", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.{ts,tsx}"],
    setupFiles: ["tests/setup.ts"],
    coverage: {
      provider: "v8",
      // Business logic, services, storage and security helpers: the code the app's correctness rests on.
      include: ["src/lib/**", "src/middleware.ts", "src/components/ui/**"],
      exclude: ["src/lib/admin-context.ts"],
      reporter: ["text-summary", "text"],
      thresholds: { lines: 85, functions: 80, branches: 75, statements: 85 },
    },
  },
});
