// @ts-check
import { test, expect } from '@playwright/test';

test.describe.configure({mode:"serial"});
test.describe("Home", () => {
	test('Title', async ({ page }) => {
		await page.goto('http://localhost:5173/', { waitUntil: "load" });
		await expect(page).toHaveTitle(/PDF Component for VueJS/);
	})
	test('Content', async ({ page }, { outputDir }) => {
		await page.goto('http://localhost:5173/');
		// we land on the home page so no link to check
		// Check the headings
		await expect(page.getByRole('heading', { name: 'Documentation' })).toBeVisible();
		await expect(page.getByRole('heading', { name: 'Tooling' })).toBeVisible();
		await expect(page.getByRole('heading', { name: 'PDFJS' })).toBeVisible();
		await expect(page.getByRole('heading', { name: 'Demo' })).toBeVisible();
		await expect(page.getByRole('heading', { name: 'Support Us!' })).toBeVisible();
		await page.screenshot({ path: `${outputDir}/home.png`, fullPage: true });
	})
})