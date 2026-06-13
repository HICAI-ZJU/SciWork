import { spawn } from 'node:child_process';

export interface Sidecar {
  baseUrl: string;
  stop: () => void;
}

export interface SidecarOptions {
  /** scicompass CLI 入口（dist/main.js）绝对路径 */
  cliMain: string;
  /** 数据之家目录（生产用 app.getPath('userData')/scicompass） */
  dataHome: string;
  /** 空间模板名，默认 fudan-xtalpi */
  template?: string;
  /** node 可执行文件；默认系统 node（开发环境）。打包后可指向内置 node。 */
  nodeBin?: string;
  /** 启动超时（毫秒） */
  timeoutMs?: number;
}

/**
 * 在 Electron 主进程中托管 scicompass HTTP 网关 sidecar。
 * 用 --http 0 让 OS 分配空闲端口，从 stdout 的 SCICOMPASS_GATEWAY_PORT= 行解析实际端口，
 * 返回 baseUrl 与 stop()。永不在 renderer 暴露子进程，端口经 main 注入。
 */
export function startSidecar(opts: SidecarOptions): Promise<Sidecar> {
  return new Promise<Sidecar>((resolve, reject) => {
    const node = opts.nodeBin ?? process.env.SCICOMPASS_NODE ?? 'node';
    const args = [
      opts.cliMain, 'serve', '--http', '0',
      '--data-home', opts.dataHome,
      '--template', opts.template ?? 'fudan-xtalpi'
    ];
    const child = spawn(node, args, { stdio: ['ignore', 'pipe', 'pipe'] });

    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      try { child.kill(); } catch { /* noop */ }
      reject(new Error('scicompass sidecar start timeout'));
    }, opts.timeoutMs ?? 20000);

    child.stdout.on('data', (buf: Buffer) => {
      const m = /SCICOMPASS_GATEWAY_PORT=(\d+)/.exec(buf.toString());
      if (m && !settled) {
        settled = true;
        clearTimeout(timer);
        resolve({
          baseUrl: `http://127.0.0.1:${m[1]}`,
          stop: () => { try { child.kill(); } catch { /* noop */ } }
        });
      }
    });
    child.stderr.on('data', (buf: Buffer) => {
      process.stderr.write(`[scicompass] ${buf}`);
    });
    child.on('error', (e) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(e);
    });
    child.on('exit', (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(new Error(`scicompass sidecar exited early (code ${code})`));
    });
  });
}
