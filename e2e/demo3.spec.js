// @ts-check
import { test, expect } from '@playwright/test';

test.describe.configure({mode:"serial"});
test.describe("Demo3 Page", () => {
	test('demo3 page', async ({ page }) => {
		await page.goto('http://localhost:5173/', { waitUntil: "load" });
	
		// Click the Demo1 link.
		await page.getByRole('link', { name: 'Page Management' }).click();
	
		await expect(page.getByRole('heading', { name: 'Page Management' })).toBeVisible();
		await expect(page.locator('div.error')).not.toBeVisible();
		await expect(page.locator('div#my-pdf')).toBeVisible();
		await expect(page.locator('div#my-pdf-page-1')).toBeVisible();
		await new Promise(resolve => { setTimeout(resolve, 1000)});
		await page.screenshot({ path: 'playwright-capture/demo3-page01.png', fullPage: true });
		await page.locator('div#my-pdf-page-5').click();
		await new Promise(resolve => { setTimeout(resolve, 1000)});
		await page.screenshot({ path: 'playwright-capture/demo3-page05.png', fullPage: true });
		await page.locator('div#my-pdf-page-10').click();
		await new Promise(resolve => { setTimeout(resolve, 1000)});
		await page.screenshot({ path: 'playwright-capture/demo3-page10.png', fullPage: true });
	})
})