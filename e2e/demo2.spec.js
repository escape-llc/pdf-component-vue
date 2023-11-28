// @ts-check
import { test, expect } from '@playwright/test';
import { delay } from "./util.js";

test.describe.configure({mode:"serial"});
test.describe("Demo2", () => {
	test('page', async ({ page }, { outputDir }) => {
		await page.goto('http://localhost:5173/', { waitUntil: "load" });
	
		// Click the Demo1 link.
		await page.getByRole('link', { name: 'Navigation' }).click();
	
		await expect(page.getByRole('heading', { name: 'Tiles and Navigation' })).toBeVisible();
		await expect(page.locator('div.error')).not.toBeVisible();
		await expect(page.locator('div#my-pdf')).toBeVisible();
		await expect(page.locator('div.render-complete')).toBeAttached();
		await page.screenshot({ path: `${outputDir}/demo2-01-page1.png`, fullPage: true });
		// click the "next page" button
		await page.getByRole('button', { name: '>' }).click();
		await expect(page.locator('div#my-pdf-page-7')).toBeVisible();
		await expect(page.locator('div.render-complete')).toBeAttached();
		await page.screenshot({ path: `${outputDir}/demo2-02-page2.png`, fullPage: true });
		// click the "next page" button
		await page.getByRole('button', { name: '>' }).click();
		await expect(page.locator('div#my-pdf-page-13')).toBeVisible();
		await expect(page.locator('div.render-complete')).toBeAttached();
		await page.screenshot({ path: `${outputDir}/demo2-03-page3.png`, fullPage: true });
	})
})