import antfu from '@antfu/eslint-config'

export default antfu(
  {
    ignores: [
      'dist',
      'node_modules',
      '.codex/**',
    ],
    lessOpinionated: true,
  },
  {
    rules: {
      'antfu/if-newline': 'off',
      'jsonc/sort-array-values': 'off',
      'jsonc/sort-keys': 'off',
      'no-console': 'off',
      'node/prefer-global/buffer': 'off',
      'node/prefer-global/process': 'off',
      'perfectionist/sort-exports': 'off',
      'perfectionist/sort-imports': 'off',
      'perfectionist/sort-named-exports': 'off',
      'prefer-template': 'off',
      'test/prefer-lowercase-title': 'off',
      'ts/no-require-imports': 'off',
      'unicorn/prefer-node-protocol': 'off',
      'unused-imports/no-unused-imports': 'off',
    },
  },
)
