// 开发辅助：加载 dev server 截图，用于无头检查 UI。
// 用法：electron scripts/preview-shot.mjs <输出.png> [推进阶段数] [宽] [高]
import { app, BrowserWindow } from 'electron';
import fs from 'node:fs';

const [, , outPath = 'shot.png', advanceRaw = '0', widthRaw = '1440', heightRaw = '940'] = process.argv;
const advanceCount = Number(advanceRaw);
const width = Number(widthRaw);
const height = Number(heightRaw);
const url = process.env.SHOT_URL ?? 'http://127.0.0.1:5173';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

app.whenReady().then(async () => {
  const win = new BrowserWindow({
    width,
    height,
    show: false,
    webPreferences: { offscreen: true, backgroundThrottling: false }
  });

  await win.loadURL(url);
  await sleep(1500);

  for (let i = 0; i < advanceCount; i += 1) {
    await win.webContents.executeJavaScript(
      `document.querySelector('.send-button')?.click()`
    );
    await sleep(350);
  }
  await sleep(500);

  const image = await win.webContents.capturePage();
  fs.writeFileSync(outPath, image.toPNG());
  console.log(`saved ${outPath} (${width}x${height}, advanced ${advanceCount})`);
  app.exit(0);
});
