// @ts-check
// ESLint 9 flat config para los MFEs remotes. Mismo patron que el shell:
// typescript-eslint recommended + angular-eslint tsRecommended +
// templateRecommended, selectores app, inline templates con processor.
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import angular from 'angular-eslint';

export default tseslint.config(
  {
    files: ['**/*.ts'],
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommended,
      ...angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    rules: {
      '@angular-eslint/directive-selector': [
        'error',
        { type: 'attribute', prefix: ['app', 'ph'], style: 'camelCase' },
      ],
      '@angular-eslint/component-selector': [
        'error',
        // "ph" para widgets publicos federados; "app" para el resto.
        { type: 'element', prefix: ['app', 'ph'], style: 'kebab-case' },
      ],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
  {
    files: ['**/*.html'],
    extends: [...angular.configs.templateRecommended],
  },
  {
    ignores: ['dist/**', 'node_modules/**', '*.config.js', '*.config.ts', '.angular/**'],
  },
);
