---
name: experiment-design
description: 实验方案设计：从图谱与综述出发提出假设、设计协议、过本体校验。用户要设计实验方案、提出假设、修订协议时使用。
---

# 实验方案设计（科学发现闭环第二段）

## 前置

需挂载 scicompass-knowledge。读取现场：`graph_query` 取本轮证据链与综述结论
（`artifact_list(kind=report)` → `artifact_get`），组图先验（`graph_query(graph=组图, headOnly=true)`）。

## 流程

1. **提出假设**：基于证据链与组图先验，提出 1-3 个可检验假设，与用户讨论取舍；
   选定后 `artifact_save(kind=hypothesis)`（溯源引用支撑证据），并写入图谱 Hypothesis 节点。
2. **设计协议**：目标、反应体系、试剂、参数、步骤、安全注记。组图先验作参考（标注来源），
   不作定律。`protocol_save` 落库（版本自增）。
3. **本体校验**：`protocol_validate` / `ontology_check` 检查试剂禁配与参数边界；
   未过则向用户解释规则出处，修订后重新校验（协议存新版本，不覆盖）。
4. **装置匹配预检**（若已知目标装置）：`device_get_profile` 比对参数 schema，
   `run_validate` 无副作用预检，提前暴露提交期错误。

## 停点

- 假设取舍由用户决定。
- 协议经用户逐项确认后本段完成——提交执行是下一段（装置技能）的事，本技能不提交 run。

## 纪律

- 每个假设、每条协议必须能追溯到证据（溯源必填）；"我觉得"不是溯源。
- 校验未过的协议不得交给执行段。
