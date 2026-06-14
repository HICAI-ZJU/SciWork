# SciWork 其余面板接真实后端 + 生成式产出 — 设计文档（spec）

- 日期：2026-06-14
- 主题：option 1（文献/图谱/结果/产物面板接真实后端）+ option 2（report/下一轮建议接 LLM 生成式产出）
- 状态：待用户复核
- 前置：登录 + 多空间 + 8 阶段工作流接真实后端已完成（见 [2026-06-13 spec](2026-06-13-sciwork-login-multispace-design.md)）

## 1. 背景

登录后目前只有「项目列表 + 8 阶段工作流」接了真实后端。本期补两块：
- **option 1**：文献/图谱/结果/产物面板仍是占位，逐个接真实后端（工具齐全，纯前端）。
- **option 2**：工作流 `report` / `next-suggestion` 两阶段现为"读图谱+确定性摘要"，改为接 LLM 生成式产出。后端目前**无 LLM 基建**，需新加，且 provider 可配置 + 无 key 回退。

## 2. 目标与范围

### v1 范围内

**Part 1 — 面板接真实（先做，低风险）**
1. 右栏 `ContextPanel` 改为**标签式右面板**：`上下文`（保留）/ `文献` / `图谱` / `结果` / `产物`。
2. 各标签按当前项目拉真实数据，含加载/空/错三态。
3. 侧栏文献计数变真实。

**Part 2 — 生成式产出（后做）**
4. scicompass 新增 MCP 工具 `insight_generate`：provider 可配置（Anthropic / OpenAI 兼容）+ **无 key 回退**到确定性摘要。
5. `runStage` 的 `scigraph-analysis`(产 report) 与 `experimental-graph`(产 suggestions) 改调 `insight_generate`；UI 标注「AI 生成 / 摘要回退」。

### v1 范围外（延后）

- 面板的写操作扩展（如 UI 内编辑图谱/协议）；本期面板**只读 + 文献导入**这一个写入。
- 自主智能体驱动整条工作流（独立大特性）。
- 机构 SSO / 密码哈希 / 上云（仍按既有接缝延后）。
- LLM 流式输出到 UI（v1 一次性返回即可）。

## 3. Part 1 — 面板接真实后端

### 3.1 呈现：标签式右面板

把现右栏从单一 `ContextPanel` 改为 `RightPanel`（标签容器），标签与数据源：

| 标签 | 组件 | 数据源（现有工具） | 交互 |
|---|---|---|---|
| 上下文 | 复用现 `ContextPanel` | 工作流 artifacts（不变） | 只读 |
| 文献 | `LiteraturePanel` | `literature_search`（列出）+ `literature_import`（导入）+ `literature_get`（详情） | 只读 + 导入 |
| 图谱 | `GraphPanel` | `graph_query`（项目图 节点/边/胶囊），复用 `GraphView` | 只读 |
| 结果 | `ResultsPanel` | `result_list`（按 projectId） | 只读 |
| 产物 | `ArtifactsPanel` | `artifact_list`（按 projectId） | 只读 |

> **文献列出**：现有工具无 `literature_list`，先用 `literature_search`（以项目目标/宽查询）列出；若需"列全部"，新增一个轻量 `literature_list` 后端工具（小改动，届时定）。

### 3.2 架构

- **薄数据 hooks**（`src/hooks/`）：`useProjectLiterature` / `useProjectGraph` / `useProjectResults` / `useProjectArtifacts`，各自 `useEffect` 按 `activeProject`(id+graphSlug) 调 `sc.*`，返回 `{ data, loading, error, reload }`。一职责、可独立测试。
- **面板组件**（`src/components/panels/`）：上述 4 个 + `RightPanel.tsx`（标签容器，管理 activeTab）。
- **客户端**：复用现有 `sc.*`（必要时补 `resultList`/`artifactList` 的便捷方法签名）。前端只走网关、按空间隔离天然成立。
- 切换项目时各 hook 依赖 `activeProject` 重新拉取；无项目时面板显示空态。

## 4. Part 2 — 生成式产出（insight_generate）

### 4.1 在网关层拦截 `insight_generate`（不进 scicompass MCP 核心）

> **架构约束**：scicompass MCP 核心明确"永不调用 LLM"（[serve.ts:16](../../../scicompass/packages/cli/src/serve.ts):16）。因此 LLM 生成**不**作为 MCP 工具注册进核心，而是放在 SciWork 应用层网关 `spacesGateway` 拦截处理，核心保持零 LLM。

- **位置**：`spacesGateway` 的 `/api/call` 在转发前**拦截** `name === 'insight_generate'`，交由 LLM 适配器处理（其余工具仍透传给 MCP client）。
- **入参**：`{ space, name:'insight_generate', arguments:{ kind:'report'|'suggestion', graph, constraint? } }`。
- **上下文自取**：网关用该空间的 MCP client 调 `graph_query(graph)` 读真实项目图作为生成上下文，**不依赖前端传入**（少耦合）。
- **出参**：`{ generated: boolean, text: string, items?: string[] }`（`report` 用 `text`+要点；`suggestion` 用 `items`），经 `/api/call` 的 `{ok,data}` 返回。

### 4.2 LLM 适配模块（provider 可配置 + 无 key 回退）

隔离在 `scicompass/packages/cli/src/llm/insightProvider.ts`：

- 读 env：`SCICOMPASS_LLM_PROVIDER`（`anthropic` | `openai-compatible` | `none`，缺省 `none`）、`SCICOMPASS_LLM_BASE_URL`、`SCICOMPASS_LLM_MODEL`、`SCICOMPASS_LLM_API_KEY`。
- **anthropic 后端**：用 `@anthropic-ai/sdk`，默认模型 `claude-opus-4-8`，`thinking: { type: 'adaptive' }`，单次 `messages.create`（摘要/分析属单次调用，无需工具/流式）。
- **openai-compatible 后端**：`fetch` 到 `${BASE_URL}/chat/completions`（适配火山方舟/豆包、ZJU 内网、OpenAI）。**与 Anthropic 路径分离**，不混用 SDK。
- **无 key 回退**：`provider==='none'` 或缺 key/缺 BASE_URL → 不调 LLM，返回当前"读图谱 + 确定性摘要"，`generated:false`。有 key → 真实生成，`generated:true`。
- key 只在 sidecar 进程 env，不入前端、不入 git。

### 4.3 前端接线

- `runStage` 的两阶段改调 `sc.callTool('insight_generate', ...)`：
  - `scigraph-analysis` → `kind:'report'` → 填 `report.designRationale`/`candidateDirections`（generated 时用 LLM 文本，否则保留现摘要）。
  - `experimental-graph` → `kind:'suggestion'` → 填 `suggestions`。
- UI 在报告/建议块标注来源徽标：`AI 生成`（generated:true）或 `摘要回退`（false）。

## 5. 架构与接缝（不变的原则）

- 前端只走网关 `callTool`；新增的 `insight_generate` 同样是一个工具，前端无感知 provider。
- LLM 调用全部隔离在后端 `insightProvider`；将来换 provider/上云只动这一个模块 + env。
- 与既有「本地优先 + 上云接缝」一致：无 key 时系统完全可用（回退），不阻塞。

## 6. 测试策略

- **前端**（vitest + testing-library）：
  - 4 个面板 hooks：mock `sc.*`，断言按 projectId 拉取、loading/empty/error 态。
  - `RightPanel` 标签切换渲染对应面板。
  - `runStage` 两阶段：mock `sc.callTool('insight_generate')` 返回 `generated:true/false`，断言 artifact 填充与徽标。
- **后端**（scicompass vitest）：
  - `insight_generate` 无 key → `generated:false` + 确定性摘要（不打真实 API）。
  - 有 key → 注入 mock LLM 客户端（不打真实 API），断言 `generated:true` 且调用了对应 provider 适配。
- 全量 `typecheck` + 现有测试不破。

## 7. 费用与安全

- 仅当配置了真实 key 且 `generated:true` 才产生 LLM API 费用；默认 `provider=none` 零费用、纯回退。
- key 仅在 sidecar env；不写入前端代码、不提交 git；文档示例用占位。

## 8. 后续项（延后）

面板写操作、LLM 流式到 UI、自主智能体、其余安全/上云项。各自将来走 spec → plan。
