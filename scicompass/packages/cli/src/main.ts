#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildServer } from './serve.js';
import { startHttpGateway } from './httpGateway.js';
import { resolveDataHome } from './dataHome.js';
import { initClaudeCode } from './init/claudeCode.js';

const argv = process.argv.slice(2);
const opt = (name: string, dflt?: string) => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 ? argv[i + 1] : dflt;
};
const here = dirname(fileURLToPath(import.meta.url));
const templateFile = (t: string) => resolve(here, '../../..', 'templates', `${t}.yaml`);

const cmd = argv[0];

if (cmd === 'serve') {
  const httpPort = opt('http');
  // HTTP 网关给 UI 用，默认挂全部模块以演示完整闭环；stdio 默认只挂 knowledge
  const modules = (opt('modules', httpPort ? 'knowledge,harness' : 'knowledge') as string)
    .split(',') as ('knowledge' | 'harness')[];
  const serveOpts = {
    dataHome: resolveDataHome(opt('data-home')),
    modules,
    template: templateFile(opt('template', 'fudan-xtalpi') as string)
  };
  if (httpPort) {
    const gw = await startHttpGateway(serveOpts, Number(httpPort));
    // 机器可读端口行（stdout），供父进程（Electron 主进程）解析；--http 0 时 OS 分配端口
    console.log(`SCICOMPASS_GATEWAY_PORT=${gw.port}`);
    console.error(`scicompass HTTP gateway listening on http://127.0.0.1:${gw.port} (modules: ${modules.join(', ')})`);
  } else {
    const server = buildServer(serveOpts);
    await server.connect(new StdioServerTransport());
  }
} else if (cmd === 'init') {
  const host = opt('host', 'claude-code');
  if (host !== 'claude-code') {
    // v0.2：claude-desktop（.mcpb 打包）、codex、openclaw、sciwork 适配器
    console.error(`host adapter not implemented in v0.1: ${host}`);
    process.exit(1);
  }
  initClaudeCode({
    projectDir: process.cwd(),
    dataHome: resolveDataHome(opt('data-home')),
    skillsSourceDir: resolve(here, '../..', 'skills'),
    serveEntry: resolve(here, 'main.js'),
    template: opt('template', 'fudan-xtalpi') as string
  });
  console.log('scicompass: claude-code host initialized (.mcp.json + .claude/skills + CLAUDE.md)');
} else if (cmd === 'skill') {
  const { skillAdd, skillList } = await import('./skillCmd.js');
  const home = resolveDataHome(opt('data-home'));
  if (argv[1] === 'add' && argv[2]) {
    console.log(`installed skill: ${skillAdd(home, argv[2])}`);
  } else if (argv[1] === 'list') {
    console.log(skillList(home).join('\n') || '(no dynamic skills installed)');
  } else {
    console.log('usage: scicompass skill add <dir> | skill list');
  }
} else {
  console.log([
    'scicompass / luopan — 科学罗盘 CLI v0.1.0',
    'usage:',
    '  scicompass serve --modules knowledge[,harness] [--data-home DIR] [--template NAME]   # MCP over stdio',
    '  scicompass serve --http PORT [--modules ...] [--data-home DIR] [--template NAME]      # HTTP 网关（给 SciWork UI）',
    '  scicompass init  --host claude-code [--data-home DIR] [--template NAME]',
    '  scicompass skill add <dir> | skill list'
  ].join('\n'));
}
