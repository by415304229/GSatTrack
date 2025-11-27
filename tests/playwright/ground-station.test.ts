import { test, expect } from '@playwright/test';

test('should manage ground stations correctly', async ({ page }) => {
  // 设置页面超时
  page.setDefaultTimeout(15000);
  
  // 导航到应用
  await page.goto('http://192.168.2.155:3000');
  await page.waitForLoadState('domcontentloaded');
  
  // 等待页面加载完成
  await page.waitForTimeout(2000);
  
  // 1. 打开地面站管理面板
  const stationPanelButton = page.getByTestId('station-panel-button') || page.getByRole('button', { name: /地面站|stations/i });
  await stationPanelButton.click();
  
  // 等待面板显示
  const stationPanel = page.locator('#station-panel');
  await expect(stationPanel).toBeVisible();
  
  // 2. 添加新地面站
  const stationNameInput = page.getByTestId('station-name-input') || page.locator('input[name="station-name"]');
  const stationLatInput = page.getByTestId('station-lat-input') || page.locator('input[name="station-lat"]');
  const stationLonInput = page.getByTestId('station-lon-input') || page.locator('input[name="station-lon"]');
  const addStationButton = page.getByTestId('add-station-button') || page.getByRole('button', { name: /添加|add/i });
  
  await stationNameInput.fill('Test Station');
  await stationLatInput.fill('39.9042');
  await stationLonInput.fill('116.4074');
  await addStationButton.click();
  
  // 验证新地面站添加成功
  const testStation = page.getByTestId('station-item-Test Station') || page.getByText('Test Station');
  await expect(testStation).toBeVisible({ timeout: 5000 });
  
  // 3. 删除地面站
  const deleteStationButton = page.getByTestId('delete-station-Test Station') || page.getByRole('button', { name: /删除|delete/i }).first();
  await deleteStationButton.click();
  
  // 验证地面站删除成功
  await expect(testStation).not.toBeVisible({ timeout: 5000 });
  
  // 4. 关闭地面站面板
  const closePanelButton = page.getByTestId('close-station-panel') || page.getByRole('button', { name: /关闭|close/i });
  await closePanelButton.click();
  
  // 验证面板关闭
  await expect(stationPanel).not.toBeVisible();
  
  // 截图保存
  await page.screenshot({ path: 'tests/screenshots/ground-station-test.png', fullPage: true });
  
  console.log('Ground station management test completed successfully!');
});
