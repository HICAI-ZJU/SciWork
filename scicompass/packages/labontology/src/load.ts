import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';

// src/ 与 dist/ 都位于包根下一层，'..' 均回到包根
const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'ontologies');

export interface Ontology {
  space: string;
  version: string;
  nodeTypes: string[];
  edgeLabels: string[];
  provenanceRequired: string[];
  constraints: {
    forbiddenPairs: string[][];
    parameterBounds: Record<string, { min: number; max: number }>;
    processRules: { id: string; text: string }[];
  };
}

export function loadOntology(space: string, version: string): Ontology {
  const dir = join(root, space, version);
  const vocab = parse(readFileSync(join(dir, 'vocabulary.yaml'), 'utf8'));
  const constraints = parse(readFileSync(join(dir, 'constraints.yaml'), 'utf8'));
  return { ...vocab, constraints };
}
