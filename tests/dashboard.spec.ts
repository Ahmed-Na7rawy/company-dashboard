import { test, expect } from '@playwright/test';

test.describe('Company Dashboard BI', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('domcontentloaded');
  });

  async function handleReloadModal(page) {
    for (let i = 0; i < 3; i++) {
      const reloadBtn = page.locator('button:has-text("Reload Application")');
      if (await reloadBtn.isVisible({ timeout: 2000 })) {
        await reloadBtn.click();
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(1000);
      } else {
        break;
      }
    }
  }

  test('should load login page', async ({ page }) => {
    await expect(page.locator('text=Central Command Login')).toBeVisible();
    await expect(page.locator('input[type="text"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  const testUsers = [
    { username: 'admin', password: 'admin123', expectedText: 'CEO Strategic Command' },
    { username: 'ceo', password: 'ceo123', expectedText: 'CEO Strategic Command' },
    { username: 'finance', password: 'finance123', expectedText: 'Financial Planning' },
    { username: 'b2b_director', password: 'b2b123', expectedText: 'B2B Sales Dashboard' },
    { username: 'b2c_director', password: 'b2c123', expectedText: 'B2C Sales Dashboard' },
    { username: 'horeca_director', password: 'horeca123', expectedText: 'HORECA Sales Dashboard' },
    { username: 'supply_chain', password: 'sc123', expectedText: 'Supply Chain Director' },
    { username: 'marketing', password: 'mkt123', expectedText: 'Marketing Dashboard' },
    { username: 'hr_director', password: 'hr123', expectedText: 'HR Operations' },
    { username: 'brand_manager', password: 'brand123', expectedText: 'Brand Performance' },
    { username: 'sales_rep', password: 'rep123', expectedText: 'Salesperson' },
  ];

  for (const user of testUsers) {
    test(`should login successfully as ${user.username}`, async ({ page }) => {
      await page.fill('input[type="text"]', user.username);
      await page.fill('input[type="password"]', user.password);
      await page.click('button:has-text("Sign In")');

      await expect(page.locator(`text=${user.expectedText}`)).toBeVisible();
      await handleReloadModal(page);
    });
  }
});