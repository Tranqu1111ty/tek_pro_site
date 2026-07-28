import { defineConfig, globalIgnores } from "eslint/config";
import js from "@eslint/js";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import tseslint from "typescript-eslint";

const eslintConfig = defineConfig([
  js.configs.recommended,
  ...tseslint.configs.recommended,
  reactHooks.configs.flat.recommended,
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },
  globalIgnores([
    ".next/**",
    ".vinext/**",
    "dist/**",
    "out/**",
    "build/**",
  ]),
]);

export default eslintConfig;
