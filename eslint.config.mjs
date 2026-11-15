// SPDX-FileCopyrightText: © 2017 EteSync Authors
// SPDX-License-Identifier: AGPL-3.0-only

import { defineConfig, globalIgnores } from "eslint/config";
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import react from "@eslint-react/eslint-plugin";
import stylistic from "@stylistic/eslint-plugin";
import globals from "globals";

export default defineConfig(
  globalIgnores(["build/", "e2e/"]),
  js.configs.recommended,
  tseslint.configs.recommended,
  react.configs["recommended-typescript"],
  {
    files: ["src/**/*.{js,jsx,ts,tsx}"],
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
    plugins: {
      "@stylistic": stylistic,
    },
    rules: {
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/no-use-before-define": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-empty-object-type": "off",
      "@typescript-eslint/no-unsafe-function-type": "off",
      "@typescript-eslint/no-unused-expressions": "off",
      "@typescript-eslint/ban-ts-comment": "off",
      "@stylistic/member-delimiter-style": ["error", {
        "multiline": {
          "delimiter": "semi",
          "requireLast": true,
        },
        "singleline": {
          "delimiter": "comma",
          "requireLast": false,
        },
      }],
      "@typescript-eslint/no-unused-vars": ["warn", {
        "vars": "all",
        "args": "all",
        "ignoreRestSiblings": true,
        "argsIgnorePattern": "^_",
        "caughtErrors": "none",
      }],

      "@stylistic/jsx-tag-spacing": ["error", {
        "closingSlash": "never",
        "beforeSelfClosing": "always",
        "afterOpening": "never",
        "beforeClosing": "never",
      }],
      "@stylistic/jsx-shorthand-boolean": "error",
      "@stylistic/jsx-curly-spacing": ["error", { "when": "never", "children": true }],
      "@stylistic/jsx-equals-spacing": ["error", "never"],
      "@stylistic/jsx-indent-props": ["error", 2],
      "@stylistic/jsx-curly-brace-presence": ["error", "never"],
      // no-missing-key (also for fragments) and dom-no-void-elements-with-children are in the recommended config
      "@eslint-react/dom-no-unknown-property": "error",

      "@stylistic/quotes": ["error", "double", { "allowTemplateLiterals": "always", "avoidEscape": true }],
      "@stylistic/semi": ["error", "always", { "omitLastInOneLineBlock": true }],
      "@stylistic/comma-dangle": ["error", {
        "arrays": "always-multiline",
        "objects": "always-multiline",
        "imports": "always-multiline",
        "exports": "always-multiline",
        "functions": "never",
        "enums": "always-multiline",
        "tuples": "always-multiline",
        "generics": "ignore",
      }],
      "@stylistic/comma-spacing": ["error"],
      "eqeqeq": ["error", "smart"],
      "@stylistic/indent": ["error", 2, {
        "SwitchCase": 1,
      }],
      "@stylistic/no-multi-spaces": "error",
      // Spaces inside { } but not inside [ ] (replaces object-curly-spacing and array-bracket-spacing). It
      // also keeps the items of a multi-line list each on their own line, or all on the first one.
      "@stylistic/list-style": ["error", { overrides: { "()": "off", "<>": "off" } }],
      "@stylistic/arrow-parens": "error",
      "@stylistic/arrow-spacing": "error",
      "@stylistic/key-spacing": "error",
      "@stylistic/keyword-spacing": "error",
      "@stylistic/function-call-spacing": ["error"],
      "@stylistic/space-before-function-paren": ["error", {
        "anonymous": "always",
        "named": "never",
        "asyncArrow": "always",
      }],
      "@stylistic/space-in-parens": ["error", "never"],
      "@stylistic/space-before-blocks": "error",
      "curly": ["error", "all"],
      "@stylistic/space-infix-ops": "error",
      "consistent-return": "error",
      "@stylistic/jsx-quotes": ["error"],
      "@stylistic/brace-style": [
        "error",
        "1tbs",
        { allowSingleLine: true },
      ],
      "no-useless-constructor": "off",
      "@typescript-eslint/no-useless-constructor": "warn",
    },
  }
);
