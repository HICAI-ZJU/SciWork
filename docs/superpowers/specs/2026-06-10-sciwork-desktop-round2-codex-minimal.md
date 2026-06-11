# SciWork Desktop 第二轮：Codex/Claude 风格极简化

日期：2026-06-10
承接：`2026-06-10-sciwork-desktop-minimal-zju-ai-workbench.md` 与第一轮重构。

## 用户反馈（7 点）

1. 整体进一步极简。
2. 界面要素尽可能贴近 Codex / Claude Desktop——科学家应能在 Codex/Claude 与
   SciWork 之间无缝切换，SciWork 只是科学定制层。
3. assets 的 IP 形象替换为「求是」logo，并作为应用图标。
4. 左深右浅的面板可以有克制的背景图案；配色继续浙大蓝 + 求是红点缀 +
   中国风 + AI + Science。
5. 左栏「空间/项目/会话」三层太复杂：空间换位置体现，层级要直觉。
6. 底部输入框参照 Claude/Codex 重做：工作目录、消息框、模型下拉、
   **安全执行授权选择**（Approval 在这里体现，不放在空间卡片）。
7. 右栏进度更好看、上下文更有层次；按需呈现，不需要的不显示。

## 设计决策

### 品牌与资产
- `assets/brand/sciwork-logo.svg`：求是红印章式方标（白字「求是」+ 内框），
  同时渲染 `sciwork-logo.png` 作为 Electron 窗口图标。
- 助手头像槽位改用该 logo；科学家 IP PNG 保留在 assets 但不再被引用。
- 背景采用手绘 SVG 矢量纹理（非 AI 生图，便于调参且体积小）：
  - `assets/patterns/sidebar-graph.svg`：深浙大蓝渐变 + 低对比知识图谱星座 +
    山影曲线 + 求是红/智识蓝光晕。
  - `assets/patterns/paper-texture.svg`：透明底点阵 + 极淡分子六环 + 玉绿小图谱角标，
    平铺在中栏与右栏纸面上。

### 信息架构（左栏两级化）
- 顶部身份行：logo + SciWork + 当前科学发现空间名（类似 Claude 工作区行）。
- 主层级只剩两级：`项目` → `会话`。
- 装置与队列状态移至右栏「项目上下文」；Approval 移至输入区。
- 资源（私域文献库 / 知识图谱）保留为底部安静入口。

### 输入区（贴近 Claude/Codex）
- 上：大输入框（Enter 发送，Esc 关面板，`/` 技能面板保留）。
- 下工具条：工作目录 chip ·「模型」下拉（科学智能体 Pro/Lite、通用智能体）·
  「执行授权」下拉（仅模拟执行=默认 / Queue With Approval / 直接物理执行=禁用，
  体现实验安全闸门）· 右侧附件、语音、发送（求是红主按钮）。
- 移除输入框上方的「科学助手」浮窗。

### 中栏降噪
- 移除首条消息下的证据 chips 行。
- 移除「执行过程」8 卡片网格（与右栏进度重复）。
- 仅保留：项目头、双消息（助手/研究目标）、阶段产物区块流。

### 右栏（按需呈现）
- 进度：当前阶段 + 进度条 + 8 点 stepper（取代 8 行状态列表）。
- 项目上下文：名称、目标、装置行常驻；报告/方案/模拟行仅在产物生成后出现。
- 知识资产：SciGraph / LabOntology / Experimental Graph 三个状态 pill 常驻
  （满足首轮规格"三资产可见"），各自内容块仅在产物生成后展开。

## 不变项
- 演示链路、stageMachine、services、demoData 不动。
- 第一轮的工作流核心架构（runStage / 单状态 hook / 会话 key 重挂载）不动。
