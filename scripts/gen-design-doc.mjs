// 生成《SciWork 概要设计文档》Word 版（V1.0）
// 用法：npm install docx --no-save && node scripts/gen-design-doc.mjs
import fs from 'node:fs';
import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  Header,
  HeadingLevel,
  LevelFormat,
  PageBreak,
  PageNumber,
  Packer,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableOfContents,
  TableRow,
  TextRun,
  WidthType
} from 'docx';

const OUT = 'SciWork概要设计文档_V1.0.docx';
const FONT = 'Microsoft YaHei';
const CONTENT_WIDTH = 9026; // A4 减去左右 1 英寸边距

// ---------- 小工具 ----------
const h1 = (text) =>
  new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(text)] });
const h2 = (text) =>
  new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(text)] });
const h3 = (text) =>
  new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun(text)] });
const p = (text, opts = {}) =>
  new Paragraph({
    spacing: { after: 120 },
    children: [new TextRun({ text, ...opts })]
  });
const quote = (text) =>
  new Paragraph({
    spacing: { before: 80, after: 120 },
    indent: { left: 360 },
    border: { left: { style: BorderStyle.SINGLE, size: 12, color: '005BAC', space: 8 } },
    children: [new TextRun({ text, italics: true, color: '345' })]
  });
const bullet = (text, level = 0) =>
  new Paragraph({
    numbering: { reference: 'bullets', level },
    spacing: { after: 60 },
    children: [new TextRun(text)]
  });
const mono = (text) =>
  new Paragraph({
    spacing: { after: 40 },
    indent: { left: 360 },
    children: [new TextRun({ text, font: 'Consolas', size: 18, color: '1B3A5C' })]
  });
const pageBreak = () => new Paragraph({ children: [new PageBreak()] });

const cellBorder = { style: BorderStyle.SINGLE, size: 1, color: 'B9C6D6' };
const borders = { top: cellBorder, bottom: cellBorder, left: cellBorder, right: cellBorder };

function makeTable(headers, rows, widths) {
  const colWidths = widths ?? headers.map(() => Math.floor(CONTENT_WIDTH / headers.length));
  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map(
      (text, i) =>
        new TableCell({
          borders,
          width: { size: colWidths[i], type: WidthType.DXA },
          shading: { fill: 'E9F2FA', type: ShadingType.CLEAR },
          margins: { top: 80, bottom: 80, left: 120, right: 120 },
          children: [new Paragraph({ children: [new TextRun({ text, bold: true })] })]
        })
    )
  });
  const bodyRows = rows.map(
    (cells) =>
      new TableRow({
        children: cells.map(
          (text, i) =>
            new TableCell({
              borders,
              width: { size: colWidths[i], type: WidthType.DXA },
              margins: { top: 80, bottom: 80, left: 120, right: 120 },
              children: [new Paragraph({ children: [new TextRun(String(text))] })]
            })
        )
      })
  );
  return new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: colWidths,
    rows: [headerRow, ...bodyRows]
  });
}

// ---------- 封面 ----------
const cover = [
  new Paragraph({ spacing: { before: 2800 }, children: [] }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 200 },
    children: [new TextRun({ text: 'SciWork 概要设计文档', bold: true, size: 64 })]
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 600 },
    children: [new TextRun({ text: '面向科学发现闭环的 AI 科学工作台（浙大风定制）', size: 28, color: '50647D' })]
  }),
  makeTable(
    ['项目', '内容'],
    [
      ['文档编号', 'SCIWORK-HLD-V1.0'],
      ['文档版本', 'V1.0'],
      ['发布日期', '2026-06-11'],
      ['文档状态', '汇总稿（合并 V0.1–V0.6 设计与三轮迭代讨论）'],
      ['生成模型', 'Claude Fable 5（模型 ID：claude-fable-5），由 Claude Code 会话生成'],
      ['适用产品', 'SciWork Desktop v0.1.0（复旦-晶泰自动化化学反应空间首轮原型）']
    ],
    [2200, 6826]
  ),
  pageBreak()
];

// ---------- 修订记录 ----------
const revisions = [
  h1('修订记录'),
  makeTable(
    ['版本', '日期', '说明', '作者 / 来源'],
    [
      ['V0.1', '2026-06-10', '产品概念与总体架构（SCIWORK_OVERVIEW_DESIGN.md）', '项目组'],
      ['V0.2', '2026-06-10', 'Desktop 第一轮原型设计规格（工作流、模块、适配器边界）', '项目组 + AI 协作'],
      ['V0.3', '2026-06-10', '极简浙大风 AI 工作台界面规格及首版实现', 'GPT 5.5'],
      ['V0.4', '2026-06-10', '整体重构：工作流核心、主题槽位、组件、样式、配置与测试', 'Claude Fable 5'],
      ['V0.5', '2026-06-10', '第二轮：Codex/Claude Desktop 风格极简化（7 点反馈）', 'Claude Fable 5'],
      ['V0.6', '2026-06-10', '第三轮：IP 品牌、项目/会话层级、reference 目录、动效（5 点反馈）', 'Claude Fable 5'],
      ['V1.0', '2026-06-11', '本概要设计文档：汇总以上全部设计与讨论，输出 Word 版', 'Claude Fable 5 生成']
    ],
    [900, 1300, 4426, 2400]
  ),
  p(''),
  p('说明：本文档由 Anthropic Claude Fable 5 模型（claude-fable-5）在 Claude Code 桌面会话中，基于 docs/ 目录设计文档与项目迭代讨论自动汇总生成；目录页码请在 Word 中右键“更新域”刷新。', {
    size: 18,
    color: '8B99AD'
  }),
  pageBreak()
];

// ---------- 目录 ----------
const toc = [
  h1('目录'),
  new TableOfContents('目录', { hyperlink: true, headingStyleRange: '1-2' }),
  pageBreak()
];

// ---------- 1 引言 ----------
const intro = [
  h1('1 引言'),
  h2('1.1 目的'),
  p(
    '本文档是 SciWork 的概要设计文档，汇总产品定位、总体架构、核心概念、桌面客户端设计、安全模型、数据流与质量验证方案，作为后续详细设计与工程迭代的基线。'
  ),
  h2('1.2 范围'),
  p(
    '覆盖 SciWork 第一阶段（首轮原型）：以复旦-晶泰自动化化学反应空间为载体的桌面工作台，演示从私域文献到下一轮实验建议的完整科学发现闭环。仅模拟执行，不连接真实装置；不含真实登录、真实模型调用与持久化数据库。'
  ),
  h2('1.3 读者'),
  p('产品负责人、前端/桌面工程师、知识图谱与装置接入工程师、参与演示评审的科学家用户。'),
  h2('1.4 设计原则'),
  bullet('极简主义：只呈现当前演示真正需要的控件，按需呈现，不需要的不显示。'),
  bullet('习惯对齐：界面要素尽可能贴近 Codex Desktop / Claude Desktop，科学家可在两者间无缝切换，SciWork 只是科学定制层。'),
  bullet('安全先行：物理实验默认 Queue With Approval，执行授权作为输入区一等公民。'),
  bullet('可替换边界：SciGraph / LabOntology / 模拟引擎 / 视觉资产全部走显式适配器或槽位，后续可无痛替换为真实服务。'),
  bullet('证据可追溯：每一步产物都能回溯到文献证据与图谱节点。')
];

// ---------- 2 产品定位 ----------
const positioning = [
  h1('2 产品定位与愿景'),
  quote('SciWork 是科学发现驾驶舱：通过对话式 Desktop 调动知识空间、行动引擎和技能引擎，推进真实科学实验与科学发现。'),
  p(
    'SciWork 形态上类比 Codex Desktop，但操作对象从代码仓库、终端与测试系统，转换为科学问题、知识空间、自动化科学装置、实验数据与科学技能包。它不是科研管理系统，也不是文献问答助手，而是帮助科学家完成"问题提出 → 文献分析 → 假设与方案 → 装置执行 → 数据回流 → 下一轮建议"连续闭环的工作台。'
  ),
  h2('2.1 第一阶段极简原则'),
  bullet('一个用户只属于一个科学发现空间，登录后自动进入，不做多空间切换。'),
  bullet('一个空间对应一套自动化科学装置和一个主要学科领域。'),
  bullet('用户在空间内创建多个项目；每个项目拥有自己的文献库、知识库、实验记录与实验记忆。'),
  bullet('Desktop 只做驾驶舱；复杂能力通过技能引擎按需加载。'),
  bullet('物理实验默认需要人工确认；实验数据与失败经验必须回流知识空间。'),
  h2('2.2 首批科学发现空间'),
  makeTable(
    ['空间', '领域', '首轮角色'],
    [
      ['iBioFoundry', '合成生物', '后续接入'],
      ['iChemicalFoundry', 'MOF 材料发现', '后续接入'],
      ['Oasis 绿洲一号', '药物发现', '后续接入'],
      ['复旦-晶泰自动化反应平台', '自动化化学反应', '首轮原型演示载体（本设计）']
    ],
    [2800, 2800, 3426]
  )
];

// ---------- 3 总体架构 ----------
const architecture = [
  h1('3 总体架构'),
  p('SciWork 由桌面驾驶舱与三大引擎组成；首轮原型在 Desktop 内以确定性 mock 服务实现三大引擎的边界接口。'),
  mono('SciWork Desktop（科学驾驶舱）'),
  mono('  └─ 科学发现空间（iBio / iChem / Oasis / 复旦-晶泰）'),
  mono('       ├─ 知识空间：SciGraph-SCP 公共知识 + 项目私域文献/知识库/实验记忆'),
  mono('       ├─ 行动引擎：自动化装置 + 科学仪器 + SCP Profile + 执行策略'),
  mono('       └─ 技能引擎：通用/领域/数据分析/UI/SCP 服务/硬件技能包'),
  mono('  实验结果回流知识空间：证据 / 结论 / 失败经验 / 下一轮建议'),
  h2('3.1 核心对象关系'),
  mono('用户 1→1 科学发现空间 1→N 项目 1→N 会话（任务）'),
  mono('项目 1→1 私域文献库（reference 目录） 1→N 实验运行'),
  p(
    '第三轮迭代确立的目录约定：每个项目的工作区目录下设 reference/ 子目录作为项目专属私域文献库，例如 projects/mild-cross-coupling-demo/reference，由左栏资源区直接展示。'
  ),
  h2('3.2 与 SCP / SciGraph-SCP 的关系'),
  p(
    'SciWork 直接采用浦江实验室 SCP 作为科学上下文协议基础；SciGraph-SCP 作为公共科学知识源。SciWork 不重复建设公共 SciGraph，而是在知识空间中组织、对齐公共知识与私域文献、实验记录及结论。'
  )
];

// ---------- 4 科学发现闭环 ----------
const loop = [
  h1('4 科学发现闭环工作流'),
  p('首轮原型固化八阶段确定性工作流，三大知识资产在固定位置参与：'),
  makeTable(
    ['阶段', '产物', '知识资产'],
    [
      ['1 私域文献库', '项目 reference 目录中的文献集合', '—'],
      ['2 SciGraph 文献分析', '实体对齐、证据链、公共知识提示', 'SciGraph'],
      ['3 研究总结报告', '共识/分歧/不确定性/候选方向/设计依据', 'SciGraph'],
      ['4 实验方案设计', '反应体系、试剂、参数、步骤、安全注记', 'LabOntology'],
      ['5 LabOntology 校验', '术语规范化、约束检查、警告', 'LabOntology'],
      ['6 模拟执行', '队列事件、观测、收率/转化率/置信度', 'Experimental Graph'],
      ['7 Experimental Graph 回流', '目标/证据/方案/约束/运行/结果节点与关系', 'Experimental Graph'],
      ['8 下一轮建议', '建议、依据与预期影响', 'Experimental Graph']
    ],
    [2700, 4126, 2200]
  ),
  p(
    '工作流由 stageMachine 状态机推进：每阶段动作返回产物补丁与一条助手消息，完成后阶段状态置为已完成并激活下一阶段；终态（下一轮建议）后流程完成。用户可在方案设计阶段输入自然语言约束（如"希望保持温和条件并缩短反应时间"）影响方案参数。'
  )
];

// ---------- 5 Desktop 概要设计 ----------
const desktop = [
  h1('5 Desktop 客户端概要设计'),
  h2('5.1 技术选型'),
  makeTable(
    ['层', '技术', '说明'],
    [
      ['桌面壳', 'Electron（隐藏原生菜单，ready-to-show 防白闪，IP 形象作窗口图标）', '保持轻薄，无业务逻辑'],
      ['渲染层', 'React 19 + TypeScript（strict, Bundler 解析, ES2022）', '全部业务与演示逻辑'],
      ['构建', 'Vite 8（assets 为 publicDir）', '开发热更新 / 生产构建'],
      ['测试', 'Vitest 4 + Testing Library', '34 个用例覆盖关键行为']
    ],
    [1500, 4826, 2700]
  ),
  h2('5.2 三栏信息架构（最终态）'),
  p('窗口打开即进入工作台，无原生菜单。三栏布局与 Codex/Claude Desktop 的使用习惯对齐：'),
  bullet('左栏（深浙大蓝）：顶部身份区（IP 形象 + SciWork 标识 + 当前科学发现空间一行）；主层级仅两级——项目（卡片态）→ 会话（缩进树状轻量行）；底部为私域文献库（含 reference 路径与篇数）与知识图谱两条安静资源入口。'),
  bullet('中栏（纸面浅色）：项目/会话头部 + 当前阶段状态；助手与研究目标双消息；阶段产物区块流（分析、报告、方案、校验、模拟、回流、建议）。'),
  bullet('右栏（纸面浅色）：进度（当前阶段 + 进度条 + 八点 stepper）；项目上下文（目标、装置状态、文献数，报告/方案/模拟行按需出现）；知识资产（SciGraph / LabOntology / Experimental Graph 三个状态 pill 常驻，内容块随产物生成展开）。'),
  p('迭代要点：科学发现空间从独立区块降级为身份行（避免三层级反直觉）；右栏遵循按需呈现原则，空占位文案全部移除。'),
  h2('5.3 输入区（Claude/Codex 式）'),
  bullet('上：大输入框；Enter 发送（兼容中文输入法组合态），Esc 关闭面板；输入 / 唤出科学技能包面板（/scigraph、/report、/protocol、/labontology、/simulate、/graph）。'),
  bullet('下工具条左侧：工作区目录 chip（等宽字体路径）· 模型下拉（科学智能体 Pro / Lite、通用智能体）· 执行授权下拉。'),
  bullet('下工具条右侧：附件、语音、发送主按钮（求是红，按阶段显示动作名）。'),
  p('执行授权作为实验安全闸门置于输入区（而非空间卡片）：仅模拟执行（默认）/ Queue With Approval / 直接物理执行（演示中禁用，需装置管理员授权）。'),
  h2('5.4 前端模块结构与关键架构决策'),
  makeTable(
    ['模块', '职责'],
    [
      ['workflow/stageMachine.ts', '阶段定义、状态机推进（不含业务）'],
      ['workflow/runStage.ts', '纯函数阶段脚本：每阶段一件事，返回产物补丁 + 消息；前置产物硬校验'],
      ['hooks/useWorkflowController.ts', '单一状态对象 + 单快照 ref + 运行锁；无 effect、无 reset 逻辑'],
      ['components/SessionWorkspace.tsx', '中栏 + 右栏按「项目/会话」加 key：切换会话即重挂载，状态生命周期由结构表达'],
      ['services/*（6 个）', 'SciGraph / 报告 / 方案 / LabOntology / 模拟 / 图谱的确定性 mock，保留真实服务替换边界'],
      ['theme/assets.ts', '视觉资产槽位（IP 形象、左栏纹理、纸面纹理）：换图不改组件'],
      ['domain/*', '类型、演示数据、项目目录约定（projectDirectory / referenceDirectory）']
    ],
    [3400, 5626]
  ),
  p(
    '架构决策记录：会话状态重置采用 React key 重挂载而非 effect 监听 props，消除了整条 reset 代码路径与一帧旧状态闪烁；工作流产物收拢为 artifacts 单对象贯穿 hook 与组件 props；演示脚本（做什么）与状态机（顺序状态）分离。'
  ),
  h2('5.5 视觉系统'),
  bullet('配色：深浙大蓝左栏（#005bac 系）、求是红动作点缀（#b01f24）、暖白纸面中右栏、玉绿（#1d8a78）作为 AI/图谱辅助色（图谱节点、资产 pill、装置就绪状态点）。'),
  bullet('背景纹理：手绘 SVG 矢量（非位图）——左栏深蓝知识图谱星座 + 水墨山影 + 克制光晕；中右栏透明点阵 + 分子六环 + 玉绿小图谱角标，平铺极淡。'),
  bullet('IP 形象：科学家 IP（assets/characters）用于左栏身份区、助手消息头像与应用窗口图标；求是印章 SVG 备用。'),
  bullet('身份区动效：极光渐变缓漂、流光周期扫过、头像旋转彩环、文字渐变 shimmer；全部尊重系统“减少动态”偏好。'),
  bullet('字体：Inter + PingFang SC / Microsoft YaHei；中文标题不做大写转换；窄窗口下中文不溢出（overflow-wrap + 响应式断点）。')
];

// ---------- 6 安全 ----------
const safety = [
  h1('6 安全与执行授权模型'),
  p('物理实验风险高于代码执行，定义五级执行授权；首轮默认 Queue With Approval，UI 中仅放开模拟执行：'),
  makeTable(
    ['级别', '含义', '首轮状态'],
    [
      ['Suggest', '只建议，不生成可执行任务', '隐含于对话'],
      ['Draft Protocol', '生成实验协议草案，不提交装置', '方案设计阶段'],
      ['Queue With Approval', '生成并排队实验任务，物理执行前需人工确认', '默认策略，输入区可选'],
      ['Bounded Autonomous Loop', '在参数空间/预算/轮数/安全边界内自动迭代', '后续阶段启用'],
      ['Emergency Stop', '任何时候可暂停或终止实验队列', '装置侧能力，后续接入']
    ],
    [2600, 4226, 2200]
  ),
  p('UI 约束：所有执行相关动作明确标注"仅模拟执行：不会提交到真实物理装置"；"直接物理执行"选项在演示中禁用。')
];

// ---------- 7 数据 ----------
const data = [
  h1('7 数据与可追溯性'),
  p('首轮为内存态确定性数据，无持久化；数据流与图谱组织如下：'),
  bullet('演示数据：1 个空间、2 个项目、3 个会话、6 篇私域文献（domain/demoData.ts）。'),
  bullet('Experimental Graph 节点类型：Objective、LiteratureEvidence、SciGraphEntity、ReportClaim、Protocol、OntologyConstraint、SimulationRun、Observation、Result、NextSuggestion；边表达 supports / aligns / frames / drives / validates / simulates / emits / produces / informs 关系。'),
  bullet('可追溯性：最终建议可经由图谱回溯到报告结论与文献证据；失败经验（警告事件）同样入图。'),
  bullet('目录约定：项目工作区 projects/<id>/，私域文献库位于其 reference/ 子目录。')
];

// ---------- 8 质量 ----------
const quality = [
  h1('8 质量与验证'),
  p('构建链：typecheck（应用 + Electron 两套 tsconfig）→ Vitest（34 用例）→ Vite 生产构建 → Electron TypeScript 构建，全部纳入 npm run build。'),
  makeTable(
    ['测试文件', '覆盖要点'],
    [
      ['App.test.tsx（6）', '三栏壳与中文标签、技能面板、八阶段全流程推进、新建会话/切换项目重置、防连点跳阶段'],
      ['Composer.test.tsx（11）', '斜杠面板开合、命令写入、Enter 发送、面板开时 Enter 不触发、发送后清空、忙态防重、执行授权切换、禁用项不可选'],
      ['useWorkflowController.test.tsx（2）', '全流程确定性推进、并发动作防重'],
      ['stageMachine.test.ts（8）', '阶段顺序、初始状态、推进与不可变性、终态'],
      ['sciencePipeline.test.ts（1）', '六服务端到端：文献 → 图谱回流的产物形状与关键文案'],
      ['demoData.test.ts（2）', '演示数据完整性'],
      ['assets.test.ts（2）', '资产槽位路径'],
      ['未自动化项', 'Electron 窗口视觉（截图脚本 scripts/preview-shot.mjs 辅助人工核查）']
    ],
    [3400, 5626]
  )
];

// ---------- 9 迭代记录 ----------
const iterations = [
  h1('9 设计迭代记录（用户反馈 → 落地）'),
  h2('9.1 第一轮：整体重构（V0.4）'),
  bullet('诊断 GPT 5.5 首版：6 个无引用死组件、hook 用 8 个 ref 镜像状态并以 effect 重置、6 套主题无切换入口、CSS 重复冲突、建议块标题语义错误。'),
  bullet('落地：纯函数阶段脚本 + 单状态 hook + 会话 key 重挂载；主题砍为槽位常量；CSS 全量重写；tsconfig 现代化（Bundler/ES2022）；测试由 24 增至 33。'),
  h2('9.2 第二轮：Codex/Claude 风格极简化（V0.5，7 点反馈）'),
  bullet('更极简：移除证据 chips、执行过程八卡片、输入区助手浮窗。'),
  bullet('贴近 Codex/Claude：输入框在上、工具条在下；左栏两级化（空间降级为身份行）。'),
  bullet('求是印章 SVG logo 与窗口图标；手绘 SVG 背景纹理（星座/山影/点阵/分子环）。'),
  bullet('执行授权下拉进入输入区；右栏按需呈现（进度条 + stepper + 资产 pill）。'),
  h2('9.3 第三轮：品牌与层级（V0.6，5 点反馈）'),
  bullet('身份区与启动图标改用科学家 IP 形象；流光/极光/彩环/文字 shimmer 动效。'),
  bullet('项目卡片态 vs 会话缩进轻量行，父子层级一眼可读。'),
  bullet('私域文献库绑定项目 reference 目录并在左栏展示路径。')
];

// ---------- 10 后续规划 ----------
const roadmap = [
  h1('10 后续规划（非本轮范围）'),
  bullet('真实接入：SciGraph-SCP、LabOntology 服务、装置 SCP Profile 与真实队列执行。'),
  bullet('真实登录与多项目/会话持久化；本地文献导入（Markdown/TXT 起步，PDF 解析后续）。'),
  bullet('技能引擎：技能包结构、项目启用与任务级加载、UI 技能动态进入 Desktop、硬件特权技能审计。'),
  bullet('安全模型状态机化：五级授权的完整状态机与审批交互。'),
  bullet('四个科学发现空间模板化，确定首个端到端打通的空间与 MVP 边界。'),
  bullet('开源边界：SCP Profile SDK / Skill SDK / Knowledge Space schema 的开放策略。')
];

// ---------- 附录 ----------
const appendix = [
  h1('附录 A 术语表'),
  makeTable(
    ['术语', '说明'],
    [
      ['科学发现空间', '用户所属的科学场域：装置 + 学科 + 知识空间 + 行动引擎 + 技能组合'],
      ['知识空间', '公共知识与私域文献、实验记录、证据、结论的组织体系'],
      ['行动引擎', '装置/仪器/SCP Profile 构成的物理实验行动能力'],
      ['技能引擎', '可扩展科学技能包的管理与按需加载系统'],
      ['SciGraph', '公共科学知识图谱服务（SciGraph-SCP）'],
      ['LabOntology', '实验语义本体：术语规范化与约束校验'],
      ['Experimental Graph', '实验过程图谱：目标到建议的全链路节点与关系'],
      ['SCP Profile', '装置能力、校验与执行接口的协议化描述'],
      ['Queue With Approval', '默认执行策略：可排队，物理执行前需人工确认'],
      ['reference 目录', '项目工作区下的私域文献库目录约定']
    ],
    [2800, 6226]
  ),
  h1('附录 B 相关文档索引'),
  makeTable(
    ['文档', '说明'],
    [
      ['SCIWORK_OVERVIEW_DESIGN.md', '产品概念与总体架构 V0.1'],
      ['docs/superpowers/specs/2026-06-10-sciwork-desktop-first-round-design.md', '第一轮原型设计规格'],
      ['docs/superpowers/specs/2026-06-10-sciwork-desktop-minimal-zju-ai-workbench.md', '极简浙大风界面规格'],
      ['docs/superpowers/plans/2026-06-10-sciwork-desktop-refactor-claude.md', '整体重构设计记录'],
      ['docs/superpowers/specs/2026-06-10-sciwork-desktop-round2-codex-minimal.md', '第二轮极简化规格'],
      ['handoff_20260610_2125.md', '阶段性交接文档']
    ],
    [5200, 3826]
  ),
  p(''),
  p('—— 本文档由 Claude Fable 5（claude-fable-5）生成 · SCIWORK-HLD-V1.0 · 2026-06-11 ——', {
    size: 18,
    color: '8B99AD'
  })
];

// ---------- 文档 ----------
const doc = new Document({
  creator: 'Claude Fable 5 (claude-fable-5) via Claude Code',
  title: 'SciWork 概要设计文档 V1.0',
  description: '由 Claude Fable 5 基于项目设计文档与迭代讨论汇总生成',
  styles: {
    default: { document: { run: { font: FONT, size: 21 } } },
    paragraphStyles: [
      {
        id: 'Heading1',
        name: 'Heading 1',
        basedOn: 'Normal',
        next: 'Normal',
        quickFormat: true,
        run: { size: 32, bold: true, font: FONT, color: '063A75' },
        paragraph: { spacing: { before: 300, after: 200 }, outlineLevel: 0 }
      },
      {
        id: 'Heading2',
        name: 'Heading 2',
        basedOn: 'Normal',
        next: 'Normal',
        quickFormat: true,
        run: { size: 26, bold: true, font: FONT, color: '0F2B4B' },
        paragraph: { spacing: { before: 220, after: 140 }, outlineLevel: 1 }
      },
      {
        id: 'Heading3',
        name: 'Heading 3',
        basedOn: 'Normal',
        next: 'Normal',
        quickFormat: true,
        run: { size: 22, bold: true, font: FONT, color: '1B3A5C' },
        paragraph: { spacing: { before: 160, after: 100 }, outlineLevel: 2 }
      }
    ]
  },
  numbering: {
    config: [
      {
        reference: 'bullets',
        levels: [
          {
            level: 0,
            format: LevelFormat.BULLET,
            text: '•',
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 540, hanging: 270 } } }
          },
          {
            level: 1,
            format: LevelFormat.BULLET,
            text: '◦',
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 900, hanging: 270 } } }
          }
        ]
      }
    ]
  },
  sections: [
    {
      properties: {
        page: {
          size: { width: 11906, height: 16838 }, // A4
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
        }
      },
      headers: {
        default: new Header({
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: 'B9C6D6', space: 2 } },
              children: [new TextRun({ text: 'SciWork 概要设计文档 · V1.0', size: 16, color: '8B99AD' })]
            })
          ]
        })
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({ text: 'Claude Fable 5 生成 · 第 ', size: 16, color: '8B99AD' }),
                new TextRun({ children: [PageNumber.CURRENT], size: 16, color: '8B99AD' }),
                new TextRun({ text: ' 页', size: 16, color: '8B99AD' })
              ]
            })
          ]
        })
      },
      children: [
        ...cover,
        ...revisions,
        ...toc,
        ...intro,
        ...positioning,
        ...architecture,
        ...loop,
        ...desktop,
        ...safety,
        ...data,
        ...quality,
        ...iterations,
        ...roadmap,
        ...appendix
      ]
    }
  ]
});

Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync(OUT, buffer);
  console.log(`saved ${OUT} (${Math.round(buffer.length / 1024)} KB)`);
});
