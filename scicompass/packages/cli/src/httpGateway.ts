import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import type { AddressInfo } from 'node:net';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { buildServer, type ServeOpts } from './serve.js';

// 面向非 LLM 客户端（SciWork UI 等）的薄 HTTP 网关。
// 不重复实现工具：进程内用 InMemoryTransport 连一个 MCP client，把 HTTP 请求转发给
// 同一个 MCP server——工具定义、本体校验、闸门、溯源全部复用，UI 与 LLM 看到的是同一套能力。
export interface HttpGateway {
  port: number;
  close: () => Promise<void>;
}

async function readJson(req: IncomingMessage): Promise<any> {
  const chunks: Buffer[] = [];
  for await (const c of req) chunks.push(c as Buffer);
  const raw = Buffer.concat(chunks).toString('utf8').trim();
  return raw ? JSON.parse(raw) : {};
}

function send(res: ServerResponse, status: number, body: unknown) {
  const json = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(json);
}

export async function startHttpGateway(opts: ServeOpts, port: number): Promise<HttpGateway> {
  const server = buildServer(opts);
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: 'scicompass-http-gateway', version: '0.1.0' });
  await Promise.all([client.connect(clientTransport), server.connect(serverTransport)]);

  const toolList = await client.listTools();

  const http = createServer(async (req, res) => {
    try {
      if (req.method === 'OPTIONS') { send(res, 204, {}); return; }
      const url = new URL(req.url ?? '/', `http://localhost:${port}`);

      if (req.method === 'GET' && url.pathname === '/health') {
        send(res, 200, { ok: true, service: 'scicompass', modules: opts.modules, tools: toolList.tools.length });
        return;
      }
      if (req.method === 'GET' && url.pathname === '/api/tools') {
        send(res, 200, { ok: true, tools: toolList.tools.map((t) => ({ name: t.name, description: t.description })) });
        return;
      }
      // 统一调用入口：POST /api/call { name, arguments }
      if (req.method === 'POST' && url.pathname === '/api/call') {
        const body = await readJson(req);
        if (!body.name || typeof body.name !== 'string') {
          send(res, 400, { ok: false, error: 'missing tool name' });
          return;
        }
        const result: any = await client.callTool({ name: body.name, arguments: body.arguments ?? {} });
        const text = result.content?.[0]?.text ?? 'null';
        if (result.isError) {
          send(res, 200, { ok: false, error: text });
          return;
        }
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
    close: () => new Promise<void>((resolve) => http.close(() => resolve()))
  };
}
