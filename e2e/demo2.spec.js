// @ts-check
import { test, expect } from '@playwright/test';

test.describe.configure({mode:"serial"});
test.describe("Demo2 Page", () => {
	test('demo2 page', async ({ page }) => {
		await page.goto('http://localhost:5173/', { waitUntil: "load" });
	
		// Click the Demo1 link.
		await page.getByRole('link', { name: 'Navigation' }).click();
	
		await expect(page.getByRole('heading', { name: 'Tiles and Navigation' })).toBeVisible();
		await expect(page.locator('div.error')).not.toBeVisible();
		await expect(page.locator('div#my-pdf')).toBeVisible();
		await expect(page.locator('div#my-pdf-page-1')).toBeVisible();
		await new Promise(resolve => { setTimeout(resolve, 1000)});
		await page.screenshot({ path: 'playwright-capture/demo2-page1.png', fullPage: true });
		// click the "next page" button
		await page.getByRole('button', { name: '>' }).click();
		await expect(page.locator('div#my-pdf-page-7')).toBeVisible();
		await new Promise(resolve => { setTimeout(resolve, 1000)});
		await page.screenshot({ path: 'playwright-capture/demo2-page2.png', fullPage: true });
		// click the "next page" button
		await page.getByRole('button', { name: '>' }).click();
		await expect(page.locator('div#my-pdf-page-13')).toBeVisible();
		await new Promise(resolve => { setTimeout(resolve, 1000)});
		await page.screenshot({ path: 'playwright-capture/demo2-page3.png', fullPage: true });
	})
})