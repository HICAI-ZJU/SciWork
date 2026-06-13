import { it, expect } from 'vitest';
import { mkdtempSync, readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { initClaudeCode } from './claudeCode.js';

function fakeSkillsDir(): string {
  const dir = mkdtempSync(join(tmpdir(), 'skills-'));
  mkdirSync(join(dir, 'scicompass'), { recursive: true });
  writeFileSync(join(dir, 'scicompass', 'SKILL.md'), '---\nname: scicompass\n---\n');
  writeFileSync(join(dir, 'package.json'), '{}'); // 应被跳过
  return dir;
}

it('writes .mcp.json, copies skills, appends CLAUDE.md (idempotent)', () => {
  const proj = mkdtempSync(join(tmpdir(), 'host-'));
  const home = mkdtempSync(join(tmpdir(), 'sc-'));
  const opts = {
    projectDir: proj, dataHome: home, skillsSourceDir: fakeSkillsDir(),
    serveEntry: '/abs/dist/main.js', template: 'fudan-xtalpi'
  };
  initClaudeCode(opts);
  const mcp = JSON.parse(readFileSync(join(proj, '.mcp.json'), 'utf8'));
  expect(mcp.mcpServers['scicompass-knowledge'].args).toContain('knowledge');
  expect(mcp.mcpServers['scicompass-harness'].args).toContain('harness');
  expect(existsSync(join(proj, '.claude', 'skills', 'scicompass', 'SKILL.md'))).toBe(true);
  expect(existsSync(join(proj, '.claude', 'skills', 'package.json'))).toBe(false);
  const md = readFileSync(join(proj, 'CLAUDE.md'), 'utf8');
  expect(md).toMatch(/罗盘/);
  initClaudeCode(opts); // 幂等：约定不重复追加
  const md2 = readFileSync(join(proj, 'CLAUDE.md'), 'utf8');
  expect(md2.match(/SciCompass 约定/g)).toHaveLength(1);
});
