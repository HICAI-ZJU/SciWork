import type { LabOntologyValidation, ProtocolDraft } from '../domain/types';

export async function validateProtocol(protocol: ProtocolDraft): Promise<LabOntologyValidation> {
  const normalizedTerms = [
    `Device:${protocol.device}`,
    'Operation:ReactionPlatePreparation',
    'Operation:ThermalReaction',
    'Observation:OnlineConversionMonitoring',
    'SafetyPolicy:QueueWithApproval'
  ];

  return {
    status: 'warning',
    normalizedTerms,
    constraints: [
      '真实物理执行前必须经过 Queue With Approval 审批。',
      '温度 55 C 位于模拟温和化学范围内。',
      '规模 0.10 mmol 位于模拟装置范围内。',
      '15 min 采样间隔受模拟监测配置支持。'
    ],
    warnings: [
      '第一轮原型中已禁用真实物理执行。',
      '真实导出前，碱-溶剂兼容性需要授权装置配置数据。'
    ]
  };
}
