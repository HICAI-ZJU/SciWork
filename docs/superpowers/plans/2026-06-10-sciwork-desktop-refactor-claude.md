# SciWork Desktop 重构设计记录（Claude）

日期：2026-06-10
对应规格：`docs/superpowers/specs/2026-06-10-sciwork-desktop-minimal-zju-ai-workbench.md`

## 背景

上一轮实现已完成规格的表层要求（中文化、隐藏菜单、三栏、浙大配色），但代码层面存在
死代码、状态管理反模式和追加式 CSS。本轮在不改变演示链路和可见行为的前提下做结构性重构。

## 诊断

1. 六个组件无任何引用：`CenterStage`、`CommandBar`、`EvidencePanel`、`AssetRail`、
   `TopBar`、`CharacterCue` —— 全部删除。
2. `useWorkflowController` 用 8 个 ref 镜像 8 个 state，外加手写 `resetWorkflowState`
   和 effect 监听 props 重置（会先渲染一帧旧状态）。
3. `themeRegistry` 注册 6 套主题并提供运行时切换 API，但 UI 从未暴露；
   3 个角色槽位只有 1 个被使用。
4. `App.css` 有死选择器与重复冲突定义（`.sidebar__session` 定义两次）。
5. 建议区块把第一条建议文案硬编码为区块标题，语义错误。
6. `tsconfig` 用 `ignoreDeprecations: "6.0"` 压制 TS6 警告，而不是改用 `Bundler` 解析。

## 重构方案

### 工作流核心

- 新增 `src/workflow/runStage.ts`：纯函数演示脚本。每个阶段
  `(input) => { artifacts 补丁, message }`，前置产物缺失时抛错而不是静默跳过。
- 重写 `src/hooks/useWorkflowController.ts`：单一状态对象
  `{ stageState, artifacts, message }` + 单个快照 ref + 单个运行锁 ref。
  不再有 reset 逻辑。
- 新增 `src/components/SessionWorkspace.tsx`：中栏 + 右栏整体按
  `${projectId}/${sessionId}` 加 key。切换/新建会话 = 组件重挂载 = 工作流状态归零，
  状态生命周期由结构表达，而非 effect。
- Hook 公开 API 改为 `{ stageState, artifacts, message, isRunning, canAdvance,
  runNextAction }`，产物收拢进 `artifacts`。

### 主题

- `themeRegistry.ts` → `theme/assets.ts`：单一主题、两个槽位
  （侧栏纹理、助手头像）。保留"换图不改组件"的规格要求。

### 组件

- `Sidebar`：props 收紧（literature 数组 → 数量），会话条目从 4 行噪声压缩为
  标题 + 状态·时间。
- `AgentThread`：建议区块标题改为"下一轮实验建议"，建议文案作为列表项。
- `Composer`：Enter 发送（忽略输入法组合态），技能面板开合状态命名清晰化。
- `ContextPanel`：项目上下文中加一行克制的装置状态。

### 配置与桌面壳

- `tsconfig.json`：`moduleResolution: "Bundler"`，移除 `ignoreDeprecations`。
- `index.html`：`lang="zh-CN"`。
- `electron/main.ts`：`show: false` + `ready-to-show` 防白闪。

### 测试

- 行为覆盖全部保留；建议块标题断言更新。
- 新增：新建会话重置工作流；Enter 发送。
- `themeRegistry.test.ts` → `theme/assets.test.ts`。

## 不变项

- 演示链路：文献库 → SciGraph → 报告 → 方案 → LabOntology → 模拟 → 图谱回流 → 建议。
- `stageMachine`、六个 services、`demoData`、`presentation` 不动。
- 所有可见中文文案与 aria 标签尽量保持，避免无谓的测试翻修。
