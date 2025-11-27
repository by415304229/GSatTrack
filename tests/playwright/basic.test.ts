import { expect, test } from '@playwright/test';

test('should load the application successfully', async ({ page }) => {
  // 设置页面超时
  page.setDefaultTimeout(15000);

  // 导航到应用
  await page.goto('http://192.168.2.155:3000');
  await page.waitForLoadState('domcontentloaded');

  // 等待页面加载完成
  await page.waitForTimeout(2000);

  // 验证页面标题
  await expect(page).toHaveTitle(/格思航天长管系统|全球卫星跟踪/i);

  // 截图保存
  await page.screenshot({ path: 'tests/screenshots/basic-test.png', fullPage: true });

  console.log('Basic test completed successfully!');
});
