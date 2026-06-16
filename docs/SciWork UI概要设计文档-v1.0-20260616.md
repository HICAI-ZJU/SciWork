# SciWork UI 概要设计文档 v1.0

| 项 | 值 |
|---|---|
| 文档版本 | v1.0 |
| 日期 | 2026-06-16 |
| 状态 | 设计稿，待评审 |
| 承接 | `docs/LabKAG概要设计文档-v1.1-20260615.md`、`docs/LabHarness概要设计文档-v1.0-20260616.md`、`docs/LabOntology概要设计文档-v1.0-20260615.md` |

## 1. 定位与边界

SciWork UI 是一个轻量级 AI for Science 工作台框架。它不是 SciCompass、LabKAG、LabHarness、LabOntology 的内部 UI，也不是某一条固定科研流程的前端；它是这些科学技能包的推荐宿主壳。

SciWork 与 Codex、Claude、CLI 的关系应明确为同级宿主：同一套科学技能包应该能在 SciWork、Codex、Claude、CLI 中通过相同的工具和技能合同工作。SciWork 的优势不是独占能力，而是提供更适合科学发现场景的空间、项目、会话、装置状态、右侧可视化展示和本地 sidecar 管理体验。

SciWork 负责：

```text
登录与空间身份
空间 / 项目 / 会话工作台
统一 Composer
技能包激活与展示槽
本地 / 云端连接管理
基础状态摘要
右侧 Browser UI 嵌入
```

SciWork 不负责：

```text
LabKAG 内部图谱 / 检索实现
LabHarness 内部 workflow / governance 实现
LabOntology 语义与规则定义
SciCompass 后端工具实现
科学技能包的专属复杂 UI
```

核心原则：SciWork 是推荐 UI 集成框，不是科学技能包本身。

## 2. 设计决策记录

| # | 决策 | 选择 |
|---|---|---|
| DR-1 | 总体模型 | Codex-like 会话工作台 + 右侧技能展示槽 |
| DR-2 | 空间叙事 | 吸收四套自动化装置的强科学发现空间叙事 |
| DR-3 | 技能包心智 | 技能包是会话能力，不是左侧一级模块 |
| DR-4 | 右侧区域 | Active Skill Surface 为主，折叠式全量状态摘要为辅 |
| DR-5 | 技能注册 | 设计为半动态注册，v1 静态落地四个核心技能包 |
| DR-6 | 部署模型 | 本地优先，但通过 WorkspaceConnection 预留云端接缝 |
| DR-7 | 文档范围 | 概要设计 + v1 组件规格，不深入到 props 和测试用例级别 |

明确避免的方向：不要把 SciWork 做成多模块控制台或 dashboard 平台；不要把 LabKAG、LabHarness 的复杂专属 UI 内化到 SciWork renderer；不要为四个空间做四套完全不同的主 UI。

## 3. 信息架构与四空间叙事

SciWork 的一级产品叙事是四个科学发现空间。每个空间对应一套真实或准真实的自动化科学装置：

```text
复旦大学 · 晶泰科技自动化合成装置
  -> 化学反应发现空间

浙大科创中心 · iBioFoundry
  -> 合成生物发现空间

浙大科创中心 · iChemFoundry
  -> MOF / 材料设计发现空间

浙大智慧绿洲 · 绿洲一号
  -> 药物发现空间
```

产品层级固定为：

```text
Automation Platform / Scientific Discovery Space
  -> User / Team
    -> Project
      -> Session
        -> Scientific Skill Capabilities
```

用户登录后只进入自己所属的科学发现空间。空间决定默认装置、默认学科语境、默认 workflow template、默认可用技能组合和视觉强调色。空间不是一个可随意切换的 tab，而是账号归属和数据隔离边界。

进入空间后，左侧保持 Codex/Claude-like 的稳定结构：

```text
空间身份
项目列表
会话列表
轻量资源入口
```

技能包不作为左侧一级导航。SciCompass、LabKAG、LabHarness、LabOntology 是当前会话可调用的能力，通过 Composer、slash command、右侧展示槽和状态摘要出现。

四空间叙事要强，但不能变成四套 UI。统一壳不变，差异体现在：

```text
登录页主题图与空间卡片
顶部空间身份
左侧空间标识
项目 / 会话默认模板
右侧装置 / 审批 / 风险摘要
默认技能包组合
空间强调色
```

## 4. 主界面布局与交互模型

SciWork 主界面保持 Codex/Claude-like 三栏结构，并用科学空间语境增强：

```text
顶部：当前科学发现空间 / 团队 / 账号 / 本地或云端连接状态

左侧：空间身份 + 项目 + 会话
中间：Agent Thread + Composer
右侧：Status Summary + Active Skill Surface
```

左侧是稳定导航，不承载技能包业务深层对象。它只回答“我在哪个空间、哪个项目、哪个会话”。项目和会话是用户组织科研工作的基本单位。

中间是唯一主交互入口。用户通过 Composer 发起自然语言任务、slash command、附件、约束、确认和审批意图。Composer 需要接近 Codex/Claude 的习惯：输入框、模型/运行环境状态、附件、slash palette、发送/执行按钮。

科学技能包作为会话能力出现，例如：

```text
/scicompass
/labkag
/labharness
/labontology
/retrieve
/run
/validate
```

右侧分两层：

```text
上层：Status Summary
  项目/会话、技能运行、装置治理、知识资产的紧凑摘要
  默认折叠，可展开

主体：Active Skill Surface
  当前技能包展示面
  可以是 SciWork 原生轻量面板
  也可以是 LabKAG / LabHarness 等 Browser UI 嵌入
```

核心交互原则：

```text
动作从中间 Composer 发起
复杂展示在右侧 Skill Surface
左侧只负责切换项目/会话
顶部只负责身份和连接状态
```

右侧允许轻交互，例如筛选图谱、查看证据、展开审批详情、打开运行事件；但高影响动作仍应回到 Composer 或明确确认流程，避免形成两套主命令入口。

## 5. 技能包集成与半动态注册

SciWork 应把科学能力建模为会话可用技能包，而不是内置模块。设计上采用半动态注册，v1 先落地为静态四技能切片。

每个技能包在 SciWork 里被描述为一个 `SkillPackageRegistration`，包含：

```text
id
name
description
slashCommands
toolNamespaces
defaultSurface
browserUiUrl 可选
statusProvider 可选
requiredSpaceCapabilities 可选
```

v1 静态注册：

```text
SciCompass
  综合科学流程与工具编排

LabKAG
  知识检索、证据子图、文献/数据/图谱展示

LabHarness
  实验 workflow、装置、审批、运行、回流

LabOntology
  语义、规则、约束、校验、provenance
```

长期由本地配置或云端工作区配置提供注册信息。新增技能包时，不需要重写 SciWork 主 UI，只需要提供工具合同、slash command、展示面和状态摘要。

集成边界：

```text
Renderer
  -> 只消费 SciWork host facade
  -> 不 import LabKAG / LabHarness 内部包

Electron main / Gateway
  -> 管理 local sidecar 或 remote endpoint
  -> 作为 MCP client 调用技能包
  -> 提供 Browser UI URL
  -> 聚合技能状态

Skill Packages
  -> MCP tools
  -> SKILL.md
  -> optional Browser UI
```

`Composer` 根据当前会话可用技能生成 slash palette。`Active Skill Surface` 根据当前激活技能展示对应 UI：如果技能包有 Browser UI，优先嵌入；如果没有，则使用 SciWork 原生轻量面板或文本结果。

v1 不做技能市场、安装卸载、版本管理、权限市场。只保留注册形状，为后续动态化留缝。

## 6. 本地优先与云端扩展接缝

SciWork v1 继续按本地优先设计：Electron 桌面应用启动本地 sidecar，连接本机 SciCompass / LabKAG / LabHarness / LabOntology 运行时，数据默认落在本地工作区或用户数据目录。

但 UI 不能把“本地”写死成产品结构。SciWork 应把运行环境抽象为 `WorkspaceConnection`：

```text
local-sidecar
remote-endpoint
cloud-workspace
offline/degraded
```

主 UI 只展示一个低调连接状态，例如：

```text
Local sidecar · healthy
Remote workspace · connected
Cloud workspace · degraded
Offline · read-only
```

前端调用统一走 host facade，而不是直接关心 localhost 端口：

```text
auth.login
spaces.current
projects.list/create
sessions.list/create
skills.list
skills.callTool
skills.getSurface
status.summary
```

v1 可以继续由 Electron main 注入本地 gateway base URL；未来迁移云端时，只替换连接配置、鉴权、数据存储和远端 runtime，不改变空间/项目/会话/技能包信息架构。

云端预留点：

```text
账号 token / SSO
远端科学发现空间
远端项目和会话
远端 skill runtime
远端 Browser UI surface
团队共享数据
权限和审计
```

本地优先不是临时 demo，而是 SciWork 的一个正式 deployment mode。云端只是另一种 connection profile。这样 SciWork 可以同时支持个人科研工作台、实验室内网部署和未来云服务。

## 7. 视觉方向与登录页

SciWork 的视觉目标是：科研版 Codex/Claude 工作台 + 浙大蓝/求是红 + AI for Science 科技感。它应该适合长期工作，不做大屏、官网或装饰性 dashboard。

主工作台：

```text
左侧：深浙大蓝，承载空间/项目/会话
中间：浅色纸面工作区，承载会话和 Composer
右侧：浅色或轻深色混合展示面，承载技能 UI 与状态摘要
动作色：求是红，用于执行、审批、风险、关键确认
辅助色：青绿/科技蓝，用于图谱、运行状态、AI for Science 线条
```

登录页是最适合强化四空间叙事和 AI for Science 主题的地方。建议使用 `assets/themes/` 下主题图自动轮换，背景图应优先选择包含这些元素的主题：

```text
知识图谱
科学文献/数据
实验仪器
实验机器人
求是大讲堂或浙大意象
蓝红主色
```

登录页重点不是普通账号系统，而是“进入科学发现空间”。可显示：

```text
SciWork 科学发现工作台
四套自动化装置 / 四个科学发现空间
当前可用空间展示
账号密码入口
本地/云端连接状态
```

当前实现里 `themeAssets.loginBackgrounds` 引用了已缺失的 `ig_*.png`。后续实现应改为使用现有 `sciwork-kg-integration-*` 和 `sciwork-theme-zju-ai-science-robot-kg-*` 主题图，并允许后续按目录自动发现或配置。

主界面不建议大量使用背景图。主题图只适合登录页、空态、轻水印或空间身份区。工作台内应把注意力留给会话、技能展示面和实验状态。

## 8. v1 组件规格

v1 组件结构围绕“通用工作台壳 + 会话能力 + 右侧技能展示槽”重组。

```text
AppShell
  LoginPage
  SpaceHeader
  Sidebar
  SessionWorkspace
    AgentThread
    Composer
    RightWorkspace
      StatusSummary
      ActiveSkillSurface
```

### LoginPage

负责账号登录、连接状态提示、四空间叙事和主题图轮换。它不只是表单，而是用户进入科学发现空间的入口。

### SpaceHeader

显示当前科学发现空间、团队/账号、本地或云端连接状态、退出入口。未来可加入 workspace connection selector，但 v1 只需状态可见。

### Sidebar

固定为空间身份、项目、会话。技能包不作为一级导航。可以显示“当前会话已启用技能”的轻量摘要，但不要展开技能业务对象。

### SessionWorkspace

当前项目/会话的主工作区。负责把会话线程、Composer、右侧工作区组合起来。切换会话时恢复或重置该会话的上下文。

### AgentThread

展示用户意图、助手回应、工具调用摘要、关键产物、确认请求和错误/降级提示。它应接近 Codex/Claude 的对话工作流，而不是固定八阶段报告页。

### Composer

唯一主输入入口。支持自然语言、slash command、附件、执行环境/模型状态、审批确认。slash palette 来自当前会话可用技能注册，而不是硬编码命令。

### RightWorkspace

替代当前固定 `RightPanel` 的更通用容器。上部是 `StatusSummary`，下部是 `ActiveSkillSurface`。

### StatusSummary

以折叠摘要方式展示全部关键状态：

```text
项目/会话
技能运行
装置/审批/风险
知识资产
连接/降级
```

默认紧凑，展开后显示细节。

### ActiveSkillSurface

当前激活技能包的展示面。优先承载 Browser UI；没有 Browser UI 时使用原生轻量面板。v1 可先支持：

```text
Default Context
SciCompass Workflow
LabKAG Knowledge
LabHarness Execution
LabOntology Validation
```

## 9. v1 范围

v1 范围控制在“把现有 SciWork UI 从固定 SciCompass 工作流 UI，整理成可承载科学技能包的推荐工作台壳”。

v1 包含：

```text
四空间登录页与主题图轮换
强空间身份的顶部与左栏
项目 / 会话结构
会话能力式技能入口
半动态注册的数据结构，静态四技能落地
Composer slash palette 从注册信息生成
RightWorkspace = StatusSummary + ActiveSkillSurface
本地 sidecar / 未来 remote endpoint 的连接抽象
现有文献/图谱/结果/产物面板迁移为 Default/SciCompass 原生 surface
```

## 10. v1 非目标

v1 明确不做：

```text
完整技能市场
技能安装/卸载/版本管理
复杂权限后台
完整云端协作
四套完全不同的 UI 主题
LabKAG/LabHarness 专属复杂 UI 重写
自主智能体运行时
物理装置真实控制
```

## 11. 当前实现迁移路径

### 1. 抽象 host shell

保留现有 `App / SpaceHeader / Sidebar / SessionWorkspace`，把 SciCompass 特定逻辑从壳里下沉到会话能力和 skill surface。

### 2. 引入 SkillRegistry

先静态注册 SciCompass、LabKAG、LabHarness、LabOntology。Composer slash palette、右侧 surface、状态摘要都从注册信息派生。

### 3. 重构右侧

当前 `RightPanel` 改为 `RightWorkspace`。保留已有文献/图谱/结果/产物能力，但作为 SciCompass/Default surface，而不是固定产品结构。

### 4. 引入 WorkspaceConnection

把当前 base URL / sidecar 注入整理成连接 profile：local sidecar、remote endpoint、cloud workspace、degraded。UI 只消费连接状态和 host facade。

## 12. 验收标准

```text
用户能清楚感知自己属于哪个科学发现空间
主界面像 Codex/Claude，而不是 dashboard
技能包是会话能力，不是左侧模块
右侧可以承载不同技能展示面
四个科学技能包可以静态出现，未来可动态注册
本地运行不影响未来云端迁移
登录页使用 assets/themes 主题图轮换
视觉保持浙大蓝 + 求是红 + AI for Science
```
