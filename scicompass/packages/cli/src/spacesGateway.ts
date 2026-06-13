import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import type { AddressInfo } from 'node:net';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { readTemplate, type SpaceMeta } from '@scicompass/labharness';
import { buildServer } from './serve.js';
import { AccountStore } from './accounts.js';

// 多空间 HTTP 网关（给 SciWork UI）：物理隔离——每空间独立数据目录 <dataRoot>/<space>/，
// 各自一个进程内 MCP server+client（复用全部 31 工具）。登录校验账号→返回空间上下文，
// 调用按 space 路由到对应 client。stdio 单空间模式（Claude Code）不受影响。
export interface SpacesGatewayOptions {
  dataRoot: string;
  templatesDir: string;
  accountsFile: string;
  clock?: () => number;
}

export interface SpaceConfig extends SpaceMeta {
  devices: { id: string; name: string; kind: string }[];
}

export interface SpacesGateway {
  port: number;
  spaces: string[];
  close: () => Promise<void>;
}

async function readJson(req: IncomingMessage): Promise<any> {
  const chunks: Buffer[] = [];
  for await (const c of req) chunks.push(c as Buffer);
  const raw = Buffer.concat(chunks).toString('utf8').trim();
  return raw ? JSON.parse(raw) : {};
}

function send(res: ServerResponse, status: number, body: unknown) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify(body));
}

export async function startSpacesGateway(opts: SpacesGatewayOptions, port: number): Promise<SpacesGateway> {
  const accounts = new AccountStore(opts.accountsFile);
  const files = readdirSync(opts.templatesDir).filter((f) => f.endsWith('.yaml') && f !== 'accounts.yaml');

  const clients = new Map<string, Client>();
  const configs = new Map<string, SpaceConfig>();

  for (const f of files) {
    const file = join(opts.templatesDir, f);
    const meta = readTemplate(file);
    const server = buildServer({
      dataHome: join(opts.dataRoot, meta.space),
      modules: ['knowledge', 'harness'],
      template: file,
      clock: opts.clock
    });
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    const client = new Client({ name: `scicompass-${meta.space}`, version: '0.1.0' });
    await Promise.all([client.connect(clientTransport), server.connect(serverTransport)]);
    clients.set(meta.space, client);
    // 缓存装置 summary，登录后即可展示
    const dl: any = await client.callTool({ name: 'device_list', arguments: {} });
    const devices = JSON.parse(dl.content?.[0]?.text ?? '{}').devices ?? [];
    configs.set(meta.space, { ...meta, devices });
  }

  const toolCount = (await clients.values().next().value?.listTools())?.tools.length ?? 0;

  const http = createServer(async (req, res) => {
    try {
      if (req.method === 'OPTIONS') { send(res, 204, {}); return; }
      const url = new URL(req.url ?? '/', `http://localhost:${port}`);

      if (req.method === 'GET' && url.pathname === '/health') {
        send(res, 200, { ok: true, service: 'scicompass', spaces: [...clients.keys()], tools: toolCount });
        return;
      }
      if (req.method === 'GET' && url.pathname === '/api/spaces') {
        send(res, 200, { ok: true, spaces: [...configs.values()] });
        return;
      }
      if (req.method === 'POST' && url.pathname === '/api/login') {
        const body = await readJson(req);
        const account = accounts.verify(String(body.username ?? ''), String(body.password ?? ''));
        if (!account) { send(res, 401, { ok: false, error: '账号或密码错误' }); return; }
        const spaceConfig = configs.get(account.space) ?? null;
        send(res, 200, { ok: true, account, spaceConfig });
        return;
      }
      if (req.method === 'POST' && url.pathname === '/api/call') {
        const body = await readJson(req);
        const space = String(body.space ?? '');
        const client = clients.get(space);
        if (!client) { send(res, 400, { ok: false, error: `unknown or missing space: ${space || '(none)'}` }); return; }
        if (!body.name || typeof body.name !== 'string') { send(res, 400, { ok: false, error: 'missing tool name' }); return; }
        const result: any = await client.callTool({ name: body.name, arguments: body.arguments ?? {} });
        const text = result.content?.[0]?.text ?? 'null';
        if (result.isError) { send(res, 200, { ok: false, error: text }); return; }
        send(res, 200, { ok: true, data: JSON.parse(text) });
        return;
      }
      send(res, 404, { ok: false, error: `not found: ${req.method} ${url.pathname}` });
    } catch (e) {
      send(res, 500, { ok: false, error: String((e as Error)?.message ?? e) });
    }
  });

  await new Promise<void>((resolve) => http.listen(port, '127.0.0.1', resolve));
  const actualPort = (http.address() as AddressInfo).port;

  return {
    port: actualPort,
    spaces: [...clients.keys()],
    close: () => new Promise<void>((resolve) => http.close(() => resolve()))
  };
}
