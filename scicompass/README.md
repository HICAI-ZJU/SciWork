# SciCompass（科学罗盘）v0.1.0

> SuperScientist ＝ 动力引擎 × 罗盘 ＝ 能量 × 方向 ＝ 通用基模 × SciCompass

独立于 UI、独立于 LLM 的科学智能体系：以 MCP 暴露科学资源（文献、LabGraph 三级图谱、
装置治理、实验结果），以平台中立的技能包承载科学方法论，以「领航员（罗盘）」人格
与科学家协作，完成文献 → 假设 → 方案 → 装置执行 → 回流 → 下一轮的科学发现闭环。

生成日期：2026-06-12 ·设计文档：`../docs/SciCompass概要设计文档-v1.0-20260612.docx`
·实施计划：`../docs/superpowers/plans/2026-06-12-scicompass-v0.1-implementation.md`

## 七包结构

| 包 | 职责 |
|---|---|
| `@scicompass/core` | 工程语法：zod 合同、溯源 URI、SQLite 迁移框架 |
| `@scicompass/labontology` | 法度：本体词汇/约束/过程规则，统一图写入校验 |
| `@scicompass/labkag` | 知识引擎：三级图库（项目/组/公开）、蒸馏晋升、锚定、回流 |
| `@scicompass/labharness` | 驾驭引擎（特权）：装置注册表、运行状态机、审批、审计、网关 |
| `@scicompass/lablibrary` | 私域文献：导入（file/DOI/BibTeX）、FTS5 检索 |
| `@scicompass/skills` | 六个内置技能（领航员、文献综述、方案设计、执行分析、数据方法论、晶泰装置） |
| `scicompass`（CLI） | 安装器/组合器/启动器；命令别名 `scicompass` 与 `luopan` |

## 开发

```bash
cd scicompass
npm install
npm test          # vitest：单元 + 合同 + 全闭环 e2e
npm run typecheck # tsc -b 六包
```

## 在 Claude Code 中使用

```bash
npm run typecheck                  # 先构建出 dist
node packages/cli/dist/main.js init --host claude-code
# 产物：.mcp.json（scicompass-knowledge + scicompass-harness 双入口）
#       .claude/skills/（六技能）  CLAUDE.md（罗盘到场约定）
# 重启 Claude Code 会话后：/scicompass 或直接说"继续我的项目"
```

数据之家：`~/.scicompass/`（可用 `--data-home` 或 `SCICOMPASS_HOME` 覆盖）——
跨工作台的连续性所在：记忆在日志，不在港口，也不在引擎。

## 设计不变量

1. 船长决定航线，罗盘只指向（永不自动 `run_approve`；physical 必停 awaiting-approval）。
2. 记忆在日志（`~/.scicompass` + LabGraph），不在港口，也不在引擎。
3. 法度先声明（LabOntology YAML）、后执行（资源层校验）。
4. 读世界直连，写自家过闸，写世界过双闸。
5. 引擎可换，船自有——**SciCompass 服务自身永不调用 LLM**。

## v0.1 范围与后续

已含：七包、31 个 MCP 工具（knowledge 23 + harness 8）、时间线物化的无常驻执行器、
三道晋升闸门、mock 装置驱动与 mock SciGraph 锚定、claude-code 宿主安装器、全闭环 e2e。

v0.2+：真实 SciGraph 锚定（MCP client）、晶泰装置真驱动（mcpDriver）、
Claude Desktop（.mcpb）/Codex/openclaw 适配器、SciWork 重构集成（独立任务）、
SciGraph 投稿管道、常驻智能体。
