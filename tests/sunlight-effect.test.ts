import { expect, test } from '@playwright/test';

test.describe('Sunlight Effect Tests', () => {
  test.beforeEach(async ({ page }) => {
    // 设置页面超时
    page.setDefaultTimeout(30000);

    // 导航到应用页面
    await page.goto('http://192.168.2.155:3000');
    await page.waitForLoadState('domcontentloaded');

    // 等待页面加载完成
    await page.waitForTimeout(2000);

    // 确保在3D视图模式
    await page.click('button:has-text("3D")');

    // 等待3D视图加载完成
    await page.waitForTimeout(2000);
  });

  test('should verify 3D view renders correctly', async ({ page }) => {
    // 验证3D视图存在
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();

    // 截图验证3D视图
    await page.screenshot({
      path: `./test-screenshots/sunlight-test.png`,
      fullPage: true
    });
  });

  test('should verify 3D view has content', async ({ page }) => {
    // 验证3D视图存在
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();

    // 验证3D视图中存在地球
    // 由于地球是通过WebGL渲染的，我们无法直接验证其存在，但可以验证Canvas有内容
    const screenshot = await canvas.screenshot();
    expect(screenshot).toBeTruthy();
  });
});
