import { defineConfig, globalIgnores } from "eslint/config";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = defineConfig([
  ...nextCoreWebVitals,
  globalIgnores([
      "**/*.test.ts",
      "**/*.test.tsx",
      ".next/**",
      "out/**",
      "build/**",
      "coverage/**",
      "backups/**",
  ]),
]);

export default eslintConfig;
