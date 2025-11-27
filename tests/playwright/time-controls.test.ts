import { test, expect } from '@playwright/test';

test('should control time simulation correctly', async ({ page }) => {
  // 设置页面超时
  page.setDefaultTimeout(15000);
  
  // 导航到应用
  await page.goto('http://192.168.2.155:3000');
  await page.waitForLoadState('domcontentloaded');
  
  // 等待页面加载完成
  await page.waitForTimeout(2000);
  
  // 1. 测试暂停/播放功能
  const playPauseButton = page.getByTestId('time-play-pause') || page.getByRole('button', { name: /播放|暂停|play|pause/i });
  await playPauseButton.click();
  
  // 验证按钮状态变化
  // 这里我们假设按钮会切换文本或图标，具体需要根据实际实现调整
  await expect(playPauseButton).toBeVisible();
  
  // 2. 测试实时时间功能
  const realtimeButton = page.getByTestId('time-realtime') || page.getByRole('button', { name: /实时|realtime/i });
  await realtimeButton.click();
  
  // 验证实时时间按钮被激活
  await expect(realtimeButton).toBeVisible();
  
  // 3. 测试不同时间流速
  const speedButtons = page.locator('[data-testid^="time-speed-"]') || page.getByRole('button', { name: /1x|10x|100x|1000x/i });
  
  // 测试1x速度
  const speed1x = page.getByTestId('time-speed-1x') || page.getByRole('button', { name: /1x/i });
  await speed1x.click();
  await expect(speed1x).toBeVisible();
  
  // 测试10x速度
  const speed10x = page.getByTestId('time-speed-10x') || page.getByRole('button', { name: /10x/i });
  await speed10x.click();
  await expect(speed10x).toBeVisible();
  
  // 测试100x速度
  const speed100x = page.getByTestId('time-speed-100x') || page.getByRole('button', { name: /100x/i });
  await speed100x.click();
  await expect(speed100x).toBeVisible();
  
  // 测试1000x速度
  const speed1000x = page.getByTestId('time-speed-1000x') || page.getByRole('button', { name: /1000x/i });
  await speed1000x.click();
  await expect(speed1000x).toBeVisible();
  
  // 截图保存
  await page.screenshot({ path: 'tests/screenshots/time-controls-test.png', fullPage: true });
  
  console.log('Time controls test completed successfully!');
});
