import { app, BrowserWindow, Menu } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { APP_DISPLAY_NAME, APP_ICON_ASSET_PATH, APP_USER_MODEL_ID, APP_WINDOW_TITLE } from './appIdentity.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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

  const devServerUrl = process.env.VITE_DEV_SERVER_URL;
  if (devServerUrl) {
    void window.loadURL(devServerUrl);
  } else {
    const indexFile = path.join(__dirname, '../dist/index.html');
    void window.loadFile(indexFile);
  }
}

app.setName(APP_DISPLAY_NAME);
app.setAppUserModelId(APP_USER_MODEL_ID);

app.whenReady().then(() => {
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
