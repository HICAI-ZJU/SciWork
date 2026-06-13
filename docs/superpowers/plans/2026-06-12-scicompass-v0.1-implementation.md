# SciCompass v0.1 实施方案（Implementation Plan）

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**文档版本：** v1.0　**生成日期：** 2026-06-12　**状态：** 待批准后执行
**关联文档：** 《SciCompass 概要设计文档 v1.0》（docs/SciCompass概要设计文档-v1.0-20260612.docx）；《2026-06-12-sciwork-backend-mcp-architecture-design.md》（早期规格，技术设计被继承、模块组织被本计划取代）

**Goal:** 在当前仓库内以独立子树 `scicompass/` 交付 SciCompass v0.1 发行版：七包 monorepo（core / labontology / labkag / labharness / lablibrary / skills / cli），双 MCP 挂载入口（knowledge / harness），六个内置技能，CLI 安装器（claude-code 宿主优先），全闭环 e2e 冒烟通过。

**Architecture:** 资源以 MCP tools 暴露、技能以 SKILL.md 承载、数据落 `~/.scicompass/`（测试用临时目录注入）。三级图库物理分文件（项目图/组图/公开图 + 驾驭规则图），LabOntology 统一校验一切图写入；运行采用「提交时物化时间线、查询时惰性推进」的无常驻执行器模型；physical 模式必停 awaiting-approval。SciCompass 服务自身永不调用 LLM。

**Tech Stack:** Node 20+、TypeScript（strict）、npm workspaces、vitest、better-sqlite3（WAL）、zod、@modelcontextprotocol/sdk（InMemoryTransport 做合同测试）、ajv（装置参数 JSONSchema 校验）、yaml（本体与空间模板）。

**v0.1 明确不做（写给执行者，防止范围蔓延）：** SciGraph 真实锚定（mock 适配器，接口定死）；SciGraph 投稿管道；Claude Desktop `.mcpb` 打包；codex/openclaw/sciwork 宿主适配器（仅留 `--host` 分支骨架报「暂未实现」）；常驻智能体；向量检索；图数据库；luopan 命令的宿主侧 slash 别名（CLI bin 别名要做）。

---

## 0. 文件结构总览（先锁定，再分任务）

```text
scicompass/                          # 子树根（npm workspaces；零依赖 sciwork 的 src/）
├── package.json                     # workspaces: ["packages/*"]; scripts: test/build/typecheck
├── tsconfig.base.json
├── vitest.config.ts
├── templates/
│   └── fudan-xtalpi.yaml            # 空间模板：装置 Profile + 默认技能集 + 本体版本
├── e2e/
│   └── full-loop.test.ts            # 全闭环冒烟
└── packages/
    ├── core/        src/{provenance.ts,storage.ts,ids.ts,contracts/{graph.ts,records.ts,run.ts,library.ts,project.ts},index.ts}
    ├── labontology/ src/{load.ts,validate.ts,service.ts,index.ts}  ontologies/chemistry/v1/{vocabulary.yaml,constraints.yaml}
    ├── labkag/      src/{registry.ts,graphStore.ts,kag.ts,promote.ts,exportMd.ts,alignPublic.ts,records.ts,index.ts}
    ├── labharness/  src/{schema.ts,deviceRegistry.ts,driver.ts,mockDriver.ts,runs.ts,approvals.ts,audit.ts,index.ts}
    ├── lablibrary/  src/{library.ts,bibtex.ts,index.ts}
    ├── skills/      {scicompass,literature-review,experiment-design,run-and-analyze,sci-data-analysis,xtalpi-synthesis}/SKILL.md
    └── cli/         src/{serve.ts,mcp/registerKnowledge.ts,mcp/registerHarness.ts,init/claudeCode.ts,initCmd.ts,skillCmd.ts,dataHome.ts,main.ts}
                     bin 由 package.json 声明：{"scicompass":"dist/main.js","luopan":"dist/main.js"}
```

数据之家（运行时，所有模块经 `DataHome` 注入，测试传临时目录）：

```text
<dataHome>/
├── scicompass.db        # 主库：projects/graphs 注册表/devices/runs/run_events/approvals/audit_log/
│                        #        literature(+fts)/artifacts/protocols/results
├── graphs/labgraph-prj-<slug>.db | labgraph-grp-<slug>.db | labgraph-grp-<slug>-open.db | harness-rules-<slug>.db
├── library/<projectId>/  runs/<runId>/  ontology/  skills/  config.yaml
```

工具清单（v0.1 权威版，31 个）：
**knowledge（23）**：project_list/get/create；literature_import/search/get；graph_query/write/promote/export/align_public；artifact_save/list/get；protocol_save/get/validate；result_register/list/get/flowback；ontology_get/check。
**harness（8，特权）**：device_list/get_profile；run_validate/submit/status/list/control/approve。

执行约定：每个任务结束必须 `npm test`（工作区内）全绿再 commit；commit 信息英文祈使句，尾注 `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`。

---

### Task 0: Monorepo 脚手架

**Files:**
- Create: `scicompass/package.json`, `scicompass/tsconfig.base.json`, `scicompass/vitest.config.ts`
- Create: 七个 `scicompass/packages/<name>/package.json` + `tsconfig.json`（skills 包无 src，仅承载 markdown）

- [ ] **Step 1: 写根 package.json 与共享配置**

```jsonc
// scicompass/package.json
{
  "name": "scicompass-workspace", "private": true, "type": "module",
  "workspaces": ["packages/*"],
  "scripts": {
    "test": "vitest run", "typecheck": "tsc -b packages/core packages/labontology packages/labkag packages/labharness packages/lablibrary packages/cli",
    "build": "npm run typecheck"
  },
  "devDependencies": { "typescript": "^5.5.0", "vitest": "^2.0.0", "@types/node": "^20.0.0", "@types/better-sqlite3": "^7.6.0" },
  "dependencies": {
    "better-sqlite3": "^11.0.0", "zod": "^3.23.0", "yaml": "^2.4.0", "ajv": "^8.16.0",
    "@modelcontextprotocol/sdk": "^1.0.0"
  }
}
```

```jsonc
// scicompass/tsconfig.base.json
{ "compilerOptions": { "target": "ES2022", "module": "NodeNext", "moduleResolution": "NodeNext",
  "strict": true, "declaration": true, "composite": true, "skipLibCheck": true, "outDir": "dist", "rootDir": "src" } }
```

```ts
// scicompass/vitest.config.ts
import { defineConfig } from 'vitest/config';
export default defineConfig({ test: { include: ['packages/**/*.test.ts', 'e2e/**/*.test.ts'], pool: 'forks' } });
```

每个包的 `package.json`（以 core 为例，其余同形替换 name；含包间依赖：labkag 依赖 core+labontology；labharness 依赖 core+labontology+labkag；cli 依赖全部）：

```jsonc
{ "name": "@scicompass/core", "version": "0.1.0", "type": "module",
  "main": "dist/index.js", "types": "dist/index.d.ts",
  "scripts": { "build": "tsc -b" } }
```

每包 `tsconfig.json`：`{ "extends": "../../tsconfig.base.json", "references": [/* 按依赖填 */] }`。
cli 包 package.json 增加：`"bin": { "scicompass": "dist/main.js", "luopan": "dist/main.js" }`。

- [ ] **Step 2: 安装依赖并确认空测试运行**

Run: `cd scicompass && npm install && npx vitest run`
Expected: `No test files found`（退出码 0 或 vitest 报无测试——允许，后续任务补测试）

- [ ] **Step 3: Commit**

```bash
git add scicompass && git commit -m "Scaffold scicompass workspace with seven packages"
```

---

### Task 1: core/provenance —— 溯源 URI 规范

**Files:**
- Create: `scicompass/packages/core/src/provenance.ts`, `src/ids.ts`, `src/index.ts`
- Test: `scicompass/packages/core/src/provenance.test.ts`

- [ ] **Step 1: 写失败测试**

```ts
// provenance.test.ts
import { describe, it, expect } from 'vitest';
import { parseProvenanceUri, makeGraphNodeUri, makeRecordUri } from './provenance.js';

describe('provenance URIs', () => {
  it('parses labgraph node uri', () => {
    expect(parseProvenanceUri('labgraph://prj-mof/node/n1'))
      .toEqual({ scheme: 'labgraph', host: 'prj-mof', kind: 'node', id: 'n1' });
  });
  it('parses scicompass record uri', () => {
    expect(parseProvenanceUri('scicompass://results/r9'))
      .toEqual({ scheme: 'scicompass', host: 'results', kind: 'record', id: 'r9' });
  });
  it('builders roundtrip', () => {
    expect(makeGraphNodeUri('grp-ma', 'n2')).toBe('labgraph://grp-ma/node/n2');
    expect(makeRecordUri('runs', 'run-1')).toBe('scicompass://runs/run-1');
  });
  it('rejects unknown scheme', () => {
    expect(() => parseProvenanceUri('http://x/y')).toThrow(/unsupported/i);
  });
});
```

- [ ] **Step 2: 运行确认失败**　Run: `npx vitest run packages/core` → FAIL（模块不存在）

- [ ] **Step 3: 实现**

```ts
// ids.ts
import { randomBytes } from 'node:crypto';
export const newId = (prefix: string) => `${prefix}-${randomBytes(6).toString('hex')}`;
export const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9一-鿿]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48) || 'x';
```

```ts
// provenance.ts
export interface ParsedUri { scheme: 'labgraph' | 'scicompass'; host: string; kind: 'node' | 'record'; id: string }
export function parseProvenanceUri(uri: string): ParsedUri {
  const m = /^(labgraph|scicompass):\/\/([^/]+)\/(?:(node)\/)?([^/]+)$/.exec(uri);
  if (!m) throw new Error(`unsupported provenance uri: ${uri}`);
  const [, scheme, host, nodeKw, id] = m;
  if (scheme === 'labgraph') {
    if (nodeKw !== 'node') throw new Error(`unsupported provenance uri: ${uri}`);
    return { scheme, host, kind: 'node', id };
  }
  return { scheme: 'scicompass', host, kind: 'record', id };
}
export const makeGraphNodeUri = (graphSlug: string, nodeId: string) => `labgraph://${graphSlug}/node/${nodeId}`;
export const makeRecordUri = (table: string, id: string) => `scicompass://${table}/${id}`;
```

```ts
// index.ts（聚合导出，后续任务持续追加）
export * from './provenance.js';
export * from './ids.js';
```

- [ ] **Step 4: 测试通过**　Run: `npx vitest run packages/core` → PASS
- [ ] **Step 5: Commit**　`git add -A scicompass/packages/core && git commit -m "Add provenance URI scheme to core"`

---

### Task 2: core/storage —— SQLite 打开与迁移框架

**Files:**
- Create: `scicompass/packages/core/src/storage.ts`
- Modify: `scicompass/packages/core/src/index.ts`（追加 `export * from './storage.js'`）
- Test: `scicompass/packages/core/src/storage.test.ts`

- [ ] **Step 1: 失败测试**

```ts
import { describe, it, expect } from 'vitest';
import { mkdtempSync } from 'node:fs'; import { tmpdir } from 'node:os'; import { join } from 'node:path';
import { openDb } from './storage.js';

describe('openDb', () => {
  it('runs migrations once and is idempotent', () => {
    const dir = mkdtempSync(join(tmpdir(), 'sc-'));
    const migrations = [{ id: 1, sql: 'CREATE TABLE t(a TEXT);' }, { id: 2, sql: "INSERT INTO t VALUES('x');" }];
    const db1 = openDb(join(dir, 'a.db'), migrations); db1.close();
    const db2 = openDb(join(dir, 'a.db'), migrations);
    expect(db2.prepare('SELECT COUNT(*) c FROM t').get()).toEqual({ c: 1 });
    expect(db2.pragma('journal_mode', { simple: true })).toBe('wal');
    db2.close();
  });
});
```

- [ ] **Step 2: 确认失败**　→ FAIL
- [ ] **Step 3: 实现**

```ts
// storage.ts
import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs'; import { dirname } from 'node:path';
export interface Migration { id: number; sql: string }
export type Db = Database.Database;
export function openDb(file: string, migrations: Migration[]): Db {
  mkdirSync(dirname(file), { recursive: true });
  const db = new Database(file);
  db.pragma('journal_mode = WAL');
  db.exec('CREATE TABLE IF NOT EXISTS _migrations(id INTEGER PRIMARY KEY, applied_at TEXT NOT NULL)');
  const done = new Set(db.prepare('SELECT id FROM _migrations').all().map((r: any) => r.id));
  const mark = db.prepare('INSERT INTO _migrations(id, applied_at) VALUES(?, ?)');
  for (const m of [...migrations].sort((a, b) => a.id - b.id)) {
    if (done.has(m.id)) continue;
    db.transaction(() => { db.exec(m.sql); mark.run(m.id, new Date().toISOString()); })();
  }
  return db;
}
```

- [ ] **Step 4: 通过**　→ PASS
- [ ] **Step 5: Commit**　`git commit -am "Add sqlite open/migration framework to core"`

---

### Task 3: core/contracts —— zod 合同（图、记录、运行、文献、项目）

**Files:**
- Create: `scicompass/packages/core/src/contracts/{graph.ts,records.ts,run.ts,library.ts,project.ts}`
- Modify: `src/index.ts` 追加导出
- Test: `scicompass/packages/core/src/contracts/contracts.test.ts`

- [ ] **Step 1: 失败测试（抽核心断言，不逐字段穷举）**

```ts
import { describe, it, expect } from 'vitest';
import { GraphNode, GraphWriteInput, PromoteInput } from './graph.js';
import { RunSubmitInput, RUN_STATUSES } from './run.js';
import { ResultRegisterInput } from './records.js';

describe('contracts', () => {
  it('GraphNode requires provenance array', () => {
    const r = GraphNode.safeParse({ id: 'n1', type: 'Objective', label: 'x', detail: '', round: 1, attrs: {}, provenance: [] });
    expect(r.success).toBe(true);
  });
  it('RunSubmitInput restricts mode', () => {
    expect(RunSubmitInput.safeParse({ projectId: 'p', protocolId: 'pr', protocolVersion: 1, deviceId: 'd', mode: 'teleport', params: {} }).success).toBe(false);
  });
  it('result two-tier provenance: device-run results need runId+protocol', () => {
    const bad = ResultRegisterInput.safeParse({ origin: 'device-run', deviceId: 'd', summary: {}, params: {}, at: 't' });
    expect(bad.success).toBe(false);
    const manual = ResultRegisterInput.safeParse({ origin: 'manual-instrument', deviceId: 'd', summary: { y: 1 }, params: { t: 25 }, at: '2026-06-12T00:00:00Z' });
    expect(manual.success).toBe(true);
  });
  it('run statuses fixed set', () => expect(RUN_STATUSES).toContain('awaiting-approval'));
});
```

- [ ] **Step 2: 确认失败**
- [ ] **Step 3: 实现**

```ts
// contracts/graph.ts
import { z } from 'zod';
export const ProvenanceRefs = z.array(z.string().min(1));
export const GraphNode = z.object({
  id: z.string(), type: z.string(), label: z.string(), detail: z.string().default(''),
  round: z.number().int().positive().default(1),
  attrs: z.record(z.unknown()).default({}), provenance: ProvenanceRefs.default([])
});
export const GraphEdge = z.object({ id: z.string(), source: z.string(), target: z.string(), label: z.string() });
export const GraphWriteInput = z.object({
  graph: z.string(), nodes: z.array(GraphNode).default([]), edges: z.array(GraphEdge).default([])
});
export const GraphQueryInput = z.object({
  graph: z.string(), type: z.string().optional(), round: z.number().int().optional(),
  headOnly: z.boolean().default(false), limit: z.number().int().positive().max(500).default(100)
});
export const PromoteInput = z.object({
  fromGraph: z.string(), toGraph: z.string(), sourceNodeIds: z.array(z.string()).min(1),
  capsule: z.object({ headType: z.enum(['Lesson', 'Method', 'Prior', 'NegativeResult']),
    title: z.string().min(1), summary: z.string().min(1),
    supportNodes: z.array(GraphNode).default([]), edges: z.array(GraphEdge).default([]) }),
  confirmedBy: z.string().min(1),
  sanitizationChecked: z.boolean().default(false), irreversibleAck: z.boolean().default(false)
});
export type GraphNodeT = z.infer<typeof GraphNode>;
```

```ts
// contracts/run.ts
import { z } from 'zod';
export const RUN_STATUSES = ['awaiting-approval', 'rejected', 'queued', 'running', 'paused', 'completed', 'failed', 'aborted'] as const;
export const RunStatus = z.enum(RUN_STATUSES);
export const RunSubmitInput = z.object({
  projectId: z.string(), protocolId: z.string(), protocolVersion: z.number().int().positive(),
  deviceId: z.string(), experimentType: z.string().default('default'),
  mode: z.enum(['simulation', 'physical']), params: z.record(z.unknown()).default({})
});
export const RunControlInput = z.object({ runId: z.string(), action: z.enum(['pause', 'resume', 'abort']), actor: z.string().min(1) });
export const RunApproveInput = z.object({ runId: z.string(), decision: z.enum(['approve', 'reject']), confirmedBy: z.string().min(1), note: z.string().default('') });
```

```ts
// contracts/records.ts
import { z } from 'zod';
export const ArtifactSaveInput = z.object({
  projectId: z.string(), kind: z.enum(['report', 'hypothesis', 'suggestion', 'analysis', 'logbook', 'tool']),
  title: z.string().min(1), content: z.string().min(1),
  payload: z.record(z.unknown()).default({}), provenance: z.array(z.string()).default([])
});
export const ProtocolSaveInput = z.object({
  projectId: z.string(), objective: z.string().min(1), payload: z.record(z.unknown())
});
const base = { deviceId: z.string(), summary: z.record(z.unknown()), params: z.record(z.unknown()), at: z.string().min(1),
  filePath: z.string().optional(), upstreamRunId: z.string().optional(), projectId: z.string().optional() };
export const ResultRegisterInput = z.discriminatedUnion('origin', [
  z.object({ origin: z.literal('device-run'), runId: z.string(), protocolId: z.string(), protocolVersion: z.number().int(), ...base }),
  z.object({ origin: z.literal('manual-instrument'), ...base })
]);
```

```ts
// contracts/library.ts
import { z } from 'zod';
export const LiteratureImportInput = z.discriminatedUnion('via', [
  z.object({ via: z.literal('file'), projectId: z.string(), path: z.string(), title: z.string().optional() }),
  z.object({ via: z.literal('doi'), projectId: z.string(), doi: z.string() }),
  z.object({ via: z.literal('bibtex'), projectId: z.string(), bibtex: z.string().min(10) })
]);
export const LiteratureSearchInput = z.object({ projectId: z.string(), q: z.string().min(1), limit: z.number().int().max(50).default(10) });
```

```ts
// contracts/project.ts
import { z } from 'zod';
export const ProjectCreateInput = z.object({ name: z.string().min(1), objective: z.string().min(1) });
```

- [ ] **Step 4: 通过**　- [ ] **Step 5: Commit**　`git commit -am "Add zod contracts for graph, run, records, library, project"`

---

### Task 4: labontology —— 本体包与加载

**Files:**
- Create: `scicompass/packages/labontology/ontologies/chemistry/v1/vocabulary.yaml`、`constraints.yaml`
- Create: `src/load.ts`、`src/index.ts`
- Test: `src/load.test.ts`

- [ ] **Step 1: 写本体种子（数据即设计，直接落盘）**

```yaml
# vocabulary.yaml
space: chemistry
version: v1
nodeTypes: [Objective, Hypothesis, LiteratureEvidence, SciGraphEntity, ReportClaim,
  Protocol, OntologyConstraint, Run, Observation, Result, Analysis, NextSuggestion,
  Lesson, Method, Prior, NegativeResult, Rule, Device]
edgeLabels: [supports, contradicts, derives-from, validates, produced, anchors, supersedes, about]
provenanceRequired: [LiteratureEvidence, ReportClaim, Protocol, Run, Observation, Result,
  Analysis, NextSuggestion, Lesson, Method, Prior, NegativeResult, Rule]
```

```yaml
# constraints.yaml —— 领域约束（mock 规则集，结构即合同）
forbiddenPairs:
  - [sodium-azide, heavy-metal-salt]
  - [strong-oxidizer, organic-solvent-bulk]
parameterBounds:
  temperatureC: { min: -20, max: 150 }
processRules:
  - id: physical-needs-approval
    text: physical 运行必须经 run_approve 批准
  - id: result-needs-provenance
    text: 结果登记必须满足两档溯源
```

- [ ] **Step 2: 失败测试**

```ts
import { describe, it, expect } from 'vitest';
import { loadOntology } from './load.js';
describe('loadOntology', () => {
  it('loads chemistry v1', () => {
    const o = loadOntology('chemistry', 'v1');
    expect(o.nodeTypes).toContain('Lesson');
    expect(o.constraints.parameterBounds.temperatureC.max).toBe(150);
  });
  it('throws on unknown space', () => expect(() => loadOntology('alchemy', 'v1')).toThrow());
});
```

- [ ] **Step 3: 实现**

```ts
// load.ts
import { readFileSync } from 'node:fs'; import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url'; import { parse } from 'yaml';
const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'ontologies');
export interface Ontology {
  space: string; version: string; nodeTypes: string[]; edgeLabels: string[];
  provenanceRequired: string[];
  constraints: { forbiddenPairs: string[][]; parameterBounds: Record<string, { min: number; max: number }>;
    processRules: { id: string; text: string }[] };
}
export function loadOntology(space: string, version: string): Ontology {
  const dir = join(root, space, version);
  const vocab = parse(readFileSync(join(dir, 'vocabulary.yaml'), 'utf8'));
  const constraints = parse(readFileSync(join(dir, 'constraints.yaml'), 'utf8'));
  return { ...vocab, constraints };
}
```

注意：`ontologies/` 在包内随源码分发，`package.json` 增加 `"files": ["dist", "ontologies"]`；tsconfig 的 rootDir 仅约束 src。

- [ ] **Step 4: 通过**　- [ ] **Step 5: Commit**　`git commit -am "Add chemistry v1 ontology pack and loader"`

---

### Task 5: labontology —— 校验服务（validateNodes / check）

**Files:**
- Create: `src/validate.ts`、`src/service.ts`；Modify: `src/index.ts`
- Test: `src/validate.test.ts`

- [ ] **Step 1: 失败测试**

```ts
import { describe, it, expect } from 'vitest';
import { loadOntology } from './load.js';
import { validateNodes, checkIntent } from './validate.js';
const o = loadOntology('chemistry', 'v1');

describe('validateNodes', () => {
  it('rejects unknown node type', () => {
    const errs = validateNodes(o, [{ id: 'n', type: 'Dragon', label: 'x', detail: '', round: 1, attrs: {}, provenance: [] }]);
    expect(errs[0]).toMatch(/unknown node type/i);
  });
  it('rejects missing provenance where required', () => {
    const errs = validateNodes(o, [{ id: 'n', type: 'Result', label: 'x', detail: '', round: 1, attrs: {}, provenance: [] }]);
    expect(errs[0]).toMatch(/provenance required/i);
  });
  it('passes valid node', () => {
    expect(validateNodes(o, [{ id: 'n', type: 'Objective', label: 'x', detail: '', round: 1, attrs: {}, provenance: [] }])).toEqual([]);
  });
});

describe('checkIntent', () => {
  it('flags forbidden pair and out-of-bound temperature', () => {
    const r = checkIntent(o, { reagents: ['sodium-azide', 'heavy-metal-salt'], params: { temperatureC: 200 } });
    expect(r.ok).toBe(false);
    expect(r.violations.join(' ')).toMatch(/forbidden pair/i);
    expect(r.violations.join(' ')).toMatch(/temperatureC/);
  });
  it('passes safe intent', () => {
    expect(checkIntent(o, { reagents: ['water'], params: { temperatureC: 60 } }).ok).toBe(true);
  });
});
```

- [ ] **Step 2: 确认失败**
- [ ] **Step 3: 实现**

```ts
// validate.ts
import type { Ontology } from './load.js';
export interface NodeLike { id: string; type: string; label: string; detail: string; round: number; attrs: Record<string, unknown>; provenance: string[] }
export function validateNodes(o: Ontology, nodes: NodeLike[]): string[] {
  const errs: string[] = [];
  for (const n of nodes) {
    if (!o.nodeTypes.includes(n.type)) errs.push(`unknown node type: ${n.type} (${n.id})`);
    else if (o.provenanceRequired.includes(n.type) && n.provenance.length === 0)
      errs.push(`provenance required for type ${n.type} (${n.id})`);
  }
  return errs;
}
export function validateEdgeLabels(o: Ontology, labels: string[]): string[] {
  return labels.filter((l) => !o.edgeLabels.includes(l)).map((l) => `unknown edge label: ${l}`);
}
export interface Intent { reagents?: string[]; params?: Record<string, unknown> }
export function checkIntent(o: Ontology, intent: Intent): { ok: boolean; violations: string[] } {
  const v: string[] = [];
  const set = new Set((intent.reagents ?? []).map((s) => s.toLowerCase()));
  for (const [a, b] of o.constraints.forbiddenPairs)
    if (set.has(a) && set.has(b)) v.push(`forbidden pair: ${a} + ${b}`);
  for (const [k, bound] of Object.entries(o.constraints.parameterBounds)) {
    const val = intent.params?.[k];
    if (typeof val === 'number' && (val < bound.min || val > bound.max))
      v.push(`${k}=${val} out of bounds [${bound.min}, ${bound.max}]`);
  }
  return { ok: v.length === 0, violations: v };
}
```

```ts
// service.ts —— 给 MCP 层用的薄封装（active ontology 由 config 决定，v0.1 固定 chemistry/v1）
import { loadOntology, type Ontology } from './load.js';
import { validateNodes, validateEdgeLabels, checkIntent, type NodeLike, type Intent } from './validate.js';
export class OntologyService {
  readonly ontology: Ontology;
  constructor(space = 'chemistry', version = 'v1') { this.ontology = loadOntology(space, version); }
  get(): Ontology { return this.ontology; }
  validateGraphWrite(nodes: NodeLike[], edgeLabels: string[]): string[] {
    return [...validateNodes(this.ontology, nodes), ...validateEdgeLabels(this.ontology, edgeLabels)];
  }
  check(intent: Intent) { return checkIntent(this.ontology, intent); }
}
```

- [ ] **Step 4: 通过**　- [ ] **Step 5: Commit**　`git commit -am "Add ontology validation service"`

---

### Task 6: labkag —— 图库注册表与 GraphStore

**Files:**
- Create: `scicompass/packages/labkag/src/{registry.ts,graphStore.ts}`、`src/index.ts`
- Test: `src/graphStore.test.ts`

- [ ] **Step 1: 失败测试**

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { mkdtempSync } from 'node:fs'; import { tmpdir } from 'node:os'; import { join } from 'node:path';
import { GraphRegistry } from './registry.js';

let dataHome: string;
beforeEach(() => { dataHome = mkdtempSync(join(tmpdir(), 'sc-')); });

describe('GraphRegistry + GraphStore', () => {
  it('creates project graph file and writes/queries nodes', () => {
    const reg = new GraphRegistry(dataHome);
    const g = reg.open('prj-mof', 'prj');
    g.write([{ id: 'n1', type: 'Objective', label: 'MOF 稳定性', detail: '', round: 1, attrs: {}, provenance: [] }], []);
    const rows = g.query({ type: 'Objective' });
    expect(rows.nodes).toHaveLength(1);
    expect(reg.list().map((r) => r.slug)).toContain('prj-mof');
  });
  it('edge endpoints must exist in same graph (self-contained)', () => {
    const g = new GraphRegistry(dataHome).open('prj-a', 'prj');
    expect(() => g.write([], [{ id: 'e1', source: 'ghost', target: 'ghost2', label: 'supports' }]))
      .toThrow(/endpoint/i);
  });
});
```

- [ ] **Step 2: 确认失败**
- [ ] **Step 3: 实现**

```ts
// graphStore.ts
import { openDb, type Db } from '@scicompass/core';
const MIGRATIONS = [{ id: 1, sql: `
  CREATE TABLE nodes(id TEXT PRIMARY KEY, type TEXT NOT NULL, label TEXT NOT NULL,
    detail TEXT NOT NULL DEFAULT '', round INTEGER NOT NULL DEFAULT 1,
    attrs TEXT NOT NULL DEFAULT '{}', provenance TEXT NOT NULL DEFAULT '[]', created_at TEXT NOT NULL);
  CREATE TABLE edges(id TEXT PRIMARY KEY, source TEXT NOT NULL, target TEXT NOT NULL,
    label TEXT NOT NULL, created_at TEXT NOT NULL);
  CREATE INDEX idx_nodes_type ON nodes(type); CREATE INDEX idx_nodes_round ON nodes(round);` }];
export interface NodeRow { id: string; type: string; label: string; detail: string; round: number;
  attrs: Record<string, unknown>; provenance: string[] }
export interface EdgeRow { id: string; source: string; target: string; label: string }
export class GraphStore {
  constructor(readonly slug: string, private db: Db) {}
  static open(slug: string, file: string) { return new GraphStore(slug, openDb(file, MIGRATIONS)); }
  write(nodes: NodeRow[], edges: EdgeRow[]) {
    const now = new Date().toISOString();
    const insN = this.db.prepare(`INSERT OR REPLACE INTO nodes(id,type,label,detail,round,attrs,provenance,created_at)
      VALUES(@id,@type,@label,@detail,@round,@attrs,@provenance,@created_at)`);
    const insE = this.db.prepare(`INSERT OR REPLACE INTO edges(id,source,target,label,created_at) VALUES(?,?,?,?,?)`);
    const has = this.db.prepare('SELECT 1 FROM nodes WHERE id=?');
    this.db.transaction(() => {
      for (const n of nodes) insN.run({ ...n, attrs: JSON.stringify(n.attrs), provenance: JSON.stringify(n.provenance), created_at: now });
      for (const e of edges) {
        const ok = (id: string) => has.get(id) || nodes.some((n) => n.id === id);
        if (!ok(e.source) || !ok(e.target)) throw new Error(`edge ${e.id}: endpoint missing in graph ${this.slug}`);
        insE.run(e.id, e.source, e.target, e.label, now);
      }
    })();
  }
  query(opts: { type?: string; round?: number; headOnly?: boolean; limit?: number } = {}) {
    const heads = ['Lesson', 'Method', 'Prior', 'NegativeResult'];
    const cond: string[] = []; const args: unknown[] = [];
    if (opts.type) { cond.push('type=?'); args.push(opts.type); }
    if (opts.round) { cond.push('round=?'); args.push(opts.round); }
    if (opts.headOnly) cond.push(`type IN (${heads.map(() => '?').join(',')})`), args.push(...heads);
    const where = cond.length ? `WHERE ${cond.join(' AND ')}` : '';
    const nodes = this.db.prepare(`SELECT * FROM nodes ${where} ORDER BY created_at LIMIT ?`)
      .all(...args, opts.limit ?? 100).map((r: any) => ({ ...r, attrs: JSON.parse(r.attrs), provenance: JSON.parse(r.provenance) }));
    const edges = this.db.prepare('SELECT id,source,target,label FROM edges').all() as EdgeRow[];
    return { nodes, edges };
  }
  nodeIds(): Set<string> { return new Set(this.db.prepare('SELECT id FROM nodes').all().map((r: any) => r.id)); }
}
```

```ts
// registry.ts
import { join } from 'node:path';
import { openDb, type Db } from '@scicompass/core';
import { GraphStore } from './graphStore.js';
const MAIN = [{ id: 1, sql: `CREATE TABLE graphs(slug TEXT PRIMARY KEY, kind TEXT NOT NULL, file TEXT NOT NULL, created_at TEXT NOT NULL);` }];
export type GraphKind = 'prj' | 'grp' | 'open' | 'rules';
export class GraphRegistry {
  private db: Db;
  constructor(readonly dataHome: string) { this.db = openDb(join(dataHome, 'scicompass.db'), MAIN); }
  open(slug: string, kind: GraphKind): GraphStore {
    const file = join(this.dataHome, 'graphs', `${kind === 'rules' ? 'harness-rules-' : 'labgraph-'}${slug}.db`);
    this.db.prepare('INSERT OR IGNORE INTO graphs(slug,kind,file,created_at) VALUES(?,?,?,?)')
      .run(slug, kind, file, new Date().toISOString());
    return GraphStore.open(slug, file);
  }
  list() { return this.db.prepare('SELECT slug,kind,file FROM graphs').all() as { slug: string; kind: GraphKind; file: string }[]; }
}
```

注意：`scicompass.db` 的迁移表按库隔离（每个 db 文件自带 `_migrations`），主库后续任务各自追加迁移 id 不冲突（registry 用 1x 段、library 用 2x 段、harness 用 3x 段、records 用 4x 段——执行时严格遵守该编号段约定，避免迁移 id 碰撞）。

- [ ] **Step 4: 通过**　- [ ] **Step 5: Commit**　`git commit -am "Add graph registry and per-file graph store"`

---

### Task 7: labkag —— KagService（经本体校验的写入与查询）

**Files:**
- Create: `src/kag.ts`；Modify: `src/index.ts`
- Test: `src/kag.test.ts`

- [ ] **Step 1: 失败测试**

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { mkdtempSync } from 'node:fs'; import { tmpdir } from 'node:os'; import { join } from 'node:path';
import { OntologyService } from '@scicompass/labontology';
import { KagService } from './kag.js';

let kag: KagService;
beforeEach(() => { kag = new KagService(mkdtempSync(join(tmpdir(), 'sc-')), new OntologyService()); });

describe('KagService.write', () => {
  it('rejects unknown type via ontology', () => {
    expect(() => kag.write({ graph: 'prj-a', nodes: [{ id: 'n', type: 'Dragon', label: 'x', detail: '', round: 1, attrs: {}, provenance: [] }], edges: [] }))
      .toThrow(/unknown node type/i);
  });
  it('writes valid objective and queries it back', () => {
    kag.write({ graph: 'prj-a', nodes: [{ id: 'n1', type: 'Objective', label: 'goal', detail: '', round: 1, attrs: {}, provenance: [] }], edges: [] });
    expect(kag.query({ graph: 'prj-a', type: 'Objective', headOnly: false, limit: 10 }).nodes[0].label).toBe('goal');
  });
});
```

- [ ] **Step 2: 确认失败**
- [ ] **Step 3: 实现**

```ts
// kag.ts
import { GraphRegistry, type GraphKind } from './registry.js';
import type { OntologyService } from '@scicompass/labontology';
import { z } from 'zod';
import { GraphWriteInput, GraphQueryInput } from '@scicompass/core';
export class KagService {
  readonly registry: GraphRegistry;
  constructor(dataHome: string, readonly ontology: OntologyService) { this.registry = new GraphRegistry(dataHome); }
  private kindOf(slug: string): GraphKind {
    if (slug.startsWith('prj-')) return 'prj';
    if (slug.endsWith('-open')) return 'open';
    if (slug.startsWith('grp-')) return 'grp';
    throw new Error(`cannot infer graph kind from slug: ${slug}`);
  }
  open(slug: string) { return this.registry.open(slug, this.kindOf(slug)); }
  write(input: z.infer<typeof GraphWriteInput>) {
    const { graph, nodes, edges } = GraphWriteInput.parse(input);
    const errs = this.ontology.validateGraphWrite(nodes, edges.map((e) => e.label));
    if (errs.length) throw new Error(`ontology validation failed: ${errs.join('; ')}`);
    this.open(graph).write(nodes, edges);
    return { written: { nodes: nodes.length, edges: edges.length } };
  }
  query(input: z.infer<typeof GraphQueryInput>) {
    const { graph, ...opts } = GraphQueryInput.parse(input);
    return this.open(graph).query(opts);
  }
}
```

- [ ] **Step 4: 通过**　- [ ] **Step 5: Commit**　`git commit -am "Add ontology-validated kag write/query service"`

---

### Task 8: labkag —— 蒸馏晋升（promote）与闸门分级

**Files:**
- Create: `src/promote.ts`；Modify: `src/kag.ts`（挂方法）、`src/index.ts`
- Test: `src/promote.test.ts`

- [ ] **Step 1: 失败测试**

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { mkdtempSync } from 'node:fs'; import { tmpdir } from 'node:os'; import { join } from 'node:path';
import { OntologyService } from '@scicompass/labontology';
import { KagService } from './kag.js';

let kag: KagService;
beforeEach(() => {
  kag = new KagService(mkdtempSync(join(tmpdir(), 'sc-')), new OntologyService());
  kag.write({ graph: 'prj-a', nodes: [
    { id: 'run1', type: 'Run', label: 'run', detail: '', round: 1, attrs: {}, provenance: ['scicompass://runs/run1'] },
    { id: 'res1', type: 'Result', label: 'yield 12%', detail: '', round: 1, attrs: {}, provenance: ['scicompass://results/res1'] }
  ], edges: [{ id: 'e1', source: 'run1', target: 'res1', label: 'produced' }] });
});

const capsule = { headType: 'Lesson' as const, title: '高温产率劣化', summary: '该配体类高温下产率显著劣化', supportNodes: [], edges: [] };

describe('graph_promote', () => {
  it('prj->grp creates capsule head with provenance URIs back to source', () => {
    const out = kag.promote({ fromGraph: 'prj-a', toGraph: 'grp-ma', sourceNodeIds: ['run1', 'res1'],
      capsule, confirmedBy: '麻老师', sanitizationChecked: false, irreversibleAck: false });
    const grp = kag.query({ graph: 'grp-ma', headOnly: true, limit: 10 });
    expect(grp.nodes[0].type).toBe('Lesson');
    expect(grp.nodes[0].provenance).toContain('labgraph://prj-a/node/run1');
    expect(out.headNodeId).toBe(grp.nodes[0].id);
  });
  it('source nodes are untouched (re-expression, not move)', () => {
    kag.promote({ fromGraph: 'prj-a', toGraph: 'grp-ma', sourceNodeIds: ['res1'], capsule, confirmedBy: 'x', sanitizationChecked: false, irreversibleAck: false });
    expect(kag.query({ graph: 'prj-a', headOnly: false, limit: 10 }).nodes).toHaveLength(2);
  });
  it('grp->open requires sanitization + irreversible ack', () => {
    kag.promote({ fromGraph: 'prj-a', toGraph: 'grp-ma', sourceNodeIds: ['res1'], capsule, confirmedBy: 'x', sanitizationChecked: false, irreversibleAck: false });
    const head = kag.query({ graph: 'grp-ma', headOnly: true, limit: 1 }).nodes[0];
    expect(() => kag.promote({ fromGraph: 'grp-ma', toGraph: 'grp-ma-open', sourceNodeIds: [head.id], capsule, confirmedBy: 'PI', sanitizationChecked: false, irreversibleAck: false }))
      .toThrow(/sanitization|irreversible/i);
  });
  it('rejects missing source node', () => {
    expect(() => kag.promote({ fromGraph: 'prj-a', toGraph: 'grp-ma', sourceNodeIds: ['ghost'], capsule, confirmedBy: 'x', sanitizationChecked: false, irreversibleAck: false }))
      .toThrow(/source node/i);
  });
});
```

- [ ] **Step 2: 确认失败**
- [ ] **Step 3: 实现**

```ts
// promote.ts
import { z } from 'zod';
import { PromoteInput, makeGraphNodeUri, newId } from '@scicompass/core';
import type { KagService } from './kag.js';
export function promote(kag: KagService, raw: z.infer<typeof PromoteInput>) {
  const input = PromoteInput.parse(raw);
  const from = kag.open(input.fromGraph);
  const ids = from.nodeIds();
  for (const sid of input.sourceNodeIds) if (!ids.has(sid)) throw new Error(`source node not found: ${sid}`);
  const toKind = input.toGraph.endsWith('-open') ? 'open' : 'grp';
  if (toKind === 'open' && (!input.sanitizationChecked || !input.irreversibleAck))
    throw new Error('open promotion requires sanitizationChecked and irreversibleAck (irreversible publication gate)');
  const headId = newId('cap');
  const provenance = input.sourceNodeIds.map((sid) => makeGraphNodeUri(input.fromGraph, sid));
  const head = { id: headId, type: input.capsule.headType, label: input.capsule.title,
    detail: input.capsule.summary, round: 1,
    attrs: { status: 'active', confirmedBy: input.confirmedBy, promotedAt: new Date().toISOString() },
    provenance };
  kag.write({ graph: input.toGraph, nodes: [head, ...input.capsule.supportNodes], edges: input.capsule.edges });
  return { headNodeId: headId, provenance };
}
```

`kag.ts` 追加：`promote(raw) { return promote_(this, raw); }`（import 重命名 `promote as promote_`）。

- [ ] **Step 4: 通过**　- [ ] **Step 5: Commit**　`git commit -am "Add distillation promote with tiered gates"`

---

### Task 9: labkag —— graph_export 与 align_public（mock 锚定）

**Files:**
- Create: `src/exportMd.ts`、`src/alignPublic.ts`；Modify: `src/index.ts`
- Test: `src/exportAlign.test.ts`

- [ ] **Step 1: 失败测试**

```ts
import { describe, it, expect } from 'vitest';
import { mkdtempSync } from 'node:fs'; import { tmpdir } from 'node:os'; import { join } from 'node:path';
import { OntologyService } from '@scicompass/labontology';
import { KagService } from './kag.js';
import { exportGraphMarkdown } from './exportMd.js';
import { alignPublic } from './alignPublic.js';

it('exports markdown with node and edge sections', () => {
  const kag = new KagService(mkdtempSync(join(tmpdir(), 'sc-')), new OntologyService());
  kag.write({ graph: 'prj-a', nodes: [{ id: 'n1', type: 'Objective', label: 'goal', detail: 'd', round: 1, attrs: {}, provenance: [] }], edges: [] });
  const md = exportGraphMarkdown(kag, 'prj-a');
  expect(md).toContain('# LabGraph: prj-a');
  expect(md).toContain('goal');
});

it('align_public returns deterministic mock anchors and writes anchor attr', () => {
  const kag = new KagService(mkdtempSync(join(tmpdir(), 'sc-')), new OntologyService());
  kag.write({ graph: 'prj-a', nodes: [{ id: 'n1', type: 'SciGraphEntity', label: '偶联反应', detail: '', round: 1, attrs: {}, provenance: ['scicompass://literature/l1'] }], edges: [] });
  const out = alignPublic(kag, { graph: 'prj-a', nodeIds: ['n1'] });
  expect(out.anchors[0].anchor).toMatch(/^scigraph:\/\//);
  expect(kag.query({ graph: 'prj-a', headOnly: false, limit: 5 }).nodes[0].attrs.scigraph_anchor).toBeDefined();
});
```

- [ ] **Step 2: 确认失败**
- [ ] **Step 3: 实现**

```ts
// exportMd.ts
import type { KagService } from './kag.js';
export function exportGraphMarkdown(kag: KagService, graph: string): string {
  const { nodes, edges } = kag.query({ graph, headOnly: false, limit: 500 });
  const lines = [`# LabGraph: ${graph}`, '', '## Nodes', ''];
  for (const n of nodes) lines.push(`- **[${n.type}] ${n.label}** (${n.id}, round ${n.round})${n.detail ? ` — ${n.detail}` : ''}`);
  lines.push('', '## Edges', '');
  for (const e of edges) lines.push(`- ${e.source} —${e.label}→ ${e.target}`);
  return lines.join('\n');
}
```

```ts
// alignPublic.ts —— v0.1 为确定性 mock；接口与真实 SciGraph MCP client 版完全一致
import { createHash } from 'node:crypto';
import type { KagService } from './kag.js';
const MOCK_KGS = ['ReaKE', 'ElementKG', 'Material'];
export function alignPublic(kag: KagService, input: { graph: string; nodeIds: string[] }) {
  const store = kag.open(input.graph);
  const { nodes } = store.query({ limit: 500 });
  const anchors = input.nodeIds.map((id) => {
    const n = nodes.find((x: any) => x.id === id);
    if (!n) throw new Error(`node not found: ${id}`);
    const h = createHash('sha1').update(n.label).digest('hex');
    const anchor = `scigraph://${MOCK_KGS[h.charCodeAt(0) % MOCK_KGS.length]}/node/${h.slice(0, 10)}`;
    store.write([{ ...n, attrs: { ...n.attrs, scigraph_anchor: anchor } }], []);
    return { nodeId: id, anchor, confidence: 0.8 };
  });
  return { anchors, source: 'mock' as const };
}
```

- [ ] **Step 4: 通过**　- [ ] **Step 5: Commit**　`git commit -am "Add graph export and mock public alignment"`

---

### Task 10: labkag —— records（项目 / 产物 / 协议 / 结果）

**Files:**
- Create: `src/records.ts`；Modify: `src/index.ts`
- Test: `src/records.test.ts`

- [ ] **Step 1: 失败测试**

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { mkdtempSync } from 'node:fs'; import { tmpdir } from 'node:os'; import { join } from 'node:path';
import { Records } from './records.js';

let rec: Records;
beforeEach(() => { rec = new Records(mkdtempSync(join(tmpdir(), 'sc-'))); });

describe('Records', () => {
  it('creates project and lists it', () => {
    const p = rec.projectCreate({ name: 'MOF 稳定性', objective: '湿气下稳定' });
    expect(rec.projectList()[0].id).toBe(p.id);
    expect(p.graphSlug).toMatch(/^prj-/);
  });
  it('protocol versions auto-increment per project', () => {
    const p = rec.projectCreate({ name: 'a', objective: 'b' });
    const v1 = rec.protocolSave({ projectId: p.id, objective: 'o', payload: { steps: [] } });
    const v2 = rec.protocolSave({ projectId: p.id, objective: 'o', payload: { steps: [1] } });
    expect([v1.version, v2.version]).toEqual([1, 2]);
  });
  it('device-run result requires run linkage (zod) and registers with provenance', () => {
    const r = rec.resultRegister({ origin: 'device-run', runId: 'run-1', protocolId: 'pr-1', protocolVersion: 1,
      deviceId: 'dev-xtalpi', summary: { yield: 0.41 }, params: { temperatureC: 60 }, at: new Date().toISOString() });
    expect(rec.resultGet(r.id).summary.yield).toBe(0.41);
  });
  it('artifact save/list roundtrip', () => {
    const p = rec.projectCreate({ name: 'a', objective: 'b' });
    rec.artifactSave({ projectId: p.id, kind: 'report', title: '综述', content: '## 共识', payload: {}, provenance: ['scicompass://literature/l1'] });
    expect(rec.artifactList(p.id, 'report')).toHaveLength(1);
  });
});
```

- [ ] **Step 2: 确认失败**
- [ ] **Step 3: 实现**

```ts
// records.ts
import { join } from 'node:path';
import { z } from 'zod';
import { openDb, type Db, newId, slugify, makeRecordUri,
  ProjectCreateInput, ArtifactSaveInput, ProtocolSaveInput, ResultRegisterInput } from '@scicompass/core';
const MIG = [{ id: 40, sql: `
  CREATE TABLE projects(id TEXT PRIMARY KEY, name TEXT, objective TEXT, graph_slug TEXT, created_at TEXT);
  CREATE TABLE artifacts(id TEXT PRIMARY KEY, project_id TEXT, kind TEXT, title TEXT, content TEXT,
    payload TEXT, provenance TEXT, created_at TEXT);
  CREATE TABLE protocols(id TEXT PRIMARY KEY, project_id TEXT, version INTEGER, objective TEXT,
    payload TEXT, created_at TEXT);
  CREATE TABLE results(id TEXT PRIMARY KEY, origin TEXT, run_id TEXT, protocol_id TEXT, protocol_version INTEGER,
    device_id TEXT, project_id TEXT, summary TEXT, params TEXT, file_path TEXT, upstream_run_id TEXT,
    at TEXT, provenance TEXT, created_at TEXT);` }];
export class Records {
  db: Db;
  constructor(dataHome: string) { this.db = openDb(join(dataHome, 'scicompass.db'), MIG); }
  projectCreate(raw: z.infer<typeof ProjectCreateInput>) {
    const { name, objective } = ProjectCreateInput.parse(raw);
    const id = newId('proj'); const graphSlug = `prj-${slugify(name)}`;
    this.db.prepare('INSERT INTO projects VALUES(?,?,?,?,?)').run(id, name, objective, graphSlug, new Date().toISOString());
    return { id, name, objective, graphSlug };
  }
  projectList() { return this.db.prepare('SELECT id,name,objective,graph_slug as graphSlug FROM projects').all() as any[]; }
  projectGet(id: string) {
    const p = this.db.prepare('SELECT id,name,objective,graph_slug as graphSlug FROM projects WHERE id=?').get(id);
    if (!p) throw new Error(`project not found: ${id}`); return p as any;
  }
  artifactSave(raw: z.infer<typeof ArtifactSaveInput>) {
    const a = ArtifactSaveInput.parse(raw); const id = newId('art');
    this.db.prepare('INSERT INTO artifacts VALUES(?,?,?,?,?,?,?,?)').run(id, a.projectId, a.kind, a.title, a.content,
      JSON.stringify(a.payload), JSON.stringify(a.provenance), new Date().toISOString());
    return { id, uri: makeRecordUri('artifacts', id) };
  }
  artifactList(projectId: string, kind?: string) {
    return this.db.prepare(`SELECT id,kind,title,created_at FROM artifacts WHERE project_id=? ${kind ? 'AND kind=?' : ''}`)
      .all(...(kind ? [projectId, kind] : [projectId])) as any[];
  }
  artifactGet(id: string) {
    const r: any = this.db.prepare('SELECT * FROM artifacts WHERE id=?').get(id);
    if (!r) throw new Error(`artifact not found: ${id}`);
    return { ...r, payload: JSON.parse(r.payload), provenance: JSON.parse(r.provenance) };
  }
  protocolSave(raw: z.infer<typeof ProtocolSaveInput>) {
    const p = ProtocolSaveInput.parse(raw);
    const v = (this.db.prepare('SELECT MAX(version) m FROM protocols WHERE project_id=?').get(p.projectId) as any).m ?? 0;
    const id = newId('prot');
    this.db.prepare('INSERT INTO protocols VALUES(?,?,?,?,?,?)').run(id, p.projectId, v + 1, p.objective,
      JSON.stringify(p.payload), new Date().toISOString());
    return { id, version: v + 1 };
  }
  protocolGet(id: string) {
    const r: any = this.db.prepare('SELECT * FROM protocols WHERE id=?').get(id);
    if (!r) throw new Error(`protocol not found: ${id}`);
    return { ...r, payload: JSON.parse(r.payload) };
  }
  resultRegister(raw: z.infer<typeof ResultRegisterInput>) {
    const r = ResultRegisterInput.parse(raw); const id = newId('res');
    const provenance = r.origin === 'device-run'
      ? [makeRecordUri('runs', r.runId), makeRecordUri('protocols', r.protocolId)]
      : (r.upstreamRunId ? [makeRecordUri('runs', r.upstreamRunId)] : []);
    this.db.prepare(`INSERT INTO results VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
      .run(id, r.origin, (r as any).runId ?? null, (r as any).protocolId ?? null, (r as any).protocolVersion ?? null,
        r.deviceId, r.projectId ?? null, JSON.stringify(r.summary), JSON.stringify(r.params),
        r.filePath ?? null, r.upstreamRunId ?? null, r.at, JSON.stringify(provenance), new Date().toISOString());
    return { id, uri: makeRecordUri('results', id) };
  }
  resultGet(id: string) {
    const r: any = this.db.prepare('SELECT * FROM results WHERE id=?').get(id);
    if (!r) throw new Error(`result not found: ${id}`);
    return { ...r, summary: JSON.parse(r.summary), params: JSON.parse(r.params), provenance: JSON.parse(r.provenance) };
  }
  resultList(filter: { runId?: string; projectId?: string } = {}) {
    const cond: string[] = []; const args: unknown[] = [];
    if (filter.runId) { cond.push('run_id=?'); args.push(filter.runId); }
    if (filter.projectId) { cond.push('project_id=?'); args.push(filter.projectId); }
    return this.db.prepare(`SELECT id,origin,run_id,device_id,at FROM results ${cond.length ? 'WHERE ' + cond.join(' AND ') : ''}`).all(...args) as any[];
  }
}
```

- [ ] **Step 4: 通过**　- [ ] **Step 5: Commit**　`git commit -am "Add records: projects, artifacts, protocols, results"`

---

### Task 11: labkag —— result_flowback（结果回流图谱）

**Files:**
- Modify: `src/kag.ts`（增加 `flowback`）；Test: `src/flowback.test.ts`

- [ ] **Step 1: 失败测试**

```ts
import { it, expect } from 'vitest';
import { mkdtempSync } from 'node:fs'; import { tmpdir } from 'node:os'; import { join } from 'node:path';
import { OntologyService } from '@scicompass/labontology';
import { KagService } from './kag.js';
import { Records } from './records.js';

it('flowback writes Result node linked to Run node with provenance', () => {
  const home = mkdtempSync(join(tmpdir(), 'sc-'));
  const kag = new KagService(home, new OntologyService());
  const rec = new Records(home);
  const p = rec.projectCreate({ name: 'a', objective: 'b' });
  kag.write({ graph: p.graphSlug, nodes: [{ id: 'run-1', type: 'Run', label: 'sim run', detail: '', round: 1, attrs: {}, provenance: ['scicompass://runs/run-1'] }], edges: [] });
  const res = rec.resultRegister({ origin: 'device-run', runId: 'run-1', protocolId: 'pr', protocolVersion: 1,
    deviceId: 'dev', summary: { yield: 0.4 }, params: {}, at: 't' });
  const out = kag.flowback(rec, { resultId: res.id, graph: p.graphSlug, runNodeId: 'run-1', round: 1 });
  const g = kag.query({ graph: p.graphSlug, type: 'Result', headOnly: false, limit: 10 });
  expect(g.nodes).toHaveLength(1);
  expect(g.nodes[0].provenance).toContain(res.uri);
  expect(g.edges.some((e) => e.source === 'run-1' && e.target === out.resultNodeId && e.label === 'produced')).toBe(true);
});
```

- [ ] **Step 2: 确认失败**
- [ ] **Step 3: 实现（kag.ts 追加方法）**

```ts
flowback(rec: Records, input: { resultId: string; graph: string; runNodeId: string; round: number }) {
  const r = rec.resultGet(input.resultId);
  const resultNodeId = newId('node');
  this.write({ graph: input.graph, nodes: [{ id: resultNodeId, type: 'Result',
    label: `结果 ${input.resultId}`, detail: JSON.stringify(r.summary), round: input.round,
    attrs: { deviceId: r.device_id }, provenance: [makeRecordUri('results', input.resultId)] }],
    edges: [{ id: newId('edge'), source: input.runNodeId, target: resultNodeId, label: 'produced' }] });
  return { resultNodeId };
}
```

（import 自 `@scicompass/core` 增加 `newId, makeRecordUri`；`Records` 类型 import 自 `./records.js`。）

- [ ] **Step 4: 通过**　- [ ] **Step 5: Commit**　`git commit -am "Add result flowback into project graph"`

---

### Task 12: labharness —— 装置注册表与空间模板装载

**Files:**
- Create: `scicompass/templates/fudan-xtalpi.yaml`
- Create: `packages/labharness/src/{schema.ts,deviceRegistry.ts}`、`src/index.ts`
- Test: `src/deviceRegistry.test.ts`

- [ ] **Step 1: 写空间模板（数据即合同）**

```yaml
# templates/fudan-xtalpi.yaml
space: fudan-xtalpi
displayName: 复旦晶泰化学反应空间
ontology: { space: chemistry, version: v1 }
groupSlug: grp-masm
subscribedKgs: [ReaKE, ElementKG, Material, MatKG, MEKG]
defaultSkills: [scicompass, literature-review, experiment-design, run-and-analyze, sci-data-analysis, xtalpi-synthesis]
devices:
  - id: dev-xtalpi
    name: 晶泰自动化合成工作站
    kind: automated-platform
    physicalAvailable: false
    capabilities:
      - experimentType: reaction-screening
        parameterSchema:
          type: object
          required: [temperatureC, timeHours]
          properties:
            temperatureC: { type: number, minimum: -20, maximum: 150 }
            timeHours: { type: number, minimum: 0.1, maximum: 72 }
            solvent: { type: string }
        constraints: [无水无氧操作需提前声明]
    safetyRules: [禁止叠氮化物与重金属盐共混, 温度不得超过 150C]
    supportedPolicies: [suggest, draft-protocol, queue-with-approval]
  - id: dev-hplc
    name: HPLC 分析仪
    kind: instrument
    physicalAvailable: false
    partOf: dev-xtalpi
    capabilities:
      - experimentType: hplc-analysis
        parameterSchema: { type: object, properties: { method: { type: string } } }
        constraints: []
    safetyRules: []
    supportedPolicies: [queue-with-approval]
```

- [ ] **Step 2: 失败测试**

```ts
import { it, expect } from 'vitest';
import { mkdtempSync } from 'node:fs'; import { tmpdir } from 'node:os'; import { join, resolve } from 'node:path';
import { DeviceRegistry } from './deviceRegistry.js';

const tpl = resolve(import.meta.dirname, '../../../templates/fudan-xtalpi.yaml');

it('loads template, lists devices, gets profile with members', () => {
  const reg = new DeviceRegistry(mkdtempSync(join(tmpdir(), 'sc-')));
  reg.loadTemplate(tpl);
  const list = reg.list();
  expect(list.map((d) => d.id).sort()).toEqual(['dev-hplc', 'dev-xtalpi']);
  const prof = reg.getProfile('dev-xtalpi');
  expect(prof.members).toContain('dev-hplc');
  expect(prof.capabilities[0].experimentType).toBe('reaction-screening');
});
```

- [ ] **Step 3: 实现**

```ts
// schema.ts
export interface Capability { experimentType: string; parameterSchema: Record<string, unknown>; constraints: string[] }
export interface DeviceProfile {
  id: string; name: string; kind: 'automated-platform' | 'instrument';
  physicalAvailable: boolean; partOf?: string; members?: string[];
  capabilities: Capability[]; safetyRules: string[]; supportedPolicies: string[];
}
```

```ts
// deviceRegistry.ts
import { join } from 'node:path'; import { readFileSync } from 'node:fs'; import { parse } from 'yaml';
import { openDb, type Db } from '@scicompass/core';
import type { DeviceProfile } from './schema.js';
const MIG = [{ id: 30, sql: `CREATE TABLE devices(id TEXT PRIMARY KEY, profile TEXT NOT NULL, created_at TEXT NOT NULL);` }];
export class DeviceRegistry {
  db: Db;
  constructor(dataHome: string) { this.db = openDb(join(dataHome, 'scicompass.db'), MIG); }
  loadTemplate(file: string) {
    const tpl = parse(readFileSync(file, 'utf8'));
    const devices: DeviceProfile[] = tpl.devices;
    for (const d of devices) d.members = devices.filter((x) => x.partOf === d.id).map((x) => x.id);
    const ins = this.db.prepare('INSERT OR REPLACE INTO devices VALUES(?,?,?)');
    for (const d of devices) ins.run(d.id, JSON.stringify(d), new Date().toISOString());
    return { space: tpl.space as string, groupSlug: tpl.groupSlug as string, defaultSkills: tpl.defaultSkills as string[] };
  }
  list(): { id: string; name: string; kind: string }[] {
    return this.db.prepare('SELECT profile FROM devices').all()
      .map((r: any) => { const p = JSON.parse(r.profile); return { id: p.id, name: p.name, kind: p.kind }; });
  }
  getProfile(id: string): DeviceProfile {
    const r: any = this.db.prepare('SELECT profile FROM devices WHERE id=?').get(id);
    if (!r) throw new Error(`device not found: ${id}`);
    return JSON.parse(r.profile);
  }
}
```

- [ ] **Step 4: 通过**　- [ ] **Step 5: Commit**　`git commit -am "Add device registry with space template loader"`

---

### Task 13: labharness —— DeviceDriver 接口与 MockFoundryDriver

**Files:**
- Create: `src/{driver.ts,mockDriver.ts}`；Modify: `src/index.ts`
- Test: `src/mockDriver.test.ts`

- [ ] **Step 1: 失败测试**

```ts
import { it, expect } from 'vitest';
import { MockFoundryDriver } from './mockDriver.js';
import type { DeviceProfile } from './schema.js';

const profile: DeviceProfile = { id: 'd', name: 'd', kind: 'automated-platform', physicalAvailable: false,
  capabilities: [{ experimentType: 'reaction-screening',
    parameterSchema: { type: 'object', required: ['temperatureC'], properties: { temperatureC: { type: 'number', maximum: 150 } } },
    constraints: [] }], safetyRules: [], supportedPolicies: ['queue-with-approval'] };

it('validate rejects schema violations with safety code', () => {
  const d = new MockFoundryDriver();
  const bad = d.validate(profile, 'reaction-screening', { temperatureC: 999 });
  expect(bad.ok).toBe(false); expect(bad.errors[0]).toMatch(/temperatureC|maximum/);
  expect(d.validate(profile, 'no-such-type', {}).errors[0]).toMatch(/experimentType/);
});

it('plan returns timeline ending with completed transition and a result event', () => {
  const d = new MockFoundryDriver();
  const t0 = Date.parse('2026-06-12T00:00:00Z');
  const ev = d.plan({ runId: 'r1', experimentType: 'reaction-screening', params: { temperatureC: 60 }, startAt: t0 });
  expect(ev[0].transitionTo).toBe('running');
  expect(ev.at(-1)!.transitionTo).toBe('completed');
  expect(ev.some((e) => e.resultSummary)).toBe(true);
  expect(ev.every((e, i) => i === 0 || e.revealAt >= ev[i - 1].revealAt)).toBe(true);
});
```

- [ ] **Step 2: 确认失败**
- [ ] **Step 3: 实现**

```ts
// driver.ts
import type { DeviceProfile } from './schema.js';
export interface TimelineEvent {
  seq: number; revealAt: number; label: string; detail: string;
  severity: 'info' | 'warning' | 'success';
  transitionTo?: 'running' | 'completed' | 'failed';
  resultSummary?: Record<string, unknown>;
}
export interface PlanInput { runId: string; experimentType: string; params: Record<string, unknown>; startAt: number }
export interface DeviceDriver {
  validate(profile: DeviceProfile, experimentType: string, params: Record<string, unknown>): { ok: boolean; errors: string[] };
  plan(input: PlanInput): TimelineEvent[];
}
```

```ts
// mockDriver.ts
import Ajv from 'ajv';
import type { DeviceDriver, PlanInput, TimelineEvent } from './driver.js';
import type { DeviceProfile } from './schema.js';
const ajv = new Ajv({ allErrors: true });
export class MockFoundryDriver implements DeviceDriver {
  validate(profile: DeviceProfile, experimentType: string, params: Record<string, unknown>) {
    const cap = profile.capabilities.find((c) => c.experimentType === experimentType);
    if (!cap) return { ok: false, errors: [`experimentType not supported: ${experimentType}`] };
    const validate = ajv.compile(cap.parameterSchema as object);
    if (validate(params)) return { ok: true, errors: [] };
    return { ok: false, errors: (validate.errors ?? []).map((e) => `${e.instancePath || 'params'} ${e.message}`) };
  }
  plan({ startAt, params }: PlanInput): TimelineEvent[] {
    const s = (n: number) => startAt + n * 1000;
    return [
      { seq: 1, revealAt: s(1), label: '进入运行', detail: '装置开始执行', severity: 'info', transitionTo: 'running' },
      { seq: 2, revealAt: s(3), label: '加料完成', detail: JSON.stringify(params), severity: 'info' },
      { seq: 3, revealAt: s(6), label: '在线监测', detail: '转化率上升', severity: 'info' },
      { seq: 4, revealAt: s(9), label: '运行完成', detail: '产物收集完毕', severity: 'success',
        transitionTo: 'completed', resultSummary: { yield: 0.41, conversion: 0.93, executedBy: 'mock-driver' } }
    ];
  }
}
```

- [ ] **Step 4: 通过**　- [ ] **Step 5: Commit**　`git commit -am "Add device driver interface and mock foundry driver"`

---

### Task 14: labharness —— 运行状态机 + 时间线物化 + 惰性推进

**Files:**
- Create: `src/runs.ts`；Modify: `src/index.ts`
- Test: `src/runs.test.ts`

- [ ] **Step 1: 失败测试（含状态矩阵关键用例与伪时钟）**

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { mkdtempSync } from 'node:fs'; import { tmpdir } from 'node:os'; import { join, resolve } from 'node:path';
import { DeviceRegistry } from './deviceRegistry.js';
import { RunService } from './runs.js';
import { Records } from '@scicompass/labkag';

let runs: RunService; let rec: Records; let now: number;
const clock = () => now;
beforeEach(() => {
  const home = mkdtempSync(join(tmpdir(), 'sc-'));
  const reg = new DeviceRegistry(home);
  reg.loadTemplate(resolve(import.meta.dirname, '../../../templates/fudan-xtalpi.yaml'));
  rec = new Records(home);
  runs = new RunService(home, reg, rec, clock);
  now = Date.parse('2026-06-12T00:00:00Z');
});
const submitArgs = { projectId: 'p', protocolId: 'pr', protocolVersion: 1, deviceId: 'dev-xtalpi',
  experimentType: 'reaction-screening', params: { temperatureC: 60, timeHours: 2 } } as const;

describe('RunService', () => {
  it('simulation: queued immediately, lazily advances to completed and auto-registers result', () => {
    const r = runs.submit({ ...submitArgs, mode: 'simulation' });
    expect(r.status).toBe('queued');
    now += 2_000; expect(runs.status(r.runId).status).toBe('running');
    now += 10_000;
    const done = runs.status(r.runId);
    expect(done.status).toBe('completed');
    expect(rec.resultList({ runId: r.runId })).toHaveLength(1);
    expect(done.newEvents.length).toBeGreaterThan(0);
  });
  it('physical: stops at awaiting-approval; approve materializes; reject terminal', () => {
    const r = runs.submit({ ...submitArgs, mode: 'physical' });
    expect(r.status).toBe('awaiting-approval');
    now += 60_000; expect(runs.status(r.runId).status).toBe('awaiting-approval'); // 不批不动
    runs.approve({ runId: r.runId, decision: 'approve', confirmedBy: '麻老师', note: '' });
    now += 12_000; expect(runs.status(r.runId).status).toBe('completed');
  });
  it('illegal transitions are conflicts', () => {
    const r = runs.submit({ ...submitArgs, mode: 'simulation' });
    expect(() => runs.approve({ runId: r.runId, decision: 'approve', confirmedBy: 'x', note: '' })).toThrow(/conflict/i);
    now += 20_000; runs.status(r.runId); // completed
    expect(() => runs.control({ runId: r.runId, action: 'abort', actor: 'x' })).toThrow(/conflict/i);
  });
  it('validate rejects bad params without creating run', () => {
    expect(() => runs.submit({ ...submitArgs, params: { temperatureC: 999, timeHours: 2 }, mode: 'simulation' }))
      .toThrow(/validation/i);
    expect(runs.list({}).length).toBe(0);
  });
  it('abort from running is allowed and audited', () => {
    const r = runs.submit({ ...submitArgs, mode: 'simulation' });
    now += 2_000; runs.status(r.runId);
    runs.control({ runId: r.runId, action: 'abort', actor: '麻老师' });
    expect(runs.status(r.runId).status).toBe('aborted');
  });
});
```

- [ ] **Step 2: 确认失败**
- [ ] **Step 3: 实现**

```ts
// runs.ts
import { join } from 'node:path';
import { z } from 'zod';
import { openDb, type Db, newId, RunSubmitInput, RunControlInput, RunApproveInput } from '@scicompass/core';
import { Records } from '@scicompass/labkag';
import { DeviceRegistry } from './deviceRegistry.js';
import { MockFoundryDriver } from './mockDriver.js';
import type { DeviceDriver } from './driver.js';

const MIG = [{ id: 31, sql: `
  CREATE TABLE runs(id TEXT PRIMARY KEY, project_id TEXT, protocol_id TEXT, protocol_version INTEGER,
    device_id TEXT, experiment_type TEXT, mode TEXT, status TEXT, params TEXT, created_at TEXT, updated_at TEXT);
  CREATE TABLE run_events(id TEXT PRIMARY KEY, run_id TEXT, seq INTEGER, reveal_at INTEGER,
    label TEXT, detail TEXT, severity TEXT, transition_to TEXT, result_summary TEXT, revealed INTEGER DEFAULT 0);
  CREATE TABLE approvals(id TEXT PRIMARY KEY, run_id TEXT, decision TEXT, confirmed_by TEXT, note TEXT, decided_at TEXT);
  CREATE TABLE audit_log(id TEXT PRIMARY KEY, tool TEXT, actor TEXT, payload TEXT, at TEXT);` }];

const LEGAL: Record<string, string[]> = {
  'awaiting-approval': ['queued', 'rejected'],
  queued: ['running', 'aborted'], running: ['paused', 'completed', 'failed', 'aborted'],
  paused: ['running', 'aborted'], completed: [], failed: [], rejected: [], aborted: []
};

export class RunService {
  db: Db; driver: DeviceDriver = new MockFoundryDriver();
  constructor(dataHome: string, readonly devices: DeviceRegistry, readonly records: Records,
    readonly clock: () => number = () => Date.now()) {
    this.db = openDb(join(dataHome, 'scicompass.db'), MIG);
  }
  private audit(tool: string, actor: string, payload: unknown) {
    this.db.prepare('INSERT INTO audit_log VALUES(?,?,?,?,?)')
      .run(newId('aud'), tool, actor, JSON.stringify(payload), new Date(this.clock()).toISOString());
  }
  private setStatus(runId: string, from: string, to: string) {
    if (!LEGAL[from]?.includes(to)) throw new Error(`conflict: illegal transition ${from} -> ${to}`);
    this.db.prepare('UPDATE runs SET status=?, updated_at=? WHERE id=?').run(to, new Date(this.clock()).toISOString(), runId);
  }
  validate(input: Pick<z.infer<typeof RunSubmitInput>, 'deviceId' | 'experimentType' | 'params'>) {
    const profile = this.devices.getProfile(input.deviceId);
    return this.driver.validate(profile, input.experimentType, input.params);
  }
  submit(raw: z.infer<typeof RunSubmitInput>) {
    const input = RunSubmitInput.parse(raw);
    const v = this.validate(input);
    if (!v.ok) throw new Error(`validation failed: ${v.errors.join('; ')}`);
    const runId = newId('run');
    const status = input.mode === 'physical' ? 'awaiting-approval' : 'queued';
    this.db.prepare('INSERT INTO runs VALUES(?,?,?,?,?,?,?,?,?,?,?)').run(runId, input.projectId, input.protocolId,
      input.protocolVersion, input.deviceId, input.experimentType, input.mode, status,
      JSON.stringify(input.params), new Date(this.clock()).toISOString(), new Date(this.clock()).toISOString());
    if (input.mode === 'physical') this.audit('run_submit', 'agent', { runId, mode: input.mode });
    else this.materialize(runId, input.experimentType, input.params);
    return { runId, status };
  }
  private materialize(runId: string, experimentType: string, params: Record<string, unknown>) {
    const events = this.driver.plan({ runId, experimentType, params, startAt: this.clock() });
    const ins = this.db.prepare('INSERT INTO run_events VALUES(?,?,?,?,?,?,?,?,?,0)');
    for (const e of events) ins.run(newId('rev'), runId, e.seq, e.revealAt, e.label, e.detail, e.severity,
      e.transitionTo ?? null, e.resultSummary ? JSON.stringify(e.resultSummary) : null);
  }
  approve(raw: z.infer<typeof RunApproveInput>) {
    const a = RunApproveInput.parse(raw);
    const run = this.get(a.runId);
    if (run.status !== 'awaiting-approval') throw new Error(`conflict: run is ${run.status}, not awaiting-approval`);
    this.db.prepare('INSERT INTO approvals VALUES(?,?,?,?,?,?)').run(newId('apr'), a.runId, a.decision, a.confirmedBy,
      a.note, new Date(this.clock()).toISOString());
    this.audit('run_approve', a.confirmedBy, a);
    if (a.decision === 'reject') { this.setStatus(a.runId, 'awaiting-approval', 'rejected'); return { status: 'rejected' }; }
    this.setStatus(a.runId, 'awaiting-approval', 'queued');
    this.materialize(a.runId, run.experiment_type, JSON.parse(run.params));
    return { status: 'queued' };
  }
  control(raw: z.infer<typeof RunControlInput>) {
    const c = RunControlInput.parse(raw);
    const run = this.get(c.runId); this.statusAdvance(run); const cur = this.get(c.runId).status;
    const to = c.action === 'abort' ? 'aborted' : c.action === 'pause' ? 'paused' : 'running';
    this.setStatus(c.runId, cur, to);
    this.audit('run_control', c.actor, c);
    return { status: to };
  }
  private get(runId: string): any {
    const r = this.db.prepare('SELECT * FROM runs WHERE id=?').get(runId);
    if (!r) throw new Error(`run not found: ${runId}`); return r;
  }
  private statusAdvance(run: any) {
    const due = this.db.prepare('SELECT * FROM run_events WHERE run_id=? AND revealed=0 AND reveal_at<=? ORDER BY seq')
      .all(run.id, this.clock()) as any[];
    let status = run.status;
    for (const e of due) {
      this.db.prepare('UPDATE run_events SET revealed=1 WHERE id=?').run(e.id);
      if (e.transition_to && LEGAL[status]?.includes(e.transition_to)) {
        this.setStatus(run.id, status, e.transition_to); status = e.transition_to;
      }
      if (e.result_summary && status === 'completed') {
        this.records.resultRegister({ origin: 'device-run', runId: run.id, protocolId: run.protocol_id,
          protocolVersion: run.protocol_version, deviceId: run.device_id, projectId: run.project_id,
          summary: JSON.parse(e.result_summary), params: JSON.parse(run.params),
          at: new Date(e.reveal_at).toISOString() });
      }
    }
    return due;
  }
  status(runId: string) {
    const run = this.get(runId);
    const due = this.statusAdvance(run);
    const cur = this.get(runId);
    return { runId, status: cur.status as string,
      newEvents: due.map((e: any) => ({ seq: e.seq, label: e.label, detail: e.detail, severity: e.severity })) };
  }
  list(filter: { projectId?: string }) {
    return this.db.prepare(`SELECT id,project_id,device_id,mode,status FROM runs ${filter.projectId ? 'WHERE project_id=?' : ''}`)
      .all(...(filter.projectId ? [filter.projectId] : [])) as any[];
  }
  auditList() { return this.db.prepare('SELECT tool,actor,at FROM audit_log').all() as any[]; }
}
```

- [ ] **Step 4: 通过**　- [ ] **Step 5: 补审计断言（approve/control 各产生一条 audit_log，追加进已有测试）并通过
- [ ] **Step 6: Commit**　`git commit -am "Add run state machine with timeline materialization and audit"`

---

### Task 15: lablibrary —— 文献导入与 FTS5 检索

**Files:**
- Create: `packages/lablibrary/src/{library.ts,bibtex.ts,index.ts}`
- Test: `src/library.test.ts`

- [ ] **Step 1: 失败测试**

```ts
import { it, expect, beforeEach } from 'vitest';
import { mkdtempSync, writeFileSync } from 'node:fs'; import { tmpdir } from 'node:os'; import { join } from 'node:path';
import { Library } from './library.js';

let lib: Library; let home: string;
beforeEach(() => { home = mkdtempSync(join(tmpdir(), 'sc-')); lib = new Library(home); });

it('imports bibtex entries and searches via fts', () => {
  const n = lib.import({ via: 'bibtex', projectId: 'p1', bibtex: `
@article{ma2024, title={Allene Coupling under Mild Conditions}, author={Ma, S.}, year={2024}, journal={JACS}, abstract={Mild allene coupling with low catalyst loading.} }
@article{x2023, title={MOF water stability}, author={X}, year={2023}, journal={Nat}, abstract={Humidity degrades certain linkers.} }` });
  expect(n.imported).toBe(2);
  const hits = lib.search({ projectId: 'p1', q: 'allene coupling', limit: 10 });
  expect(hits[0].title).toMatch(/Allene/);
});

it('imports file by copying into library dir', () => {
  const src = join(home, 'paper.pdf'); writeFileSync(src, 'fake-pdf');
  const r = lib.import({ via: 'file', projectId: 'p1', path: src, title: '某论文' });
  expect(lib.get(r.ids[0]).file_path).toContain(join('library', 'p1'));
});
```

- [ ] **Step 2: 确认失败**
- [ ] **Step 3: 实现**

```ts
// bibtex.ts —— 最小解析：抓 @type{key, field={value}|"value"}
export interface BibEntry { key: string; title: string; year: number; journal: string; abstract: string; author: string }
export function parseBibtex(src: string): BibEntry[] {
  const entries: BibEntry[] = [];
  const re = /@\w+\s*{\s*([^,]+),([\s\S]*?)\n}\s*/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src + '\n}'))) {
    const fields: Record<string, string> = {};
    const fre = /(\w+)\s*=\s*(?:{([^{}]*)}|"([^"]*)")/g;
    let f: RegExpExecArray | null;
    while ((f = fre.exec(m[2]))) fields[f[1].toLowerCase()] = (f[2] ?? f[3] ?? '').trim();
    entries.push({ key: m[1].trim(), title: fields.title ?? '', year: Number(fields.year ?? 0),
      journal: fields.journal ?? '', abstract: fields.abstract ?? '', author: fields.author ?? '' });
  }
  return entries.filter((e) => e.title);
}
```

```ts
// library.ts
import { join, basename } from 'node:path'; import { copyFileSync, mkdirSync } from 'node:fs';
import { z } from 'zod';
import { openDb, type Db, newId, LiteratureImportInput, LiteratureSearchInput } from '@scicompass/core';
import { parseBibtex } from './bibtex.js';
const MIG = [{ id: 20, sql: `
  CREATE TABLE literature(id TEXT PRIMARY KEY, project_id TEXT, title TEXT, source TEXT, year INTEGER,
    abstract TEXT, file_path TEXT, created_at TEXT);
  CREATE VIRTUAL TABLE literature_fts USING fts5(title, abstract, content=literature, content_rowid=rowid);
  CREATE TRIGGER lit_ai AFTER INSERT ON literature BEGIN
    INSERT INTO literature_fts(rowid, title, abstract) VALUES (new.rowid, new.title, new.abstract); END;` }];
export class Library {
  db: Db;
  constructor(readonly dataHome: string) { this.db = openDb(join(dataHome, 'scicompass.db'), MIG); }
  import(raw: z.infer<typeof LiteratureImportInput>) {
    const input = LiteratureImportInput.parse(raw);
    const ins = this.db.prepare('INSERT INTO literature VALUES(?,?,?,?,?,?,?,?)');
    const now = new Date().toISOString(); const ids: string[] = [];
    if (input.via === 'bibtex') {
      for (const e of parseBibtex(input.bibtex)) {
        const id = newId('lit'); ids.push(id);
        ins.run(id, input.projectId, e.title, e.journal, e.year, e.abstract, null, now);
      }
    } else if (input.via === 'file') {
      const dir = join(this.dataHome, 'library', input.projectId); mkdirSync(dir, { recursive: true });
      const id = newId('lit'); const dest = join(dir, `${id}-${basename(input.path)}`);
      copyFileSync(input.path, dest); ids.push(id);
      ins.run(id, input.projectId, input.title ?? basename(input.path), 'file', 0, '', dest, now);
    } else { // doi — v0.1 mock 元数据
      const id = newId('lit'); ids.push(id);
      ins.run(id, input.projectId, `DOI ${input.doi}`, 'doi(mock)', 0, '', null, now);
    }
    return { imported: ids.length, ids };
  }
  search(raw: z.infer<typeof LiteratureSearchInput>) {
    const { projectId, q, limit } = LiteratureSearchInput.parse(raw);
    return this.db.prepare(`SELECT l.id, l.title, l.year, l.abstract FROM literature_fts f
      JOIN literature l ON l.rowid = f.rowid WHERE literature_fts MATCH ? AND l.project_id = ? LIMIT ?`)
      .all(q, projectId, limit) as any[];
  }
  get(id: string) {
    const r = this.db.prepare('SELECT * FROM literature WHERE id=?').get(id);
    if (!r) throw new Error(`literature not found: ${id}`); return r as any;
  }
}
```

- [ ] **Step 4: 通过**　- [ ] **Step 5: Commit**　`git commit -am "Add literature library with bibtex import and fts search"`

---

### Task 16: cli —— MCP 服务组装（knowledge / harness 双入口）

**Files:**
- Create: `packages/cli/src/mcp/{registerKnowledge.ts,registerHarness.ts}`、`src/serve.ts`、`src/dataHome.ts`
- Test: `packages/cli/src/mcp/mcp.test.ts`（InMemoryTransport 合同测试）

- [ ] **Step 1: 失败测试（合同测试样例——每工具至少 1 happy；错误路径抽 3 个代表）**

```ts
import { it, expect, beforeEach } from 'vitest';
import { mkdtempSync } from 'node:fs'; import { tmpdir } from 'node:os'; import { join, resolve } from 'node:path';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { buildServer } from '../serve.js';

let client: Client;
beforeEach(async () => {
  const home = mkdtempSync(join(tmpdir(), 'sc-'));
  const server = buildServer({ dataHome: home, modules: ['knowledge', 'harness'],
    template: resolve(import.meta.dirname, '../../../../templates/fudan-xtalpi.yaml') });
  const [ct, st] = InMemoryTransport.createLinkedPair();
  client = new Client({ name: 't', version: '0' });
  await Promise.all([client.connect(ct), server.connect(st)]);
});
const call = async (name: string, args: unknown) => {
  const r: any = await client.callTool({ name, arguments: args as any });
  if (r.isError) throw new Error(r.content[0].text);
  return JSON.parse(r.content[0].text);
};

it('lists 31 tools across both profiles', async () => {
  const tools = await client.listTools();
  expect(tools.tools.length).toBe(31);
});

it('full knowledge happy path: project -> graph -> ontology', async () => {
  const p = await call('project_create', { name: 'demo', objective: 'obj' });
  await call('graph_write', { graph: p.graphSlug, nodes: [{ id: 'n1', type: 'Objective', label: 'g', detail: '', round: 1, attrs: {}, provenance: [] }], edges: [] });
  const q = await call('graph_query', { graph: p.graphSlug, headOnly: false, limit: 10 });
  expect(q.nodes).toHaveLength(1);
  const chk = await call('ontology_check', { reagents: ['water'], params: { temperatureC: 60 } });
  expect(chk.ok).toBe(true);
});

it('harness happy path & gate: physical stops at awaiting-approval', async () => {
  const devs = await call('device_list', {});
  expect(devs.devices.map((d: any) => d.id)).toContain('dev-xtalpi');
  const sub = await call('run_submit', { projectId: 'p', protocolId: 'pr', protocolVersion: 1,
    deviceId: 'dev-xtalpi', experimentType: 'reaction-screening', mode: 'physical', params: { temperatureC: 60, timeHours: 1 } });
  expect(sub.status).toBe('awaiting-approval');
});

it('error envelope: unknown graph type rejected', async () => {
  const p = await call('project_create', { name: 'x', objective: 'y' });
  await expect(call('graph_write', { graph: p.graphSlug, nodes: [{ id: 'n', type: 'Dragon', label: '', detail: '', round: 1, attrs: {}, provenance: [] }], edges: [] }))
    .rejects.toThrow(/unknown node type/i);
});
```

- [ ] **Step 2: 确认失败**
- [ ] **Step 3: 实现**

```ts
// dataHome.ts
import { homedir } from 'node:os'; import { join } from 'node:path'; import { mkdirSync } from 'node:fs';
export function resolveDataHome(explicit?: string): string {
  const home = explicit ?? process.env.SCICOMPASS_HOME ?? join(homedir(), '.scicompass');
  mkdirSync(join(home, 'graphs'), { recursive: true });
  return home;
}
```

```ts
// serve.ts
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { OntologyService } from '@scicompass/labontology';
import { KagService, Records } from '@scicompass/labkag';
import { DeviceRegistry, RunService } from '@scicompass/labharness';
import { Library } from '@scicompass/lablibrary';
import { registerKnowledge } from './mcp/registerKnowledge.js';
import { registerHarness } from './mcp/registerHarness.js';
export interface ServeOpts { dataHome: string; modules: ('knowledge' | 'harness')[]; template?: string; clock?: () => number }
export function buildServer(opts: ServeOpts): McpServer {
  const server = new McpServer({ name: 'scicompass', version: '0.1.0' });
  const ontology = new OntologyService();
  const kag = new KagService(opts.dataHome, ontology);
  const records = new Records(opts.dataHome);
  const library = new Library(opts.dataHome);
  const devices = new DeviceRegistry(opts.dataHome);
  if (opts.template) devices.loadTemplate(opts.template);
  const runs = new RunService(opts.dataHome, devices, records, opts.clock);
  if (opts.modules.includes('knowledge')) registerKnowledge(server, { ontology, kag, records, library });
  if (opts.modules.includes('harness')) registerHarness(server, { devices, runs });
  return server;
}
```

```ts
// mcp/registerKnowledge.ts —— 模式：每工具 zod shape + handler 返回 JSON 文本；异常统一 isError
import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { GraphWriteInput, GraphQueryInput, PromoteInput, ProjectCreateInput,
  ArtifactSaveInput, ProtocolSaveInput, ResultRegisterInput,
  LiteratureImportInput, LiteratureSearchInput } from '@scicompass/core';
import { exportGraphMarkdown, alignPublic } from '@scicompass/labkag';

type Deps = { ontology: any; kag: any; records: any; library: any };
const ok = (data: unknown) => ({ content: [{ type: 'text' as const, text: JSON.stringify(data) }] });
const fail = (e: unknown) => ({ isError: true, content: [{ type: 'text' as const, text: String((e as Error).message ?? e) }] });
const wrap = (fn: (args: any) => unknown) => async (args: any) => { try { return ok(await fn(args)); } catch (e) { return fail(e); } };

export function registerKnowledge(s: McpServer, d: Deps) {
  const t = (name: string, desc: string, shape: z.ZodRawShape, fn: (a: any) => unknown) =>
    s.registerTool(name, { description: desc, inputSchema: shape }, wrap(fn));
  t('project_create', '创建项目', ProjectCreateInput.shape, (a) => d.records.projectCreate(a));
  t('project_list', '项目列表', {}, () => ({ projects: d.records.projectList() }));
  t('project_get', '项目详情', { id: z.string() }, (a) => d.records.projectGet(a.id));
  t('literature_import', '导入文献（file/doi/bibtex）', { via: z.enum(['file', 'doi', 'bibtex']), projectId: z.string(),
    path: z.string().optional(), doi: z.string().optional(), bibtex: z.string().optional() },
    (a) => d.library.import(LiteratureImportInput.parse(a)));
  t('literature_search', '全文检索', LiteratureSearchInput.shape, (a) => ({ hits: d.library.search(a) }));
  t('literature_get', '文献详情', { id: z.string() }, (a) => d.library.get(a.id));
  t('graph_write', '写入图谱（经本体校验，节点须带溯源）', GraphWriteInput.shape, (a) => d.kag.write(a));
  t('graph_query', '查询图谱', GraphQueryInput.shape, (a) => d.kag.query(a));
  t('graph_promote', '蒸馏晋升（prj→grp→open，闸门分级）', PromoteInput.shape, (a) => d.kag.promote(a));
  t('graph_export', '导出图谱 markdown', { graph: z.string() }, (a) => ({ markdown: exportGraphMarkdown(d.kag, a.graph) }));
  t('graph_align_public', '锚定公共星图（v0.1 mock）', { graph: z.string(), nodeIds: z.array(z.string()) },
    (a) => alignPublic(d.kag, a));
  t('artifact_save', '保存产物', ArtifactSaveInput.shape, (a) => d.records.artifactSave(a));
  t('artifact_list', '产物列表', { projectId: z.string(), kind: z.string().optional() },
    (a) => ({ artifacts: d.records.artifactList(a.projectId, a.kind) }));
  t('artifact_get', '产物详情', { id: z.string() }, (a) => d.records.artifactGet(a.id));
  t('protocol_save', '保存协议（版本自增）', ProtocolSaveInput.shape, (a) => d.records.protocolSave(a));
  t('protocol_get', '协议详情', { id: z.string() }, (a) => d.records.protocolGet(a.id));
  t('protocol_validate', '本体校验协议意图', { reagents: z.array(z.string()).default([]), params: z.record(z.unknown()).default({}) },
    (a) => d.ontology.check(a));
  t('result_register', '登记结果（两档溯源）', { origin: z.enum(['device-run', 'manual-instrument']), runId: z.string().optional(),
    protocolId: z.string().optional(), protocolVersion: z.number().optional(), deviceId: z.string(),
    projectId: z.string().optional(), summary: z.record(z.unknown()), params: z.record(z.unknown()),
    at: z.string(), filePath: z.string().optional(), upstreamRunId: z.string().optional() },
    (a) => d.records.resultRegister(ResultRegisterInput.parse(a)));
  t('result_list', '结果列表', { runId: z.string().optional(), projectId: z.string().optional() },
    (a) => ({ results: d.records.resultList(a) }));
  t('result_get', '结果详情', { id: z.string() }, (a) => d.records.resultGet(a.id));
  t('result_flowback', '结果回流图谱', { resultId: z.string(), graph: z.string(), runNodeId: z.string(), round: z.number().int().default(1) },
    (a) => d.kag.flowback(d.records, a));
  t('ontology_get', '查看本体词汇与规则', {}, () => d.ontology.get());
  t('ontology_check', '预检意图是否合规', { reagents: z.array(z.string()).default([]), params: z.record(z.unknown()).default({}) },
    (a) => d.ontology.check(a));
}
```

```ts
// mcp/registerHarness.ts
import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { RunSubmitInput, RunControlInput, RunApproveInput } from '@scicompass/core';
type Deps = { devices: any; runs: any };
const ok = (data: unknown) => ({ content: [{ type: 'text' as const, text: JSON.stringify(data) }] });
const fail = (e: unknown) => ({ isError: true, content: [{ type: 'text' as const, text: String((e as Error).message ?? e) }] });
const wrap = (fn: (args: any) => unknown) => async (args: any) => { try { return ok(await fn(args)); } catch (e) { return fail(e); } };
export function registerHarness(s: McpServer, d: Deps) {
  const t = (name: string, desc: string, shape: z.ZodRawShape, fn: (a: any) => unknown) =>
    s.registerTool(name, { description: desc, inputSchema: shape }, wrap(fn));
  t('device_list', '装置与仪器清单', {}, () => ({ devices: d.devices.list() }));
  t('device_get_profile', '装置 Profile（能力/参数schema/安全规则）', { id: z.string() }, (a) => d.devices.getProfile(a.id));
  t('run_validate', '提交前校验（无副作用）', { deviceId: z.string(), experimentType: z.string(), params: z.record(z.unknown()) },
    (a) => d.runs.validate(a));
  t('run_submit', '提交运行（physical 必停审批）', RunSubmitInput.shape, (a) => d.runs.submit(a));
  t('run_status', '状态与新事件（惰性推进）', { runId: z.string() }, (a) => d.runs.status(a.runId));
  t('run_list', '运行列表', { projectId: z.string().optional() }, (a) => ({ runs: d.runs.list(a) }));
  t('run_control', '暂停/恢复/中止', RunControlInput.shape, (a) => d.runs.control(a));
  t('run_approve', '审批（仅限人类明确指令，confirmed_by 必填）', RunApproveInput.shape, (a) => d.runs.approve(a));
}
```

执行注意：`@modelcontextprotocol/sdk` 的 `registerTool` 若在所装版本中签名不同（旧版为 `server.tool(name, desc, shape, handler)`），按所装版本适配，**保持工具名与入参 shape 不变**——shape 即合同。

- [ ] **Step 4: 通过**　- [ ] **Step 5: Commit**　`git commit -am "Compose MCP server with knowledge and harness profiles"`

---

### Task 17: cli —— main 入口（serve / init / skill）

**Files:**
- Create: `packages/cli/src/{main.ts,initCmd.ts,skillCmd.ts,init/claudeCode.ts}`
- Test: `packages/cli/src/init/claudeCode.test.ts`

- [ ] **Step 1: 失败测试（init 适配器写出三件套）**

```ts
import { it, expect } from 'vitest';
import { mkdtempSync, readFileSync, existsSync } from 'node:fs'; import { tmpdir } from 'node:os'; import { join, resolve } from 'node:path';
import { initClaudeCode } from './claudeCode.js';

it('writes .mcp.json, links skills, appends CLAUDE.md', () => {
  const proj = mkdtempSync(join(tmpdir(), 'host-'));
  const home = mkdtempSync(join(tmpdir(), 'sc-'));
  initClaudeCode({ projectDir: proj, dataHome: home,
    skillsSourceDir: resolve(import.meta.dirname, '../../../skills'),
    serveEntry: '/abs/path/dist/main.js', template: 'fudan-xtalpi' });
  const mcp = JSON.parse(readFileSync(join(proj, '.mcp.json'), 'utf8'));
  expect(mcp.mcpServers['scicompass-knowledge'].args).toContain('knowledge');
  expect(mcp.mcpServers['scicompass-harness'].args).toContain('harness');
  expect(existsSync(join(proj, '.claude', 'skills', 'scicompass', 'SKILL.md'))).toBe(true);
  expect(readFileSync(join(proj, 'CLAUDE.md'), 'utf8')).toMatch(/罗盘|scicompass/);
});
```

- [ ] **Step 2: 确认失败**
- [ ] **Step 3: 实现**

```ts
// init/claudeCode.ts
import { mkdirSync, writeFileSync, readFileSync, existsSync, cpSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
export interface InitOpts { projectDir: string; dataHome: string; skillsSourceDir: string; serveEntry: string; template: string }
export function initClaudeCode(o: InitOpts) {
  const mcpPath = join(o.projectDir, '.mcp.json');
  const existing = existsSync(mcpPath) ? JSON.parse(readFileSync(mcpPath, 'utf8')) : {};
  existing.mcpServers = { ...existing.mcpServers,
    'scicompass-knowledge': { command: 'node', args: [o.serveEntry, 'serve', '--modules', 'knowledge', '--data-home', o.dataHome, '--template', o.template] },
    'scicompass-harness': { command: 'node', args: [o.serveEntry, 'serve', '--modules', 'harness', '--data-home', o.dataHome, '--template', o.template] } };
  writeFileSync(mcpPath, JSON.stringify(existing, null, 2));
  const skillsDest = join(o.projectDir, '.claude', 'skills');
  mkdirSync(skillsDest, { recursive: true });
  for (const name of readdirSync(o.skillsSourceDir)) {
    if (name === 'package.json' || name === 'tsconfig.json' || name === 'dist') continue;
    cpSync(join(o.skillsSourceDir, name), join(skillsDest, name), { recursive: true });
  }
  const banner = '\n## SciCompass 约定\n本项目由领航员（罗盘）主持：会话开始时按 scicompass 技能恢复现场再做任何事。装置调用必须经 scicompass-harness，不得直连装置 MCP。\n';
  const claudeMd = join(o.projectDir, 'CLAUDE.md');
  writeFileSync(claudeMd, (existsSync(claudeMd) ? readFileSync(claudeMd, 'utf8') : '# 项目约定\n') + banner);
}
```

```ts
// main.ts —— 极简参数解析（不引 commander）
#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildServer } from './serve.js';
import { resolveDataHome } from './dataHome.js';
import { initClaudeCode } from './init/claudeCode.js';

const argv = process.argv.slice(2);
const opt = (name: string, dflt?: string) => { const i = argv.indexOf(`--${name}`); return i >= 0 ? argv[i + 1] : dflt; };
const here = dirname(fileURLToPath(import.meta.url));
const templateFile = (t: string) => resolve(here, '../../..', 'templates', `${t}.yaml`);

const cmd = argv[0];
if (cmd === 'serve') {
  const modules = (opt('modules', 'knowledge') as string).split(',') as ('knowledge' | 'harness')[];
  const server = buildServer({ dataHome: resolveDataHome(opt('data-home')), modules,
    template: templateFile(opt('template', 'fudan-xtalpi')!) });
  await server.connect(new StdioServerTransport());
} else if (cmd === 'init') {
  const host = opt('host', 'claude-code');
  if (host !== 'claude-code') { console.error(`host adapter not implemented in v0.1: ${host}`); process.exit(1); }
  initClaudeCode({ projectDir: process.cwd(), dataHome: resolveDataHome(opt('data-home')),
    skillsSourceDir: resolve(here, '../..', 'skills'), serveEntry: resolve(here, 'main.js'),
    template: opt('template', 'fudan-xtalpi')! });
  console.log('scicompass: claude-code host initialized.');
} else if (cmd === 'skill') {
  const { skillAdd, skillList } = await import('./skillCmd.js');
  if (argv[1] === 'add') skillAdd(resolveDataHome(opt('data-home')), argv[2]);
  else console.log(skillList(resolveDataHome(opt('data-home'))).join('\n'));
} else { console.log('usage: scicompass serve|init|skill ...'); }
```

```ts
// skillCmd.ts
import { cpSync, mkdirSync, readdirSync, existsSync } from 'node:fs';
import { join, basename } from 'node:path';
export function skillAdd(dataHome: string, srcDir: string) {
  if (!existsSync(join(srcDir, 'SKILL.md'))) throw new Error('not a skill dir (missing SKILL.md)');
  const dest = join(dataHome, 'skills', basename(srcDir));
  mkdirSync(dest, { recursive: true });
  cpSync(srcDir, dest, { recursive: true });
  console.log(`installed skill: ${basename(srcDir)}`);
}
export function skillList(dataHome: string): string[] {
  const dir = join(dataHome, 'skills');
  return existsSync(dir) ? readdirSync(dir) : [];
}
```

（注意：main.ts 使用顶层 await，需要 `"module": "NodeNext"` 已满足；`#!/usr/bin/env node` 置于文件首行。）

- [ ] **Step 4: 通过**　- [ ] **Step 5: Commit**　`git commit -am "Add scicompass CLI: serve, init for claude-code, skill add/list"`

---

### Task 18: skills —— 六个内置技能包

**Files:**
- Create: `packages/skills/{scicompass,literature-review,experiment-design,run-and-analyze,sci-data-analysis,xtalpi-synthesis}/SKILL.md`

- [ ] **Step 1: 写 scicompass（领航员）——全文落盘**

```markdown
---
name: scicompass
description: SciCompass 科学发现领航员（罗盘）。用户打开/继续科学项目、问"现在到哪了/下一步"、
  需要全局判断或跨环节引导时使用。主持整个科学发现闭环。
---

# 你是罗盘（SciCompass）——这个科学项目的领航员

司南之后裔，麦克斯韦妖之同道：以信息对抗熵增，为科学执掌方向。
罗盘指向，但从不代替船长（科学家）决定航线。

## 开场仪式（每次会话开始）
1. project_list / project_get → graph_query（按 round）→ run_list → artifact_list(kind=logbook)
2. 向科学家报告：第几轮、本轮走到哪段、上段关键产出、离线期间发生了什么
3. 给出 1-3 个下一步选项与你的推荐，等科学家定夺

## 职责
- 定位与导航：闭环分三段——literature-review（文献）→ experiment-design（方案）→
  run-and-analyze 或装置技能（执行与分析）。段间衔接靠图谱，不靠记忆。
- 引导：动手前用 ontology_check 预检；需要外部知识先检索文献/SciGraph 给材料，
  不替科学家下科学结论。
- 把关解释：工具被资源层拦截后，解释规则出处与修正路径。
- 交棒：进入具体环节时移交对应技能；重上下文任务（批量文献消化、数据深挖）派发子智能体。
- 兜底造工具：无现成技能/工具时写脚本解决；脚本以 artifact_save(kind=tool) 登记并附溯源，
  验证有效后建议固化进对应技能包。

## 边界（不可逾越）
- 科学判断权在人：假设取舍、方案批准、轮次方向由科学家决定。
- 永不自行调用 run_approve；mode=physical 仅在用户明确要求时提交。
- 团队知识以先验呈现，不以定律呈现；项目证据与团队先验冲突时明确指出——冲突本身值得晋升。
- 发现可泛化知识（教训/方法/先验/阴性结果）时提议 graph_promote，闸门在人。

## 领航日志
会话结束或关键决策后 artifact_save(kind=logbook)：本次进展、科学家倾向与未决问题、
下次开场要提醒的事。
```

- [ ] **Step 2: 写 xtalpi-synthesis（装置技能，打样对象）——全文落盘**

```markdown
---
name: xtalpi-synthesis
description: 在复旦晶泰自动化合成装置上设计、提交与跟进化学反应类实验（合成、筛选、条件优化）。
---

# 晶泰装置：化学反应实验全流程

面向化学家本人：用领域术语，给判断也给依据；每个关键产物停下确认。

## 前置
需挂载 scicompass-knowledge 与 scicompass-harness 两个 MCP 入口。

## 流程
1. 明确实验目标；方案未定时按 experiment-design 技能产出协议（protocol_save）。
2. device_get_profile(dev-xtalpi) 确认能力与参数边界；ontology_check 预检试剂组合与参数。
3. run_validate 预检 → 向用户呈现方案并确认 → run_submit(mode=simulation 先行)。
4. run_status 轮询跟进，向用户转述关键事件直至 completed。
5. 本装置反应模块与 HPLC 未打通：完成后指导用户取样上机（人工步骤），
   结果用 result_register(origin=manual-instrument, upstreamRunId=本次 run) 登记，补全溯源链。
6. result_flowback 回流项目图；与用户讨论解读，artifact_save(kind=analysis)。
7. 与用户讨论下一轮方向，artifact_save(kind=suggestion)；可泛化教训提议 graph_promote 至组图。

## 停点与安全
- 协议提交前必须经用户确认；physical 模式仅在用户明确要求时使用，永不自行调用 run_approve。
- 装置报错/离线/任何安全疑虑：立即停手，提示用户联系装置管理员，不得自行重试物理动作。
```

- [ ] **Step 3: 写其余四个技能（literature-review / experiment-design / run-and-analyze / sci-data-analysis），骨架同上风格，要点如下，执行时各自成文 30-60 行：**
  - `literature-review`：literature_search/import → 逐篇研读（工作台文件能力）→ graph_write 写 LiteratureEvidence（带 `scicompass://literature/<id>` 溯源）→ graph_align_public 对齐 → LLM 撰写综述 → artifact_save(kind=report)；停点：综述经用户认可。
  - `experiment-design`：读图谱与综述 → 提出假设（artifact_save(kind=hypothesis)）→ 设计协议 protocol_save → protocol_validate/ontology_check，未过则修订；停点：协议经用户确认。
  - `run-and-analyze`：无专属装置技能时的通用兜底编排——device_get_profile → run_validate → run_submit(simulation) → run_status → 结果解读（artifact_save(kind=analysis)）→ result_flowback → artifact_save(kind=suggestion)；约定与 xtalpi-synthesis 完全一致的停点与安全条款。
  - `sci-data-analysis`：通用方法论——描述统计/拟合/对照检查/可视化建议；确定性计算写脚本执行而非心算；产物以 artifact_save(kind=analysis) 登记并附数据溯源。

- [ ] **Step 4: 评审清单（人工自检）**：每个 SKILL.md 有 frontmatter（name 与目录同名、description 含触发场景）；工具名与 Task 16 注册清单完全一致；安全条款在场（永不 run_approve）；停点在场。

- [ ] **Step 5: Commit**　`git add scicompass/packages/skills && git commit -m "Add six built-in skills including navigator and pilot device skill"`

---

### Task 19: e2e —— 全闭环冒烟

**Files:**
- Create: `scicompass/e2e/full-loop.test.ts`

- [ ] **Step 1: 写测试（即闭环验收标准）**

```ts
import { it, expect } from 'vitest';
import { mkdtempSync } from 'node:fs'; import { tmpdir } from 'node:os'; import { join, resolve } from 'node:path';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { buildServer } from '../packages/cli/src/serve.js';

it('full discovery loop: literature -> protocol -> simulation -> flowback -> promote', async () => {
  let now = Date.parse('2026-06-12T08:00:00Z');
  const server = buildServer({ dataHome: mkdtempSync(join(tmpdir(), 'sc-')), modules: ['knowledge', 'harness'],
    template: resolve(import.meta.dirname, '../templates/fudan-xtalpi.yaml'), clock: () => now });
  const [ct, st] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: 'e2e', version: '0' });
  await Promise.all([client.connect(ct), server.connect(st)]);
  const call = async (name: string, args: unknown) => {
    const r: any = await client.callTool({ name, arguments: args as any });
    if (r.isError) throw new Error(`${name}: ${r.content[0].text}`);
    return JSON.parse(r.content[0].text);
  };
  // 1 项目与文献
  const p = await call('project_create', { name: 'allene-screening', objective: '温和条件联烯偶联' });
  await call('literature_import', { via: 'bibtex', projectId: p.id, bibtex:
    '@article{a1, title={Allene coupling mild}, year={2024}, journal={JACS}, abstract={low loading, 60C window} }' });
  const hits = await call('literature_search', { projectId: p.id, q: 'allene', limit: 5 });
  expect(hits.hits).toHaveLength(1);
  // 2 图谱：目标 + 证据
  await call('graph_write', { graph: p.graphSlug, nodes: [
    { id: 'obj', type: 'Objective', label: '联烯偶联条件筛选', detail: '', round: 1, attrs: {}, provenance: [] },
    { id: 'ev1', type: 'LiteratureEvidence', label: '60C 窗口证据', detail: '', round: 1, attrs: {},
      provenance: [`scicompass://literature/${hits.hits[0].id}`] }],
    edges: [{ id: 'e1', source: 'ev1', target: 'obj', label: 'supports' }] });
  await call('graph_align_public', { graph: p.graphSlug, nodeIds: ['ev1'] });
  // 3 协议与校验
  const prot = await call('protocol_save', { projectId: p.id, objective: '筛选', payload: { steps: ['mix', 'heat'] } });
  expect((await call('ontology_check', { reagents: ['pd-catalyst'], params: { temperatureC: 60 } })).ok).toBe(true);
  // 4 模拟运行（行动引擎）
  const sub = await call('run_submit', { projectId: p.id, protocolId: prot.id, protocolVersion: prot.version,
    deviceId: 'dev-xtalpi', experimentType: 'reaction-screening', mode: 'simulation', params: { temperatureC: 60, timeHours: 2 } });
  now += 15_000;
  const st2 = await call('run_status', { runId: sub.runId });
  expect(st2.status).toBe('completed');
  // 5 回流
  await call('graph_write', { graph: p.graphSlug, nodes: [
    { id: 'runN', type: 'Run', label: '模拟运行', detail: '', round: 1, attrs: {},
      provenance: [`scicompass://runs/${sub.runId}`] }], edges: [] });
  const results = await call('result_list', { runId: sub.runId });
  const fb = await call('result_flowback', { resultId: results.results[0].id, graph: p.graphSlug, runNodeId: 'runN', round: 1 });
  // 6 蒸馏晋升至组图
  const promo = await call('graph_promote', { fromGraph: p.graphSlug, toGraph: 'grp-masm',
    sourceNodeIds: [fb.resultNodeId], capsule: { headType: 'Lesson', title: '60C 窗口可行',
      summary: '模拟显示 60C/2h 产率良好', supportNodes: [], edges: [] },
    confirmedBy: '麻老师', sanitizationChecked: false, irreversibleAck: false });
  const grp = await call('graph_query', { graph: 'grp-masm', headOnly: true, limit: 10 });
  expect(grp.nodes[0].id).toBe(promo.headNodeId);
  expect(grp.nodes[0].provenance[0]).toContain(p.graphSlug);
});
```

- [ ] **Step 2: 运行确认通过**　Run: `cd scicompass && npx vitest run e2e` → PASS（若失败按测试反馈修正前序模块，不改验收标准）
- [ ] **Step 3: 全量回归**　Run: `npm test && npm run typecheck` → 全绿
- [ ] **Step 4: Commit**　`git commit -am "Add full discovery loop e2e smoke"`

---

### Task 20: 收尾——README、版本戳与真机验证

**Files:**
- Create: `scicompass/README.md`
- Modify: 根 `package.json`（确认 version 0.1.0 一致）

- [ ] **Step 1: 写 README（安装配方 + 数据之家 + 工具清单链接到概要设计）**，含版本与生成日期（v0.1.0 / 2026-06-12）。
- [ ] **Step 2: 真机验证（手动冒烟）**：在本仓库执行 `node scicompass/packages/cli/dist/main.js init --host claude-code --data-home .sciwork-data/scicompass`（先 `npm run build`），确认 `.mcp.json` 出现两个入口、`.claude/skills/` 出现六技能、`CLAUDE.md` 追加约定；重启 Claude Code 会话后 `/scicompass` 可触发、`project_create` 可调用。
- [ ] **Step 3: Commit**　`git commit -am "Add scicompass v0.1 README and finish phase 1 suite"`

---

## 自检记录（writing-plans Self-Review）

1. **规格覆盖**：概要设计 §3（四层/松耦合）→ Task 16-17；§4 LabGraph 三引擎 → Task 4-11；§5 SciGraph（v0.1 mock 锚定）→ Task 9；§6 技能 → Task 18；§7 领航员 → Task 18（scicompass 技能）；§9 治理（状态机/审批/审计/时间线物化）→ Task 13-14；§10 发行（七包/数据之家/claude-code 配方）→ Task 0、16、17、20；§12 打样基础（晶泰模板/装置技能/化学本体）→ Task 4、12、18。SciGraph 投稿、Claude Desktop 打包、常驻智能体按 v0.1 范围声明排除。
2. **占位符扫描**：Task 18 Step 3 四个技能以「要点清单＋行数要求＋与 xtalpi 同款安全条款」给出可执行内容边界（技能为自然语言文档，要点即内容本体）；其余任务代码完整。无 TBD/TODO。
3. **类型一致性**：工具名 31 个与 Task 16 注册一致（knowledge 23 + harness 8）；`graphSlug`/`runId`/`headNodeId`/`RUN_STATUSES` 等命名跨任务核对一致；迁移 id 分段（core 测试自管、library 20、devices 30、runs 31、records 40）无碰撞。
```
