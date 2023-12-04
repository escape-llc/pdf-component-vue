// @ts-check
import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';
import { delay } from "./util";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const inputFile = path.join(__dirname, '../public/tracemonkey.pdf');

test.describe.configure({mode:"serial"});
test.describe("Demo4", () => {
	test('page', async ({ page }, { outputDir }) => {
		await page.goto('http://localhost:5173/', { waitUntil: "load" });
		await page.getByRole('link', { name: 'Faux Viewer' }).click();
	
		await expect(page.getByRole('heading', { name: 'Faux Viewer' })).toBeVisible();
		await page.screenshot({ path: `${outputDir}/demo4-01-start.png`, fullPage: true });
		await page.click('input[type="file"]');
		await page.locator('input[type="file"]').setInputFiles(inputFile);
		await expect(page.locator("div#demo4-complete-loaded")).toBeAttached({ timeout: 30000 });
		await expect(page.locator('div.error')).not.toBeVisible();
		await page.screenshot({ path: `${outputDir}/demo4-02-loaded.png`, fullPage: true });
		await page.locator('#demo4-goto-page').click();
		await expect(page.locator("div#demo4-complete-gotopage")).toBeAttached({ timeout: 30000 });
		await delay(1000);
		await page.screenshot({ path: `${outputDir}/demo4-03-page14.png`, fullPage: true });
	})
})