import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": import.meta.dirname,
    },
  },
  test: {
    environment: "node",
    // Loads DATABASE_URL/DIRECT_URL etc. from .env — needed by the
    // lockGameWeek/finalizeResults integration tests, which run against the
    // real dev database rather than a mock.
    setupFiles: ["./vitest.setup.ts"],
    // The default 5s is tuned for in-process tests; these fixtures make many
    // sequential round-trips to a remote Supabase instance, which is slower.
    // A too-short timeout is actively dangerous here: on timeout, Vitest
    // moves on and runs afterEach cleanup while the still-in-flight test body
    // keeps executing in the background, racing its own teardown.
    testTimeout: 30000,
  },
});
