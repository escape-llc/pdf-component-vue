// @ts-check
import { test, expect } from '@playwright/test';
import { delay } from "./util.js";

test.describe.configure({mode:"serial"});
test.describe("Demo1", () => {
	const viewport = { width: 1280, height: 19132 };
	const screen = { width:1280, height:21000 };
	const clip = { x: 0, y: 0, width: screen.width, height: screen.height };
	test("with viewport", async ({ browser }, { outputDir }) => {
		const context = await browser.newContext({ viewport, screen, deviceScaleFactor: 1 });
		const page = await context.newPage();
		await page.setViewportSize(viewport);
		await page.goto('http://localhost:5173/', { waitUntil: "load" });

		await page.getByRole('link', { name: 'Basic' }).click();

		await expect(page.getByRole('heading', { name: 'Basic Usage' })).toBeVisible();
		await expect(page.locator('div.error')).not.toBeVisible();
		await expect(page.locator('div#my-pdf')).toBeVisible();
		await expect(page.locator('div.render-complete')).toBeAttached();
		await page.screenshot({ path: `${outputDir}/demo1.png`, fullPage: false, clip });
	})
	test.skip('without viewport', async ({ page }, { outputDir }) => {
		await page.goto('http://localhost:5173/', { waitUntil: "load" });

		await page.getByRole('link', { name: 'Basic' }).click();

		await expect(page.getByRole('heading', { name: 'Basic Usage' })).toBeVisible();
		await expect(page.locator('div.error')).not.toBeVisible();
		await expect(page.locator('div#my-pdf')).toBeVisible();
		await expect(page.locator('div#my-pdf-page-1')).toBeVisible();
		await expect(page.locator('div.render-complete')).toBeAttached();
		await page.screenshot({ path: `${outputDir}/demo1.png`, fullPage: false });
	})
})