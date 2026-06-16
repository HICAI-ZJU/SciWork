# LabHarness 概要设计文档 v1.0

| 项 | 值 |
|---|---|
| 文档版本 | v1.0 |
| 日期 | 2026-06-16 |
| 状态 | 设计稿，待评审 |
| 承接 | `docs/LabOntology概要设计文档-v1.0-20260615.md`、`docs/LabKAG概要设计文档-v1.1-20260615.md` |

## 1. 定位与边界

LabHarness 是一个独立发布的实验流程管理与治理技能包，核心职责是管理实验 Workflow、实验装置、实验机器人、科学仪器、运行状态、审批、安全策略、审计和溯源。

LabHarness 不是 SciWork 或 SciCompass 的内部模块，也不是某个装置厂商的控制 SDK。SciWork、SciCompass、Codex、Claude Desktop 等宿主都应通过 LabHarness 暴露的技能、MCP tools 或 Browser UI 接口与它交互。

LabHarness 不拥有底层自动化装置技能、机器人技能、科学仪器技能、LabKAG、数据分析技能或 LLM 能力。它通过接口发现、调用、约束这些外部能力：

- 自动化装置、机器人、科学仪器技能负责真实能力和具体动作。
- LabKAG 负责知识检索、历史证据和结果回流。
- LabOntology 负责全部实验语义、规则、约束、审批语义和 provenance。
- 宿主 LLM 负责思考、解释和生成下一轮 workflow 建议。

LabHarness 自身是治理边界。所有 workflow 执行、装置调用、审批、策略、风险和审计必须从 LabHarness 过闸。

v1 不做完整自动优化平台，不做合规系统，不做设备驱动市场，也不把 UI 绑定到 SciWork。v1 先做好围绕四套现有自动化装置的 workflow-centered 实验执行闭环：计划、校验、审批、执行、追踪、回流、建议。

## 2. 设计不变量

LabHarness 的最高设计不变量是：

> 所有语义和规则都属于 LabOntology。

LabHarness 不定义另一套实验 schema，也不定义另一套安全规则语言。它只加载和执行 LabOntology 中的语义和规则。

三层关系如下：

```text
LabOntology
  = 语义与规则源

LabHarness
  = 基于 LabOntology 的 workflow 治理与执行编排实现

自动化装置 / 机器人 / 科学仪器技能包
  = 基于 LabOntology 描述自身能力，并执行具体动作的实现
```

这意味着四套装置的定制模板也不能写成 LabHarness 私有规则，而应写成：

```text
LabOntology domain/profile
  + LabHarness workflow template
  + 装置/仪器 skill capability implementation
```

LabOntology 决定什么是合法实验过程；装置、机器人、仪器技能决定自己能做什么；LabHarness 决定在当前 workflow、风险、审批和资源状态下，是否允许调用这些能力。

## 3. 设计决策记录

| # | 决策 | 选择 | 理由 |
|---|---|---|---|
| DR-1 | 基础定位 | 独立实验流程治理技能包 | 避免成为 SciWork/SciCompass 内部模块或装置 SDK |
| DR-2 | 顶层模型 | Workflow-centric | LabHarness 管实验流程，Run 是执行实例 |
| DR-3 | Workflow 粒度 | 混合粒度 | 默认阶段级，自动化/机器人场景可展开到步骤级 |
| DR-4 | 装置关系 | 声明式能力 + 受控执行路由 | 保持松耦合，同时保证执行治理闭环 |
| DR-5 | 安全治理 | 策略模型 | 支持 risk/policy/permission/approval，不扩展成完整合规平台 |
| DR-6 | LabKAG 关系 | 执行前后交互 | 执行前查证据/历史，执行后回流 run/result/lesson |
| DR-7 | UI 形态 | 独立 Browser UI 实验执行工作台 | 可嵌入 SciWork，也可被其他宿主打开 |
| DR-8 | LLM 关系 | 依赖宿主 LLM | LabHarness 不配置内部 LLM provider，只提供上下文、草案、校验和治理接口 |
| DR-9 | v1 范围 | 围绕四套现有装置具象化 | 先跑通真实平台 workflow，再沉淀通用抽象 |
| DR-10 | 规则权威 | LabOntology-only | 避免 LabHarness、装置技能、仪器技能形成平行规则系统 |

## 4. 包形态与模块

LabHarness v1 建议采用“核心包 + runtime + Browser UI + SKILL”的独立技能包形态。

```text
labharness/
  packages/
    core/
    governance/
    runtime/
    ontology-adapter/
    automation-skill-adapter/
    browser-ui/
  skills/
    labharness/SKILL.md
```

模块职责：

- `core`：Workflow、Stage、Step、Run、Event、Result、AuditEvent 的运行时模型和状态机。
- `governance`：基于 LabOntology 的 policy、risk、permission、approval、audit 执行逻辑。
- `runtime`：MCP tools、持久化、状态推进、受控技能调用路由。
- `ontology-adapter`：加载 LabOntology，完成 workflow、设备能力、事件、结果与 LabOntology 类型/关系的映射和校验。
- `automation-skill-adapter`：自动化装置、实验机器人、科学仪器技能包接入层。
- `browser-ui`：独立实验执行工作台，可作为嵌入式 Browser UI，也可独立打开。
- `skills/labharness/SKILL.md`：面向宿主 LLM/agent 的使用说明、停点、安全规则和建议生成流程。

LabHarness 不包含独立 `schemas/` 包。实验对象、流程、设备、仪器、机器人、参数、安全、审批和 provenance 的语义都由 LabOntology 定义。LabHarness 本地只允许保留很薄的 tool/interface contract，例如外部装置技能应提供哪些工具，而不定义科学语义。

## 5. 与 LabOntology 的关系

LabOntology 是 LabHarness 的上游语义与规则源。LabHarness 所有输入在治理前都要映射为 LabOntology 对象、关系和约束。

事实输入包括：

- workflow draft、stage、step；
- 自动化装置、机器人、仪器 capability、status、occupancy；
- 用户、项目、历史 run、审批记录；
- 外部技能返回的 event、result、error；
- 宿主 LLM 生成的下一轮 workflow suggestion。

这些输入都不是独立规则源。它们必须先映射到 LabOntology：

```text
Workflow / Stage / Step / Run
Device / Robot / Instrument / Capability
Parameter / Constraint / SafetyRule / Risk
Approval / AuditEvent / Provenance
```

然后由 LabHarness 执行：

```text
ontology_validate
  -> policy/risk/approval evaluation
  -> execution decision
```

执行决策保留四类：

```text
allowed
requires-approval
requires-manual-step
blocked
```

## 6. 与自动化装置、机器人、科学仪器技能的关系

自动化装置、实验机器人、科学仪器都是独立技能包，不属于 LabHarness。每个技能包负责描述并实现自己的能力。

外部技能包应提供最小接入面：

```text
capability_manifest
status
validate_action
submit_action
control_action
event_stream 或 event_list
result_export 或 result_list
```

这些接口描述“如何调用该技能”，不描述实验语义。实验语义仍然来自 LabOntology。

`automation-skill-adapter` 的职责是：

- 读取装置、机器人、仪器技能包暴露的 capability manifest；
- 将 capability 对齐到 LabOntology 类型；
- 检查某个 workflow stage/step 能否绑定该设备或仪器；
- 在执行时通过 LabHarness governance gate 受控调用外部技能工具；
- 把设备事件、仪器结果、机器人状态标准化为 LabHarness run/event/result；
- 生成符合 LabOntology provenance 的记录。

典型关系：

```text
LabHarness workflow stage
  -> 绑定某个 automation/instrument capability
  -> LabOntology 校验 stage/step/parameter
  -> Governance Gateway 做 risk/policy/approval
  -> Controlled Router 调用外部 skill submit_action
  -> 外部 skill 返回 run/event/result
  -> LabHarness 标准化并记录 provenance
```

这保证四套自动化装置和它们下面的仪器都可以独立演进。LabHarness 只维护稳定接入合同和治理流程，不把装置逻辑吸进自己的 core。

## 7. 核心模型与数据流

LabHarness 的顶层对象是 `Workflow`，不是 `Run`。`Workflow` 表达一次实验计划或实验流程，可以包含多个 `Stage`；每个 `Stage` 默认是阶段级描述，必要时展开为多个 `Step`。`Run` 是某个 workflow、stage 或 step 的一次执行实例，负责承载状态、事件、审批、结果和审计。

核心对象关系：

```text
Workflow
  -> Stage[]
    -> Step[] optional
    -> BoundCapability[]
  -> PolicyEvaluation
  -> Approval[]
  -> Run[]
    -> Event[]
    -> Result[]
    -> AuditEvent[]
```

执行前数据流：

```text
宿主 LLM/用户提出实验意图
  -> LabHarness 生成或接收 Workflow draft
  -> LabOntology 校验语义、参数、安全、provenance 要求
  -> automation-skill-adapter 查询装置/仪器 capability
  -> Governance Gateway 评估 risk/policy/permission/occupancy
  -> 形成待确认 Workflow + 执行计划
```

执行中数据流：

```text
用户确认/审批
  -> LabHarness 创建 Run
  -> Controlled Router 调用外部装置/机器人/仪器技能
  -> 外部技能返回状态、事件、结果
  -> LabHarness 统一记录 Event / Result / Audit
  -> 必要时暂停、等待审批、人工补录或中止
```

执行后数据流：

```text
Run completed / failed / aborted
  -> LabOntology provenance 校验
  -> 结果和事件回流 LabKAG
  -> 宿主 LLM 可基于 LabKAG + Run history 提出下一轮 Workflow suggestion
  -> suggestion 仍作为 draft，必须重新经过校验和确认
```

## 8. 四套装置的 v1 Workflow 模板

LabHarness v1 不是先做完全抽象的通用实验流程平台，而是围绕现有四套自动化装置做可用 workflow。抽象原则保留，但落地顺序是：

1. 先把四套装置的真实 workflow 跑通；
2. 为这四套装置允许写少量 tailored stage template、binding rule、risk policy；
3. 只有当两套以上装置出现共同模式时，再沉淀为通用 LabHarness core；
4. 装置专有逻辑仍放在各自独立装置/仪器技能包，不放进 LabHarness core。

模板目录可以是：

```text
workflow_templates/
  reaction-screening.xtalpi
  mof-synthesis.ichemfoundry
  strain-build.ibiofoundry
  compound-screening.oasis
```

### 8.1 晶泰化学反应筛选

目标空间：`fudan-xtalpi`  
平台：晶泰自动化合成工作站  
典型仪器：HPLC 分析仪  
实验类型：`reaction-screening`、`hplc-analysis`

```text
Goal / hypothesis
-> Reaction design
-> Ontology + safety check
-> XtalPi synthesis run
-> Await manual/semiauto HPLC handoff
-> HPLC result attach
-> Result flowback
-> Next condition suggestion
```

重点：化学安全红线、温度/时间/溶剂参数、HPLC 未打通时的人工衔接、失败反应和负结果回流。

### 8.2 iChemFoundry MOF 合成

目标空间：`zju-ichemfoundry`  
平台：iChemFoundry 材料自动化平台  
典型仪器：粉末 X 射线衍射仪  
实验类型：`mof-synthesis`、`xrd-analysis`

```text
Material target
-> Precursor / linker / synthesis condition design
-> Solvothermal/autosynthesis check
-> iChemFoundry run
-> XRD characterization
-> Phase / structure result attach
-> Result flowback
-> Next synthesis condition suggestion
```

重点：高温高压、密封反应釜风险、材料组成与合成条件、XRD 表征结果、相纯度或结构匹配。

### 8.3 iBioFoundry 合成生物 DBTL

目标空间：`zju-ibiofoundry`  
平台：iBioFoundry 合成生物自动化平台  
典型仪器：多功能酶标仪  
实验类型：`strain-build`、`plate-reading`

```text
Design objective
-> Strain/build plan
-> Biosafety + incubation check
-> iBioFoundry build/test run
-> Plate reader measurement
-> Growth / expression / activity result attach
-> Result flowback
-> Next design-build suggestion
```

重点：BSL 等级、菌株/培养温度/培养时间、酶标仪读数、DBTL 轮次追踪。

### 8.4 绿洲一号药物筛选

目标空间：`zju-oasis`  
平台：绿洲一号药物筛选平台  
典型仪器：液相色谱-质谱联用仪  
实验类型：`compound-screening`、`lcms-analysis`

```text
Target / compound set
-> Screening plate design
-> Cell line / concentration / incubation check
-> Oasis screening run
-> LC-MS or activity assay result attach
-> Hit / toxicity / dose-response analysis
-> Result flowback
-> Next screening suggestion
```

重点：化合物库审批、浓度范围、细胞系、活性/毒性结果、命中确认。

四个模板共同沉淀为 LabHarness 的通用骨架：

```text
Goal
Design
Validate
Execute
Measure
Analyze
Flowback
Suggest
```

但 v1 UI 和工具不必只显示抽象名词，可以显示平台化 stage 名称，例如“XRD 表征”“HPLC 衔接”“菌株构建”“筛选板设计”。这样科学家会感到它服务于真实装置，而不是空泛流程引擎。

## 9. 安全治理与审批模型

LabHarness 的治理模型：

```text
LabOntology = 规则语言和语义基准
LabHarness = 规则执行器和治理网关
装置/仪器技能 = 事实提供者和动作执行者
```

治理流程：

```text
Workflow / Stage / Step 草案
  + 装置/仪器 capability 与 status
  + 项目、用户、历史 run、审批记录
  + 外部技能返回的 event/result

全部映射到 LabOntology
  -> ontology_validate
  -> policy/risk/approval evaluation
  -> execution decision
```

四套装置的定制策略分三层：

```text
LabOntology domain/profile
  定义领域语义、参数边界、安全约束、审批规则

LabHarness workflow template
  定义这套装置的常见阶段、停点、人工衔接、回流路径

装置/仪器 skill package
  实现 capability、status、validate_action、submit_action、event/result 输出
```

例如晶泰场景里，“HPLC 未打通，需要人工取样上机”不是 LabHarness 私有知识，而应表现为：

- LabOntology 中有 `ManualStep`、`InstrumentMeasurement`、`upstreamRunId`、`Provenance` 等语义；
- 晶泰 workflow template 把 HPLC 衔接声明为 `requires-manual-step`；
- HPLC skill 或人工结果登记工具负责提供具体结果；
- LabHarness 负责把这个断点、人工动作和结果回流串起来。

## 10. 与 LabKAG 的关系

LabHarness 与 LabKAG 在 v1 使用执行前后交互。

执行前，LabHarness 可以通过 LabKAG 获取：

- 相关文献证据；
- 历史失败；
- 相似实验；
- 已有 protocol、run、result；
- 组图中的经验、先验、负结果。

这些信息用于 workflow validation、risk review、manual checkpoint 和宿主 LLM 的建议生成。

执行后，LabHarness 将以下内容回流给 LabKAG：

- Workflow；
- Run；
- Event；
- Result；
- ManualStep；
- AuditEvent 摘要；
- Lesson 或 NegativeResult 候选；
- 下一轮 Suggestion 草案。

v1 不做基于中间结果的自动动态 workflow 调整。未来可以在主动科学发现闭环中加入，但必须继续经过 LabOntology、LabHarness governance 和人工确认。

## 11. 宿主 LLM 与建议能力

LabHarness 不包含内部 LLM provider。它本身是给宿主 LLM/agent 调用的技能包。

宿主 LLM 可以：

- 读取 LabHarness workflow/run/event/result 上下文；
- 结合 LabKAG 证据、历史和结果；
- 生成下一轮 workflow suggestion；
- 解释风险和策略；
- 帮助用户修改 workflow draft。

LabHarness 负责：

- 提供上下文读取工具；
- 保存 suggestion 草案；
- 调用 LabOntology 校验草案；
- 触发 policy/risk/approval evaluation；
- 等待用户确认；
- 将确认后的 workflow 转入执行治理流程。

没有宿主 LLM 时，LabHarness 的核心执行管理仍可用，只是没有生成式下一轮建议。

## 12. Browser UI 工作台

LabHarness Browser UI 是独立实验执行工作台，不绑定 SciWork。SciWork 可以把它嵌入右侧浏览器面板，Codex、Claude Desktop 或其他宿主可以打开外部浏览器，也可以退化为文本工具结果。

UI 主屏建议结构：

```text
左侧：Workflow stages
中间：当前 stage 的提交单 / 校验结果 / 事件流
右侧：设备与仪器状态 / 风险策略 / 审批 / provenance
底部或抽屉：结果回流、下一轮建议草案
```

UI 不替代宿主对话。宿主 LLM 仍负责和科学家讨论、生成建议、解释结果；LabHarness UI 负责让执行状态、风险、审批和设备链路可见。

v1 UI 应围绕四套装置模板具体呈现，例如：

- 晶泰：反应参数、HPLC 衔接、人工取样提醒；
- iChemFoundry：合成条件、XRD 表征、结构匹配结果；
- iBioFoundry：DBTL 轮次、菌株构建、酶标仪读数；
- 绿洲一号：筛选板设计、细胞系、LC-MS/活性结果。

## 13. v1 工具面

LabHarness v1 工具面应保持克制，围绕 workflow、审批、运行、外部能力和回流。

候选 MCP tools：

```text
workflow_create_draft
workflow_validate
workflow_bind_capability
workflow_submit
workflow_status
workflow_list
workflow_event_list

approval_request
approval_decide

run_start
run_control
run_status

automation_skill_list
automation_skill_get_capability
automation_skill_check_binding

result_attach
workflow_flowback
suggestion_save
```

`suggestion_save` 不调用 LLM。宿主 LLM 生成建议后，把建议草案交给 LabHarness 保存、校验并进入确认流程。

## 14. v1 明确不做

- 不做内部 LLM provider。
- 不做另一套实验 schema 或规则系统。
- 不把四套装置/仪器技能包并入 LabHarness。
- 不做完整自动优化闭环。
- 不做完整合规平台、电子签名、培训资质系统。
- 不做通用技能市场。
- 不让 SciCompass 或 SciWork 私有化 LabHarness 接口。
- 不允许宿主或装置技能绕过 LabHarness 直接执行高风险动作。
- 不在 LabHarness core 中沉淀单一装置的私有驱动逻辑。

## 15. 术语

| 术语 | 含义 |
|---|---|
| LabHarness | 实验 workflow 治理与执行编排技能包 |
| Workflow | 一次实验计划或实验流程的顶层对象 |
| Stage | Workflow 中的阶段级步骤 |
| Step | Stage 内可选的细粒度执行步骤 |
| Run | Workflow、Stage 或 Step 的一次执行实例 |
| Event | 执行过程中的状态、警告、人工衔接、完成等事件 |
| Result | 实验或仪器产生的结果记录 |
| AuditEvent | 审批、控制、策略判断、异常处理等审计事件 |
| LabOntology | 全部实验语义、规则、约束和 provenance 的权威来源 |
| LabKAG | 知识引擎，提供证据/历史检索和结果回流 |
| automation-skill-adapter | 自动化装置、机器人、科学仪器技能包接入层 |
| Automation skill | 自动化装置或机器人技能包，提供真实设备能力 |
| Instrument skill | 科学仪器技能包，提供仪器测量、结果导出或数据判读能力 |
| Governance Gateway | LabHarness 中执行 policy/risk/approval/audit 的治理边界 |
| ManualStep | 需要人工完成或确认的 workflow 断点 |
| Suggestion | 宿主 LLM 生成的下一轮 workflow 草案或调整建议 |
