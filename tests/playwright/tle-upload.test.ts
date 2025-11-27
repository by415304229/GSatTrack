import { test, expect } from '@playwright/test';
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// 在ES模块中获取当前文件的目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

test('should upload TLE file correctly', async ({ page }) => {
  // 设置页面超时
  page.setDefaultTimeout(15000);
  
  // 导航到应用
  await page.goto('http://192.168.2.155:3000');
  await page.waitForLoadState('domcontentloaded');
  
  // 等待页面加载完成
  await page.waitForTimeout(2000);
  
  // 创建测试用的TLE文件
  const testTLEContent = `TEST-SAT-01
1 12345U 98067A   25320.51167824  .00010000  00000-0  21825-3 0  9994
2 12345  51.6442 344.8627 0002773  63.0524  35.3741 15.50140827347193

TEST-SAT-02
1 67890U 98067B   25320.51167824  .00010000  00000-0  21825-3 0  9995
2 67890  51.6442 344.8627 0002773  63.0524  35.3741 15.50140827347193`;
  
  const testTLEPath = join(__dirname, 'test-tle.txt');
  writeFileSync(testTLEPath, testTLEContent);

  // 1. 打开TLE导入模态框
  const tleImportButton = page.getByTestId('tle-import-button') || page.getByRole('button', { name: /tle导入|tle import/i });
  await tleImportButton.click();

  // 等待模态框显示
  const tleImportModal = page.locator('#tle-import-modal');
  await expect(tleImportModal).toBeVisible();

  // 2. 选择卫星组
  const groupSelect = page.getByTestId('tle-group-select') || page.locator('select[name="group"]');
  await groupSelect.selectOption('qianfan');

  // 3. 选择更新模式（覆盖）
  const updateModeOverride = page.getByTestId('tle-update-mode-override') || page.getByLabel(/覆盖|override/i);
  await updateModeOverride.click();

  // 4. 上传TLE文件
  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles(testTLEPath);

  // 5. 验证上传成功
  const uploadSuccessMessage = page.getByTestId('tle-upload-success') || page.getByText(/上传成功|upload successful/i);
  await expect(uploadSuccessMessage).toBeVisible({ timeout: 5000 });

  // 6. 关闭模态框
  const closeButton = page.getByTestId('tle-import-close') || page.getByRole('button', { name: /关闭|close/i });
  await closeButton.click();

  // 验证模态框关闭
  await expect(tleImportModal).not.toBeVisible();

  // 截图保存
  await page.screenshot({ path: 'tests/screenshots/tle-upload-test.png', fullPage: true });

  console.log('TLE upload test completed successfully!');
});
