import type { EvidenceLink, LiteratureItem, SciGraphAnalysis, SciGraphEntity } from '../domain/types';

export async function analyzeLiterature(literatureSet: LiteratureItem[]): Promise<SciGraphAnalysis> {
  const entities: SciGraphEntity[] = [
    { id: 'entity-reaction-cross-coupling', label: '偶联反应', type: 'reaction', confidence: 0.92 },
    { id: 'entity-solvent-polar-aprotic', label: '极性非质子溶剂', type: 'solvent', confidence: 0.88 },
    { id: 'entity-catalyst-low-loading', label: '低催化剂用量', type: 'catalyst', confidence: 0.84 },
    { id: 'entity-temp-moderate', label: '45-65 C 温度窗口', type: 'condition', confidence: 0.9 },
    { id: 'entity-device-online-monitoring', label: '在线转化率监测', type: 'instrument', confidence: 0.86 }
  ];

  const evidence: EvidenceLink[] = literatureSet.slice(0, 5).map((item, index) => ({
    id: `evidence-${index + 1}`,
    literatureId: item.id,
    quote: item.abstract,
    claim: item.evidenceTags.join(', '),
    confidence: 0.78 + index * 0.03
  }));

  return {
    entities,
    evidence,
    publicKnowledge: [
      'SciGraph 对齐：中等温度窗口可降低该类反应的杂质风险。',
      'SciGraph 对齐：在线转化率监测可以缩短低价值实验运行。',
      'SciGraph 对齐：提交队列前需要检查溶剂和碱的兼容性。'
    ]
  };
}
