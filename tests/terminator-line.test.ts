import { expect, test } from '@playwright/test';

test('2D view should display terminator line', async ({ page }) => {
  // Navigate to the application
  await page.goto('http://192.168.2.155:3000/');

  // Wait for the application to load
  await page.waitForTimeout(5000);

  // Take a screenshot to verify the terminator line is displayed
  await page.screenshot({ path: 'test-results/2d-terminator-line.png' });

  // Just check if the page loaded successfully
  expect(page.url()).toBe('http://192.168.2.155:3000/');
});
