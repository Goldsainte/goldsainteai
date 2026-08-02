import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import i18next from "eslint-plugin-i18next";

export default tseslint.config(
  { ignores: ["dist"] },
  // i18n regression guard (H5): new hardcoded UI strings surface as warnings.
  // Warn-level on purpose — the pre-existing backlog is tracked in
  // I18N_COVERAGE_AUDIT.md; this stops NEW English from landing silently.
  {
    files: ["src/pages/**/*.{ts,tsx}", "src/components/**/*.{ts,tsx}"],
    plugins: { i18next },
    rules: {
      "i18next/no-literal-string": [
        "warn",
        { markupOnly: true, ignoreAttribute: ["data-testid", "to", "href", "id", "key", "className", "variant", "size", "type", "mode", "align", "side", "asChild"] },
      ],
    },
  },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
);
