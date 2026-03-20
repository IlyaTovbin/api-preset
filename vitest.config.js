import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globalSetup: ["./tests/setup/global-setup.js"],
    environment: "node",
    setupFiles: ["./tests/setup/test-env.js"],
    include: ["tests/**/*.test.js"],
    globals: true,
    fileParallelism: false,
  },
});
