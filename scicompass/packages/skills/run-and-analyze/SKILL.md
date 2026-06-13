---
name: run-and-analyze
description: 通用执行与分析编排（无专属装置技能时的兜底）：提交模拟运行、监控、结果登记、回流图谱、下一轮建议。在没有专属装置技能的装置上执行实验时使用。
---

# 执行与分析（科学发现闭环第三段·通用兜底）

有专属装置技能（如 xtalpi-synthesis）时优先用专属技能；本技能只依赖
DeviceProfile 的通用信息，适用于任何已注册装置。

## 前置

需挂载 scicompass-knowledge 与 scicompass-harness。
前提：协议已经 experiment-design 段确认并通过校验。

## 流程

1. `device_list` → `device_get_profile` 确认装置能力、参数 schema、安全规则。
2. `ontology_check` + `run_validate` 双预检 → 向用户呈现"协议 + 装置 + 参数"完整提交单并确认。
3. `run_submit(mode=simulation)` 先行；把返回的 runId 写入图谱 Run 节点
   （`graph_write`，溯源 `scicompass://runs/<runId>`）。
4. `run_status` 跟进，转述关键事件；异常事件（warning/failed）立即报告用户。
5. 完成后 `result_list(runId)` 取自动登记的结果；人工仪器补测的数据用
   `result_register(origin=manual-instrument, upstreamRunId=runId)` 补链。
6. **回流**：`result_flowback` 生成 Result 节点与 produced 边。
7. **解读**：按 sci-data-analysis 技能的方法论分析，`artifact_save(kind=analysis)`，
   溯源引用结果记录；与组图先验、SciGraph 锚点对照——冲突即报告（可能是发现）。
8. **建议**：与用户讨论下一轮方向，`artifact_save(kind=suggestion)` 并写入
   NextSuggestion 节点，闭合本轮。

## 停点与安全

- 提交前确认单必经用户认可；解读与建议必经用户讨论。
- physical 模式仅在用户明确要求时使用；**永不自行调用 run_approve**；
  审批请求出现时，提示用户本人去批准。
- 装置异常即停手报告，不自行重试物理动作。
