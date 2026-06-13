import { startSidecar } from './dist-electron/scicompassSidecar.js';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { mkdtempSync } from 'node:fs';

const cliMain = join(process.cwd(), 'scicompass', 'packages', 'cli', 'dist', 'main.js');
const dataHome = mkdtempSync(join(tmpdir(), 'sidecar-verify-'));

console.log('[verify] starting sidecar...');
const sc = await startSidecar({ cliMain, dataHome });
console.log('[verify] sidecar baseUrl =', sc.baseUrl);

const call = async (name, args = {}) => {
  const r = await fetch(`${sc.baseUrl}/api/call`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, arguments: args })
  });
  return r.json();
};
const health = await (await fetch(`${sc.baseUrl}/health`)).json();
console.log('[verify] /health =', JSON.stringify(health));
const dev = await call('device_list');
console.log('[verify] device_list ok =', dev.ok, '装置数 =', dev.data?.devices?.length);
const proj = await call('project_create', { name: 'sidecar-hosted', objective: 'Electron 托管验证' });
console.log('[verify] project_create =', JSON.stringify(proj.data));

sc.stop();
console.log('[verify] sidecar stopped — checking it is gone...');
await new Promise((r) => setTimeout(r, 1500));
try {
  await fetch(`${sc.baseUrl}/health`);
  console.log('[verify] WARNING: gateway still responding after stop');
} catch {
  console.log('[verify] OK: gateway no longer reachable after stop');
}
process.exit(0);
