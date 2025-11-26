import { expect, test } from '@playwright/test';

// 测试文件路径
const TEST_FILES = {
  QIANFAN: 'c:\\Users\\41530\\GSatTrack\\src\\assets\\QianfanGroup20251126.txt',
  SPACE_STATION: 'c:\\Users\\41530\\GSatTrack\\src\\assets\\SpaceStation20251126.txt',
  STARLINK: 'c:\\Users\\41530\\GSatTrack\\src\\assets\\StarLink20251126.txt'
};

test.describe('TLE File Upload Tests', () => {
  test.beforeEach(async ({ page }) => {
    // 设置页面超时
    page.setDefaultTimeout(30000);

    // 导航到应用页面
    await page.goto('http://192.168.2.155:3000');
    await page.waitForLoadState('domcontentloaded');

    // 等待页面加载完成
    await page.waitForTimeout(2000);
  });

  test('should open TLE import modal and select satellite group', async ({ page }) => {
    // 1. 打开TLE导入模态框
    await page.click('button:has-text("导入TLE")');
    await page.waitForSelector('.tle-file-upload');

    // 2. 验证卫星组选择框存在
    const selectElement = page.locator('select');
    await expect(selectElement).toBeVisible();

    // 3. 获取所有选项
    const options = await selectElement.locator('option').all();
    expect(options.length).toBeGreaterThan(0);

    // 4. 关闭模态框
    await page.click('button:has-text("×")');
  });

  test('should handle file upload without errors', async ({ page }) => {
    // 1. 打开TLE导入模态框
    await page.click('button:has-text("导入TLE")');
    await page.waitForSelector('.tle-file-upload');

    // 2. 选择Space Stations卫星组
    await page.selectOption('select', { label: 'Space Stations' });

    // 3. 上传SpaceStation TLE文件
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(TEST_FILES.SPACE_STATION);

    // 4. 等待一段时间，确保上传过程完成
    await page.waitForTimeout(5000);

    // 5. 关闭模态框
    await page.click('button:has-text("×")');
  });

  test('should test basic upload functionality with different files', async ({ page }) => {
    // 1. 打开TLE导入模态框
    await page.click('button:has-text("导入TLE")');
    await page.waitForSelector('.tle-file-upload');

    // 2. 测试上传Qianfan文件到Qianfan组
    await page.selectOption('select', { label: 'Qianfan (G60)' });
    let fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(TEST_FILES.QIANFAN);
    await page.waitForTimeout(3000);

    // 3. 测试上传Starlink文件到Starlink组
    await page.selectOption('select', { label: 'Starlink' });
    fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(TEST_FILES.STARLINK);
    await page.waitForTimeout(3000);

    // 4. 关闭模态框
    await page.click('button:has-text("×")');
  });

  test('should verify satellite groups are displayed correctly', async ({ page }) => {
    // 1. 打开TLE导入模态框
    await page.click('button:has-text("导入TLE")');
    await page.waitForSelector('.tle-file-upload');

    // 2. 获取所有卫星组选项
    const options = await page.locator('select option').allTextContents();

    // 3. 验证至少包含预期的卫星组
    expect(options).toContain('Qianfan (G60)');
    expect(options).toContain('Space Stations');
    expect(options).toContain('Starlink');

    // 4. 关闭模态框
    await page.click('button:has-text("×")');
  });
});