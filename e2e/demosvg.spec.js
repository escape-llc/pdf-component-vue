// @ts-check
import { test, expect } from '@playwright/test';
import { delay } from "./util.js";

test.describe.configure({mode:"serial"});
test.describe("DemoSvg", () => {
	test('page', async ({ browser }, { outputDir }) => {
		const viewport = { width: 1280, height: 19132 };
		const screen = { width:1280, height:21000 };
		const context = await browser.newContext({ deviceScaleFactor: 1 });
		const page = await context.newPage();
		await page.goto('http://localhost:5173/', { waitUntil: "load" });
		await page.getByRole('link', { name: 'SVG' }).click();
	
		await expect(page.getByRole('heading', { name: 'SVG Render Mode' })).toBeVisible();
		await expect(page.locator('div.error')).not.toBeVisible();
		await expect(page.locator('div#my-pdf')).toBeVisible();
		//await page.locator("div#demo5-complete-loaded").waitFor({ state: "attached", timeout: 30000 });
		await expect(page.locator("div#demo5-complete-loaded")).toBeAttached({ timeout: 30000 });
		await page.screenshot({ path: `${outputDir}/demosvg-01-loaded.png`, fullPage: true });
	})
})