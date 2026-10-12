import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  // mojipx may be linked from a sibling checkout during development; keep a single React instance.
  resolve: { dedupe: ['react', 'react-dom'] },
  build: { target: 'es2022' },
  test: { include: ['src/**/*.test.ts'], environment: 'node' },
});
