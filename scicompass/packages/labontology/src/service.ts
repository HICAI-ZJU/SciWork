import { loadOntology, type Ontology } from './load.js';
import { validateNodes, validateEdgeLabels, checkIntent, type NodeLike, type Intent } from './validate.js';

// 给 MCP 层用的薄封装；激活本体 v0.1 固定 chemistry/v1，后续由空间配置决定
export class OntologyService {
  readonly ontology: Ontology;

  constructor(space = 'chemistry', version = 'v1') {
    this.ontology = loadOntology(space, version);
  }

  get(): Ontology {
    return this.ontology;
  }

  validateGraphWrite(nodes: NodeLike[], edgeLabels: string[]): string[] {
    return [...validateNodes(this.ontology, nodes), ...validateEdgeLabels(this.ontology, edgeLabels)];
  }

  check(intent: Intent) {
    return checkIntent(this.ontology, intent);
  }
}
