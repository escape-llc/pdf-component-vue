// @ts-check
import { test, expect } from '@playwright/test';
import { delay } from "./util.js";

test.describe.configure({mode:"serial"});
test.describe("Demo5", () => {
	test('page', async ({ page }, { outputDir }) => {
		await page.goto('http://localhost:5173/', { waitUntil: "load" });
	
		// Click the Demo5 link.
		await page.getByRole('link', { name: 'Resize' }).click();
	
		await expect(page.getByRole('heading', { name: 'Resize Pages' })).toBeVisible();
		await expect(page.locator('div.error')).not.toBeVisible();
		await expect(page.locator('div#my-pdf')).toBeVisible();
		await expect(page.locator('div#my-pdf-page-1')).toBeVisible();
		await page.screenshot({ path: `${outputDir}/demo5-initial.png`, fullPage: true });
		// click the "wide" button
		await page.getByRole('button', { name: 'Wide' }).click();
		await delay(1500);
		await page.screenshot({ path: `${outputDir}/demo5-wide.png`, fullPage: true });
		// click the "narrow" button
		await page.getByRole('button', { name: 'Narrow' }).click();
		await delay(1500);
		await page.screenshot({ path: `${outputDir}/demo5-narrow.png`, fullPage: true });
	})
})