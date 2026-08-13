import { test } from '@playwright/test';
import path from 'path';
import fs from 'fs';

test('capture documentation screenshots', async ({ page, context }) => {
  const screenshotsDir = path.resolve('docs/screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  await page.goto('/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // 1. CEO Strategic View
  await page.screenshot({ path: path.join(screenshotsDir, 'ceo-view.png') });

  // 2. Sankey Flow Chart
  const sankeyEl = page.locator('.js-plotly-plot, #sankey-chart-container').first();
  if (await sankeyEl.isVisible()) {
    await sankeyEl.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);
    await sankeyEl.screenshot({ path: path.join(screenshotsDir, 'sankey-chart.png') });
  } else {
    await page.screenshot({ path: path.join(screenshotsDir, 'sankey-chart.png') });
  }

  // 3. Arabic RTL Toggle
  const langBtn = page.getByRole('button', { name: /AR|EN|عربي|English/i }).first();
  if (await langBtn.isVisible()) {
    await langBtn.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(screenshotsDir, 'arabic-rtl.png') });
    await langBtn.click();
    await page.waitForTimeout(500);
  }

  // 4. Mobile Drawer Navigation
  const mobilePage = await context.newPage();
  await mobilePage.setViewportSize({ width: 375, height: 812 });
  await mobilePage.goto('/', { waitUntil: 'networkidle' });
  await mobilePage.waitForTimeout(1500);
  await mobilePage.screenshot({ path: path.join(screenshotsDir, 'mobile-drawer.png') });
});
