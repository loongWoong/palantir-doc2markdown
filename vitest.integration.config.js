import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/integration/**/*.{test,spec}.{js,ts}'],
    reporters: [
      'default',
      ['junit', { outputFile: './tests/reports/integration/junit.xml' }]
    ]
  }
})
