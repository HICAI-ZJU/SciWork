import type { LiteratureItem, Project, ScientificSpace, ScienceSession } from './types';

export const demoSpace: ScientificSpace = {
  id: 'zju-qiushi-robot-lab',
  name: '浙江大学自动化反应发现空间',
  domain: '面向温和合成条件优化的智能科学装置',
  device: '求是智能实验装置 · 机器人合成平台',
  policy: 'Queue With Approval'
};

export const demoProject: Project = {
  id: 'mild-cross-coupling-demo',
  spaceId: demoSpace.id,
  name: '温和条件下偶联反应优化演示项目',
  objective: '寻找温和、短时、转化稳定且证据链可追溯的偶联反应条件。',
  directory: 'projects/mild-cross-coupling-demo'
};

export const demoProjects: Project[] = [
  demoProject,
  {
    id: 'flow-scale-screening',
    spaceId: demoSpace.id,
    name: '连续流筛选与放大验证项目',
    objective: '在保持安全边界的前提下，比较不同催化体系的连续流转化稳定性。',
    directory: 'projects/flow-scale-screening'
  }
];

export const demoSessions: ScienceSession[] = [
  {
    id: 'session-literature-to-protocol',
    projectId: 'mild-cross-coupling-demo',
    title: '任务 1：文献到方案',
    objective: '完成偶联反应条件的 SciGraph 对齐与方案生成。',
    status: 'active',
    updatedAt: '今天 09:40'
  },
  {
    id: 'session-risk-and-queue',
    projectId: 'mild-cross-coupling-demo',
    title: '任务 2：风险收敛测试',
    objective: '围绕温和窗口补齐 Queue 与执行顺序约束。',
    status: 'idle',
    updatedAt: '今天 09:12'
  },
  {
    id: 'session-flow-baseline',
    projectId: 'flow-scale-screening',
    title: '任务 A：连续流基线建立',
    objective: '构建连续流基线实验方案并回流关键观测点。',
    status: 'queued',
    updatedAt: '昨天 16:05'
  }
];

export const demoLiterature: LiteratureItem[] = [
  {
    id: 'lit-001',
    title: '自动化偶联反应筛选中的溶剂效应',
    source: '私域文献笔记',
    year: 2024,
    abstract: '私域筛选记录显示，极性非质子溶剂在降低催化剂用量时仍能提升转化率，并保持可控杂质水平。',
    evidenceTags: ['溶剂', '转化率', '筛选']
  },
  {
    id: 'lit-002',
    title: '快速反应优化中的催化剂用量边界',
    source: '内部方法总结',
    year: 2023,
    abstract: '较低催化剂用量可以降低成本，但会增加批次波动。自动化采样支持提前终止低转化率实验。',
    evidenceTags: ['催化剂', '成本', '自动化']
  },
  {
    id: 'lit-003',
    title: '温和合成化学流程中的温度窗口',
    source: '精选文献摘录',
    year: 2022,
    abstract: '45 到 65 C 的中等温度窗口通常能平衡反应速率、杂质控制和仪器稳定性。',
    evidenceTags: ['温度', '安全', '收率']
  },
  {
    id: 'lit-004',
    title: '利用在线转化率监测压缩反应时间',
    source: '仪器应用说明',
    year: 2024,
    abstract: '当转化率在计划终点前进入平台期时，在线监测可以支持缩短反应时间的决策。',
    evidenceTags: ['反应时间', '监测', '仪器']
  },
  {
    id: 'lit-005',
    title: '自动化反应队列中的碱选择与杂质风险',
    source: '专利分析备忘录',
    year: 2021,
    abstract: '碱的选择会改变杂质谱。备忘录建议在提交队列前检查碱与溶剂的兼容性。',
    evidenceTags: ['碱', '杂质', '队列']
  },
  {
    id: 'lit-006',
    title: '面向模拟化学规划的收率置信度评分',
    source: 'SciWork 种子数据集',
    year: 2025,
    abstract: '结合文献证据、Ontology 约束和运行观测，可以提升下一轮实验建议的置信度评分。',
    evidenceTags: ['收率', '置信度', 'Experimental Graph']
  }
];
