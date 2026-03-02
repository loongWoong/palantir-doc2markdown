import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'happy-dom',
    include: ['tests/unit/**/*.{test,spec}.{js,ts}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './tests/reports/coverage',
      include: ['src/**/*.{js,ts}'],
      exclude: ['node_modules/', 'tests/', '*.config.js']
    },
    reporters: [
      'default',
      ['junit', { outputFile: './tests/reports/unit/junit.xml' }]
    ]
  }
})
