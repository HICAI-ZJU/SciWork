import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  publicDir: 'assets',
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    globals: true,
    // 仅跑前端顶层 src/ 的测试；scicompass 后端有自己的 vitest（cd scicompass && npm test）。
    include: ['src/**/*.{test,spec}.{ts,tsx}']
  }
});
