import { test } from '@playwright/test';
import path from 'path';
import fs from 'fs';

test('capture comprehensive portfolio dashboard screenshots', async ({ page, context }) => {
  const screenshotsDir = path.resolve('docs/screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  // 1. CEO Strategic View (default)
  await page.goto('/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
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

  // 4. Mobile Navigation View
  const mobilePage = await context.newPage();
  await mobilePage.setViewportSize({ width: 375, height: 812 });
  await mobilePage.goto('/', { waitUntil: 'networkidle' });
  await mobilePage.waitForTimeout(1500);
  await mobilePage.screenshot({ path: path.join(screenshotsDir, 'mobile-drawer.png') });

  // Helper for logging in with role credentials
  const captureRoleView = async (username: string, pass: string, filename: string) => {
    const rolePage = await context.newPage();
    await rolePage.setViewportSize({ width: 1280, height: 800 });
    await rolePage.goto('/', { waitUntil: 'networkidle' });
    await rolePage.evaluate(() => localStorage.clear());
    await rolePage.reload({ waitUntil: 'networkidle' });
    await rolePage.waitForTimeout(1000);

    const userInput = rolePage.locator('input[type="text"]').first();
    const passInput = rolePage.locator('input[type="password"]').first();
    const submitBtn = rolePage.locator('button[type="submit"]').first();

    if (await userInput.isVisible()) {
      await userInput.fill(username);
      await passInput.fill(pass);
      await submitBtn.click();
      await rolePage.waitForTimeout(2000);
    }

    await rolePage.screenshot({ path: path.join(screenshotsDir, filename) });
    await rolePage.close();
  };

  // 5. B2B Sales Director View
  await captureRoleView('b2b_director', 'b2b123', 'sales-director.png');

  // 6. Brand Churn Risk View
  await captureRoleView('brand_manager', 'brand123', 'brand-churn-risk.png');

  // 7. Financial Planning View
  await captureRoleView('finance', 'finance123', 'financial-planning.png');

  // 8. Supply Chain View
  await captureRoleView('supply_chain', 'sc123', 'supply-chain.png');

  // 9. Marketing View
  await captureRoleView('marketing', 'mkt123', 'marketing-view.png');
});
