# SciWork 登录与多空间前端集成 — 设计文档（spec）

- 日期：2026-06-13
- 主题：给整套系统加登录，登录后按账号进入其所属的科学发现空间
- 状态：待用户确认

## 1. 背景

后端 `scicompass` 的多空间网关已就绪并接入 Electron sidecar，但前端那一半还没做：

- ✅ 已有（后端）：4 个空间模板、4 个测试账号（[accounts.yaml](../../../scicompass/templates/accounts.yaml)）、账号校验（[accounts.ts](../../../scicompass/packages/cli/src/accounts.ts)）、多空间网关 `/api/login` `/api/spaces` `/api/call`（[spacesGateway.ts](../../../scicompass/packages/cli/src/spacesGateway.ts)）、`serve --http` 启动网关（[main.ts](../../../scicompass/packages/cli/src/main.ts):20）、sidecar 托管（[scicompassSidecar.ts](../../../electron/scicompassSidecar.ts):30）。
- ❌ 未做（前端）：无登录页；[scicompassClient.ts](../../../src/services/scicompassClient.ts) 不调用 `/api/login`、`/api/spaces`；[App.tsx](../../../src/App.tsx) 直接进 `demo/live` 工作台，用写死的 `demoSpace`。
- ⚠️ 回归：网关 `/api/call` 现在**强制要求 `space` 字段**（[spacesGateway.ts](../../../scicompass/packages/cli/src/spacesGateway.ts):99-101），而前端 `callTool` 不传（[scicompassClient.ts](../../../src/services/scicompassClient.ts):30），导致现有「live 工作台」对新网关会 `400 missing space`。

## 2. 目标与范围

### v1 范围内（In scope）— Tier 2「核心工作流全接」

1. **高大上登录页**：复用求是核 IP + 背景纹样，深色渐变 + 玻璃拟态。
2. **登录流程**：`POST /api/login` → 拿 `{account, spaceConfig}` → 进入该账号所属空间；前端 `AuthContext` + `localStorage` 持久化；登出。
3. **修回归**：`callTool` 自动注入当前 `space`。
4. **空间身份呈现**：登录后顶部展示空间名称 / 学科标签 / 强调色 + 当前团队 / 账号。
5. **数据面板接真实后端（按空间隔离）**：左侧项目栏（`project_list` / `project_create`）、装置（`device_list`）、文献（`literature_import` / `literature_search`）。
6. **核心工作流接真实后端（Tier 2，本期重点）**：中间「运行下一步」的 8 阶段工作流，把单一注入点 `runStage`（[runStage.ts:71](../../../src/workflow/runStage.ts)）从产出 mock 改为**调用真实 MCP 工具**，用户点步进。复用现有 `AgentThread` / `Composer` / `ContextPanel` UI。阶段↔工具映射见第 6.5 节。
7. **去掉 `demo/live` 切换**：登录后直接进好看的产品外壳（`Sidebar` + `SessionWorkspace`）；技术性 `SciCompassWorkbench` 降级为**次级「实时联调」入口**保留（不删，便于排错）。
8. **后端小改**：`SpaceMeta` 加 `accentColor`（`tagline` 复用已有 `domain`）；模板补该字段；`readTemplate` 透传。

### v1 范围外（Out of scope，明确延后）

- **自主智能体**：LLM（Claude/Codex）自主驱动 / 对话式推进 8 阶段 —— 需接智能体运行时，独立大特性，单独走 spec → plan。v1 是「用户点步进 + 真实工具」。
- **报告 / 下一轮建议的生成式产出**：这两阶段无单一对应工具，v1 用「读真实图谱 + 本地汇总」的朴素呈现（真实数据，非 LLM 生成）。
- 多团队 / 成员管理 UI。
- 机构 SSO、密码加盐哈希、令牌签发（demo 仍用明文本地账号）。
- 跨机共享后端 / 上云部署（见第 4 节「上云接缝」，v1 只预留不实现）。
- 装置物理对接（仍为模板登记 / 模拟运行，`queue-with-approval`）。

## 3. 域模型（确认）

```
自动化装置  ──1:1──  科学发现空间  ──1:N──  团队  ──1:N──  账号  ──1:N──  项目
```

| 空间 ID | 机构 · 装置 | 学科（domain） | 测试账号 / 团队 |
|---|---|---|---|
| `fudan-xtalpi` | 复旦化学系 · 晶泰科技自动化工作站 | 化学反应 | `chem.ma` / 麻生明课题组 |
| `zju-ichemfoundry` | 浙大科创中心 · iChemFoundry | 材料发现 | `mat.zju` / 材料智造团队 |
| `zju-ibiofoundry` | 浙大科创中心 · iBioFoundry | 合成生物 | `bio.zju` / 合成生物团队 |
| `zju-oasis` | 浙大智慧绿洲科创中心 · 绿洲一号 | 药物发现 | `pharma.oasis` / 绿洲药物团队 |

统一密码 `demo1234`。一账号 = 一团队 = 一空间。

## 4. 架构与「上云接缝」（关键决策：本地优先 + 预留接缝）

### 三层心智模型

1. **客户端 / UI**（Electron 桌面，每研究员一份）：只存 UI 状态、缓存、草稿、登录 session。**无权威数据**。
2. **空间/团队后端 = 网关 + 数据 + 鉴权**：v1 = localhost sidecar + 本地文件夹 + `AccountStore`（yaml 明文）。**这一层将来才是「云」**。
3. **实验室边缘 = 装置控制器**：物理近设备，v1 为模板登记 / 模拟。

### v1 要守住的接缝原则（只预留，不实现上云）

- **前端只走网关三接口**（`/api/login`、`/api/spaces`、`/api/call`），**绝不直接读本地文件**。← 新增登录代码同样只走 HTTP。
- **`AccountStore` 是唯一鉴权边界**，保持可替换接口（已是一个 class，无需新抽象层 —— YAGNI）。
- **客户端把登录响应当成「不透明 session」**：现在是 `{account, spaceConfig}`，将来加 `token` 只是加字段，不改流程。

### 上云路径（非 v1，仅记录）

触发条件出现任一即上云：① 一团队多人共享同一份数据；② 多设备访问；③ 真实安全 / 合规。届时：网关从 localhost 搬到服务器（机构语境下更可能是**校内 / 所内内网服务器**）、`AccountStore` → DB + 真鉴权、本地文件夹 → DB / 对象存储、前端只改 baseURL。**前端零重构。**

## 5. 登录流程（时序）

1. App 启动 → 读 `localStorage` session → 有效则直接进空间，否则显示登录页。
2. 登录页提交 → `POST /api/login {username, password}`。
3. 成功 → 返回 `{account, spaceConfig}` → 写入 `AuthContext` + 持久化 → 设置 client 当前 space → 进入空间外壳。
4. 失败 → `401` → 表单内联报错「账号或密码错误」。
5. 此后所有 `callTool` 自动带 `context.space`。
6. 登出 → 清 `AuthContext` + `localStorage` + client 当前 space → 回登录页。

## 6. 前端组件设计

> 技术方案 A1（客户端鉴权上下文，贴合现有无路由桌面壳）。

- **`AuthContext`**（`src/auth/AuthContext.tsx`）
  - state：`account`、`spaceConfig`、`space`、`status('anonymous'|'authed')`
  - actions：`login(username, password)`、`logout()`
  - 副作用：成功后 `localStorage` 持久化 + 调 `scicompassClient.setActiveSpace(space)`；启动时尝试恢复。
- **`scicompassClient`** 扩展（[scicompassClient.ts](../../../src/services/scicompassClient.ts)）
  - 新增 `login(username, password)`、`listSpaces()`。
  - 模块级 `activeSpace` + `setActiveSpace(space)`；`callTool` 自动把 `space` 并入 `/api/call` body（**修回归**）。无 space 时抛明确错误，避免静默 400。
- **`LoginPage`**（`src/components/LoginPage.tsx` + css）：见第 7 节视觉。
- **`App`** 门控（[App.tsx](../../../src/App.tsx)）：`status==='anonymous'` → `LoginPage`；`authed` → 空间外壳。
  - **登录后落进哪个外壳**：复用现有那套较完整的工作区 UI（`Sidebar` + `SessionWorkspace` 布局），**不是**技术性的 `SciCompassWorkbench` 面板。
  - **现有两个视图的去向**：去掉顶层 `demo/live` 切换；现有真实后端面板 `SciCompassWorkbench` 作为**次级「实时联调」入口**保留（不删，便于排错），不再是并列主视图。
- **空间外壳 Header**：空间名称 + 学科标签（`domain`）+ 强调色（`accentColor`）+ 团队名 + 账号 displayName + 登出按钮。
- **数据面板（真实后端，空间隔离）**：
  - 左侧项目栏 `Sidebar`：`project_list` 渲染列表、`project_create` 建项目；文献计数走 `literature_search`/`literature_import`。
  - 装置：`device_list`（展示该空间真实装置，强化「四套装置」叙事）。
- **核心工作流（真实后端）**：`runStage` 改为按阶段调用真实工具（见 §6.5）。`useWorkflowController`/`AgentThread`/`Composer`/`ContextPanel` 结构不变，只换 `runStage` 这一注入点 + artifact 形状适配。`report` / `next-suggestion` 用「读真实图谱 + 本地汇总」。

### 6.5 工作流阶段 ↔ 真实工具映射（Tier 2 核心）

`runStage(stageId)` 改写后每阶段调用的真实工具（均已在 `SciCompassWorkbench.runFullLoop` 验证可用，故风险低）：

| 阶段 `WorkflowStageId` | 真实工具 | artifact 产出 |
|---|---|---|
| `literature` | `literature_import` + `literature_search` | 命中文献列表 |
| `scigraph-analysis` | `graph_write`（Objective + Evidence）+ `graph_align_public` | 锚定结果 |
| `report` | `graph_query` + 本地汇总（**无单一工具**） | 朴素报告 |
| `protocol-design` | `protocol_save` | 协议 id/version |
| `labontology-check` | `ontology_check` | 校验结果 / 告警 |
| `simulation` | `run_submit` + `run_status` 轮询 | 运行事件时间线 |
| `experimental-graph` | `result_list` + `result_flowback` + `graph_promote` | 回流节点 / 组图胶囊 |
| `next-suggestion` | `graph_query` + 本地汇总（**无单一工具**） | 下一轮建议 |

实现要点：
- 真实工具的返回结构与现有 `WorkflowArtifacts`（[runStage.ts](../../../src/workflow/runStage.ts):21）字段不完全一致，需一层**适配映射**；缺字段以「—」占位，不编造。
- 每阶段需要项目上下文：登录后用 `project_create` / `project_list` 拿到真实 `projectId` 与 `graphSlug`，贯穿各阶段。
- 错误处理：任一工具失败 → 该阶段标记 `warning` 并在会话区显示后端 error 文本，不静默。

## 7. 登录页视觉（高大上）

- **布局**：全屏。左侧 / 背景 = IP 工作台视觉（`sciwork-ip-qiushi-core-v2-workbench.png`）+ 纹样（`patterns/paper-texture.svg`、`patterns/sidebar-graph.svg`）；右侧 = 玻璃拟态登录卡。
- **登录卡元素**：Logo（`sciwork-ip-qiushi-core-v2-icon.png`）、主标题「SciWork 科学发现工作站」、副标题、账号 / 密码输入、登录按钮、错误内联区。
- **可选**：卡片下方用 `/api/spaces` 渲染「四大空间」展示条（名称 + 学科 + 强调色点），强化「四套装置四个空间」的叙事。
- **主题**：深色渐变 + glassmorphism；全部复用现有 [themeAssets](../../../src/theme/assets.ts)，不新增美术资源。
- **强调色**：登录前用品牌主色；登录后 Header 切到该空间 `accentColor`。

## 8. 空间差异化（轻量，YAGNI）

统一 SciWork 外壳 + **每空间一个强调色 + 学科标签**，**不做四套完全不同的主题**。

- 后端：`SpaceMeta`（[deviceRegistry.ts:11](../../../scicompass/packages/labharness/src/deviceRegistry.ts):11）加 `accentColor?: string`；`readTemplate` 透传；4 个模板各补一个 hex。`tagline` 直接复用已有 `domain`。
- 前端：Header 用 `accentColor` 做强调色，展示 `domain`。
- 建议配色（待确认）：化学反应 `#2F6BFF`、材料发现 `#7A5CFF`、合成生物 `#15A86C`、药物发现 `#E0653A`。

## 9. 后端改动清单

1. [deviceRegistry.ts](../../../scicompass/packages/labharness/src/deviceRegistry.ts)：`SpaceMeta` 加 `accentColor?`；`readTemplate` 增加 `accentColor: tpl.accentColor`。
2. 4 个空间模板：各加一行 `accentColor: <hex>`。
3. `/api/login` 已回 `spaceConfig`（含 `SpaceMeta`，自动带出新字段），**无需新端点**。

## 10. 持久化与安全（v1 诚实声明）

- `localStorage` 仅存 `{account, space}`（**不含密码**，非敏感）；刷新 / 重启恢复登录态。
- 明文账号、本地校验仅供 demo；上云前必须替换为 DB + 哈希 / SSO（已在「范围外」+「接缝」中标注）。

## 11. 测试策略

- **前端**（vitest + testing-library，沿用 [App.test.tsx](../../../src/App.test.tsx) 模式）：
  - 登录成功 → 进入对应空间外壳；失败 → 显示错误。
  - `callTool` 注入 `space`（mock fetch，断言 body 含 `space`）。
  - 登出 → 回登录页、client `activeSpace` 清空。
  - `AuthContext` 从 `localStorage` 恢复。
  - **工作流接真实后端**（沿用 [runStage.test.ts](../../../src/workflow/runStage.test.ts) 若有，否则新建）：mock `sc.*`，断言每个阶段调用了映射表（§6.5）对应的工具、artifact 适配正确、工具失败时阶段标记 `warning`。
- **后端**（沿用 [spacesGateway.test.ts](../../../scicompass/packages/cli/src/spacesGateway.test.ts)）：
  - `/api/login` 返回的 `spaceConfig` 含 `accentColor`。
- 全量 `typecheck` 通过；现有 e2e 不破。

## 12. 后续项（明确延后）

自主智能体驱动（LLM 推进 8 阶段）、`report`/`next-suggestion` 的生成式产出、机构 SSO、密码哈希、多团队管理 UI、跨机共享后端 / 上云、装置物理对接。每项将来各自走 spec → plan。
