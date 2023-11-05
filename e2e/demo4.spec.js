// @ts-check
import { test, expect } from '@playwright/test';

test.describe.configure({mode:"serial"});
test.describe("Demo4 Page", () => {
	test('demo4 page', async ({ page }) => {
		await page.goto('http://localhost:5173/', { waitUntil: "load" });
	
		// Click the Demo1 link.
		await page.getByRole('link', { name: 'Faux Viewer' }).click();
	
		await expect(page.getByRole('heading', { name: 'Load Your Own PDF' })).toBeVisible();
		await expect(page.locator('div.error')).not.toBeVisible();
		await page.screenshot({ path: 'playwright-capture/demo4.png', fullPage: true });
	})
})