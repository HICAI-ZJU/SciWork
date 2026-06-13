import { homedir } from 'node:os';
import { join } from 'node:path';
import { mkdirSync } from 'node:fs';

// 数据之家：跨工作台连续性所在。优先级：显式参数 > 环境变量 > ~/.scicompass
export function resolveDataHome(explicit?: string): string {
  const home = explicit ?? process.env.SCICOMPASS_HOME ?? join(homedir(), '.scicompass');
  mkdirSync(join(home, 'graphs'), { recursive: true });
  mkdirSync(join(home, 'skills'), { recursive: true });
  return home;
}
