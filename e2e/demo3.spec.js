// @ts-check
import { test, expect } from '@playwright/test';
import { delay } from "./util.js";

test.describe.configure({mode:"serial"});
test.describe("Demo3", () => {
	test('page', async ({ page }, { outputDir }) => {
		await page.goto('http://localhost:5173/', { waitUntil: "load" });
		await page.getByRole('link', { name: 'Page Management' }).click();
	
		await expect(page.getByRole('heading', { name: 'Page Management' })).toBeVisible();
		await expect(page.locator('div.error')).not.toBeVisible();
		await expect(page.locator('div#my-pdf')).toBeVisible();
		await expect(page.locator('div.render-complete')).toBeAttached({ timeout: 20000 });
		await page.screenshot({ path: `${outputDir}/demo3-01-page01.png`, fullPage: true });
		await page.locator('div#my-pdf-page-5').click();
		await expect(page.locator('div.render-complete')).toBeAttached({ timeout: 20000 });
		await page.screenshot({ path: `${outputDir}/demo3-02-page05.png`, fullPage: true });
		await page.locator('div#my-pdf-page-10').click();
		await expect(page.locator('div.render-complete')).toBeAttached({ timeout: 20000 });
		await page.screenshot({ path: `${outputDir}/demo3-03-page10.png`, fullPage: true });
	})
})