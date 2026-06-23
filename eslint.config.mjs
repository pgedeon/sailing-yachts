import next from 'eslint-config-next';
import tseslint from '@typescript-eslint/eslint-plugin';

const eslintConfig = [
  {
    ignores: [
      '.next/**',
      '.vercel/**',
      'node_modules/**',
      'test-results/**',
      'playwright-report/**',
      'out/**',
      '*.tsbuildinfo',
    ],
  },
  ...next,
  {
    plugins: { '@typescript-eslint': tseslint },
    rules: {
      // Allow _ prefix for unused vars (common pattern in route handlers)
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
  },
];

export default eslintConfig;
