import type { KagService } from './kag.js';

export function exportGraphMarkdown(kag: KagService, graph: string): string {
  const { nodes, edges } = kag.query({ graph, headOnly: false, limit: 500 });
  const lines = [`# LabGraph: ${graph}`, '', '## Nodes', ''];
  for (const n of nodes) {
    lines.push(`- **[${n.type}] ${n.label}** (${n.id}, round ${n.round})${n.detail ? ` — ${n.detail}` : ''}`);
  }
  lines.push('', '## Edges', '');
  for (const e of edges) {
    lines.push(`- ${e.source} —${e.label}→ ${e.target}`);
  }
  return lines.join('\n');
}
