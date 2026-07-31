// @ts-check
import { fileURLToPath } from 'node:url';
import tseslint from 'typescript-eslint';
import { baseConfig } from '../../eslint.config.base.mjs';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default tseslint.config(...baseConfig, {
  languageOptions: {
    parserOptions: {
      tsconfigRootDir: __dirname,
    },
  },
});
