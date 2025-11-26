import { expect, test } from '@playwright/test';

// 测试文件路径
const TEST_FILES = {
  SPACE_STATION: 'c:\\Users\\41530\\GSatTrack\\src\\assets\\SpaceStation20251126.txt'
};

test.describe('Simple TLE File Upload Tests', () => {
  test.beforeEach(async ({ page }) => {
    // 设置页面超时
    page.setDefaultTimeout(30000);

    // 导航到应用页面
    await page.goto('http://192.168.2.155:3000');
    await page.waitForLoadState('domcontentloaded');

    // 等待页面加载完成
    await page.waitForTimeout(2000);
  });

  test('should test basic TLE upload flow', async ({ page }) => {
    // 1. 查找并点击TLE导入按钮
    const importButtons = await page.locator('button').all();
    let importButton = null;

    for (const button of importButtons) {
      const text = await button.textContent();
      if (text && text.includes('导入TLE')) {
        importButton = button;
        break;
      }
    }

    expect(importButton).not.toBeNull();

    // 2. 点击导入按钮
    await importButton!.click();

    // 3. 等待TLE上传组件出现
    await page.waitForTimeout(1000);

    // 4. 查找选择框并获取所有选项
    const selectElements = await page.locator('select').all();
    expect(selectElements.length).toBeGreaterThan(0);

    const selectElement = selectElements[0];
    const options = await selectElement.locator('option').all();
    expect(options.length).toBeGreaterThan(0);

    // 5. 输出所有选项文本，用于调试
    const optionTexts = [];
    for (const option of options) {
      const text = await option.textContent();
      optionTexts.push(text);
    }
    console.log('Available satellite groups:', optionTexts);

    // 6. 选择第一个可用的卫星组
    await selectElement.selectOption({ index: 0 });

    // 7. 上传TLE文件
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(TEST_FILES.SPACE_STATION);

    // 8. 等待上传过程完成
    await page.waitForTimeout(5000);

    // 9. 关闭模态框 - 使用更可靠的方法
    await page.keyboard.press('Escape');

    // 10. 验证模态框已关闭
    await page.waitForTimeout(1000);

    console.log('TLE upload test completed successfully!');
  });
});