import { defineConfig } from "vitest/config";

// Standalone test config — intentionally does NOT load the app's TanStack/Lovable
// Vite plugins, so unit tests for the scoring engine and data generator run fast
// in a plain Node environment.
export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
    coverage: {
      provider: "v8",
      include: ["src/lib/data/**", "src/lib/scoring/**"],
    },
  },
});
