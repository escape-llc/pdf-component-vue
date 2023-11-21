// @ts-check
import { test, expect } from '@playwright/test';
import { delay } from "./util.js";

test.describe.configure({mode:"serial"});
test.describe("Demo1", () => {
	test("with viewport", async ({ browser }, { outputDir }) => {
		const context = await browser.newContext({ viewport: { width: 1280, height: 19132 }, screen: { width:1280, height:21000 }});
		const page = await context.newPage();
		await page.goto('http://localhost:5173/', { waitUntil: "load" });

		await page.getByRole('link', { name: 'Basic' }).click();

		await expect(page.getByRole('heading', { name: 'Basic Usage' })).toBeVisible();
		await expect(page.locator('div.error')).not.toBeVisible();
		await expect(page.locator('div#my-pdf')).toBeVisible();
		await expect(page.locator('div#my-pdf-page-1')).toBeVisible();
		await delay(1000);
		await page.screenshot({ path: `${outputDir}/demo1.png`, fullPage: false, clip: { x:0,y:0,width:1280,height:21000 } });
	})
	test.skip('without viewport', async ({ page }, { outputDir }) => {
		await page.goto('http://localhost:5173/', { waitUntil: "load" });

		await page.getByRole('link', { name: 'Basic' }).click();

		await expect(page.getByRole('heading', { name: 'Basic Usage' })).toBeVisible();
		await expect(page.locator('div.error')).not.toBeVisible();
		await expect(page.locator('div#my-pdf')).toBeVisible();
		await expect(page.locator('div#my-pdf-page-1')).toBeVisible();
		await delay(1000);
		await page.screenshot({ path: `${outputDir}/demo1.png`, fullPage: true });
	})
})