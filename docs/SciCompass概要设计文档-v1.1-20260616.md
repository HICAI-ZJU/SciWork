# SciCompass 概要设计文档 v1.1

| 项 | 值 |
|---|---|
| 文档版本 | v1.1 |
| 日期 | 2026-06-16 |
| 状态 | 设计稿，待评审 |
| 承接 | `docs/SciCompass概要设计文档-v1.0-20260612.docx`、`docs/LabKAG概要设计文档-v1.1-20260615.md`、`docs/LabOntology概要设计文档-v1.0-20260615.md`、`docs/LabHarness概要设计文档-v1.0-20260616.md`、`docs/SciWork UI概要设计文档-v1.0-20260616.md` |

## 修订目标

v1.0 把 SciCompass、LabGraph、LabKAG、LabOntology、LabHarness、SciGraph、SciWork、领航员人格和发行部署放在一个总体系中描述，适合表达愿景，但容易让工程师误解几个边界：

- SciCompass 是否拥有 LabKAG、LabHarness、LabOntology 的内部实现。
- LabGraph 是否是一个独立模块或独立技能包。
- SciWork 是否是 SciCompass 的唯一或上级宿主。
- SciGraph 是否被打包进 SciCompass 发行版。
- “七包发行版”是否仍是固定内部包结构。

v1.1 的目标是给工程实现和后续拆分提供清晰边界：SciCompass 保留为总品牌、发行版装配器和罗盘人格交互层；具体科学能力由独立技能包和外部服务实现。

## 1. 定位与边界

SciCompass 是面向科学发现工作流的工程发行版与领航员交互层。它不直接实现知识检索、实验本体、实验执行治理或工作台 UI，而是通过统一安装、配置、宿主适配、空间模板和罗盘人格，把 LabOntology、LabKAG、LabHarness、SciGraph 连接、装置/仪器技能和宿主工作台组装成一套可运行的科学发现系统。

一句话定位：

> SciCompass = 科学罗盘发行版 + 领航员人格 + 科学技能包装配层。

工程边界分为四层：

```text
Host Layer
  SciWork / Codex / Claude / CLI
  负责会话、模型、用户交互、可选 Browser UI 承载

SciCompass Distribution Layer
  scicompass CLI
  host adapters
  space templates
  navigator skill
  runtime config
  default integration manifests

Independent Skill Package Layer
  LabOntology
  LabKAG
  LabHarness
  automation / robot / instrument skills
  analysis / domain skills

External/Public Service Layer
  SciGraph
  model providers
  cloud workspace / remote runtimes
```

SciCompass 是什么：

- 一个发行版装配器：安装、配置、启动、检查、连接一组科学技能包。
- 一个宿主适配层：把同一套科学能力接入 SciWork、Codex、Claude、CLI 和未来云工作区。
- 一个罗盘人格：以 `skills/scicompass/SKILL.md`、`/scicompass`、`/luopan` 和宿主 agent loop 作为第一交互界面。
- 一个总品牌：承载科学发现工作流、公共星图连接、实验验证知识回流和未来常驻领航员方向。

SciCompass 不是什么：

- 不是 LabKAG 的新名字。
- 不是 LabHarness 或 LabOntology 的上层私有实现。
- 不是 SciWork UI 的后端。
- 不拥有宿主 LLM，也不在核心服务中直接生成科学判断。
- 不是固定七包 monolith。

用户感知到的 SciCompass 主要是罗盘人格；工程师看到的 SciCompass 应该是发行版装配器。

## 2. 发行版组成

旧 v1.0 的“七包发行版”在 v1.1 中改写为“SciCompass 自身发行组件 + 默认集成的独立技能包”。

### 2.1 SciCompass 自身组件

```text
scicompass CLI
  init / serve / bundle / doctor / skill

host adapters
  sciwork
  codex
  claude-code
  claude-desktop
  cli/http

navigator skill
  skills/scicompass/SKILL.md
  /scicompass and /luopan commands
  handoff rules between skills
  safety and approval behavior

space templates
  fudan-xtalpi
  zju-ichemfoundry
  zju-ibiofoundry
  zju-oasis

distribution manifests
  which skill packages to install
  which MCP endpoints to register
  which Browser UI surfaces to expose
  which profiles/domain packs to load

runtime config
  local-sidecar / remote-endpoint / cloud-workspace
  data home pointers
  enabled spaces and skill package versions
```

SciCompass 自身代码的职责是安装、组合、启动、检查、连接、配置和写入宿主入口。它不重新实现 KAG、Harness、Ontology 的 runtime。

### 2.2 默认集成但独立拥有的能力

```text
LabOntology
  semantic and rule authority

LabKAG
  knowledge retrieval, graph, evidence, provenance, Browser UI

LabHarness
  workflow governance, execution state, approvals, device/instrument routing

SciGraph connector
  external public knowledge graph connection and anchor target

automation / robot / instrument skills
  concrete platform and instrument capability providers

domain / analysis skills
  literature review, HPLC/XRD/LC-MS/plate-reader analysis, etc.
```

这些能力可以由 SciCompass 默认安装或推荐安装，但它们不是 SciCompass 内部模块。它们应保持独立技能包、独立工具合同和独立 runtime 边界。

## 3. LabGraph 与数据连续性

LabGraph 保留为 SciCompass 体系中的抽象概念，含义是“实验室航海日志”：项目、实验、文献、证据、协议、运行、结果、审批、经验、负结果、公开知识之间的可追溯记忆网络。

LabGraph 不是一个独立模块、独立包或独立技能。它由多个独立技能包共同形成：

```text
LabOntology
  定义 LabGraph 能表达什么：
  types / relations / constraints / provenance rules

LabKAG
  持有知识侧图谱：
  literature / data / evidence / claims / results / graph retrieval

LabHarness
  持有过程侧记录：
  workflow / run / event / approval / audit / result flowback

SciGraph connector
  提供公共星图锚点：
  scigraph_anchor / novelty / conflict detection / public submission path

SciCompass
  只负责把这些能力安装、连接、解释给宿主和用户
```

数据连续性不应再被写死为单一 `~/.scicompass` 目录。v1.1 支持三种 profile：

```text
local profile
  SciCompass-managed data home
  suitable for desktop/local sidecar

shared lab profile
  shared LabKAG/LabHarness/LabOntology endpoints
  multiple hosts connect to same runtime

cloud profile
  remote workspace and managed skill runtimes
```

不变量：

- 记忆不在宿主，不在 LLM，而在技能包 runtime 和它们的持久化数据中。
- SciCompass 只维护连接配置、安装清单和用户可理解的“航海日志”视图。
- provenance URI 是跨包连续性的核心合同。
- LabGraph 可以被 UI 和罗盘人格引用，但不能被工程师误解为另一个 runtime。

## 4. 罗盘人格与技能编排

领航员 / 罗盘人格是 SciCompass 的第一交互界面。

载体：

```text
skills/scicompass/SKILL.md
/scicompass
/luopan
host prompt injection / skill loading
optional future always-on agent service
```

职责：

```text
Orient
  理解当前空间、项目、会话、目标、历史状态

Plan
  把科学家的意图拆成可调用的技能包流程

Route
  选择 LabKAG / LabHarness / LabOntology / SciGraph / device skills / analysis skills

Explain
  解释证据、规则、风险、审批、降级、下一步

Record
  把关键决策、logbook、provenance、下一步建议沉淀到合适的技能包
```

边界：

- 罗盘不直接实现文献检索、图谱检索、ontology 校验、workflow 执行或设备控制。
- 罗盘不绕过 LabHarness 执行 physical action。
- 罗盘不调用 `run_approve` 等人类审批动作。
- 罗盘不替科学家做最终科学判断。
- 罗盘可以建议下一步，但必须把草案交给相应技能包校验，并等待用户确认。
- 常驻智能体是长期目标；v1 基本形态仍是 skill + host agent loop。

SciCompass 的“智能感”来自宿主 LLM、罗盘 skill 和工具合同，不来自 SciCompass runtime 内置隐藏模型。

## 5. SciGraph 与外部服务边界

SciGraph 使用双重定位：工程上是独立外部服务，生态上是 SciCompass 的公共坐标系和实验验证知识回流目标。

### 5.1 工程关系

```text
SciGraph is external
  independent public scientific knowledge graph service
  exposed through MCP / HTTP / future API
  not bundled into scicompass distribution

SciCompass connects to SciGraph
  installs or configures SciGraph connector
  gives LabKAG and navigator access to public graph lookup
  supports anchor / novelty / conflict detection workflows

SciCompass does not own SciGraph runtime
  no local mirror by default
  no write credential in local desktop or ordinary host session
  public submission goes through a separate governed pipeline
```

### 5.2 生态关系

```text
SciGraph is the public coordinate system
  world star-map for literature-scale and public scientific knowledge

SciCompass network contributes experiment-verified knowledge
  public graph candidates come from approved LabGraph/OpenGraph outputs
  submission requires provenance, de-identification, review, and audit

SciGraph and SciCompass form a flywheel
  SciGraph gives coordinates and novelty context
  SciCompass gives private-to-public experiment-verified knowledge flow
```

工程师不能以为安装 SciCompass 就本地拥有 SciGraph；读者也不能把 SciGraph 看成普通第三方依赖。它是外部独立服务，也是 SciCompass 生态的公共星图。

## 6. 宿主关系与运行形态

SciCompass 是 host-neutral，但 SciWork 是 recommended host。

```text
Recommended host
  SciWork
  提供科学发现空间、项目/会话、右侧 Browser UI、sidecar 管理、装置状态摘要

Peer agent hosts
  Codex
  Claude Code
  Claude Desktop
  通过 MCP tools + SKILL 使用同一套能力

Headless / service hosts
  CLI
  HTTP MCP client
  lab server / cloud workspace
```

SciCompass 发行版对宿主做的事：

```text
init
  写入 MCP 配置
  安装 navigator skill
  安装/链接相关 skill package instructions
  配置 space template
  配置 local or remote runtime endpoints

serve
  启动本地 sidecar 或暴露 streamable HTTP
  管理 default runtime manifest
  不内置宿主 LLM

bundle
  生成适合 Claude Desktop / SciWork / 内网部署的包

doctor
  检查 skill package、MCP endpoint、Browser UI、runtime profile、SciGraph connector
```

运行形态：

```text
local desktop
  SciWork or local agent host + local sidecars

developer workstation
  Codex / Claude Code + MCP stdio tools

shared lab server
  remote LabKAG/LabHarness/LabOntology runtimes
  multiple hosts connect

cloud workspace
  future managed runtime profile
```

边界：

- Host 提供 LLM 和会话循环。
- SciCompass 提供安装、装配和技能入口。
- 独立技能包提供工具实现和持久化 runtime。
- Browser UI 由 LabKAG、LabHarness 等技能包自带；SciWork 是推荐承载者，不是唯一承载者。

## 7. 工程索引表

| Capability / Concept | Owner / Source of Truth |
|---|---|
| SciCompass distribution | `scicompass` CLI / manifests |
| Navigator persona | `skills/scicompass/SKILL.md` |
| Scientific semantics | LabOntology |
| Rules and constraints | LabOntology |
| Knowledge retrieval | LabKAG |
| Evidence graph / provenance | LabKAG + LabOntology |
| Workflow governance | LabHarness |
| Approval / audit execution | LabHarness |
| Device/instrument actions | Independent automation / robot / instrument skills |
| Public graph anchor | SciGraph connector |
| Public scientific graph runtime | SciGraph |
| Host UI / sessions | SciWork / Codex / Claude / CLI |
| Browser rich surfaces | LabKAG UI / LabHarness UI / skill package UIs |
| Model invocation | Host LLM / agent runtime |
| Runtime profile | SciCompass config + skill package endpoints |

## 8. 迁移路径

从旧 v1.0 七包与总体系描述迁移到新边界：

1. 保留 `scicompass` CLI 作为发行版装配器。
2. 将 LabOntology 描述为独立语义与规则技能包。
3. 将 LabKAG 描述为独立知识检索与证据图谱技能包。
4. 将 LabHarness 描述为独立 workflow-governance 技能包。
5. 将 LabGraph 改写为抽象系统记忆，而不是 package/runtime。
6. 将 SciWork 改写为推荐宿主壳，而不是 SciCompass 上级产品或唯一入口。
7. 将七包章节改写为 SciCompass 自身发行组件 + 默认集成能力。
8. 保留罗盘人格作为第一交互层。
9. 保留 SciGraph 作为外部公共坐标系和受治理的知识回流目标。

## 9. v1.1 非目标

v1.1 明确不做：

- 不把 LabKAG、LabHarness、LabOntology 重新合并进 SciCompass core。
- 不定义另一套 ontology/schema/rule language。
- 不让 SciCompass runtime 拥有内部 LLM provider。
- 不把 SciWork 写成唯一官方入口。
- 不把 SciGraph 打包成本地发行组件。
- 不把 LabGraph 写成新模块或新技能包。
- 不重复 LabKAG、LabHarness、LabOntology、SciWork UI 专门文档中的内部实现细节。

## 10. 验收标准

工程师读完本文后，应能清楚回答：

- `scicompass` 自身拥有哪部分代码和配置。
- 哪些能力委托给独立技能包。
- 数据和记忆在哪里持久化。
- 哪个进程调用 LLM。
- 宿主如何连接 SciCompass 发行版。
- Browser UI 从哪里来。
- LabGraph 如果不是 package，究竟是什么。
- SciGraph 做什么，由谁拥有，如何连接。
- SciWork 为什么是 recommended host，而不是唯一 host。
- 从旧 v1.0 设计迁移到新边界时，需要改写哪些章节。

## 11. 术语

| 术语 | 含义 |
|---|---|
| SciCompass | 科学罗盘发行版、领航员人格和科学技能包装配层 |
| scicompass CLI | 安装、组合、启动、检查和打包 SciCompass 发行版的命令行入口 |
| 罗盘人格 / Navigator | 用户感知到的 SciCompass 第一交互界面，负责引导、规划、路由、解释和记录 |
| LabGraph | 实验室航海日志的抽象概念，由多个技能包的数据和 provenance 共同形成，不是独立模块 |
| LabOntology | 科学语义、规则、约束和 provenance 的权威来源 |
| LabKAG | 知识检索、证据图谱、GraphRAG、文献/数据/结果知识层技能包 |
| LabHarness | Workflow、Run、审批、审计、装置/仪器调用治理技能包 |
| SciGraph | 独立公共科学知识图谱服务，SciCompass 生态的公共坐标系 |
| SciWork | 推荐宿主壳，提供科学发现空间、项目/会话、Browser UI 承载和 sidecar 管理 |
| Host | SciWork、Codex、Claude、CLI 等承载 LLM、会话和工具调用的环境 |
| Skill Package | 独立分发的科学能力单元，通常包含 MCP tools、SKILL.md、可选 Browser UI |
