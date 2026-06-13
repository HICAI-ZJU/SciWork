import { app, BrowserWindow, Menu } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { APP_DISPLAY_NAME, APP_ICON_ASSET_PATH, APP_USER_MODEL_ID, APP_WINDOW_TITLE } from './appIdentity.js';
import { startSidecar, type Sidecar } from './scicompassSidecar.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let sidecar: Sidecar | null = null;

/** 启动 scicompass 网关 sidecar；失败不阻塞窗口（UI 会显示未连接横幅 + 重试）。 */
async function bootSidecar(): Promise<void> {
  // dist-electron/ 的上级即仓库根；scicompass CLI 已由 `npm run typecheck` 构建到 dist
  const repoRoot = path.join(__dirname, '..');
  const cliMain = path.join(repoRoot, 'scicompass', 'packages', 'cli', 'dist', 'main.js');
  const dataHome = path.join(app.getPath('userData'), 'scicompass');
  try {
    sidecar = await startSidecar({ cliMain, dataHome });
    console.log('[main] scicompass sidecar ready at', sidecar.baseUrl);
  } catch (e) {
    console.error('[main] scicompass sidecar failed to start:', (e as Error).message);
    sidecar = null;
  }
}

function stopSidecar(): void {
  sidecar?.stop();
  sidecar = null;
}

function withBase(url: string): string {
  if (!sidecar) return url;
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}scicompassBase=${encodeURIComponent(sidecar.baseUrl)}`;
}

function createWindow() {
  Menu.setApplicationMenu(null);

  const window = new BrowserWindow({
    width: 1440,
    height: 940,
    minWidth: 1180,
    minHeight: 760,
    title: APP_WINDOW_TITLE,
    backgroundColor: '#071c34',
    autoHideMenuBar: true,
    show: false,
    icon: path.join(__dirname, APP_ICON_ASSET_PATH),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  window.setMenuBarVisibility(false);
  window.once('ready-to-show', () => {
    window.show();
  });

  // baseUrl 经 query string 注入 renderer（127.0.0.1 本地端口，无敏感信息）
  const devServerUrl = process.env.VITE_DEV_SERVER_URL;
  if (devServerUrl) {
    void window.loadURL(withBase(devServerUrl));
  } else {
    const indexFile = path.join(__dirname, '../dist/index.html');
    const search = sidecar ? `scicompassBase=${encodeURIComponent(sidecar.baseUrl)}` : undefined;
    void window.loadFile(indexFile, search ? { search } : undefined);
  }
}

app.setName(APP_DISPLAY_NAME);
app.setAppUserModelId(APP_USER_MODEL_ID);

app.whenReady().then(async () => {
  await bootSidecar();
  createWindow();
});

app.on('window-all-closed', () => {
  stopSidecar();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  stopSidecar();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
