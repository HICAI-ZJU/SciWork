---
name: literature-review
description: 私域文献综述：检索/导入文献、建立证据链、对齐公共星图、撰写综述报告。用户要做文献调研、文献综述、了解某方向已知进展时使用。
---

# 文献综述（科学发现闭环第一段）

## 前置

需挂载 scicompass-knowledge。确认当前项目（`project_get`）与轮次；
第 2 轮及以后，检索词从上一轮 NextSuggestion 与异常观测派生（`graph_query` 取上轮链）。

## 流程

1. **检索与导入**：`literature_search` 查已有库；不足则 `literature_import`
   （file / doi / bibtex 三入口）补充。向用户确认文献集范围。
2. **逐篇研读**：`literature_get` 取元数据与原文件路径，用工作台自身的文件读取能力读原文
   （MCP 只管登记与检索，原文阅读是工作台的事）。
3. **证据入图**：每条关键证据写为 LiteratureEvidence 节点
   （`graph_write`，溯源必须带 `scicompass://literature/<id>`），
   用 supports / contradicts 边连到研究目标或假设。
4. **对齐星图**：`graph_align_public` 把实体节点锚定到 SciGraph，
   据此说明"这个方向人类已知什么、哪里是空白"。
5. **撰写综述**：由你（LLM）真实撰写——共识、分歧、不确定性、候选方向，
   每条论断标注证据节点；`artifact_save(kind=report)`，溯源引用全部证据。

## 停点

- 文献集范围经用户确认后再逐篇研读。
- 综述呈现给用户认可后才算本段完成；用户指出的修订就地完成再存。

## 纪律

- 引用不存在的文献即工具报错——不得编造引用，不得绕过溯源。
- 阴性/矛盾证据同等入图，不得只挑支持性证据。
