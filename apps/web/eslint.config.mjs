import next from '../../packages/config/eslint/next.mjs';

export default [
  ...next,
  {
    ignores: ['.next/**'],
  },
];
