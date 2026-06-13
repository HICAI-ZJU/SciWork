import { cpSync, mkdirSync, readdirSync, existsSync } from 'node:fs';
import { join, basename } from 'node:path';

// 动态技能管理：团队自产技能装入数据之家，与内置技能合并视图
export function skillAdd(dataHome: string, srcDir: string) {
  if (!existsSync(join(srcDir, 'SKILL.md'))) {
    throw new Error('not a skill dir (missing SKILL.md)');
  }
  const dest = join(dataHome, 'skills', basename(srcDir));
  mkdirSync(dest, { recursive: true });
  cpSync(srcDir, dest, { recursive: true });
  return basename(srcDir);
}

export function skillList(dataHome: string): string[] {
  const dir = join(dataHome, 'skills');
  return existsSync(dir) ? readdirSync(dir) : [];
}
