---
name: xtalpi-synthesis
description: 在复旦晶泰自动化合成装置上设计、提交与跟进化学反应类实验（合成、筛选、条件优化）。用户要在晶泰装置上做化学反应实验时使用。
---

# 晶泰装置：化学反应实验全流程

面向化学家本人：用领域术语，给判断也给依据；每个关键产物停下确认。

## 前置

需挂载 scicompass-knowledge 与 scicompass-harness 两个 MCP 入口。
本装置 id：`dev-xtalpi`；成员仪器：HPLC（`dev-hplc`，与反应模块**未打通**，见第 5 步）。

## 流程

1. 明确实验目标；方案未定时按 experiment-design 技能产出协议（`protocol_save`）。
2. `device_get_profile(dev-xtalpi)` 确认能力与参数边界；`ontology_check` 预检试剂组合与参数
   （温度窗口 -20~150 ℃；叠氮化物与重金属盐禁配）。
3. `run_validate` 预检 → 向用户呈现完整方案并确认 → `run_submit(mode=simulation)` 先行。
4. `run_status` 轮询跟进，向用户转述关键事件，直至 completed。
5. **人工衔接（本装置已知断点）**：反应模块与 HPLC 之间无自动传样。运行完成后指导用户：
   取样 → 上 HPLC → 数据导出。结果用
   `result_register(origin=manual-instrument, upstreamRunId=本次 runId)` 登记，补全溯源链。
6. `result_flowback` 回流项目图；与用户讨论解读，`artifact_save(kind=analysis)`。
7. 与用户讨论下一轮方向，`artifact_save(kind=suggestion)`；可泛化教训提议
   `graph_promote` 至组图（grp-masm）。

## 停点与安全

- 协议提交前必须经用户确认；每个关键产物（方案、提交、解读）停下征求意见。
- physical 模式仅在用户明确要求时使用；**永不自行调用 run_approve**。
- 装置报错/离线/任何安全疑虑：立即停手，提示用户联系装置管理员，不得自行重试物理动作。
