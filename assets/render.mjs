import { chromium } from "@playwright/test";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");

const browser = await chromium.launch();

// App icon, rendered at 512 and downscaled later.
const iconPage = await browser.newPage({
  viewport: { width: 512, height: 512 },
  deviceScaleFactor: 1,
});
await iconPage.goto(`file://${resolve(here, "icon.html")}`);
await iconPage.waitForTimeout(200);
await iconPage.screenshot({
  path: resolve(root, "assets/icon-512.png"),
  omitBackground: true,
});
await iconPage.close();

// Social card.
const ogPage = await browser.newPage({
  viewport: { width: 1200, height: 630 },
  deviceScaleFactor: 1,
});
await ogPage.goto(`file://${resolve(here, "og.html")}`);
await ogPage.evaluate(() => document.fonts.ready);
const fontReady = await ogPage.evaluate(() =>
  document.fonts.check('800 88px "PJS"')
);
await ogPage.waitForTimeout(300);
await ogPage.screenshot({ path: resolve(root, "public/og.png") });
console.log("font loaded:", fontReady);
await ogPage.close();

await browser.close();
