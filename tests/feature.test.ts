import { test, expect } from '@playwright/test';

test.describe('GSatTrack功能测试', () => {
  test.beforeEach(async ({ page }) => {
    // 设置页面超时
    page.setDefaultTimeout(15000);
    
    await page.goto('http://192.168.2.155:3000');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
  });

  test('1. 测试命名映射系统', async ({ page }) => {
    console.log('开始测试命名映射系统...');
    
    // 截图保存初始状态
    await page.screenshot({ path: 'tests/screenshots/naming-test-1.png', fullPage: true });
    
    // 在浏览器中执行JavaScript，创建测试映射
    await page.evaluate(() => {
      const STORAGE_KEY = 'satellite_naming_mappings';
      const mappings = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      mappings.push({
        noradId: '25544',
        tleName: 'ISS (ZARYA)',
        displayName: '测试卫星名称',
        satelliteType: 'QIANFAN',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mappings));
    });
    
    // 刷新页面
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    
    // 截图保存
    await page.screenshot({ path: 'tests/screenshots/naming-test-2.png', fullPage: true });
    
    console.log('命名映射系统测试完成');
  });

  test('2. 测试卫星选择功能', async ({ page }) => {
    console.log('开始测试卫星选择功能...');
    
    // 查找并点击设置按钮
    let settingsButton = page.locator('button').nth(0);
    await settingsButton.click();
    await page.waitForTimeout(1000);
    
    // 截图保存
    await page.screenshot({ path: 'tests/screenshots/selection-test-1.png', fullPage: true });
    
    // 查找并点击全选按钮
    let selectButton = page.locator('button').nth(1);
    await selectButton.click();
    await page.waitForTimeout(500);
    
    // 截图保存
    await page.screenshot({ path: 'tests/screenshots/selection-test-2.png', fullPage: true });
    
    // 查找并点击取消全选按钮
    let deselectButton = page.locator('button').nth(2);
    await deselectButton.click();
    await page.waitForTimeout(500);
    
    // 截图保存
    await page.screenshot({ path: 'tests/screenshots/selection-test-3.png', fullPage: true });
    
    console.log('卫星选择功能测试完成');
  });

  test('3. 测试文件上传功能', async ({ page }) => {
    console.log('开始测试文件上传功能...');
    
    // 查找并点击上传按钮
    let uploadButton = page.locator('button').nth(3);
    await uploadButton.click();
    await page.waitForTimeout(1000);
    
    // 截图保存
    await page.screenshot({ path: 'tests/screenshots/upload-test-1.png', fullPage: true });
    
    // 使用正确的方式上传文件
    const testTLE = `TEST SATELLITE
1 99999U 22001A   23123.55430556  .00016717  00000-0  10270-3 0  9018
2 99999  51.6432 342.5792 0006733  32.6678  45.4686 15.49549334322062`;
    
    // 在浏览器中执行JavaScript，模拟文件上传
    await page.evaluate((testTLE) => {
      // 创建一个Blob对象
      const blob = new Blob([testTLE], { type: 'text/plain' });
      const file = new File([blob], 'test.tle', { type: 'text/plain' });
      
      // 触发文件上传事件
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) {
        // 创建一个文件列表
        const fileList = new DataTransfer();
        fileList.items.add(file);
        
        // 设置文件输入的值
        (fileInput as HTMLInputElement).files = fileList.files;
        
        // 触发change事件
        const event = new Event('change', { bubbles: true });
        fileInput.dispatchEvent(event);
      }
    }, testTLE);
    
    await page.waitForTimeout(2000);
    
    // 截图保存
    await page.screenshot({ path: 'tests/screenshots/upload-test-2.png', fullPage: true });
    
    console.log('文件上传功能测试完成');
  });
});
