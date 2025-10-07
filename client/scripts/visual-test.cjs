const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const outDir = __dirname + '/../';
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    await page.goto('http://localhost:8081/', { waitUntil: 'networkidle' });
    try {
      await page.waitForSelector('.aspect-ratio-box', { timeout: 5000 });
    } catch (err) {
      console.warn('aspect-ratio-box not found in DOM');
    }
    const desktopPath = outDir + 'visual-desktop.png';
    await page.screenshot({ path: desktopPath, fullPage: true });
    console.log('Wrote', desktopPath);

    await page.setViewportSize({ width: 375, height: 812 });
    const mobilePath = outDir + 'visual-mobile.png';
    await page.screenshot({ path: mobilePath, fullPage: true });
    console.log('Wrote', mobilePath);
  } finally {
    await browser.close();
  }
})();
