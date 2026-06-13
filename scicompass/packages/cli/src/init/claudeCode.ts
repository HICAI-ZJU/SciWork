import { mkdirSync, writeFileSync, readFileSync, existsSync, cpSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

export interface InitOpts {
  projectDir: string;
  dataHome: string;
  skillsSourceDir: string;
  serveEntry: string;
  template: string;
}

// 安装的本质三动作：配服务（.mcp.json）、装技能（.claude/skills）、定数据家（dataHome）
export function initClaudeCode(o: InitOpts) {
  // ① 配服务：双入口，knowledge 常规 / harness 特权
  const mcpPath = join(o.projectDir, '.mcp.json');
  const existing = existsSync(mcpPath) ? JSON.parse(readFileSync(mcpPath, 'utf8')) : {};
  existing.mcpServers = {
    ...existing.mcpServers,
    'scicompass-knowledge': {
      command: 'node',
      args: [o.serveEntry, 'serve', '--modules', 'knowledge', '--data-home', o.dataHome, '--template', o.template]
    },
    'scicompass-harness': {
      command: 'node',
      args: [o.serveEntry, 'serve', '--modules', 'harness', '--data-home', o.dataHome, '--template', o.template]
    }
  };
  writeFileSync(mcpPath, JSON.stringify(existing, null, 2));

  // ② 装技能：内置技能拷入宿主技能目录
  const skillsDest = join(o.projectDir, '.claude', 'skills');
  mkdirSync(skillsDest, { recursive: true });
  for (const name of readdirSync(o.skillsSourceDir)) {
    if (['package.json', 'tsconfig.json', 'dist', 'node_modules'].includes(name)) continue;
    cpSync(join(o.skillsSourceDir, name), join(skillsDest, name), { recursive: true });
  }

  // ③ 到场约定：罗盘主持会话
  const banner = [
    '', '## SciCompass 约定',
    '本项目由领航员（罗盘）主持：会话开始时按 scicompass 技能的开场仪式恢复现场，再做任何事。',
    '装置调用必须经 scicompass-harness 治理网关，不得直连装置 MCP。',
    '永不自行调用 run_approve；physical 模式仅在用户明确要求时提交。', ''
  ].join('\n');
  const claudeMd = join(o.projectDir, 'CLAUDE.md');
  const head = existsSync(claudeMd) ? readFileSync(claudeMd, 'utf8') : '# 项目约定\n';
  if (!head.includes('SciCompass 约定')) writeFileSync(claudeMd, head + banner);
}
