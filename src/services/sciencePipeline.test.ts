import { demoLiterature, demoProject } from '../domain/demoData';
import { buildExperimentalGraph } from './experimentalGraphStore';
import { validateProtocol } from './labOntologyAdapter';
import { designProtocol } from './protocolDesigner';
import { generateResearchReport } from './reportService';
import { analyzeLiterature } from './scigraphAdapter';
import { runSimulation } from './simulationEngine';

describe('mock scientific service pipeline', () => {
  it('runs from private literature to Experimental Graph with traceable evidence', async () => {
    const analysis = await analyzeLiterature(demoLiterature);
    expect(analysis.entities.length).toBeGreaterThanOrEqual(5);
    expect(analysis.evidence.length).toBeGreaterThanOrEqual(3);

    const report = generateResearchReport(demoProject, demoLiterature, analysis);
    expect(report.evidenceIds.length).toBeGreaterThan(0);
    expect(report.candidateDirections[0]).toMatch(/温和/);

    const protocol = designProtocol(report, '希望保持温和条件并缩短反应时间');
    expect(protocol.parameters.temperature).toBe('55 C');
    expect(protocol.safetyNotes).toContain('仅模拟执行：不会提交到真实物理装置。');

    const validation = await validateProtocol(protocol);
    expect(validation.status).toBe('warning');
    expect(validation.constraints).toContain('真实物理执行前必须经过 Queue With Approval 审批。');

    const run = await runSimulation(protocol);
    expect(run.status).toBe('completed-with-warning');
    expect(run.yieldPercent).toBeGreaterThanOrEqual(70);

    const graph = buildExperimentalGraph({
      project: demoProject,
      literature: demoLiterature,
      analysis,
      report,
      protocol,
      validation,
      run
    });

    expect(graph.nodes.some((node) => node.type === 'LiteratureEvidence')).toBe(true);
    expect(graph.nodes.some((node) => node.type === 'Result')).toBe(true);
    expect(graph.edges.some((edge) => edge.label === 'supports')).toBe(true);
  });
});
