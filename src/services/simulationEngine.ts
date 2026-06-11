import type { ProtocolDraft, SimulationRunResult } from '../domain/types';

export async function runSimulation(protocol: ProtocolDraft): Promise<SimulationRunResult> {
  return {
    id: 'simulation-run-001',
    protocolId: protocol.id,
    status: 'completed-with-warning',
    yieldPercent: 76,
    conversionPercent: 84,
    confidence: 0.81,
    events: [
      {
        id: 'event-queued',
        time: '00:00',
        label: '进入模拟队列',
        detail: '实验方案已进入模拟 Queue With Approval 流程。',
        severity: 'info'
      },
      {
        id: 'event-approved',
        time: '00:03',
        label: '模拟审批通过',
        detail: '演示流程中的人工审批节点已确认。',
        severity: 'info'
      },
      {
        id: 'event-monitoring',
        time: '00:45',
        label: '检测到转化率平台期',
        detail: '模拟监测显示转化率在计划终点前趋于稳定。',
        severity: 'warning'
      },
      {
        id: 'event-completed',
        time: '01:30',
        label: '模拟执行完成',
        detail: '预测收率足以支持下一轮收窄条件筛选。',
        severity: 'success'
      }
    ],
    interpretation:
      '温和条件获得了稳定的模拟转化率，杂质风险可控。下一轮应收窄溶剂选择，并测试略低的催化剂用量。'
  };
}
