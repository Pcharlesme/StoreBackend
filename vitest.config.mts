import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    setupFiles: ["./tests/setup/env.ts"],
    // First run downloads a MongoDB binary for mongodb-memory-server
    hookTimeout: 120_000,
    testTimeout: 20_000,
  },
});
