// @ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['eslint.config.mjs', 'dist/**', 'node_modules/**'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  eslintPluginPrettierRecommended,
  {
    languageOptions: {
      globals: { ...globals.node, ...globals.jest },
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    rules: {
      // --- BLOQUE 1: ERRORES CRÍTICOS (SIN WARNINGS) ---
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': ['error', { checksVoidReturn: false }],
      '@typescript-eslint/no-unused-vars': 'error', 

      // --- BLOQUE 2: CONTROL TOTAL DE TIPOS ---
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unsafe-argument': 'error',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'error',
      '@typescript-eslint/no-unsafe-call': 'error',
      '@typescript-eslint/no-unsafe-return': 'error',
      '@typescript-eslint/no-redundant-type-constituents': 'error',

      // --- BLOQUE 3: LÓGICA DE DOMINIO ---
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/prefer-nullish-coalescing': 'error',
      '@typescript-eslint/prefer-optional-chain': 'error',
      '@typescript-eslint/no-unnecessary-condition': 'error',

      // --- BLOQUE 4: AJUSTES DE INFRAESTRUCTURA (LO QUE ESTORBABA) ---
      '@typescript-eslint/no-extraneous-class': 'off',     // Permite módulos y helpers estáticos
      '@typescript-eslint/restrict-template-expressions': 'off', // Permite usar cualquier variable en strings
      '@typescript-eslint/strict-boolean-expressions': 'off',    // Permite if (variable) sin comparaciones raras
      '@typescript-eslint/no-useless-constructor': 'error',
      "@typescript-eslint/no-invalid-void-type": [
        "error",
        { "allowInGenericTypeArguments": true }
      ],
      '@typescript-eslint/no-misused-spread': 'off',
    },
  },
);