import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// A relative base lets the static build run from any folder or sub-path.
export default defineConfig({
  base: './',
  plugins: [react()],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
