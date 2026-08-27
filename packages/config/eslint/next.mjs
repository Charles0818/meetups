import nextPlugin from '@next/eslint-plugin-next';
import base from './base.mjs';

/** Base config plus Next.js recommended + core-web-vitals rules. */
export default [
  ...base,
  {
    plugins: { '@next/next': nextPlugin },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,
    },
  },
];
