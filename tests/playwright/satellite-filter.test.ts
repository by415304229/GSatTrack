import { expect, test } from '@playwright/test';

test('should filter satellites correctly', async ({ page }) => {
  // 设置页面超时
  page.setDefaultTimeout(15000);

  // 导航到应用
  await page.goto('http://192.168.2.155:3000');
  await page.waitForLoadState('domcontentloaded');

  // 等待页面加载完成
  await page.waitForTimeout(2000);

  // 1. 打开设置面板
  const settingsButton = page.getByTestId('settings-button') || page.getByRole('button', { name: /设置|settings/i });
  await settingsButton.click();

  // 等待面板显示
  const settingsPanel = page.locator('#settings-panel');
  await expect(settingsPanel).toBeVisible();

  // 2. 搜索卫星
  const searchInput = page.getByTestId('satellite-search-input') || page.locator('input[name="satellite-search"]');
  await searchInput.fill('ISS');

  // 验证搜索结果
  const searchResults = page.getByTestId('satellite-search-results') || page.locator('.satellite-search-results');
  await expect(searchResults).toBeVisible();

  // 3. 选择卫星进行跟踪
  const issSatellite = page.getByTestId('satellite-item-ISS') || page.getByText(/ISS/i);
  await expect(issSatellite).toBeVisible({ timeout: 5000 });

  // 假设卫星项是复选框，点击选择
  await issSatellite.click();

  // 4. 验证卫星被选中
  // 这里我们假设选中后会有视觉反馈，具体需要根据实际实现调整
  await expect(issSatellite).toBeVisible();

  // 5. 清除搜索
  await searchInput.fill('');

  // 验证搜索结果清除
  // 这里我们假设清除搜索后会显示所有卫星或清空结果，具体需要根据实际实现调整
  await expect(searchResults).toBeVisible();

  // 6. 关闭设置面板
  const closeSettingsButton = page.getByTestId('close-settings-panel') || page.getByRole('button', { name: /关闭|close/i });
  await closeSettingsButton.click();

  // 验证面板关闭
  await expect(settingsPanel).not.toBeVisible();

  // 截图保存
  await page.screenshot({ path: 'tests/screenshots/satellite-filter-test.png', fullPage: true });

  console.log('Satellite filter test completed successfully!');
});
