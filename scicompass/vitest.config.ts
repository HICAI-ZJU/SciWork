import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

const p = (rel: string) => fileURLToPath(new URL(rel, import.meta.url));

export default defineConfig({
  resolve: {
    // 工作区包直接映射到源码入口，测试无需先 tsc 构建
    alias: {
      '@scicompass/core': p('./packages/core/src/index.ts'),
      '@scicompass/labontology': p('./packages/labontology/src/index.ts'),
      '@scicompass/labkag': p('./packages/labkag/src/index.ts'),
      '@scicompass/labharness': p('./packages/labharness/src/index.ts'),
      '@scicompass/lablibrary': p('./packages/lablibrary/src/index.ts')
    }
  },
  test: {
    include: ['packages/**/src/**/*.test.ts', 'e2e/**/*.test.ts'],
    pool: 'forks',
    testTimeout: 20000
  }
});
