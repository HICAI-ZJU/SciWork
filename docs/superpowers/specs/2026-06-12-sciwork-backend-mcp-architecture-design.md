# SciWork 后端总体架构设计：MCP 资源服务 + 智能体技能包

日期：2026-06-12
承接：`SCIWORK_OVERVIEW_DESIGN.md`（概要设计 v0.1）
范围：后端本体（资源层 + 技能层）。前端 Desktop 优化与后端加载为独立后续工作，互不影响。

## 1. 背景与定位

SciWork 当前是 Electron + React 纯前端演示壳：8 阶段科学工作流（文献 → SciGraph 分析 → 综述 → 方案设计 → LabOntology 校验 → 模拟 → 实验图谱 → 下一轮建议）全部由 `src/services/` 内的 mock 实现，无持久化、无后端。

本设计确立后端本体。经讨论确认的根本性定位：

> **SciWork 的本体不是一个应用，而是「一套科学资源 MCP 服务 + 一组智能体技能包」。**
> SciWork Desktop 只是其中一个可选工作台，为不习惯 CLI 的科学家准备。

## 2. 顶层设计原则：一切能力与 UI、与 LLM 松耦合

1. **资源以 MCP 服务暴露。** 私域文献、知识图谱、实验装置与仪器、实验结果，全部以 MCP tools 形式暴露给大模型调用。任何支持 MCP 的 Agent（Claude Code、Codex、Claude Desktop、自研 CLI）都能直接使用。
2. **功能以技能包接入。** 任何面向用户的功能（文献综述、实验设计、结果分析……）是一个技能包，由 LLM 在技能指导下调用资源工具完成。技能包采用平台中立的 SKILL.md 格式，可直接在 Claude Code / Codex 中使用。
3. **UI 是可替换薄壳。** 工作台不与任何技能紧耦合；不用 SciWork UI 的用户，用 Codex / Claude / 纯 CLI 同样获得全部能力。
4. **后端不承载科学智能。** 综述生成、假设提出、方案设计由「LLM × 技能包 × 资源工具」组合产生；后端只负责资源的存取、执行、审计与溯源，不做编排、不做内容生成。

## 3. 决策记录

| # | 决策 | 选择 | 理由 |
|---|------|------|------|
| DR-1 | 部署形态 | 本地 Sidecar（数据全在科学家本机） | 开发演示最简、离线可用；演进路径见 §14 |
| DR-2 | 技术栈 | Node + TypeScript | 与前端同栈、类型共享；MCP TS SDK 成熟 |
| DR-3 | 第一阶段真实度 | 接口先行；基础设施真、外部依赖 mock | 合同与状态流转真实可演示，换真不动合同 |
| DR-4 | 接口协议 | MCP（弃用上一版 REST 主接口方案） | 顶层原则 §2-1；LLM 即第一公民调用方 |
| DR-5 | 智能承载 | LLM × 技能包（弃用服务端 canned 生成逻辑） | 顶层原则 §2-4；后端瘦身为纯资源层 |
| DR-6 | 第一阶段交付物 | 仅 MCP 服务 + 技能包；Desktop agent loop 为第二阶段 | 能力先行；用 Claude Code / Codex 作现成工作台验证全链路 |

## 4. 总体架构

```text
┌────────────────────  工作台层（任选，皆为薄壳）  ────────────────────┐
│  SciWork Desktop     Claude Code      Codex       纯 CLI / 脚本   │
│  （第二阶段）          (.mcp.json)     (config)                    │
└──────────────┬──────────────┬──────────────┬─────────────────────┘
               │   Agent 运行时：LLM + MCP client + 技能加载器        │
┌──────────────▼──────────────▼──────────────▼─────────────────────┐
│ 技能层  skills/（SKILL.md，平台中立，无运行时进程）                   │
│   literature-review / experiment-design / run-and-analyze        │
└──────────────────────────────┬────────────────────────────────────┘
                               │  MCP 协议（stdio 默认 / streamable HTTP 可选）
┌──────────────────────────────▼────────────────────────────────────┐
│ 资源层  sciwork-mcp（一个代码库，两个挂载入口）                       │
│  ① sciwork-knowledge（常规权限）      ② sciwork-action（特权）      │
│     项目 / 文献库 / 知识图谱             装置与仪器注册表（SCP Profile）│
│     产物 / 协议 / 实验结果               运行状态机 + 审批闸门          │
└──────────────────────────────┬────────────────────────────────────┘
                               │
                SQLite（WAL）+ 文件区（PDF / 实验原始数据）
                               │
            未来换真（合同不变）：SciGraph-SCP ／ 四套装置 SCP
```

分层职责：

- **工作台层**：提供 LLM 会话、MCP client、技能加载。第一阶段直接使用 Claude Code / Codex，不开发。
- **技能层**：纯文本流程知识，指导 LLM 何时调哪些工具、产出什么、何处停下等人。无业务代码、无进程。
- **资源层**：唯一的后端进程。MCP tools 是唯一对外接口；内部分领域服务 + 装置驱动 + 存储。

## 5. 资源层：sciwork-mcp

### 5.1 双入口与权限分级

同一代码库、同一数据库，按风险分两个 MCP 挂载入口（`--profile knowledge|action|all`）：

- **`sciwork-knowledge`**（常规权限）：项目、文献、图谱、产物、协议、结果。纯知识读写，无物理风险。写综述只挂它，物理执行能力根本不进上下文。
- **`sciwork-action`**（特权）：装置与仪器注册表、运行状态机、审批。对应概要设计「硬件技能属于特权技能」，各工作台对它单独挂载、单独授权。

### 5.2 Transport

- **stdio（默认）**：Claude Code / Codex 一行配置即用（`node server/dist/mcp.js --profile knowledge`，发布后 `npx sciwork-mcp`）。多个 stdio 实例并发访问同一 SQLite 由 WAL 模式保证安全。
- **streamable HTTP（`--http <port>`，可选）**：常驻服务，供未来 Desktop UI 连接、多客户端共享、以及搬迁到实验室服务器（§14）。第一阶段实现入口但不作为主路径。

第一阶段只暴露 MCP **tools**（不做 resources/prompts）：tools 在各客户端兼容性最大；resources 留作增强。

### 5.3 工具清单（28 个）

工具入参出参由 `shared/contract/` 的 zod schema 定义（单一真相源，自动转 JSON Schema 作为 MCP inputSchema）。

**sciwork-knowledge（20 个）**

| 工具 | 用途 | 要点 |
|------|------|------|
| `project_list` | 列出项目 | |
| `project_get` | 项目详情 | 目标、统计、最近活动 |
| `project_create` | 创建项目 | name + objective |
| `literature_import` | 导入文献 | 三入口：文件路径 / DOI / BibTeX 文本；文件拷贝入文件区 |
| `literature_search` | 检索文献 | SQLite FTS5 全文 + 字段过滤；真检索，语料为种子数据 |
| `literature_get` | 单篇详情 | 元数据 + 摘要 + 原文件路径（原文阅读交给工作台原生文件能力） |
| `graph_align_public` | 公共图谱对齐 | 文献实体 ↔ SciGraph 公共知识对齐；mock 返回预置结果 |
| `graph_query` | 查询实验图谱 | 按项目 / 节点类型 / 起点子图（递归 CTE） |
| `graph_write` | 写入节点与边 | 批量；每个节点必须带溯源引用 |
| `graph_add_evidence` | 登记证据链 | literature → quote → claim + 置信度，落为图谱节点与边 |
| `artifact_save` | 保存产物 | kind: report / hypothesis / suggestion / analysis；markdown 正文 + 结构化字段 + 溯源引用 |
| `artifact_list` | 产物列表 | 按项目 / kind 过滤 |
| `artifact_get` | 产物详情 | |
| `protocol_save` | 保存实验协议 | 目标、体系、试剂、参数、步骤、安全注记；版本自增 |
| `protocol_get` | 协议详情 | 指定版本或最新 |
| `protocol_validate` | LabOntology 校验 | 术语规范化 + 约束检查；mock 规则集；产出 validation 记录 |
| `result_register` | 登记实验结果 | 结构化摘要 + 原始文件路径 + 溯源（见 §6.4，缺溯源即拒收） |
| `result_list` | 结果列表 | 按项目 / run / 装置过滤 |
| `result_get` | 结果详情 | 含溯源链 |
| `result_flowback` | 结果回流图谱 | 转写 Observation / Result 节点并连边到协议与证据，发更新 |

**sciwork-action（8 个）**

| 工具 | 用途 | 要点 |
|------|------|------|
| `device_list` | 装置与仪器清单 | 含在线状态、当前队列长度 |
| `device_get_profile` | SCP Profile 详情 | 能力、参数 JSONSchema、安全规则、支持的执行策略 |
| `run_validate` | 提交前校验 | 参数对照 profile 的 JSONSchema 真校验，不创建 run |
| `run_submit` | 提交运行 | mode: simulation / physical；见 §5.4、§5.5 |
| `run_status` | 状态与新事件 | 惰性推进状态机，按时刻揭示事件 |
| `run_list` | 运行列表 | 按项目 / 状态过滤 |
| `run_control` | 暂停 / 恢复 / 中止 | action: pause / resume / abort；写审计 |
| `run_approve` | 审批 | 特权语义，见 §5.5；写审计 |

### 5.4 无常驻执行器：时间线物化

stdio 进程随会话生灭，不能依赖常驻 loop 推进模拟。设计为**提交时物化、查询时惰性推进**：

- `run_submit` 时 MockFoundryDriver 一次性生成完整事件时间线（每个事件带绝对 `reveal_at` 时间戳，含状态转移事件与结果产出事件）写入 `run_events`。
- `run_status` / `run_list` 调用时，把 `reveal_at <= now` 的事件揭示出来，按其中的转移事件惰性更新 `runs.status`，run 完成时自动登记结果记录。
- 任何实例、任何时刻查询，状态一致；多个工作台并行使用互不冲突。
- 未来真实装置阶段执行本在远端，本地仅查询/接收回调，由 HTTP 模式承接（§14），该设计天然兼容。

### 5.5 审批与安全模型（Queue With Approval）

状态机（持久化于 `runs`，每次转移写 `run_events`）。`run_submit` 内部先做参数校验，校验失败返回 `validation` 错误、不创建 run；`run_validate` 是同一校验的无副作用预检。持久化状态共 8 个：

```text
run_submit ──┬─ simulation ─────────────────────────────┐
             │                                          ▼
             └─ physical ──► awaiting-approval ──────► queued ──► running ──► completed | failed
                              │      （run_approve 通过）            ⇅ paused
                              └─► rejected（run_approve 拒绝）       └─► aborted   （run_control）
```

- `mode=physical` 的 run 一律停在 `awaiting-approval`，必须经 `run_approve` 才进入队列。第一阶段批准后同样由 MockFoundryDriver 物化执行，结果标记 `executedBy: mock-driver`——审批闸门全流程真实可演示。
- **批准动作必须出自带外的人**：技能包统一约定 LLM 不得自行调用 `run_approve`，仅在用户明确指令下代为调用；Desktop / 客户端 UI 的批准按钮由人点击。`run_approve` 必填 `confirmed_by`（自由文本，记录批准人）。
- `run_approve`、`run_control`、`run_submit(physical)` 全部写入 `audit_log`（工具名、actor、入参快照、时间戳）。
- 概要设计的五级执行策略中，第一阶段实现 Suggest（不调 action 工具即是）、Draft Protocol（protocol_save 不提交）、Queue With Approval（默认）；Bounded Autonomous Loop 与 Emergency Stop 的全局形态不做，`run_control(abort)` 提供单 run 级终止。

## 6. 四类资源域设计

### 6.1 私域文献

项目级文献库。元数据入 `literature` 表，原始文件入 `library/<projectId>/`，全文检索用 SQLite FTS5（接口与检索真实，语料为种子数据）。

- 导入：文件路径（拷贝落盘 + 文件名推断标题的假元数据抽取）；DOI（mock 元数据，标记来源）；BibTeX（真解析——纯格式处理不算科学智能）。
- 原文阅读不做工具：`literature_get` 返回文件路径，工作台用自身文件读取能力看原文。MCP 只管登记、检索、定位——这是松耦合的直接红利。
- 换真路径：导入管线内部加 PDF 文本提取与向量化，工具签名不变；语义检索经 `literature_search` 加 `mode` 参数扩展。

### 6.2 知识图谱（双层）

- **公共层**：SciGraph-SCP 适配器，只读 + 本地缓存。Mock 返回确定性实体对齐（现有 `scigraphAdapter` 逻辑迁为服务端预置数据）；换真为服务端内嵌 MCP client 转发真实 SciGraph-SCP 服务。
- **私有层**：项目级 ExperimentGraph，属性图模型存 `graph_nodes` / `graph_edges`（属性 JSON 列），遍历用递归 CTE。节点类型沿用现有领域模型（Objective / LiteratureEvidence / SciGraphEntity / ReportClaim / Protocol / OntologyConstraint / SimulationRun / Observation / Result / NextSuggestion）。
- 第一阶段不引入图数据库：千级节点 SQLite 足够；存储访问集中在 `server/store/graph.ts`，留好换 Kuzu / Neo4j 的适配器缝。
- 写入纪律：`graph_write` 的每个节点必须携带溯源引用（来源文献 / 协议 / run / 产物之一），无溯源拒写。

### 6.3 实验装置与实验仪器（行动引擎）

三个构件：

**① 装置注册表 + SCP Profile schema**（接口先行阶段最重要的合同交付物）：

```text
DeviceProfile {
  id, name, kind: 'automated-platform' | 'instrument',
  vendor, description,
  capabilities: [{ experimentType, parameterSchema: JSONSchema, constraints }],
  safetyRules: string[],
  supportedPolicies: ('suggest'|'draft-protocol'|'queue-with-approval'|'bounded-loop')[],
  physicalAvailable: boolean   // 第一阶段恒为 false，执行由 mock driver 承接
}
```

种子数据登记四套装置的 mock Profile（iBioFoundry / iChemicalFoundry / Oasis / 复旦晶泰）+ 每空间若干仪器，参数 schema 取各领域典型实验类型的合理化简。

**② DeviceDriver 接口**——SCP Profile 的本地投影：

```text
DeviceDriver { validate(protocol, params) ; plan(run) -> TimelineEvent[] ; }
```

Mock 阶段由 `MockFoundryDriver` 实现（`plan` 产出物化时间线，§5.4）；未来真实装置即实现同一接口的远端 SCP 客户端（`plan` 退化为提交+订阅）。现有 `simulationEngine` 的事件脚本迁为 driver 的时间线模板。

**③ 运行状态机与审批闸门**：见 §5.5。

### 6.4 实验结果（溯源与回流）

装置与仪器产出的一切落在这里：原始数据文件入 `runs/<runId>/`（记录 SHA-256 内容哈希），结构化摘要（指标、观测、解读）入 `results` 表。

- **溯源是硬约束，分两档**：装置运行产生的结果必须携带 `{ runId, protocolId + version, deviceId, 参数快照, 时间戳 }` 全部五项；仪器手测结果可免 runId 与 protocolId，但 deviceId、参数快照、时间戳必填。任一必填项缺失即 `validation` 错误拒收。
- **失败与阴性结果同等登记**——概要设计「失败经验回流」的落点。
- **回流闭环**：`result_flowback` 把结果转写为图谱 Observation / Result 节点，连边到协议节点与证据节点。综述、建议类产物经 `artifact_save` 同样以溯源引用挂回图谱。

## 7. 数据存储

```text
<data-dir>/                      # 生产: Electron userData; 开发: .sciwork-data/（gitignore）
  sciwork.db                     # SQLite 单文件，WAL 模式
  library/<projectId>/<literatureId>.<ext>
  runs/<runId>/...               # 实验原始数据
```

表清单（13 张 + 1 张 FTS5 虚拟表）：

| 表 | 内容 |
|----|------|
| `projects` | 项目（name, objective, created_at） |
| `literature` / `literature_fts` | 文献元数据 / 全文索引 |
| `graph_nodes` / `graph_edges` | 实验图谱（type, label, detail, attrs JSON, provenance JSON） |
| `artifacts` | 产物（kind, title, content, payload JSON, provenance JSON） |
| `protocols` | 协议（payload JSON, version 自增） |
| `validations` | 校验记录（status, normalized_terms, warnings） |
| `devices` | 装置与仪器（profile JSON） |
| `runs` | 运行（mode, status, params JSON, device_id, protocol_id+version） |
| `run_events` | 物化时间线（seq, reveal_at, label, detail, severity, transition_to） |
| `approvals` | 审批（run_id, decision, confirmed_by, note, decided_at） |
| `results` | 结果（summary JSON, file_path, content_hash, provenance JSON） |
| `audit_log` | 特权操作审计（tool, actor, payload JSON, at) |

迁移：按序号 SQL 文件，进程启动时自动执行。种子：`server/store/seed.ts` 注入演示项目、文献语料、四套装置 Profile（现有 `demoData.ts` 内容迁为种子数据源；不删除前端文件，前端照常运行）。

## 8. 技能层

### 8.1 格式

取 Claude Code skills 格式为基准（事实标准，Codex 兼容同形结构）：`skills/<name>/SKILL.md`，frontmatter（name, description）+ 正文。技能不含业务代码，只含流程知识：何时使用、前置（需挂载哪个 MCP 入口）、调用哪些工具及顺序、产物与溯源约定、停点约定。

### 8.2 首批三个技能包

| 技能 | 覆盖原 8 阶段 | 流程概要 | 需要的入口 |
|------|--------------|----------|-----------|
| `literature-review` | 1-3 | `literature_search/import` → 逐篇研读（工作台文件能力）→ `graph_add_evidence` → `graph_align_public` → LLM 撰写综述 → `artifact_save(kind=report)` | knowledge |
| `experiment-design` | 4-5 | 读图谱与综述 → LLM 提出假设（`artifact_save(kind=hypothesis)`）→ 设计协议 → `protocol_save` → `protocol_validate`，未过则修订 | knowledge |
| `run-and-analyze` | 6-8 | `device_get_profile` → `run_validate` → `run_submit(simulation)` → `run_status` 跟进 → 结果解读（`artifact_save(kind=analysis)`）→ `result_flowback` → `artifact_save(kind=suggestion)` | knowledge + action |

### 8.3 通用约定（写入每个技能）

- 每个关键产物生成后停下，向用户呈现并征求意见，再写入资源层。
- 一切写入必须带溯源引用；引用不存在的文献 / 协议即工具报错，不得绕过。
- 永不自行调用 `run_approve`；`mode=physical` 仅在用户明确要求时使用。

## 9. Mock 边界

| 真实 | Mock（预置数据 / 规则） | 不再需要（由 LLM 承担） |
|------|------------------------|------------------------|
| MCP 合同、zod 校验 | `graph_align_public` 的对齐结果 | 综述生成（原 reportService） |
| SQLite 持久化、FTS5 检索 | `protocol_validate` 的 LabOntology 规则集 | 方案设计（原 protocolDesigner） |
| 运行状态机、审批闸门、审计 | MockFoundryDriver 时间线模板 | 建议生成（原静态 next-suggestion） |
| 溯源链、回流、内容哈希 | DOI / PDF 元数据抽取 | |

## 10. 错误处理

MCP 工具错误统一返回 `isError: true` + 结构化 content：`{ code, message, details }`。错误码五类：

- `validation`：入参 / schema / 溯源缺失（zod 细节随附）
- `not-found`：资源不存在
- `conflict`：状态机非法转移（如对 running 的 run 再次 approve）
- `safety`：安全规则拒绝（参数越界、未授权物理执行——为换真预留语义，mock 规则即触发）
- `internal`：未预期错误

审批不是错误而是状态：`run_submit(physical)` 正常返回 run（status=awaiting-approval）+ 下一步指引文本。进程崩溃无恢复问题：状态全在 SQLite，时间线物化设计（§5.4）使重启后查询自然续上。

## 11. 测试策略

- **工具合同测试**：vitest + MCP SDK `InMemoryTransport`，client 直连 server 实例逐工具断言（每个工具至少 1 happy + 1 错误路径），断言含 inputSchema 与 zod 同源。
- **状态机矩阵测试**：合法 / 非法转移全覆盖，非法转移必须 `conflict`。
- **时间线物化测试**：提交后以伪造时钟在不同时刻查询，断言事件揭示与状态推进正确。
- **回流链路测试**：模拟 run 完成 → 结果登记 → flowback → 图谱出现带完整溯源的节点链。
- **审计测试**：特权工具调用必产生 audit_log 记录。
- **技能包验证**：评审 checklist（工具名与合同一致、停点齐全、审批约定在场）+ 在 Claude Code 中以 headless 模式（`claude -p`）跑通三技能 happy path 的人工冒烟。
- 前端现有测试不受影响（本轮不动 `src/`）。

## 12. 仓库结构与依赖

单仓库、单 package.json，新增：

```text
shared/
  domain/types.ts          # 自 src/domain/types.ts 抽取的领域类型（src 侧 re-export，前端零改动）
  contract/*.ts            # 每个资源域一个 zod schema 文件
server/
  mcp.ts                   # 入口：--profile knowledge|action|all、--http、--data-dir
  mcp/registerKnowledge.ts # 工具注册（knowledge 20 个）
  mcp/registerAction.ts    # 工具注册（action 8 个）
  domain/*.ts              # literature / graph / artifacts / protocols / devices / runs / results
  drivers/mockFoundryDriver.ts
  store/db.ts  store/migrations/*.sql  store/seed.ts
skills/
  literature-review/SKILL.md
  experiment-design/SKILL.md
  run-and-analyze/SKILL.md
.mcp.json                  # 本仓库自用：注册两个入口，Claude Code 开箱即用
```

新增依赖：`@modelcontextprotocol/sdk`、`better-sqlite3`、`zod`、`tsx`（dev）。`package.json` 增加 `bin: { "sciwork-mcp": "server/dist/mcp.js" }` 与 `dev:mcp` / `build:server` 脚本。

## 13. 第一阶段明确不做（YAGNI）

用户鉴权（本地单用户）、多空间切换、任务队列中间件、图数据库、向量 / 语义检索、技能动态加载机制（技能就是文件，工作台自己发现）、MCP resources 与 prompts、真实装置对接、Bounded Autonomous Loop、断点续跑、Desktop agent loop（第二阶段独立设计）。以上均在合同上留缝，不写实现。

## 14. 演进路径（合同不变的换真点）

1. **SciGraph 换真**：`graph_align_public` 内部由预置数据换为内嵌 MCP client 转发 SciGraph-SCP 服务。
2. **装置换真**：`MockFoundryDriver` → 实现同一 DeviceDriver 接口的远端 SCP 客户端；`physicalAvailable` 翻真。
3. **空间级部署**：`--http` 模式部署到实验室服务器即成空间级后端，多用户共享；工作台仅改连接配置。
4. **文献增强**：PDF 解析、向量化、语义检索在导入管线与 `literature_search` 内部扩展。
5. **Desktop**：第二阶段为 Desktop 设计自研薄 agent loop（模型可配置），UI 作为 MCP 宿主 + 简化对话框。

## 15. 与前端的边界

本轮交付不修改 `src/` 任何文件；现有 UI 与测试照常运行（继续使用 demoData 演示）。`shared/domain/types.ts` 抽取以 re-export 方式保持前端 import 路径不变。前端切换为 MCP 宿主、移除 stageMachine 编排，属于第二阶段前端工作，与本后端实现并行互不影响。
