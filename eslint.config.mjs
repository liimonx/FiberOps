import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "public/mockServiceWorker.js",
  ]),
  // Tests and tooling configs legitimately use `any` to exercise invalid inputs
  // and to bridge build-tool type mismatches.
  {
    files: [
      "**/*.test.ts",
      "**/*.test.tsx",
      "**/*.bench.ts",
      "**/*.config.ts",
      "vitest.setup.ts",
    ],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
]);

export default eslintConfig;
