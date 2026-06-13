import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  plugins: [react()],
  publicDir: 'assets',
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
    // 后端数据目录与 scicompass 子树的文件变化不应触发前端热重载
    watch: {
      ignored: ['**/.sciwork-data/**', '**/scicompass/**', '**/dist-electron/**']
    }
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
});
