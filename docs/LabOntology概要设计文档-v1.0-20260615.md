# LabOntology 概要设计文档 v1.0

| 项 | 值 |
|---|---|
| 文档版本 | v1.0 |
| 日期 | 2026-06-15 |
| 状态 | 设计稿，待评审 |
| 承接 | `docs/LabKAG概要设计文档-v1.1-20260615.md` |

## 1. 定位与边界

LabOntology 是一个面向通用科学实验活动的开放本体技能包，不是 SciWork、LabKAG 或 LabHarness 的私有 schema。它的目标是用轻量、可演化、可机器校验的方式描述科学实验中的核心对象、关系和约束，让不同实验系统能够共享一套基础语义。

LabOntology 在 SciWork 体系中的首批消费者有两个：

- **LabKAG**：把文献、实验数据、结果、证据、结论等写入知识图谱和检索系统时，使用 LabOntology 作为总 schema。
- **LabHarness**：在协议、设备、机器人、运行、审批、审计、追溯等实验过程控制中，使用 LabOntology 作为过程约束 schema。

但这个关系不是绑定关系。LabOntology 应该可以被其他科研工作台、自动化实验平台、数据管理系统、机器人调度系统独立采用。

v1 设计红线：

- 轻量优先，基础形态是 JSON 文件 + SKILL。
- 不追求完整世界本体，只定义最小实验主干。
- 不把 SciWork 专属字段放入 core ontology。
- 不让 LLM 直接修改公共本体，只允许生成 proposal。
- MCP runtime 可选，不是使用 LabOntology 的前置条件。

## 2. 设计决策记录

| # | 决策 | 选择 | 理由 |
|---|---|---|---|
| DR-1 | 基础定位 | 独立开放本体技能包 | 避免成为 SciWork 或 LabKAG/LabHarness 的私有 schema，便于外部科学实验系统复用 |
| DR-2 | v1 范围 | 最小双骨架 | 同时覆盖知识侧和实验过程侧，但只保留通用科学实验主干 |
| DR-3 | 扩展模型 | core + domain extension + local profile | 保持公共核心稳定，同时允许学科扩展和本地实验室约束 |
| DR-4 | 交付形态 | JSON/SKILL 基础包 + 可选 MCP runtime | 最轻用户可直接读 JSON，复杂宿主可通过工具统一校验 |
| DR-5 | 演化治理 | 分级 LLM-assisted growth | core 最严，domain 次严，profile 最灵活；LLM 只提 proposal，不直接改公共发布物 |
| DR-6 | 关系建模 | knowledge / process / provenance 三组关系 | LabKAG 和 LabHarness 可各自消费清晰边界，共用 provenance |
| DR-7 | 类分组 | scientific / operational / governance 三组类 | 面向科学实验系统直接可读，避免过早落入抽象本体术语 |
| DR-8 | runtime 范围 | 极简、按需实现 | 第一阶段只做真实消费者需要的读取和校验，不预先实现完整治理工具链 |

## 3. 包形态与文件结构

LabOntology v1 采用“开放数据包 + 技能说明 + 可选 MCP runtime”的两层交付。

基础包建议结构：

```text
labontology/
  ontology/
    core.json
    domains/
      chemistry.json
      materials.json
      biology.json
      robotics.json
    profiles/
      profile.schema.json
      examples/
        wetlab-basic.profile.json
        robotic-lab.profile.json
  skills/
    labontology/SKILL.md
  proposals/
    proposal.schema.json
    examples/
      add-electrochemistry-types.proposal.json
```

可选 runtime：

```text
packages/
  labontology-runtime/
    ontology_get
    ontology_validate
```

语义分层：

- `core.json`：所有科学实验通用的最小主干。
- `domains/*.json`：领域扩展，只扩展 core，不改写 core。
- `profiles/*.json`：本地实验室、机构或平台约束，只允许收窄、别名、默认值、参数范围、禁用项。
- `proposals/*.json`：LLM 或人工提出的变更草案，供 review 后合并。

这保证最简单情况下一个 `core.json` 就能用；复杂系统可以加载 domain + profile，并通过可选 runtime 统一校验。

## 4. core.json 最小骨架

`core.json` 不做大而全的学科本体，只定义科学实验都绕不开的三类对象、三类关系和少量硬约束。

### 4.1 核心类

```text
scientific_classes
  Source
  Literature
  Dataset
  Material
  Sample
  Variable
  Observation
  Evidence
  Claim
  Result

operational_classes
  Protocol
  Step
  Device
  Robot
  Instrument
  Operation
  Run
  Parameter
  Environment

governance_classes
  Constraint
  SafetyRule
  Approval
  AuditEvent
  Permission
  Risk
  Provenance
```

### 4.2 核心关系

```text
knowledge_relations
  cites
  supports
  refutes
  derived_from
  measures
  describes
  has_evidence

process_relations
  has_step
  uses_material
  uses_device
  uses_robot
  executes_operation
  has_parameter
  produces_result
  requires_approval

provenance_relations
  generated_by
  observed_in
  recorded_in
  attributed_to
  version_of
  imported_from
```

### 4.3 v1 硬约束

- 所有 `Evidence`、`Result`、`Observation`、`Claim` 必须有 provenance。
- `Run` 必须指向 `Protocol`，可选指向 `Device`、`Robot` 或 `Instrument`。
- `Result` 必须由 `Run`、`Observation` 或 `Dataset` 之一产生或支撑。
- `SafetyRule`、`Approval`、`AuditEvent` 属于 governance，不混入知识关系。
- domain extension 可以新增类型和关系，但不能重定义 core 类型含义。

## 5. 与 LabKAG / LabHarness 的关系

LabOntology 是上游公共语义层，LabKAG 和 LabHarness 都依赖它，但不拥有它。

### 5.1 LabKAG 使用方式

- 加载 `core.json + domain + profile`。
- 用 `scientific_classes` 和 `knowledge_relations` 约束文献、数据、证据、结论、结果写图。
- 用 `provenance_relations` 保证所有证据链可追溯。
- 用 ontology 中的类型、关系、路径、权重指导 GraphRAG 检索。
- 不把 LabKAG 私有字段写回 core，只能通过 domain、profile 或 proposal 扩展。

### 5.2 LabHarness 使用方式

- 加载同一套 `core.json + domain + profile`。
- 用 `operational_classes` 和 `process_relations` 约束协议、步骤、设备、机器人、运行状态。
- 用 `governance_classes` 约束审批、安全、审计、权限、风险。
- 用 profile 表达本地设备能力、参数范围、安全红线和审批策略。
- 运行期控制逻辑属于 LabHarness，LabOntology 只声明对象、关系和约束，不直接执行动作。

### 5.3 共同规则

- 两者都必须尊重 provenance。
- 两者都不能修改 core 语义。
- 两者可以各自维护 adapter，把内部模型映射到 LabOntology 类型。
- 当发现 ontology 不够用时，走 proposal，而不是直接私改公共本体。

## 6. 演化与治理

LabOntology 采用分级演化，不追求一次设计完整，而是从最小 core 开始，靠真实实验系统使用反馈逐步长大。

### 6.1 分层治理

```text
core
  最严格。只收科学实验通用概念。
  变更必须人工设计、评审、批准。
  保持长期兼容，避免频繁破坏性调整。

domain extension
  中等严格。面向 chemistry / materials / biology / robotics 等领域。
  可以由 LLM 根据文献、设备说明、实验记录提出 proposal。
  发布前必须人工 review，确认没有污染 core 或引入领域私货。

local profile
  最灵活。面向具体实验室、机构、设备平台。
  可以半自动生成，比如从设备说明书、SOP、历史 run log 中抽取参数范围和安全约束。
  必须支持 validate、diff、rollback，并由本地 owner 批准启用。
```

### 6.2 LLM 的角色

- 可以分析文献、数据、设备说明、历史实验记录。
- 可以生成 ontology proposal。
- 可以解释 diff 和影响范围。
- 可以辅助生成 local profile。
- 不能直接修改已发布的 `core.json` 或 domain release。

### 6.3 版本规则

- core 使用语义版本，例如 `core@1.0.0`。
- domain extension 声明兼容的 core 版本范围。
- profile 声明依赖的 core/domain 版本。
- 破坏性变更必须走 major version，并保留迁移说明。

## 7. 可选 runtime 与按需工具面

LabOntology 的第一等交付物始终是 JSON 文件和 SKILL。MCP runtime 只是可选执行层，第一阶段不追求工具完整，只在真实消费者需要时实现最小闭环。

v1 最小 runtime 原则：

- 只实现被 LabKAG / LabHarness 当前集成真正需要的工具。
- 没有明确调用场景的能力只写入候选能力，不实现。
- 工具保持薄封装，核心逻辑仍围绕 JSON schema、merge、validate。
- 不做 UI、不做治理平台、不做自动发布、不做复杂 proposal 工作流。

第一阶段建议实现：

```text
ontology_get
  返回 core + domain + profile 的解析结果。
  支持最少过滤即可，甚至可以先只返回整体。

ontology_validate
  校验对象、关系、图写入或协议片段是否符合当前 ontology。
  先覆盖 LabKAG 写图和 LabHarness 协议/运行校验所需场景。
```

候选能力，未有真实需求前不实现：

```text
ontology_diff
ontology_propose
ontology_migrate
ontology_explain
```

`ontology_propose` 在概要设计中保留为演化机制的一部分，但 v1 不主动实现。早期可以用文件级 proposal schema + 人工 review 替代工具。

## 8. v1 明确不做

- 不做完整科学世界本体。
- 不做 SciWork 专用 schema。
- 不做复杂 ontology editor 或治理 UI。
- 不做自动合并 LLM proposal。
- 不做图数据库或知识库本身。
- 不直接控制设备、机器人或实验运行。
- 不替代 LabKAG / LabHarness 的业务逻辑。
- 不实现没有当前消费者需求的 MCP tools。
- 不引入 RDF/OWL/SPARQL 作为第一阶段必要依赖。
- 不追求跨所有学科的完备 domain packs，先有少量示例扩展即可。

## 9. 术语

| 术语 | 含义 |
|---|---|
| LabOntology | 面向通用科学实验活动的开放本体技能包 |
| core ontology | 所有科学实验共享的最小本体主干 |
| domain extension | 面向具体学科或技术域的扩展包 |
| local profile | 实验室、机构或平台的本地约束覆盖 |
| scientific classes | 文献、数据、材料、观测、证据、结论、结果等科学对象 |
| operational classes | 协议、步骤、设备、机器人、运行、参数、环境等操作对象 |
| governance classes | 约束、安全、审批、审计、权限、风险、溯源等治理对象 |
| knowledge relations | 面向知识图谱和检索的关系 |
| process relations | 面向实验过程控制的关系 |
| provenance relations | 面向来源、生成、记录、归因、版本的关系 |
| proposal | 对公共 ontology 的变更草案，由 LLM 或人工生成，需评审后合并 |
