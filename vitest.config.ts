import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    globals: true,
    include: ["tests/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: ["lib/**/*.ts"],
      // Network/runtime-only modules are exercised by integration + E2E, not by
      // unit coverage. The threshold targets PayGuard's pure logic.
      exclude: [
        "lib/**/*.d.ts",
        "lib/types.ts",
        "lib/env.ts",
        "lib/blob.ts",
        "lib/pdf.ts",
        "lib/ratelimit.ts",
        "lib/auth/**",
        "lib/client/**",
        "lib/ai/client.ts",
        "lib/ai/extract.ts",
        "lib/ai/draft.ts",
        "lib/ai/selfcheck.ts",
        "lib/retrieval/upstash.ts",
        "lib/pipeline/index.ts",
        "lib/repositories/**",
      ],
      reporter: ["text", "html"],
      thresholds: {
        lines: 80,
        functions: 80,
        statements: 80,
        branches: 70,
      },
    },
  },
});
