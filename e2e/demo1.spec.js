// @ts-check
import { test, expect } from '@playwright/test';

test.describe.configure({mode:"serial"});
test.describe("Demo1 Page", () => {
	test('demo1 page', async ({ page }) => {
		await page.goto('http://localhost:5173/', { waitUntil: "load" });
	
		await page.getByRole('link', { name: 'Basic' }).click();
	
		await expect(page.getByRole('heading', { name: 'Basic Usage' })).toBeVisible();
		await expect(page.locator('div.error')).not.toBeVisible();
		await expect(page.locator('div#my-pdf')).toBeVisible();
		await expect(page.locator('div#my-pdf-page-1')).toBeVisible();
		await new Promise(resolve => { setTimeout(resolve, 1000)});
		await page.screenshot({ path: 'playwright-capture/demo1.png', fullPage: true });
	})
})