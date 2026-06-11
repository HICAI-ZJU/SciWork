import type { ProtocolDraft, ResearchReport } from '../domain/types';

export function designProtocol(report: ResearchReport, userConstraint: string): ProtocolDraft {
  const wantsShortRun = /short|shorter|短|快|缩短/i.test(userConstraint);

  return {
    id: 'protocol-mild-cross-coupling-001',
    objective: report.question,
    reactionSystem: '自动化温和偶联反应条件筛选',
    reagents: ['芳基卤化物底物', '有机硼偶联试剂', '碳酸盐碱'],
    catalysts: ['低负载钯催化剂'],
    solvents: ['极性非质子溶剂候选 A', '极性非质子溶剂候选 B'],
    device: '求是智能实验装置 · 机器人合成平台',
    parameters: {
      temperature: '55 C',
      reactionTime: wantsShortRun ? '90 min' : '120 min',
      samplingInterval: '15 min',
      scale: '0.10 mmol',
      atmosphere: 'inert'
    },
    steps: [
      {
        id: 'step-prepare',
        label: '准备反应板',
        detail: '按照模拟装置映射加入底物、偶联试剂、碱、溶剂和催化剂。',
        durationMinutes: 20
      },
      {
        id: 'step-react',
        label: '执行反应',
        detail: '升温到 55 C，并每 15 分钟监测一次转化率。',
        durationMinutes: wantsShortRun ? 90 : 120
      },
      {
        id: 'step-analyze',
        label: '分析样品',
        detail: '使用模拟在线监测数据估算转化率和杂质风险。',
        durationMinutes: 25
      }
    ],
    safetyNotes: [
      '任何真实物理执行前都需要 Queue With Approval 审批。',
      '仅模拟执行：不会提交到真实物理装置。',
      '导出真实方案前需要检查碱和溶剂兼容性。'
    ]
  };
}
