// @ts-check
import { test, expect } from '@playwright/test';
import { delay } from "./util.js";

test.describe.configure({mode:"serial"});
test.describe("Demo5", () => {
	test('page', async ({ browser }, { outputDir }) => {
		const viewport = { width: 1280, height: 19132 };
		const screen = { width:1280, height:21000 };
		const context = await browser.newContext({ deviceScaleFactor: 1 });
		const page = await context.newPage();
		await page.goto('http://localhost:5173/', { waitUntil: "load" });
	
		// Click the Demo5 link.
		await page.getByRole('link', { name: 'Resize' }).click();
	
		await expect(page.getByRole('heading', { name: 'Resize' })).toBeVisible();
		await expect(page.locator('div.error')).not.toBeVisible();
		await expect(page.locator('div#my-pdf')).toBeVisible();
		//await page.locator("div#demo5-complete-loaded").waitFor({ state: "attached", timeout: 30000 });
		await expect(page.locator("div#demo5-complete-loaded")).toBeAttached({ timeout: 30000 });
		await page.screenshot({ path: `${outputDir}/demo5-01-loaded.png`, fullPage: true });
		// click the "wide" button
		await page.getByRole('button', { name: 'Wide' }).click();
		await expect(page.locator("div#demo5-complete-wide")).toBeAttached({ timeout: 60000 });
		await page.screenshot({ path: `${outputDir}/demo5-02-wide.png`, fullPage: true });
		// click the "narrow" button
		await page.getByRole('button', { name: 'Narrow' }).click();
		await expect(page.locator("div#demo5-complete-narrow")).toBeAttached({ timeout: 60000 });
		await page.screenshot({ path: `${outputDir}/demo5-03-narrow.png`, fullPage: true });
	})
})