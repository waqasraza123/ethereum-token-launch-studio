import { defineConfig } from "eslint/config";
import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

const contractsEslintConfig = defineConfig([
  {
    ignores: ["artifacts/**", "cache/**", "coverage/**", "node_modules/**", "types/**"],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.ts"],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.mocha,
      },
    },
  },
]);

export default contractsEslintConfig;
