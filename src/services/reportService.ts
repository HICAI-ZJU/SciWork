import type { LiteratureItem, Project, ResearchReport, SciGraphAnalysis } from '../domain/types';

export function generateResearchReport(
  project: Project,
  literature: LiteratureItem[],
  analysis: SciGraphAnalysis
): ResearchReport {
  return {
    question: project.objective,
    consensus: [
      '中等温度条件更有利于平衡转化率和杂质控制。',
      '溶剂选择是影响转化稳定性的主要变量。',
      '当转化率进入平台期时，在线监测支持缩短反应时间。'
    ],
    disagreements: [
      '降低催化剂用量有助于控制成本，但可能增加批次波动。',
      '私域文献中碱选择对杂质行为的影响并不完全一致。'
    ],
    uncertainties: [
      '具体溶剂-碱相互作用仍需在目标装置配置下验证。',
      '第一轮原型的置信度主要来自模拟观测，而非真实物理执行。'
    ],
    candidateDirections: [
      '在 55 C 下开展温和偶联反应条件筛选，并启用在线转化率监测。',
      '设置低催化剂用量分支，并使用提前终止监测。',
      '围绕杂质风险设计碱兼容性验证分支。'
    ],
    designRationale: [
      `报告使用 ${literature.length} 篇私域文献。`,
      `SciGraph 贡献了 ${analysis.entities.length} 个对齐实体和 ${analysis.publicKnowledge.length} 条公开知识提示。`,
      '推荐的首轮方案优先考虑温和条件、较短运行时间和队列安全校验。'
    ].join(' '),
    evidenceIds: analysis.evidence.map((item) => item.id)
  };
}
