# LabKAG 概要设计文档 v1.1

| 项 | 值 |
|---|---|
| 文档版本 | v1.1 |
| 日期 | 2026-06-15 |
| 承接 | `SCIWORK_OVERVIEW_DESIGN.md`（概要设计 v0.1）· `docs/superpowers/specs/2026-06-12-sciwork-backend-mcp-architecture-design.md`（后端 MCP 架构）· `scicompass/README.md`（七包 v0.1.0） |
| 状态 | 设计稿，待评审 |

## 修订记录

| 版本 | 日期 | 变更 | 作者 |
|---|---|---|---|
| v1.0 | 2026-06-15 | 首版：LabKAG 从「图包」升格为独立分发的知识层技能包；确立混合 GraphRAG 内核、窄 LabData、MCP+SKILL 交付形态 | 罗盘 × 船长 |
| v1.1 | 2026-06-15 | 补充 LabKAG 与 SciWork UI 的松耦合关系：LabKAG 自带浏览器展示面，SciWork 仅作为通用宿主嵌入；中间会话统一交互，MCP tools 保持权威动作合同 | 罗盘 × 船长 |

---

## 1. 定位与范围

LabKAG 是 **SciWork / SciCompass 体系中可独立分发的「知识层技能包」**。它把原 SciCompass 七包里的「知识半边」收拢成一个自洽单元，并在底层新增一台检索引擎。

> **一句话定位：LabKAG = 实验室的知识增强检索引擎（Knowledge-Augmented Generation for the Lab）——把私域文献、实验数据、协议产物，经 LabOntology 类型化、汇入 LabGraph，由一台「构建期可调模型、查询期 LLM-free」的混合 GraphRAG 串联起来，作为 MCP 服务 + 自带技能 + 可移植浏览器展示面交付给任意宿主智能体。**

LabKAG **是什么**：

- 一个知识资源层：文献（LabLiterature）、实验数据（LabData）、协议与产物（Records 瘦域）、三级图谱（LabGraph）、本体法度（LabOntology）。
- 一台检索内核（@labkag/graphrag）：向量 + 图 + 本体的混合检索，返回带溯源的证据子图。
- 一个可组装技能包：以 MCP tools + SKILL.md 交付，`npx labkag` 可独立起，任何支持 MCP 的宿主（Claude Code / Codex / SciWork Desktop）可挂载。
- 一个可移植展示面：以浏览器 UI 展示证据子图、溯源、索引状态、文献 chunk 与本体路径；宿主可内嵌，也可外部浏览器打开。

LabKAG **不是什么**：

- 不是行动引擎：装置注册、运行状态机、审批、审计属于 **LabHarness**（特权域，LabKAG 之外的兄弟包）。
- 不承载科学智能：推理、综述、假设、查询计划由「宿主 LLM × 技能 × LabKAG 工具」产生；LabKAG 查询期不调 LLM。
- 不是公共知识图谱：公共 SciGraph-SCP 只读锚定，不在 LabKAG 内重建。
- 不是 SciWork UI 的内置模块：SciWork 是通用科研工作台，LabKAG UI 只在用户明确启用 LabKAG 时作为可嵌入展示面出现。

**与 SciCompass、LabHarness、SciWork UI 的关系**：SciCompass 退化为**组装器**——挂 LabKAG（知识）+ LabHarness（行动）+ 领域技能 + 罗盘人格技能，自己不再持有知识逻辑。SciWork UI 是通用宿主壳，不改变左侧空间 / 项目 / 会话结构；当科学家在项目或会话中启用 LabKAG 时，SciWork 中间会话框负责统一意图入口，右侧嵌入 LabKAG 自带浏览器展示面。

## 2. 设计决策记录（DR）

本设计由六个决策定型，逐条记录选择与理由，供评审与回溯。

| # | 决策 | 选择 | 理由 |
|---|------|------|------|
| DR-1 | LLM 边界 | **混合**：查询/检索路径永不调 LLM；构建/索引期可调用一个**显式配置、可选、离线**的模型端点 | 保住查询期纯净、快、可缓存；又让构建期能做类型化抽取等需要语义的重活；端点可关，无模型时退化仍可用 |
| DR-2 | LabData 范围 | **窄**：仅「数据」——结果结构化摘要 + 原始数据文件/数据集 + content hash + 溯源 | 「实验数据」语义最聚焦；protocols/artifacts 不是数据，另立瘦记录域，职责清晰 |
| DR-3 | 检索内核 v1 | **① 轻量混合检索**：向量召回 → 本体类型 k-hop 扩展 → 混合打分 → 证据子图 + 溯源 | 最简、最快、条条可溯源，与现有 `graphStore`/`promote` 无缝；明确留缝给 ②社区摘要 / ③逻辑计划执行 |
| DR-4 | 交付形态 | **MCP 服务 + 自带 SKILL** | 「独立技能包 + 可组装」名实相符；与现有 CLI `init` 机制一致；跨宿主复用 |
| DR-5 | UI 关系 | **LabKAG 自带浏览器展示面，宿主按能力内嵌或外部打开** | 复杂图谱/证据展示不写死在 SciWork；Codex、Claude Desktop、SciWork、CLI 均可按能力使用同一展示面或文本降级 |
| DR-6 | 交互入口 | **用户意图统一进入宿主会话框；LabKAG Web UI 以展示和轻交互为主** | 避免中间会话与右侧 UI 形成两套动作入口；写操作、构建、导入等动作仍经 MCP tools，便于权限、审计、复现 |

补充约定：

- **嵌入模型不算「调 LLM」**（判别式、可本地、非生成），但归入「构建期可选依赖」，同样可关；关掉退化为纯 FTS5 + 图遍历。
- **独立分发 ≠ 现在就拆仓**：v1 仍住在 scicompass monorepo，按 `@labkag/*` 作用域自洽；将来抽独立仓时合同不变。

## 3. 首要不变量

LabKAG 自身的不变量（评审与实现红线）：

1. **查询期永不调 LLM。** 检索路径只做向量/图/本体的确定性计算；智能（推理、综述、查询计划）在宿主。
2. **构建期模型可关。** 模型端点缺失时，以「本体 + 规则」抽取，图更稀但闭环仍跑通；嵌入缺失时退化为 FTS5 + 图遍历。
3. **溯源是硬约束。** 任何图谱节点必须携带溯源引用（来源文献 / 数据 / 协议 / 产物之一），无溯源拒写；检索返回的每条证据都可回指主库记录。
4. **法度先声明、后执行。** LabOntology 先声明（YAML），写入与检索都受其约束（§7）。
5. **读世界直连，写自家过闸，写世界过双闸。** 公共 SciGraph 只读锚定；晋升到组图/公开图须经人工闸门（沿用现 `promote` 三档闸）。
6. **动作合同先于 UI。** LabKAG Web UI 不能成为唯一动作入口；任何导入、构建、检索、写图等动作必须能通过 MCP tools 完整表达。
7. **宿主壳不内化 LabKAG 语义。** SciWork、Codex、Claude Desktop 只负责会话、嵌入展示、MCP 调用和权限边界；不直接依赖 `@labkag/*` 内部实现。

继承自 SciCompass 的总不变量（修订其一）：原「SciCompass 服务自身永不调用 LLM」在 LabKAG 收敛为「**查询期**永不调 LLM」——构建期的离线、可关、显式配置的模型调用是这条不变量的受控例外。

## 4. 总体架构与分层

```text
┌──────────────────────────────────────────────────────────────────────┐
│  宿主智能体 / 工作台  Claude Code / Codex / SciWork Desktop / CLI        │
│  —— LLM 在此：推理 · 综述 · 出查询计划 · 决定何时调工具                  │
│  —— UI 壳在此：会话框 · MCP client · 可选浏览器/右侧展示面               │
└───────────────┬──────────────────────────────┬───────────────────────┘
                │ 组装(.mcp.json 挂入口 + 取 SKILL + 可选嵌入 UI URL)
   ┌────────────▼───────────────────┐      ┌──────────▼─────────────┐
   │  LabKAG（知识技能包）            │      │ LabHarness（行动·特权） │
   │  MCP 入口 + 自带 SKILL           │      │ 装置 / 运行 / 审批 / 审计│
   │  Browser UI（展示面，可内嵌）     │      │ 执行→交付产出        │
   │  ← 本文档对象                    │      │                      │
   └────────────┬─────────────┬──────┘      └────────────────────┼────┘
                │             │                                   │
                │             └─ Webview / Browser / External URL │
                │                                                 │
   ┌────────────▼──────────────────────────────────────────▼──────────┐
   │  GraphRAG 内核   @labkag/graphrag       （新增·真正的内核）         │
   │   构建期(离线·可调模型·可关): 切块 → 类型化抽取 → 写图 → 嵌入       │
   │   查询期(在线·LLM-free·可缓存): 向量召回 → 类型 k-hop → 混合打分     │
   │                                → 证据子图 + 溯源引用                │
   └───┬──────────┬──────────┬───────────┬──────────┬──────────────────┘
       │          │          │           │          │
  ┌────▼────┐ ┌──▼─────┐ ┌──▼─────┐ ┌───▼─────┐ ┌──▼────────┐
  │LabLit   │ │LabData │ │Records │ │LabGraph │ │LabOntology│
  │文献全文 │ │结果摘要│ │协议+   │ │三级属性 │ │类型·边·   │
  │+元数据  │ │+原始数据│ │产物日志│ │图谱     │ │路径·权重  │
  │+切块    │ │+哈希   │ │(瘦)    │ │晋升/回流│ │(法度+检索)│
  └─────────┘ └────────┘ └────────┘ └─────────┘ └───────────┘
       └──────────┴──────────┴───────────┴──────────┘
         SQLite(WAL) + 向量索引(sqlite-vec) + 文件区(PDF/原始数据)
```

分层职责：

- **宿主层**：LLM 会话、MCP client、技能加载、可选浏览器嵌入。SciWork 是通用科研工作台壳，左侧空间 / 项目 / 会话结构不为 LabKAG 改造；LabKAG 仅在项目或会话中被激活时出现。
- **技能包层（LabKAG）**：MCP tools（资源 + 检索）+ SKILL.md（流程知识）+ Browser UI（展示面）。stdio 随会话生灭；需要展示面时可启动 `labkag ui` 或由 `labkag serve` 暴露 UI URL。
- **内核层（graphrag）**：构建期管线 + 查询期混合检索；唯一新增的核心算法面。
- **资源子域**：文献 / 数据 / 记录 / 图谱 / 本体，各自管存储与合同。
- **持久层**：单 SQLite（WAL）+ sqlite-vec 向量索引 + 文件区。

## 5. 包分解

| 子模块 | 职责 | 来自现有 |
|---|---|---|
| `@labkag/core` | zod 合同 · 溯源 URI · SQLite 迁移框架 · ids | `scicompass/core`（共享语法） |
| `@labkag/ontology` | 法度 **+ 检索语义**：节点类型 / 边标签 / 可走类型路径 / 类型权重 | `labontology`（升格） |
| `@labkag/literature` | LabLiterature：导入(file/DOI/BibTeX) · 元数据 · 原文区 · **切块** | `lablibrary`（改名 + 加切块） |
| `@labkag/data` | LabData（窄）：结果摘要 + 原始数据/数据集 + content hash + 溯源 | `records.ts` 的 `results` 抽出 |
| `@labkag/records` | 瘦记录域：projects + protocols + artifacts/logbook | `records.ts` 其余部分 |
| `@labkag/graph` | LabGraph：三级属性图 · `promote` 晋升 · `flowback` 回流 · `alignPublic` 锚定 · `exportMd` | `labkag` 图部分 |
| `@labkag/graphrag` | **新内核**：构建期管线 + 查询期混合检索 + 向量索引适配 | 全新 |
| `@labkag/mcp` | 可组装入口：注册 MCP tools + 打包 SKILL.md | `cli` 的 `registerKnowledge` 抽出 |
| `@labkag/ui` | **浏览器展示面**：证据子图、文献 chunk、溯源链、索引状态、本体路径、检索结果看板 | 全新 |
| `@labkag/cli` | `labkag mcp` / `labkag ui` / `labkag serve` / `labkag init` / CLI 文本交互 | `cli` 拆分 + 新增 |

包依赖方向（无环）：`mcp → graphrag → {literature, data, records, graph, ontology} → core`；`ui → mcp client/http adapter → mcp tools`；`graph → ontology`（写入校验）。`ui` 不直接越过 MCP 合同写内部库。

## 6. 数据与存储模型

**数据之家**：`LABKAG_HOME`（默认 `~/.labkag`）；被 SciCompass 组装时复用 `SCICOMPASS_HOME`，与 LabHarness 同库。沿用「记忆在日志，不在港口，也不在引擎」。

```text
<LABKAG_HOME>/
  labkag.db                       # SQLite 单文件，WAL；含 sqlite-vec 向量表
  library/<projectId>/<litId>.<ext>   # 文献原文
  data/<projectId>/<dataId>/...       # 实验原始数据（记 SHA-256）
  graphs/<slug>.db                # 三级 LabGraph（沿用现 GraphRegistry 一图一库）
```

**表清单（含 FTS5 与向量虚拟表）**：

| 表 | 域 | 内容 |
|----|----|----|
| `projects` | records | id, name, objective, graph_slug, created_at |
| `protocols` | records | id, project_id, version 自增, objective, payload JSON |
| `artifacts` | records | id, project_id, kind(report/hypothesis/suggestion/analysis/logbook/tool), title, content, payload JSON, provenance JSON |
| `literature` / `literature_fts` | literature | 元数据 / FTS5 全文（退化检索路径） |
| `data_results` | data | id, origin(device-run/manual-instrument), summary JSON, params JSON, file_path, content_hash, device_id, project_id, at, provenance JSON |
| `chunks` | graphrag | id, source_uri, source_kind(lit/data/protocol/artifact), text, ord, project_id, provenance JSON |
| `chunk_vec`（sqlite-vec） | graphrag | chunk_id ↔ embedding（可关：无嵌入则空表，走 FTS5） |
| `nodes` / `edges`（每图一库） | graph | 沿用现 `graphStore`：节点 type/label/detail/round/attrs/provenance |
| `node_vec`（sqlite-vec） | graphrag | node_id ↔ 节点摘要 embedding |
| `build_log` | graphrag | 增量构建记录：source_uri, built_at, model_used, status |

**三级 LabGraph**（沿用现 `GraphRegistry`）：`prj-*`（项目）/ `grp-*`（组）/ `*-open`（公开），按 slug 推断；自包含校验（边两端须在本图）；晋升头类型 `Lesson / Method / Prior / NegativeResult`。

**溯源 URI** 贯穿：`makeRecordUri('results'|'protocols'|'artifacts'|'literature'|'runs', id)`；检索结果的每个 chunk / 节点都可回指主库记录。

**向量索引选型**：sqlite-vec 装入同一 SQLite，守「单文件」哲学；存储访问集中在 graphrag，留好换 Kuzu / 专用向量库的适配缝。

## 7. LabOntology：从法度到检索语义

LabOntology 在本设计中**一身二职**：

**① 法度（沿用）**：vocabulary（术语）/ constraints（约束）/ process rules（过程规则）；`validateGraphWrite` 校验所有写入，`checkIntent` 预检意图。第一阶段固定 `chemistry/v1`，后续由空间配置决定。

**② 检索语义（新增）**：本体额外声明四样东西，驱动检索——

- **节点类型**：抽取时给实体定 type（Objective / LiteratureEvidence / Protocol / Result / Observation / NextSuggestion / …）。
- **边标签**：合法关系标签集（produced / supports / refutes / derived-from / …）。
- **可走类型路径（type-paths）**：k-hop 扩展时**只走本体允许的类型路径**，避免噪声爆炸（如 `Evidence —supports→ Claim —tested-by→ Protocol`）。
- **类型权重**：混合打分时按节点/边类型加权（如证据链 > 旁支属性）。

这就是「通过 LabOntology 串联」在检索侧的落地：本体既约束写，也制导读。

## 8. 构建期管线（离线 · 可调模型 · 可关）

`kag_build`（按项目 / 按源，增量）：

```text
1. ingest    取一批源：literature 全文 / data_results 摘要 / protocol / artifact
2. chunk     切块 → chunks 表（带 source_uri 溯源、本体可标的 source_kind）
3. extract   类型化抽取实体与关系：
               · 有模型 → 模型按本体 schema 抽取（受 DR-1 配置端点）
               · 无模型 → 规则 + 本体词表抽取（退化，图更稀）
4. write     graph_write 写入三级 LabGraph（溯源硬校验；本体 validateGraphWrite）
5. embed     对 chunks 与节点摘要求嵌入 → chunk_vec / node_vec
               · 无嵌入端点 → 跳过，FTS5 承接
6. log       写 build_log（source_uri, model_used, status），支持增量：仅未建 / 已变更的源
```

**模型端点配置**：`LABKAG_BUILD_MODEL`（抽取）/ `LABKAG_EMBED_MODEL`（嵌入），均可选、可本地、可远端、可关。两者皆缺 → 纯规则 + FTS5 + 图遍历，闭环不断。

## 9. 查询期检索（在线 · LLM-free · 可缓存）

`kag_retrieve`：

```text
输入  { query | retrievalPlan, projectId?, round?, types?, k?, hops? }
        retrievalPlan 为可选的宿主出结构化检索计划（留缝 ③）
步骤
  1. 种子召回   向量近邻(chunk_vec/node_vec)；无嵌入则 FTS5 命中 → 种子节点集
  2. 图扩展     沿 LabOntology 允许的类型路径，k-hop 扩展种子邻域（默认 hops=2）
  3. 混合打分   score = w1·语义相似 + w2·图距离衰减 + w3·round 新近 + w4·本体类型权重
  4. 组装       取 top-N，回填溯源与文本块
输出  {
        subgraph: { nodes, edges },          // 证据子图
        evidence: [{ chunkOrNode, provenance, score }],
        notes:    { degraded?: 'no-model'|'no-embed' }   // 退化透明告知
      }
```

宿主智能体拿证据子图去推理 / 综述 / 写产物——**智能在宿主，检索在引擎**。

**留缝**：

- **② 社区摘要**：构建期可选加 Leiden 聚类 + 模型生成社区摘要分层，供「整批讲了什么」的全局问题；不进 v1。
- **③ 逻辑计划执行**：宿主出结构化 `retrievalPlan`（多跳/SPO/路径），引擎 LLM-free 执行回填；接口已在入参留位，求解器后置。

## 10. 对外接口：MCP tools + SKILL + Browser UI

**MCP 工具面**（承自现 `registerKnowledge` 23 工具，按子域重组 + 新增 kag_*）：

| 组 | 工具 |
|---|---|
| 项目/记录 | `project_create` · `project_list` · `project_get` · `protocol_save` · `protocol_get` · `protocol_validate` · `artifact_save` · `artifact_list` · `artifact_get` |
| 文献 | `literature_import` · `literature_search` · `literature_get` |
| 数据 | `data_register` · `data_list` · `data_get` |
| 图谱 | `graph_write` · `graph_query` · `graph_promote` · `graph_align_public` · `graph_export_md` · `graph_flowback` |
| 本体 | `ontology_check` |
| **GraphRAG（新）** | `kag_build`（构建/增量索引）· `kag_retrieve`（混合检索→证据子图）· `kag_status`（索引状态） |

入参出参由 `@labkag/core` 的 zod schema 单一真相源定义，自动转 MCP inputSchema。Transport：stdio（默认）+ streamable HTTP（可选，常驻 / 多客户端）。

**自带 SKILL.md**（平台中立，随包分发）：

- `labkag-retrieve`：教宿主何时检索、如何用证据子图、溯源纪律（引用不存在即工具报错，不绕过）、退化提示（`notes.degraded` 出现时如何降级使用）。
- （可选）`labkag-ingest`：教宿主如何把新文献 / 数据喂入并触发 `kag_build`。

**SciCompass 组装方式**：`labkag` CLI `init --host claude-code` 产出 `.mcp.json`（注册 `labkag-knowledge` 入口）+ 复制 SKILL 到 `.claude/skills/`；与 LabHarness 的 `labharness-action` 入口并列。罗盘技能在更上层编排二者。

**Browser UI 展示面**（新增，非权威动作接口）：

- `labkag ui`：启动只读/轻交互浏览器展示面，默认连接本机 LabKAG MCP/HTTP transport。
- `labkag serve`：可同时暴露 MCP streamable HTTP 与 UI URL，供 SciWork / Codex / Claude Desktop / 普通浏览器加载。
- UI 展示能力：证据子图、文献 chunk 阅读、溯源链路、build 状态、degraded notes、本体 type-path、检索历史与 evidence bundle。
- UI 写动作边界：导入、构建、写图、晋升等动作必须通过 MCP tools 表达；UI 可以提供按钮，但按钮只发起 MCP tool call，不绕过合同。

## 11. 可移植浏览器展示面与宿主集成

LabKAG 的复杂可视化不写入 SciWork renderer，也不要求 Codex / Claude Desktop 复刻一套组件。LabKAG 自带一个浏览器展示面，宿主按能力选择嵌入或外部打开。

```text
用户意图
  ↓
宿主会话框（SciWork 中间 Composer / Codex chat / Claude chat / CLI）
  ↓
宿主按 SKILL 调用 LabKAG MCP tools
  ↓
LabKAG 返回 evidence / subgraph / provenance / status
  ↓
宿主把结果展示在文本中，并可通知/刷新 LabKAG Browser UI
  ↓
右侧 webview / browser panel / 外部浏览器显示图谱与证据细节
```

**宿主能力分级**：

| 档位 | 形态 | 行为 |
|---|---|---|
| Full embed | SciWork 右侧 webview、Codex browser panel 等 | 宿主内嵌 LabKAG UI URL；会话框负责动作，右侧负责展示与轻交互 |
| External browser | Claude Desktop 或其他不能稳定内嵌的宿主 | 宿主打开/提示打开 `http://localhost:<port>`；MCP tools 仍在会话中调用 |
| Text/CLI fallback | 纯终端、无浏览器环境 | MCP tools 返回 Markdown/JSON evidence bundle；`graph_export_md` 和 `kag_retrieve` 文本输出承接 |

**SciWork 集成原则**：

- SciWork 是通用科研工作台，不是 LabKAG 专属 UI；左侧空间 / 项目 / 会话结构不为 LabKAG 改造。
- LabKAG 只有在项目或会话中被科学家明确启用时才激活。
- SciWork 中间会话框是统一交互入口：自然语言、slash command、附件意图都由宿主解释后调用 MCP tools。
- SciWork 右侧可以内嵌 LabKAG Browser UI，作为展示面：证据子图、来源阅读器、构建状态、索引健康、本体路径等。
- Renderer 不 import `@labkag/*`；Electron main 作为 MCP client 启动/连接 LabKAG，管理 UI URL 与权限边界。

**LabKAG UI v1 范围**：

- 首页：当前实例、项目、ontology、索引状态、degraded 状态。
- Sources：文献、数据、协议、产物来源列表与溯源。
- Build：`kag_build` 状态、source-by-source build log、失败/退化原因。
- Retrieve：最近查询、参数、evidence 列表、score、provenance。
- Graph：证据子图和项目图谱的基础浏览，高亮 seed、k-hop 路径与节点类型。

**LabKAG UI v1 不做**：

- 不做报告生成、假设生成、下一轮实验建议等宿主智能工作流。
- 不做 LabHarness 行动控制、设备审批、运行状态机。
- 不把 SciWork 的空间 / 项目 / 会话结构复制进 LabKAG UI；LabKAG UI 只消费宿主传入的 project/session context 或 LabKAG 自身项目记录。
- 不要求所有宿主内嵌浏览器；必须保留外部浏览器与文本降级。

## 12. 错误处理

沿用五类错误码，MCP 工具统一 `isError:true` + `{ code, message, details }`：

- `validation`：入参 / schema / **溯源缺失**（zod 细节随附）
- `not-found`：资源不存在
- `conflict`：状态非法（如对已晋升节点重复晋升）
- `safety`：本体 / 安全规则拒绝
- `internal`：未预期错误

构建期模型端点不可达**不报错**，而是降级：`kag_build` 返回 `status: degraded` + `model_used: none`；查询结果以 `notes.degraded` 透明告知。降级是状态，不是错误。

UI 展示面不得吞掉 MCP 错误：Browser UI 和宿主文本回复均应展示同一错误码、同一溯源缺失原因、同一 degraded 状态。

## 13. 测试策略

- **工具合同测试**：vitest + MCP SDK `InMemoryTransport`，逐工具 happy + 错误路径；断言 inputSchema 与 zod 同源。
- **构建期双路测试**：模型端点开 / 关两条路径都跑通；关端点时断言走规则抽取 + FTS5，闭环不断。
- **查询期检索测试**：构造已知图谱 → 断言召回、类型 k-hop 扩展、混合打分排序、证据子图溯源完整。
- **退化测试**：无嵌入 → FTS5 承接；无模型 → 规则抽取；`notes.degraded` 正确置位。
- **溯源链路测试**：data_register → graph_flowback → 检索命中带完整溯源的节点链。
- **晋升闸门测试**：`graph_promote` 三档闸（人工确认 / 脱敏 / 不可逆 ack）齐全。
- **SKILL 验证**：评审 checklist（工具名与合同一致、停点齐全、溯源纪律在场）+ Claude Code headless 冒烟。
- **Browser UI 展示测试**：给定固定 `kag_retrieve` 响应，断言 evidence、subgraph、provenance、degraded notes 渲染一致；UI 不直接写内部库。
- **宿主嵌入测试**：SciWork Electron main 启动/连接 LabKAG MCP 与 UI URL；renderer 通过 IPC 调用，右侧 webview 能加载展示面；无 webview 时文本降级仍可用。

## 14. 迁移路径（从 scicompass v0.1）

合同保持、分步重构，FTS5 与现有 `graphStore` 全程保留（退化路径与现状一致）：

1. **拆 `records.ts`**：`results` → `@labkag/data`（更名 `data_results`，加 content_hash）；`projects/protocols/artifacts` → `@labkag/records`。`result_*` 工具更名 `data_*`，旧名保留别名一版。
2. **`lablibrary` → `@labkag/literature`**：加 `chunk` 能力（导入管线产出 chunks）；`literature_*` 工具签名不变。
3. **`labkag`（图）→ `@labkag/graph`**：剥离 `records.ts`；`graphStore/registry/promote/alignPublic/exportMd/flowback` 原样迁入。
4. **`labontology` → `@labkag/ontology`**：YAML 加检索语义段（type-paths、type weights）；`validate*` 不变，新增只读 `retrievalSchema()`。
5. **新增 `@labkag/graphrag`**：chunks 表、sqlite-vec、构建期管线、查询期检索；`kag_build/kag_retrieve/kag_status`。
6. **新增 `@labkag/mcp`**：从 `cli/registerKnowledge` 抽出，重组工具面 + 打包 SKILL；`labkag` bin 提供 `init` / `serve`。
7. **新增 `@labkag/ui`**：先做浏览器展示面 v1（状态 / Sources / Build / Retrieve / Graph），只通过 MCP/HTTP adapter 消费 LabKAG 合同。
8. **SciWork 侧**：Electron main 作为 LabKAG MCP client，支持启动/连接 LabKAG sidecar 与 UI URL；renderer 只拿 IPC facade 与 webview URL，不 import `@labkag/*`。
9. **SciCompass 侧**：CLI `init` 改为组装 `labkag-knowledge` + `labharness-action` 双入口；罗盘技能不动逻辑、只改挂载点。

换真点（合同不变）：SciGraph 锚定换真（`graph_align_public` 接真实 MCP client）、构建期模型换真（配置端点）、向量库换真（sqlite-vec → 专用库）。

## 15. 范围与后续

**v1 含**：十子包结构、混合 GraphRAG 内核（构建期可调模型 + 查询期①轻量混合）、窄 LabData、MCP + SKILL + Browser UI 交付、从 v0.1 的合同保持迁移、模型/嵌入双退化路径、全闭环测试。

**v1 明确不做（YAGNI）**：② 社区摘要分层、③ 逻辑形式求解器（仅留入参缝）、抽独立仓、跨宿主专用 UI 适配器（Codex/.mcpb 深度集成）、真实 SciGraph 深度锚定、常驻智能体、多空间、LabHarness 行动控制 UI、报告/假设/建议生成 UI。

**v2+**：② 社区摘要、③ 宿主出计划→引擎执行多跳、SciGraph 投稿管道、独立仓与跨宿主分发、向量库换真、宿主间 UI 深度联动协议。

## 16. 术语

| 术语 | 含义 |
|---|---|
| LabKAG | 实验室知识增强检索技能包；本文档对象 |
| LabLiterature | 私域文献子域：元数据 + 原文 + 切块 |
| LabData | 实验数据子域（窄）：结果摘要 + 原始数据 + 哈希 + 溯源 |
| Records 瘦域 | 项目 + 协议 + 产物/日志 |
| LabGraph | 三级属性图谱（项目/组/公开）+ 晋升 + 回流 + 锚定 |
| LabOntology | 本体法度 + 检索语义（类型/边/路径/权重） |
| GraphRAG 内核 | `@labkag/graphrag`：构建期管线 + 查询期混合检索 |
| LabKAG Browser UI | LabKAG 自带的浏览器展示面，用于证据、图谱、溯源、构建状态等复杂展示 |
| 宿主壳 | SciWork / Codex / Claude Desktop / CLI 等承载会话、MCP client 和可选展示面的外部环境 |
| 构建期 / 查询期 | 离线·可调模型·可关 / 在线·LLM-free·可缓存 |
| 证据子图 | 检索输出：带溯源的节点边子图 + 文本块 |
| 晋升 / 回流 | 知识从项目图蒸馏入组图 / 实验结果转写入图 |
