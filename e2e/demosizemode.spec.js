// @ts-check
import { test, expect } from '@playwright/test';
import { delay } from "./util.js";

test.describe.configure({mode:"serial"});
test.describe("Demo SizeMode", () => {
	test('page', async ({ browser }, { outputDir }) => {
		const viewport = { width: 1280, height: 19132 };
		const screen = { width:1280, height:21000 };
		const context = await browser.newContext({ deviceScaleFactor: 1 });
		const page = await context.newPage();
		await page.goto('http://localhost:5173/', { waitUntil: "load" });
		await page.getByRole('link', { name: 'Size Modes' }).click();
	
		await expect(page.getByRole('heading', { name: 'Size Modes' })).toBeVisible();
		await expect(page.locator('div.error')).not.toBeVisible();
		await expect(page.locator('div#my-pdf')).toBeVisible();
		//await page.locator("div#demo5-complete-loaded").waitFor({ state: "attached", timeout: 30000 });
		await expect(page.locator("div#demo-complete-loaded")).toBeAttached({ timeout: 30000 });
		await page.screenshot({ path: `${outputDir}/demosize-01-loaded.png`, fullPage: true });
		// click the "Page" button
		await page.getByRole('button', { name: 'Page' }).click();
		await expect(page.locator("div#demo-complete-height")).toBeAttached({ timeout: 60000 });
		// animation
		await delay(1000);
		await page.screenshot({ path: `${outputDir}/demosize-03-height.png`, fullPage: true });
		// click the "Width" button
		await page.getByRole('button', { name: 'Width' }).click();
		await expect(page.locator("div#demo-complete-width")).toBeAttached({ timeout: 60000 });
		// animation
		await delay(1000);
		await page.screenshot({ path: `${outputDir}/demosize-02-width.png`, fullPage: true });
		// click the "50%" button
		await page.getByRole('button', { name: '50% (SCALE)', exact: true }).click();
		await expect(page.locator("div#demo-complete-scale50")).toBeAttached({ timeout: 60000 });
		// animation
		await delay(1000);
		await page.screenshot({ path: `${outputDir}/demosize-02-scale50.png`, fullPage: true });
		// click the "100%" button
		await page.getByRole('button', { name: '100%' }).click();
		await expect(page.locator("div#demo-complete-scale100")).toBeAttached({ timeout: 60000 });
		// animation
		await delay(1000);
		await page.screenshot({ path: `${outputDir}/demosize-02-scale100.png`, fullPage: true });
		// click the "150%" button
		await page.getByRole('button', { name: '150% (SCALE)', exact: true }).click();
		await expect(page.locator("div#demo-complete-scale150")).toBeAttached({ timeout: 60000 });
		// animation
		await delay(1000);
		await page.screenshot({ path: `${outputDir}/demosize-02-scale150.png`, fullPage: true });
	})
})