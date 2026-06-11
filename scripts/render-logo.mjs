// 开发辅助：把求是 logo SVG 渲染为 PNG（用作 Electron 窗口图标）。
// 用法：electron scripts/render-logo.mjs [尺寸=256]
import { app, BrowserWindow } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const size = Number(process.argv[2] ?? '256');
const svgPath = path.resolve('assets/brand/sciwork-logo.svg');
const outPath = path.resolve('assets/brand/sciwork-logo.png');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

app.whenReady().then(async () => {
  const win = new BrowserWindow({
    width: size,
    height: size,
    show: false,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    webPreferences: { offscreen: true, backgroundThrottling: false }
  });

  await win.loadURL(pathToFileURL(svgPath).href);
  await sleep(800);

  const image = await win.webContents.capturePage();
  fs.writeFileSync(outPath, image.toPNG());
  console.log(`saved ${outPath} (${size}x${size})`);
  app.exit(0);
});
