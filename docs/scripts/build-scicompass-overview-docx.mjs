// SciCompass 概要设计文档 Word 生成脚本
// 用法: node docs/scripts/build-scicompass-overview-docx.mjs
// 输出: docs/SciCompass概要设计文档-v1.0-20260612.docx
import * as pkg from 'docx';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, LevelFormat, TableOfContents, HeadingLevel,
  BorderStyle, WidthType, ShadingType, PageNumber, PageBreak
} = pkg;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(__dirname, '..', 'SciCompass概要设计文档-v1.0-20260612.docx');

const ZH = { ascii: 'Microsoft YaHei', eastAsia: 'Microsoft YaHei', hAnsi: 'Microsoft YaHei' };
const MONO = { ascii: 'Consolas', eastAsia: 'Microsoft YaHei', hAnsi: 'Consolas' };
const CONTENT_W = 9026; // A4, 1英寸页边距

const r = (text, opts = {}) => new TextRun({ text, font: ZH, ...opts });
const p = (text, opts = {}) => new Paragraph({ children: [r(text)], spacing: { after: 120, line: 320 }, ...opts });
const pRuns = (runs, opts = {}) => new Paragraph({ children: runs, spacing: { after: 120, line: 320 }, ...opts });
const h1 = (text) => new Paragraph({ heading: HeadingLevel.HEADING_1, children: [r(text, { bold: true })] });
const h2 = (text) => new Paragraph({ heading: HeadingLevel.HEADING_2, children: [r(text, { bold: true })] });
const h3 = (text) => new Paragraph({ heading: HeadingLevel.HEADING_3, children: [r(text, { bold: true })] });
const bullet = (text) => new Paragraph({
  numbering: { reference: 'bullets', level: 0 },
  children: [r(text)], spacing: { after: 80, line: 300 }
});
const pageBreak = () => new Paragraph({ children: [new PageBreak()] });

const quoteBlock = (lines) => new Table({
  width: { size: CONTENT_W, type: WidthType.DXA },
  columnWidths: [CONTENT_W],
  rows: [new TableRow({
    children: [new TableCell({
      width: { size: CONTENT_W, type: WidthType.DXA },
      shading: { fill: 'EEF3FA', type: ShadingType.CLEAR },
      borders: cellBorders('B8CCE4'),
      margins: { top: 120, bottom: 120, left: 200, right: 200 },
      children: lines.map((t) => new Paragraph({
        children: [r(t, { bold: true })], spacing: { after: 60, line: 300 }
      }))
    })]
  })]
});

function cellBorders(color) {
  const b = { style: BorderStyle.SINGLE, size: 1, color };
  return { top: b, bottom: b, left: b, right: b };
}

const codeBlock = (lines) => new Table({
  width: { size: CONTENT_W, type: WidthType.DXA },
  columnWidths: [CONTENT_W],
  rows: [new TableRow({
    children: [new TableCell({
      width: { size: CONTENT_W, type: WidthType.DXA },
      shading: { fill: 'F5F7FA', type: ShadingType.CLEAR },
      borders: cellBorders('D9D9D9'),
      margins: { top: 100, bottom: 100, left: 160, right: 160 },
      children: lines.map((t) => new Paragraph({
        children: [new TextRun({ text: t === '' ? ' ' : t, font: MONO, size: 17 })],
        spacing: { after: 20, line: 240 }
      }))
    })]
  })]
});

function tbl(colWidths, header, rows, fontSize = 18) {
  const mk = (text, isHeader, width) => new TableCell({
    width: { size: width, type: WidthType.DXA },
    shading: isHeader ? { fill: 'D5E8F0', type: ShadingType.CLEAR } : undefined,
    borders: cellBorders('BFBFBF'),
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
    children: [new Paragraph({
      children: [r(text, { bold: isHeader, size: fontSize })],
      spacing: { after: 0, line: 260 }
    })]
  });
  const headerRow = new TableRow({
    tableHeader: true,
    children: header.map((tx, i) => mk(tx, true, colWidths[i]))
  });
  const bodyRows = rows.map((row) => new TableRow({
    children: row.map((tx, i) => mk(tx, false, colWidths[i]))
  }));
  return new Table({
    width: { size: CONTENT_W, type: WidthType.DXA },
    columnWidths: colWidths,
    rows: [headerRow, ...bodyRows]
  });
}

// ------------------------------ 文档内容 ------------------------------
const children = [];

// 封面
children.push(
  new Paragraph({ spacing: { before: 2400 } }),
  new Paragraph({ alignment: AlignmentType.CENTER, children: [r('SciCompass（科学罗盘）', { size: 56, bold: true })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 200 }, children: [r('概要设计文档', { size: 40, bold: true })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 300 }, children: [r('SuperScientist ＝ 动力引擎 × 罗盘 ＝ 能量 × 方向', { size: 24, italics: true, color: '44546A' })] }),
  new Paragraph({ spacing: { before: 2000 } }),
  new Paragraph({ alignment: AlignmentType.CENTER, children: [r('版本：v1.0', { size: 22 })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, children: [r('生成日期：2026-06-12', { size: 22 })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, children: [r('状态：待评审', { size: 22 })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, children: [r('编制：SciWork 设计组 × Claude（设计讨论收敛稿）', { size: 22 })] }),
  pageBreak()
);

// 版本记录 + 目录
children.push(
  h1('版本记录'),
  tbl([1200, 1800, 4826, 1200],
    ['版本', '日期', '说明', '状态'],
    [['v1.0', '2026-06-12', '初版：2026-06-10 至 06-12 全部设计讨论的完整收敛（后端架构、技能体系、LabGraph 三引擎、SciGraph 双向动脉、领航员、发行与部署、IP 边界、打样方案）', '待评审']]),
  p('关联文档：《2026-06-12-sciwork-backend-mcp-architecture-design.md》（早期后端规格，其模块组织与命名已由本文档取代，其中时间线物化、运行状态机、zod 合同等技术设计被本文档继承）；《SciCompass 实施方案 v1.0》（同日生成的可执行实施计划）。'),
  pageBreak(),
  h1('目录'),
  new TableOfContents('目录', { hyperlink: true, headingStyleRange: '1-2' }),
  pageBreak()
);

// 1 总纲
children.push(
  h1('1　总纲：科学发现的远航'),
  h2('1.1　图景'),
  p('科学发现是一场驶向未知海域的远航。'),
  p('船长是科学家——航线由人决定，这是整个体系不可动摇的第一原则。船长手中有一只罗盘（SciCompass）：司南的后裔、麦克斯韦妖的同道，以信息对抗熵增，为科学执掌方向——罗盘指向，但从不代替船长决定航线。'),
  p('船舱里是动力引擎（通用基模）：没有引擎，船就是一块漂在水上的死铁——罗盘指得再准，船纹丝不动。理解、推理、规划、书写，每一次工具调用都是引擎输出的能量在做功；它代表能量本身。但引擎是装配的：引擎舱有标准接口（松耦合），今天装配世界上最好的外购引擎，明天可以在港口整体换装。船队之间的差距从来不在引擎，而在谁的罗盘更准、谁的日志更厚、谁的法度更严。引擎给能量而无方向，罗盘给方向而无能量——能量 × 方向 ＝ 远航。'),
  p('抬头是星图（SciGraph）：人类已知世界的六十余张海图，只读的世界参照系。低头是航海日志（LabGraph）：这支船队自己的航迹，分三册——项目图记录本次远航的逐日航迹（窄而深），组图沉淀船队世代相传的航路经验（宽而精），公开图是船队决定公诸于世的海图（宽而稀）。罗盘靠牵星术（锚定）把自家航迹钉在世界星图的坐标上，由此知道哪里是已知的海、哪里是真正的无人之境——当自家观测与星图冲突：要么是测错了，要么就是发现。'),
  p('船上有法度（LabOntology）：航行规则随远航演进、版本可溯，统管一切图谱的词汇与边界；有缰绳与调速器（LabHarness）：科学装置这头巨兽由驾驭引擎执缰——驾驭规则亦以图书写，闸门焊在机器上，而不是写在告示牌上。引擎会有噪声与抖动（幻觉与错误），调速器与闸门把每一分原始能量都转化为朝向真理的净前进。'),
  p('知识沿一条航线流动：实验台 → 项目图（事实）→ 组图（经验）→ 公开图（知识）→ 星图（人类公共知识），每一跳都有人把门；成熟的经验向内结晶为法度，向外升华为星辰。'),
  p('港口（工作台）可以任选——SciWork、Claude Code、Claude Desktop、Codex、openclaw、命令行——船的连续性不在港口，在日志（~/.scicompass 数据之家）。引擎是装配的、且刻意可换：船队真正自有的，是日志、法度与罗盘本身。每支船队的远航都为星图添上经过实验验证的星辰，星图又指引更多船队——这是整个生态的飞轮。'),
  h2('1.2　隐喻—构件—落点对照表（罗塞塔石碑）'),
  tbl([1500, 2600, 4926],
    ['隐喻', '系统构件', '技术落点'],
    [
      ['船长', '科学家', '科学判断权在人；一切晋升、审批、航向的最终决定者'],
      ['罗盘', 'SciCompass：领航员人格＋整个科学智能体系', '发行版七包；人格技能 scicompass；命令 /scicompass 与 /luopan'],
      ['动力引擎', '通用基模（能量）', '标准引擎舱接口＝可插拔模型 API；罗盘不产生推力（SciCompass 服务永不调用 LLM）；终局＝自研科学基模'],
      ['传动系统', 'Agent loop（宿主提供）', '各港口自带传动系统把引擎能量传到螺旋桨（各工作台的对话循环）'],
      ['星图', 'SciGraph-SCP', '65+ 公共科学知识图谱；SCP 平台 MCP 服务；读取直连'],
      ['牵星', '锚定与查新', 'graph_align_public；scigraph_anchor URI；新颖性雷达（综述/回流/公开三时刻）'],
      ['航海日志', 'LabGraph 总体', '三级图库文件；引用之网不是数据之仓；跨图不连边、只留溯源 URI'],
      ['—逐日航迹', '项目图', '窄而深；全量工作记录；随项目生灭、归档即移文件'],
      ['—航路志', '组图', '宽而精；蒸馏知识；头节点胶囊约定（Lesson/Method/Prior/NegativeResult）'],
      ['—公开海图', 'open 图', '宽而稀；脱敏＋署名＋许可证；文件本身即发布物'],
      ['蒸馏', '晋升（graph_promote）', '再表达而非改标签；原图永不改动'],
      ['法度', 'LabOntology', '词汇／领域约束／过程约束三层；版本化演进、修订有闸门；统管 KAG 与 Harness 全部 schema'],
      ['缰绳＋调速器', 'LabHarness', '驾驭规则图＋装置注册表＋运行状态机＋审批＋审计＋治理网关；governor ↔ governance'],
      ['三道闸门', '晋升与发布治理', '项目→组：科学家批；组→公开：PI＋脱敏＋不可逆确认；公开→星图：投稿管道双侧审核'],
      ['麦克斯韦妖', '罗盘的工作原理', '以信息对抗熵增：全局记忆＋规则通晓＋查新雷达；站在闸门旁，但闸门不由它（也绕不过）'],
      ['一灵多体', '领航员定义与运行时分离', 'SKILL.md 是灵魂；化身为技能包／常驻智能体／空间级服务'],
      ['港口', '工作台', 'scicompass init --host … 适配器；港口零特权，换港不换船'],
      ['数据之家', '~/.scicompass/', '跨工作台连续性所在；记忆在日志，不在港口，也不在引擎'],
      ['内容与形式', 'IP 边界', '船长拥有发现（项目／组图内容囚禁于团队）；我们拥有航海文明的形式（语法、法度框架、罗盘、星图、聚合网络）'],
      ['飞轮', '生态战略', '船队远航 → 实验验证的知识入星图（Experiment-Verified 新大陆）→ 星图引导更多船队']
    ]),
  h2('1.3　五条第一性原则（全体系不变量）'),
  bullet('一、船长决定航线，罗盘只指向。假设取舍、方案批准、轮次方向永远是人的；罗盘永不自行调用 run_approve。'),
  bullet('二、记忆在日志，不在港口，也不在引擎。会话易失、图谱持久；换工作台、换模型，船队的一切都还在。'),
  bullet('三、法度先声明、后执行。LabOntology 声明规则（数据），资源层强制执行（机制），罗盘引导解释（体验）——软硬两层，规则只写一处。'),
  bullet('四、读世界直连，写自家过闸，写世界过双闸。星图只读随便看；写入自家图谱必带溯源；公开是全系统唯一不可逆动作，闸门最重。'),
  bullet('五、引擎可换，船自有。与 UI、LLM 双松耦合的本质是价值沉淀的方向选择：动力可以外购、可以换装，罗盘、日志、法度与缰绳必须是自己的。'),
  h2('1.4　一个公式'),
  quoteBlock([
    'SuperScientist ＝ 动力引擎 × 罗盘 ＝ 能量 × 方向 ＝ 通用基模 × SciCompass',
    '乘式缺一即零：无引擎则停，无罗盘则漂。',
    '乘式右边的每一项都随船队的远航而增值，且只属于这支船队和这个生态。'
  ]),
  pageBreak()
);

// 2 产品定位与品牌体系
children.push(
  h1('2　产品定位与品牌体系'),
  h2('2.1　SciCompass 是什么'),
  p('SciCompass（科学罗盘）是一套独立于任何 UI、独立于任何 LLM 的科学智能体系：它以 MCP 服务暴露科学资源（文献、知识图谱、装置与仪器、实验结果），以平台中立的技能包承载科学方法论，以「领航员」人格与科学家对话，把私域知识、世界知识、物理装置与通用基模串联为完整的科学发现闭环。它既有数据层面的贡献（开放公共科学知识图谱 SciGraph 及自有 LabGraph 体系），也有引擎与平台层面的贡献（整体技术体系：语法、法度、治理、技能）。'),
  p('SciCompass 不是某个组件，而是一个体系；领航员是该体系凝结成的「某个人」——体系的人格化界面。科学家对话的对象就是罗盘本人。'),
  h2('2.2　品牌三件套'),
  tbl([2200, 3200, 3626],
    ['名字', '是什么', '隐喻'],
    [
      ['SciWork', '桌面工作台（可选壳之一）', '你劳作的工作台／港口'],
      ['SciGraph', '公共科学知识图谱服务（浦江，自有写权限）', '星图（世界已知的天空）'],
      ['SciCompass', '科学智能体系＋领航员人格', '罗盘（为你执掌方向的存在）']
    ]),
  p('命令与称呼：技能名 scicompass，命令 /scicompass 与 /luopan 双别名（全小写）；中文对话中称「罗盘」。人格注释（lore）：司南之后裔，麦克斯韦妖之同道——以信息对抗熵增，为科学执掌方向。'),
  h2('2.3　与 OpenCompass 的家族定位'),
  p('浦江生态内已有 OpenCompass（司南）评测体系。SciCompass 主动定调为罗盘家族扩列而非撞名：司南为模型指方向（评测），科学罗盘为科学指方向（领航）——同一个罗盘传统，两片不同的海。中英命名遵循生态家规（中文与英文意译不直译，如 OpenCompass／司南、InternLM／书生）。'),
  bullet('发布前核验清单：知会 OpenCompass 团队与品牌管理并定调家族关系；中／美商标检索「SciCompass」；npm／PyPI 包名与域名占用核验（scicompass）。'),
  pageBreak()
);

// 3 总体架构
children.push(
  h1('3　总体架构'),
  h2('3.1　四层结构'),
  codeBlock([
    '宿主工作台（任选）: sciwork - claude code - claude desktop - codex - openclaw - CLI',
    '                      |  宿主自带 LLM（动力引擎，任意可换）',
    '                      v',
    '        技能层  @scicompass/skills（领航员人格 + 环节技能，平台中立 SKILL.md）',
    '                      |  MCP 协议（stdio 默认 / streamable HTTP 可选）',
    '                      v',
    '        资源层  scicompass serve（组合器，按需挂载模块）',
    '        ├─ labkag      （知识引擎：三级图库 + 产物/协议/结果 + 锚定）──> SciGraph（星图）',
    '        ├─ lablibrary  （私域文献）',
    '        ├─ labontology （法度：本体与校验）',
    '        └─ labharness  （驾驭引擎：治理网关）──> 四套装置 MCP（下游）',
    '                      |',
    '                      v',
    '        数据层  ~/.scicompass/（数据之家——跨工作台连续性所在）'
  ]),
  h2('3.2　松耦合三原则'),
  bullet('独立于 UI：任何支持 MCP 与技能的工作台皆为合格港口；港口零特权，换港不换船。'),
  bullet('独立于 LLM：SciCompass 服务自身永不调用 LLM（罗盘不产生推力）；一切智能由宿主之引擎驱动；蒸馏改写、综述生成、方案设计由宿主大模型在技能指导下完成。'),
  bullet('模块松耦合：发行版模式——七个独立发包的模块，各自可单独对外提供服务，由 CLI 组合成整体；整体性来自「一份语法（core 合同）＋一窝数据（数据之家）＋一个人格（领航员）」。'),
  pageBreak()
);

// 4 LabGraph 总体
children.push(
  h1('4　LabGraph 总体：实验室知识体系'),
  h2('4.1　三引擎结构'),
  codeBlock([
    'LabGraph（总体：实验室知识体系 = SciCompass 的心脏）',
    '├── LabOntology  本体层：Schema 权威，随科研演进（版本化、修订有闸门）',
    '│                统管 KAG 与 Harness 的全部数据形态',
    '├── LabKAG       知识引擎（数据平面）：三级图库的查询/写入/蒸馏/锚定/导出',
    '│                一切写入经 LabOntology 校验',
    '└── LabHarness   驾驭引擎（治理平面）：驾驭规则亦以图存储 + 装置网关',
    '                 + 运行状态机 + 审批 + 审计'
  ]),
  p('统一洞察：知识是图，规则也是图，schema 同源。「知识硬化为法度」由跨形态转换变为图到图的晋升——组图中被反复验证的 Lesson 胶囊，硬化为驾驭规则图中的 Rule 节点，全程同一套词汇、同一个校验引擎、同一种溯源 URI。三引擎各一句话：Ontology 定义什么是合法的，KAG 记住发生过什么，Harness 驾驭接下来能做什么。'),
  h2('4.2　三册航海日志（物理分图）'),
  tbl([1900, 3300, 3826],
    ['图谱', '定位', '要点'],
    [
      ['项目图 ×N（labgraph-prj-<slug>.db）', '窄而深：本项目全量工作记录', '每项目一个独立 SQLite 文件；细到每次 run；随项目生灭，归档即移文件'],
      ['组图（labgraph-grp-<slug>.db）', '宽而精：全组蒸馏知识全集', '跨项目、跨年度的经验／方法／先验；头节点胶囊约定；第一阶段组＝科学发现空间'],
      ['公开图（labgraph-grp-<slug>-open.db）', '宽而稀：批准公开的子集', '脱敏＋署名＋许可证（默认 CC-BY 类）；文件本身即可分享的发布物']
    ]),
  bullet('允许重叠：各图自含、各自完整可读可携带；同一知识的多份表达靠溯源指针对账，领航员负责知识盘点与冲突提示。'),
  bullet('引用之网纪律：图上存关系＋轻量语义标签＋指针；装置 Profile、运行参数、原始数据文件、产物正文留在各自的表与文件区，节点解引用可达全量数据。'),
  bullet('跨图永不连边：跨层关联一律走溯源 URI（labgraph://、scicompass://），解引用受访问权约束；悬空边在结构上不可能出现。'),
  bullet('头节点胶囊：组图与公开图中一份蒸馏知识＝一个以头节点（Lesson/Method/Prior/NegativeResult）领衔的小子图；标题、摘要、状态、批准、署名、许可证全部挂在头节点——治理一格到位，浏览先读摘要（低 token）。'),
  h2('4.3　蒸馏晋升与三道闸门'),
  tbl([2400, 3300, 3326],
    ['晋升', '闸门', '说明'],
    [
      ['项目图 → 组图', '领航员提议，科学家批准', '蒸馏＝再表达：生成泛化新内容写入组图，原始节点永不改动；带溯源指针'],
      ['组图 → 公开图', 'PI 批准＋脱敏审查＋不可逆确认', '全系统最重闸门之一；剥离内部 ID、未发表结构、商业敏感装置参数；溯源内部保全链、对外折叠为可引用形式'],
      ['公开图 → SciGraph', '投稿管道：格式／锚定校验＋SciGraph 侧编辑审核＋双侧审计', 'SciGraph 写凭证只存在于投稿管道，永不下发工作台与会话']
    ]),
  p('知识完整生命周期：实验台 → 项目图（事实）→ 组图（经验）→ 公开图（知识）→ 星图（人类公共知识）；组图成熟知识两条硬化路径——向内结晶为 LabOntology 法度，向外升华为公开星辰。每一步领航员提议、人类批准。'),
  pageBreak()
);

// 5 SciGraph 双向动脉
children.push(
  h1('5　SciGraph：双向动脉'),
  h2('5.1　星图事实'),
  bullet('SciGraph-SCP 部署于浦江实验室 SCP 平台，本身即 MCP 服务；含 65+ 领域知识图谱（化学 7、生物 15、物理 3、海洋地理 5、其他 35+）；Cypher 查询＋自然语言检索＋schema 自省。'),
  bullet('SciGraph 为我方自研，拥有写入权限——出站投稿是可直接设计的自家通道。'),
  h2('5.2　入站：锚定与查新（牵星）'),
  p('LabGraph 实体节点携带 scigraph_anchor URI（如 scigraph://ReaKE/node/<id>）。graph_align_public 的语义：拿自家图谱实体去 SciGraph 找锚点，写回锚定 URI＋缓存对齐摘要（read-through 缓存带时效，永不批量镜像）。锚定买到三样东西：词汇互操作、查新与冲突检测、为出站投稿铺路。'),
  p('查新雷达三时刻：文献综述时（这个方向人类已知什么）；结果回流时（我们的观测与公共知识冲突吗——冲突＝要么实验错了，要么是发现）；公开决策时（这条知识星图里已有吗）。'),
  bullet('空间订阅集：每个科学发现空间声明相关公共图谱子集（化学空间默认 ElementKG、ReaKE、Material、MatKG、MEKG 等），锚定与查新优先查订阅集。'),
  bullet('接入纪律：读世界直连（工作台直接挂载 SciGraph MCP，不重复建设）；把世界知识锚进自家图谱必须经 labkag 工具（溯源纪律）。'),
  h2('5.3　出站：投稿与新大陆'),
  p('恰因拥有写权限，治理更严而非更松：写凭证只存在于投稿管道（空间级服务），科学家本地与任何 LLM 会话拿不到它。建议在 SciGraph 内开辟新类别——实验验证知识图谱（Experiment-Verified KG）：由 SciWork 网络各团队的公开图聚合而成，区别于文献挖掘型图谱；知识 100% 自产、带完整溯源、含阴性结果、经三道人工闸门——「完全自主的世界知识图谱」的正确实现位置是星图内的新大陆，而非第二张星图。'),
  p('生态飞轮：SciWork 网络是知识毛细血管，SciGraph 是主动脉。现有公共图谱多为二手文献聚合，SciWork 供给的是实验验证的一手知识——SciGraph 因 SciCompass 获得活水，SciCompass 因 SciGraph 获得世界坐标。阴性结果共享的边际成本第一次接近于零。'),
  pageBreak()
);

// 6 技能体系
children.push(
  h1('6　技能体系'),
  h2('6.1　三类技能'),
  tbl([2200, 3300, 3526],
    ['类型', '定义', '例子'],
    [
      ['人格技能', '定义「你是谁」', 'scicompass（领航员本人）'],
      ['编排／环节技能', '定义「这段流程怎么走」', '装置技能（端到端编排）、literature-review、experiment-design、run-and-analyze（通用兜底）'],
      ['知识／方法技能', '定义「这件事怎么做」', 'sci-data-analysis、hplc-analysis 等仪器判读技能']
    ]),
  p('核心原则：设备封装在资源层（DeviceProfile，含 partOf/members 结构关系），技能按科学任务划分而非按硬件划分；编排不是独立机制，它是装置技能 SKILL.md 中的「流程」章节；工作流状态不在技能里（技能无状态），在资源层（runs 表与图谱）。'),
  h2('6.2　装置技能'),
  tbl([2600, 2900, 3526],
    ['技能名', '显示名', '覆盖'],
    [
      ['xtalpi-synthesis', '晶泰自动化合成', '化学反应类实验（复旦化学系）'],
      ['ichemfoundry-mof', 'iChemFoundry·MOF 智造', 'MOF 材料发现（浙大科创）'],
      ['ibiofoundry-synbio', 'iBioFoundry·合成生物', '合成生物构建与测试（浙大科创）'],
      ['oasis-pharma', '绿洲一号·药物发现', '药物发现实验（浙大智慧绿洲）']
    ]),
  bullet('命名规则：装置短名＋任务域；仪器技能不绑装置名（hplc-analysis、xrd-analysis），仪器判读知识跨装置复用。'),
  bullet('仪器技能判据：用户会不会单独对这台仪器发起任务？会——独立技能；不会——知识并入装置技能。'),
  bullet('四套装置均已完成 MCP 封装、可网络接入：装置调用必须经 labharness 治理网关（闸门、审计、溯源、统一抽象、可见性过滤五大职能），用户工作台只配置 SciCompass 的 MCP，不直连装置 MCP。'),
  bullet('人工衔接（仪器未打通场景）：人工步骤为工作流一等公民——运行时间线含 awaiting-manual-step 事件，结果登记带 upstreamRunId 补全溯源链；装置技能封装「哪里断、怎么接」的本地拓扑知识；多技能协同引擎就是 LLM 本身。'),
  bullet('动态扩展：空间模板（templates/）init 时选装默认技能集；scicompass skill add 随时自增；领航员造的工具被验证后固化为技能（沉淀闭环）。'),
  h2('6.3　实验数据处理三分法'),
  tbl([2800, 3000, 3226],
    ['知识性质', '安置位置', '例子'],
    [
      ['确定性解析（格式→结构化）', '技能附带脚本（scripts/），不让 LLM 干', 'HPLC 导出解析、板读仪矩阵读取'],
      ['仪器特定判读（数据→科学含义）', '对应仪器技能或装置技能', '色谱判峰、Ct 值异常解读'],
      ['通用方法论（统计/拟合/DoE/可视化/质控）', '独立通用技能 sci-data-analysis', '全部空间共享']
    ]),
  h2('6.4　加载方式'),
  p('自动触发为主（写好 description，科学家无需记命令）＋ slash 显式调用并存（/scicompass、/luopan 及各技能命令）。关键认知：安全不靠加载方式，靠资源层闸门——技能加载只是流程知识进入上下文，物理风险闸门焊死在 labharness（physical 必停 awaiting-approval）。用户画像为化学家、药学家、材料学家、合成生物学家本人直接使用：领域术语优先、停点密度取高、装置技能必含异常兜底指引。'),
  pageBreak()
);

// 7 领航员
children.push(
  h1('7　领航员（罗盘人格）完整定义'),
  h2('7.1　五职责与边界'),
  tbl([1700, 3700, 3626],
    ['职责', '做什么', '不做什么'],
    [
      ['定位', '读 LabGraph 重建现场：第几轮、哪一段、上段产出、离线期间发生了什么', '不替用户记忆（图谱才是记忆）'],
      ['引导', 'ontology_check 预检意图；调外部知识（SciGraph、文献）给思考材料', '不替用户做科学判断'],
      ['把关解释', '资源层硬拦后解释规则出处与修正路径', '不绕过闸门（机制在资源层，也绕不过）'],
      ['引荐交棒', '该读文献交棒 literature-review，该实验交棒装置技能，该分析引荐方法技能或外部工具', '不亲自执行环节工作（防上帝技能）'],
      ['兜底造工具', '无现成技能/工具时写脚本解决；脚本存为带溯源 artifact，验证后固化为技能', '不放任脚本流失']
    ]),
  bullet('硬边界：科学判断权在人；永不调用 run_approve；physical 模式仅在用户明确要求时提交；自己也要过 ontology_check。'),
  bullet('派发模式：重上下文任务（批量文献消化、数据深挖）派发子智能体，保持自身全局轻盈。'),
  bullet('领航日志：artifact_save(kind=logbook) 记录跨会话工作记忆（科学家倾向、未决问题、下次提醒）。'),
  h2('7.2　物料五件套'),
  tbl([1700, 3500, 1800, 2026],
    ['部件', '载体', '归属', '角色'],
    [
      ['灵魂', 'skills/scicompass/SKILL.md', '领航员本体', '人格、职责、行为约定'],
      ['到场机制', '项目 CLAUDE.md / AGENTS.md 一行约定', '领航员本体', '人格自动在场，不等触发'],
      ['感官手脚', '.mcp.json（MCP 入口）＋工作台原生能力', '环境（共享）', '查图谱、查规则、交棒、派发'],
      ['记忆', 'LabGraph ＋ logbook 产物', '环境（共享）', '全局状态＋跨会话自我'],
      ['法度', 'LabOntology ＋资源层闸门', '环境（共享）', 'harness 的规则与执行']
    ]),
  p('边界检验：删掉领航员，系统照常运转（科学家手动触发环节技能）；加上领航员，一切被串成连贯航程。'),
  h2('7.3　一灵多体'),
  tbl([2700, 3100, 3226],
    ['场景', '化身', '说明'],
    [
      ['Claude Code / Codex', '技能包＋MCP 入口', '第一阶段即可用，轻装上阵'],
      ['SciWork Desktop（第二阶段）', '常驻智能体', '同一份定义编译为系统提示词；运行时五组件：Loop 核心（模型可配置）、MCP Client 管理、技能装载、会话存储、触发器＋通知'],
      ['实验室服务器（第三阶段）', '空间级服务', '多用户共享、装置回流之家']
    ]),
  p('灵魂、记忆、法度全程不变，变的只有躯体——agent loop 是工作台的部件（百行级通用循环：模型 API 客户端＋工具执行器＋系统提示词组装＋历史管理），不是领航员的一部分；依赖不等于从属。'),
  h2('7.4　常驻形态的自主性政策（三档）'),
  tbl([1700, 3700, 3626],
    ['档位', '无人在场时可做', '例子'],
    [
      ['自由', '只读消化＋草稿产出', '读取完成 run 的结果、起草分析 artifact（标记 draft）、更新 logbook、准备推送摘要'],
      ['禁止', '一切推进轮次的写入', '不回流、不开新轮、不提交任何 run、不动协议'],
      ['永远禁止', '物理与审批', 'run_approve、physical 提交——连有人在场都受限']
    ]),
  p('不变量：常驻形态用同样的 MCP 工具、过同样的闸门、受同样的法度约束——驻留给的是「在场时间」，不是「权力」。'),
  pageBreak()
);

// 8 科学发现闭环
children.push(
  h1('8　科学发现闭环'),
  p('闭环（文献阅读→分析→方案设计→装置实验→数据采集→数据分析→新一轮）是项目尺度的构造，不是会话尺度：一轮迭代横跨数天、数个会话。设计三支柱：环的记忆在资源层（图谱即闭环的持久化状态），环的分段是技能（每段终点天然是人的停点），环的推进者是人（领航员辅助定位与建议，不代决策）。'),
  codeBlock([
    '第 N 轮（图谱中一条完整证据链）:',
    'Objective -> LiteratureEvidence -> ReportClaim(综述)',
    '          -> Hypothesis -> Protocol -> Run -> Observation/Result',
    '          -> Analysis -> NextSuggestion',
    '                              |  派生（带溯源边）',
    '第 N+1 轮: 新 Objective(round=N+1) -> 带着上一轮的问题定向检索 -> ...'
  ]),
  bullet('轮次以节点 round 属性轻量表达；轮与轮靠「建议→新目标」的边连成螺旋。'),
  bullet('段与段之间传递的不是内存变量，而是图谱里带溯源的节点——三段可在三个会话完成，中断无损。'),
  bullet('新一轮文献阅读≠重新开始：检索词从上一轮 NextSuggestion 与异常观测派生（带着问题去读文献），该知识编码在领航员技能中。'),
  bullet('Bounded Autonomous Loop（未来）：在声明边界内把「建议并等人确认」切换为「自行推进」——只是策略开关，环的记忆/分段/溯源全部复用，physical 审批闸门依然焊死。'),
  pageBreak()
);

// 9 治理与安全
children.push(
  h1('9　治理与安全'),
  h2('9.1　运行状态机（8 状态）'),
  codeBlock([
    'run_submit ──┬─ simulation ─────────────────────────────┐',
    '             │                                          v',
    '             └─ physical ──> awaiting-approval ──────> queued ─> running ─> completed | failed',
    '                              │      (run_approve 通过)            ⇅ paused',
    '                              └─> rejected (拒绝)                 └─> aborted (run_control)'
  ]),
  bullet('run_submit 内部先做参数校验（对照 DeviceProfile 的 JSONSchema），失败返回 validation 错误不建 run；run_validate 为无副作用预检。'),
  bullet('时间线物化（无常驻执行器）：提交时驱动一次性生成带绝对时间戳的完整事件时间线写库，查询时惰性揭示与推进——任何实例、任何时刻查询状态一致；stdio 短生命周期不再是约束；真实装置阶段执行在远端，天然兼容。'),
  bullet('审批必出带外的人：run_approve 必填 confirmed_by；技能统一约定 LLM 不得自行调用；特权操作（approve / control / physical submit）全部写 audit_log。'),
  h2('9.2　闸门总表'),
  tbl([3000, 3000, 3026],
    ['闸门', '强度', '审计'],
    [
      ['physical 运行审批', '人工批准（Queue With Approval 默认策略）', 'audit_log＋approvals'],
      ['项目图→组图晋升', '科学家批准', '晋升记录＋溯源'],
      ['组图→公开图晋升', 'PI＋脱敏＋不可逆确认（最重）', '晋升记录＋审计'],
      ['公开图→SciGraph 投稿', '投稿管道双侧审核；写凭证永不进工作台', '双侧审计'],
      ['本体修订', '人批闸门＋版本历史', '修订记录']
    ]),
  pageBreak()
);

// 10 发行与部署
children.push(
  h1('10　发行与部署'),
  h2('10.1　发行版：七个包'),
  tbl([2700, 3500, 2826],
    ['包', '内容', '单独使用价值'],
    [
      ['@scicompass/core', '工程语法：zod 合同、溯源 URI 规范、存储约定、领域类型', '让其它模块「合得起来」'],
      ['@scicompass/labontology', '本体服务：ontology_get/check、统一图写入校验、演进与版本', '领域规则引擎'],
      ['@scicompass/labkag', '知识引擎：三级图库、查询/写入/晋升/锚定/导出、产物协议结果记录', '团队实验知识图谱工具'],
      ['@scicompass/labharness', '驾驭引擎（特权模块）：规则图、装置注册表、状态机、审批、审计、网关', '给装置 MCP 加一道闸门'],
      ['@scicompass/lablibrary', '私域文献：导入（file/DOI/BibTeX）、FTS5 检索、文件区', '课题组文献管理'],
      ['@scicompass/skills', '内置技能基线：领航员＋通用环节＋装置技能（按空间选装）', '纯知识场景只装技能'],
      ['scicompass（CLI）', '安装器/组合器/启动器；bin 双别名 scicompass 与 luopan', '把模块组成整体的那只手']
    ]),
  h2('10.2　数据之家'),
  codeBlock([
    '~/.scicompass/',
    '├── scicompass.db                    # 主库：图谱注册表、项目、装置、文献元数据、runs、审计',
    '├── graphs/',
    '│   ├── labgraph-prj-<slug>.db       # 项目图 × N',
    '│   ├── labgraph-grp-<slug>.db       # 组图',
    '│   ├── labgraph-grp-<slug>-open.db  # 公开图（即发布物）',
    '│   └── harness-rules-<slug>.db      # 驾驭规则图（规则亦图）',
    '├── ontology/                        # 激活本体版本 + 修订历史',
    '├── library/<projectId>/             # 文献原文件',
    '├── runs/<runId>/                    # 实验原始数据',
    '├── skills/                          # 动态安装的技能（团队自增）',
    '└── config.yaml                      # 空间归属、订阅图谱集、已登记宿主'
  ]),
  h2('10.3　安装配方'),
  p('安装的本质是三个动作：配服务（MCP 配置写进宿主）、装技能（markdown 入宿主技能目录）、定数据家（初始化 ~/.scicompass）。'),
  codeBlock([
    '# Claude Code（命令行）',
    'npx scicompass init --host claude-code',
    '#   写入 .mcp.json（scicompass-kag + scicompass-harness 两个 stdio 入口）',
    '#   链接 .claude/skills/ ；写 CLAUDE.md 罗盘到场约定',
    'claude   ->  /luopan  （或 /scicompass，或直接说「继续我的 MOF 项目」）',
    '',
    '# Claude Desktop（桌面应用）',
    'npx scicompass bundle --host claude-desktop',
    '#   产出 scicompass.mcpb（一键安装包）-> 设置-扩展 安装',
    '#   产出 scicompass-skills.zip -> 设置-功能-Skills 导入',
    '',
    '# Codex / openclaw',
    'npx scicompass init --host codex      # config.toml + AGENTS.md + skills',
    'npx scicompass init --host openclaw',
    '',
    '# 纯 CLI / 自研宿主',
    'scicompass serve --http 4517          # 任何 MCP client 可连',
    'scicompass serve --modules labkag,labontology   # 只挂知识，不挂装置治理',
    '',
    '# 动态技能管理',
    'scicompass skill add <路径|git|registry>',
    'scicompass skill list / remove'
  ]),
  p('SciWork Desktop 出厂内嵌（vendored scicompass＋预跑 init --host sciwork），用户无感。两类客户端共用 ~/.scicompass——早上在 Claude Code 推进的实验，下午在 Claude Desktop 问罗盘，它全记得。'),
  h2('10.4　与 SciWork 的关系'),
  p('分仓、分版、单向依赖：SciWork 依赖 SciCompass，SciCompass 永不知道 SciWork 存在。第一阶段在现仓库内以目录边界模拟分家（scicompass/ 子树零依赖 sciwork 代码），验证后物理拆分为独立仓库。'),
  pageBreak()
);

// 11 IP 边界
children.push(
  h1('11　知识产权与开放边界'),
  p('基模是租来的引擎，LabGraph 是各团队的庄稼；AI 团队拥有的是土地的形状、灌溉的规则、种子的标准、集市的位置——科学家贡献内容，我们贡献形式；内容属于他们，形式的网络属于我们。'),
  h2('11.1　五项核心资产'),
  tbl([2700, 3300, 3026],
    ['资产', '内容', '策略'],
    [
      ['知识的语法', 'LabGraph 结构、胶囊约定、溯源 URI、SCP Profile、技能格式', '开放（标准制定者位置；护城河在参考实现与网络）'],
      ['治理 Harness', 'LabOntology 框架、闸门机制、审计、脱敏管线', '自持（自动化科学的准入执照）'],
      ['SciGraph', '世界坐标系＋实验验证新大陆', '数据资产皇冠；网络效应'],
      ['方法论语料', '技能体系＋领航员（活的、随使用进化）', '自持，持续版本化'],
      ['过程语料＋真实 Verifier', '完整闭环科学过程数据＋物理世界奖励信号', '通往自研科学基模之路（终局资产）']
    ]),
  h2('11.2　三条让渡线（信任地基）'),
  bullet('项目图与组图的内容权属归科学家团队——技术上存储隔离，合同上白纸黑字。'),
  bullet('聚合权利只来自公开图（定义即公开）＋经同意的脱敏过程元数据；尽早设计贡献者协议与遥测同意机制。'),
  bullet('标准开放、实现自持：schema/SDK/技能格式开源换生态；治理管线、SciGraph、聚合服务、过程语料闭环自持。'),
  h2('11.3　闭环中的五处签名'),
  tbl([2300, 3300, 3426],
    ['环节', '科学家贡献', 'AI 团队贡献'],
    [
      ['提问与假设', '科学直觉与判断', '全局记忆与世界坐标随手可得'],
      ['实验执行', '实验设计取舍', '让 LLM 碰装置变得安全合法（治理 harness）'],
      ['知识沉淀', '结论裁决', '让知识可复利（蒸馏/溯源/晋升）'],
      ['方法传承', '领域经验', '让最佳实践可复制（技能包）'],
      ['智能本身', '使用与反馈', '让智能可进化（过程语料＋真实 verifier→自研科学基模）']
    ]),
  pageBreak()
);

// 12 阶段规划与打样
children.push(
  h1('12　阶段规划与打样'),
  h2('12.1　三阶段'),
  tbl([1500, 4000, 3526],
    ['阶段', '交付', '说明'],
    [
      ['第一阶段', 'scicompass 发行版 v0.1：七包、双 MCP 入口、内置技能、CLI 安装器（claude-code 优先）、麻生明组打样', '能力先行；用 Claude Code/Codex 作现成工作台验证全链路；接口真实、外部依赖可 mock 双轨'],
      ['第二阶段', 'SciWork Desktop 常驻智能体（自研薄 loop，模型可配置）；SciGraph 投稿管道；Claude Desktop .mcpb 打包完善', '同一份领航员定义的常驻实例化；触发器＋通知＋三档自主性政策'],
      ['第三阶段', '空间级部署（--http 服务化、多用户）；Bounded Autonomous Loop；技能市场与生态', '价值持续从引擎迁移到船']
    ]),
  h2('12.2　首个打样：麻生明院士课题组 × 晶泰装置'),
  p('打样技能 xtalpi-synthesis，直接对接真装置（API 已通、已 MCP 化）。范围为一条最小完整闭环：文献定向检索 → 反应方案设计 → 本体校验（化学规则集第一版）→ 经 labharness 提交晶泰装置 → 数据回采 →（HPLC 等未打通环节走人工衔接路径）→ 回流 LabGraph → 下一轮建议。'),
  bullet('需方提供三项输入：晶泰 MCP 工具清单与参数 schema 文档；课题组 2-3 个典型实验场景；化学安全红线清单（LabOntology 化学空间规则集种子）。'),
  h2('12.3　风险与开放问题'),
  bullet('品牌：OpenCompass 团队知会与家族定调；SciCompass 中/美商标检索；npm/PyPI/域名占用核验。'),
  bullet('SciGraph：投稿机制细则与 Experiment-Verified KG 收录标准（建议复用三道闸门＋溯源完整性）；锚定 URI 命名空间的演化兼容。'),
  bullet('装置：四套装置 MCP 工具文档齐备度；晶泰场景与安全红线材料到位时间。'),
  bullet('法务：贡献者协议、遥测同意机制、open 图默认许可证选型。'),
  bullet('工程：luopan 命令别名在各宿主的实现方式；Claude Desktop skills 导入流程随官方版本演化跟进。'),
  pageBreak()
);

// 13 术语表
children.push(
  h1('13　术语表'),
  tbl([2600, 6426],
    ['术语', '定义'],
    [
      ['SciCompass（科学罗盘）', '独立于 UI 与 LLM 的科学智能体系＋领航员人格；命令 scicompass / luopan'],
      ['SciWork', '桌面工作台产品（港口之一），依赖 SciCompass，反向不依赖'],
      ['SciGraph', '浦江公共科学知识图谱 MCP 服务（星图），65+ 图谱，自有写权限'],
      ['LabGraph', '实验室知识体系总体：LabOntology＋LabKAG＋LabHarness'],
      ['LabOntology', '本体层：词汇/领域约束/过程约束三层 schema 权威，版本化演进'],
      ['LabKAG', '知识引擎：三级图库（项目/组/公开）的数据平面'],
      ['LabHarness', '驾驭引擎：规则图＋装置治理网关＋状态机＋审批＋审计（特权模块）'],
      ['数据之家', '~/.scicompass/ 运行时数据目录，跨工作台连续性所在'],
      ['蒸馏晋升', 'graph_promote：把项目知识再表达为泛化胶囊写入上级图，原图不动'],
      ['头节点胶囊', '组图/公开图中一份蒸馏知识的载体：Lesson/Method/Prior/NegativeResult 头节点＋内部子图'],
      ['锚定', 'LabGraph 实体携带 scigraph_anchor URI 对齐世界星图'],
      ['时间线物化', '提交时生成带绝对时间戳的完整事件脚本，查询时惰性揭示推进——无常驻执行器'],
      ['Queue With Approval', '默认执行策略：physical 运行必停 awaiting-approval，人工批准后执行'],
      ['一灵多体', '领航员定义（SKILL.md）与运行时分离：技能包/常驻智能体/空间级服务三化身'],
      ['SuperScientist 公式', 'SuperScientist ＝ 动力引擎 × 罗盘 ＝ 通用基模 × SciCompass']
    ])
);

// ------------------------------ 组装 ------------------------------
const doc = new Document({
  creator: 'SciWork 设计组 × Claude',
  title: 'SciCompass（科学罗盘）概要设计文档 v1.0',
  description: '生成日期 2026-06-12',
  styles: {
    default: {
      document: { run: { font: ZH, size: 21 }, paragraph: { spacing: { after: 120, line: 320 } } }
    },
    paragraphStyles: [
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 32, bold: true, font: ZH },
        paragraph: { spacing: { before: 320, after: 200 }, outlineLevel: 0 } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 26, bold: true, font: ZH },
        paragraph: { spacing: { before: 240, after: 160 }, outlineLevel: 1 } },
      { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 23, bold: true, font: ZH },
        paragraph: { spacing: { before: 200, after: 120 }, outlineLevel: 2 } }
    ]
  },
  numbering: {
    config: [
      { reference: 'bullets',
        levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 600, hanging: 300 } } } }] },
      { reference: 'numbers',
        levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 600, hanging: 300 } } } }] }
    ]
  },
  sections: [{
    properties: {
      page: {
        size: { width: 11906, height: 16838 }, // A4
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
      }
    },
    headers: {
      default: new Header({
        children: [new Paragraph({
          alignment: AlignmentType.RIGHT,
          children: [r('SciCompass 概要设计 v1.0 · 2026-06-12', { size: 16, color: '808080' })]
        })]
      })
    },
    footers: {
      default: new Footer({
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            r('第 ', { size: 16, color: '808080' }),
            new TextRun({ children: [PageNumber.CURRENT], font: ZH, size: 16, color: '808080' }),
            r(' 页', { size: 16, color: '808080' })
          ]
        })]
      })
    },
    children
  }]
});

Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync(OUT, buffer);
  console.log('WROTE', OUT, buffer.length, 'bytes');
});
