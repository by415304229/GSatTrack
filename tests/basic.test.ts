import { test, expect } from '@playwright/test';

test('basic test', async ({ page }) => {
  // 设置页面超时
  page.setDefaultTimeout(15000);
  
  await page.goto('http://192.168.2.155:3000');
  await page.waitForLoadState('domcontentloaded');
  
  // 简单等待，确保页面加载完成
  await page.waitForTimeout(2000);
  
  // 截图保存
  await page.screenshot({ path: 'tests/screenshots/basic-test.png', fullPage: true });
  
  console.log('Test completed successfully!');
});
