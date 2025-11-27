import { expect, test } from '@playwright/test';

test('should toggle between 3D, 2D, and split views', async ({ page }) => {
  // 设置页面超时
  page.setDefaultTimeout(15000);

  // 导航到应用
  await page.goto('http://192.168.2.155:3000');
  await page.waitForLoadState('domcontentloaded');

  // 等待页面加载完成
  await page.waitForTimeout(2000);

  // 1. 测试3D视图
  const viewToggle3D = page.getByTestId('view-toggle-3d') || page.getByRole('button', { name: /3d/i });
  await viewToggle3D.click();

  // 验证3D视图是否显示
  const earth3D = page.locator('#earth-3d-container');
  await expect(earth3D).toBeVisible();

  // 2. 测试2D视图
  const viewToggle2D = page.getByTestId('view-toggle-2d') || page.getByRole('button', { name: /2d/i });
  await viewToggle2D.click();

  // 验证2D视图是否显示
  const map2D = page.locator('#map-2d-container');
  await expect(map2D).toBeVisible();

  // 3. 测试分屏视图
  const viewToggleSplit = page.getByTestId('view-toggle-split') || page.getByRole('button', { name: /分屏|split/i });
  await viewToggleSplit.click();

  // 验证分屏视图是否显示（同时显示3D和2D视图）
  await expect(earth3D).toBeVisible();
  await expect(map2D).toBeVisible();

  // 截图保存
  await page.screenshot({ path: 'tests/screenshots/view-toggle-test.png', fullPage: true });

  console.log('View toggle test completed successfully!');
});
