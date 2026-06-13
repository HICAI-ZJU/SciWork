import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { OntologyService } from '@scicompass/labontology';
import { KagService, Records } from '@scicompass/labkag';
import { DeviceRegistry, RunService } from '@scicompass/labharness';
import { Library } from '@scicompass/lablibrary';
import { registerKnowledge } from './mcp/registerKnowledge.js';
import { registerHarness } from './mcp/registerHarness.js';

export interface ServeOpts {
  dataHome: string;
  modules: ('knowledge' | 'harness')[];
  template?: string;
  clock?: () => number;
}

// 罗盘不产生推力：本服务永不调用 LLM，只提供工具与数据
export function buildServer(opts: ServeOpts): McpServer {
  const server = new McpServer({ name: 'scicompass', version: '0.1.0' });
  const ontology = new OntologyService();
  const kag = new KagService(opts.dataHome, ontology);
  const records = new Records(opts.dataHome);
  const library = new Library(opts.dataHome);
  const devices = new DeviceRegistry(opts.dataHome);
  if (opts.template) devices.loadTemplate(opts.template);
  const runs = new RunService(opts.dataHome, devices, records, opts.clock);
  if (opts.modules.includes('knowledge')) registerKnowledge(server, { ontology, kag, records, library });
  if (opts.modules.includes('harness')) registerHarness(server, { devices, runs });
  return server;
}
