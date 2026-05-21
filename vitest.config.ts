import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.{ts,tsx}'],
    sequence: {
      concurrent: false,
    },
    env: {
      SPECTRE_CONFIG_DIR: '/tmp/spectre-test-config',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'tests/', 'dist/'],
    },
  },
})
