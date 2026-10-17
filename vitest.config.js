import { defineConfig } from 'vitest/config';

// Plain Vitest config: tests cover framework-free logic (content model, Pinia store),
// so they do not need the Nuxt runtime.
export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['tests/**/*.test.js'],
  },
});
